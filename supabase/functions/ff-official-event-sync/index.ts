import {createClient} from 'npm:@supabase/supabase-js@2.80.0';
import {parseJsonLdEvents,parseIcsEvents,parseStorkowHtml,normalizeEventCandidates} from './event-source-parse.js';
import {stageCandidate,recordPageCheck} from './source-sync-store.js';

const hosts=new Set(['storkow-mark.de','eberswalde.de','burg-beeskow.de',
 'seenland-oderspree.de','reiseland-brandenburg.de','kulturfabrik-fuerstenwalde.de',
 'frankfurt-oder.de','netzwerk-gesunde-kinder.de','neuenhagen-bei-berlin.de',
 'schlossgut-altlandsberg.de','bernau.de','luebben.de','koenigs-wusterhausen.de']);
function trusted(url){
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.has(u.hostname.toLowerCase().replace(/^www\./,''));
 }catch{return false;}
}
async function retrieve(url){
 if(!trusted(url))throw Error('source_not_allowed');
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(7000),
  headers:{Accept:'text/html,text/calendar;q=0.9,application/ld+json;q=0.8',
   'User-Agent':'FamilienfunkeEventVerifier/1.0 (limited daily official source check)'}});
 if(response.status===404||response.status===410)return {status:response.status,body:''};
 if(!response.ok)throw Error('http_'+response.status);
 if(Number(response.headers.get('content-length')||0)>1050000)throw Error('response_oversize');
 const type=response.headers.get('content-type')||'';
 if(!/text\/html|text\/calendar|application\/json|application\/ld\+json|text\/plain/i.test(type))
  throw Error('unexpected_content_type');
 const reader=response.body?.getReader();if(!reader)throw Error('empty_response');
 let size=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.length;if(size>1050000)throw Error('response_oversize');
   chunks.push(value);
 }}finally{reader.releaseLock();}
 const buffer=new Uint8Array(size);let p=0;
 for(const c of chunks){buffer.set(c,p);p+=c.length;}
 return {status:response.status,body:new TextDecoder().decode(buffer)};
}
const normalizedTitle=t=>String(t||'').toLowerCase().normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
async function processSource(db,source,day,stats){
 let last_error=null,items=0;
 try{
  if(source.format==='xml_tmb')throw Error('TMB_XML_requires_contract_and_schema');
  const page=await retrieve(source.url);
  if(page.status!==200)throw Error('http_'+page.status);
  const found=source.format==='ics'?parseIcsEvents(page.body,source.url):
   source.format==='html_storkow'?parseStorkowHtml(page.body,source.url):
   parseJsonLdEvents(page.body,source.url);
  const candidates=await normalizeEventCandidates(found,source,day);
  items=candidates.length;
  for(const event of candidates){
   const status=await stageCandidate(db,source,event);
   if(status==='pending')stats.new_count++;
   if(status==='duplicate')stats.duplicate_count++;
   if(status==='changed')stats.changed_count++;
   if(status==='cancelled')stats.cancellation_count++;
  }
  stats.source_count++;
 }catch(e){last_error=String(e?.message||e).slice(0,180);stats.errors.push(source.id+':'+last_error);}
 const {error}=await db.from('ff_official_event_sources').update({
  last_checked_at:new Date().toISOString(),last_error,last_item_count:items,
  ...(!last_error?{last_success_at:new Date().toISOString()}:{})
 }).eq('id',source.id);
 if(error)throw error;
}
async function checkPublicEvent(db,event,stats){
 if(!trusted(event.source_url))return;
 let status=null,cancelled=false,reason='';
 try{
  const page=await retrieve(event.source_url);status=page.status;
  if(status===200){
   const structured=parseJsonLdEvents(page.body,event.source_url);
   cancelled=structured.some(x=>x.cancelled&&normalizedTitle(x.title)===normalizedTitle(event.title));
  }else reason='Quellseite antwortet mit '+status;
 }catch(e){reason='Quellabruf: '+String(e?.message||e).slice(0,80);}
 const state=await recordPageCheck(db,event,status,cancelled,reason);
 stats.checked_count++;
 if(state==='review')stats.warning_count++;
 if(state==='cancelled')stats.cancellation_count++;
}
async function sync(db){
 const started=new Date(),today=started.toISOString().slice(0,10);
 const stats={source_count:0,new_count:0,duplicate_count:0,changed_count:0,
  cancellation_count:0,checked_count:0,warning_count:0,errors:[]};
 const {data:sources,error:sError}=await db.from('ff_official_event_sources')
  .select('id,url,format,source_name,source_kind,district,city')
  .eq('authorized',true).eq('enabled',true).order('id').limit(8);
 if(sError)throw sError;
 for(const s of sources||[])await processSource(db,s,today,stats);
 const {data:events,error:eError}=await db.from('ff_official_family_events')
  .select('id,title,source_url,start_date').eq('published',true).gte('end_date',today)
  .order('start_date',{ascending:true}).limit(100);
 if(eError)throw eError;
 const bucket=Math.floor(Date.now()/86400000)%3;
 const sample=(events||[]).filter((_,i)=>i%3===bucket).slice(0,12);
 for(let i=0;i<sample.length;i+=3){
  const checked=await Promise.allSettled(sample.slice(i,i+3).map(e=>checkPublicEvent(db,e,stats)));
  for(const item of checked)if(item.status==='rejected'){
   stats.warning_count++;stats.errors.push('event_check_failed');
  }
 }
 const {error:logError}=await db.from('ff_official_event_sync_runs').insert({
  started_at:started.toISOString(),finished_at:new Date().toISOString(),
  ...stats,errors:stats.errors.slice(0,10)
 });
 if(logError)throw logError;
 return {sources:stats.source_count,candidates:stats.new_count,
  duplicates:stats.duplicate_count,changes:stats.changed_count,
  cancellations:stats.cancellation_count,checked:stats.checked_count,
  warnings:stats.warning_count,errors:stats.errors.length};
}
const json=(data,status)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const token=req.headers.get('x-ff-official-sync')||'';
 if(!/^[0-9a-f]{64}$/.test(token))return json({error:'unauthorized'},401);
 const url=Deno.env.get('SUPABASE_URL'),secrets=Deno.env.get('SUPABASE_SECRET_KEYS');
 let key=null;try{key=secrets?JSON.parse(secrets).default:null;}catch{}
 key=key||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return json({error:'not_configured'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authorized,error}=await db.rpc('ff_official_sync_authorized',{p_token:token});
 if(error||authorized!==true)return json({error:'unauthorized'},401);
 try{return json({ok:true,...await sync(db)},200);}
 catch(e){console.error('official_sync_failed',String(e?.message||e).slice(0,140));return json({error:'sync_failed'},500);}
});
