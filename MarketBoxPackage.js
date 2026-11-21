// Package listing material is generated deterministically, not as promotional prose.
// Keep the existing 1500-character listing storage and moderation format.
const brief=(v,n)=>String(v||'').replace(/[\r\n\t\x00-\x1f\x7f]+/g,' ').trim().slice(0,n);
const visibleKeys=['pattern','shape','features','material'];
export function compactBoxDetail(p){
 return [...new Set([p.pattern,p.shape,p.features,p.material,p.detail].map(x=>brief(x,80)).filter(Boolean))].join(' · ').slice(0,100);
}
export function summarizeBox(drafts){
 const allClothing=drafts.length>0&&drafts.every(d=>d.category==='Kleidung');
 const allSame=drafts.length>0&&drafts.every(d=>d.category===drafts[0].category);
 const sizes=[...new Set(drafts.map(d=>brief(d.facts?.size,40)).filter(Boolean))];
 const sized=drafts.filter(d=>brief(d.facts?.size,40)).length;
 const commonSize=sized===drafts.length&&sizes.length===1?sizes[0]:'';
 const groups=new Map();
 for(const d of drafts){
   const name=brief(d.garmentType||d.title||'Artikel',36);
   groups.set(name,(groups.get(name)||0)+1);
 }
 const typeLine=[...groups].map(([type,count])=>count+'× '+type).join(' · ');
 // Each line <= 85 characters, even with ten items. No item is silently removed.
 const rows=drafts.map((d,i)=>{
   const title=brief(d.title||d.garmentType||'Artikel',31);
   const size=brief(d.facts?.size,18);
   const color=brief(d.facts?.color,16);
   const pattern=brief(d.pattern,12);
   return [String(i+1)+'. '+title,size?'Gr. '+size:'Gr. offen',color,pattern].filter(Boolean).join(' · ').slice(0,85);
 });
 const title=String(drafts.length)+'-teiliges '+(allClothing?'Kleidungspaket':'Familienpaket')+(allClothing&&commonSize?' · Gr. '+commonSize:'');
 const detail=brief(typeLine,100);
 return {title:title.slice(0,100),category:allSame?drafts[0].category:'Sonstiges',
  commonSize,sizes,sized,total:drafts.length,rows,detail,allClothing};
}
export function packageNote(rows){
 // Marker separates the package inventory from the seller's optional prose.
 return 'Paketinhalt:\n'+rows.join('\n')+'\n\nPersönliche Ergänzung:\n';
}
export function parsePackageNote(note){
 const text=String(note||'');
 if(!text.startsWith('Paketinhalt:\n'))return null;
 const separator='\n\nPersönliche Ergänzung:';
 const idx=text.indexOf(separator);
 if(idx<0)return null;
 const rows=text.slice('Paketinhalt:\n'.length,idx).split('\n');
 if(!rows.length||rows.length>10||!rows.every((r,i)=>r.startsWith(String(i+1)+'. ')&&r.trim().length>3))return null;
 return {rows,personal:text.slice(idx+separator.length).trim()};
}
export function labelSource(draft){
 if(!draft.facts?.size)return 'Größe offen';
 switch(draft.sizeEvidence){
  case 'label':return 'Größenetikett erkannt – prüfen';
  case 'seller':return 'Größe selbst angegeben';
  default:return 'Größenangabe prüfen';
 }
}
