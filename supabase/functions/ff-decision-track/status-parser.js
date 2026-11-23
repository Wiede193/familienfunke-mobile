// Pure, testable classification. DIP "Abgeschlossen" is NOT synonymous with
// "Verkündet" or "In Kraft". These statuses need an official legal source.
export function parseDipVorgang(data,expectedId){
 if(!data||typeof data!=='object'||String(data.id)!==String(expectedId)
   ||data.vorgangstyp!=='Gesetzgebung'||typeof data.titel!=='string')
   throw Error('dip_unexpected_record');
 const updated=Date.parse(data.aktualisiert||'');
 if(!Number.isFinite(updated))throw Error('dip_missing_update');
 const raw=typeof data.beratungsstand==='string'?data.beratungsstand.slice(0,180):'';
 const publications=Array.isArray(data.verkuendung)?data.verkuendung:[];
 // This is only a candidate for editorial approval; never a live status change.
 const proposedStatus=/verk[uü]ndet/i.test(raw)&&publications.length>0?'verkuendet':null;
 return {
  sourceStatus:raw||'Ohne eindeutigen Beratungsstand',
  updatedAt:new Date(updated).toISOString(),
  proposedStatus,
  signature:JSON.stringify({
   id:String(expectedId),updatedAt:data.aktualisiert,raw,
   publications:publications.map(x=>({
    datum:typeof x?.datum==='string'?x.datum:'',
    fundstelle:typeof x?.fundstelle==='string'?x.fundstelle:''
   })).slice(0,8),
   effectiveCount:Array.isArray(data.inkrafttreten)?data.inkrafttreten.length:0
  })
 };
}
export function sourceKindForUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  const hosts=new Set(['www.bundesregierung.de','bundesregierung.de','www.bundestag.de',
   'bundestag.de','dip.bundestag.de','www.landtag.brandenburg.de',
   'landtag.brandenburg.de','mbjs.brandenburg.de','www.mbjs.brandenburg.de',
   'www.bundesrat.de','bundesrat.de','www.brandenburg.de','brandenburg.de',
   'www.recht.bund.de','recht.bund.de']);
  return hosts.has(u.hostname.toLowerCase())?'website':null;
 }catch{return null;}
}
export function normalizedOfficialText(html){
 if(typeof html!=='string')return '';
 // Remove active markup and irrelevant machine data before hashing.
 const main=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||
  html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0]||html;
 return main.replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<[^>]{0,1000}>/g,' ').replace(/&nbsp;/g,' ')
  .replace(/&#?\w{1,8};/g,' ').replace(/\s+/g,' ').trim().slice(0,180000);
}
