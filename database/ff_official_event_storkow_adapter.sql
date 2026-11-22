-- Enable Storkow's municipally published event-card structure as a staged source.
-- Eberswalde's broad page currently exposes no compatible structured event feed.
alter table public.ff_official_event_sources
 drop constraint if exists ff_official_event_sources_format_check;
alter table public.ff_official_event_sources
 add constraint ff_official_event_sources_format_check
 check(format in ('jsonld','ics','html_storkow','xml_tmb'));
update public.ff_official_event_sources set format='html_storkow'
 where id='storkow-events' and url='https://www.storkow-mark.de/veranstaltungen/';
update public.ff_official_event_sources set enabled=false,
 last_error='Keine verifizierbare maschinenlesbare Veranstaltungsübersicht; Feed recherchieren'
 where id='eberswalde-events' and format='jsonld';
