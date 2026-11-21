-- Proposal for a reviewed staging deployment. Do not apply to production
-- until two-account tests and conflict tests have passed.
begin;
create table if not exists public.ff_layout_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 home text[] not null,
 bottom text[] not null,
 revision integer not null default 1 check (revision between 1 and 2147483646),
 constraint ff_layout_home_valid check (
  cardinality(home)<=19 and array_position(home,null) is null and
  home <@ array['box','sell','market','discover','map','outing','guide','play','calendar','events','contacts','profile','partners','help','chat','inbox','push','aboutApp','inclusion']::text[]
 ),
 constraint ff_layout_bottom_valid check (
  cardinality(bottom) between 1 and 5 and array_position(bottom,null) is null and bottom[1]='home' and
  bottom <@ array['home','market','discover','map','guide','contacts','chat','outing','calendar','play','profile','events']::text[]
 )
);
alter table public.ff_layout_preferences enable row level security;
revoke all on table public.ff_layout_preferences from public,anon,authenticated;
grant select,insert,update on table public.ff_layout_preferences to authenticated;
drop policy if exists ff_layout_read on public.ff_layout_preferences;
create policy ff_layout_read on public.ff_layout_preferences for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists ff_layout_insert on public.ff_layout_preferences;
create policy ff_layout_insert on public.ff_layout_preferences for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists ff_layout_update on public.ff_layout_preferences;
create policy ff_layout_update on public.ff_layout_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
commit;
