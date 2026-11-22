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
  'Lesen':['museum','burg','besucherzentrum']
};
export function regionMatches(placeRegion,profileRegion) {
  const a=normalizeFamilyRegion(placeRegion),b=normalizeFamilyRegion(profileRegion);
  if(!a||!b)return false;
  return a===b||a.includes(b)||b.includes(a);
}
export function recommendFamilyPlaces(places,{region='',interests=[]}={},count=3){
  const interestsList=Array.isArray(interests)?interests.filter(x=>typeof x==='string'):[];
  const scored=(Array.isArray(places)?places:[]).filter(p=>p?.id&&p?.title)
    .map((p,index)=>{
      const local=regionMatches(p.region_label,region);
      const text=normalizeFamilyRegion([p.title,p.description,p.category].join(' '));
      const interestScore=interestsList.reduce((sum,i)=>sum+
        (WORD_GROUPS[i]||[]).filter(keyword=>text.includes(keyword)).length,0);
      return {place:p,isLocal:local,score:Number(local)*100+Math.min(interestScore,8)*10,index};
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
