import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const KIND={
 match:{title:'Es hat gefunkt! 💛',details:'Ihr möchtet euch beide kennenlernen.',route:'Zum Chat'},
 request:{title:'Neue Kennenlern-Anfrage',details:'Eine Familie möchte euch kennenlernen.',route:'Zu den Kontakten'},
 message:{title:'Neue Nachricht',details:'Ein bestätigter Kontakt hat geschrieben.',route:'Zum Chat'}
};
function displayTime(value){
 const d=new Date(value);
 return Number.isNaN(d.getTime())?'':d.toLocaleString('de-DE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}

export default function NoticeCenter({items=[],onOpen,onMarkRead,onRefresh,loading=false}){
 const unread=items.filter(n=>!n.read_at).length;
 return <ScrollView contentContainerStyle={styles.root}>
  <View style={styles.hero}>
   <Text style={styles.kicker}>FAMILIENFUNKE · DEINE NEUIGKEITEN</Text>
   <Text style={styles.title}>Was gibt's Neues? ☀</Text>
   <Text style={styles.subtitle}>Kennenlern-Anfragen, echte Matches und neue Nachrichten – an einem Ort.</Text>
   <Text style={styles.counter}>{unread} {unread===1?'neuer Hinweis':'neue Hinweise'}</Text>
  </View>
  <Pressable accessibilityRole="button" onPress={onRefresh} disabled={loading} style={styles.refresh}>
   <Text style={styles.refreshText}>{loading?'Aktualisieren …':'↻ Neuigkeiten aktualisieren'}</Text>
  </Pressable>
  {items.length===0?<View style={styles.empty}>
    <Text style={styles.emptyIcon}>♡</Text>
    <Text style={styles.emptyTitle}>Hier ist es gerade ruhig</Text>
    <Text style={styles.subtitle}>Sobald sich jemand bei euch meldet, erscheint hier ein Hinweis.</Text>
  </View>:items.map(n=>{
    const meta=KIND[n.kind]||KIND.request;
    return <Pressable key={String(n.id)} accessibilityRole="button"
      accessibilityLabel={meta.title+(n.read_at?'':', neu')}
      onPress={()=>onOpen(n)} style={[styles.item,!n.read_at&&styles.unread]}>
      <View style={[styles.dot,n.read_at&&styles.dotRead]}/>
      <View style={styles.textPart}>
       <Text style={styles.itemTitle}>{meta.title}</Text>
       <Text style={styles.description}>{meta.details}</Text>
       <Text style={styles.date}>{displayTime(n.created_at)}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>;
  })}
  {items.length>0?<Pressable accessibilityRole="button" onPress={()=>items.filter(x=>!x.read_at).forEach(n=>onMarkRead(n.id))}
    style={styles.markAll}><Text style={styles.markAllText}>Alle Hinweise als gelesen markieren</Text></Pressable>:null}
  <Text style={styles.footer}>Hinweise enthalten keine privaten Nachrichteninhalte. Echte Push-Mitteilungen auf dem Sperrbildschirm erfordern eine gesonderte Zustimmung und eine eigene Entwicklungs-App.</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{padding:19,paddingBottom:45,backgroundColor:'#FFFAF2',flexGrow:1},
 hero:{backgroundColor:'#FFF0D4',borderRadius:24,padding:22,marginBottom:12,overflow:'hidden'},
 kicker:{fontSize:10,color:'#A46B2B',fontWeight:'900',letterSpacing:1.3,marginBottom:10},
 title:{fontSize:24,fontWeight:'900',color:'#243E43'},
 subtitle:{fontSize:13.5,color:'#637879',lineHeight:20,marginTop:9},
 counter:{color:'#8E6028',fontSize:12.5,fontWeight:'900',marginTop:15},
 refresh:{alignSelf:'flex-end',paddingHorizontal:10,paddingVertical:11,marginBottom:9},
 refreshText:{fontSize:12.5,color:'#075D67',fontWeight:'900'},
 item:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#EAE0D1',borderRadius:19,padding:16,flexDirection:'row',gap:11,alignItems:'center',marginBottom:10},
 unread:{backgroundColor:'#FFF4DE',borderColor:'#F4D8A9'},
 dot:{backgroundColor:'#E78976',width:9,height:9,borderRadius:5,alignSelf:'flex-start',marginTop:8},
 dotRead:{backgroundColor:'#CFD9D4'},
 textPart:{flex:1},
 itemTitle:{fontSize:15,fontWeight:'900',color:'#243E43'},
 description:{fontSize:12.5,color:'#5B7374',lineHeight:19,marginTop:5},
 date:{fontSize:10.5,color:'#869491',fontWeight:'700',marginTop:8},
 arrow:{color:'#087F87',fontSize:27,fontWeight:'600'},
 empty:{alignItems:'center',justifyContent:'center',padding:28,borderRadius:22,backgroundColor:'#FFFFFF'},
 emptyIcon:{fontSize:45,color:'#DC9E87'},
 emptyTitle:{fontSize:17,color:'#243E43',fontWeight:'900',marginTop:10},
 markAll:{padding:16,alignItems:'center'},
 markAllText:{color:'#075D67',fontWeight:'900',fontSize:12.5},
 footer:{fontSize:11.5,lineHeight:18,color:'#758686',marginTop:19}
});
