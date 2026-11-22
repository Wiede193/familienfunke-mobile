// Bundesweiter Quellenwegweiser, redaktionelle Erfassung 22.11.2026.
// 16 Landesportale sind Einstiege, KEIN Beleg für jede konkrete Fachstelle,
// Antragsfrist, kommunale Zuständigkeit oder elektronische Übermittlung.
export const GERMANY_FAMILY_STATES=[
 {code:'BW',name:'Baden-Württemberg',capital:'Stuttgart',portal_url:'https://www.service-bw.de/',coverage:'state-portal'},
 {code:'BY',name:'Bayern',capital:'München',portal_url:'https://www.bayernportal.de/',coverage:'state-portal'},
 {code:'BE',name:'Berlin',capital:'Berlin',portal_url:'https://service.berlin.de/',coverage:'state-portal'},
 {code:'BB',name:'Brandenburg',capital:'Potsdam',portal_url:'https://service.brandenburg.de/service/de/',coverage:'state-portal'},
 {code:'HB',name:'Bremen',capital:'Bremen',portal_url:'https://www.service.bremen.de/',coverage:'state-portal'},
 {code:'HH',name:'Hamburg',capital:'Hamburg',portal_url:'https://www.hamburg.de/service/',coverage:'state-portal'},
 {code:'HE',name:'Hessen',capital:'Wiesbaden',portal_url:'https://verwaltungsportal.hessen.de/',coverage:'state-portal'},
 {code:'MV',name:'Mecklenburg-Vorpommern',capital:'Schwerin',portal_url:'https://www.mv-serviceportal.de/',coverage:'state-portal'},
 {code:'NI',name:'Niedersachsen',capital:'Hannover',portal_url:'https://www.niedersachsen.de/startseite/service/',coverage:'state-portal'},
 {code:'NW',name:'Nordrhein-Westfalen',capital:'Düsseldorf',portal_url:'https://meineverwaltung.nrw/',coverage:'state-portal'},
 {code:'RP',name:'Rheinland-Pfalz',capital:'Mainz',portal_url:'https://www.rlp.de/service/serviceportal-rheinland-pfalz',coverage:'state-portal'},
 {code:'SL',name:'Saarland',capital:'Saarbrücken',portal_url:'https://www.saarland.de/DE/service/serviceportal',coverage:'state-portal'},
 {code:'SN',name:'Sachsen',capital:'Dresden',portal_url:'https://amt24.sachsen.de/zufi',coverage:'state-portal'},
 {code:'ST',name:'Sachsen-Anhalt',capital:'Magdeburg',portal_url:'https://www.sachsen-anhalt.de/',coverage:'state-portal'},
 {code:'SH',name:'Schleswig-Holstein',capital:'Kiel',portal_url:'https://serviceportal.schleswig-holstein.de/Verwaltungsportal/',coverage:'state-portal'},
 {code:'TH',name:'Thüringen',capital:'Erfurt',portal_url:'https://verwaltung.thueringen.de/',coverage:'state-portal'},
];
export const GERMANY_FAMILY_RESOURCES=[
 {id:'familienportal',title:"Familienportal: Leistungen, Familienalltag und Antragsformulare",description:"Schwangerschaft, Elterngeld, Kindergeld, Elternzeit, Betreuung und besondere Lebenslagen. Gesetzlicher Rahmen bundesweit, Antragstellung teilweise örtlich.",url:'https://familienportal.de/'},
 {id:'bundesportal',title:"Bundesportal: zuständige Behörde und Verwaltungsleistung finden",description:"Amtliche Suchplattform. Zuständigkeiten und Formulare für die konkrete Gemeinde bzw. das Bundesland erst nach Ortsauswahl prüfen.",url:'https://verwaltung.bund.de/'},
 {id:'elterngeld',title:"Elterngeld: Informationen und regional zuständige Stelle",description:"Für die Bewilligung sind Landes- und Kommunalstellen zuständig. Die örtliche Zuordnung und das für das Geburtsdatum geltende Formular prüfen.",url:'https://familienportal.de/familienportal/familienleistungen/elterngeld'},
 {id:'kindergeld',title:"Kindergeld und Familienkasse",description:"Leistungen, Anträge und Familienkassen-Suche der Bundesagentur für Arbeit.",url:'https://www.arbeitsagentur.de/familie-und-kinder'},
 {id:'kita',title:"Kindertagesbetreuung: Rechtsanspruch und Wege zur Platzsuche",description:"Bundesrechtlichen Anspruch, Landesregeln, kommunale Vergabe und mögliche Kita-Assistenz unterscheiden; keine allgemeine bundesweite Anmeldefrist behaupten.",url:'https://familienportal.de/familienportal/lebenslagen/ausbildung-beruf/kinderbetreuung'},
 {id:'eutb',title:"EUTB: Ergänzende unabhängige Teilhabeberatung",description:"Kostenlose unabhängige Beratung für Menschen mit (drohender) Behinderung und Angehörige; regionale Beratungsangebote nach Ort suchen.",url:'https://www.teilhabeberatung.de/beratung/beratungsangebote-der-eutb'},
 {id:'teilhabe',title:"Leistungen zur Rehabilitation und Teilhabe",description:"Zuständigkeit von Jugendamt, Eingliederungshilfeträger, Krankenkasse und Pflegekasse nach Leistung auseinanderhalten.",url:'https://www.bmas.de/DE/Soziales/Teilhabe-und-Inklusion/Rehabilitation-und-Teilhabe/rehabilitation-und-teilhabe.html'},
 {id:'reisen-fuer-alle',title:"Reisen für Alle: geprüfte Barrierefreiheitsangaben",description:"Bundesweites Verzeichnis geprüfter Merkmale, keine pauschale Garantie. Filter für Mobilität, Sehen, Hören und kognitive Bedarfe.",url:'https://reisen-fuer-alle.de/uebersicht-angebote/'},
];
const fold=value=>String(value||'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().trim();
// Kein Standortzugriff, keine Speicherung einer Landesauswahl.
export function findGermanyFamilyStates(query='',limit=16){
 const q=fold(query);
 return GERMANY_FAMILY_STATES.filter(s=>!q||fold(s.name).includes(q)||
   fold(s.capital).includes(q)||s.code.toLowerCase()===q)
   .slice(0,Math.max(0,Math.min(16,Number(limit)||16)));
}
