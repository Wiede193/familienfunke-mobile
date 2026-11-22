// Editorial information for disabled people and their families, 22 Nov 2026.
// Not diagnostic advice, not entitlement assessment, and no sensitive-data storage.
export const INCLUSION_CATEGORIES=[
 {id:'all',label:'Alle Themen'},
 {id:'first-steps',label:'Beratung & erste Schritte'},
 {id:'childhood',label:'Kita, Schule & Alltag'},
 {id:'benefits',label:'Leistungen & Anträge'},
 {id:'rights',label:'Rechte & Widerspruch'},
 {id:'leisure',label:'Freizeit & Barrieren'}
];
const source=(title,url)=>({title,url});
export const INCLUSION_ARTICLES=[
 {
  id:'independent-counsel',category:'first-steps',title:'Unabhängige Beratung finden (EUTB)',
  short:'Kostenfreie Beratung vor und während Anträgen, für Betroffene und Angehörige.',
  overview:'Die Ergänzende unabhängige Teilhabeberatung (EUTB) berät unabhängig von den Stellen, die Leistungen bewilligen oder anbieten. Die Beratung kann auch ohne Diagnose oder bereits beantragte Leistung eine erste Orientierung geben.',
  firstSteps:[
   'Im offiziellen EUTB-Beratungsatlas nach Ort oder gewünschter Beratungsform suchen.',
   'Vorab fragen, ob Beratung vor Ort, telefonisch, per Video, in Leichter Sprache oder mit Gebärdensprachdolmetschung möglich ist.',
   'Eigene Fragen notieren; ein Bescheid oder bereits eingereichter Antrag ist für eine erste Anfrage nicht zwingend erforderlich.',
   'Bei komplizierten Zuständigkeitsfragen um Begleitung zu Gesprächen und Hilfe bei der Antragssortierung bitten.'
  ],
  documents:'Für ein unverbindliches Erstgespräch meist keine Pflichtunterlagen. Vorliegende Bescheide und Schriftverkehr nur freiwillig mitnehmen.',
  responsible:'EUTB-Beratungsatlas; in Brandenburg ergänzend kommunale Behindertenbeauftragte.',
  caveat:'Beratungsstellen entscheiden nicht über die Leistung. Erreichbarkeit und Kommunikationsangebote vorher erfragen.',
  sources:[source('Bundesweite unabhängige EUTB-Beratung','https://www.teilhabeberatung.de/beratung/beratungsangebote-der-eutb'),
   source('Brandenburg: Menschen mit Behinderungen','https://masgz.brandenburg.de/masgz/de/themen/soziales/menschen-mit-behinderungen/')]
 },
 {
  id:'verfahrenslotse',category:'first-steps',title:'Verfahrenslotsen im Jugendamt',
  short:'Unterstützung für junge Menschen mit (drohender) Behinderung und ihre Familien.',
  overview:'Verfahrenslotsen nach § 10b SGB VIII begleiten Kinder, Jugendliche und junge Volljährige mit (drohender) Behinderung und ihre Familien auf dem Weg zu Eingliederungshilfeleistungen – unabhängig von der Frage, welcher Träger am Ende zuständig ist.',
  firstSteps:[
    'Beim Jugendamt des Wohnortes nach dem Verfahrenslotsen oder der Verfahrenslotsin fragen.',
    'Beschreiben, wo Teilhabe gerade scheitert: Kita, Schule, Freizeit, Mobilität, Kommunikation oder Alltag.',
    'Nach Zuständigkeit, Antrag, benötigten Unterlagen und Ansprechpartner der Eingliederungshilfe fragen.',
    'Bei Bedarf Begleitung bis zur Entscheidung und Hilfe beim Verständnis des Bescheids erbitten.'
  ],
  documents:'Eigene Problem- und Wunschliste, gegebenenfalls vorhandene Berichte, Schreiben oder Kita-/Schulstellungnahmen.',
  responsible:'Jugendamt am gewöhnlichen Aufenthaltsort; regionaler Wegweiser führt zu geprüften Kreisstellen.',
  caveat:'Ein Verfahrenslotse ersetzt keine Leistungsbewilligung und keine anwaltliche Beratung. Zuständigkeiten können wegen gesetzlicher Reformen geändert werden.',
  sources:[source('Familienportal – Hilfe im Alltag','https://familienportal.de/familienportal/lebenslagen/leben-mit-behinderung/hilfe-im-alltag'),
   source('Märkisch-Oderland – Verfahrenslotsen','https://www.maerkisch-oderland.de/leben-im-landkreis/leben-gesellschaft/jugend-familie/kontakte-jugendamt')]
 },
 {
  id:'early-intervention',category:'childhood',title:'Frühförderung und Entwicklungsbegleitung',
  short:'Unterstützung bereits vor der Einschulung, wenn Entwicklung oder Teilhabe beeinträchtigt sind.',
  overview:'Frühförderung kann Bewegung, Wahrnehmung, Sprache, Spiel, Lernen und soziale Entwicklung unterstützen. Es gibt heilpädagogische Förderung und je nach Bedarf interdisziplinäre Angebote; die Art der Finanzierung richtet sich nach der Leistung.',
  firstSteps:[
    'Mit Kinderärztin, Kinderarzt oder Frühförder- und Beratungsstelle über die beobachteten Schwierigkeiten sprechen.',
    'Nach einer entwicklungsorientierten Diagnostik, geeigneten Therapien oder einem Sozialpädiatrischen Zentrum fragen.',
    'Mit Frühförderstelle und Leistungsträger besprechen, ob eine Verordnung oder ein Antrag benötigt wird.',
    'Ziele und Umfang der Förderung mit Familie und Fachkräften gemeinsam festhalten; bei Änderungen erneut beraten lassen.'
  ],
  documents:'Mögliche Entwicklungsberichte, Befunde oder Förderpläne – nur soweit für die konkret beantragte Leistung erforderlich.',
  responsible:'Kinderarztpraxis, Frühförder-/Beratungsstelle, Sozialpädiatrisches Zentrum und je nach Leistung Krankenkasse oder Eingliederungshilfeträger.',
  caveat:'Eine formale Schwerbehinderung ist nicht mit allen Frühförderansprüchen gleichzusetzen. Nicht jede Fördermaßnahme wird aus demselben Leistungssystem bezahlt.',
  sources:[source('Familienportal – Hilfe im Alltag','https://familienportal.de/familienportal/lebenslagen/leben-mit-behinderung/hilfe-im-alltag'),
    source('Brandenburg: Überregionale Arbeitsstelle Frühförderung','https://lavg.brandenburg.de/lavg/de/gesundheit/oeffentlicher-gesundheitsdienst/netzwerke/angebotskompass/interaktive-uebersicht/angebot-ansicht/~22fdc82c2529-ueberregionale-arbeitsstelle-fruehfoerderung-brandenburg-ueafb')]
 },
 {
  id:'inclusive-kita',category:'childhood',title:'Inklusive Kita und Kita-Assistenz',
  short:'Betreuungsplatz, besondere Förderung und persönliche Assistenz sind getrennt zu prüfen.',
  overview:'Kinder mit Behinderung können eine gemeinsame Betreuung mit anderen Kindern besuchen. Benötigt ein Kind zusätzliche Assistenz oder heilpädagogische Unterstützung, kann je nach Bedarf Eingliederungshilfe in Betracht kommen. Ein gewöhnlicher Kita-Antrag ersetzt nicht automatisch den Antrag auf Teilhabeleistung.',
  firstSteps:[
    'Bei Kommune oder Kita-Träger Betreuungsplatz und gegebenenfalls erweiterten Umfang klären.',
    'Mit der Kita den konkreten Unterstützungsbedarf besprechen, ohne mehr medizinische Informationen zu offenbaren als nötig.',
    'Bei Assistenzbedarf Jugendamt, Eingliederungshilfeträger oder Verfahrenslotsen nach dem zuständigen Antragsweg fragen.',
    'Erfragen, wer bewilligt, finanziert und die Assistenz organisiert und wie der Übergang in den Alltag begleitet wird.'
  ],
  documents:'Je nach Leistung Betreuungsantrag, Entwicklungs-/Förderbeschreibung und gegebenenfalls fachliche Stellungnahme.',
  responsible:'Kita-Träger / Kommune für Platz; Jugendamt oder örtlich zuständiger Eingliederungshilfeträger für zusätzliche Teilhabe.',
  caveat:'„Integrationskita“ ist kein automatischer Nachweis, dass jede Unterstützung vorhanden ist. Geeignete Rahmenbedingungen und tatsächliche Barrieren individuell prüfen.',
  sources:[source('Brandenburg – Einrichtungen für Kinder mit besonderem Förderbedarf','https://mbjs-fachportal.brandenburg.de/kindertagesbetreuung/kita-betriebserlaubniserteilung/einrichtungen-fuer-kinder-mit-besonderem-foerderbedarf.html'),
    source('Familienportal – Hilfen in Kita und Schule','https://familienportal.de/familienportal/lebenslagen/leben-mit-behinderung/hilfe-im-alltag')]
 },
 {
  id:'school-support',category:'childhood',title:'Schulbegleitung und inklusive Schule',
  short:'Beschulung, sonderpädagogische Förderung und persönliche Assistenz unterscheiden.',
  overview:'Sonderpädagogische Unterstützung in der Schule und eine eventuell erforderliche individuelle Schulbegleitung können über unterschiedliche Stellen laufen. Bei seelischer Behinderung können andere Leistungsträger zuständig sein als bei körperlicher oder geistiger Behinderung.',
  firstSteps:[
    'Mit Schule und sonderpädagogischer Förder- und Beratungsstelle klären, welche Unterstützung die Schule selbst leisten kann.',
    'Konkrete Teilhabehindernisse im Schulalltag und notwendige Hilfen dokumentieren.',
    'Bei zusätzlichem Assistenzbedarf an Jugendamt, Eingliederungshilfeträger oder Verfahrenslotsen wenden.',
    'Vor der Entscheidung Förderplanung, Bewilligungszeitraum, Vertretung bei Ausfall und Übergang zum Hort besprechen.'
  ],
  documents:'Schulbesuchs- und gegebenenfalls Förderunterlagen, konkrete Aufgabenbeschreibung, relevante fachliche Einschätzungen.',
  responsible:'Schule/Schulamt für pädagogische Förderung; je nach Fall Jugendamt oder Eingliederungshilfeträger für Teilhabe-Assistenz.',
  caveat:'Ein Attest allein begründet nicht automatisch eine bestimmte Stundenzahl. Individuelle Bedarfsermittlung und Bescheid sind maßgeblich.',
  sources:[source('Brandenburg – sonderpädagogische Förder- und Beratungsstellen','https://mbjs.brandenburg.de/bildung/allgemeinbildende-schulen/gemeinsamer-unterricht-und-foerderschulen/sonderpaedagogische-foerder-und-beratungsstellen.html'),
   source('Familienportal – Hilfen im Alltag','https://familienportal.de/familienportal/lebenslagen/leben-mit-behinderung/hilfe-im-alltag')]
 },
 {
  id:'integration-assistance',category:'benefits',title:'Eingliederungshilfe / Teilhabe nach SGB IX',
  short:'Individuelle Leistungen für Bildung, soziale Teilhabe und weitere Lebensbereiche.',
  overview:'Eingliederungshilfe unterstützt Menschen mit Behinderungen, gleichberechtigt an Alltag, Bildung und Gesellschaft teilzunehmen. Die zuständige Stelle, Voraussetzungen, Kostenbeteiligung und Nachweise hängen von Leistung und Situation ab.',
  firstSteps:[
    'Ziel und Teilhabebarriere möglichst konkret benennen: Was soll im Alltag möglich werden und was steht bisher im Weg?',
    'Zuständigen Eingliederungshilfeträger oder Verfahrenslotsen erfragen; im Zweifel eine unabhängige EUTB hinzunehmen.',
    'Antrag stellen, Eingangsbestätigung und Datum sichern. Im Landkreis Oder-Spree ist ein zunächst formloser Antrag möglich.',
    'Bedarfsermittlung und Teilhabeplanung aktiv begleiten; Bescheid, Leistungsumfang und Beginn schriftlich prüfen.'
  ],
  documents:'Je nach Bedarf Angaben zur Teilhabesituation, gegebenenfalls vorhandene fachliche Befunde, Berichte, Leistungs- und Einkommensunterlagen, wenn rechtlich erforderlich.',
  responsible:'Örtlicher Träger der Eingliederungshilfe beziehungsweise nach Art der Behinderung oder gesetzlichen Regeln zuständiger Jugendhilfeträger.',
  caveat:'Eingliederungshilfe ist NICHT dasselbe wie Feststellung des GdB oder Pflegegrad. Die Leistungen sind individuell; pauschale Zusagen sind nicht seriös.',
  sources:[source('BMAS – Leistungen nach SGB IX','https://www.bmas.de/DE/Soziales/Teilhabe-und-Inklusion/Politik-fuer-Menschen-mit-Behinderungen/Leistungen-nach-dem-SGB-IX/leistungen-nach-dem-sgb-ix.html'),
    source('Oder-Spree – Antrag Eingliederungshilfe','https://www.landkreis-oder-spree.de/Bildung-Soziales/Soziales/Eingliederungshilfe/')]
 },
 {
  id:'care-grade',category:'benefits',title:'Pflegegrad für ein Kind beantragen',
  short:'Pflegeversicherung beurteilt zusätzlichen Hilfebedarf gegenüber gleichaltrigen Kindern.',
  overview:'Ein Pflegegrad hängt vom tatsächlichen Unterstützungsbedarf ab, nicht allein vom Namen einer Diagnose. Bei Kindern wird ihre Selbstständigkeit mit der altersentsprechend entwickelter Kinder verglichen.',
  firstSteps:[
    'Bei der Pflegekasse (meist bei der Krankenkasse) beziehungsweise privaten Pflegepflichtversicherung einen Antrag auf Pflegeleistungen stellen und das Datum notieren.',
    'Den täglichen zusätzlichen Hilfebedarf mehrere Tage sachlich dokumentieren: Körperpflege, Ernährung, Kommunikation, nächtliche Hilfen, medizinisch bedingte Anforderungen.',
    'Bei Begutachtung vorhandene Berichte bereithalten, die reale Alltagssituation beschreiben und altersübliche Hilfe von zusätzlicher Hilfe unterscheiden.',
    'Gutachten und Bescheid anfordern; bei zu niedrigem Pflegegrad oder Ablehnung fristgerecht Widerspruch prüfen.'
  ],
  documents:'Pflegeantrag, relevante Berichte, Medikamenten-/Therapieübersicht, Alltagstagebuch – nur benötigte Daten mit der Pflegekasse teilen.',
  responsible:'Pflegekasse oder privates Pflegeversicherungsunternehmen; Begutachtung je nach System durch zuständigen Prüfdienst.',
  caveat:'GdB und Pflegegrad sind getrennte Entscheidungen. Ein Pflegegrad führt nicht automatisch zu einem Schwerbehindertenausweis und umgekehrt.',
  sources:[source('gesund.bund.de – Pflegebedürftigkeit bei Kindern','https://gesund.bund.de/pflege-von-kindern'),
   source('gesund.bund.de – Pflegeleistungen beantragen','https://gesund.bund.de/pflegeleistungen-beantragen')]
 },
 {
  id:'gdb-application',category:'benefits',title:'Grad der Behinderung und Ausweis beantragen',
  short:'Feststellung des GdB, möglicher Merkzeichen und Schwerbehindertenausweis in Brandenburg.',
  overview:'Das Landesamt für Soziales und Versorgung (LASV) prüft in Brandenburg auf Antrag den Grad der Behinderung und mögliche Merkzeichen. Ein Schwerbehindertenausweis ist bei festgestelltem GdB von mindestens 50 möglich.',
  firstSteps:[
    'Beim LASV den Online-Antrag auf Feststellung oder Neufeststellung nach § 152 SGB IX oder das offizielle Papierformular wählen.',
    'Behandelnde Praxen/Kliniken und vorhandene Befunde zusammenstellen; Einwilligungen und Datenschutzinformationen prüfen.',
    'Auch die tatsächlichen Einschränkungen im Alltag beschreiben; Diagnosen allein sagen nicht alles über Teilhabe aus.',
    'Feststellungsbescheid und Merkzeichen prüfen. Bei GdB ab 50 kann ein Schwerbehindertenausweis beantragt werden; vorhandene Nachteilsausgleiche gesondert klären.'
  ],
  documents:'Antragsformular, relevante Behandlungsstellen, Befunde, datenschutzrechtliche Erklärungen. Nicht ungefragt vollständige Patientenakten veröffentlichen.',
  responsible:'LASV Brandenburg – Schwerbehindertenrecht.',
  caveat:'Wichtig: Das LASV weist für seinen Online-Antrag selbst auf Einschränkungen der digitalen Barrierefreiheit hin. Bei Bedienungsbarrieren Papierweg oder Unterstützung beim LASV erfragen.',
  sources:[source('LASV – Onlineantrag und Feststellung','https://lasv.brandenburg.de/lasv/de/schwerbehinderung/'),
    source('LASV – Papierformular','https://lasv.brandenburg.de/lasv/de/publikationen/detail/~20-09-2024-antrag-nach-152-des-neunten-buches-sozialgesetzbuch-sgb-ix-schwerbehindertenrecht'),
    source('LASV – Barrierefreiheit des Online-Antrags','https://lasv.brandenburg.de/lasv/de/allgemein/barrierefreiheit-online-antrag-nach-dem-schwerbehindertenrecht-sgb-ix/')]
 },
 {
  id:'personal-budget',category:'benefits',title:'Persönliches Budget als Leistungsform',
  short:'Bewilligte Teilhabeleistungen gegebenenfalls selbstbestimmt organisieren.',
  overview:'Statt bestimmter Sach- oder Dienstleistungen können geeignete Teilhabeleistungen als Persönliches Budget beantragt werden. Damit können Leistungsberechtigte Unterstützung selbst organisieren; es entstehen aber auch Pflichten und Risiken.',
  firstSteps:[
    'Zunächst Bedarf und mögliche Teilhabeleistung mit der zuständigen Stelle und einer unabhängigen Beratung klären.',
    'Fragen, ob die Leistung als Persönliches Budget erbracht werden kann und wie das Antragsverfahren aussieht.',
    'Ziele, benötigte Leistungen, Leistungsnachweise und Verantwortlichkeiten vor einer Zielvereinbarung verstehen.',
    'Besprechen, welche organisatorischen Aufgaben, Abrechnungen und Vertretungsregeln entstehen.'
  ],
  documents:'Antrag und Unterlagen zur jeweiligen Teilhabeleistung; gegebenenfalls Zielvereinbarung und nachgewiesene Unterstützungsbedarfe.',
  responsible:'Je nach bewilligbarer Leistung zuständiger Reha-/Eingliederungshilfeträger; bei trägerübergreifenden Budgets Kooperation mehrerer Stellen.',
  caveat:'Es ist nicht einfach zusätzliches frei verfügbares Geld. Einkommen/Vermögen und Zweckbindung können leistungsabhängig relevant sein.',
  sources:[source('BMAS – Persönliches Budget','https://www.bmas.de/DE/Soziales/Teilhabe-und-Inklusion/Rehabilitation-und-Teilhabe/Persoenliches-Budget/persoenliches-budget.html'),
    source('BMAS – Fragen und Antworten','https://www.bmas.de/DE/Soziales/Teilhabe-und-Inklusion/Rehabilitation-und-Teilhabe/Persoenliches-Budget/Fragen-und-Antworten/faq-persoenliches-budget.html')]
 },
 {
  id:'kindergeld-disability',category:'benefits',title:'Kindergeld bei Behinderung über das 25. Lebensjahr',
  short:'Unter bestimmten Voraussetzungen ohne feste obere Altersgrenze möglich.',
  overview:'Für volljährige Kinder mit Behinderung kann auch nach dem 25. Geburtstag Kindergeld bestehen, wenn die gesetzlichen Voraussetzungen erfüllt sind. Dazu gehört insbesondere, dass die Behinderung vor Vollendung des 25. Lebensjahrs eingetreten ist und das Kind nicht selbst für seinen Lebensunterhalt sorgen kann.',
  firstSteps:[
    'Bei der Familienkasse die besonderen Voraussetzungen für Kindergeld bei Behinderung erfragen.',
    'Zeitpunkt des Eintritts der Behinderung und wirtschaftliche Situation des Kindes dokumentieren.',
    'Erforderliche Formulare und Nachweise der Familienkasse beschaffen.',
    'Bescheid prüfen; andere Sozialleistungen und die Frage, an wen Kindergeld ausgezahlt wird, bei Bedarf gesondert beraten lassen.'
  ],
  documents:'Je nach Situation Nachweise zu Behinderung, Zeitpunkt des Eintritts und Einkommen/Unterhalt.',
  responsible:'Familienkasse der Bundesagentur für Arbeit.',
  caveat:'Kein automatischer Anspruch allein wegen eines GdB oder einer Diagnose; Anspruchsvoraussetzungen sind im Einzelfall zu prüfen.',
  sources:[source('Familienportal – Kindergeld bei Behinderung','https://familienportal.de/familienportal/familienleistungen/kindergeld/familiensituation/wie-lange-kann-ich-kindergeld-bekommen-wenn-mein-kind-eine-behinderung-hat--124952')]
 },
 {
  id:'objections',category:'rights',title:'Widerspruch gegen Leistungsbescheide',
  short:'Ablehnung oder zu niedrige Bewilligung prüfen, Frist sichern, Begründung nachreichen.',
  overview:'Wenn eine Behörde oder Pflegekasse eine Leistung ablehnt oder einschränkt, enthält der Bescheid grundsätzlich Hinweise zum Rechtsbehelf. Häufig beträgt die Frist einen Monat, doch Rechtsweg und Fristbeginn hängen vom jeweiligen Bescheid und Zustellung ab.',
  firstSteps:[
    'Bescheid, Eingangsdatum und Rechtsbehelfsbelehrung sichern. Frist nicht anhand einer pauschalen Erinnerung schätzen.',
    'Falls erforderlich fristwahrend schriftlich Widerspruch einlegen; zulässige Formen anhand der Belehrung prüfen.',
    'Akteneinsicht und ein aussagekräftiges Gutachten prüfen lassen; konkret schildern, welche tatsächlichen Einschränkungen übersehen wurden.',
    'Bei Rechtsfragen unabhängige Sozialberatung, Verband oder fachkundige anwaltliche Beratung hinzuziehen.'
  ],
  documents:'Bescheid mit Rechtsbehelfsbelehrung, Zustellungsnachweis, relevante Befunde und fachliche Stellungnahmen.',
  responsible:'Die im jeweiligen Bescheid genannte Widerspruchsstelle; bei Pflegegrad üblicherweise die Pflegekasse.',
  caveat:'Die App berechnet KEINE verbindlichen Fristen und versendet KEINEN Widerspruch. Bei Fristzweifeln sofort offiziell beraten lassen.',
  sources:[source('gesund.bund.de – Widerspruch Pflegekasse','https://gesund.bund.de/vorgehen-gegen-bescheid-der-pflegekasse'),
    source('LASV – Fragen und Antworten','https://lasv.brandenburg.de/lasv/de/lasv-stellt-sich-vor/fragen-und-antworten/fragen-und-antworten-zum-schwerbehindertenrecht/')]
 },
 {
  id:'rights-and-complaints',category:'rights',title:'Diskriminierung und Beschwerdewege in Brandenburg',
  short:'Kommunale und Landesbehindertenbeauftragte, Clearingstelle und Beratungsstellen.',
  overview:'Bei Benachteiligung oder unzureichender Barrierefreiheit kann eine Beschwerde und Beratung sinnvoll sein. In Brandenburg gibt es die Landesbehindertenbeauftragte Stelle, kommunale Ansprechstellen und eine Clearingstelle für bestimmte Streitfälle zur Eingliederungshilfe.',
  firstSteps:[
    'Die Barriere möglichst genau beschreiben: Ort/Service, Datum, Auswirkungen und gewünschte Änderung.',
    'Zunächst die verantwortliche Einrichtung oder zuständige Behörde um eine Lösung bitten.',
    'Bei Fragen zu Landesbehörden, Teilhabe oder Barrierefreiheit die zuständige Behindertenbeauftragten-Stelle kontaktieren.',
    'Bei Streit zu Eingliederungshilfe prüfen, ob die Clearingstelle nach ihrem gesetzlichen Auftrag zuständig ist; Rechtsmittelfristen unabhängig davon beachten.'
  ],
  documents:'Sachliche Beschreibung, gegebenenfalls Korrespondenz und Bescheid. Gesundheits- und Personendaten nur über geeignete sichere Kanäle übermitteln.',
  responsible:'Kommunale Behindertenbeauftragte, Landesbehindertenbeauftragter, Clearingstelle oder EUTB; je nach Sachverhalt auch andere Stellen.',
  caveat:'Clearing und Beschwerde ersetzen keine rechtzeitige Einlegung eines Rechtsbehelfs.',
  sources:[source('Brandenburg – Landesbehindertenbeauftragter','https://masgz.brandenburg.de/masgz/de/beauftragte/landesbehindertenbeauftragter/'),
    source('Brandenburg – Clearingstelle BTHG','https://masgz.brandenburg.de/masgz/de/beauftragte/landesbehindertenbeauftragter/clearingstelle-bundesteilhabegesetz/')]
 },
 {
  id:'accessible-outings',category:'leisure',title:'Barrierearme Familienausflüge planen',
  short:'Stufenloser Zugang, Toiletten, Sinnesangebote und Anreise getrennt prüfen.',
  overview:'„Barrierefrei“ ist keine einzige allgemeingültige Eigenschaft. Für einen gelingenden Ausflug können beispielsweise stufenlose Routen, Aufzüge, barrierefreie Toiletten, Ruhebereiche, Leichte Sprache, visuelle/taktile Orientierung und Anreise entscheidend sein.',
  firstSteps:[
    'In der Familienkarte die nach Quelle belegten Zugangsinformationen des Ziels lesen.',
    'Vor dem Besuch nach individuellen Kriterien fragen: Breite der Wege/Türen, Steigungen, Sanitäranlagen, Aufzüge und befahrbare Attraktionen.',
    'Auch kommunikative und sensorische Bedürfnisse berücksichtigen: Hör-/Sehhilfen, einfache Sprache, reizärmere Zeiten, Assistenzhund-Regelungen.',
    'Anreise, öffentlicher Nahverkehr, Parkmöglichkeiten, Begleitperson, Ticketregeln und Ersatzplan für Wetter prüfen.'
  ],
  documents:'Für eine normale Anfrage keine medizinischen Nachweise; mögliche Nachteilsausweise nur für konkrete Ermäßigungen erforderlich, Bedingungen beim Anbieter prüfen.',
  responsible:'Betreiber des Ausflugsziels sowie Tourismus-Marketing Brandenburg und örtliche Tourismusinformationen.',
  caveat:'Nicht bestätigt bedeutet nicht „nicht barrierefrei“. Barrierefreie Ausstellung bedeutet nicht automatisch, dass jeder Außenweg oder jede Attraktion zugänglich ist.',
  sources:[source('TMB – Barrierefreie Ausflugsziele Brandenburg','https://tourismusnetzwerk-brandenburg.de/barrierefreie-ausflugsziele-brandenburg'),
    source('Reiseland Brandenburg – Mobilitätseinschränkungen','https://www.reiseland-brandenburg.de/brandenburg-fuer/menschen-mit-handicap/mobilitaetseinschraenkungen/')]
 },
 {
  id:'inclusive-leisure',category:'leisure',title:'Freizeit, Sport und Gemeinschaft gestalten',
  short:'Nicht nur bauliche Barrieren, sondern auch Teilhabe und Entlastung bedenken.',
  overview:'Ein inklusiver Familienalltag umfasst Freundschaften, Kultur, Sport, Spiel, Ausflüge und selbstbestimmte Entscheidungen. Unterstützungsbedarf muss nicht öffentlich im Profil genannt werden, um teilnehmen zu können.',
  firstSteps:[
    'Beim Verein oder Veranstalter nach individuellen Zugangs- und Assistenzmöglichkeiten fragen.',
    'Ggf. Leistungen sozialer Teilhabe oder familienunterstützende Dienste mit unabhängiger Beratung besprechen.',
    'Bei Gruppenangeboten klare Informationen zu Lautstärke, Pausen, Toiletten, Begleitpersonen und Kommunikationsformen erfragen.',
    'Angebote vergleichen und freiwillig Feedback geben, welche Barrieren im Alltag auftreten.'
  ],
  documents:'Meist keine für eine Anfrage. Bei Förderung den konkreten Teilhabebedarf und die jeweils erforderlichen Nachweise mit dem Träger klären.',
  responsible:'Vereine/Anbieter, Träger der Eingliederungshilfe und EUTB-Beratungsstellen.',
  caveat:'Es gibt noch keine gesonderten geschützten Inklusionsgruppen in Familienfunke; keine medizinischen Angaben in öffentlichen Beiträgen erforderlich.',
  sources:[source('Familienportal – Hilfe im Alltag','https://familienportal.de/familienportal/lebenslagen/leben-mit-behinderung/hilfe-im-alltag'),
    source('BMAS – Rehabilitation und Teilhabe','https://www.bmas.de/DE/Soziales/Teilhabe-und-Inklusion/Rehabilitation-und-Teilhabe/rehabilitation-und-teilhabe.html')]
 }
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function findInclusionArticles(query='',category='all'){
 const q=norm(query);
 return INCLUSION_ARTICLES.filter(a=>(category==='all'||a.category===category) &&
   (!q||norm([a.title,a.short,a.overview,a.responsible,...a.firstSteps].join(' ')).includes(q)));
}
