import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Redaktionelle Ausflugsideen, KEINE automatisch verifizierten Orte, Preise,
// Öffnungszeiten oder behaupteten Live-Verfügbarkeiten.
// Die externe Kartensuche startet nur nach ausdrücklichem Antippen.
const IDEAS = [
  {id:'spielplatz',title:'Spielplatz entdecken',kind:'Draußen',cost:'meist kostenlos',ages:['0–2','3–5','6–10'],duration:'1–2 Stunden',search:'Spielplatz',description:'Eine neue Rutsche ausprobieren, zusammen schaukeln und andere Familien kennenlernen.',prepare:'Wasser, Snacks und eventuell Wechselkleidung mitnehmen.'},
  {id:'wald',title:'Kleine Waldexpedition',kind:'Draußen',cost:'meist kostenlos',ages:['3–5','6–10','11+'],duration:'1–3 Stunden',search:'Wald',description:'Blätter, Zapfen und Spuren entdecken – mit einer kleinen selbst ausgedachten Schatzsuche.',prepare:'Wetterfeste Schuhe, Trinkwasser und Rücksicht auf die Natur.'},
  {id:'bibliothek',title:'Vorlesestunde oder Bücherei',kind:'Drinnen',cost:'oft kostenlos',ages:['0–2','3–5','6–10'],duration:'30–90 Minuten',search:'Stadtbibliothek',description:'Gemeinsam Bilderbücher aussuchen oder an einem Kinderprogramm teilnehmen.',prepare:'Aktuelle Kinderveranstaltungen und Anmeldung der Bücherei prüfen.'},
  {id:'tierpark',title:'Tiere beobachten',kind:'Draußen',cost:'Eintritt möglich',ages:['0–2','3–5','6–10','11+'],duration:'2–4 Stunden',search:'Tierpark',description:'Tiere kennenlernen und einen entspannten Rundgang im Tierpark planen.',prepare:'Eintritt, Tierwohl-Regeln, Barrierefreiheit und Öffnungszeiten prüfen.'},
  {id:'museum',title:'Mitmach-Museum besuchen',kind:'Drinnen',cost:'Eintritt möglich',ages:['3–5','6–10','11+'],duration:'1–3 Stunden',search:'Kindermuseum',description:'Ausprobieren, experimentieren und gemeinsam etwas Neues entdecken.',prepare:'Familienangebote, Altersfreigaben und Tickets vorab ansehen.'},
  {id:'schwimmen',title:'Familienbad besuchen',kind:'Drinnen',cost:'Eintritt möglich',ages:['0–2','3–5','6–10','11+'],duration:'1–3 Stunden',search:'Hallenbad',description:'Planschen, schwimmen und gemeinsam Zeit im Wasser verbringen.',prepare:'Schwimmzeiten für Familien prüfen; Kinder am Wasser immer beaufsichtigen.'},
  {id:'natur',title:'Parkrunde mit Picknick',kind:'Draußen',cost:'meist kostenlos',ages:['0–2','3–5','6–10','11+'],duration:'1–2 Stunden',search:'Park',description:'Eine gemütliche Runde durch den Park und danach gemeinsam picknicken.',prepare:'Decke, wettergerechte Kleidung und Müllbeutel einpacken.'},
  {id:'bauernhof',title:'Lernbauernhof entdecken',kind:'Draußen',cost:'Eintritt möglich',ages:['3–5','6–10'],duration:'1–3 Stunden',search:'Erlebnisbauernhof',description:'Herausfinden, wie ein Bauernhof funktioniert und wo unsere Lebensmittel herkommen.',prepare:'Nur öffentlich angebotene Besuche buchen, nicht einfach Privatgelände betreten.'},
  {id:'klettern',title:'Kinder-Kletterhalle',kind:'Drinnen',cost:'Eintritt möglich',ages:['6–10','11+'],duration:'1–2 Stunden',search:'Kletterhalle',description:'Gemeinsam aktiv werden und altersgerechte Kletterangebote ausprobieren.',prepare:'Einweisung, Altersgrenzen und Sicherungsvorgaben vorher prüfen.'},
  {id:'fahrrad',title:'Familien-Fahrradrunde',kind:'Draußen',cost:'meist kostenlos',ages:['6–10','11+'],duration:'1–3 Stunden',search:'Familienradweg',description:'Eine einfache Tour mit schönen Pausen und Zeit für kleine Entdeckungen.',prepare:'Helme, Verkehrssicherheit und eine kindgerechte Route einplanen.'},
  {id:'kino',title:'Kinderkino-Nachmittag',kind:'Drinnen',cost:'Eintritt möglich',ages:['3–5','6–10','11+'],duration:'1–3 Stunden',search:'Kino',description:'Zusammen einen altersgerechten Film anschauen und danach darüber erzählen.',prepare:'FSK, Lautstärke, Spielzeiten und Kinderveranstaltungen prüfen.'},
  {id:'jugend',title:'Bowling oder Bewegungstreff',kind:'Drinnen',cost:'Eintritt möglich',ages:['6–10','11+'],duration:'1–2 Stunden',search:'Bowling',description:'Ein gemeinsamer Nachmittag mit Bewegung, Spiel und freundlichem Wettbewerb.',prepare:'Altersgerechte Angebote und Reservierungsbedarf prüfen.'}
];
const AGE_OPTIONS=['Alle','0–2','3–5','6–10','11+'];
const PLACE_OPTIONS=['Alle','Draußen','Drinnen'];
const COST_OPTIONS=['Alle','Eher kostenlos','Eintritt möglich'];

