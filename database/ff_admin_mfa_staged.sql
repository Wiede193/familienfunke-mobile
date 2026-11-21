-- Staged MFA: no password-only lockout before successful TOTP verification.
create table if not exists private.ff_admin_mfa_required(
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled_at timestamptz not null default now()
);
alter table private.ff_admin_mfa_required enable row level security;
revoke all on private.ff_admin_mfa_required from public,anon,authenticated,service_role;
create or replace function private.ff_admin_mfa_ok()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
  not exists(select 1 from private.ff_admin_mfa_required r where r.user_id=auth.uid())
  or (coalesce(auth.jwt()->>'aal','')='aal2' and exists(
   select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified' and f.factor_type='totp'
  ))
 )
$$;
revoke all on function private.ff_admin_mfa_ok() from public,anon,authenticated;
-- Only these RPCs expose setup status for the currently authenticated staff member.
create or replace function public.ff_admin_mfa_status()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from private.admin_staff s where s.user_id=auth.uid()
  and s.is_active and s.role in ('owner','moderator')) then
  raise exception 'Keine Admin-Berechtigung' using errcode='42501';
 end if;
 return jsonb_build_object('required',exists(select 1 from private.ff_admin_mfa_required r where r.user_id=auth.uid()),
  'aal2',coalesce(auth.jwt()->>'aal','')='aal2');
end $$;
create or replace function public.ff_admin_activate_mfa()
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from private.admin_staff s where s.user_id=auth.uid()
  and s.is_active and s.role in ('owner','moderator'))
  or coalesce(auth.jwt()->>'aal','')<>'aal2'
  or not exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified' and f.factor_type='totp')
 then raise exception 'Bestätigter zweiter Faktor erforderlich' using errcode='42501'; end if;
 insert into private.ff_admin_mfa_required(user_id) values(auth.uid()) on conflict do nothing;
 return true;
end $$;
revoke all on function public.ff_admin_mfa_status(),public.ff_admin_activate_mfa() from public,anon,authenticated;
grant execute on function public.ff_admin_mfa_status(),public.ff_admin_activate_mfa() to authenticated;

