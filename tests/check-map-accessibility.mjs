import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {BRANDENBURG_FAMILY_PLACES,describePlaceAccessibility}=
 await import('data:text/javascript;base64,'+Buffer.from(read('FamilyMapBrandenburg.js')).toString('base64'));
assert.equal(BRANDENBURG_FAMILY_PLACES.length,32);
assert.equal(new Set(BRANDENBURG_FAMILY_PLACES.map(x=>x.id)).size,32);
for(const p of BRANDENBURG_FAMILY_PLACES){
 assert.ok(p.id.startsWith('bb-'));
 assert.ok(p.latitude>51&&p.latitude<54&&p.longitude>12&&p.longitude<15,'Not in Brandenburg: '+p.id);
 assert.ok(p.address.includes('Deutschland')&&p.info_url.startsWith('https://'),p.id+' official address');
 assert.equal(p.source,'curated');
 assert.equal(p.has_changing_table,false,'Unknown changing table must not claim it exists');
 const a=describePlaceAccessibility(p);
 assert.ok(a.summary.length>=30&&a.mobility.length>=30&&a.sensory.length>=30&&a.limitations.length>=30,p.id+' details');
 if(p.accessibility.status==='documented'){
  assert.match(a.label,/dokumentiert/);
  assert.ok(a.source_url.startsWith('https://'));
 }else{
  assert.match(a.label,/nicht geprüft/);
 }
}
assert.ok(BRANDENBURG_FAMILY_PLACES.filter(x=>x.accessibility.status==='documented').length>=8);
assert.ok(BRANDENBURG_FAMILY_PLACES.filter(x=>x.accessibility.status==='unknown').length>=10);
assert.match(describePlaceAccessibility(null).summary,/keine hinreichend geprüften/);
assert.equal(describePlaceAccessibility({accessibility:{status:'unknown'}}).source_url,null);
const old=read('FamilyMapCurated.js');
assert.match(old,/id:'curated-burg-storkow'/);
assert.match(old,/status:'documented'/);
const fm=read('FamilyMap.jsx');
assert.match(fm,/BRANDENBURG_FAMILY_PLACES,BRANDENBURG_FAMILY_FOCUS,describePlaceAccessibility/);
assert.match(fm,/const curated=\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES,\.\.\.nationalShown\]/);
assert.match(fm,/curated:\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES\]/);
assert.match(fm,/const place=\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES,\.\.\.NATIONAL_FAMILY_PLACES\]/);
assert.match(fm,/const selectedAccess=describePlaceAccessibility\(selected\)/);
assert.match(fm,/Barrierefreiheit & Teilhabe/);
assert.match(fm,/Einzelne dokumentierte Merkmale bedeuten nicht/);
assert.match(fm,/Quelle zu Zugangsmerkmalen öffnen/);
assert.match(fm,/BRANDENBURG_FAMILY_PLACES\.filter\(p=>brandenburgFocus/,'Brandenburg category filters must select matching cards');
assert.match(fm,/BRANDENBURG_FAMILY_FOCUS\.map/,'Brandenburg water, indoor and food-play filters must be visible');
assert.ok(BRANDENBURG_FAMILY_PLACES.some(x=>x.family_focus==='water'));
assert.ok(BRANDENBURG_FAMILY_PLACES.some(x=>x.family_focus==='indoor'));
assert.ok(BRANDENBURG_FAMILY_PLACES.some(x=>x.family_focus==='food-play'));
assert.ok(BRANDENBURG_FAMILY_PLACES.every(x=>x.family_focus));
assert.ok(!BRANDENBURG_FAMILY_PLACES.some(x=>x.id==='bb-naturparkhaus-schlaubetal'),'Already present in local curated map');
assert.match(fm,/accessibilityStatus/);
for(const path of ['FamilyOutingScreen.jsx','HomeAssistant.jsx']){
 const src=read(path);
 assert.match(src,/BRANDENBURG_FAMILY_PLACES/,path+' must also surface added destination options');
}
assert.match(read('HomeAssistant.jsx'),/curated:\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES\]/);
assert.equal(read('FamilyMapBrandenburg.js'),
  read('supabase/functions/ff-app-assistant/FamilyMapBrandenburg.js'),
  'AI must only accept IDs from the same reviewed destination dataset as app');
assert.equal(read('FamilyMapCurated.js'),
  read('supabase/functions/ff-app-assistant/FamilyMapCurated.js'),
  'AI and map shared original curated catalog must match');
assert.match(read('supabase/functions/ff-app-assistant/index.ts'),
 /const OUTINGS=new Map\(\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES,\.\.\.NATIONAL_FAMILY_PLACES\]/,
 'Server-side AI outing allowlist must accept the same grounded Brandenburg destinations');
assert.ok(BRANDENBURG_FAMILY_PLACES.some(x=>x.id==='bb-baumkronenpfad-beelitz'&&x.accessibility.status==='documented'));
assert.ok(!BRANDENBURG_FAMILY_PLACES.some(x=>/raddusch/i.test(x.title)),'Closed destination not in visitor recommendations');
console.log('18 grounded Brandenburg map pins, sourced accessibility caveats and assistant catalogue match passed.');
