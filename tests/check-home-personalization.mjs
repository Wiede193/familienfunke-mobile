import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../HomePersonalization.js',import.meta.url),'utf8');
const {normalizeFamilyRegion,regionMatches,recommendFamilyPlaces,
  selectHomeOffers,selectHomeEvents,missingFamilyProfileStep,homeGreeting,matchingPlaceInterests,placeRecommendationReason}=
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(normalizeFamilyRegion('  Fürstenwalde/Spree  '),'furstenwalde spree');
assert.equal(regionMatches('Frankfurt (Oder) · Umgebung','Frankfurt (Oder)'),true);
assert.equal(regionMatches('Berlin','Frankfurt (Oder)'),false);
const places=[
 {id:'a',title:'Park in Berlin',region_label:'Berlin',category:'outing',description:'Ein Park'},
 {id:'b',title:'Natur in Frankfurt (Oder)',region_label:'Frankfurt (Oder)',category:'outing',description:'Wildpark'},
 {id:'c',title:'Museum in Potsdam',region_label:'Potsdam',category:'outing',description:'Museum'},
 {id:'d',title:'Spielplatz in Frankfurt (Oder)',region_label:'Frankfurt (Oder) · Umgebung',description:'Spielen'}
];
const chosen=recommendFamilyPlaces(places,{region:'Frankfurt (Oder)',interests:['Tiere','Spielplatz']},3);
assert.equal(chosen.length,3);
assert.ok(chosen[0].isLocal);
assert.equal(chosen[0].place.id,'b','Region and matching interests must win');
assert.ok(chosen[1].isLocal);
assert.equal(recommendFamilyPlaces([],{},3).length,0,'Do not invent an outing');
assert.ok(recommendFamilyPlaces(places,{},2).every(x=>!x.isLocal),'Unspecified region is not nearby');

const offers=[
 {listing:{id:'1',title:'Kleid',moderation_status:'pending',region_label:'Berlin',seller_id:'seller'}},
 {listing:{id:'2',title:'Kinderbuch',moderation_status:'approved',region_label:'Berlin',seller_id:'seller'}},
 {listing:{id:'3',title:'Kinderwagen',moderation_status:'approved',region_label:'Frankfurt (Oder)',seller_id:'seller'}},
 {listing:{id:'4',title:'Eigenes Angebot',moderation_status:'approved',region_label:'Frankfurt (Oder)',seller_id:'mine'}}
];
const filtered=selectHomeOffers(offers,{region:'Frankfurt (Oder)',ownerId:'mine'},3);
assert.deepEqual(filtered.map(x=>x.id),['3','2']);
assert.deepEqual(selectHomeOffers([{listing:{id:'a',title:'Warten',moderation_status:'pending',seller_id:'other'}}],{}),[]);

const future='2099-01-10T11:00:00.000Z';
const past='2000-01-10T11:00:00.000Z';
const events=selectHomeEvents([
 {id:'1',title:'Alt',kind:'family',starts_at:past,region_label:'Berlin'},
 {id:'2',title:'Berlin',kind:'partner',starts_at:future,region_label:'Berlin'},
 {id:'3',title:'Frankfurt',kind:'family',starts_at:future,region_label:'Frankfurt (Oder)'}
],{region:'Frankfurt (Oder)'},2,new Date('2026-11-22').getTime());
assert.deepEqual(events.map(x=>x.id),['3','2']);
assert.deepEqual(selectHomeEvents([{id:'1',title:'Nur im Archiv',kind:'family',starts_at:past}],{},2),[]);
assert.deepEqual(missingFamilyProfileStep({}),{title:'Region auswählen',detail:'Dann können wir regionale Inhalte hervorheben.',route:'profile'});
assert.equal(missingFamilyProfileStep({region_label:'Berlin',interests:[],about:''}).title,'Interessen auswählen');
assert.equal(missingFamilyProfileStep({region_label:'Berlin',interests:['Natur'],about:''}).title,'Familie vorstellen');
assert.equal(missingFamilyProfileStep({region_label:'Berlin',interests:['Natur'],about:'Unsere Familie'}),null);
assert.equal(homeGreeting({display_name:'Familie Sonne'}),'Hallo, Familie Sonne!');
assert.equal(homeGreeting(null),'Schön, dass ihr da seid!');
assert.equal(regionMatches('Berliner Umland','Berlin'),false);
assert.equal(regionMatches('Halle','Hall'),false);
const bath={id:'bath',title:'Erlebnisbad',region_label:'Potsdam',kind:'water'};
const pool=matchingPlaceInterests(bath,['schwimmen','Schwimmen','Töpfern']);
assert.deepEqual(pool.matched,['schwimmen']);
assert.equal(recommendFamilyPlaces([places[0],bath],{interests:['Schwimmen']},1)[0].place.id,'bath');
assert.equal(recommendFamilyPlaces([bath,bath],{},3).length,1);
assert.equal(placeRecommendationReason({isLocal:false,matchedInterests:[]}), 'Ausflugstipp aus dem Katalog');
assert.equal(placeRecommendationReason({isLocal:true,matchedInterests:['Schwimmen']}),'Eure Region · Schwimmen');
assert.equal(placeRecommendationReason({isLocal:false,matchedInterests:['Schwimmen']}),'Interesse: Schwimmen');
assert.deepEqual(matchingPlaceInterests(bath,['frei erfunden']).matched,[]);
console.log('Personalized home: verified content filters, region specificity, profile prompts and greeting passed.');
