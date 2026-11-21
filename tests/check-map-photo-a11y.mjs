import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const importSource=async path=>import('data:text/javascript;base64,'+
 Buffer.from(read(path)).toString('base64'));
const {marketPhotoFacts,marketPhotoAlt}=await importSource('MarketAccessibleDescription.js');
const {findFamilyMapLocations}=await importSource('FamilyMapSearch.js');

const listing={title:'Kinderjeans',category:'Kleidung',item_condition:'Gut'};
const facts={facts:{color:'blau',size:'110',brand:'',detail:'Taschen'}};
const spoken=marketPhotoAlt(listing,facts,null,1,3);
assert.match(spoken,/Anzeigenfoto 2 von 3/);
assert.match(spoken,/Größe: 110/);
assert.match(spoken,/Farbe: blau/);
assert.match(spoken,/Weitere Merkmale: Taschen/);
assert.match(spoken,/keine geprüfte Bildbeschreibung/);
assert.doesNotMatch(spoken,/mängelfrei|wie neu|garantiert/i,'No unverified visual promises');
const unknown=marketPhotoFacts({title:'Pullover',category:'Kleidung'},null,null);
assert.doesNotMatch(unknown,/Größe:|Farbe:/,'Unknown information must remain unknown');
const bundle=marketPhotoFacts({title:'Kleidungspaket'},null,
  {rows:['1. Jeans · Gr. 110 · blau','2. Pullover · Gr. 116 · rot']});
assert.match(bundle,/Gr. 110/);
assert.match(bundle,/Gr. 116/);
assert.doesNotMatch(bundle,/Größe: 110.*Pullover/,'Never mix package sizes');

const centers=[{name:'Fürstenwalde',lat:52.36,lon:14.06},
  {name:'Berlin',lat:52.52,lon:13.405}];
const venues=[{id:'castle',title:'Burg Storkow',region_label:'Storkow (Mark)',
  latitude:52.255,longitude:13.933}];
const verified=[{id:'verified',title:'Familienpark',region_label:'Beeskow',
  latitude:52.17,longitude:14.25,moderation_status:'approved'}];
const pending=[{id:'pending',title:'Geheimer Kinderort',region_label:'Beeskow',
  latitude:52.18,longitude:14.24,moderation_status:'pending'}];
const inventory={centers,curated:venues,community:[...verified,...pending]};
assert.equal(findFamilyMapLocations('Fürstenwalde',inventory)[0]?.source,'city');
assert.equal(findFamilyMapLocations('furstenwalde',inventory)[0]?.title,'Fürstenwalde');
assert.equal(findFamilyMapLocations('Storkow',inventory)[0]?.title,'Burg Storkow');
assert.equal(findFamilyMapLocations('Familienpark',inventory)[0]?.source,'community');
assert.equal(findFamilyMapLocations('Geheimer',inventory).length,0,
  'Never show unapproved community places in search results');
assert.equal(findFamilyMapLocations('Burg',inventory)[0]?.longitude,13.933);
assert.equal(findFamilyMapLocations('Burg',inventory,2).length,1);
assert.equal(findFamilyMapLocations('?',inventory).length,0);

const map=read('FamilyMap.jsx'),app=read('App.jsx');
assert.match(map,/findFamilyMapLocations\(placeQuery/,'Map must use indexed local place search');
assert.match(map,/accessibilityLabel="Stadt oder Ausflugsziel suchen"/);
assert.match(map,/onPress=\{\(\)=>selectSearchedLocation\(match\)\}/,
  'Every map result needs an accessible selection action');
assert.match(map,/if\(match.source==='city'\)visit/,'City selection must recenter map');
assert.match(map,/else showPlace\(match.place\)/,'Place selection must open details');
assert.match(app,/marketPhotoAlt\(selected,selectedFacts,selectedPackage,galleryIndex,gallery.length,t\)/);
assert.match(app,/Bildbeschreibung aus Artikelangaben/);
assert.match(app,/Einzelne Fotos wurden nicht gesondert beschrieben/);
console.log('Barrierefreie Artikeldaten und lokale Ortssuche: Verhalten und Datenschutz geprüft.');
