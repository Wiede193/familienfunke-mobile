-- Fixed-window quotas for previously unbounded moderation endpoints.
-- No prompts, messages, images, or other content in counters.
create table if not exists private.ff_moderation_limits(
 service text not null, scope text not null, window_kind text not null,
 window_start timestamptz not null, used integer not null check(used>0),
 primary key(service,scope,window_kind,window_start)
);
alter table private.ff_moderation_limits enable row level security;
revoke all on private.ff_moderation_limits from public,anon,authenticated,service_role;
create or replace function public.ff_moderation_claim(p_service text,p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare
 u_day int; g_day int; u_min int; g_min int;
 d timestamptz:=date_trunc('day',now(),'UTC');
 m timestamptz:=date_trunc('minute',now(),'UTC');
 r record; existing int;
begin
 if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id)
 or exists(select 1 from public.memberships x where x.user_id=p_user_id and x.status='suspended') then return false; end if;
 case p_service
 when 'text' then u_day:=250;g_day:=4000;u_min:=15;g_min:=120;
 when 'photo' then u_day:=25;g_day:=300;u_min:=5;g_min:=30;
 when 'market_review' then u_day:=40;g_day:=300;u_min:=5;g_min:=30;
 else return false;
 end case;
 if p_service='market_review' and not private.is_active_adult(p_user_id) then return false; end if;
 -- Serialize reservations per service so all four counters advance together.
 perform pg_advisory_xact_lock(hashtextextended('ff_moderation_claim:'||p_service,0));
 for r in select * from (values
 ('global','day',d,g_day),('global','minute',m,g_min),
 (p_user_id::text,'day',d,u_day),(p_user_id::text,'minute',m,u_min)
 ) as v(scope,kind,start_at,max_calls)
 loop
   select used into existing from private.ff_moderation_limits
   where service=p_service and scope=r.scope and window_kind=r.kind and window_start=r.start_at;
   if coalesce(existing,0)>=r.max_calls then return false; end if;
 end loop;
 insert into private.ff_moderation_limits(service,scope,window_kind,window_start,used)
 values(p_service,'global','day',d,1),(p_service,'global','minute',m,1),
 (p_service,p_user_id::text,'day',d,1),(p_service,p_user_id::text,'minute',m,1)
 on conflict(service,scope,window_kind,window_start) do update set used=private.ff_moderation_limits.used+1;
 delete from private.ff_moderation_limits where service=p_service and
 ((window_kind='minute' and window_start<m-interval '1 hour') or
 (window_kind='day' and window_start<d-interval '7 days'));
 return true;
end $$;
revoke all on function public.ff_moderation_claim(text,uuid) from public,anon,authenticated;
grant execute on function public.ff_moderation_claim(text,uuid) to service_role;
