import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

const C={background:'#FFF9F3',white:'#FFFFFF',ink:'#193C48',muted:'#647D82',accent:'#087F87',accentDark:'#075D67',pale:'#E4F5F1',line:'#F0E5DC',coral:'#EE7867',sunny:'#FFE4AA'};
const topics=[
  ['Anmeldung & Konto','Wie melde ich mich an?','Öffne Familienfunke, gib deine E-Mail-Adresse und dein Passwort ein und tippe auf „Anmelden“. Du benötigst ein bereits eingerichtetes Konto.'],
  ['Anmeldung & Konto','Warum funktioniert meine Anmeldung nicht?','Prüfe die Schreibweise deiner E-Mail-Adresse und deines Passworts sowie deine Internetverbindung. Wenn du eine Meldung zur E-Mail-Bestätigung erhältst, schließe diese zuerst ab.'],
  ['Anmeldung & Konto','Wie ändere ich mein Passwort?','Öffne „Mehr“ → „Mein Profil“ → „Konto & Sicherheit“. Gib ein neues Passwort mit mindestens zwölf Zeichen ein und tippe auf „Passwort ändern“. Dafür musst du angemeldet sein.'],
  ['Anmeldung & Konto','Wie melde ich mich ab?','Öffne „Mehr“ → „Mein Profil“ → „Konto & Sicherheit“ und tippe auf „Abmelden“.'],
  ['Profil & Kontakte','Wo bearbeite ich mein Familienprofil?','Öffne „Mehr“ → „Mein Profil“ → „Über uns“. Ändere Anzeigenamen, Region oder Beschreibung und tippe auf „Angaben speichern“.'],
  ['Profil & Kontakte','Wie füge ich Hobbys hinzu?','Gehe zu „Mehr“ → „Mein Profil“ → „Hobbys“. Wähle bis zu zwölf Interessen und tippe anschließend auf „Interessen speichern“.'],
  ['Profil & Kontakte','Wie finde ich Familien in meiner Nähe?','Öffne unten „Familien“. Dort kannst du nach Familien suchen und die verfügbaren Filter für Interessen und Region nutzen. Eine genaue Adresse ist dafür nicht nötig.'],
  ['Profil & Kontakte','Wie werde ich für andere Familien sichtbar?','Öffne „Mehr“ → „Mein Profil“ → „Sichtbarkeit“. Aktiviere „Für andere Familien sichtbar“ und tippe auf „Sichtbarkeit speichern“. Die Freigabe deines Profils wird weiterhin berücksichtigt.'],
  ['Profil & Kontakte','Wie schicke ich eine Kontaktanfrage?','Öffne „Familien“, wähle ein Familienprofil aus und tippe auf die Schaltfläche zum Kontaktaufnehmen. Die andere Familie muss deine Anfrage erst annehmen.'],
  ['Profil & Kontakte','Wo finde ich Nachrichten und Kontakte?','Öffne „Mehr“ → „Kontakte“ für deine Anfragen und Verbindungen. Unter „Mehr“ → „Nachrichten“ kannst du mit bestätigten Kontakten chatten.'],
  ['Profil & Kontakte','Wie füge ich ein Profilfoto hinzu?','Öffne „Mehr“ → „Mein Profil“ → „Fotos“. Wähle ein Foto, ergänze bei Bedarf eine Bildbeschreibung und tippe auf „Foto einreichen“. Das Bild wird vor der Sichtbarkeit geprüft.'],
  ['Familienbasar','Wie stelle ich einen Artikel ein?','1. Öffne „Basar“ und tippe auf „＋ Inserieren“.\n2. Wähle bis zu fünf Artikelfotos aus.\n3. Fülle Titel, Kategorie und Zustand aus.\n4. Wähle Verkaufen, Verschenken oder Tauschen und ergänze nötige Angaben.\n5. Tippe auf „Anzeige kostenlos einreichen“. Dein Inserat erscheint nach Freigabe.'],
  ['Familienbasar','Wie funktioniert der Schnellverkauf?','Wähle Foto & Steckbrief. Fotografiere einen Artikel samt Etikett oder wähle Bilder aus. Mit Artikel aus Fotos erkennen kannst du freiwillig bis zu drei verkleinerte Bilder durch KI auswerten lassen. Übernimm und prüfe die Vorschläge, wähle Zustand, Mängel und Preis selbst, ergänze bei Bedarf eine persönliche Notiz und bestätige den Steckbrief. Die Anzeige wird wie gewohnt vor Veröffentlichung geprüft. Du kannst jederzeit manuell schreiben.'],
  ['Familienbasar','Wie funktioniert der Kistenmodus?','Öffne im Basar Kiste erfassen. Lege bis zu zehn Artikel sichtbar nebeneinander und fotografiere sie gemeinsam. Die freiwillige KI-Analyse schlägt einzelne Entwürfe vor. Prüfe jeden Artikel, ergänze ein eigenes Artikelfoto, Zustand, Mängel und Preis oder biete die übrigen Artikel gemeinsam als Paket an. Erst deine Einreichung startet die reguläre Prüfung. Entwürfe sind derzeit nur in der geöffneten Basar-Ansicht verfügbar.'],
  ['Familienbasar','Wie suche ich nach Artikeln?','Nutze im „Basar“ das Suchfeld, die Kategorieauswahl, „Filter anzeigen“ und die Sortierung. Du kannst unter anderem nach Angebotsart und Preis filtern.'],
  ['Familienbasar','Wo sehe ich meine eigenen Anzeigen?','Öffne „Basar“ und tippe auf „Meine“. Dort findest du deine eingereichten Anzeigen und ihren Status.'],
  ['Familienbasar','Wie speichere ich Artikel auf meiner Merkliste?','Tippe im Basar auf das Herz-Symbol einer Anzeige. Unter „♡ Merkliste“ siehst du deine gespeicherten, weiterhin verfügbaren Angebote. Erneutes Tippen entfernt das Angebot.'],
  ['Familienbasar','Wie ändere ich eine Anzeige?','Wähle „Basar“ → „Meine“, öffne deine Anzeige und tippe auf „Anzeige bearbeiten“. Du kannst Titel, Beschreibung, Kategorie, Preis und andere Angaben ändern sowie weitere Fotos hinzufügen. Nach dem Speichern wird alles erneut geprüft.'],
  ['Familienbasar','Wie füge ich mehrere Fotos hinzu?','Beim Erstellen kannst du bis zu fünf Fotos auswählen. Bei eigenen Anzeigen, die in Prüfung sind, kannst du weitere Bilder ergänzen. Bereits veröffentlichte Anzeigen musst du zum Hinzufügen zunächst über „Anzeige bearbeiten“ erneut einreichen.'],
  ['Familienbasar','Wie schreibe ich einem Verkäufer?','Öffne ein Inserat und tippe auf „Verkäufer kontaktieren“. Sobald die Kontaktanfrage angenommen ist, kannst du über „Nachricht an Verkäufer schreiben“ den Chat öffnen.'],
  ['Familienbasar','Wie markiere ich etwas als vergeben?','Öffne „Basar“ → „Meine Inserate“, wähle dein freigegebenes Inserat und tippe auf „Als vergeben markieren“. Bestätige die Nachfrage.'],
  ['Treffen & Kitas','Wo finde ich Veranstaltungen?','Öffne „Mehr“ → „Treffen & Veranstaltungen“. Dort findest du die eingereichten Familientreffen.'],
  ['Treffen & Kitas','Wie kann ich ein Treffen anlegen?','Öffne „Mehr“ → „Treffen & Veranstaltungen“ und erstelle dort einen Termin mit den erforderlichen Angaben.'],
  ['Treffen & Kitas','Wo finde ich Informationen zu Kitas?','Öffne „Mehr“ → „Kitas & Partnerwelt“. Dort findest du die vorhandenen Einrichtungen und angekündigten Veranstaltungen.'],
  ['Familienkarte','Wie finde ich Spielplätze oder Restaurants mit Wickeltisch?','Tippe unten auf „Karte“. Wähle eine Stadt oder zoome in die gewünschte Gegend und tippe auf „Hier nach Orten suchen“. Über die Filter findest du Spielplätze, Wickelmöglichkeiten und Ausflugsziele.'],
  ['Familienkarte','Woher stammen die Orte auf der Karte?','Familienfunke zeigt ausgewählte, recherchierte Ausflugstipps für Oder-Spree und die Umgebung. Die zusätzliche Ortssuche verwendet OpenStreetMap. Manche Ausstattungsmerkmale können fehlen oder veraltet sein. Vorschläge von Familien werden vor Veröffentlichung geprüft.'],
  ['Familienkarte','Wie finde ich die Ausflugstipps für Oder-Spree?','Öffne die „Karte“. Unter der Karte findest du die Ausflugstipps für Oder-Spree mit einzelnen Ortskarten. Tippe auf „Auf Karte“, um die gesamte Region zu sehen, oder auf einen Ort, um direkt dorthin zu springen. In den Ortsdetails gibt es einen Link zur offiziellen Informationsseite.'],
  ['Familienkarte','Gibt es auch Freizeitparks und Indoorspielplätze in ganz Deutschland?','Ja. Auf der Familienkarte findest du unter den regionalen Tipps den Bereich „Die große Familien-Auswahl“. Dort kannst du nach Freizeitparks, Indoorspielplätzen, Erlebnisbädern und Erlebniswelten filtern sowie Norden, Osten, Westen oder Süden auswählen. Öffne einen Ort über „Auf Karte ansehen“, um Adresse, Anbieterinfos und die Navigation mit Google Maps oder Apple Karten zu finden.'],
  ['Familienkarte','Sind Öffnungszeiten und Preise aller bundesweiten Ausflugsziele aktuell?','Nein. Wir hinterlegen feste Ausflugsziele mit geprüften Standorten und Anbieterseiten. Öffnungszeiten, Preise, Altersgrenzen, saisonale Verfügbarkeit und Ausstattung können sich ändern. Prüfe die aktuellen Angaben direkt auf der offiziellen Seite des Anbieters.'],
  ['Familienkarte','Kann ich mich mit Google Maps oder Apple Karten zum Ausflugsziel navigieren lassen?','Ja. Wähle auf der Familienkarte einen Ort. In dessen Detailansicht findest du „Google Maps“ und „Apple Karten“. Der externe Kartendienst übernimmt die Routenplanung; Startpunkt und Verkehrsmittel werden dort ausgewählt. Familienfunke benötigt hierfür keine eigene Standortfreigabe.'],
  ['Familienkarte','Wie kann ich einen Ort vorschlagen?','Öffne „Karte“ und tippe auf „Familienort vorschlagen“. Markiere den öffentlichen Ort auf der Karte, ergänze Name, Kategorie und eine Beschreibung und reiche ihn zur Prüfung ein. Bitte keine privaten Wohnadressen veröffentlichen.'],
  ['Familien-Wegweiser','Wo finde ich den Familien-Wegweiser?','Tippe in der unteren Navigation auf „Wegweiser“. Hier findest du eine Zeitleiste von der Schwangerschaft bis zum Kita-Start.'],
  ['Familien-Wegweiser','Wie öffne ich einen Schritt?','Wähle in der Zeitleiste eine Lebensphase. Tippe dann auf einen Schritt, um Zeitpunkt, zuständige Stelle, Unterlagen, Abhängigkeiten und Quellen zu sehen.'],
  ['Familien-Wegweiser','Wo finde ich Anlaufstellen für Brandenburg und Oder-Spree?','Öffne „Wegweiser“ und tippe im Kasten „Regionale Informationen“ auf „Brandenburg / Oder-Spree anzeigen“. Dort findest du die Elterngeldstelle, Kita-Antragsinformationen und Links zum Jugendamt. Die Auswahl ist freiwillig und ändert dein Profil nicht.'],
  ['Familien-Wegweiser','Wie erkenne ich verbindliche Fristen?','Öffne einen Schritt: Offiziell belegte Anmeldefristen, Grenzen der rückwirkenden Auszahlung und regionale Planungsrichtwerte sind gesondert gekennzeichnet. Prüfe vor einem Antrag die aktuellen Regeln auf der verlinkten amtlichen Seite.'],
  ['Familien-Wegweiser','Wie verwalte ich meine persönliche Checkliste?','Öffne einen Schritt und wähle „Offen“, „Begonnen“, „Erledigt“ oder „Nicht relevant“. Der Stand wird auf diesem Gerät für dein angemeldetes Konto gespeichert.'],
  ['Familien-Wegweiser','Muss ich alle Wegweiser-Schritte erledigen?','Nein. Der Wegweiser unterscheidet freiwillige Schritte, empfohlene Zeitpunkte und individuell abhängige Aufgaben. Prüfe rechtlich verbindliche Fristen bei der zuständigen offiziellen Stelle.'],
  ['Bedienung & Probleme','Wo ist der Bereich Familien & Inklusion?','Öffne „Mehr“ → „Familien & Inklusion“. Dort findest du Informationen zur Inklusion und Familienunterstützung.'],
  ['Bedienung & Probleme','Was tun, wenn ein Foto nicht hochgeladen wird?','Prüfe deine Internetverbindung und die Fotoberechtigung der App. Wähle das Bild erneut und beachte eventuelle Hinweise zu Dateigröße oder Prüfung.'],
  ['Bedienung & Probleme','Was kann ich tun, wenn die App nicht reagiert?','Schließe Familienfunke vollständig und öffne die App erneut. Prüfe die Internetverbindung und starte bei Bedarf dein Gerät neu.'],
  ['Bedienung & Probleme','Wie blockiere ich einen Kontakt?','Öffne den betreffenden Kontakt und verwende „Blockieren“. Gesperrte Kontakte kannst du unter „Mehr“ → „Mein Profil“ → „Konto & Sicherheit“ verwalten.']
];

