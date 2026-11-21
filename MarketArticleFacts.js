// A readable, version-stable mini catalogue; legacy apps see the same facts as text.
// Keep the actual moderation and listing storage contract unchanged.
export const FACT_KEYS=[['brand','Marke',60],['size','Größe',40],['color','Farbe',40],['detail','Weitere Angabe',100]];
export const EMPTY_FACTS={brand:'',size:'',color:'',detail:'',defect:'',defectText:''};
export const DEFECTS=['Keine bekannt','Vorhanden','Nicht geprüft'];
const line=(v,max)=>String(v||'').replace(/[\r\n\t\x00-\x1f\x7f]+/g,' ').trim().slice(0,max);
export function encodeArticleFacts(facts,note){
  const rows=FACT_KEYS.map(([key,label,max])=>[label,line(facts[key],max)]).filter(([,v])=>v);
  if(DEFECTS.includes(facts.defect))rows.push(['Mängel',facts.defect]);
  if(facts.defect==='Vorhanden'&&line(facts.defectText,180))rows.push(['Mängelbeschreibung',line(facts.defectText,180)]);
  const personal=String(note||'').trim().slice(0,900);
  return ['Artikel-Steckbrief',...rows.map(([label,v])=>label+': '+v),...(personal?['','Persönliche Notiz:',personal]:[])].join('\n');
}
export function decodeArticleFacts(value){
  const text=String(value||'');
  if(!text.startsWith('Artikel-Steckbrief\n'))return null;
  const [head,...notes]=text.split('\n\nPersönliche Notiz:\n');
  const facts={...EMPTY_FACTS};
  const labels=new Map([...FACT_KEYS.map(([k,label,max])=>[label,[k,max]]),['Mängel',['defect',30]],['Mängelbeschreibung',['defectText',180]]]);
  const seen=new Set();
  for(const row of head.split('\n').slice(1)){
    const i=row.indexOf(': ');if(i<0)return null;
    const label=row.slice(0,i),v=row.slice(i+2),spec=labels.get(label);
    if(!spec||seen.has(label)||v.length>spec[1]||!v.trim())return null;
    if(spec[0]==='defect'&&!DEFECTS.includes(v))return null;
    seen.add(label);facts[spec[0]]=v;
  }
  if(!seen.size)return null;
  return {facts,note:notes.join('\n\nPersönliche Notiz:\n')};
}
export function articleFactRows(facts){
  return [...FACT_KEYS.map(([k,label])=>[label,facts[k]]),['Mängel',facts.defect],['Mängelbeschreibung',facts.defectText]].filter(([,v])=>v);
}
