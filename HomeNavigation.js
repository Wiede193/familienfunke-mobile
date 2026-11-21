// Only real, currently navigable areas are advertised. A match opens the actual screen.
export const HOME_ROUTES = [
  {id:'box',title:'Kiste mit KI erfassen',subtitle:'Mehrere Kleidungsstücke fotografieren und Pakete anbieten',words:'kiste kistenmodus paket kleidungspaket mehrere teile gruppenfoto foto erkennen scannen paketverkauf kleidung sortieren mehrere sachen flohmarktkiste'},
  {id:'sell',title:'Artikel verkaufen',subtitle:'Einzelne Anzeige mit Foto und Beschreibung erstellen',words:'verkaufen inserieren anzeige artikel hochladen einstellen schnellverkauf verkaufsanzeige annoncen neu erstellen'},
  {id:'market',title:'Familienbasar durchsuchen',subtitle:'Kaufen, tauschen, verschenken und Angebote finden',words:'flohmarkt basar kaufen secondhand suchen artikel finden angebot preis verschenken tauschen merkliste kinderwagen kinderkleidung schuhe bücher spielzeug möbel'},
  {id:'discover',title:'Familien in der Nähe',subtitle:'Andere Familien nach Region und Interessen kennenlernen',words:'familie familien menschen eltern finden kennenlernen kontakte tinder entdecken in der naehe umkreis kennenlernen vernetzen neue freunde person personen umgebung naehe nahe'},
  {id:'map',title:'Familienkarte',subtitle:'Spielplätze und Ausflugsziele auf der Karte entdecken',words:'karte spielplatz spielplaetze ausflug ausflugsziele ort in der naehe parks spielorte spielmoeglichkeiten'},
  {id:'outing',title:'Ausflugsplaner',subtitle:'Ausflug nach Budget, Altersgruppen und Entfernung planen',words:'ausflugsplaner wochenendausflug tagesausflug ausflug planen wochenende planen familienausflug planung unternehmung budget'},
  {id:'guide',title:'Familienwegweiser',subtitle:'Dauerhafte Tipps und Ziele für Familien',words:'wegweiser ratgeber ausflug freizeit elternwissen region unternehmungen'},
  {id:'calendar',title:'Mein Familienkalender',subtitle:'Private Termine, gemerkte Treffen und Ausflüge',words:'kalender familienkalender wochenplan privatausflug eigener privater termin termine planen termin eintragen'},
  {id:'events',title:'Treffen & Veranstaltungen',subtitle:'Gemeinsame Aktivitäten finden und planen',words:'veranstaltung termin treffen event kindergeburtstag ausmachen'},
  {id:'contacts',title:'Kontakte & Nachrichten',subtitle:'Anfragen und private Gespräche verwalten',words:'chat nachricht anschreiben kontakt freundschaft einladung'},
  {id:'profile',title:'Mein Familienprofil',subtitle:'Hobbys, Fotos, Region und Sichtbarkeit anpassen',words:'profil bearbeiten hobby hobbies interessen datenschutz privatsphaere einstellen passwort konto account sichtbarkeit foto einstellungen'},
  {id:'partners',title:'Kitas & Partnerwelt',subtitle:'Kindergärten, Vereine und Kita-Flohmärkte',words:'kita kindergarten einrichtung partner foerderverein verein kitaflohmarkt betreuung'},
  {id:'help',title:'Hilfe & FAQ',subtitle:'Anleitungen zur Bedienung von Familienfunke',words:'hilfe fragen faq problem anleitung app funktioniert fehler support zugang loeschen konto kuendigen'},
  {id:'chat',title:'Private Nachrichten',subtitle:'Bestehende Unterhaltungen öffnen',words:'chat chats unterhaltung unterhaltungen gespräch gespräche postfach'},
  {id:'inbox',title:'Neuigkeiten',subtitle:'Benachrichtigungen ansehen, lesen und löschen',words:'neuigkeiten benachrichtigungszentrale ungelesen hinweise benachrichtigungen löschen'},
  {id:'push',title:'Benachrichtigungseinstellungen',subtitle:'Push-Hinweise für dieses Gerät einstellen',words:'push pushnachrichten benachrichtigungseinstellungen gerätebenachrichtigungen sperrbildschirm ton deaktivieren'},
  {id:'aboutApp',title:'Über Familienfunke',subtitle:'Informationen zur App und ihrem Konzept',words:'über uns familienfunke app informationen konzept'},
  {id:'inclusion',title:'Familien & Inklusion',subtitle:'Informationen zur Teilhabe und zu geplanten Angeboten',words:'inklusion teilhabe barrierefreiheit unterstuetzung'}
];
export const HOME_PAGE_IDS = HOME_ROUTES.map(x=>x.id);
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9äöüß]+/g,' ').trim();
const STOP=new Set(['ich','du','die','der','das','und','oder','ein','eine','mit','zu','wo','wie','kann','können','mochte','moechte','möchte','finde','mir','bitte','auf','in','fur','für','ist','von','meine','meinen','was']);
// Product descriptions should open the marketplace, not the general app FAQ.
export function looksLikeMarketProductQuery(value){
 const n=normalize(value);
 // A selling intent must open the create-ad workflow, not a buyer search.
 if(/\b(verkaufen|inserieren|einstellen|anbieten|verschenken)\b/.test(n))return false;
 const product=/(jeans|hose|jacke|pullover|body|strampler|schuh|kleid|t shirt|shirt|leggings|spielzeug|kinderwagen|kindersitz|buggy|fahrrad|buch|bücher|moebel|möbel)/.test(n);
 const attribute=/(blau|rot|grun|gruen|gelb|schwarz|weiß|weiss|rosa|größe|groesse|gross|grosse|kaufen|suche|suchen|finden|preis|grosse|hundert|\b\d{2,3}\b)/.test(n);
 const standalone=/^(?:kinder|baby)?(?:jeans|hosen?|jacken?|pullover|bodys?|strampler|schuhe?|kleider?|shirts?|leggings|spielzeug|kinderwagen|kindersitz|buggy|fahrrader?|bucher?|moebel|mobel)$/.test(n);
 return product&&(attribute||standalone);
}
export function findHomeRoutes(value){
 const intent=normalize(value);
 if(/\b(kalender|familienkalender|wochenplan)\b/.test(intent))return [HOME_ROUTES.find(x=>x.id==='calendar')];
 if(/^(chat|chats|private nachrichten|unterhaltungen)$/.test(intent))return [HOME_ROUTES.find(x=>x.id==='chat')];
 if(/\b(push|pushnachrichten|benachrichtigungseinstellungen|sperrbildschirm)\b/.test(intent))return [HOME_ROUTES.find(x=>x.id==='push')];
 if(/\b(neuigkeiten|benachrichtigungszentrale|benachrichtigungen|ungelesen)\b/.test(intent))return [HOME_ROUTES.find(x=>x.id==='inbox')];
 if(looksLikeMarketProductQuery(value))return [HOME_ROUTES.find(x=>x.id==='market')];
 const terms=normalize(value).split(' ').filter(x=>x.length>=2&&!STOP.has(x));
 if(!terms.length)return HOME_ROUTES.slice(0,4);
 return HOME_ROUTES.map(route=>{
   const full=normalize(route.title+' '+route.subtitle+' '+route.words);
   const score=terms.reduce((acc,term)=>acc+(full.includes(term)?(['finden','suchen','machen','zeigen'].includes(term)?0.1:1):0),0);
   return {...route,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
}
