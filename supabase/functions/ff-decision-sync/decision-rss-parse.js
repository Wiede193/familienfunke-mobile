export const safeSource=(raw,host)=>{
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&
  (u.hostname===host||u.hostname==='www.'+host||
  (host==='landtag.brandenburg.de'&&u.hostname==='www.parlamentsdokumentation.brandenburg.de')||
  (host==='landtag.brandenburg.de'&&u.hostname==='parlamentsdokumentation.brandenburg.de'));}catch{return false;}
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
// This deliberately requires explicit topic words. "Kabinett" alone is not
// evidence that a political news item is relevant to families.
export function classifyFamilyDecision(title){
 const n=String(title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/\bkindergeld|kinderzuschlag|kinderfreibetrag|familienleistungsausgleich/.test(n))return 'kindergeld';
 if(/\belterngeld|elternzeit|mutterschutz/.test(n))return 'elterngeld';
 if(/kita|kindertages|kinderbetreuung|ganztag|hort|fruhkindlich|fruehkindlich/.test(n))return 'kita';
 if(/\bschule|schulgesetz|schulabschluss|schulpflicht|schulbildung/.test(n))return 'schule';
 if(/wohngeld|mietrecht|mieterschutz|sozialwohn|bezahlbar(?:es|en)? wohnen/.test(n))return 'wohnen';
 if(/gesundheit|krankenhaus|kinderarzt|hebammen|pflege|gesundheitsversorgung/.test(n))return 'gesundheit';
 if(/kindschaft|sorgerecht|umgangsrecht|gewaltschutz|adoption/.test(n))return 'familienrecht';
 if(/unterhaltsvorschuss|unterhaltsrecht|bildungs.?und.?teilhabe|familienforderung/.test(n))return 'leistungen';
 if(/bibliothek|jugendfreizeit|familienticket|familienfreizeit/.test(n))return 'freizeit';
 return null;
}

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
  const family_topic=classifyFamilyDecision(title);
  if(!family_topic)return null;
  // A general government press release is NOT a decision. Require an explicit
  // cabinet action, and never reclassify it as a parliament-approved law.
  if(source.level==='bund'&&!(/\b(?:kabinett|bundeskabinett)\b/i.test(title)&&
    /\b(?:beschloss|beschli[eé]ßt|beschlossen|beschluss)\b/i.test(title)))return null;
  return {
   source_key:(source.id+':'+link).slice(0,500),level:source.level,
   decision_status:source.status,title,family_topic,source_name:source.name,source_url:link,
   official_excerpt:excerpt||null,published_at:new Date(stamp).toISOString(),
   simple_summary:null,family_impact:null,next_step:null,editorial_reviewed:false,published:true
  };
 }).filter(Boolean).slice(0,30);
}
