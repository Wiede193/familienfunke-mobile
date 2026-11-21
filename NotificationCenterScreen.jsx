import React,{useState} from 'react';
import {ScrollView,View,Text,Pressable,StyleSheet,RefreshControl,Alert} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';

const copy={
 request:['Kontaktanfrage','Eine Familie möchte dich kennenlernen.','Kontaktanfragen ansehen','♡'],
 match:['Neuer Familienkontakt','Ihr seid jetzt miteinander verbunden.','Kontakt öffnen','♡'],
 message:['Neue Nachricht','Du hast eine neue private Nachricht erhalten.','Unterhaltung öffnen','✉'],
 price:['Preis gesenkt','Ein gemerkter Artikel wurde günstiger.','Angebot öffnen','€'],
 search:['Neuer Basar-Treffer','Ein neu freigegebenes Angebot passt zu einem deiner Suchaufträge.','Angebot öffnen','♡'],
 market:['Basar-Prüfung','Der Prüfstatus deiner Anzeige wurde aktualisiert.','Meine Anzeige öffnen','♧']
};
function eventCopy(row){
 const base=copy[row.kind]||['Neuigkeit','Es gibt eine Aktualisierung.','Ansehen','•'];
 if(row.kind==='price'&&Number.isInteger(row.old_price_cents)&&Number.isInteger(row.new_price_cents)){
  const money=v=>(v/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  return [base[0],'Bei einem gemerkten Angebot sank der veröffentlichte Preis von '+money(row.old_price_cents)+' auf '+money(row.new_price_cents)+'. Öffne das Angebot für den aktuellen Preis.',base[2],base[3]];
 }
 return row.kind==='market'?[row.listing_status==='approved'?'Anzeige freigegeben':'Anzeige abgelehnt',
  row.listing_status==='approved'?'Dein Angebot wurde freigegeben.':'Dein Angebot wurde nicht freigegeben. Prüfe die Details in deinem Basar.',base[2],base[3]]:base;
}
const formatDate=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleString('de-DE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});};
function Action({children,onPress,disabled}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress}
  style={[s.action,disabled&&{opacity:.5}]}><Text style={s.actionText}>{children}</Text></Pressable>;
}
export default function NotificationCenterScreen({inbox,onOpen,onSettings,active}){
 const [onlyUnread,setOnlyUnread]=useState(false),[busy,setBusy]=useState(false);
 const rows=onlyUnread?inbox.rows.filter(r=>!r.read_at):inbox.rows;
 async function open(row){
  if(busy)return;setBusy(true);
  try{if(await onOpen(row))await inbox.markRead(row.id);}
  finally{setBusy(false);}
 }
 async function erase(id,through=null){
  if(busy)return;setBusy(true);
  try{await inbox.remove(id,through);}finally{setBusy(false);}
 }
 function confirmClear(){
  const through=inbox.asOf;
  if(busy||!through||!inbox.rows.length)return;
  Alert.alert('Alle Benachrichtigungen löschen?',
   'Alle bisherigen Hinweise werden endgültig entfernt. Nachrichten, Kontakte und Anzeigen bleiben erhalten. Neue Hinweise bleiben sichtbar.',
   [{text:'Abbrechen',style:'cancel'},{text:'Alle löschen',style:'destructive',onPress:()=>erase(null,through)}],{cancelable:true});
 }
 async function readAll(){
  if(busy)return;setBusy(true);
  try{await inbox.markRead();}finally{setBusy(false);}
 }
 return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={inbox.loading} onRefresh={()=>inbox.refresh()}/>}>
  <View style={s.row}>
   <Text accessibilityRole="header" style={[s.title,{flex:1}]}>Deine Neuigkeiten</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Alle Benachrichtigungen löschen"
    accessibilityHint="Öffnet eine Sicherheitsabfrage" accessibilityState={{disabled:busy||inbox.loading||!inbox.rows.length||!inbox.asOf}}
    disabled={busy||inbox.loading||!inbox.rows.length||!inbox.asOf} onPress={confirmClear}
    style={[s.deleteAll,(busy||inbox.loading||!inbox.rows.length||!inbox.asOf)&&{opacity:.45}]}>
    <Text style={s.deleteSymbol}>×</Text></Pressable>
  </View>
  <Text style={s.text}>Alle wichtigen Aktivitäten an einem Ort – auch ohne Push-Benachrichtigungen.</Text>
  {!active&&<Text style={s.note}>Dein Familienkonto muss freigegeben sein, bevor persönliche Aktivitäten angezeigt werden.</Text>}
  <View style={s.summary}><Text style={s.count} accessibilityLiveRegion="polite">{inbox.unread===null?'–':inbox.unread} ungelesen</Text>
   <Action disabled={busy||!inbox.unread||!inbox.asOf} onPress={readAll}>Alle bisherigen als gelesen markieren</Action>
  </View>
  <View style={s.filters}>
   {[[false,'Alle'],[true,'Ungelesen']].map(([value,label])=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected:value===onlyUnread}}
    onPress={()=>setOnlyUnread(value)} style={[s.chip,value===onlyUnread&&s.selected]}><Text style={[s.text,value===onlyUnread&&{color:C.white,fontWeight:'800'}]}>{label}</Text></Pressable>)}
  </View>
  {inbox.error?<View><Text accessibilityLiveRegion="assertive" style={s.note}>{inbox.error}</Text><Action onPress={()=>inbox.refresh()}>Erneut laden</Action></View>:null}
  {rows.length===0&&!inbox.loading&&!inbox.error?<Text style={s.note}>{onlyUnread?'Keine ungelesenen Hinweise auf dieser Seite.':'Noch keine Neuigkeiten.'}</Text>:null}
  {rows.map(row=>{const [title,description,action,icon]=eventCopy(row);return <View key={row.id} style={[s.card,!row.read_at&&s.unread]}>
   <View style={s.row}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.icon}><Text style={s.symbol}>{icon}</Text></View>
    <View style={{flex:1}}><Text style={s.cardTitle}>{title}</Text>
    <Text style={s.muted}>{formatDate(row.created_at)} · {row.read_at?'Gelesen':'Ungelesen'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={title+' vom '+formatDate(row.created_at)+' löschen'}
     accessibilityState={{disabled:busy}} disabled={busy} onPress={()=>erase(row.id)} style={s.deleteOne}><Text style={s.deleteSymbol}>×</Text></Pressable>
   </View>
   <Text style={s.text}>{description}</Text>
   <Action disabled={busy} onPress={()=>open(row)}>{action}</Action>
   {!row.read_at?<Action disabled={busy} onPress={async()=>{if(busy)return;setBusy(true);try{await inbox.markRead(row.id);}finally{setBusy(false);}}}>Als gelesen markieren</Action>:null}
  </View>;})}
  {inbox.hasMore?<Action disabled={inbox.loading||busy} onPress={()=>inbox.refresh({more:true})}>Ältere Neuigkeiten laden</Action>:null}
  <Action onPress={onSettings}>Push-Benachrichtigungen einstellen</Action>
 </ScrollView>;
}
const s=StyleSheet.create({
 page:{padding:16,paddingBottom:32,gap:12,backgroundColor:C.bg},title:{fontSize:27,fontWeight:'900',color:C.ink},
 text:{fontSize:15,lineHeight:22,color:C.ink},muted:{fontSize:13,color:C.muted,marginTop:4},
 summary:{borderRadius:20,padding:16,gap:10,backgroundColor:C.sun},count:{fontSize:22,fontWeight:'900',color:C.ink},
 note:{padding:14,backgroundColor:C.sunPale,borderRadius:12,color:C.ink,fontSize:15,lineHeight:22},
 filters:{flexDirection:'row',gap:8,flexWrap:'wrap'},chip:{minHeight:44,padding:12,paddingHorizontal:18,borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line},selected:{backgroundColor:C.accent,borderColor:C.accent},
 card:{backgroundColor:C.paper,borderRadius:20,padding:16,gap:10,borderWidth:1,borderColor:C.line},unread:{borderColor:C.accent,borderWidth:2},
 row:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:44,height:44,borderRadius:15,backgroundColor:C.sunPale,alignItems:'center',justifyContent:'center'},
 symbol:{fontSize:24,color:C.ink},cardTitle:{fontSize:17,fontWeight:'800',color:C.ink},
 deleteAll:{minWidth:48,minHeight:48,backgroundColor:C.sunPale,borderRadius:15,alignItems:'center',justifyContent:'center'},deleteOne:{minWidth:44,minHeight:44,backgroundColor:C.bg,borderRadius:12,alignItems:'center',justifyContent:'center'},deleteSymbol:{fontSize:28,color:C.ink,fontWeight:'700'},
 action:{minHeight:44,justifyContent:'center',alignItems:'center',padding:10,borderRadius:14,backgroundColor:C.mint},actionText:{fontSize:15,fontWeight:'800',color:C.accentDark,textAlign:'center'}
});
