import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=p=>import('data:text/javascript;base64,'+Buffer.from(read(p)).toString('base64'));

const {GERMANY_FAMILY_STATES,GERMANY_FAMILY_RESOURCES}=await load('GermanyFamilyDirectory.js');
const {GERMANY_STATE_SERVICES,REVIEWED_STATE_CODES,findStateServices,findStateServiceGroup,matchGermanState}=
 await load('GermanyFamilyServices.js');
const {answerFamilyQuestion}=await load('FamilyKnowledgeAnswer.js');
const {FAMILY_TOPIC_ARTICLES}=await load('FamilyTopicsKnowledge.js');
const {INCLUSION_ARTICLES}=await load('InclusionKnowledge.js');
const {KNOWLEDGE_ALIASES,KNOWLEDGE_FACTS}=await load('FamilyKnowledgeCatalog.js');
const {HEALTH_RESOURCES}=await load('FamilyHealthyContent.js');
const {HOME_ROUTES}=await load('HomeNavigation.js');
const {BRANDENBURG_REGIONS,BRANDENBURG_FAMILY_RESOURCES}=await load('BrandenburgFamilyRegions.js');
const {VERIFIED_GUIDE_DETAILS}=await load('FamilyGuideVerified.js');

assert.equal(GERMANY_FAMILY_STATES.length,16);
assert.equal(REVIEWED_STATE_CODES.length,10);
assert.deepEqual([...REVIEWED_STATE_CODES].sort(),['BE','BW','BY','HE','HH','MV','NI','NW','SH','SN'].sort());
assert.equal(GERMANY_STATE_SERVICES.reduce((sum,g)=>sum+g.services.length,0),21);
assert.equal(new Set(REVIEWED_STATE_CODES).size,10);
const topics=['parental_allowance','childcare_search','family_support'];
for(const g of GERMANY_STATE_SERVICES){
 assert.ok(GERMANY_FAMILY_STATES.some(s=>s.code===g.code),g.code);
 assert.ok(g.services.some(s=>s.topic==='parental_allowance'),g.code);
 assert.ok(g.services.some(s=>s.topic==='childcare_search'),g.code);
 assert.ok(findStateServiceGroup(g.code),g.code);
 for(const service of g.services){
  assert.ok(topics.includes(service.topic),g.code);
  assert.ok(service.title.length>18,service.title);
  assert.ok(service.authority.length>12,service.title);
  assert.ok(service.description.length>100,service.title);
  assert.ok(service.caveat.length>35,service.title);
  assert.ok(service.steps.length>=3,service.title);
  assert.ok(service.documents.length>35,service.title);
  assert.ok(service.url.startsWith('https://'),service.title);
  assert.equal(service.scope,'state-entry');
  assert.equal(service.checked,'2026-11-24');
 }
}
assert.deepEqual(findStateServices('TH'),[]);
assert.equal(findStateServices('SN',['family_support']).length,1);
assert.equal(findStateServices('SN',['childcare_search']).length,1);

