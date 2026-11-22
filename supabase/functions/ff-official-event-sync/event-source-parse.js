// Strict, dependency-free official-event parser. Discovered items are NEVER auto-published.
const allow=/\b(kinder|familien|familie|puppen(theater)?|märchen|maerchen|baby|eltern|kita|kindergarten|bastel(n|werkstatt)?|laternen|ferienprogramm|spielplatz|spiel(e|tag|fest)?|weihnachtsmarkt|adventsmarkt|weihnachtszauber|nikolaus|osterfest|drachenfest|tierpark|zoo|mitmach|familienlauf|kinderflohmarkt)\b/i;
const deny=/\b(ausstellung|vernissage|galerie|fachvortrag|informationsforum|satire|kabarett|partynacht|cocktail|party\s*ab\s*18|ab\s*18|erotisch|wahlkampf|kunstmarkt)\b/i;
export const candidateFamilyEligible=(title,description='')=>{
 const t=String(title||'').normalize('NFC'),d=String(description||'').normalize('NFC');
 return t.trim().length>=4&&t.trim().length<=160&&!deny.test(t+' '+d)&&allow.test(t+' '+d.slice(0,250));
};
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const localDate=s=>{
 const m=String(s||'').match(/^(\d{4})-?(\d{2})-?(\d{2})/);
 if(!m)return null;
 const [y,mo,d]=m.slice(1).map(Number);
 const calendar=new Date(Date.UTC(y,mo-1,d));
 if(calendar.getUTCFullYear()!==y||calendar.getUTCMonth()!==mo-1||calendar.getUTCDate()!==d)return null;
 return String(y).padStart(4,'0')+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
};
const nextDay=s=>{
 const d=localDate(s);if(!d)return null;
 const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1);
 return t.toISOString().slice(0,10);
};
const prevDay=s=>{
 const d=localDate(s);if(!d)return null;
 const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()-1);
 return t.toISOString().slice(0,10);
};
function deTime(raw){
 const s=String(raw||'');
 if(/^\d{8}T\d{6}$/.test(s))return s.slice(9,11)+':'+s.slice(11,13);
 if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s))return s.slice(11,16);
 if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s))return s.slice(11,16);
 if(/^\d{8}T\d{6}Z$/.test(s)||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d\d:\d\d)$/.test(s)){
  const normalized=s.includes('-')?s:s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+'T'+s.slice(9,11)+':'+s.slice(11,13)+':'+s.slice(13,15)+'Z';
  const dt=new Date(normalized);
  if(!Number.isFinite(dt.getTime()))return null;
  return new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).format(dt);
 }
 return null;
}
function deDay(raw){
 const s=String(raw||'');
 if(s.endsWith('Z')||/T\d\d:\d\d.*[+-]\d\d:\d\d$/.test(s)){
  const normalized=s.includes('-')?s:s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+'T'+s.slice(9,11)+':'+s.slice(11,13)+':'+s.slice(13,15)+'Z';
  const dt=new Date(normalized);
  if(!Number.isFinite(dt.getTime()))return null;
  const part=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(dt);
  const get=x=>part.find(k=>k.type===x)?.value;
  return [get('year'),get('month'),get('day')].join('-');
 }
 return localDate(s);
}
function safeLink(value,sourceUrl){
 try{
  const a=new URL(String(value||''),sourceUrl),origin=new URL(sourceUrl);
  if(a.protocol!=='https:'||a.host!==origin.host||a.username||a.password)return sourceUrl;
  a.hash='';return a.href.slice(0,600);
 }catch{return sourceUrl;}
}
function flattenJson(node,out){
 if(!node||typeof node!=='object')return;
 if(Array.isArray(node)){for(const x of node)flattenJson(x,out);return;}
 if(node['@graph'])flattenJson(node['@graph'],out);
 if(node.mainEntity)flattenJson(node.mainEntity,out);
 const type=[node['@type']].flat().map(x=>String(x).toLowerCase());
 if(type.some(x=>x==='event'||x==='childrensevent'||x==='festival'||x==='educationevent'||x==='theaterevent'))out.push(node);
}
export function parseJsonLdEvents(html,sourceUrl){
 const matches=String(html||'').matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
 const events=[];
 for(const entry of matches){
  try{flattenJson(JSON.parse(entry[1].trim()),events);}catch{continue;}
  if(events.length>=150)break;
 }
 return events.slice(0,120).map((e,i)=>{
  const loc=Array.isArray(e.location)?e.location[0]:e.location||{};
  const date=e.startDate||e.start_date;
  const finish=e.endDate||date;
  const title=plain(e.name),description=plain(e.description);
  const ext=typeof e['@id']==='string'?e['@id']:typeof e.url==='string'?e.url:typeof e.identifier==='string'?e.identifier:title+':'+(loc?.name||'');
  return {external_id:String(ext).slice(0,240)||'unknown-'+i,title,description,start_date:deDay(date),end_date:deDay(finish),
   start_time:deTime(date),venue:plain(loc?.name||e.location?.name||'Veranstaltungsort beim Anbieter prüfen'),
   source_url:safeLink(e.url,sourceUrl),cancelled:/EventCancelled/i.test(String(e.eventStatus||''))};
 });
}

