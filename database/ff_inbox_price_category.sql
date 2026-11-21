-- Filter at the database, not just the first 40 already loaded notifications.
-- Preserve global deletion/read counters independent of the selected tab.
create or replace function public.ff_inbox_page_by_kind(p_kind text,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'unread',coalesce(c.unread,0),'total',coalesce(c.total,0),
 'price_unread',coalesce(c.price_unread,0),
 'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc)
  from (select id,kind,contact_id,listing_id,listing_status,created_at,read_at,old_price_cents,new_price_cents
   from public.ff_notifications n
   where n.user_id=(select auth.uid())
    and (p_kind='all' or n.kind=p_kind)
    and (p_before is null or (n.created_at,n.id)<(p_before,p_before_id))
   order by n.created_at desc,n.id desc limit 40) x),'[]'::jsonb),
 'as_of',statement_timestamp())
 from (select count(*) as total,count(*) filter(where read_at is null) as unread,
 count(*) filter(where kind='price' and read_at is null) as price_unread
 from public.ff_notifications where user_id=(select auth.uid())) c
 where p_kind in ('all','price') and auth.uid() is not null
$$;
revoke all on function public.ff_inbox_page_by_kind(text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ff_inbox_page_by_kind(text,timestamptz,uuid) to authenticated;
create index if not exists ff_inbox_kind_page on public.ff_notifications(user_id,kind,created_at desc,id desc);
