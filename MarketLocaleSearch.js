// Limited, deterministic aliases for German catalogue search. Never translate
// stored titles, descriptions, brands, category IDs, sizes, prices or locations.
// Unknown terms are preserved. This is not general machine translation.
const aliases=Object.freeze({
 blue:'blau',red:'rot',green:'grün',yellow:'gelb',black:'schwarz',white:'weiß',
 grey:'grau',gray:'grau',pink:'rosa',brown:'braun',purple:'lila',orange:'orange',
 trousers:'hose',pants:'hose',jeans:'jeans',jacket:'jacke',jackets:'jacke',
 coat:'mantel',coats:'mantel',sweater:'pullover',sweaters:'pullover',
 jumper:'pullover',dress:'kleid',dresses:'kleid',skirt:'rock',skirts:'rock',
 shoes:'schuhe',boots:'stiefel',trainers:'turnschuhe',sneakers:'turnschuhe',
 stroller:'kinderwagen',strollers:'kinderwagen',pram:'kinderwagen',
 bicycle:'fahrrad',bicycles:'fahrrad',bike:'fahrrad',bikes:'fahrrad',
 toy:'spielzeug',toys:'spielzeug',book:'buch',books:'bücher',
 clothes:'kleidung',clothing:'kleidung',furniture:'möbel',
 cot:'kinderbett',crib:'kinderbett',highchair:'hochstuhl',onesie:'body',
 leggings:'leggings',hoodie:'hoodie',shirt:'shirt',shirts:'shirt'
});
const stop=new Set(['size','sizes','find','looking','for','please','buy','children','childrens','kids','baby','a','an','the','in','with','and']);
const phrases=[[/\b(?:dark blue|navy blue)\b/gi,'dunkelblau'],[/\blight blue\b/gi,'hellblau'],[/\bcar seat\b/gi,'kindersitz'],[/\bhigh chair\b/gi,'hochstuhl'],[/\bt shirt\b/gi,'shirt']];
export function marketSearchQuery(input,language){
 const raw=String(input??'').trim().slice(0,160);
 if(language!=='en'||!raw)return raw;
 let text=raw;
 for(const [pattern,replacement] of phrases)text=text.replace(pattern,replacement);
 text=text.replace(/\bchildren['’]s\b/gi,'children');
 const words=text.split(/\s+/);
 // Do not strip intent-only words or convert tokens if no known product/color
 // appears. Preserve arbitrary names and places as far as possible.
 const matches=words.some(w=>Object.hasOwn(aliases,w.toLowerCase().replace(/[,;]+$/,'')))||text!==raw;
 if(!matches)return raw;
 const mapped=words.flatMap(w=>{
  const key=w.toLowerCase().replace(/[,;]+$/,'');
  if(stop.has(key))return [];
  return [Object.hasOwn(aliases,key)?aliases[key]:w];
 }).join(' ').trim();
 return mapped&&mapped.length<=160?mapped:raw;
}
