-- Amtliche Beschlüsse: getrennte Quellenlage, redaktionelle Erläuterung und freiwillige Hinweise.
create table if not exists public.ff_official_decisions (
 id uuid primary key default gen_random_uuid(),
 source_key text not null unique check(length(source_key) between 4 and 500),
 level text not null check(level in ('bund','brandenburg','landkreis')),
 decision_status text not null check(decision_status in ('kabinett','parlament','verkuendet','inkraft','unklar')),
 title text not null check(length(title) between 8 and 300),
 source_name text not null check(length(source_name) between 3 and 120),
 source_url text not null check(length(source_url) between 20 and 1000 and source_url ~ '^https://'),
 published_at timestamptz not null,
 official_excerpt text,
 simple_summary text,
 family_impact text,
 next_step text,
 editorial_reviewed boolean not null default false,
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ff_official_decisions_recent on public.ff_official_decisions(published_at desc) where published;
alter table public.ff_official_decisions enable row level security;
revoke all on public.ff_official_decisions from public,anon,authenticated;
grant select on public.ff_official_decisions to authenticated;
grant all on public.ff_official_decisions to service_role;
drop policy if exists ff_decisions_public_read on public.ff_official_decisions;
create policy ff_decisions_public_read on public.ff_official_decisions
 for select to authenticated using (published=true);

create table if not exists public.ff_decision_subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.ff_decision_subscriptions enable row level security;
revoke all on public.ff_decision_subscriptions from public,anon,authenticated;
grant select,insert,update,delete on public.ff_decision_subscriptions to authenticated;
grant all on public.ff_decision_subscriptions to service_role;
drop policy if exists ff_decision_subscriptions_owner on public.ff_decision_subscriptions;
create policy ff_decision_subscriptions_owner on public.ff_decision_subscriptions
 for all to authenticated using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);

-- Existing inbox schema: allow an authorized, source-linked decision, without inventing a fake actor.
alter table public.ff_notifications add column if not exists decision_id uuid
 references public.ff_official_decisions(id) on delete cascade;
alter table public.ff_notifications drop constraint if exists ff_notifications_kind_check;
alter table public.ff_notifications add constraint ff_notifications_kind_check
 check(kind in ('match','request','message','market','search','price','decision'));
alter table public.ff_notifications drop constraint if exists ff_notification_market_shape;
alter table public.ff_notifications add constraint ff_notification_market_shape check (
 ((kind='market') and actor_id is null and contact_id is null and message_id is null
   and listing_id is not null and listing_status in ('approved','rejected') and decision_id is null)
 or ((kind in ('search','price')) and actor_id is null and contact_id is null and message_id is null
   and listing_id is not null and listing_status='approved' and decision_id is null)
 or ((kind='decision') and actor_id is null and contact_id is null and message_id is null
   and listing_id is null and listing_status is null and decision_id is not null)
 or ((kind in ('match','request','message')) and actor_id is not null
   and listing_id is null and listing_status is null and decision_id is null)
);
create unique index if not exists ff_notification_decision_unique
 on public.ff_notifications(user_id,decision_id) where kind='decision';

-- Automatic in-app notice only for explicit subscribers and verified published source cards.
-- Existing push pipeline remains untouched; it is not yet enabled for decision notifications.
create or replace function private.ff_decision_publish_notice()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.published and (tg_op='INSERT' or not old.published) then
  insert into public.ff_notifications(user_id,kind,decision_id)
  select s.user_id,'decision',new.id from public.ff_decision_subscriptions s
  where s.enabled=true
  on conflict do nothing;
 end if;
 return new;
end $$;
drop trigger if exists ff_decision_new_publication on public.ff_official_decisions;
create trigger ff_decision_new_publication after insert or update of published
 on public.ff_official_decisions for each row execute function private.ff_decision_publish_notice();

create or replace function public.ff_inbox_page_by_kind(
 p_kind text, p_before timestamptz default null, p_before_id uuid default null)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object(
  'unread',coalesce(c.unread,0),'total',coalesce(c.total,0),
  'price_unread',coalesce(c.price_unread,0),
  'decision_unread',coalesce(c.decision_unread,0),
  'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc)
    from (select id,kind,contact_id,listing_id,listing_status,decision_id,created_at,read_at,old_price_cents,new_price_cents
      from public.ff_notifications n
      where n.user_id=(select auth.uid())
        and (p_kind='all' or n.kind=p_kind)
        and (p_before is null or (n.created_at,n.id)<(p_before,p_before_id))
      order by n.created_at desc,n.id desc limit 40) x),'[]'::jsonb),
  'as_of',statement_timestamp())
 from (select count(*) as total,count(*) filter(where read_at is null) as unread,
   count(*) filter(where kind='price' and read_at is null) as price_unread,
   count(*) filter(where kind='decision' and read_at is null) as decision_unread
 from public.ff_notifications where user_id=(select auth.uid())) c
 where p_kind in ('all','price','decision') and auth.uid() is not null
$$;
revoke all on function public.ff_inbox_page_by_kind(text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ff_inbox_page_by_kind(text,timestamptz,uuid) to authenticated;
