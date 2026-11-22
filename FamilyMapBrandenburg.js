// Erweiterter redaktioneller Brandenburg-Katalog, Quellenstand 22.11.2026.
// Koordinaten aus OpenStreetMap/Mapcarta (je nach Ort Gebäude oder Parkmitte).
// Barrierefreiheit ist mehrdimensional; dokumentierte Einzelmerkmale sind
// KEINE pauschale Zusage für alle Wege, Attraktionen und Begleitangebote.
const documented=(summary,mobility,limitations,url,sensory='Zu Sinnes- und Kommunikationsangeboten liegen keine hinreichend geprüften Angaben vor.')=>({
 status:'documented',summary,mobility,limitations,sensory,source_url:url,
 checked:'2026-11-22'
});
const unknown=(url)=>({
 status:'unknown',
 summary:'Keine hinreichend geprüften Detailangaben zur Barrierefreiheit für dieses Ziel.',
 mobility:'Stufenlose Wege, WC, Aufzüge und Parken bitte direkt beim Betreiber erfragen.',
 sensory:'Keine verifizierten Angaben zu Reizreduktion, Leichter Sprache oder Hör-/Sehhilfen.',
 limitations:'Aus fehlenden Angaben lässt sich keine fehlende Barrierefreiheit ableiten.',
 source_url:url,checked:'2026-11-22'
});
export const BRANDENBURG_FAMILY_PLACES=[
 {
  id:'bb-barnim-panorama',title:'BARNIM PANORAMA · Naturparkzentrum und Agrarmuseum',
  category:'outing',region_label:'Wandlitz · Barnim',
  address:'Breitscheidstraße 8–9, 16348 Wandlitz, Deutschland',
  latitude:52.75175,longitude:13.45515,osm_key:'osm-way-207479707',
  description:'Naturpark-Ausstellung, Landwirtschaft zum Erleben und Entdeckerpfad. Manche Außenbereiche sind nicht barrierefrei.',
  info_url:'https://www.barnim-panorama.de/seite/415755',
  accessibility:documented(
   'Ausstellung und weite Teile der Außenanlage sind zugänglich; ein nicht vollständig barrierefreier Entdeckerpfad ist separat zu beachten.',
   'Alle Themenräume mit Rollstuhl/Kinderwagen erreichbar; barrierefreies WC, zwei entsprechende Parkplätze und Leihrollstuhl laut Betreiber.',
   'Baumhaus und Teichzugänge am Entdeckerpfad nicht barrierefrei. Umfang weiterer Begleitangebote vorher erfragen.',
   'https://www.barnim-panorama.de/seite/415755',
   'Markierungen an Treppengeländern für blinde/sehbehinderte Menschen laut Betreiber; Angebote je Person erfragen.'
  )
 },
 {
  id:'bb-museumspark-ruedersdorf',title:'Museumspark Rüdersdorf',
  category:'outing',region_label:'Rüdersdorf · Märkisch-Oderland',
  address:'Heinitzstraße 41, 15562 Rüdersdorf bei Berlin, Deutschland',
  latitude:52.48015,longitude:13.7845,osm_key:'osm-way-255361048',
  description:'Industriegeschichte, Kalksteinabbau, technische Denkmäler und Freiluftgelände zum Erkunden.',
  info_url:'https://www.museumspark.de/',
  accessibility:documented(
   'Die Tourismusinformation nennt Mobilitätshilfen für einen unterstützten Museumsparkbesuch.',
   'Rollstühle und Elektromobil können laut offizieller Tourismusinformation ausgeliehen werden; Verfügbarkeit vorher erfragen.',
   'Natur- und Industrieaußengelände mit unterschiedlichen Wegführungen; einzelne Programme, Führungen und Höhenunterschiede vorab klären.',
   'https://www.reiseland-brandenburg.de/poi/seenland-oder-spree/gepruefte-touristinformationen-und-info-stellen/tourismus-information-museumspark-ruedersdorf/'
  )
 },
 {
  id:'bb-zoo-eberswalde',title:'Zoologischer Garten Eberswalde',
  category:'outing',region_label:'Eberswalde · Barnim',
  address:'Am Wasserfall 1, 16225 Eberswalde, Deutschland',
  latitude:52.82296,longitude:13.78303,
  description:'Waldzoo mit Tiergehegen, Familien-Spielplätzen und Bildungsangeboten.',
  info_url:'https://zoo.eberswalde.de/de/zoobesuch/',
  accessibility:documented(
   'Tourismus Brandenburg führt detaillierte Angaben für Menschen mit Mobilitäts- und Sinneseinschränkungen.',
   'Fünf ausgewiesene Parkplätze; Rollstühle beziehungsweise Mobilitätshilfen können laut Tourismusinformation ausgeliehen werden.',
   'Einige Gehege sind nur über Treppen erreichbar; einzelne Bodenbeläge können eingeschränkt begehbar sein. Geeignete Route vorab erfragen.',
   'https://www.reiseland-brandenburg.de/poi/barnimer-land/zoos-und-tierparke/zoologischer-garten-eberswalde/',
   'Es gibt veröffentlichte Hinweise für Sinneseinschränkungen; konkrete Angebote mit dem Zoo abstimmen.'
  )
 },
 {
  id:'bb-familiengarten-eberswalde',title:'Familiengarten Eberswalde',
  category:'outing',region_label:'Eberswalde · Barnim',
  address:'Am Alten Walzwerk 1, 16227 Eberswalde, Deutschland',
  latitude:52.84371,longitude:13.77285,osm_key:'osm-way-211875092',
  description:'Weitläufige Erlebnis- und Gartenwelt mit Märchenwald, Spielstationen und Industriedenkmalen. Saisonal; Betriebszeiten prüfen.',
  info_url:'https://www.familiengarten-eberswalde.de/',
  accessibility:unknown('https://www.familiengarten-eberswalde.de/')
 },
 {
  id:'bb-schiffshebewerk-niederfinow',title:'Schiffshebewerke Niederfinow',
  category:'outing',region_label:'Niederfinow · Barnim',
  address:'Hebewerkstraße 70a, 16248 Niederfinow, Deutschland',
  latitude:52.84913,longitude:13.94166,osm_key:'osm-way-37112270',
  description:'Historisches und neues Schiffshebewerk; technischer Familienausflug mit Besucherwegen und Ausblicken.',
  info_url:'https://schiffshebewerk-niederfinow.com/faqs-fragen-und-antworten/',
  accessibility:documented(
   'Das neue Hebewerk ist im Rahmen von Führungen zugänglich; das historische Gelände ist nicht durchgehend barrierefrei.',
   'Beim neuen Hebewerk steht bei Voranmeldung ein Lift zur Verfügung. Eine stufenlose Rampe ist lang und anstrengend.',
   'Altes Besuchergelände nicht durchgängig zugänglich; steile Betriebswege und längere Wege können Schiebehilfe erfordern. Betreiber empfiehlt bei Schwierigkeiten mit einstündigen Wegen vom Besucherweg abzusehen.',
   'https://schiffshebewerk-niederfinow.com/faqs-fragen-und-antworten/'
  )
 },
 {
  id:'bb-schloss-museum-luebben',title:'Museum Schloss Lübben',
  category:'outing',region_label:'Lübben (Spreewald) · Dahme-Spreewald',
  address:'Ernst-von-Houwald-Damm 14, 15907 Lübben (Spreewald), Deutschland',
  latitude:51.93998,longitude:13.89933,osm_key:'osm-node-2034839832',
  description:'Mitmachstationen, Stadt- und Regionalgeschichte im Schloss und wechselnde Ausstellungen.',
  info_url:'https://www.luebben.de/stadt-luebben/de/stadtleben/kultur/museum-schloss-luebben/besuch/',
  accessibility:documented(
   'Für den Museumsbesuch steht ein Aufzug zur Verfügung; nicht alle historischen Räume sind erreichbar.',
   'Aufzug im Schloss und Museumshocker laut Stadt Lübben.',
   'Wappensaal und Schlossturm nur über Treppen erreichbar. Genaue Maße des Aufzugs und der Zugänge beim Museum nachfragen.',
   'https://www.luebben.de/stadt-luebben/de/stadtleben/kultur/museum-schloss-luebben/besuch/',
   'Museum mit einzelnen Hör- und interaktiven Stationen; spezifische Sinnesangebote nicht vollständig geprüft.'
  )
 },
 {
  id:'bb-germendorf-tierpark',title:'Tier-, Freizeit- und Saurierpark Germendorf',
  category:'outing',region_label:'Germendorf · Oberhavel',
  address:'An den Waldseen 1a, 16515 Oranienburg OT Germendorf, Deutschland',
  latitude:52.74449,longitude:13.15713,osm_key:'osm-way-235197984',
  description:'Großer Tierpark, Dinosaurierwelt und Spielmöglichkeiten. Wege und Steigungen im Gelände einplanen.',
  info_url:'https://freizeitpark-germendorf.de/',
  accessibility:documented(
   'Tourismus Brandenburg hat einzelne Wege, sanitäre Anlagen und Parkplätze vor Ort erhoben.',
   'Fünf ausgewiesene Parkplätze; befestigte Hauptwege und mehrere barrierefreie Toiletten laut Betreiberangaben der Tourismusquelle.',
   'Direkt hinter dem Eingang starkes Gefälle auf etwa 50 Metern; beim Baden keine besondere Einstiegshilfe. Einzelne Bereiche nicht pauschal garantiert.',
   'https://www.reiseland-brandenburg.de/poi/ruppiner-seenland/zoos-und-tierparke/tier-freizeit-und-saurierpark-germendorf/'
  )
 },
 {
  id:'bb-spreewelten-luebbenau',title:'Spreewelten Erlebnisbad',
  category:'outing',region_label:'Lübbenau · Oberspreewald-Lausitz',
  address:'Alte Huttung 13, 03222 Lübbenau/Spreewald, Deutschland',
  latitude:51.8569,longitude:13.9527,
  description:'Erlebnisbad mit Unterwasser-Einblicken in die Pinguinwelt. Zugänge zu Becken und Umkleiden vorab erfragen.',
  info_url:'https://www.spreewelten.de/',
  accessibility:unknown('https://www.spreewelten.de/')
 }
].map(place=>({
 ...place,source:'curated',
 source_label:'Brandenburg · Redaktionell recherchiert',
 has_changing_table:false,
 last_checked:'2026-11-22'
}));
export function describePlaceAccessibility(place){
 const item=place?.accessibility;
 if(item?.status!=='documented')
   return {
     label:'Barrierefreiheit nicht geprüft',
     summary:'Für dieses Ziel liegen keine hinreichend geprüften Einzelangaben vor. Das bedeutet nicht, dass es nicht barrierefrei ist.',
     mobility:'Stufenlose Wege, barrierefreie Toiletten, Aufzüge und Parkmöglichkeiten bitte beim Anbieter erfragen.',
     sensory:'Sinnes- und Kommunikationsangebote, Begleitpersonen und Ruhebereiche erfragen.',
     limitations:'Individuelle Bedürfnisse und aktuelle Öffnungs-/Betriebsbedingungen beachten.',
     source_url:null
   };
 return {
   label:'Einzelne Zugangsmerkmale dokumentiert',
   summary:item.summary,
   mobility:item.mobility,
   sensory:item.sensory,
   limitations:item.limitations,
   source_url:item.source_url
 };
}
