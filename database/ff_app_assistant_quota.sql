-- KI-Startseite: Nutzungsbegrenzung ohne Speicherung der Fragen oder Antworten.
create table if not exists private.ff_app_assistant_quota (
  utc_day date not null,
  scope text not null,
  used integer not null check (used between 1 and 500),
  primary key (utc_day,scope)
);
alter table private.ff_app_assistant_quota enable row level security;
revoke all on private.ff_app_assistant_quota from public,anon,authenticated;

create or replace function public.ff_app_assistant_claim(p_user_id uuid)
returns text
language plpgsql security definer
set search_path='' as $fn$
declare d date:=(now() at time zone 'UTC')::date;
declare n integer;
begin
  if p_user_id is null or not exists (select 1 from auth.users u where u.id=p_user_id)
  then return 'forbidden'; end if;

  insert into private.ff_app_assistant_quota(utc_day,scope,used)
    values (d,p_user_id::text,1)
    on conflict(utc_day,scope) do update
      set used=private.ff_app_assistant_quota.used+1
      where private.ff_app_assistant_quota.used<20
    returning used into n;
  if not found then return 'account_limit'; end if;

  insert into private.ff_app_assistant_quota(utc_day,scope,used)
    values (d,'global',1)
    on conflict(utc_day,scope) do update
      set used=private.ff_app_assistant_quota.used+1
      where private.ff_app_assistant_quota.used<500
    returning used into n;
  if not found then return 'global_limit'; end if;

  delete from private.ff_app_assistant_quota where utc_day<d-7;
  return 'ok';
end;
$fn$;
revoke all on function public.ff_app_assistant_claim(uuid) from public,anon,authenticated;
grant execute on function public.ff_app_assistant_claim(uuid) to service_role;
comment on function public.ff_app_assistant_claim(uuid)
is 'Server-only daily quota for app KI: max 20 per signed-in account and 500 overall. No prompts stored.';
