-- No search terms, coordinates or address history are stored.
create table if not exists private.ff_geocode_global (
 singleton boolean primary key default true check(singleton),
 day date not null, calls integer not null default 0,
 last_call timestamptz not null default '-infinity'
);
create table if not exists private.ff_geocode_user (
 user_id uuid primary key, day date not null, calls integer not null default 0
);
revoke all on private.ff_geocode_global,private.ff_geocode_user from public,anon,authenticated,service_role;
alter table private.ff_geocode_global enable row level security;
alter table private.ff_geocode_user enable row level security;
create or replace function public.ff_geocode_claim(p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare
 d date := (now() at time zone 'UTC')::date;
 g private.ff_geocode_global%rowtype;
 u private.ff_geocode_user%rowtype;
 t timestamptz := clock_timestamp();
begin
 if p_user_id is null then return false; end if;
 insert into private.ff_geocode_global(singleton,day) values(true,d) on conflict do nothing;
 select * into g from private.ff_geocode_global where singleton=true for update;
 if g.last_call > t-interval '2 seconds' or (g.day=d and g.calls>=150) then return false; end if;
 if g.day<>d then
   delete from private.ff_geocode_user where day<d;
 end if;
 insert into private.ff_geocode_user(user_id,day) values(p_user_id,d) on conflict do nothing;
 select * into u from private.ff_geocode_user where user_id=p_user_id for update;
 if u.day=d and u.calls>=20 then return false; end if;
 update private.ff_geocode_user set day=d,calls=case when u.day=d then u.calls+1 else 1 end where user_id=p_user_id;
 update private.ff_geocode_global set day=d,calls=case when g.day=d then g.calls+1 else 1 end,last_call=t where singleton=true;
 return true;
end $$;
revoke all on function public.ff_geocode_claim(uuid) from public,anon,authenticated;
grant execute on function public.ff_geocode_claim(uuid) to service_role;
