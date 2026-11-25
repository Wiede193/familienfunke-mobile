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
 ,
  {"id":"BK7Bv-Qknw4","title":"Vier Plätzchenrezepte mit Sally","channel":"Sallys Welt","category":"Advent & Weihnachten","description":"Vanillekipferl, Traumstücke und Waffelkekse für die Weihnachtsbäckerei.","sourceUrl":"https://www.youtube.com/watch?v=BK7Bv-Qknw4","flag":"commercial","review":"candidate"},
  {"id":"prxNFFnErJA","title":"Ein Teig, acht Weihnachtsplätzchen","channel":"Familienkost","category":"Advent & Weihnachten","description":"Aus einem Grundteig verschiedene Plätzchen mit der Familie backen.","sourceUrl":"https://www.youtube.com/watch?v=prxNFFnErJA","flag":"commercial","review":"candidate"},
  {"id":"G9YcnVZIq9k","title":"Nudelauflauf mit Gemüse","channel":"Familienkost","category":"Familienküche","description":"Ein alltagstaugliches Gericht mit Gemüse und Nudeln.","sourceUrl":"https://www.youtube.com/watch?v=G9YcnVZIq9k","flag":"commercial","review":"candidate"},
  {"id":"0j_mEEZnhhw","title":"Fünf Ideen für Brotdosen","channel":"Familienkost","category":"Ernährung in der Familie","description":"Anregungen für Schule und Kita; Zutaten altersgerecht schneiden und keine spitzen Spieße für kleine Kinder.","sourceUrl":"https://www.youtube.com/watch?v=0j_mEEZnhhw","flag":"commercial","review":"candidate"},
  {"id":"NpVI7D05UZs","title":"Skandinavisch inspiriertes Alltags-Make-up","channel":"dm-drogerie markt Deutschland","category":"Beauty & Wohlbefinden","description":"Schminktipps mit Olesja für Erwachsene; der Anbieter zeigt eigene und vertriebene Produkte.","sourceUrl":"https://www.youtube.com/watch?v=NpVI7D05UZs","flag":"commercial","review":"candidate"},
  {"id":"jh_yPLHrMCs","title":"Der Beikoststart","channel":"AOK – Willkommen Familie","category":"Ernährung in der Familie","description":"Informationen zur Einführung fester Nahrung und altersgerechten Mahlzeiten.","sourceUrl":"https://www.youtube.com/watch?v=jh_yPLHrMCs","flag":"health","review":"candidate"},
  {"id":"KtTIGWZZv3s","title":"Gemeinsam durch Schwangerschaft, Geburt und erste Kinderjahre","channel":"AOK – Willkommen Familie","category":"Schwangerschaft & Baby","description":"Vorstellung des Informationsangebots für werdende Eltern.","sourceUrl":"https://www.youtube.com/watch?v=KtTIGWZZv3s","flag":"health","review":"candidate"},
  {"id":"VFsRTWD3n-c","title":"Zucker – wo, wie viel, warum?","channel":"BZfE","category":"Ernährung in der Familie","description":"Sachwissen rund um Zucker.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"i9c58V7krkA","title":"Sprechender Mund","channel":"BZfE","category":"Ernährung in der Familie","description":"Animierter Einstieg in die Verdauung.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"gmaZcOuVCR8","title":"Sprechender Magen","channel":"BZfE","category":"Ernährung in der Familie","description":"Erklärfilm zur Funktion des Magens.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"T92rXBwwqHw","title":"Sicher schälen","channel":"BZfE","category":"Familienküche","description":"Küchentechnik für gemeinsames Lernen unter Aufsicht.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"hp5K0vd5thE","title":"Sicher raspeln","channel":"BZfE","category":"Familienküche","description":"Küchenpraxis unter Begleitung Erwachsener.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"0pugb_epqvY","title":"Der Krallengriff","channel":"BZfE","category":"Familienküche","description":"Schneidetechnik für die Küche; Kinder nur altersgerecht begleiten.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"mvhRzqw16tg","title":"Äpfel schneiden und schälen mit Sehbeeinträchtigung","channel":"BZfE","category":"Inklusion & Teilhabe","description":"Barrierearme Küchenpraxis für blinde und sehbehinderte Kinder.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"CZ6b5HvyIIY","title":"Bodypercussion","channel":"BZfE","category":"Sport & Bewegung","description":"Bewegte Pause mit Körperrhythmen.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"NP3JKnYV368","title":"Jumping Jack – bewegte Pause","channel":"BZfE","category":"Sport & Bewegung","description":"Kurzes Bewegungsangebot, bei Bedarf anpassen.","sourceUrl":"https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos","review":"candidate"},
  {"id":"Bc7wKTZMmeA","title":"Wegweiser Inklusion: selbstbestimmt leben","channel":"Aktion Mensch","category":"Inklusion & Teilhabe","description":"Orientierung zu Rechten, Unterstützung und Barrierefreiheit.","sourceUrl":"https://www.youtube.com/watch?v=Bc7wKTZMmeA","review":"candidate"},
  {"id":"ZMLuPmWdqoY","title":"Wegweiser Inklusion: das Angebot","channel":"Aktion Mensch","category":"Inklusion & Teilhabe","description":"Informationen für Menschen mit Behinderung, Angehörige und Interessierte.","sourceUrl":"https://www.youtube.com/watch?v=ZMLuPmWdqoY","review":"candidate"},
  {"id":"QHIDQtsxk5g","title":"Wie barrierefrei ist der Alltag?","channel":"ARD Kinder und Familie","category":"Inklusion & Teilhabe","description":"Eine Reportage über alltägliche Barrieren und Teilhabe.","sourceUrl":"https://www.youtube.com/watch?v=QHIDQtsxk5g","review":"candidate"},
  {"id":"ZMa0Hj4Ooj4","title":"Wie Inklusion im Alltag gelingt","channel":"NDR","category":"Inklusion & Teilhabe","description":"Einblicke in Alltag, Sport und Teilhabe.","sourceUrl":"https://www.youtube.com/watch?v=ZMa0Hj4Ooj4","review":"candidate"},
  {"id":"b4ououpEy-g","title":"Assistenz und Teilhabe","channel":"intakt.info","category":"Inklusion & Teilhabe","description":"Gespräch mit Julian Wendel über selbstbestimmte Teilhabe.","sourceUrl":"https://www.intakt.info/unser-angebot/videos/","review":"candidate"},
  {"id":"LHeZvbdTt-k","title":"Schule und Ausbildung","channel":"intakt.info","category":"Inklusion & Teilhabe","description":"Gespräch mit Julian Wendel über Bildung.","sourceUrl":"https://www.intakt.info/unser-angebot/videos/","review":"candidate"},
  {"id":"7UE4yenfSZQ","title":"Geschwisterkinder","channel":"intakt.info","category":"Inklusion & Teilhabe","description":"Gespräch über Geschwister und Familienalltag.","sourceUrl":"https://www.intakt.info/unser-angebot/videos/","review":"candidate"},
  {"id":"QgiuBsRv6zM","title":"Schule und Inklusion","channel":"intakt.info","category":"Inklusion & Teilhabe","description":"Erfahrungen einer Mutter mit Schule und Teilhabe.","sourceUrl":"https://www.intakt.info/unser-angebot/videos/","review":"candidate"},
  {"id":"w-n07rLLdn8","title":"Milan beim Judo","channel":"Hamburger Sportbund","category":"Inklusion & Teilhabe","description":"Sportporträt aus dem inklusiven Vereinssport.","sourceUrl":"https://www.hamburger-sportbund.de/themen/inklusion/70-videos-inklusion-und-sport","review":"candidate"},
  {"id":"Yb0gcwwy9Dw","title":"Anne beim Rudern – mit Gebärdensprache","channel":"Hamburger Sportbund","category":"Inklusion & Teilhabe","description":"Rudern und Kommunikation in Gebärdensprache.","sourceUrl":"https://www.hamburger-sportbund.de/themen/inklusion/70-videos-inklusion-und-sport","review":"candidate"},
  {"id":"3OZ8JfO9GUY","title":"Inklusives Klettern – mit Untertiteln","channel":"Hamburger Sportbund","category":"Inklusion & Teilhabe","description":"Gemeinsam klettern im Verein.","sourceUrl":"https://www.hamburger-sportbund.de/themen/inklusion/70-videos-inklusion-und-sport","review":"candidate"}
].map(Object.freeze));
export const TV_EXTERNAL_SOURCES=Object.freeze([
  {
    "title": "ALBAs Sportstunde",
    "channel": "ALBA Berlin",
    "category": "Sport & Bewegung",
    "url": "https://sportstunde.albaberlin.de/",
    "description": "Mitmachvideos für Kita und Grundschule. Erwachsene begleiten Kinder."
  },
  {
    "title": "Sport und Bewegung für Familien",
    "channel": "AOK Henrietta Family",
    "category": "Sport & Bewegung",
    "url": "https://www.aok.de/pk/nordost/henrietta-family/henrietta-family-bewegung/",
    "description": "Gemeinsame Bewegungsideen für Kinder und Erwachsene."
  },
  {
    "title": "Schwangerschaftsgymnastik",
    "channel": "babyclub.de",
    "category": "Schwangerschaft & Baby",
    "url": "https://www.babyclub.de/magazin/schwangerschaft/schwangerschaftsgymnastik.html",
    "description": "Hebammengeleitetes Übungsangebot; vorher individuelle Eignung klären."
  },
  {
    "title": "Sport in der Schwangerschaft – wie viel ist okay?",
    "channel": "HR / ARD",
    "category": "Schwangerschaft & Baby",
    "url": "https://www.ardmediathek.de/video/sportsfreundin-was-uns-wirklich-bewegt/sport-in-der-schwangerschaft-wieviel-ist-okay-1-mit-gebaerdensprache/hr/YzNjNDg4ODAtMzU2NS00MGI2LTk0MzItNDljZTgxY2YwZWY3L2dlYmFlcmRlbnNwcmFjaGU",
    "description": "Sportwissenschaftliche Einordnung mit Gebärdensprache."
  },
  {
    "title": "Erziehungsratgeber und Web-Coachings",
    "channel": "Familienland Bayern",
    "category": "Erziehung & Alltag",
    "url": "https://familienland.bayern.de/familienstark/best-of-web-coachings/index.php",
    "description": "Gefühle, Konflikte, Familienalltag und Medienerziehung."
  },
  {
    "title": "Weihnachtsdeko basteln",
    "channel": "KiKA",
    "category": "Advent & Weihnachten",
    "url": "https://cdn.kika.de/weihnachten/selbermachen/basteln/alle-bastelanleitungen-102",
    "description": "Sterne, Karten und Baumschmuck für gemeinsames Basteln."
  },
  {
    "title": "Schminkvideos für Erwachsene",
    "channel": "BRIGITTE",
    "category": "Beauty & Wohlbefinden",
    "url": "https://www.brigitte.de/beauty/make-up/themen/schminkvideo-10831308.html",
    "description": "Alltags- und Festtagslooks; externe redaktionelle Sammlung."
  },
  {
    "title": "Familien: Essen, Trinken und Bewegung",
    "channel": "IN FORM",
    "category": "Ernährung in der Familie",
    "url": "https://www.in-form.de/service/medienpakete/familie-alles-rund-ums-essen-trinken-und-bewegen",
    "description": "Öffentliche Medienangebote zu Ernährung und Bewegung."
  },
  {
    "title": "Filme für Eltern und Frühe Hilfen",
    "channel": "NZFH / BIÖG",
    "category": "Erziehung & Alltag",
    "url": "https://www.fruehehilfen.de/service/filme/",
    "description": "Fachliche Videos für Eltern und Beratungsangebote."
  },
  {
    "title": "Inklusiver Sport und Mitmachvideos",
    "channel": "Hamburger Sportbund",
    "category": "Inklusion & Teilhabe",
    "url": "https://www.hamburger-sportbund.de/themen/inklusion/70-videos-inklusion-und-sport",
    "description": "Sportporträts und Bewegungsideen, teilweise mit DGS oder Audiodeskription."
  },
  {
    "title": "Ernährung in der Schwangerschaft und Beikost",
    "channel": "KJF Klinik Josefinum",
    "category": "Schwangerschaft & Baby",
    "url": "https://www.josefinum.de/elternschule/nach-geburt-kurse/",
    "description": "Fachlich betreute Ernährungs-Videotutorials."
  }
].map(Object.freeze));
export const TV_CATEGORIES=Object.freeze(['Alle',...new Set([...TV_VIDEOS,...TV_EXTERNAL_SOURCES].map(v=>v.category))]);
// Broad visible categories; detailed topics stay intact for search and recommendations.
export const TV_SECTIONS=Object.freeze([
 {title:'Küche & Genuss',topics:Object.freeze(['Familienküche','Ernährung in der Familie'])},
 {title:'Familie & Wissen',topics:Object.freeze(['Erziehung & Alltag','Lesen & Lernen','Medien & Alltag','Inklusion & Teilhabe'])},
 {title:'Gesundheit & Wohlbefinden',topics:Object.freeze(['Schwangerschaft & Baby','Sport & Bewegung','Beauty & Wohlbefinden'])},
 {title:'Freizeit & Jahreszeiten',topics:Object.freeze(['Advent & Weihnachten','Ausflüge & Freizeit','Kreativwerkstatt'])}
].map(Object.freeze));
export const TV_BROWSE_CATEGORIES=Object.freeze(['Alle',...TV_SECTIONS.map(s=>s.title)]);
export function tvTopicInSection(topic,category){
 return category==='Alle'||topic===category||TV_SECTIONS.some(s=>s.title===category&&s.topics.includes(topic));
}
export function seasonalTVVideos(catalog=TV_VIDEOS,now=new Date()){return [10,11].includes(now.getMonth())?catalog.filter(v=>v.category==='Advent & Weihnachten'):[];}
export function isVideoId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);}
export function tvWatchUrl(id){
 if(!isVideoId(id))throw new Error('Ungültige Video-ID');
 return 'https://www.youtube.com/watch?v='+id;
}
export function filterTVVideos(category='Alle',query='',catalog=TV_VIDEOS){
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-DE');
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return catalog.filter(v=>tvTopicInSection(v.category,category)&&words.every(w=>normalize([v.title,v.channel,v.category,v.description].join(' ')).includes(w)));
}
// Capture the displayed order at activation, never loop or auto-select external recommendations.
export function tvQueue(videos,id,autoplay=false){
 const index=videos.findIndex(v=>v.id===id);
 if(index<0)return [];
 const remaining=autoplay===true?videos.slice(index):videos.slice(index,index+1);
 return [...new Set(remaining.map(v=>v.id).filter(isVideoId))].slice(0,31);
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
