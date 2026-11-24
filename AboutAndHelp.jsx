import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {FAMILY_COLORS} from './FamilyTheme';

const C=FAMILY_COLORS;
const topics=[
  ['Anmeldung & Konto','Wie komme ich an eine Einladung?','Familienfunke ist derzeit eine geschlossene Testversion. Es gibt noch keinen allgemein verfügbaren Registrierungsprozess. Sobald ein Konto vom Betreiber eingerichtet wurde, kannst du dich mit E-Mail und Passwort anmelden.'],
  ['Anmeldung & Konto','Wie melde ich mich an?','Öffne Familienfunke, gib deine E-Mail-Adresse und dein Passwort ein und tippe auf „Anmelden“. Du benötigst ein bereits eingerichtetes Konto.'],
  ['Anmeldung & Konto','Warum funktioniert meine Anmeldung nicht?','Prüfe die Schreibweise deiner E-Mail-Adresse und deines Passworts sowie deine Internetverbindung. Wenn du eine Meldung zur E-Mail-Bestätigung erhältst, schließe diese zuerst ab.'],
  ['Anmeldung & Konto','Wie ändere ich mein Passwort?','Öffne das Menü oben rechts → Mein Profil → Konto & Sicherheit. Gib ein neues Passwort mit mindestens zwölf Zeichen ein und tippe auf „Passwort ändern“.'],
  ['Anmeldung & Konto','Wie melde ich mich ab?','Menü oben rechts → Mein Profil → Konto & Sicherheit → Abmelden. Ungespeicherte Profiländerungen musst du vorher bestätigen oder verwerfen.'],
  ['Profil & Kontakte','Wo bearbeite ich mein Familienprofil?','Menü oben rechts → Mein Profil → Über uns. Trage Anzeigenamen, Ort/Region und einen kurzen Steckbrief ein und tippe auf „Angaben speichern“. Dein Profil kann nach Änderungen erneut geprüft werden.'],
  ['Profil & Kontakte','Wie füge ich Hobbys hinzu?','Menü oben rechts → Mein Profil → Hobbys. Wähle bis zu zwölf Interessen und speichere die Auswahl.'],
  ['Profil & Kontakte','Wie finde ich Familien in meiner Nähe?','Öffne unten „Familien“. Dort kannst du nach Familien suchen und die verfügbaren Filter für Interessen und Region nutzen. Eine genaue Adresse ist dafür nicht nötig.'],
  ['Profil & Kontakte','Wie werde ich für andere Familien sichtbar?','Menü oben rechts → Mein Profil → Sichtbarkeit. Aktiviere „Für andere Familien sichtbar“ und speichere die Einstellung. Ein freigegebenes Konto bleibt Voraussetzung.'],
  ['Profil & Kontakte','Wie schicke ich eine Kontaktanfrage?','Öffne „Familien“, wähle ein Familienprofil aus und tippe auf die Schaltfläche zum Kontaktaufnehmen. Die andere Familie muss deine Anfrage erst annehmen.'],
  ['Profil & Kontakte','Wo finde ich Nachrichten und Kontakte?','Öffne das Menü oben rechts. Tippe auf „Nachrichten“ für private Unterhaltungen oder auf „Kontakte“ für Anfragen und bestehende Verbindungen. Du kannst beide Funktionen auch über die Menüsuche finden.'],
  ['Profil & Kontakte','Wie füge ich ein Profilfoto hinzu?','Menü oben rechts → Mein Profil → Fotos. Wähle ein Foto und reiche es ein. Profilfotos unterliegen weiterhin einer separaten Sicherheitsprüfung.'],
  ['Familienbasar','Wie stelle ich einen Artikel ein?','Öffne unten „Basar“ → „＋ Inserieren“ → „Einzelnen Artikel einstellen“. Ergänze Titel, Kategorie, Zustand, Preis beziehungsweise Angebotsart und optional bis zu fünf Fotos. Bestätige die Marktplatzregeln und tippe auf „Anzeige jetzt veröffentlichen“. Berechtigte Mitglieder benötigen keine manuelle Vorabfreigabe.'],
  ['Familienbasar','Wie funktioniert der Schnellverkauf?','Öffne im Basar „＋ Inserieren“ und wähle „Einzelnen Artikel einstellen“. Erstelle manuell einen Artikelsteckbrief und bestätige Zustand und mögliche Mängel. Eine kostenpflichtige automatische Foto-KI ist in der aktuellen Testversion deaktiviert; du musst dich nicht darauf verlassen.'],
  ['Familienbasar','Wie funktioniert der Kistenmodus?','Öffne unten „Basar“ → „＋ Inserieren“ → „Kiste erfassen“. Erstelle mehrere Artikelentwürfe und stelle daraus Pakete zusammen. Die Bilder und Merkmale müssen aktuell manuell kontrolliert und ergänzt werden. Der Kistenstand wird lokal auf deinem Gerät gespeichert; es gibt kein Cloud-Backup. Fertige Pakete kannst du direkt veröffentlichen, wenn die Regeln erfüllt sind.'],
  ['Familienbasar','Kann ich Einzelbilder aus einem Kistenfoto erstellen?','Im Kistenmodus lassen sich geeignete Fotoausschnitte selbst überprüfen und bearbeiten. Die automatische KI-Erkennung ist in der aktuellen Testversion ausgeschaltet. Verwende für unklare oder überlappende Artikel besser ein eigenes Foto und kontrolliere, dass keine persönlichen Details zu sehen sind.'],
  ['Familienbasar','Warum bekomme ich Hinweise zur Fotoqualität?','Fotos sollten ausreichend hell, scharf und vollständig sein. Hinweise zur Bildqualität sind Empfehlungen; eine automatische KI-Analyse ist derzeit nicht aktiv. Du kannst die Fotos manuell auswählen oder neu aufnehmen.'],
  ['Familienbasar','Was passiert, wenn ich eine Kiste schließe?','Deine bisher gespeicherte Kiste bleibt grundsätzlich lokal auf diesem Gerät erhalten. Sie ist kein Cloud-Backup. Bei Neuinstallation oder Datenlöschung kann sie verloren gehen. Bereits veröffentlichte Anzeigen bleiben unabhängig von den lokalen Kistenentwürfen bestehen.'],
  ['Familienbasar','Wie suche ich nach Artikeln?','Nutze im „Basar“ das Suchfeld, die Kategorieauswahl, „Filter anzeigen“ und die Sortierung. Du kannst unter anderem nach Angebotsart und Preis filtern.'],
  ['Familienbasar','Wo sehe ich meine eigenen Anzeigen?','Öffne das Menü oben rechts und tippe direkt auf „Meine Anzeigen“. Alternativ: unten „Basar“ → „Meine“. Dort siehst du veröffentlichte Angebote, Entwürfe und gesperrte Anzeigen.'],
  ['Familienbasar','Wie speichere ich Artikel auf meiner Merkliste?','Tippe im Basar auf das Herz-Symbol einer Anzeige. Unter „♡ Merkliste“ siehst du deine gespeicherten, weiterhin verfügbaren Angebote. Erneutes Tippen entfernt das Angebot.'],
  ['Familienbasar','Wie ändere ich eine Anzeige?','Menü oben rechts → Meine Anzeigen → gewünschte Anzeige → Anzeige bearbeiten. Ergänze die Daten und tippe auf „Änderungen direkt veröffentlichen“. Bei abgebrochenem Foto-Upload bleibt ein Entwurf erhalten.'],
  ['Familienbasar','Wie füge ich mehrere Fotos hinzu?','Beim Erstellen einer Anzeige kannst du bis zu fünf Fotos hinzufügen. Falls der Upload unterbrochen wird, öffne „Meine Anzeigen“, ergänze fehlende Fotos und tippe auf „Jetzt veröffentlichen“. Bei bereits veröffentlichten Angeboten nutze zuerst „Anzeige bearbeiten“.'],
  ['Familienbasar','Wie schreibe ich einem Verkäufer?','Öffne ein Inserat und tippe auf „Verkäufer kontaktieren“. Sobald die Kontaktanfrage angenommen ist, kannst du über „Nachricht an Verkäufer schreiben“ den Chat öffnen.'],
  ['Familienbasar','Wie markiere ich etwas als vergeben?','Menü oben rechts → Meine Anzeigen → veröffentlichtes Angebot → „Als vergeben markieren“. Das Angebot verschwindet anschließend aus der öffentlichen Suche. Eine Zahlung wird dadurch nicht ausgelöst.'],
  ['Familienbasar','Wie melde ich ein problematisches Angebot?','Öffne die Anzeige im Basar und tippe auf „Problem mit Anzeige melden“. Wähle einen Grund und beschreibe den Vorfall. Mehrere unabhängige Meldungen können das Angebot vorläufig ausblenden. Missbrauche die Meldung nicht für Streit oder Preisverhandlungen.'],
  ['Familienbasar','Warum ist meine Anzeige noch nicht sichtbar?','Wenn ein Foto-Upload oder die Veröffentlichung unterbrochen wurde, liegt die Anzeige möglicherweise als Entwurf vor. Menü oben rechts → Meine Anzeigen → Entwurf öffnen → Angaben prüfen → Jetzt veröffentlichen. Ist das Angebot gesperrt, wende dich an den Support.'],
  ['Bedienung & Probleme','Wie finde ich eine bestimmte Funktion?','Tippe oben rechts auf das Menü und gib in das Suchfeld ein, was du machen möchtest – zum Beispiel „Anzeigen“, „Passwort“, „Spielplätze“ oder „Kontakte“. Die passenden Bereiche können direkt geöffnet werden.'],
  ['Treffen & Kitas','Wo finde ich Veranstaltungen?','Menü oben rechts → Treffen & Veranstaltungen. Du kannst den Bereich auch über die Schnellaktion „Treffen planen“ auf der Startseite öffnen.'],
  ['Treffen & Kitas','Wie kann ich ein Treffen anlegen?','Öffne „Treffen & Veranstaltungen“ über das Menü oder die Startseite. Erstelle eine Aktivität mit Titel, künftigem Datum, Uhrzeit und Teilnehmerzahl. Private Treffen werden vor der öffentlichen Veröffentlichung weiterhin geprüft.'],
  ['Treffen & Kitas','Wo finde ich Informationen zu Kitas?','Menü oben rechts → Kitas & Partner. Dort findest du bereits bestätigte Einrichtungen und ihre Veranstaltungen.'],
  ['Familienkarte','Wie finde ich Spielplätze oder Restaurants mit Wickeltisch?','Tippe unten auf „Karte“. Wähle eine Stadt oder zoome in die gewünschte Gegend und tippe auf „Hier nach Orten suchen“. Über die Filter findest du Spielplätze, Wickelmöglichkeiten und Ausflugsziele.'],
  ['Familienkarte','Woher stammen die Orte auf der Karte?','Familienfunke zeigt ausgewählte, recherchierte Ausflugstipps für Oder-Spree und die Umgebung. Die zusätzliche Ortssuche verwendet OpenStreetMap. Manche Ausstattungsmerkmale können fehlen oder veraltet sein. Vorschläge von Familien werden vor Veröffentlichung geprüft.'],
  ['Familienkarte','Wie finde ich die Ausflugstipps für Oder-Spree?','Öffne die „Karte“. Unter der Karte findest du die Ausflugstipps für Oder-Spree mit einzelnen Ortskarten. Tippe auf „Auf Karte“, um die gesamte Region zu sehen, oder auf einen Ort, um direkt dorthin zu springen. In den Ortsdetails gibt es einen Link zur offiziellen Informationsseite.'],
  ['Familienkarte','Gibt es auch Freizeitparks und Indoorspielplätze in ganz Deutschland?','Ja. Auf der Familienkarte findest du unter den regionalen Tipps den Bereich „Die große Familien-Auswahl“. Dort kannst du nach Freizeitparks, Indoorspielplätzen, Erlebnisbädern und Erlebniswelten filtern sowie Norden, Osten, Westen oder Süden auswählen. Öffne einen Ort über „Auf Karte ansehen“, um Adresse, Anbieterinfos und die Navigation mit Google Maps oder Apple Karten zu finden.'],
  ['Familienkarte','Sind Öffnungszeiten und Preise aller bundesweiten Ausflugsziele aktuell?','Nein. Wir hinterlegen feste Ausflugsziele mit geprüften Standorten und Anbieterseiten. Öffnungszeiten, Preise, Altersgrenzen, saisonale Verfügbarkeit und Ausstattung können sich ändern. Prüfe die aktuellen Angaben direkt auf der offiziellen Seite des Anbieters.'],
  ['Familienkarte','Kann ich mich mit Google Maps oder Apple Karten zum Ausflugsziel navigieren lassen?','Ja. Wähle auf der Familienkarte einen Ort. In dessen Detailansicht findest du „Google Maps“ und „Apple Karten“. Der externe Kartendienst übernimmt die Routenplanung; Startpunkt und Verkehrsmittel werden dort ausgewählt. Familienfunke benötigt hierfür keine eigene Standortfreigabe.'],
  ['Familienkarte','Wie kann ich einen Ort vorschlagen?','Öffne „Karte“ und tippe auf „Familienort vorschlagen“. Markiere den öffentlichen Ort auf der Karte, ergänze Name, Kategorie und eine Beschreibung und reiche ihn zur Prüfung ein. Bitte keine privaten Wohnadressen veröffentlichen.'],
  ['Familien-Wegweiser','Wo finde ich den Familien-Wegweiser?','Tippe unten auf „Wissen“. Dort findest du den Familien-Wegweiser mit verschiedenen Lebensphasen und Informationen zu Leistungen und Anträgen.'],
  ['Familien-Wegweiser','Wie öffne ich einen Schritt?','Wähle in der Zeitleiste eine Lebensphase. Tippe dann auf einen Schritt, um Zeitpunkt, zuständige Stelle, Unterlagen, Abhängigkeiten und Quellen zu sehen.'],
  ['Familien-Wegweiser','Wo finde ich Anlaufstellen für Brandenburg und Oder-Spree?','Öffne „Wegweiser“ und tippe im Kasten „Regionale Informationen“ auf „Brandenburg / Oder-Spree anzeigen“. Dort findest du die Elterngeldstelle, Kita-Antragsinformationen und Links zum Jugendamt. Die Auswahl ist freiwillig und ändert dein Profil nicht.'],
  ['Familien-Wegweiser','Wie erkenne ich verbindliche Fristen?','Öffne einen Schritt: Offiziell belegte Anmeldefristen, Grenzen der rückwirkenden Auszahlung und regionale Planungsrichtwerte sind gesondert gekennzeichnet. Prüfe vor einem Antrag die aktuellen Regeln auf der verlinkten amtlichen Seite.'],
  ['Familien-Wegweiser','Wie verwalte ich meine persönliche Checkliste?','Öffne einen Schritt und wähle „Offen“, „Begonnen“, „Erledigt“ oder „Nicht relevant“. Der Stand wird auf diesem Gerät für dein angemeldetes Konto gespeichert.'],
  ['Familien-Wegweiser','Muss ich alle Wegweiser-Schritte erledigen?','Nein. Der Wegweiser unterscheidet freiwillige Schritte, empfohlene Zeitpunkte und individuell abhängige Aufgaben. Prüfe rechtlich verbindliche Fristen bei der zuständigen offiziellen Stelle.'],
  ['Bedienung & Probleme','Wo ist der Bereich Familien & Inklusion?','Öffne das Menü oben rechts → Inklusion & Teilhabe. Hier findest du passende Informationen und Anlaufstellen.'],
  ['Bedienung & Probleme','Was tun, wenn ein Foto nicht hochgeladen wird?','Prüfe deine Internetverbindung und die Fotoberechtigung der App. Wähle das Bild erneut und beachte eventuelle Hinweise zu Dateigröße oder Prüfung.'],
  ['Bedienung & Probleme','Was kann ich tun, wenn die App nicht reagiert?','Schließe Familienfunke vollständig und öffne die App erneut. Prüfe die Internetverbindung und starte bei Bedarf dein Gerät neu.'],
  ['Bedienung & Probleme','Wie blockiere ich einen Kontakt?','Öffne das betreffende Familienprofil oder die Unterhaltung und verwende „Blockieren“. Gesperrte Kontakte verwaltest du im Menü oben rechts unter Mein Profil → Konto & Sicherheit.']
];

