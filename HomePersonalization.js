// Deterministic, truthful homepage recommendations. Never claim that a place
// is currently open, that a listing is available without an approved server
// result, or that a place is geographically nearby from a vague region.
export function normalizeFamilyRegion(value) {
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9 ]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase();
}
const WORD_GROUPS={
  'Tiere':['tier','wildpark','zoo','natur'],
  'Natur':['natur','wald','see','park','wander'],
  'Wandern':['wander','natur','wald','dune'],
  'Museen':['museum','burg','ausstellung','besucherzentrum'],
  'Spielplatz':['spiel','park','mitmach'],
  'Ausflüge':['ausflug','park','burg','museum','natur'],
  'Radfahren':['rad','natur','park'],
  'Lesen':['museum','burg','besucherzentrum','bibliothek','buch'],
  'Schwimmen':['schwimm','erlebnisbad','therme','bade','wasserpark','water'],
  'Schwimmbäder':['schwimm','erlebnisbad','therme','bade','wasserpark','water'],
  'Indoorspielplätze':['indoorspiel','indoor spiel','spielhalle','trampolin','indoor'],
  'Trampolinparks':['trampolin','sprunghalle'],
  'Freizeitparks':['freizeitpark','erlebnispark','mitmachpark','theme'],
  'Tierpark & Zoo':['tierpark','zoo','wildpark','tierhof'],
  'Tierbeobachtung':['wildpark','tierpark','vogel','naturpark'],
  'Bauernhof':['bauernhof','tierhof','erlebnishof'],
  'Strand & See':['badesee','strand','badestelle','seebad'],
  'Fahrradtouren':['radweg','radfahren','fahrrad','radtour'],
  'Spazierengehen':['spazier','wanderweg','naturpfad','park'],
  'Gemeinsame Spaziergänge':['spazier','wanderweg','naturpfad','park'],
  'Klettern':['kletter','seilgarten','hochseil'],
  'Bouldern':['boulder','kletterhalle'],
  'Familiencafés':['familiencafe','spielcafe','food play','spielbereich'],
  'Bibliotheken':['bibliothek','bucherei'],
  'Theater':['theater','puppenspiel','buhne'],
  'Kino':['kino','lichtspiel'],
  'Basteln':['werkstatt','bastel','mitmach'],
  'Technik & Tüfteln':['technikmuseum','experiment','science center','mitmachlabor']
};
const interestKeywords=new Map(Object.entries(WORD_GROUPS).map(([label,words])=>[normalizeFamilyRegion(label),words.map(normalizeFamilyRegion)]));
export function regionMatches(placeRegion,profileRegion) {
  const a=normalizeFamilyRegion(placeRegion),b=normalizeFamilyRegion(profileRegion);
  if(!a||!b)return false;
  return a===b||((a.length>=3&&b.length>=3)&&((' '+a+' ').includes(' '+b+' ')||(' '+b+' ').includes(' '+a+' ')));
}
// Only explicit profile choices and real catalogue metadata; no click tracking.
export function matchingPlaceInterests(place,interests=[]){
  const text=normalizeFamilyRegion([place?.title,place?.description,place?.category,place?.kind,place?.kind_label,place?.family_focus].filter(Boolean).join(' '));
  const matched=[];let score=0;const seen=new Set();
  for(const label of Array.isArray(interests)?interests:[]){
    if(typeof label!=='string')continue;
    const key=normalizeFamilyRegion(label);if(seen.has(key))continue;seen.add(key);
    const hits=(interestKeywords.get(key)||[]).filter(word=>text.includes(word)).length;
    if(hits){matched.push(label);score+=hits;}
  }
  return {matched,score};
}
export function placeRecommendationReason({isLocal,matchedInterests=[]}){
  const hobbies=matchedInterests.slice(0,2).join(' & ');
  return isLocal?(hobbies?'Eure Region · '+hobbies:'Eure angegebene Region'):hobbies?'Interesse: '+hobbies:'Ausflugstipp aus dem Katalog';
}
export function recommendFamilyPlaces(places,{region='',interests=[]}={},count=3){
  const seen=new Set();
  const scored=(Array.isArray(places)?places:[]).filter(p=>{if(!p?.id||!p?.title||seen.has(p.id))return false;seen.add(p.id);return true;})
    .map((p,index)=>{
      const local=[p.region_label,p.district,p.state].some(label=>regionMatches(label,region));
      const {matched,score:interestScore}=matchingPlaceInterests(p,interests);
      return {place:p,isLocal:local,matchedInterests:matched,score:Number(local)*100+Math.min(interestScore,8)*10,index};
    });
  scored.sort((a,b)=>b.score-a.score||a.index-b.index);
  return scored.slice(0,Math.max(0,Math.min(count,5)));
}
export function selectHomeOffers(rows,{region='',ownerId=null}={},count=3){
  return (Array.isArray(rows)?rows:[]).map(r=>r?.listing||r)
    .filter(x=>x?.id&&x?.title&&x.moderation_status==='approved'&&x.seller_id!==ownerId)
    .sort((a,b)=>Number(regionMatches(b.region_label,region))-Number(regionMatches(a.region_label,region)))
    .slice(0,Math.max(0,Math.min(count,5)));
}
export function selectHomeEvents(rows,{region=''}={},count=2,now=Date.now()){
  return (Array.isArray(rows)?rows:[])
    .filter(x=>x?.id&&x?.title&&['family','partner'].includes(x.kind)&&
      Number.isFinite(new Date(x.starts_at).getTime())&&new Date(x.starts_at).getTime()>now)
    .sort((a,b)=>Number(regionMatches(b.region_label,region))-Number(regionMatches(a.region_label,region))
      ||new Date(a.starts_at)-new Date(b.starts_at))
    .slice(0,Math.max(0,Math.min(count,5)));
}
export function missingFamilyProfileStep(profile){
  if(!profile?.region_label?.trim())return {title:'Region auswählen',detail:'Dann können wir regionale Inhalte hervorheben.',route:'profile'};
  if(!Array.isArray(profile.interests)||!profile.interests.length)
    return {title:'Interessen auswählen',detail:'So werden Ideen passend zu euren Hobbys sortiert.',route:'profile'};
  if(!profile.about?.trim())return {title:'Familie vorstellen',detail:'Erzähle anderen Familien ein wenig über euch.',route:'profile'};
  return null;
}
export function homeGreeting(profile){
  const name=String(profile?.display_name||'').trim().slice(0,32);
  return name?'Hallo, '+name+'!':'Schön, dass ihr da seid!';
}
