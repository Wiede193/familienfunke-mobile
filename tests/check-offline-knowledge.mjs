import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const load=path=>import('data:text/javascript;base64,'+Buffer.from(read(path)).toString('base64'));
const {answerFamilyQuestion}=await load('FamilyKnowledgeAnswer.js');
const {KNOWLEDGE_FACTS,KNOWLEDGE_ALIASES,KNOWLEDGE_PROMPTS}=await load('FamilyKnowledgeCatalog.js');
const {FAMILY_TOPIC_ARTICLES}=await load('FamilyTopicsKnowledge.js');
const {INCLUSION_ARTICLES}=await load('InclusionKnowledge.js');
const {HEALTH_RESOURCES}=await load('FamilyHealthyContent.js');
const {HOME_ROUTES}=await load('HomeNavigation.js');
const {GERMANY_FAMILY_STATES,GERMANY_FAMILY_RESOURCES}=await load('GermanyFamilyDirectory.js');
const {BRANDENBURG_REGIONS,BRANDENBURG_FAMILY_RESOURCES}=await load('BrandenburgFamilyRegions.js');
const {VERIFIED_GUIDE_DETAILS}=await load('FamilyGuideVerified.js');
const {CURATED_FAMILY_PLACES}=await load('FamilyMapCurated.js');
const {BRANDENBURG_FAMILY_PLACES}=await load('FamilyMapBrandenburg.js');
const {NATIONAL_FAMILY_PLACES}=await load('FamilyMapNational.js');

const catalog={
 topics:FAMILY_TOPIC_ARTICLES,inclusion:INCLUSION_ARTICLES,health:HEALTH_RESOURCES,
 routes:HOME_ROUTES,aliases:KNOWLEDGE_ALIASES,facts:KNOWLEDGE_FACTS,
 region:'Oder-Spree',brandenburgRegions:BRANDENBURG_REGIONS,
 brandenburgResources:BRANDENBURG_FAMILY_RESOURCES,
 germanyStates:GERMANY_FAMILY_STATES,germanyResources:GERMANY_FAMILY_RESOURCES,
 guideDetails:VERIFIED_GUIDE_DETAILS,
 allPlaces:[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES,...NATIONAL_FAMILY_PLACES]
};
const ask=q=>answerFamilyQuestion(q,catalog);
assert.equal(FAMILY_TOPIC_ARTICLES.length,17);
assert.equal(INCLUSION_ARTICLES.length,18);
assert.ok(KNOWLEDGE_FACTS.length>=18);
assert.ok(KNOWLEDGE_ALIASES.length>=30);
assert.equal(new Set(KNOWLEDGE_ALIASES.map(a=>a.kind+':'+a.id)).size,KNOWLEDGE_ALIASES.length);
assert.ok(KNOWLEDGE_ALIASES.every(a=>
 (a.kind==='topic'?FAMILY_TOPIC_ARTICLES:INCLUSION_ARTICLES).some(item=>item.id===a.id)));
