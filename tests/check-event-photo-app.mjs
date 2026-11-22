import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
for(const rpc of ['ff_events_page','ff_my_event_requests','ff_event_pending_page','ff_profile_photos_page']){
 assert.ok(src.includes("supabase.rpc('"+rpc+"'"),'Missing on-demand RPC '+rpc);
}
for(const oldQuery of [
 "supabase.from('events').select('*').gt('ends_at'",
 "supabase.from('event_requests').select('*').limit(200)",
 "supabase.from('profile_photos').select('*').order('created_at'"
]) assert.ok(!src.includes(oldQuery),'Global startup query should be gone: '+oldQuery);
assert.ok(src.includes("const photoTarget=detailFamily||(tab==='profile'?me:null)"),'Never load all users photos on login');
assert.ok(src.includes("setDb(old=>({...old,photos:appendUniqueRows(old.photos,data)}))"),'Photo pagination must append');
assert.ok(src.includes('Weitere Profilfotos laden'));
assert.ok(src.includes('Weitere Familienbilder laden'));
assert.ok(src.includes('Weitere Veranstaltungen laden'));
assert.ok(src.includes('Weitere Anfragen laden'));
assert.ok(src.includes('Teilnahmeanfragen anzeigen'));
assert.ok(src.includes("requestEvent={(id)=>executeEvent("),'RSVP must not reload entire app');
assert.ok(src.includes("replyEvent={(id,requester,status)=>executeEvent("),'Organizer action must not reload entire app');
assert.ok(src.includes('function EventPendingPanel('));
assert.ok(src.includes("if(!open)return()=>{seqRef.current++;};"),'Organizer request list must be lazy');
assert.ok(src.includes("uploadProfilePhoto(asset,caption,me,executePhoto)"),'Upload refreshes photo scope');
assert.ok(src.includes("deleteProfilePhoto(id,me,db.photos,executePhoto)"),'Delete refreshes photo scope');
console.log('On-demand events and photos app checks passed');
