// Spoken descriptions come only from seller-confirmed structured catalogue facts.
// Photo recognition suggests facts elsewhere; this module never guesses unseen
// objects, missing sizes, defects or what supplementary photos show.
const brief=(value,max=100)=>String(value||'')
 .replace(/[\x00-\x1f\x7f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

export function marketPhotoFacts(listing={},decoded=null,packageInfo=null,t=k=>k){
 const title=brief(listing.title,100)||t('Unbenanntes Angebot');
 const category=brief(listing.category,40);
 const details=[t('Angebot laut Anzeige: ')+title];
 if(category)details.push(t('Kategorie')+': '+t(category));
 if(packageInfo?.rows?.length){
   const rows=packageInfo.rows.slice(0,10).map(row=>brief(row,90)).filter(Boolean);
   details.push(t('Paketinhalt laut Anbieter: ')+rows.join('; '));
 }else if(decoded?.facts){
   const facts=decoded.facts;
   for(const [key,label] of [['color','Farbe'],['size','Größe'],
      ['brand','Marke'],['detail','Weitere Merkmale']]){
     const value=brief(facts[key],key==='detail'?100:60);
     if(value)details.push(t(label)+': '+value);
   }
 }
 const condition=brief(listing.item_condition,30);
 if(condition)details.push(t('Angegebener Zustand: ')+t(condition));
 return details.join('. ')+'.';
}
export function marketPhotoAlt(listing={},decoded=null,packageInfo=null,index=0,count=1,t=k=>k){
 const imageNumber=Number.isInteger(index)&&index>=0?index+1:1;
 const total=Number.isInteger(count)&&count>0?count:1;
 const facts=marketPhotoFacts(listing,decoded,packageInfo,t);
 return t('Anzeigenfoto')+' '+imageNumber+' '+t('von')+' '+total+'. '+facts+' '+
   t('Für dieses einzelne Foto liegt keine geprüfte Bildbeschreibung vor.');
}
