
/* Familienfunke – redaktionell verfasste, nicht kommerzielle Familienhilfen.
   Bund-/Landesregeln und individuelle Anträge sind nicht identisch. Kein Gesundheitsprofil. */
export const FAMILY_TOPIC_CATEGORIES=[
 {id:'all',label:'Alle Themen'},
 {id:'money',label:'Geld & Leistungen'},
 {id:'care',label:'Betreuung & Alltag'},
 {id:'relationships',label:'Erziehung & Familie'},
 {id:'wellbeing',label:'Gesund aufwachsen'}
];
const source=(title,url)=>({title,url});
export const FAMILY_TOPIC_ARTICLES=[
 {
  id:'kinderzuschlag',category:'money',title:'Kinderzuschlag: Wenn das Einkommen knapp ist',
  short:'Zusätzliche Familienleistung prüfen, auch wenn ihr arbeitet.',
  overview:'Der Kinderzuschlag kann Familien und Alleinerziehende unterstützen, deren Einkommen zwar für sie selbst, aber nicht für den Bedarf der gesamten Familie reicht. Er wird bei der Familienkasse beantragt. Ob ein Anspruch besteht, hängt unter anderem von Einkommen, Wohnkosten, Kindergeldbezug und Familienkonstellation ab.',
  steps:[
   'Im offiziellen Familienportal die grundsätzlichen Voraussetzungen lesen und den KiZ-Lotsen der Familienkasse nutzen.',
   'Nachsehen, welche Einkommens- und Wohnkostennachweise für den konkreten Antrag benötigt werden.',
   'Kinderzuschlag bei der Familienkasse beantragen und fehlende Dokumente gegebenenfalls nachreichen.',
   'Parallel Wohngeld und Bildungs- und Teilhabeleistungen prüfen; Bescheid und Bewilligungszeitraum beachten.'
  ],
  responsible:'Familienkasse der Bundesagentur für Arbeit. Wohngeldstelle und BuT-Stelle sind gesondert zuständig.',
  documents:'Je nach Familienlage Einkommensnachweise, Miet-/Wohnkostennachweise, Angaben zu Kindern, Partnern und bestehenden Leistungen.',
  caveat:'Nicht jedes niedrige Einkommen führt automatisch zu Kinderzuschlag. Bedarf, Mindestvoraussetzungen, laufende Rechtsänderungen und Wechselwirkungen mit anderen Leistungen individuell prüfen.',
  sources:[source('Familienportal des Bundes – Kinderzuschlag','https://familienportal.de/familienportal/familienleistungen/kinderzuschlag'),
    source('Arbeitsagentur – Familien und Kinder','https://www.arbeitsagentur.de/familie-und-kinder')]
 },
 {
  id:'bildung-teilhabe',category:'money',title:'Bildung und Teilhabe: Ausflüge, Essen, Verein',
  short:'Hilfe bei Schul- und Kitaausflügen, Mittagessen und Freizeit.',
  overview:'Leistungen für Bildung und Teilhabe (BuT) sollen Kindern aus Familien mit bestimmten Sozialleistungsbezügen die Teilnahme am schulischen und sozialen Leben ermöglichen. Dazu gehören je nach Einzelfall Ausflüge, gemeinsames Mittagessen, Lernförderung, Schülerbeförderung und Freizeitaktivitäten.',
  steps:[
   'Prüfen, ob die Familie beispielsweise Kinderzuschlag, Wohngeld oder eine andere im Familienportal genannte Leistung bezieht.',
   'Bei Schule, Kita oder Sportverein die konkreten Kosten sowie benötigte Nachweise erfragen.',
   'Zuständige BuT-Stelle beim Jobcenter, Landkreis oder der Stadt ermitteln; Verfahren hängt von der Grundleistung ab.',
   'Leistungsanspruch und Zeitpunkt der Übernahme vorher klären, besonders vor Ausflügen oder Vereinsanmeldungen.'
  ],
  responsible:'Je nach Grundleistung Jobcenter, Kreisverwaltung oder Stadtverwaltung am Wohnort.',
  documents:'Nachweis der anspruchsbegründenden Leistung, gegebenenfalls Schul-/Kitabescheinigungen, Angaben zu Ausflug, Mittagessen, Lernförderung oder Vereinsbeiträgen.',
  caveat:'BuT ist nicht automatisch eine Erstattung jedes privaten Familienausflugs. Zuständigkeit, Altersgrenzen, Lernförderung und Antragsschritte unterscheiden sich.',
  sources:[source('Familienportal – Bildung und Teilhabe','https://familienportal.de/familienportal/familienleistungen/bildung-und-teilhabe')]
 },
 {
  id:'wohngeld',category:'money',title:'Wohngeld für Familien prüfen',
  short:'Möglicher Miet- oder Lastenzuschuss abhängig von Einkommen und Haushalt.',
  overview:'Wohngeld ist ein staatlicher Zuschuss zu Wohnkosten für Haushalte mit begrenztem Einkommen. Ob er infrage kommt, hängt unter anderem von der Haushaltsgröße, dem Einkommen, dem Wohnort und der Miete beziehungsweise Eigentumsbelastung ab.',
  steps:[
   'Beim amtlichen Wohngeldportal die Grundvoraussetzungen und die örtlich zuständige Wohngeldstelle ermitteln.',
   'Einkommen aller maßgeblichen Haushaltsmitglieder sowie Miet- oder Belastungsdaten zusammentragen.',
   'Den Antrag frühzeitig stellen und gegebenenfalls fehlende Unterlagen nachreichen.',
   'Bei Kinderzuschlag und Bildung/Teilhabe prüfen, wie Leistungen zusammenspielen und welche Bescheide erforderlich sind.'
  ],
  responsible:'Wohngeldbehörde der Gemeinde, Stadt oder des Landkreises nach Wohnort.',
  documents:'Je nach Verfahren Mietvertrag, Mietbescheinigung oder Belastungsnachweise, Einkommensunterlagen und Angaben zu Haushaltsmitgliedern.',
  caveat:'Wohngeld wird im Regelfall ab dem Antragsmonat und nicht rückwirkend gezahlt. Bei bestimmten anderen Transferleistungen mit berücksichtigten Unterkunftskosten ist der Wohngeldbezug regelmäßig ausgeschlossen.',
  sources:[source('Familienportal – Wohngeld','https://familienportal.de/familienportal/familienleistungen/weitere-leistungen/wohngeld')]
 },
 {
  id:'kita-platz-finden',category:'care',title:'Kita-Platz finden und Anmeldung vorbereiten',
  short:'Platzsuche, Kindertagespflege und individuelle Bedarfe strukturieren.',
  overview:'In Deutschland besteht grundsätzlich ab Vollendung des ersten Lebensjahres ein Anspruch auf frühkindliche Förderung in einer Tageseinrichtung oder Kindertagespflege. Die konkrete Anmeldung, das Verfahren bei Platzmangel und zusätzliche Betreuung hängen vom Bundesland und Wohnort ab.',
  steps:[
   'Bei Stadt, Gemeinde oder Jugendamt das tatsächlich geltende Anmeldeverfahren und mögliche Anmeldezeiträume erfragen.',
   'Kitas und Kindertagespflege vergleichen: Wege, Öffnungszeiten, inklusive Angebote, Eingewöhnung und Elternbeiträge.',
   'Bedarfe, Kontaktversuche und Eingangsbestätigungen dokumentieren, besonders wenn noch kein Platz angeboten wurde.',
   'Bei fehlendem Platz den örtlichen Jugendhilfeträger rechtzeitig um Beratung und konkrete Unterstützung bitten.'
  ],
  responsible:'Örtlich zuständiges Jugendamt, Kommune und jeweiliger Kita- oder Kindertagespflege-Träger.',
  documents:'Je nach Gemeinde etwa Anmeldeunterlagen, Bedarfserklärung, Geburtsnachweis und gegebenenfalls Unterlagen für zusätzliche Betreuungszeit.',
  caveat:'Der bundesweite Förderanspruch ersetzt keine sofortige Platzzusage in einer beliebigen Kita. Landesrechtliche Details und individuelle Bedarfe sind maßgeblich.',
  sources:[source('Familienportal – Kinderbetreuung','https://familienportal.de/familienportal/lebenslagen/ausbildung-beruf/kinderbetreuung'),
    source('Brandenburg – Kita-Anmeldung und Rechtsanspruch','https://mbjs.brandenburg.de/kinder-und-jugend/kindertagesbetreuung/rechtsanspruch-und-anmeldung.html')]
 },
 {
  id:'unterhaltsvorschuss',category:'money',title:'Unterhaltsvorschuss bei ausbleibendem Unterhalt',
  short:'Orientierung für Alleinerziehende, wenn der Kindesunterhalt ausfällt.',
  overview:'Unterhaltsvorschuss kann die finanzielle Lage eines Kindes absichern, wenn ein unterhaltspflichtiger Elternteil keinen, zu wenig oder unregelmäßig Unterhalt zahlt. Das Jugendamt ist die übliche Anlaufstelle für Antrag und Beratung.',
  steps:[
   'Beim zuständigen Jugendamt die Unterhaltsvorschussstelle und ihre aktuellen Formulare finden.',
   'Unterhaltszahlungen, Wohnsituation und Angaben zu beiden Elternteilen wahrheitsgemäß zusammenstellen.',
   'Antrag möglichst zeitnah stellen, Eingangsdatum dokumentieren und Rückfragen beantworten.',
   'Bei Konflikten zusätzlich kostenlose Beratung zum Kindesunterhalt und eventuell eine Beistandschaft prüfen.'
  ],
  responsible:'Unterhaltsvorschussstelle beim Jugendamt der Stadt oder des Landkreises.',
  documents:'Je nach Fall Geburtsurkunde, Identitätsdaten, Nachweis zu Unterhaltszahlungen, Bankverbindung und Angaben zum getrennt lebenden Elternteil.',
  caveat:'Anspruch, Mitwirkung, Anrechnung anderer Leistungen und Nachzahlungen hängen vom Einzelfall ab; eine Trennung führt nicht automatisch zu Unterhaltsvorschuss.',
  sources:[source('Familienportal – Unterhaltsvorschuss','https://familienportal.de/familienportal/familienleistungen/unterhaltsvorschuss'),
    source('Familienportal – Getrennt und alleinerziehend','https://familienportal.de/familienportal/lebenslagen/trennung/allein-und-getrennt-erziehende-eltern')]
 },
 {
  id:'trennung-beratung',category:'relationships',title:'Trennung, Umgang und Beratung für Kinder',
  short:'Kostenfreie Beratung, sachliche Kommunikation und Kindeswohl.',
  overview:'Bei einer Trennung können organisatorische, finanzielle und emotionale Fragen gleichzeitig auftreten. Erziehungs- und Familienberatung sowie Jugendämter helfen bei Fragen des Umgangs, der elterlichen Sorge und der Begleitung von Kindern. Bei Konflikten sind die konkrete Situation und Sicherheit aller Beteiligten entscheidend.',
  steps:[
   'Für dringende praktische Fragen einen ruhigen Überblick zu Betreuung, Wohnen, Finanzen und Alltag der Kinder erstellen.',
   'Über Jugendamt oder Familienportal eine geeignete Erziehungs- oder Trennungsberatungsstelle finden.',
   'Klären, welche Absprachen zu Übergaben, Kommunikation und Alltagsentscheidungen dem Kindeswohl dienen.',
   'Unterhaltsvorschuss, Kinderzuschlag, Wohngeld und gegebenenfalls rechtliche Beratung getrennt prüfen.'
  ],
  responsible:'Jugendamt, Erziehungs- und Familienberatungsstelle; für rechtliche Streitfragen anwaltliche Beratung oder Familiengericht.',
  documents:'Für Beratung oft keine Pflichtunterlagen. Gegebenenfalls bestehende Umgangsvereinbarungen, Gerichtsbeschlüsse und konkrete Fragen geordnet bereithalten.',
  caveat:'Keine Standardempfehlung für Umgang bei Gewalt oder Bedrohung: Sicherheit und Kindeswohl haben Vorrang. Das Portal ersetzt keine individuelle Rechtsberatung.',
  sources:[source('Familienportal – Alleinerziehende und getrennte Eltern','https://familienportal.de/familienportal/lebenslagen/trennung/allein-und-getrennt-erziehende-eltern'),
    source('Familienportal – Sorgerecht und Umgang','https://familienportal.de/familienportal/lebenslagen/trennung/sorgerecht-umgangsrecht-und-namensrecht')]
 },
 {
  id:'fruehe-hilfen',category:'care',title:'Frühe Hilfen und Familienhebammen',
  short:'Freiwillige Unterstützung schon in der Schwangerschaft und Babyzeit.',
  overview:'Frühe Hilfen richten sich an werdende Eltern und Familien mit kleinen Kindern, insbesondere wenn Belastungen, Unsicherheit oder wenig Unterstützung im Alltag vorhanden sind. Familienhebammen beraten und begleiten bei Bedarf und vermitteln zu weiteren lokalen Angeboten.',
  steps:[
   'Beim regionalen Netzwerk Frühe Hilfen, Jugendamt oder bei einer Beratungsstelle nach den Angeboten vor Ort fragen.',
   'Den aktuellen Unterstützungsbedarf ohne Pflicht zur öffentlichen Offenlegung persönlicher Umstände beschreiben.',
   'Besprechen, ob Familienhebamme, Familien-Gesundheits- und Kinderkrankenpflege oder Eltern-Kind-Treff geeignet sind.',
   'Gemeinsam klären, wie häufig und wie lange eine Begleitung sinnvoll und möglich ist.'
  ],
  responsible:'Regionale Netzwerke Frühe Hilfen, kommunales Jugendamt, Familien- und Schwangerschaftsberatungsstellen.',
  documents:'Für eine erste Beratung üblicherweise keine festen Pflichtunterlagen; bei individuellen Angeboten können Fragen zu Familien- und Versorgungssituation entstehen.',
  caveat:'Verfügbarkeit und Zuständigkeit sind lokal verschieden. Frühe Hilfen sind keine akute medizinische Versorgung oder Krisenintervention.',
  sources:[source('Nationales Zentrum Frühe Hilfen – Familienhebammen','https://www.elternsein.info/fruehe-hilfen/was-sind-fruehe-hilfen/familienhebammen/')]
 },
 {
  id:'medien-alltag',category:'wellbeing',title:'Mediennutzung und Bildschirmpausen im Familienalltag',
  short:'Altersgerechte Begleitung statt pauschaler Bildschirmregeln.',
  overview:'Kinder brauchen altersgerechte Inhalte, Bewegung, Gespräche, Schlaf und eigene Spielzeit. Die Empfehlungen des Bundesinstituts für Öffentliche Gesundheit bieten Orientierungswerte; die passende Begleitung hängt von Alter, Entwicklung und individueller Familiensituation ab.',
  steps:[
   'Mit dem Kind gemeinsam auswählen, welche Inhalte für Alter und Entwicklungsstand geeignet sind.',
   'Bildschirmfreie Phasen für Mahlzeiten, Schlafenszeit, Bewegung und gemeinsame Aktivitäten vereinbaren.',
   'Besonders kleine Kinder nicht mit digitalen Medien alleinlassen; Interessen und Ängste ernst nehmen.',
   'Wenn Mediennutzung Konflikte, Schlaf oder Alltag dauerhaft beeinträchtigt, Beratungsangebote und fachliche Unterstützung nutzen.'
  ],
  responsible:'Eltern und Erziehungsberechtigte; bei größeren Schwierigkeiten Erziehungsberatung, Kinderarztpraxis oder entsprechende Fachberatung.',
  documents:'Für den Alltag keine Formulare. Hilfreich kann eine selbst vereinbarte Familien-Medienregel sein.',
  caveat:'Zeitangaben sind Orientierung, keine feste gesundheitliche Grenze für jedes Kind. Empfehlungen nach Alter, Belastung und Unterstützungsbedarf differenzieren.',
  sources:[source('BIÖG – Orientierung zur Mediennutzung','https://www.kindergesundheit-info.de/themen/medien/alltagstipps/mediennutzung/hoechstdauer/')]
 },
 {
  id:'schlafen-kleinkind',category:'wellbeing',title:'Schlafen und Abendrituale bei Kleinkindern',
  short:'Praktische Routinen und angemessene Unterstützung bei Schlafproblemen.',
  overview:'Regelmäßige, ruhige Einschlafrituale, ein verlässlicher Tagesablauf und Bewegung tagsüber können kleinen Kindern beim Schlafen helfen. Schlafbedarf und nächtliches Aufwachen unterscheiden sich stark nach Alter und individueller Entwicklung.',
  steps:[
   'Ein kurzes, möglichst wiederkehrendes Abendritual mit ruhiger Nähe und altersgerechten Abläufen ausprobieren.',
   'Vor dem Zubettgehen starke Reize und Bildschirmmedien möglichst reduzieren.',
   'Auf Veränderungen durch Krankheit, Stress, neue Betreuung oder Entwicklungsphasen achten.',
   'Bei anhaltenden Schlafproblemen, starker elterlicher Belastung oder gesundheitlichen Auffälligkeiten Kinderarztpraxis oder Beratungsstelle ansprechen.'
  ],
  responsible:'Kinderarztpraxis und gegebenenfalls Beratungsstellen für frühe Kindheit, Eltern-Kind-Beziehung oder Schlafprobleme.',
  documents:'Keine Pflichtunterlagen. Ein freiwilliges Schlaftagebuch kann beim Gespräch helfen.',
  caveat:'Schlafratschläge sind kein Ersatz für medizinische Abklärung. Für Säuglinge gelten eigene Empfehlungen zum sicheren Babyschlaf.',
  sources:[source('BIÖG – Einschlaftipps für 1–6 Jahre','https://www.kindergesundheit-info.de/themen/schlafen/1-6-jahre/einschlaftipps/')]
 },
 {
  id:'familienberatung',category:'relationships',title:'Erziehungsberatung und Hilfe bei Familienkonflikten',
  short:'Freiwillig Beratung nutzen, bevor Belastungen größer werden.',
  overview:'Erziehungs- und Familienberatungsstellen begleiten Familien bei Konflikten, Erziehungsfragen, Sorgen um die Entwicklung von Kindern oder belastenden Veränderungen. Angebote der Jugendhilfe können je nach Bedarf auch praktische Hilfe im Familienalltag umfassen.',
  steps:[
   'Konkrete Fragen notieren: Was belastet gerade, was gelingt bereits und was soll sich ändern?',
   'Über Jugendamt, kommunale Familienberatung oder offizielle Beratungsstellensuche passende Angebote finden.',
   'Nach Kostenfreiheit, Vertraulichkeit, Wartezeit, Sprachmittlung und digitalen Beratungsmöglichkeiten fragen.',
   'Bei anhaltenden oder eskalierenden Konflikten um weiterführende Hilfe nach SGB VIII bitten.'
  ],
  responsible:'Örtliches Jugendamt, freie oder öffentliche Erziehungs- und Familienberatungsstellen.',
  documents:'Für Erstkontakte oft keine Pflichtunterlagen; bestehende Hilfekontrakte oder Bescheide nur wenn sinnvoll.',
  caveat:'Bei akuter Gewalt, Selbst- oder Fremdgefährdung ist ein normales Beratungsgespräch kein Ersatz für unmittelbare Hilfe.',
  sources:[source('Familienportal – Hilfe und Beratung','https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/hilfe-beratung-familien')]
 },
 {
  id:'psychische-gesundheit-kinder',category:'wellbeing',title:'Psychische Gesundheit: Sorgen um ein Kind',
  short:'Warnzeichen ernst nehmen und passende Hilfe finden.',
  overview:'Wenn Kinder länger anhaltend traurig, ängstlich, stark zurückgezogen oder im Alltag deutlich beeinträchtigt wirken, ist eine fachliche Einschätzung sinnvoll. Unterstützung bieten unter anderem Kinderarztpraxen, Beratungsstellen und bei Bedarf spezialisierte psychotherapeutische oder kinder- und jugendpsychiatrische Angebote.',
  steps:[
   'Veränderungen ruhig beobachten, das Kind altersgerecht fragen und belastende Situationen ernst nehmen.',
   'Gespräch mit Kinderarztpraxis oder einer anerkannten Beratungsstelle vereinbaren.',
   'Kita oder Schule nur soweit notwendig und mit Blick auf den Datenschutz einbinden.',
   'Bei akuter Selbst- oder Fremdgefährdung unverzüglich Hilfe über die örtlichen Notfallwege organisieren.'
  ],
  responsible:'Kinderarztpraxis, Erziehungsberatung, psychotherapeutische/psychiatrische Fachversorgung und regionale Krisendienste.',
  documents:'Für Erstberatung meist keine besonderen Unterlagen, bei medizinischer Behandlung Versicherungskarte und vorhandene relevante Befunde.',
  caveat:'Nicht jede Stimmungsschwankung ist eine psychische Erkrankung. Hier erfolgt keine Diagnose oder individuelle Risikobeurteilung; akute Notfälle brauchen sofortige fachliche Hilfe.',
  sources:[source('Gesundheitsportal des Bundes – Anlaufstellen','https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/psychische-gesundheit/anlaufstellen'),
    source('Gesundheitsportal – Tipps für Eltern','https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/psychische-gesundheit/tipps-fuer-eltern')]
 }
,{
 id:'kinderkrankengeld',category:'money',title:'Kind krank: Freistellung und Kinderkrankengeld',
 short:'Krankes Kind betreuen, Arbeitgeber informieren und Krankenkasse ansprechen.',
 overview:'Muss ein krankes Kind zu Hause versorgt werden, können gesetzlich krankenversicherte Eltern unter bestimmten Voraussetzungen Kinderkrankengeld und unbezahlte Freistellung beanspruchen. Die genauen Regeln hängen von Alter beziehungsweise Behinderung des Kindes, Versicherungsstatus, Arbeitsverhältnis und bereits ausgeschöpften Tagen ab.',
 steps:[
  'Kinderarztpraxis zur medizinisch notwendigen häuslichen Betreuung ansprechen und Bescheinigung nach dem geltenden Verfahren organisieren.',
  'Arbeitgeber unverzüglich über die erforderliche Betreuung und voraussichtliche Abwesenheit informieren.',
  'Bei Krankenkasse den Antrag und die notwendigen Angaben zum Verdienstausfall prüfen; bestehende Lohnfortzahlungsregelungen berücksichtigen.',
  'Resttage, Sonderregelungen für Alleinerziehende und Betreuung von Kindern mit Behinderung bei der Kasse individuell klären.'
 ],
 responsible:'Gesetzliche Krankenkasse für Kinderkrankengeld, Arbeitgeber für Arbeitsfreistellung und Kinderarztpraxis für Bescheinigung.',
 documents:'Je nach Vorgang ärztliche Bescheinigung, Angaben zur Versicherung von Kind und Eltern sowie Arbeitgeber-/Entgeltdaten.',
 caveat:'Ein Kinderkrankentag ist nicht mit bezahltem Sonderurlaub gleichzusetzen. Private Versicherungen und das Alter des Kindes können Ansprüche ändern; keine pauschale Zahl von Tagen ohne Prüfdatum nennen.',
 sources:[source('Familienportal – Kinderkrankentage und Kinderkrankengeld','https://familienportal.de/familienportal/familienleistungen/weitere-leistungen/kinderkrankentage-und-kinderkrankengeld'),
  source('Gesundheitsportal – Kinderkrankengeld','https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/akute-erkrankung/kinderkrankengeld')]
},
{
 id:'mutter-vater-kind-kur',category:'wellbeing',title:'Mutter-Kind-Kur und Vater-Kind-Kur beantragen',
 short:'Medizinische Kurmaßnahme bei Belastung im Familienalltag prüfen.',
 overview:'Stationäre Vorsorge- oder Rehabilitationsmaßnahmen für Mütter oder Väter können in Betracht kommen, wenn gesundheitliche Beeinträchtigungen im Zusammenhang mit familiären Belastungen bestehen. Kinder können unter bestimmten Voraussetzungen mitreisen; eine eigene Behandlung des Kindes benötigt eine gesonderte medizinische Bewertung.',
 steps:[
  'Bei Haus- oder Facharztpraxis die gesundheitlichen Belastungen besprechen und medizinische Eignung einer Maßnahme prüfen.',
  'Geeignete Beratungsstelle oder Krankenkasse zum Verfahren, zu Mutter-/Vater-Kind-Kureinrichtungen und Kostenfragen ansprechen.',
  'Notwendige ärztliche Verordnung und Antragsunterlagen vorbereiten; bei medizinischer Mitbehandlung des Kindes Kinderarztpraxis einbinden.',
  'Bescheid, mögliche Eigenanteile, Zeitraum und Betreuung weiterer Kinder frühzeitig abklären.'
 ],
 responsible:'Gesetzliche Krankenkasse oder anderer zuständiger Rehabilitationsträger; behandelnde Praxis und Kurberatungsstelle.',
 documents:'Ärztliche Verordnung, Antragsformular des Trägers, gegebenenfalls Stellungnahme der Kinderarztpraxis sowie erforderliche Familienangaben.',
 caveat:'Eine Kur ist keine beliebige Familienreise und nicht automatisch bewilligt. Medizinische Indikation, Trägerzuständigkeit und Behandlung des Kindes werden individuell geprüft.',
 sources:[source('Gesundheitsportal – Voraussetzungen und Antrag','https://gesund.bund.de/kur'),
  source('Familienportal – Gesundheit und Erholung','https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/gesundheit-erholung')]
},
{
 id:'ganztag-grundschule',category:'care',title:'Hort und Ganztag ab dem Schuljahr 2026/27',
 short:'Stufenweiser Grundschul-Rechtsanspruch und Anmeldung vor Ort.',
 overview:'Der Rechtsanspruch auf ganztägige Förderung im Grundschulalter wird seit dem 1. August 2026 stufenweise eingeführt: zunächst für Kinder der ersten Klassenstufe, anschließend jährlich für weitere Jahrgänge. Zum Schuljahr 2029/30 sollen alle Kinder der ersten bis vierten Klassenstufe umfasst sein. Die konkrete Umsetzung erfolgt in Horten oder Ganztagsgrundschulen nach Landesrecht.',
 steps:[
  'Bei Grundschule, kommunaler Hortverwaltung oder Jugendamt den aktuellen Jahrgang und das Anmeldeverfahren prüfen.',
  'Vor Aufnahme Schulweg, Betreuungszeiten, Ferienangebote und individuelle Förder- beziehungsweise Assistenzbedarfe klären.',
  'Erforderliche Anträge mit Eingangsdatum dokumentieren und Kosten beziehungsweise mögliche Befreiungen erfragen.',
  'Bei unzureichendem Angebot rechtzeitig den zuständigen Jugendhilfeträger um Beratung bitten.'
 ],
 responsible:'Örtliches Jugendamt beziehungsweise zuständige kommunale Hortverwaltung sowie Schule und Schulträger.',
 documents:'Je nach Standort Hortanmeldung, Schulnachweis, Angaben zum Betreuungsumfang und gegebenenfalls erforderliche Nachweise für Kostenbefreiung.',
 caveat:'Nicht alle Klassen hatten bereits im Herbst 2026 denselben bundesrechtlichen Anspruch. Öffnungszeiten, Ferienregelungen und besondere Bedarfe sind lokal zu klären.',
 sources:[source('Bundesfamilienministerium – Ganztags-Rechtsanspruch 2026','https://familienportal.de/bmbfsfj/aktuelles/pressemitteilungen/rechtsanspruch-auf-ganztag-startet-zum-1-august-2026-292232'),
  source('Bundesfamilienministerium – Ganztagsangebote','https://familienportal.de/bmbfsfj/themen/bildung/schule/ganztagsangebote-275354')]
},
{
 id:'familienerholung',category:'care',title:'Günstige Familienferien und Familienferienstätten',
 short:'Gemeinnützige Angebote, mögliche Zuschüsse und Inklusion vergleichen.',
 overview:'Gemeinnützige Familienferienstätten bieten Familien Erholungsangebote, teils mit Kinderbetreuung, Familienprogramm und auf besondere Lebenslagen abgestimmter Ausstattung. In manchen Bundesländern gibt es einkommensabhängige Zuschüsse. Das bundesweite Angebot ersetzt keine konkrete Kosten- oder Barrierefreiheitsprüfung.',
 steps:[
  'Über die offizielle Broschüre „Urlaub mit der Familie 2026/2027“ familiengeeignete Einrichtungen und Regionen auswählen.',
  'Mit Einrichtung Preise, Ferienprogramm, Mindestaufenthalt und gegebenenfalls familienfreundliche Ausstattung klären.',
  'Beim Landesfamilienportal oder Jugendamt nach aktuellen Zuschussbedingungen und Fristen fragen.',
  'Bei einem Kind mit Behinderung stufenlosen Zugang, Pflegeunterstützung, Hilfsmittel und tatsächliche Betreuung direkt mit dem Haus abstimmen.'
 ],
 responsible:'Einzelne Familienferienstätte; mögliche Förderung über zuständige Landesstelle oder Kommune.',
 documents:'Für einen Zuschuss unter Umständen Einkommens-, Familien- und Wohnsitznachweise; für eine einfache Buchungsanfrage meist keine amtlichen Formulare.',
 caveat:'„Günstiger Familienurlaub“ bedeutet nicht automatisch Förderung. Zusätzliche Voraussetzungen und tatsächliche Kosten unterscheiden sich je nach Bundesland, Haus, Termin und Ausstattung.',
 sources:[source('Familienportal – Familienerholung','https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/gesundheit-erholung/familienerholung-in-familienferienstaetten-137464'),
  source('Bundesfamilienministerium – Katalog 2026/2027','https://familienportal.de/bmbfsfj/service/publikationen/urlaub-mit-der-familie-2026-2027-223594')]
},
{
 id:'beistandschaft',category:'relationships',title:'Beistandschaft beim Jugendamt: Unterhalt und Vaterschaft',
 short:'Kostenfreie Unterstützung bei Unterhaltsansprüchen und Vaterschaftsfeststellung.',
 overview:'Der beistandschaftliche Dienst beim Jugendamt kann berechtigte Elternteile bei Fragen zum Kindesunterhalt und zur Feststellung der Vaterschaft unterstützen. Die freiwillige Beistandschaft wird beim Jugendamt beantragt, ist kostenfrei und beschränkt sich auf den jeweiligen Aufgabenbereich.',
 steps:[
  'Beim zuständigen Jugendamt nach der Beistandschaft und vorangehender Unterhaltsberatung fragen.',
  'Geburtsurkunde, vorhandene Unterhaltsregelungen und Angaben zum anderen Elternteil zusammentragen, soweit für die Beratung erforderlich.',
  'Prüfen, ob die gesetzlichen Voraussetzungen für die Beistandschaft vorliegen und einen schriftlichen Antrag stellen.',
  'Unterhaltsvorschuss, Beistandschaft und eine gegebenenfalls erforderliche gerichtliche Durchsetzung getrennt besprechen.'
 ],
 responsible:'Jugendamt des gewöhnlichen Aufenthalts des Kindes; bei Streitfragen ggf. Familiengericht oder anwaltliche Beratung.',
 documents:'Je nach Fall Geburtsurkunde, Ausweis, vorhandene Unterhaltsurkunden oder -vereinbarungen und relevante Angaben zum anderen Elternteil.',
 caveat:'Eine Beistandschaft setzt bestimmte Sorge-/Obhutsvoraussetzungen voraus und ist keine pauschale rechtliche Vertretung für Trennung, Umgang oder Sorgerecht.',
 sources:[source('Familienportal – Beistandschaft','https://familienportal.de/familienportal/lebenslagen/trennung/allein-und-getrennt-erziehende-eltern/wie-kann-ich-unterhalt-und-vaterschaft-mit-einem-beistand-regeln--126098'),
  source('Familienportal – Kindesunterhalt','https://familienportal.de/familienportal/familienleistungen/unterhalt')]
},
{
 id:'haushaltshilfe-eltern-krank',category:'care',title:'Wenn Eltern krank werden: Haushaltshilfe und Familienpflege',
 short:'Unterstützung organisieren, wenn Kinder und Haushalt nicht versorgt werden können.',
 overview:'Bei einer Erkrankung, Geburt oder einem Klinikaufenthalt kann unter Voraussetzungen eine Haushaltshilfe der Krankenkasse helfen. Wenn diese nicht ausreicht oder nicht zuständig ist, kommen je nach Situation weitere familienunterstützende Leistungen in Betracht. Eine Ausfallvertretung für Kinderbetreuung sollte frühzeitig organisiert werden.',
 steps:[
  'Bei der behandelnden Praxis das konkrete gesundheitlich bedingte Hindernis und notwendige Dauer klären.',
  'Bei der Krankenkasse nach Haushaltshilfe, erforderlicher ärztlicher Bescheinigung und Übernahme von Kinderbetreuung fragen.',
  'Falls die Voraussetzungen dort nicht erfüllt sind oder Hilfe nicht ausreicht, beim Jugendamt nach ergänzender ambulanter Familienpflege fragen.',
  'Bewilligung, Kostenbeteiligung, Einsatzzeiten und gegebenenfalls Verfügbarkeit geeigneter Hilfskräfte schriftlich bestätigen lassen.'
 ],
 responsible:'Krankenkasse für Haushaltshilfe nach Krankenversicherungsrecht; Jugendamt für gegebenenfalls ergänzende Leistungen der Kinder- und Jugendhilfe.',
 documents:'Ärztliche Bescheinigung, Versicherungsdaten, Angaben zum Ausfall der betreuenden Person, zu Kindern und fehlenden anderen Betreuungsmöglichkeiten.',
 caveat:'Haushaltshilfe ist keine allgemeine kostenlose Betreuung oder frei verfügbare Haushaltstätigkeit; gesetzliche Voraussetzungen und Ersatzbetreuung werden individuell geprüft.',
 sources:[source('Gesundheitsportal – Haushaltshilfe','https://gesund.bund.de/haushaltshilfe'),
  source('Gesundheitsportal – Wenn Eltern krank sind','https://gesund.bund.de/unterstuetzungsmoeglichkeiten-eltern-krankheitsfall')]
}
,
{
  "id": "elterngeld-antrag",
  "category": "money",
  "title": "Elterngeld und ElterngeldPlus beantragen",
  "short": "Unterlagen, zuständige Stelle und digitale Antragstellung nach der Geburt.",
  "overview": "Elterngeld unterstützt Eltern, die nach der Geburt ihr Kind betreuen und deshalb nicht oder weniger arbeiten. Basiselterngeld und ElterngeldPlus haben unterschiedliche Bezugsmodelle. Der Antrag wird bei der zuständigen Elterngeldstelle gestellt; die genaue Berechnung hängt von Einkommen, Erwerbsumfang, Elternkonstellation und dem Geburtsdatum ab.",
  "steps": [
    "Das offizielle Familienportal zu Basiselterngeld, ElterngeldPlus und Voraussetzungen lesen.",
    "Die zuständige Elterngeldstelle nach dem maßgeblichen Wohnort ermitteln; gegebenenfalls das amtliche Online-Verfahren nutzen.",
    "Geburtsnachweis, Einkommensunterlagen und die im Einzelfall verlangten Erklärungen vorbereiten.",
    "Antrag nach der Geburt einreichen, Zugang dokumentieren und fehlende Nachweise bei Bedarf ergänzen."
  ],
  "responsible": "Zuständige Elterngeldstelle des Landes oder der Kommune am maßgeblichen Wohnort.",
  "documents": "Je nach Fall Geburtsurkunde beziehungsweise Geburtsbescheinigung, Einkommensnachweise vor der Geburt, Nachweise über Mutterschaftsleistungen, Arbeitszeit- und Einkommensangaben während des Bezugs sowie gegebenenfalls die Mitwirkung des anderen Elternteils.",
  "caveat": "Elterngeld und Elternzeit sind unterschiedliche Dinge. Die rückwirkende Elterngeldzahlung ist begrenzt; Antrag und individuelle Lebensmonate frühzeitig prüfen. Die digitale Antragstellung kann je nach Bundesland und Behörde unterschiedlich weit reichen.",
  "sources": [
    {
      "title": "Familienportal – Elterngeld beantragen",
      "url": "https://familienportal.de/familienportal/familienleistungen/elterngeld/faq/wie-kann-ich-elterngeld-beantragen--124762"
    },
    {
      "title": "Familienportal – Elterngeld online beantragen",
      "url": "https://familienportal.de/familienportal/rechner-antraege/elterngeld-online-beantragen-127692"
    }
  ]
},
{
  "id": "kindergeld-antrag",
  "category": "money",
  "title": "Kindergeld: Anspruch, Antrag und Unterlagen",
  "short": "Kindergeld bei der Familienkasse beantragen und Änderungen melden.",
  "overview": "Kindergeld ist eine familienbezogene Leistung, die in der Regel über die Familienkasse der Bundesagentur für Arbeit abgewickelt wird. Bei volljährigen Kindern können besondere Voraussetzungen gelten, etwa während Ausbildung oder Studium. Die Familienkasse prüft Ansprüche und notwendige Nachweise.",
  "steps": [
    "Informationen der Familienkasse zu Alter, Ausbildung und weiteren Voraussetzungen lesen.",
    "Den Kindergeldantrag online stellen oder die offiziellen Formulare nutzen.",
    "Steueridentifikationsnummern und erforderliche Familiennachweise bereithalten.",
    "Antragsstand prüfen und Änderungen, etwa beim Ausbildungsstatus eines volljährigen Kindes, der Familienkasse mitteilen."
  ],
  "responsible": "Familienkasse der Bundesagentur für Arbeit; für einzelne Personengruppen können besondere Zuständigkeiten gelten.",
  "documents": "In der Regel Steueridentifikationsnummern von berechtigter Person und Kind sowie Familienangaben; bei volljährigen Kindern gegebenenfalls Ausbildungs-, Schul- oder andere besondere Nachweise.",
  "caveat": "Aktuelle Kindergeldhöhe, Auszahlungstermine und Sonderfälle ändern sich; keine verbindliche Anspruchs- oder Betragsberechnung durch Familienfunke. Eine spätere Antragstellung kann die rückwirkende Auszahlung begrenzen.",
  "sources": [
    {
      "title": "Bundesagentur für Arbeit – Kindergeld",
      "url": "https://www.arbeitsagentur.de/familie-und-kinder/infos-rund-um-kindergeld/kindergeld-anspruch-hoehe-dauer"
    },
    {
      "title": "Bundesagentur für Arbeit – Kindergeldformulare",
      "url": "https://www.arbeitsagentur.de/familie-und-kinder/downloads-familie-und-kinder/formulare-kindergeld"
    }
  ]
},
{
  "id": "mutterschutz-mutterschaftsgeld",
  "category": "money",
  "title": "Mutterschutz und Mutterschaftsgeld verstehen",
  "short": "Gesundheitsschutz am Arbeitsplatz und mögliche Mutterschaftsleistungen.",
  "overview": "Mutterschutz umfasst unter anderem den Gesundheitsschutz am Arbeitsplatz, Schutzfristen rund um die Geburt und besondere arbeitsrechtliche Regelungen. Mutterschaftsgeld kann je nach Versicherungs- und Beschäftigungssituation bei der Krankenkasse oder einer anderen zuständigen Stelle beantragt werden.",
  "steps": [
    "Nach Feststellung der Schwangerschaft die eigene Arbeits- und Versicherungssituation klären.",
    "Arbeitgeber über die Schwangerschaft informieren, damit Schutzregelungen am Arbeitsplatz umgesetzt werden können.",
    "Bei der Krankenkasse beziehungsweise zuständigen Mutterschaftsgeldstelle Unterlagen und Antragsweg erfragen.",
    "Voraussichtlichen Geburtstermin, Schutzfristen und die Abstimmung mit Elterngeld und Elternzeit getrennt dokumentieren."
  ],
  "responsible": "Arbeitgeber für Arbeitsschutz; gesetzliche Krankenkasse oder andere zuständige Stelle für Mutterschaftsgeld; gegebenenfalls Mutterschutzaufsicht.",
  "documents": "Je nach Antragsweg Bescheinigung über den voraussichtlichen Entbindungstermin, Angaben zum Beschäftigungsverhältnis, Versicherungsnachweis und gegebenenfalls weitere Einkommens- oder Arbeitgebernachweise.",
  "caveat": "Schutzfristen und Leistungen hängen von der Situation ab; für Frühgeburten, Mehrlinge, besondere Schutzbedarfe und fehlende eigene gesetzliche Krankenversicherung gelten Abweichungen. Mutterschutz und Elternzeit dürfen nicht gleichgesetzt werden.",
  "sources": [
    {
      "title": "Familienportal – Mutterschutz",
      "url": "https://familienportal.de/familienportal/familienleistungen/mutterschutz"
    },
    {
      "title": "Familienportal – Mutterschaftsleistungen",
      "url": "https://familienportal.de/familienportal/familienleistungen/mutterschaftsleistungen"
    }
  ]
},
{
  "id": "schwangerschaftsberatung",
  "category": "care",
  "title": "Schwangerschaftsberatung und vertrauliche Hilfe finden",
  "short": "Kostenfreie Beratung bei Fragen, Belastung oder Unsicherheit in der Schwangerschaft.",
  "overview": "Schwangerschaftsberatungsstellen unterstützen bei rechtlichen, sozialen, gesundheitlichen und finanziellen Fragen rund um Schwangerschaft und Geburt. Sie können zu Hilfen und Leistungen informieren und bei schwierigen persönlichen Situationen beraten. Die Angebote und die Möglichkeiten vertraulicher Beratung sind je nach Beratungsstelle zu klären.",
  "steps": [
    "Eine anerkannte Schwangerschaftsberatungsstelle in der eigenen Region suchen.",
    "Bei der Kontaktaufnahme klären, ob eine vertrauliche, telefonische oder persönliche Beratung gewünscht ist.",
    "Fragen zu Leistungen, Wohnen, Ausbildung, Partnerschaft oder Gesundheit für das Gespräch notieren.",
    "Etwaige finanzielle Hilfen und dafür benötigte Nachweise direkt mit der Beratungsstelle besprechen."
  ],
  "responsible": "Anerkannte Schwangerschaftsberatungsstellen; für medizinische Fragen zusätzlich Hebamme und ärztliche Praxis.",
  "documents": "Für eine erste allgemeine Beratung häufig keine besonderen Nachweise; für konkrete Hilfs- oder Leistungsanträge können Wohnsitz-, Einkommens-, Schwangerschafts- und weitere Unterlagen erforderlich sein.",
  "caveat": "Eine allgemeine Schwangerschaftsberatung ist von einer gesetzlich besonders geregelten Schwangerschaftskonfliktberatung zu unterscheiden. Vertrauliche Geburt und Konfliktberatung benötigen besondere fachliche Begleitung.",
  "sources": [
    {
      "title": "Familienportal – Beratung in der Schwangerschaft",
      "url": "https://familienportal.de/familienportal/lebenslagen/schwangerschaft-geburt/gesundheit-und-beratung/wo-kann-ich-mich-beraten-lassen-wenn-ich-schwanger-bin--125110"
    }
  ]
},
{
  "id": "geburt-checkliste",
  "category": "care",
  "title": "Nach der Geburt: Behördengänge und Familienleistungen",
  "short": "Geburtsanzeige, Urkunden, Versicherung und Leistungen strukturiert klären.",
  "overview": "Nach der Geburt sind je nach Familiensituation mehrere voneinander getrennte Schritte wichtig. Dazu gehören die Anzeige der Geburt beim Standesamt des Geburtsortes, gegebenenfalls Krankenversicherung und Elternleistungen sowie besondere Erklärungen zu Vaterschaft und Sorge. Die offizielle Checkliste des Familienportals hilft, den Überblick zu behalten.",
  "steps": [
    "Bei Klinik oder Geburtshaus nachfragen, wie die Geburtsanzeige an das Standesamt erfolgt.",
    "Beim Standesamt die benötigten Urkunden und Nachweise klären und Geburtsurkunden beantragen.",
    "Krankenversicherung des Kindes und bei Bedarf Mitteilungen an Arbeitgeber oder andere Stellen klären.",
    "Kindergeld, Elterngeld und eventuell weitere Leistungen anhand der amtlichen Antragswege prüfen."
  ],
  "responsible": "Standesamt am Geburtsort, Krankenkasse, Familienkasse, Elterngeldstelle und je nach Fall Jugendamt.",
  "documents": "Je nach Personenstand und Geburtssituation insbesondere Ausweise, Personenstandsurkunden, Geburtsbescheinigungen und für einzelne Leistungen gesonderte Einkommensnachweise.",
  "caveat": "Die Aufgaben sind nicht alle bei einer einzigen Behörde zu erledigen. Besondere Konstellationen bei nicht verheirateten Eltern, Auslandsbezug oder fehlenden Unterlagen erfordern Rücksprache mit der zuständigen Stelle.",
  "sources": [
    {
      "title": "Familienportal – Checkliste nach der Geburt",
      "url": "https://familienportal.de/familienportal/lebenslagen/schwangerschaft-geburt/checklisten/checkliste-fuer-die-zeit-nach-der-geburt-126022"
    },
    {
      "title": "Familienportal – Checklisten rund um die Geburt",
      "url": "https://familienportal.de/familienportal/lebenslagen/schwangerschaft-geburt/checklisten"
    }
  ]
},
{
  "id": "studium-ausbildung-mit-kind",
  "category": "care",
  "title": "Studium oder Ausbildung mit Kind organisieren",
  "short": "Kinderbetreuung, finanzielle Hilfen und Beratung an Hochschule oder Ausbildungsstelle.",
  "overview": "Studierende und Auszubildende mit Kind können unterschiedliche Unterstützungen nutzen, je nach Ausbildungsform und persönlicher Situation. Hochschulen und Studierendenwerke bieten häufig Familienberatung und Betreuungsinformationen. BAföG, Berufsausbildungsbeihilfe, Elterngeld, Kindergeld und weitere Leistungen unterliegen unterschiedlichen Voraussetzungen und Anrechnungsregeln.",
  "steps": [
    "Beim Familienservice der Hochschule, dem Studierendenwerk oder der Ausbildungsberatung nach Betreuungsangeboten fragen.",
    "Elterngeld, Kindergeld, BAföG, Berufsausbildungsbeihilfe und mögliche ergänzende Leistungen getrennt prüfen.",
    "Anträge möglichst vor Fristen und Betreuungsterminen vorbereiten und Rückfragen bei der jeweils zuständigen Stelle klären.",
    "Bei Schwangerschaft oder notwendiger Unterbrechung Urlaub, Schutzregeln und Studien- oder Ausbildungsorganisation beraten lassen."
  ],
  "responsible": "Familienservice der Hochschule, Studierendenwerk, BAföG-Amt, Agentur für Arbeit, Ausbildungsbetrieb und jeweilige Leistungsträger.",
  "documents": "Je nach Leistung Ausbildungs- beziehungsweise Immatrikulationsnachweis, Einkommensnachweise, Angaben zum Kind und seiner Betreuung, Wohnkosten- und weitere Nachweise.",
  "caveat": "Nicht alle Leistungen sind gleichzeitig kombinierbar. Die konkrete Förderfähigkeit hängt von Ausbildung, Einkommen, Wohnform, Alter und weiteren Leistungen ab.",
  "sources": [
    {
      "title": "Familienportal – Ausbildung und Studium mit Kind",
      "url": "https://familienportal.de/familienportal/lebenslagen/ausbildung-beruf/ausbildung-studium-mit-kind"
    },
    {
      "title": "Familienportal – Unterstützung für Studierende und Azubis",
      "url": "https://familienportal.de/familienportal/lebenslagen/ausbildung-beruf/ausbildung-studium-mit-kind/welche-unterstuetzungen-gibt-es-fuer-studierende-und-auszubildende-mit-kind--147818"
    }
  ]
},
{
  "id": "schulden-beratung-familien",
  "category": "money",
  "title": "Schulden, Mietrückstände und finanzielle Krisen",
  "short": "Frühzeitig anerkannte Schuldnerberatung und gegebenenfalls Wohnhilfen suchen.",
  "overview": "Wenn Familien Mietrückstände, Mahnungen oder andere finanzielle Schwierigkeiten haben, ist eine frühzeitige Beratung wichtig. Schuldnerberatungsstellen unterstützen beim Überblick über Forderungen, bei Gläubigerkontakten und bei möglichen Entschuldungswegen. Droht der Verlust der Wohnung, sollten zusätzlich die zuständigen kommunalen Stellen eingebunden werden.",
  "steps": [
    "Mahnungen, Zahlungsforderungen, Mietverträge und laufende Kosten geordnet zusammenstellen.",
    "Eine anerkannte Schuldnerberatungsstelle oder kommunale Sozialberatung kontaktieren.",
    "Bei angedrohter Kündigung, Räumung oder Energiesperre unverzüglich die zuständigen Stellen informieren und Unterstützung erfragen.",
    "Bestehende Ansprüche auf Wohngeld, Kinderzuschlag oder andere Hilfen getrennt prüfen."
  ],
  "responsible": "Anerkannte Schuldnerberatung, Sozialberatungsstellen sowie bei drohender Wohnungslosigkeit die zuständige Kommune beziehungsweise das Sozialamt.",
  "documents": "Mahnungen und gerichtliche Schreiben, Überblick über Schulden und Gläubiger, Mietvertrag, Einkommens- und Leistungsnachweise, aktuelle Fixkosten und gegebenenfalls Kontoauszüge.",
  "caveat": "Auf gerichtliche Schreiben und Fristen muss rechtzeitig reagiert werden. Dieser Text ersetzt keine Rechtsberatung und empfiehlt keinen bestimmten Kredit oder gewerblichen Schuldensanierer.",
  "sources": [
    {
      "title": "Familienportal – Schulden und drohende Wohnungslosigkeit",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/krisentelefone-anlaufstellen/schulden-und-drohende-wohnungslosigkeit-125466"
    }
  ]
},
{
  "id": "pflegefamilie-werden",
  "category": "relationships",
  "title": "Pflegefamilie werden: Voraussetzungen und erster Kontakt",
  "short": "Pflegekind aufnehmen und mit Jugendamt oder Pflegekinderdienst zusammenarbeiten.",
  "overview": "Pflegefamilien geben Kindern, die vorübergehend oder länger nicht bei ihren Eltern leben können, ein Zuhause. Der Pflegekinderdienst beziehungsweise das Jugendamt begleitet Auswahl, Vorbereitung und Vermittlung. Pflegeelternschaft ist nicht mit einer Adoption gleichzusetzen, weil rechtliche Beziehungen und Beteiligungsrechte unterschiedlich bleiben.",
  "steps": [
    "Beim örtlichen Jugendamt oder Pflegekinderdienst nach Informationsveranstaltungen und Erstgesprächen fragen.",
    "Im Gespräch Motivation, familiäre Situation, verfügbare Zeit und besondere Bedürfnisse eines Pflegekindes offen klären.",
    "Prüfungs-, Schulungs- und Eignungsverfahren der zuständigen Stelle durchlaufen.",
    "Vor einer möglichen Aufnahme konkrete Betreuungs- und Unterstützungsvereinbarungen mit dem Jugendamt treffen."
  ],
  "responsible": "Pflegekinderdienst des zuständigen Jugendamts oder ein beauftragter anerkannter Träger.",
  "documents": "Im Eignungsverfahren je nach Stelle persönliche Angaben, Führungszeugnisse, Gesundheits- und weitere Eignungsnachweise; die zuständige Stelle benennt die erforderlichen Unterlagen.",
  "caveat": "Eine Bewerbung garantiert keine Vermittlung. Das Wohl und die individuelle Situation des Kindes sowie die Zusammenarbeit mit Herkunftsfamilie und Jugendamt stehen im Mittelpunkt.",
  "sources": [
    {
      "title": "Familienportal – Pflegefamilie werden",
      "url": "https://familienportal.de/familienportal/lebenslagen/pflegefamilien/wie-kann-man-pflegefamilie-oder-pflegeperson-werden--276230"
    },
    {
      "title": "Familienportal – Pflegeelternschaft verstehen",
      "url": "https://familienportal.de/familienportal/lebenslagen/pflegefamilien/was-ist-pflegeelternschaft--276224"
    }
  ]
},
{
  "id": "adoption-beratung",
  "category": "relationships",
  "title": "Adoption: Erste Beratung und Vermittlungsstellen",
  "short": "Offizielle Adoptionsvermittlungsstelle und rechtliche Unterschiede zu Pflege klären.",
  "overview": "Adoption ist ein rechtliches Verfahren, bei dem ein Kind in eine neue Familie aufgenommen wird und ein neues rechtliches Eltern-Kind-Verhältnis entsteht. In Deutschland dürfen nur dafür zugelassene Stellen Adoptionen vermitteln. Eine erste Beratung erklärt das Verfahren, Eignungsanforderungen und die besondere Rolle des Kindeswohls.",
  "steps": [
    "Eine anerkannte Adoptionsvermittlungsstelle beim Jugendamt oder einem zugelassenen Träger suchen.",
    "Sich dort zu den verschiedenen Adoptionsformen, Voraussetzungen und Erwartungen beraten lassen.",
    "Die erforderlichen Gespräche, Nachweise und Eignungsprüfungen mit der Vermittlungsstelle abstimmen.",
    "Bei konkreten Schritten rechtliche Folgen, Herkunft des Kindes und mögliche Begleitungsangebote besprechen."
  ],
  "responsible": "Adoptionsvermittlungsstelle des Jugendamtes oder eine anerkannte freie Adoptionsvermittlungsstelle.",
  "documents": "Im Verlauf des Verfahrens können Identitäts-, Personenstands-, Einkommens-, Gesundheits- und weitere Eignungsnachweise verlangt werden; keine allgemeingültige Liste ohne zuständige Stelle.",
  "caveat": "Eine Adoption ist kein frei organisierbarer Kauf oder eine private Vermittlung. Auslandsadoptionen unterliegen weiteren speziellen Verfahren. Pflegeelternschaft hat andere rechtliche Grundlagen.",
  "sources": [
    {
      "title": "Familienportal – Wer Adoptionen vermitteln darf",
      "url": "https://familienportal.de/familienportal/lebenslagen/kinderwunsch-adoption/adoption/wer-vermittelt-adoptionen-in-deutschland--125962"
    },
    {
      "title": "Familienportal – Unterschied Adoption und Pflegekind",
      "url": "https://familienportal.de/familienportal/lebenslagen/kinderwunsch-adoption/adoption/was-ist-der-unterschied-zwischen-einem-adoptivkind-und-einem-pflegekind--125966"
    }
  ]
},
{
  "id": "kinderschutz-beratung",
  "category": "wellbeing",
  "title": "Kinderschutz: Beratung bei Sorgen um ein Kind",
  "short": "Jugendamt und geeignete Fachstellen bei möglicher Kindeswohlgefährdung.",
  "overview": "Bei Sorgen um das Wohl eines Kindes helfen Beratungsstellen der Kinder- und Jugendhilfe und das zuständige Jugendamt. Je nach Situation können freiwillige Hilfen, fachliche Beratung und bei konkreter Gefahr Schutzmaßnahmen erforderlich sein. In einer akuten Gefahrenlage haben unmittelbare Schutz und Notruf Vorrang.",
  "steps": [
    "Bei akuter unmittelbarer Gefahr sofort Polizei oder Rettungsdienst verständigen.",
    "Beobachtungen und konkrete Sorgen sachlich notieren, ohne das Kind durch Nachfragen unter Druck zu setzen.",
    "Beim zuständigen Jugendamt oder einer qualifizierten Kinderschutzberatungsstelle vertrauliche Orientierung erfragen.",
    "Bei bereits laufender Hilfe Zuständigkeit, nächste sichere Schritte und eventuelle weitere Unterstützung klären."
  ],
  "responsible": "Jugendamt vor Ort und spezialisierte Beratungsstellen; bei akuter Gefahr Polizei 110 oder Rettungsdienst 112.",
  "documents": "Für eine erste Beratung sind nicht zwingend Dokumente erforderlich; vorhandene relevante Beobachtungen oder Schreiben können nach Rücksprache nützlich sein.",
  "caveat": "Ein Wissensassistent kann keine Gefährdung beurteilen, keine Notfallhilfe leisten und keine fachliche Meldung ersetzen. Sicherheit und Schutz personenbezogener Informationen gehen vor.",
  "sources": [
    {
      "title": "Familienportal – Kinder- und Jugendschutz",
      "url": "https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/kinder-jugendschutz"
    },
    {
      "title": "Familienportal – Angebote der Kinder- und Jugendhilfe",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/kinder-und-jugendhilfe"
    }
  ]
},
{
  "id": "beratung-kinder-jugendliche",
  "category": "wellbeing",
  "title": "Kinder- und Jugendberatung bei Sorgen oder Mobbing",
  "short": "Anonyme und vertrauliche Hilfe bei Konflikten, Mobbing oder Belastungen.",
  "overview": "Kinder und Jugendliche können sich bei Sorgen mit Eltern, Freundschaften, Schule, Mobbing und anderen Belastungen an spezialisierte Beratungsangebote wenden. Das Kinder- und Jugendtelefon „Nummer gegen Kummer“ und weitere Online-Beratungsstellen bieten niedrigschwellige Unterstützung. Wenn unmittelbare Gefahr besteht, ist die Notrufnummer zuständig.",
  "steps": [
    "Mit einer vertrauenswürdigen erwachsenen Person sprechen, sofern das sicher möglich ist.",
    "Das Kinder- und Jugendtelefon 116 111 oder die im Familienportal genannten Online-Beratungen prüfen.",
    "Bei Mobbing in der Schule zusätzlich die Schulsozialarbeit beziehungsweise eine Beratungslehrkraft einbeziehen.",
    "Bei Bedrohung oder Gewalt nicht allein auf einen Chat warten, sondern geeignete Fachstellen und gegebenenfalls den Notruf kontaktieren."
  ],
  "responsible": "Nummer gegen Kummer, Schulsozialarbeit, kommunale Jugendberatung und bei Gefährdung das Jugendamt.",
  "documents": "Für eine allgemeine vertrauliche Erstberatung in der Regel keine Antragsunterlagen; Telefonnummern und Erreichbarkeit auf der offiziellen Seite prüfen.",
  "caveat": "Die telefonischen Beratungszeiten und Kontaktkanäle können variieren. Bei lebensbedrohlicher Gefahr ist das Kinder- und Jugendtelefon kein Ersatz für 110 oder 112.",
  "sources": [
    {
      "title": "Familienportal – Kinder und Jugendliche in schwierigen Situationen",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/hilfe-kinder-jugendliche-notlagen/hilfe-fuer-kinder-jugendliche-in-schwierigen-situationen-155972"
    },
    {
      "title": "Familienportal – Krisentelefone",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/krisentelefone-anlaufstellen"
    }
  ]
},
{
  "id": "aerztlicher-bereitschaftsdienst-kinder",
  "category": "wellbeing",
  "title": "Kind krank: 116117 oder Notruf 112?",
  "short": "Medizinische Hilfe außerhalb der Sprechzeiten richtig einordnen.",
  "overview": "Für dringende, nicht lebensbedrohliche Beschwerden außerhalb regulärer Praxiszeiten gibt es in Deutschland den ärztlichen Bereitschaftsdienst unter 116117. Bei schweren Verletzungen, Vergiftungen, Atemnot oder anderen möglichen lebensbedrohlichen Zeichen ist der Notruf 112 richtig. Die Telefonnummer allein ersetzt keine medizinische Beurteilung.",
  "steps": [
    "Prüfen, ob unmittelbar lebensbedrohliche Symptome oder schwere Verletzungen vorliegen; dann 112 verständigen.",
    "Bei dringenden, nicht lebensbedrohlichen Beschwerden außerhalb der Sprechzeit die 116117 nutzen.",
    "Alter, beobachtete Beschwerden und erforderliche Angaben zum Kind bereithalten.",
    "Die dort empfohlenen nächsten Schritte befolgen und bei deutlicher Verschlechterung erneut Hilfe holen."
  ],
  "responsible": "Kassenärztlicher Bereitschaftsdienst 116117; bei akuter Lebensgefahr Rettungsdienst 112; Kinderarztpraxis zu regulären Zeiten.",
  "documents": "Für eine medizinische Behandlung nach Möglichkeit Gesundheitskarte und Angaben zu Medikamenten, Allergien und Beschwerden bereithalten. Bei einem Notfall Hilfe nicht wegen fehlender Unterlagen verzögern.",
  "caveat": "Der Offline-Assistent kann nicht zwischen harmlosen und gefährlichen Symptomen diagnostisch unterscheiden. Im Zweifel bei schwerer oder schnell zunehmender Symptomatik sofort professionelle Hilfe suchen.",
  "sources": [
    {
      "title": "gesund.bund.de – Ärztlicher Bereitschaftsdienst",
      "url": "https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/notfaelle/aerztlicher-bereitschaftsdienst"
    },
    {
      "title": "gesund.bund.de – Notruf und Notaufnahme",
      "url": "https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/notfaelle/notruf-und-notaufnahme"
    }
  ]
},
{
  "id": "jugendamt-familienhilfen",
  "category": "relationships",
  "title": "Familienhilfen durch Jugendamt und freie Träger",
  "short": "Erziehungsberatung, sozialpädagogische Unterstützung und Hilfen im Alltag.",
  "overview": "Die Kinder- und Jugendhilfe bietet Beratung und unterschiedliche Hilfen für Familien, wenn der Alltag oder die Erziehung belastend werden. Je nach Bedarf können Erziehungsberatungsstellen, Familienbildung oder Hilfen zur Erziehung geeignet sein. Ziele, Voraussetzungen und Beteiligung werden mit den zuständigen Fachkräften geklärt.",
  "steps": [
    "Bei einer Erziehungsberatungsstelle, einem freien Träger oder dem Jugendamt um ein Beratungsgespräch bitten.",
    "Konkret beschreiben, bei welchen Alltagssituationen Unterstützung gewünscht ist, ohne unnötige private Daten in der App zu speichern.",
    "Mit Fachkräften klären, welche niedrigschwelligen Angebote oder formellen Hilfen in Betracht kommen.",
    "Bei vereinbarter Hilfe Ziele, Ansprechperson, Umfang und Überprüfung der Unterstützung besprechen."
  ],
  "responsible": "Örtliches Jugendamt sowie anerkannte Träger der Kinder- und Jugendhilfe und Erziehungsberatungsstellen.",
  "documents": "Für eine erste Beratung gewöhnlich keine umfangreichen Unterlagen; bei formellen Hilfen können Anträge und weitere Angaben im Hilfeplanverfahren nötig sein.",
  "caveat": "Die Jugendhilfe ist nicht auf eine einzige Maßnahme beschränkt. Art und Umfang hängen vom Bedarf und den rechtlichen Voraussetzungen ab. In akuten Gefährdungssituationen sind zusätzliche Schutzmaßnahmen möglich.",
  "sources": [
    {
      "title": "Familienportal – Hilfen für Familien",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/kinder-und-jugendhilfe/welche-angebote-gibt-es-fuer-familien--125676"
    },
    {
      "title": "Familienportal – Hilfen für Eltern",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/kinder-und-jugendhilfe/welche-angebote-gibt-es-fuer-eltern--125702"
    }
  ]
},
{
  "id": "hilfen-junge-volljaehrige",
  "category": "care",
  "title": "Unterstützung für junge Volljährige ab 18",
  "short": "Hilfen der Jugendhilfe auch nach dem 18. Geburtstag prüfen.",
  "overview": "Junge Volljährige können unter bestimmten Voraussetzungen weiterhin Leistungen und Unterstützung der Kinder- und Jugendhilfe erhalten, wenn sie Hilfe für ihre Persönlichkeitsentwicklung oder die eigenständige Lebensführung brauchen. Welche Hilfe geeignet ist, ergibt sich aus dem individuellen Bedarf und den geltenden gesetzlichen Voraussetzungen.",
  "steps": [
    "Beim Jugendamt oder einer Beratungsstelle für junge Menschen nach Hilfen für junge Volljährige fragen.",
    "Den aktuellen Unterstützungsbedarf, Wohnen, Ausbildung und bisherige Hilfen im Gespräch erläutern.",
    "Mit der zuständigen Stelle Antragsweg, Leistungsdauer und mögliche Übergänge klären.",
    "Bei einer Ablehnung um einen schriftlichen Bescheid und Informationen zu Beratungs- und Rechtsmitteln bitten."
  ],
  "responsible": "Örtlich zuständiges Jugendamt beziehungsweise Fachstelle für Hilfen zur Erziehung und junge Volljährige.",
  "documents": "Je nach Situation vorhandene Hilfepläne, Ausbildungs- und Wohnnachweise sowie Unterlagen zu bisheriger Unterstützung und aktuellen Bedarfen.",
  "caveat": "Die Hilfe endet nicht pauschal für alle Menschen am 18. Geburtstag; zugleich besteht kein unbedingter Anspruch auf jede gewünschte Leistung. Zuständigkeit und Voraussetzungen individuell prüfen.",
  "sources": [
    {
      "title": "Familienportal – Hilfen für junge Volljährige",
      "url": "https://familienportal.de/familienportal/lebenslagen/krise-und-konflikt/krisentelefone-anlaufstellen/hilfen-fuer-junge-volljaehrige-125490"
    }
  ]
}
];
const fold=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9 ]/g,' ');
export function findFamilyTopics(query='',category='all'){
 const needle=fold(query).trim().replace(/\s+/g,' ');
 return FAMILY_TOPIC_ARTICLES.filter(x=>(category==='all'||x.category===category)&&
  (!needle||fold([x.title,x.short,x.overview,x.responsible,...x.steps].join(' ')).includes(needle)));
}
