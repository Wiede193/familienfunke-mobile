-- Restricted staff-only preview and manually documented resolution of AI-ambiguous offers.
create or replace function private.ff_market_review_is_staff()
returns boolean language sql stable security definer set search_path='' as $fn$
  select exists(select 1 from private.admin_staff s
    where s.user_id=(select auth.uid()) and s.is_active=true
      and s.role in ('owner','moderator'));
$fn$;
revoke all on function private.ff_market_review_is_staff() from public,anon;
grant execute on function private.ff_market_review_is_staff() to authenticated;

create or replace function public.familienfunke_admin_market_photo_paths(p_listing_id uuid)
returns text[] language plpgsql stable security definer set search_path='' as $fn$
declare paths text[];
begin
 if not private.ff_market_review_is_staff() then
   raise exception 'Keine Admin-Berechtigung' using errcode='42501'; end if;
 if not exists (
   select 1 from public.ff_market_review_jobs j
   join public.ff_market_listings l on l.id=j.listing_id
   where l.id=p_listing_id and j.state='manual' and l.moderation_status='pending'
 ) then
   raise exception 'Nicht im Prüffall' using errcode='42501'; end if;
 select coalesce(array_agg(a.photo_path order by a.slot),'{}'::text[]) into paths
 from (
   select 1 as slot,l.photo_path from public.ff_market_listings l
    where l.id=p_listing_id and l.photo_path is not null
   union all
   select (p.slot+1)::integer,p.photo_path from public.ff_market_photos p
    where p.listing_id=p_listing_id
 ) a;
 return paths;
end $fn$;
revoke all on function public.familienfunke_admin_market_photo_paths(uuid) from public,anon;
grant execute on function public.familienfunke_admin_market_photo_paths(uuid) to authenticated;

drop policy if exists ff_market_admin_manual_preview on storage.objects;
create policy ff_market_admin_manual_preview on storage.objects
for select to authenticated using (
  bucket_id='ff-market-photos'
  and private.ff_market_review_is_staff()
  and exists (
    select 1 from public.ff_market_review_jobs j
    join public.ff_market_listings l on l.id=j.listing_id
    where j.state='manual' and l.moderation_status='pending'
      and (l.photo_path=name or exists (
        select 1 from public.ff_market_photos p
        where p.listing_id=l.id and p.photo_path=name
      ))
  )
);

create table if not exists private.ff_market_manual_decisions (
  id bigint generated always as identity primary key,
  listing_id uuid not null,
  reviewed_by uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','rejected')),
  review_version bigint not null,
  note text not null check (length(note) between 12 and 500),
  created_at timestamptz not null default now()
);
alter table private.ff_market_manual_decisions enable row level security;
revoke all on private.ff_market_manual_decisions from public,anon,authenticated;

create or replace function public.familienfunke_admin_market_decide(
 p_listing_id uuid,p_decision text,p_reason text,
 p_review_version bigint,p_confirmed boolean
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare l public.ff_market_listings%rowtype;
begin
 if not private.ff_market_review_is_staff() then
   raise exception 'Keine Admin-Berechtigung' using errcode='42501'; end if;
 if p_decision not in ('approved','rejected') or coalesce(p_confirmed,false)<>true
   or length(btrim(coalesce(p_reason,''))) not between 12 and 500
   then raise exception 'Ungültige Moderationsentscheidung' using errcode='22023'; end if;
 select * into l from public.ff_market_listings
 where id=p_listing_id for update;
 if not found or l.moderation_status<>'pending'
   or l.review_version is distinct from p_review_version
   or not exists (select 1 from public.ff_market_review_jobs j
     where j.listing_id=l.id and j.state='manual'
       and j.review_version=l.review_version)
 then raise exception 'Prüffall geändert oder abgeschlossen' using errcode='22023'; end if;
 if p_decision='approved' then
   if not private.is_active_adult(l.seller_id)
     or (l.organization_id is not null and not exists (
       select 1 from public.ff_organizations o where o.id=l.organization_id
       and o.status='approved' and o.owner_id=l.seller_id
     )) then
       raise exception 'Verkäufer ist nicht mehr berechtigt' using errcode='42501';
   end if;
 end if;
 insert into private.ff_market_manual_decisions(
   listing_id,reviewed_by,decision,review_version,note
 ) values (l.id,auth.uid(),p_decision,l.review_version,btrim(p_reason));
 update public.ff_market_listings set moderation_status=p_decision
 where id=l.id and moderation_status='pending' and review_version=l.review_version;
 if not found then raise exception 'Statuswechsel fehlgeschlagen' using errcode='22023'; end if;
 return jsonb_build_object('id',l.id,'status',p_decision);
end $fn$;
revoke all on function public.familienfunke_admin_market_decide(uuid,text,text,bigint,boolean)
from public,anon;
grant execute on function public.familienfunke_admin_market_decide(uuid,text,text,bigint,boolean)
to authenticated;
