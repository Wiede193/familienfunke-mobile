// Curated, local catalogue; never accepts arbitrary user HTML or video URLs.
export const TV_ORIGIN='https://de.familienfunke.app';
export const TV_PRIVACY_URL='https://policies.google.com/privacy?hl=de';
export const TV_VIDEOS=Object.freeze([
  {id:'ILIB9YOE1DM',title:'Vorlesen schafft Chancen: Sally',channel:'Stiftung Lesen',category:'Lesen & Lernen',description:'Warum gemeinsames Vorlesen im Familienalltag einen Unterschied macht.'},
  {id:'VCHXgpOdfd4',title:'Gefahren und Risiken im Internet – Tipps für Eltern',channel:'#DigitaleVorbilder',category:'Medien & Alltag',description:'Impulse für gemeinsame Regeln und einen sicheren Umgang mit digitalen Medien.'},
  {id:'JQsHa6bf-xE',title:'Medien sicher nutzen – Eltern begleiten ihre Kinder',channel:'klicksafe',category:'Medien & Alltag',description:'Webseminar mit Tipps zur Medienerziehung und zu technischen Schutzmöglichkeiten.'}
,
  {id:'QAF7iNFKg4U',title:'Kochen ohne Fertigprodukte – Viel für wenig',channel:'WDR',category:'Familienküche',description:'Björn Freitag begleitet eine Familie beim Kochen mit frischen Zutaten.'},
  {id:'R_DVON0csog',title:'Grenzen setzen und Erziehung – Gespräch mit Jan-Uwe Rogge',channel:'Dominik Spenst',category:'Erziehung & Alltag',description:'Ein ausführliches Interview über Beziehungen, Grenzen und den Familienalltag.'}
].map(Object.freeze));
export const TV_CATEGORIES=Object.freeze(['Alle',...new Set(TV_VIDEOS.map(v=>v.category))]);
export function isVideoId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);}
export function tvWatchUrl(id){
 if(!isVideoId(id))throw new Error('Ungültige Video-ID');
 return 'https://www.youtube.com/watch?v='+id;
}
export function filterTVVideos(category='Alle',query='',catalog=TV_VIDEOS){
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-DE');
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return catalog.filter(v=>(category==='Alle'||v.category===category)&&words.every(w=>normalize([v.title,v.channel,v.category,v.description].join(' ')).includes(w)));
}
// Capture the displayed order at activation, never loop or auto-select external recommendations.
export function tvQueue(videos,id,autoplay=false){
 const index=videos.findIndex(v=>v.id===id);
 if(index<0)return [];
 const remaining=autoplay===true?videos.slice(index):videos.slice(index,index+1);
 return [...new Set(remaining.map(v=>v.id).filter(isVideoId))];
}
export function tvEmbedSource(id,autoplay=false,queue=[],startSeconds=0){
 if(!isVideoId(id))throw new Error('Ungültige Video-ID');
 const auto=autoplay===true;
 const next=auto?[...new Set(queue.filter(v=>v!==id&&isVideoId(v)))].slice(0,30):[];
 const start=Number.isInteger(startSeconds)&&startSeconds>=0&&startSeconds<=43200?startSeconds:0;
 const src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay='+(auto?'1':'0')+'&playsinline=1&controls=1&fs=1&rel=0&hl=de&loop=0&enablejsapi=1&origin='+encodeURIComponent(TV_ORIGIN)+'&start='+start+(next.length?'&playlist='+next.join(','):'');
 // baseUrl supplies the app identifier as HTTP Referer, as required by YouTube.
 return {baseUrl:TV_ORIGIN+'/',html:'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:#000}iframe{width:100%;height:100%;border:0;display:block}</style></head><body><iframe id="ff-player" title="YouTube-Videoplayer" src="'+src.replace(/&/g,'&amp;')+'" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe><script>var ffPlayer=null;function onYouTubeIframeAPIReady(){ffPlayer=new YT.Player("ff-player");}window.ffBookmark=function(token){try{var u=new URL(ffPlayer.getVideoUrl());var id=u.searchParams.get("v");var seconds=Math.floor(ffPlayer.getCurrentTime());window.ReactNativeWebView.postMessage(JSON.stringify({type:"bookmark",token:token,id:id,seconds:seconds}));}catch(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:"bookmark",token:token,error:true}));}};</script><script src="https://www.youtube.com/iframe_api"></script></body></html>'};
}
export function allowedTVNavigation(url){
 if(url==='about:blank')return true;
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
    [new URL(TV_ORIGIN).hostname,'www.youtube-nocookie.com','www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname);
 }catch{return false;}
}
