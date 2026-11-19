-- Familienfunke Beta: Familienbasar und Kita-Partner (ohne Zahlungsfunktion)
-- Nur Betreiber können Moderationsstatus freigeben. Organisationen erhalten keine Selbstverifizierung.
create table if not exists public.ff_organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  kind text not null check(kind in ('kita','foerderverein','familienzentrum','verein')),
  name text not null check(char_length(btrim(name)) between 3 and 100),
  region_label text not null default '' check(char_length(region_label)<=80),
  description text not null default '' check(char_length(description)<=800),
  open_places boolean not null default false,
  status text not null default 'pending' check(status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);
create index if not exists ff_organizations_status_idx on public.ff_organizations(status);
alter table public.ff_organizations enable row level security;
revoke all on public.ff_organizations from anon, authenticated;
grant select, insert on public.ff_organizations to authenticated;
grant update (kind, name, region_label, description, open_places) on public.ff_organizations to authenticated;
create policy ff_org_read on public.ff_organizations for select to authenticated using (
  owner_id=(select auth.uid()) or
  (status='approved' and private.is_active_adult((select auth.uid())))
);
create policy ff_org_apply on public.ff_organizations for insert to authenticated with check (
  owner_id=(select auth.uid()) and status='pending' and private.is_active_adult((select auth.uid()))
);
create policy ff_org_edit_pending on public.ff_organizations for update to authenticated
  using(owner_id=(select auth.uid()) and status='pending')
  with check(owner_id=(select auth.uid()) and status='pending');

create table if not exists public.ff_market_listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references auth.users(id),
 organization_id uuid references public.ff_organizations(id),
 title text not null check(char_length(btrim(title)) between 4 and 100),
 description text not null default '' check(char_length(description)<=1500),
 category text not null check(category in ('Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')),
 item_condition text not null default 'Gut' check(item_condition in ('Neu','Sehr gut','Gut','Gebraucht')),
 trade_type text not null default 'sell' check(trade_type in ('sell','gift','swap')),
 price_cents int not null default 0 check(price_cents between 0 and 10000000),
 region_label text not null default '' check(char_length(region_label)<=80),
 photo_path text check(photo_path is null or (char_length(photo_path)<=250 and photo_path ~ '^[0-9a-f-]+/[0-9a-f-]+\\.jpg$')),
 moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected','removed','sold')),
 created_at timestamptz not null default now(),
 constraint ff_market_price_kind check (trade_type='sell' or price_cents=0)
);
create index if not exists ff_market_status_idx on public.ff_market_listings(moderation_status,created_at desc);
create index if not exists ff_market_seller_idx on public.ff_market_listings(seller_id);
alter table public.ff_market_listings enable row level security;
revoke all on public.ff_market_listings from anon, authenticated;
grant select, insert on public.ff_market_listings to authenticated;
grant update (photo_path) on public.ff_market_listings to authenticated;
create policy ff_market_read on public.ff_market_listings for select to authenticated using (
 seller_id=(select auth.uid()) or
 (moderation_status='approved' and private.is_active_adult((select auth.uid()))
  and private.is_active_adult(seller_id)
  and private.not_blocked((select auth.uid()),seller_id))
);
create policy ff_market_insert on public.ff_market_listings for insert to authenticated with check (
 seller_id=(select auth.uid()) and moderation_status='pending' and photo_path is null
 and private.is_active_adult((select auth.uid())) and (
 organization_id is null or exists(
 select 1 from public.ff_organizations o where o.id=organization_id
 and o.owner_id=(select auth.uid()) and o.status='approved'))
);
create policy ff_market_add_photo on public.ff_market_listings for update to authenticated
 using(seller_id=(select auth.uid()) and moderation_status='pending')
 with check(seller_id=(select auth.uid()) and moderation_status='pending'
 and (photo_path is null or photo_path = (seller_id::text || '/' || id::text || '.jpg')));

create table if not exists public.ff_partner_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.ff_organizations(id),
 creator_id uuid not null references auth.users(id),
 title text not null check(char_length(btrim(title)) between 4 and 100),
 description text not null default '' check(char_length(description)<=1000),
 region_label text not null default '' check(char_length(region_label)<=80),
 starts_at timestamptz not null,
 moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected','cancelled')),
 created_at timestamptz not null default now()
);
create index if not exists ff_partner_events_date_idx on public.ff_partner_events(starts_at);
alter table public.ff_partner_events enable row level security;
revoke all on public.ff_partner_events from anon, authenticated;
grant select, insert on public.ff_partner_events to authenticated;
create policy ff_partner_events_read on public.ff_partner_events for select to authenticated using (
 creator_id=(select auth.uid()) or
 (moderation_status='approved' and private.is_active_adult((select auth.uid()))
 and exists(select 1 from public.ff_organizations o where o.id=organization_id and o.status='approved'))
);
create policy ff_partner_events_insert on public.ff_partner_events for insert to authenticated with check (
 creator_id=(select auth.uid()) and moderation_status='pending'
 and private.is_active_adult((select auth.uid()))
 and exists(select 1 from public.ff_organizations o where o.id=organization_id
 and o.owner_id=(select auth.uid()) and o.status='approved')
);

-- Foto-Bucket: niemals öffentlich, auch nicht vor Freigabe.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('ff-market-photos','ff-market-photos',false,5242880,array['image/jpeg'])
on conflict(id) do nothing;
create policy ff_market_photos_insert on storage.objects for insert to authenticated with check (
 bucket_id='ff-market-photos'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and private.is_active_adult((select auth.uid()))
);
create policy ff_market_photos_read on storage.objects for select to authenticated using (
 bucket_id='ff-market-photos' and (
 (storage.foldername(name))[1]=(select auth.uid())::text
 or (private.is_active_adult((select auth.uid())) and exists(
   select 1 from public.ff_market_listings l where l.photo_path=name
   and l.moderation_status='approved' and private.is_active_adult(l.seller_id)
   and private.not_blocked((select auth.uid()),l.seller_id)
 ))
 )
);
