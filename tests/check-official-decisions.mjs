import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=await import('data:text/javascript;base64,'+
 Buffer.from(read('supabase/functions/ff-decision-sync/decision-rss-parse.js')).toString('base64'));
const {parseDecisions,safeSource,classifyFamilyDecision}=data;
const official={id:'bundesregierung-kabinett',name:'Bundesregierung',level:'bund',status:'kabinett'};
const brandenburg={id:'landtag-brandenburg-beschlossen',name:'Landtag Brandenburg',
 level:'brandenburg',status:'parlament'};
const now=Date.parse('2026-11-23T12:00:00Z');
const rss=items=>'<?xml version="1.0"?><rss><channel><title>Meldungen</title>'+items.join('')+'</channel></rss>';
const item=(title,link,date='Mon, 23 Nov 2026 08:00:00 GMT')=>
 '<item><title><![CDATA['+title+']]></title><link>'+link+
 '</link><pubDate>'+date+'</pubDate><description>Amtliche Information zum Thema.</description></item>';
const bund=parseDecisions(rss([
 item('Kabinett beschließt neue Kindergeldregeln','https://www.bundesregierung.de/breg-de/meldung-111'),
 item('Regierung informiert über Elterngeld','https://www.bundesregierung.de/breg-de/meldung-222'),
 item('Kabinett beschließt eine Kita-Reform','https://evil.example/meldung-333'),
 item('Kabinett beschließt alte Schulreform','https://www.bundesregierung.de/breg-de/meldung-alt','Mon, 01 Jan 2024 00:00:00 GMT')
]),official,now);
assert.equal(bund.length,1,'Only fresh, official, explicit cabinet decisions may be imported');
assert.equal(bund[0].family_topic,'kindergeld');
assert.equal(classifyFamilyDecision('Reform des Wohngeldgesetzes'),'wohnen');
assert.equal(classifyFamilyDecision('Elterngeld und Mutterschutz'),'elterngeld');
assert.equal(classifyFamilyDecision('Regierungssitzung zum Verkehrshaushalt'),null);
assert.equal(bund[0].decision_status,'kabinett','A cabinet decision must never be labeled law in force');
assert.equal(bund[0].editorial_reviewed,false,'No automatic invented simple-language summary');
assert.equal(bund[0].family_impact,null,'No speculative family impacts');
const bb=parseDecisions(rss([item('Beschlossenes Kita-Gesetz','https://www.landtag.brandenburg.de/dokumente/123')]),brandenburg,now);
assert.equal(bb[0].decision_status,'parlament');
assert.equal(bb[0].family_topic,'kita');
assert.equal(bb[0].level,'brandenburg');
assert.ok(safeSource('https://www.landtag.brandenburg.de/dokumente/a','landtag.brandenburg.de'));
assert.equal(safeSource('http://landtag.brandenburg.de','landtag.brandenburg.de'),false);
assert.equal(safeSource('https://www.landtag.brandenburg.de.evil.example/abc','landtag.brandenburg.de'),false);
assert.throws(()=>parseDecisions('<html></html>',official,now),/invalid_rss/);

const sql=read('database/ff_official_decisions.sql');
assert.match(sql,/alter table public.ff_official_decisions enable row level security/);
assert.match(sql,/alter table public.ff_decision_subscriptions enable row level security/);
assert.match(sql,/using \(\(select auth.uid\(\)\)=user_id\)/,'Subscription rows must be private');
assert.match(sql,/published=true/,'Only published source cards visible');
assert.match(sql,/decision_id uuid/,'Existing inbox must deep link to exact decisions');
assert.match(sql,/ff_decision_new_publication/,'Published decisions notify only consenting users');
assert.match(sql,/where s.enabled=true/,'Never notify without opt-in');
assert.match(sql,/p_kind in \('all','price','decision'\)/,'Decision inbox filter is required');
assert.match(sql,/when \(new.kind in \('match','request','message'\)\)/,'Do not misroute decisions to incomplete push pipeline');
assert.match(sql,/revoke all on public.ff_decision_sync_runs/,'Do not expose sync diagnostics to clients');

