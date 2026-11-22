-- Phase 3. Bounded event lists, own RSVP status and organizer pending queues.
-- All endpoints preserve existing events/event_requests RLS (SECURITY INVOKER).
create or replace function public.ff_events_page(
  p_before_at timestamptz default null, p_before_id uuid default null, p_limit integer default 20
) returns setof public.events
language sql stable security invoker set search_path = '' as $$
 select e.*
 from public.events e
 where (select auth.uid()) is not null and e.ends_at > now()
 and (p_before_at is null or
     (p_before_id is not null and (e.starts_at,e.id) > (p_before_at,p_before_id)))
 order by e.starts_at asc,e.id asc
 limit least(greatest(coalesce(p_limit,20),1),20)
$$;

create or replace function public.ff_my_event_requests(p_event_ids uuid[])
returns setof public.event_requests
language sql stable security invoker set search_path = '' as $$
 select r.*
 from public.event_requests r
 where (select auth.uid()) is not null
   and coalesce(cardinality(p_event_ids),0) between 1 and 20
   and r.requester_id = (select auth.uid())
   and r.event_id = any(p_event_ids)
 order by r.created_at desc,r.event_id
 limit 20
$$;

create or replace function public.ff_event_pending_page(
 p_event_id uuid,p_before_at timestamptz default null,
 p_before_id uuid default null,p_limit integer default 20
) returns setof public.event_requests
language sql stable security invoker set search_path = '' as $$
 select r.*
 from public.event_requests r
 where (select auth.uid()) is not null
   and p_event_id is not null and r.event_id=p_event_id and r.status='requested'
   and exists(select 1 from public.events e where e.id=r.event_id and e.organizer_id=(select auth.uid()))
   and (p_before_at is null or
       (p_before_id is not null and (r.created_at,r.requester_id)<(p_before_at,p_before_id)))
 order by r.created_at desc,r.requester_id desc
 limit least(greatest(coalesce(p_limit,20),1),20)
$$;

create or replace function public.ff_profile_photos_page(
 p_owner_id uuid,p_before_at timestamptz default null,
 p_before_id uuid default null,p_limit integer default 20
) returns setof public.profile_photos
language sql stable security invoker set search_path = '' as $$
 select p.*
 from public.profile_photos p
 where (select auth.uid()) is not null and p_owner_id is not null
   and p.owner_id=p_owner_id
   and (p_before_at is null or
        (p_before_id is not null and (p.created_at,p.id)<(p_before_at,p_before_id)))
 order by p.created_at desc,p.id desc
 limit least(greatest(coalesce(p_limit,20),1),20)
$$;

revoke all on function public.ff_events_page(timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_my_event_requests(uuid[]) from public,anon,authenticated;
revoke all on function public.ff_event_pending_page(uuid,timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_profile_photos_page(uuid,timestamptz,uuid,integer) from public,anon,authenticated;
grant execute on function public.ff_events_page(timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_my_event_requests(uuid[]) to authenticated;
grant execute on function public.ff_event_pending_page(uuid,timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_profile_photos_page(uuid,timestamptz,uuid,integer) to authenticated;

-- Support short ordered reads; retain existing indexes for other access patterns.
create index if not exists ff_events_open_page
 on public.events(starts_at asc,id asc) where moderation_status='approved';
create index if not exists ff_event_pending_page_idx
 on public.event_requests(event_id,created_at desc,requester_id desc) where status='requested';
create index if not exists ff_profile_photos_owner_recent
 on public.profile_photos(owner_id,created_at desc,id desc);
