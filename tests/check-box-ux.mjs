import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path=new URL('../MarketBoxSuggestions.js',import.meta.url);
const source=readFileSync(path,'utf8');
const {suggestBoxPackages,packageCheck}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const mk=(id,size,kind,category='Kleidung')=>({id,title:kind,garmentType:kind,category,facts:{size}});
const assertChoices=items=>{
  const suggestions=suggestBoxPackages(items);
  assert.ok(suggestions.length<=3,'Never display more than 3 suggestions');
  for(const s of suggestions){
    assert.ok(s.ids.length>=2&&s.ids.length<=10,'Only 2-10 items per package');
    assert.equal(new Set(s.ids).size,s.ids.length,'No duplicate listing IDs');
    assert.ok(s.ids.every(id=>items.some(x=>x.id===id)),'Only existing articles are selected');
  }
  return suggestions;
};
const oneSize=assertChoices([mk('a','86','Body'),mk('b','86','Hose'),mk('c','92','Pullover')]);
assert.match(oneSize[0].title,/Gr\. 86/);
assert.equal(assertChoices([mk('a','','Hose'),mk('b','','Body')]).some(x=>x.title.includes('Gr.')),false,'Do not invent sizes');
const thirty=Array.from({length:30},(_,i)=>mk('d'+i,'86',i%2?'T-Shirt':'Shorts'));
assertChoices(thirty);
const allOption=assertChoices([mk('a','','Hose'),mk('b','','Pullover'),mk('c','','Body'),mk('d','','Shirt')]);
assert.ok(allOption.some(x=>x.title==='Alles zusammen'));
assert.ok(assertChoices([mk('a','','Hoodie'),mk('b','','Pullover')]).every(x=>x.title!=='Winterbekleidung'));
const mixed=assertChoices([mk('a','98','Winterjacke'),mk('b','104','Winterjacke'),mk('c','','T-Shirt')]);
assert.ok(mixed.every(x=>x.ids.every(id=>['a','b','c'].includes(id))));
const check=packageCheck([mk('a','','Pullover'),{...mk('b','86','Body'),uncertainty:'Farbe nicht lesbar'}]);
assert.deepEqual({unknownSizes:check.unknownSizes,uncertain:check.uncertain},{unknownSizes:1,uncertain:1});
assert.equal(suggestBoxPackages([mk('a','','Body')]).length,0);
console.log('Familienfunke Kistenmodus: 8 UX-/Paket-Prüfungen erfolgreich');
