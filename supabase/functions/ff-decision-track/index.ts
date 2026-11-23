import {createClient} from 'npm:@supabase/supabase-js@2.80.0';
import {parseDipVorgang,sourceKindForUrl,normalizedOfficialText} from './status-parser.js';

const DIP_HOST='search.dip.bundestag.de';
const MAX_BYTES=1050000;
const json=(v,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
async function fingerprint(value){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function retrieve(url,key=null){
 const dip=key!==null;
 let current=url;
 if(dip?new URL(url).hostname!==DIP_HOST:!sourceKindForUrl(url))throw Error('untrusted_source');
 for(let hop=0;hop<3;hop++){
  const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(7000),
   headers:{
    Accept:dip?'application/json':'text/html,text/plain;q=0.7',
    'User-Agent':'FamilienfunkeLegislationMonitor/1.0 (daily source checks)',
    ...(dip?{Authorization:'ApiKey '+key}:{})
   }});
  if([301,302,303,307,308].includes(r.status)){
   const u=new URL(r.headers.get('location')||'',current);
   if(u.protocol!=='https:'||u.username||u.password||u.port||
      (dip?u.hostname!==DIP_HOST:!sourceKindForUrl(u.href)))throw Error('untrusted_redirect');
   current=u.href;continue;
  }
  if(!r.ok)throw Error('http_'+r.status);
  const type=r.headers.get('content-type')||'';
  if(!new RegExp(dip?'application/json':'text/html|text/plain','i').test(type))
    throw Error('unexpected_content_type');
  if(Number(r.headers.get('content-length')||0)>MAX_BYTES)throw Error('oversize');
  const reader=r.body?.getReader();if(!reader)throw Error('empty_body');
  let size=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.length;if(size>MAX_BYTES)throw Error('oversize');
   chunks.push(value);
  }}finally{reader.releaseLock();}
  const buffer=new Uint8Array(size);let at=0;
  for(const part of chunks){buffer.set(part,at);at+=part.length;}
  return new TextDecoder().decode(buffer);
 }
 throw Error('redirect_limit');
}
async function observe(db,row,kind,hash,status,proposed,evidence,updated,stats){
 const {data:old,error:oe}=await db.from('ff_decision_source_snapshots')
  .select('content_fingerprint').eq('decision_id',row.id).eq('source_kind',kind).maybeSingle();
 if(oe)throw Error('checkpoint_read');
 const changed=!!old?.content_fingerprint&&old.content_fingerprint!==hash;
 const mismatch=kind==='dip'&&!!proposed&&proposed!==row.decision_status;
 if(changed||mismatch){
  const {data:existing,error:ce}=await db.from('ff_decision_change_candidates')
   .select('id,review_state').eq('decision_id',row.id).eq('source_kind',kind).eq('fingerprint',hash).maybeSingle();
  if(ce)throw Error('candidate_lookup');
  if(!existing){
   const {error:ie}=await db.from('ff_decision_change_candidates').insert({
    decision_id:row.id,source_kind:kind,fingerprint:hash,evidence_url:evidence,
    observed_source_status:status?.slice(0,180)||null,proposed_status:proposed,
    observed_source_updated_at:updated
   });
   if(ie&&ie.code!=='23505')throw Error('candidate_write');
   const {error:fe}=await db.from('ff_official_decisions').update({status_review_pending:true}).eq('id',row.id);
   if(fe)throw Error('candidate_flag');
   stats.candidates++;
  }else if(existing.review_state==='pending'){
   await db.from('ff_decision_change_candidates').update({last_seen_at:new Date().toISOString()})
    .eq('id',existing.id);
  }
 }
 const {error:se}=await db.from('ff_decision_source_snapshots').upsert({
  decision_id:row.id,source_kind:kind,content_fingerprint:hash,last_http_status:200,
  checked_source_url:evidence,last_checked_at:new Date().toISOString(),
  last_success_at:new Date().toISOString(),last_error:null,failure_count:0
 },{onConflict:'decision_id,source_kind'});
 if(se)throw Error('checkpoint_write');
 const {error:de}=await db.from('ff_official_decisions')
  .update({last_official_check_at:new Date().toISOString()}).eq('id',row.id);
 if(de)throw Error('check_date_write');
}
async function logError(db,row,kind,reason){
 const {data:prior}=await db.from('ff_decision_source_snapshots')
  .select('failure_count').eq('decision_id',row.id).eq('source_kind',kind).maybeSingle();
 await db.from('ff_decision_source_snapshots').upsert({
  decision_id:row.id,source_kind:kind,last_checked_at:new Date().toISOString(),
  failure_count:Math.min(100,(prior?.failure_count||0)+1),
  last_error:reason.slice(0,80),
  checked_source_url:kind==='dip'?'https://dip.bundestag.de/vorgang/-/'+row.dip_vorgang_id:row.source_url
 },{onConflict:'decision_id,source_kind'});
}
async function monitor(db){
 const start=new Date().toISOString();
 const stats={website:0,dip:0,candidates:0,errors:[]};
 const raw=Deno.env.get('DIP_BUNDESTAG_API_KEY')||'';
 const key=/^[a-z0-9]{5,35}\.[a-z0-9]{15,65}$/i.test(raw)?raw:null;
 const {data:rows,error}=await db.rpc('ff_decision_tracking_due',{p_limit:15});
 if(error)throw Error('read_decisions');
 for(let i=0;i<(rows||[]).length;i+=3){
  await Promise.all((rows||[]).slice(i,i+3).map(async d=>{
   // DIP's public portal is a JavaScript shell, not the official machine-readable
   // procedure data. Never mistake its short HTML for a legislative change.
   if(sourceKindForUrl(d.source_url)&&new URL(d.source_url).hostname!=='dip.bundestag.de'){
    try{
     const page=normalizedOfficialText(await retrieve(d.source_url));
     if(page.length<100)throw Error('short_page');
     await observe(db,d,'website',await fingerprint(page),null,null,d.source_url,null,stats);
     stats.website++;
    }catch(e){const reason=String(e?.message||e).slice(0,75);
     stats.errors.push('website:'+reason);await logError(db,d,'website',reason);
    }
   }
   if(d.dip_vorgang_id&&key){
    try{
     const api='https://'+DIP_HOST+'/api/v1/vorgang/'+d.dip_vorgang_id;
     const parsed=parseDipVorgang(JSON.parse(await retrieve(api,key)),d.dip_vorgang_id);
     const evidence='https://dip.bundestag.de/vorgang/-/'+d.dip_vorgang_id;
     await observe(db,d,'dip',await fingerprint(parsed.signature),
      parsed.sourceStatus,parsed.proposedStatus,evidence,parsed.updatedAt,stats);
     stats.dip++;
    }catch(e){const reason=String(e?.message||e).slice(0,75);
     stats.errors.push('dip:'+reason);await logError(db,d,'dip',reason);
    }
   }
  }));
 }
 const {error:le}=await db.from('ff_decision_tracking_runs').insert({
  started_at:start,completed_at:new Date().toISOString(),checked_pages:stats.website,
  checked_dip:stats.dip,new_candidates:stats.candidates,dip_configured:!!key,
  errors:stats.errors.slice(0,25)
 });
 if(le)throw Error('monitor_log_failed');
 return {checked_pages:stats.website,checked_dip:stats.dip,
  pending_candidates:stats.candidates,dip_configured:!!key,errors:stats.errors.length};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const token=req.headers.get('x-ff-official-sync')||'';
 if(!/^[0-9a-f]{64}$/.test(token))return json({error:'unauthorized'},401);
 let key=null;try{key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;}catch{}
 key=key||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const url=Deno.env.get('SUPABASE_URL');
 if(!url||!key)return json({error:'server_not_configured'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:ok,error}=await db.rpc('ff_official_sync_authorized',{p_token:token});
 if(error||ok!==true)return json({error:'unauthorized'},401);
 try{return json(await monitor(db));}
 catch(e){return json({error:String(e?.message||e).slice(0,90)},503);}
});
