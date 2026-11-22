import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {selectHomeHighlights}=await import('data:text/javascript;base64,'+Buffer.from(read('HomePersonalization.js')).toString('base64'));
const now=Date.parse('2026-12-01T12:00:00Z');
const p={userId:'me',active:true,now,profile:{region_label:'Frankfurt (Oder)'},matchingProfiles:[
 {user_id:'friend',display_name:'Familie Eins',moderation_status:'approved',is_discoverable:true,region_label:'Frankfurt (Oder)'},
 {user_id:'blocked',display_name:'Blockiert',moderation_status:'approved',is_discoverable:true,region_label:'Frankfurt (Oder)'},
 {user_id:'unapproved',display_name:'Ungeprüft',moderation_status:'pending',is_discoverable:true,region_label:'Frankfurt (Oder)'},
 {user_id:'hidden',display_name:'Verborgen',moderation_status:'approved',is_discoverable:false,region_label:'Frankfurt (Oder)'}
 ],contacts:[{sender_id:'me',recipient_id:'friend',status:'accepted'},{sender_id:'friend',recipient_id:'me',status:'pending'},{sender_id:'blocked',recipient_id:'me',status:'pending'}],blocks:[{blocker_id:'me',blocked_id:'blocked'}],events:[
 {id:'1',organizer_id:'friend',visibility:'contacts',moderation_status:'approved',region_label:'Frankfurt (Oder)',title:'Treffen',starts_at:'2026-12-03T12:00:00Z',ends_at:'2026-12-03T14:00:00Z'},
 {id:'2',organizer_id:'blocked',visibility:'community',moderation_status:'approved',region_label:'Frankfurt (Oder)',title:'Blockiert',starts_at:'2026-12-02T12:00:00Z',ends_at:'2026-12-02T14:00:00Z'},
 {id:'3',organizer_id:'friend',visibility:'community',moderation_status:'pending',region_label:'Frankfurt (Oder)',title:'Ungeprüft',starts_at:'2026-12-02T12:00:00Z',ends_at:'2026-12-02T14:00:00Z'}
 ],listings:[
 {id:'shown',seller_id:'friend',title:'Jeans Größe 110',moderation_status:'approved',region_label:'Frankfurt (Oder)'},
 {id:'own',seller_id:'me',title:'Eigen',moderation_status:'approved',region_label:'Frankfurt (Oder)'},
 {id:'bad',seller_id:'friend',title:'Noch nicht freigegeben',moderation_status:'pending',region_label:'Frankfurt (Oder)'},
 {id:'blocked',seller_id:'blocked',title:'Blockiert',moderation_status:'approved',region_label:'Frankfurt (Oder)'}
 ]};
const x=selectHomeHighlights(p);
assert.equal(x.status,'ready');assert.deepEqual(x.families.map(v=>v.id),['friend']);assert.equal(x.meeting.id,'1');assert.deepEqual(x.listings.map(v=>v.id),['shown']);assert.equal(x.requests.length,1);
assert.equal(selectHomeHighlights({...p,active:false}).status,'unavailable');
const noRegion=selectHomeHighlights({...p,profile:{region_label:''}});assert.equal(noRegion.status,'missing-region');assert.deepEqual(noRegion.listings,[]);assert.equal(noRegion.requests.length,1);
const noContacts=selectHomeHighlights({...p,contacts:[]});assert.equal(noContacts.meeting,null);
assert.equal(selectHomeHighlights({...p,events:[{...p.events[0],visibility:'private'}]}).meeting,null);
const home=read('HomeAssistant.jsx'),app=read('App.jsx');
assert.match(home,/HomeHighlights data=\{highlights\}/);
assert.match(app,/selectHomeHighlights\(/);assert.match(app,/highlights=\{homeHighlights\}/);
assert.doesNotMatch(read('HomePersonalization.js'),/\b(?:supabase|AsyncStorage|fetch|functions\.invoke)\b/);
console.log('Regional homepage preview: permission-safe data filtering and navigation passed');
