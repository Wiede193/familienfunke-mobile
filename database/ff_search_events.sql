-- Search approved upcoming events through the caller's existing RLS permissions.
-- Return only the information needed for a result card, not organizer identities.
create or replace function public.ff_search_events(p_query text)
returns table(id uuid,kind text,title text,region_label text,starts_at timestamptz)
language plpgsql stable security invoker set search_path='' as $$
declare q text; terms text[];
begin
 if auth.uid() is null or p_query is null or char_length(p_query) not between 2 and 160 then return;end if;
 q:=btrim(regexp_replace(replace(translate(lower(p_query),'äöü','aou'),'ß','ss'),'[^a-z0-9]+',' ','g'));
 if length(q)<2 then return;end if;
 select coalesce(array_agg(distinct token),'{}'::text[]) into terms
 from regexp_split_to_table(q,' +') as token
 where length(token)>=2 and token not in ('in','im','am','an','bei','bei','der','die','das','den','dem','und','fur','mit','suche','suchen','finden','bitte','zeige','mir','wo','gibt','es','veranstaltungen','veranstaltung','termine','termin','events','event');
 if cardinality(terms)>12 then return;end if;
 if cardinality(terms)=0 and q not in ('veranstaltung','veranstaltungen','termin','termine','event','events') then return;end if;
 return query
 with candidates as (
  select e.id,'family'::text as kind,e.title,e.region_label,e.starts_at,
   replace(translate(lower(concat_ws(' ',e.title,e.region_label,e.description,'Treffen Veranstaltung')),'äöü','aou'),'ß','ss') as search_text
  from public.events e where e.moderation_status='approved' and e.starts_at>statement_timestamp()
  union all
  select e.id,'partner'::text,e.title,e.region_label,e.starts_at,
   replace(translate(lower(concat_ws(' ',e.title,e.region_label,e.description,'Kita Partner Veranstaltung')),'äöü','aou'),'ß','ss')
  from public.ff_partner_events e where e.moderation_status='approved' and e.starts_at>statement_timestamp()
 )
 select c.id,c.kind,c.title,c.region_label,c.starts_at from candidates c
 where not exists(select 1 from unnest(terms) t where strpos(c.search_text,t)=0)
 order by c.starts_at,c.kind,c.id limit 12;
end $$;
revoke all on function public.ff_search_events(text) from public,anon,authenticated;
grant execute on function public.ff_search_events(text) to authenticated;
create index if not exists ff_events_approved_upcoming on public.events(starts_at) where moderation_status='approved';
create index if not exists ff_partner_events_approved_upcoming on public.ff_partner_events(starts_at) where moderation_status='approved';
