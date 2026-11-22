import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const calls=[];
const create=new Function('Alert',read('FamilyActions.js').replace("import {Alert} from 'react-native';",'').replace('export function','function')+'\nreturn confirmRemoval;');
const confirm=create({alert:(...args)=>calls.push(args)});
let count=0;confirm({title:'Foto löschen?',description:'Nur dieses Bild',onConfirm:()=>count++});
assert.equal(count,0);assert.equal(calls[0][2][0].style,'cancel');assert.equal(calls[0][2][1].style,'destructive');assert.equal(calls[0][2][1].text,'Löschen');calls[0][2][1].onPress();assert.equal(count,1);
for(const name of ['App.jsx','FamilyCalendar.jsx','SavedMarketSearches.jsx','HomeAssistant.jsx'])assert.match(read(name),/confirmRemoval\(/);
for(const name of ['App.jsx','FamilyCalendar.jsx','SavedMarketSearches.jsx'])assert.match(read(name),/<FamilyActionButton/);
assert.match(read('FamilyActionButton.jsx'),/minHeight:48,minWidth:48/);
assert.match(read('FamilyCalendar.jsx'),/eq\('id',row\.id\)\.eq\('user_id',userId\)/);
assert.match(read('App.jsx'),/eq\('id',id\)\.eq\('owner_id',me\)/);
console.log('Shared action button and explicit removal confirmation checked');

confirm({title:'Foto löschen?',description:'Nur dieses Bild',translate:s=>s==='Abbrechen'?'Cancel':s==='Löschen'?'Delete':s,onConfirm:()=>count++});assert.equal(calls[1][2][0].text,'Cancel');assert.equal(calls[1][2][1].text,'Delete');assert.equal(count,1);
