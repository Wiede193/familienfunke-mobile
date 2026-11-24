// Familienfunke: begrenzter, offline nutzbarer Wissensassistent ohne KI-API.
// Es werden ausschließlich bereits redaktionell gepflegte Inhalte zitiert.
// Keine Speicherung von Fragen und keine freie Generierung von Fakten.
const normalize=value=>String(value||'').toLocaleLowerCase('de-DE')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
  .replace(/[^a-z0-9]+/g,' ').trim();
const STOP=new Set(['wie','wo','warum','was','wer','welche','welcher','welches','wieviel','kann','konnen','konnten',
  'ich','wir','uns','mir','meine','mein','eine','einen','einem','und','oder','das','die','der','den','dem',
  'fuer','fur','mit','bei','über','uber','auf','zur','zum','von','ist','sind','ein','in','im','am','an',
  'suche','finden','mochte','moechte','bitte','gibt','es','denn','man','muss','hilfe','kind','kinder','familie','familien',
  'bekomme','haben','gerade','eigentlich','mehr','hier','erfahren']);
const TERMS={
 'kiz':'kinderzuschlag','elterngeldantrag':'elterngeld','kita':'kita',
 'kitaplatz':'kita','krippe':'kita',
 'barrierefrei':'barrierefreiheit','behinderungen':'behinderung',
 'schulbegleiter':'schulbegleitung','familienkasse':'kindergeld',
 'elternzeit':'elternzeit','fussball':'fussball','spielplatze':'spielplatz',
 'kindergeldantrag':'kindergeld'
};
const termsOf=q=>[...new Set(normalize(q).split(' ').filter(x=>x.length>2&&!STOP.has(x)).map(x=>TERMS[x]||x))].slice(0,12);
const wordMatch=(text,term)=>{
 const words=normalize(text).split(' ');
 return words.some(w=>w===term||(term.length>=5&&w.length>=5&&(w.startsWith(term)||term.startsWith(w))));
};
const weighted=(item,terms,fields)=>{
 return terms.reduce((total,term)=>total+fields.reduce((sum,[field,weight])=>
   sum+(wordMatch(item[field]||'',term)?weight:0),0),0);
};
const cut=(v,n)=>{const s=String(v||'').trim();return s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,'').trim()+' …';};
const sourcesOf=item=>(Array.isArray(item.sources)?item.sources:[]).filter(s=>
  s&&typeof s.title==='string'&&/^https:\/\//.test(s.url||'')).slice(0,2);
const out=(answer,extras={})=>({answer,pageId:'',searchQuery:'',navigationQuery:'',placeId:'',sources:[],...extras});
const PAGE_TEXT={
 profile:'Öffne „Mein Familienprofil“. Dort kannst du Interessen, Fotos, Region und Sichtbarkeit selbst bearbeiten.',
 discover:'Öffne „Familien in der Nähe“. Dort kannst du andere Familien anhand der freigegebenen Profile, der Region und gemeinsamer Interessen entdecken. Eine Identitätsprüfung garantiert keine Sicherheit.',
 market:'Öffne den Familienbasar. Dort kannst du freigegebene Angebote suchen, tauschen und verschenken. Verfügbare Artikel werden erst durch die normale Suche geprüft.',
 sell:'Öffne „Artikel verkaufen“, füge Fotos und eine eigene Beschreibung hinzu. Anzeigen bleiben bis zur Freigabe für andere verborgen.',
 box:'Im Kistenmodus kannst du Artikel manuell erfassen und Pakete zusammenstellen. Die automatische Fotoerkennung ist in dieser Entwicklungsphase ausgeschaltet.',
 map:'Öffne die Familienkarte und suche dort nach Spielplätzen oder Ausflugszielen. Prüfe Öffnungszeiten, Kosten und Zugänglichkeit direkt beim Betreiber.',
 outing:'Im Ausflugsplaner kannst du Startort, Alter, Radius, Interessen, Budget und Dauer auswählen. Die Vorschläge werden ohne KI aus dem hinterlegten Katalog sortiert; Preise und Öffnungszeiten werden nicht live geprüft.',
 events:'Unter „Treffen & Veranstaltungen“ findest du veröffentlichte Familienveranstaltungen. Aktuelle Termine kannst du über die normale Suche prüfen.',
 partners:'Unter „Kitas & Partnerwelt“ findest du Einrichtungen und Angebote. Für Betreuungsansprüche und Anträge nutze zusätzlich den Familienwegweiser.',
 guide:'Der Familienwegweiser enthält recherchierte Informationen, Ansprechpartner, Unterlagen und offizielle Quellen.',
 healthy:'Unter „Sport & Gesundheit“ findest du regionale Sportvereine und redaktionelle Informationen zu Bewegung und Ernährung. Kosten und Teilnahmebedingungen stehen bei den Anbietern.',
 inclusion:'Unter „Familien & Inklusion“ findest du Informationen zu Beratung, Teilhabe, Unterstützung, Rechten und Barrierefreiheit.',
 play:'Öffne „Familienzeit“. Dort findest du Quiz, Rätsel und Spiele, die ohne eine KI-Anfrage funktionieren.',
 calendar:'Öffne „Mein Familienkalender“. Dort kannst du eigene Termine und vorgemerkte Ausflüge verwalten.',
 inbox:'Öffne „Neuigkeiten“. Dort kannst du einzelne Benachrichtigungen oder nach Bestätigung alle Hinweise löschen.',
 push:'Die Benachrichtigungseinstellungen findest du im Profil beziehungsweise App-Menü. Der externe Push-Versand ist noch nicht generell aktiviert.',
 decisions:'Unter „Beschlüsse einfach erklärt“ findest du erfasste amtliche Entscheidungen und ihre Quellen. Die Übersicht ersetzt keine Prüfung der aktuellen Rechtslage.',
 contacts:'Kontakte und Anfragen verwaltest du im Bereich „Kontakte & Nachrichten“.',
 chat:'Öffne „Private Nachrichten“, um mit bereits bestätigten Kontakten zu schreiben.',
 help:'Im Bereich „Hilfe & FAQ“ findest du Anleitungen zur Bedienung der App.',
 aboutApp:'Unter „Über Familienfunke“ findest du Informationen zum Konzept der App.'
};
const SPECIAL=[
 {id:'inclusion',re:/\b(inklusion|teilhabe|behinderung|behindert|barrierefreiheit|assistenzbedarf)\b/},
 {id:'play',re:/\b(regen|regenwetter|langeweile|beschaftig|drinnen spielen|schlecht wetter)\b/},
 {id:'discover',re:/\b(andere familien|eltern kennenlernen|familien in der nahe|freunde finden|personen in meiner nahe)\b/},
 {id:'outing',re:/\b(ausflug planen|wochenendplan|ausflugsplaner)\b/},
 {id:'inbox',re:/\b(benachrichtigung loschen|hinweise loschen|neuigkeiten loschen)\b/}
];
export function answerFamilyQuestion(question,{topics=[],inclusion=[],health=[],routes=[],places=[]}={}){
 const raw=String(question||'').trim().slice(0,600);
 if(raw.length<3)return out('Bitte gib eine etwas genauere Frage ein.');
 const q=normalize(raw),terms=termsOf(raw);
 // Ein einzelner redaktionell belegter Kinder-Wissensfakt als Beispiel für später erweiterbare FAQ.
 if(/\bsonne\b/.test(q)&&/\b(gross|grosse|grosser|durchmesser|breit|size)\b/.test(q)){
   return out('Die Sonne hat einen Durchmesser von ungefähr 1,4 Millionen Kilometern. Das ist etwa 109-mal so viel wie der Durchmesser der Erde.',{
     sources:[{title:'NASA Science – Sun Facts',url:'https://science.nasa.gov/sun/facts/'}]});
 }
 if(terms.length===0)return out('Bitte nenne ein konkretes Thema, zum Beispiel Kinderzuschlag, Kita, Spielplatz oder Familienquiz.');
 const scored=[];
 for(const a of topics){
   const score=weighted(a,terms,[['title',18],['short',7],['overview',2],['responsible',2]])+
     terms.reduce((sum,t)=>sum+(Array.isArray(a.steps)&&a.steps.some(s=>wordMatch(s,t))?1:0),0);
   if(score>=14)scored.push({kind:'topic',item:a,score});
 }
 for(const a of inclusion){
   const score=weighted(a,terms,[['title',18],['short',7],['overview',2],['responsible',2]])+
     terms.reduce((sum,t)=>sum+(Array.isArray(a.firstSteps)&&a.firstSteps.some(s=>wordMatch(s,t))?1:0),0);
   if(score>=14)scored.push({kind:'inclusion',item:a,score});
 }
 for(const a of health){
   const score=weighted(a,terms,[['title',14],['description',5],['keywords',4],['region',1]]);
   if(score>=14)scored.push({kind:'health',item:a,score});
 }
 scored.sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'de'));
 const best=scored[0];
 if(best){
   const a=best.item;
   if(best.kind==='health')return out(cut(a.description,360)+' Weitere Informationen findest du im Bereich „Sport & Gesundheit“.',{
     pageId:'healthy',navigationQuery:a.title,
     sources:/^https:\/\//.test(a.url||'')?[{title:a.source||a.title,url:a.url}]:[]});
   const step=(best.kind==='topic'?a.steps:a.firstSteps)||[];
   const answer=cut(a.overview,510)+(step[0]?' Nächster Schritt: '+cut(step[0],240):'')+
     (a.caveat?' Wichtig: '+cut(a.caveat,210):'');
   return out(answer,{
     pageId:best.kind==='topic'?'guide':'inclusion',
     navigationQuery:a.title,
     sources:sourcesOf(a)
   });
 }
 const place=(Array.isArray(places)?places:[])[0];
 if(place?.place?.id&&place.title)return out('In der Familienkarte gibt es einen passenden Katalogeintrag: „'+place.title+'“. Öffne den Ort und prüfe die aktuellen Besuchsinformationen beim Anbieter.',{
   pageId:'map',placeId:place.place.id});
 const special=SPECIAL.find(s=>s.re.test(q));
 const route=special?routes.find(r=>r.id===special.id):
   routes.map(r=>({r,score:terms.reduce((n,t)=>n+
     (wordMatch(r.title,t)?8:0)+(wordMatch(r.words,t)?3:0),0)}))
     .sort((a,b)=>b.score-a.score)[0]?.r;
 const routeScore=route?terms.reduce((n,t)=>n+(wordMatch(route.title,t)?8:0)+(wordMatch(route.words,t)?3:0),0):0;
 if(route&&(special||routeScore>=3)&&PAGE_TEXT[route.id]){
   return out(PAGE_TEXT[route.id],{pageId:route.id,searchQuery:route.id==='market'?raw:''});
 }
 return out('Zu dieser Frage enthält die Familienfunke-Wissensdatenbank noch keine geprüfte Antwort. Probiere konkrete Suchbegriffe oder öffne den Familienwegweiser. Ich möchte keine Fakten erfinden.',{
   pageId:'guide'});
}
