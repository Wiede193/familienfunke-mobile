// Öffentliche OpenStreetMap-Daten für eine ausdrücklich angeforderte Kartensuche.
// Keine Adressen, Profile oder GPS-Geräteposition an OpenStreetMap übermitteln.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {withSupabase} from "npm:@supabase/server@^1";

const endpoint="https://overpass-api.de/api/interpreter";
type OSMNode={type:string;id:number;lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>};
type Place={id:string;title:string;category:string;latitude:number;longitude:number;has_changing_table:boolean;description:string;source:string};
function response(message:string,status:number){return Response.json({error:message,places:[]},{status});}
function finite(v:unknown,min:number,max:number){return typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;}
function category(t:Record<string,string>){
  if(t.leisure==="playground")return "playground";
  if(["restaurant","cafe"].includes(t.amenity??"") && ["yes","limited"].includes(t.changing_table??""))return "changing";
  if(["zoo","museum","attraction"].includes(t.tourism??""))return "outing";
  return null;
}
function sanitize(items:unknown):Place[]{
 if(!Array.isArray(items))return [];
 const seen=new Set<string>(), places:Place[]=[];
 for(const item of items.slice(0,450) as OSMNode[]){
   const tags=item.tags||{};
   const typ=category(tags);
   const lat=item.lat??item.center?.lat;
   const lon=item.lon??item.center?.lon;
   if(!typ||!finite(lat,47,55.3)||!finite(lon,5.3,15.7))continue;
   const key="osm-"+item.type+"-"+item.id;
   if(seen.has(key))continue;seen.add(key);
   const defaultTitle=typ==="playground"?"Spielplatz":typ==="changing"?"Wickelmöglichkeit":"Ausflugsziel";
   const title=String(tags.name||defaultTitle).slice(0,100);
   const extra=typ==="changing"?"Wickeltisch laut OpenStreetMap":
     typ==="playground"?"Spielplatz laut OpenStreetMap":"Als Ausflugsziel in OpenStreetMap erfasst";
   places.push({id:key,title,category:typ,latitude:lat as number,longitude:lon as number,
     description:extra,has_changing_table:tags.changing_table==="yes"||tags.changing_table==="limited",source:"osm"});
   if(places.length>=140)break;
 }
 return places;
}

export default{
 fetch:withSupabase({auth:"user"},async(req,ctx)=>{
   if(req.method!=="POST")return response("Methode nicht erlaubt",405);
   if(!ctx.userClaims?.id)return response("Anmeldung erforderlich",401);
   let q:Record<string,unknown>;
   try{q=await req.json();}catch{return response("Ungültige Anfrage",400);}
   const lat=q?.latitude,lon=q?.longitude;
   if(!finite(lat,47,55.3)||!finite(lon,5.3,15.7))return response("Bitte eine Region in Deutschland auswählen",400);
   // Geografischer Suchradius ist serverseitig fixiert. Keine Deutschland-Massenabfragen.
   const latNum=Number(lat).toFixed(4),lonNum=Number(lon).toFixed(4);
   const around="(around:4500,"+latNum+","+lonNum+")";
   const query="[out:json][timeout:18];("+
     "nwr[\"leisure\"=\"playground\"]"+around+";"+
     "nwr[\"amenity\"~\"^(restaurant|cafe)$\"][\"changing_table\"~\"^(yes|limited)$\"]"+around+";"+
     "nwr[\"tourism\"~\"^(zoo|museum|attraction)$\"]"+around+";"+
     ");out center 200;";
   try{
     const res=await fetch(endpoint,{method:"POST",headers:{
       "Content-Type":"application/x-www-form-urlencoded",
       "User-Agent":"Familienfunke family map (OpenStreetMap integration)",
       "Accept":"application/json",
     },body:new URLSearchParams({data:query}).toString(),signal:AbortSignal.timeout(24000)});
     if(!res.ok)return response("Die freien Kartendaten sind momentan nicht erreichbar",503);
     const json=await res.json();
     return Response.json({places:sanitize(json?.elements),source:"OpenStreetMap contributors",
       fetched_at:new Date().toISOString()});
   }catch(e){
     console.error("ff-family-map-search: Overpass request failed",String(e));
     return response("Kartendaten momentan nicht erreichbar – bitte später erneut suchen",503);
   }
 })
};
