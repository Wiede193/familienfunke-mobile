import React,{useEffect,useRef,useState} from 'react';
import {Pressable,StyleSheet,Switch,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {DEFAULT_HOME_PREFS,AGE_OPTIONS,sanitizeHomePrefs,recommendHome} from './HomePersonalization';
import {CURATED_FAMILY_PLACES} from './FamilyMapCurated';
import {NATIONAL_FAMILY_PLACES} from './FamilyMapNational';
import {ORIGINS,distanceKm} from './FamilyOutingPlan';
import {IDEAS} from './FamilyPlayContent';

const places=[...CURATED_FAMILY_PLACES.map(p=>({...p,source:'curated'})),...NATIONAL_FAMILY_PLACES.map(p=>({...p,source:'national'}))];
const quizLabels={little:'Quiz für 4–6 Jahre',school:'Quiz für 7–10 Jahre',family:'Quiz ab 11 Jahren'};
const price=x=>x.trade_type==='gift'?'Zu verschenken':x.trade_type==='swap'?'Tausch':Number.isFinite(x.price_cents)?(x.price_cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'}):'Preis im Angebot';
function LinkRow({title,detail,onPress}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title+' öffnen'} onPress={onPress} style={s.row}>
  <View style={{flex:1,minWidth:0}}><Text style={s.name}>{title}</Text>{detail?<Text style={s.muted}>{detail}</Text>:null}</View><Text accessibilityElementsHidden importantForAccessibility="no" style={s.arrow}>›</Text>
 </Pressable>;
}
function Group({title,children}){
 return <View style={s.group}><Text accessibilityRole="header" style={s.heading}>{title}</Text>{children}</View>;
}
export default function PersonalizedHome({userId,profile,active,events,partnerEvents,listings,onNavigate}){
 const key='familienfunke.home.preferences.v1.'+userId;
 const [prefs,setPrefs]=useState(null),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const live=useRef(true),lock=useRef(false);
 useEffect(()=>{
  live.current=true;let current=true;
  AsyncStorage.getItem(key).then(raw=>{
   if(!current)return;
   try{setPrefs(sanitizeHomePrefs(raw?JSON.parse(raw):DEFAULT_HOME_PREFS));}catch{setPrefs(DEFAULT_HOME_PREFS);}
  }).catch(()=>{if(current){setPrefs(DEFAULT_HOME_PREFS);setError('Einstellungen konnten nicht geladen werden. Personalisierung bleibt aus.');}});
  return()=>{current=false;live.current=false;};
 },[key]);
 async function change(next){
  if(lock.current||!prefs)return;lock.current=true;setBusy(true);setError('');
  const clean=sanitizeHomePrefs(next);
  // Switch off immediately, even if storage fails. Never display recommendations after opting out.
  if(!clean.enabled)setPrefs(clean);
  try{
   await AsyncStorage.setItem(key,JSON.stringify(clean));
   if(live.current)setPrefs(clean);
  }catch{
   if(live.current)setError('Einstellung konnte nicht dauerhaft gespeichert werden. Bitte erneut versuchen.');
  }finally{lock.current=false;if(live.current)setBusy(false);}
 }
 const hasOwnProfile=!!userId&&profile?.user_id===userId;
 const recommendations=recommendHome({profile,prefs,places,origins:ORIGINS,distanceKm,events,partnerEvents,listings,ideas:IDEAS,userId,active});
 const show=hasOwnProfile&&prefs?.enabled===true;
 const any=!!(recommendations.places.length||recommendations.events.length||recommendations.offers.length||recommendations.activity||recommendations.quiz);
 if(!userId)return null;
 return <View style={s.section}>
  <View style={s.header}><View style={{flex:1}}><Text accessibilityRole="header" style={s.title}>Für euch</Text><Text style={s.muted}>Freiwillige persönliche Empfehlungen</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Personalisierung einstellen" accessibilityState={{expanded:editing}} onPress={()=>setEditing(v=>!v)} style={s.settings}><Text style={s.settingText}>{editing?'Schließen':'Anpassen'}</Text></Pressable>
  </View>
  {!show||editing?<View style={s.group}>
   <Text style={s.text}>Mit eurer freiwillig angegebenen Region, euren Hobbys und optionalen Altersgruppen wählen wir passende Inhalte aus. Keine Auswertung eures Klickverhaltens, keine Weitergabe an die KI.</Text>
   <View style={s.row}><Text style={[s.name,{flex:1}]}>Persönliche Empfehlungen</Text>
    <Switch accessibilityLabel="Persönliche Empfehlungen" disabled={!prefs||busy} value={prefs?.enabled===true} onValueChange={enabled=>change({...prefs,enabled})}/></View>
   {prefs?.enabled?<><Text style={s.heading}>Altersgruppen (optional)</Text><Text style={s.muted}>Mehrfachauswahl ohne Namen oder Geburtsdaten. Nur auf diesem Gerät und für dieses Konto gespeichert.</Text>
    <View style={s.chips}>{AGE_OPTIONS.map(([id,label])=>{
     const selected=prefs.ages.includes(id);
     return <Pressable accessibilityRole="button" accessibilityState={{selected,disabled:busy}} key={id} disabled={busy} onPress={()=>change({...prefs,ages:selected?prefs.ages.filter(x=>x!==id):[...prefs.ages,id]})} style={[s.chip,selected&&s.selected]}>
      <Text style={[s.text,selected&&{color:C.white,fontWeight:'800'}]}>{label}</Text>
     </Pressable>;
    })}</View>
    {prefs.ages.length?<Pressable accessibilityRole="button" disabled={busy} style={s.settings} onPress={()=>change({...prefs,ages:[]})}><Text style={s.settingText}>Altersauswahl löschen</Text></Pressable>:null}
    <LinkRow title="Region und Hobbys bearbeiten" detail="Im eigenen Profil" onPress={()=>onNavigate('profile')}/>
   </>:null}
  </View>:null}
  {error?<Text accessibilityLiveRegion="assertive" style={s.muted}>{error}</Text>:null}
  {show?<>
   {!any?<View style={s.group}><Text style={s.text}>Noch keine passenden Empfehlungen im geladenen Bestand. Ergänzt bei Bedarf Region, Hobbys oder Altersgruppen.</Text><LinkRow title="Profil bearbeiten" onPress={()=>onNavigate('profile')}/></View>:null}
   {recommendations.places.length?<Group title="Ausflugsziele in eurer Region">
    {recommendations.places.map(p=><LinkRow key={p.id} title={p.title} detail={[p.region,p.km!==null?'ca. '+p.km+' km Luftlinie ab Ortsmitte':null,p.reason].filter(Boolean).join(' · ')} onPress={()=>onNavigate('map','',p.id)}/>)}
    <Text style={s.muted}>Redaktionelle Auswahl. Öffnungszeiten, Kosten und Altersregeln vor dem Besuch prüfen.</Text>
   </Group>:null}
   {recommendations.events.length?<Group title="Anstehende Treffen in eurer Region">
    {recommendations.events.map(event=><LinkRow key={event.kind+event.id} title={event.title} detail={new Date(event.starts_at).toLocaleString('de-DE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+event.region} onPress={()=>onNavigate(event.kind==='family'?'events':'partners','',event.id)}/>)}
   </Group>:null}
   {recommendations.offers.length?<Group title="Basar – passende Kategorien">
    <Text style={s.muted}>Aus derzeit geladenen, freigegebenen Angeboten. Keine abgeleiteten Kleidergrößen.</Text>
    {recommendations.offers.map(x=><LinkRow key={x.id} title={x.title} detail={[price(x),x.category,x.region].filter(Boolean).join(' · ')} onPress={()=>onNavigate('market','',x.id)}/>)}
   </Group>:null}
   {recommendations.activity||recommendations.quiz?<Group title="Zeit miteinander">
    {recommendations.activity?<><Text style={s.heading}>{recommendations.activity.title} · {recommendations.activity.duration}</Text><Text style={s.text}>{recommendations.activity.text}</Text><Text style={s.muted}>Ab etwa 4 Jahren mit erwachsener Begleitung.</Text></>:null}
    {recommendations.quiz?<LinkRow title={quizLabels[recommendations.quiz]} detail="Altersstufe im Quiz vorgewählt; frei änderbar." onPress={()=>onNavigate('play','',recommendations.quiz)}/>:<LinkRow title="Weitere Spielideen" onPress={()=>onNavigate('play')}/>}
   </Group>:null}
   {!editing?<Text style={s.muted}>Auswahl anhand eurer Angaben, ohne KI-Aufruf. Unter „Anpassen“ jederzeit abschaltbar.</Text>:null}
  </>:null}
 </View>;
}
const s=StyleSheet.create({section:{gap:10,marginBottom:20},header:{flexDirection:'row',alignItems:'center',gap:8},title:{fontSize:23,fontWeight:'900',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},name:{fontSize:15,fontWeight:'800',color:C.ink},text:{fontSize:14,lineHeight:21,color:C.ink},muted:{fontSize:12,lineHeight:18,color:C.muted},settings:{minHeight:44,paddingHorizontal:12,justifyContent:'center',alignSelf:'flex-start',backgroundColor:C.mint,borderRadius:13},settingText:{fontSize:14,color:C.accentDark,fontWeight:'800'},group:{borderRadius:19,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,padding:14,gap:9},row:{flexDirection:'row',alignItems:'center',minHeight:48,gap:8,borderBottomWidth:1,borderBottomColor:C.line,paddingVertical:7},arrow:{fontSize:25,color:C.accentDark},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:12,paddingVertical:7,backgroundColor:C.mint,borderRadius:18},selected:{backgroundColor:C.accentDark}});
