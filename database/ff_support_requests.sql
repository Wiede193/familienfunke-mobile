-- Familienfunke: private support requests for signed-in users.
-- A member can submit and read only their own cases, not other members' cases.
-- Status and reply_text cannot be written by the mobile client.
create table if not exists public.ff_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Anmeldung','Profil','Flohmarkt','Kita & Veranstaltungen','Nachrichten','Barrierefreiheit','Sonstiges')),
  subject text not null check (char_length(btrim(subject)) between 5 and 100),
  description text not null check (char_length(btrim(description)) between 15 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','answered','closed')),
  reply_text text not null default '' check (char_length(reply_text)<=4000),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists ff_support_requests_owner_created on public.ff_support_requests(user_id,created_at desc);
alter table public.ff_support_requests enable row level security;
revoke all on public.ff_support_requests from anon, authenticated;
grant select on public.ff_support_requests to authenticated;
grant insert (user_id,category,subject,description) on public.ff_support_requests to authenticated;
create policy ff_support_self_read on public.ff_support_requests
  for select to authenticated
  using(user_id=(select auth.uid()));
create policy ff_support_self_insert on public.ff_support_requests
  for insert to authenticated
  with check (user_id=(select auth.uid()) and status='open' and reply_text='');
