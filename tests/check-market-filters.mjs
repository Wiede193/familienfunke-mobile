import assert from 'node:assert/strict';
import {marketListingSizes,marketMatchesSize,marketMatchesRegion} from '../MarketListingFilters.js';

const clothing={title:'Winterjacke Gr. 104',description:'Artikel-Steckbrief\nGröße: 104\nMängel: Keine bekannt',region_label:'Fürstenwalde/Spree'};
assert.deepEqual(marketListingSizes(clothing),['104']);
assert.equal(marketMatchesSize(clothing,'104'),true);
assert.equal(marketMatchesSize(clothing,'110'),false);
assert.equal(marketMatchesSize(clothing,'Alle'),true);

const mixedPackage={title:'2-teiliges Kleidungspaket',description:'Artikel-Steckbrief\nMängel: Keine bekannt\n\nPersönliche Notiz:\nPaketinhalt:\n1. Hose · Gr. 86\n2. Pullover · Gr. 92',region_label:'Beeskow'};
assert.deepEqual(marketListingSizes(mixedPackage),['86','92']);
assert.equal(marketMatchesSize(mixedPackage,'92'),true);
assert.equal(marketMatchesSize(mixedPackage,'98'),false);

const range={title:'Kinderkleidung',description:'Artikel-Steckbrief\nGröße: 98/104',region_label:'Potsdam'};
assert.deepEqual(marketListingSizes(range),['98/104']);
assert.equal(marketMatchesSize(range,'98/104'),true);
assert.equal(marketMatchesSize(range,'98'),true);
assert.equal(marketMatchesSize(range,'104'),true);
assert.equal(marketMatchesSize(range,'110'),false);

const noEvidence={title:'Spielzeug Modell 104',description:'Für Kinder',region_label:''};
assert.deepEqual(marketListingSizes(noEvidence),[]);
assert.equal(marketMatchesSize(noEvidence,'104'),false);
assert.equal(marketMatchesRegion(noEvidence,'Potsdam'),false);
assert.equal(marketMatchesRegion(clothing,'fürstenwalde/spree'),true);
assert.equal(marketMatchesRegion(clothing,'Beeskow'),false);
assert.equal(marketMatchesRegion(clothing,'Alle'),true);
console.log('Familienbasar: Größen- und Regionsfilter erfolgreich geprüft.');
