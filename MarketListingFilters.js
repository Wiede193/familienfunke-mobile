// Filter nur nach ausdrücklich genannten Kindergrößen; keine KI-Schätzung.
// Funktioniert auch mit älteren Freitext-Anzeigen und Paketlisten.
const sizeMarker=/(?:^|[\s·(])(?:Größe|Gr\.?)\s*:?\s*(\d{2,3}(?:\s*\/\s*\d{2,3})?)(?=$|[\s·,);])/gi;
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();

export function marketListingSizes(listing){
  const text=[listing?.title,listing?.description].filter(Boolean).join('\n');
  const found=[];
  for(const match of text.matchAll(sizeMarker)){
    const size=match[1].replace(/\s+/g,'');
    if(!found.includes(size))found.push(size);
  }
  return found;
}

export function marketMatchesSize(listing,selected){
  const requested=normalize(selected);
  return !selected||selected==='Alle'||marketListingSizes(listing).some(size=>{
    const actual=normalize(size);
    return actual===requested||(actual.includes('/')&&actual.split('/').includes(requested));
  });
}

export function marketMatchesRegion(listing,selected){
  return !selected||selected==='Alle'||normalize(listing?.region_label)===normalize(selected);
}
