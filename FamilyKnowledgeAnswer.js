// Familienfunke – Quellengestützte Antwortsuche, vollständig lokal und ohne KI-API.
// Kein Zugriff auf private Konten, keine Netzwerkanfragen und keine freie Generierung.
// Alle Sachinformationen stammen aus übergebenen redaktionellen Daten.
const norm=value=>String(value??'').toLocaleLowerCase('de-DE').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
 .replace(/[^a-z0-9]+/g,' ').replace(/\b(\w*?)ae(\w*)\b/g,(_,a,b)=>a+'a'+b)
 .replace(/oe/g,'o').replace(/ue/g,'u').replace(/\s+/g,' ').trim();
const STOP=new Set(('ich wir du ihr unsere meiner meinen meinem deinen deine die der das den dem ein eine einen einem '+
 'und oder mit zu wo wie was warum welche welcher welches welche wieviel wieso kann konnen konnte sind ist von '+
 'bei nach auf aus fur uber im am an um in als wer wenn dann mir mich uns bitte nun denn eigentlich '+
 'jetzt suche suchen finden mochte will wurde mochten brauche brauchen kann man gibt es soll sollt '+
 'bekomme bekommen haben hat mein meine ihnen hier mehr dazu antwort hilfe frage informationen finde stelle viel andere muss mussen sollte '+
 'familie familien kind kinder kindern kindes fur unsere wir').split(' '));
