// Familienfunke: Größen sind eigenständige, filterbare Metadaten.
// Niemals Größen aus Titeln/Beschreibungen für die laufende Suche erraten.
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const normalizedSize=v=>String(v||'').trim().toUpperCase().replace(',','.').replace(/\s+/g,'');
const validSize=v=>/^(?:[0-9]{1,3}(?:\.[05])?|3XL|XXS|XS|S|M|L|XL|XXL)$/.test(v);

// Größen wie 98/104 werden als zwei gezielt suchbare Einträge gespeichert.
export function collectMarketSizeLabels(rawValues){
  const items=(Array.isArray(rawValues)?rawValues:[rawValues]).flatMap(x=>
    String(x||'').split(/[\/;,]/).map(normalizedSize).filter(validSize));
  return [...new Set(items)].slice(0,40);
}
export function marketListingSizes(listing){
  return collectMarketSizeLabels(listing?.size_labels||[]);
}
export function marketMatchesSize(listing,selected){
  if(!selected||selected==='Alle')return true;
  return marketListingSizes(listing).includes(normalizedSize(selected));
}
export function marketMatchesRegion(listing,selected){
  return !selected||selected==='Alle'||normalize(listing?.region_label)===normalize(selected);
}