assert.ok(KNOWLEDGE_FACTS.every(x=>x.answer.length>=45&&x.sources.length>=1&&
 x.sources.every(src=>/^https:\/\//.test(src.url))));
 // Jede redaktionell definierte Alias-Frage muss beim vorgesehenen Dokument ankommen.
for(const alias of KNOWLEDGE_ALIASES){
 for(const phrase of alias.terms){
  const reply=ask(phrase);
  assert.equal(reply.contextRef?.id,alias.id,
    'Unpassende Fachantwort für „'+phrase+'“ (erwartet '+alias.id+')');
 }
}
assert.ok(catalog.allPlaces.length>=75);

for(const [question,page] of [
 ['Wie beantrage ich Kinderzuschlag?','guide'],
 ['Welche Unterlagen brauche ich für Wohngeld?','guide'],
 ['Was ist Wohngeld?','guide'],
 ['Wie finde ich einen Kita-Platz?','guide'],
 ['Wie hilft Unterhaltsvorschuss?','guide'],
 ['Wo finde ich Frühe Hilfen?','guide'],
 ['Mein Kind schläft schlecht – was hilft?','guide'],
 ['Wie beantrage ich Kinderkrankengeld?','guide'],
 ['Welche Unterstützung gibt es bei Schulbegleitung?','inclusion'],
 ['Wie beantrage ich einen Pflegegrad für mein Kind?','inclusion'],
 ['Was ist Eingliederungshilfe?','inclusion'],
 ['Wo finde ich unabhängige Teilhabeberatung?','inclusion'],
 ['Widerspruch gegen Bescheid','inclusion'],
 ['Welche Unterlagen braucht man für eine Beistandschaft?','guide'],
 ['Wo finde ich Kinderturnen in Brandenburg?','healthy'],
 ['Wie finde ich andere Familien?','discover'],
 ['Wie kann ich einen Artikel verkaufen?','sell'],
 ['Wie stelle ich Benachrichtigungen ein?','push'],
 ['Was können wir bei Regen spielen?','play'],
 ['Kinderwagen kaufen','market'],
 ['Unterlagen Elternzeit','guide']
]){
 const answer=ask(question);
 assert.equal(answer.pageId,page,question+' got '+answer.pageId);
 assert.ok(answer.answer.length>45,question);
 if(['guide','healthy','inclusion'].includes(page))
   assert.ok(answer.sources.length>0,question+' requires an original source');
}
assert.match(ask('Welche Unterlagen brauche ich für Wohngeld?').answer,/Mietvertrag/);
assert.match(ask('Wie beantrage ich Kinderzuschlag?').answer,/Familienkasse/);
assert.match(ask('Wo beantrage ich Elterngeld in Oder-Spree?').answer,/Elterngeldstelle Oder-Spree/);
assert.match(ask('Elterngeldstelle Frankfurt Oder').answer,/Frankfurt \(Oder\)/);
assert.ok(ask('Welche Ausflugsziele gibt es in Storkow?').related.length>=2);
assert.equal(ask('Welche Ausflugsziele gibt es in Storkow?').pageId,'map');
assert.equal(ask('Wie teuer ist das Phantasialand heute?').pageId,'map');
assert.match(ask('Wie teuer ist das Phantasialand heute?').answer,/Preise/);
assert.match(ask('Wie viel Kindergeld gibt es 2026?').answer,/nicht verlässlich/);
assert.ok(ask('Wie viel Kindergeld gibt es 2026?').sources[0].url.includes('arbeitsagentur.de'));
assert.ok(!ask('Wie viel Pflegegeld gibt es?').sources.some(x=>/kindergeld/i.test(x.url)));
assert.ok(ask('Kindergeld 2026 beantragen').sources[0].url.includes('arbeitsagentur.de'));
assert.match(ask('Wie ist die Frist für Elternzeit?').answer,/7 Wochen/);
assert.match(ask('Was tun, wenn mein Kind Atemnot hat?').answer,/112/);
assert.equal(ask('Was tun, wenn mein Kind Atemnot hat?').kind,'safety');
assert.match(ask('Kannst du meine Nachrichten lesen?').answer,/keine privaten Nachrichten/);

for(const [q,expected] of [
 ['Wie groß ist die Sonne?','1,4 Millionen'],
 ['Warum leuchtet der Mond?','reflektiert'],
 ['Warum gibt es Mondphasen?','Mondphasen'],
 ['Warum ist der Himmel blau?','blaues Licht'],
 ['Wie weit ist die Sonne entfernt?','150 Millionen'],
 ['Wie groß ist die Erde?','12.756'],
 ['Warum gibt es Jahreszeiten?','Erdachse'],
 ['Wie entsteht Regen?','Wasserkreislauf'],
 ['Wie entstehen Wolken?','Wasserdampf'],
 ['Wie viele Planeten gibt es?','acht Planeten'],
 ['Warum donnert es?','Donner'],
 ['Was tun, wenn mein Kind Fieber hat?','Fieber']
]){
 const a=ask(q);
 assert.match(a.answer,new RegExp(expected),q);
 assert.equal(a.kind,'fact',q);
 assert.ok(a.sources.length,q);
}
for(const group of KNOWLEDGE_PROMPTS){
 for(const q of group.questions){
  const a=ask(q);
  assert.ok(!['unanswered','clarify'].includes(a.kind),
    'Suggested question must have supported answer: '+q+'; got '+a.answer);
 }
}
assert.equal(ask('Wie repariere ich den Warp-Antrieb eines Raumschiffs?').kind,'unanswered');
assert.equal(ask('Wie repariere ich den Warp-Antrieb eines Raumschiffs?').sources.length,0);
assert.equal(ask('Hilfe bei Behinderung').pageId,'inclusion');

// Bewusst begrenzte Folgefragen greifen nur auf den vorherigen konkreten Ratgeber zu.
const first=ask('Wie beantrage ich Kinderzuschlag?');
assert.deepEqual(first.contextRef,{kind:'topic',id:'kinderzuschlag'});
const afterDocuments=answerFamilyQuestion('Welche Unterlagen brauche ich?',{
 ...catalog,previousContext:first.contextRef
});
assert.match(afterDocuments.answer,/Einkommensnachweise/);
assert.equal(afterDocuments.contextRef.id,'kinderzuschlag');
const afterOffice=answerFamilyQuestion('Wer ist dafür zuständig?',{
 ...catalog,previousContext:first.contextRef
});
assert.match(afterOffice.answer,/Familienkasse/);
const afterCaveat=answerFamilyQuestion('Was muss ich beachten?',{
 ...catalog,previousContext:first.contextRef
});
assert.equal(afterCaveat.kind,'article');
assert.match(afterCaveat.answer,/Wichtig:/);
const school=ask('Welche Unterstützung gibt es bei Schulbegleitung?');
const schoolDocs=answerFamilyQuestion('Welche Unterlagen brauche ich?',{
 ...catalog,previousContext:school.contextRef
});
assert.equal(schoolDocs.pageId,'inclusion');
assert.match(schoolDocs.answer,/Schulbegleitung/);
assert.equal(first.related[0].question,'Welche Unterlagen brauche ich?');

const engine=read('FamilyKnowledgeAnswer.js'),facts=read('FamilyKnowledgeCatalog.js');
assert.doesNotMatch(engine,/fetch\s*\(|supabase|api\.openai\.com/);
assert.doesNotMatch(facts,/fetch\s*\(|supabase|api\.openai\.com/);
const home=read('HomeAssistant.jsx'),outing=read('FamilyOutingScreen.jsx'),app=read('App.jsx');
assert.match(home,/answerFamilyQuestion\(prompt/);
assert.match(home,/KNOWLEDGE_PROMPTS\.map/);
assert.match(home,/BRANDENBURG_REGIONS/);
assert.match(home,/entry\.related\.slice/);
assert.doesNotMatch(home,/functions\.invoke\('ff-app-assistant'/);
assert.doesNotMatch(outing,/functions\.invoke\('ff-app-assistant'/);
assert.doesNotMatch(app,/functions\.invoke\('ff-market-scan'/);
assert.doesNotMatch(app,/functions\.invoke\('ff-market-review'/);
for(const name of ['ff-app-assistant','ff-market-scan']){
 const fn=read('supabase/functions/'+name+'/index.ts');
 assert.match(fn,/if\(true\)return response\(/,'Paid model calls must be blocked server-side');
}
const review=read('supabase/functions/ff-market-review/index.ts');
assert.match(review,/if\(true\)return Response\.json\(\{checked:0,paused:true/);
assert.match(review,/if\(true\)return Response\.json\(\{status:"review_required"/);
console.log('Offline-Wissensassistent: Themen, geprüfte Fakten, Ortsbezug, Datenschutz, Risiken, Kosten und Folgefragen geprüft');
