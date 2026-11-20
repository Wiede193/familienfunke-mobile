-- Familienfunke: von Familien vorgeschlagene Orte (niemals ungeprüft öffentlich).
-- OpenStreetMap-Daten kommen separat über den read-only Ortssuchdienst.
create table if not exists public.ff_family_places (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 100),
  category text not null check (category in ('playground','changing','outing','other')),
  description text not null default '' check (char_length(description) <= 600),
  region_label text not null default '' check (char_length(region_label) <= 80),
  latitude double precision not null check (latitude between 47.0 and 55.2),
  longitude double precision not null check (longitude between 5.5 and 15.6),
  has_changing_table boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected','removed')),
  source text not null default 'community' check (source = 'community'),
  created_at timestamptz not null default now()
);
create index if not exists ff_family_places_approved_index on public.ff_family_places (moderation_status, category, created_at desc);
create index if not exists ff_family_places_owner_index on public.ff_family_places (submitted_by, created_at desc);
alter table public.ff_family_places enable row level security;
drop policy if exists ff_family_places_read on public.ff_family_places;
create policy ff_family_places_read on public.ff_family_places for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or (moderation_status = 'approved' and private.is_active_adult((select auth.uid())))
  );
drop policy if exists ff_family_places_submit on public.ff_family_places;
create policy ff_family_places_submit on public.ff_family_places for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and private.is_active_adult((select auth.uid()))
    and moderation_status = 'pending'
    and source = 'community'
  );
-- Kein UPDATE/DELETE für öffentliche Clients. Freigabe ausschließlich durch
-- berechtigtes Betreiberteam über den geschützten Server/Adminworkflow.
revoke all on public.ff_family_places from anon, authenticated;
grant select, insert on public.ff_family_places to authenticated;
comment on table public.ff_family_places is 'Vorgeschlagene familienfreundliche Orte; initial pending, nur Betreiber dürfen freigeben.';
