-- Lightweight chat overview: only the last message for each of at most 50
-- explicitly requested, accepted conversations. RLS applies to BOTH tables.
-- No unbounded message export or cross-account access.
create or replace function public.ff_chat_previews(p_contact_ids uuid[])
returns table(contact_id uuid, body text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$
 select c.id, newest.body, newest.created_at
 from public.contact_requests c
 join lateral (
   select m.body, m.created_at
   from public.messages m
   where m.contact_id = c.id
   order by m.created_at desc, m.id desc
   limit 1
 ) newest on true
 where (select auth.uid()) is not null
   and coalesce(cardinality(p_contact_ids),0) between 1 and 50
   and c.id = any(p_contact_ids)
   and c.status='accepted'
   and (c.sender_id=(select auth.uid()) or c.recipient_id=(select auth.uid()))
$$;
revoke all on function public.ff_chat_previews(uuid[]) from public,anon,authenticated;
grant execute on function public.ff_chat_previews(uuid[]) to authenticated;
