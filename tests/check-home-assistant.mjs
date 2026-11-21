import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../HomeNavigation.js',import.meta.url),'utf8');
const {HOME_ROUTES,HOME_PAGE_IDS,findHomeRoutes}=await import(
  'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
assert.equal(HOME_ROUTES.length,19,'Expected 19 real, navigable functions');
assert.equal(new Set(HOME_PAGE_IDS).size,HOME_PAGE_IDS.length,'Page IDs must be unique');
for(const [phrase,id] of [
  ['Kistenmodus','box'],
  ['Paket erfassen','box'],
  ['einzelnen Artikel verkaufen','sell'],
  ['Spielplatz finden','map'],
  ['Wochenendausflug planen','outing'],
  ['Familien kennenlernen','discover'],
  ['Profil bearbeiten','profile'],
  ['Nachrichten','contacts'],
  ['Kita','partners'],
  ['Treffen','events'],
  ['Kinderhose','market'],
  ['Benachrichtigungen löschen','inbox'],
  ['Push deaktivieren','push'],
  ['Chat','chat'],
  ['Mein Familienkalender','calendar'],
  ['Familienquiz','play'],
  ['Rätsel','play']
]){
  assert.equal(findHomeRoutes(phrase)[0]?.id,id,'Wrong landing page for: '+phrase);
}
assert.equal(findHomeRoutes('').length,4,'The home page should stay uncluttered');
assert.equal(findHomeRoutes('Passwort ändern')[0]?.id,'profile','Password settings must be discoverable');
assert.equal(findHomeRoutes('Kinderwagen kaufen')[0]?.id,'market','Items should point to the bazaar');
assert.equal(findHomeRoutes('Spielplätze finden')[0]?.id,'map','Play spaces must open the map');
assert.equal(findHomeRoutes('Kindergarten')[0]?.id,'partners','Kitas must open partner world');
assert.equal(findHomeRoutes('Kinderwagen verkaufen')[0]?.id,'sell','Selling a product must not open buyer search');
assert.equal(findHomeRoutes('Personen in meiner Nähe suchen')[0]?.id,'discover','People nearby should open family discovery');
assert.ok(findHomeRoutes('Datenschutz').some(x=>x.id==='profile'),'Privacy settings must be discoverable');

const home=readFileSync(new URL('../HomeAssistant.jsx',import.meta.url),'utf8');
assert.match(home,/function SunMark\(/,'Hero must use simple illustrated sun, not generic AI stock imagery');
assert.match(home,/FEATURED=\['discover','map','market','box'\]/,'Four clear family activities');
assert.match(home,/ref=\{scrollRef\}/,'Suggestions must return to the input');
assert.match(home,/showAll\?moreRoutes\.map/,'The user must reach all real app areas');
assert.match(home,/onSubmitEditing=\{searchApp\}/,'Search keyboard must submit ordinary search, not charge AI');
assert.match(home,/findHomeRoutes\(needle\)/,'Direct local function search must remain available');
assert.match(home,/conversation\.slice\(0,3\)\.reverse\(\)/,'Assistant history must include recent replies in order');
assert.match(home,/setConversation\(old=>\[\{/,'Chat history must update after a successful reply');
assert.match(home,/rows\.filter\(row=>row\?\.listing\?\.moderation_status==='approved'\)/,
  'The assistant may preview only actual approved listings');
assert.match(home,/onPress=\{askAssistant\}/,'AI calls require explicit action');
assert.match(home,/borderRadius:30,backgroundColor:C\.paper/,'Search bar should be the rounded central control');
assert.match(home,/findFamilyMapLocations\(needle/,'Real catalog places are searchable from home');
assert.match(home,/onNavigate\('map','',hit\.place\.id\)/,'Map result opens exact real destination');
assert.match(home,/request!==requestSeq\.current/,'Stale results cannot overwrite current search');
const ordinary=home.slice(home.indexOf('async function searchApp()'),home.indexOf('return <ScrollView'));
assert.match(ordinary,/ff_market_search/,'Ordinary search finds approved bazaar offers');
assert.doesNotMatch(ordinary,/functions\.invoke|ff-app-assistant/,'Normal search never invokes priced AI service');
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
assert.match(app,/useState\('home'\)/,'Home must be the initial signed-in tab');
assert.match(app,/useEffect\(\(\)=>\{\s*setTab\('home'\)/,'After sign-in the homepage must not be overridden by bazaar');
assert.match(app,/tab==='home'\?<HomeAssistant/,'Assistant screen must be routed');
assert.match(app,/if\(id==='inbox'\)\{openInbox\(\);return;\}/,'Inbox search leads to real private inbox');
assert.match(app,/setMapIntent\(id==='map'&&typeof placeId==='string'\?/,'Map selection is passed through navigation');
assert.match(app,/entryIntent==='box'/,'Box shortcut must launch actual box workflow');
assert.match(app,/entryIntent==='sell'/,'Sell shortcut must launch actual selling workflow');
assert.ok(!app.includes('OPENAI_API_KEY'),'No secret AI key in native app');

const eventSql=readFileSync(new URL('../database/ff_search_events.sql',import.meta.url),'utf8');
assert.match(eventSql,/security invoker/);
assert.match(eventSql,/from public\.events e where e\.moderation_status='approved' and e\.starts_at>statement_timestamp\(\)/);
assert.match(eventSql,/from public\.ff_partner_events e where e\.moderation_status='approved' and e\.starts_at>statement_timestamp\(\)/);
assert.match(eventSql,/limit 12/);
assert.match(eventSql,/revoke all on function public\.ff_search_events\(text\) from public,anon,authenticated/);
assert.match(ordinary,/ff_search_events/);
assert.match(ordinary,/Promise\.allSettled/);
assert.match(home,/onNavigate\(event\.kind==='family'\?'events':'partners','',event\.id\)/);
assert.match(app,/useFocusedEvent\('events',focusId,me\)/);
assert.match(app,/useFocusedEvent\('ff_partner_events',focusId,me\)/);
assert.match(app,/\.eq\('id',id\)\.eq\('moderation_status','approved'\)\.gt\('starts_at'/);
assert.match(app,/state\.id===id&&state\.owner===owner/);
assert.match(app,/eventIntent\?\.owner===me/);
assert.match(app,/Alle Veranstaltungen anzeigen/);
const server=readFileSync(new URL('../supabase/functions/ff-app-assistant/index.ts',import.meta.url),'utf8');
for(const id of HOME_PAGE_IDS)assert.ok(server.includes('"'+id+'"'),'Server must recognize page: '+id);
assert.match(server,/auth:"user"/,'The assistant endpoint must require authenticated users');
assert.match(server,/ff_app_assistant_claim/,'Budget check must be mandatory');
assert.match(server,/store:false/,'Do not opt in to provider response storage');
assert.match(server,/Cache-Control":"no-store"/,'Do not cache private answers');
console.log('KI-Startseite: navigation, deep links, privacy and API contracts passed');

const personal=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../HomePersonalization.js',import.meta.url),'utf8')).toString('base64'));
const {recommendHome,sanitizeHomePrefs,sameHomeRegion}=personal;
const now=Date.parse('2026-11-21T12:00:00Z');
const profile={user_id:'a',region_label:'Frankfurt (Oder)',interests:['Tiere','Lesen']};
const fixture={profile,prefs:{enabled:true,ages:['school']},userId:'a',active:true,now,places:[
 {id:'curated-wildpark-frankfurt',source:'curated',title:'Wildpark',region_label:'Frankfurt (Oder)'},
 {id:'far',source:'national',title:'Fern',region_label:'Frankfurt am Main'}
],events:[
 {id:'future',moderation_status:'approved',starts_at:'2026-11-25T12:00:00Z',region_label:profile.region_label},
 {id:'past',moderation_status:'approved',starts_at:'2026-11-20T12:00:00Z',region_label:profile.region_label},
 {id:'pending',moderation_status:'pending',starts_at:'2026-11-25T12:00:00Z',region_label:profile.region_label}
],listings:[
 {id:'book',seller_id:'b',category:'Bücher',moderation_status:'approved'},
 {id:'own',seller_id:'a',category:'Bücher',moderation_status:'approved'},
 {id:'pending',seller_id:'b',category:'Bücher',moderation_status:'pending'},
 {id:'unrelated',seller_id:'b',category:'Kleidung',moderation_status:'approved'}
],ideas:[{title:'Geräusche-Rätsel',duration:'5 Minuten'}]};
const rec=recommendHome(fixture);
assert.deepEqual(rec.places.map(x=>x.id),['curated-wildpark-frankfurt']);
assert.deepEqual(rec.events.map(x=>x.id),['future']);
assert.deepEqual(rec.offers.map(x=>x.id),['book']);
assert.equal(rec.quiz,'school');assert.equal(rec.activity.title,'Geräusche-Rätsel');
for(const patch of [{prefs:{enabled:false,ages:['school']}},{userId:'other'}]){
 const r=recommendHome({...fixture,...patch});
 assert.ok(!r.places.length&&!r.events.length&&!r.offers.length&&!r.quiz&&!r.activity);
}
const inactive=recommendHome({...fixture,active:false});assert.ok(!inactive.events.length&&!inactive.offers.length);
const baby=recommendHome({...fixture,prefs:{enabled:true,ages:['baby']}});assert.ok(!baby.quiz&&!baby.activity);
assert.ok(sameHomeRegion('Landkreis Oder-Spree','Beeskow'));
assert.ok(!sameHomeRegion('Frankfurt (Oder)','Frankfurt am Main'));
assert.deepEqual(sanitizeHomePrefs({enabled:true,ages:['baby','bad','baby']}),{enabled:true,ages:['baby']});
assert.equal(personal.DEFAULT_HOME_PREFS.enabled,false);
const personalization=readFileSync(new URL('../PersonalizedHome.jsx',import.meta.url),'utf8');
assert.match(personalization,/preview=ranked\.slice\(0,3\)/,'No more than three initial tips');
assert.match(personalization,/\{expanded\?<View/);
assert.match(personalization,/\{editing\?<View/);
assert.match(personalization,/AsyncStorage\.removeItem\(key\)/,'Opt-out clears local age data');
assert.doesNotMatch(personalization,/functions\.invoke|supabase|fetch\(/,'No additional network requests');
assert.match(home,/!needle&&!conversation\.length\?<PersonalizedHome/,'Search and assistant replies take priority');
assert.match(home,/!needle&&showAll\?<View/);
assert.match(app,/profile=\{myProfile\?\.user_id===me\?myProfile:null\}/);
console.log('Personalization: regional relevance, approvals, local opt-in, account isolation and compact preview passed');