const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function Block({title,children}){
  return <View style={styles.card}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}

export function AboutFamilienfunkeScreen(){
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <View style={styles.pill}><Text style={styles.pillText}>UNSERE GESCHICHTE</Text></View>
      <Text accessibilityRole="header" style={styles.heroTitle}>Aus Nachbarschaft wird Freundschaft.</Text>
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

const FAQ_DEFAULT_ROUTES={
 'Anmeldung & Konto':['profile','Mein Profil öffnen'],
 'Profil & Kontakte':['profile','Mein Profil öffnen'],
 'Familienbasar':['market','Familienbasar öffnen'],
 'Treffen & Kitas':['events','Treffen & Veranstaltungen öffnen'],
 'Familienkarte':['map','Familienkarte öffnen'],
 'Familien-Wegweiser':['guide','Wissen & Anträge öffnen']
};
function faqDestination(category,question){
 if(category==='Familienbasar'){
   if(/eigene Anzeigen|Wie ändere ich eine Anzeige|mehrere Fotos|als vergeben|noch nicht sichtbar/i.test(question))
     return ['myListings','Meine Anzeigen öffnen'];
   if(/stelle ich einen Artikel ein|Schnellverkauf|Kistenmodus/i.test(question))
     return ['sell','Anzeige erstellen'];
 }
 if(category==='Profil & Kontakte'){
   if(/Nachrichten und Kontakte/.test(question))return ['chat','Nachrichten öffnen'];
   if(/Familien in meiner Nähe/.test(question))return ['discover','Familien entdecken'];
   if(/Kontaktanfrage/.test(question))return ['contacts','Kontakte öffnen'];
 }
 if(category==='Treffen & Kitas'&&/Kitas/.test(question))
   return ['partners','Kitas & Partner öffnen'];
 if(category==='Bedienung & Probleme'){
   if(/Inklusion/.test(question))return ['inclusion','Inklusion & Teilhabe öffnen'];
   if(/Funktion/.test(question))return ['home','Zur Startseite'];
 }
 return FAQ_DEFAULT_ROUTES[category]||null;
}
export function TechnicalHelpScreen({initialCategory='Alle',onNavigate}){
  const [category,setCategory]=useState(initialCategory);
  const [search,setSearch]=useState('');
  const [open,setOpen]=useState(null);
  const categories=useMemo(()=>['Alle',...new Set(topics.map(t=>t[0]))],[]);
  const results=useMemo(()=>topics.filter(([c,q,a])=>(category==='Alle'||category===c)&&normalized(c+' '+q+' '+a).includes(normalized(search.trim()))),[category,search]);
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={styles.h}>Hilfe & FAQ</Text>
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
    {search.length>0?<Pressable accessibilityRole="button" onPress={()=>{setSearch('');setCategory('Alle');}}
      style={styles.resetSearch}><Text style={styles.resetSearchText}>Suche und Filter zurücksetzen</Text></Pressable>:null}
    <Text accessibilityLiveRegion="polite" style={[styles.caption,{marginBottom:10}]}>{results.length} {results.length===1?'Antwort':'Antworten'} gefunden</Text>
    {results.length===0?<Block title="Keine passende Frage gefunden">Versuche es mit einem anderen Suchbegriff oder wähle „Alle“.</Block>:null}
    {results.map(([c,q,a])=>{
      const destination=faqDestination(c,q);
      return <View key={q} style={[styles.card,{minHeight:48}]}>
        <Pressable accessibilityRole="button"
          accessibilityLabel={q} accessibilityState={{expanded:open===q}}
          onPress={()=>setOpen(open===q?null:q)} style={styles.questionTap}>
          <View style={styles.questionRow}>
            <View style={{flex:1}}><Text style={styles.overline}>{c}</Text><Text style={styles.question}>{q}</Text></View>
            <Text style={styles.toggle}>{open===q?'−':'+'}</Text>
          </View>
        </Pressable>
        {open===q?<View>
          <Text style={[styles.body,{marginTop:13}]}>{a}</Text>
          {onNavigate&&destination?<Pressable accessibilityRole="button"
            accessibilityLabel={destination[1]} onPress={()=>onNavigate(destination[0])}
            style={({pressed})=>[styles.directAction,pressed&&{opacity:.8}]}>
            <Text style={styles.directActionText}>{destination[1]}</Text>
            <Text style={styles.directActionText}>›</Text>
          </Pressable>:null}
        </View>:null}
      </View>;
    })}
  </ScrollView>;
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:C.background},
  content:{padding:19,paddingBottom:46},
  h:{fontSize:25,fontWeight:'900',color:C.ink,marginBottom:7},
  card:{padding:18,borderRadius:24,backgroundColor:C.white,borderWidth:1,borderColor:C.line,marginBottom:13},
  hero:{backgroundColor:C.sun,borderRadius:25,padding:23,marginBottom:16},
  pill:{alignSelf:'flex-start',backgroundColor:C.white,borderRadius:22,paddingHorizontal:12,paddingVertical:7,marginBottom:12},
  pillText:{fontSize:11,color:'#624315',fontWeight:'900',letterSpacing:1},
  heroTitle:{fontSize:26,color:C.ink,fontWeight:'900',lineHeight:33,marginBottom:10},
  heroSub:{color:'#66512F',fontSize:14,lineHeight:21},
  sectionTitle:{fontSize:18,fontWeight:'900',color:C.ink,marginBottom:11},
  body:{fontSize:15,lineHeight:23,color:C.ink},
  caption:{fontSize:13.5,lineHeight:21,color:C.muted},
  label:{fontSize:13,fontWeight:'800',color:C.ink,marginBottom:9},
  input:{minHeight:50,borderWidth:1,borderColor:'#D0DFDE',borderRadius:15,paddingHorizontal:14,fontSize:15,color:C.ink,backgroundColor:C.white},
  categories:{gap:8,paddingVertical:5,paddingBottom:15},
  chip:{borderWidth:1,borderColor:'#CBE8E2',backgroundColor:C.pale,borderRadius:22,paddingHorizontal:14,paddingVertical:11,minHeight:44},
  activeChip:{backgroundColor:C.accentDark,borderColor:C.accentDark},
  chipText:{color:C.accentDark,fontWeight:'800',fontSize:12.5},
  questionTap:{minHeight:48,justifyContent:'center'},
  directAction:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    marginTop:14,minHeight:48,paddingHorizontal:15,backgroundColor:C.mint,borderRadius:14},
  directActionText:{fontSize:15,fontWeight:'900',color:C.accentDark},
  resetSearch:{minHeight:44,alignSelf:'flex-start',paddingHorizontal:10,justifyContent:'center'},
  resetSearchText:{color:C.accentDark,fontWeight:'800',fontSize:14},
  questionRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
  overline:{fontSize:11,color:C.accentDark,marginBottom:7,fontWeight:'800'},
  question:{fontSize:16.5,color:C.ink,fontWeight:'900',lineHeight:23},
  toggle:{fontSize:23,color:C.accentDark},
});
