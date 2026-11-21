-- Familienfunke: indexierte Merkmalsuche für Einzelanzeigen und Teile IN Paketen.
-- Die private Tabelle enthält ausschließlich aus Verkäuferangaben abgeleiteten Suchtext.
-- Kein Zugriff auf unveröffentlichte Anzeigen über die öffentliche Suchfunktion.

create table if not exists private.ff_market_search_items (
  listing_id uuid not null references public.ff_market_listings(id) on delete cascade,
  item_no integer not null check (item_no between 1 and 10),
  item_name text not null,
  category text not null,
  size_label text not null default '',
  color_label text not null default '',
  item_text text not null,
  search_vector tsvector generated always as
    (to_tsvector('german'::regconfig, item_text)) stored,
  primary key (listing_id,item_no)
);
alter table private.ff_market_search_items enable row level security;
revoke all on private.ff_market_search_items from public,anon,authenticated;
create index if not exists ff_market_search_items_fts_idx
 on private.ff_market_search_items using gin(search_vector);
create index if not exists ff_market_search_items_category_size_idx
 on private.ff_market_search_items(category,size_label);

-- Keine semantisch unberechtigte Alters-/Größenschätzung. Wörter wie "Größe"
-- sind Suchanweisungen, nicht notwendige Merkmale eines Artikels.
create or replace function private.ff_market_normalize_query(p_value text)
returns text language plpgsql immutable set search_path='' as $fn$
declare s text;
begin
  s:=lower(left(coalesce(p_value,''),160));
  s:=replace(s,'kinderjeans','jeans');
  s:=replace(s,'babyjeans','jeans');
  s:=replace(s,'kinderhosen','hosen');
  s:=replace(s,'kinderhose','hose');
  s:=replace(s,'kinderjacke','jacke');
  s:=replace(s,'kinderpullover','pullover');
  s:=replace(s,'kinderbody','body');
  s:=regexp_replace(s,'\m(ich|wir|suche|suchen|such|brauche|brauchen|möchte|moechte|bitte|zeige|zeig|mir|finde|finden|eine|einen|einer|ein|der|die|das|den|in|mit|für|fuer|von|größe|groesse|groß|gr)\M',' ','g');
  s:=regexp_replace(s,'[^[:alnum:]äöüß]+',' ','g');
  return btrim(regexp_replace(s,'[[:space:]]+',' ','g'));
end;
$fn$;
revoke all on function private.ff_market_normalize_query(text) from public,anon,authenticated;

-- Trust only the actual saved listing text. Text is seller-provided, not certified as true.
-- In package descriptions, individual numbered rows are indexed SEPARATELY:
-- Size 110 in one row cannot falsely match blue jeans in another row.
create or replace function private.ff_market_rebuild_search(
  p_listing_id uuid,p_category text,p_title text,p_description text
) returns void language plpgsql security definer set search_path='' as $fn$
declare
  inventory text;
  source_line text;
  line_text text;
  item_size text;
  item_color text;
  item_category text;
  i integer:=0;
begin
  delete from private.ff_market_search_items where listing_id=p_listing_id;
  if strpos(coalesce(p_description,''),'Paketinhalt:' )>0 then
    inventory:=split_part(split_part(p_description,'Paketinhalt:',2),E'\n\nPersönliche Ergänzung:',1);
    for source_line in select regexp_split_to_table(inventory,E'\n') loop
      exit when i>=10;
      if source_line !~ '^[[:space:]]*[0-9]{1,2}[.] [^[:cntrl:]]{4,150}$' then continue; end if;
      line_text:=btrim(regexp_replace(source_line,'^[[:space:]]*[0-9]{1,2}[.][[:space:]]*','',''));
      if length(line_text)<4 then continue; end if;
      i:=i+1;
      item_size:=coalesce((regexp_match(line_text,'\mGr[.][[:space:]]*([0-9]{2,3}[A-Za-z]?)\M'))[1],'');
      if item_size<>'' then
        item_color:=btrim(split_part(line_text,' · ',3));
      else
        item_color:=btrim(split_part(line_text,' · ',2));
      end if;
      item_color:=left(item_color,45);
      if item_color like 'Gr.%' then item_color:=''; end if;
      item_category:=p_category;
      if p_category='Sonstiges' and lower(line_text) ~
         '(jeans|hose|body|strampler|shirt|pullover|hoodie|jacke|leggings|kleid|rock|schlafanzug|schuh|mütze|muetze|shorts)' then
        item_category:='Kleidung';
      end if;
      insert into private.ff_market_search_items
        (listing_id,item_no,item_name,category,size_label,color_label,item_text)
      values (p_listing_id,i,left(line_text,150),item_category,item_size,item_color,
        left(line_text||' '||item_category,450));
    end loop;
  end if;
  if i=0 then
    -- One advertised item: title, category and confirmed seller facts form one unit.
    line_text:=left(coalesce(p_title,'')||' '||coalesce(p_description,'')||' '||coalesce(p_category,''),1600);
    item_size:=coalesce((regexp_match(coalesce(p_description,''), E'(?m)^Größe: ([^\\n]+)'))[1],'');
    if item_size='' then
      item_size:=coalesce((regexp_match(coalesce(p_title,''),'\mGr[.][[:space:]]*([0-9]{2,3}[A-Za-z]?)\M'))[1],'');
    end if;
    item_color:=coalesce((regexp_match(coalesce(p_description,''),E'(?m)^Farbe: ([^\\n]+)'))[1],'');
    insert into private.ff_market_search_items
      (listing_id,item_no,item_name,category,size_label,color_label,item_text)
    values(p_listing_id,1,left(coalesce(p_title,''),150),p_category,
      left(item_size,40),left(item_color,45),line_text);
  end if;
