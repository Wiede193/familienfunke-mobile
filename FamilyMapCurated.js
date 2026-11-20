// Redaktionell ausgewählte Ausflugsziele für Familienfunke.
// Ortslage am 20.11.2026 anhand offizieller Träger-/Tourismusangaben
// und dokumentierter Geokoordinaten geprüft. Ausstattung NICHT pauschal bestätigt.
// OSM-basierte Geodaten: © OpenStreetMap-Mitwirkende (ODbL).
export const CURATED_REGION={
  name:'Oder-Spree & Umgebung',latitude:52.27,longitude:14.19,zoom:8.15
};
export const CURATED_FAMILY_PLACES=[
  {
    id:'curated-irrlandia',title:'IRRLANDIA – der MitMachPark',category:'outing',
    description:'Naturnaher Mitmachpark mit Rutschen, Labyrinthen und vielen Spielstationen. Öffnungszeiten und Saison vor dem Besuch prüfen.',
    region_label:'Storkow (Mark)',address:'Lebbiner Straße 1a, 15859 Storkow (Mark)',
    latitude:52.26551,longitude:13.93524,
    info_url:'https://www.irrlandia.de/',osm_key:'osm-way-800937029'
  },
  {
    id:'curated-burg-storkow',title:'Burg Storkow & Naturpark-Besucherzentrum',category:'outing',
    description:'Historische Burg mit Ausstellung zur Natur- und Kulturgeschichte sowie Tourist-Information. Ein Ausflug für wissbegierige Familien.',
    region_label:'Storkow (Mark)',address:'Schloßstraße 6, 15859 Storkow (Mark)',
    latitude:52.25288295,longitude:13.93338919,
    info_url:'https://www.dahme-heideseen-naturpark.de/themen/ausflugsziele-erlebnisse/besucherzentrum-burg-storkow-mark/'
  },
  {
    id:'curated-waltersberge',title:'Binnendüne Waltersberge',category:'outing',
    description:'Natur-Aussichtspunkt über dem Storkower See, auf einem Wanderweg ab Burg Storkow erreichbar. Naturschutzgebiet: bitte auf den Wegen bleiben.',
    region_label:'Storkow (Mark)',address:'Reichenwalder Straße, 15859 Storkow (Mark)',
    latitude:52.26469055,longitude:13.95692825,
    info_url:'https://www.natur-brandenburg.de/themen/ausflugsziele-erlebnisse/aussichtspunkt-binnenduene-waltersberge/'
  },
  {
    id:'curated-scharmuntzelland',title:'Scharmuntzelland – Freizeitpark',category:'outing',
    description:'Familien- und Freizeitpark mit Abenteuerspielplatz, Tierhof und Minigolf. Saison, Preise und Angebote direkt beim Park nachsehen.',
    region_label:'Wendisch Rietz',address:'Am Freizeitpark 1, 15864 Wendisch Rietz',
    latitude:52.2217,longitude:14.01,
    info_url:'https://www.scharmuntzelland.de/',osm_key:'osm-way-825399584'
  },
  {
    id:'curated-heimattiergarten',title:'Heimattiergarten Fürstenwalde',category:'outing',
    description:'Tiergarten mit einheimischen und weiteren Tierarten. Geeignet für einen entspannten Familienausflug; aktuelle Besuchsinfos beachten.',
    region_label:'Fürstenwalde/Spree',address:'Dr.-Wilhelm-Külz-Straße 10B, 15517 Fürstenwalde/Spree',
    latitude:52.36886,longitude:14.04619,
    info_url:'https://www.heimattiergarten-fuerstenwalde.de/',osm_key:'osm-way-168737334'
  },
  {
    id:'curated-wettermuseum',title:'Wettermuseum Lindenberg',category:'outing',
    description:'Museum rund um Wetter, Wetterbeobachtung und die Geschichte der Meteorologie – mit Technik und Experimenten.',
    region_label:'Tauche-Lindenberg',address:'Herzberger Straße 21, 15848 Tauche OT Lindenberg',
    latitude:52.20858,longitude:14.1138,
    info_url:'https://www.wettermuseum.de/',osm_key:'osm-node-1794101250'
  },
  {
    id:'curated-burg-beeskow',title:'Burg Beeskow',category:'outing',
    description:'Historische Burganlage und Kulturort in Beeskow. Ausstellungen und Veranstaltungen je nach Programm.',
    region_label:'Beeskow',address:'Frankfurter Straße 23, 15848 Beeskow',
    latitude:52.17049,longitude:14.2522,
    info_url:'https://www.burg-beeskow.de/',osm_key:'osm-way-109856435'
  },
  {
    id:'curated-naturparkhaus',title:'Naturparkhaus Schlaubetal',category:'outing',
    description:'Besucherinformationszentrum in Müllrose mit spannenden Einblicken in Wald, Moore und Seen des Schlaubetals.',
    region_label:'Müllrose',address:'Kietz 7, 15299 Müllrose',
    latitude:52.24663639,longitude:14.41386938,
    info_url:'https://www.schlaubetal-naturpark.de/themen/ausflugsziele-erlebnisse/naturparkhaus-schlaubetal/'
  },
  {
    id:'curated-wildpark-frankfurt',title:'Wildpark Frankfurt (Oder)',category:'outing',
    description:'Wildpark im Stadtwald am Stadtrand von Frankfurt (Oder). Ziel für Tierbeobachtung und Familien-Spaziergänge.',
    region_label:'Frankfurt (Oder) · Umgebung',address:'Am Wildpark 1, 15234 Frankfurt (Oder)',
    latitude:52.35082,longitude:14.46203,
    info_url:'https://www.wildpark-frankfurt-oder.de/',osm_key:'osm-way-69221883'
  },
  {
    id:'curated-ziegenwerder',title:'Insel Ziegenwerder – Park & Spielplatz',category:'playground',
    description:'Grüne Oderinsel mit Spazierwegen und einem größeren Abenteuerspielplatz. Die Markierung zeigt den Parkbereich, nicht den genauen Spielgeräte-Standort.',
    region_label:'Frankfurt (Oder) · Umgebung',address:'Hermann-Weingärtner-Weg, Frankfurt (Oder)',
    latitude:52.340474,longitude:14.559464,
    info_url:'https://www.frankfurt-slubice.eu/de/poi/102709/ziegenwerder'
  }
].map(place=>({
  ...place,
  source:'curated',
  source_label:'Ausflugstipp · Quellen geprüft',
  has_changing_table:false, // nicht bekannt: NICHT mit "kein Wickeltisch" verwechseln
  last_checked:'2026-11-20'
}));
