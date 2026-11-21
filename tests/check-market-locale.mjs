import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {marketSearchQuery:q}=await import('data:text/javascript;base64,'+Buffer.from(read('MarketLocaleSearch.js')).toString('base64'));
for(const [input,expected] of [
 ['Blue jeans, size 110','blau jeans 110'],["children's red jacket size 116",'rot jacke 116'],
 ['black stroller','schwarz kinderwagen'],['dark blue jeans 104','dunkelblau jeans 104'],
 ['car seat','kindersitz'],['Lego Star Wars','Lego Star Wars'],['Frankfurt (Oder)','Frankfurt (Oder)'],
 ['blue Nike shoes 28','blau Nike schuhe 28'],['blue jeans size 110 5','blau jeans 110 5'],
 ['blau jeans 110','blau jeans 110'],['size 110','size 110']
])assert.equal(q(input,'en'),expected,input);
assert.equal(q('Blue jeans, size 110','de'),'Blue jeans, size 110');
assert.equal(q('','en'),'');
assert.ok(q('blue '.repeat(100),'en').length<=160);
const app=read('App.jsx'),home=read('HomeAssistant.jsx');
assert.match(app,/p_query:canonicalQuery,p_category:filter,p_trade_type:tradeFilter/);
assert.match(app,/saveMarketSearch\(\{query:canonicalQuery,category:filter,trade:tradeFilter,minPrice,maxPrice\}\)/);
assert.match(home,/p_query:marketSearchQuery\(query,language\)/);
assert.match(app,/category,item_condition:condition,trade_type:trade,price_cents:trade==='sell'\?cents:0/);
console.log('Marketplace aliases, stable filter codes, saved search parity and EUR amounts checked');
