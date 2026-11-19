const test=require('node:test');
const assert=require('node:assert/strict');
const {lookupPostcode}=require('../data/plzCentersGermany');

test('nur exakt deutsche fünfstellige PLZ verwenden',()=>{
 assert.equal(lookupPostcode('15517')!==null,true);
 assert.equal(lookupPostcode(' 15517 ')!==null,true);
 for(const value of ['',null,'1551','155170','abcde','1551a','12345;DROP TABLE']){
   assert.equal(lookupPostcode(value),null,String(value));
 }
});
test('jede PLZ gibt nur grob gerundete Mittelpunktkoordinaten zurück',()=>{
 const center=lookupPostcode('15517');
 assert.equal(center.latitude,Math.round(center.latitude*100)/100);
 assert.equal(center.longitude,Math.round(center.longitude*100)/100);
 assert.ok(center.latitude>47&&center.latitude<56);
 assert.ok(center.longitude>5&&center.longitude<16);
 assert.ok(!('postcode' in center));
 assert.ok(!('street' in center));
});
test('unterschiedliche Städte können nicht als identischer Ort ausgegeben werden',()=>{
 const berlin=lookupPostcode('10115');
 const bavaria=lookupPostcode('84030');
 assert.ok(berlin&&bavaria);
 assert.notDeepEqual(berlin,bavaria);
});
test('unbekannte Postleitzahl liefert keine geschätzten oder erfundenen Koordinaten',()=>{
 assert.equal(lookupPostcode('99999'),null);
});
