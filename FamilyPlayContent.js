// Handwritten starter content. Nothing is generated or tracked at runtime.
export const LEVELS=[['little','4–6 Jahre'],['school','7–10 Jahre'],['family','Ab 11 / Familie']];
export const TOPICS=[['all','Gemischt'],['nature','Natur & Tiere'],['world','Wissen & Alltag'],['logic','Knobeln']];
const q=(id,level,topic,question,answers,correct,explanation)=>({id,level,topic,question,answers,correct,explanation});
export const QUESTIONS=[
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
export const IDEAS=[
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
export function makeRound(level,topic,rng=Math.random){
 return shuffled(QUESTIONS.filter(q=>q.level===level&&(topic==='all'||q.topic===topic)),rng).slice(0,5)
 .map(q=>{const a=shuffled(q.answers.map((text,index)=>({text,correct:index===q.correct})),rng);
 return {...q,answers:a.map(x=>x.text),correct:a.findIndex(x=>x.correct)};});
}
