-- Automated official-event discovery, deliberately NOT automated publication.
-- RLS + no public grants: imports, review state and sync secrets are server-only.
create table if not exists public.ff_official_event_sources(
 id text primary key check(id ~ '^[a-z0-9_-]{4,64}$'),
 title text not null check(char_length(title) between 3 and 140),
 url text not null check(url ~ '^https://[^ ]+$' and char_length(url)<=600),
 format text not null check(format in ('jsonld','ics','xml_tmb')),
 source_name text not null,
 source_kind text not null check(source_kind in ('organizer','municipality','tourism')),
 district text not null check(district in ('oder-spree','frankfurt-oder','maerkisch-oderland','barnim','dahme-spreewald')),
 city text not null check(char_length(city) between 2 and 80),
 authorized boolean not null default false,
 enabled boolean not null default false,
 last_checked_at timestamptz,
 last_success_at timestamptz,
 last_error text check(last_error is null or char_length(last_error)<=240),
 last_item_count integer not null default 0 check(last_item_count>=0),
 created_at timestamptz not null default now()
);
alter table public.ff_official_event_sources enable row level security;
revoke all on public.ff_official_event_sources from public,anon,authenticated;
grant all on public.ff_official_event_sources to service_role;

create table if not exists public.ff_official_event_candidates(
 id uuid primary key default gen_random_uuid(),
 source_id text not null references public.ff_official_event_sources(id) on delete restrict,
 external_id text not null check(char_length(external_id) between 1 and 240),
 instance_key text not null check(char_length(instance_key) between 4 and 32),
 title text not null check(char_length(btrim(title)) between 4 and 160),
 summary text not null check(char_length(btrim(summary)) between 15 and 800),
 category text not null check(category in ('festival','market','theater','workshop','sport','baby','outdoor')),
 district text not null check(district in ('oder-spree','frankfurt-oder','maerkisch-oderland','barnim','dahme-spreewald')),
 city text not null,
 venue text not null,
 start_date date not null,
 end_date date not null,
 start_time time without time zone,
 source_url text not null check(source_url ~ '^https://[^ ]+$' and char_length(source_url)<=600),
 source_name text not null,
 source_kind text not null check(source_kind in ('organizer','municipality','tourism')),
 fingerprint text not null check(fingerprint ~ '^[0-9a-f]{64}$'),
 review_state text not null default 'pending' check(review_state in ('pending','changed','approved','rejected','duplicate','cancelled')),
 review_note text not null default '' check(char_length(review_note)<=500),
 linked_event_id uuid references public.ff_official_family_events(id) on delete set null,
 first_seen_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 reviewed_at timestamptz,
 unique(source_id,external_id,instance_key),
 constraint ff_official_candidate_valid_date check(end_date>=start_date and end_date<=start_date+100)
);
create index if not exists ff_official_event_candidate_review
 on public.ff_official_event_candidates(review_state,start_date) where review_state in ('pending','changed','duplicate','cancelled');
alter table public.ff_official_event_candidates enable row level security;
revoke all on public.ff_official_event_candidates from public,anon,authenticated;
grant all on public.ff_official_event_candidates to service_role;

create table if not exists public.ff_official_event_checks(
 event_id uuid primary key references public.ff_official_family_events(id) on delete cascade,
 last_checked_at timestamptz not null default now(),
 last_http_status integer,
 failure_count integer not null default 0,
 review_required boolean not null default false,
 review_reason text not null default '' check(char_length(review_reason)<=240),
 last_success_at timestamptz
);
alter table public.ff_official_event_checks enable row level security;
revoke all on public.ff_official_event_checks from public,anon,authenticated;
grant all on public.ff_official_event_checks to service_role;

create table if not exists private.ff_official_sync_runtime(
 singleton boolean primary key default true check(singleton),
 token text not null check(char_length(token)=64),
 installed_at timestamptz not null default now()
);
revoke all on private.ff_official_sync_runtime from public,anon,authenticated;
insert into private.ff_official_sync_runtime(singleton,token)
 values(true,encode(extensions.gen_random_bytes(32),'hex'))
 on conflict(singleton) do nothing;

-- Only the Edge Function's service client can verify the cron-only bearer token.
create or replace function public.ff_official_sync_authorized(p_token text)
returns boolean language sql stable security definer set search_path='' as $
 select coalesce(length(p_token)=64 and exists(
  select 1 from private.ff_official_sync_runtime
   where singleton=true and
   encode(extensions.digest(p_token,'sha256'),'hex')=
   encode(extensions.digest(token,'sha256'),'hex')
 ),false)
$$;
revoke all on function public.ff_official_sync_authorized(text) from public,anon,authenticated;
grant execute on function public.ff_official_sync_authorized(text) to service_role;

-- Editorial approval is an explicit server-only action (no user-app RPC).
create or replace function private.ff_approve_official_candidate(p_candidate_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare x public.ff_official_event_candidates%rowtype; event_id uuid;
begin
 select * into x from public.ff_official_event_candidates where id=p_candidate_id for update;
 if not found then raise exception 'Candidate not found'; end if;
 if x.review_state not in ('pending','changed','duplicate') then raise exception 'Candidate is not pending approval'; end if;
 if x.end_date < current_date then raise exception 'Past candidate'; end if;
 if x.source_url !~ '^https://[^ ]+$' then raise exception 'Untrusted source URL'; end if;
 if x.linked_event_id is null then
  insert into public.ff_official_family_events
  (source_key,title,summary,category,district,city,venue,start_date,end_date,start_time,
   source_url,source_name,source_kind,checked_on,published)
  values ('import:'||x.source_id||':'||x.external_id||':'||x.instance_key,
   x.title,x.summary,x.category,x.district,x.city,x.venue,x.start_date,x.end_date,x.start_time,
   x.source_url,x.source_name,x.source_kind,current_date,true)
  returning id into event_id;
 else
  update public.ff_official_family_events set
   title=x.title,summary=x.summary,category=x.category,district=x.district,city=x.city,
   venue=x.venue,start_date=x.start_date,end_date=x.end_date,start_time=x.start_time,
   source_url=x.source_url,source_name=x.source_name,source_kind=x.source_kind,
   checked_on=current_date,published=true,updated_at=now()
   where id=x.linked_event_id returning id into event_id;
  if event_id is null then raise exception 'Linked event missing'; end if;
 end if;
 update public.ff_official_event_candidates set
  linked_event_id=event_id,review_state='approved',review_note='Redaktionell freigegeben',
  reviewed_at=now() where id=p_candidate_id;
 return event_id;
end $$;
revoke all on function private.ff_approve_official_candidate(uuid) from public,anon,authenticated;
grant execute on function private.ff_approve_official_candidate(uuid) to service_role;

-- Only public collection pages of an officially administered municipality;
-- existing sources may supply structured JSON-LD, otherwise zero candidates.
insert into public.ff_official_event_sources
 (id,title,url,format,source_name,source_kind,district,city,authorized,enabled)
values
 ('storkow-events','Storkow – offizieller Veranstaltungskalender',
  'https://www.storkow-mark.de/veranstaltungen/','jsonld','Stadt Storkow (Mark)','municipality','oder-spree','Storkow (Mark)',true,true),
 ('eberswalde-events','Eberswalde – städtische Veranstaltungen',
  'https://www.eberswalde.de/termine','jsonld','Stadt Eberswalde','municipality','barnim','Eberswalde',true,true)
on conflict (id) do nothing;
