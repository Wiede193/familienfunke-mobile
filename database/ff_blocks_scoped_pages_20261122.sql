-- Phase 9. List only the current user's block flags for visible profiles,
-- and page through their own full block list in account settings.
-- These RPCs never reveal blocks made by OTHER users.
create index if not exists blocks_blocker_recent_idx
  on public.blocks (blocker_id, created_at desc, blocked_id desc);

create or replace function public.ff_block_flags(p_user_ids uuid[])
returns table(blocked_id uuid)
language plpgsql stable security invoker
set search_path = ''
as $$
begin
  if p_user_ids is null or cardinality(p_user_ids)=0 then
    return;
  end if;
  if cardinality(p_user_ids)>120 then
    raise exception 'FF_BLOCK_FLAG_TOO_MANY_IDS' using errcode='22023';
  end if;
  return query
  select b.blocked_id
  from public.blocks b
  where b.blocker_id=(select auth.uid())
    and b.blocked_id=any(p_user_ids);
end;
$$;

create or replace function public.ff_my_blocks_page(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 30
)
returns table(blocked_id uuid, created_at timestamptz)
language sql stable security invoker
set search_path = ''
as $$
  select b.blocked_id,b.created_at
  from public.blocks b
  where b.blocker_id=(select auth.uid())
    and (
      p_before_at is null
      or (p_before_id is not null and (b.created_at,b.blocked_id)<(p_before_at,p_before_id))
    )
  order by b.created_at desc,b.blocked_id desc
  limit greatest(1,least(coalesce(p_limit,30),30))
$$;

revoke all on function public.ff_block_flags(uuid[]) from public,anon,authenticated;
revoke all on function public.ff_my_blocks_page(timestamptz,uuid,integer) from public,anon,authenticated;
grant execute on function public.ff_block_flags(uuid[]) to authenticated;
grant execute on function public.ff_my_blocks_page(timestamptz,uuid,integer) to authenticated;
