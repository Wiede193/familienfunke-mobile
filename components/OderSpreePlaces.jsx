import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OUTINGS_ODER_SPREE } from '../data/ausflugszieleOderSpree';

const C={
  ink:'#243E43', muted:'#667B7C', teal:'#087F87', dark:'#075D67',
  coral:'#BB645A', cream:'#FFFAF2', line:'#EBDCC9', white:'#FFFFFF'
};
const categories=['Alle','Spielplätze','Wasser','Erlebnis','Natur','Tiere','Kultur'];
const colors={
  'Spielplätze':{bg:'#FFEDC6',sun:'#FFC76A',hill:'#F0C792',ink:'#8A5C18'},
  'Wasser':{bg:'#DDF3F3',sun:'#FFDD99',hill:'#A8DBD8',ink:'#276C76'},
  'Erlebnis':{bg:'#FBE2D6',sun:'#FFB998',hill:'#F3B9AD',ink:'#945349'},
  'Natur':{bg:'#E7EFDB',sun:'#F5D78C',hill:'#AFD0AD',ink:'#436C56'},
  'Tiere':{bg:'#F8E8DB',sun:'#F9CE92',hill:'#D9BA96',ink:'#8A674B'},
  'Kultur':{bg:'#EEE8F5',sun:'#FFD9A9',hill:'#D3C7E5',ink:'#655889'}
};
const FAVORITE_PREFIX='@familienfunke:ortsfavoriten:v1:';
function MiniLandscape({place,large=false}){
  const c=colors[place.category]||colors.Natur;
  return <View style={[styles.landscape,large&&styles.landscapeLarge,{backgroundColor:c.bg}]}>
    <View pointerEvents="none" style={[styles.sun,{backgroundColor:c.sun},large&&{width:105,height:105,borderRadius:53,right:26,top:-19}]}/>
    <View pointerEvents="none" style={[styles.hillBack,{backgroundColor:c.hill},large&&{bottom:-92,width:280,height:185,borderRadius:145}]}/>
    <View pointerEvents="none" style={[styles.hillFront,{backgroundColor:c.ink,opacity:.1},large&&{bottom:-111,width:300,height:195,borderRadius:150}]}/>
    <Text style={[styles.landscapeLabel,{color:c.ink}]}>{place.category.toUpperCase()}</Text>
  </View>;
}
function Pill({text,active,onPress}){
  return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress}
    style={[styles.pill,active&&styles.pillActive]}>
    <Text style={[styles.pillText,active&&styles.pillTextActive]}>{text}</Text>
  </Pressable>;
}
export default function OderSpreePlaces({userId,onPlan}){
  const [category,setCategory]=useState('Alle');
  const [town,setTown]=useState('Alle Orte');
  const [query,setQuery]=useState('');
  const [onlyFavorites,setOnlyFavorites]=useState(false);
  const [selected,setSelected]=useState(null);
  const [favorites,setFavorites]=useState([]);
  const [loadedKey,setLoadedKey]=useState(null);
  const favoriteKey=userId?FAVORITE_PREFIX+userId:null;

  useEffect(()=>{
    let alive=true;
    setLoadedKey(null);
    setFavorites([]);
    if(!favoriteKey)return ()=>{alive=false;};
    AsyncStorage.getItem(favoriteKey).then(value=>{
      if(!alive)return;
      let ids=[];
      try{const parsed=JSON.parse(value||'[]');if(Array.isArray(parsed))ids=parsed.filter(id=>OUTINGS_ODER_SPREE.some(p=>p.id===id));}catch{}
      setFavorites([...new Set(ids)]);
      setLoadedKey(favoriteKey);
    }).catch(()=>{if(alive)setLoadedKey(favoriteKey);});
    return ()=>{alive=false;};
  },[favoriteKey]);

  useEffect(()=>{
    if(!favoriteKey||favoriteKey!==loadedKey)return;
    AsyncStorage.setItem(favoriteKey,JSON.stringify(favorites))
      .catch(()=>{});
  },[favoriteKey,loadedKey,favorites]);

  const towns=useMemo(()=>['Alle Orte',...new Set(OUTINGS_ODER_SPREE.map(p=>p.town))],[]);
  const filtered=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase('de-DE');
    return OUTINGS_ODER_SPREE.filter(p=>
      (category==='Alle'||p.category===category) &&
      (town==='Alle Orte'||p.town===town) &&
      (!onlyFavorites||favorites.includes(p.id)) &&
      (!needle||[p.name,p.town,p.category,p.description,p.highlights].join(' ').toLocaleLowerCase('de-DE').includes(needle))
    ).sort((a,b)=>a.town.localeCompare(b.town,'de')||a.name.localeCompare(b.name,'de'));
  },[category,town,onlyFavorites,favorites,query]);
  const featured=OUTINGS_ODER_SPREE.filter(p=>p.featured).slice(0,5);

  function toggleFavorite(id){
    setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  }
  function openSafe(url){
    if(!/^https:\/\/(www\.)?(seenland-oderspree\.de|bad-saarow\.de|muellrose\.de|openstreetmap\.org)\//.test(url)){
      Alert.alert('Link nicht verfügbar','Die Zieladresse konnte nicht geprüft werden.');return;
    }
    Linking.openURL(url).catch(()=>Alert.alert('Link konnte nicht geöffnet werden','Bitte versuche es später erneut.'));
  }
  function openMap(place){
    const queryText=[place.name,place.address,'Landkreis Oder-Spree, Brandenburg, Deutschland'].join(', ');
    openSafe('https://www.openstreetmap.org/search?query='+encodeURIComponent(queryText));
  }
  function plan(place){
    setSelected(null);
    onPlan?.({title:place.name,description:'einen Ausflug zum '+place.name+' machen. '+place.description},place.town);
  }
  function PlaceActions({place}){
    return <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Karte zu '+place.name+' öffnen'}
        onPress={()=>openMap(place)} style={styles.outlineAction}>
        <Text style={styles.outlineActionText}>Karte ansehen</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={'Ausflug zu '+place.name+' planen'}
        onPress={()=>plan(place)} style={styles.primaryAction}>
        <Text style={styles.primaryActionText}>Treffen planen</Text>
      </Pressable>
    </View>;
  }

  return <View style={styles.container}>
    <View style={styles.hero}>
      <View pointerEvents="none" style={styles.heroSun}/>
      <Text style={styles.kicker}>UNSER PILOT-LANDKREIS</Text>
      <Text style={styles.title}>Oder-Spree entdecken</Text>
      <Text style={styles.heroCopy}>Vom Schlaubetal bis zum Scharmützelsee: schöne Orte zum Spielen, Staunen und Gemeinsam-Zeit-Verbringen.</Text>
      <View style={styles.heroFact}><Text style={styles.heroFactText}>{OUTINGS_ODER_SPREE.length} recherchierte, dauerhaft bestehende Ausflugsorte</Text></View>
    </View>
    <View style={styles.intro}>
      <Text style={styles.heading}>Unsere Lieblingsideen</Text>
      <Text style={styles.sub}>Eine Auswahl zum Stöbern. Die vollständige Übersicht findest du direkt darunter.</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled
      contentContainerStyle={styles.featuredRail}>
      {featured.map(place=><Pressable key={place.id} accessibilityRole="button"
        accessibilityLabel={'Details öffnen: '+place.name} onPress={()=>setSelected(place)}
        style={styles.featuredCard}>
        <MiniLandscape place={place}/>
        <View style={styles.featuredText}>
          <Text style={styles.featuredTown}>{place.town}</Text>
          <Text style={styles.featuredName} numberOfLines={2}>{place.name}</Text>
          <Text style={styles.featuredMore}>Mehr erfahren  ›</Text>
        </View>
      </Pressable>)}
    </ScrollView>
    <View style={styles.searchSection}>
      <Text style={styles.heading}>Alle Ausflugsziele</Text>
      <TextInput value={query} onChangeText={setQuery} style={styles.searchInput}
        placeholder="Ort, Spielplatz oder Ausflugsziel suchen …" placeholderTextColor="#8E9C9B"
        accessibilityLabel="Ausflugsziele durchsuchen" autoCorrect={false} maxLength={80}/>
      <Text style={styles.filterHeading}>Was möchtet ihr machen?</Text>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRail}>{categories.map(c=><Pill key={c} text={c} active={category===c} onPress={()=>setCategory(c)}/>)}</ScrollView>
      <Text style={styles.filterHeading}>In welchem Ort?</Text>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRail}>{towns.map(t=><Pill key={t} text={t} active={town===t} onPress={()=>setTown(t)}/>)}</ScrollView>
      <View style={styles.countRow}>
        <Text style={styles.count}>{filtered.length} {filtered.length===1?'Ausflugsziel':'Ausflugsziele'}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{selected:onlyFavorites}} onPress={()=>setOnlyFavorites(v=>!v)} style={[styles.favoritesToggle,onlyFavorites&&styles.favoritesToggleActive]}>
          <Text style={styles.favoritesToggleText}>{onlyFavorites?'Alle anzeigen':'Nur gemerkte'}</Text>
        </Pressable>
      </View>
    </View>
    {filtered.length===0?<View style={styles.empty}>
      <Text style={styles.emptyTitle}>Hier ist noch nichts dabei.</Text>
      <Text style={styles.sub}>Ändere den Ort oder die Kategorie. Deine gemerkten Ziele bleiben gespeichert.</Text>
      <Pressable accessibilityRole="button" onPress={()=>{setCategory('Alle');setTown('Alle Orte');setQuery('');setOnlyFavorites(false);}} style={styles.resetButton}>
        <Text style={styles.resetText}>Filter zurücksetzen</Text>
      </Pressable>
    </View>:null}
    {filtered.map(place=><View key={place.id} style={styles.placeCard}>
      <View style={styles.cardRow}>
        <View style={styles.cardPicture}><MiniLandscape place={place}/></View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLocation}>{place.town} · {place.category}</Text>
          <Text style={styles.cardTitle} numberOfLines={3}>{place.name}</Text>
          <Text style={styles.season}>{place.season}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>{place.description}</Text>
      <View style={styles.cardBottom}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Details zu '+place.name} onPress={()=>setSelected(place)} style={styles.detailsButton}>
          <Text style={styles.detailsText}>Details & Quelle  ›</Text>
        </Pressable>
        <Pressable accessibilityRole="button"
          accessibilityLabel={favorites.includes(place.id)?'Aus Merkliste entfernen: '+place.name:'Ausflug merken: '+place.name}
          onPress={()=>toggleFavorite(place.id)} style={[styles.saveButton,favorites.includes(place.id)&&styles.saveButtonActive]}>
          <Text style={[styles.saveText,favorites.includes(place.id)&&styles.saveTextActive]}>{favorites.includes(place.id)?'Gemerkt ✓':'+ Merken'}</Text>
        </Pressable>
      </View>
    </View>)}
    <Text style={styles.footerNote}>
      Dauerhafte Ziele bedeuten nicht, dass sie täglich geöffnet sind. Öffnungszeiten, Eintrittspreise,
      saisonale Angebote und Zugänglichkeit bitte vor dem Besuch beim jeweiligen Anbieter prüfen.
      Alle Angaben stammen aus verlinkten offiziellen oder regionalen Tourismusquellen (Recherche: 19.11.2026).
      Es findet keine GPS-Ortung statt. Die Merkliste wird nur auf diesem Gerät pro Konto gespeichert.
    </Text>

    <Modal visible={!!selected} animationType="slide" onRequestClose={()=>setSelected(null)}>
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalEyebrow}>FAMILIENFUNKE · AUSFLUGSZIEL</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Details schließen"
            style={styles.modalClose} onPress={()=>setSelected(null)}>
            <Text style={styles.modalCloseText}>Schließen  ×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {selected?<><MiniLandscape place={selected} large/>
            <Text style={styles.modalTown}>{selected.town} · {selected.category}</Text>
            <Text style={styles.modalTitle}>{selected.name}</Text>
            <Text style={styles.modalDescription}>{selected.description}</Text>
            <View style={styles.factCard}>
              <Text style={styles.factLabel}>Das erwartet euch</Text>
              <Text style={styles.factBody}>{selected.highlights}</Text>
              <View style={styles.factDivider}/>
              <Text style={styles.factLabel}>Wo ist das?</Text>
              <Text style={styles.factBody}>{selected.address}</Text>
              <View style={styles.factDivider}/>
              <Text style={styles.factLabel}>Gut zu wissen</Text>
              <Text style={styles.factBody}>{selected.note}</Text>
              <Text style={styles.factSmall}>Hinweis: {selected.season}</Text>
            </View>
            <PlaceActions place={selected}/>
            <Pressable accessibilityRole="button" onPress={()=>openSafe(selected.sourceUrl)} style={styles.sourceButton}>
              <Text style={styles.sourceTitle}>Offizielle Informationen ansehen  ↗</Text>
              <Text style={styles.sourceSub}>{selected.sourceName} · geprüft am 19.11.2026</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={()=>toggleFavorite(selected.id)} style={styles.modalFavorite}>
              <Text style={styles.modalFavoriteText}>{favorites.includes(selected.id)?'✓ Ausflug ist gemerkt':'＋ Ausflug für später merken'}</Text>
            </Pressable>
            <Text style={styles.modalDisclaimer}>Die Inhalte helfen bei der Ausflugsplanung. Sie sind keine Zusage über Öffnung, Preise oder freie Plätze. Achtet besonders an Badestellen auf die Sicherheit der Kinder.</Text>
          </>:null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles=StyleSheet.create({
 container:{paddingBottom:18},
 hero:{backgroundColor:'#FFF0D3',borderRadius:26,borderWidth:1,borderColor:'#F1D69D',padding:21,overflow:'hidden',marginBottom:23},
 heroSun:{position:'absolute',right:-45,top:-72,width:170,height:170,borderRadius:85,backgroundColor:'#FFD78D'},
 kicker:{color:'#945D20',fontSize:10.5,letterSpacing:1.1,fontWeight:'900',marginBottom:12},
 title:{color:C.ink,fontSize:26,fontWeight:'900',lineHeight:31,maxWidth:265},
 heroCopy:{color:'#526969',fontSize:13.5,lineHeight:21,marginTop:11,maxWidth:275},
 heroFact:{alignSelf:'flex-start',backgroundColor:'#FFFFFF',borderColor:'#F0DAAF',borderWidth:1,borderRadius:14,paddingVertical:9,paddingHorizontal:11,marginTop:17},
 heroFactText:{color:C.dark,fontSize:11.5,fontWeight:'900'},
 intro:{gap:3,marginBottom:13},
 heading:{fontSize:19,fontWeight:'900',color:C.ink},
 sub:{fontSize:12.5,color:C.muted,lineHeight:19},
 featuredRail:{gap:11,paddingBottom:13,paddingRight:12},
 featuredCard:{width:215,backgroundColor:C.white,borderRadius:19,borderWidth:1,borderColor:C.line,overflow:'hidden'},
 landscape:{height:83,overflow:'hidden',position:'relative',justifyContent:'flex-end',paddingHorizontal:12,paddingBottom:12},
 landscapeLarge:{height:175,borderRadius:21,marginBottom:19,paddingHorizontal:17,paddingBottom:16},
 landscapeLabel:{fontSize:10,letterSpacing:1.5,fontWeight:'900'},
 sun:{position:'absolute',width:72,height:72,borderRadius:36,right:13,top:-29},
 hillBack:{position:'absolute',width:155,height:86,borderRadius:75,right:-28,bottom:-38},
 hillFront:{position:'absolute',width:156,height:85,borderRadius:75,left:-45,bottom:-52},
 featuredText:{padding:12,minHeight:110},
 featuredTown:{fontSize:10.5,color:'#906124',fontWeight:'900'},
 featuredName:{fontSize:15,color:C.ink,fontWeight:'900',lineHeight:20,marginTop:5},
 featuredMore:{fontSize:11.5,color:C.teal,fontWeight:'900',marginTop:8},
 searchSection:{marginTop:10},
 searchInput:{backgroundColor:C.white,borderColor:'#DEDCCD',borderWidth:1,borderRadius:15,paddingHorizontal:13,minHeight:50,fontSize:14,color:C.ink,marginTop:11,marginBottom:18},
 filterHeading:{fontSize:13.5,fontWeight:'900',color:C.ink,marginBottom:10},
 chipRail:{gap:8,paddingBottom:14,paddingRight:10},
 pill:{borderRadius:18,borderWidth:1,borderColor:'#DEDCD3',backgroundColor:C.white,paddingHorizontal:12,paddingVertical:9,justifyContent:'center'},
 pillActive:{backgroundColor:'#FFF0D3',borderColor:'#E9BA6D'},
 pillText:{color:'#687D80',fontSize:12,fontWeight:'700'},
 pillTextActive:{color:'#855A1D',fontWeight:'900'},
 countRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:9,marginBottom:13,gap:8},
 count:{fontSize:16.5,fontWeight:'900',color:C.ink,flex:1},
 favoritesToggle:{backgroundColor:'#FFF6E6',paddingHorizontal:12,paddingVertical:9,borderRadius:15,borderWidth:1,borderColor:'#F0DFBF'},
 favoritesToggleActive:{backgroundColor:'#FFE5AE'},
 favoritesToggleText:{fontSize:11.5,color:'#8C6027',fontWeight:'900'},
 placeCard:{borderWidth:1,borderColor:C.line,backgroundColor:C.white,borderRadius:21,padding:14,marginBottom:11},
 cardRow:{flexDirection:'row',gap:13,alignItems:'center'},
 cardPicture:{width:96,overflow:'hidden',borderRadius:12},
 cardHeader:{flex:1,gap:4},
 cardLocation:{fontSize:10.5,fontWeight:'900',color:'#AB6D2B'},
 cardTitle:{fontSize:16,fontWeight:'900',color:C.ink,lineHeight:21},
 season:{fontSize:10.5,fontWeight:'800',color:'#688184'},
 cardDescription:{color:'#466061',fontSize:13.5,lineHeight:20,marginTop:12},
 cardBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:14,paddingTop:11,borderTopColor:'#F0E7DE',borderTopWidth:1,gap:8},
 detailsButton:{flex:1,paddingVertical:7},
 detailsText:{color:C.teal,fontSize:12,fontWeight:'900'},
 saveButton:{borderWidth:1,borderColor:'#D6DCD8',borderRadius:12,paddingVertical:8,paddingHorizontal:12,backgroundColor:'#FFFFFF'},
 saveButtonActive:{backgroundColor:'#FFF0D3',borderColor:'#E7BD75'},
 saveText:{fontSize:11.5,color:'#617779',fontWeight:'900'},
 saveTextActive:{color:'#91601D'},
 empty:{backgroundColor:'#FFF5E6',padding:22,borderRadius:18,gap:8},
 emptyTitle:{fontSize:16,fontWeight:'900',color:C.ink},
 resetButton:{backgroundColor:C.white,padding:10,borderRadius:12,alignSelf:'flex-start'},
 resetText:{color:C.dark,fontSize:12.5,fontWeight:'900'},
 footerNote:{color:'#728485',fontSize:11.5,lineHeight:19,marginTop:12},
 modalScreen:{flex:1,backgroundColor:C.cream},
 modalHeader:{backgroundColor:'#FFF7E9',flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:19,paddingVertical:15,borderBottomWidth:1,borderBottomColor:C.line},
 modalEyebrow:{color:'#9B6B2A',fontSize:10.5,letterSpacing:.6,fontWeight:'900',flex:1},
 modalClose:{backgroundColor:'#FFFFFF',borderRadius:12,paddingHorizontal:12,paddingVertical:10},
 modalCloseText:{fontSize:12.5,color:C.ink,fontWeight:'900'},
 modalContent:{padding:19,paddingBottom:43},
 modalTown:{fontSize:12,fontWeight:'900',color:'#9D6F31',marginBottom:7},
 modalTitle:{fontSize:25,fontWeight:'900',color:C.ink,lineHeight:31,marginBottom:13},
 modalDescription:{color:'#475F60',fontSize:15,lineHeight:23,marginBottom:17},
 factCard:{backgroundColor:C.white,borderRadius:18,padding:16,borderWidth:1,borderColor:C.line,marginBottom:15},
 factLabel:{fontSize:12.5,color:C.ink,fontWeight:'900'},
 factBody:{fontSize:13.5,lineHeight:21,color:'#51686A',marginTop:7},
 factSmall:{color:'#86612C',fontWeight:'800',fontSize:12,marginTop:10},
 factDivider:{height:1,backgroundColor:C.line,marginVertical:15},
 actions:{flexDirection:'row',gap:10},
 outlineAction:{flex:1,minHeight:48,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:C.white,borderWidth:1.5,borderColor:'#B3D6D4'},
 outlineActionText:{color:C.dark,fontWeight:'900',fontSize:12.5},
 primaryAction:{flex:1,minHeight:48,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:C.teal},
 primaryActionText:{color:C.white,fontWeight:'900',fontSize:12.5},
 sourceButton:{backgroundColor:'#FFF0D3',borderWidth:1,borderColor:'#EDD09C',borderRadius:16,padding:15,marginTop:15},
 sourceTitle:{fontWeight:'900',fontSize:13.5,color:C.dark},
 sourceSub:{fontSize:11.5,color:'#7B6C4F',marginTop:6},
 modalFavorite:{alignItems:'center',padding:15,marginTop:12},
 modalFavoriteText:{color:'#95651D',fontSize:13,fontWeight:'900'},
 modalDisclaimer:{fontSize:11.5,lineHeight:18,color:'#748687',marginTop:10}
});
