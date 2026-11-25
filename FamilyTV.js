// Curated, local catalogue; never accepts arbitrary user HTML or video URLs.
export const TV_ORIGIN='https://de.familienfunke.app';
export const TV_PRIVACY_URL='https://policies.google.com/privacy?hl=de';
export const TV_VIDEOS=Object.freeze([
  {id:'ILIB9YOE1DM',title:'Vorlesen schafft Chancen: Sally',channel:'Stiftung Lesen',category:'Lesen & Lernen',description:'Warum gemeinsames Vorlesen im Familienalltag einen Unterschied macht.'},
  {id:'VCHXgpOdfd4',title:'Gefahren und Risiken im Internet – Tipps für Eltern',channel:'#DigitaleVorbilder',category:'Medien & Alltag',description:'Impulse für gemeinsame Regeln und einen sicheren Umgang mit digitalen Medien.'},
  {id:'JQsHa6bf-xE',title:'Medien sicher nutzen – Eltern begleiten ihre Kinder',channel:'klicksafe',category:'Medien & Alltag',description:'Webseminar mit Tipps zur Medienerziehung und zu technischen Schutzmöglichkeiten.'}
].map(Object.freeze));
export const TV_CATEGORIES=Object.freeze(['Alle',...new Set(TV_VIDEOS.map(v=>v.category))]);
export function isVideoId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);}
export function tvWatchUrl(id){
 if(!isVideoId(id))throw new Error('Ungültige Video-ID');
 return 'https://www.youtube.com/watch?v='+id;
}
export function tvEmbedSource(id){
 if(!isVideoId(id))throw new Error('Ungültige Video-ID');
 const src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&playsinline=1&controls=1&fs=1&rel=0&hl=de';
 // baseUrl supplies the app identifier as HTTP Referer, as required by YouTube.
 return {baseUrl:TV_ORIGIN+'/',html:'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:#000}iframe{width:100%;height:100%;border:0;display:block}</style></head><body><iframe title="YouTube-Videoplayer" src="'+src.replace(/&/g,'&amp;')+'" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></body></html>'};
}
export function allowedTVNavigation(url){
 if(url==='about:blank')return true;
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
    [new URL(TV_ORIGIN).hostname,'www.youtube-nocookie.com','www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname);
 }catch{return false;}
}
