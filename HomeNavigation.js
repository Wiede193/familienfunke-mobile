// Only real, currently navigable areas are advertised. A match opens the actual screen.
export const HOME_ROUTES = [
  {id:'box',title:'Kiste mit KI erfassen',subtitle:'Mehrere Kleidungsstücke fotografieren und Pakete anbieten',words:'kiste kistenmodus paket kleidungspaket mehrere teile gruppenfoto foto erkennen scannen paketverkauf'},
  {id:'sell',title:'Artikel verkaufen',subtitle:'Einzelne Anzeige mit Foto und Beschreibung erstellen',words:'verkaufen inserieren anzeige artikel hochladen einstellen schnellverkauf'},
  {id:'market',title:'Familienbasar durchsuchen',subtitle:'Kaufen, tauschen, verschenken und Angebote finden',words:'flohmarkt basar kaufen secondhand suchen artikel finden angebot preis verschenken tauschen merkliste'},
  {id:'discover',title:'Familien in der Nähe',subtitle:'Andere Familien nach Region und Interessen kennenlernen',words:'familie familien menschen eltern finden kennenlernen kontakte tinder entdecken in der naehe'},
  {id:'map',title:'Familienkarte',subtitle:'Spielplätze und Ausflugsziele auf der Karte entdecken',words:'karte spielplatz spielplaetze ausflug ausflugsziele ort in der naehe'},
  {id:'guide',title:'Familienwegweiser',subtitle:'Dauerhafte Tipps und Ziele für Familien',words:'wegweiser ratgeber ausflug freizeit elternwissen region unternehmungen'},
  {id:'events',title:'Treffen & Veranstaltungen',subtitle:'Gemeinsame Aktivitäten finden und planen',words:'veranstaltung termin treffen event kindergeburtstag ausmachen'},
  {id:'contacts',title:'Kontakte & Nachrichten',subtitle:'Anfragen und private Gespräche verwalten',words:'chat nachricht anschreiben kontakt freundschaft einladung'},
  {id:'profile',title:'Mein Familienprofil',subtitle:'Hobbys, Fotos, Region und Sichtbarkeit anpassen',words:'profil bearbeiten hobby hobbies interessen datenschutz privatsphaere einstellen'},
  {id:'partners',title:'Kitas & Partnerwelt',subtitle:'Kindergärten, Vereine und Kita-Flohmärkte',words:'kita kindergarten einrichtung partner foerderverein verein'},
  {id:'help',title:'Hilfe & FAQ',subtitle:'Anleitungen zur Bedienung von Familienfunke',words:'hilfe fragen faq problem anleitung app funktioniert'},
  {id:'inclusion',title:'Familien & Inklusion',subtitle:'Informationen zur Teilhabe und zu geplanten Angeboten',words:'inklusion teilhabe barrierefreiheit unterstuetzung'}
];
export const HOME_PAGE_IDS = HOME_ROUTES.map(x=>x.id);
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9äöüß]+/g,' ').trim();
const STOP=new Set(['ich','du','die','der','das','und','oder','ein','eine','mit','zu','wo','wie','kann','können','mochte','moechte','möchte','finde','mir','bitte','auf','in','fur','für','ist','von','meine','meinen','was']);
export function findHomeRoutes(value){
 const terms=normalize(value).split(' ').filter(x=>x.length>=2&&!STOP.has(x));
 if(!terms.length)return HOME_ROUTES.slice(0,4);
 return HOME_ROUTES.map(route=>{
   const full=normalize(route.title+' '+route.subtitle+' '+route.words);
   const score=terms.reduce((acc,term)=>acc+(full.includes(term)?(['finden','suchen','machen','zeigen'].includes(term)?0.1:1):0),0);
   return {...route,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
}
