// Only public geographical facts are returned, never arbitrary provider properties.
const clean=(v,max=120)=>typeof v==='string'?v.replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
export function normalizeGeocodes(body){
 const out=[],seen=new Set();
 for(const f of (Array.isArray(body?.features)?body.features:[]).slice(0,30)){
   const p=f?.properties||{},coord=f?.geometry?.coordinates;
   if(f?.geometry?.type!=='Point'||!Array.isArray(coord)||String(p.countrycode||'').toUpperCase()!=='DE')continue;
   const [longitude,latitude]=coord;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<47||latitude>55.2||longitude<5.5||longitude>15.6)continue;
   const street=clean(p.street),house=clean(p.housenumber,20),name=clean(p.name);
   const city=clean(p.city||p.district||p.county),postcode=clean(p.postcode,12),state=clean(p.state);
   const address=[street,house].filter(Boolean).join(' ');
   const title=house&&address?address:name||street||city||postcode;
   if(!title)continue;
   const area=[postcode,city].filter(Boolean).join(' ');
   const subtitle=[name&&name!==title&&name!==city?name:'',area!==title?area:'',state].filter(Boolean).join(' · ').slice(0,240);
   const kind=house?'Adresse':p.type==='street'||p.osm_key==='highway'?'Straße':p.type==='city'||['city','town','village','hamlet','municipality'].includes(p.osm_value)?'Ort':'Kartentreffer';
   const key=title.toLowerCase()+'|'+latitude.toFixed(5)+'|'+longitude.toFixed(5);
   if(seen.has(key))continue;seen.add(key);
   out.push({id:'geo:'+String(p.osm_type||'')+':'+String(p.osm_id||'')+':'+latitude.toFixed(6)+':'+longitude.toFixed(6)+':'+title,
     title,subtitle:[kind,subtitle].filter(Boolean).join(' · '),latitude,longitude,source:'geocode',kind});
   if(out.length===10)break;
 }
 return out;
}
