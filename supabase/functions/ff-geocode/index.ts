import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {withSupabase} from "npm:@supabase/server@^1";
import {normalizeGeocodes} from "./normalize.js";

const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export default{
 fetch:withSupabase({auth:"user"},async(req,ctx)=>{
   if(req.method!=="POST")return reply({error:"method"},405);
   const uid=ctx.userClaims?.id;
   if(!uid)return reply({error:"auth"},401);
   let body;
   try{const raw=await req.text();if(raw.length>1500)return reply({error:"query"},400);body=JSON.parse(raw);}catch{return reply({error:"query"},400);}
   const query=typeof body?.query==="string"?body.query.trim().replace(/\s+/g," "):"";
   if(query.length<3||query.length>160||/[\x00-\x1f\x7f@]/.test(query))return reply({error:"query"},400);
   const {data,error}=await ctx.supabaseAdmin.rpc("ff_geocode_claim",{p_user_id:uid});
   if(error)return reply({error:"unavailable"},503);
   if(data!==true)return reply({error:"quota"},429);
   try{
     // The demo host is explicitly beta-only. Configure an operator-owned Photon API before public launch.
     const endpoint=Deno.env.get("FF_PHOTON_ENDPOINT")||"https://photon.komoot.io/api";
     const url=new URL(endpoint);
     if(url.protocol!=="https:")return reply({error:"unavailable"},503);
     url.searchParams.set("q",query);
     url.searchParams.set("countrycode","DE");
     url.searchParams.set("lang","de");
     url.searchParams.set("limit","10");
     const r=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"Familienfunke-Beta-Geocoding/1.0"},signal:AbortSignal.timeout(9000),redirect:"error"});
     if(!r.ok)return reply({error:r.status===429?"quota":"unavailable"},r.status===429?429:503);
     const result=await r.json();
     if(!Array.isArray(result?.features))return reply({error:"unavailable"},503);
     return reply({places:normalizeGeocodes(result),provider:"Photon / OpenStreetMap"});
   }catch{return reply({error:"unavailable"},503);}
 })
};
