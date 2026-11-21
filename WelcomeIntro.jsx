import React from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {FAMILY_COLORS} from './FamilyTheme';

const P=FAMILY_COLORS;

const highlights=[
  ['♡','Echte Verbindungen','Andere Familien in deiner Nähe kennenlernen'],
  ['♧','Fair weitergeben','Kinderartikel verkaufen, tauschen oder verschenken'],
  ['✿','Gemeinsam erleben','Treffen, Ausflüge und Angebote entdecken'],
];

export default function WelcomeIntro({visible,onClose}){
  return <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}
    statusBarTranslucent accessibilityViewIsModal>
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <View style={styles.sunArea}>
            <View style={styles.sunCircle}><Text style={styles.sunHeart}>♥</Text></View>
            <View style={styles.stamp}><Text style={styles.stampTop}>MADE IN</Text><Text style={styles.stampBottom}>GERMANY</Text></View>
          </View>
          <Text style={styles.eyebrow}>SCHÖN, DASS IHR DA SEID!</Text>
          <Text style={styles.title}>Willkommen bei Familienfunke</Text>
          <Text style={styles.subtitle}>Ein Platz für Familien. Ein Funke für neue Freundschaften.</Text>
          <View style={styles.highlights}>
            {highlights.map(([glyph,title,body])=>
              <View key={title} style={styles.item}>
                <View style={styles.itemIcon}><Text style={styles.itemGlyph}>{glyph}</Text></View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{title}</Text>
                  <Text style={styles.itemText}>{body}</Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.story}>
            <Text style={styles.storyTitle}>Von Familie zu Familie</Text>
            <Text style={styles.storyBody}>Wir sind beide berufstätig und wissen, wie schwer es sein kann, im vollen Familienalltag oder nach einem Umzug neue Kontakte zu finden. Darum haben wir Familienfunke ins Leben gerufen: damit der Alltag gemeinsam ein bisschen leichter wird.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Familienfunke entdecken und Willkommen schließen"
            onPress={onClose} style={({pressed})=>[styles.button,pressed&&{opacity:0.84}]}>
            <Text style={styles.buttonText}>Familienfunke entdecken  ♥</Text>
          </Pressable>
          <Text style={styles.footer}>Diese Begrüßung bleibt geöffnet, bis du „Familienfunke entdecken“ auswählst. Du kannst sie unter „Mehr“ erneut öffnen.</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles=StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(28,48,51,0.52)',alignItems:'center',justifyContent:'center',paddingHorizontal:18,paddingVertical:30},
  dialog:{width:'100%',maxWidth:480,maxHeight:'94%',borderRadius:29,backgroundColor:P.cream,overflow:'hidden'},
  content:{paddingHorizontal:22,paddingTop:20,paddingBottom:22,alignItems:'center'},
  sunArea:{height:106,width:'100%',justifyContent:'center',alignItems:'center',marginBottom:5},
  sunCircle:{width:92,height:92,borderRadius:46,backgroundColor:P.yellow,alignItems:'center',justifyContent:'center',borderWidth:6,borderColor:'#FFF0C8'},
  sunHeart:{fontSize:47,color:P.coral,fontWeight:'900'},
  stamp:{position:'absolute',right:2,top:9,borderWidth:1.5,borderColor:P.accent,borderRadius:10,paddingHorizontal:9,paddingVertical:6,transform:[{rotate:'7deg'}],backgroundColor:P.white},
  stampTop:{fontSize:8,fontWeight:'900',textAlign:'center',letterSpacing:1.5,color:P.accent},
  stampBottom:{fontSize:11,fontWeight:'900',letterSpacing:0.6,textAlign:'center',color:P.accent},
  eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.7,color:P.accent,marginTop:4,marginBottom:7,textAlign:'center'},
  title:{fontSize:25,fontWeight:'900',lineHeight:30,color:P.ink,textAlign:'center',maxWidth:320},
  subtitle:{fontSize:14,lineHeight:21,color:P.muted,textAlign:'center',marginTop:9,maxWidth:315},
  highlights:{alignSelf:'stretch',marginTop:22,gap:11},
  item:{flexDirection:'row',alignItems:'center',backgroundColor:P.white,borderRadius:17,paddingHorizontal:13,paddingVertical:11,borderWidth:1,borderColor:P.line},
  itemIcon:{height:43,width:43,borderRadius:14,backgroundColor:'#FFF0D7',alignItems:'center',justifyContent:'center',marginRight:12},
  itemGlyph:{fontSize:24,color:P.coral},
  itemContent:{flex:1},
  itemTitle:{color:P.ink,fontSize:14.5,fontWeight:'900',lineHeight:20},
  itemText:{color:P.muted,fontSize:12.5,lineHeight:18,marginTop:2},
  story:{alignSelf:'stretch',backgroundColor:'#E9F5EF',borderRadius:18,padding:15,marginTop:17},
  storyTitle:{fontSize:15.5,fontWeight:'900',color:P.accent,marginBottom:7},
  storyBody:{fontSize:13,lineHeight:20,color:P.ink},
  button:{backgroundColor:P.accent,minHeight:52,borderRadius:17,paddingHorizontal:17,paddingVertical:14,alignItems:'center',justifyContent:'center',alignSelf:'stretch',marginTop:19},
  buttonText:{fontSize:15.5,fontWeight:'900',color:P.white},
  footer:{fontSize:11.5,lineHeight:17,color:P.muted,marginTop:13,textAlign:'center'},
});
