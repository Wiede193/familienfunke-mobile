-- Familienfunke: applied production migration ff_guard_contact_acceptance_after_block.
-- Keep existing conversations readable; block acceptance/replay; allow decline/cancellation.
BEGIN;
CREATE OR REPLACE FUNCTION ff_contact_internal.create_request(p_recipient_id uuid)
 RETURNS contact_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor uuid := auth.uid();
  existing public.contact_requests;
begin
  if actor is null then
    raise exception 'FF_AUTH_REQUIRED' using errcode='28000';
  end if;
  if p_recipient_id is null or p_recipient_id=actor then
    raise exception 'FF_CONTACT_INVALID_TARGET' using errcode='22023';
  end if;

  -- Do not return an existing request to bypass a block or suspended account.
  if not private.is_active_adult(actor)
     or not private.is_active_adult(p_recipient_id)
     or not private.not_blocked(actor,p_recipient_id) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;

  -- A repeated request for the same unordered pair must never produce
  -- another notification or try to re-open an already finalised request.
  select c.* into existing
    from public.contact_requests c
   where least(c.sender_id,c.recipient_id)=least(actor,p_recipient_id)
     and greatest(c.sender_id,c.recipient_id)=greatest(actor,p_recipient_id)
   limit 1;
  if found then
    if existing.status in ('pending','accepted') then return existing; end if;
    raise exception 'FF_CONTACT_ALREADY_CLOSED' using errcode='P0001';
  end if;

  -- Match or strengthen the prior RLS insert requirements without using the
  -- broad authenticated table write grants previously revoked for safety.
  if not private.is_active_adult(actor)
     or not private.is_active_adult(p_recipient_id)
     or not private.not_blocked(actor,p_recipient_id) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.profiles p
     where p.user_id=p_recipient_id and p.is_discoverable
  ) then
    raise exception 'FF_CONTACT_NOT_DISCOVERABLE' using errcode='42501';
  end if;

  insert into public.contact_requests (sender_id,recipient_id,status)
    values (actor,p_recipient_id,'pending')
    on conflict do nothing
    returning * into existing;

  -- If another device inserted the same pair concurrently, return its
  -- authoritatively stored row.  Nothing is inserted twice.
  if existing.id is null then
    select c.* into existing
      from public.contact_requests c
     where least(c.sender_id,c.recipient_id)=least(actor,p_recipient_id)
       and greatest(c.sender_id,c.recipient_id)=greatest(actor,p_recipient_id)
     limit 1;
  end if;
  if existing.id is null then
    raise exception 'FF_CONTACT_CONFLICT' using errcode='P0001';
  end if;
  if existing.status not in ('pending','accepted') then
    raise exception 'FF_CONTACT_ALREADY_CLOSED' using errcode='P0001';
  end if;
  return existing;
end;
$function$;

CREATE OR REPLACE FUNCTION ff_contact_internal.respond_request(p_contact_id uuid, p_status text)
 RETURNS contact_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor uuid := auth.uid();
  current_contact public.contact_requests;
  updated public.contact_requests;
begin
  if actor is null then
    raise exception 'FF_AUTH_REQUIRED' using errcode='28000';
  end if;
  if p_contact_id is null or p_status not in ('accepted','declined','cancelled') then
    raise exception 'FF_CONTACT_BAD_STATUS' using errcode='22023';
  end if;
  select c.* into current_contact
    from public.contact_requests c
   where c.id=p_contact_id
     and actor in (c.sender_id,c.recipient_id);
  if not found then
    raise exception 'FF_CONTACT_NOT_FOUND' using errcode='42501';
  end if;

  -- Decline and cancellation remain available; acceptance requires both eligible parties.
  if p_status='accepted' and (not private.is_active_adult(current_contact.sender_id)
     or not private.is_active_adult(current_contact.recipient_id)
     or not private.not_blocked(current_contact.sender_id,current_contact.recipient_id)) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;

  if current_contact.status=p_status then return current_contact; end if;
  if current_contact.status<>'pending' then
    raise exception 'FF_CONTACT_ALREADY_CHANGED' using errcode='P0001';
  end if;
  if not private.is_active_adult(actor) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;

  -- Receiver may accept/reject; sender may cancel, or use the existing
  -- mutual-swipe exception guarded again by contact_status_guard().
  if not (
    (actor=current_contact.recipient_id and p_status in ('accepted','declined'))
    or (actor=current_contact.sender_id and p_status in ('cancelled','accepted'))
  ) then
    raise exception 'FF_CONTACT_STATUS_FORBIDDEN' using errcode='42501';
  end if;

  update public.contact_requests c
     set status=p_status
   where c.id=p_contact_id and c.status='pending'
   returning * into updated;

  if updated.id is not null then return updated; end if;

  -- Competing client already applied the same transition.
  select c.* into updated
    from public.contact_requests c
   where c.id=p_contact_id and actor in (c.sender_id,c.recipient_id);
  if updated.id is not null and updated.status=p_status then return updated; end if;
  raise exception 'FF_CONTACT_ALREADY_CHANGED' using errcode='P0001';
end;
$function$;

CREATE OR REPLACE FUNCTION private.contact_status_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF old.status <> 'pending'
    OR new.sender_id IS DISTINCT FROM old.sender_id
    OR new.recipient_id IS DISTINCT FROM old.recipient_id THEN
    RAISE EXCEPTION 'Diese Anfrage kann nicht erneut geändert werden.';
  END IF;
  IF new.status='accepted' AND (NOT private.is_active_adult(old.sender_id)
     OR NOT private.is_active_adult(old.recipient_id)
     OR NOT private.not_blocked(old.sender_id,old.recipient_id)) THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_ALLOWED' USING ERRCODE='42501';
  END IF;
  IF (SELECT auth.uid())=old.recipient_id AND new.status IN ('accepted','declined') THEN
    new.responded_at:=now();
  ELSIF (SELECT auth.uid())=old.sender_id AND new.status='cancelled' THEN
    new.responded_at:=now();
  ELSIF (SELECT auth.uid())=old.sender_id AND new.status='accepted'
    AND EXISTS(SELECT 1 FROM private.ff_swipe_likes l
               WHERE l.actor_id=old.sender_id AND l.target_id=old.recipient_id)
    AND EXISTS(SELECT 1 FROM private.ff_swipe_likes l
               WHERE l.actor_id=old.recipient_id AND l.target_id=old.sender_id)
    AND private.is_active_adult(old.sender_id)
    AND private.is_active_adult(old.recipient_id)
    AND private.not_blocked(old.sender_id,old.recipient_id) THEN
    new.responded_at:=now();
  ELSE
    RAISE EXCEPTION 'Nicht erlaubte Statusänderung.';
  END IF;
  RETURN new;
END
$function$;
COMMIT;
