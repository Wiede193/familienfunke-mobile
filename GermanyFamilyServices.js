// Familienfunke – geprüfte landesweite Einstiegsstellen, 24.11.2026.
// Offizielle Quellen; KEINE Zuordnung zu individuellen Bezirks-/Gemeindeämtern.
// Konkreten Ort im amtlichen Dienst auswählen; kein stilles Standort-Tracking.
const service=(topic,title,authority,description,url,steps=[],documents='',caveat='')=>({
 topic,title,authority,description,url,steps,documents,caveat,
 scope:'state-entry',checked:'2026-11-24'
});
export const GERMANY_STATE_SERVICES=[
 {code:'BE',coverage:'researched',services:[
  service('parental_allowance','Berlin: Elterngeld beantragen','Jugendamt des zuständigen Wohnbezirks',
   'Das Serviceportal nennt das zuständige Familienservicebüro und die bezirklichen Elterngeldstellen. Den Wohnbezirk des Kindes auswählen; eine Adresse für ganz Berlin wäre irreführend.',
   'https://service.berlin.de/dienstleistung/326079/',
   ['Zuständigen Bezirk auswählen','Formular und Nachweise nach Geburtsdatum prüfen','Antrag an das dortige Jugendamt richten'],
   'Geburtsnachweis und Einkommen; bei Bedarf Mutterschaftsgeld- und weitere Erwerbsnachweise.',
   'Nicht alle Bezirksämter sind dieselbe Stelle. Elektronische Einreichung und Formvorgaben im Serviceportal prüfen.'),
  service('childcare_search','Berlin: Kita-Gutschein beantragen oder erweitern','Jugendamt des Wohnbezirks',
   'Der Kita-Gutschein bestimmt den anerkannten Betreuungsumfang. Den Antrag vor dem gewünschten Betreuungsbeginn beim Wohnbezirksjugendamt stellen; die Anmeldung bei einer konkreten Kita ist ein separater Schritt.',
   'https://service.berlin.de/dienstleistung/324873/',
   ['Kita-Gutschein für den gewünschten Betreuungsumfang beantragen','Unterschriften und Belege laut Amt beifügen','Nach Bescheid Kita suchen und Betreuungsvertrag schließen'],
   'Antrag und ggf. Zustimmung der Sorgeberechtigten sowie Nachweise zum zusätzlichen Betreuungsbedarf.',
   'Das Serviceportal beschreibt für die Online-Ausfüllhilfe ggf. Ausdruck und unterschriebenen Versand. Nicht jede Online-Maske gilt bereits als wirksam eingereichter Antrag.')
 ]},
 {code:'SN',coverage:'researched',services:[
  service('parental_allowance','Sachsen: Elterngeldstelle nach Wohnort','Elterngeldstelle des Landkreises oder der kreisfreien Stadt',
   'In Sachsen stellen die Landkreise sowie Chemnitz, Dresden und Leipzig den Elterngeldanspruch fest. Für den eigenen Wohnort die Kreis- oder Stadtstelle ermitteln; der KSV ist unter anderem für Widerspruchsverfahren zuständig.',
   'https://www.ksv-sachsen.de/elterngeld-landeserziehungsgeld',
   ['Landkreis beziehungsweise kreisfreie Stadt bestimmen','Über Amt24 die konkrete Antragsleistung und zuständige Stelle auswählen','Unterlagen an die ermittelte Elterngeldstelle übermitteln'],
   'Geburtsnachweis, Einkommensangaben und im Einzelfall weitere Erklärungen laut Antragsstelle.',
   'Der Kommunale Sozialverband ist nicht pauschal die Erst-Antragstelle. Landeserziehungsgeld ist eine eigene Leistung.'),
  service('childcare_search','Sachsen: Krippe, Kindergarten oder Hort finden','Kommune, Einrichtung und örtlicher Jugendhilfeträger',
   'Amt24 führt die Lebenslage Kinderbetreuung und die dazugehörigen Anmeldeleistungen. Die Platzvergabe läuft je nach Kommune oder Einrichtung; örtliche Suche erforderlich.',
   'https://amt24.sachsen.de/zufi/lebenslagen/5000516',
   ['Wohnort und benötigte Betreuungsart angeben','Örtlichen Anmeldeweg für Krippe, Kita oder Hort suchen','Fristen und Unterlagen bei der Einrichtung oder Kommune prüfen'],
   'Je nach Träger Anmeldedaten zum Kind, Sorgeberechtigung und gewünschter Betreuungsbeginn.',
   'Keine bundeslandweit einheitliche Anmeldung oder generelle Zusage auf die Wunschkita.'),
  service('family_support','Sachsen: Hilfen zur Erziehung beantragen','Örtliches Jugendamt',
   'Amt24 erklärt die Hilfeformen; erst nach Angabe des Ortes kann die zuständige Stelle beziehungsweise ein möglicher Onlineantrag gezeigt werden.',
   'https://amt24.sachsen.de/zufi/leistungen/6000055',
   ['Beratungsbedarf mit dem örtlichen Jugendamt klären','Zuständige Stelle über Wohnortauswahl ermitteln','Erforderlichen Antrag und mögliche Hilfeplanung besprechen'],
   'Persönliche Angaben und gegebenenfalls erforderliche Bedarfsunterlagen erst beim Amt mitteilen.',
   'Der Fachbereich kann nicht allein aus dem Bundesland und ohne Wohnort festgelegt werden.')
 ]},
 {code:'BY',coverage:'researched',services:[
  service('parental_allowance','Bayern: Elterngeld beim ZBFS','Zentrum Bayern Familie und Soziales (ZBFS)',
   'Das ZBFS ist in Bayern für Elterngeld zuständig. Es bietet einen Onlineantrag und einen Zuständigkeitsfinder nach Postleitzahl beziehungsweise Regierungsbezirk.',
   'https://www.zbfs.bayern.de/familienleistungen/elterngeld/',
   ['Für das Kind den zuständigen ZBFS-Bereich finden','Online-Antrag oder Vordruck auswählen','Geburtsnachweis und Einkommensunterlagen nach Antragscheckliste einreichen'],
   'Geburtsurkunde zur Elterngeldbeantragung, Einkommensunterlagen und fallabhängige Nachweise.',
   'Nicht den Wohnbezirk eines anderen Bundeslands übernehmen; die zuständige ZBFS-Regionalstelle prüfen.'),
  service('childcare_search','Bayern: Kita-Platz und Kindertagespflege','Kita/Kommunalportal und örtliches Jugendamt',
   'Das Familienland Bayern verweist für die Platzsuche auf Einrichtungen, örtliche digitale Kita-Portale und Jugendämter. Die Aufnahme und Anmeldung unterscheiden sich nach Gemeinde.',
   'https://www.familienland.bayern.de/familienleben/familie-beruf/kinderbetreuung/',
   ['Wunschkita oder kommunales Anmeldeportal suchen','Mit der Kommune oder dem Jugendamt den Rechtsanspruch und das örtliche Verfahren klären','Bei Tagespflege das Jugendamt nach Vermittlung fragen'],
   'Je nach örtlichem Verfahren Kinderdaten, gewünschter Start und Betreuungszeiten.',
   'Keine pauschale landesweite Online-Anmeldung und keine garantierte Platzvergabe in einer bestimmten Einrichtung.')
 ]},
 {code:'MV',coverage:'researched',services:[
  service('parental_allowance','Mecklenburg-Vorpommern: Elterngeld beim LAGuS','Landesamt für Gesundheit und Soziales (LAGuS)',
   'Das LAGuS benennt Elterngeldstellen in Neubrandenburg, Rostock, Schwerin und Stralsund. Welche Regionalstelle zuständig ist, ergibt sich aus dem Wohnort.',
   'https://www.lagus.mv-regierung.de/Soziales/Elterngeld_ElterngeldPlus/',
   ['Regionalzuständigkeit des LAGuS prüfen','Antrag über das amtliche Verfahren vorbereiten','Erforderlichen Übermittlungsweg und Unterschrift vor Versand prüfen'],
   'Geburtsurkunde, Einkommensnachweise und je nach persönlicher Lage weitere Unterlagen.',
   'Die LAGuS-Fachseite beschreibt den Ausdruck und unterschriebenen Postversand des digital vorbereiteten Antrags; nicht automatisch vollständig digital.'),
  service('childcare_search','Mecklenburg-Vorpommern: Kita-Anmeldung','Kommunale Einrichtung und örtlicher Jugendhilfeträger',
   'Das MV-Serviceportal führt die Anmeldung zu einer kommunalen Kindertageseinrichtung und weist je nach Ort die zuständige Stelle aus.',
   'https://www.mv-serviceportal.de/leistung?leistungId=110138920',
   ['Wohnort in der Serviceportalsuche festlegen','Einrichtung und Anmeldeweg auswählen','Bei zusätzlichen Betreuungsstunden ggf. Jugendamt kontaktieren'],
   'Kinderdaten, gewünschter Betreuungsumfang und kommunal geforderte Nachweise.',
   'Die Verfügbarkeit des konkreten Platzes wird nicht live geprüft; Zusatzbedarf und Kosten gesondert klären.')
 ]},
 {code:'HH',coverage:'researched',services:[
  service('parental_allowance','Hamburg: Elterngeld beantragen','Elterngeldstelle des zuständigen Bezirksamts',
   'Der Hamburg Service beschreibt den Online-Antrag sowie erforderliche Nachweise. Die Elterngeldstelle des zuständigen Wohnbezirks bearbeitet den Antrag.',
   'https://www.hamburg.de/service/info/11981756/n0/',
   ['Zuständige Bezirksstelle ermitteln','Online-Antrag oder amtliches Formular wählen','Erforderliche Nachweise und Signaturweg prüfen'],
   'Geburtsnachweis, Einkommensunterlagen und gegebenenfalls weitere Bescheinigungen.',
   'Die vollständig digitale Abgabe hängt vom verwendeten Identifizierungsverfahren ab; nicht jede Ausfüllhilfe ist eine Einreichung.'),
  service('childcare_search','Hamburg: Kita-Gutschein und Kindertagespflege','Bezirksamt, Fachbereich Kindertagesbetreuung',
   'Der Kita-Gutschein kann online beantragt werden; die Fachseite erläutert Betreuungsumfang, Nachweise und Formulare. Der konkrete Kita-Platz wird anschließend mit der Einrichtung geklärt.',
   'https://www.hamburg.de/politik-und-verwaltung/behoerden/bsfb/familie/kinderbetreuung/elterninformationen/kita-gutschein-35656',
   ['Benötigten Betreuungsumfang ermitteln','Kita-Gutschein bzw. Kindertagespflege-Bewilligung über den amtlichen Dienst beantragen','Einrichtung und Betreuungsvertrag separat klären'],
   'Formular und je nach Umfang Nachweise zu Betreuung und Einkommenssituation.',
   'Sonderregeln für längere Betreuung und Eingliederungshilfe können zusätzliche Nachweise erfordern.')
 ]},
 {code:'NW',coverage:'researched',services:[
  service('parental_allowance','Nordrhein-Westfalen: Elterngeld über das Familienportal','Zuständige Elterngeldstelle nach Wohnort des Kindes',
   'Das Familienportal.NRW bietet Onlineantrag, Nachweis-Upload und Ortssuche. Die zuständige Stelle wird nach Postleitzahl beziehungsweise Wohnort des Kindes ausgewählt.',
   'https://www.familienportal.nrw/de/elterngeld',
   ['Wohnort des Kindes in der offiziellen Suche eingeben','Elterngeldantrag und Nachweise vorbereiten','Passenden digitalen Signatur- und Übermittlungsweg nutzen'],
   'Geburtsnachweis, Einkommensunterlagen und je nach Situation weitere Nachweise.',
   'Zuständige Stellen können interkommunal gebündelt sein; allein aus dem Städtenamen keine bestimmte Behörde behaupten.'),
  service('childcare_search','Nordrhein-Westfalen: Kita-Finder und Jugendamt','Örtliches Jugendamt und Kita-Träger',
   'Das landesweite Kita-Informationsportal verweist auf den Kita-Finder. Viele Kommunen nutzen eigene Anmeldeportale; Auswahl, Anmeldung und Rechtsanspruch sind zu unterscheiden.',
   'https://www.kita.nrw.de/',
   ['Kitas über den offiziellen Kita-Finder finden','Das kommunale Anmeldeverfahren und das zuständige Jugendamt ermitteln','Benötigten Betreuungsumfang und Anmeldezeitpunkte vor Ort klären'],
   'Je nach Kommune Angaben zum Kind, Sorgeberechtigten, gewünschter Start und Betreuungsumfang.',
   'Der Kita-Finder allein ist kein landesweit verbindlicher Kita-Antrag.')
 ]}
];
export const REVIEWED_STATE_CODES=GERMANY_STATE_SERVICES.map(s=>s.code);
export function findStateServiceGroup(code){
 return GERMANY_STATE_SERVICES.find(s=>s.code===String(code||'').toUpperCase())||null;
}
export function findStateServices(code,topics=[]){
 const group=findStateServiceGroup(code);if(!group)return [];
 return group.services.filter(s=>!topics.length||topics.includes(s.topic));
}
// Stadtnamen nur als hilfreiche Hinweissuche, nicht als Beweis für einen Wohnsitz.
const CITY_HINTS={
 BE:['Berlin'],SN:['Leipzig','Dresden','Chemnitz'],BY:['München','Muenchen','Nürnberg','Nuernberg','Augsburg','Regensburg'],
 MV:['Schwerin','Rostock','Stralsund','Neubrandenburg','Greifswald'],HH:['Hamburg'],
 NW:['Köln','Koeln','Düsseldorf','Duesseldorf','Dortmund','Essen','Bochum','Bonn','Bielefeld']
};
const clean=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
 .replace(/[^a-z0-9]+/g,' ').trim();
const phrase=(s,q)=>(' '+clean(q)+' ').includes(' '+clean(s)+' ');
export function matchGermanState(question,states=[]){
 const q=clean(question);
 if(!q)return null;
 // Explizite Bundeslandnennung vor Stadt-Heuristik; absichtlich keine Abkürzungen
 // wie "BB", "BE" oder "MV": Verwechslung mit normalen Wörtern vermeiden.
 const matches=states.filter(s=>phrase(s.name,q));
 if(matches.length===1)return matches[0];
 if(matches.length>1)return null;
 const hints=[];
 for(const state of states){
   if(phrase(state.capital,q)||CITY_HINTS[state.code]?.some(city=>phrase(city,q)))
     hints.push(state);
 }
 return hints.length===1?hints[0]:null;
}
