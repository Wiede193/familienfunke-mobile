import React from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

const COLORS={ink:'#243E43',muted:'#6B8080',gold:'#FFF0D0',cream:'#FFFAF3',line:'#EBDCC9',accent:'#075D67'};
const KIND_INFO={
 match:{symbol:'♡',title:'Es hat gefunkt!',body:'Ihr möchtet euch gegenseitig kennenlernen.',color:'#FBE0D9'},
 request:{symbol:'✦',title:'Neue Kontaktanfrage',body:'Eine Familie möchte euch kennenlernen.',color:'#FFECCA'},
 message:{symbol:'✉',title:'Neue Nachricht',body:'Ein bestätigter Kontakt hat euch geschrieben.',color:'#DFF0E8'}
};
const OPTIONS=[
 ['notify_matches','Gegenseitige Matches','Wenn zwei Familien sich füreinander entscheiden'],
 ['notify_requests','Kontaktanfragen','Wenn eine andere Familie Kontakt aufnehmen möchte'],
 ['notify_messages','Nachrichten','Wenn dir ein bestätigter Kontakt schreibt']
];

export default function NotificationCenter({visible=false,items=[],preferences=null,busy=false,onClose,onOpen,onMarkRead,onMarkAll,onSavePreference}){
 const unread=items.filter(n=>!n.read_at).length;
 return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
  <SafeAreaView style={styles.screen}>
   <View style={styles.header}>
    <View style={{flex:1}}>
      <Text style={styles.eyebrow}>☀ FAMILIENFUNKE</Text>
      <Text style={styles.title}>Deine Neuigkeiten</Text>
      <Text style={styles.small}>{unread} {unread===1?'neuer Hinweis':'neue Hinweise'}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Benachrichtigungen schließen"
       style={styles.close} onPress={onClose}><Text style={styles.closeText}>Schließen ×</Text></Pressable>
   </View>
   <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
     {unread>0?<Pressable accessibilityRole="button" onPress={onMarkAll} disabled={busy} style={styles.markAll}>
       <Text style={styles.markAllText}>Alle als gelesen markieren ✓</Text>
     </Pressable>:null}
     {items.length===0?<View style={styles.empty}>
       <Text style={styles.emptySymbol}>☀</Text>
       <Text style={styles.emptyTitle}>Alles ruhig – noch keine Neuigkeiten.</Text>
       <Text style={styles.sub}>Neue Kontaktanfragen, gegenseitige Matches und Nachrichten erscheinen hier. Einseitige Likes bleiben privat.</Text>
     </View>:
     items.slice(0,80).map(n=>{
       const info=KIND_INFO[n.kind]||KIND_INFO.request;
       const date=new Date(n.created_at);
       return <View key={n.id} style={[styles.item,!n.read_at&&styles.unread]}>
         <View style={[styles.symbol,{backgroundColor:info.color}]}><Text style={styles.symbolText}>{info.symbol}</Text></View>
         <View style={{flex:1,gap:5}}>
           <Text style={styles.itemTitle}>{info.title}{!n.read_at?' · Neu':''}</Text>
           <Text style={styles.itemBody}>{info.body}</Text>
           <Text style={styles.itemTime}>{Number.isNaN(date.getTime())?'':date.toLocaleString('de-DE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</Text>
           <View style={styles.actions}>
             <Pressable accessibilityRole="button" style={styles.open} onPress={()=>onOpen?.(n)}>
               <Text style={styles.openText}>{n.kind==='message'?'Gespräch öffnen':n.kind==='match'?'Match ansehen':'Anfragen ansehen'} ›</Text>
             </Pressable>
             {!n.read_at?<Pressable accessibilityRole="button" style={styles.read} onPress={()=>onMarkRead?.(n.id)} disabled={busy}>
               <Text style={styles.readText}>Gelesen</Text>
             </Pressable>:null}
           </View>
         </View>
       </View>;
     })}
     <View style={styles.preferences}>
       <Text style={styles.sectionTitle}>Mitteilungen einstellen</Text>
       <Text style={styles.sub}>Du entscheidest, welche Neuigkeiten in dieser App erfasst werden. Änderungen gelten für neue Ereignisse.</Text>
       {OPTIONS.map(([key,label,desc])=><View key={key} style={styles.preferenceRow}>
         <View style={{flex:1,gap:5}}>
           <Text style={styles.preferenceTitle}>{label}</Text>
           <Text style={styles.preferenceDesc}>{desc}</Text>
         </View>
         <Switch accessibilityLabel={label} value={preferences?.[key]!==false} disabled={busy}
           onValueChange={v=>onSavePreference?.(key,v)} trackColor={{true:'#087F87'}}/>
       </View>)}
     </View>
     <View style={styles.pushInfo}>
       <Text style={styles.sectionTitle}>Push auf dem Smartphone</Text>
       <Text style={styles.sub}>Echte Push-Mitteilungen bei geschlossener App bereiten wir für eine eigene installierte Testversion vor. In Expo Go können wir diese Funktion nicht verlässlich testen. Es werden noch keine Push-Nachrichten verschickt.</Text>
     </View>
     <Text style={styles.privacy}>Hinweise enthalten keine Nachrichteninhalte und zeigen keine einseitigen „Gefällt mir“-Angaben. Blockierte Kontakte sollen nicht benachrichtigt werden.</Text>
   </ScrollView>
  </SafeAreaView>
 </Modal>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:COLORS.cream},
 header:{paddingHorizontal:18,paddingTop:18,paddingBottom:17,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF0D0',borderBottomColor:'#EED8B4',borderBottomWidth:1},
 eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:'#9A6E2E',marginBottom:5},
 title:{fontSize:24,fontWeight:'900',color:COLORS.ink},
 small:{fontSize:12.5,color:COLORS.muted,marginTop:6},
 close:{paddingHorizontal:11,paddingVertical:11,backgroundColor:'#FFFFFF',borderRadius:13},
 closeText:{fontSize:12,color:COLORS.accent,fontWeight:'900'},
 scroll:{flex:1},
 content:{paddingHorizontal:17,paddingTop:18,paddingBottom:36},
 markAll:{padding:11,alignSelf:'flex-end',borderRadius:12,backgroundColor:'#FFF0D3',marginBottom:13},
 markAllText:{fontSize:12.5,fontWeight:'900',color:COLORS.accent},
 empty:{borderRadius:21,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:COLORS.line,padding:25,gap:8,alignItems:'center',marginBottom:19},
 emptySymbol:{fontSize:35,color:'#DDA45C'},
 emptyTitle:{fontSize:17,color:COLORS.ink,fontWeight:'900',textAlign:'center'},
 sub:{fontSize:13.2,color:COLORS.muted,lineHeight:20},
 item:{flexDirection:'row',gap:12,backgroundColor:'#FFFFFF',borderColor:COLORS.line,borderWidth:1,borderRadius:18,padding:14,marginBottom:10},
 unread:{borderColor:'#E7BD7B',backgroundColor:'#FFF9EE'},
 symbol:{height:42,width:42,borderRadius:13,alignItems:'center',justifyContent:'center'},
 symbolText:{color:COLORS.ink,fontSize:23,fontWeight:'800'},
 itemTitle:{color:COLORS.ink,fontSize:14.5,fontWeight:'900'},
 itemBody:{color:'#536A6A',fontSize:12.7,lineHeight:19},
 itemTime:{fontSize:11,color:'#879394'},
 actions:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5,gap:8},
 open:{paddingVertical:6},
 openText:{color:COLORS.accent,fontWeight:'900',fontSize:12},
 read:{borderRadius:9,borderWidth:1,borderColor:'#DDDBC9',paddingHorizontal:8,paddingVertical:6},
 readText:{color:COLORS.muted,fontWeight:'800',fontSize:11},
 preferences:{marginTop:21,backgroundColor:'#FFFFFF',borderRadius:20,padding:17,borderColor:COLORS.line,borderWidth:1},
 sectionTitle:{fontSize:17,fontWeight:'900',color:COLORS.ink,marginBottom:10},
 preferenceRow:{flexDirection:'row',alignItems:'center',gap:12,paddingTop:13,paddingBottom:13,borderBottomColor:'#F1E8D9',borderBottomWidth:1},
 preferenceTitle:{fontSize:13.5,fontWeight:'900',color:COLORS.ink},
 preferenceDesc:{fontSize:12,color:COLORS.muted,lineHeight:18},
 pushInfo:{marginTop:17,padding:17,borderRadius:18,backgroundColor:'#FFF0D3',gap:6},
 privacy:{fontSize:11.5,lineHeight:19,color:COLORS.muted,marginTop:19}
});
