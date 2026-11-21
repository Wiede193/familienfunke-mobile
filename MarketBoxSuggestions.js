// Kurze, regelbasierte Vorschläge statt zusätzlicher KI-Dialoge.
// Die KI liefert bereits sichtbare Kleidungsarten; diese Vorschläge behaupten
// keine nicht bestätigte Größe, Temperatur-Eignung oder Zustandsqualität.
const raw=v=>String(v||'').trim();
const MAX=10;
const isClothing=d=>d?.category==='Kleidung';
const matching=(value,words)=>words.some(x=>new RegExp('(?:^|[^a-zäöüß])'+x+'(?:$|[^a-zäöüß])','i').test(value));
const light=['t-shirt','tshirt','kurzarmshirt','shorts','bermuda','sommerkleid','top','kurzarmbody'];
const warm=['jacke','winterjacke','pullover','sweatshirt','hoodie','strickjacke','fleecejacke'];
const definiteWinter=['winterjacke','schneeanzug','skihose','skijacke','winteroverall','thermohose'];
function unique(list){return [...new Set(list)];}
export function suggestBoxPackages(drafts){
 const items=Array.isArray(drafts)?drafts.filter(x=>x&&raw(x.title).length>=4):[];
 const candidates=[];
 const add=(id,title,description,chosen,why)=>{
   const ids=unique(chosen.map(d=>d.id)).slice(0,MAX);
   if(ids.length<2)return;
   if(candidates.some(x=>x.ids.length===ids.length&&x.ids.every(y=>ids.includes(y))))return;
   candidates.push({id,title,description,ids,why});
 };
 const sizes=new Map();
 for(const d of items.filter(isClothing)){
   const size=raw(d.facts?.size);
   if(!size)continue;
   if(!sizes.has(size))sizes.set(size,[]);
   sizes.get(size).push(d);
 }
 const groups=[...sizes.entries()].filter(([size,ds])=>ds.length>=2).sort((a,b)=>b[1].length-a[1].length || a[0].localeCompare(b[0],'de',{numeric:true}));
 for(const [size,ds] of groups.slice(0,3)){
   add('size-'+size,'Kleidung · Gr. '+size,ds.length+' passende Teile mit erfasster Größe',ds,'Größe ist aus Etikett oder Verkäuferangabe übernommen');
 }
 // Saison/Verwendung nur aufgrund eindeutig benannter Schnittformen vorschlagen.
 const byTypes=(types)=>items.filter(d=>isClothing(d)&&matching(raw(d.garmentType)+' '+raw(d.title),types));
 const winter=byTypes(definiteWinter);
 if(winter.length>=2)add('winter','Winterbekleidung',winter.length+' klar benannte Winterteile',winter,'Bitte Wettertauglichkeit selbst prüfen');
 const lightItems=byTypes(light);
 if(lightItems.length>=3)add('light','T-Shirts & leichte Teile',lightItems.length+' passende Kleidungsarten',lightItems,'Saison und Material bitte prüfen');
 const warmItems=byTypes(warm);
 if(warmItems.length>=3)add('warm','Pullover & Jacken',warmItems.length+' passende Oberteile',warmItems,'Saison und Material bitte prüfen');
 if(items.length>=2)add('all','Alles zusammen',Math.min(MAX,items.length)+' Teile für ein gemeinsames Paket',items.slice(0,MAX),'Die Zusammenstellung kannst du noch ändern');
 return candidates.slice(0,3);
}
export function packageCheck(drafts){
 const list=Array.isArray(drafts)?drafts:[];
 return {
   total:list.length,
   unnamed:list.filter(d=>raw(d?.title).length<4).length,
   unknownSizes:list.filter(d=>isClothing(d)&&!raw(d.facts?.size)).length,
   uncertain:list.filter(d=>raw(d?.uncertainty)).length,
 };
}
