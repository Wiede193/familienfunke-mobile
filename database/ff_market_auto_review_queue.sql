-- The existing two pre-migration test listings are intentionally NOT enrolled.
-- Every *new* listing enters a private-to-clients retry queue.
create table if not exists public.ff_market_review_jobs (
  listing_id uuid primary key references public.ff_market_listings(id) on delete cascade,
  review_version bigint not null,
  state text not null default 'queued' check (state in ('queued','processing','retry','manual')),
  attempts integer not null default 0 check (attempts between 0 and 20),
  due_at timestamptz not null default (now()+ interval '4 minutes'),
  lease_id uuid,
  leased_until timestamptz,
  reason text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists ff_market_review_jobs_schedule_idx
  on public.ff_market_review_jobs (due_at) where state in ('queued','retry','processing');
alter table public.ff_market_review_jobs enable row level security;
revoke all on public.ff_market_review_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.ff_market_review_jobs to service_role;

create or replace function private.ff_market_review_queue_sync()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
  if tg_op='INSERT' then
    if new.moderation_status='pending' then
      insert into public.ff_market_review_jobs(listing_id,review_version,due_at)
      values(new.id,new.review_version,now()+interval '4 minutes');
    end if;
  elsif new.moderation_status<>'pending' then
    delete from public.ff_market_review_jobs where listing_id=new.id;
  elsif new.review_version is distinct from old.review_version then
    -- Only rows already in the queue can be reset; legacy listings stay untouched.
    update public.ff_market_review_jobs set
      review_version=new.review_version,state='queued',attempts=0,
      due_at=now()+interval '4 minutes',lease_id=null,leased_until=null,
      reason='',updated_at=now()
    where listing_id=new.id;
  end if;
  return new;
end $fn$;
revoke all on function private.ff_market_review_queue_sync() from public,anon,authenticated;
drop trigger if exists ff_market_review_queue_sync on public.ff_market_listings;
create trigger ff_market_review_queue_sync
after insert or update of moderation_status,review_version on public.ff_market_listings
for each row execute function private.ff_market_review_queue_sync();

-- A lease prevents concurrent workers from processing the same case. A crashed
-- worker is retried only after its lease expires, up to four attempts.
create or replace function public.ff_market_review_claim(p_limit integer default 1)
returns table (listing_id uuid,seller_id uuid,lease_id uuid,review_version bigint)
language plpgsql security definer set search_path='' as $fn$
begin
  if p_limit not between 1 and 2 then raise exception 'invalid batch size'; end if;
  update public.ff_market_review_jobs j
     set state='manual',reason='technical_exhausted',updated_at=now(),
         lease_id=null,leased_until=null
  where j.attempts>=4 and j.state in ('queued','retry','processing')
    and (j.state<>'processing' or j.leased_until<now());

  return query
  with due as (
    select j.listing_id
    from public.ff_market_review_jobs j
    join public.ff_market_listings l on l.id=j.listing_id
    where l.moderation_status='pending'
      and l.review_version=j.review_version and j.attempts<4
      and ((j.state in ('queued','retry') and j.due_at<=now())
        or (j.state='processing' and j.leased_until<now()))
    order by j.due_at,j.created_at
    for update of j skip locked
    limit p_limit
  ), claimed as (
    update public.ff_market_review_jobs j
      set state='processing', attempts=j.attempts+1,
          lease_id=pg_catalog.gen_random_uuid(),
          leased_until=now()+interval '3 minutes',updated_at=now()
    from due where j.listing_id=due.listing_id
    returning j.listing_id,j.lease_id,j.review_version
  )
  select c.listing_id,l.seller_id,c.lease_id,c.review_version
  from claimed c join public.ff_market_listings l on l.id=c.listing_id;
end $fn$;
revoke all on function public.ff_market_review_claim(integer) from public,anon,authenticated;
grant execute on function public.ff_market_review_claim(integer) to service_role;

-- A worker records *every* result, even model/network errors. Never auto-approve
-- after missing photos, ambiguous safety checks or exhausted retries.
create or replace function public.ff_market_review_record(
 p_listing_id uuid,p_outcome text,p_reason text default '',
 p_lease_id uuid default null
) returns boolean language plpgsql security definer set search_path='' as $fn$
declare j public.ff_market_review_jobs%rowtype;
declare n integer;declare is_manual boolean;declare listing_pending boolean;
begin
  select * into j from public.ff_market_review_jobs
  where listing_id=p_listing_id for update;
  if not found then return false; end if;
  if p_lease_id is not null and
     (j.state<>'processing' or j.lease_id is distinct from p_lease_id) then return false; end if;
  if p_lease_id is null and j.state='processing' and j.leased_until>now() then return false; end if;
  if p_lease_id is null and j.state='manual' then return false; end if;
  select l.moderation_status='pending' and l.review_version=j.review_version
    into listing_pending from public.ff_market_listings l where l.id=p_listing_id;
  if coalesce(listing_pending,false)=false then
     delete from public.ff_market_review_jobs where listing_id=p_listing_id;
     return true;
  end if;
  n:=j.attempts+case when p_lease_id is null then 1 else 0 end;
  is_manual:=p_outcome='review_required' and
     coalesce(p_reason,'') not in ('changed_during_review');
  if p_outcome in ('approved','rejected') then
     -- Fail closed on an inconsistent, still-pending listing.
     is_manual:=true;
  end if;
  is_manual:=is_manual or n>=4 or p_outcome not in ('error','retry','review_required','approved','rejected');
  update public.ff_market_review_jobs set
     state=case when is_manual then 'manual' else 'retry' end,
     attempts=least(n,20),
     reason=case when n>=4 and not is_manual then 'technical_exhausted'
       when n>=4 and p_outcome='error' then 'technical_exhausted'
       else left(coalesce(p_reason,''),100) end,
     due_at=case when is_manual then due_at else now()+make_interval(mins=> (3*power(2,least(n,3)))::integer) end,
     lease_id=null,leased_until=null,updated_at=now()
  where listing_id=p_listing_id;
  return true;
end $fn$;
revoke all on function public.ff_market_review_record(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.ff_market_review_record(uuid,text,text,uuid) to service_role;

-- One-minute HMAC authenticated scheduler. No API key stored in SQL, Vault or
-- pg_net payloads: only a 90-second, single-use signature is transmitted.
create table if not exists private.ff_market_review_cron_key (
  singleton boolean primary key default true check (singleton),
  key_bytes bytea not null,
  last_timestamp bigint not null default 0
);
alter table private.ff_market_review_cron_key enable row level security;
revoke all on private.ff_market_review_cron_key from public,anon,authenticated,service_role;
insert into private.ff_market_review_cron_key(singleton,key_bytes)
values(true,extensions.gen_random_bytes(32))
on conflict(singleton) do nothing;

create or replace function private.ff_market_review_sign(p_timestamp bigint)
returns text language sql stable security definer set search_path='' as $fn$
  select pg_catalog.encode(extensions.hmac(p_timestamp::text::bytea,key_bytes,'sha256'),'hex')
  from private.ff_market_review_cron_key where singleton=true;
$fn$;
revoke all on function private.ff_market_review_sign(bigint) from public,anon,authenticated,service_role;

create or replace function public.ff_market_review_cron_verify(
  p_timestamp bigint,p_signature text
) returns boolean language plpgsql security definer set search_path='' as $fn$
declare correct text;
begin
  if p_timestamp is null or p_signature is null
    or length(p_signature)<>64
    or abs(extract(epoch from clock_timestamp())-p_timestamp)>90
    then return false; end if;
  select private.ff_market_review_sign(p_timestamp) into correct;
  if correct is null or correct<>p_signature then return false; end if;
  update private.ff_market_review_cron_key
    set last_timestamp=p_timestamp
  where singleton=true and last_timestamp<p_timestamp;
  if found then return true; end if;
  return false;
end $fn$;
revoke all on function public.ff_market_review_cron_verify(bigint,text)
  from public,anon,authenticated;
grant execute on function public.ff_market_review_cron_verify(bigint,text) to service_role;

-- Administrative read-only list; only true human-review cases and retries.
create or replace function public.familienfunke_admin_market_reviews()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare role_name text;
begin
  select s.role into role_name from private.admin_staff s
    where s.user_id=auth.uid() and s.is_active=true;
  if role_name not in ('owner','moderator') or role_name is null then
    raise exception 'Keine Admin-Berechtigung' using errcode='42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.updated_at desc)
    from (
      select j.listing_id,j.state,j.reason,j.attempts,j.created_at,j.updated_at,
        j.due_at,l.title,l.description,l.category,l.review_version,l.region_label,
        l.item_condition,l.price_cents,l.trade_type,l.seller_id
      from public.ff_market_review_jobs j
      join public.ff_market_listings l on l.id=j.listing_id
      where l.moderation_status='pending' and j.state in ('retry','manual')
      order by (j.state='manual') desc,j.updated_at desc
      limit 60
    ) t
  ),'[]'::jsonb);
end $fn$;
revoke all on function public.familienfunke_admin_market_reviews() from public,anon;
grant execute on function public.familienfunke_admin_market_reviews() to authenticated;
