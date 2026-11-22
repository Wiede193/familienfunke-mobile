create table if not exists public.ff_official_event_sync_runs(
 id bigint generated always as identity primary key,
 started_at timestamptz not null default now(),
 finished_at timestamptz not null,
 source_count integer not null default 0,
 new_count integer not null default 0,
 duplicate_count integer not null default 0,
 changed_count integer not null default 0,
 cancellation_count integer not null default 0,
 checked_count integer not null default 0,
 warning_count integer not null default 0,
 errors text[] not null default '{}'
);
create index if not exists ff_official_sync_runs_recent on public.ff_official_event_sync_runs(started_at desc);
alter table public.ff_official_event_sync_runs enable row level security;
revoke all on public.ff_official_event_sync_runs from public,anon,authenticated;
grant all on public.ff_official_event_sync_runs to service_role;
