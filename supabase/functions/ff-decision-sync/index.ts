import {createClient} from 'npm:@supabase/supabase-js@2.80.0';

// Only explicitly approved government/parliament feeds. Never follow arbitrary links.
const SOURCES=[
 {id:'bundesregierung-kabinett',name:'Bundesregierung – Pressemitteilungen',
  url:'https://www.bundesregierung.de/service/rss/breg-de/1151244/feed.xml',level:'bund',status:'kabinett'},
 {id:'landtag-brandenburg-beschlossen',name:'Landtag Brandenburg – beschlossene Gesetze',
  url:'https://www.landtag.brandenburg.de/cms/detail.php?template=ltbrb_rss_beschlossene_gesetze_d',
  level:'brandenburg',status:'parlament'}
];
const safeSource=(raw,host)=>{
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&
  (u.hostname===host||u.hostname==='www.'+host);}catch{return false;}
};
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,(_,v)=>v)
 .replace(/&#(x[0-9a-fA-F]+|\d+);/g,(_,m)=>{
  const n=m[0].toLowerCase()==='x'?parseInt(m.slice(1),16):parseInt(m,10);
  return n>=32&&n<=0x10ffff?String.fromCodePoint(n):' ';
 })
 .replace(/&(amp|lt|gt|quot|apos|nbsp|auml|ouml|uuml|Auml|Ouml|Uuml|szlig);/g,
  (_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß'}[k]))
 .replace(/<[^>]{0,400}>/g,' ').replace(/\s+/g,' ').trim();
const pick=(xml,tag)=>{
 const m=xml.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));
 return m?decode(m[1]):'';
};
export function parseDecisions(xml,source,now=Date.now()){
 if(typeof xml!=='string'||xml.length>1050000||!/(\<rss[\s>]|<feed[\s>])/i.test(xml))
  throw Error('invalid_rss');
 const items=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,70);
 if(!items.length)throw Error('no_rss_items');
 const threshold=now-45*86400000;
 return items.map(match=>{
  const raw=match[1],title=pick(raw,'title').slice(0,300);
  const link=pick(raw,'link').slice(0,1000);
  const stamp=Date.parse(pick(raw,'pubDate')||pick(raw,'dc:date')||'');
  const excerpt=pick(raw,'description').slice(0,700);
  if(!safeSource(link,source.level==='bund'?'bundesregierung.de':'landtag.brandenburg.de'))return null;
  if(!Number.isFinite(stamp)||stamp<threshold||stamp>now+86400000)return null;
  if(title.length<8)return null;
  // A general government press release is NOT a decision. Require an explicit
  // cabinet action, and never reclassify it as a parliament-approved law.
  if(source.level==='bund'&&!(/\b(?:kabinett|bundeskabinett)\b/i.test(title)&&
    /\b(?:beschloss|beschli[eé]ßt|beschlossen|beschluss)\b/i.test(title)))return null;
  return {
   source_key:(source.id+':'+link).slice(0,500),level:source.level,
   decision_status:source.status,title,source_name:source.name,source_url:link,
   official_excerpt:excerpt||null,published_at:new Date(stamp).toISOString(),
   simple_summary:null,family_impact:null,next_step:null,editorial_reviewed:false,published:true
  };
 }).filter(Boolean).slice(0,30);
}
async function download(url){
 const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(9000),
  headers:{'Accept':'application/rss+xml,application/xml,text/xml;q=0.9,text/plain;q=0.5',
   'User-Agent':'FamilienfunkeOfficialDecisionMonitor/1.0 (public official RSS; 3-hour interval)'}});
 if(!r.ok)throw Error('source_http_'+r.status);
 const allowed=r.url.includes('bundesregierung.de')?'bundesregierung.de':'landtag.brandenburg.de';
 if(!safeSource(r.url,allowed))throw Error('untrusted_redirect');
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
