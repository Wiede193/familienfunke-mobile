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
// Recherche-Kategorien dienen der Auswahl, sind keine zugesagte Ausstattung.
export const BRANDENBURG_FAMILY_FOCUS=[
 {id:'all',label:'Alle'},
 {id:'water',label:'Thermen & Bäder'},
 {id:'indoor',label:'Indoor spielen'},
 {id:'food-play',label:'Essen & Spielen'},
 {id:'nature',label:'Natur & Tiere'},
 {id:'discovery',label:'Entdecken'}
];
const focusById={
 'bb-spreewelten-luebbenau':'water','bb-naturtherme-templin':'water',
 'bb-barnim-panorama':'discovery','bb-museumspark-ruedersdorf':'discovery',
 'bb-schiffshebewerk-niederfinow':'discovery','bb-ziegeleipark-mildenberg':'discovery',
 'bb-besucherbergwerk-f60':'discovery','bb-kreismuseum-oranienburg':'discovery',
 'bb-schloss-museum-luebben':'discovery','bb-schloss-doberlug-erlebnisreich':'discovery',
 'bb-biosphaere-potsdam':'discovery','bb-optikpark-rathenow':'discovery',
 'bb-sielmann-forum-gross-schauen':'discovery',
 'bb-schweizer-haus-buckow':'nature','bb-stobbi-wanderroute-buckow':'nature',
 'bb-naturparkzentrum-hoher-flaeming':'nature','bb-naturparkhaus-stechlin':'nature',
 'bb-wildpark-schorfheide':'nature','bb-wildpark-johannismuehle':'nature',
 'bb-naturschutzzentrum-krugpark':'nature','bb-baumkronenpfad-beelitz':'nature',
 'bb-tierpark-cottbus':'nature','bb-zoo-eberswalde':'nature',
 'bb-familiengarten-eberswalde':'nature','bb-germendorf-tierpark':'nature'
};

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

 // 23.11.2026: offizielle Naturpark-/Kommunalquellen, insbesondere inklusive Naturerlebnisse.
 {
  id:'bb-schweizer-haus-buckow',title:'Schweizer Haus · Naturpark Märkische Schweiz',
  category:'outing',region_label:'Buckow · Märkisch-Oderland',
  address:'Lindenstraße 33, 15377 Buckow (Märkische Schweiz), Deutschland',
  latitude:52.5742113,longitude:14.084434,
  description:'Familienfreundliche, interaktive Ausstellung „Expedition Märkische Schweiz“ mit Naturgarten, Forscheranregungen und Informationen zu den Wanderwegen.',
  info_url:'https://www.maerkische-schweiz-naturpark.de/themen/naturpark-maerkische-schweiz/besucherzentrum-schweizer-haus/',
  accessibility:documented(
   'Naturparkverwaltung bestätigt stufenlosen Nebeneingang sowie eine mit Rollstuhl und Rollator nutzbare Ausstellung und Toilette.',
   'Barrierefreier Parkplatz, stufenloser seitlicher Terrassenzugang, Rollstuhlnutzung von Ausstellung und WC laut Naturparkverwaltung.',
   'Die Angaben gelten für Besucherzentrum und Toilette, nicht automatisch für steile Naturparkwege oder das gesamte Außengelände.',
   'https://www.maerkische-schweiz-naturpark.de/naturpark-maerkische-schweiz/besucherzentrum-schweizer-haus/anreise-oeffnungszeiten/',
   'Die Tourismusinformation nennt barrierefreie Sprache in der Ausstellung; konkrete Hör- und Sehhilfen vorher klären.'
  ),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-stobbi-wanderroute-buckow',title:'„Abenteuer mit Stobbi“ · Naturerlebnispfad',
  category:'outing',region_label:'Buckow · Märkisch-Oderland',
  address:'Start am Schweizer Haus, Lindenstraße 33, 15377 Buckow, Deutschland',
  latitude:52.5742113,longitude:14.084434,
  description:'Rund drei Kilometer langer Naturerlebnispfad mit Entdeckerstationen, Stempel- und Rätselheft. Für Familien mit Kinderwagen und Menschen mit kognitiven Beeinträchtigungen konzipiert.',
  info_url:'https://www.maerkische-schweiz-naturpark.de/themen/routen-touren/abenteuer-mit-stobbi/',
  accessibility:documented(
   'Der Naturpark beschreibt eine familienorientierte, barrierearme Erlebnisroute mit intuitiven Stationen und verständlichem Begleitheft.',
   'Engmaschige Beschilderung und Wegverbesserungen; Weg wurde auch für Nutzung mit Kinderwagen entwickelt.',
   'Die Route liegt in der Natur: Steigungen, Wetter, Bodenbeschaffenheit und tatsächliche Rollstuhl-Eignung individuell prüfen. Barrierearm ist nicht gleich umfassend rollstuhlgerecht.',
   'https://www.maerkische-schweiz-naturpark.de/themen/routen-touren/abenteuer-mit-stobbi/',
   'Leicht verständliches Begleitheft und intuitiv gestaltete Erlebnisstationen laut Naturpark.'
  ),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-naturparkzentrum-hoher-flaeming',title:'Naturparkzentrum Hoher Fläming',
  category:'outing',region_label:'Raben · Potsdam-Mittelmark',
  address:'Brennereiweg 45, 14823 Rabenstein/Fläming OT Raben, Deutschland',
  latitude:52.0413599,longitude:12.5779751,
  description:'Naturpark-Erlebnisausstellung, Garten der Sinne und Abenteuerspielplatz an der Alten Brennerei. Hinweise zu Veranstaltungen und Anfahrt beim Naturpark einholen.',
  info_url:'https://www.hoher-flaeming-naturpark.de/erleben-lernen/info-ausstellung/naturparkzentrum-hoher-flaeming-am-fuss-der-burg-rabenstein/',
  accessibility:documented(
   'Die brandenburgische Naturparkverwaltung bezeichnet das Naturparkzentrum selbst als barrierefrei.',
   'Barrierefreies Besucherinformationszentrum laut Naturparkverwaltung; individuelle Hilfsmittel-Nutzung vorab erfragen.',
   'Außenliegender Garten, Spielplatz und Wanderwege sind damit nicht automatisch vollständig zugänglich; WC und Details separat beim Betreiber bestätigen.',
   'https://www.hoher-flaeming-naturpark.de/erleben-lernen/info-ausstellung/naturparkzentrum-hoher-flaeming-am-fuss-der-burg-rabenstein/'
  ),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-naturparkhaus-stechlin',title:'NaturParkHaus Stechlin',
  category:'outing',region_label:'Menz · Oberhavel',
  address:'Kirchstraße 4, 16775 Stechlin OT Menz, Deutschland',
  latitude:53.1033102,longitude:13.0501753,
  description:'Mitmach-Ausstellung zu Wald, Seen und Mooren sowie Sinnesgarten, heimische Fische im Aquarium und Fußtastpfad.',
  info_url:'https://www.stechlin-ruppiner-land-naturpark.de/themen/ausflugsziele-erlebnisse/naturparkhaus-stechlin/',
  accessibility:documented(
   'Museumsverband Brandenburg beschreibt die Räume des NaturParkHauses als barrierefrei; Außenelemente separat beurteilen.',
   'Innenräume laut Museumsverband barrierefrei ausgestattet; genaue Türbreiten, WC und Begleitung beim Betreiber klären.',
   'Sinnesgarten, Fußtastpfad und Wanderwege können trotz zugänglicher Innenräume individuelle Barrieren aufweisen.',
   'https://www.museen-brandenburg.de/museen/nach-themen/naturkundemuseen/naturparkhaus',
   'Sinnesgarten, Aquarium und Fußtastpfad werden offiziell genannt; nicht jedes Angebot ist für jeden Bedarf geeignet.'
  ),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-wildpark-schorfheide',title:'Wildpark Schorfheide',
  category:'outing',region_label:'Groß Schönebeck · Barnim',
  address:'Prenzlauer Straße 16, 16244 Schorfheide OT Groß Schönebeck, Deutschland',
  latitude:52.91988,longitude:13.55816,
  description:'Großzügiger Wildpark mit ursprünglichen Wild- und Haustierrassen, Streichelbereich und großem Spielplatz. Naturwege und längere Strecken einplanen.',
  info_url:'https://www.gemeinde-schorfheide.de/startseite/wirtschaft-tourismus/freizeit-tourismus/wildpark-schorfheide',
  accessibility:documented(
   'Die Gemeinde beschreibt den Wildpark als zugänglich mit Rollstuhl über naturbelassene Wege und nennt ein Behinderten-WC.',
   'Alle Tiergehege laut Gemeinde über naturbelassene Wege mit Rollstuhl erreichbar; Behinderten-WC und Wickelraum genannt.',
   'Naturbelassene Wege können witterungsbedingt uneben oder beschwerlich sein; individuelle Mobilitätshilfen und die langen Strecken vorab prüfen.',
   'https://www.gemeinde-schorfheide.de/startseite/wirtschaft-tourismus/freizeit-tourismus/wildpark-schorfheide'
  ),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-wildpark-johannismuehle',title:'Wildpark Johannismühle',
  category:'outing',region_label:'Baruth/Mark · Teltow-Fläming',
  address:'Johannismühle 2, 15837 Baruth/Mark OT Klasdorf, Deutschland',
  latitude:52.017222,longitude:13.532222,
  description:'Wald-Wildpark mit heimischen Tieren, Tierfütterungen und Natur-Lernangeboten. Saison, Ruhetage und Teilnahmebedingungen vor der Fahrt prüfen.',
  info_url:'https://www.wildpark-johannismuehle.de/besuch-planen/',
  accessibility:unknown('https://www.wildpark-johannismuehle.de/besuch-planen/'),
  last_checked:'2026-11-23'
 },
 {
  id:'bb-naturschutzzentrum-krugpark',title:'Naturschutzzentrum Krugpark',
  category:'outing',region_label:'Brandenburg an der Havel · kreisfreie Stadt',
  address:'Ziesarer Landstraße 6P, 14776 Brandenburg an der Havel, Deutschland',
  latitude:52.37353,longitude:12.50929,
  description:'Waldschule, Naturbeobachtungen, Lernpfade, Tastangebote und Spielplatz. Gruppenprogramme gegebenenfalls nur mit vorheriger Anmeldung.',
  info_url:'https://www.stadt-brandenburg.de/leben/umwelt-und-naturschutz/krugpark',
  accessibility:documented(
   'Offizieller Tourismusführer nennt einen auch für Menschen mit Behinderung geeigneten Tastpfad; keine pauschale Wegefreigabe.',
   'Einzelangebot Tastpfad ausdrücklich als geeignet beschrieben; die Rollstuhlzugänglichkeit aller Pfade und Sanitäranlagen ist nicht ausreichend belegt.',
   'Waldwege, Untergrund und Waldschulangebote sind individuell zu prüfen. Nicht aus dem Tastpfad auf vollständige Barrierefreiheit schließen.',
   'https://www.reiseland-brandenburg.de/poi/havelland/besucherzentren/naturschutzzentrum-krugpark/',
   'Tastpfad und Naturstationen bieten multisensorische Naturerfahrung; unterstützende Begleitung gegebenenfalls erfragen.'
  ),
  last_checked:'2026-11-23'
 },

 // 23.11.2026: familiengeeignete Bad-/Indoor-Angebote und dokumentierte Gaststätte mit Spielplatz.
 {
  id:'bb-schwapp-fuerstenwalde',title:'schwapp · Schwimm- und Wasserparadies',
  category:'outing',region_label:'Fürstenwalde/Spree · Oder-Spree',
  address:'Große Freizeit 1, 15517 Fürstenwalde/Spree, Deutschland',
  latitude:52.37448,longitude:14.07469,osm_key:'osm-way-96378687',
  description:'Erlebnisbad mit mehreren großen Rutschen, Kinder- und Nichtschwimmerbecken sowie separatem Sportbad. Rutschen-Altersvorgaben, aktuelle Badezeiten und Ticketpreise vorab kontrollieren.',
  info_url:'https://www.schwapp.de/',
  accessibility:unknown('https://sportstaetten.brandenburg.de/hallenbaeder/schwimm-und-wasserparadies-schwapp~9zy'),
  family_focus:'water',last_checked:'2026-11-23'
 },
 {
  id:'bb-duellarena-scharmuetzelbob',title:'Duellarena · Scharmützel-Bob',
  category:'outing',region_label:'Bad Saarow-Petersdorf · Oder-Spree',
  address:'Am Fuchsbau 7, 15526 Bad Saarow OT Petersdorf, Deutschland',
  latitude:52.3275,longitude:14.06947,
  description:'Indoorspiel- und Geschicklichkeitshalle mit Kletterparcours, Bumper-Cars, Fußballkäfig und interaktiven Spielstationen; Rodelbahn draußen ist gesondert wetterabhängig.',
  info_url:'https://www.scharmuetzelbob.de/attraktionen/duellarena/',
  accessibility:unknown('https://www.scharmuetzelbob.de/attraktionen/duellarena/'),
  family_focus:'indoor',last_checked:'2026-11-23'
 },
 {
  id:'bb-mykidsland-frankfurt',title:'MYKIDSLAND · Indoorspielplatz',
  category:'outing',region_label:'Frankfurt (Oder) · kreisfreie Stadt',
  address:'Böttnerstraße 4, 15232 Frankfurt (Oder), Deutschland',
  latitude:52.320141,longitude:14.537761,
  description:'Indoorspielplatz für Familien und Kindergeburtstage. Betreiber empfiehlt die Buchung einer Spielzeit zur Einlasssicherung. Die Kartenmarkierung liegt näherungsweise an der Böttnerstraße.',
  info_url:'https://mykidsland.de/',
  accessibility:unknown('https://mykidsland.de/kontakt-anfahrt/'),
  family_focus:'indoor',last_checked:'2026-11-23'
 },
 {
  id:'bb-fitolino-eberswalde',title:'Fitolino · Indoor-Kinderspielwelt',
  category:'outing',region_label:'Eberswalde · Barnim',
  address:'Coppistraße 1g, 16227 Eberswalde, Deutschland',
  latitude:52.84385,longitude:13.76623,osm_key:'osm-node-6834343663',
  description:'Indoor-Spielwelt mit Kletter- und Bewegungselementen im Fit-&-Fun-Umfeld. Für Kinder ohne Begleitung gelten besondere Einwilligungsbedingungen; Ferienzeiten und Preise prüfen.',
  info_url:'https://fitolino.de/preise-oeffnungszeiten/',
  accessibility:unknown('https://fitolino.de/kontakt/'),
  family_focus:'indoor',last_checked:'2026-11-23'
 },
 {
  id:'bb-saarowtherme',title:'SaarowTherme · Thermalbad',
  category:'outing',region_label:'Bad Saarow · Oder-Spree',
  address:'Am Kurpark 1, 15526 Bad Saarow, Deutschland',
  latitude:52.29101,longitude:14.06,osm_key:'osm-way-94113554',
  description:'Thermalsolebad mit Entspannung und Schwimmkurs-Angeboten. Achtung: Freitags und samstags ist der Zutritt nach Betreiberangabe ab 16 Jahren gestattet. Für Familien mit jüngeren Kindern nur an zugelassenen Tagen passend.',
  info_url:'https://www.saarowtherme.de/besucherinformation',
  accessibility:unknown('https://www.saarowtherme.de/besucherinformation'),
  family_focus:'water',last_checked:'2026-11-23'
 },
 {
  id:'bb-turm-erlebniscity-oranienburg',title:'TURM ErlebnisCity · Sport- und Erlebnisbad',
  category:'outing',region_label:'Oranienburg · Oberhavel',
  address:'André-Pican-Straße 42, 16515 Oranienburg, Deutschland',
  latitude:52.74991,longitude:13.2577,osm_key:'osm-way-212712437',
  description:'Sport- und Familien-Erlebnisbad mit Becken, Rutschen und Kindergeburtstagsangeboten. Kosten, Kurszeiten und Zugänglichkeit einzelner Wasserattraktionen prüfen.',
  info_url:'https://www.erlebniscity.de/sport-und-erlebnisbad',
  accessibility:unknown('https://www.erlebniscity.de/service/kontakt-und-anfahrt'),
  family_focus:'water',last_checked:'2026-11-23'
 },
 {
  id:'bb-bistro-kobel-wildpark',title:'Wildparkbistro „Kobel“ · Terrasse am Spielplatz',
  category:'outing',region_label:'Frankfurt (Oder) · kreisfreie Stadt',
  address:'Im Wildpark, Am Wildpark 1, 15234 Frankfurt (Oder), Deutschland (Markierung im Wildparkbereich)',
  latitude:52.35099,longitude:14.46594,
  description:'Bistro mit Innenplätzen und Terrasse direkt neben dem Spielplatz im Wildpark Frankfurt (Oder). Der Spielplatz liegt außerhalb des Gastraums; Bistro- und Parköffnungszeiten getrennt prüfen.',
  info_url:'https://wildpark-frankfurt-oder.de/index.php/de/wildparkgastronomie-kobel',
  accessibility:unknown('https://wildpark-frankfurt-oder.de/index.php/de/wildparkgastronomie-kobel'),
  family_focus:'food-play',last_checked:'2026-11-23'
 },

 // 23.11.2026: geprüfte Betreiberangaben; Anfahrtspunkte teilweise nähere Georeferenz.
 {
  id:'bb-inselbad-eisenhuettenstadt',title:'Inselbad Eisenhüttenstadt',
  category:'outing',region_label:'Eisenhüttenstadt · Oder-Spree',
  address:'Insel 4, 15890 Eisenhüttenstadt, Deutschland',
  latitude:52.138146,longitude:14.638739,
  description:'Familienbad mit Lagunenpool, separatem Kleinkinderbecken, Rutschen, Nichtschwimmerbereich und Sportbecken. Ferienzeiten und Nutzbarkeit einzelner Bereiche aktuell beim Betreiber prüfen.',
  info_url:'https://freizeit-ehst.de/inselbad/preise-oeffnungszeiten/',
  accessibility:documented(
   'Das brandenburgische Sportstättenverzeichnis dokumentiert Zugangs- und Nutzungsmerkmale des Inselbads; Datensatz zuletzt 2024 aktualisiert.',
   'Laut Sportstättenverzeichnis barrierefreier Zugang, Nutzung für Aktive und Zuschauende sowie barrierefreie Sanitäranlagen.',
   'Die Angaben sind nicht gleichbedeutend mit gesichertem Poollift, barrierefreier Wasserrutsche oder Begleitung bei jedem Angebot. Betreiber zu benötigten Hilfen befragen.',
   'https://sportstaetten.brandenburg.de/hallenbaeder/inselbad-eisenhuttenstadt~cme',
   'Das amtliche Verzeichnis nennt ein Leitsystem für hör- und sehgeschädigte Personen; konkretes Angebot vorher bestätigen lassen.'
  ),
  family_focus:'water',last_checked:'2026-11-23',
  coordinate_note:'Adressgeokodierung am Inselbad; Eingang und einzelne Becken liegen möglicherweise versetzt.'
 },
 {
  id:'bb-hallenbad-frankfurt-rathenaustr',title:'Hallenbad Frankfurt (Oder) · Rathenaustraße',
  category:'outing',region_label:'Frankfurt (Oder) · kreisfreie Stadt',
  address:'Rathenaustraße 5, 15234 Frankfurt (Oder), Deutschland',
  latitude:52.348508,longitude:14.515214,
  description:'Kommunale Schwimmhalle mit öffentlichen Schwimmzeiten und Schwimmlernangeboten. Nach früheren technischen Schließungen weist die Stadt 2026 wieder Schwimmkurse ab Januar 2027 aus. Öffentliche Badezeiten und nutzbare Becken ausdrücklich vor einem Besuch erfragen.',
  info_url:'https://www.frankfurt-oder.de/Verwaltung-Stadtpolitik/Verwaltung/%C3%84mterverzeichnis/Hallenbad.php?FID=2616.465.1&ModID=9',
  accessibility:unknown('https://sportstaetten.brandenburg.de/hallenbaeder/hallenbad-rathenaustrasse~gb7'),
  family_focus:'water',last_checked:'2026-11-23',
  visit_warning:'Wegen älterer Schließungsmeldungen keine generelle Öffnung oder vollständige Beckennutzung zugesagt.'
 },
 {
  id:'bb-hollandpark-indoor-panketal',title:'Holland-Park · Indoor-Spiel- und Kletterhalle',
  category:'outing',region_label:'Panketal/Schwanebeck · Barnim',
  address:'Dorfstraße 30, 16341 Panketal OT Schwanebeck, Deutschland',
  latitude:52.62089,longitude:13.54519,osm_key:'osm-way-1019990289',
  description:'Große Indoorspielhalle mit Kletter- und Bewegungsbereichen im Holland-Park. Der Park betreibt zusätzlich Gastronomie und Spielplätze im Freien. Welche Angebote in welchem Ticket enthalten sind, vorab prüfen.',
  info_url:'https://www.hollandpark.de/erlebnis-/indoor/spielhalle',
  accessibility:unknown('https://www.hollandpark.de/erlebnis-/indoor/spielhalle'),
  family_focus:'indoor',last_checked:'2026-11-23'
 },
 {
  id:'bb-haberland-indoor-luckau',title:'haberLAND · Indoorspielplatz',
  category:'outing',region_label:'Luckau · Dahme-Spreewald',
  address:'Nonnengasse 2, 15926 Luckau, Deutschland',
  latitude:51.85389,longitude:13.716643,
  description:'Indoorspielplatz mit Kletter-, Bewegungs- und Spielangeboten; laut Stadt Luckau auch an Wochenenden und in Ferien geöffnet. Zeitfenster, Altersregeln und Ferienöffnungszeiten vorher nachsehen.',
  info_url:'https://luckau.de/de/kultur-stadtleben/freizeitangebote/indoorspielplatz.html',
  accessibility:unknown('https://luckau.de/de/kultur-stadtleben/freizeitangebote/indoorspielplatz.html'),
  family_focus:'indoor',last_checked:'2026-11-23',
  coordinate_note:'Adressgeokodierung Nonnengasse 2; Gebäudeeingang bitte anhand der Betreiberangaben wählen.'
 },
 {
  id:'bb-landhaus-treptow-spielplatz',title:'Landhaus Treptow · Restaurant mit Spielplatz und Streichelzoo',
  category:'outing',region_label:'Letschin · Märkisch-Oderland',
  address:'Karl-Marx-Straße 6, 15324 Letschin, Deutschland',
  latitude:52.64524,longitude:14.35974,
  description:'Gasthaus mit regionaler Küche, Außenspielplatz und Streichelzoo. Der Betreiber beschreibt eine direkte Sichtverbindung zwischen Familien-Terrasse und Spielbereich; Öffnung, Tierkontaktregeln und Barrieren bitte vorher klären.',
  info_url:'https://landhaus-treptow.de/',
  accessibility:unknown('https://landhaus-treptow.de/'),
  family_focus:'food-play',last_checked:'2026-11-23',
  coordinate_note:'Kartenpunkt liegt am direkt benachbarten Haus Karl-Marx-Straße 5; nicht als exakter Eingang verwenden.',
  play_area:{kind:'outdoor',label:'Außenspielplatz und Streichelzoo am Restaurant',source_url:'https://landhaus-treptow.de/',checked:'2026-11-23'}
 },
 {
  id:'bb-goldene-kartoffel-spielplatz',title:'Zur Goldenen Kartoffel · Restaurant mit Abenteuerspielplatz',
  category:'outing',region_label:'Prötzel · Märkisch-Oderland',
  address:'Wriezener Straße 11, 15345 Prötzel, Deutschland',
  latitude:52.63748,longitude:13.98775,
  description:'Gasthof mit regionaler Küche, Terrasse, Biergarten und Abenteuerspielplatz im Außenbereich. Der Spielbereich ist wetterabhängig; Restaurant- und Küchenzeiten vorher prüfen.',
  info_url:'https://zur-goldenen-kartoffel.de/kontakt/',
  accessibility:unknown('https://www.seenland-oderspree.de/gastro/restaurant-zur-goldenen-kartoffel'),
  family_focus:'food-play',last_checked:'2026-11-23',
  coordinate_note:'Orientierungsmarkierung an der Wriezener Straße nahe dem Gasthof, nicht als gesicherter Eingang.',
  play_area:{kind:'outdoor',label:'Abenteuerspielplatz neben Restaurant und Biergarten',source_url:'https://www.seenland-oderspree.de/gastro/restaurant-zur-goldenen-kartoffel',checked:'2026-11-23'}
 },
].map(place=>({
 ...place,family_focus:place.family_focus||focusById[place.id]||'discovery',source:'curated',
 source_label:'Brandenburg · Redaktionell recherchiert',
 has_changing_table:false,
 last_checked:place.last_checked||'2026-11-22'
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
