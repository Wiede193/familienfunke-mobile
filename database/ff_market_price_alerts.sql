-- Price alerts use only approved sale prices, never pending edits.
create table private.ff_market_price_baseline(
 listing_id uuid primary key references public.ff_market_listings(id) on delete cascade,
 price_cents integer
);
create table private.ff_market_price_events(
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.ff_market_listings(id) on delete cascade,
 old_price integer not null,new_price integer not null,created_at timestamptz not null default clock_timestamp(),
 cursor_user uuid,done boolean not null default false,
 check(new_price>=0 and new_price<old_price)
);
create table private.ff_market_price_watermark(
 user_id uuid not null,listing_id uuid not null,lowest_notified integer not null,
 primary key(user_id,listing_id),
 foreign key(user_id,listing_id) references public.ff_market_favorites(user_id,listing_id) on delete cascade
);
create table private.ff_market_price_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null,active_since timestamptz not null default now()
);
alter table private.ff_market_price_baseline enable row level security;
alter table private.ff_market_price_events enable row level security;
alter table private.ff_market_price_watermark enable row level security;
alter table private.ff_market_price_preferences enable row level security;
revoke all on private.ff_market_price_baseline,private.ff_market_price_events,private.ff_market_price_watermark,private.ff_market_price_preferences from public,anon,authenticated,service_role;
create index ff_price_event_due on private.ff_market_price_events(created_at,id) where not done;
create index if not exists ff_market_favorites_listing_price on public.ff_market_favorites(listing_id,user_id);
insert into private.ff_market_price_baseline(listing_id,price_cents)
 select id,case when trade_type='sell' then price_cents else null end from public.ff_market_listings where moderation_status='approved';

create or replace function public.ff_market_price_alert_status()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and coalesce((select enabled from private.ff_market_price_preferences where user_id=auth.uid()),true)
$$;
create or replace function public.ff_market_price_alert_set(p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_enabled is null or (p_enabled and not private.is_active_adult(auth.uid())) then return false;end if;
 insert into private.ff_market_price_preferences(user_id,enabled,active_since) values(auth.uid(),p_enabled,clock_timestamp())
 on conflict(user_id) do update set enabled=excluded.enabled,
 active_since=case when excluded.enabled and not private.ff_market_price_preferences.enabled then clock_timestamp() else private.ff_market_price_preferences.active_since end;
 return true;
end $$;
revoke all on function public.ff_market_price_alert_status(),public.ff_market_price_alert_set(boolean) from public,anon,authenticated;
grant execute on function public.ff_market_price_alert_status(),public.ff_market_price_alert_set(boolean) to authenticated;

alter table public.ff_notifications add column old_price_cents integer,add column new_price_cents integer;
alter table public.ff_notifications drop constraint ff_notifications_kind_check;
alter table public.ff_notifications add constraint ff_notifications_kind_check check(kind in ('match','request','message','market','search','price'));
alter table public.ff_notifications drop constraint ff_notifications_market_shape;
alter table public.ff_notifications add constraint ff_notifications_market_shape check(
 (kind='market' and actor_id is null and contact_id is null and message_id is null and listing_id is not null and listing_status in ('approved','rejected'))
 or (kind in ('search','price') and actor_id is null and contact_id is null and message_id is null and listing_id is not null and listing_status='approved')
 or (kind not in ('market','search','price') and actor_id is not null and listing_id is null and listing_status is null));
alter table public.ff_notifications add constraint ff_notification_price_shape check(
 (kind='price' and old_price_cents is not null and new_price_cents is not null and new_price_cents>=0 and old_price_cents>new_price_cents)
 or (kind<>'price' and old_price_cents is null and new_price_cents is null));
grant select(old_price_cents,new_price_cents) on public.ff_notifications to authenticated;
alter policy ff_notifications_owner_select on public.ff_notifications using (
 user_id=(select auth.uid()) and private.is_active_adult((select auth.uid()))
 and ((kind='market' and exists(select 1 from public.ff_market_listings l where l.id=ff_notifications.listing_id and l.seller_id=(select auth.uid())))
 or (kind in ('search','price') and exists(select 1 from public.ff_market_listings l where l.id=ff_notifications.listing_id
  and l.moderation_status='approved' and l.seller_id<>(select auth.uid()) and private.is_active_adult(l.seller_id) and private.not_blocked((select auth.uid()),l.seller_id)))
 or (kind not in ('market','search','price') and private.not_blocked(user_id,actor_id) and private.is_active_adult(actor_id)
 and exists(select 1 from public.contact_requests c where c.id=ff_notifications.contact_id
 and ff_notifications.user_id in(c.sender_id,c.recipient_id)
 and ff_notifications.actor_id in(c.sender_id,c.recipient_id)
 and ((ff_notifications.kind='request' and c.status='pending') or (ff_notifications.kind in ('message','match') and c.status='accepted')))))
);
create or replace function public.ff_inbox_page(p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('unread',(select count(*) from public.ff_notifications n
 where n.user_id=(select auth.uid()) and n.read_at is null),
 'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc)
 from (select id,kind,contact_id,listing_id,listing_status,created_at,read_at,old_price_cents,new_price_cents
 from public.ff_notifications n where n.user_id=(select auth.uid())
 and (p_before is null or (n.created_at,n.id)<(p_before,p_before_id))
 order by n.created_at desc,n.id desc limit 40) x),'[]'::jsonb),
 'as_of',statement_timestamp())
