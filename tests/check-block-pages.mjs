import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../BlockPages.js',import.meta.url),'utf8');
const {BLOCK_PAGE_SIZE,BLOCK_FLAG_MAX_IDS,blockPageCursor,visibleBlockTargets,mergeVisibleBlockFlags}=
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(BLOCK_PAGE_SIZE,30);
assert.equal(BLOCK_FLAG_MAX_IDS,120);
assert.deepEqual(blockPageCursor([]),null);
assert.deepEqual(blockPageCursor([{blocked_id:'a',created_at:'2026-11-22T17:00:00Z'}]),{
  p_before_at:'2026-11-22T17:00:00Z',p_before_id:'a'
});
assert.equal(blockPageCursor([{blocked_id:'a'}]),null);

const owner='owner',profiles=Array.from({length:40},(_,i)=>({user_id:'p-'+i}));
const contacts=Array.from({length:40},(_,i)=>({sender_id:owner,recipient_id:'c-'+i}));
const pinned={sender_id:'pinned',recipient_id:owner};
const ids=visibleBlockTargets(profiles,contacts,owner,pinned,'detail');
assert.equal(ids.length,82,'Bounded first-page flags should cover 40 discovery + 40 contacts + pin + detail');
assert.ok(ids.length<=BLOCK_FLAG_MAX_IDS);
assert.equal(new Set(ids).size,ids.length);
assert.ok(ids.includes('pinned')&&ids.includes('detail'));
assert.deepEqual(visibleBlockTargets([{user_id:owner}],[],owner),[],'Never query own identity');
assert.deepEqual(visibleBlockTargets([{user_id:'x'},{user_id:'x'}],[],owner),['x']);
assert.deepEqual(visibleBlockTargets([],[{sender_id:'other',recipient_id:'unrelated'}],owner),[],'Ignore unrelated contact rows');

const initial=mergeVisibleBlockFlags([],owner,['a','b','a'],[
  {blocked_id:'a'},{blocked_id:'a'},{blocked_id:'evil'}
]);
assert.deepEqual(initial,[{blocker_id:owner,blocked_id:'a'}]);
const next=mergeVisibleBlockFlags([...initial,{blocker_id:owner,blocked_id:'old'},
 {blocker_id:'different-owner',blocked_id:'hidden'}],owner,['a','b'],[{blocked_id:'b'}]);
assert.deepEqual(next,[{blocker_id:owner,blocked_id:'old'},{blocker_id:owner,blocked_id:'b'}],
  'Authoritative visible flags replace checked IDs, preserve offscreen current-owner flags and drop another account');
assert.deepEqual(mergeVisibleBlockFlags(next,owner,[],[]),next);
console.log('Blocks: bounded visible flags, cursor and cross-account replacement checks passed');
