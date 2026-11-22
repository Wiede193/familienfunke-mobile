import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {BRANDENBURG_FAMILY_PLACES,describePlaceAccessibility}=
 await import('data:text/javascript;base64,'+Buffer.from(read('FamilyMapBrandenburg.js')).toString('base64'));
assert.equal(BRANDENBURG_FAMILY_PLACES.length,8);
assert.equal(new Set(BRANDENBURG_FAMILY_PLACES.map(x=>x.id)).size,8);
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
assert.ok(BRANDENBURG_FAMILY_PLACES.filter(x=>x.accessibility.status==='documented').length>=6);
assert.ok(BRANDENBURG_FAMILY_PLACES.filter(x=>x.accessibility.status==='unknown').length>=2);
assert.match(describePlaceAccessibility(null).summary,/keine hinreichend geprüften/);
assert.equal(describePlaceAccessibility({accessibility:{status:'unknown'}}).source_url,null);
const old=read('FamilyMapCurated.js');
assert.match(old,/id:'curated-burg-storkow'/);
assert.match(old,/status:'documented'/);
const fm=read('FamilyMap.jsx');
assert.match(fm,/BRANDENBURG_FAMILY_PLACES,describePlaceAccessibility/);
assert.match(fm,/const curated=\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES,\.\.\.nationalShown\]/);
assert.match(fm,/curated:\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES\]/);
assert.match(fm,/const place=\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES,\.\.\.NATIONAL_FAMILY_PLACES\]/);
assert.match(fm,/const selectedAccess=describePlaceAccessibility\(selected\)/);
assert.match(fm,/Barrierefreiheit & Teilhabe/);
assert.match(fm,/Einzelne dokumentierte Merkmale bedeuten nicht/);
assert.match(fm,/Quelle zu Zugangsmerkmalen öffnen/);
assert.match(fm,/BRANDENBURG_FAMILY_PLACES\.map/,'Brandenburg venues must be selectable from visible cards');
assert.match(fm,/accessibilityStatus/);
for(const path of ['FamilyOutingScreen.jsx','HomeAssistant.jsx']){
 const src=read(path);
 assert.match(src,/BRANDENBURG_FAMILY_PLACES/,path+' must also surface added destination options');
}
assert.match(read('HomeAssistant.jsx'),/curated:\[\.\.\.CURATED_FAMILY_PLACES,\.\.\.BRANDENBURG_FAMILY_PLACES\]/);
console.log('Eight grounded Brandenburg map pins, accessible detail disclaimers, search, planner and Home links passed.');
