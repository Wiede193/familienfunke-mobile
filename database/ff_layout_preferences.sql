-- Proposal for a reviewed staging deployment. Do not apply to production
-- until two-account tests and conflict tests have passed.
begin;
create or replace function public.ff_layout_unique(items text[]) returns boolean
language sql immutable security invoker set search_path=pg_catalog
as $ff_unique$ select coalesce(array_ndims(items),1)=1 and coalesce(array_lower(items,1),1)=1 and cardinality(items)=(select count(distinct value) from unnest(items) as t(value)) $ff_unique$;
revoke all on function public.ff_layout_unique(text[]) from public,anon,authenticated;
grant execute on function public.ff_layout_unique(text[]) to authenticated;
create table if not exists public.ff_layout_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 home text[] not null,
 bottom text[] not null,
 revision integer not null default 1 check (revision between 1 and 2147483646),
 constraint ff_layout_home_valid check (
  cardinality(home)<=19 and public.ff_layout_unique(home) and
  home <@ array['box','sell','market','discover','map','outing','guide','play','calendar','events','contacts','profile','partners','help','chat','inbox','push','aboutApp','inclusion']::text[]
 ),
 constraint ff_layout_bottom_valid check (
  cardinality(bottom) between 1 and 5 and public.ff_layout_unique(bottom) and bottom[1]='home' and
  bottom <@ array['home','market','discover','map','guide','contacts','chat','outing','calendar','play','profile','events']::text[]
 )
);
alter table public.ff_layout_preferences enable row level security;
revoke all on table public.ff_layout_preferences from public,anon,authenticated;
grant select,insert on table public.ff_layout_preferences to authenticated;
grant update(home,bottom,revision) on table public.ff_layout_preferences to authenticated;
create or replace function public.ff_layout_revision_guard() returns trigger
language plpgsql security invoker set search_path=pg_catalog
as $ff_revision$ begin
 if tg_op='INSERT' then
  if new.revision<>1 then raise exception 'Initial revision must be 1' using errcode='23514'; end if;
 elsif new.revision<>old.revision+1 then
  raise exception 'Revision must advance by one' using errcode='23514';
 end if;
 return new;
end; $ff_revision$;
revoke all on function public.ff_layout_revision_guard() from public,anon,authenticated;
drop trigger if exists ff_layout_revision_guard on public.ff_layout_preferences;
create trigger ff_layout_revision_guard before insert or update on public.ff_layout_preferences
for each row execute function public.ff_layout_revision_guard();
drop policy if exists ff_layout_read on public.ff_layout_preferences;
create policy ff_layout_read on public.ff_layout_preferences for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists ff_layout_insert on public.ff_layout_preferences;
create policy ff_layout_insert on public.ff_layout_preferences for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists ff_layout_update on public.ff_layout_preferences;
create policy ff_layout_update on public.ff_layout_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
commit;