const context={
 topics:FAMILY_TOPIC_ARTICLES,inclusion:INCLUSION_ARTICLES,health:HEALTH_RESOURCES,
 aliases:KNOWLEDGE_ALIASES,facts:KNOWLEDGE_FACTS,routes:HOME_ROUTES,
 germanyStates:GERMANY_FAMILY_STATES,germanyResources:GERMANY_FAMILY_RESOURCES,
 brandenburgRegions:BRANDENBURG_REGIONS,brandenburgResources:BRANDENBURG_FAMILY_RESOURCES,
 guideDetails:VERIFIED_GUIDE_DETAILS,stateServices:GERMANY_STATE_SERVICES
};
const ask=q=>answerFamilyQuestion(q,{...context,stateMatch:matchGermanState(q,GERMANY_FAMILY_STATES)});
for(const [question,code,sourceHost] of [
 ['Wo beantrage ich Elterngeld in Berlin?','BE','service.berlin.de'],
 ['Wie funktioniert der Kita-Gutschein in Berlin?','BE','service.berlin.de'],
 ['Elterngeld in Leipzig','SN','ksv-sachsen.de'],
 ['Wie beantrage ich Hilfen zur Erziehung in Dresden?','SN','amt24.sachsen.de'],
 ['Wo kann ich einen Kita-Platz in Sachsen suchen?','SN','amt24.sachsen.de'],
 ['Elterngeld in München beantragen','BY','zbfs.bayern.de'],
 ['Kita-Platz in Bayern finden','BY','familienland.bayern.de'],
 ['Elterngeld in Rostock beantragen','MV','lagus.mv-regierung.de'],
 ['Kita in Schwerin anmelden','MV','mv-serviceportal.de'],
 ['Elterngeld in Hamburg beantragen','HH','hamburg.de'],
 ['Kita-Gutschein Hamburg beantragen','HH','hamburg.de'],
 ['Elterngeld in Köln beantragen','NW','familienportal.nrw'],
 ['Kita in NRW finden','NW','kita.nrw.de'],
 ['Elterngeld in Baden-Württemberg','BW','l-bank.de'],
 ['Kita in Stuttgart','BW','service-bw.de'],
 ['Elterngeld in Frankfurt am Main','HE','rp-giessen.hessen.de'],
 ['Kita in Hessen','HE','verwaltungsportal.hessen.de'],
 ['Elterngeld in Hannover','NI','ms.niedersachsen.de'],
 ['Kita in Niedersachsen','NI','service.niedersachsen.de'],
 ['Elterngeld in Kiel','SH','schleswig-holstein.de'],
 ['Kita in Schleswig-Holstein','SH','kitaportal-sh.de'],
]){
 const answer=ask(question);
 assert.equal(answer.pageId,'guide',question);
 assert.equal(answer.kind,'regional',question);
 assert.equal(answer.navigationQuery,'state:'+code,question);
 assert.ok(answer.sources[0].url.includes(sourceHost),question+' source mismatch');
 assert.match(answer.answer,/Wohnort|Wohnbezirksjugendamt|Wohnbezirks|Wohnbezirk|Ort|Betreuungsumfang|Landkreise|Kommune|Bezirksamt|zuständig|ZBFS|LAGuS/i);
}
for(const [q,code] of [
 ['Elterngeld in Sachsen-Anhalt beantragen','ST'],
 ['Elterngeld in Saarland beantragen','SL'],
 ['Kita in Thüringen anmelden','TH'],
 ['Kita in Bremen anmelden','HB'],
 ['Elterngeld in Rheinland-Pfalz','RP']
]){
 assert.equal(matchGermanState(q,GERMANY_FAMILY_STATES)?.code,code,q);
 const a=ask(q);
 assert.equal(a.navigationQuery,'state:'+code,q);
 assert.equal(a.kind,'regional',q);
 assert.match(a.answer,/noch nicht einzeln recherchiert/);
 assert.equal(a.sources[0].url,GERMANY_FAMILY_STATES.find(s=>s.code===code).portal_url);
}
assert.equal(matchGermanState('Elterngeld in Frankfurt (Oder)',GERMANY_FAMILY_STATES)?.code,'BB');
assert.equal(matchGermanState('Elterngeld in Berlin oder München',GERMANY_FAMILY_STATES),null);
assert.equal(ask('Kita in Berlin oder München').navigationQuery,'');
const frankfurt=ask('Elterngeld in Frankfurt (Oder)');
assert.equal(frankfurt.kind,'regional');
assert.match(frankfurt.answer,/Frankfurt \(Oder\)/);
assert.ok(frankfurt.sources[0].url.includes('frankfurt-oder.de'));
assert.notEqual(ask('Kindergeld in Berlin').navigationQuery,'state:BE');
assert.equal(ask('Wie viel Elterngeld bekomme ich in Berlin?').kind,'limit');

const guide=read('FamilyGuide.jsx'),home=read('HomeAssistant.jsx');
assert.match(guide,/findStateServices\(pickedStateCode\)/);
assert.match(guide,/pickedStateServices\.map/);
assert.match(guide,/linkedStateCode/);
assert.match(guide,/Landesportal öffnen/);
assert.match(home,/matchGermanState\(prompt,GERMANY_FAMILY_STATES\)/);
assert.match(home,/stateServices:GERMANY_STATE_SERVICES/);
assert.doesNotMatch(read('GermanyFamilyServices.js'),/fetch\s*\(|supabase|api\.openai\.com/);
console.log('Landesweite Antragswege: 10 geprüfte Länder, 21 Dienste, 16 Landesportale und sichere Stadtauflösung geprüft.');
