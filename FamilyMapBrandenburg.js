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
 },
 {
  id:'bb-ziegeleipark-mildenberg',title:'Ziegeleipark Mildenberg',
  category:'outing',region_label:'Zehdenick · Oberhavel',
  address:'Ziegelei 10, 16792 Zehdenick OT Mildenberg, Deutschland',
  latitude:53.03667157,longitude:13.30444336,
  description:'Industrie- und Erlebnismuseum mit Ziegeleibahn, Mitmachangeboten, Abenteuerspielplatz und Außengelände. Saison und Führungen vorab prüfen.',
  info_url:'https://www.ziegeleipark.de/',
  accessibility:documented('Der Betreiber dokumentiert zahlreiche, aber nicht flächendeckende Zugangsmerkmale einschließlich barrierefreiem Besucherzentrum und WC.','Rampe zum Besucherzentrum, drei ausgewiesene Parkplätze und Ausleihe von Mobilitätshilfen laut Betreiber. Verschiedene Bahnfahrten nach vorheriger Rücksprache möglich.','Historisches Gelände mit unebenen Wegen, Gleisen und Treppen; Obergeschoss nur per Treppe erreichbar. Nicht jeder E-Rollstuhl passt in die Bahn.','https://www.ziegeleipark.de/barrierefreiheit','Teilweise tastbare Objekte und Brailleschrift am Geländemodell; keine durchgehende Blindenleitung oder Induktionsschleife laut Betreiber.')
 },
 {
  id:'bb-naturtherme-templin',title:'NaturThermeTemplin',
  category:'outing',region_label:'Templin · Uckermark',
  address:'Dargersdorfer Straße 121, 17268 Templin, Deutschland',
  latitude:53.10269506,longitude:13.52539301,
  description:'Familienbad mit Wellenbecken, Rutschen und warmem Thermalwasser. Eintritts- und Zugangsregeln für einzelne Becken vorher prüfen.',
  info_url:'https://www.naturthermetemplin.de/',
  accessibility:unknown('https://www.naturthermetemplin.de/')
 },
 {
  id:'bb-biosphaere-potsdam',title:'Biosphäre Potsdam',
  category:'outing',region_label:'Potsdam · kreisfreie Stadt',
  address:'Georg-Hermann-Allee 99, 14469 Potsdam, Deutschland',
  latitude:52.418837,longitude:13.049441,
  description:'Tropische Naturerlebniswelt mit Pflanzen, Tieren und Lernangeboten; für Familien auch bei schlechtem Wetter geeignet.',
  info_url:'https://www.biosphaere-potsdam.de/',
  accessibility:unknown('https://www.biosphaere-potsdam.de/')
 },
 {
  id:'bb-baumkronenpfad-beelitz',title:'Baumkronenpfad Beelitz-Heilstätten',
  category:'outing',region_label:'Beelitz · Potsdam-Mittelmark',
  address:'Straße nach Fichtenwalde 13, 14547 Beelitz-Heilstätten, Deutschland (keine Navigationsadresse)',
  latitude:52.26824384,longitude:12.91524763,
  description:'Baumkronenpfad und Aussichtsturm im historischen Heilstättengelände. Standortmarkierung ist im Besucher-/Parkbereich; Anreisebeschilderung beachten.',
  info_url:'https://baumundzeit.de/',
  accessibility:documented('Der Baumkronenpfad und seine Aussichtsplattform sind laut Betreiber per Aufzug erreichbar.','Stufenloser Eingang und Aufzug zum etwa 700 Meter langen Pfad; ebene Bohlen, Steigungen unter sechs Prozent, Sitzgelegenheiten und ausgewiesene Parkplätze.','Nicht alle Gebäudeführungen barrierefrei; historische Waldwege teilweise mit Rindenmulch, Schiebehilfe möglicherweise erforderlich.','https://baumundzeit.de/barrierefreiheit/','Nach Betreiberangabe derzeit keine ausgebildeten Gebärdensprach-Guides; individuelle Kommunikationsmöglichkeiten vorher abklären.')
 },
 {
  id:'bb-optikpark-rathenow',title:'Optikpark Rathenow',
  category:'outing',region_label:'Rathenow · Havelland',
  address:'Schwedendamm 9, 14712 Rathenow, Deutschland',
  latitude:52.605889,longitude:12.326657,
  description:'Saisonal geöffneter Themenpark rund um Farben, Optik und Bewegung auf der Havelinsel. Saison, Veranstaltungen und Eintritt beachten.',
  info_url:'https://optikpark-rathenow.de/',
  accessibility:unknown('https://optikpark-rathenow.de/')
 },
 {
  id:'bb-tierpark-cottbus',title:'Tierpark Cottbus',
  category:'outing',region_label:'Cottbus / Chóśebuz · kreisfreie Stadt',
  address:'Kiekebuscher Straße 5, 03042 Cottbus, Deutschland',
  latitude:51.74317,longitude:14.35034,
  description:'Zoologischer Garten mit heimischen und exotischen Tierarten und Familienwegen. Tierfütterungen und Sonderprogramme aktuell prüfen.',
  info_url:'https://www.tierparkcottbus.de/',
  accessibility:unknown('https://www.tierparkcottbus.de/')
 },
 {
  id:'bb-besucherbergwerk-f60',title:'Besucherbergwerk F60',
  category:'outing',region_label:'Lichterfeld · Elbe-Elster',
  address:'Bergheider Straße 4, 03238 Lichterfeld, Deutschland',
  latitude:51.58632,longitude:13.7773,
  description:'Technikdenkmal und Besucherbergwerk an der ehemaligen Abraumförderbrücke. Führungen und altersabhängige bzw. körperliche Teilnahmebedingungen vorher prüfen.',
  info_url:'https://www.f60.de/',
  accessibility:unknown('https://www.f60.de/')
 },
 {
  id:'bb-kreismuseum-oranienburg',title:'Kreismuseum Oranienburg',
  category:'outing',region_label:'Oranienburg · Oberhavel',
  address:'Schloßplatz 1, 16515 Oranienburg, Deutschland',
  latitude:52.75489264,longitude:13.23709846,
  description:'Museum im Schloss Oranienburg zur Regionalgeschichte, Kunst und Technik; Führungen für verschiedene Altersgruppen.',
  info_url:'https://www.oberhavel.de/Freizeit-und-Tourismus/Kultur/Kreismuseum/',
  accessibility:unknown('https://www.oberhavel.de/Freizeit-und-Tourismus/Kultur/Kreismuseum/')
 },
 {
  id:'bb-schloss-doberlug-erlebnisreich',title:'erlebnisREICH Naturpark im Schloss Doberlug',
  category:'outing',region_label:'Doberlug-Kirchhain · Elbe-Elster',
  address:'Schlossplatz 1, 03253 Doberlug-Kirchhain, Deutschland',
  latitude:51.6101232,longitude:13.5456605,
  description:'Interaktive Naturpark-Ausstellung mit Bewegungsangeboten im Außenbereich des Schlosses, zum Lernen und Spielen.',
  info_url:'https://www.natur-brandenburg.de/themen/sehenswertes/besucherinformationszentrum-erlebnisreich-naturpark/',
  accessibility:unknown('https://www.natur-brandenburg.de/themen/sehenswertes/besucherinformationszentrum-erlebnisreich-naturpark/')
 },
 {
  id:'bb-sielmann-forum-gross-schauen',title:'Sielmann-Forum „Eintauchen und Abheben“',
  category:'outing',region_label:'Groß Schauen · Oder-Spree',
  address:'Groß Schauener Hauptstraße 31, 15859 Storkow OT Groß Schauen, Deutschland',
  latitude:52.23586869,longitude:13.8858068,
  description:'Interaktive Ausstellung über Wasser, Luft und Ufer mit Tasten und Ausprobieren, dazu ein Naturlehrpfad. Ausstellung und Außenweg getrennt betrachten.',
  info_url:'https://www.natur-brandenburg.de/themen/ausflugsziele-erlebnisse/eintauchen-und-abheben/',
  accessibility:unknown('https://www.natur-brandenburg.de/themen/ausflugsziele-erlebnisse/eintauchen-und-abheben/')
 },
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
