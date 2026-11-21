-- Personal saved searches, using the very same normalized structured index as the live Basar.
create table private.ff_saved_market_searches(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 query text not null,category text not null,trade_type text not null,min_cents integer,max_cents integer,
 enabled boolean not null default true,created_at timestamptz not null default now(),active_since timestamptz not null default now()
);
alter table private.ff_saved_market_searches enable row level security;
revoke all on private.ff_saved_market_searches from public,anon,authenticated,service_role;
create index ff_saved_market_search_owner on private.ff_saved_market_searches(user_id);
create index ff_saved_market_search_active on private.ff_saved_market_searches(user_id,active_since) where enabled;
create or replace function public.ff_saved_market_searches_list()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(s)-'user_id'-'active_since' order by s.created_at desc),'[]'::jsonb)
 from private.ff_saved_market_searches s where s.user_id=auth.uid()
$$;
create or replace function public.ff_saved_market_search_save(p_query text,p_category text,p_trade_type text,p_min_cents integer,p_max_cents integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); existing uuid; q text; terms text;
begin
 if u is null or not private.is_active_adult(u) then raise exception 'Freigegebenes Konto erforderlich' using errcode='42501';end if;
 if p_query is null or length(p_query)>160 or p_category is null or p_category not in ('Alle','Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
 or p_trade_type is null or p_trade_type not in ('all','sell','gift','swap')
 or p_min_cents not between 0 and 10000000 or p_max_cents not between 0 and 10000000
 or p_min_cents>p_max_cents or (p_trade_type in ('gift','swap') and (p_min_cents is not null or p_max_cents is not null))
 then raise exception 'Ungültige Suchfilter' using errcode='22023';end if;
 q:=btrim(p_query);terms:=private.ff_market_normalize_query(q);
 if q<>'' and (terms='' or numnode(plainto_tsquery('german'::regconfig,terms))=0) then raise exception 'Konkreten Artikel eingeben' using errcode='22023';end if;
 if q='' and p_category='Alle' and p_trade_type='all' and p_min_cents is null and p_max_cents is null then raise exception 'Mindestens einen Suchfilter wählen' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('ff_saved_market_search:'||u::text,0));
 select s.id into existing from private.ff_saved_market_searches s where s.user_id=u
 and private.ff_market_normalize_query(s.query)=terms and s.category=p_category and s.trade_type=p_trade_type
 and s.min_cents is not distinct from p_min_cents and s.max_cents is not distinct from p_max_cents limit 1;
 if existing is not null then return existing;end if;
 if (select count(*) from private.ff_saved_market_searches s where s.user_id=u)>=10 then raise exception 'Maximal zehn Suchaufträge' using errcode='22023';end if;
 insert into private.ff_saved_market_searches(user_id,query,category,trade_type,min_cents,max_cents)
 values(u,q,p_category,p_trade_type,p_min_cents,p_max_cents) returning id into existing;
 return existing;
