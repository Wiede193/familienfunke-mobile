import React,{useEffect,useState} from 'react';
import {Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {FAMILY_UI as UI,FAMILY_RADII as R} from './FamilyTheme';
import {FAMILY_TYPE as T,FAMILY_SPACE as S} from './FamilyTheme';
import FamilyIcon,{FAMILY_ROUTE_ICONS} from './FamilyIcon';
import {searchMenuEntries} from './MenuDiscovery';

export const MENU_GROUPS=[
 {title:'Mein Bereich',items:[
  ['profile','◉','Mein Profil','Familie, Interessen, Datenschutz und Konto'],
  ['contacts','♡','Kontakte','Bekannte Familien und Anfragen'],
  ['chat','✉','Nachrichten','Private Unterhaltungen'],
  ['inbox','◉','Neuigkeiten','Hinweise und Benachrichtigungen'],
  ['calendar','▦','Familienkalender','Eigene Termine und Pläne'],
  ['savedSearches','♡','Suchaufträge','Gespeicherte Basar-Suchen'],
  ['favorites','♡','Merkliste','Deine gespeicherten Basar-Angebote'],
  ['push','⚙','Benachrichtigungen einstellen','Push-Einstellungen']
 ]},
 {title:'Ausflüge, Freizeit & Wissen',items:[
  ['decisions','▤','Beschlüsse einfach erklärt','Offizielle Entscheidungen und ihre Bedeutung'],
  ['healthy','✿','Sport & Gesundheit','Vereine, Ernährung, Videos und Bewegung'],
  ['outing','☀','Ausflüge planen','Alter, Budget und Entfernung'],
  ['events','▦','Treffen & Veranstaltungen','Gemeinsame Termine'],
  ['play','✧','Spiele & Quiz','Familienzeit und Rätsel'],
  ['partners','✿','Kitas & Partner','Einrichtungen und Angebote'],
  ['inclusion','♡','Inklusion & Teilhabe','Informationen und Unterstützung'],
  ['info','◇','Elternwissen','Ratgeber und hilfreiche Links']
 ]},
 {title:'Hilfe & Einstellungen',items:[
  ['help','?','Hilfe & FAQ','Bedienung und Unterstützung'],
  ['aboutApp','♡','Über Familienfunke','Unser Konzept'],
  ['welcome','☀','Willkommenskarte','Noch einmal ansehen'],
  ['tour','➤','App-Tour','Alle wichtigen Bereiche Schritt für Schritt ansehen'],
  ['refresh','⟳','Daten aktualisieren','Neuen Stand abrufen'],
  ['more','≡','Weitere Bereiche','Gesamtübersicht']
 ]}
];
export const MORE_ITEMS=MENU_GROUPS.flatMap(g=>g.items).filter(([id])=>!['info','refresh','more'].includes(id));

export function MenuIcon(){return <FamilyIcon name="menu" size={25} color={C.ink}/>;}
// Die vier Hauptziele entsprechen exakt der unteren Navigation.
const QUICK_ITEMS=[
  ['discover','Familien finden','users'],
  ['map','Ausflüge entdecken','map'],
  ['market','Basar entdecken','bag'],
  ['guide','Rat & Hilfe','book']
];
const SEARCH_ICONS={sell:'bag',myListings:'bag',favorites:'heart',home:'home',guide:'book',market:'bag',map:'map',discover:'users'};
function MenuResult({entry,onSelect,activeTab,unread}){
 const {id,title,subtitle}=entry;
 return <Pressable accessibilityRole="button"
   accessibilityLabel={title+(id==='inbox'&&unread>0?', '+unread+' ungelesen':'')}
   accessibilityHint={subtitle+' – Bereich öffnen'}
   accessibilityState={{selected:id===activeTab}}
   onPress={()=>onSelect(id)}
   style={({pressed})=>[s.item,id===activeTab&&s.selected,pressed&&s.pressed]}>
   <View style={s.glyphWrap}><FamilyIcon name={SEARCH_ICONS[id]||FAMILY_ROUTE_ICONS[id]||'compass'} size={20}/></View>
   <View style={{flex:1,minWidth:0}}>
      <Text style={s.name}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text>
   </View>
   <FamilyIcon name="chevron-right" size={19}/>
 </Pressable>;
}
export default function TopRightMenu({visible,onClose,onSelect,activeTab,unread}){
 const {width:screenWidth,fontScale}=useWindowDimensions();
 const oneColumn=screenWidth<360||fontScale>=1.5;
 const [expanded,setExpanded]=useState(null);
 const [search,setSearch]=useState('');
 useEffect(()=>{if(!visible)setSearch('');},[visible]);
 const searching=search.trim().length>0;
 const matches=searchMenuEntries(search,MENU_GROUPS);
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
  <SafeAreaView style={s.shade}>
   <Pressable accessible={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill}/>
   <View accessibilityViewIsModal style={s.panel}>
    <View style={s.header}>
     <View style={{flex:1}}>
       <Text accessibilityRole="header" style={s.title}>Dein Familienfunke</Text>
       <Text style={s.headerSub}>Vier Hauptbereiche. Alles Weitere über die Suche.</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Menü schließen"
       onPress={onClose} style={s.close}><FamilyIcon name="close" size={21}/></Pressable>
    </View>
    <View style={s.searchWrap}>
      <View style={s.searchLine}>
        <FamilyIcon name="search" size={21} color={C.accentDark}/>
        <TextInput accessibilityLabel="Funktion im Menü suchen"
          accessibilityHint="Suche Bereiche wie Anzeigen, Kalender, Familien oder Einstellungen"
          placeholder="Was suchst du? z. B. Anzeigen, Kalender"
          placeholderTextColor={C.muted} value={search} onChangeText={setSearch}
          autoCorrect={false} returnKeyType="search" style={s.searchInput}
          onSubmitEditing={()=>{if(matches.length===1)onSelect(matches[0].id);}}/>
        {searching?<Pressable accessibilityRole="button" accessibilityLabel="Menüsuche löschen"
          onPress={()=>setSearch('')} style={s.clearSearch}><FamilyIcon name="close" size={18}/></Pressable>:null}
      </View>
      {searching?<Text accessibilityLiveRegion="polite" style={s.searchCount}>
        {matches.length} {matches.length===1?'Bereich gefunden':'Bereiche gefunden'}
      </Text>:null}
    </View>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {searching?<View>
        {matches.length?<View style={s.searchResults}>
          {matches.map(entry=><MenuResult key={entry.id} entry={entry} onSelect={onSelect}
            activeTab={activeTab} unread={unread}/>)}
        </View>:<View style={s.noResults}>
          <Text style={s.noResultsTitle}>Keinen passenden Bereich gefunden</Text>
          <Text style={s.noResultsDescription}>Probiere ein kürzeres Wort oder öffne die Hilfe.</Text>
          <Pressable accessibilityRole="button" onPress={()=>onSelect('help')}
            style={s.helpAction}><Text style={s.helpActionText}>Hilfe & FAQ öffnen</Text></Pressable>
        </View>}
      </View>:<>
      <Text style={s.group}>Direkt zu deinem Ziel</Text>
      <View style={s.quickGrid}>
        {QUICK_ITEMS.map(([id,title,icon])=><Pressable key={id} accessibilityRole="button"
          accessibilityLabel={title+(id==='inbox'&&unread>0?', '+unread+' ungelesen':'')}
          accessibilityState={{selected:id===activeTab}}
          style={({pressed})=>[s.quick,oneColumn&&s.quickWide,activeTab===id&&s.quickActive,pressed&&s.pressed]}
          onPress={()=>onSelect(id)}>
          <View style={s.quickIcon}><FamilyIcon name={icon} size={23}/></View>
          <Text style={s.quickTitle}>{title}</Text>
          {id==='inbox'&&unread>0?<Text style={s.unread}>{unread} neu</Text>:null}
        </Pressable>)}
      </View>
      <Text style={[s.group,{marginTop:22}]}>Weitere Funktionen – nur bei Bedarf</Text>
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
      </>}
    </ScrollView>
   </View>
  </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 shade:{flex:1,backgroundColor:'#253D4373',alignItems:'flex-end',paddingHorizontal:10,paddingBottom:10},
 panel:{width:'100%',maxWidth:380,maxHeight:'96%',flexShrink:1,backgroundColor:C.paper,
   borderRadius:R.hero,marginTop:8,overflow:'hidden',borderWidth:1,borderColor:C.line},
 header:{flexDirection:'row',alignItems:'center',gap:12,padding:20,
   borderBottomWidth:1,borderBottomColor:C.line},
 title:{fontSize:T.title,fontWeight:'800',color:C.ink},
 headerSub:{fontSize:T.small,color:C.muted,marginTop:4},
 close:{minWidth:S.touch,minHeight:S.touch,justifyContent:'center',alignItems:'center',
   backgroundColor:C.sunPale,borderRadius:14},
 searchWrap:{paddingHorizontal:16,paddingTop:12,paddingBottom:7,
   borderBottomWidth:1,borderBottomColor:C.line},
 searchLine:{minHeight:53,borderRadius:15,borderWidth:1.5,borderColor:'#AACCC4',
   backgroundColor:C.white,paddingLeft:13,paddingRight:6,
   flexDirection:'row',gap:9,alignItems:'center'},
 searchInput:{flex:1,fontSize:16,color:C.ink,minHeight:51,minWidth:0},
 clearSearch:{width:44,height:44,justifyContent:'center',alignItems:'center'},
 searchCount:{fontSize:13,fontWeight:'800',color:C.accentDark,marginVertical:7},
 searchResults:{overflow:'hidden',borderRadius:16,borderColor:C.line,
   borderWidth:1,backgroundColor:C.white},
 noResults:{padding:19,backgroundColor:C.bg,borderRadius:16},
 noResultsTitle:{fontSize:16,fontWeight:'900',color:C.ink},
 noResultsDescription:{fontSize:14,lineHeight:21,marginTop:8,color:C.muted},
 helpAction:{minHeight:48,alignSelf:'flex-start',justifyContent:'center',
   marginTop:10,paddingHorizontal:15,backgroundColor:C.mint,borderRadius:13},
 helpActionText:{fontSize:14,color:C.accentDark,fontWeight:'900'},
 scroll:{flexShrink:1},content:{padding:16,paddingBottom:28},
 group:{fontSize:T.small,fontWeight:'800',color:C.accentDark,marginBottom:10,paddingHorizontal:3},
 quickGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10},
 quick:{...UI.card,width:'48%',minHeight:85,backgroundColor:C.bg,padding:13,gap:8,justifyContent:'space-between'},
 quickWide:{width:'100%',minHeight:66},
 quickActive:{backgroundColor:C.sunPale,borderColor:C.sun},
 quickIcon:{width:36,height:36,borderRadius:12,backgroundColor:C.paper,
   justifyContent:'center',alignItems:'center'},
 quickTitle:{fontSize:T.small,fontWeight:'800',color:C.ink},
 groupCard:{borderRadius:16,borderWidth:1,borderColor:C.line,marginBottom:9,
   overflow:'hidden',backgroundColor:C.paper},
 groupRow:{flexDirection:'row',alignItems:'center',padding:14,minHeight:54,gap:8,
   backgroundColor:C.bg},
 groupTitle:{fontSize:T.body,fontWeight:'800',color:C.ink,flex:1},
 groupCount:{color:C.muted,fontSize:13},
 item:{flexDirection:'row',gap:10,alignItems:'center',minHeight:63,padding:12,
   borderTopWidth:1,borderTopColor:C.line},
 selected:{backgroundColor:C.sunPale},
 glyphWrap:{width:36,height:36,alignItems:'center',justifyContent:'center',
   backgroundColor:C.mint,borderRadius:11},
 name:{fontSize:15,fontWeight:'700',color:C.ink},
 subtitle:{fontSize:T.meta,lineHeight:17,color:C.muted,marginTop:3},
 unread:{color:C.accentDark,fontWeight:'800',fontSize:13},
 pressed:{opacity:0.72}
});
