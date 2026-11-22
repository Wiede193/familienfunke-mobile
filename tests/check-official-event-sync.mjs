import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const code=read('supabase/functions/ff-official-event-sync/event-source-parse.js');
const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const source={id:'storkow-events',url:'https://www.storkow-mark.de/veranstaltungen/',source_name:'Stadt Storkow (Mark)',source_kind:'municipality',district:'oder-spree',city:'Storkow (Mark)'};
const html='<script type="application/ld+json">'+JSON.stringify({
 '@context':'https://schema.org','@graph':[
  {'@type':'Event',name:'Familienfest am See',startDate:'2026-12-05T14:00:00+01:00',endDate:'2026-12-05T17:00:00+01:00',
   location:{'@type':'Place',name:'Stadtpark Storkow'},url:'https://www.storkow-mark.de/veranstaltungen/123456'},
  {'@type':'Event',name:'Kunstausstellung im Museum',startDate:'2026-12-05T10:00:00+01:00'},
  {'@type':'Event',name:'Fachvortrag für Erwachsene',startDate:'2026-12-05T19:00:00+01:00'},
  {'@type':'Event',name:'Kinderpuppentheater',startDate:'2026-12-07T14:00:00+01:00',
   url:'https://malicious.example.com/track'}
 ]})+'</script>';
const parsed=mod.parseJsonLdEvents(html,source.url);
assert.equal(parsed.length,4);
const normalized=await mod.normalizeEventCandidates(parsed,source,'2026-11-23');
assert.deepEqual(normalized.map(x=>x.title),['Familienfest am See','Kinderpuppentheater']);
assert.equal(normalized[0].start_date,'2026-12-05');
assert.equal(normalized[0].start_time,'14:00');
assert.equal(normalized[0].end_date,'2026-12-05');
assert.equal(normalized[1].source_url,source.url,'Offsite links must not be imported');
assert.match(normalized[0].fingerprint,/^[0-9a-f]{64}$/);
const second=await mod.normalizeEventCandidates(parsed,source,'2026-11-23');
assert.equal(normalized[0].fingerprint,second[0].fingerprint,'Stable source fingerprint');
const ics=['BEGIN:VCALENDAR','BEGIN:VEVENT','UID:family-123',
 'SUMMARY:Kinderflohmarkt im Bürgerzentrum',
 'DTSTART;TZID=Europe/Berlin:20261210T090000','DTEND;TZID=Europe/Berlin:20261210T130000',
 'LOCATION:Bürgerzentrum Beeskow','END:VEVENT','BEGIN:VEVENT',
 'UID:bad-99','SUMMARY:Erwachsenen Vernissage','DTSTART;VALUE=DATE:20261211',
 'DTEND;VALUE=DATE:20261213','END:VEVENT','BEGIN:VEVENT',
 'UID:cancel-17','SUMMARY:Familienfest im Park','DTSTART;VALUE=DATE:20261213',
 'DTEND;VALUE=DATE:20261215','STATUS:CANCELLED','END:VEVENT',
 'BEGIN:VEVENT','UID:repeat-01','SUMMARY:Familienfest monatlich',
 'DTSTART;VALUE=DATE:20261212','RRULE:FREQ=MONTHLY','END:VEVENT','END:VCALENDAR'].join('\r\n');
const raw=mod.parseIcsEvents(ics,source.url);
assert.equal(raw.length,3,'Recurring ICS entries skipped until occurrence expansion is verified');
assert.equal(raw[0].start_time,'09:00');
assert.equal(raw[2].end_date,'2026-12-14','All-day DTEND is exclusive');
assert.equal(raw[2].cancelled,true);
const cleaned=await mod.normalizeEventCandidates(raw,source,'2026-11-23');
assert.equal(cleaned.length,2,'No adult exhibition');
assert.equal(cleaned[1].cancelled,true);
const old=await mod.normalizeEventCandidates(parsed,source,'2027-01-01');
assert.equal(old.length,0,'Past events excluded');
assert.equal(mod.candidateFamilyEligible('Ausstellung für Kinder im Museum'),false);
assert.equal(mod.candidateFamilyEligible('Kabarett mit Familienpublikum'),false);
const main=read('supabase/functions/ff-official-event-sync/index.ts');
const persistence=read('supabase/functions/ff-official-event-sync/source-sync-store.js');
const schema=read('database/ff_official_event_ingestion.sql');
assert.match(main,/ff_official_sync_authorized/);
assert.match(main,/x-ff-official-sync/);
assert.match(main,/allowedHosts|const hosts=new Set/);
assert.match(main,/redirect:'error'/);
assert.match(main,/ff_official_event_sources/);
assert.match(main,/ff_official_event_sync_runs/);
assert.doesNotMatch(main,/\.update\(\{published:true\}\)/);
assert.match(persistence,/review_state:'pending'|:'pending'/);
assert.match(persistence,/published:false/);
assert.match(schema,/enable row level security/g);
assert.match(schema,/grant execute on function public\.ff_official_sync_authorized\(text\) to service_role/);
assert.doesNotMatch(schema,/grant (insert|update|all) on public\.ff_official_event_candidates to authenticated/);
assert.match(schema,/private\.ff_approve_official_candidate/);
assert.match(read('database/ff_official_family_events.sql'),/source_url ~ '\^https:\/\/\[\^ \]\+\$'/);
console.log('Official event sync: verified structured event parsing, safe URL handling, dates, review queue, RLS and cancellation checks.');
