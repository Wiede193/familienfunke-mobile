// Pure, offline index for the menu. Every suggestion has a real screen or
// an explicit supported action in App.selectMenuItem, never a dead placeholder.
export const MENU_ENTRY_AREAS = Object.freeze([
 {id:'home',title:'Startseite',subtitle:'Suche, Fragen und Familienideen',keywords:'start zurück hauptseite suche frage fragen'},
 {id:'market',title:'Familienbasar',subtitle:'Alle Kinderartikel und Angebote',keywords:'flohmarkt kaufen tauschen verschenken einkaufen'},
 {id:'sell',title:'Anzeige erstellen',subtitle:'Kinderartikel sofort anbieten',keywords:'verkaufen einstellen inserieren hochladen foto inserat'},
 {id:'myListings',title:'Meine Anzeigen',subtitle:'Eigene Angebote bearbeiten und abschließen',keywords:'meine inserate eigene angebote entwurf veröffentlichen status'},
 {id:'discover',title:'Familien entdecken',subtitle:'Familien nach Region und Interessen kennenlernen',keywords:'familien finden freunde swipe tinder suchen menschen'},
 {id:'map',title:'Familienkarte',subtitle:'Spielplätze und Ausflugsziele finden',keywords:'karte spielplatz schwimmbad freizeitbad indoor ausflug ausflüge'},
 {id:'guide',title:'Wissen & Anträge',subtitle:'Hilfen, Wegweiser und Anlaufstellen',keywords:'wissen ratgeber elterngeld kindergeld kinderzuschlag amt behörde antrag formulare'}
]);
const ALIASES={
 profile:'einstellungen profil bearbeiten name hobbies hobbys avatar foto',
 contacts:'kontaktanfrage freundschaften verbindungen',
 chat:'chat nachricht schreiben unterhaltung',
 inbox:'benachrichtigung alarm nachricht neuigkeiten',
 calendar:'planer termine wochenkalender',
 savedSearches:'suche merken merkliste suchalarm suche speichern',
 events:'treffen veranstaltung veranstaltungen event treffen erstellen',
 partners:'kindergarten kita familienzentrum einrichtung',
 inclusion:'behinderung teilhabe barrierefreiheit',
 help:'hilfe anleitung bedienung support faq frage problem',
 push:'push benachrichtigung handy alarm ausschalten',
 refresh:'synchronisieren neu laden aktualisieren',
 tour:'rundgang Einführung guide tour',
 info:'elternwissen informationen',
 outing:'ausflugsplaner idee aktivitäten',
 play:'quiz spiele rätsel sudoku solitaire',
 healthy:'gesundheit sport schwimmen bewegung',
 aboutApp:'über uns wer sind wir',
 decisions:'beschluss beschlüsse gesetz gesetzesänderung',
 more:'übersicht alle funktionen'
};
const STOP=new Set(['wo','ist','sind','wie','ich','mir','die','der','das','ein','eine','den',
 'meine','meinen','mit','und','zu','kann','finde','öffnen','oeffnen','bitte','was','für','fuer']);
export const normalizeMenuText=value=>String(value||'').toLocaleLowerCase('de-DE')
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
 .replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();

export function searchMenuEntries(query,groups,limit=20){
 const normalized=normalizeMenuText(query);
 if(!normalized)return [];
 const words=normalized.split(' ').filter(w=>w.length>1&&!STOP.has(w));
 if(!words.length)return [];
 const seen=new Set();
 const all=[
   ...MENU_ENTRY_AREAS,
   ...groups.flatMap(group=>group.items.map(([id,,title,subtitle])=>({id,title,subtitle,keywords:group.title})))
 ].filter(entry=>{if(seen.has(entry.id))return false;seen.add(entry.id);return true;});
 return all.map((entry,index)=>{
   const name=normalizeMenuText(entry.title);
   const joined=normalizeMenuText([entry.title,entry.subtitle,entry.keywords,ALIASES[entry.id]||''].join(' '));
   const titleWords=name.split(' ');
   const parts=joined.split(' ');
   // All meaningful query terms must match to prevent unrelated noise.
   if(!words.every(term=>parts.some(p=>p===term||p.startsWith(term)&&term.length>=3||term.startsWith(p)&&p.length>=5)))return null;
   let score=words.reduce((acc,term)=>acc+
     (titleWords.includes(term)?10:titleWords.some(w=>w.startsWith(term))?7:
       name.includes(term)?5:parts.includes(term)?4:2),0);
   if(name===normalized)score+=30;
   else if(name.startsWith(normalized))score+=12;
   return {...entry,score,index};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit)
  .map(({score,index,...entry})=>entry);
}
