
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
];
const fold=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9 ]/g,' ');
export function findFamilyTopics(query='',category='all'){
 const needle=fold(query).trim().replace(/\s+/g,' ');
 return FAMILY_TOPIC_ARTICLES.filter(x=>(category==='all'||x.category===category)&&
  (!needle||fold([x.title,x.short,x.overview,x.responsible,...x.steps].join(' ')).includes(needle)));
}
