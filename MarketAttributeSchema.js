import {collectMarketSizeLabels} from './MarketListingFilters.js';

export const MARKET_ITEM_TYPES={
  Kleidung:['Body','Strampler','T-Shirt','Langarmshirt','Hemd','Bluse','Pullover','Sweatshirt','Hoodie','Hose','Jeans','Leggings','Shorts','Kleid','Rock','Jacke','Weste','Overall','Schlafanzug','Unterwäsche','Socken','Strumpfhose','Mütze','Schuhe','Sonstige Kleidung'],
  Spielzeug:['Bausteine','Puppe','Spielzeugfahrzeug','Puzzle','Brettspiel','Kuscheltier','Lernspielzeug','Outdoor-Spielzeug','Sonstiges Spielzeug'],
  Bücher:['Bilderbuch','Kinderbuch','Sachbuch','Lernbuch','Sonstiges Buch'],
  Babyausstattung:['Kinderwagen','Babyschale','Kindersitz','Babytrage','Hochstuhl','Babybett','Wickelauflage','Sonstige Babyausstattung'],
  Möbel:['Kinderbett','Schrank','Regal','Tisch','Stuhl','Kommode','Sonstiges Möbelstück'],
  Sonstiges:['Sonstiges']
};
export const MARKET_COLORS=['Blau','Rot','Grün','Gelb','Orange','Lila','Rosa','Weiß','Schwarz','Grau','Braun','Beige','Türkis','Bunt'];
export const MARKET_PATTERNS=['Einfarbig','Gestreift','Gepunktet','Kariert','Geblümt','Bedruckt'];
const canonical=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const aliases={'shirt':'T-Shirt','tshirt':'T-Shirt','t shirt':'T-Shirt','longsleeve':'Langarmshirt','langarmbody':'Body','jeanshose':'Jeans','jogginghose':'Hose','stoffhose':'Hose','winterjacke':'Jacke','regenjacke':'Jacke','skijacke':'Jacke','schlafanzugset':'Schlafanzug','sockenpaar':'Socken','schuhpaar':'Schuhe','sneaker':'Schuhe','lego':'Bausteine','bilderbuch':'Bilderbuch'};
const colors=[
 ['Blau',/^(?:hell|dunkel|marine|navy)?blau$/],
 ['Rot',/^(?:hell|dunkel|wein)?rot$/],
 ['Grün',/^(?:hell|dunkel|oliv|mint)?grun$/],
 ['Gelb',/^(?:hell|dunkel|senf)?gelb$/],
 ['Orange',/^orange$/],
 ['Lila',/^(?:hell|dunkel)?lila$|^violett$/],
 ['Rosa',/^rosa$|^pink$/],
 ['Weiß',/^weiss$/|^cremeweiss$/],
 ['Schwarz',/^schwarz$/],
 ['Grau',/^(?:hell|dunkel)?grau$|^anthrazit$/],
 ['Braun',/^(?:hell|dunkel)?braun$/],
 ['Beige',/^beige$|^creme$/],
 ['Türkis',/^turkis$/],
 ['Bunt',/^bunt$|^mehrfarbig$/]
];
export function canonicalItemType(value,category){
  const raw=canonical(value);
  const list=MARKET_ITEM_TYPES[category]||[];
  const match=list.find(x=>canonical(x)===raw);
  const alias=aliases[raw];
  return match||((list.includes(alias))?alias:'');
}
export function canonicalColors(input){
  const tokens=String(input||'').split(/[,/;+&]|\s+und\s+/i).map(canonical);
  const found=tokens.map(t=>colors.find(([,re])=>re.test(t))?.[0]).filter(Boolean);
  return [...new Set(found)].slice(0,6);
}
export function canonicalPattern(value){
  const raw=canonical(value);
  return MARKET_PATTERNS.find(x=>canonical(x)===raw)||'';
}
const short=(v,length)=>String(v||'').replace(/[\r\n\t\x00-\x1f\x7f]/g,' ').trim().slice(0,length);
const uniq=(items)=>[...new Set(items.filter(Boolean))].slice(0,40);

// Shared contract between AI drafts, seller-reviewed input, and searchable database fields.
// The voluntary description is NOT read to build searchable facets.
export function buildMarketAttributes({category,itemType='',facts={},packageItems=null,material='',pattern=''}){
  const entries=Array.isArray(packageItems)&&packageItems.length?packageItems:[{category,itemType,facts,material,pattern}];
  const clothing=entries.filter(d=>['Kleidung','Babyausstattung'].includes(d.category||category));
  return {
    item_types:uniq(entries.map(d=>canonicalItemType(d.itemType||d.garmentType||'',d.category||category))),
    size_labels:collectMarketSizeLabels(clothing.map(d=>d.facts?.size||d.size||'')),
    color_labels:uniq(entries.flatMap(d=>canonicalColors(d.facts?.color||d.color||''))),
    brand_labels:uniq(entries.map(d=>short(d.facts?.brand||d.brand,60))),
    material_labels:uniq(entries.map(d=>short(d.material,60))),
    pattern_labels:uniq(entries.map(d=>canonicalPattern(d.pattern)))
  };
}
export function marketAiTypeSuggestion(data){
  return canonicalItemType(data?.itemType||data?.garmentType||'',data?.category);
}