function htmlEntities(s){
 return String(s||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&apos;|&#39;/gi,"'")
  .replace(/&auml;/gi,'ä').replace(/&ouml;/gi,'ö').replace(/&uuml;/gi,'ü')
  .replace(/&Auml;/g,'Ä').replace(/&Ouml;/g,'Ö').replace(/&Uuml;/g,'Ü')
  .replace(/&szlig;/gi,'ß')
  .replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(Math.min(Number(d),1114111)));
}
// Municipality-specific list extraction; only official event list items are accepted.
// Does not extract user content, images, ticket prices, or arbitrary nearby links.
export function parseStorkowHtml(html,sourceUrl){
 const blocks=String(html||'').split(/(?=<div\s+class=["'][^"']*event-entry-new-1(?:\s|["']))/i).slice(1,200);
 const out=[];
 for(const segment of blocks){
  if(!/^<div\s+class=["'][^"']*event-entry-new-1/i.test(segment))continue;
  const day=segment.match(/<time\s+datetime=["'](\d{4}-\d{2}-\d{2})["']/i)?.[1];
  const titleBlock=segment.match(/<h2\b[^>]*>\s*<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
  if(!day||!titleBlock)continue;
  const title=plain(htmlEntities(titleBlock[2]));
  const url=safeLink(htmlEntities(titleBlock[1]),sourceUrl);
  const location=segment.match(/class=["']event-entry-new-1-location["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]||'';
  const daytime=segment.match(/class=["']event-entry-new-1-daytime["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]||'';
  const start=daytime.match(/<time[^>]*>(\d\d:\d\d)<\/time>/i)?.[1]||null;
  const id=titleBlock[1].split('/').filter(Boolean).find((part,i,a)=>/^\d{5,}$/.test(part))||titleBlock[1];
  out.push({external_id:String(id).slice(0,240),title,description:'',
   start_date:day,end_date:day,start_time:start,venue:plain(htmlEntities(location))||'Storkow (Mark)',
   source_url:url,cancelled:false});
 }
 return out;
}

function unfoldIcs(source){return String(source).replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'');}
function unescapeIcs(x){return String(x||'').replace(/\\[nN]/g,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');}
export function parseIcsEvents(ics,sourceUrl){
 const blocks=unfoldIcs(ics).match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)||[];
 return blocks.slice(0,180).map((block,i)=>{
  const m=new Map();
  for(const line of block.split(/\r?\n/)){
   const pos=line.indexOf(':');if(pos<1)continue;
   const k=line.slice(0,pos).split(';')[0].toUpperCase();
   if(!m.has(k))m.set(k,{text:line.slice(pos+1),meta:line.slice(0,pos)});
  }
  const get=x=>m.get(x)?.text||'';
  const rawStart=get('DTSTART'),rawEnd=get('DTEND');
  const allDay=!!m.get('DTSTART')&&/;VALUE=DATE(?:;|$)/i.test(m.get('DTSTART').meta)||/^\d{8}$/.test(rawStart);
  const date=deDay(rawStart);
  const finish=deDay(rawEnd)||date;
  const dateEnd=allDay&&finish&&finish>date?prevDay(finish):finish;
  return {external_id:unescapeIcs(get('UID')).slice(0,240)||'row-'+i,title:unescapeIcs(get('SUMMARY')),
   description:unescapeIcs(get('DESCRIPTION')),start_date:date,end_date:dateEnd,
   start_time:allDay?null:deTime(rawStart),venue:unescapeIcs(get('LOCATION'))||'Ort beim Veranstalter prüfen',
   source_url:safeLink(get('URL'),sourceUrl),cancelled:/^CANCELLED$/i.test(get('STATUS')),
   recurrence:!!get('RRULE'),recurrenceId:get('RECURRENCE-ID')||null};
 }).filter(e=>!e.recurrence);
}
export async function normalizeEventCandidates(events,source,today='2026-11-23'){
 const out=[];
 for(const x of events.slice(0,120)){
  const start=localDate(x.start_date),end=localDate(x.end_date||x.start_date);
  if(!start||!end||end<start||end<today||end>nextDayOffset(start,100)||start>nextDayOffset(today,120))continue;
  if(!candidateFamilyEligible(x.title,x.description))continue;
  if(!x.external_id||x.external_id.length>240)continue;
  const title=plain(x.title).slice(0,160);
  const venue=plain(x.venue||source.city).slice(0,160)||source.city;
  const group=events.filter(e=>e.external_id===x.external_id);
  const instance_key=x.recurrenceId?localDate(x.recurrenceId)||'single':group.length>1?start:'single';
  const category=classifyCategory(title,x.description);
  const summary='Offiziell angekündigte Familienveranstaltung. Einzelheiten und eventuelle Änderungen bitte bei der Originalquelle prüfen.';
  const source_url=safeLink(x.source_url,source.url);
  const candidate={external_id:String(x.external_id).slice(0,240),instance_key,title,summary,
   category,district:source.district,city:source.city,venue,start_date:start,end_date:end,start_time:x.start_time||null,
   source_url,source_name:source.source_name,source_kind:source.source_kind,cancelled:!!x.cancelled};
  const fp=JSON.stringify([title,start,end,x.start_time||'',venue,source_url,x.cancelled]);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fp));
  candidate.fingerprint=Array.from(new Uint8Array(hash)).map(n=>n.toString(16).padStart(2,'0')).join('');
  out.push(candidate);
 }
 return out;
}
function nextDayOffset(s,n){
 const day=localDate(s);if(!day)return '';
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);
 return d.toISOString().slice(0,10);
}
function classifyCategory(title,description){
 const t=title+' '+String(description||'').slice(0,120);
 if(/baby|eltern|schwanger/i.test(t))return 'baby';
 if(/puppen|märchen|theater|kinderoper/i.test(t))return 'theater';
 if(/markt|flohmarkt/i.test(t))return 'market';
 if(/laufen|lauf|sport|turnier|rennen|eislauf/i.test(t))return 'sport';
 if(/basteln|werkstatt|mitmach|spielenachmittag/i.test(t))return 'workshop';
 if(/natur|wander|zoo|tierpark|drachenfest/i.test(t))return 'outdoor';
 return 'festival';
}
