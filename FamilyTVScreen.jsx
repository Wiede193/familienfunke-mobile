import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {WebView} from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {tvPreferencesKey,emptyTVPreferences,cleanTVPreferences,recordTVSearch,toggleTVValue,tvReason,rankTVVideos,weeklyTVProgram,tvRecommendations,TV_PRIVATE_TOPICS,setTVConsent,loadTVPreferences,persistTVPreferences} from './FamilyTVPreferences';
import {FAMILY_COLORS as C,FAMILY_UI as UI,FAMILY_TYPE as T} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {TV_VIDEOS,TV_BROWSE_CATEGORIES,TV_EXTERNAL_SOURCES,seasonalTVVideos,TV_PRIVACY_URL,tvEmbedSource,tvWatchUrl,allowedTVNavigation,TV_ORIGIN,filterTVVideos,tvQueue} from './FamilyTV';

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
function Player({video,session,onClose,onDisableAutoplay,onBookmark}){
 const web=useRef(null),pending=useRef(null),timer=useRef(null),sequence=useRef(0);
 const [saving,setSaving]=useState(false);
 useEffect(()=>()=>{clearTimeout(timer.current);pending.current=null;},[]);
 function bookmark(){if(!web.current||pending.current)return;const token=String(++sequence.current);pending.current=token;setSaving(true);timer.current=setTimeout(()=>{pending.current=null;setSaving(false);Alert.alert('Position nicht verfügbar','Bitte versuche es nach dem Start des Videos erneut.');},3500);web.current.injectJavaScript('window.ffBookmark && window.ffBookmark('+JSON.stringify(token)+'); true;');}
 function receive({nativeEvent}){try{const m=JSON.parse(nativeEvent.data);if(m.type!=='bookmark'||!pending.current||m.token!==pending.current)return;clearTimeout(timer.current);pending.current=null;setSaving(false);if(m.error||!session.ids.includes(m.id)||!Number.isInteger(m.seconds)||m.seconds<0||m.seconds>43200){Alert.alert('Position nicht verfügbar','Bitte starte ein Video aus unserem Programm und versuche es erneut.');return;}onBookmark({id:m.id,seconds:m.seconds});}catch{/* Ignore malformed external messages. */}}

 const [bounds,setBounds]=useState(null);
 const source=useMemo(()=>tvEmbedSource(video.id,session.autoplay,session.ids,session.startSeconds||0),[video.id,session]);
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
   <WebView ref={web} onMessage={receive} key={video.id+':'+attempt} source={source}
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
  {canEmbed&&!failed&&!saving&&onBookmark?<Action title="Position merken und schließen" onPress={bookmark} secondary/>:null}
  {saving?<Text accessibilityLiveRegion="polite" style={s.meta}>Position wird abgefragt …</Text>:null}
  <Action title="Player schließen" onPress={onClose}/>
 </View>;
}
export default function FamilyTVScreen({visible=true,owner,interests=[],initialShowPrivacy=false}){
 const [category,setCategory]=useState('Alle');
 const [query,setQuery]=useState('');
 const [autoplay,setAutoplay]=useState(false);
 const [selected,setSelected]=useState(null);
 const [prefs,setPrefs]=useState(emptyTVPreferences);
 const [ready,setReady]=useState(false),[storageError,setStorageError]=useState('');
 const [view,setView]=useState('Alle Videos'),[showPrivacy,setShowPrivacy]=useState(initialShowPrivacy);
 const [limit,setLimit]=useState(12),[historyExpanded,setHistoryExpanded]=useState(false),[externalExpanded,setExternalExpanded]=useState(false);
 const latest=useRef(emptyTVPreferences()),writes=useRef(Promise.resolve()),live=useRef(true),consentBusy=useRef(false);
 const [savingConsent,setSavingConsent]=useState(false);
 const scrollRef=useRef(null);
 const key=tvPreferencesKey(owner);
 useEffect(()=>{
  live.current=true;let current=true;
  loadTVPreferences(AsyncStorage,key,TV_VIDEOS).then(data=>{
   if(!current)return;
   latest.current=data;setPrefs(data);setReady(true);
  }).catch(()=>{if(current)setStorageError('Lokale Daten konnten nicht geladen oder gelöscht werden. Personalisierung bleibt in dieser Sitzung aus. Bitte öffne den Bereich erneut.');});
  return()=>{current=false;live.current=false;};
 },[key]);
 function changePrefs(fn){
  if(!ready||consentBusy.current||!latest.current.enabled)return Promise.resolve(false);
  const next=cleanTVPreferences(fn(latest.current),TV_VIDEOS);
  if(JSON.stringify(next)===JSON.stringify(latest.current))return Promise.resolve(true);
  latest.current=next;setPrefs(next);
  const task=persistTVPreferences(AsyncStorage,key,next,TV_VIDEOS);
  writes.current=task;
  return task.then(()=>{if(live.current)setStorageError('');return true;}).catch(()=>{if(live.current)setStorageError('Änderung konnte nicht auf dem Gerät gespeichert werden. Bitte erneut versuchen.');return false;});
 }
 async function changeConsent(on){
  if(consentBusy.current||(!ready&&on))return;
  consentBusy.current=true;setSavingConsent(true);
  const next=setTVConsent(latest.current,on);
  if(!on){latest.current=next;setPrefs(next);setView('Alle Videos');setSelected(null);setQuery('');}
  try{
   await persistTVPreferences(AsyncStorage,key,next,TV_VIDEOS);
   if(live.current){latest.current=next;setPrefs(next);setReady(true);setStorageError('');}
  }catch{if(live.current){latest.current=emptyTVPreferences();setPrefs(latest.current);setStorageError('Speicherung oder Löschung nicht bestätigt. Personalisierung bleibt aus. Bitte Löschung erneut versuchen.');}}
  finally{consentBusy.current=false;if(live.current)setSavingConsent(false);}
 }
 const filtered=useMemo(()=>filterTVVideos(category,query),[category,query]);
 const videos=useMemo(()=>rankTVVideos(filtered.filter(v=>view==='Merkliste'?prefs.favorites.includes(v.id):view==='Lieblingskanäle'?prefs.channels.includes(v.channel):true),interests,prefs.personalized),[filtered,view,prefs,interests]);
 const programme=useMemo(()=>weeklyTVProgram(TV_VIDEOS),[]);
 const seasonal=useMemo(()=>seasonalTVVideos(),[]);
 const external=useMemo(()=>filterTVVideos(category,query,TV_EXTERNAL_SOURCES),[category,query]);
 useEffect(()=>{setLimit(12);},[category,query,view]);
 const recommendations=useMemo(()=>tvRecommendations(TV_VIDEOS,prefs,interests),[prefs,interests]);
 const suggested= recommendations.map(row=>row.video);
 const recommendationMap=new Map(recommendations.map(row=>[row.video.id,row]));
 const anyRecommendation=prefs.enabled;
 const resume=prefs.resume&&TV_VIDEOS.find(v=>v.id===prefs.resume.id);
 useEffect(()=>{
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')setSelected(null);});
  return ()=>sub.remove();
 },[]);
 useEffect(()=>{if(!visible)setSelected(null);},[visible]);
 const activate=(video,list=videos,startSeconds=0,auto=autoplay)=>Alert.alert('YouTube laden?','Beim Laden erhält Google unter anderem Video-ID, IP-Adresse und Geräteinformationen; bei einem Programm auch die IDs der gewählten Wiedergabeliste, beim Fortsetzen die Startposition. Das ist unabhängig von deiner lokalen Personalisierung. YouTube kann Werbung anzeigen. Videos für Kinder bitte gemeinsam ansehen.',[{text:'Abbrechen',style:'cancel'},{text:'YouTube laden',onPress:()=>{if(live.current&&visible)setSelected({id:video.id,autoplay:auto,ids:tvQueue(list,video.id,auto),startSeconds});}}]);
 const current=selected&&TV_VIDEOS.find(v=>v.id===selected.id);
 if(visible&&current)return <Player key={current.id} video={current} session={selected} onClose={()=>setSelected(null)} onDisableAutoplay={()=>{setAutoplay(false);setSelected(null);}} onBookmark={ready&&prefs.enabled?async mark=>{if(await changePrefs(p=>({...p,resume:mark})))setSelected(null);else Alert.alert('Nicht gespeichert','Die Wiedergabeposition konnte nicht gespeichert werden.');}:undefined}/>;
 return <ScrollView ref={scrollRef} style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <View style={s.hero}>
   <View style={s.heroIcon}><FamilyIcon name="video" size={30}/></View>
   <Text accessibilityRole="header" style={s.title}>Familienfunke TV</Text>
   <Text style={s.copy}>Kochen, Bewegung, Familienwissen und gemeinsame Zeit. Für Eltern und gemeinsam mit Kindern.</Text>
  </View>
  {storageError?<Text accessibilityLiveRegion="polite" style={s.copy}>{storageError}</Text>:null}
  <Pressable accessibilityRole="button" accessibilityState={{expanded:showPrivacy}} onPress={()=>setShowPrivacy(v=>!v)} style={s.privacy}><Text style={s.cardTitle}>Deine Daten & Einstellungen {showPrivacy?'−':'+'}</Text><Text style={s.meta}>Personalisierung {prefs.enabled?'an':'aus'} · nur auf diesem Gerät</Text></Pressable>
  {showPrivacy?<View style={s.privacy}>
   <Text style={s.cardTitle}>Du entscheidest, wann YouTube geladen wird.</Text>
   <Text style={s.copy}>Erst wenn du ein Video oder das Programm startest, verbindet sich der Player mit Google/YouTube. Dabei können z. B. IP-Adresse, Geräteinformationen und weitere Nutzungsdaten verarbeitet werden. Der datenschutzfreundlichere Modus ist keine Garantie für Datenfreiheit. YouTube kann Werbung und weitere Videos anzeigen.</Text>
   <Pressable accessibilityRole="link" onPress={()=>Alert.alert('Google-Datenschutz öffnen?','Du öffnest eine externe Website.',[{text:'Abbrechen',style:'cancel'},{text:'Öffnen',onPress:()=>openExternal(TV_PRIVACY_URL)}])} style={s.link}><Text style={s.linkText}>Datenschutz von Google ↗</Text></Pressable>
   <View style={s.autoRow}><View style={{flex:1}}><Text style={s.cardTitle}>Persönliche TV-Funktionen</Text><Text style={s.meta}>Aus: kein gespeicherter TV-Suchverlauf und keine persönlichen Empfehlungen. An: lokale Merkliste, Lieblingskanäle, Wiedergabeposition und Empfehlungen aus Profilhobbys, Suchverlauf und gemerkten Videos.</Text></View><Switch disabled={!ready||savingConsent} accessibilityLabel="Persönliche TV-Funktionen" value={prefs.enabled} onValueChange={v=>v?changeConsent(true):Alert.alert('Persönliche TV-Daten löschen?','Der lokale Suchverlauf, Favoriten, Kanäle, Themen und gemerkte Positionen werden gelöscht.',[{text:'Abbrechen',style:'cancel'},{text:'Ausschalten und löschen',style:'destructive',onPress:()=>changeConsent(false)}])}/></View>
   <Text style={s.copy}>Standardmäßig aus. Höchstens 100 abgeschickte Suchen, bis zu 180 Tage; ältere Einträge werden beim nächsten Öffnen bereinigt. Kein zusätzliches Empfehlungsprofil, keine Werbeauswertung durch Familienfunke. Kein Upload an unsere Server. Lokaler Speicher ist nicht zusätzlich durch uns verschlüsselt; Gerätebackups können ihn enthalten. Andere App-Funktionen und YouTube haben eigene Datenverarbeitung.</Text>
   <Text style={s.meta}>Die neue Einstellung erfordert eine neue Zustimmung. Alte, getrennte TV-Einstellungen werden nicht automatisch übernommen. Bitte keine persönlichen Angaben, Diagnosen oder Daten von Kindern eingeben.</Text>
   {prefs.enabled?<><Text style={s.cardTitle}>Meine privaten Themen</Text><Text style={s.meta}>Wähle freiwillig Themen, über die du mehr erfahren möchtest. Wir fragen nicht, ob du oder jemand aus deiner Familie eine Behinderung hat oder schwanger ist. Diese Auswahl erscheint nicht im öffentlichen Familienprofil. Empfehlungen zu Inklusion oder Schwangerschaft nur nach ausdrücklicher Themenwahl.</Text>
   <View style={s.chips}>{TV_PRIVATE_TOPICS.map(topic=><Pressable key={topic} accessibilityRole="button" accessibilityState={{selected:prefs.topics.includes(topic)}} onPress={()=>changePrefs(p=>({...p,topics:toggleTVValue(p.topics,topic)}))} style={[s.chip,prefs.topics.includes(topic)&&s.selected]}><Text style={[s.chipText,prefs.topics.includes(topic)&&{color:C.white}]}>{topic}</Text></Pressable>)}</View></>:null}
   <Action title="Alle lokalen TV-Daten löschen" secondary onPress={()=>Alert.alert('Lokale TV-Daten löschen?','Alle persönlichen TV-Funktionen werden ausgeschaltet und gespeicherte Daten gelöscht.',[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>changeConsent(false)}])}/>
  </View>:null}
  <Text style={s.meta}>YouTube wird erst nach deinem Start geladen und verarbeitet dann eigene Daten. Details unter „Deine Daten & Einstellungen“.</Text>
  <View style={s.privacy}>
   <View style={s.autoRow}><View style={{flex:1}}><Text style={s.cardTitle}>Autoplay</Text><Text style={s.meta}>Nach dem Start weitere Videos aus deiner aktuellen Auswahl abspielen.</Text></View><Switch accessibilityLabel="Autoplay" value={autoplay} onValueChange={setAutoplay} trackColor={{true:C.accent}}/></View>
   <Text style={s.meta}>Standardmäßig aus. Keine Wiedergabe beim Öffnen von Familienfunke TV. Du kannst jederzeit stoppen.</Text>
  </View>
  <TextInput accessibilityLabel="Videos suchen" placeholder="Thema, Titel oder Anbieter suchen" placeholderTextColor={C.muted} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" onSubmitEditing={()=>changePrefs(p=>recordTVSearch(p,query))} autoCorrect={false} style={s.search}/>
  <Action title="Suchen" secondary onPress={()=>changePrefs(p=>recordTVSearch(p,query))}/>
  <View style={s.chips}>
   {TV_BROWSE_CATEGORIES.map(c=><Pressable key={c} accessibilityRole="button" accessibilityState={{selected:c===category}} onPress={()=>{if(c!==category){setSelected(null);setCategory(c);}}}
     style={[s.chip,c===category&&s.selected]}><Text style={[s.chipText,c===category&&{color:C.white}]}>{c}</Text></Pressable>)}
  </View>

  {resume?<View style={s.card}><Text style={s.cardTitle}>Weiterschauen</Text><Text style={s.copy}>{resume.title} · {Math.floor(prefs.resume.seconds/60)}:{String(prefs.resume.seconds%60).padStart(2,"0")}</Text><Action title="An gemerkter Position fortsetzen" onPress={()=>activate(resume,[resume],prefs.resume.seconds,false)}/><Action title="Position löschen" secondary onPress={()=>changePrefs(p=>({...p,resume:null}))}/></View>:null}
  {anyRecommendation&&!query.trim()&&category==='Alle'?<View style={s.card}>
    <Text accessibilityRole="header" style={s.cardTitle}>Für dich empfohlen</Text>
    <Text style={s.meta}>Aus deiner freiwilligen Auswahl. Nur unser redaktioneller Katalog, keine bezahlten Empfehlungen.</Text>
    {recommendations.length?recommendations.slice(0,5).map(row=><View key={row.video.id} style={s.recommendation}>
      <Text style={s.cardTitle}>{row.video.title}</Text><Text style={s.meta}>{row.video.channel} · {row.video.category}</Text>
      <Text style={s.meta}>{row.reasons.join(' · ')}</Text>
      <Action title={autoplay?'Empfohlenes Programm ab hier starten':'Empfohlenes Video laden'} onPress={()=>activate(row.video,suggested)}/>
    </View>):<Text style={s.copy}>Noch keine weiteren passenden Videos im Katalog. Du kannst weiterhin alle Videos durchsuchen.</Text>}
    <Action title="Empfehlungen einstellen" secondary onPress={()=>{setShowPrivacy(true);scrollRef.current?.scrollTo({y:0,animated:true});}}/>
  </View>:null}
  {seasonal.length&&!query.trim()&&category==='Alle'?<View style={s.card}><Text style={s.cardTitle}>Advent & Weihnachten</Text><Text style={s.copy}>Backideen für die gemütliche Zeit im Jahr.</Text><Action title="Weihnachtsvideos entdecken" onPress={()=>{setCategory('Freizeit & Jahreszeiten');setView('Alle Videos');setQuery('Weihnachten');}}/></View>:null}
  {programme.length&&!query.trim()&&category==='Alle'?<View style={s.card}><Text style={s.cardTitle}>Unser Wochenprogramm</Text><Text style={s.copy}>{programme[0].title}</Text><Text style={s.meta}>Wöchentlich wechselnde Reihenfolge aus unserer redaktionellen Auswahl.</Text><Action title="Wochenprogramm starten" onPress={()=>activate(programme[0],programme,0,autoplay)}/></View>:null}
  {prefs.enabled&&prefs.history.length>0?<View style={s.card}><Text style={s.cardTitle}>Letzte Suchen</Text>{prefs.history.slice(0,historyExpanded?100:5).map(h=><View key={h.query} style={s.autoRow}><Pressable accessibilityRole="button" style={{flex:1,minHeight:48,justifyContent:"center"}} onPress={()=>{setQuery(h.query);changePrefs(p=>recordTVSearch(p,h.query));}}><Text style={s.copy}>{h.query}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={"Suche löschen: "+h.query} onPress={()=>changePrefs(p=>({...p,history:p.history.filter(x=>x.query!==h.query)}))} style={s.chip}><Text style={s.chipText}>×</Text></Pressable></View>)}{prefs.history.length>5?<Action title={historyExpanded?"Weniger Suchen anzeigen":"Alle letzten Suchen anzeigen"} secondary onPress={()=>setHistoryExpanded(v=>!v)}/>:null}<Action title="Suchverlauf löschen" secondary onPress={()=>changePrefs(p=>({...p,history:[]}))}/></View>:null}
  <View style={s.chips}>{(prefs.enabled?["Alle Videos","Merkliste","Lieblingskanäle"]:["Alle Videos"]).map(v=><Pressable key={v} accessibilityRole="button" accessibilityState={{selected:view===v}} onPress={()=>setView(v)} style={[s.chip,view===v&&s.selected]}><Text style={[s.chipText,view===v&&{color:C.white}]}>{v}</Text></Pressable>)}</View>
  <Text style={s.meta}>{videos.length} {videos.length===1?'Video':'Videos'} in deiner Auswahl</Text>
  {autoplay&&videos.length>0?<Action title="Programm starten" onPress={()=>activate(videos[0])}/>:null}
  {!videos.length?<Text style={s.copy}>Keine passenden Videos. Wähle ein anderes Thema oder ändere deine Suche.</Text>:null}
  {videos.slice(0,limit).map(video=><View key={video.id} style={s.card}>
    <View style={s.cardHead}><View style={s.thumb}><FamilyIcon name="video" size={28}/></View><View style={{flex:1,minWidth:0}}><Text style={s.meta}>{video.category}</Text><Text style={s.cardTitle}>{video.title}</Text><Text style={s.meta}>Quelle: {video.channel} · YouTube</Text></View></View>
    <Text style={s.copy}>{video.description}</Text>
    {video.flag==='commercial'?<Text style={s.meta}>Anbieterinhalt mit möglichen Produkt- oder Eigenwerbehinweisen. Keine bezahlte Platzierung durch Familienfunke.</Text>:null}
    {video.flag==='health'||video.category==='Schwangerschaft & Baby'?<Text style={s.meta}>Allgemeine Information, keine individuelle medizinische Beratung. Übungen in der Schwangerschaft vorher mit Hebamme oder ärztlichem Team abklären.</Text>:null}
    {recommendationMap.has(video.id)?<Text style={s.meta}>{recommendationMap.get(video.id).reasons.join(' · ')}</Text>:tvReason(video,interests,prefs.personalized)?<Text style={s.meta}>Passt zu deinem Interesse: {tvReason(video,interests,true)}</Text>:null}
    {ready&&prefs.enabled?<View style={s.chips}><Pressable accessibilityRole="button" accessibilityState={{selected:prefs.favorites.includes(video.id)}} style={s.chip} onPress={()=>changePrefs(p=>({...p,favorites:toggleTVValue(p.favorites,video.id)}))}><Text style={s.chipText}>{prefs.favorites.includes(video.id)?"♥ Gemerkt":"♡ Merken"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{selected:prefs.channels.includes(video.channel)}} style={s.chip} onPress={()=>changePrefs(p=>({...p,channels:toggleTVValue(p.channels,video.channel)}))}><Text style={s.chipText}>{prefs.channels.includes(video.channel)?"Kanal gemerkt":"Kanal merken"}</Text></Pressable></View>:null}
    <Action title={autoplay?"Programm ab hier starten":"YouTube-Player laden"} onPress={()=>activate(video)}/>
   </View>)}
  {videos.length>limit?<Action title="Weitere Videos anzeigen" secondary onPress={()=>setLimit(n=>n+12)}/>:null}
  {external.length&&view==='Alle Videos'?<View style={s.card}><Pressable accessibilityRole="button" accessibilityState={{expanded:externalExpanded}} onPress={()=>setExternalExpanded(v=>!v)}><Text style={s.cardTitle}>Weitere Videoangebote ({external.length}) {externalExpanded?'−':'+'}</Text><Text style={s.meta}>Original-Mediatheken und Sammlungen, nicht eingebettet.</Text></Pressable>{externalExpanded?external.map(item=><View key={item.url} style={s.recommendation}><Text style={s.cardTitle}>{item.title}</Text><Text style={s.meta}>{item.channel}</Text><Text style={s.copy}>{item.description}</Text><Action title="Originalangebot öffnen" secondary onPress={()=>Alert.alert('Externe Website öffnen?','Du verlässt Familienfunke. Der externe Anbieter verarbeitet eigene Daten.',[{text:'Abbrechen',style:'cancel'},{text:'Öffnen',onPress:()=>openExternal(item.url)}])}/></View>):null}</View>:null}
  <Text style={s.meta}>Pilotangebot für Eltern. Die Videos stammen von den genannten externen Anbietern. Es besteht keine behauptete Kooperation. Empfehlungen im YouTube-Player liegen außerhalb unserer redaktionellen Auswahl.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({
 recommendation:{borderTopWidth:1,borderTopColor:C.line,paddingTop:12,gap:6},
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
