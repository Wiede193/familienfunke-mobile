// Handwritten starter content. Nothing is generated or tracked at runtime.
export const LEVELS=[['little','4–6 Jahre'],['school','7–10 Jahre'],['family','Ab 11 / Familie']];
export const TOPICS=[['all','Gemischt'],['nature','Natur & Tiere'],['world','Wissen & Alltag'],['logic','Knobeln'],['space','Weltraum'],['water','Wasser & Wetter'],['language','Sprache']];
const q=(id,level,topic,question,answers,correct,explanation)=>({id,level,topic,question,answers,correct,explanation});
const STARTER_QUESTIONS=[
q('l1','little','nature','Welches Tier hat einen Rüssel?',['Elefant','Hase','Schaf'],0,'Der Elefant benutzt seinen Rüssel unter anderem zum Trinken und Riechen.'),
q('l2','little','nature','Was wächst an einem Apfelbaum?',['Kartoffeln','Äpfel','Möhren'],1,'Äpfel wachsen an Ästen eines Apfelbaums.'),
q('l3','little','nature','Wie viele Beine hat eine Spinne?',['Vier','Sechs','Acht'],2,'Spinnen haben acht Beine.'),
q('l4','little','nature','Welches Tier legt Eier?',['Huhn','Kuh','Katze'],0,'Hühner legen Eier.'),
q('l5','little','world','Was braucht man zum Zähneputzen?',['Löffel','Zahnbürste','Schere'],1,'Mit Zahnbürste und Zahnpasta werden die Zähne gereinigt.'),
q('l6','little','world','Was zeigt eine Uhr an?',['Temperatur','Gewicht','Uhrzeit'],2,'Eine Uhr zeigt die Zeit an.'),
q('l7','little','world','Aus welchem Material ist ein gewöhnliches Trinkglas?',['Glas','Wolle','Papier'],0,'Ein gewöhnliches Trinkglas besteht aus Glas.'),
q('l8','little','world','Was sieht man oft nachts am Himmel?',['Regenbogen','Mond','Sonne'],1,'Der Mond ist häufig nachts sichtbar, manchmal auch tagsüber.'),
q('l9','little','logic','Welche Zahl kommt nach 5?',['4','7','6'],2,'Beim Zählen folgt auf 5 die 6.'),
q('l10','little','logic','Zwei Äpfel und noch ein Apfel. Wie viele sind es?',['3','4','2'],0,'Zwei plus eins ergibt drei.'),
q('l11','little','logic','Was passt nicht dazu: Kreis, Dreieck, Banane?',['Kreis','Banane','Dreieck'],1,'Kreis und Dreieck sind geometrische Formen, die Banane ist eine Frucht.'),
q('l12','little','logic','Rot, blau, rot, blau. Welche Farbe kommt als Nächstes?',['Gelb','Blau','Rot'],2,'Die beiden Farben wechseln sich ab.'),
q('s1','school','nature','Wie nennt man ein junges Pferd?',['Fohlen','Kalb','Lamm'],0,'Ein junges Pferd heißt Fohlen.'),
q('s2','school','nature','Welches Tier ist ein Säugetier?',['Forelle','Delfin','Amsel'],1,'Delfine atmen Luft und säugen ihre Jungen.'),
q('s3','school','nature','Was benötigen grüne Pflanzen für die Fotosynthese?',['Nur Erde','Nur Wind','Licht, Wasser und Kohlendioxid'],2,'Mit Licht stellen Pflanzen aus Wasser und Kohlendioxid Zucker her.'),
q('s4','school','nature','Wie viele Beine hat ein Insekt?',['Sechs','Acht','Zehn'],0,'Insekten haben sechs Beine.'),
q('s5','school','world','Wie viele Minuten hat eine Stunde?',['100','60','30'],1,'Eine Stunde besteht aus 60 Minuten.'),
q('s6','school','world','Welcher Planet ist unser Zuhause?',['Mars','Venus','Erde'],2,'Wir leben auf der Erde.'),
q('s7','school','world','Welches Instrument hat Tasten und Saiten?',['Klavier','Trommel','Flöte'],0,'Beim Klavier schlagen Hämmerchen auf Saiten.'),
q('s8','school','world','Wie viele Monate hat ein Jahr?',['10','12','14'],1,'Ein Kalenderjahr hat zwölf Monate.'),
q('s9','school','logic','Welche Zahl fehlt: 3, 6, 9, …?',['10','15','12'],2,'Jedes Mal kommen drei dazu.'),
q('s10','school','logic','Vier Kinder teilen zwölf Kekse gerecht. Wie viele bekommt jedes?',['3','4','6'],0,'Zwölf geteilt durch vier ergibt drei.'),
q('s11','school','logic','Ein Rechteck ist 5 cm lang und 3 cm breit. Wie groß ist sein Umfang?',['15 cm','16 cm','8 cm'],1,'Die vier Seiten sind 5 + 3 + 5 + 3 Zentimeter lang.'),
q('s12','school','logic','Wie viel ist die Hälfte von 18?',['6','8','9'],2,'Zwei mal neun ergibt achtzehn.'),
q('f1','family','nature','Welches Gas macht den größten Anteil der Erdatmosphäre aus?',['Stickstoff','Sauerstoff','Kohlendioxid'],0,'Rund 78 Prozent der trockenen Luft sind Stickstoff.'),
q('f2','family','nature','Welche Kraft hält Planeten auf ihren Umlaufbahnen?',['Magnetismus','Gravitation','Reibung'],1,'Die Gravitation zieht Massen zueinander.'),
q('f3','family','nature','Welcher Teil der Blüte bildet Pollen?',['Wurzel','Blütenblatt','Staubbeutel'],2,'Pollen entsteht in den Staubbeuteln.'),
q('f4','family','nature','Was beschreibt ein Ökosystem?',['Lebewesen und ihre Umwelt','Nur alle Bäume','Nur das Wetter'],0,'Ein Ökosystem umfasst Organismen und ihre unbelebte Umgebung.'),
q('f5','family','world','Wie viele Bits bilden ein Byte nach heutiger Definition?',['4','8','16'],1,'Ein Byte besteht aus acht Bits.'),
q('f6','family','world','Welche Einheit misst elektrische Leistung?',['Volt','Ohm','Watt'],2,'Watt ist die Einheit der Leistung.'),
q('f7','family','world','Welches Land hat Rom als Hauptstadt?',['Italien','Spanien','Griechenland'],0,'Rom ist die Hauptstadt Italiens.'),
q('f8','family','world','Was ist ein Palindrom?',['Ein Fremdwort','Ein vorwärts und rückwärts gleich lesbares Wort','Ein Reim'],1,'Zum Beispiel ist „Anna“ ein Palindrom.'),
q('f9','family','logic','Wie lautet die nächste Zahl: 1, 4, 9, 16, …?',['20','24','25'],2,'Dies sind Quadratzahlen: 1², 2², 3², 4², 5².'),
q('f10','family','logic','Ein Buch kostet 20 Euro. Wie viel kostet es mit 25 % Rabatt?',['15 Euro','16 Euro','5 Euro'],0,'Ein Viertel von 20 sind 5 Euro. Es bleiben 15 Euro.'),
q('f11','family','logic','Welche Zahl ist eine Primzahl?',['21','23','27'],1,'23 ist nur durch 1 und 23 teilbar.'),
q('f12','family','logic','Wie groß ist die Summe der Innenwinkel eines ebenen Dreiecks?',['90°','360°','180°'],2,'In der euklidischen Ebene ergeben die drei Winkel 180 Grad.')
];
const RESEARCH_QUESTIONS=[
 {
  "id": "x0-0",
  "level": "little",
  "topic": "space",
  "question": "Was ist die Sonne?",
  "answers": [
   "Ein Stern",
   "Ein Planet",
   "Eine Wolke"
  ],
  "correct": 0,
  "explanation": "Die Sonne ist der Stern in unserem Sonnensystem."
 },
 {
  "id": "x0-1",
  "level": "little",
  "topic": "space",
  "question": "Wie heißt der Planet, auf dem wir wohnen?",
  "answers": [
   "Erde",
   "Saturn",
   "Merkur"
  ],
  "correct": 0,
  "explanation": "Unser Planet heißt Erde."
 },
 {
  "id": "x0-2",
  "level": "little",
  "topic": "space",
  "question": "Was leuchtet am Tag und wärmt uns?",
  "answers": [
   "Die Sonne",
   "Der Mond",
   "Ein Komet"
  ],
  "correct": 0,
  "explanation": "Sonnenlicht liefert Licht und Wärme."
 },
 {
  "id": "x0-3",
  "level": "little",
  "topic": "space",
  "question": "Was kreist um unsere Erde?",
  "answers": [
   "Der Mond",
   "Die Sonne",
   "Eine Wolke"
  ],
  "correct": 0,
  "explanation": "Der Mond bewegt sich um die Erde."
 },
 {
  "id": "x0-4",
  "level": "little",
  "topic": "space",
  "question": "Womit können Menschen durch ein Teleskop schauen?",
  "answers": [
   "Mit den Augen",
   "Mit den Ohren",
   "Mit den Füßen"
  ],
  "correct": 0,
  "explanation": "Ein Teleskop hilft, weit entfernte Dinge zu sehen."
 },
 {
  "id": "x0-5",
  "level": "little",
  "topic": "space",
  "question": "Wie nennt man Menschen, die ins All fliegen?",
  "answers": [
   "Astronauten",
   "Gärtner",
   "Bäcker"
  ],
  "correct": 0,
  "explanation": "Astronautinnen und Astronauten reisen in den Weltraum."
 },
 {
  "id": "x1-0",
  "level": "school",
  "topic": "space",
  "question": "Wie viele Planeten hat unser Sonnensystem?",
  "answers": [
   "8",
   "6",
   "12"
  ],
  "correct": 0,
  "explanation": "Acht Planeten umkreisen die Sonne."
 },
 {
  "id": "x1-1",
  "level": "school",
  "topic": "space",
  "question": "Welcher Planet ist der Sonne am nächsten?",
  "answers": [
   "Merkur",
   "Mars",
   "Neptun"
  ],
  "correct": 0,
  "explanation": "Merkur hat die sonnennächste Umlaufbahn unter den Planeten."
 },
 {
  "id": "x1-2",
  "level": "school",
  "topic": "space",
  "question": "Welcher Planet ist der größte?",
  "answers": [
   "Jupiter",
   "Erde",
   "Venus"
  ],
  "correct": 0,
  "explanation": "Jupiter ist der größte Planet unseres Sonnensystems."
 },
 {
  "id": "x1-3",
  "level": "school",
  "topic": "space",
  "question": "Welcher Planet hat besonders auffällige Ringe?",
  "answers": [
   "Saturn",
   "Merkur",
   "Mars"
  ],
  "correct": 0,
  "explanation": "Saturn besitzt ein auffälliges Ringsystem."
 },
 {
  "id": "x1-4",
  "level": "school",
  "topic": "space",
  "question": "Was ist Pluto seit 2006 offiziell?",
  "answers": [
   "Ein Zwergplanet",
   "Ein Stern",
   "Ein Mond"
  ],
  "correct": 0,
  "explanation": "Pluto gehört zu den Zwergplaneten."
 },
 {
  "id": "x1-5",
  "level": "school",
  "topic": "space",
  "question": "Wie lange braucht die Erde ungefähr für einen Umlauf um die Sonne?",
  "answers": [
   "Ein Jahr",
   "Ein Tag",
   "Ein Monat"
  ],
  "correct": 0,
  "explanation": "Ein Umlauf dauert etwa 365 Tage."
 },
 {
  "id": "x2-0",
  "level": "family",
  "topic": "space",
  "question": "Welche Galaxie enthält unser Sonnensystem?",
  "answers": [
   "Milchstraße",
   "Andromedagalaxie",
   "Sombrerogalaxie"
  ],
  "correct": 0,
  "explanation": "Unser Sonnensystem liegt in der Milchstraße."
 },
 {
  "id": "x2-1",
  "level": "family",
  "topic": "space",
  "question": "Welcher Planet hat die höchste mittlere Oberflächentemperatur?",
  "answers": [
   "Venus",
   "Merkur",
   "Mars"
  ],
  "correct": 0,
  "explanation": "Die dichte Atmosphäre der Venus sorgt für einen starken Treibhauseffekt."
 },
 {
  "id": "x2-2",
  "level": "family",
  "topic": "space",
  "question": "Welche beiden Planeten gehören zu den Eisriesen?",
  "answers": [
   "Uranus und Neptun",
   "Jupiter und Saturn",
   "Merkur und Mars"
  ],
  "correct": 0,
  "explanation": "Uranus und Neptun werden als Eisriesen bezeichnet."
 },
 {
  "id": "x2-3",
  "level": "family",
  "topic": "space",
  "question": "Welche Planeten haben keine natürlichen Monde?",
  "answers": [
   "Merkur und Venus",
   "Erde und Mars",
   "Jupiter und Saturn"
  ],
  "correct": 0,
  "explanation": "Merkur und Venus besitzen keine bekannten natürlichen Satelliten."
 },
 {
  "id": "x2-4",
  "level": "family",
  "topic": "space",
  "question": "Was bezeichnet eine astronomische Einheit ungefähr?",
  "answers": [
   "Mittleren Abstand Erde–Sonne",
   "Durchmesser der Erde",
   "Abstand Erde–Mond"
  ],
  "correct": 0,
  "explanation": "Eine AE entspricht rund 150 Millionen Kilometern."
 },
 {
  "id": "x2-5",
  "level": "family",
  "topic": "space",
  "question": "Welcher Planet ist am weitesten von der Sonne entfernt?",
  "answers": [
   "Neptun",
   "Uranus",
   "Saturn"
  ],
  "correct": 0,
  "explanation": "Neptun ist der äußerste der acht Planeten."
 },
 {
  "id": "x3-0",
  "level": "little",
  "topic": "water",
  "question": "Was fällt bei Regen aus Wolken?",
  "answers": [
   "Wassertropfen",
   "Sandkörner",
   "Blätter"
  ],
  "correct": 0,
  "explanation": "Regen besteht aus kleinen Wassertropfen."
 },
 {
  "id": "x3-1",
  "level": "little",
  "topic": "water",
  "question": "Was wird aus einem Eiswürfel, wenn er warm genug wird?",
  "answers": [
   "Wasser",
   "Stein",
   "Holz"
  ],
  "correct": 0,
  "explanation": "Eis schmilzt zu flüssigem Wasser."
 },
 {
  "id": "x3-2",
  "level": "little",
  "topic": "water",
  "question": "Wie heißt gefrorenes Wasser?",
  "answers": [
   "Eis",
   "Salz",
   "Sand"
  ],
  "correct": 0,
  "explanation": "Eis ist Wasser in fester Form."
 },
 {
  "id": "x3-3",
  "level": "little",
  "topic": "water",
  "question": "Wo findest du viel Salzwasser?",
  "answers": [
   "Im Meer",
   "Im Trinkglas mit Leitungswasser",
   "In einer Regenpfütze"
  ],
  "correct": 0,
  "explanation": "Meerwasser enthält viele gelöste Salze."
 },
 {
  "id": "x3-4",
  "level": "little",
  "topic": "water",
  "question": "Was passiert mit Schnee in einem warmen Zimmer?",
  "answers": [
   "Er schmilzt",
   "Er wird Holz",
   "Er wird zu Sand"
  ],
  "correct": 0,
  "explanation": "Durch Wärme wird Schnee zu flüssigem Wasser."
 },
 {
  "id": "x3-5",
  "level": "little",
  "topic": "water",
  "question": "Was schützt dich bei Regen von oben?",
  "answers": [
   "Regenschirm",
   "Sonnenbrille",
   "Buch"
  ],
  "correct": 0,
  "explanation": "Ein Regenschirm hält viele Regentropfen ab."
 },
 {
  "id": "x4-0",
  "level": "school",
  "topic": "water",
  "question": "Wie heißt der Übergang von flüssigem Wasser zu Wasserdampf?",
  "answers": [
   "Verdunstung",
   "Erstarrung",
   "Schmelzen"
  ],
  "correct": 0,
  "explanation": "Bei der Verdunstung geht Wasser in den gasförmigen Zustand über."
 },
 {
  "id": "x4-1",
  "level": "school",
  "topic": "water",
  "question": "Was treibt den natürlichen Wasserkreislauf vor allem an?",
  "answers": [
   "Sonnenenergie",
   "Straßenverkehr",
   "Mondlicht"
  ],
  "correct": 0,
  "explanation": "Die Sonnenwärme ermöglicht die Verdunstung."
 },
 {
  "id": "x4-2",
  "level": "school",
  "topic": "water",
  "question": "Was entsteht, wenn Wasser tief in den Boden sickert?",
  "answers": [
   "Grundwasser",
   "Lava",
   "Wind"
  ],
  "correct": 0,
  "explanation": "Versickertes Wasser kann Grundwasser bilden."
 },
 {
  "id": "x4-3",
  "level": "school",
  "topic": "water",
  "question": "Aus was bestehen viele Wolken?",
  "answers": [
   "Wassertröpfchen oder Eiskristallen",
   "Rauch allein",
   "Sand allein"
  ],
  "correct": 0,
  "explanation": "Wolken enthalten winzige Tröpfchen oder Eiskristalle."
 },
 {
  "id": "x4-4",
  "level": "school",
  "topic": "water",
  "question": "Wie nennt man Regen und Schnee zusammen?",
  "answers": [
   "Niederschlag",
   "Windstille",
   "Sonnenschein"
  ],
  "correct": 0,
  "explanation": "Beides fällt als Niederschlag aus der Atmosphäre."
 },
 {
  "id": "x4-5",
  "level": "school",
  "topic": "water",
  "question": "Wohin fließt Regenwasser an einem Hang meist?",
  "answers": [
   "Bergab",
   "Bergauf",
   "Immer nach Osten"
  ],
  "correct": 0,
  "explanation": "Die Schwerkraft bewegt Wasser in tiefere Bereiche."
 },
 {
  "id": "x5-0",
  "level": "family",
  "topic": "water",
  "question": "Wie heißt der Übergang von Wasserdampf zu Flüssigkeit?",
  "answers": [
   "Kondensation",
   "Sublimation",
   "Schmelzen"
  ],
  "correct": 0,
  "explanation": "Beim Kondensieren wird gasförmiges Wasser flüssig."
 },
 {
  "id": "x5-1",
  "level": "family",
  "topic": "water",
  "question": "Wie nennt man den direkten Übergang von Eis zu Wasserdampf?",
  "answers": [
   "Sublimation",
   "Gefrieren",
   "Kondensation"
  ],
  "correct": 0,
  "explanation": "Sublimation überspringt den flüssigen Zustand."
 },
 {
  "id": "x5-2",
  "level": "family",
  "topic": "water",
  "question": "Wie nennt man die Wasserabgabe von Pflanzen über ihre Blätter?",
  "answers": [
   "Transpiration",
   "Erosion",
   "Sedimentation"
  ],
  "correct": 0,
  "explanation": "Pflanzen geben über ihre Blätter Wasser an die Luft ab."
 },
 {
  "id": "x5-3",
  "level": "family",
  "topic": "water",
  "question": "Warum bilden sich Tropfen außen an einem sehr kalten Glas?",
  "answers": [
   "Wasserdampf kondensiert",
   "Glas schmilzt",
   "Wasser entsteht aus Glas"
  ],
  "correct": 0,
  "explanation": "Luftfeuchte kann an der kalten Oberfläche kondensieren."
 },
 {
  "id": "x5-4",
  "level": "family",
  "topic": "water",
  "question": "Bei welcher Temperatur siedet reines Wasser ungefähr auf Meereshöhe?",
  "answers": [
   "100 °C",
   "0 °C",
   "50 °C"
  ],
  "correct": 0,
  "explanation": "Bei normalem Luftdruck liegt der Siedepunkt nahe 100 Grad Celsius."
 },
 {
  "id": "x5-5",
  "level": "family",
  "topic": "water",
  "question": "Welche Aussage über den Wasserkreislauf stimmt?",
  "answers": [
   "Er hat keinen festen Anfang",
   "Er endet immer im Meer",
   "Wasser verdunstet nur bei 100 Grad"
  ],
  "correct": 0,
  "explanation": "Wasser zirkuliert dauerhaft zwischen verschiedenen Speichern."
 },
 {
  "id": "x6-0",
  "level": "little",
  "topic": "language",
  "question": "Welches Wort reimt sich auf Haus?",
  "answers": [
   "Maus",
   "Baum",
   "Hund"
  ],
  "correct": 0,
  "explanation": "Haus und Maus enden mit demselben Klang."
 },
 {
  "id": "x6-1",
  "level": "little",
  "topic": "language",
  "question": "Welches Wort beginnt mit M?",
  "answers": [
   "Mütze",
   "Sonne",
   "Tisch"
  ],
  "correct": 0,
  "explanation": "Mütze beginnt mit dem Buchstaben M."
 },
 {
  "id": "x6-2",
  "level": "little",
  "topic": "language",
  "question": "Was ist das Gegenteil von groß?",
  "answers": [
   "Klein",
   "Rund",
   "Rot"
  ],
  "correct": 0,
  "explanation": "Groß und klein beschreiben gegensätzliche Größen."
 },
 {
  "id": "x6-3",
  "level": "little",
  "topic": "language",
  "question": "Welches Wort passt zu einem Hund?",
  "answers": [
   "Bellen",
   "Malen",
   "Nähen"
  ],
  "correct": 0,
  "explanation": "Hunde können bellen."
 },
 {
  "id": "x6-4",
  "level": "little",
  "topic": "language",
  "question": "Was ist die Mehrzahl von Ball?",
  "answers": [
   "Bälle",
   "Ballen",
   "Ball"
  ],
  "correct": 0,
  "explanation": "Mehr als ein Ball sind Bälle."
 },
 {
  "id": "x6-5",
  "level": "little",
  "topic": "language",
  "question": "Welches Wort reimt sich auf Fisch?",
  "answers": [
   "Tisch",
   "Buch",
   "Licht"
  ],
  "correct": 0,
  "explanation": "Fisch und Tisch haben den gleichen Endklang."
 },
 {
  "id": "x7-0",
  "level": "school",
  "topic": "language",
  "question": "Welches Wort ist ein Verb?",
  "answers": [
   "Laufen",
   "Schule",
   "Blau"
  ],
  "correct": 0,
  "explanation": "Laufen bezeichnet eine Tätigkeit."
 },
 {
  "id": "x7-1",
  "level": "school",
  "topic": "language",
  "question": "Welches Wort ist ein Adjektiv?",
  "answers": [
   "Schnell",
   "Hund",
   "Schreiben"
  ],
  "correct": 0,
  "explanation": "Schnell beschreibt eine Eigenschaft."
 },
 {
  "id": "x7-2",
  "level": "school",
  "topic": "language",
  "question": "Welche Wortgruppe enthält nur Nomen?",
  "answers": [
   "Tisch, Blume, Kind",
   "Laufen, schnell, rot",
   "Malen, lesen, springen"
  ],
  "correct": 0,
  "explanation": "Nomen bezeichnen hier Dinge oder Lebewesen."
 },
 {
  "id": "x7-3",
  "level": "school",
  "topic": "language",
  "question": "Welches Satzzeichen steht am Ende einer Frage?",
  "answers": [
   "Fragezeichen",
   "Komma",
   "Doppelpunkt"
  ],
  "correct": 0,
  "explanation": "Eine direkte Frage endet normalerweise mit einem Fragezeichen."
 },
 {
  "id": "x7-4",
  "level": "school",
  "topic": "language",
  "question": "Was ist die Mehrzahl von Buch?",
  "answers": [
   "Bücher",
   "Buchs",
   "Buche"
  ],
  "correct": 0,
  "explanation": "Die Pluralform von Buch lautet Bücher."
 },
 {
  "id": "x7-5",
  "level": "school",
  "topic": "language",
  "question": "Welcher Begriff ist ein zusammengesetztes Nomen?",
  "answers": [
   "Regenbogen",
   "Regen",
   "Bunt"
  ],
  "correct": 0,
  "explanation": "Regenbogen verbindet die Nomen Regen und Bogen."
 },
 {
  "id": "x8-0",
  "level": "family",
  "topic": "language",
  "question": "Welches Wort ist ein Synonym zu mutig?",
  "answers": [
   "Tapfer",
   "Feige",
   "Müde"
  ],
  "correct": 0,
  "explanation": "Synonyme haben eine ähnliche Bedeutung."
 },
 {
  "id": "x8-1",
  "level": "family",
  "topic": "language",
  "question": "Was ist eine Metapher?",
  "answers": [
   "Ein bildhafter Ausdruck",
   "Ein Fragezeichen",
   "Ein Rechtschreibfehler"
  ],
  "correct": 0,
  "explanation": "Metaphern übertragen Bedeutungen, etwa bei einem Meer aus Lichtern."
 },
 {
  "id": "x8-2",
  "level": "family",
  "topic": "language",
  "question": "Welches Wort ist ein Antonym zu hell?",
  "answers": [
   "Dunkel",
   "Strahlend",
   "Leuchtend"
  ],
  "correct": 0,
  "explanation": "Antonyme haben gegensätzliche Bedeutungen."
 },
 {
  "id": "x8-3",
  "level": "family",
  "topic": "language",
  "question": "Welches Wort ist im Satz „Sie liest ein Buch“ das Prädikat?",
  "answers": [
   "Liest",
   "Sie",
   "Buch"
  ],
  "correct": 0,
  "explanation": "Das Prädikat enthält das Verb, das die Handlung ausdrückt."
 },
 {
  "id": "x8-4",
  "level": "family",
  "topic": "language",
  "question": "Welche Form steht im Präteritum?",
  "answers": [
   "Ich ging",
   "Ich gehe",
   "Ich werde gehen"
  ],
  "correct": 0,
  "explanation": "Ging ist die Vergangenheitsform von gehen."
 },
 {
  "id": "x8-5",
  "level": "family",
  "topic": "language",
  "question": "Welches Wort enthält einen Diphthong?",
  "answers": [
   "Haus",
   "Hut",
   "Hase"
  ],
  "correct": 0,
  "explanation": "Au verbindet zwei Vokalklänge in einer Silbe."
 },
 {
  "id": "x9-0",
  "level": "little",
  "topic": "nature",
  "question": "Welches Tier hat einen langen Hals?",
  "answers": [
   "Giraffe",
   "Igel",
   "Maus"
  ],
  "correct": 0,
  "explanation": "Die Giraffe erreicht mit ihrem langen Hals hohe Blätter."
 },
 {
  "id": "x9-1",
  "level": "little",
  "topic": "nature",
  "question": "Welches Tier hat Stacheln auf dem Rücken?",
  "answers": [
   "Igel",
   "Ente",
   "Pferd"
  ],
  "correct": 0,
  "explanation": "Igel schützen sich mit ihren Stacheln."
 },
 {
  "id": "x9-2",
  "level": "little",
  "topic": "nature",
  "question": "Was wächst aus vielen Samen?",
  "answers": [
   "Eine Pflanze",
   "Ein Stein",
   "Ein Löffel"
  ],
  "correct": 0,
  "explanation": "Unter geeigneten Bedingungen keimen Samen und Pflanzen wachsen."
 },
 {
  "id": "x10-0",
  "level": "school",
  "topic": "nature",
  "question": "Womit atmen die meisten Fische?",
  "answers": [
   "Kiemen",
   "Flügeln",
   "Hufen"
  ],
  "correct": 0,
  "explanation": "Kiemen nehmen gelösten Sauerstoff aus dem Wasser auf."
 },
 {
  "id": "x10-1",
  "level": "school",
  "topic": "nature",
  "question": "Wie heißt die Entwicklung von einer Raupe zum Schmetterling?",
  "answers": [
   "Metamorphose",
   "Winterschlaf",
   "Wanderung"
  ],
  "correct": 0,
  "explanation": "Der Schmetterling verwandelt sich über das Puppenstadium."
 },
 {
  "id": "x10-2",
  "level": "school",
  "topic": "nature",
  "question": "Welcher dieser Vögel kann nicht fliegen?",
  "answers": [
   "Strauß",
   "Amsel",
   "Spatz"
  ],
  "correct": 0,
  "explanation": "Strauße laufen statt zu fliegen."
 },
 {
  "id": "x11-0",
  "level": "family",
  "topic": "nature",
  "question": "Welches Organ pumpt Blut durch den Körper?",
  "answers": [
   "Herz",
   "Leber",
   "Magen"
  ],
  "correct": 0,
  "explanation": "Das Herz hält den Blutkreislauf in Bewegung."
 },
 {
  "id": "x11-1",
  "level": "family",
  "topic": "nature",
  "question": "Wie nennt man Tiere, die sich überwiegend von Pflanzen ernähren?",
  "answers": [
   "Herbivoren",
   "Karnivoren",
   "Detritus"
  ],
  "correct": 0,
  "explanation": "Herbivoren sind Pflanzenfresser."
 },
 {
  "id": "x11-2",
  "level": "family",
  "topic": "nature",
  "question": "Welcher Stoff verleiht grünen Blättern ihre Farbe?",
  "answers": [
   "Chlorophyll",
   "Hämoglobin",
   "Keratin"
  ],
  "correct": 0,
  "explanation": "Chlorophyll absorbiert Licht für die Fotosynthese."
 },
 {
  "id": "x12-0",
  "level": "little",
  "topic": "world",
  "question": "Welche Farbe hat eine reife gelbe Banane?",
  "answers": [
   "Gelb",
   "Blau",
   "Lila"
  ],
  "correct": 0,
  "explanation": "Gelbe Bananen haben eine gelbe Schale."
 },
 {
  "id": "x12-1",
  "level": "little",
  "topic": "world",
  "question": "Womit schreibst du auf Papier?",
  "answers": [
   "Stift",
   "Kissen",
   "Teller"
  ],
  "correct": 0,
  "explanation": "Ein Stift hinterlässt Schrift auf Papier."
 },
 {
  "id": "x12-2",
  "level": "little",
  "topic": "world",
  "question": "Was benutzt du, um zu hören?",
  "answers": [
   "Ohren",
   "Knie",
   "Ellenbogen"
  ],
  "correct": 0,
  "explanation": "Mit den Ohren nehmen wir Geräusche wahr."
 },
 {
  "id": "x13-0",
  "level": "school",
  "topic": "world",
  "question": "Wie viele Tage hat eine Woche?",
  "answers": [
   "7",
   "10",
   "5"
  ],
  "correct": 0,
  "explanation": "Eine Woche umfasst sieben Tage."
 },
 {
  "id": "x13-1",
  "level": "school",
  "topic": "world",
  "question": "Was misst ein Thermometer?",
  "answers": [
   "Temperatur",
   "Länge",
   "Gewicht"
  ],
  "correct": 0,
  "explanation": "Ein Thermometer zeigt die Temperatur an."
 },
 {
  "id": "x13-2",
  "level": "school",
  "topic": "world",
  "question": "Welche Himmelsrichtung liegt Norden gegenüber?",
  "answers": [
   "Süden",
   "Osten",
   "Westen"
  ],
  "correct": 0,
  "explanation": "Norden und Süden sind entgegengesetzte Richtungen."
 },
 {
  "id": "x14-0",
  "level": "family",
  "topic": "world",
  "question": "Welche Einheit gehört zur Frequenz?",
  "answers": [
   "Hertz",
   "Meter",
   "Kilogramm"
  ],
  "correct": 0,
  "explanation": "Hertz gibt Schwingungen oder Wiederholungen pro Sekunde an."
 },
 {
  "id": "x14-1",
  "level": "family",
  "topic": "world",
  "question": "In welcher Stadt steht das Brandenburger Tor?",
  "answers": [
   "Berlin",
   "München",
   "Bremen"
  ],
  "correct": 0,
  "explanation": "Das Brandenburger Tor liegt im Zentrum Berlins."
 },
 {
  "id": "x14-2",
  "level": "family",
  "topic": "world",
  "question": "Wofür steht die Abkürzung km?",
  "answers": [
   "Kilometer",
   "Kilogramm",
   "Kubikmeter"
  ],
  "correct": 0,
  "explanation": "Ein Kilometer entspricht tausend Metern."
 }
];
// Fixed arithmetic tasks, distinct and exactly solvable; no network or generative AI.
const MATH_QUESTIONS=Array.from({length:12},(_,i)=>{
 const a=i+2,b=i%4+1,l=a+b,s=(i+3)*4,f=(i+4)*20;
 return [q('m-l'+i,'little','logic',a+' plus '+b+' ergibt?',[String(l),String(l+1),String(l-1)],0,a+' + '+b+' = '+l+'.'),q('m-s'+i,'school','logic','Was ergibt '+(i+3)+' mal 4?',[String(s),String(s+4),String(s-4)],0,(i+3)+' × 4 = '+s+'.'),q('m-f'+i,'family','logic','Was sind 15 Prozent von '+f+'?',[String(f*15/100),String(f*15/100+2),String(f*15/100-2)],0,'10 Prozent plus 5 Prozent ergeben '+(f*15/100)+'.')];
}).flat().filter(q=>q.level!=='little'||Number(q.answers[0])<=20);
export const QUESTIONS=[...STARTER_QUESTIONS,...RESEARCH_QUESTIONS,...MATH_QUESTIONS];
export const IDEAS=[
 ...[{"id":"i9","title":"Sockenpaare","duration":"5–10 Min.","text":"Sortiert saubere Socken nach Paaren. Erfindet anschließend Namen für die Muster."},{"id":"i10","title":"Fantasiereise","duration":"5 Min.","text":"Eine Person erzählt eine ruhige erfundene Reise. Die anderen ergänzen, was sie unterwegs entdecken."},{"id":"i11","title":"Geräuschkarte","duration":"10 Min.","text":"Hört vom Fenster oder einem ruhigen Platz aus auf Geräusche. Zeichnet für jedes gehörte Geräusch ein Symbol."},{"id":"i12","title":"Spiegelspiel","duration":"5 Min.","text":"Eine Person bewegt langsam Hände und Gesicht; die andere spiegelt die Bewegungen. Wechselt nach ein paar Versuchen."},{"id":"i13","title":"Reim-Werkstatt","duration":"10 Min.","text":"Wählt ein einfaches Wort und erfindet gemeinsam Reime, auch lustige Fantasiewörter."},{"id":"i14","title":"Bau-Auftrag","duration":"10–15 Min.","text":"Baut mit großen Bausteinen eine Brücke für ein Spielzeug. Probiert eine zweite Bauweise aus."},{"id":"i15","title":"Bildergeschichte","duration":"15 Min.","text":"Malt drei Bilder: einen Anfang, ein lustiges Problem und eine Lösung. Erzählt daraus eine Geschichte."},{"id":"i16","title":"Schattentheater","duration":"10 Min.","text":"Formt mit den Händen Schatten an der Wand, etwa mit einer normalen Raumleuchte. Erfindet dazu Figuren."},{"id":"i17","title":"Klatschzeichen","duration":"5 Min.","text":"Erfindet eine kurze Folge aus Klatschen und Pausen und gebt sie einander weiter. Alternativ mit Gesten."},{"id":"i18","title":"Wörter sammeln","duration":"10 Min.","text":"Nennt gemeinsam Dinge, die man im Garten, in der Küche oder im Weltall finden könnte."},{"id":"i19","title":"Papier-Faltbild","duration":"10 Min.","text":"Faltet ein Blatt, malt auf einer Hälfte eine Form und ergänzt auf der anderen die passende Hälfte."},{"id":"i20","title":"Gemeinsames Wimmelbild","duration":"15 Min.","text":"Malt ein Bild mit vielen kleinen Geschichten. Sucht später gegenseitig die versteckten Details."},{"id":"i21","title":"Fantasie-Wetterbericht","duration":"5 Min.","text":"Erfindet Wetter auf einem fremden Planeten. Erzählt, wie die Bewohner damit umgehen."},{"id":"i22","title":"Kategorien-Rallye","duration":"10 Min.","text":"Eine Person nennt eine Kategorie, etwa Obst. Findet gemeinsam möglichst viele passende Wörter, ohne Zeitdruck."},{"id":"i23","title":"Lieblingsbuch-Rätsel","duration":"10 Min.","text":"Beschreibt eine Figur aus einem gemeinsam gelesenen Buch, ohne ihren Namen zu nennen."},{"id":"i24","title":"Mini-Museum","duration":"15 Min.","text":"Wählt einige vertraute, ungefährliche Gegenstände aus. Jede Person erzählt, wofür einer da ist und warum er interessant ist."}],
 {id:'i1',title:'Farben-Safari',duration:'5–10 Min.',text:'Sucht gemeinsam im Zimmer fünf Dinge in unterschiedlichen Farben. Jede Person darf eine Farbe aussuchen.'},
 {id:'i2',title:'Geräusche-Rätsel',duration:'5–10 Min.',text:'Eine Person imitiert ein Tier oder ein Alltagsgeräusch. Die anderen raten. Danach wechselt ihr die Rollen.'},
 {id:'i3',title:'Geschichten-Kette',duration:'10–15 Min.',text:'Beginnt mit „Heute fanden wir eine geheimnisvolle Tür“. Jede Person ergänzt einen Satz. Wo führt eure Geschichte hin?'},
 {id:'i4',title:'Papier-Kunst',duration:'10–20 Min.',text:'Malt mit Papier und Stiften gemeinsam eine Fantasiestadt. Jede Person zeichnet einen Ort für die Stadt.'},
 {id:'i5',title:'Formen entdecken',duration:'5–10 Min.',text:'Findet in eurer Umgebung Kreise, Dreiecke und Rechtecke. Zeigt oder benennt eure Fundstücke.'},
 {id:'i6',title:'Wort-Schatz',duration:'10 Min.',text:'Wählt ein Thema, etwa Tiere. Nennt abwechselnd Begriffe dazu. Helft euch gegenseitig, wenn jemand nicht weiterweiß.'},
 {id:'i7',title:'Erfinderwerkstatt',duration:'10–15 Min.',text:'Erfindet ein lustiges Fantasiegerät. Was kann es? Zeichnet es oder beschreibt es einander.'},
 {id:'i8',title:'Bilder aus dem Kopf',duration:'10 Min.',text:'Eine Person beschreibt einen erfundenen Ort. Die andere malt ihn. Vergleicht anschließend eure Vorstellungen.'}
];
export function shuffled(items,rng=Math.random){
 const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
export function makeRound(level,topic,rng=Math.random,seen=[]){
 const pool=QUESTIONS.filter(q=>q.level===level&&(topic==='all'||q.topic===topic));
 const fresh=pool.filter(q=>!seen.includes(q.id));
 const used=pool.filter(q=>seen.includes(q.id));
 return [...shuffled(fresh,rng),...shuffled(used,rng)].slice(0,5)
 .map(q=>{const a=shuffled(q.answers.map((text,index)=>({text,correct:index===q.correct})),rng);
 return {...q,answers:a.map(x=>x.text),correct:a.findIndex(x=>x.correct)};});
}
