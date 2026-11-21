-- Delete notification records only. The parent message, contact or listing is never deleted.
create or replace function public.ff_inbox_delete(p_id uuid default null,p_through timestamptz default null)
returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); affected integer;
begin
 if u is null or (p_id is null and p_through is null) then return 0;end if;
 delete from public.ff_notifications n
 where n.user_id=u and ((p_id is not null and n.id=p_id)
 or (p_id is null and n.created_at<=least(p_through,statement_timestamp())));
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.ff_inbox_delete(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.ff_inbox_delete(uuid,timestamptz) to authenticated;
