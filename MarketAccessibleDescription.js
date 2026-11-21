// Spoken descriptions come only from seller-confirmed structured catalogue facts.
// Photo recognition suggests facts elsewhere; this module never guesses unseen
// objects, missing sizes, defects or what supplementary photos show.
const brief=(value,max=100)=>String(value||'')
 .replace(/[\x00-\x1f\x7f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

export function marketPhotoFacts(listing={},decoded=null,packageInfo=null){
 const title=brief(listing.title,100)||'Unbenanntes Angebot';
 const category=brief(listing.category,40);
 const details=['Angebot laut Anzeige: '+title];
 if(category)details.push('Kategorie: '+category);
 if(packageInfo?.rows?.length){
   const rows=packageInfo.rows.slice(0,10).map(row=>brief(row,90)).filter(Boolean);
   details.push('Paketinhalt laut Anbieter: '+rows.join('; '));
 }else if(decoded?.facts){
   const facts=decoded.facts;
   for(const [key,label] of [['color','Farbe'],['size','Größe'],
      ['brand','Marke'],['detail','Weitere Merkmale']]){
     const value=brief(facts[key],key==='detail'?100:60);
     if(value)details.push(label+': '+value);
   }
 }
 const condition=brief(listing.item_condition,30);
 if(condition)details.push('Angegebener Zustand: '+condition);
 return details.join('. ')+'.';
}
export function marketPhotoAlt(listing={},decoded=null,packageInfo=null,index=0,count=1){
 const imageNumber=Number.isInteger(index)&&index>=0?index+1:1;
 const total=Number.isInteger(count)&&count>0?count:1;
 const facts=marketPhotoFacts(listing,decoded,packageInfo);
 return 'Anzeigenfoto '+imageNumber+' von '+total+'. '+facts+' '+
   'Für dieses einzelne Foto liegt keine geprüfte Bildbeschreibung vor.';
}
