// Recommendations use only the own profile, private local preferences and already authorized data.
// No behavioral tracking, inferred clothing sizes, geocoding, AI or network requests.
export const AGE_OPTIONS=[['baby','0–2 Jahre'],['preschool','3–5 Jahre'],['school','6–10 Jahre'],['teen','11–17 Jahre']];
export const DEFAULT_HOME_PREFS={enabled:false,ages:[]};
const fold=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
const validAges=new Set(AGE_OPTIONS.map(([id])=>id));
export function sanitizeHomePrefs(p){
 return {enabled:p?.enabled===true,ages:[...new Set(Array.isArray(p?.ages)?p.ages.filter(a=>validAges.has(a)):[])]};
}
const cluster=['Landkreis Oder-Spree','Fürstenwalde/Spree','Fürstenwalde (Spree)','Fürstenwalde','Beeskow','Eisenhüttenstadt','Bad Saarow','Storkow (Mark)','Storkow'].map(fold);
export const sameHomeRegion=(a,b)=>{const x=fold(a),y=fold(b);return !!x&&!!y&&(x===y||(cluster.includes(x)&&cluster.includes(y)));};
const interestsToTags={
 spielplatz:['outdoors'],natur:['outdoors','animals'],radfahren:['outdoors'],wandern:['outdoors'],sport:['outdoors'],tiere:['animals'],ausfluge:['outdoors','learning'],schwimmen:['water'],fussball:['outdoors'],camping:['outdoors'],gartnern:['outdoors'],fotografie:['outdoors'],museen:['learning','inside'],picknick:['outdoors'],kino:['inside'],familiencafes:['inside'],reisen:['learning']
};
const tagsById={
 'curated-irrlandia':['outdoors'],'curated-burg-storkow':['learning'],
 'curated-waltersberge':['outdoors'],'curated-scharmuntzelland':['outdoors','animals'],
 'curated-heimattiergarten':['animals','outdoors'],'curated-wettermuseum':['inside','learning'],
 'curated-burg-beeskow':['learning'],'curated-naturparkhaus':['inside','learning'],
 'curated-wildpark-frankfurt':['animals','outdoors'],'curated-ziegenwerder':['outdoors']
};
const tagMap={theme:['outdoors'],indoor:['inside'],water:['water'],museum:['inside','learning']};
const marketInterest={
 lesen:['Bücher'],brettspiele:['Spielzeug'],spieleabende:['Spielzeug'],basteln:['Spielzeug'],handarbeiten:['Sonstiges'],musik:['Spielzeug']
};
const activityInterests={
 natur:['Formen entdecken','Geräuschkarte'],tiere:['Geräusche-Rätsel','Wort-Schatz'],basteln:['Papier-Kunst','Papier-Faltbild','Erfinderwerkstatt'],lesen:['Lieblingsbuch-Rätsel','Geschichten-Kette'],musik:['Klatschzeichen','Geräusche-Rätsel'],spieleabende:['Kategorien-Rallye','Wort-Schatz'],brettspiele:['Kategorien-Rallye','Wort-Schatz'],fotografie:['Gemeinsames Wimmelbild','Bilder aus dem Kopf']
};
const uniq=x=>[...new Set(x)];
const orderNewest=(a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||String(a.id).localeCompare(String(b.id));
const orderUpcoming=(a,b)=>String(a.starts_at).localeCompare(String(b.starts_at))||String(a.id).localeCompare(String(b.id));
export function recommendHome({profile,prefs,places=[],origins=[],distanceKm,events=[],partnerEvents=[],listings=[],ideas=[],userId,active=false,now=Date.now()}){
 const empty={places:[],events:[],offers:[],activity:null,quiz:null,interests:[],region:'',ageLabels:[]};
 const p=sanitizeHomePrefs(prefs);
 if(!p.enabled||!userId||profile?.user_id!==userId)return empty;
 const region=typeof profile.region_label==='string'?profile.region_label.trim():'';
 const interests=uniq((Array.isArray(profile.interests)?profile.interests:[]).filter(x=>typeof x==='string').map(fold)).slice(0,12);
 const tags=uniq(interests.flatMap(x=>interestsToTags[x]||[]));
 const origin=origins.find(x=>fold(x.title)===fold(region));
 const localPlaces=places.filter(x=>['curated','national'].includes(x.source)&&typeof x.id==='string').map(x=>{
  const km=origin&&distanceKm?distanceKm(origin,x):Infinity;
  return {...x,km,local:sameHomeRegion(region,x.region_label),fit:(tagsById[x.id]||tagMap[x.kind]||[]).filter(t=>tags.includes(t)).length};
 }).filter(x=>x.local||x.km<=50).sort((a,b)=>b.fit-a.fit||Number(b.local)-Number(a.local)||a.km-b.km||a.id.localeCompare(b.id));
 const placeRows=[...new Map(localPlaces.map(x=>[x.id,x])).values()].slice(0,3).map(x=>({id:x.id,title:x.title,region:x.region_label,km:Number.isFinite(x.km)?Math.round(x.km):null,reason:x.fit?'Region und Interessen':'Region'}));
 const eventRows=active?[...events.map(x=>({...x,kind:'family'})),...partnerEvents.map(x=>({...x,kind:'partner'}))]
  .filter(x=>x.id&&x.moderation_status==='approved'&&Date.parse(x.starts_at)>now&&sameHomeRegion(region,x.region_label))
  .sort(orderUpcoming).slice(0,3).map(x=>({id:x.id,kind:x.kind,title:x.title,region:x.region_label,starts_at:x.starts_at})):[];
 const categories=uniq([...interests.flatMap(x=>marketInterest[x]||[]),...(p.ages.includes('baby')?['Babyausstattung']:[]),...(p.ages.some(a=>a==='preschool'||a==='school')?['Spielzeug','Bücher']:[])]);
 // Use only declared categories, never guess a clothing size from age or use personal notes.
 const offers=active&&categories.length?listings.filter(x=>x.id&&x.seller_id!==userId&&x.moderation_status==='approved'&&categories.includes(x.category))
  .sort((a,b)=>Number(sameHomeRegion(region,b.region_label))-Number(sameHomeRegion(region,a.region_label))||orderNewest(a,b)).slice(0,3)
  .map(x=>({id:x.id,title:x.title,category:x.category,trade_type:x.trade_type,price_cents:x.price_cents,region:x.region_label})):[];
 // All existing offline activity suggestions are age 4+ with adult supervision.
 const ageAllows=p.ages.some(a=>['preschool','school','teen'].includes(a));
 const onlyBaby=p.ages.length===1&&p.ages.includes('baby');
 const names=uniq(interests.flatMap(x=>activityInterests[x]||[]));
 const selectedIdea=!onlyBaby&&(ageAllows||names.length)?(ideas.find(i=>names.includes(i.title))||ideas[0]||null):null;
 const quiz=onlyBaby?null:p.ages.includes('school')?'school':p.ages.includes('teen')?'family':p.ages.includes('preschool')?'little':null;
 return {places:placeRows,events:eventRows,offers,activity:selectedIdea,quiz,region,interests,ageLabels:AGE_OPTIONS.filter(([id])=>p.ages.includes(id)).map(([,title])=>title)};
}
