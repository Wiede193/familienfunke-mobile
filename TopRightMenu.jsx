import React from 'react';
import {Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';

export const MENU_GROUPS=[
 {title:'Mein Familienfunke',items:[
  ['profile','◉','Mein Profil','Hobbys, Fotos, Konto und Privatsphäre'],
  ['layout','⚙','App gestalten','Kacheln und untere Menüleiste anpassen'],
  ['contacts','♡','Kontakte','Anfragen und bestätigte Familienkontakte'],
  ['chat','✉','Nachrichten','Private Unterhaltungen'],
  ['inbox','◉','Neuigkeiten','Benachrichtigungszentrale'],
  ['push','⚙','Benachrichtigungseinstellungen','Push-Hinweise auf deinem Gerät'],
  ['savedSearches','♡','Meine Suchaufträge','Gespeicherte Basar-Suchen und Mitteilungen']
 ]},
 {title:'Familienalltag',items:[
  ['play','✧','Familienzeit','Quiz, Rätsel und gemeinsame Spielideen'],
  ['calendar','▦','Mein Familienkalender','Private Termine und gemerkte Veranstaltungen'],
  ['events','▦','Treffen & Veranstaltungen','Gemeinsame Aktivitäten'],
  ['outing','☀','Ausflugsplaner','Ausflüge mit oder ohne KI planen'],
  ['partners','✿','Kitas & Partnerwelt','Einrichtungen und Kita-Veranstaltungen'],
  ['inclusion','♡','Familien & Inklusion','Teilhabe und Informationen'],
  ['info','◇','Elternwissen & hilfreiche Links','Informationen für Familien']
 ]},
 {title:'Service',items:[
  ['help','?','Hilfe & FAQ','Anleitungen und Unterstützung'],
  ['aboutApp','♡','Über Familienfunke','Unsere Idee'],
  ['welcome','☀','Willkommenskarte','Noch einmal ansehen'],
  ['refresh','⟳','Daten aktualisieren','Aktuellen Stand abrufen'],
  ['more','≡','Alle weiteren Bereiche','Vollständige Übersicht']
 ]}
];
export const MORE_ITEMS=MENU_GROUPS.flatMap(g=>g.items).filter(([id])=>!['info','refresh','more','layout'].includes(id));

export function MenuIcon(){
 return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.icon}>
  {[0,1,2].map(i=><View key={i} style={s.line}/>)}
 </View>;
}
export default function TopRightMenu({visible,onClose,onSelect,activeTab,unread}){
 return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
  <SafeAreaView style={s.shade}>
   <Pressable accessible={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill}/>
   <View accessibilityViewIsModal style={s.panel}>
    <View style={s.header}>
     <Text accessibilityRole="header" style={s.title}>Menü</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Menü schließen" onPress={onClose} style={s.close}><Text style={s.closeText}>×</Text></Pressable>
    </View>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
     {MENU_GROUPS.map(group=><View key={group.title}>
      <Text accessibilityRole="header" style={s.group}>{group.title}</Text>
      {group.items.map(([id,icon,title,subtitle])=>{
       const selected=id===activeTab;
       return <Pressable key={id} accessibilityRole="button" accessibilityLabel={title+(id==='inbox'&&unread>0?', '+unread+' ungelesen':'')} accessibilityState={{selected}}
        onPress={()=>onSelect(id)} style={[s.item,selected&&s.selected]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.glyphWrap}><FamilyIcon name={id} size={23}/></View>
        <View style={{flex:1,minWidth:0}}>
         <Text style={s.name}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text>
         {id==='inbox'&&unread>0?<Text style={s.unread}>{unread} ungelesen</Text>:null}
        </View><Text accessibilityElementsHidden importantForAccessibility="no" style={s.arrow}>›</Text>
       </Pressable>;
      })}
     </View>)}
    </ScrollView>
   </View>
  </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 shade:{flex:1,backgroundColor:'#253D4373',alignItems:'flex-end',paddingHorizontal:12,paddingBottom:12},
 panel:{width:'100%',maxWidth:360,flexShrink:1,minHeight:0,backgroundColor:C.paper,borderRadius:22,marginTop:10,overflow:'hidden',borderWidth:1,borderColor:C.line},
 header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderBottomWidth:1,borderBottomColor:C.line},
 title:{fontSize:23,fontWeight:'900',color:C.ink},close:{minWidth:44,minHeight:44,justifyContent:'center',alignItems:'center',backgroundColor:C.sunPale,borderRadius:14},closeText:{fontSize:27,color:C.ink},
 scroll:{flexShrink:1},content:{padding:12,paddingBottom:20},group:{fontSize:15,fontWeight:'800',color:C.accentDark,marginTop:12,marginBottom:6,paddingHorizontal:7},
 item:{flexDirection:'row',gap:10,alignItems:'center',minHeight:58,padding:10,borderRadius:13},selected:{backgroundColor:C.sunPale},glyphWrap:{width:34,height:34,alignItems:'center',justifyContent:'center',backgroundColor:C.mint,borderRadius:11},
 glyph:{fontSize:20,color:C.accentDark},name:{fontSize:17,fontWeight:'700',color:C.ink},subtitle:{fontSize:14,lineHeight:21,color:C.muted,marginTop:3},unread:{color:C.accentDark,fontWeight:'800',fontSize:12,marginTop:4},arrow:{color:C.accentDark,fontSize:22},
 icon:{width:25,height:25,justifyContent:'center',gap:5},line:{height:2.5,width:23,borderRadius:2,backgroundColor:C.ink}
});
