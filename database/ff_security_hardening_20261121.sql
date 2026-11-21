-- Security hardening: preserve original grants and business logic.
CREATE OR REPLACE FUNCTION private.ff_guard_five_unanswered_messages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  participants record;
  last_five_by_sender integer;
  latest_at timestamptz;
BEGIN
  -- Sperre für genau diese Konversation: parallele Inserts werden serialisiert.
  -- SECURITY DEFINER ist hier erforderlich, weil die send-message-Service-Rolle
  -- keine UPDATE-/FOR-UPDATE-Rechte auf contact_requests erhält.
  SELECT c.sender_id, c.recipient_id, c.status
    INTO participants
    FROM public.contact_requests AS c
   WHERE c.id = NEW.contact_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_FOUND'
      USING ERRCODE = '23503';
  END IF;

  IF participants.status <> 'accepted'
     OR NEW.sender_id NOT IN (participants.sender_id, participants.recipient_id) THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_ACCEPTED'
      USING ERRCODE = '42501';
  END IF;

  -- Recheck eligibility when the server actually writes, not only before AI moderation.
  IF NOT private.is_active_adult(participants.sender_id)
     OR NOT private.is_active_adult(participants.recipient_id)
     OR NOT private.not_blocked(participants.sender_id, participants.recipient_id) THEN
    RAISE EXCEPTION 'FF_CONTACT_NO_LONGER_ELIGIBLE' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO last_five_by_sender
    FROM (
      SELECT m.sender_id
        FROM public.messages AS m
       WHERE m.contact_id = NEW.contact_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 5
    ) AS recent
   WHERE recent.sender_id = NEW.sender_id;

  IF last_five_by_sender >= 5 THEN
    RAISE EXCEPTION 'FF_MSG_LIMIT_5'
      USING ERRCODE = 'P0001',
            DETAIL = 'Fuenf Nachrichten hintereinander ohne Antwort.',
            HINT = 'Bitte auf die Antwort des anderen Kontakts warten.';
  END IF;

  -- Gegen clientseitig vorgegebene oder wegen paralleler Transaktionen
  -- veraltete Timestamps: jede neu akzeptierte Nachricht wird nach dem
  -- zuletzt gespeicherten Eintrag einsortiert, unabhängig von Clientwerten.
  SELECT MAX(m.created_at) INTO latest_at
    FROM public.messages AS m
   WHERE m.contact_id = NEW.contact_id;
  NEW.created_at := GREATEST(
    clock_timestamp(),
    COALESCE(latest_at + interval '1 microsecond', clock_timestamp())
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ff_market_search(p_query text DEFAULT ''::text, p_category text DEFAULT 'Alle'::text, p_trade_type text DEFAULT 'all'::text, p_min_cents integer DEFAULT NULL::integer, p_max_cents integer DEFAULT NULL::integer, p_favorites_only boolean DEFAULT false, p_sort text DEFAULT 'newest'::text, p_limit integer DEFAULT 40, p_offset integer DEFAULT 0)
 RETURNS TABLE(listing ff_market_listings, match_item text, rank real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid:=(select auth.uid());
  terms text;
  words tsquery;
begin
  if uid is null or not private.is_active_adult(uid) then return; end if;
  if p_query is null or length(p_query)>160
    or coalesce(p_category,'Alle') not in ('Alle','Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
    or coalesce(p_trade_type,'all') not in ('all','sell','gift','swap')
    or coalesce(p_sort,'newest') not in ('newest','low','high','relevance')
    or p_limit is null or p_offset is null
    or p_limit not between 1 and 60 or p_offset not between 0 and 20000
    or (p_min_cents is not null and p_min_cents<0)
    or (p_max_cents is not null and p_max_cents>10000000)
  then return; end if;
  terms:=private.ff_market_normalize_query(p_query);
  words:=case when terms='' then null else pg_catalog.plainto_tsquery('german'::regconfig,terms) end;
  return query
  select l as listing,
         case when words is null then ''::text else i.item_name end as match_item,
         i.score as rank
  from public.ff_market_listings l
  join lateral (
    select x.item_name,
      case when words is null then 0::real else pg_catalog.ts_rank(x.search_vector,words) end as score
    from private.ff_market_search_items x
    where x.listing_id=l.id
      and (p_category='Alle' or x.category=p_category)
      and (words is null or x.search_vector @@ words)
    order by score desc,x.item_no asc limit 1
  ) i on true
  where l.moderation_status='approved'
    and private.is_active_adult(l.seller_id)
    and private.not_blocked(uid,l.seller_id)
    and (p_trade_type='all' or l.trade_type=p_trade_type)
    and (p_min_cents is null or (l.trade_type='sell' and l.price_cents>=p_min_cents))
    and (p_max_cents is null or (l.trade_type='sell' and l.price_cents<=p_max_cents))
    and (not p_favorites_only or exists(
      select 1 from public.ff_market_favorites f where f.user_id=uid and f.listing_id=l.id
    ))
  order by
    case when p_sort='low' then l.price_cents end asc nulls last,
    case when p_sort='high' then l.price_cents end desc nulls last,
    case when p_sort='relevance' and words is not null then i.score end desc nulls last,
    l.created_at desc,l.id desc
  limit p_limit offset p_offset;
end;
$function$;

-- Photo metadata must be bound to the same seller as the parent listing.
alter policy ff_market_extra_read on public.ff_market_photos
using (seller_id = (select auth.uid()) or (
  private.is_active_adult((select auth.uid())) and exists (
    select 1 from public.ff_market_listings l
    where l.id = ff_market_photos.listing_id
      and l.seller_id = ff_market_photos.seller_id
      and l.moderation_status = 'approved'
      and private.is_active_adult(l.seller_id)
      and private.not_blocked((select auth.uid()), l.seller_id)
  )
));
