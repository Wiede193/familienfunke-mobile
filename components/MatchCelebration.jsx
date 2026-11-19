import React from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Two adults/families have both said "Kennenlernen". No child photos or
// romantic dating language; no chat is created until server confirms contact.
export default function MatchCelebration({match,onClose,onOpenChat}) {
 const visible=!!match?.contactId;
 return <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
  <SafeAreaView style={styles.shade}>
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.sun}/>
      <Text style={styles.kicker}>FAMILIENFUNKE · NEUE VERBINDUNG</Text>
      <View style={styles.heartCircle}><Text style={styles.heart}>♥</Text></View>
      <Text style={styles.title}>Es hat gefunkt!</Text>
      <Text style={styles.description}>
        Ihr möchtet euch beide kennenlernen. {match?.name||'Die andere Familie'} freut sich ebenfalls über einen Kontakt.
      </Text>
      <View style={styles.confirmed}><Text style={styles.confirmedText}>✓ Von beiden Seiten bestätigt</Text></View>
      <Pressable accessibilityRole="button" onPress={onOpenChat} style={styles.primary}>
        <Text style={styles.primaryText}>Nachricht schreiben</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}>
        <Text style={styles.secondaryText}>Später weitermachen</Text>
      </Pressable>
      <Text style={styles.note}>Bei Familienfunke beginnt ein Gespräch erst nach gegenseitigem Einverständnis.</Text>
    </View>
  </SafeAreaView>
 </Modal>;
}
const styles=StyleSheet.create({
 shade:{flex:1,backgroundColor:'rgba(22,47,49,.8)',alignItems:'center',justifyContent:'center',padding:19},
 card:{width:'100%',maxWidth:420,backgroundColor:'#FFF8E9',borderRadius:29,padding:25,overflow:'hidden',alignItems:'center',borderWidth:1,borderColor:'#FFE0B3'},
 sun:{width:210,height:210,borderRadius:105,backgroundColor:'#FFE6AA',position:'absolute',top:-130,right:-87},
 kicker:{fontSize:10,color:'#95642B',fontWeight:'900',letterSpacing:1.5,marginBottom:24,textAlign:'center'},
 heartCircle:{backgroundColor:'#FFE1D3',width:104,height:104,borderRadius:52,alignItems:'center',justifyContent:'center',marginBottom:18,borderWidth:2,borderColor:'#F9C2B1'},
 heart:{color:'#C95D5D',fontSize:57,fontWeight:'800',lineHeight:69},
 title:{fontSize:29,fontWeight:'900',color:'#243E43',letterSpacing:-.8,textAlign:'center'},
 description:{color:'#4E696A',fontSize:15,lineHeight:23,textAlign:'center',marginTop:14,marginBottom:17},
 confirmed:{backgroundColor:'#FFFFFF',borderRadius:13,paddingVertical:10,paddingHorizontal:14,marginBottom:18},
 confirmedText:{color:'#28745C',fontSize:12,fontWeight:'900'},
 primary:{width:'100%',minHeight:51,backgroundColor:'#087F87',borderRadius:17,alignItems:'center',justifyContent:'center',marginBottom:10},
 primaryText:{color:'#FFFFFF',fontSize:15,fontWeight:'900'},
 secondary:{minHeight:43,paddingHorizontal:20,justifyContent:'center'},
 secondaryText:{color:'#075D67',fontSize:13,fontWeight:'900'},
 note:{fontSize:11,color:'#6D7E7F',textAlign:'center',lineHeight:17,marginTop:12}
});
