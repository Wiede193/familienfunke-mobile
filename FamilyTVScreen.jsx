import React,{useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {WebView} from 'react-native-webview';
import {FAMILY_COLORS as C,FAMILY_UI as UI,FAMILY_TYPE as T} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {TV_VIDEOS,TV_CATEGORIES,TV_PRIVACY_URL,tvEmbedSource,tvWatchUrl,allowedTVNavigation,TV_ORIGIN} from './FamilyTV';

function Action({title,onPress,secondary=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
  style={({pressed})=>[secondary?UI.secondary:UI.primary,s.button,pressed&&{opacity:.75}]}>
   <Text style={[s.buttonText,secondary&&{color:C.accentDark}]}>{title}</Text>
 </Pressable>;
}
function openExternal(url){
 Linking.openURL(url).catch(()=>Alert.alert('Link konnte nicht geöffnet werden','Bitte versuche es später erneut.'));
}
function confirmExternal(url){
 if(!allowedTVNavigation(url)||!url.startsWith('https://')||url.startsWith(TV_ORIGIN))return;
 Alert.alert('YouTube öffnen?','Du verlässt Familienfunke. Es gelten die Datenschutzregeln von YouTube.',[
  {text:'Abbrechen',style:'cancel'},{text:'YouTube öffnen',onPress:()=>openExternal(url)}
 ]);
}
function Player({video,onClose}){
 const {width}=useWindowDimensions();
 const source=useMemo(()=>tvEmbedSource(video.id),[video.id]);
 const [failed,setFailed]=useState(false),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 const playerWidth=width-40;
 // Keep the YouTube viewport at least 200 × 200; use external fallback on tiny displays.
 const canEmbed=playerWidth>=200;
 return <View style={s.playerCard}>
  <Text accessibilityRole="header" style={s.cardTitle}>{video.title}</Text>
  <Text style={s.meta}>Quelle: {video.channel} · YouTube</Text>
  {canEmbed&&!failed?<View style={{height:Math.max(200,Math.round(playerWidth*9/16)),backgroundColor:'#000',borderRadius:12,overflow:'hidden'}}>
   <WebView key={video.id+':'+attempt} source={source}
    accessibilityLabel="YouTube-Videoplayer" originWhitelist={['*']}
    javaScriptEnabled domStorageEnabled allowsFullscreenVideo allowsInlineMediaPlayback
    mediaPlaybackRequiresUserAction mixedContentMode="never" sharedCookiesEnabled={false}
    allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
    onShouldStartLoadWithRequest={request=>allowedTVNavigation(request.url)}
    onOpenWindow={({nativeEvent})=>confirmExternal(nativeEvent.targetUrl||'')}
    onLoadEnd={()=>setLoading(false)}
    onError={()=>{setLoading(false);setFailed(true);}}
    onHttpError={({nativeEvent})=>{if(nativeEvent.url===source.baseUrl){setLoading(false);setFailed(true);}}}
    onRenderProcessGone={()=>{setLoading(false);setFailed(true);}}
    onContentProcessDidTerminate={()=>{setLoading(false);setFailed(true);}}
    style={{flex:1,backgroundColor:'#000'}}/>
  </View>:<Text accessibilityLiveRegion="polite" style={s.copy}>{canEmbed?'Der Player konnte nicht geladen werden.':'Der Bildschirm ist für den eingebetteten Player zu klein.'} Du kannst das Video direkt bei YouTube öffnen.</Text>}
  {loading&&canEmbed&&!failed?<View style={s.loading}><ActivityIndicator color={C.accentDark}/><Text style={s.meta}>Player wird geladen …</Text></View>:null}
  {failed&&canEmbed?<Action title="Player erneut laden" onPress={()=>{setLoading(true);setFailed(false);setAttempt(v=>v+1);}} secondary/>:null}
  <Text style={s.meta}>Falls YouTube die Wiedergabe in der App sperrt, nutze den Originallink.</Text>
  <Action title="Auf YouTube ansehen" onPress={()=>confirmExternal(tvWatchUrl(video.id))} secondary/>
  <Action title="Player schließen" onPress={onClose}/>
 </View>;
}
export default function FamilyTVScreen(){
 const [category,setCategory]=useState('Alle');
 const [selected,setSelected]=useState(null);
 const videos=TV_VIDEOS.filter(v=>category==='Alle'||v.category===category);
 useEffect(()=>{
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')setSelected(null);});
  return ()=>sub.remove();
 },[]);
 const activate=video=>setSelected(video.id);
 return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <View style={s.hero}>
   <View style={s.heroIcon}><FamilyIcon name="video" size={30}/></View>
   <Text accessibilityRole="header" style={s.title}>Familienfunke TV</Text>
   <Text style={s.copy}>Eine kleine Auswahl an Videos für Eltern. Entdecke Anregungen für euren Familienalltag.</Text>
  </View>
  <View style={s.privacy}>
   <Text style={s.cardTitle}>Du entscheidest, wann YouTube geladen wird.</Text>
   <Text style={s.copy}>Erst wenn du „YouTube-Player laden“ antippst, verbindet sich der Player mit Google/YouTube. Dabei können z. B. IP-Adresse, Geräteinformationen und weitere Nutzungsdaten verarbeitet werden. Der datenschutzfreundlichere Modus ist keine Garantie für Datenfreiheit. YouTube kann Werbung und weitere Videos anzeigen.</Text>
   <Pressable accessibilityRole="link" onPress={()=>Alert.alert('Google-Datenschutz öffnen?','Du öffnest eine externe Website.',[{text:'Abbrechen',style:'cancel'},{text:'Öffnen',onPress:()=>openExternal(TV_PRIVACY_URL)}])} style={s.link}><Text style={s.linkText}>Datenschutz von Google ↗</Text></Pressable>
  </View>
  <View style={s.chips}>
   {TV_CATEGORIES.map(c=><Pressable key={c} accessibilityRole="button" accessibilityState={{selected:c===category}} onPress={()=>{if(c!==category){setSelected(null);setCategory(c);}}}
     style={[s.chip,c===category&&s.selected]}><Text style={[s.chipText,c===category&&{color:C.white}]}>{c}</Text></Pressable>)}
  </View>
  {videos.map(video=>selected===video.id?<Player key={video.id} video={video} onClose={()=>setSelected(null)}/>:<View key={video.id} style={s.card}>
    <View style={s.cardHead}><View style={s.thumb}><FamilyIcon name="video" size={28}/></View><View style={{flex:1,minWidth:0}}><Text style={s.meta}>{video.category}</Text><Text style={s.cardTitle}>{video.title}</Text><Text style={s.meta}>Quelle: {video.channel} · YouTube</Text></View></View>
    <Text style={s.copy}>{video.description}</Text>
    <Action title="YouTube-Player laden" onPress={()=>activate(video)}/>
   </View>)}
  <Text style={s.meta}>Pilotangebot für Eltern. Die Videos stammen von den genannten externen Anbietern. Es besteht keine behauptete Kooperation. Empfehlungen im YouTube-Player liegen außerhalb unserer redaktionellen Auswahl.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:30,gap:14},
 hero:{...UI.card,padding:18,backgroundColor:C.sunPale,gap:8},heroIcon:{width:52,height:52,borderRadius:16,backgroundColor:C.white,alignItems:'center',justifyContent:'center'},
 title:{fontSize:T.display,fontWeight:'800',color:C.ink},copy:{fontSize:T.body,lineHeight:22,color:C.muted},
 privacy:{...UI.card,padding:14,gap:8},link:{minHeight:48,justifyContent:'center'},linkText:{color:C.accentDark,fontWeight:'800',fontSize:T.small},
 chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:48,borderRadius:24,paddingHorizontal:14,backgroundColor:C.white,borderWidth:1,borderColor:C.line,justifyContent:'center'},
 selected:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipText:{color:C.ink,fontWeight:'700',fontSize:T.small},
 card:{...UI.card,padding:14,gap:12},playerCard:{...UI.card,padding:4,gap:12},cardHead:{flexDirection:'row',alignItems:'center',gap:12},thumb:{width:64,height:64,borderRadius:16,backgroundColor:C.mint,justifyContent:'center',alignItems:'center'},
 cardTitle:{color:C.ink,fontSize:T.card,fontWeight:'800',lineHeight:23},meta:{color:C.muted,fontSize:T.meta,lineHeight:19},button:{paddingHorizontal:12,paddingVertical:10},buttonText:{fontSize:T.body,fontWeight:'800',color:C.white,textAlign:'center'},loading:{flexDirection:'row',gap:8,alignItems:'center'}
});
