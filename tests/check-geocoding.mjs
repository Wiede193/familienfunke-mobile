import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(read(p)).toString('base64'));
const {normalizeGeocodes}=await load('supabase/functions/ff-geocode/normalize.js');
const {mergeMapSearchResults}=await load('FamilyMapSearch.js');
const feature=(p,coords=[13.38,52.51])=>({geometry:{type:'Point',coordinates:coords},properties:{countrycode:'DE',...p}});
const hits=normalizeGeocodes({features:[
 feature({name:'Öffentliches Rathaus',street:'Marktplatz',housenumber:'1',postcode:'12345',city:'Beispielstadt',osm_id:1}),
 feature({name:'Beispielstadt',osm_value:'town',osm_id:2}),
 feature({name:'Marktplatz',type:'street',osm_id:3}),
 feature({name:'12345',postcode:'12345',osm_id:4}),
 feature({countrycode:'PL',name:'Fremdland',osm_id:5}),
 feature({name:'Ungültig',osm_id:6},['13.3',52.5]),
 feature({name:'Außerhalb',osm_id:7},[80,30]),
 feature({name:'Öffentliches Rathaus',street:'Marktplatz',housenumber:'1',postcode:'12345',city:'Beispielstadt',osm_id:1})
]});
assert.equal(hits.length,4);
assert.equal(hits[0].title,'Marktplatz 1');
assert.equal(hits[0].kind,'Adresse');
assert.match(hits[0].subtitle,/12345 Beispielstadt/);
assert.equal(hits[1].kind,'Ort');
assert.equal(hits[2].kind,'Straße');
assert.equal(hits[3].title,'12345');
assert.ok(hits.every(x=>x.source==='geocode' && Number.isFinite(x.latitude)));
assert.equal(normalizeGeocodes(null).length,0);
const local=[{id:'local',title:'Familienpark',latitude:52.51,longitude:13.38,source:'curated'}];
assert.equal(mergeMapSearchResults(local,hits)[0].id,'local');
assert.equal(mergeMapSearchResults(local,hits).length,5);
assert.equal(mergeMapSearchResults(local,[{...hits[0],source:'pending'}]).length,1);
assert.equal(mergeMapSearchResults([],Array.from({length:30},(_,i)=>({...hits[0],title:'Straße '+i,id:'geo:'+i}))).length,10);
const edge=read('supabase/functions/ff-geocode/index.ts');
const sql=read('database/ff_geocode_quota.sql');
const app=read('FamilyMap.jsx');
assert.match(edge,/withSupabase\(\{auth:"user"\}/);
assert.match(edge,/ctx\.supabaseAdmin\.rpc\("ff_geocode_claim"/);
assert.ok(edge.indexOf('ff_geocode_claim')<edge.indexOf('await fetch(url'));
assert.match(edge,/countrycode","DE"/);
assert.match(edge,/AbortSignal\.timeout\(9000\)/);
assert.match(edge,/Cache-Control":"no-store"/);
assert.match(sql,/for update/);
assert.match(sql,/g\.calls>=150/);
assert.match(sql,/u\.calls>=20/);
assert.match(sql,/interval '2 seconds'/);
assert.match(sql,/grant execute on function public\.ff_geocode_claim\(uuid\) to service_role/);
assert.match(app,/onSubmitEditing=\{searchGermany\}/);
assert.match(app,/onPress=\{searchGermany\}/);
assert.match(app,/onChangeText=\{changePlaceQuery\}/);
assert.match(app,/request!==geoRequest\.current/);
assert.match(app,/mergeMapSearchResults\(localMatches,geoResults\)/);
assert.match(app,/match\.source==='geocode'/);
assert.match(app,/searchNearMatch\(selectedSearchMatch\)/);
assert.match(app,/Photon \/ © OpenStreetMap-Mitwirkende/);
assert.match(app,/Bitte keine privaten Wohnadressen/);
console.log('Deutschlandweite Kartensuche: Ergebnisvalidierung, Limits, Kartenintegration und Datenschutz geprüft.');