const TERM_MAP={
 kita:'kita',kitaplatz:'kita',kitaplatze:'kita',kindergartenplatz:'kita',kindergarten:'kita',krippenplatz:'kita',tagesmutter:'kita',
 kiz:'kinderzuschlag',kizlotse:'kinderzuschlag',
 but:'bildungsteilhabepaket',bildungspaket:'bildungsteilhabepaket',teilhabepaket:'bildungsteilhabepaket',
 schulbegleiter:'schulbegleitung',schulassistent:'schulbegleitung',schulassistenz:'schulbegleitung',
 pflegegrade:'pflegegrad',schwerbehindert:'schwerbehinderung',behindertenpass:'schwerbehindertenausweis',
 elterngeldantrag:'elterngeld',elternzeitantrag:'elternzeit',
 elterngeldstelle:'elterngeld',familienkasse:'familienkasse',
 spielplatze:'spielplatz',rutschen:'spielplatz',flohmarkt:'basar',
 kleinanzeigen:'basar',kinderwagen:'kinderwagen',indoor:'indoor',indoorspielplatze:'indoorspielplatz',
 badeparadies:'erlebnisbad',schwimmbader:'schwimmbad',
 ferienpass:'ferienpass',behindertenberatung:'teilhabeberatung',
 ausflugsziele:'ausflugsziel',ausfluge:'ausflug',aktivitaten:'aktivitat'
};
function token(w){return TERM_MAP[w]||w;}
const words=v=>norm(v).split(' ').filter(Boolean);
const tokens=v=>[...new Set(words(v).map(token).filter(w=>w.length>=3&&!STOP.has(w)))].slice(0,15);
const boundedEdit=(a,b)=>{
 if(Math.abs(a.length-b.length)>1||a[0]!==b[0]||a.length<6||b.length<6)return false;
 if(a.length===b.length){
  let diff=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])diff.push(i);
  return diff.length===1||(diff.length===2&&diff[1]===diff[0]+1&&a[diff[0]]===b[diff[1]]&&a[diff[1]]===b[diff[0]]);
 }
 const [long,short]=a.length>b.length?[a,b]:[b,a];let i=0,j=0,skip=0;
 while(i<long.length&&j<short.length){
  if(long[i]===short[j]){i++;j++;}else{skip++;if(skip>1)return false;i++;}
 }
 return true;
};
const equivalent=(word,term)=>{
 const a=token(word),b=token(term);
 if(a===b)return true;
 if(a.length>=5&&b.length>=5&&Math.abs(a.length-b.length)<=2&&
   (a.startsWith(b)||b.startsWith(a)))return true;
 return boundedEdit(a,b);
};
function matchIn(hay,term){
 const ww=words(hay);return ww.some(w=>equivalent(w,term));
}
function relevance(queryTokens,fields){
 let score=0,hit=0;
 for(const t of queryTokens){
  let highest=0;
  for(const [text,weight] of fields){
   if(text&&matchIn(text,t))highest=Math.max(highest,weight);
  }
  if(highest){score+=highest;hit++;}
 }
 return {score,hit,coverage:queryTokens.length?hit/queryTokens.length:0};
}
function exactPhrase(hay,phrase){
 const h=' '+norm(hay)+' ',p=' '+norm(phrase)+' ';
 return p.length>2&&h.includes(p);
}
function aliasScore(question,queryTokens,aliases=[]){
 let best=0;
 for(const phrase of aliases){
  if(exactPhrase(question,phrase))best=Math.max(best,105+Math.min(12,norm(phrase).length/5)+20*Math.min(3,Math.max(0,tokens(phrase).length-1)));
  else{
   const ts=tokens(phrase);
   if(ts.length>0){
    const hit=ts.filter(t=>queryTokens.some(q=>equivalent(t,q))).length;
    if(hit===ts.length&&hit>=2)best=Math.max(best,28+hit*6);
    if(hit===1&&ts.length===1&&queryTokens.length<=2)
      best=Math.max(best,18);
   }
  }
 }
 return best;
}
const articleSource=item=>(Array.isArray(item?.sources)?item.sources:[])
 .filter(s=>s&&typeof s.title==='string'&&/^https:\/\//.test(s.url||'')).slice(0,3);
const simpleSource=(title,url)=>/^https:\/\//.test(url||'')?[{title:String(title||'Offizielle Informationen'),url}]:[];
const shorten=(value,max=400)=>{
 const s=String(value||'').trim();if(s.length<=max)return s;
 const cut=s.slice(0,max).replace(/\s+\S*$/,'').trim();return (cut||s.slice(0,max))+' …';
};
const result=(answer,more={})=>({answer,pageId:'',searchQuery:'',navigationQuery:'',
 placeId:'',sources:[],related:[],kind:'info',...more});
const PAGE_TEXT={
 profile:'Öffne „Mein Familienprofil“. Dort kannst du Hobbys und Interessen, Fotos, Region, Sichtbarkeit und Kontoeinstellungen bearbeiten.',
 discover:'Öffne „Familien in der Nähe“. Dort findest du freigegebene Profile nach Region und gemeinsamen Interessen. Eine Kontoprüfung garantiert nicht die Sicherheit eines Treffens.',
 market:'Öffne den Familienbasar und suche nach Artikeln. Nur freigegebene Anzeigen erscheinen öffentlich. Preise und Verfügbarkeit müssen in der aktuellen Suche geprüft werden.',
 sell:'Im Familienbasar kannst du mit „Artikel verkaufen“ eine Anzeige anlegen, Fotos hinzufügen und Merkmale selbst eintragen. Die Anzeige bleibt bis zur manuellen Freigabe verborgen.',
 box:'Im Kistenmodus kannst du Kleidungsstücke manuell erfassen und zu Paketen zusammenfassen. Die automatische Fotoanalyse ist in der Entwicklungsphase deaktiviert.',
 map:'Öffne die Familienkarte für Spielplätze und Ausflugsziele. Prüfe aktuelle Öffnungszeiten, Preise, Zugänglichkeit und Eignung direkt beim Anbieter.',
 outing:'Im Ausflugsplaner wählst du Startort, Radius, Alter, Budget, Interessen und Dauer. Er sortiert vorhandene Ziele lokal; Kosten, Wetter und Öffnungszeiten werden nicht live geprüft.',
 events:'Unter „Treffen & Veranstaltungen“ findest du freigegebene Familienveranstaltungen. Die normale Suche kann aktuelle Einträge abrufen.',
 partners:'Unter „Kitas & Partnerwelt“ findest du Partnereinrichtungen, ihre Angebote und Veranstaltungen. Amtliche Kita-Rechtsansprüche findest du im Familienwegweiser.',
 guide:'Der Familienwegweiser enthält Ratgeber, mögliche Unterlagen, zuständige Stellen und weiterführende Quellen.',
 healthy:'Unter „Sport & Gesundheit“ findest du regionale Vereine, Bewegungsideen, Ernährungsinformationen und offizielle Informationsseiten. Teilnahmebedingungen beim Anbieter prüfen.',
 inclusion:'Unter „Familien & Inklusion“ findest du Informationen zu Beratung, Teilhabe, Hilfen, Widerspruch und Barrierefreiheit.',
 play:'Öffne „Familienzeit“. Dort gibt es Quiz, Rätsel und Spiele, die ohne KI-API funktionieren.',
 calendar:'In „Mein Familienkalender“ kannst du eigene Termine und vorgemerkte Aktivitäten verwalten.',
 inbox:'Unter „Neuigkeiten“ kannst du Benachrichtigungen einzeln löschen oder nach Bestätigung gesammelt entfernen.',
 push:'Öffne die Benachrichtigungseinstellungen im Menü, um verfügbare Push-Einstellungen für das Gerät anzupassen.',
 decisions:'Im Bereich „Beschlüsse einfach erklärt“ gibt es erfasste amtliche Entscheidungen. Gesetzesstand und Inkrafttreten sind getrennt zu prüfen.',
 contacts:'Unter „Kontakte & Nachrichten“ verwaltest du Kontaktanfragen und bestätigte Kontakte.',
 chat:'Unter „Private Nachrichten“ findest du bestehende Unterhaltungen. Der Assistent kann Nachrichten nicht selbst lesen.',
 help:'Unter „Hilfe & FAQ“ findest du Anleitungen zur Bedienung von Familienfunke.',
 aboutApp:'Unter „Über Familienfunke“ stehen Informationen zum Projekt.'
};
const ACTIONS=[
 ['market',/\b(kinderwagen|spielzeug|jeans|kleidung|hose|jacke|schuhe|bucher|babybett|kindersitz|buggy|basar|flohmarkt|secondhand)\b.*\b(kaufen|suche|gesucht|preis|verkauf|angebot|tauschen)\b|\b(kaufen|suche|suche|gesucht)\b.*\b(kinderwagen|spielzeug|jeans|kleidung|hose|jacke|schuhe|bucher|babybett|buggy)\b/],
 ['sell',/\b(artikel|sachen|kleidung|kinderwagen|anzeige)\b.*\b(verkaufen|inserieren|einstellen|anbieten)\b|\b(verkaufen|inserieren|anzeige erstellen)\b/],
 ['box',/\b(kiste|kistenmodus|kleidungspaket|paket zusammenstellen)\b/],
 ['discover',/\b(andere familien|andere eltern|familien finden|familien kennenlernen|eltern kennenlernen|familien in der nahe|freunde finden|familien treffen)\b/],
 ['play',/\b(regenwetter|langeweile|beschaftigungsidee|drinnen spielen|quiz|ratsel|sudoku|solitar|vier gewinnt)\b/],
 ['outing',/\b(ausflug planen|ausflugsplaner|wochenendausflug|familienausflug planen)\b/],
 ['map',/\b(spielplatz|ausflugsziel|spielorte|familienkarte|wildpark|tierpark)\b/],
 ['inbox',/\b(benachrichtigungen loschen|hinweise loschen|neuigkeiten loschen)\b/],
 ['push',/\b(push|benachrichtigungseinstellungen|benachrichtigungen (ausschalten|aktivieren|einstellen|andern)|benachrichtigungen ein)\b/],
 ['profile',/\b(profil bearbeiten|hobbys einstellen|interessen andern|passwort andern|privatsphare einstellen)\b/],
 ['chat',/\b(meine nachrichten|chat offnen|chat lesen|unterhaltung offnen)\b/],
 ['calendar',/\b(termin eintragen|kalender offnen|familienkalender|termin planen)\b/],
 ['events',/\b(veranstaltungen|familientreffen|veranstaltungskalender)\b/],
 ['play',/\b(regen|schlecht wetter|spielen)\b/]
];
const INTENTS={
 documents:/\b(unterlagen|dokumente|nachweise|formulare|papiere|mitbringen|einreichen)\b/,
 office:/\b(zustandig|zustandigkeit|ansprechpartner|behorde|stelle|amt|jugendamt|beantragen|antrag|wohin|melden)\b/,
 steps:/\b(wie|schritte|vorgehen|machen|beantragen|anmelden|registrieren)\b/,
 timing:/\b(wann|frist|fristen|spatestens|bis wann|rechtzeitig|beginn|rückwirkend|ruckwirkend)\b/,
 rights:/\b(anspruch|recht|voraussetzung|berechtigt|zustehen|bekomme ich|wer bekommt)\b/,
 caveat:/\b(ablehnung|ablehnen|problem|widerspruch|geht nicht|achtung|beachten)\b/
};
const trending=/\b(heute|morgen|gerade|aktuell|dieses jahr|2026|2027|neueste|preis|offen|offnungszeiten|wieviel|wie viel|wie teuer|betrag|hohe|kostet|geoffnet)\b/;
const amount=/\b(kindergeld|kinderzuschlag|elterngeld|wohngeld|unterhaltsvorschuss|pflegegeld|pflegegrad)\b.*\b(wieviel|wie viel|hohe|betrag|euro|kostet)\b|\b(wieviel|wie viel|betrag|euro|hoch)\b.*\b(kindergeld|kinderzuschlag|elterngeld|wohngeld|unterhaltsvorschuss|pflegegeld|pflegegrad)\b/;
const emergency=/(?:\b(atemnot|bewusstlos|nicht mehr atmet|erstickt|schwere vergiftung|starke blutung|krampfanfall)\b)/;
const emergencyUrl='https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/notfaelle/notruf-und-notaufnahme';

function genericRelated({topics=[],inclusion=[],routes=[]},limit=4){
 const t=topics.filter(x=>['kinderzuschlag','kita-platz-finden','wohngeld'].includes(x.id))
   .map(x=>({label:x.title,question:x.title.replace(/:.*/, '')}));
 const inc=inclusion.filter(x=>x.id==='independent-counsel')
   .map(x=>({label:x.title,question:'Wo finde ich unabhängige Teilhabeberatung?'}));
 return [...t,...inc].slice(0,limit);
}
function textForArticle(entry,intent,q){
 const a=entry.item, isInclusion=entry.kind==='inclusion',steps=isInclusion?a.firstSteps:a.steps;
 const title=a.title,summary=shorten(a.overview,500),first=Array.isArray(steps)?steps[0]:'';
 let answer='';
 switch(intent){
  case 'documents':
   answer=a.documents?'Für „'+title+'“ werden je nach Einzelfall diese Unterlagen genannt: '+shorten(a.documents,690):summary;
   break;
  case 'office':
   answer=a.responsible?'Zuständig bzw. erste Anlaufstelle bei „'+title+'“: '+shorten(a.responsible,550):summary;
   if(first)answer+=' Erster Schritt: '+shorten(first,200);
   break;
  case 'steps':
   answer=summary;
   if(Array.isArray(steps)&&steps.length)answer+=' Nächste Schritte: '+steps.slice(0,2).map((s,i)=>(i+1)+'. '+shorten(s,215)).join(' ');
   break;
  case 'timing':
   answer='Die Fristen und der Zeitpunkt hängen von der konkreten Leistung oder Situation ab. '+summary;
   break;
  case 'rights':
   answer=summary; break;
  case 'caveat':
   answer=summary;break;
  default:
   answer=summary;if(first)answer+=' Möglicher erster Schritt: '+shorten(first,190);
 }
 if(a.caveat)answer+=' Wichtig: '+shorten(a.caveat,intent==='documents'?165:215);
 if(trending.test(q))answer+=' Aktuelle Beträge, Fristen und Voraussetzungen bitte bei der offiziellen Stelle gegenprüfen.';
 return shorten(answer,1160);
}
function findIntent(q){
 if(INTENTS.documents.test(q))return 'documents';
 if(INTENTS.office.test(q))return 'office';
 if(INTENTS.timing.test(q))return 'timing';
 if(INTENTS.rights.test(q))return 'rights';
 if(INTENTS.caveat.test(q))return 'caveat';
 if(INTENTS.steps.test(q))return 'steps';
 return 'general';
}
const ARTICLE_BASE={topic:17,inclusion:16,health:14,guide:21,resource:12};
function rankDocuments(q,ts,{topics=[],inclusion=[],health=[],aliases=[],germanyResources=[],brandenburgResources=[]}){
 const docs=[];
 const indexedAliases=new Map();
 for(const a of aliases){const key=a.kind+':'+a.id;indexedAliases.set(key,[...(indexedAliases.get(key)||[]),...(a.terms||[])]);}
 for(const [kind,items] of [['topic',topics],['inclusion',inclusion],['health',health],['resource',germanyResources],['resource',brandenburgResources]]){
  for(const a of items){
   if(!a?.title)continue;
   const fields=kind==='health'?
     [[a.title,14],[a.description,5],[a.keywords,6],[a.region,1]]:
     kind==='resource'?
     [[a.title,16],[a.description||a.explanation,5]]:
     [[a.title,17],[a.short,7],[a.overview,3],[a.responsible,2],[a.documents,1]];
   const r=relevance(ts,fields),alias=aliasScore(q,ts,indexedAliases.get(kind+':'+a.id)||[]);
   const fullTitle=exactPhrase(q,a.title)||exactPhrase(a.title,q);
   const score=r.score+alias+ARTICLE_BASE[kind]+(fullTitle?30:0)+r.coverage*13;
   if((r.hit>=1&&r.score>=14)||alias>=18)docs.push({kind,item:a,score,hit:r.hit,alias});
  }
 }
 return docs.sort((a,b)=>b.score-a.score||String(a.item.title).localeCompare(String(b.item.title),'de'));
}
function rankFacts(q,ts,facts=[]){
 return facts.map(item=>{
  const score=aliasScore(q,ts,item.questions||[]);
  return {item,score};
 }).filter(x=>x.score>=28)
  .sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
}
function regionFor(q,provided,regions){
 for(const r of regions){
  const possibilities=[r.name,...(r.aliases||[])].filter(v=>norm(v).length>=4);
  if(possibilities.some(p=>exactPhrase(q,p)))return r;
 }
 if(/\b(bei mir|in meiner nahe|vor ort|bei uns|mein landkreis)\b/.test(q)&&provided)
   return regions.find(r=>[r.name,...(r.aliases||[])].some(p=>norm(p)===norm(provided)))||null;
 return null;
}
function serviceFor(q){
 if(/\b(elterngeld|elterngeldstelle)\b/.test(q))return ['parental_allowance'];
 if(/\b(kita|kitaplatz|kindergarten|tagespflege|krippe|betreuung)\b/.test(q))return ['childcare_search','kita_application'];
 if(/\b(behinderung|eingliederungshilfe|teilhabe|schwerbehindert)\b/.test(q))return ['disability'];
 if(/\b(hilfen zur erziehung|familienhilfe|erziehungshilfe|jugendhilfe)\b/.test(q))return ['family_support'];
 return [];
}
function placeMatches(q,ts,allPlaces=[]){
 const placeWords=['ausflug','ausflugsziel','wochenende','freizeit','unternehmen','besuchen','spielplatz','baden',
 'schwimmen','indoor','indoorspielplatz','kinder','therme','zoo','tierpark','wildpark','freizeitpark',
 'barrierefrei','barrierearm','rollstuhl','roller','wandern','natur','museum','regen'];
 const locationSpecified=allPlaces.some(p=>
   [p.region_label,p.state,p.title].some(v=>norm(v).length>=5&&exactPhrase(q,v)))||
   /\b(in|bei|rund um|umgebung|nahe)\s+[a-z]{4,}/.test(q);
 const locationMatches=allPlaces.filter(p=>{
   const fragments=String(p.region_label||'').split(/[·,/()]/).map(norm).filter(x=>x.length>=5);
   return [p.state,p.title,...fragments].filter(Boolean).some(v=>norm(v).length>=5&&exactPhrase(q,v));
 });
 const placeIntent=placeWords.some(w=>matchIn(q,w));
 if(!placeIntent&&!locationMatches.length)return [];
 const candidates=allPlaces.map(p=>{
  const loc=locationMatches.some(item=>item.id===p.id);
  const area=norm([p.region_label,p.state,p.address].filter(Boolean).join(' '));
  const placeData=[p.title,p.description,p.kind_label,p.family_focus].filter(Boolean).join(' ');
  const featureTs=ts.filter(t=>!words(area).some(x=>equivalent(x,t))&&
    !['ausflug','ausflugsziel','freizeit','wochenende','ort','ziel','aktivitat','unternehmen','besuchen'].includes(t));
  const match=relevance(featureTs,[[p.title,11],[p.description,5],[p.kind_label,7],[p.family_focus,2]]);
  const locScore=loc?45:0;
  const regionOnly=!!p.state&&exactPhrase(q,p.state);
  const score=locScore+(regionOnly?15:0)+match.score+Math.min(12,match.coverage*8);
  return {item:p,score,loc,match};
 }).filter(x=>x.score>=19&&(x.loc||x.match.hit>0));
 if(locationSpecified&&locationMatches.length){
   // Bei ausdrücklich angegebenem Ort nie unbemerkt in eine andere Region springen.
   return candidates.filter(x=>x.loc||x.score>=45).sort((a,b)=>b.score-a.score).slice(0,4);
 }
 return candidates.sort((a,b)=>b.score-a.score).slice(0,4);
}
function answerPlaces(items,q){
 const selected=items.slice(0,3);
 const accessible=/\b(rollstuhl|barrierefrei|barrierearm|mobilitat|behindert)\b/.test(q);
 const labels=selected.map(x=>'„'+x.item.title+'“ ('+(x.item.region_label||x.item.state||'Region prüfen')+')').join(', ');
 const first=selected[0].item;
 let answer='Im vorhandenen Ausflugskatalog finde ich '+selected.length+' passende'+
   (selected.length===1?'n Eintrag':' Einträge')+': '+labels+'. ';
 if(accessible){
  const a=first.accessibility;
  if(a?.status==='documented'&&a.summary)answer+='Für „'+first.title+'“ ist dokumentiert: '+shorten(a.summary,240)+' ';
  else answer+='Für die Zugänglichkeit des ersten Ziels liegen keine hinreichend geprüften Detailangaben vor. ';
 }
 answer+='Das sind gespeicherte, keine live geprüften Ergebnisse. Öffnungszeiten, Preise und konkrete Barrieren bitte vor dem Besuch klären.';
 const firstSource=accessible&&first.accessibility?.source_url?first.accessibility.source_url:first.info_url;
 return result(answer,{kind:'places',pageId:'map',placeId:first.id,
  sources:simpleSource(first.title+' – Besuchsinformationen',firstSource),
  related:selected.map(x=>({label:x.item.title,placeId:x.item.id,pageId:'map'}))});
}
function answerRegional(q,region,office,service){
 const options=(region.offices||[]).filter(x=>service.includes(x.topic));
 if(!options.length)return null;
 const a=options[0];
 const reply='Für '+region.name+' nennt unser regionaler Wegweiser „'+a.title+'“ als Anlaufstelle. '+
   shorten(a.detail,500)+(a.contact?' Erfasste Telefonnummer: '+a.contact+'.':'')+
   ' Die tatsächliche Zuständigkeit richtet sich nach dem Wohnort und der konkreten Leistung. Kontaktdaten und Antragswege bitte aktuell prüfen.';
 return result(reply,{pageId:'guide',kind:'regional',navigationQuery:a.title,sources:simpleSource(a.title,a.url),
  related:options.slice(1,3).map(x=>({label:x.title,question:x.title}))});
}
function routeFor(q,ts,routes){
 for(const [id,pattern] of ACTIONS)if(pattern.test(q)){
  const found=routes.find(r=>r.id===id);if(found)return found;
 }
 let matches=routes.map(r=>{
  const a=relevance(ts,[[r.title,9],[r.words,3],[r.subtitle,2]]);
  return {r,score:a.score,coverage:a.coverage};
 }).filter(a=>a.score>=7).sort((a,b)=>b.score-a.score||b.coverage-a.coverage);
 return matches[0]?.r||null;
}
function safeDateSensitiveAnswer(q,best,ctx){
 const benefit=['kindergeld','kinderzuschlag','wohngeld','elterngeld','pflegegeld','unterhaltsvorschuss'].find(x=>q.includes(x));
 const resource=(ctx.germanyResources||[]).concat(ctx.brandenburgResources||[])
   .find(x=>x.id===benefit);
 const topic=(ctx.topics||[]).find(x=>x.id===benefit);
 const inclusion=(ctx.inclusion||[]).find(x=>(benefit==='pflegegeld'&&x.id==='care-grade'));
 const linked=resource?simpleSource(resource.title,resource.url):
   articleSource(topic||inclusion);
 return result('Einen aktuell gültigen Eurobetrag oder persönlichen Anspruch kann der Offline-Assistent nicht verlässlich berechnen. '+
   ((topic||inclusion)?.overview?shorten((topic||inclusion).overview,360)+' ':'')+
   'Die aktuellen Beträge und Voraussetzungen stehen bei der zuständigen offiziellen Stelle.',{
    pageId:'guide',kind:'limit',sources:linked});
}
// API: alle Inhalte werden von der App als geprüfte Sammlungen übergeben.
export function answerFamilyQuestion(question,ctx={}){
 const raw=String(question??'').trim().slice(0,600),q=norm(raw),ts=tokens(raw);
 if(raw.length<3)return result('Bitte gib eine etwas genauere Frage ein.',{kind:'clarify'});
 if(emergency.test(q))return result('Bei akuter Atemnot, Bewusstlosigkeit, schweren Verletzungen oder anderen lebensbedrohlichen Symptomen bitte sofort den Notruf 112 wählen. Diese App kann einen Notfall nicht beurteilen.',{
   kind:'safety',sources:simpleSource('Gesundheitsportal des Bundes – Kindernotfälle',emergencyUrl)});
 if(/\b(meinen|meine|mein)\b.*\b(private|privaten|nachrichten|kontostand|passwort|chats)\b/.test(q)&&
    /\b(lesen|weiss|weist|steht|anzeigen|sag|zeigen|kenn)\b/.test(q))
    return result('Ich kann keine privaten Nachrichten, Kontodaten oder Passwörter einsehen. Öffne dafür den entsprechenden geschützten App-Bereich.',{
      kind:'privacy',pageId:/\bpasswort\b/.test(q)?'profile':'chat'});
 if(/\bpasswort\b/.test(q)&&/\b(mein|meine|meinen|mir|ich|du|dein)\b/.test(q)&&
    /\b(weisst|weiss|kennst|lautet|sag|zeige|steht|anzeigen|vergessen|zurucksetzen)\b/.test(q))
   return result('Ich kenne dein Passwort nicht und kann es nicht einsehen. Über die Kontoeinstellungen kannst du den vorgesehenen Weg zum Ändern oder Zurücksetzen nutzen.',{kind:'privacy',pageId:'profile'});
 // Ein eng begrenzter Kontext aus dem vorherigen redaktionellen Treffer
 // beantwortet typische Folgefragen, ohne persönliche Daten zu verarbeiten.
 const previous=ctx.previousContext;
 const isGenericFollowup=(/\b(und|dazu|dafur|dabei|hierzu|das|diesem|diese)\b/.test(q)&&ts.length<=3)||
   (ts.length>0&&ts.length<=3&&ts.every(x=>
    ['unterlagen','dokumente','nachweise','formulare','antrag','beantragen','zustandig','ansprechpartner','voraussetzungen','schritte','fristen','frist','beachten','widerspruch'].includes(x)));
 if(previous&&isGenericFollowup&&['topic','inclusion'].includes(previous.kind)){
   const collection=previous.kind==='topic'?ctx.topics:ctx.inclusion;
   const item=(collection||[]).find(x=>x.id===previous.id);
   if(item){
     const entry={kind:previous.kind,item};
     return result(textForArticle(entry,findIntent(q),q),{
       kind:'article',pageId:previous.kind==='topic'?'guide':'inclusion',
       navigationQuery:item.title,contextRef:{kind:previous.kind,id:item.id},
       sources:articleSource(item),
       related:[
         {label:'Welche Unterlagen brauche ich?',question:'Welche Unterlagen brauche ich?'},
         {label:'Wer ist dafür zuständig?',question:'Wer ist dafür zuständig?'},
         {label:'Was muss ich beachten?',question:'Was muss ich beachten?'}
       ]});
   }
 }
 const factMatches=rankFacts(q,ts,ctx.facts);
 // Geprüfte Wissensfragen vor Navigationswörtern wie „Regen“ behandeln.
 if(factMatches.length&&factMatches[0].score>=45){
  const fact=factMatches[0].item;
  return result(fact.answer,{kind:'fact',sources:articleSource(fact),related:[]});
 }
 // Eindeutige App-Fragen funktionieren auch ohne fachliche Suchbegriffe.
 const earlyRoute=routeFor(q,ts,ctx.routes||[]);
 if(earlyRoute&&ACTIONS.some(([id,pattern])=>id===earlyRoute.id&&pattern.test(q))&&PAGE_TEXT[earlyRoute.id])
  return result(PAGE_TEXT[earlyRoute.id],{kind:'navigation',pageId:earlyRoute.id,
    searchQuery:earlyRoute.id==='market'?raw:''});
 if(!ts.length)return result('Wähle am besten ein konkretes Thema wie Kita, Kinderzuschlag, Familienausflug oder Quiz.',{kind:'clarify',related:genericRelated(ctx)});
 // Ohne benannte Verwaltungsleistung keine zuständige Behörde erfinden.
 if(/\b(zustandig|zustandigkeit|welcher landkreis|welche region)\b/.test(q)&&
    !/\b(elterngeld|kindergeld|kita|betreuung|pflegegrad|eingliederungshilfe|teilhabe|unterhalt|wohngeld|schulbegleitung|geburt|standesamt|jugendamt|behinderung)\b/.test(q)&&
    !ctx.previousContext)
    return result('Für welche Leistung oder welchen Antrag suchst du eine zuständige Stelle? Bitte nenne zum Beispiel Elterngeld, Kita, Pflegegrad oder Wohngeld und den betreffenden Wohnort.',{kind:'clarify'});
 const docs=rankDocuments(q,ts,ctx),best=docs[0];
 if(amount.test(q))return safeDateSensitiveAnswer(q,null,ctx);
 // Bei allgemeinen Themen nicht zufällig einen hochspezialisierten Antrag wählen.
 if(ts.length===1&&['behinderung','inklusion','teilhabe','beratung'].includes(ts[0]))
   return result(PAGE_TEXT.inclusion,{kind:'navigation',pageId:'inclusion'});
 const requestedRoute=routeFor(q,ts,ctx.routes||[]);
 if(requestedRoute&&['discover','push','profile','inbox','contacts','chat','calendar','box','sell','market'].includes(requestedRoute.id)&&
   ACTIONS.some(([id,pattern])=>id===requestedRoute.id&&pattern.test(q))){
   return result(PAGE_TEXT[requestedRoute.id],{kind:'navigation',pageId:requestedRoute.id,
     searchQuery:requestedRoute.id==='market'?raw:''});
 }
 const region=regionFor(q,ctx.region,ctx.brandenburgRegions||[]);
 const service=serviceFor(q);
 if(region&&service.length){
  const reg=answerRegional(q,region,null,service);
  if(reg)return reg;
 }
 const staticRoute=/\b(kaufen|verkaufen|inserieren|flohmarkt|basar)\b/.test(q)?routeFor(q,ts,ctx.routes||[]):null;
 if(staticRoute&&['market','sell','box'].includes(staticRoute.id)){
  return result(PAGE_TEXT[staticRoute.id],{kind:'navigation',pageId:staticRoute.id,
    searchQuery:staticRoute.id==='market'?raw:''});
 }
 // Amtlich verifizierte Anmelde- und Geburtsinformationen vor allgemeinen Treffern.
 const detailMap=[
  [/\b(elternzeit)\b/,'parental_leave_plan'],
  [/\b(mutterschutz|mutterschaftsgeld)\b/,'maternity_benefits'],
  [/\b(geburtsurkunde|standesamt)\b/,'birth_certificate'],
  [/\b(kindergeld|familienkasse)\b/,'child_benefit']
 ];
 for(const [re,id] of detailMap){
  if(re.test(q)&&ctx.guideDetails?.[id]&&
     !(best?.kind==='topic'&&best?.alias>=50&&(
       (id==='maternity_benefits'&&best.item.id==='mutterschutz-mutterschaftsgeld'&&
        !/\b(wann|frist|fristen|wie lange|wochen|beginn|dauer)\b/.test(q))||
       (id==='birth_certificate'&&best.item.id==='geburt-checkliste'&&
        !/\b(wann|frist|fristen|wie lange|tage)\b/.test(q))))&&
     !(id==='child_benefit'&&(
       (best?.kind==='topic'&&best.item.id==='kindergeld-antrag'&&
        !/\b(wann|frist|fristen|ruckwirkend)\b/.test(q))||
       (best?.item?.id==='kindergeld-disability'&&/\b(behinderung|behindert|25)\b/.test(q))||
       (best?.alias>=50&&best?.item?.id!=='kindergeld')))){
    const d=ctx.guideDetails[id],intent=findIntent(q);
    let ans=intent==='documents'?d.documents:intent==='office'?d.where:d.when;
    if(!ans)ans=d.when||d.where||d.documents;
    if(!ans)continue;
    return result(shorten(ans,650)+' Bitte prüfen, welche Vorgaben für deinen Fall und den aktuellen Rechtsstand gelten.',{
       kind:'article',pageId:'guide',
       sources:d.source?simpleSource(d.source.label,d.source.url):[]});
  }
 }
 if(best&&best.score>=30){
   if(best.kind==='topic'||best.kind==='inclusion'){
     const competitor=docs.find(x=>x!==best&&x.score>=best.score*.88&&x.kind!==best.kind);
     // Sehr knappe Mehrdeutigkeit lieber nachvollziehbar als scheinbar sicher beantworten.
     if(competitor&&best.alias<28&&best.score<49)
      return result('Zu dieser Frage kommen mehrere Themen in Betracht. Bitte wähle das passende oder präzisiere deine Frage.',{
       kind:'clarify',related:docs.slice(0,3).map(d=>({label:d.item.title,question:d.item.title}))});
     return result(textForArticle(best,findIntent(q),q),{
       kind:'article',pageId:best.kind==='topic'?'guide':'inclusion',navigationQuery:best.item.title,
       contextRef:{kind:best.kind,id:best.item.id},
       sources:articleSource(best.item),
       related:[
         {label:'Welche Unterlagen brauche ich?',question:'Welche Unterlagen brauche ich?'},
         {label:'Wer ist dafür zuständig?',question:'Wer ist dafür zuständig?'},
         ...docs.filter(d=>d!==best&&d.kind===best.kind&&(d.alias>=18||(d.hit>=2&&d.score>=best.score*.55)))
           .slice(0,1).map(d=>({label:d.item.title,question:d.item.title}))
       ]
     });
   }
   if(best.kind==='health'){
    const a=best.item;
    return result(shorten(a.description,560)+' Weitere Informationen findest du in „Sport & Gesundheit“. Teilnahmebedingungen und Preise beim Anbieter prüfen.',{
      kind:'resource',pageId:'healthy',navigationQuery:a.title,sources:simpleSource(a.source||a.title,a.url),
      related:docs.filter(d=>d!==best&&d.kind==='health').slice(0,2).map(d=>({label:d.item.title,question:d.item.title}))});
   }
   if(best.kind==='resource'){
    const a=best.item;
    return result(shorten(a.description||a.explanation,560)+' Auf der verlinkten offiziellen Seite findest du weitere Informationen.',{
      kind:'resource',pageId:'guide',sources:simpleSource(a.title,a.url)});
   }
 }
 // Geografische Anfragen ausschließlich anhand vorhandener öffentlich erfasster Ziele.
 const placeCandidates=placeMatches(q,ts,ctx.allPlaces||[]);
 if(placeCandidates.length&&(/(?:\b(in|bei|rund um|umgebung|nahe)\b)/.test(q)||
   /\b(ausflug|ausflugsziel|spielplatz|therme|indoor|zoo|museum|baden|barrierefrei|rollstuhl)\b/.test(q)||
   placeCandidates.some(x=>exactPhrase(q,x.item.title))))
   return answerPlaces(placeCandidates,q);
 // Spezifische staatliche Verwaltungsportale – keine erfundene lokale Behörde.
 const state=(ctx.germanyStates||[]).find(st=>
   norm(st.name).length>=4&&exactPhrase(q,st.name));
 if(state&&/\b(amt|behorde|antrag|formular|verwaltung|dienst|elterngeld)\b/.test(q))
   return result('Für '+state.name+' ist das offizielle Landesportal ein geeigneter Einstieg. Konkrete Behörden, Zuständigkeiten und Formulare müssen für den Wohnort ausgewählt werden.',{
     kind:'regional',pageId:'guide',sources:simpleSource('Serviceportal '+state.name,state.portal_url)});
 const route=routeFor(q,ts,ctx.routes||[]);
 if(route&&PAGE_TEXT[route.id]){
   return result(PAGE_TEXT[route.id],{kind:'navigation',pageId:route.id,
     searchQuery:route.id==='market'?raw:'',
     related:[]});
 }
 return result('Dazu habe ich noch keine ausreichend passende, geprüfte Antwort in Familienfunke. Formuliere die Frage konkreter oder wähle eines der vorhandenen Themen. Ich möchte keine Fakten erfinden.',{
   kind:'unanswered',related:genericRelated(ctx),pageId:'guide'});
}
