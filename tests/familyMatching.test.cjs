const test = require('node:test');
const assert = require('node:assert/strict');
const {normalized,uniqueTags,matchingReasons,rankFamilyProfiles}=require('../lib/familyMatching');

const groups={
 hobbys:[['Sport & Bewegung',['Schwimmen','Radfahren','Wandern']],['Kreatives',['Basteln','Malen']]],
 unterwegs:[['Natur & Draußen',['Wald','Picknick','Spielplatz']],['Ausflüge',['Museum','Zoo']]],
 treffen:[['Wann passt es?',['Wochenenden','Nachmittags']],['Treffen',['Spielplatztreff','Kaffee & Kuchen']]]
};
const me={region_label:'  Oder-Spree ',interests:['Schwimmen','Wald','Wochenenden']};
const profile=(user_id,options={})=>({user_id,display_name:user_id,region_label:'',moderation_status:'approved',is_discoverable:true,interests:[],...options});

test('gleiche freiwillige Interessen, ohne doppelte Zählung',()=>{
 const r=matchingReasons(me,profile('a',{interests:['Schwimmen',' schwimmen ','Wald']}),groups);
 assert.deepEqual(r.sharedInterests,['Schwimmen','Wald']);
 assert.equal(r.match,2);
 assert.equal(r.hasEvidence,true);
 assert.equal(r.sameRegion,false);
});
test('verwandte Hobbys werden als Thema benannt, nicht als identische Interessen',()=>{
 const r=matchingReasons(me,profile('a',{interests:['Radfahren']}),groups);
 assert.equal(r.match,0);
 assert.deepEqual(r.similarTopics.map(x=>x.label),['Sport & Bewegung']);
 assert.equal(r.hasEvidence,true);
});
test('grobe Region: nur exakt dieselbe freiwillige Regionsangabe, keine Entfernung',()=>{
 const same=matchingReasons(me,profile('a',{region_label:'oder-spree'}),groups);
 assert.equal(same.sameRegion,true);
 const different=matchingReasons(me,profile('a',{region_label:'Müllrose'}),groups);
 assert.equal(different.sameRegion,false);
 assert.equal(matchingReasons({interests:[]},profile('a',{region_label:''}),groups).sameRegion,false);
});
test('Freizeit- und Treffideen können in der jeweiligen Ansicht höher gewichtet werden',()=>{
 const family=profile('a',{interests:['Picknick','Nachmittags']});
 const ordinary=matchingReasons(me,family,groups,'all');
 const outing=matchingReasons(me,family,groups,'unterwegs');
 const meeting=matchingReasons(me,family,groups,'treffen');
 assert.equal(ordinary.sharedInterests.length,0);
 assert.ok(outing.score>ordinary.score);
 assert.ok(meeting.score>ordinary.score);
});
test('gesperrte, eigene, unsichtbare und nicht freigegebene Profile herausfiltern',()=>{
 const rows=[
   profile('me'),profile('blocked'),profile('hidden',{is_discoverable:false}),
   profile('pending',{moderation_status:'pending'}),
   profile('visible',{interests:['Schwimmen']}),
 ];
 const got=rankFamilyProfiles({profiles:rows,viewerProfile:me,viewerId:'me',groups,blockedIds:['blocked']});
 assert.deepEqual(got.map(x=>x.user_id),['visible']);
});
test('gemeinsame Interessen und Region sortieren vor ohne belegte Ähnlichkeit',()=>{
 const rows=[profile('z'),profile('b',{interests:['Wald']}),profile('a',{interests:['Wald'],region_label:'oder-spree'})];
 const ranked=rankFamilyProfiles({profiles:rows,viewerProfile:me,viewerId:'me',groups});
 assert.deepEqual(ranked.map(p=>p.user_id),['a','b','z']);
 assert.equal(ranked[0].sameRegion,true);
});
test('Suchvergleich nur normalisiert, nicht aus versteckter Position',()=>{
 assert.equal(normalized('  Baden   UND Wandern '),'baden und wandern');
 assert.deepEqual(uniqueTags(['Museum',' museum ','Wald','',null]),['Museum','Wald']);
});