const ui=read('OfficialDecisionsScreen.jsx');
assert.match(ui,/Standardmäßig aus/);
assert.match(ui,/Push auf den Sperrbildschirm ist dafür noch nicht eingerichtet/);
assert.match(ui,/editorial_reviewed&&item.simple_summary/,'Unreviewed copy cannot masquerade as checked plain-language explanation');
assert.match(ui,/Amtliche Quelle öffnen/);
assert.match(ui,/Veröffentlichungsdatum ist nicht automatisch/);
const app=read('App.jsx');
assert.match(app,/tab==='decisions'\?<OfficialDecisionsScreen/);
assert.match(app,/row.kind==='decision'/);
assert.match(app,/setDecisionFocusId\(decision.id\)/);
const home=read('HomeAssistant.jsx');
assert.match(home,/ff_official_decisions/,'Global search must include published government decisions');
assert.match(home,/onNavigate\('decisions','',item.id\)/);
const menu=read('TopRightMenu.jsx');
assert.match(menu,/Beschlüsse einfach erklärt/);
const alerts=read('NotificationCenterScreen.jsx');
assert.match(alerts,/Amtliche Beschlüsse/);
assert.match(alerts,/Neuer amtlicher Beschluss/);
const edge=read('supabase/functions/ff-decision-sync/index.ts');
assert.match(edge,/ff_official_sync_authorized/,'Sync requires an existing secret validation');
assert.match(edge,/SOURCES/);
assert.match(edge,/ff_decision_sync_runs/);
assert.match(edge,/redirect:'manual'/,'RSS redirects are validated instead of followed automatically');
assert.match(edge,/safeSource\(target,allowed\)/,'Redirect targets must be verified before fetching');
assert.doesNotMatch(edge,/redirect:'follow'/,'Never follow unchecked external redirects');
assert.doesNotMatch(edge,/openai|GPT|responses\.create/i,'Ingestion never generates uncited political explanations');
const topicsSql=read('database/ff_decisions_family_topics.sql');
assert.match(topicsSql,/family_topic text not null default 'weitere'/);
assert.match(topicsSql,/topics text\[\] not null default '\{\}'/);
assert.match(topicsSql,/new.family_topic=any\(s.topics\)/,'Alerts must respect opted-in topics');
assert.match(topicsSql,/cardinality\(s.topics\)=0/,'No topic selection means all topics');
assert.match(topicsSql,/ff_official_decisions_source_url_unique/,'Same source URL may not create duplicate news');
const seed=read('database/ff_decisions_family_verified_20261123.sql');
for(const [term,status] of [['antragslosen Kindergeldes','verkuendet'],['Elterngeld und Mutterschutz','kabinett'],['Kita-Startchancengesetz','vermittlung'],['Kita-Pakt 2030','vereinbarung'],['Wohngeld','kabinett']]){
 assert.ok(seed.includes(term),'Missing article: '+term);
 assert.ok(seed.includes("'"+status+"'"),'Missing status: '+status);
}
assert.match(ui,/Hinweisthemen/);
assert.match(ui,/topic==='all'/);
assert.match(ui,/entscheidung|Entscheidung vom/);
assert.match(ui,/Vermittlung zwischen Bundestag und Bundesrat/);
const trackingParser=read('supabase/functions/ff-decision-track/status-parser.js');
const tracking=await import('data:text/javascript;base64,'+
 Buffer.from(trackingParser).toString('base64'));