const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function Block({title,children}){
  return <View style={styles.card}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}

export function AboutFamilienfunkeScreen(){
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <View style={styles.pill}><Text style={styles.pillText}>UNSERE GESCHICHTE</Text></View>
      <Text style={styles.heroTitle}>Aus Nachbarschaft wird Freundschaft.</Text>
      <Text style={styles.heroSub}>Warum wir Familienfunke ins Leben gerufen haben.</Text>
    </View>
    <Block title="Die Idee begann im Familienalltag">
      {'Wir sind selbst eine Familie und kennen den Spagat zwischen Beruf, Kindern und allem, was sonst noch organisiert werden muss. Da wir beide voll berufstätig sind, war es für uns nicht immer leicht, andere Familien kennenzulernen.\n\nBesonders nach einem Umzug in eine neue Stadt ist das schwierig: Man kennt noch kaum jemanden und im Alltag fehlt oft die Zeit, neue Freundschaften aufzubauen.'}
    </Block>
    <Block title="Den Familienalltag leichter machen">
      {'Auch die Suche nach Informationen und die vielen Anträge rund um Familie und Kinder haben uns beschäftigt – zum Beispiel bei Elterngeldstellen, dem Jugendamt oder anderen Behörden. Wir wissen aus eigener Erfahrung, wie unübersichtlich das sein kann.'}
    </Block>
    <Block title="Darum gibt es Familienfunke">
      {'Wir wollten einen Ort schaffen, der Familien miteinander verbindet: andere Eltern in der Nähe kennenlernen, gemeinsame Unternehmungen entdecken, Kinderartikel weitergeben und schneller zu hilfreichen Informationen finden.\n\nEin Ort von Familien für Familien, der den Alltag ein Stück einfacher machen soll.'}
    </Block>
    <View style={[styles.card,{backgroundColor:C.pale}]}>
      <Text style={styles.sectionTitle}>Schön, dass ihr dabei seid. ♡</Text>
      <Text style={styles.body}>Wir wünschen uns, dass aus einer Begegnung ein Gespräch entsteht – und vielleicht eine echte Freundschaft.</Text>
      <Text style={[styles.caption,{marginTop:12}]}>Das Team hinter Familienfunke</Text>
    </View>
  </ScrollView>;
}

