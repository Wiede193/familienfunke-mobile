import assert from 'node:assert/strict';
import {collectMarketSizeLabels,marketListingSizes,marketMatchesSize,marketMatchesRegion} from '../MarketListingFilters.js';

assert.deepEqual(collectMarketSizeLabels('98/104'),['98','104']);
assert.deepEqual(collectMarketSizeLabels(['104','98/104',' 104 ']),['104','98']);
assert.deepEqual(collectMarketSizeLabels('24,5'),['24.5']);
assert.deepEqual(collectMarketSizeLabels(['unbekannt','98/104','Größe offen']),['98','104']);
const clothing={title:'Winterjacke Gr. 104',description:'Artikel-Steckbrief\nGröße: 104',size_labels:['104'],region_label:'Fürstenwalde/Spree'};
assert.deepEqual(marketListingSizes(clothing),['104']);
assert.equal(marketMatchesSize(clothing,'104'),true);
assert.equal(marketMatchesSize(clothing,'110'),false);
assert.equal(marketMatchesSize(clothing,'Alle'),true);

const mixedPackage={title:'2-teiliges Kleidungspaket',description:'Paketinhalt:\n1. Hose Gr. 86\n2. Pullover Gr. 92',size_labels:['86','92'],region_label:'Beeskow'};
assert.deepEqual(marketListingSizes(mixedPackage),['86','92']);
assert.equal(marketMatchesSize(mixedPackage,'92'),true);
assert.equal(marketMatchesSize(mixedPackage,'98'),false);

const range={title:'Kinderkleidung',description:'',size_labels:collectMarketSizeLabels('98/104'),region_label:'Potsdam'};
assert.deepEqual(marketListingSizes(range),['98','104']);
assert.equal(marketMatchesSize(range,'98'),true);
assert.equal(marketMatchesSize(range,'104'),true);
assert.equal(marketMatchesSize(range,'110'),false);

// Weder im Titel noch im Beschreibungstext stehende Größen gelten als Metadaten.
const oldTextOnly={title:'Paket Gr. 98',description:'Größe: 98',region_label:'Potsdam'};
assert.deepEqual(marketListingSizes(oldTextOnly),[]);
assert.equal(marketMatchesSize(oldTextOnly,'98'),false);
assert.equal(marketMatchesRegion(clothing,'fürstenwalde/spree'),true);
assert.equal(marketMatchesRegion(clothing,'Beeskow'),false);
assert.equal(marketMatchesRegion(clothing,'Alle'),true);
console.log('Familienbasar: strukturierte Größen und Regionen korrekt.');
