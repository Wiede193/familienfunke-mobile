import assert from 'node:assert/strict';
import {canonicalItemType,canonicalColors,canonicalPattern,buildMarketAttributes,marketAiTypeSuggestion} from '../MarketAttributeSchema.js';
assert.equal(canonicalItemType('Hose','Kleidung'),'Hose');
assert.equal(canonicalItemType('Jeanshose','Kleidung'),'Jeans');
assert.equal(canonicalItemType('Kleider','Kleidung'),'');
assert.equal(canonicalItemType('Hose','Möbel'),'');
assert.deepEqual(canonicalColors('Dunkelblau, weiß'),['Blau','Weiß']);
assert.deepEqual(canonicalColors('Fantasiefarbe'),[]);
assert.equal(canonicalPattern('Gestreift'),'Gestreift');
assert.equal(canonicalPattern('vielleicht gestreift'),'');
const single=buildMarketAttributes({category:'Kleidung',itemType:'Hose',facts:{size:'98/104',color:'Blau',brand:'Marke A'},pattern:'Gestreift'});
assert.deepEqual(single.item_types,['Hose']);
assert.deepEqual(single.size_labels,['98','104']);
assert.deepEqual(single.color_labels,['Blau']);
assert.deepEqual(single.brand_labels,['Marke A']);
const pack=buildMarketAttributes({category:'Kleidung',packageItems:[
 {category:'Kleidung',itemType:'Hose',facts:{size:'86',color:'Blau'}},
 {category:'Kleidung',itemType:'Body',facts:{size:'92',color:'Rot'}}
]});
assert.deepEqual(pack.item_types,['Hose','Body']);
assert.deepEqual(pack.size_labels,['86','92']);
assert.deepEqual(pack.color_labels,['Blau','Rot']);
assert.deepEqual(buildMarketAttributes({category:'Spielzeug',itemType:'Puzzle',facts:{size:'104'}}).size_labels,[]);
assert.deepEqual(buildMarketAttributes({category:'Kleidung',facts:{},itemType:'',material:''}).item_types,[]);
assert.equal(marketAiTypeSuggestion({category:'Kleidung',garmentType:'Leggings'}),'Leggings');
console.log('Familienbasar: strukturierte KI-Attribute und Paketfacetten geprüft.');
