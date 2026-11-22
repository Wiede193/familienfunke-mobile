// Pure, versioned presentation preferences. No security role or access rights.
export const DEFAULT_HOME=Object.freeze(['discover','map','market','box','play','outing']);
export const DEFAULT_BOTTOM=Object.freeze(['home','market','discover','map','guide']);
export const HOME_IDS=Object.freeze(['box','sell','market','discover','map','outing','guide','play','calendar','events','contacts','profile','partners','help','chat','inbox','push','aboutApp','inclusion']);
export const BOTTOM_ITEMS=Object.freeze([
 ['home','Start','⌂'],['market','Flohmarkt','♧'],['discover','Familien','♡'],['map','Karte','⌖'],['guide','Wegweiser','☀'],
 ['contacts','Kontakte','♡'],['chat','Chat','✉'],['outing','Ausflüge','☀'],['calendar','Kalender','▦'],['play','Spiele','✧'],['profile','Profil','◉'],['events','Treffen','▦']
]);
export const BOTTOM_IDS=Object.freeze(BOTTOM_ITEMS.map(x=>x[0]));
export const MAX_BOTTOM=5;
function uniqueAllowed(values,allowed){
 return [...new Set(values.filter(x=>typeof x==='string'&&allowed.includes(x)))];
}
export function normalizeLayout(raw){
 const source=raw&&typeof raw==='object'&&raw.version===1?raw:{};
 const home=Array.isArray(source.home)?uniqueAllowed(source.home,HOME_IDS):[...DEFAULT_HOME];
 const bottom=Array.isArray(source.bottom)?uniqueAllowed(source.bottom,BOTTOM_IDS):[...DEFAULT_BOTTOM];
 return {version:1,home,bottom:['home',...bottom.filter(x=>x!=='home')].slice(0,MAX_BOTTOM)};
}
export function moveShortcut(ids,index,delta,lockedFirst=false){
 if(!Array.isArray(ids)||!Number.isInteger(index)||![-1,1].includes(delta))return ids;
 const target=index+delta,minimum=lockedFirst?1:0;
 if(index<minimum||index>=ids.length||target<minimum||target>=ids.length)return ids;
 const result=[...ids];[result[index],result[target]]=[result[target],result[index]];return result;
}
export function layoutKey(userId){
 return typeof userId==='string'&&userId.length?'familienfunke.layout.v1.'+userId:null;
}
