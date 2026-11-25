// Local-only preferences. No analytics, no network, no search-based profiling.
export const TV_PREFS_VERSION=1;
export const TV_HISTORY_AGE=30*24*60*60*1000;
export const tvPreferencesKey=owner=>'familienfunke.tv.preferences.v1.'+owner;
export function emptyTVPreferences(){return {version:1,historyEnabled:false,personalized:false,favorites:[],channels:[],history:[],resume:null};}
export function cleanTVPreferences(value,catalog,now=Date.now()){
 const p=value&&value.version===1?value:{};
 const ids=new Set(catalog.map(v=>v.id)),channels=new Set(catalog.map(v=>v.channel));
 const unique=(x,allowed)=>[...new Set(Array.isArray(x)?x.filter(v=>allowed.has(v)):[])].slice(0,100);
 const historyEnabled=p.historyEnabled===true;
 const seen=new Set();
 const history=historyEnabled&&Array.isArray(p.history)?p.history.filter(x=>x&&typeof x.query==='string'&&x.query.trim()&&x.query.length<=120&&Number.isFinite(x.at)&&x.at<=now&&now-x.at<TV_HISTORY_AGE).sort((a,b)=>b.at-a.at).filter(x=>{const k=x.query.toLocaleLowerCase('de-DE');if(seen.has(k))return false;seen.add(k);return true;}).slice(0,20):[];
 const resume=p.resume&&ids.has(p.resume.id)&&Number.isInteger(p.resume.seconds)&&p.resume.seconds>=0&&p.resume.seconds<=43200?{id:p.resume.id,seconds:p.resume.seconds}:null;
 return {version:1,historyEnabled,personalized:p.personalized===true,favorites:unique(p.favorites,ids),channels:unique(p.channels,channels),history,resume};
}
export function recordTVSearch(p,query,now=Date.now()){
 const q=String(query||'').trim().replace(/\s+/g,' ').slice(0,120);
 if(!p.historyEnabled||!q)return p;
 return {...p,history:[{query:q,at:now},...p.history.filter(x=>x.query.toLocaleLowerCase('de-DE')!==q.toLocaleLowerCase('de-DE')&&now-x.at<TV_HISTORY_AGE)].slice(0,20)};
}
export function toggleTVValue(items,value){return items.includes(value)?items.filter(x=>x!==value):[...items,value];}
const tags={
 'Lesen & Lernen':['Lesen','Hörbücher','Hörspiele','Bibliotheken','Sprachen lernen'],
 'Familienküche':['Kochen','Backen','Gemeinsam kochen'],
 'Medien & Alltag':['Technik & Tüfteln','Videospiele','Kino','Filme & Serien'],
 'Erziehung & Alltag':['Eltern-Kind-Treffen','Spielgruppen','Familientreffen']
};
export function tvReason(video,interests,enabled){
 if(enabled!==true||!Array.isArray(interests))return '';
 return (tags[video.category]||[]).find(tag=>interests.includes(tag))||'';
}
export function rankTVVideos(videos,interests,enabled){
 if(enabled!==true)return videos;
 return [...videos].sort((a,b)=>Number(!!tvReason(b,interests,true))-Number(!!tvReason(a,interests,true)));
}
// A finite weekly rotation of the existing editorial catalogue; no tracking.
export function weeklyTVProgram(videos,now=Date.now()){
 if(!videos.length)return [];
 const week=Math.floor(now/(7*86400000));
 const offset=((week%videos.length)+videos.length)%videos.length;
 return [...videos.slice(offset),...videos.slice(0,offset)];
}
