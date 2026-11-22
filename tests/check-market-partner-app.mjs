import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
for(const name of ['ff_my_market_page','ff_market_favorite_flags','ff_partner_orgs_page','ff_partner_events_page']) {
 assert.ok(app.includes("supabase.rpc('"+name+"'"),'Missing '+name);
}
assert.ok(!app.includes("supabase.from('ff_market_listings').select('*').eq('seller_id',me).order('created_at',{ascending:false}).limit(160)"));
assert.ok(!app.includes("supabase.from('ff_organizations').select('*').order('created_at',{ascending:false}).limit(100)"));
assert.ok(!app.includes("supabase.from('ff_partner_events').select('*').gt('starts_at',new Date().toISOString()).order('starts_at',{ascending:true}).limit(100)"));
assert.ok(!app.includes("favorites.map(x=>x.listing_id)"),'No global favorite set');
assert.ok(app.includes('Weitere eigene Anzeigen laden'));
assert.ok(app.includes('Weitere Einrichtungen laden'));
assert.ok(app.includes('Weitere Partnerveranstaltungen laden'));
assert.ok(app.includes('setFavoriteMap(old=>({...old,...Object.fromEntries(ids.map(id=>[id,flags.has(id)]))}))'));
assert.ok(app.includes('onPress={()=>changeFavorite(selected.id)}'),'Favoriting a selected listing must use fresh server state');
assert.ok(app.includes('const allMarketOrganizations=organizations.concat(remoteOrganizations)'),'Seller orgs should stay visible');
assert.ok(app.includes("pinnedMarketListingId&&!data.some"),'Older own listing must be reachable from inbox');
assert.ok(app.includes('executeMarket(fn,success)'),'Owned listing mutation must refresh own data');
console.log('Marketplace and partner on-demand app checks passed');
