-- Phase 4: bounded private marketplace and partner areas.
-- All functions are SECURITY INVOKER so existing RLS stays authoritative.

create or replace function public.ff_my_market_page(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 30
) returns setof public.ff_market_listings
language sql stable security invoker set search_path = '' as $$
  select l.* from public.ff_market_listings l
  where (select auth.uid()) is not null and l.seller_id=(select auth.uid())
    and (p_before_at is null or (p_before_id is not null
         and (l.created_at,l.id)<(p_before_at,p_before_id)))
  order by l.created_at desc,l.id desc
  limit least(greatest(coalesce(p_limit,30),1),40)
$$;

create or replace function public.ff_market_favorite_flags(p_listing_ids uuid[])
returns table(listing_id uuid)
language sql stable security invoker set search_path = '' as $$
  select f.listing_id from public.ff_market_favorites f
  where (select auth.uid()) is not null
    and coalesce(cardinality(p_listing_ids),0) between 1 and 40
    and f.user_id=(select auth.uid())
    and f.listing_id=any(p_listing_ids)
$$;

create or replace function public.ff_partner_orgs_page(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
) returns setof public.ff_organizations
language sql stable security invoker set search_path = '' as $$
  select o.* from public.ff_organizations o
  where (select auth.uid()) is not null
    and (o.status='approved' or o.owner_id=(select auth.uid()))
    and (p_before_at is null or (p_before_id is not null
         and (o.created_at,o.id)<(p_before_at,p_before_id)))
  order by o.created_at desc,o.id desc
  limit least(greatest(coalesce(p_limit,20),1),20)
$$;

create or replace function public.ff_partner_events_page(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
) returns setof public.ff_partner_events
language sql stable security invoker set search_path = '' as $$
  select e.* from public.ff_partner_events e
  where (select auth.uid()) is not null and e.starts_at>now()
    and (p_before_at is null or (p_before_id is not null
         and (e.starts_at,e.id)>(p_before_at,p_before_id)))
  order by e.starts_at asc,e.id asc
  limit least(greatest(coalesce(p_limit,20),1),20)
$$;

revoke all on function public.ff_my_market_page(timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_market_favorite_flags(uuid[]) from public,anon,authenticated;
revoke all on function public.ff_partner_orgs_page(timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_partner_events_page(timestamptz,uuid,integer) from public,anon,authenticated;
grant execute on function public.ff_my_market_page(timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_market_favorite_flags(uuid[]) to authenticated;
grant execute on function public.ff_partner_orgs_page(timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_partner_events_page(timestamptz,uuid,integer) to authenticated;

create index if not exists ff_my_market_page_idx
  on public.ff_market_listings(seller_id,created_at desc,id desc);
create index if not exists ff_partner_orgs_page_idx
  on public.ff_organizations(created_at desc,id desc)
  where status='approved';
create index if not exists ff_partner_events_page_idx
  on public.ff_partner_events(starts_at asc,id asc)
  where moderation_status='approved';
