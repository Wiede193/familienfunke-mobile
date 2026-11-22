-- Familienfunke Phase 2: strictly bounded social read pages.
-- SECURITY INVOKER preserves RLS and existing adult/visibility authorization.
-- Each page uses a stable tuple cursor; the API never returns an unbounded list.

create or replace function public.ff_discover_page(
 p_before_at timestamptz default null, p_before_id uuid default null, p_limit integer default 40
) returns setof public.profiles
language sql stable security invoker set search_path = '' as $$
 select p.*
 from public.profiles p
 where (select auth.uid()) is not null
   and p.is_discoverable = true and p.moderation_status = 'approved'
   and (p_before_at is null or
        (p_before_id is not null and
         (p.created_at < p_before_at or (p.created_at = p_before_at and p.user_id > p_before_id))))
 order by p.created_at desc, p.user_id asc
 limit least(greatest(coalesce(p_limit,40),1),50)
$$;

create or replace function public.ff_contacts_page(
 p_before_at timestamptz default null, p_before_id uuid default null, p_limit integer default 40
) returns setof public.contact_requests
language sql stable security invoker set search_path = '' as $$
 select c.*
 from public.contact_requests c
 where (select auth.uid()) is not null
   and (c.sender_id = (select auth.uid()) or c.recipient_id = (select auth.uid()))
   and (p_before_at is null or
        (p_before_id is not null and
         (c.created_at,c.id) < (p_before_at,p_before_id)))
 order by c.created_at desc, c.id desc
 limit least(greatest(coalesce(p_limit,40),1),50)
$$;

create or replace function public.ff_chat_page(
 p_contact_id uuid,
 p_before_at timestamptz default null, p_before_id uuid default null, p_limit integer default 40
) returns setof public.messages
language sql stable security invoker set search_path = '' as $$
 select m.*
 from public.messages m
 where (select auth.uid()) is not null and p_contact_id is not null
   and m.contact_id = p_contact_id
   and (p_before_at is null or
        (p_before_id is not null and
         (m.created_at,m.id) < (p_before_at,p_before_id)))
 order by m.created_at desc, m.id desc
 limit least(greatest(coalesce(p_limit,40),1),50)
$$;

revoke all on function public.ff_discover_page(timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_contacts_page(timestamptz,uuid,integer) from public,anon,authenticated;
revoke all on function public.ff_chat_page(uuid,timestamptz,uuid,integer) from public,anon,authenticated;
grant execute on function public.ff_discover_page(timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_contacts_page(timestamptz,uuid,integer) to authenticated;
grant execute on function public.ff_chat_page(uuid,timestamptz,uuid,integer) to authenticated;

-- Dedicated compound indexes for per-account chronological contact paging.
create index if not exists ff_contacts_sender_recent
 on public.contact_requests(sender_id,created_at desc,id desc);
create index if not exists ff_contacts_recipient_recent
 on public.contact_requests(recipient_id,created_at desc,id desc);
