import React,{useEffect,useMemo,useState} from 'react';
import {Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import SearchResultFeedback from './SearchResultFeedback';
import {FAMILY_TOPIC_CATEGORIES,FAMILY_TOPIC_ARTICLES,findFamilyTopics} from './FamilyTopicsKnowledge';

// A self-contained guide, no personal details, search history or health facts are persisted.
export default function FamilyTopicsSection({initialQuery=''}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[expanded,setExpanded]=useState(null);
 const items=useMemo(()=>findFamilyTopics(query,category),[query,category]);
 useEffect(()=>{if(initialQuery.trim()){setOpen(true);setQuery(initialQuery);}},[initialQuery]);
 return <View style={s.container}>
  <Pressable accessibilityRole="button" accessibilityState={{expanded:open}}
    accessibilityLabel="Familienthemen – Ratgeber öffnen"
    onPress={()=>setOpen(v=>!v)} style={s.header}>
   <View style={{flex:1}}>
    <Text style={s.kicker}>FAMILIENWISSEN</Text>
    <Text accessibilityRole="header" style={s.title}>Alltag, Geld, Erziehung & Gesundheit</Text>
    <Text style={s.description}>{FAMILY_TOPIC_ARTICLES.length} recherchierte Ratgeber mit Originalquellen, Antragswegen und konkreten nächsten Schritten.</Text>
   </View>
   <Text style={s.arrow}>{open?'⌃':'›'}</Text>
  </Pressable>
  {open?<View style={s.body}>
   <Text style={s.hint}>Informationen zur Orientierung, keine automatische Anspruchsprüfung. Suche und Auswahl werden nicht gespeichert.</Text>
   <TextInput accessibilityLabel="Familienthemen durchsuchen" placeholder="z. B. Wohngeld, Kindergeld, Kita, Streit …"
    value={query} onChangeText={setQuery} placeholderTextColor={C.muted} style={s.input}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:8}} keyboardShouldPersistTaps="handled">
    {FAMILY_TOPIC_CATEGORIES.map(item=><Pressable key={item.id} accessibilityRole="button"
      accessibilityState={{selected:category===item.id}}
      onPress={()=>{setCategory(item.id);setExpanded(null);}}
      style={[s.chip,category===item.id&&s.selected]}>
       <Text style={[s.chipText,category===item.id&&s.selectedText]}>{item.label}</Text>
    </Pressable>)}
   </ScrollView>
   <SearchResultFeedback active={!!(query.trim()||category!=='all')} query={query} count={items.length} context="Familienratgeber" hint="Artikel antippen, um die nächsten Schritte und offiziellen Quellen zu öffnen."/>
   {items.map(item=><View key={item.id} style={s.article}>
     <Pressable accessibilityRole="button" accessibilityState={{expanded:expanded===item.id}}
       accessibilityLabel={item.title+(expanded===item.id?' schließen':' öffnen')}
       onPress={()=>setExpanded(v=>v===item.id?null:item.id)} style={s.articleButton}>
       <View style={{flex:1}}>
        <Text style={s.articleTitle}>{item.title}</Text>
        <Text style={s.hint}>{item.short}</Text>
       </View>
       <Text style={s.arrow}>{expanded===item.id?'⌃':'›'}</Text>
     </Pressable>
     {expanded===item.id?<View style={s.detail}>
       
       <Text style={s.detailTitle}>Das könnt ihr jetzt tun</Text>
       {item.steps.map((step,i)=><View key={i} style={s.step}>
         <Text style={s.stepNumber}>{i+1}.</Text><Text style={[s.description,{flex:1}]}>{step}</Text>
       </View>)}
       <Text style={s.detailTitle}>Worum geht es?</Text>
      <Text style={s.description}>{item.overview}</Text>
      <Text style={s.detailTitle}>Ansprechpartner</Text><Text style={s.description}>{item.responsible}</Text>
       <Text style={s.detailTitle}>Mögliche Unterlagen</Text><Text style={s.description}>{item.documents}</Text>
       <Text style={s.warning}>Wichtig: {item.caveat}</Text>
       <Text style={s.detailTitle}>Offizielle Informationen</Text>
       {item.sources.map(src=><Pressable key={src.url} accessibilityRole="link" accessibilityLabel={src.title+' öffnen'}
          style={s.link} onPress={()=>Linking.openURL(src.url).catch(()=>{})}>
          <Text style={s.linkText}>{src.title} ↗</Text>
       </Pressable>)}
     </View>:null}
   </View>)}
   {!items.length?<Text style={s.hint}>Keine Treffer. Suche mit einem anderen Begriff oder wähle „Alle Themen“.</Text>:null}
   <Text style={s.hint}>Quellenstand: 23. November 2026. Rechtliche Fristen, Anspruchsvoraussetzungen, Kontaktdaten und medizinische Empfehlungen können sich ändern; verbindliche Auskunft nur bei der zuständigen Stelle.</Text>
  </View>:null}
 </View>;
}
const s=StyleSheet.create({
 container:{marginTop:18,marginBottom:18,borderRadius:19,backgroundColor:C.paper,borderColor:C.line,borderWidth:1,overflow:'hidden'},
 header:{flexDirection:'row',alignItems:'center',minHeight:92,padding:16,gap:10,backgroundColor:C.sunPale},
 kicker:{fontWeight:'800',fontSize:10,letterSpacing:1.2,color:C.accentDark},
 title:{fontSize:18,fontWeight:'800',color:C.ink,marginTop:6},
 description:{fontSize:15,lineHeight:20,color:C.ink,marginTop:5},
 arrow:{fontSize:23,fontWeight:'700',color:C.accentDark},
 body:{padding:14,gap:9},
 hint:{fontSize:14,lineHeight:18,color:C.muted},
 input:{minHeight:47,paddingHorizontal:13,borderRadius:12,borderColor:C.line,borderWidth:1,color:C.ink,backgroundColor:C.bg,fontSize:14},
 chip:{minHeight:44,paddingHorizontal:11,justifyContent:'center',borderRadius:18,borderColor:C.line,borderWidth:1,backgroundColor:C.paper},
 selected:{backgroundColor:C.accentDark,borderColor:C.accentDark},
 chipText:{fontSize:14,fontWeight:'700',color:C.accentDark},selectedText:{color:C.white},
 article:{borderRadius:14,borderColor:C.line,borderWidth:1,backgroundColor:C.paper,overflow:'hidden'},
 articleButton:{minHeight:56,padding:12,flexDirection:'row',gap:10,alignItems:'center'},
 articleTitle:{fontSize:16,fontWeight:'800',color:C.ink,marginBottom:4},
 detail:{borderTopWidth:1,borderTopColor:C.line,padding:12,gap:7},
 detailTitle:{fontWeight:'800',fontSize:15,color:C.accentDark,marginTop:9},
 step:{flexDirection:'row',gap:8},stepNumber:{fontWeight:'800',color:C.accentDark,fontSize:13},
 warning:{padding:11,borderRadius:10,backgroundColor:C.sunPale,fontSize:14,lineHeight:19,color:C.ink},
 link:{minHeight:44,borderRadius:10,padding:11,backgroundColor:C.mint,justifyContent:'center'},
 linkText:{color:C.accentDark,fontSize:14,fontWeight:'800'}
});
