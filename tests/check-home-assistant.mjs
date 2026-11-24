import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../HomeNavigation.js',import.meta.url),'utf8');
const {HOME_ROUTES,HOME_PAGE_IDS,findHomeRoutes}=await import(
  'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
assert.equal(HOME_ROUTES.length,21,'Expected 21 real, navigable functions');
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
  ['Sportverein','healthy'],
  ['Bundestag Beschluss','decisions'],
  ['gesunde Ernährung','healthy'],
  ['Wanderwege','map'],
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
assert.match(home,/FEATURED=\['discover','map','market','guide'\]/,'Four clear family activities');
assert.match(home,/ref=\{scrollRef\}/,'Suggestions must return to the input');
assert.match(home,/showAll\?moreRoutes\.map/,'The user must reach all real app areas');
assert.match(home,/onSubmitEditing=\{searchApp\}/,'Search keyboard must submit ordinary search, not charge AI');
assert.match(home,/findHomeRoutes\(needle\)/,'Direct local function search must remain available');
assert.match(home,/answerFamilyQuestion\(prompt/,'Knowledge replies must come from the local answer engine');
assert.match(home,/setConversation\(old=>\[\{/,'Chat history must update after a successful reply');
assert.match(home,/entry\.sources\.map/,'Verified source links must be shown');
assert.doesNotMatch(home,/functions\.invoke\('ff-app-assistant'/,'Knowledge answers must never invoke the priced model');
assert.match(home,/onPress=\{\(\)=>askAssistant\(\)\}/,'Answer button must invoke the function without passing a press event as question');
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
assert.match(server,/if\(true\)return response\(\{error:"Kostenpflichtige KI/,'Server must block paid AI during development');
console.log('Offline-Wissensstartseite: Navigation, geprüfte Quellen und gesperrte Modellaufrufe geprüft');
