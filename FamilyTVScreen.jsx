import React,{useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {FAMILY_COLORS as C,FAMILY_UI as UI,FAMILY_TYPE as T} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {TV_VIDEOS,TV_CATEGORIES,TV_PRIVACY_URL,tvEmbedSource,tvWatchUrl,allowedTVNavigation,TV_ORIGIN,filterTVVideos,tvQueue} from './FamilyTV';

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
function Player({video,session,onClose,onDisableAutoplay}){
 const [bounds,setBounds]=useState(null);
 const source=useMemo(()=>tvEmbedSource(video.id,session.autoplay,session.ids),[video.id,session]);
 const width=bounds?.width||0,height=bounds?.height||0;
 const [failed,setFailed]=useState(false),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 const playerWidth=width;
 // Measured fixed viewport, not inside the scrolling programme list. Do not mount while it cannot fit.
 const canEmbed=playerWidth>=200&&height>=200;
 const playerHeight=canEmbed?Math.min(height,Math.max(200,Math.round(playerWidth*9/16))):0;
 return <View style={s.watchScreen}>
  <View style={s.watchHeader}><Text accessibilityRole="header" style={s.cardTitle}>{session.autoplay?'Dein TV-Programm':video.title}</Text><Text style={s.meta}>{session.autoplay?session.ids.length+' ausgewählte Videos · YouTube':'Quelle: '+video.channel+' · YouTube'}</Text></View>
  <View style={s.playerArea} onLayout={({nativeEvent:{layout}})=>setBounds({width:layout.width,height:layout.height})}>
  {canEmbed&&!failed?<View style={{height:playerHeight,backgroundColor:'#000'}}>
   <WebView key={video.id+':'+attempt} source={source}
    accessibilityLabel="YouTube-Videoplayer" originWhitelist={['*']}
    javaScriptEnabled domStorageEnabled allowsFullscreenVideo allowsInlineMediaPlayback
    mediaPlaybackRequiresUserAction={!session.autoplay} mixedContentMode="never" sharedCookiesEnabled={false}
    allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
    onShouldStartLoadWithRequest={request=>allowedTVNavigation(request.url)}
    onOpenWindow={({nativeEvent})=>confirmExternal(nativeEvent.targetUrl||'')}
    onLoadEnd={()=>setLoading(false)}
    onError={()=>{setLoading(false);setFailed(true);}}
    onHttpError={({nativeEvent})=>{if(nativeEvent.url===source.baseUrl){setLoading(false);setFailed(true);}}}
    onRenderProcessGone={()=>{setLoading(false);setFailed(true);}}
    onContentProcessDidTerminate={()=>{setLoading(false);setFailed(true);}}
    style={{flex:1,backgroundColor:'#000'}}/>
  </View>:bounds?<Text accessibilityLiveRegion="polite" style={s.copy}>{canEmbed?'Der Player konnte nicht geladen werden.':'Der Bildschirm ist für den eingebetteten Player zu klein.'} Du kannst das Video direkt bei YouTube öffnen.</Text>:null}
  </View>
  <ScrollView style={s.watchDetails} contentContainerStyle={{gap:8,paddingBottom:8}}>
  {loading&&canEmbed&&!failed?<View style={s.loading}><ActivityIndicator color={C.accentDark}/><Text style={s.meta}>Player wird geladen …</Text></View>:null}
  {failed&&canEmbed?<Action title="Player erneut laden" onPress={()=>{setLoading(true);setFailed(false);setAttempt(v=>v+1);}} secondary/>:null}
  <Text style={s.meta}>Falls die automatische Wiedergabe blockiert ist, tippe im Player auf Wiedergabe. Bei gesperrter Einbettung öffne den Originallink.</Text>
  {session.autoplay?<><Text style={s.cardTitle}>Deine Wiedergabeliste</Text>{session.ids.map((id,i)=>{const item=TV_VIDEOS.find(v=>v.id===id);return <Text key={id} style={s.meta}>{i+1}. {item?.title} · {item?.channel}</Text>;})}<Action title="Autoplay ausschalten und Player schließen" onPress={onDisableAutoplay} secondary/></>:null}
  <Action title="Auf YouTube ansehen" onPress={()=>confirmExternal(tvWatchUrl(video.id))} secondary/>
  </ScrollView>
  <Action title="Player schließen" onPress={onClose}/>
 </View>;
}
export default function FamilyTVScreen({visible=true}){
 const [category,setCategory]=useState('Alle');
 const [query,setQuery]=useState('');
 const [autoplay,setAutoplay]=useState(false);
 const [selected,setSelected]=useState(null);
 const videos=useMemo(()=>filterTVVideos(category,query),[category,query]);
 useEffect(()=>{
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')setSelected(null);});
  return ()=>sub.remove();
 },[]);
 useEffect(()=>{if(!visible)setSelected(null);},[visible]);
 const activate=video=>setSelected({id:video.id,autoplay,ids:tvQueue(videos,video.id,autoplay)});
 const current=selected&&TV_VIDEOS.find(v=>v.id===selected.id);
 if(visible&&current)return <Player key={current.id} video={current} session={selected} onClose={()=>setSelected(null)} onDisableAutoplay={()=>{setAutoplay(false);setSelected(null);}}/>;
 return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <View style={s.hero}>
   <View style={s.heroIcon}><FamilyIcon name="video" size={30}/></View>
   <Text accessibilityRole="header" style={s.title}>Familienfunke TV</Text>
   <Text style={s.copy}>Eine kleine Auswahl an Videos für Eltern. Entdecke Anregungen für euren Familienalltag.</Text>
  </View>
  <View style={s.privacy}>
   <Text style={s.cardTitle}>Du entscheidest, wann YouTube geladen wird.</Text>
   <Text style={s.copy}>Erst wenn du ein Video oder das Programm startest, verbindet sich der Player mit Google/YouTube. Dabei können z. B. IP-Adresse, Geräteinformationen und weitere Nutzungsdaten verarbeitet werden. Der datenschutzfreundlichere Modus ist keine Garantie für Datenfreiheit. YouTube kann Werbung und weitere Videos anzeigen.</Text>
   <Pressable accessibilityRole="link" onPress={()=>Alert.alert('Google-Datenschutz öffnen?','Du öffnest eine externe Website.',[{text:'Abbrechen',style:'cancel'},{text:'Öffnen',onPress:()=>openExternal(TV_PRIVACY_URL)}])} style={s.link}><Text style={s.linkText}>Datenschutz von Google ↗</Text></Pressable>
  </View>
  <View style={s.privacy}>
   <View style={s.autoRow}><View style={{flex:1}}><Text style={s.cardTitle}>Autoplay</Text><Text style={s.meta}>Nach dem Start weitere Videos aus deiner aktuellen Auswahl abspielen.</Text></View><Switch accessibilityLabel="Autoplay" value={autoplay} onValueChange={setAutoplay} trackColor={{true:C.accent}}/></View>
   <Text style={s.meta}>Standardmäßig aus. Keine Wiedergabe beim Öffnen von Familienfunke TV. Du kannst jederzeit stoppen.</Text>
  </View>
  <TextInput accessibilityLabel="Videos suchen" placeholder="Thema, Titel oder Anbieter suchen" placeholderTextColor={C.muted} value={query} onChangeText={setQuery} autoCorrect={false} style={s.search}/>
  <View style={s.chips}>
   {TV_CATEGORIES.map(c=><Pressable key={c} accessibilityRole="button" accessibilityState={{selected:c===category}} onPress={()=>{if(c!==category){setSelected(null);setCategory(c);}}}
     style={[s.chip,c===category&&s.selected]}><Text style={[s.chipText,c===category&&{color:C.white}]}>{c}</Text></Pressable>)}
  </View>
  <Text style={s.meta}>{videos.length} {videos.length===1?'Video':'Videos'} in deiner Auswahl</Text>
  {autoplay&&videos.length>0?<Action title="Programm starten" onPress={()=>activate(videos[0])}/>:null}
  {!videos.length?<Text style={s.copy}>Keine passenden Videos. Wähle ein anderes Thema oder ändere deine Suche.</Text>:null}
  {videos.map(video=><View key={video.id} style={s.card}>
    <View style={s.cardHead}><View style={s.thumb}><FamilyIcon name="video" size={28}/></View><View style={{flex:1,minWidth:0}}><Text style={s.meta}>{video.category}</Text><Text style={s.cardTitle}>{video.title}</Text><Text style={s.meta}>Quelle: {video.channel} · YouTube</Text></View></View>
    <Text style={s.copy}>{video.description}</Text>
    <Action title={autoplay?"Programm ab hier starten":"YouTube-Player laden"} onPress={()=>activate(video)}/>
   </View>)}
  <Text style={s.meta}>Pilotangebot für Eltern. Die Videos stammen von den genannten externen Anbietern. Es besteht keine behauptete Kooperation. Empfehlungen im YouTube-Player liegen außerhalb unserer redaktionellen Auswahl.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({
 watchScreen:{flex:1,backgroundColor:C.bg,padding:12,gap:8},watchHeader:{gap:4},playerArea:{flex:3,minHeight:0,justifyContent:'flex-start'},watchDetails:{flex:2,minHeight:0},autoRow:{flexDirection:'row',alignItems:'center',gap:12},search:{...UI.field,paddingHorizontal:14,color:C.ink,fontSize:T.body},
 screen:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:30,gap:14},
 hero:{...UI.card,padding:18,backgroundColor:C.sunPale,gap:8},heroIcon:{width:52,height:52,borderRadius:16,backgroundColor:C.white,alignItems:'center',justifyContent:'center'},
 title:{fontSize:T.display,fontWeight:'800',color:C.ink},copy:{fontSize:T.body,lineHeight:22,color:C.muted},
 privacy:{...UI.card,padding:14,gap:8},link:{minHeight:48,justifyContent:'center'},linkText:{color:C.accentDark,fontWeight:'800',fontSize:T.small},
 chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:48,borderRadius:24,paddingHorizontal:14,backgroundColor:C.white,borderWidth:1,borderColor:C.line,justifyContent:'center'},
 selected:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipText:{color:C.ink,fontWeight:'700',fontSize:T.small},
 card:{...UI.card,padding:14,gap:12},playerCard:{...UI.card,padding:4,gap:12},cardHead:{flexDirection:'row',alignItems:'center',gap:12},thumb:{width:64,height:64,borderRadius:16,backgroundColor:C.mint,justifyContent:'center',alignItems:'center'},
 cardTitle:{color:C.ink,fontSize:T.card,fontWeight:'800',lineHeight:23},meta:{color:C.muted,fontSize:T.meta,lineHeight:19},button:{paddingHorizontal:12,paddingVertical:10},buttonText:{fontSize:T.body,fontWeight:'800',color:C.white,textAlign:'center'},loading:{flexDirection:'row',gap:8,alignItems:'center'}
});