assert.equal(tracking.sourceKindForUrl('https://www.bundesregierung.de/breg-de/aktuelles/example'),'website');
assert.equal(tracking.sourceKindForUrl('https://www.bundesregierung.de.attacker.example/fake'),null);
assert.equal(tracking.sourceKindForUrl('http://www.bundesregierung.de/breg-de/aktuelles/example'),null);
assert.equal(tracking.sourceKindForUrl('https://example.com'),null);
const dipBase={id:'338785',titel:'Startchancen- und Qualitätsentwicklungsgesetz',
 vorgangstyp:'Gesetzgebung',aktualisiert:'2026-11-23T10:15:00+01:00'};
const pending=tracking.parseDipVorgang({...dipBase,beratungsstand:'Abgeschlossen',
 inkrafttreten:[{datum:'2027-01-01'}]},'338785');
assert.equal(pending.proposedStatus,null,'Abgeschlossen is not proof of enactment');
const announced=tracking.parseDipVorgang({...dipBase,beratungsstand:'Im Vermittlungsausschuss'},'338785');
assert.equal(announced.proposedStatus,null,'An ambiguous DIP advisory status never auto-changes a bill');
const promulgated=tracking.parseDipVorgang({...dipBase,beratungsstand:'Verkündet',
 verkuendung:[{datum:'2026-11-23',fundstelle:'BGBl'}]},'338785');
assert.equal(promulgated.proposedStatus,'verkuendet');
assert.throws(()=>tracking.parseDipVorgang({...dipBase,id:'123456'},'338785'),/dip_unexpected_record/);
assert.throws(()=>tracking.parseDipVorgang({...dipBase,vorgangstyp:'Antrag'},'338785'),/dip_unexpected_record/);
assert.equal(tracking.normalizedOfficialText('<main><p>Gesetzesstand</p><script>evil()</script></main>'),
 'Gesetzesstand','Active markup must never be interpreted as legislation text');
const trackingSql=read('database/ff_decisions_status_tracking.sql');
for(const snippet of [
 'status_review_pending boolean not null default false',
 'ff_decision_change_candidates','ff_decision_source_snapshots',
 'ff_decision_status_history','ff_decision_history_notification',
 'ff_notification_decision_revision_unique','private.ff_confirm_decision_status',
 "where x.decision_id=d.id and x.review_state='pending'",
 'ff_decision_tracking_due'
])assert.ok(trackingSql.includes(snippet),'Missing tracking guard: '+snippet);
assert.match(trackingSql,/alter table public.ff_decision_change_candidates enable row level security/);
assert.match(trackingSql,/revoke all on public.ff_decision_change_candidates from public,anon,authenticated/);
assert.match(trackingSql,/grant execute on function public.ff_decision_tracking_due\(integer\) to service_role/);
assert.match(trackingSql,/p_kind='decision' and n.kind='decision_update'/);
assert.match(trackingSql,/new.event_kind='update' and new.status is distinct from new.previous_status/);
const trackEdge=read('supabase/functions/ff-decision-track/index.ts');
assert.match(trackEdge,/ff_official_sync_authorized/);
assert.match(trackEdge,/DIP_BUNDESTAG_API_KEY/);
assert.match(trackEdge,/ff_decision_tracking_due/);
assert.match(trackEdge,/redirect:'manual'/);
assert.match(trackEdge,/status_review_pending:true/);
assert.doesNotMatch(trackEdge,/decision_status\s*:/,'The monitor must not overwrite the verified public stage');
assert.doesNotMatch(trackEdge,/OPENAI_API_KEY|createCompletion|responses\.create/);
const schedule=read('database/ff_decision_tracking_schedule.sql');
assert.match(schedule,/ff_decision_track/);
assert.match(ui,/ff_decision_status_history/);
assert.match(ui,/status_review_pending/);
assert.match(ui,/Dieser Abruf bestätigt nicht automatisch den Rechtsstand/);
assert.match(app,/row.kind==='decision'\|\|row.kind==='decision_update'/);
assert.match(alerts,/decision_update:/);

console.log('Beschluss-Monitor: Quellenfilter, Verfahrensstand, Familienthemen, RLS und Hinweise geprüft');
