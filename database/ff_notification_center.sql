-- One existing inbox for social events and own listing moderation, independent of push.
alter table public.ff_notifications alter column actor_id drop not null;
alter table public.ff_notifications add column if not exists listing_id uuid references public.ff_market_listings(id) on delete cascade;
alter table public.ff_notifications add column if not exists listing_status text;
alter table public.ff_notifications drop constraint if exists ff_notifications_kind_check;
alter table public.ff_notifications add constraint ff_notifications_kind_check check(kind in ('match','request','message','market'));
alter table public.ff_notifications add constraint ff_notifications_market_shape check(
 (kind='market' and actor_id is null and contact_id is null and message_id is null and listing_id is not null and listing_status in ('approved','rejected'))
 or (kind<>'market' and actor_id is not null and listing_id is null and listing_status is null));
create index if not exists ff_notification_center_order on public.ff_notifications(user_id,created_at desc,id desc);
create index if not exists ff_notification_center_unread on public.ff_notifications(user_id,created_at desc) where read_at is null;

-- Avoid duplicate push: the separate existing market-listing trigger sends market push.
drop trigger if exists ff_push_on_inbox on public.ff_notifications;
create trigger ff_push_on_inbox after insert on public.ff_notifications
 for each row when (new.kind<>'market') execute function private.ff_queue_push();

create or replace function private.ff_notify_market_decision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.moderation_status='pending' and new.moderation_status in ('approved','rejected')
 and new.seller_id is not null and private.is_active_adult(new.seller_id) then
  insert into public.ff_notifications(user_id,kind,listing_id,listing_status)
   values(new.seller_id,'market',new.id,new.moderation_status);
 end if;
 return new;
end $$;
revoke all on function private.ff_notify_market_decision() from public,anon,authenticated,service_role;
drop trigger if exists ff_inbox_market_decision on public.ff_market_listings;
create trigger ff_inbox_market_decision after update of moderation_status on public.ff_market_listings
 for each row execute function private.ff_notify_market_decision();

-- Recheck access to the underlying object; a blocked/closed contact must not disclose history.
drop policy if exists ff_notifications_owner_select on public.ff_notifications;
create policy ff_notifications_owner_select on public.ff_notifications for select to authenticated using (
 user_id=(select auth.uid()) and private.is_active_adult((select auth.uid()))
 and ((kind='market' and exists(select 1 from public.ff_market_listings l
   where l.id=ff_notifications.listing_id and l.seller_id=(select auth.uid())))
 or (kind<>'market' and private.not_blocked(user_id,actor_id) and private.is_active_adult(actor_id)
 and exists(select 1 from public.contact_requests c where c.id=ff_notifications.contact_id
   and ff_notifications.user_id in(c.sender_id,c.recipient_id)
   and ff_notifications.actor_id in(c.sender_id,c.recipient_id)
   and ((ff_notifications.kind='request' and c.status='pending')
      or (ff_notifications.kind in ('message','match') and c.status='accepted')))))
);
-- Preserve existing owner-only read_at update; no client-generated notifications.
grant select(listing_id,listing_status) on public.ff_notifications to authenticated;
revoke insert,delete,truncate on public.ff_notifications from public,anon,authenticated;
revoke update on public.ff_notifications from public,anon,authenticated;
grant update(read_at) on public.ff_notifications to authenticated;

-- Count and page in one consistent snapshot, cursor pagination (no offset shifts).
create or replace function public.ff_inbox_page(p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('unread',(select count(*) from public.ff_notifications n
 where n.user_id=(select auth.uid()) and n.read_at is null),
 'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc)
 from (select id,kind,contact_id,listing_id,listing_status,created_at,read_at
 from public.ff_notifications n where n.user_id=(select auth.uid())
 and (p_before is null or (n.created_at,n.id)<(p_before,p_before_id))
 order by n.created_at desc,n.id desc limit 40) x),'[]'::jsonb),
 'as_of',statement_timestamp())
$$;
revoke all on function public.ff_inbox_page(timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ff_inbox_page(timestamptz,uuid) to authenticated;

create or replace function public.ff_inbox_mark_read(p_id uuid default null,p_through timestamptz default null)
returns integer language plpgsql security invoker set search_path='' as $$
declare affected int;
begin
 if auth.uid() is null or (p_id is null and p_through is null) then return 0;end if;
 update public.ff_notifications set read_at=now()
 where user_id=(select auth.uid()) and read_at is null
 and ((p_id is not null and id=p_id) or (p_id is null and created_at<=least(p_through,now())));
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.ff_inbox_mark_read(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.ff_inbox_mark_read(uuid,timestamptz) to authenticated;
