// Offline, private search in already loaded and curated map places.
// No GPS, address lookup service, or geocoding request is triggered by typing.
const fold=value=>String(value||'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/ß/g,'ss')
  .replace(/[^a-zA-Z0-9 ]/g,' ')
  .replace(/\s+/g,' ').toLowerCase().trim();

const pickCoordinate=(value,first,second)=>{
  const v=Number(value?.[first]??value?.[second]);
  return Number.isFinite(v)?v:null;
};

export function findFamilyMapLocations(query, collections={},maxResults=10){
 const needle=fold(query).slice(0,80);
 if(needle.length<2)return [];
 const result=[];
 const sources=[
  ['Stadt','city',collections.centers||[]],
  ['Ausflugsziel','curated',collections.curated||[]],
  ['Familienziel','national',collections.national||[]],
  ['Familienort','community',(collections.community||[]).filter(
     p=>p.moderation_status==='approved')],
  ['OpenStreetMap-Ort','osm',collections.osm||[]]
 ];
 for(const [label,source,items] of sources){
   for(const place of items){
     const latitude=pickCoordinate(place,'latitude','lat');
     const longitude=pickCoordinate(place,'longitude','lon');
     if(latitude===null||longitude===null||
        latitude<47||latitude>55.2||longitude<5.5||longitude>15.6)continue;
     const title=String(place.title||place.name||'').trim().slice(0,110);
     const region=String(place.region_label||place.state||'').trim().slice(0,100);
     const name=fold(title),area=fold(region);
     const haystack=(name+' '+area).trim();
     if(!haystack.includes(needle) &&
        !needle.split(' ').every(token=>haystack.includes(token)))continue;
     const score=name===needle?100:area===needle?85:
       name.startsWith(needle)?75:area.startsWith(needle)?65:
       name.includes(needle)?55:area.includes(needle)?45:30;
     result.push({id:source+':'+String(place.id||title),
       title,subtitle:[label,region].filter(Boolean).join(' · '),
       latitude,longitude,source,score,place});
   }
 }
 const distinct=new Map();
 for(const entry of result){
   const key=entry.source+':'+fold(entry.title)+':'+
     entry.latitude.toFixed(4)+':'+entry.longitude.toFixed(4);
   if(!distinct.has(key)||distinct.get(key).score<entry.score)distinct.set(key,entry);
 }
 return [...distinct.values()].sort((a,b)=>b.score-a.score||
   a.title.localeCompare(b.title,'de')).slice(0,Math.max(1,Math.min(20,maxResults)));
}


// Same ordered list is used for native rows and interactive map pins.
// External results are kept separate from approved family destinations.
export function mergeMapSearchResults(local,external,limit=10){
 const safe=(Array.isArray(external)?external:[]).filter(p=>p?.source==='geocode'&&
   typeof p.id==='string'&&typeof p.title==='string'&&typeof p.subtitle==='string'&&
   typeof p.kind==='string'&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&
   p.latitude>=47&&p.latitude<=55.2&&p.longitude>=5.5&&p.longitude<=15.6);
 const primary=local.slice(0,safe.length?Math.min(5,limit):limit);
 const seen=new Set(primary.map(p=>fold(p.title)+':'+p.latitude.toFixed(3)+':'+p.longitude.toFixed(3)));
 const places=[...primary];
 for(const p of [...safe,...local]){
   const key=fold(p.title)+':'+p.latitude.toFixed(3)+':'+p.longitude.toFixed(3);
   if(seen.has(key))continue;
   seen.add(key);places.push(p);
   if(places.length>=limit)break;
 }
 return places.slice(0,limit);
}
