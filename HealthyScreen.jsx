import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {FAMILY_COLORS as C,FAMILY_TYPE as T} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {HEALTH_CATEGORIES,HEALTH_RESOURCES,findHealthyResources} from './FamilyHealthyContent';

export default function HealthyScreen({initialQuery='',onOpenMap}){
 const [query,setQuery]=useState(initialQuery),[category,setCategory]=useState('all');
 useEffect(()=>setQuery(initialQuery),[initialQuery]);
 const matches=useMemo(()=>query.trim()?findHealthyResources(query,30):HEALTH_RESOURCES,[query]);
 const visible=matches.filter(r=>category==='all'||r.category===category);
 const open=url=>Linking.openURL(url).catch(()=>Alert.alert('Quelle nicht erreichbar','Der externe Link konnte nicht geöffnet werden.'));
 return <ScrollView style={s.page} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
  <View style={s.hero}>
   <Text style={s.eyebrow}>FAMILIENFUNKE AKTIV</Text>
   <Text accessibilityRole="header" style={s.title}>Sport & Gesundheit</Text>
   <Text style={s.intro}>Sportvereine in der Region, Ideen für Bewegung und fundierte Informationen zu gesunder Ernährung.</Text>
  </View>
  <Pressable accessibilityRole="button" onPress={onOpenMap} style={s.mapAction}
   accessibilityLabel="Radwege und Wanderwege mit Ausflugs-Hotspots auf der Familienkarte öffnen">
   <FamilyIcon name="map" size={27} color={C.accentDark}/>
   <View style={{flex:1}}>
    <Text style={s.mapTitle}>Rad- & Wanderwege</Text>
    <Text style={s.description}>Kartenebene einschalten und Ausflugs-Hotspots entdecken</Text>
   </View><FamilyIcon name="chevron-right" size={19}/>
  </Pressable>
  <Text style={s.note}>Die Karte zeigt OpenStreetMap-Wege, keine durchgehend ausgeschilderten oder geprüften Touren. Barrierefreiheit und Familien-Eignung vor Ort prüfen.</Text>
  <Text accessibilityRole="header" style={s.section}>Vereine, Ratgeber & Videos</Text>
  <TextInput accessibilityLabel="Sport und Gesundheit suchen" placeholder="z. B. Schwimmen, Wandern, Ernährung"
   placeholderTextColor={C.muted} value={query} onChangeText={setQuery} style={s.search}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
   {HEALTH_CATEGORIES.map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:category===c.id}}
    onPress={()=>setCategory(c.id)} style={[s.chip,category===c.id&&s.chipActive]}>
    <Text style={[s.chipLabel,category===c.id&&{color:C.white}]}>{c.title}</Text></Pressable>)}
  </ScrollView>
  <Text accessibilityLiveRegion="polite" style={s.note}>{visible.length} geprüfte Quellen</Text>
  {visible.map(r=><Pressable accessibilityRole="link" key={r.id} accessibilityLabel={r.title+', externe Quelle öffnen'}
   onPress={()=>open(r.url)} style={s.card}>
   <Text style={s.source}>{r.source} · {r.region}</Text>
   <Text style={s.cardTitle}>{r.title}</Text>
   <Text style={s.description}>{r.description}</Text>
   <Text style={s.link}>Offizielle Quelle öffnen ›</Text>
  </Pressable>)}
  {!visible.length?<Text style={s.note}>Keine Treffer. Suche anpassen oder „Alle“ auswählen.</Text>:null}
  <Text style={s.note}>Die verlinkten Videos und Informationen sind öffentlich kostenlos aufrufbar, aber nicht zur Wiederveröffentlichung freigegeben. Vereinsmitgliedschaften können kostenpflichtig sein. Medizinische Beratung wird dadurch nicht ersetzt.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},body:{padding:18,paddingBottom:40,gap:12},
 hero:{padding:20,backgroundColor:C.sunPale,borderRadius:24},
 eyebrow:{fontSize:11,color:C.accentDark,fontWeight:'800',letterSpacing:1},
 title:{fontSize:T.title,fontWeight:'900',color:C.ink,marginTop:8},
 intro:{fontSize:T.body,lineHeight:22,color:C.ink,marginTop:9},
 mapAction:{flexDirection:'row',alignItems:'center',gap:12,minHeight:86,padding:15,borderRadius:19,backgroundColor:C.white,borderWidth:1,borderColor:C.line},
 mapTitle:{fontSize:T.card,fontWeight:'800',color:C.ink},
 note:{fontSize:T.small,color:C.muted,lineHeight:19},
 section:{fontSize:T.section,fontWeight:'800',color:C.ink,marginTop:9},
 search:{minHeight:52,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:15,paddingHorizontal:14,fontSize:T.body,color:C.ink},
 filters:{gap:8,paddingVertical:3},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderWidth:1,borderColor:C.line,borderRadius:22,backgroundColor:C.white},
 chipActive:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipLabel:{fontWeight:'700',fontSize:T.small,color:C.ink},
 card:{padding:16,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.white},
 source:{fontSize:T.meta,color:C.accentDark,fontWeight:'800'},
 cardTitle:{fontSize:T.card,color:C.ink,fontWeight:'800',marginTop:8},
 description:{fontSize:T.small,lineHeight:20,color:C.muted,marginTop:5},
 link:{fontSize:T.small,fontWeight:'800',color:C.accentDark,marginTop:10}
});
