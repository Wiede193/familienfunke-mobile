// Local-only preferences. No analytics or network. Recommendations are opt-in, derived in memory.
export const TV_PREFS_VERSION=2;
export const TV_HISTORY_AGE=180*24*60*60*1000;
export const TV_HISTORY_LIMIT=100;
export const TV_PRIVATE_TOPICS=Object.freeze(['Inklusion & Teilhabe','Schwangerschaft & Baby','Sport & Bewegung','Erziehung & Alltag','Familienküche','Ernährung in der Familie','Beauty & Wohlbefinden','Advent & Weihnachten','Lesen & Lernen','Medien & Alltag']);
export const tvPreferencesKey=owner=>'familienfunke.tv.preferences.v1.'+owner;
export function emptyTVPreferences(){return {version:TV_PREFS_VERSION,enabled:false,historyEnabled:false,personalized:false,recommendFromHistory:false,recommendFromSaved:false,favorites:[],channels:[],history:[],resume:null,topics:[]};}
export function setTVConsent(p,enabled){return enabled===true?{...emptyTVPreferences(),...(p.enabled?p:{}),enabled:true,historyEnabled:true,personalized:true,recommendFromHistory:true,recommendFromSaved:true}:emptyTVPreferences();}
export function cleanTVPreferences(value,catalog,now=Date.now()){
 if(!value||value.version!==TV_PREFS_VERSION||value.enabled!==true)return emptyTVPreferences();
 const p=value;
 const ids=new Set(catalog.map(v=>v.id)),channels=new Set(catalog.map(v=>v.channel));
 const unique=(x,allowed)=>[...new Set(Array.isArray(x)?x.filter(v=>allowed.has(v)):[])].slice(0,100);
 const historyEnabled=true;
 const seen=new Set();
 const history=historyEnabled&&Array.isArray(p.history)?p.history.filter(x=>x&&typeof x.query==='string'&&x.query.trim()&&x.query.length<=120&&Number.isFinite(x.at)&&x.at<=now&&now-x.at<TV_HISTORY_AGE).sort((a,b)=>b.at-a.at).filter(x=>{const k=x.query.toLocaleLowerCase('de-DE');if(seen.has(k))return false;seen.add(k);return true;}).slice(0,TV_HISTORY_LIMIT):[];
 const resume=p.resume&&ids.has(p.resume.id)&&Number.isInteger(p.resume.seconds)&&p.resume.seconds>=0&&p.resume.seconds<=43200?{id:p.resume.id,seconds:p.resume.seconds}:null;
 return {version:TV_PREFS_VERSION,enabled:true,historyEnabled:true,personalized:true,recommendFromHistory:true,recommendFromSaved:true,favorites:unique(p.favorites,ids),channels:unique(p.channels,channels),history,resume,topics:unique(p.topics,new Set(TV_PRIVATE_TOPICS))};
}
export function recordTVSearch(p,query,now=Date.now()){
 const q=String(query||'').trim().replace(/\s+/g,' ').slice(0,120);
 if(p.enabled!==true||!q)return p;
 return {...p,history:[{query:q,at:now},...p.history.filter(x=>x.query.toLocaleLowerCase('de-DE')!==q.toLocaleLowerCase('de-DE')&&now-x.at<TV_HISTORY_AGE)].slice(0,TV_HISTORY_LIMIT)};
}
export function toggleTVValue(items,value){return items.includes(value)?items.filter(x=>x!==value):[...items,value];}
const tags={
 'Lesen & Lernen':['Lesen','Hörbücher','Hörspiele','Bibliotheken','Sprachen lernen'],
 'Familienküche':['Kochen','Backen','Gemeinsam kochen'],
 'Medien & Alltag':['Technik & Tüfteln','Videospiele','Kino','Filme & Serien'],
 'Erziehung & Alltag':['Eltern-Kind-Treffen','Spielgruppen','Familientreffen'],
 'Ernährung in der Familie':['Kochen','Backen','Gemeinsam kochen'],
 'Advent & Weihnachten':['Backen','Basteln','DIY & Heimwerken'],
 'Sport & Bewegung':['Sport','Yoga','Fitness','Turnen','Tanzen']
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

// Match earlier explicit searches to the curated catalogue, not to inferred
// demographic or health attributes. No derived profile is stored.
const tvNormalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-DE');
const tvTerms=q=>tvNormalize(q).trim().split(/\s+/).filter(Boolean);
function historyMatches(video,query){
 const terms=tvTerms(query);
 if(!terms.length)return false;
 const hay=tvNormalize([video.title,video.channel,video.category,video.description].join(' '));
 return terms.every(term=>hay.includes(term));
}
export function tvRecommendations(catalog,preferences,interests=[],now=Date.now()){
 const p=cleanTVPreferences(preferences,catalog,now);
 if(!p.enabled)return [];
 const saved=new Set(p.favorites),followed=new Set(p.channels);
 const savedTopics=p.recommendFromSaved?new Set(catalog.filter(v=>saved.has(v.id)).map(v=>v.category)):new Set();
 const searchedTopics=new Set();
 if(p.recommendFromHistory){
  for(const h of p.history)for(const v of catalog)if(historyMatches(v,h.query))searchedTopics.add(v.category);
 }
 return catalog.map((video,index)=>{
  let score=0;const reasons=[];
  // Do not infer disability/pregnancy from ordinary searches, saves or profile hobbies.
  const sensitive=['Inklusion & Teilhabe','Schwangerschaft & Baby'].includes(video.category);
  if(sensitive&&!p.topics.includes(video.category))return {video,score:0,reasons:[],index};
  if(p.topics.includes(video.category)){score+=8;reasons.push('Passt zu einem privat gewählten Thema');}
  const interest=tvReason(video,interests,p.personalized);
  if(interest){score+=3;reasons.push('Passt zu deinem Interesse: '+interest);}
  if(p.recommendFromSaved){
   if(followed.has(video.channel)){score+=5;reasons.push('Von einem gemerkten Kanal');}
   if(savedTopics.has(video.category)){score+=4;reasons.push('Ähnlich zu gemerkten Videos');}
  }
  if(p.recommendFromHistory){
   if(p.history.some(h=>historyMatches(video,h.query))){score+=6;reasons.push('Passt zu einer früheren TV-Suche');}
   else if(searchedTopics.has(video.category)){score+=2;reasons.push('Verwandtes Thema zu früheren TV-Suchen');}
  }
  return {video,score,reasons,index};
 }).filter(row=>row.score>0&&!saved.has(row.video.id)).sort((a,b)=>b.score-a.score||a.index-b.index).map(({video,score,reasons})=>({video,score,reasons}));
}

// A single queue per account across screen remounts. No optional persistence when disabled.
const pendingByKey=new Map(),revokedKeys=new Set();
function serial(key,operation){
 const prior=pendingByKey.get(key)||Promise.resolve();
 const work=prior.catch(()=>{}).then(operation);
 pendingByKey.set(key,work);
 const cleanup=()=>{if(pendingByKey.get(key)===work)pendingByKey.delete(key);};
 work.then(cleanup,cleanup);return work;
}
export function loadTVPreferences(storage,key,catalog,now=Date.now()){
 return serial(key,async()=>{
  const raw=await storage.getItem(key);
  let value=null;
  try{value=raw?JSON.parse(raw):null;}catch{}
  const p=revokedKeys.has(key)?emptyTVPreferences():cleanTVPreferences(value,catalog,now);
  if(!p.enabled){if(raw!==null)await storage.removeItem(key);return p;}
  const cleaned=JSON.stringify(p);
  if(raw!==cleaned)await storage.setItem(key,cleaned);
  return p;
 });
}
export function persistTVPreferences(storage,key,value,catalog,now=Date.now()){
 const p=cleanTVPreferences(value,catalog,now);
 if(!p.enabled)revokedKeys.add(key);
 return serial(key,async()=>{
  if(p.enabled){await storage.setItem(key,JSON.stringify(p));revokedKeys.delete(key);}
  else{revokedKeys.add(key);await storage.removeItem(key);}
  return p;
 });
}
