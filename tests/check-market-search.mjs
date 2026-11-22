import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const navSource=readFileSync(new URL('../HomeNavigation.js',import.meta.url),'utf8');
const {looksLikeMarketProductQuery,findHomeRoutes}=await import(
  'data:text/javascript;base64,'+Buffer.from(navSource).toString('base64')
);
for(const q of ['Kinderjeans Größe 110 blau','Kinderjeansgröße hundertzehn blau','Hose Größe 86 rot']){
  assert.ok(looksLikeMarketProductQuery(q),'Missing product detection: '+q);
  assert.equal(findHomeRoutes(q)[0]?.id,'market','Product question must open the bazaar: '+q);
}
assert.equal(findHomeRoutes('Spielplatz finden')[0]?.id,'map','Do not redirect play spaces to market');
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
const home=readFileSync(new URL('../HomeAssistant.jsx',import.meta.url),'utf8');
const sql=readFileSync(new URL('../database/ff_market_search_index.sql',import.meta.url),'utf8');
const ai=readFileSync(new URL('../supabase/functions/ff-app-assistant/index.ts',import.meta.url),'utf8');
assert.match(app,/const serverSearchActive=!onlyMine/,'Buyer catalog must be fully server-paginated');
assert.match(app,/supabase\.rpc\('ff_market_search'/,'Search must call secure server endpoint');
assert.match(app,/p_query:canonicalQuery/,'Search input must reach the DB');
assert.match(app,/p_offset:searchPage\*40/,'Results must be paginated');
assert.match(app,/Passender Artikel:/,'Show which package item matched');
assert.match(app,/entryIntent\?\.type!=='search'/,'Allow AI home to open the prefilled bazaar search');
assert.match(home,/looksLikeMarketProductQuery/,'Home direct function search must recognize products');
assert.match(home,/data\?\.search_query/,'AI must return precise product query');
assert.match(ai,/search_query:\{type:"string"\}/,'AI schema must contain normalized product search term');
assert.match(sql,/private\.not_blocked/,'Blocked sellers must never be returned');
assert.match(sql,/l\.moderation_status='approved'/,'Pending listings must stay private');
assert.match(sql,/private\.is_active_adult/,'Verify adults before sharing results');
assert.match(sql,/using gin\(search_vector\)/,'Use indexed full-text search');
assert.match(sql,/item_no integer/,'Index a package as separate item rows');
assert.match(sql,/x\.search_vector @@ words/,'All query terms must belong to one item');
console.log('Familienbasar KI- und Merkmalsuche: navigation, paginierte Suche und Schutzregeln geprüft.');