export function TechnicalHelpScreen({initialCategory='Alle'}){
  const [category,setCategory]=useState(initialCategory);
  const [search,setSearch]=useState('');
  const [open,setOpen]=useState(null);
  const categories=useMemo(()=>['Alle',...new Set(topics.map(t=>t[0]))],[]);
  const results=useMemo(()=>topics.filter(([c,q,a])=>(category==='Alle'||category===c)&&normalized(q+' '+a).includes(normalized(search.trim()))),[category,search]);
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.h}>Hilfe & FAQ</Text>
    <Text style={[styles.caption,{marginBottom:17}]}>Schritt für Schritt durch Familienfunke. Suche nach einer Funktion oder wähle ein Thema.</Text>
    <View style={styles.card}>
      <Text style={styles.label}>Wie können wir dir helfen?</Text>
      <TextInput accessibilityLabel="Hilfe durchsuchen" value={search} onChangeText={setSearch}
        placeholder="z. B. Inserat einstellen oder Passwort" placeholderTextColor="#8D9EA0"
        style={styles.input}/>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      {categories.map(c=><Pressable key={c} accessibilityRole="button"
        accessibilityState={{selected:category===c}}
        style={[styles.chip,category===c&&styles.activeChip]}
        onPress={()=>{setCategory(c);setOpen(null);}}>
        <Text style={[styles.chipText,category===c&&{color:C.white}]}>{c}</Text>
      </Pressable>)}
    </ScrollView>
    <Text style={[styles.caption,{marginBottom:10}]}>{results.length} {results.length===1?'Antwort':'Antworten'} gefunden</Text>
    {results.length===0?<Block title="Keine passende Frage gefunden">Versuche es mit einem anderen Suchbegriff oder wähle „Alle“.</Block>:null}
    {results.map(([c,q,a])=><Pressable key={q} accessibilityRole="button"
      accessibilityLabel={q} accessibilityState={{expanded:open===q}}
      onPress={()=>setOpen(open===q?null:q)}
      style={styles.card}>
      <View style={styles.questionRow}>
        <View style={{flex:1}}><Text style={styles.overline}>{c}</Text><Text style={styles.question}>{q}</Text></View>
        <Text style={styles.toggle}>{open===q?'−':'+'}</Text>
      </View>
      {open===q?<Text style={[styles.body,{marginTop:13}]}>{a}</Text>:null}
    </Pressable>)}
  </ScrollView>;
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:C.background},
  content:{padding:19,paddingBottom:46},
  h:{fontSize:25,fontWeight:'900',color:C.ink,marginBottom:7},
  card:{padding:18,borderRadius:24,backgroundColor:C.white,borderWidth:1,borderColor:C.line,marginBottom:13},
  hero:{backgroundColor:C.accentDark,borderRadius:27,padding:23,marginBottom:16},
  pill:{alignSelf:'flex-start',backgroundColor:C.sunny,borderRadius:22,paddingHorizontal:12,paddingVertical:7,marginBottom:12},
  pillText:{fontSize:11,color:'#624315',fontWeight:'900',letterSpacing:1},
  heroTitle:{fontSize:26,color:C.white,fontWeight:'900',lineHeight:33,marginBottom:10},
  heroSub:{color:'#E5F8F6',fontSize:14,lineHeight:21},
  sectionTitle:{fontSize:18,fontWeight:'900',color:C.ink,marginBottom:11},
  body:{fontSize:15,lineHeight:23,color:C.ink},
  caption:{fontSize:13.5,lineHeight:21,color:C.muted},
  label:{fontSize:13,fontWeight:'800',color:C.ink,marginBottom:9},
  input:{minHeight:50,borderWidth:1,borderColor:'#D0DFDE',borderRadius:15,paddingHorizontal:14,fontSize:15,color:C.ink,backgroundColor:C.white},
  categories:{gap:8,paddingVertical:5,paddingBottom:15},
  chip:{borderWidth:1,borderColor:'#CBE8E2',backgroundColor:C.pale,borderRadius:22,paddingHorizontal:14,paddingVertical:11,minHeight:42},
  activeChip:{backgroundColor:C.accentDark,borderColor:C.accentDark},
  chipText:{color:C.accentDark,fontWeight:'800',fontSize:12.5},
  questionRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  overline:{fontSize:11,color:C.accentDark,marginBottom:7,fontWeight:'800'},
  question:{fontSize:16.5,color:C.ink,fontWeight:'900',lineHeight:23},
  toggle:{fontSize:23,color:C.accentDark},
});
