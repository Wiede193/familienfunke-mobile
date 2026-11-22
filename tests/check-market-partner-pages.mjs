import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../MarketPartnerPages.js',import.meta.url),'utf8');
const {MARKET_OWNER_PAGE_SIZE,PARTNER_PAGE_SIZE,marketCursor,partnerEventCursor,hasMarketPage}=
  await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(src));
assert.equal(MARKET_OWNER_PAGE_SIZE,30);
assert.equal(PARTNER_PAGE_SIZE,20);
assert.deepEqual(marketCursor([{id:'x',created_at:'2026-11-22T20:00:00Z'}]),
 {p_before_at:'2026-11-22T20:00:00Z',p_before_id:'x'});
assert.deepEqual(partnerEventCursor([{id:'e',starts_at:'2026-12-01T10:00:00Z'}]),
 {p_before_at:'2026-12-01T10:00:00Z',p_before_id:'e'});
assert.equal(marketCursor([]),null);assert.equal(partnerEventCursor([]),null);
assert.equal(hasMarketPage(Array(29),30),false);assert.equal(hasMarketPage(Array(30),30),true);
const sql=readFileSync(new URL('../database/ff_market_partner_pages_20261122.sql',import.meta.url),'utf8');
for(const fn of ['ff_my_market_page','ff_market_favorite_flags','ff_partner_orgs_page','ff_partner_events_page']){
 assert.ok(sql.includes('function public.'+fn),fn+' missing');
 assert.ok(sql.includes('grant execute on function public.'+fn),'Missing authenticated grant '+fn);
 assert.ok(sql.includes('revoke all on function public.'+fn),'Missing anon revoke '+fn);
}
assert.equal((sql.match(/security invoker/g)||[]).length,4,'RLS must remain active in all RPCs');
assert.ok(sql.includes('f.user_id=(select auth.uid())'),'Favorite flags must be private');
assert.ok(sql.includes('cardinality(p_listing_ids),0) between 1 and 40'),'Favorite lookup must stay bounded');
assert.ok(sql.includes('l.seller_id=(select auth.uid())'),'Seller listings must be private');
assert.ok(sql.includes("o.status='approved' or o.owner_id=(select auth.uid())"),'Unapproved organizations must not be visible to others');
console.log('Marketplace and partner page cursor/RLS source checks passed');
