import React,{useEffect,useMemo,useState} from 'react';
import {Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {INCLUSION_ARTICLES,INCLUSION_CATEGORIES,findInclusionArticles} from './InclusionKnowledge';
import {guessBrandenburgRegion,REGIONAL_DIRECTORY_URL} from './BrandenburgFamilyRegions';

function LinkRow({title,url}){
 return <Pressable accessibilityRole="link" accessibilityLabel={title+' öffnen'}
   onPress={()=>Linking.openURL(url).catch(()=>{})}
   style={s.linkRow}>
   <View style={{flex:1}}><Text style={s.linkText}>{title}</Text></View>
   <FamilyIcon name="chevron-right" size={18}/>
 </Pressable>;
}
export default function InclusionKnowledgeScreen({regionLabel,onOpenMap,initialQuery=''}){
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('all');
 const [opened,setOpened]=useState(null);
 useEffect(()=>{if(initialQuery.trim())setSearch(initialQuery);},[initialQuery]);
 const entries=useMemo(()=>findInclusionArticles(search,category),[search,category]);
 const region=guessBrandenburgRegion(regionLabel);
 const localOffice=region?.offices?.filter(o=>o.topic==='disability')||[];
 return <ScrollView style={s.page} contentContainerStyle={s.content}
  keyboardShouldPersistTaps="handled">
  <View style={s.hero}>
   <View style={s.heroIcon}><FamilyIcon name="heart" size={29} color={C.accentDark}/></View>
   <Text style={s.eyebrow}>INKLUSION, TEILHABE & SELBSTBESTIMMUNG</Text>
   <Text accessibilityRole="header" style={s.title}>Familien & Inklusion</Text>
   <Text style={s.heroText}>Konkrete Antragswege, Ansprechpartner und Orientierung – für Menschen mit Behinderungen und ihre Familien.</Text>
  </View>
  <View style={s.note}>
   <Text style={s.noteTitle}>Deine Privatsphäre bleibt deine Entscheidung</Text>
   <Text style={s.text}>Du musst hier keine Diagnose angeben. Deine Suche und die angezeigten Artikel werden nicht als Gesundheitsprofil gespeichert. Familienfunke versendet keine Anträge und ersetzt keine individuelle Rechts- oder medizinische Beratung.</Text>
  </View>
  <View style={s.regionCard}>
   <Text accessibilityRole="header" style={s.sectionTitle}>Beratung in eurer Region</Text>
   <Text style={s.text}>{region?
     'Für '+region.name+' zeigen wir vorhandene geprüfte Anlaufstellen. Bei nicht einzeln geprüften Kreisen führt der Landeswegweiser weiter.':
     'Wähle im Familien-Wegweiser deinen Landkreis, um die zuständige örtliche Stelle zu finden. Deine genaue Position wird nicht benötigt.'}</Text>
   {localOffice.length?localOffice.map(o=><View key={o.title} style={s.localOffice}>
     <Text style={s.cardTitle}>{o.title}</Text><Text style={s.text}>{o.detail}</Text>
     {o.contact?<Text style={s.contact}>Kontakt: {o.contact}</Text>:null}
     <LinkRow title="Offizielle Stelle öffnen" url={o.url}/>
   </View>):null}
   <LinkRow title="Amtliches Kommunalverzeichnis" url={REGIONAL_DIRECTORY_URL}/>
   <LinkRow title="Unabhängige Teilhabeberatung bundesweit"
     url="https://www.teilhabeberatung.de/beratung/beratungsangebote-der-eutb"/>
   <LinkRow title="LASV Brandenburg – Anträge zum GdB"
     url="https://lasv.brandenburg.de/lasv/de/schwerbehinderung/"/>
  </View>
  <Text accessibilityRole="header" style={s.sectionTitle}>Wobei benötigst du Hilfe?</Text>
  <TextInput accessibilityLabel="Inklusionswissen durchsuchen"
   value={search} onChangeText={setSearch} placeholder="z. B. Pflegegrad, Schule, Frühförderung"
   placeholderTextColor={C.muted} style={s.search}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
   contentContainerStyle={{gap:8,paddingBottom:12}}>
   {INCLUSION_CATEGORIES.map(c=><Pressable key={c.id} accessibilityRole="button"
    accessibilityLabel={'Thema: '+c.label}
    accessibilityState={{selected:category===c.id}}
    onPress={()=>{setCategory(c.id);setOpened(null);}}
    style={[s.filterChip,category===c.id&&s.filterSelected]}>
    <Text style={[s.filterText,category===c.id&&{color:C.paper}]}>{c.label}</Text>
   </Pressable>)}
  </ScrollView>
  <Text style={s.count}>{entries.length} {entries.length===1?'Thema':'Themen'} gefunden</Text>
  {!entries.length?<View style={s.empty}>
    <Text style={s.cardTitle}>Kein passender Artikel</Text>
    <Text style={s.text}>Versuche andere Suchbegriffe oder zeige alle Themen.</Text>
    <Pressable accessibilityRole="button" style={s.clear}
      onPress={()=>{setSearch('');setCategory('all');}}>
      <Text style={s.clearText}>Alle Themen anzeigen</Text>
    </Pressable>
  </View>:null}
  {entries.map(article=>{
   const open=opened===article.id;
   return <View key={article.id} style={s.article}>
    <Pressable accessibilityRole="button"
      accessibilityLabel={article.title+' '+(open?'einklappen':'Details anzeigen')}
      accessibilityState={{expanded:open}}
      style={s.articleTrigger} onPress={()=>setOpened(open?null:article.id)}>
      <View style={s.articleIcon}><FamilyIcon name="book" size={22}/></View>
      <View style={{flex:1}}>
       <Text style={s.cardTitle}>{article.title}</Text>
       <Text style={s.articleSubtitle}>{article.short}</Text>
      </View>
      <FamilyIcon name={open?'chevron-up':'chevron-down'} size={20}/>
    </Pressable>
    {open?<View style={s.detail}>
     <Text style={s.body}>{article.overview}</Text>
     <Text style={s.detailHeading}>So kannst du vorgehen</Text>
     {article.firstSteps.map((step,i)=><View key={i} style={s.step}>
       <View style={s.stepNumber}><Text style={s.stepNumberText}>{i+1}</Text></View>
       <Text style={[s.body,{flex:1}]}>{step}</Text>
     </View>)}
     <Text style={s.detailHeading}>Ansprechpartner</Text>
     <Text style={s.body}>{article.responsible}</Text>
     <Text style={s.detailHeading}>Mögliche Unterlagen</Text>
     <Text style={s.body}>{article.documents}</Text>
     <View style={s.caution}>
       <Text style={s.cautionTitle}>Wichtig zu wissen</Text>
       <Text style={s.body}>{article.caveat}</Text>
     </View>
     <Text style={s.detailHeading}>Offizielle Quellen</Text>
     {article.sources.map(item=><LinkRow key={item.url} title={item.title} url={item.url}/>)}
     {article.id==='accessible-outings'&&onOpenMap?
      <Pressable accessibilityRole="button" accessibilityLabel="Familienkarte öffnen"
        onPress={onOpenMap} style={s.mapButton}>
        <FamilyIcon name="map" size={18} color={C.white}/>
        <Text style={s.mapButtonText}>Ausflugsziele auf der Karte prüfen</Text>
      </Pressable>:null}
    </View>:null}
   </View>;
  })}
  <View style={s.footer}>
   <Text style={s.text}>Quellenstand: 22. November 2026. Anspruchsvoraussetzungen, Zuständigkeiten und Verfahren können sich ändern. Bei einer Frist oder einem belastenden Bescheid bitte umgehend die zuständige Stelle oder unabhängige Beratung kontaktieren.</Text>
   <Text style={[s.text,{marginTop:8}]}>Geschützte Inklusionsgruppen und individuelle digitale Antragsübermittlung sind derzeit nicht verfügbar. Öffentliche Profile verlangen keine Angaben zu Erkrankungen oder Behinderungen.</Text>
  </View>
 </ScrollView>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:55},
 hero:{borderRadius:24,backgroundColor:C.sunPale,padding:21,marginBottom:15},
 heroIcon:{width:54,height:54,borderRadius:18,backgroundColor:C.paper,
   justifyContent:'center',alignItems:'center',marginBottom:13},
 eyebrow:{fontSize:10.5,letterSpacing:1.1,color:C.accentDark,fontWeight:'800'},
 title:{fontSize:27,color:C.ink,fontWeight:'800',marginTop:6},
 heroText:{fontSize:14,lineHeight:21,color:C.ink,marginTop:9},
 note:{backgroundColor:C.mint,borderRadius:18,padding:15,marginBottom:18},
 noteTitle:{color:C.accentDark,fontWeight:'800',fontSize:15,marginBottom:7},
 text:{color:C.muted,fontSize:13,lineHeight:20},
 regionCard:{borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
   padding:16,marginBottom:23},
 sectionTitle:{fontSize:19,fontWeight:'800',color:C.ink,marginBottom:10},
 localOffice:{borderTopWidth:1,borderTopColor:C.line,marginTop:12,paddingTop:12},
 contact:{color:C.ink,fontWeight:'700',fontSize:12,marginTop:7},
 linkRow:{minHeight:48,marginTop:7,padding:11,borderRadius:12,backgroundColor:C.sunPale,
   flexDirection:'row',gap:8,alignItems:'center'},
 linkText:{color:C.accentDark,fontSize:12.5,fontWeight:'800'},
 search:{backgroundColor:C.paper,borderWidth:1,borderColor:C.line,minHeight:52,borderRadius:15,
   fontSize:15,color:C.ink,paddingHorizontal:15,marginBottom:14},
 filterChip:{backgroundColor:C.paper,borderColor:C.line,borderWidth:1,borderRadius:22,
   paddingHorizontal:13,minHeight:42,justifyContent:'center'},
 filterSelected:{backgroundColor:C.accentDark,borderColor:C.accentDark},
 filterText:{fontSize:13,color:C.accentDark,fontWeight:'700'},
 count:{color:C.muted,fontSize:12.5,marginBottom:10},
 article:{backgroundColor:C.paper,borderColor:C.line,borderWidth:1,borderRadius:19,
   overflow:'hidden',marginBottom:10},
 articleTrigger:{flexDirection:'row',alignItems:'center',padding:14,minHeight:79,gap:10},
 articleIcon:{width:39,height:39,borderRadius:13,backgroundColor:C.mint,
   alignItems:'center',justifyContent:'center'},
 cardTitle:{fontSize:15,fontWeight:'800',color:C.ink},
 articleSubtitle:{fontSize:12.5,lineHeight:18,color:C.muted,marginTop:4},
 detail:{borderTopWidth:1,borderTopColor:C.line,padding:15,gap:4},
 body:{fontSize:13.5,color:C.ink,lineHeight:21},
 detailHeading:{fontSize:14.5,color:C.ink,fontWeight:'800',marginTop:13,marginBottom:5},
 step:{flexDirection:'row',alignItems:'flex-start',gap:11,marginVertical:6},
 stepNumber:{width:28,height:28,borderRadius:14,backgroundColor:C.mint,
   alignItems:'center',justifyContent:'center'},
 stepNumberText:{color:C.accentDark,fontSize:13,fontWeight:'800'},
 caution:{padding:12,borderRadius:13,backgroundColor:C.warn,marginTop:13},
 cautionTitle:{fontWeight:'800',color:C.warningText,fontSize:13,marginBottom:5},
 mapButton:{borderRadius:13,backgroundColor:C.accentDark,minHeight:48,
   alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,marginTop:14},
 mapButtonText:{color:C.white,fontWeight:'800',fontSize:13},
 empty:{backgroundColor:C.paper,borderRadius:18,padding:17,marginBottom:12,gap:8},
 clear:{minHeight:44,justifyContent:'center',backgroundColor:C.mint,paddingHorizontal:12,borderRadius:12},
 clearText:{fontWeight:'800',color:C.accentDark,fontSize:13},
 footer:{backgroundColor:C.paper,borderRadius:17,borderWidth:1,borderColor:C.line,
   padding:14,marginTop:9}
});
