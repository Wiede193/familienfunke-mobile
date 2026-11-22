// All distances are straight-line distances, not road distances.
// No personal profile, GPS reading or external provider response is needed for ranking.
export const ORIGINS=[
 {title:'Frankfurt (Oder)',latitude:52.347,longitude:14.550},
 {title:'Fürstenwalde/Spree',latitude:52.36,longitude:14.06},
 {title:'Storkow (Mark)',latitude:52.256,longitude:13.934},
 {title:'Beeskow',latitude:52.172,longitude:14.246},
 {title:'Berlin',latitude:52.52,longitude:13.405},
 {title:'Potsdam',latitude:52.3906,longitude:13.0645},
 {title:'München',latitude:48.137,longitude:11.576},
 {title:'Hamburg',latitude:53.55,longitude:10},
 {title:'Köln',latitude:50.94,longitude:6.96},
 {title:'Leipzig',latitude:51.34,longitude:12.37},
 {title:'Dresden',latitude:51.05,longitude:13.74},
 {title:'Hannover',latitude:52.375,longitude:9.732},
 {title:'Bremen',latitude:53.079,longitude:8.802},
 {title:'Stuttgart',latitude:48.775,longitude:9.183},
 {title:'Frankfurt am Main',latitude:50.11,longitude:8.682},
 {title:'Düsseldorf',latitude:51.228,longitude:6.774}
];
export const AGES=[['baby','0–2 Jahre'],['preschool','3–5 Jahre'],['school','6–10 Jahre'],['teen','11–17 Jahre']];
export const RADII=[10,25,50,100,150];
export const BUDGETS=[0,20,50,100,200];
export const INTERESTS=[['any','Alles'],['outdoors','Natur & Bewegung'],['inside','Drinnen'],['animals','Tiere'],['learning','Entdecken & Lernen'],['water','Wasser & Baden']];
export const DURATIONS=[['half','Halber Tag'],['full','Ganzer Tag'],['weekend','Wochenende']];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
export const validOrigin=p=>!!p&&typeof p.latitude==='number'&&typeof p.longitude==='number'&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.latitude>=47&&p.latitude<=55.2&&p.longitude>=5.5&&p.longitude<=15.6;
export function localOrigins(query){
 const q=fold(query);
 return q.length<2?[]:ORIGINS.filter(x=>fold(x.title).includes(q)).slice(0,8);
}
export function remoteOrigins(rows){
 return (Array.isArray(rows)?rows:[]).filter(p=>validOrigin(p)&&p.source==='geocode'&&
  (p.kind==='Ort'||/^\d{5}$/.test(p.title||''))&&typeof p.title==='string')
  .map(({title,subtitle,latitude,longitude})=>({title,subtitle,latitude,longitude})).slice(0,8);
}
export function distanceKm(a,b){
 if(!validOrigin(a)||!validOrigin(b))return Infinity;
 const r=Math.PI/180,dLat=(b.latitude-a.latitude)*r,dLon=(b.longitude-a.longitude)*r;
 const x=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,x)));
}
// Only explicitly reviewed coarse categories, never a price, accessibility or age certificate.
const tags={
 'curated-irrlandia':['outdoors'],'curated-burg-storkow':['learning'],
 'curated-waltersberge':['outdoors'],'curated-scharmuntzelland':['outdoors','animals'],
 'curated-heimattiergarten':['animals','outdoors'],'curated-wettermuseum':['inside','learning'],
 'curated-burg-beeskow':['learning'],'curated-naturparkhaus':['inside','learning'],
 'curated-wildpark-frankfurt':['animals','outdoors'],'curated-ziegenwerder':['outdoors']
};
const knownTags=p=>tags[p.id]||({theme:['outdoors'],indoor:['inside'],water:['water'],museum:['inside','learning']}[p.kind]||[]);
export const budgetCandidate=p=>p.id==='curated-waltersberge'||p.id==='curated-ziegenwerder';
export function selectOutings(origin,places,prefs){
 const radius=Number(prefs.radius);
 if(!validOrigin(origin)||!RADII.includes(radius)||!BUDGETS.includes(prefs.budget)||!INTERESTS.some(x=>x[0]===prefs.interest))return [];
 const seen=new Set();
 return places.filter(p=>['curated','national'].includes(p.source)&&validOrigin(p)&&typeof p.id==='string'&&!seen.has(p.id)&&(seen.add(p.id),true))
  .map(p=>({...p,km:distanceKm(origin,p),tags:knownTags(p),lowCostLead:budgetCandidate(p)}))
  .filter(p=>p.km<=radius&&(prefs.interest==='any'||p.tags.includes(prefs.interest)))
  .filter(p=>prefs.budget!==0||p.lowCostLead)
  .sort((a,b)=>{
   const prioritise=prefs.budget<=20?Number(b.lowCostLead)-Number(a.lowCostLead):0;
   return prioritise||a.km-b.km||a.id.localeCompare(b.id);
  }).slice(0,10);
}
export function orderOutings(candidates,ids){
 const byId=new Map(candidates.map(p=>[p.id,p])),seen=new Set(),out=[];
 for(const id of Array.isArray(ids)?ids:[]){
  if(byId.has(id)&&!seen.has(id)){seen.add(id);out.push(byId.get(id));}
  if(out.length===3)break;
 }
 return out;
}
export function planSteps(duration,places=[],ages=[],language='de'){
 const first=places[0]?.title,second=places[1]?.title;
 if(!first)return [];
 if(language==='en'){
  const pause=ages.includes('baby')||ages.includes('preschool')?'Plan short stages and flexible food, rest and toilet breaks.':'Plan breaks and time for your own discoveries.';
  if(duration==='weekend')return ['Saturday: '+first+' as a first suggestion – only after checking opening hours, travel and costs.',second?'Sunday: optionally '+second+' or a quiet day. No combined route has been calculated.':'Sunday: a quiet day or another destination of your choice.',pause];
  if(duration==='half')return ['Before departure: check current visitor conditions and total costs.','Main activity: '+first+'. '+pause,'Then return at a time that suits you.'];
  return ['Morning: '+first+' after confirming opening hours.','Midday: food and rest break.','Afternoon: explore further on site or return early. '+pause];
 }
 const pause=ages.includes('baby')||ages.includes('preschool')?'Kurze Etappen und flexible Essens-, Ruhe- und Toilettenpausen einplanen.':'Pausen und Zeit für eigene Entdeckungen einplanen.';
 if(duration==='weekend')return ['Samstag: '+first+' als erster Vorschlag – nur nach Prüfung der Öffnung, Anfahrt und Kosten.',second?'Sonntag: optional '+second+' oder ein ruhiger Tag. Keine gemeinsame Fahrtstrecke berechnet.':'Sonntag: ein ruhiger Tag oder ein weiteres selbst gewähltes Ziel.',pause];
 if(duration==='half')return ['Vor der Abfahrt: aktuelle Besuchsbedingungen und Gesamtkosten prüfen.','Hauptaktivität: '+first+'. '+pause,'Anschließend flexible Rückfahrt.'];
 return ['Vormittag: '+first+' nach bestätigter Öffnungszeit.','Mittag: Essens- und Erholungspause.','Nachmittag: vor Ort weiter erkunden oder früher zurückfahren. '+pause];
}
