import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../HomeNavigation.js',import.meta.url),'utf8');
const {HOME_ROUTES,HOME_PAGE_IDS,findHomeRoutes}=await import(
  'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
assert.equal(HOME_ROUTES.length,13,'Expected 13 real, navigable functions');
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
  ['Treffen','events']
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
assert.match(home,/onSubmitEditing=\{askAssistant\}/,'Search keyboard must submit questions');
assert.match(home,/findHomeRoutes\(needle\)/,'Direct local function search must remain available');
assert.match(home,/conversation\.slice\(0,3\)\.reverse\(\)/,'Assistant history must include recent replies in order');
assert.match(home,/setConversation\(old=>\[\{/,'Chat history must update after a successful reply');
assert.match(home,/rows\.filter\(row=>row\?\.listing\?\.moderation_status==='approved'\)/,
  'The assistant may preview only actual approved listings');
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
assert.match(app,/useState\('home'\)/,'Home must be the initial signed-in tab');
assert.match(app,/useEffect\(\(\)=>\{\s*setTab\('home'\)/,'After sign-in the homepage must not be overridden by bazaar');
assert.match(app,/tab==='home'\?<HomeAssistant/,'Assistant screen must be routed');
assert.match(app,/entryIntent==='box'/,'Box shortcut must launch actual box workflow');
assert.match(app,/entryIntent==='sell'/,'Sell shortcut must launch actual selling workflow');
assert.ok(!app.includes('OPENAI_API_KEY'),'No secret AI key in native app');

const server=readFileSync(new URL('../supabase/functions/ff-app-assistant/index.ts',import.meta.url),'utf8');
for(const id of HOME_PAGE_IDS)assert.ok(server.includes('"'+id+'"'),'Server must recognize page: '+id);
assert.match(server,/auth:"user"/,'The assistant endpoint must require authenticated users');
assert.match(server,/ff_app_assistant_claim/,'Budget check must be mandatory');
assert.match(server,/store:false/,'Do not opt in to provider response storage');
assert.match(server,/Cache-Control":"no-store"/,'Do not cache private answers');
console.log('KI-Startseite: navigation, deep links, privacy and API contracts passed');