end;
$fn$;
revoke all on function private.ff_market_rebuild_search(uuid,text,text,text)
  from public,anon,authenticated;

create or replace function private.ff_market_search_refresh_trigger()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
  perform private.ff_market_rebuild_search(new.id,new.category,new.title,new.description);
  return new;
end;
$fn$;
revoke all on function private.ff_market_search_refresh_trigger() from public,anon,authenticated;

drop trigger if exists ff_market_search_refresh on public.ff_market_listings;
create trigger ff_market_search_refresh
after insert or update of title,description,category
on public.ff_market_listings
for each row execute function private.ff_market_search_refresh_trigger();

-- Populate existing records without changing their moderation status or review version.
select private.ff_market_rebuild_search(l.id,l.category,l.title,l.description)
from public.ff_market_listings l;

-- Search only approved, unblocked listings, enforce existing adult membership rules.
-- SECURITY DEFINER is necessary because the derived GIN index lives in private schema;
-- all published-listing authorization predicates are repeated here explicitly.
create or replace function public.ff_market_search(
 p_query text default '',
 p_category text default 'Alle',
 p_trade_type text default 'all',
 p_min_cents integer default null,
 p_max_cents integer default null,
 p_favorites_only boolean default false,
 p_sort text default 'newest',
 p_limit integer default 40,
 p_offset integer default 0
) returns table(listing public.ff_market_listings,match_item text,rank real)
language plpgsql stable security definer set search_path='' as $fn$
declare
  uid uuid:=(select auth.uid());
  terms text:=private.ff_market_normalize_query(p_query);
  words tsquery;
begin
  if uid is null or not private.is_active_adult(uid) then return; end if;
  if p_query is null or length(p_query)>160
    or coalesce(p_category,'Alle') not in ('Alle','Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges')
    or coalesce(p_trade_type,'all') not in ('all','sell','gift','swap')
    or coalesce(p_sort,'newest') not in ('newest','low','high','relevance')
    or p_limit not between 1 and 60 or p_offset not between 0 and 20000
    or (p_min_cents is not null and p_min_cents<0)
    or (p_max_cents is not null and p_max_cents>10000000)
  then return; end if;
  words:=case when terms='' then null else pg_catalog.plainto_tsquery('german'::regconfig,terms) end;
  return query
  select l as listing,
         case when words is null then ''::text else i.item_name end as match_item,
         i.score as rank
  from public.ff_market_listings l
  join lateral (
    select x.item_name,
      case when words is null then 0::real else pg_catalog.ts_rank(x.search_vector,words) end as score
    from private.ff_market_search_items x
    where x.listing_id=l.id
      and (p_category='Alle' or x.category=p_category)
      and (words is null or x.search_vector @@ words)
    order by score desc,x.item_no asc limit 1
  ) i on true
  where l.moderation_status='approved'
    and private.is_active_adult(l.seller_id)
    and private.not_blocked(uid,l.seller_id)
    and (p_trade_type='all' or l.trade_type=p_trade_type)
    and (p_min_cents is null or (l.trade_type='sell' and l.price_cents>=p_min_cents))
    and (p_max_cents is null or (l.trade_type='sell' and l.price_cents<=p_max_cents))
    and (not p_favorites_only or exists(
      select 1 from public.ff_market_favorites f where f.user_id=uid and f.listing_id=l.id
    ))
  order by
    case when p_sort='low' then l.price_cents end asc nulls last,
    case when p_sort='high' then l.price_cents end desc nulls last,
    case when p_sort in ('relevance','newest') and words is not null then i.score end desc nulls last,
    l.created_at desc,l.id desc
  limit p_limit offset p_offset;
end;
$fn$;
revoke all on function public.ff_market_search(text,text,text,integer,integer,boolean,text,integer,integer)
from public,anon;
grant execute on function public.ff_market_search(text,text,text,integer,integer,boolean,text,integer,integer)
to authenticated;
comment on function public.ff_market_search(text,text,text,integer,integer,boolean,text,integer,integer)
is 'Indexed verified-family marketplace search; each package item must independently match every query term.';