function FilterPill({label,selected,onPress}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected}}
  style={[styles.pill,selected&&styles.pillActive]} onPress={onPress}>
  <Text style={[styles.pillText,selected&&styles.pillTextActive]}>{label}</Text>
 </Pressable>;
}

export default function FamilyOutingIdeas({initialRegion='',onPlan}){
 const [age,setAge]=useState('Alle');
 const [kind,setKind]=useState('Alle');
 const [cost,setCost]=useState('Alle');
 const [region,setRegion]=useState(initialRegion);
 const [expanded,setExpanded]=useState(null);
 const results=IDEAS.filter(x=>(age==='Alle'||x.ages.includes(age))
  &&(kind==='Alle'||x.kind===kind)
  &&(cost==='Alle'||(cost==='Eher kostenlos'?!x.cost.includes('Eintritt'):x.cost.includes('Eintritt'))));
 function openMapSearch(idea){
  const place=region.trim();
  if(place.length<2){Alert.alert('Region fehlt','Bitte zuerst eine Stadt oder grobe Region eingeben.');return;}
  const search=[idea.search,place].join(', ');
  const url='https://www.openstreetmap.org/search?query='+encodeURIComponent(search);
  Linking.openURL(url).catch(()=>Alert.alert('Karte nicht geöffnet','Die externe Kartensuche konnte nicht gestartet werden.'));
 }
 return <View style={styles.root}>
  <View style={styles.hero}>
   <View pointerEvents="none" style={styles.sun}/>
   <Text style={styles.kicker}>FAMILIENFUNKE · GEMEINSAM RAUS</Text>
   <Text style={styles.heading}>Was machen wir heute?</Text>
   <Text style={styles.heroBody}>Ideen für kleine Abenteuer, Entdeckungen und schöne Zeit mit anderen Familien.</Text>
  </View>
  <Text style={styles.section}>Eure Stadt oder Region</Text>
  <TextInput value={region} onChangeText={setRegion} maxLength={80}
   autoCapitalize="words" autoCorrect={false} style={styles.input}
   placeholder="z. B. Nürnberg, Potsdam, Beeskow"
   placeholderTextColor="#8E9997" accessibilityLabel="Grobe Region für die Ausflugssuche"/>
  <Text style={styles.hint}>Keine GPS-Ortung. Erst wenn du auf „Orte suchen“ tippst, wird der Suchbegriff an OpenStreetMap übergeben.</Text>
  <Text style={styles.section}>Alter der Kinder</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
   contentContainerStyle={styles.pills}>{AGE_OPTIONS.map(x=><FilterPill key={x} label={x==='Alle'?'Alle Altersgruppen':x+' Jahre'} selected={age===x} onPress={()=>setAge(x)}/>)}</ScrollView>
  <Text style={styles.section}>Draußen oder drinnen?</Text>
  <View style={styles.pills}>{PLACE_OPTIONS.map(x=><FilterPill key={x} label={x} selected={kind===x} onPress={()=>setKind(x)}/>)}</View>
  <Text style={styles.section}>Ungefähres Budget</Text>
  <View style={styles.pills}>{COST_OPTIONS.map(x=><FilterPill key={x} label={x} selected={cost===x} onPress={()=>setCost(x)}/>)}</View>
  <Text style={styles.results}>{results.length} {results.length===1?'Idee':'Ideen'} für euch</Text>
  {results.length===0?<View style={styles.empty}>
   <Text style={styles.ideaTitle}>Keine passenden Ideen</Text>
   <Text style={styles.hint}>Probiert eine andere Altersgruppe oder wählt „Alle“.</Text>
  </View>:results.map(idea=><View key={idea.id} style={styles.card}>
   <View style={styles.cardTop}>
    <View style={styles.iconCircle}><Text style={styles.iconMark}>{idea.kind==='Draußen'?'☀':'⌂'}</Text></View>
    <View style={{flex:1}}>
     <Text style={styles.ideaTitle}>{idea.title}</Text>
     <Text style={styles.meta}>{idea.kind} · {idea.duration} · {idea.cost}</Text>
    </View>
   </View>
   <Text style={styles.description}>{idea.description}</Text>
   <Pressable accessibilityRole="button" onPress={()=>setExpanded(current=>current===idea.id?null:idea.id)}
    style={styles.detailToggle}>
    <Text style={styles.detailText}>{expanded===idea.id?'Weniger anzeigen':'Was sollte man mitnehmen?'}</Text>
    <Text style={styles.detailText}>{expanded===idea.id?'−':'+'}</Text>
   </Pressable>
   {expanded===idea.id?<Text style={styles.prepare}>{idea.prepare}</Text>:null}
   <View style={styles.actions}>
    <Pressable accessibilityRole="button" style={styles.mapButton} onPress={()=>openMapSearch(idea)}>
     <Text style={styles.mapButtonText}>Orte suchen ↗</Text>
    </Pressable>
    <Pressable accessibilityRole="button" style={styles.planButton} onPress={()=>onPlan?.(idea,region.trim())}>
     <Text style={styles.planButtonText}>Treffen planen</Text>
    </Pressable>
   </View>
  </View>)}
  <Text style={styles.disclaimer}>Das sind allgemeine Freizeitideen, keine überprüften konkreten Ausflugsziele. Eintritt, Öffnungszeiten, Eignung und Zugänglichkeit bitte beim jeweiligen Anbieter prüfen. Persönliche Adressen gehören nicht in öffentliche Termine.</Text>
 </View>;
}

