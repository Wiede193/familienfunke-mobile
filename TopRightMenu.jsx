import React,{useState} from 'react';
import {Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {FAMILY_TYPE as T,FAMILY_SPACE as S} from './FamilyTheme';
import FamilyIcon,{FAMILY_ROUTE_ICONS} from './FamilyIcon';

export const MENU_GROUPS=[
 {title:'Mein Bereich',items:[
  ['profile','◉','Mein Profil','Familie, Interessen, Datenschutz und Konto'],
  ['contacts','♡','Kontakte','Bekannte Familien und Anfragen'],
  ['chat','✉','Nachrichten','Private Unterhaltungen'],
  ['inbox','◉','Neuigkeiten','Hinweise und Benachrichtigungen'],
  ['calendar','▦','Familienkalender','Eigene Termine und Pläne'],
  ['savedSearches','♡','Suchaufträge','Gespeicherte Basar-Suchen'],
  ['push','⚙','Benachrichtigungen einstellen','Push-Einstellungen']
 ]},
 {title:'Aktivitäten & Wissen',items:[
  ['healthy','✿','Sport & Gesundheit','Vereine, Ernährung, Videos und Bewegung'],
  ['outing','☀','Ausflüge planen','Alter, Budget und Entfernung'],
  ['events','▦','Treffen & Veranstaltungen','Gemeinsame Termine'],
  ['play','✧','Spiele & Quiz','Familienzeit und Rätsel'],
  ['partners','✿','Kitas & Partner','Einrichtungen und Angebote'],
  ['inclusion','♡','Inklusion & Teilhabe','Informationen und Unterstützung'],
  ['info','◇','Elternwissen','Ratgeber und hilfreiche Links']
 ]},
 {title:'Hilfe & Service',items:[
  ['help','?','Hilfe & FAQ','Bedienung und Unterstützung'],
  ['aboutApp','♡','Über Familienfunke','Unser Konzept'],
  ['welcome','☀','Willkommenskarte','Noch einmal ansehen'],
  ['refresh','⟳','Daten aktualisieren','Neuen Stand abrufen'],
  ['more','≡','Weitere Bereiche','Gesamtübersicht']
 ]}
];
export const MORE_ITEMS=MENU_GROUPS.flatMap(g=>g.items).filter(([id])=>!['info','refresh','more'].includes(id));

export function MenuIcon(){return <FamilyIcon name="menu" size={25} color={C.ink}/>;}
const QUICK_ITEMS=[
  ['profile','Mein Profil','users'],
  ['chat','Nachrichten','message'],
  ['inbox','Neuigkeiten','bell'],
  ['calendar','Kalender','calendar']
];
export default function TopRightMenu({visible,onClose,onSelect,activeTab,unread}){
 const [expanded,setExpanded]=useState(null);
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
  <SafeAreaView style={s.shade}>
   <Pressable accessible={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill}/>
   <View accessibilityViewIsModal style={s.panel}>
    <View style={s.header}>
     <View style={{flex:1}}>
       <Text accessibilityRole="header" style={s.title}>Dein Familienfunke</Text>
       <Text style={s.headerSub}>Schnell finden, was ihr braucht</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Menü schließen"
       onPress={onClose} style={s.close}><FamilyIcon name="close" size={21}/></Pressable>
    </View>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.group}>Schnellzugriff</Text>
      <View style={s.quickGrid}>
        {QUICK_ITEMS.map(([id,title,icon])=><Pressable key={id} accessibilityRole="button"
          accessibilityLabel={title+(id==='inbox'&&unread>0?', '+unread+' ungelesen':'')}
          accessibilityState={{selected:id===activeTab}}
          style={({pressed})=>[s.quick,activeTab===id&&s.quickActive,pressed&&s.pressed]}
          onPress={()=>onSelect(id)}>
          <View style={s.quickIcon}><FamilyIcon name={icon} size={23}/></View>
          <Text style={s.quickTitle}>{title}</Text>
          {id==='inbox'&&unread>0?<Text style={s.unread}>{unread} neu</Text>:null}
        </Pressable>)}
      </View>
      <Text style={[s.group,{marginTop:22}]}>Alle Bereiche</Text>
      {MENU_GROUPS.map(group=>{
        const open=expanded===group.title;
        return <View key={group.title} style={s.groupCard}>
          <Pressable accessibilityRole="button"
            accessibilityLabel={group.title+' '+(open?'einklappen':'ausklappen')}
            accessibilityState={{expanded:open}} onPress={()=>setExpanded(open?null:group.title)}
            style={s.groupRow}>
            <Text style={s.groupTitle}>{group.title}</Text>
            <Text style={s.groupCount}>{group.items.length} Bereiche</Text>
            <FamilyIcon name={open?'chevron-up':'chevron-down'} size={19}/>
          </Pressable>
          {open?group.items.map(([id,glyph,title,subtitle])=>{
            const selected=id===activeTab;
            return <Pressable key={id} accessibilityRole="button"
              accessibilityLabel={title+(id==='inbox'&&unread>0?', '+unread+' ungelesen':'')}
              accessibilityState={{selected}} onPress={()=>onSelect(id)}
              style={({pressed})=>[s.item,selected&&s.selected,pressed&&s.pressed]}>
              <View style={s.glyphWrap}><FamilyIcon name={FAMILY_ROUTE_ICONS[id]||'compass'} size={20}/></View>
              <View style={{flex:1,minWidth:0}}>
                <Text style={s.name}>{title}</Text>
                <Text style={s.subtitle}>{subtitle}</Text>
                {id==='inbox'&&unread>0?<Text style={s.unread}>{unread} ungelesen</Text>:null}
              </View>
              <FamilyIcon name="chevron-right" size={19}/>
            </Pressable>;
          }):null}
        </View>;
      })}
    </ScrollView>
   </View>
  </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 shade:{flex:1,backgroundColor:'#253D4373',alignItems:'flex-end',paddingHorizontal:10,paddingBottom:10},
 panel:{width:'100%',maxWidth:380,maxHeight:'96%',flexShrink:1,backgroundColor:C.paper,
   borderRadius:24,marginTop:8,overflow:'hidden',borderWidth:1,borderColor:C.line},
 header:{flexDirection:'row',alignItems:'center',gap:12,padding:20,
   borderBottomWidth:1,borderBottomColor:C.line},
 title:{fontSize:T.title,fontWeight:'800',color:C.ink},
 headerSub:{fontSize:T.small,color:C.muted,marginTop:4},
 close:{minWidth:S.touch,minHeight:S.touch,justifyContent:'center',alignItems:'center',
   backgroundColor:C.sunPale,borderRadius:14},
 scroll:{flexShrink:1},content:{padding:16,paddingBottom:28},
 group:{fontSize:T.small,fontWeight:'800',color:C.accentDark,marginBottom:10,paddingHorizontal:3},
 quickGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10},
 quick:{width:'48%',minHeight:101,backgroundColor:C.bg,borderWidth:1,borderColor:C.line,
   borderRadius:17,padding:13,gap:8,justifyContent:'space-between'},
 quickActive:{backgroundColor:C.sunPale,borderColor:C.sun},
 quickIcon:{width:36,height:36,borderRadius:12,backgroundColor:C.paper,
   justifyContent:'center',alignItems:'center'},
 quickTitle:{fontSize:T.small,fontWeight:'800',color:C.ink},
 groupCard:{borderRadius:16,borderWidth:1,borderColor:C.line,marginBottom:9,
   overflow:'hidden',backgroundColor:C.paper},
 groupRow:{flexDirection:'row',alignItems:'center',padding:14,minHeight:54,gap:8,
   backgroundColor:C.bg},
 groupTitle:{fontSize:T.body,fontWeight:'800',color:C.ink,flex:1},
 groupCount:{color:C.muted,fontSize:11},
 item:{flexDirection:'row',gap:10,alignItems:'center',minHeight:63,padding:12,
   borderTopWidth:1,borderTopColor:C.line},
 selected:{backgroundColor:C.sunPale},
 glyphWrap:{width:36,height:36,alignItems:'center',justifyContent:'center',
   backgroundColor:C.mint,borderRadius:11},
 name:{fontSize:14,fontWeight:'700',color:C.ink},
 subtitle:{fontSize:T.meta,lineHeight:17,color:C.muted,marginTop:3},
 unread:{color:C.accentDark,fontWeight:'800',fontSize:11},
 pressed:{opacity:0.72}
});