end $$;
create or replace function public.ff_saved_market_search_toggle(p_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_enabled is null or auth.uid() is null or (p_enabled and not private.is_active_adult(auth.uid())) then return false;end if;
 update private.ff_saved_market_searches set enabled=p_enabled,
 active_since=case when p_enabled and not enabled then now() else active_since end
 where id=p_id and user_id=auth.uid();
 return found;
end $$;
create or replace function public.ff_saved_market_search_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin delete from private.ff_saved_market_searches where id=p_id and user_id=auth.uid();return found;end $$;
revoke all on function public.ff_saved_market_searches_list(),public.ff_saved_market_search_save(text,text,text,integer,integer),public.ff_saved_market_search_toggle(uuid,boolean),public.ff_saved_market_search_delete(uuid) from public,anon,authenticated;
grant execute on function public.ff_saved_market_searches_list(),public.ff_saved_market_search_save(text,text,text,integer,integer),public.ff_saved_market_search_toggle(uuid,boolean),public.ff_saved_market_search_delete(uuid) to authenticated;

-- One first publication record per listing, no retroactive notifications or reapproval duplicates.
create table private.ff_market_publications(
 listing_id uuid primary key references public.ff_market_listings(id) on delete cascade,
 published_at timestamptz not null default now(),done boolean not null default false,cursor_user uuid
);
alter table private.ff_market_publications enable row level security;
revoke all on private.ff_market_publications from public,anon,authenticated,service_role;
insert into private.ff_market_publications(listing_id,done)
 select id,true from public.ff_market_listings where moderation_status='approved' on conflict do nothing;
create index ff_market_publications_pending on private.ff_market_publications(published_at) where not done;

alter table public.ff_notifications drop constraint ff_notifications_kind_check;
alter table public.ff_notifications add constraint ff_notifications_kind_check check(kind in ('match','request','message','market','search'));
alter table public.ff_notifications drop constraint ff_notifications_market_shape;
alter table public.ff_notifications add constraint ff_notifications_market_shape check(
 (kind='market' and actor_id is null and contact_id is null and message_id is null and listing_id is not null and listing_status in ('approved','rejected'))
 or (kind='search' and actor_id is null and contact_id is null and message_id is null and listing_id is not null and listing_status='approved')
 or (kind not in ('market','search') and actor_id is not null and listing_id is null and listing_status is null));
alter policy ff_notifications_owner_select on public.ff_notifications using (
 user_id=(select auth.uid()) and private.is_active_adult((select auth.uid()))
 and ((kind='market' and exists(select 1 from public.ff_market_listings l where l.id=ff_notifications.listing_id and l.seller_id=(select auth.uid())))
 or (kind='search' and exists(select 1 from public.ff_market_listings l where l.id=ff_notifications.listing_id
  and l.moderation_status='approved' and l.seller_id<>(select auth.uid()) and private.is_active_adult(l.seller_id) and private.not_blocked((select auth.uid()),l.seller_id)))
 or (kind not in ('market','search') and private.not_blocked(user_id,actor_id) and private.is_active_adult(actor_id)
 and exists(select 1 from public.contact_requests c where c.id=ff_notifications.contact_id
 and ff_notifications.user_id in(c.sender_id,c.recipient_id) and ff_notifications.actor_id in(c.sender_id,c.recipient_id)
 and ((ff_notifications.kind='request' and c.status='pending') or (ff_notifications.kind in ('message','match') and c.status='accepted')))))
);
-- Search alerts are in-app only initially; do not enter the old push queue.
drop trigger if exists ff_push_on_inbox on public.ff_notifications;
create trigger ff_push_on_inbox after insert on public.ff_notifications for each row
 when(new.kind not in ('market','search')) execute function private.ff_queue_push();
create or replace function private.ff_record_market_publication()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.moderation_status='approved' then
  insert into private.ff_market_publications(listing_id) values(new.id) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function private.ff_record_market_publication() from public,anon,authenticated,service_role;
create trigger zz_ff_market_publication after insert or update of moderation_status on public.ff_market_listings
 for each row execute function private.ff_record_market_publication();

create or replace function private.ff_saved_market_search_tick()
returns void language plpgsql security definer set search_path='' as $$
declare pub record; recipient uuid; last_user uuid; processed integer;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('ff_saved_market_search_tick',0)) then return;end if;
 for pub in select p.* from private.ff_market_publications p where not p.done order by p.published_at,p.listing_id limit 10 loop
  last_user:=null;processed:=0;
  -- at most 100 recipients per listing and run; checkpoint and notifications are atomic.
  for recipient in
   select distinct s.user_id
   from private.ff_saved_market_searches s
   join public.ff_market_listings l on l.id=pub.listing_id
   where s.enabled and s.created_at<=pub.published_at and s.active_since<=pub.published_at
    and (pub.cursor_user is null or s.user_id>pub.cursor_user)
    and l.moderation_status='approved' and s.user_id<>l.seller_id
    and private.is_active_adult(s.user_id) and private.is_active_adult(l.seller_id)
    and private.not_blocked(s.user_id,l.seller_id)
    and (s.trade_type='all' or l.trade_type=s.trade_type)
    and (s.min_cents is null or (l.trade_type='sell' and l.price_cents>=s.min_cents))
    and (s.max_cents is null or (l.trade_type='sell' and l.price_cents<=s.max_cents))
    and exists(select 1 from private.ff_market_search_items x where x.listing_id=l.id
     and (s.category='Alle' or x.category=s.category)
     and (s.query='' or x.search_vector @@ plainto_tsquery('german'::regconfig,private.ff_market_normalize_query(s.query))))
   order by s.user_id limit 100
  loop
   insert into public.ff_notifications(user_id,kind,listing_id,listing_status) values(recipient,'search',pub.listing_id,'approved');
   last_user:=recipient;processed:=processed+1;
  end loop;
  update private.ff_market_publications set cursor_user=coalesce(last_user,pub.cursor_user),done=processed<100 where listing_id=pub.listing_id;
 end loop;
end $$;
revoke all on function private.ff_saved_market_search_tick() from public,anon,authenticated,service_role;
select cron.schedule('ff_saved_market_search_tick','* * * * *',$job$select private.ff_saved_market_search_tick();$job$);