const styles=StyleSheet.create({
 root:{gap:0,paddingBottom:13},
 hero:{backgroundColor:'#FFF0D3',borderRadius:24,padding:21,overflow:'hidden',borderWidth:1,borderColor:'#F2D7A3',marginBottom:24},
 sun:{position:'absolute',right:-58,top:-92,width:170,height:170,borderRadius:85,backgroundColor:'#FFD98E'},
 kicker:{fontSize:10,color:'#986525',fontWeight:'900',letterSpacing:1.3,marginBottom:10},
 heading:{fontSize:23,fontWeight:'900',color:'#243E43',letterSpacing:-.5},
 heroBody:{fontSize:14,color:'#405759',lineHeight:21,marginTop:9,maxWidth:275},
 section:{fontSize:15.5,fontWeight:'900',color:'#243E43',marginTop:11,marginBottom:11},
 input:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E4D8C8',borderRadius:15,paddingHorizontal:14,minHeight:51,fontSize:15,color:'#243E43'},
 hint:{fontSize:12.5,lineHeight:19,color:'#6F8082',marginTop:9,marginBottom:13},
 pills:{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:14},
 pill:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DDDFD7',borderRadius:18,paddingHorizontal:12,paddingVertical:9,minHeight:34},
 pillActive:{backgroundColor:'#FFF0D3',borderColor:'#EAB85E'},
 pillText:{fontSize:12,color:'#617679',fontWeight:'700'},
 pillTextActive:{color:'#77511D',fontWeight:'900'},
 results:{fontSize:17,fontWeight:'900',color:'#243E43',marginTop:9,marginBottom:14},
 card:{backgroundColor:'#FFFFFF',borderRadius:21,borderWidth:1,borderColor:'#ECE0D2',padding:15,marginBottom:12},
 cardTop:{flexDirection:'row',alignItems:'center',gap:12},
 iconCircle:{width:43,height:43,borderRadius:14,backgroundColor:'#FFEDCA',alignItems:'center',justifyContent:'center'},
 iconMark:{fontSize:21,color:'#B77B29',fontWeight:'900'},
 ideaTitle:{fontSize:16,fontWeight:'900',color:'#243E43'},
 meta:{fontSize:11.5,color:'#6F8082',marginTop:5},
 description:{fontSize:13.5,lineHeight:20,color:'#415B5D',marginTop:11},
 detailToggle:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12,paddingVertical:7,borderTopWidth:1,borderTopColor:'#F1E8DC'},
 detailText:{fontSize:12,color:'#087F87',fontWeight:'800'},
 prepare:{fontSize:12.5,lineHeight:19,color:'#556C6D',backgroundColor:'#FFF9EF',padding:11,borderRadius:11,marginBottom:9},
 actions:{flexDirection:'row',gap:8,marginTop:10},
 mapButton:{flex:1,borderWidth:1.5,borderColor:'#ACD5D2',borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:6,minHeight:45},
 mapButtonText:{fontSize:12,color:'#075D67',fontWeight:'900'},
 planButton:{flex:1,backgroundColor:'#087F87',borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:6,minHeight:45},
 planButtonText:{fontSize:12,color:'#FFFFFF',fontWeight:'900'},
 empty:{padding:25,alignItems:'center',borderRadius:18,backgroundColor:'#FFF8ED'},
 disclaimer:{fontSize:11.5,color:'#718283',lineHeight:18,marginTop:13},
});
