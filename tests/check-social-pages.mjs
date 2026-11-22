import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../SocialPages.js',import.meta.url),'utf8');
const { SOCIAL_PAGE_SIZE, socialCursor, hasNextSocialPage, appendUniqueRows } =
  await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
assert.equal(SOCIAL_PAGE_SIZE,40);
const pages=Array.from({length:40},(_,i)=>({id:String(i),created_at:'2026-11-22T18:00:00Z'}));
assert.deepEqual(socialCursor(pages),{p_before_at:'2026-11-22T18:00:00Z',p_before_id:'39'});
assert.deepEqual(socialCursor([{user_id:'a',created_at:'test'}],'user_id'),{p_before_at:'test',p_before_id:'a'});
assert.equal(socialCursor([]),null); assert.equal(hasNextSocialPage(pages),true);
assert.equal(hasNextSocialPage(pages.slice(0,39)),false);
assert.deepEqual(appendUniqueRows([{id:'a'},{id:'b'}],[{id:'b'},{id:'c'}]).map(x=>x.id),['a','b','c']);
assert.deepEqual(appendUniqueRows([{user_id:'a'}],[{user_id:'a'},{user_id:'b'}],'user_id').map(x=>x.user_id),['a','b']);
const sql=readFileSync(new URL('../database/ff_scoped_social_pages_20261122.sql',import.meta.url),'utf8');
for(const fn of ['ff_discover_page','ff_contacts_page','ff_chat_page']){
 assert.ok(sql.includes('public.'+fn)); assert.ok(sql.includes('grant execute on function public.'+fn));
}
assert.equal((sql.match(/security invoker/g)||[]).length,3,'Never bypass social RLS');
const previewSQL=readFileSync(new URL('../database/ff_chat_previews_20261122.sql',import.meta.url),'utf8');
assert.ok(previewSQL.includes('security invoker'));
assert.ok(previewSQL.includes('cardinality(p_contact_ids),0) between 1 and 50'));
assert.ok(previewSQL.includes("c.status='accepted'"));
assert.ok(previewSQL.includes('grant execute on function public.ff_chat_previews'));
console.log('Scoped social cursor and RLS source checks passed');
