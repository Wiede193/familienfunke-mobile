-- Editorial public family event catalogue; no user submissions or personal data.
-- Sources may be organizers, municipalities, or regional official tourism portals.
create table if not exists public.ff_official_family_events(
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  title text not null check (char_length(btrim(title)) between 4 and 160),
  summary text not null check (char_length(btrim(summary)) between 15 and 800),
  category text not null check (category in ('festival','market','theater','workshop','sport','baby','outdoor')),
  district text not null check (district in ('oder-spree','frankfurt-oder','maerkisch-oderland','barnim','dahme-spreewald')),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  venue text not null check (char_length(btrim(venue)) between 3 and 160),
  start_date date not null,
  end_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  source_url text not null check (source_url ~ '^https://[^ ]+$' and char_length(source_url)<=600),
  source_name text not null check (char_length(btrim(source_name)) between 3 and 120),
  source_kind text not null check (source_kind in ('organizer','municipality','tourism')),
  age_note text not null default '' check (char_length(age_note)<=240),
  cost_note text not null default '' check (char_length(cost_note)<=240),
  booking_note text not null default '' check (char_length(booking_note)<=240),
  accessibility_note text not null default 'Barrierefreiheit nicht einzeln geprüft; bitte beim Veranstalter erfragen.'
    check(char_length(accessibility_note)<=360),
  checked_on date not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ff_official_family_events_valid_dates check (end_date>=start_date and end_date<=start_date+100)
);
comment on table public.ff_official_family_events is 'Curated externally organized, source-linked public family events; distinct from private family meetings and personal appointments.';
create index if not exists ff_official_family_events_public_dates
  on public.ff_official_family_events(start_date,end_date) where published;
create index if not exists ff_official_family_events_district_dates
  on public.ff_official_family_events(district,start_date) where published;
alter table public.ff_official_family_events enable row level security;
revoke all on public.ff_official_family_events from public, anon, authenticated;
grant select on public.ff_official_family_events to authenticated;
grant all on public.ff_official_family_events to service_role;
drop policy if exists ff_official_family_events_read on public.ff_official_family_events;
create policy ff_official_family_events_read on public.ff_official_family_events
 for select to authenticated using (published and end_date >= current_date);