$$;
revoke all on function public.ff_inbox_page(timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ff_inbox_page(timestamptz,uuid) to authenticated;
drop trigger if exists ff_push_on_inbox on public.ff_notifications;
create trigger ff_push_on_inbox after insert on public.ff_notifications for each row
 when(new.kind not in ('market','search','price')) execute function private.ff_queue_push();

create or replace function private.ff_market_record_price()
returns trigger language plpgsql security definer set search_path='' as $$
declare previous integer;
begin
 if new.moderation_status<>'approved' then return new;end if;
 select price_cents into previous from private.ff_market_price_baseline where listing_id=new.id;
 if new.trade_type='sell' and previous is not null and new.price_cents<previous then
  insert into private.ff_market_price_events(listing_id,old_price,new_price) values(new.id,previous,new.price_cents);
 end if;
 insert into private.ff_market_price_baseline(listing_id,price_cents)
 values(new.id,case when new.trade_type='sell' then new.price_cents else null end)
 on conflict(listing_id) do update set price_cents=excluded.price_cents;
 return new;
end $$;
revoke all on function private.ff_market_record_price() from public,anon,authenticated,service_role;
create trigger zz_ff_market_price after insert or update of moderation_status,price_cents,trade_type on public.ff_market_listings
 for each row execute function private.ff_market_record_price();

create or replace function private.ff_market_price_tick()
returns void language plpgsql security definer set search_path='' as $$
declare ev record; recipient uuid; last_user uuid; processed int; claimed integer;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('ff_market_price_tick',0)) then return;end if;
 for ev in select * from private.ff_market_price_events where not done order by created_at,id limit 10 loop
  last_user:=null;processed:=0;
  for recipient in select f.user_id from public.ff_market_favorites f
   join public.ff_market_listings l on l.id=f.listing_id
   left join private.ff_market_price_preferences p on p.user_id=f.user_id
   left join private.ff_market_price_watermark w on w.user_id=f.user_id and w.listing_id=f.listing_id
   where f.listing_id=ev.listing_id and f.created_at<=ev.created_at
    and (ev.cursor_user is null or f.user_id>ev.cursor_user)
    and coalesce(p.enabled,true) and (p.active_since is null or p.active_since<=ev.created_at)
    and l.moderation_status='approved' and l.trade_type='sell' and l.price_cents=ev.new_price
    and f.user_id<>l.seller_id and private.is_active_adult(f.user_id) and private.is_active_adult(l.seller_id)
    and private.not_blocked(f.user_id,l.seller_id)
    and (w.lowest_notified is null or ev.new_price<w.lowest_notified)
   order by f.user_id limit 100
  loop
   -- Lock the favorite entry so removal cannot race the watermark foreign key.
   perform 1 from public.ff_market_favorites f where f.user_id=recipient and f.listing_id=ev.listing_id for key share;
   if found then
    insert into private.ff_market_price_watermark(user_id,listing_id,lowest_notified)
     values(recipient,ev.listing_id,ev.new_price)
     on conflict(user_id,listing_id) do update set lowest_notified=excluded.lowest_notified
     where excluded.lowest_notified<private.ff_market_price_watermark.lowest_notified;
    get diagnostics claimed=row_count;
    if claimed=1 then
     insert into public.ff_notifications(user_id,kind,listing_id,listing_status,old_price_cents,new_price_cents)
      values(recipient,'price',ev.listing_id,'approved',ev.old_price,ev.new_price);
    end if;
   end if;
   last_user:=recipient;processed:=processed+1;
  end loop;
  update private.ff_market_price_events set cursor_user=coalesce(last_user,ev.cursor_user),done=processed<100 where id=ev.id;
 end loop;
 delete from private.ff_market_price_events where done and created_at<now()-interval '7 days';
end $$;
revoke all on function private.ff_market_price_tick() from public,anon,authenticated,service_role;
select cron.schedule('ff_market_price_tick','* * * * *',$job$select private.ff_market_price_tick();$job$);
