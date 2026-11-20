-- Familienfunke Familienbasar: Bildergalerie (max. 5 inkl. bestehendem Hauptfoto),
-- Merkliste und sichere Bearbeitung mit erneuter KI-Freigabe.
-- Ausgeschlossene Statusänderungen sind weiterhin NICHT per Client möglich.

alter table public.ff_market_listings
  add column if not exists review_version bigint not null default 0;

create table if not exists public.ff_market_photos (
  listing_id uuid not null references public.ff_market_listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 2 and 5),
  photo_path text not null,
  created_at timestamptz not null default now(),
  primary key (listing_id,slot),
  unique (photo_path),
  constraint ff_market_extra_path_check check (
    photo_path = seller_id::text || '/' || listing_id::text || '/' || slot::text || '.jpg'
  )
);
create index if not exists ff_market_photos_seller_idx on public.ff_market_photos(seller_id);
alter table public.ff_market_photos enable row level security;
revoke all on public.ff_market_photos from public,anon,authenticated;
grant select,insert on public.ff_market_photos to authenticated;

drop policy if exists ff_market_extra_read on public.ff_market_photos;
create policy ff_market_extra_read on public.ff_market_photos for select to authenticated
using (
  seller_id = (select auth.uid())
  or (
    private.is_active_adult((select auth.uid()))
    and exists (
      select 1 from public.ff_market_listings l where
        l.id=listing_id and l.seller_id=seller_id
        and l.moderation_status='approved'
        and private.is_active_adult(l.seller_id)
        and private.not_blocked((select auth.uid()),l.seller_id)
    )
  )
);
drop policy if exists ff_market_extra_add on public.ff_market_photos;
create policy ff_market_extra_add on public.ff_market_photos for insert to authenticated
with check (
  seller_id=(select auth.uid())
  and private.is_active_adult((select auth.uid()))
  and exists(
    select 1 from public.ff_market_listings l where
      l.id=listing_id and l.seller_id=(select auth.uid())
      and l.moderation_status='pending'
  )
);

-- A newly attached image invalidates any concurrent snapshot of AI review.
create or replace function private.ff_market_bump_review_version()
returns trigger language plpgsql security definer
set search_path='' as $f$
begin
  update public.ff_market_listings
  set review_version = review_version + 1
  where id = new.listing_id and seller_id = new.seller_id
    and moderation_status = 'pending';
  if not found then
    raise exception 'Inserat ist nicht mehr zur Bildbearbeitung freigegeben';
  end if;
  return new;
end
$f$;
revoke all on function private.ff_market_bump_review_version() from public,anon,authenticated;
drop trigger if exists ff_market_extra_bump_review on public.ff_market_photos;
create trigger ff_market_extra_bump_review after insert on public.ff_market_photos
for each row execute function private.ff_market_bump_review_version();

-- Erweiterte Bilder: Upload NUR bei eigenen, noch ungeprüften Inseraten.
-- Der Dateipfad lässt höchstens vier zusätzliche JPEG-Dateien zu.
drop policy if exists ff_market_extra_storage_insert on storage.objects;
create policy ff_market_extra_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id='ff-market-photos'
  and private.is_active_adult((select auth.uid()))
  and exists (
    select 1 from public.ff_market_listings l
    where l.seller_id=(select auth.uid()) and l.moderation_status='pending'
      and name ~ ('^' || l.seller_id::text || '/' || l.id::text || '/[2-5][.]jpg$')
  )
);
drop policy if exists ff_market_extra_storage_read on storage.objects;
create policy ff_market_extra_storage_read on storage.objects for select to authenticated
using (
  bucket_id='ff-market-photos'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (private.is_active_adult((select auth.uid()))
      and exists(
        select 1 from public.ff_market_photos p
        join public.ff_market_listings l on l.id=p.listing_id
        where p.photo_path=name and l.moderation_status='approved'
        and private.is_active_adult(l.seller_id)
        and private.not_blocked((select auth.uid()),l.seller_id)
      ))
  )
);

create table if not exists public.ff_market_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.ff_market_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,listing_id)
);
create index if not exists ff_market_favorites_listing_idx on public.ff_market_favorites(listing_id);
alter table public.ff_market_favorites enable row level security;
revoke all on public.ff_market_favorites from public,anon,authenticated;
grant select,insert,delete on public.ff_market_favorites to authenticated;

drop policy if exists ff_market_favorites_read on public.ff_market_favorites;
create policy ff_market_favorites_read on public.ff_market_favorites for select to authenticated
using (user_id=(select auth.uid()));
drop policy if exists ff_market_favorites_add on public.ff_market_favorites;
create policy ff_market_favorites_add on public.ff_market_favorites for insert to authenticated
with check (
  user_id=(select auth.uid())
  and private.is_active_adult((select auth.uid()))
  and exists (
    select 1 from public.ff_market_listings l where l.id=listing_id
      and l.seller_id<>user_id and l.moderation_status='approved'
      and private.is_active_adult(l.seller_id)
      and private.not_blocked((select auth.uid()),l.seller_id)
  )
);
drop policy if exists ff_market_favorites_remove on public.ff_market_favorites;
create policy ff_market_favorites_remove on public.ff_market_favorites for delete to authenticated
using(user_id=(select auth.uid()));

-- Edit RPC is deliberately narrow: sellers may update their OWN listing content,
-- but editing unpublishes the listing; only server AI/moderation can approve it.
create or replace function public.ff_market_edit_listing(
  p_listing_id uuid, p_title text, p_description text,
  p_category text, p_item_condition text, p_trade_type text,
  p_price_cents integer, p_region_label text
) returns boolean
language plpgsql security definer
set search_path='' as $fn$
declare v_user uuid:=(select auth.uid());
begin
  if v_user is null or not private.is_active_adult(v_user) then
    return false;
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 4 and 100
    or p_description is null or char_length(p_description)>1500
    or p_category is null or p_category not in ('Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
    or p_item_condition is null or p_item_condition not in ('Neu','Sehr gut','Gut','Gebraucht')
    or p_trade_type is null or p_trade_type not in ('sell','gift','swap')
    or p_price_cents is null or p_price_cents not between 0 and 10000000
    or (p_trade_type<>'sell' and p_price_cents<>0)
    or p_region_label is null or char_length(p_region_label)>80 then
      return false;
  end if;
  update public.ff_market_listings set
    title=btrim(p_title),description=p_description,
    category=p_category,item_condition=p_item_condition,
    trade_type=p_trade_type,price_cents=p_price_cents,
    region_label=p_region_label,
    moderation_status='pending',review_version=review_version+1
  where id=p_listing_id and seller_id=v_user
    and moderation_status in ('pending','approved','rejected');
  return found;
end;
$fn$;
revoke all on function public.ff_market_edit_listing(uuid,text,text,text,text,text,integer,text)
from public,anon;
grant execute on function public.ff_market_edit_listing(uuid,text,text,text,text,text,integer,text) to authenticated;
comment on function public.ff_market_edit_listing(uuid,text,text,text,text,text,integer,text)
is 'Bearbeitung nur eigener Inserate; jede Änderung erfordert neue automatische/manuelle Freigabe.';

-- Existing sold closing RPC remains untouched.
