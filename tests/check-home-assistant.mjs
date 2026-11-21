import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../HomeNavigation.js',import.meta.url),'utf8');
const {HOME_ROUTES,HOME_PAGE_IDS,findHomeRoutes}=await import(
  'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
assert.equal(HOME_ROUTES.length,12,'Expected 12 real, navigable functions');
assert.equal(new Set(HOME_PAGE_IDS).size,HOME_PAGE_IDS.length,'Page IDs must be unique');
for(const [phrase,id] of [
  ['Kistenmodus','box'],
  ['Paket erfassen','box'],
  ['einzelnen Artikel verkaufen','sell'],
  ['Spielplatz finden','map'],
  ['Familien kennenlernen','discover'],
  ['Profil bearbeiten','profile'],
  ['Nachrichten','contacts'],
  ['Kita','partners'],
  ['Treffen','events']
]){
  assert.equal(findHomeRoutes(phrase)[0]?.id,id,'Wrong landing page for: '+phrase);
}
assert.equal(findHomeRoutes('').length,4,'The home page should stay uncluttered');
assert.ok(findHomeRoutes('Datenschutz').some(x=>x.id==='profile'),'Privacy settings must be discoverable');

const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
assert.match(app,/useState\('home'\)/,'Home must be the initial signed-in tab');
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
