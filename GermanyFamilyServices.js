// Familienfunke – geprüfte landesweite Einstiegsstellen, 24.11.2026.
// Offizielle Quellen; KEINE Zuordnung zu individuellen Bezirks-/Gemeindeämtern.
// Konkreten Ort im amtlichen Dienst auswählen; kein stilles Standort-Tracking.
const service=(topic,title,authority,description,url,steps=[],documents='',caveat='')=>({
 topic,title,authority,description,url,steps,documents,caveat,
 scope:'state-entry',checked:'2026-11-24'
});
export const GERMANY_STATE_SERVICES=[
 {code:'HB',coverage:'researched',services:[
  service('parental_allowance','Bremen: Elterngeld beantragen','Amt für Soziale Dienste, Elterngeldstelle Bremen; für Bremerhaven die dort zuständige Stelle prüfen',
   'Das Serviceportal Bremen erläutert den Online- und Papierantrag sowie die zuständige Elterngeldstelle. Vor der Einreichung muss die Stadtgemeinde Bremen oder Bremerhaven unterschieden werden.',
   'https://www.service.bremen.de/dienstleistungen/elterngeld-beantragen-9743',
   ['Stadtgemeinde Bremen oder Bremerhaven und zuständige Elterngeldstelle auswählen','Antrag digital vorbereiten oder amtliches Formular nutzen','Unterschriften und Nachweise gemäß Serviceportal prüfen'],
   'Geburtsurkunde und Einkommensnachweise, gegebenenfalls Angaben zu Mutterschaftsleistungen.',
   'Das Onlineverfahren und die erforderliche Unterschrift richten sich nach dem amtlichen Einreichungsweg; Bremen und Bremerhaven nicht gleichsetzen.'),
  service('childcare_search','Bremen: Krippe, Kindergarten und Tagespflege anmelden','Kita-Portal Bremen oder die Einrichtung beziehungsweise der örtliche Träger',
   'Das Bremer Serviceportal beschreibt die Onlineanmeldung. Einrichtungen außerhalb des Portals können ein eigenes Anmeldeverfahren verlangen.',
   'https://www.service.bremen.de/dienstleistungen/anmeldung-eines-kindes-in-der-krippe-dem-kindergarten-oder-bei-der-tagespflege-181851',
   ['Kita-Angebote und Teilnahme am Kita-Portal prüfen','Bei Teilnahme online vormerken, sonst Träger direkt kontaktieren','Örtliche Fristen und Platzvergabe verbindlich mit der Einrichtung klären'],
   'Je nach Einrichtung Kinderdaten, Sorgeberechtigte, Betreuungstermin und weitere Angaben.',
   'Die Fachseite bezieht sich auf die Stadtgemeinde Bremen; Verfahren in Bremerhaven gesondert klären.')
 ]},
 {code:'RP',coverage:'researched',services:[
  service('parental_allowance','Rheinland-Pfalz: Elterngeld bei Kreis- und Stadtverwaltung','Elterngeldstelle der örtlich zuständigen Kreis- oder Stadtverwaltung',
   'Das Landesministerium nennt die Elterngeldstellen der Kreis- und Stadtverwaltungen als Antragsbehörden. Die konkret zuständige Stelle folgt aus dem Wohnort.',
   'https://mkbwk.rlp.de/themen/familie/gute-zukunft-fuer-alle-kinder-und-eltern/finanzielle-leistungen/elterngeld',
   ['Kreis- oder Stadtverwaltung für den Wohnort ermitteln','Amtliches Formular und Angaben zu den Lebensmonaten prüfen','Geburts- und Einkommensnachweise mit dem Antrag übermitteln'],
   'Geburtsurkunde, Einkommen, Mutterschaftsgeldnachweise und weitere individuelle Anlagen.',
   'Das Landesministerium bewilligt nicht persönlich jeden Antrag; örtliche Elterngeldstelle und eventuelle Originalnachweise prüfen.'),
  service('childcare_search','Rheinland-Pfalz: Kita und Tagespflege finden','Örtliches Jugendamt und konkrete Einrichtung beziehungsweise Tagespflegestelle',
   'Das Serviceportal Rheinland-Pfalz erläutert die Beratung durch Jugendämter. Platzsuche und Aufnahme laufen je nach örtlichem Jugendamtsbezirk direkt oder über ein kommunales Onlineportal.',
   'https://service.rlp.de/detail?areaId=38265&ouId=&pstId=8969463',
   ['Örtliches Jugendamt über den Wohnort bestimmen','Mögliche Kita-Portale und Betreuungsangebote bei der Stelle erfragen','Für die ausgewählte Einrichtung Fristen, Betreuung und Anmeldung klären'],
   'Je nach örtlichem Verfahren Kinderdaten, gewünschter Zeitraum und Betreuungsumfang, gegebenenfalls Nachweise.',
   'Die Verfahren unterscheiden sich zwischen den Jugendamtsbezirken; keine einheitliche Onlineanmeldung annehmen.')
 ]},
 {code:'SL',coverage:'researched',services:[
  service('parental_allowance','Saarland: Elterngeld beim Landesamt für Soziales','Landesamt für Soziales, Elterngeldstelle Saarland',
   'Im Saarland ist das Landesamt für Soziales für die Gewährung von Elterngeld zuständig. Es gibt offizielle Informationen zu Antrag, Formularen und Onlineantrag.',
   'https://www.saarland.de/las/DE/themen/elterngeldstelle/elterngeld_antrag',
   ['Aktuelle Formulare oder amtlichen Onlineantrag nutzen','Geburts- und Einkommensangaben vorbereiten','Unterschrift und Übermittlung nach Anleitung des Landesamts prüfen'],
   'Geburtsurkunde, Einkommensunterlagen und je nach Fall weitere Leistungsnachweise.',
   'Ob ein Onlineformular abschließend elektronisch eingereicht werden kann, im aktuellen Antragsdienst prüfen.'),
  service('childcare_search','Saarland: Kita-Betreuung und Platzsuche','Kita-Träger, Kommune und zuständiger örtlicher Jugendhilfeträger',
   'Das Ministerium für Bildung und Kultur informiert über frühkindliche Bildung und Kita-Angebote. Die Anmeldung für einen konkreten Betreuungsplatz wird mit der Einrichtung beziehungsweise örtlichen Stelle geklärt.',
   'https://www.saarland.de/mbk/DE/portale/fruehkindliche-bildung/home',
   ['Einrichtungen und Träger am Wohnort suchen','Anmeldeverfahren und Betreuungszeiten direkt erfragen','Bei fehlendem Platz örtlichen Jugendhilfeträger um Beratung bitten'],
   'Je nach Einrichtung Angaben zum Kind, Sorgeberechtigten, Betreuungsbeginn und Umfang.',
   'Die verlinkte Landesseite ist ein fachlicher Überblick und kein landesweit verbindlicher Antragsdienst.')
 ]},
 {code:'ST',coverage:'researched',services:[
  service('parental_allowance','Sachsen-Anhalt: Elterngeld über Kreis- oder Stadtverwaltung','Elterngeldstelle des zuständigen Landkreises oder der kreisfreien Stadt',
   'Das Landesamt für Soziales, Jugend und Gesundheit erklärt die Zuständigkeit der Landkreise und kreisfreien Städte; eine amtliche Übersicht verlinkt die Elterngeldstellen.',
   'https://las.sachsen-anhalt.de/themen/landesjugendamt/familien-und-frauen/elterngeld-und-elternzeit/elterngeldstellen',
   ['Im Landesverzeichnis die Kreis- oder Stadtstelle ermitteln','Offiziellen Antrag und Bezugsmonate prüfen','Notwendige Nachweise bei der gewählten Stelle einreichen'],
   'Geburtsurkunde, Einkommensunterlagen und individuelle Anlagen nach den amtlichen Formularen.',
   'Das Landesamt ist nicht automatisch die Stelle, die den einzelnen Elterngeldantrag bewilligt.'),
  service('childcare_search','Sachsen-Anhalt: Kita-Verzeichnis und Jugendämter','Örtlicher Jugendhilfeträger und Einrichtungen in Landkreis oder kreisfreier Stadt',
   'Das Landesamt für Soziales, Jugend und Gesundheit bietet ein Kita-Verzeichnis nach Landkreisen und Städten. Die Anmeldung erfolgt nach den örtlichen Aufnahmeverfahren.',
   'https://las.sachsen-anhalt.de/themen/landesjugendamt/kinder-und-jugend/kindertageseinrichtungen/kita-verzeichnis-sachsen-anhalt',
   ['Landkreis beziehungsweise kreisfreie Stadt und Kitas auswählen','Träger nach freien Angeboten und Anmeldeweg fragen','Bei Problemen zuständiges Jugendamt kontaktieren'],
   'Angaben zum Kind, Betreuungswunsch und je nach Einrichtung weitere Unterlagen.',
   'Das Landesverzeichnis ist keine verbindliche Online-Reservierung oder Platzzusage.')
 ]},
 {code:'TH',coverage:'researched',services:[
  service('parental_allowance','Thüringen: Elterngeld bei Kreis- und Stadtstellen','Elterngeldstellen der Landkreise und kreisfreien Städte',
   'Das Thüringer Sozialministerium erklärt die örtliche Zuständigkeit und beschreibt einen elektronischen Assistenten für die Antragsvorbereitung, bei dem die Unterlagen üblicherweise ausgedruckt und unterschrieben versandt werden.',
   'https://soziales.thueringen.de/soziales/familie/finanzielle-hilfen',
   ['Zuständige Elterngeldstelle über Landkreis oder Stadt auswählen','Offiziellen Antragsassistenten oder Vordruck ausfüllen','Unterschrift, Zustellweg und erforderliche Belege prüfen'],
   'Geburtsnachweis, Einkommensunterlagen und weitere Antragsanlagen nach Sachverhalt.',
   'Der Antrag gilt nicht allein durch das Ausfüllen einer Online-Eingabemaske als eingereicht.'),
  service('childcare_search','Thüringen: Kindergartenplatz am Wohnort anmelden','Gemeinde, Träger der Einrichtung und gegebenenfalls örtliches Jugendamt',
   'Die Thüringer Landesverwaltung führt örtliche Leistungen zur Kita-Platzanmeldung. Im konkreten Verfahren müssen Gemeinde, Träger und verfügbarer Betreuungsplatz bestimmt werden.',
   'https://verwaltung.thueringen.de/',
   ['Gemeinde oder Stadt im amtlichen Verwaltungsportal auswählen','Kita-Anmeldedienst und zuständige Träger vor Ort ermitteln','Aktuelle Aufnahmebedingungen, Nachweise und Betreuungszeiten prüfen'],
   'Kinderdaten, Sorgeberechtigte, gewünschter Beginn und fallabhängige Nachweise.',
   'Das Portal ist ein Einstieg; kein landesweit einheitlicher Antrag und keine automatisch reservierte Kita.')
 ]},
 {code:'BW',coverage:'researched',services:[
  service('parental_allowance','Baden-Württemberg: Elterngeld bei der L-Bank','Landeskreditbank Baden-Württemberg (L-Bank)',
   'Die L-Bank nimmt in Baden-Württemberg Elterngeldanträge entgegen und bietet einen begleiteten Onlineantrag. Aktuelle Formulare und Nachweisanforderungen stehen auf ihrer offiziellen Leistungsseite.',
   'https://www.l-bank.de/produkte/familienfoerderung/elterngeld.html',
   ['Online-Antragsweg oder amtlichen Vordruck der L-Bank wählen','Geburtsnachweis und Angaben zum Einkommen vorbereiten','Antrag und erforderliche Nachweise über den angegebenen Einreichungsweg senden'],
   'Geburtsurkunde, Einkommensnachweise und je nach Erwerbssituation weitere Anlagen.',
   'Eine digitale Antragsvorbereitung ist nicht in jedem Fall eine vollständig elektronische Einreichung.'),
  service('childcare_search','Baden-Württemberg: Kita-Anmeldung nach Wohnort','Gemeinde, Stadtverwaltung, Träger oder konkrete Kindertageseinrichtung',
   'Das amtliche Serviceportal Baden-Württemberg erläutert die Anmeldung eines Kindes in einer Kindertageseinrichtung. Anmeldung und Platzsuche müssen je nach Gemeinde oder Träger durchgeführt werden.',
   'https://www.service-bw.de/zufi/leistungen/6028995',
   ['Kita-Angebote am Wohnort auswählen','Bei Kommune oder Einrichtung das örtliche Anmeldeverfahren klären','Nachweise, Betreuungsumfang und Platzvergabe nach lokalen Vorgaben prüfen'],
   'Je nach örtlichem Verfahren Angaben zum Kind, Sorgeberechtigung und gewünschtem Betreuungsbeginn.',
   'Eine bestimmte Kita-Zusage kann nicht allein aus dem Serviceportal abgeleitet werden.')
 ]},
 {code:'HE',coverage:'researched',services:[
  service('parental_allowance','Hessen: Elterngeld beim Versorgungsamt','Hessische Ämter für Versorgung und Soziales (HÄVS)',
   'Die hessischen Elterngeldstellen sind bei den Ämtern für Versorgung und Soziales angesiedelt. Das Regierungspräsidium Gießen erklärt Onlineantrag, Standorte und regionale Zuständigkeiten.',
   'https://rp-giessen.hessen.de/versorgung-und-familie/elterngeld/faq-elterngeld',
   ['Zuständiges Hessisches Amt für Versorgung und Soziales anhand des Wohnorts ermitteln','Amtlichen Onlineantrag oder Papierverfahren wählen','Einreichungsform, Unterschriften und Belege prüfen'],
   'Geburtsnachweis, Einkommensunterlagen und einzelfallabhängige weitere Erklärungen.',
   'Vollständig elektronische Abgabe und Originalnachweise hängen vom verwendeten Signaturweg ab.'),
  service('childcare_search','Hessen: Kita- und Tagespflegeberatung vor Ort','Gemeinde, Stadtverwaltung oder örtliches Jugendamt',
   'Das offizielle Verwaltungsportal Hessen nennt die örtliche Gemeinde- oder Stadtverwaltung und das Jugendamt als Anlaufstellen für Betreuungsangebote und mögliche Aufnahmeverfahren.',
   'https://verwaltungsportal.hessen.de/leistung?leistung_id=L100001_8966746',
   ['Wohnort auswählen und Einrichtungen ermitteln','Vor Ort verfügbare Plätze und Betreuungsmodelle erfragen','Lokale Anmeldung und eventuell nötige Unterlagen abstimmen'],
   'Je nach Ort Angaben zum Kind, gewünschte Betreuungszeit und Betreuungspersonen.',
   'Keine einheitliche landesweite Kita-Anmeldefrist oder verbindliche Platzvergabe behaupten.')
 ]},
 {code:'NI',coverage:'researched',services:[
  service('parental_allowance','Niedersachsen: Elterngeld bei kommunaler Stelle','Kommunale Elterngeldstelle der zuständigen Stadt oder des Landkreises',
   'Das niedersächsische Sozialministerium stellt klar, dass Elterngeld ausschließlich bei kommunalen Elterngeldstellen beantragt wird. Der Onlineantrag kann über mein-elterngeldantrag.de vorbereitet werden; die Umsetzung erfolgt schrittweise.',
   'https://www.ms.niedersachsen.de/themen/familie/elterngeld/das-elterngeld-13791.html',
   ['Landkreis oder Stadt als zuständige Elterngeldstelle ermitteln','Aktuellen Onlineantrag oder Landesformular prüfen','Antrag an die örtliche Stelle übermitteln und Nachweise gegebenenfalls nachreichen'],
   'Geburtsurkunde, Einkommensangaben sowie individuelle Anlagen gemäß dem örtlichen Antragsformular.',
   'Das Landesministerium ist nicht die Bewilligungsstelle. Digitale Übermittlung und erforderliche Unterschrift bei der örtlichen Stelle prüfen.'),
  service('childcare_search','Niedersachsen: Kita-Platz über Stadt oder Gemeinde','Örtliche Gemeinde- oder Stadtverwaltung sowie Jugendamt',
   'Die Platzsuche erfolgt über Gemeinden, Städte und Einrichtungen. Das amtliche Landesportal ist eine Einstiegsstelle für die Suche nach kommunalen Verfahren und Betreuungsangeboten.',
   'https://service.niedersachsen.de/',
   ['Wohnort auswählen und dortiges Kita-Portal oder Betreuungsverzeichnis suchen','Gewünschte Einrichtung beziehungsweise Kindertagespflege anfragen','Anmeldung und Platzvergabe beim zuständigen Träger prüfen'],
   'Je nach Kommune Daten zum Kind und Sorgeberechtigten, Beginn, Zeiten und eventuell weitere Nachweise.',
   'Es gibt keinen einzigen für alle Kommunen gültigen Onlineantrag oder einheitliche Anmeldefrist.')
 ]},
 {code:'SH',coverage:'researched',services:[
  service('parental_allowance','Schleswig-Holstein: Elterngeld bei Landesfamilienbüros','Landesamt für Arbeitsschutz, Soziales und Gesundheit (LASG), Landesfamilienbüros',
   'Das LASG erläutert den Elterngeldantrag und den regional zuständigen Landesfamilienbüro-Standort. Die Einreichung kann je nach Signatur und Unterlagen weiterhin Ausdruck oder Originalbelege erfordern.',
   'https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/LASG/Aufgaben/KinderUndEltern/KinderUndElternArtikelElterngeld',
   ['Das Landesfamilienbüro für die Wohnregion ermitteln','Amtlichen Online- oder Papierantrag und Bezugszeitraum wählen','Unterschrift und Originalunterlagen vor dem Versand prüfen'],
   'Geburtsnachweis, Einkommensunterlagen und im Einzelfall weitere Anlagen.',
   'Nicht jeden digital übermittelten Antrag als vollständig papierlos behandeln; aktuelle Anleitung des LASG beachten.'),
  service('childcare_search','Schleswig-Holstein: KitaPortal mit unverbindlicher Voranmeldung','KitaPortal Schleswig-Holstein und gewählte Kita oder Tagespflege',
   'Das landesweite KitaPortal ermöglicht die Suche nach Betreuungsangeboten und eine zunächst unverbindliche Online-Voranmeldung. Über den konkreten Platz entscheidet die Einrichtung oder die Tagespflegeperson.',
   'https://www.kitaportal-sh.de/de/home',
   ['Im KitaPortal Wohnort und gewünschte Betreuung auswählen','Unverbindliche Voranmeldung bei geeigneten Einrichtungen abgeben','Bei Zusage Betreuungsvertrag und Unterlagen direkt mit dem Träger klären'],
   'Für die Voranmeldung Angaben zum Kind, Sorgeberechtigten, gewünschte Betreuung und Kontaktdaten.',
   'Eine Voranmeldung oder Warteliste ist keine verbindliche Platzzusage.')
 ]},
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
 NW:['NRW','Nordrhein Westfalen','Köln','Koeln','Düsseldorf','Duesseldorf','Dortmund','Essen','Bochum','Bonn','Bielefeld'],
 HE:['Frankfurt am Main','Frankfurt Main','Kassel','Darmstadt'],
 BB:['Frankfurt Oder','Frankfurt an der Oder','Cottbus','Beeskow','Eisenhüttenstadt']
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
 const hints=[];
 for(const state of states){
   if(phrase(state.capital,q)||CITY_HINTS[state.code]?.some(city=>phrase(city,q)))
     hints.push(state);
 }
 if(matches.length){
   // „Sachsen-Anhalt“ enthält auch „Sachsen“: längster Bundeslandname gewinnt.
   const longest=Math.max(...matches.map(s=>clean(s.name).length));
   const selected=matches.filter(s=>clean(s.name).length===longest);
   if(selected.length!==1)return null;
   // Werden zwei unterschiedliche Länder genannt, keine Zuständigkeit erfinden.
   if(hints.some(s=>s.code!==selected[0].code))return null;
   return selected[0];
 }
 return hints.length===1?hints[0]:null;
}