-- Existing staff checks stay in place. Add the AAL check to every privileged route.
CREATE OR REPLACE FUNCTION private.ff_market_review_is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select private.ff_admin_mfa_ok() and exists(select 1 from private.admin_staff s
    where s.user_id=(select auth.uid()) and s.is_active=true
      and s.role in ('owner','moderator'));
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_account_action(p_user_id uuid, p_action text, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_old_status text;
  v_next_status text;
  v_last_action text;
  v_trial_ends_at timestamptz;
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich' USING ERRCODE = '42501';
  END IF;

  SELECT s.role INTO v_role
  FROM private.admin_staff AS s
  WHERE s.user_id = v_actor AND s.is_active IS TRUE;
  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Nur der Hauptadministrator darf Konten sperren oder entsperren'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_user_id = v_actor THEN
    RAISE EXCEPTION 'Ungueltiges Zielkonto (keine Selbstsperre)'
      USING ERRCODE = '22023';
  END IF;

  -- Alle registrierten Betreiberkonten bleiben vor diesem Workflow geschuetzt.
  IF EXISTS (SELECT 1 FROM private.admin_staff WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Teamkonten koennen hier nicht gesperrt werden'
      USING ERRCODE = '22023';
  END IF;

  IF p_action IS NULL OR p_action NOT IN ('suspend', 'restore') THEN
    RAISE EXCEPTION 'Ungueltige Aktion' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_reason) NOT BETWEEN 10 AND 500 THEN
    RAISE EXCEPTION 'Bitte Grund mit 10 bis 500 Zeichen eingeben'
      USING ERRCODE = '22023';
  END IF;

  SELECT m.status, m.trial_ends_at
  INTO v_old_status, v_trial_ends_at
  FROM public.memberships AS m
  WHERE m.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fuer dieses Konto fehlt der Mitgliedschaftseintrag'
      USING ERRCODE = '22023';
  END IF;

  IF p_action = 'suspend' THEN
    IF v_old_status = 'suspended' THEN
      RAISE EXCEPTION 'Das Konto ist bereits gesperrt'
        USING ERRCODE = '22023';
    END IF;
    v_next_status := 'suspended';
  ELSE
    IF v_old_status <> 'suspended' THEN
      RAISE EXCEPTION 'Das Konto ist nicht gesperrt'
        USING ERRCODE = '22023';
    END IF;

    -- Nur Sperren aufheben, die durch diese Funktion protokolliert wurden.
    SELECT a.action, a.previous_status
    INTO v_last_action, v_next_status
    FROM private.familienfunke_account_suspension_log AS a
    WHERE a.subject_user_id = p_user_id
    ORDER BY a.id DESC LIMIT 1;
    IF v_last_action IS DISTINCT FROM 'suspend'
       OR v_next_status NOT IN ('beta', 'trial', 'active', 'expired') THEN
      RAISE EXCEPTION 'Vorheriger Status nicht sicher bestimmbar; manuelle Pruefung noetig'
        USING ERRCODE = '22023';
    END IF;
    -- Eine bereits abgelaufene Testphase nicht unbeabsichtigt verlaengern.
    IF v_next_status = 'trial' AND v_trial_ends_at IS NOT NULL
       AND v_trial_ends_at <= now() THEN
      v_next_status := 'expired';
    END IF;
  END IF;

  UPDATE public.memberships
  SET status = v_next_status
  WHERE user_id = p_user_id AND status = v_old_status;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Statuswechsel fehlgeschlagen' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO private.familienfunke_account_suspension_log (
    subject_user_id, actor_user_id, action,
    previous_status, new_status, reason
  ) VALUES (
    p_user_id, v_actor, p_action, v_old_status, v_next_status, v_reason
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'status', v_next_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_accounts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich' USING ERRCODE = '42501';
  END IF;
  SELECT s.role INTO v_role FROM private.admin_staff AS s
    WHERE s.user_id = v_actor AND s.is_active IS TRUE;
  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Keine Berechtigung fuer die Kontenuebersicht'
      USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(t) ORDER BY t.display_name, t.user_id)
    FROM (
      SELECT m.user_id,
             COALESCE(p.display_name, 'Familienkonto') AS display_name,
             m.status AS membership_status,
             m.trial_ends_at,
             COALESCE(v.status, 'unverified') AS verification_status
      FROM public.memberships AS m
      LEFT JOIN public.profiles AS p ON p.user_id = m.user_id
      LEFT JOIN public.verifications AS v ON v.user_id = m.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM private.admin_staff AS staff
        WHERE staff.user_id = m.user_id
      )
      ORDER BY COALESCE(p.display_name, 'Familienkonto'), m.user_id
      LIMIT 150
    ) AS t
  ), '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_approve_photo(p_photo_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid;
  v_previous_status text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  v_actor := auth.uid();
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1
    FROM private.admin_staff s
    WHERE s.user_id = v_actor
      AND s.is_active IS TRUE
      AND s.role IN ('owner', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Keine Admin-Berechtigung' USING ERRCODE = '42501';
  END IF;

  -- Schreibsperre: kein paralleles Ueberschreiben derselben Fotoentscheidung.
  SELECT p.moderation_status
    INTO v_previous_status
    FROM public.profile_photos p
    WHERE p.id = p_photo_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto nicht gefunden' USING ERRCODE = 'P0002';
  END IF;

  IF v_previous_status IS NULL OR
     v_previous_status NOT IN ('pending', 'review_required') THEN
    RAISE EXCEPTION 'Foto kann in diesem Status nicht freigegeben werden'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profile_photos
  SET moderation_status = 'approved'
  WHERE id = p_photo_id;

  -- Wird das Protokollieren nicht moeglich, wird auch die Freigabe zurueckgerollt.
  INSERT INTO private.admin_photo_decisions
    (photo_id, actor_user_id, previous_status, new_status)
  VALUES
    (p_photo_id, v_actor, v_previous_status, 'approved');

  RETURN pg_catalog.jsonb_build_object('status', 'approved', 'photo_id', p_photo_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_can_preview_photo(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT private.ff_admin_mfa_ok() AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM private.admin_staff AS s
      WHERE s.user_id = auth.uid()
        AND s.is_active IS TRUE
        AND s.role IN ('owner', 'moderator')
    )
    AND EXISTS (
      SELECT 1
      FROM public.profile_photos AS p
      WHERE p.storage_path = p_path
    );
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_market_decide(p_listing_id uuid, p_decision text, p_reason text, p_review_version bigint, p_confirmed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare l public.ff_market_listings%rowtype;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
 if not private.ff_market_review_is_staff() then
   raise exception 'Keine Admin-Berechtigung' using errcode='42501'; end if;
 if p_decision not in ('approved','rejected') or coalesce(p_confirmed,false)<>true
   or length(btrim(coalesce(p_reason,''))) not between 12 and 500
   then raise exception 'Ungültige Moderationsentscheidung' using errcode='22023'; end if;
 select * into l from public.ff_market_listings
 where id=p_listing_id for update;
 if not found or l.moderation_status<>'pending'
   or l.review_version is distinct from p_review_version
   or not exists (select 1 from public.ff_market_review_jobs j
     where j.listing_id=l.id and j.state='manual'
       and j.review_version=l.review_version)
 then raise exception 'Prüffall geändert oder abgeschlossen' using errcode='22023'; end if;
 if p_decision='approved' then
   if not private.is_active_adult(l.seller_id)
     or (l.organization_id is not null and not exists (
       select 1 from public.ff_organizations o where o.id=l.organization_id
       and o.status='approved' and o.owner_id=l.seller_id
     )) then
       raise exception 'Verkäufer ist nicht mehr berechtigt' using errcode='42501';
   end if;
 end if;
 insert into private.ff_market_manual_decisions(
   listing_id,reviewed_by,decision,review_version,note
 ) values (l.id,auth.uid(),p_decision,l.review_version,btrim(p_reason));
 update public.ff_market_listings set moderation_status=p_decision
 where id=l.id and moderation_status='pending' and review_version=l.review_version;
 if not found then raise exception 'Statuswechsel fehlgeschlagen' using errcode='22023'; end if;
 return jsonb_build_object('id',l.id,'status',p_decision);
end $function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_market_photo_paths(p_listing_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare paths text[];
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
 if not private.ff_market_review_is_staff() then
   raise exception 'Keine Admin-Berechtigung' using errcode='42501'; end if;
 if not exists (
   select 1 from public.ff_market_review_jobs j
   join public.ff_market_listings l on l.id=j.listing_id
   where l.id=p_listing_id and j.state='manual' and l.moderation_status='pending'
 ) then
   raise exception 'Nicht im Prüffall' using errcode='42501'; end if;
 select coalesce(array_agg(a.photo_path order by a.slot),'{}'::text[]) into paths
 from (
   select 1 as slot,l.photo_path from public.ff_market_listings l
    where l.id=p_listing_id and l.photo_path is not null
   union all
   select (p.slot+1)::integer,p.photo_path from public.ff_market_photos p
    where p.listing_id=p_listing_id
 ) a;
 return paths;
end $function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_market_reviews()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare role_name text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  select s.role into role_name from private.admin_staff s
    where s.user_id=auth.uid() and s.is_active=true;
  if role_name not in ('owner','moderator') or role_name is null then
    raise exception 'Keine Admin-Berechtigung' using errcode='42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.updated_at desc)
    from (
      select j.listing_id,j.state,j.reason,j.attempts,j.created_at,j.updated_at,
        j.due_at,l.title,l.description,l.category,l.review_version,l.region_label,
        l.item_condition,l.price_cents,l.trade_type,l.seller_id
      from public.ff_market_review_jobs j
      join public.ff_market_listings l on l.id=j.listing_id
      where l.moderation_status='pending' and j.state in ('retry','manual')
      order by (j.state='manual') desc,j.updated_at desc
      limit 60
    ) t
  ),'[]'::jsonb);
end $function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_admin_role text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich'
      USING ERRCODE = '42501';
  END IF;

  SELECT s.role INTO v_admin_role
  FROM private.admin_staff AS s
  WHERE s.user_id = auth.uid()
    AND s.is_active IS TRUE;

  IF v_admin_role IS NULL
     OR v_admin_role NOT IN ('owner', 'moderator') THEN
    RAISE EXCEPTION 'Keine Admin-Berechtigung'
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'role', v_admin_role,

    'reports', COALESCE((
      SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC)
      FROM (
        SELECT id, reporter_id, subject_type, subject_id,
               details, review_status, created_at
        FROM public.reports
        ORDER BY created_at DESC
        LIMIT 50
      ) AS r
    ), '[]'::jsonb),

    'photos', COALESCE((
      SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC)
      FROM (
        SELECT id, owner_id, caption,
               moderation_status, created_at
        FROM public.profile_photos
        ORDER BY created_at DESC
        LIMIT 50
      ) AS p
    ), '[]'::jsonb),

    'verifications', COALESCE((
      SELECT jsonb_agg(to_jsonb(v)
             ORDER BY v.reviewed_at DESC NULLS LAST)
      FROM (
        SELECT user_id, status, reviewed_at
        FROM public.verifications
        ORDER BY reviewed_at DESC NULLS LAST
        LIMIT 50
      ) AS v
    ), '[]'::jsonb)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_photo_path(p_photo_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_path text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM private.admin_staff AS s
    WHERE s.user_id = auth.uid()
      AND s.is_active IS TRUE
      AND s.role IN ('owner', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Keine Admin-Berechtigung'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.storage_path INTO v_path
  FROM public.profile_photos AS p
  WHERE p.id = p_photo_id;

  RETURN v_path;
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_reject_photo(p_photo_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid;
  v_previous_status text;
  v_reason text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  v_actor := auth.uid();
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM private.admin_staff AS s
    WHERE s.user_id = v_actor
      AND s.is_active IS TRUE
      AND s.role IN ('owner', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Keine Admin-Berechtigung' USING ERRCODE = '42501';
  END IF;

  v_reason := pg_catalog.btrim(p_reason);
  IF v_reason IS NULL OR pg_catalog.char_length(v_reason) NOT BETWEEN 8 AND 500 THEN
    RAISE EXCEPTION 'Ablehnungsgrund muss 8 bis 500 Zeichen enthalten'
      USING ERRCODE = '22023';
  END IF;

  -- Verhindert konkurrierende Adminentscheidungen über dasselbe Foto.
  SELECT p.moderation_status INTO v_previous_status
  FROM public.profile_photos AS p
  WHERE p.id = p_photo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto nicht gefunden' USING ERRCODE = 'P0002';
  END IF;

  IF v_previous_status IS NULL OR
     v_previous_status NOT IN ('pending', 'review_required') THEN
    RAISE EXCEPTION 'Foto kann in diesem Status nicht abgelehnt werden'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profile_photos
  SET moderation_status = 'rejected'
  WHERE id = p_photo_id;

  -- Falls die Protokollierung scheitert, wird die Ablehnung zurückgerollt.
  INSERT INTO private.admin_photo_decisions
    (photo_id, actor_user_id, previous_status, new_status, reason)
  VALUES
    (p_photo_id, v_actor, v_previous_status, 'rejected', v_reason);

  RETURN pg_catalog.jsonb_build_object(
    'status', 'rejected', 'photo_id', p_photo_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_revoke_verification(p_user_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_old_status text;
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich' USING ERRCODE = '42501';
  END IF;

  SELECT s.role INTO v_role
  FROM private.admin_staff AS s
  WHERE s.user_id = v_actor AND s.is_active IS TRUE;

  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Nur der Hauptadministrator darf Verifizierungen entziehen'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_user_id = v_actor THEN
    RAISE EXCEPTION 'Ungueltiges Zielkonto (keine Selbstentziehung)'
      USING ERRCODE = '22023';
  END IF;

  -- Admin- und Teamkonten nicht versehentlich ueber diesen Beta-Dialog aendern.
  IF EXISTS (
    SELECT 1 FROM private.admin_staff AS s
    WHERE s.user_id = p_user_id AND s.is_active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Ein aktives Teamkonto kann hier nicht entzogen werden'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) NOT BETWEEN 10 AND 500 THEN
    RAISE EXCEPTION 'Bitte einen Grund mit 10 bis 500 Zeichen angeben'
      USING ERRCODE = '22023';
  END IF;

  SELECT v.status INTO v_old_status
  FROM public.verifications AS v
  WHERE v.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_old_status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Nur aktuell verifizierte Konten koennen zurueckgesetzt werden'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.verifications
  SET status = 'unverified', reviewed_at = now()
  WHERE user_id = p_user_id AND status = 'verified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verifizierung konnte nicht geaendert werden'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO private.familienfunke_verification_revocations (
    subject_user_id, reviewer_user_id, old_status, new_status, reason
  ) VALUES (
    p_user_id, v_actor, 'verified', 'unverified', v_reason
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'status', 'unverified');
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_update_report(p_report_id uuid, p_next_status text, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_admin_role text;
  v_previous_status text;
  v_note text := btrim(coalesce(p_note, ''));
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich' USING ERRCODE = '42501';
  END IF;

  SELECT s.role INTO v_admin_role
  FROM private.admin_staff AS s
  WHERE s.user_id = auth.uid()
    AND s.is_active IS TRUE;

  IF v_admin_role IS NULL OR v_admin_role NOT IN ('owner', 'moderator') THEN
    RAISE EXCEPTION 'Keine Admin-Berechtigung' USING ERRCODE = '42501';
  END IF;

  IF p_report_id IS NULL OR p_next_status IS NULL
     OR p_next_status NOT IN ('reviewing', 'closed') THEN
    RAISE EXCEPTION 'Ungueltige Statusaenderung' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'Begruendung darf maximal 500 Zeichen haben' USING ERRCODE = '22023';
  END IF;

  IF p_next_status = 'closed' AND char_length(v_note) < 8 THEN
    RAISE EXCEPTION 'Zum Abschluss bitte mindestens 8 Zeichen als Begruendung eingeben'
      USING ERRCODE = '22023';
  END IF;

  -- Sperrt die konkrete Meldung bis zum Ende der Transaktion.
  SELECT r.review_status INTO v_previous_status
  FROM public.reports AS r
  WHERE r.id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meldung nicht gefunden' USING ERRCODE = 'P0002';
  END IF;

  IF (p_next_status = 'reviewing' AND v_previous_status <> 'open')
     OR (p_next_status = 'closed' AND v_previous_status <> 'reviewing') THEN
    RAISE EXCEPTION 'Meldungsstatus hat sich bereits geaendert. Bitte aktualisieren.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.reports
     SET review_status = p_next_status
   WHERE id = p_report_id;

  INSERT INTO private.familienfunke_report_actions (
    report_id, admin_user_id, previous_status, next_status, note
  ) VALUES (
    p_report_id, auth.uid(), v_previous_status, p_next_status,
    CASE WHEN p_next_status = 'reviewing' AND v_note = ''
         THEN 'Meldung in Bearbeitung genommen'
         ELSE v_note END
  );

  RETURN jsonb_build_object('id', p_report_id, 'status', p_next_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.familienfunke_admin_verify_adult(p_user_id uuid, p_age_confirmed boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_reviewer uuid := auth.uid();
  v_role text;
  v_previous_status text;
BEGIN
  IF NOT private.ff_admin_mfa_ok() THEN
    RAISE EXCEPTION 'Zweiter Faktor erforderlich' USING ERRCODE='42501';
  END IF;
  IF v_reviewer IS NULL THEN
    RAISE EXCEPTION 'Anmeldung erforderlich' USING ERRCODE = '42501';
  END IF;

  SELECT s.role INTO v_role
  FROM private.admin_staff AS s
  WHERE s.user_id = v_reviewer AND s.is_active IS TRUE;

  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Nur die Hauptadministration darf Erwachsene verifizieren'
      USING ERRCODE = '42501';
  END IF;

  IF p_age_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Volljaehrigkeit muss persoenlich bestaetigt werden'
      USING ERRCODE = '22023';
  END IF;

  IF p_user_id IS NULL OR p_user_id = v_reviewer THEN
    RAISE EXCEPTION 'Ungueltiges Zielkonto (keine Selbstverifizierung)'
      USING ERRCODE = '22023';
  END IF;

  SELECT v.status INTO v_previous_status
  FROM public.verifications AS v
  WHERE v.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fuer dieses Konto existiert kein Verifizierungseintrag'
      USING ERRCODE = '22023';
  END IF;

  IF v_previous_status IS DISTINCT FROM 'unverified' THEN
    RAISE EXCEPTION 'Nur nicht verifizierte Konten duerfen freigegeben werden'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.verifications
  SET status = 'verified', reviewed_at = now()
  WHERE user_id = p_user_id AND status = 'unverified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Statuswechsel nicht durchgefuehrt'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO private.familienfunke_verification_audit (
    subject_user_id, reviewer_user_id, old_status, new_status, method
  ) VALUES (
    p_user_id, v_reviewer, v_previous_status, 'verified', 'personally_known_beta'
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'status', 'verified');
END;
$function$;

