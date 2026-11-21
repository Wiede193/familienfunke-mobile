-- Budgetschutz des freiwilligen KI-Schnellverkaufs, ohne Speicherung von Fotos.
-- Nur die Serverfunktion darf das Kontingent beanspruchen.
create table if not exists private.ff_market_scan_quota (
  utc_day date not null,
  scope text not null,
  used integer not null check (used between 1 and 300),
  primary key (utc_day,scope)
);
alter table private.ff_market_scan_quota enable row level security;
revoke all on private.ff_market_scan_quota from public,anon,authenticated;
create or replace function public.ff_market_claim_scan(p_user_id uuid)
returns text language plpgsql security definer set search_path='' as $fn$
declare
  d date:=(now() at time zone 'UTC')::date;
  n integer;
begin
  if p_user_id is null or not private.is_active_adult(p_user_id) then
    return 'forbidden';
  end if;
  -- A per-account counter and a global beta budget limit concurrent abuse.
  insert into private.ff_market_scan_quota(utc_day,scope,used)
    values(d,p_user_id::text,1)
    on conflict(utc_day,scope) do update
      set used=private.ff_market_scan_quota.used+1
      where private.ff_market_scan_quota.used<12
    returning used into n;
  if not found then return 'account_limit'; end if;
  insert into private.ff_market_scan_quota(utc_day,scope,used)
    values(d,'global',1)
    on conflict(utc_day,scope) do update
      set used=private.ff_market_scan_quota.used+1
      where private.ff_market_scan_quota.used<300
    returning used into n;
  if not found then return 'global_limit'; end if;
  -- Only counters are persisted, with a short cleanup window.
  delete from private.ff_market_scan_quota where utc_day<d-7;
  return 'ok';
end;
$fn$;
revoke all on function public.ff_market_claim_scan(uuid) from public,anon,authenticated;
grant execute on function public.ff_market_claim_scan(uuid) to service_role;
comment on function public.ff_market_claim_scan(uuid) is 'Server-only beta budget: 12 attempts per verified account/day, 300 overall/day. No image data.';
