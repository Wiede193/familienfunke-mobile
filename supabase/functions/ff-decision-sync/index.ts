import {createClient} from 'npm:@supabase/supabase-js@2.80.0';
import {parseDecisions,safeSource} from './decision-rss-parse.js';

// Only explicitly approved government/parliament feeds. Never follow arbitrary links.
const SOURCES=[
 {id:'bundesregierung-kabinett',name:'Bundesregierung – Pressemitteilungen',
  url:'https://www.bundesregierung.de/service/rss/breg-de/1151244/feed.xml',level:'bund',status:'kabinett'},
 {id:'landtag-brandenburg-beschlossen',name:'Landtag Brandenburg – beschlossene Gesetze',
  url:'https://www.landtag.brandenburg.de/cms/detail.php?template=ltbrb_rss_beschlossene_gesetze_d',
  level:'brandenburg',status:'parlament'}
];
async function download(url){
 const allowed=url.includes('bundesregierung.de')?'bundesregierung.de':'landtag.brandenburg.de';
 let current=url;
 if(!safeSource(current,allowed))throw Error('untrusted_initial_url');
 let r;
 for(let hop=0;hop<3;hop++){
  r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(9000),
   headers:{'Accept':'application/rss+xml,application/xml,text/xml;q=0.9,text/plain;q=0.5',
    'User-Agent':'FamilienfunkeOfficialDecisionMonitor/1.0 (public official RSS; 3-hour interval)'}});
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');
   if(!location)throw Error('missing_redirect_location');
   const target=new URL(location,current).href;
   if(!safeSource(target,allowed))throw Error('untrusted_redirect');
   current=target;
   r=null;
   continue;
  }
  break;
 }
 if(!r)throw Error('too_many_redirects');
 if(!r.ok)throw Error('source_http_'+r.status);
 if(!safeSource(r.url,allowed))throw Error('untrusted_final_url');
 const type=r.headers.get('content-type')||'';
 if(!/xml|rss|text\/plain/i.test(type))throw Error('unexpected_content_type');
 if(Number(r.headers.get('content-length')||0)>1040000)throw Error('too_large');
 let len=0;const chunks=[];const reader=r.body?.getReader();
 if(!reader)throw Error('empty_body');
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   len+=value.length;if(len>1040000)throw Error('too_large');
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(len);let at=0;
 for(const c of chunks){bytes.set(c,at);at+=c.length;}
 return new TextDecoder().decode(bytes);
}
const json=(obj,status)=>Response.json(obj,{status,headers:{'Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const token=req.headers.get('x-ff-official-sync')||'';
 if(!/^[0-9a-f]{64}$/.test(token))return json({error:'unauthorized'},401);
 let key=null;try{key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;}catch{}
 key=key||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const url=Deno.env.get('SUPABASE_URL');
 if(!key||!url)return json({error:'server_not_configured'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authorized,error:authError}=await db.rpc('ff_official_sync_authorized',{p_token:token});
 if(authError||authorized!==true)return json({error:'unauthorized'},401);
 let added=0,scanned=0,failures=[];
 for(const source of SOURCES){
  try{
   const xml=await download(source.url);
   const found=parseDecisions(xml,source);
   scanned+=found.length;
   for(const item of found){
    const {error}=await db.from('ff_official_decisions').insert(item);
    if(!error)added++;
    else if(error.code!=='23505')throw Error('insert_failed_'+error.code);
   }
  }catch(e){failures.push(source.id+':'+String(e?.message||e).slice(0,110));}
 }
 const {error:logError}=await db.from('ff_decision_sync_runs').insert({
  new_count:added,candidate_count:scanned,source_count:SOURCES.length,errors:failures
 });
 if(logError)failures.push('log_failed');
 return json({new:added,candidates:scanned,sources:SOURCES.length,
  errors:failures.map(v=>v.split(':')[0])},failures.length===SOURCES.length?503:200);
});
