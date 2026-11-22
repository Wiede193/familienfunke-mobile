import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../EventPhotoPages.js',import.meta.url),'utf8');
const {EVENT_PAGE_SIZE,PHOTO_PAGE_SIZE,ascendingEventCursor,descendingRowCursor,hasFullPage} =
  await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(js));
assert.equal(EVENT_PAGE_SIZE,20);assert.equal(PHOTO_PAGE_SIZE,20);
const events=[{id:'e1',starts_at:'2026-12-01T10:00:00Z'},{id:'e2',starts_at:'2026-12-01T10:00:00Z'}];
assert.deepEqual(ascendingEventCursor(events),{p_before_at:events[1].starts_at,p_before_id:'e2'});
assert.deepEqual(descendingRowCursor([{id:'p1',created_at:'2026-11-20T00:00:00Z'}]),{p_before_at:'2026-11-20T00:00:00Z',p_before_id:'p1'});
assert.deepEqual(descendingRowCursor([{requester_id:'u1',created_at:'X'}],'requester_id'),{p_before_at:'X',p_before_id:'u1'});
assert.equal(ascendingEventCursor([]),null);assert.equal(hasFullPage([],20),false);assert.equal(hasFullPage(Array(20),20),true);
const sql=readFileSync(new URL('../database/ff_events_photos_cursor_20261122.sql',import.meta.url),'utf8');
for(const fn of ['ff_events_page','ff_my_event_requests','ff_event_pending_page','ff_profile_photos_page']) {
  assert.ok(sql.includes('function public.'+fn));
  assert.ok(sql.includes('grant execute on function public.'+fn));
}
assert.equal((sql.match(/security invoker/g)||[]).length,4);
assert.ok(sql.includes('coalesce(cardinality(p_event_ids),0) between 1 and 20'));
assert.ok(sql.includes("r.status='requested'"));
console.log('Events and private photo cursor checks passed');
