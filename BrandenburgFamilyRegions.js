// Public family-service directory for Brandenburg, researched 22 Nov 2026.
// Official service links only. No guessed staff names, dates or phone numbers.
// For uncovered districts we link to the state's official authority directory;
// "directory-only" is intentionally NOT equivalent to a verified local form.
export const REGIONAL_DIRECTORY_URL=
 'https://service.brandenburg.de/service/de/adressen/kommunalverzeichnis/';
export const PARENTAL_OFFICES_URL=
 'https://service.brandenburg.de/service/de/adressen/weitere-verzeichnisse/verzeichnisliste/~elterngeldstellen';
export const BRANDENBURG_FAMILY_RESOURCES=[
 {id:'elterngeld',title:'Elterngeld: zuständige Stelle finden',
   explanation:'Die zuständige Elterngeldstelle richtet sich nach dem maßgeblichen Wohnort. Brandenburg führt ein amtliches Verzeichnis der Elterngeldstellen.',
   url:PARENTAL_OFFICES_URL},
 {id:'elterngeld-digital',title:'ElterngeldDigital',
   explanation:'Bundesweites Einstiegstor zur digitalen Vorbereitung. Ob am Ende elektronische Übermittlung möglich ist oder Ausdruck und Unterschrift erforderlich sind, zeigt die zuständige Stelle.',
   url:'https://familienportal.de/familienportal/rechner-antraege/elterngelddigital-127692'},
 {id:'kita',title:'Brandenburg: Rechtsanspruch auf Kindertagesbetreuung',
   explanation:'Der Grundanspruch und ein möglicherweise notwendiger Antrag auf erweiterten Betreuungsumfang sind zu unterscheiden. Platzvergabe und Unterlagen unterscheiden sich nach Kommune und Landkreis.',
   url:'https://mbjs.brandenburg.de/kinder-und-jugend/kindertagesbetreuung/rechtsanspruch-und-anmeldung.html'},
 {id:'kindergeld',title:'Kindergeld online beantragen',
   explanation:'Kindergeld wird über die Familienkasse der Bundesagentur für Arbeit beantragt, nicht bei der Elterngeldstelle des Landkreises.',
   url:'https://www.arbeitsagentur.de/familie-und-kinder'},
 {id:'behinderung',title:'Schwerbehindertenrecht: Brandenburg',
   explanation:'Grad der Behinderung und Merkzeichen stellt das Landesamt für Soziales und Versorgung fest; die Eingliederungshilfe hat einen anderen Antragsweg.',
   url:'https://lasv.brandenburg.de/lasv/de/schwerbehinderung/'},
 {id:'beratung',title:'Unabhängige Teilhabeberatung suchen',
   explanation:'Der EUTB-Beratungsatlas findet unabhängige kostenfreie Beratung, auch für Eltern und Angehörige.',
   url:'https://www.teilhabeberatung.de/beratung/beratungsangebote-der-eutb'}
];
const office=(topic,title,detail,url,contact='')=>({topic,title,detail,url,contact});
export const BRANDENBURG_REGIONS=[
 {id:'oder-spree',name:'Landkreis Oder-Spree',aliases:['Oder-Spree','Beeskow','Fürstenwalde','Eisenhüttenstadt','Bad Saarow','Storkow','Grünheide','Erkner'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Oder-Spree','Jugendamt, Standort Beeskow. Zuständig bei entsprechendem Wohnort. Antragsunterlagen und aktuelle Erreichbarkeit auf der Kreis-Seite prüfen.','https://www.landkreis-oder-spree.de/Bildung-Soziales/Jugend-Familie/Elterngeld/','03366 35-2511'),
   office('childcare_search','Kita-Rechtsanspruch Oder-Spree','Jugendamt: Rechtsanspruch und gegebenenfalls erweiterten Betreuungsbedarf prüfen. Platzbewerbung bei Kommune oder Träger separat organisieren.','https://www.landkreis-oder-spree.de/Service-Aktuelles/Service/Was-erledige-ich-wo-/Rechtsanspruch-auf-Kindertagesbetreuung.php?FID=2426.44.1&ModID=10'),
   office('kita_application','Kitas und Kindertagespflege Oder-Spree','Die Kreisverwaltung erläutert Betreuungsformen und lokale Antragsunterlagen.','https://www.landkreis-oder-spree.de/Bildung-Soziales/Jugend-und-Familie/Kindertagesbetreuung/'),
   office('disability','Eingliederungshilfe Oder-Spree','Sozialamt, Liebknechtstraße 21/22, Haus K, Beeskow. Formloser Antrag möglich; Zusatzformulare etwa zu Frühförderung und Teilhabe an Bildung stehen auf der Kreis-Seite. Einige PDF-Formulare sind ausdrücklich nicht barrierefrei.','https://www.landkreis-oder-spree.de/Bildung-Soziales/Soziales/Eingliederungshilfe/','03366 35-2401')
 ]},
 {id:'frankfurt-oder',name:'Frankfurt (Oder) · kreisfreie Stadt',aliases:['Frankfurt (Oder)','Frankfurt Oder','Frankfurt an der Oder','Frankfurt/Oder'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeld Frankfurt (Oder)','Amt für Jugend und Soziales. Informationen für Geburten ab 1. April 2025 einschließlich Zuständigkeit und Nachweisen.','https://www.frankfurt-oder.de/Verwaltung-Stadtpolitik/Verwaltung/B%C3%BCrger-und-Unternehmensservice-A-Z/Elterngeld-beantragen/Elterngeld-beantragen-Geburten-ab-01-04-2025/'),
   office('childcare_search','Kita-Rechtsanspruch Frankfurt (Oder)','Amt für Jugend und Soziales. Das örtliche Formular ist insbesondere für erweiterten Betreuungsumfang und bestimmte Altersgruppen relevant.','https://www.frankfurt-oder.de/Verwaltung-Stadtpolitik/Verwaltung/B%C3%BCrger-und-Unternehmensservice-A-Z/KITA-Rechtsanspruchspr%C3%BCfung.php?FID=2616.117.1&ModID=10'),
   office('kita_application','Kita-Wegweiser Frankfurt (Oder)','Überblick über Betreuungsangebote, Ansprechpartner und örtliche Verfahren.','https://www.frankfurt-oder.de/Bildung-Soziales/Soziales/Kindertagesbetreuung-Kitawegweiser/'),
   office('disability','Jugend, Familie und soziale Dienste','Städtisches Amt für Jugend und Soziales; Leistungs- und Beratungszuständigkeiten im Einzelfall klären.','https://www.frankfurt-oder.de/Verwaltung-Stadtpolitik/Verwaltung/%C3%84mterverzeichnis/Abteilung-Jugend-Familie-und-soziale-Dienste.php?FID=4071.50.1&ModID=9')
 ]},
 {id:'maerkisch-oderland',name:'Landkreis Märkisch-Oderland',aliases:['Märkisch-Oderland','Maerkisch Oderland','Strausberg','Seelow','Neuenhagen','Rüdersdorf','Bad Freienwalde'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Märkisch-Oderland','Schulverwaltungs-, Kultur- und Sportamt, Puschkinplatz 12, 15306 Seelow. Aktuelle Formulare und Nachweise im Serviceportal.','https://service.lkmol.de/dienstleistungen/-/egov-bis-detail/dienstleistung/23221/show','03346 850-6818, -6819 oder -6820'),
   office('childcare_search','Kita-Rechtsanspruch und zusätzliche Betreuungszeit','Im örtlichen Serviceportal ist angegeben, wann ein zusätzlicher Antrag erforderlich ist. Zuständig: Jugendamt, Betreuung_KiTa@landkreismol.de.','https://service.lkmol.de/dienstleistungen/-/egov-bis-detail/dienstleistung/26758/show'),
   office('kita_application','Kita-Formulare Märkisch-Oderland','Offizielle Formularsammlung einschließlich Nachweisen und Leistungen der Kindertagesbetreuung.','https://www.maerkisch-oderland.de/service-aktuelles/service/formulare'),
   office('disability','Verfahrenslotsen und Jugendamt','Jugendamt in Strausberg, Verfahrenslotsen für Kinder und Jugendliche mit (drohender) Behinderung; Fragen zur Eingliederungshilfe unabhängig begleiten lassen.','https://www.maerkisch-oderland.de/leben-im-landkreis/leben-gesellschaft/jugend-familie/kontakte-jugendamt','verfahrenslotsen@landkreismol.de')
 ]},
 {id:'dahme-spreewald',name:'Landkreis Dahme-Spreewald',aliases:['Dahme-Spreewald','Königs Wusterhausen','Lübben','Luckau','Wildau','Schönefeld','Zeuthen'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Dahme-Spreewald','Amt für Kinder, Jugend und Familie. Auf der offiziellen Seite steht ausdrücklich, ob ein digital vorbereiteter Antrag ausgedruckt und unterschrieben eingereicht werden muss.','https://www.dahme-spreewald.de/de/verwaltung/verwaltungsstruktur/dezernat4/amt-fuer-kinder-jugend-und-familie/elterngeld/'),
   office('childcare_search','Jugendamt und Kindertagesbetreuung Dahme-Spreewald','Amt für Kinder, Jugend und Familie: zuständige Sachgebiete, Bedarfsplanung und Ansprechpartner.','https://www.dahme-spreewald.de/de/verwaltung/verwaltungsstruktur/dezernat4/amt-fuer-kinder-jugend-und-familie/'),
   office('kita_application','Formulare Dahme-Spreewald','Offizielle Formularübersicht des Kreises für Familie, Elterngeld und Kindertagespflege.','https://www.dahme-spreewald.de/de/buergerservice/formulare/')
 ]},
 {id:'barnim',name:'Landkreis Barnim',aliases:['Barnim','Eberswalde','Bernau','Wandlitz','Biesenthal','Schorfheide'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Barnim','Jugendamt – Elterngeldstelle. Hier sind Voraussetzungen und Antragsweg erläutert.','https://www.barnim.de/soziales-gesundheit/soziales/elterngeld/elterngeld-beantragen'),
   office('childcare_search','Jugendamt Barnim','Zuständig für Kindertagesbetreuung, Jugendhilfe und Familienunterstützung.','https://www.barnim.de/politik-verwaltung/verwaltung/verwaltungsstruktur/jugendamt'),
   office('kita_application','Familien-Angebote Landkreis Barnim','Übersicht der Angebote von Jugendamt, Kitas, Kindertagespflege und Beratung.','https://www.barnim.de/famile-bildung/familien'),
   office('parental_forms','Elterngeld-Formulare Barnim','Offizielles Formularverzeichnis mit Antragsformularen und Anlagen.','https://www.barnim.de/soziales-gesundheit/soziales/elterngeld/elterngeld-berechnen/antragsformulare')
 ]},
 {id:'uckermark',name:'Landkreis Uckermark',aliases:['Uckermark','Prenzlau','Schwedt','Templin','Angermünde'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Uckermark','Jugendamt, Karl-Marx-Straße 1, 17291 Prenzlau. Zuständigkeit teilweise nach Anfangsbuchstabe des Kindes.','https://www.uckermark.de/Kurzmen%C3%BC/Kontakt-Elterngeld.php?object=tx%2C3615.4556.1','03984 70-3651 / 03332 208-198'),
   office('parental_forms','Anträge und Vordrucke Jugendamt Uckermark','Amtliches Formularverzeichnis unter anderem mit Elterngeldunterlagen, Beistandschaft und Kindertagesbetreuung.','https://www.uckermark.de/Kurzmen%C3%BC/Antr%C3%A4ge-Vordrucke-Jugendamt.php?object=tx%2C3615.4628.1'),
   office('disability','Behindertenbeauftragte Uckermark','Beratungswege und Ansprechpartner für Belange von Menschen mit Behinderung.','https://www.uckermark.de/Leben-Soziales-Gesundheit/Behindertenbeauftragter/')
 ]},
 {id:'spree-neisse',name:'Landkreis Spree-Neiße',aliases:['Spree-Neiße','Forst (Lausitz)','Spremberg','Guben','Burg (Spreewald)'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeld Spree-Neiße','Fachbereich Kinder, Jugend und Familie. Offizielle Leistungsbeschreibung einschließlich Hinweis zum jeweiligen Unterschriftsverfahren.','https://www.lkspn.de/buergerservice/dienstleistungen/35-bundeselterngeld.html'),
   office('parental_forms','Formularservice Spree-Neiße','Formularverzeichnis des Landkreises mit Elterngeldunterlagen.','https://www.lkspn.de/buergerservice/formular_antrag_service.html'),
   office('childcare_search','Fachbereich Jugend, Familie und Kita','Örtliches Sachgebiet Jugend/Familie/Kita als Einstieg für Fragen zu Kinderbetreuung.','https://www.lkspn.de/buergerservice/dezernate-fachbereiche/365-sachgebiet-sg-jugendfamiliekita.html')
 ]},
 {id:'cottbus',name:'Cottbus / Chóśebuz · kreisfreie Stadt',aliases:['Cottbus','Chóśebuz'],coverage:'verified',offices:[
   office('parental_allowance','Elterngeldstelle Cottbus','Jugendamt der Stadt Cottbus; aktuelle Zuständigkeiten, Ansprechpartner und Antragsinformationen stehen auf der offiziellen Seite.','https://cottbus.de/verwaltung/gb-1/dz-1-1/fb-51-jugendamt-2/elterngeld/')
 ]},
 {id:'potsdam',name:'Potsdam · kreisfreie Stadt',aliases:['Potsdam','Landeshauptstadt Potsdam'],coverage:'directory',offices:[
   office('childcare_search','Kita-Rechtsanspruch Potsdam','Offizielle Leistungsbeschreibung mit Verweis auf das Kita-Portal der Landeshauptstadt.','https://verwaltung.brandenburg.de/verwalt/de/detail/?bus_areaId=10821&bus_id=109433075&bus_lng=de_DE&bus_type=pst')
 ]},
 {id:'brandenburg-havel',name:'Brandenburg an der Havel · kreisfreie Stadt',aliases:['Brandenburg an der Havel'],coverage:'directory',offices:[]},
 {id:'elbe-elster',name:'Landkreis Elbe-Elster',aliases:['Elbe-Elster','Herzberg (Elster)','Finsterwalde','Elsterwerda'],coverage:'directory',offices:[]},
 {id:'havelland',name:'Landkreis Havelland',aliases:['Havelland','Rathenow','Falkensee','Nauen'],coverage:'directory',offices:[]},
 {id:'oberhavel',name:'Landkreis Oberhavel',aliases:['Oberhavel','Oranienburg','Hennigsdorf','Zehdenick'],coverage:'directory',offices:[]},
 {id:'oberspreewald-lausitz',name:'Landkreis Oberspreewald-Lausitz',aliases:['Oberspreewald-Lausitz','Senftenberg','Lübbenau','Calau'],coverage:'directory',offices:[]},
 {id:'ostprignitz-ruppin',name:'Landkreis Ostprignitz-Ruppin',aliases:['Ostprignitz-Ruppin','Neuruppin','Wittstock','Rheinsberg'],coverage:'directory',offices:[]},
 {id:'potsdam-mittelmark',name:'Landkreis Potsdam-Mittelmark',aliases:['Potsdam-Mittelmark','Bad Belzig','Werder (Havel)','Teltow'],coverage:'directory',offices:[]},
 {id:'prignitz',name:'Landkreis Prignitz',aliases:['Prignitz','Perleberg','Wittenberge'],coverage:'directory',offices:[]},
 {id:'teltow-flaeming',name:'Landkreis Teltow-Fläming',aliases:['Teltow-Fläming','Luckenwalde','Ludwigsfelde','Zossen'],coverage:'directory',offices:[]}
].map(region=>({
 ...region,
 verified_at:'2026-11-22',
 directory_url:REGIONAL_DIRECTORY_URL,
 offices:region.offices||[]
}));
const ascii=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/ß/g,'ss').replace(/[^a-z0-9]+/gi,' ').toLowerCase().trim();
export function findBrandenburgRegions(query,limit=18){
 const q=ascii(query);
 return BRANDENBURG_REGIONS.filter(r=>!q||[r.name,...r.aliases].some(a=>ascii(a).includes(q)))
   .slice(0,Math.min(Math.max(0,limit),18));
}
export function guessBrandenburgRegion(regionLabel){
 const q=ascii(regionLabel);
 if(!q)return null;
 // Prefer exact aliases to broad substring detection; "Brandenburg" alone is
 // not a district, and Frankfurt (Oder) is NOT part of Landkreis Oder-Spree.
 const exact=BRANDENBURG_REGIONS.find(r=>[r.name,...r.aliases].some(a=>ascii(a)===q));
 if(exact)return exact;
 return BRANDENBURG_REGIONS.find(r=>[r.name,...r.aliases]
   .some(a=>ascii(a).length>=6&&q.includes(ascii(a))))||null;
}
export function officeForGuideStep(region,stepId){
 const related=['childcare_search','kita_application'].includes(stepId)
   ?['childcare_search','kita_application']
   :stepId==='parental_allowance'?['parental_allowance','parental_forms']
   :stepId==='family_support'?['disability']
   :[];
 return (region?.offices||[]).filter(o=>related.includes(o.topic));
}
