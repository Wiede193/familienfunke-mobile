import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking,
Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView,
StatusBar, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { assertResult, configured, errorMessage, supabase } from './supabase';
import { BUNDESLAENDER, KREISE_NACH_LAND } from './data/regionen';
import MomentViewer from './components/MomentViewer';
import FamilyTabIcon from './components/FamilyTabIcon';
import FamilyOutingIdeas from './components/FamilyOutingIdeas';
import { computeActivity, isValidSeenState, markSeen, newSeenState, storageKey } from './lib/activityIndicators';
// Familienfunke: Vorlage 3 – fröhlich und lebendig.
const C = {
bg:'#FFFAF2',white:'#FFFFFF',ink:'#243E43',muted:'#687E80',
accent:'#087F87',accentDark:'#075D67',pale:'#FFF2DF',line:'#EFE1D3',
coral:'#EE7867',coralDeep:'#B9474C',sunny:'#FFE3A0',
lavender:'#F2EEFF',warning:'#FFF1D6',warningText:'#75521D',
};
const INTEREST_GROUPS={
 hobbys:[
  ['Sport & Bewegung',['Sport','Schwimmen','Fußball','Radfahren','Wandern','Joggen','Fitness','Tanzen','Yoga','Klettern','Wintersport']],
  ['Kreatives & Handgemachtes',['Basteln','Malen','Fotografie','Handarbeiten','Gärtnern','Backen','Kochen']],
  ['Musik, Kultur & Zuhause',['Musik','Singen','Instrumente','Lesen','Brettspiele','Spieleabende','Tiere']]
 ],
 unterwegs:[
  ['Natur & Draußen',['Natur','Spielplatz','Wald','Spaziergänge','Camping','Picknick','Garten','Fahrradtouren']],
  ['Ausflüge & Entdecken',['Ausflüge','Zoo','Tierpark','Bauernhof','Museum','Bibliothek','Kino','Theater','Schwimmbad','Städtetrips']]
 ],
 treffen:[
  ['So lernen wir andere Familien kennen',['Spielplatztreff','Eltern-Kind-Treff','Krabbelgruppe','Kaffee & Kuchen','Gemeinsam kochen','Gemeinsame Ausflüge','Familienfeste','Grillen']],
  ['Wann passt es oft gut?',['Nachmittags','Wochenenden','Unter der Woche','Spontane Treffen']],
  ['Welche Treffen mögen wir?',['Ruhige Treffen','Aktive Treffen','Draußen treffen','Kreative Treffen']]
 ]
};
const INTERESTS=[...new Set(Object.values(INTEREST_GROUPS).flatMap(groups=>groups.flatMap(([,items])=>items)))];
const PROFILE_MENUS=[
 ['steckbrief','01','Steckbrief','Das seid ihr'],
 ['hobbys','02','Hobbys','Was euch Spaß macht'],
 ['unterwegs','03','Freizeit','Draußen & unterwegs'],
 ['treffen','04','Treffideen','Gemeinsam statt allein'],
 ['momente','05','Unsere Momente','Fotos & Geschichten'],
 ['sichtbarkeit','06','Privatsphäre','Wer euch finden kann'],
 ['konto','07','Konto & Hilfe','Sicherheit & Zugang']
];

const TABS = [['discover','Entdecken'],['contacts','Kontakte'],['chat','Nachrichten'],['events','Kalender'],['profile','Profil']];
const blankProfile = {display_name:'',region_label:'',about:'',interests:[],is_discoverable:false};
const blankData = {profiles:[],contacts:[],messages:[],events:[],eventRequests:[],photos:[],blocks:[]};
const formatDate = (value) => { if (!value) return '–'; const d = new Date(value); return isNaN(d) ? '–' : d.toLocaleString('de-DE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); };
const initial = (name) => String(name||'F').split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
const safeString = (value, length) => String(value||'').trim().slice(0,length);
const eqId = (a,b) => !!a && a===b;
const givenDate = (str,time) => { const date = new Date(`${str}T${time}:00`); return isNaN(date.getTime())?null:date; };
const humanError = (e) => {
const msg = errorMessage(e);
if (/invalid login credentials/i.test(msg)) return 'E-Mail oder Passwort stimmen nicht. Bitte prüfe deine Zugangsdaten.';
if (/email not confirmed/i.test(msg)) return 'Deine E-Mail-Adresse ist noch nicht bestätigt.';
if (/row-level security|permission denied|policy/i.test(msg)) return 'Diese Aktion ist noch nicht freigegeben oder durch die Sicherheitsregeln gesperrt.';
return msg;
};
/**
 * Erste Integrationsstufe: Texte vor dem Speichern über die authentifizierte
 * Supabase Edge Function prüfen. Fehler führen dazu, dass nichts gespeichert wird.
 *
 * WICHTIG: Diese clientseitige Vorprüfung ersetzt KEINE serverseitige Pflicht-
 * Moderation und keine RLS-/Storage-Sicherheitsregeln. Die Datenbank erlaubt
 * sonst möglicherweise direkte Schreibzugriffe ohne diese Prüfung.
 */
async function moderateTextOrThrow(parts) {
  const text = parts
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join('\n\n');

  if (!text) return;

  if (text.length > 10000) {
    throw new Error('Der Text ist zu lang für die Sicherheitsprüfung.');
  }

  let data, error;
  try {
    ({ data, error } = await supabase.functions.invoke('moderate-content', {
      body: { text },
    }));
  } catch {
    throw new Error('Die Sicherheitsprüfung ist momentan nicht erreichbar. Bitte versuche es später erneut.');
  }

  if (error) {
    throw new Error('Die Sicherheitsprüfung ist momentan nicht verfügbar. Bitte versuche es später erneut.');
  }

  if (data?.flagged === true || data?.status === 'review_required') {
    throw new Error('Der Text wurde von der Sicherheitsprüfung zurückgehalten und nicht gespeichert. Bitte überarbeite ihn.');
  }

  // Nur eine ausdrücklich unauffällige Bewertung erlaubt das Speichern.
  if (data?.flagged !== false || data?.status !== 'not_flagged') {
    throw new Error('Die Sicherheitsprüfung lieferte kein eindeutiges Ergebnis. Der Text wurde nicht gespeichert.');
  }
}

function Button({title, onPress, mode='primary', disabled=false, small=false, style}) {
return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
style={({pressed})=>[styles.button,styles[`button_${mode}`],small&&styles.buttonSmall,disabled&&{opacity:0.46},pressed&&{opacity:.8},style]}>
<Text style={[styles.buttonText,mode!=='primary'&&styles.buttonTextDark,small&&{fontSize:13}]}>{title}</Text>
</Pressable>;
}
function Chip({text,selected,onPress}) {
return <Pressable disabled={!onPress} onPress={onPress} style={[styles.chip,selected&&styles.chipSelected]}>
<Text style={[styles.chipText,selected&&{color:C.white}]}>{selected?'✓ ':''}{text}</Text>
</Pressable>;
}
function Card({children,style}) {return <View style={[styles.card,style]}>{children}</View>;}
function MadeInGermanyStamp(){return <View accessibilityLabel="Made in Germany – Designentwurf für die private Beta" style={styles.madeInGermanyStamp}><Text style={styles.stampKicker}>MADE IN</Text><Text style={styles.stampCountry}>GERMANY</Text><Text style={styles.stampDraft}>BETA · DESIGN</Text></View>;}
function H({children,sub}) {return <View style={{marginBottom:17}}><Text style={styles.h}>{children}</Text>{sub?<Text style={styles.sub}>{sub}</Text>:null}</View>;}
function Info({children,warning=false}) {return <View style={[styles.info,warning&&styles.warning]}><Text style={[styles.infoText,warning&&{color:C.warningText}]}>{children}</Text></View>;}
function Avatar({name,size=52,uri}) {return <View style={[styles.avatar,{width:size,height:size,borderRadius:size/2}]}>{uri?<Image source={{uri}} style={{width:size,height:size,borderRadius:size/2}}/>:<Text style={[styles.avatarText,{fontSize:size*.30}]}>{initial(name)}</Text>}</View>;}
function Row({children,style}) {return <View style={[{flexDirection:'row',alignItems:'center',gap:10},style]}>{children}</View>;}
function Input({label,multiline=false,style,...props}) {
return <View style={[{marginBottom:13},style]}><Text style={styles.label}>{label}</Text><TextInput
placeholderTextColor="#9AAFB4" style={[styles.input,multiline&&{height:95,textAlignVertical:'top',paddingTop:12}]}
multiline={multiline} {...props}/></View>;
}
function Blank({title,body}) {return <Card style={{alignItems:'center',paddingVertical:30}}><Text style={{fontSize:38,marginBottom:8,color:C.coral}}>♡</Text><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.sub,{textAlign:'center'}]}>{body}</Text></Card>;}
function Login({error,setError}) {
const [email,setEmail]=useState('');
const [password,setPassword]=useState('');
const [busy,setBusy]=useState(false);
async function submit() {
if (!email.includes('@')||!password) return setError('Bitte E-Mail und Passwort eingeben.');
setBusy(true);setError('');
const {error:e}=await supabase.auth.signInWithPassword({email:email.trim(),password});
if (e) setError(humanError(e));
setBusy(false);
}
return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
<ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
<View style={styles.loginMark}><Text style={{fontSize:52,color:C.white}}>♥</Text></View>
<Text style={styles.brand}>Familienfunke<Text style={{color:C.coral}}>.</Text></Text>
<Text style={styles.tagline}>Aus Nachbarschaft wird Freundschaft.</Text>
<View style={{height:28}}/>
<Card style={{width:'100%',padding:23}}>
<Text style={styles.h}>Willkommen zurück!</Text>
<Text style={[styles.sub,{marginBottom:21}]}>Deine private Familien-Community. Nur eingeladene Erwachsene können sich anmelden.</Text>
<Input label="E-Mail-Adresse" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/>
<Input label="Passwort" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password"/>
{error?<Info warning>{error}</Info>:null}
<Button title={busy?'Anmeldung läuft …':'Anmelden'} disabled={busy} onPress={submit}/>
<Text style={[styles.micro,{textAlign:'center',marginTop:14}]}>Keine öffentliche Registrierung · Private Beta</Text>
</Card>
</ScrollView>
</KeyboardAvoidingView>;
}
export default function App() {
const [session,setSession]=useState(undefined);
const [tab,setTab]=useState('discover');
const [selectedContact,setSelectedContact]=useState(null);
const [detailFamily,setDetailFamily]=useState(null);
const [showEventForm,setShowEventForm]=useState(false);
const [showInfo,setShowInfo]=useState(false);
const [reportTarget,setReportTarget]=useState(null);
const [reportDetails,setReportDetails]=useState('');
const [error,setError]=useState('');
const [notice,setNotice]=useState('');
const [busy,setBusy]=useState(false);
const [loading,setLoading]=useState(false);
// Privacy: account-scoped cache. Old account data cannot be rendered under
// another account even for a single frame before logout effects complete.
const [accountCache,setAccountCache]=useState(null);
const [seen,setSeen]=useState(null);
const seenRef=useRef(null);
const loadEpochRef=useRef(0);
const me=session?.user?.id;
const currentUserRef=useRef(me);
currentUserRef.current=me;
const currentAccount=me&&accountCache?.userId===me?accountCache:null;
const db=currentAccount?.db||blankData;
const myProfile=currentAccount?.myProfile||null;
const verification=currentAccount?.verification||null;
const membership=currentAccount?.membership||null;
const photosUrls=currentAccount?.photosUrls||{};

// Ungelesen-Markierungen bleiben in dieser Beta lokal auf dem jeweiligen Gerät.
// Der erste Besuch legt nur einen Ausgangspunkt an, nicht künstlich neue Hinweise.
useEffect(()=>{
  let alive=true;
  seenRef.current=null;
  setSeen(null);
  if(!me)return ()=>{alive=false;};
  AsyncStorage.getItem(storageKey(me)).then(raw=>{
    let stored=null;
    try{stored=raw?JSON.parse(raw):null;}catch{stored=null;}
    const initialSeen=isValidSeenState(stored,me)?stored:newSeenState(me);
    if(!alive)return;
    seenRef.current=initialSeen;
    setSeen(initialSeen);
    if(!isValidSeenState(stored,me))AsyncStorage.setItem(storageKey(me),JSON.stringify(initialSeen)).catch(()=>{});
  }).catch(()=>{
    if(!alive)return;
    const initialSeen=newSeenState(me);
    seenRef.current=initialSeen;setSeen(initialSeen);
  });
  return ()=>{alive=false;};
},[me]);
const markActivity=useCallback((type,contactId=null)=>{
  const current=seenRef.current;
  if(!current||current.userId!==me)return;
  const next=markSeen(current,type,Date.now(),contactId);
  if(next===current)return;
  seenRef.current=next;
  setSeen(next);
  AsyncStorage.setItem(storageKey(me),JSON.stringify(next)).catch(()=>{});
},[me]);
// Hooks must always execute before any authentication-dependent early return.
useEffect(()=>{
  // Prevent a loop: marking a chat read updates "seen", so depend only on
  // the loaded/not-loaded flag, not the changing seen-state object itself.
  const belongsToCurrentAccount=accountCache?.userId===me;
  const isOwnAcceptedContact=accountCache?.db?.contacts?.some(c=>c.id===selectedContact&&c.status==='accepted'&&(c.sender_id===me||c.recipient_id===me));
  if(selectedContact&&me&&seen&&belongsToCurrentAccount&&isOwnAcceptedContact)markActivity('chat',selectedContact);
},[selectedContact,me,accountCache?.db?.messages,accountCache?.db?.contacts,accountCache?.userId,!!seen,markActivity]);
const load=useCallback(async(silent=false)=>{
if(!me||!supabase)return;
const requestId=++loadEpochRef.current;
const stillCurrent=()=>currentUserRef.current===me&&loadEpochRef.current===requestId;
if(!silent)setLoading(true);
try {
const queries=await Promise.all([
supabase.from('profiles').select('*').limit(150),
supabase.from('contact_requests').select('*').order('created_at',{ascending:false}).limit(200),
supabase.from('messages').select('*').order('created_at',{ascending:false}).limit(300),
supabase.from('events').select('*').order('starts_at',{ascending:true}).limit(150),
supabase.from('event_requests').select('*').limit(200),
supabase.from('profile_photos').select('*').order('created_at',{ascending:false}).limit(100),
supabase.from('blocks').select('*').limit(200),
supabase.from('verifications').select('*').eq('user_id',me).maybeSingle(),
supabase.from('memberships').select('*').eq('user_id',me).maybeSingle(),
]);
const firstError=queries.find(x=>x.error)?.error;
if(firstError)throw firstError;
const [profiles,contacts,messages,events,eventRequests,photos,blocks,verificationRow,membershipRow]=queries;
if(!stillCurrent())return;
const profileRow=(profiles.data||[]).find(p=>p.user_id===me)||null;
const photosForMe=(photos.data||[]).filter(photo=>photo.owner_id===me);
const approvedOthers=(photos.data||[]).filter(photo=>photo.owner_id!==me&&photo.moderation_status==='approved');
const acceptedIds=new Set((contacts.data||[]).filter(c=>c.status==='accepted')
  .map(c=>c.sender_id===me?c.recipient_id:c.sender_id));
const blockedByMe=new Set((blocks.data||[]).filter(b=>b.blocker_id===me).map(b=>b.blocked_id));
// Create signed links only for own pictures or approved pictures of unblocked contacts.
// Supabase Storage RLS is the ultimate authorization layer.
const viewablePhotos=[...photosForMe,...approvedOthers.filter(photo=>
  acceptedIds.has(photo.owner_id)&&!blockedByMe.has(photo.owner_id))];
const images=await Promise.all(viewablePhotos.map(async(p)=>{
try {const {data,error:e}=await supabase.storage.from('familienfunke-photos').createSignedUrl(p.storage_path,600);
return [p.id,e?null:data?.signedUrl||null];} catch {return [p.id,null];}
}));
if(!stillCurrent())return;
setAccountCache({
  userId:me,
  db:{profiles:profiles.data||[],contacts:contacts.data||[],messages:messages.data||[],
      events:events.data||[],eventRequests:eventRequests.data||[],photos:photos.data||[],blocks:blocks.data||[]},
  myProfile:profileRow,verification:verificationRow.data,membership:membershipRow.data,
  photosUrls:Object.fromEntries(images),
});
setError('');
} catch(e){if(stillCurrent())setError(humanError(e));}
finally{if(stillCurrent())setLoading(false);}
},[me]);
useEffect(()=>{
if(!supabase){setSession(null);return;}
let alive=true;
supabase.auth.getSession().then(({data,error:e})=>{
if(!alive)return;
if(e)setError(humanError(e));
setSession(data?.session||null);
}).catch(e=>{if(alive){setSession(null);setError(humanError(e));}});
const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{if(alive)setSession(next);});
return ()=>{alive=false;listener.subscription.unsubscribe();};
},[]);
useEffect(()=>{
  setSelectedContact(null);
  setDetailFamily(null);
  setShowInfo(false);
  setReportTarget(null);
  setTab('discover');
  setError('');
  setNotice('');
  if(me)load();
  else{
    loadEpochRef.current++;
    setAccountCache(null);
    setLoading(false);
  }
},[me,load]);
const active=verification?.status==='verified'&&myProfile?.moderation_status==='approved'&&membership?.status!=='suspended';
const blocked=(uid)=>db.blocks.some(b=>b.blocker_id===me&&b.blocked_id===uid);
const findName=(uid)=>db.profiles.find(p=>p.user_id===uid)?.display_name||'Familienprofil';
const otherSide=(contact)=>contact.sender_id===me?contact.recipient_id:contact.sender_id;
const accepted=db.contacts.filter(x=>x.status==='accepted');
const pending=db.contacts.filter(x=>x.status==='pending');
const photoOf=(uid)=>db.photos.find(p=>p.owner_id===uid&&p.moderation_status==='approved')||db.photos.find(p=>p.owner_id===uid&&uid===me);
const ownPhotos=db.photos.filter(p=>p.owner_id===me);
const activities=useMemo(()=>computeActivity({
  me,db,contacts:db.contacts,matches:db.profiles.filter(p=>p.user_id!==me&&p.moderation_status==='approved'&&p.is_discoverable)
    .map(p=>({...p,match:(p.interests||[]).filter(i=>myProfile?.interests?.includes(i)).length})),
  myProfile,seen,blockedUserIds:db.blocks.filter(b=>b.blocker_id===me).map(b=>b.blocked_id)
}),[me,db,myProfile,seen]);
const freshPhotoCount=activities.newPhotos;
const matches=useMemo(()=>db.profiles.filter(p=>p.user_id!==me&&p.moderation_status==='approved'&&p.is_discoverable)
.map(p=>({...p,match:(p.interests||[]).filter(x=>myProfile?.interests?.includes(x)).length}))
.sort((a,b)=>b.match-a.match||String(a.display_name).localeCompare(String(b.display_name))),[db.profiles,me,myProfile]);
async function execute(fn,success){
if(busy)return;
setBusy(true);setError('');setNotice('');
try{await fn();if(success)setNotice(success);await load(true);return true;}
catch(e){setError(humanError(e));return false;}
finally{setBusy(false);}
}
function report(type,id){setReportDetails('');setReportTarget({type,id});}
async function sendReport(){
if(!reportTarget||reportDetails.trim().length<10)return setError('Bitte den Vorfall mit mindestens 10 Zeichen beschreiben.');
const ok=await execute(async()=>assertResult(await supabase.from('reports').insert({reporter_id:me,subject_type:reportTarget.type,subject_id:reportTarget.id,details:reportDetails.trim()})),'Danke. Deine Meldung wurde gespeichert.');
if(ok){setReportTarget(null);setReportDetails('');}
}
async function sendRequest(uid){await execute(async()=>assertResult(await supabase.from('contact_requests').insert({sender_id:me,recipient_id:uid})),'Kontaktanfrage verschickt.');}
async function replyRequest(id,status){await execute(async()=>assertResult(await supabase.from('contact_requests').update({status}).eq('id',id)),'Kontaktanfrage aktualisiert.');}
async function blockUser(uid){
Alert.alert('Kontakt blockieren?','Die Person kann dir dann keine neuen Nachrichten schicken.',[
{text:'Abbrechen',style:'cancelled'},
{text:'Blockieren',style:'destructive',onPress:()=>execute(async()=>assertResult(await supabase.from('blocks').insert({blocker_id:me,blocked_id:uid})),'Kontakt blockiert.')},
]);
}
async function unblockUser(uid){await execute(async()=>assertResult(await supabase.from('blocks').delete().eq('blocker_id',me).eq('blocked_id',uid)),'Blockierung aufgehoben.');}
async function changePassword(password){
if(password.length<12)throw new Error('Das Passwort braucht mindestens 12 Zeichen.');
return execute(async()=>assertResult(await supabase.auth.updateUser({password})),'Passwort geändert.');
}
if(!configured)return <SafeAreaView style={styles.screen}><View style={{padding:24,marginTop:80}}><Text style={styles.brand}>Familienfunke.</Text><H sub="Die App ist vorbereitet, braucht aber noch deine öffentlichen Supabase-Projektdaten.">Einrichtung erforderlich</H><Info>Bitte in der Datei .env die beiden Werte EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY eintragen. Niemals einen Secret Key verwenden.</Info></View></SafeAreaView>;
if(session===undefined)return <View style={styles.center}><ActivityIndicator color={C.accent} size="large"/><Text style={styles.sub}>Familienfunke wird gestartet …</Text></View>;
if(!me)return <SafeAreaView style={styles.screen}><ExpoStatusBar style="dark"/><Login error={error} setError={setError}/></SafeAreaView>;
if(!currentAccount)return <SafeAreaView style={styles.screen}><ExpoStatusBar style="dark"/>
  <View style={{flex:1,justifyContent:'center',padding:24,alignItems:'center'}}>
    {loading?<ActivityIndicator color={C.accent} size="large"/>:null}
    <Text style={[styles.sub,{textAlign:'center',marginTop:16}]}>
      {error||'Dein geschütztes Familienprofil wird geladen …'}
    </Text>
    {!loading?<Button title="Erneut versuchen" onPress={()=>load()} mode="outline"/>:null}
  </View></SafeAreaView>;
if(membership?.status==='suspended')return <SafeAreaView style={styles.screen}><ExpoStatusBar style="dark"/>
  <View style={{flex:1,justifyContent:'center',padding:27,alignItems:'center'}}>
    <Text style={[styles.h,{textAlign:'center'}]}>Dieses Familienkonto ist gesperrt</Text>
    <Text style={[styles.sub,{textAlign:'center',marginTop:15,marginBottom:24}]}>
      Die Nutzung ist derzeit eingeschränkt. Bei Fragen wende dich an die Familienfunke-Administration.
    </Text>
    <Button title="Abmelden" mode="outline" onPress={()=>supabase.auth.signOut()}/>
  </View></SafeAreaView>;
const navTitle=detailFamily?'Familienprofil':selectedContact?'Nachrichten':showInfo?'Familien-Kompass':TABS.find(t=>t[0]===tab)?.[1];
function chooseTab(id){
  setTab(id);
  setShowEventForm(false);
  if(id==='discover')markActivity('discover');
  if(id==='events')markActivity('events');
}
function openChat(id){
  setSelectedContact(id);
  setTab('chat');
  markActivity('chat',id);
}
function back(){if(detailFamily)setDetailFamily(null);else if(selectedContact)setSelectedContact(null);else if(showInfo)setShowInfo(false);}
return <SafeAreaView style={styles.screen}>
<ExpoStatusBar style="dark"/>
<View style={styles.topBar}>
<View style={styles.headerIdentity}>
  <View style={styles.headerHeartBadge}><Text style={styles.headerHeart}>♥</Text></View>
  <View style={{flex:1}}>
    <Text style={styles.smallBrand}>Familienfunke<Text style={{color:C.coral}}>.</Text></Text>
    <Text style={styles.topHint}>{navTitle}</Text>
  </View>
</View>
{detailFamily||selectedContact||showInfo?<Button title="← Zurück" onPress={back} small mode="ghost"/>:
<Row style={{gap:6}}><Pressable accessibilityRole="button" accessibilityLabel="Neuigkeiten aktualisieren" onPress={()=>load(true)}
 style={styles.refreshButton}><Text style={styles.refreshText}>↻</Text></Pressable><MadeInGermanyStamp/></Row>}
</View>
{error?<Pressable onPress={()=>setError('')}><Info warning>{error} · Schließen ×</Info></Pressable>:null}
{notice?<Pressable onPress={()=>setNotice('')}><Info>{notice} · Schließen ×</Info></Pressable>:null}
{loading?<View style={{padding:4}}><ActivityIndicator color={C.accent}/></View>:null}
<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={0}>
{detailFamily?<FamilyDetail p={db.profiles.find(p=>p.user_id===detailFamily)}
imageUrl={photosUrls[photoOf(detailFamily)?.id]} photos={db.photos.filter(p=>p.owner_id===detailFamily&&p.moderation_status==='approved')}
photosUrls={photosUrls} active={active} disabled={busy} blocked={blocked(detailFamily)}
connection={db.contacts.find(c=>(c.sender_id===me&&c.recipient_id===detailFamily)||(c.recipient_id===me&&c.sender_id===detailFamily))}
onContact={()=>sendRequest(detailFamily)} onBlock={()=>blockUser(detailFamily)} onUnblock={()=>unblockUser(detailFamily)}
onReport={()=>report('profile',detailFamily)} onChat={(cid)=>{setDetailFamily(null);openChat(cid);}}
 onPhotosViewed={()=>markActivity('photos')}/>:
selectedContact?<ChatScreen contact={accepted.find(c=>c.id===selectedContact)} me={me} nameOf={findName}
messages={db.messages.filter(m=>m.contact_id===selectedContact)} disabled={busy} blocked={blocked}
onRefresh={()=>load(true)}
send={(body)=>execute(async()=>{
  // Die Nachricht wird ausschliesslich von der authentifizierten Edge Function
  // geprueft und gespeichert. Kein direkter INSERT in public.messages mehr.
  const {data, error:sendError} = await supabase.functions.invoke('send-message', {
    body: {contact_id:selectedContact, body},
  });
  // Die Datenbank meldet diese Kennung nach fünf Nachrichten ohne Antwort.
  // Die Edge Function muss die Kennung ausdrücklich weiterreichen. Solange die
  // Migration nicht ausgerollt ist, wird hier keine serverseitige Sperre behauptet.
  const serverCode=[data?.code,data?.error?.code,data?.error_code,sendError?.code,
    sendError?.message,sendError?.context?.message]
    .filter(value=>typeof value==='string').join(' ');
  if(serverCode.includes('FF_MSG_LIMIT_5'))
    throw new Error('Du hast bereits fünf Nachrichten hintereinander geschrieben. Sobald die andere Familie antwortet, kannst du wieder schreiben.');
  if(sendError){
    const status=sendError.context?.status;
    if(status===422)throw new Error('Diese Nachricht wurde wegen unserer Inhaltsregeln zurückgehalten. Bitte formuliere sie anders.');
    if(status===401)throw new Error('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
    if(status===403)throw new Error('Nachrichten sind für diesen Kontakt momentan nicht erlaubt.');
    if(status===429)throw new Error('Du hast bereits fünf Nachrichten ohne Antwort geschickt. Warte bitte, bis die andere Familie antwortet.');
    if(status===503)throw new Error('Die Sicherheitsprüfung ist momentan nicht verfügbar. Bitte später erneut versuchen.');
    throw new Error('Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
  }
  if(!data?.message?.id)throw new Error('Keine eindeutige Bestätigung vom Nachrichtenserver erhalten.');
},'Nachricht gesendet.')}
onReport={(id)=>report('message',id)} onBlock={blockUser}/>:
showInfo?<InfoScreen/>:
tab==='discover'?<DiscoverScreen matches={matches} requests={db.contacts} me={me} active={active} busy={busy}
myProfile={myProfile} verification={verification} membership={membership}
showFamily={setDetailFamily} onContact={sendRequest} imageFor={(uid)=>photosUrls[photoOf(uid)?.id]} blocked={blocked} openKompass={()=>setShowInfo(true)}/>:
tab==='contacts'?<ContactsScreen pending={pending} accepted={accepted} me={me} nameOf={findName}
respond={replyRequest} blocked={blocked} disabled={busy} onBlock={blockUser} onUnblock={unblockUser}
onChat={openChat} onShowFamily={setDetailFamily} newPhotoCount={freshPhotoCount} onViewPhotos={()=>markActivity('photos')}/>:
tab==='chat'?<ChatList contacts={accepted} me={me} nameOf={findName} blocked={blocked}
onChat={openChat} messages={db.messages} chatCounts={activities.chatCounts}/>:
tab==='events'?<EventsScreen events={db.events} eventRequests={db.eventRequests} me={me} active={active} busy={busy}
profiles={db.profiles} showForm={showEventForm} setShowForm={setShowEventForm} initialRegion={myProfile?.region_label||''}
createEvent={(event)=>execute(async()=>{
  await moderateTextOrThrow([event.title,event.description,event.region_label]);
  assertResult(await supabase.from('events').insert({organizer_id:me,...event}));
},'Termin eingereicht. Er wird vor Veröffentlichung geprüft.')}
requestEvent={(id)=>execute(async()=>assertResult(await supabase.from('event_requests').insert({event_id:id,requester_id:me})),'Teilnahme angefragt.')}
replyEvent={(id,requester,status)=>execute(async()=>assertResult(await supabase.from('event_requests').update({status}).eq('event_id',id).eq('requester_id',requester)),'Teilnahmestatus aktualisiert.')}
reportEvent={(id)=>report('event',id)}/>:
<ProfileScreen profile={myProfile} verification={verification} membership={membership} active={active}
photos={ownPhotos} photosUrls={photosUrls} busy={busy}
save={(value)=>execute(async()=>{
  await moderateTextOrThrow([value.display_name,value.region_label,value.about]);
  assertResult(await supabase.from('profiles').update(value).eq('user_id',me));
},'Profil gespeichert. Textänderungen benötigen eine neue Freigabe.')}
uploadPhoto={(asset,caption)=>uploadProfilePhoto(asset,caption,me,execute)}
reportPhoto={(id)=>report('photo',id)} deletePhoto={(id)=>deleteProfilePhoto(id,me,db.photos,execute)}
blocks={db.blocks} onUnblock={unblockUser}
changePassword={changePassword} openInfo={()=>setShowInfo(true)} signOut={()=>supabase.auth.signOut()}/>}
</KeyboardAvoidingView>
{!selectedContact&&!detailFamily&&!showInfo?<View style={styles.tabBar}>
{TABS.map(([id,title])=><Pressable accessibilityRole="tab" accessibilityLabel={title+(activities[id]>0?', '+activities[id]+' Hinweise':'')}
accessibilityState={{selected:tab===id}} key={id} onPress={()=>chooseTab(id)}
style={({pressed})=>[styles.tab,tab===id&&styles.tabActive,pressed&&styles.tabPressed]}>
<View style={styles.tabIconWrap}>
<FamilyTabIcon name={id} color={tab===id?C.accentDark:'#839293'} size={26}/>
{activities[id]>0?<View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{activities[id]>99?'99+':activities[id]}</Text></View>:null}
</View>
<Text numberOfLines={1} style={[styles.tabLabel,tab===id&&styles.tabLabelActive]}>{title}</Text>
</Pressable>)}
</View>:null}
{reportTarget?<View style={styles.modalShade}><Card style={{marginHorizontal:22,padding:24}}>
<Text style={styles.h}>Inhalt melden</Text><Text style={styles.sub}>Bitte beschreibe den Vorfall sachlich. Die Meldung geht an das Betreiberteam.</Text>
<Input label="Was ist passiert?" multiline value={reportDetails} onChangeText={setReportDetails} maxLength={2000}/>
<Row><Button title="Abbrechen" mode="outline" style={{flex:1}} onPress={()=>setReportTarget(null)}/><Button title="Melden" disabled={busy||reportDetails.trim().length<10} style={{flex:1}} onPress={sendReport}/></Row>
</Card></View>:null}
</SafeAreaView>;
}
async function uploadProfilePhoto(asset,caption,me,execute){
if(!asset?.uri)throw new Error('Bitte zuerst ein Foto auswählen.');
return execute(async()=>{
// Erst mit dem Klick auf "Foto einreichen" starten die Prüfungen.
// Eine abgelehnte Bildbeschreibung bleibt im Entwurf zur Überarbeitung.
// Das Foto wird danach zunächst privat mit Status "pending" gespeichert.
await moderateTextOrThrow([safeString(caption,200)]);
const manipulator=ImageManipulator.ImageManipulator.manipulate(asset.uri,{maxWidth:1536,maxHeight:1536});
manipulator.resize({width:1024,height:null});
const rendered=await manipulator.renderAsync();
const saved=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:0.78});
const file=new File(saved.uri);
if(file.size>5*1024*1024)throw new Error('Das Bild ist größer als 5 MB.');
const buffer=await file.arrayBuffer();
const path=`${me}/${Date.now()}-${Math.random().toString(36).slice(2,10)}.jpg`;
assertResult(await supabase.storage.from('familienfunke-photos').upload(path,new Uint8Array(buffer),{contentType:'image/jpeg',upsert:false}));
const result=await supabase.from('profile_photos')
  .insert({owner_id:me,storage_path:path,caption:safeString(caption,200)})
  .select('id')
  .single();
if(result.error){
  await supabase.storage.from('familienfunke-photos').remove([path]);
  throw result.error;
}
// Im Fehlerfall bleibt das Foto auf pending und für andere Familien gesperrt.
// Der Nutzer soll einen erfolgreichen Upload nicht mit einer erfolgreichen
// automatischen Freigabe verwechseln.
try {
  const {data:review,error:reviewError}=await supabase.functions.invoke('moderate-photo',{
    body:{photo_id:result.data.id},
  });
  if(reviewError || !['approved','review_required'].includes(review?.status)){
    Alert.alert('Foto wartet auf Prüfung',
      'Das Foto wurde hochgeladen, aber die automatische Prüfung konnte nicht abgeschlossen werden. Es bleibt bis zur Freigabe gesperrt.');
  } else if(review.status==='review_required'){
    Alert.alert('Manuelle Prüfung erforderlich',
      'Das Foto wurde hochgeladen und bleibt bis zur manuellen Freigabe gesperrt.');
  }
} catch {
  Alert.alert('Foto wartet auf Prüfung',
    'Das Foto wurde hochgeladen. Die automatische Prüfung ist derzeit nicht erreichbar; es bleibt bis zur Freigabe gesperrt.');
}
},'Foto hochgeladen. Der aktuelle Freigabestatus wird im Profil angezeigt.');
}
async function deleteProfilePhoto(id,me,photos,execute){
const photo=photos.find(p=>p.id===id&&p.owner_id===me);
if(!photo)return;
Alert.alert('Foto löschen?','Das Foto wird aus deinem Profil entfernt.',[
{text:'Abbrechen',style:'cancel'},
{text:'Löschen',style:'destructive',onPress:()=>execute(async()=>{
assertResult(await supabase.from('profile_photos').delete().eq('id',id).eq('owner_id',me));
// Storage separat entfernen; fehlender Speicherzugriff führt nicht dazu, dass das Profilbild sichtbar bleibt.
await supabase.storage.from('familienfunke-photos').remove([photo.storage_path]);
},'Foto entfernt.')},
]);
}
function DiscoverScreen({matches,requests,me,active,busy,myProfile,verification,membership,showFamily,onContact,imageFor,blocked,openKompass}) {
const [query,setQuery]=useState('');
const [interest,setInterest]=useState('Alle');
const filtered=matches.filter(p=>(!query||`${p.display_name} ${p.region_label} ${(p.interests||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase()))&&(interest==='Alle'||p.interests?.includes(interest)));
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<View style={styles.hero}>
  <View style={styles.heroDecorationOne} pointerEvents="none"/>
  <View style={styles.heroDecorationTwo} pointerEvents="none"/>
  <View style={styles.heroPill}><Text style={styles.heroPillText}>✦ GEMEINSAM MEHR ERLEBEN</Text></View>
  <Text style={styles.heroTitle}>Familien in deiner Nähe entdecken.</Text>
  <Text style={styles.heroText}>Finde neue Freundschaften statt endloser Feeds.</Text>
  <View style={styles.heroTagline}><Text style={styles.heroTaglineText}>♥  Aus Nachbarschaft wird Freundschaft.</Text></View>
</View>
<Pressable accessibilityRole="button" onPress={openKompass} style={{marginBottom:19}}><View style={styles.kompassDiscoverCallout}><Text style={styles.kompassCalloutEyebrow}>☀ NEU: FAMILIEN-KOMPASS</Text><Row style={{alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Text style={styles.kompassCalloutTitle}>Wegweiser für Anträge & Fristen</Text><Text style={styles.kompassCalloutText}>Elterngeld, Kita, Kindergeld und mehr – mit offiziellen Links.</Text></View><Text style={{fontSize:23,color:C.ink}}>›</Text></Row></View></Pressable>
{!active?<Info warning>Dein Konto wartet noch auf persönliche Erwachsenenprüfung oder Profilfreigabe. Profilstatus: {myProfile?.moderation_status||'–'} · Verifizierung: {verification?.status||'–'}.</Info>:null}
<H sub="Passende Interessen – keine exakten Standorte, keine öffentlichen Beiträge.">Familien entdecken</H>
<Input label="Suche nach Name, Region oder Interesse" placeholder="z. B. Natur, Potsdam …" value={query} onChangeText={setQuery}/>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:13}}>
{['Alle',...INTERESTS].map(i=><View key={i} style={{marginRight:6}}><Chip text={i} selected={interest===i} onPress={()=>setInterest(i)}/></View>)}
</ScrollView>
{!active?<Blank title="Zunächst Freigabe abwarten" body="Sobald das Konto geprüft ist, erscheinen freigegebene Familienprofile."/>:
filtered.length===0?<Blank title="Noch keine passenden Familien" body="Andere freigegebene Familien werden hier angezeigt, sobald sie ihr Profil sichtbar schalten."/>:
filtered.map(p=>{
const existing=requests.find(c=>(c.sender_id===me&&c.recipient_id===p.user_id)||(c.recipient_id===me&&c.sender_id===p.user_id));
return <Card key={p.user_id} style={{marginBottom:12}}>
<Row><Avatar name={p.display_name} size={58} uri={imageFor(p.user_id)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{p.display_name}</Text><Text style={styles.micro}>⌖ {p.region_label||'Region nicht angegeben'}</Text></View>{p.match>0?<View style={styles.match}><Text style={styles.matchText}>{p.match} gemeinsam</Text></View>:null}</Row>
{p.about?<Text style={[styles.body,{marginTop:11}]} numberOfLines={3}>{p.about}</Text>:null}
<View style={styles.chipsRow}>{(p.interests||[]).slice(0,5).map(i=><Chip key={i} text={i}/>)}</View>
<Row style={{marginTop:12}}><Button title="Profil ansehen" mode="outline" small style={{flex:1}} onPress={()=>showFamily(p.user_id)}/>
{blocked(p.user_id)?<Text style={styles.micro}>Blockiert</Text>:<Button title={existing? existing.status==='accepted'?'Verbunden':existing.status==='pending'?'Anfrage offen':'Angefragt':'Kennenlernen'} small disabled={busy||!!existing} style={{flex:1}} onPress={()=>onContact(p.user_id)}/>}</Row>
</Card>;
})}
</ScrollView>;
}
function FamilyDetail({p,photos,photosUrls,active,disabled,blocked,connection,onContact,onBlock,onUnblock,onReport,onChat,onPhotosViewed}){
const [viewingPhotoId,setViewingPhotoId]=useState(null);
if(!p)return <Blank title="Profil nicht verfügbar" body="Das Profil kann verborgen oder gesperrt worden sein."/>;
return <><ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<Card style={{alignItems:'center',paddingTop:26}}><Avatar name={p.display_name} size={88} uri={photosUrls?.[photos?.[0]?.id]}/><Text style={[styles.h,{marginTop:12,textAlign:'center'}]}>{p.display_name}</Text><Text style={styles.sub}>⌖ {p.region_label||'Grobe Region nicht angegeben'}</Text><Text style={[styles.body,{textAlign:'center',marginTop:14}]}>{p.about||'Noch keine Beschreibung'}</Text>
<View style={[styles.chipsRow,{justifyContent:'center'}]}>{(p.interests||[]).map(i=><Chip text={i} key={i}/>)}</View>
{connection?.status==='accepted'?<Button title="Private Nachricht schreiben" onPress={()=>onChat(connection.id)}/>:
!blocked&&active?<Button title={connection?'Kontaktanfrage vorhanden':'Kontakt anfragen'} disabled={disabled||!!connection} onPress={onContact}/>:null}
<Row style={{marginTop:12}}>{blocked?<Button title="Entsperren" mode="outline" small onPress={onUnblock}/>:<Button title="Blockieren" mode="outline" small onPress={onBlock}/>}<Button title="Melden" mode="ghost" small onPress={onReport}/></Row>
</Card>
{connection?.status==='accepted'&&photos?.length>0?<><H sub="Nur bestätigte Kontakte sehen freigegebene Familienbilder.">Familienbilder</H><View style={styles.photoGrid}>{photos.map(photo=><Pressable key={photo.id} accessibilityRole="button"
 accessibilityLabel={'Foto vergrößern: '+(photo.caption||'Familienmoment')} disabled={!photosUrls[photo.id]}
 onPress={()=>{setViewingPhotoId(photo.id);onPhotosViewed?.();}} style={styles.galleryPressable}>
 <Card style={{padding:10}}>{photosUrls[photo.id]?<Image source={{uri:photosUrls[photo.id]}} style={styles.photoImage}/>:<View style={[styles.photoImage,{backgroundColor:C.pale}]}/>}
 <Text style={styles.micro} numberOfLines={2}>{photo.caption||'Familienmoment'}</Text>
 <Text style={[styles.micro,{color:C.accentDark,fontWeight:'800',marginTop:5}]}>Foto ansehen ›</Text>
 </Card></Pressable>)}</View></>:null}
</ScrollView>
<MomentViewer photos={connection?.status==='accepted'?(photos||[]):[]} urls={photosUrls||{}} activeId={viewingPhotoId} onSelect={setViewingPhotoId}
 onClose={()=>setViewingPhotoId(null)}/></>;
}
function ContactsScreen({pending,accepted,me,nameOf,respond,blocked,disabled,onBlock,onUnblock,onChat,onShowFamily,newPhotoCount,onViewPhotos}){
const other=c=>c.sender_id===me?c.recipient_id:c.sender_id;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<H sub="Nachrichten sind erst nach gegenseitiger Bestätigung möglich.">Deine Kontakte</H>
{newPhotoCount>0?<Pressable accessibilityRole="button" onPress={onViewPhotos} style={styles.activityCard}>
  <Text style={styles.activityCardTitle}>☀ Neue Familienmomente</Text>
  <Text style={styles.activityCardText}>{newPhotoCount} neue freigegebene {newPhotoCount===1?'Aufnahme':'Aufnahmen'} bei deinen bestätigten Kontakten. Öffne ein Familienprofil, um sie anzusehen.</Text>
  <Text style={styles.activityCardAction}>Hinweis als gesehen markieren ✓</Text>
 </Pressable>:null}
<Text style={styles.sectionTitle}>Offene Anfragen</Text>
{pending.length===0?<Blank title="Keine offenen Anfragen" body="Neue Kontaktwünsche erscheinen hier."/>:pending.map(c=><Card key={c.id} style={{marginBottom:10}}>
<Row><Avatar name={nameOf(other(c))}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other(c))}</Text><Text style={styles.micro}>{c.recipient_id===me?'Möchte dich kennenlernen':'Von dir angefragt'}</Text></View></Row>
<Row style={{marginTop:13}}>{c.recipient_id===me?<><Button title="Annehmen" small disabled={disabled} onPress={()=>respond(c.id,'accepted')} style={{flex:1}}/><Button title="Ablehnen" mode="outline" small disabled={disabled} onPress={()=>respond(c.id,'declined')} style={{flex:1}}/></>:<Button title="Zurückziehen" small mode="outline" disabled={disabled} onPress={()=>respond(c.id,'cancelled')}/>}</Row>
</Card>)}
<Text style={styles.sectionTitle}>Bestätigte Kontakte</Text>
{accepted.length===0?<Blank title="Noch keine Kontakte" body="Bestätigte Familien erscheinen hier."/>:accepted.map(c=>{const uid=other(c);return <Card key={c.id} style={{marginBottom:10}}>
<Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text><Text style={styles.micro}>{blocked(uid)?'Blockiert':'Kontakt bestätigt'}</Text></View></Row>
<Row style={{marginTop:12,flexWrap:'wrap'}}>
<Button title="Profil ansehen" small mode="outline" disabled={blocked(uid)} onPress={()=>onShowFamily(uid)}/>
<Button title="Nachrichten" small disabled={blocked(uid)} onPress={()=>onChat(c.id)} style={{flex:1}}/>
{blocked(uid)?<Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(uid)}/>:<Button title="Blockieren" small mode="ghost" onPress={()=>onBlock(uid)}/>}
</Row>
</Card>;})}
</ScrollView>;
}
function ChatList({contacts,me,nameOf,messages,onChat,blocked,chatCounts={}}){
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<H sub="Persönlich und privat – nur mit bestätigten Familien.">Nachrichten</H>
{contacts.length===0?<Blank title="Noch keine Gespräche" body="Sobald eine Kontaktanfrage angenommen wurde, kannst du eine Nachricht schreiben."/>:
contacts.map(c=>{const uid=c.sender_id===me?c.recipient_id:c.sender_id;const last=messages.filter(m=>m.contact_id===c.id)[0];return <Pressable key={c.id} onPress={()=>onChat(c.id)}>
<Card style={{marginBottom:11}}><Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text><Text numberOfLines={1} style={styles.sub}>{blocked(uid)?'Kontakt blockiert':last?.body||'Noch keine Nachrichten'}</Text></View>
{chatCounts[c.id]>0?<View style={styles.chatUnreadBadge}><Text style={styles.chatUnreadText}>{chatCounts[c.id]>99?'99+':chatCounts[c.id]}</Text></View>:<Text style={{fontSize:23,color:C.accent}}>›</Text>}
</Row></Card>
</Pressable>;})}
</ScrollView>;
}
function ChatScreen({contact,me,nameOf,messages,disabled,blocked,send,onReport,onBlock,onRefresh}) {
const [text,setText]=useState('');
if(!contact)return <Blank title="Gespräch nicht verfügbar" body="Kontakt ist nicht mehr bestätigt oder wurde verborgen."/>;
const other=contact.sender_id===me?contact.recipient_id:contact.sender_id;
const sorted=[...messages].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)||String(a.id).localeCompare(String(b.id)));
let consecutiveFromMe=0;
for(let i=sorted.length-1;i>=0;i--){
  if(sorted[i].sender_id!==me)break;
  consecutiveFromMe++;
  if(consecutiveFromMe>=5)break;
}
const waitingForReply=consecutiveFromMe>=5;
async function submit(){const body=text.trim();if(!body||waitingForReply)return; const ok=await send(body);if(ok)setText('');}
return <View style={{flex:1}}>
<Row style={styles.chatHeader}><Avatar name={nameOf(other)} size={38}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other)}</Text><Text style={styles.micro}>Privates Gespräch</Text></View><Button title="Blockieren" small mode="ghost" onPress={()=>onBlock(other)}/></Row>
<ScrollView style={{flex:1}} contentContainerStyle={{padding:16}} keyboardShouldPersistTaps="handled">
{sorted.length===0?<Blank title="Sag Hallo!" body="Hier beginnt euer privates Gespräch."/>:sorted.map(m=><View key={m.id} style={[styles.bubble,m.sender_id===me?styles.mine:styles.theirs]}>
<Text style={[styles.bubbleText,m.sender_id===me&&{color:C.white}]}>{m.body}</Text>
<Row style={{justifyContent:'space-between',marginTop:7}}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>{formatDate(m.created_at)}</Text><Pressable onPress={()=>onReport(m.id)}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>Melden</Text></Pressable></Row>
</View>)}
</ScrollView>
{blocked(other)?<Info warning>Du hast diese Person blockiert. Neue Nachrichten sind nicht erlaubt.</Info>:<>
<View style={styles.chatLimitBox}>
 <Text style={styles.chatLimitText}>{waitingForReply?
  'Du hast fünf Nachrichten hintereinander geschickt. Bitte warte auf eine Antwort.':
  consecutiveFromMe>0?`${consecutiveFromMe} von 5 Nachrichten ohne Antwort gesendet.`:
  'Bis zu fünf Nachrichten hintereinander sind möglich.'}</Text>
 {waitingForReply?<Pressable accessibilityRole="button" accessibilityLabel="Neue Antworten prüfen" onPress={onRefresh}
  style={styles.chatLimitRefresh}><Text style={styles.chatLimitRefreshText}>↻ Antworten prüfen</Text></Pressable>:null}
</View>
<Row style={styles.chatComposer}><TextInput placeholder={waitingForReply?'Antwort abwarten …':'Nachricht schreiben …'}
 value={text} onChangeText={setText} maxLength={2000} multiline editable={!waitingForReply&&!disabled}
placeholderTextColor="#9AAFB4" style={[styles.input,{flex:1,maxHeight:100,marginBottom:0}]} />
<Button title="Senden" small disabled={disabled||waitingForReply||!text.trim()} onPress={submit}/></Row>
</>}
</View>;
}
function EventsScreen({events,eventRequests,me,active,busy,profiles,showForm,setShowForm,createEvent,requestEvent,replyEvent,reportEvent,initialRegion=''}){
const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [region,setRegion]=useState('');
const [date,setDate]=useState('');const [time,setTime]=useState('15:00');const [count,setCount]=useState('10');const [visibility,setVisibility]=useState('community');
const [section,setSection]=useState('kalender');
const eventsScroll=useRef(null);
function planIdea(idea,place){
 if(!idea)return;
 setTitle((idea.title+' – Familientreffen').slice(0,100));
 setDescription(('Gemeinsam '+idea.description+'\n\nBitte Treffpunkt, Uhrzeit und alle Details erst gemeinsam abstimmen.').slice(0,1000));
 setRegion(place.slice(0,80));
 setDate('');
 setShowForm(true);
 setSection('kalender');
 requestAnimationFrame(()=>eventsScroll.current?.scrollTo({y:0,animated:true}));
 if(!active)Alert.alert('Profilfreigabe erforderlich','Du kannst den Termin vorbereiten, aber erst nach der Profilfreigabe einreichen.');
}
const names=(uid)=>profiles.find(p=>p.user_id===uid)?.display_name||'Familie';
async function submit(){
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return Alert.alert('Termin prüfen','Bitte Datum als JJJJ-MM-TT und Zeit als HH:MM eingeben.');
const start=givenDate(date,time);const max=parseInt(count,10);
if(!start||start<=new Date()||title.trim().length<4||max<2||max>50)return Alert.alert('Bitte prüfen','Titel, zukünftigen Beginn und Teilnehmerzahl (2–50) korrigieren.');
const ok=await createEvent({title:safeString(title,100),description:safeString(description,1000),region_label:safeString(region,80),starts_at:start.toISOString(),ends_at:new Date(start.getTime()+2*60*60*1000).toISOString(),max_participants:max,visibility});
if(ok){setShowForm(false);setTitle('');setDescription('');setDate('');}
}
const upcoming=events.filter(e=>new Date(e.ends_at)>new Date());
return <ScrollView ref={eventsScroll} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<H sub="Gemeinsam etwas unternehmen und neue Familien kennenlernen.">Familienkalender</H>
<View style={styles.outingSectionBar}>
  <Pressable accessibilityRole="button" accessibilityState={{selected:section==='kalender'}}
    onPress={()=>setSection('kalender')} style={[styles.outingSectionButton,section==='kalender'&&styles.outingSectionButtonActive]}>
    <Text style={[styles.outingSectionText,section==='kalender'&&styles.outingSectionTextActive]}>Gemeinsame Treffen</Text>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityState={{selected:section==='ideen'}}
    onPress={()=>setSection('ideen')} style={[styles.outingSectionButton,section==='ideen'&&styles.outingSectionButtonActive]}>
    <Text style={[styles.outingSectionText,section==='ideen'&&styles.outingSectionTextActive]}>Ausflugsideen</Text>
  </Pressable>
</View>
{section==='ideen'?<FamilyOutingIdeas initialRegion={initialRegion} onPlan={planIdea} userId={me}/>:<>
<Text style={[styles.micro,{marginBottom:15}]}>Termine werden vor ihrer Veröffentlichung geprüft. Öffentliche Privatadressen bitte vermeiden.</Text>
<Button title={showForm?'Formular schließen':'＋ Aktivität erstellen'} disabled={!active} onPress={()=>setShowForm(!showForm)}/>
{showForm?<Card style={{marginTop:14}}>
<Text style={styles.cardTitle}>Neue Aktivität</Text><Text style={[styles.sub,{marginBottom:15}]}>Vor Veröffentlichung wird der Termin geprüft. Bitte keine Privatadressen veröffentlichen.</Text>
<Input label="Titel" placeholder="Spielplatztreffen am Samstag" maxLength={100} value={title} onChangeText={setTitle}/>
<Input label="Beschreibung" multiline maxLength={1000} value={description} onChangeText={setDescription}/>
<Input label="Grobe Region" placeholder="z. B. Potsdam" maxLength={80} value={region} onChangeText={setRegion}/>
<Input label="Datum (JJJJ-MM-TT)" placeholder="2026-12-05" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation"/>
<Input label="Uhrzeit (HH:MM)" placeholder="15:00" value={time} onChangeText={setTime}/>
<Input label="Maximale Personen (2–50)" value={count} onChangeText={setCount} keyboardType="number-pad"/>
<Text style={styles.label}>Wer soll den Termin sehen?</Text><Row style={{marginBottom:15}}><Chip text="Alle geprüften Familien" selected={visibility==='community'} onPress={()=>setVisibility('community')}/><Chip text="Nur Kontakte" selected={visibility==='contacts'} onPress={()=>setVisibility('contacts')}/></Row>
<Button title="Zur Freigabe einreichen" disabled={busy||!active} onPress={submit}/>
</Card>:null}
<Text style={[styles.sectionTitle,{marginTop:22}]}>Anstehende Treffen</Text>
{upcoming.length===0?<Blank title="Noch keine Treffen" body="Neue Aktivitäten erscheinen hier nach Freigabe."/>:upcoming.map(e=>{
const self=e.organizer_id===me;const request=eventRequests.find(x=>x.event_id===e.id&&x.requester_id===me);
const pending=eventRequests.filter(x=>x.event_id===e.id&&x.status==='requested');
return <Card key={e.id} style={{marginBottom:12}}>
<Text style={styles.eyebrow}>▦ {formatDate(e.starts_at)}</Text><Text style={[styles.cardTitle,{fontSize:19,marginTop:5}]}>{e.title}</Text>
<Text style={[styles.sub,{marginTop:7}]}>{e.description||'Gemeinsames Familientreffen'}</Text>
<Text style={[styles.micro,{marginTop:10}]}>⌖ {e.region_label||'Region nach Absprache'} · max. {e.max_participants} Personen</Text>
{self?<Info warning>{e.moderation_status==='pending'?'Dein Termin wartet auf Freigabe.':'Du organisierst diesen Termin.'}</Info>:
request?<Info>Deine Teilnahme: {request.status==='approved'?'bestätigt':request.status==='requested'?'angefragt':request.status==='declined'?'abgelehnt':'zurückgezogen'}</Info>:
<Button title="Teilnahme anfragen" disabled={busy||!active} small style={{marginTop:12}} onPress={()=>requestEvent(e.id)}/>}
{self&&pending.length>0?<View style={{marginTop:12}}><Text style={styles.label}>Teilnahmeanfragen</Text>{pending.map(r=><View key={r.requester_id} style={{marginTop:9}}><Text style={styles.body}>{names(r.requester_id)}</Text><Row><Button title="Annehmen" small disabled={busy} onPress={()=>replyEvent(e.id,r.requester_id,'approved')}/><Button title="Ablehnen" small mode="outline" disabled={busy} onPress={()=>replyEvent(e.id,r.requester_id,'declined')}/></Row></View>)}</View>:null}
{!self?<Pressable onPress={()=>reportEvent(e.id)} style={{marginTop:12}}><Text style={styles.micro}>⚑ Veranstaltung melden</Text></Pressable>:null}
</Card>;
})}
</>}
</ScrollView>;
}
function ProfileScreen({profile,verification,membership,active,photos,photosUrls,busy,save,uploadPhoto,deletePhoto,reportPhoto,blocks,onUnblock,changePassword,openInfo,signOut}){
const [form,setForm]=useState(blankProfile);
const [photoCaption,setPhotoCaption]=useState('');
const [selectedPhoto,setSelectedPhoto]=useState(null);
const [photoPickerBusy,setPhotoPickerBusy]=useState(false);
const [newPassword,setNewPassword]=useState('');
const [activeMenu,setActiveMenu]=useState('momente');
const profileScrollRef=useRef(null);
const profilePanelYRef=useRef(0);
const [addingMoment,setAddingMoment]=useState(false);
const [viewingPhotoId,setViewingPhotoId]=useState(null);
useEffect(()=>{if(profile)setForm({...blankProfile,...profile});},[profile?.updated_at,profile?.user_id]);
async function submit(){
 if(form.display_name.trim().length<2)return Alert.alert('Anzeigename fehlt','Bitte mindestens zwei Zeichen angeben.');
 await save({display_name:safeString(form.display_name,60),region_label:safeString(form.region_label,80),about:safeString(form.about,500),interests:(form.interests||[]).slice(0,12),is_discoverable:!!form.is_discoverable});
}
function toggle(i){
 if(!form.interests?.includes(i)&&(form.interests||[]).length>=12){
  Alert.alert('12 Interessen ausgewählt','Du kannst bis zu 12 Hobbys, Aktivitäten und Treffideen speichern. Entferne zuerst eine andere Auswahl.');
  return;
 }
 setForm(f=>({...f,interests:f.interests.includes(i)?f.interests.filter(x=>x!==i):[...f.interests,i]}));
}
async function updatePassword(){if(newPassword.length<12)return Alert.alert('Passwort','Bitte mindestens 12 Zeichen verwenden.');const ok=await changePassword(newPassword);if(ok)setNewPassword('');}
async function selectDraftPhoto(){
 if(busy||photoPickerBusy)return;
 setPhotoPickerBusy(true);
 try{
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,quality:0.85,exif:false});
  if(!result.canceled&&result.assets?.[0]?.uri)setSelectedPhoto(result.assets[0]);
 }catch(e){Alert.alert('Fotoauswahl fehlgeschlagen',humanError(e));}
 finally{setPhotoPickerBusy(false);}
}
async function submitDraftPhoto(){
 if(!selectedPhoto||busy||photoPickerBusy)return;
 // Explain actual third-party processing before starting a nonreversible upload.
 Alert.alert('Hinweis zur Foto-Sicherheitsprüfung',
  'Vor der Freigabe werden hochgeladene Fotos durch einen externen Moderationsdienst von OpenAI automatisch geprüft. Dabei wird der Bildinhalt an diesen Dienst übermittelt. Bitte in der Beta keine Kinderfotos hochladen. Du kannst den Upload jetzt abbrechen.',
  [
   {text:'Abbrechen',style:'cancel'},
   {text:'Foto hochladen',onPress:async()=>{
     const ok=await uploadPhoto(selectedPhoto,photoCaption);
     if(ok){setSelectedPhoto(null);setPhotoCaption('');setAddingMoment(false);}
   }}
  ]);
}
const heroPhoto=photos.find(p=>p.moderation_status==='approved'&&photosUrls[p.id]);
return <><ScrollView ref={profileScrollRef} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
 <View style={styles.profileHero}>
  <View pointerEvents="none" style={styles.profileHeroSun}/>
  <Text style={styles.profileEyebrow}>✦ DAS SIND WIR</Text>
  <Row style={{alignItems:'flex-start',marginTop:14}}>
   <Avatar size={72} name={profile?.display_name} uri={heroPhoto?photosUrls[heroPhoto.id]:null}/>
   <View style={{flex:1,paddingTop:3}}>
    <Text style={styles.profileName}>{profile?.display_name||'Deine Familie'}</Text>
    <Text style={styles.profileRegion}>⌖ {profile?.region_label||'Region noch nicht angegeben'}</Text>
    <Text style={styles.profileStatus}>{active?'✓ Profil freigegeben':'⌛ Prüfung ausstehend'}</Text>
   </View>
  </Row>
  <Text style={styles.profileAbout}>{profile?.about||'Erzählt anderen Familien etwas über euch und eure Lieblingsausflüge.'}</Text>
  <View style={styles.chipsRow}>{(profile?.interests||[]).slice(0,8).map(i=><Chip key={i} text={i}/>)}</View>
  <Text style={[styles.micro,{marginTop:16,color:'#8B6327'}]}>Euer Familienprofil: {(profile?.interests||[]).length} Interessen · {photos.length} Momente</Text>
 </View>
 {!active?<Info warning>Angaben und Bilder sind erst nach Freigabe für andere Familien sichtbar.</Info>:null}
 <Text style={[styles.sectionTitle,{marginTop:22,marginBottom:7}]}>Dein Familienbereich</Text>
 <Text style={[styles.sub,{marginTop:0,marginBottom:15}]}>Wähle aus, was du ergänzen oder einstellen möchtest.</Text>
 <View style={styles.profileMenuGrid}>{PROFILE_MENUS.map(([id,number,title,subtitle])=><Pressable key={id}
  accessibilityRole="button" accessibilityLabel={title} accessibilityState={{selected:activeMenu===id}}
  onPress={()=>{setActiveMenu(id);requestAnimationFrame(()=>profileScrollRef.current?.scrollTo({y:Math.max(0,profilePanelYRef.current-14),animated:true}));}} style={({pressed})=>[styles.profileMenuTile,activeMenu===id&&styles.profileMenuTileActive,pressed&&{opacity:.8}]}>
   <Text style={styles.profileMenuNumber}>{number}</Text>
   <Text style={styles.profileMenuTitle}>{title}</Text>
   <Text style={styles.profileMenuSubtitle}>{subtitle}</Text>
  </Pressable>)}</View>
 <View onLayout={e=>{profilePanelYRef.current=e.nativeEvent.layout.y;}}>
 {activeMenu==='momente'?<Card style={{marginTop:18}}>
  <Row style={{alignItems:'flex-start',justifyContent:'space-between'}}>
   <View style={{flex:1}}>
    <Text style={styles.sectionTitle}>☀ Unsere Momente</Text>
    <Text style={[styles.sub,{marginTop:-7,marginBottom:13}]}>Einblicke in euer Familienleben – keine öffentliche Pinnwand.</Text>
   </View>
  </Row>
  <Button title={addingMoment?'✕ Fotoeingabe schließen':'＋ Erinnerung hinzufügen'} mode="outline" onPress={()=>setAddingMoment(v=>!v)}/>
  {addingMoment?<View style={{marginTop:17}}>
   <Text style={[styles.micro,{marginBottom:14}]}>Nur bestätigte Kontakte sehen freigegebene Bilder. Bitte in der Beta keine Kinderfotos hochladen.</Text>
   <Button title={selectedPhoto?'Anderes Foto auswählen':'Foto auswählen'} disabled={busy||photoPickerBusy} mode="ghost" onPress={selectDraftPhoto}/>
   {selectedPhoto?<View style={{marginTop:14}}>
    <Image source={{uri:selectedPhoto.uri}} style={styles.photoDraftPreview} resizeMode="contain"/>
    <Input label="Kleine Geschichte zum Foto (optional)" value={photoCaption} onChangeText={setPhotoCaption} maxLength={200} placeholder="Was habt ihr Schönes erlebt?"/>
    <Text style={[styles.micro,{marginBottom:12}]}>Foto und Beschreibung werden zunächst geprüft und bis zur Freigabe nicht für andere Familien angezeigt.</Text>
    <Row style={{alignItems:'stretch'}}>
     <Button title="Verwerfen" mode="ghost" small disabled={busy||photoPickerBusy} style={{flex:1}} onPress={()=>{setSelectedPhoto(null);setPhotoCaption('');}}/>
     <Button title={busy?'Wird eingereicht …':'Foto einreichen'} disabled={busy||photoPickerBusy} small style={{flex:1}} onPress={submitDraftPhoto}/>
    </Row>
   </View>:null}
  </View>:null}
  {photos.length===0?<View style={styles.emptyMoments}><Text style={{fontSize:30,color:C.coral}}>♡</Text><Text style={[styles.cardTitle,{textAlign:'center'}]}>Euer erstes Foto fehlt noch</Text><Text style={[styles.sub,{textAlign:'center'}]}>Ein schöner Ausflug, ein Lieblingsort oder ein besonderer Moment.</Text></View>:
  <View style={[styles.photoGrid,{marginTop:16}]}>{photos.map(p=><View key={p.id} style={styles.momentTile}>
   <Pressable accessibilityRole="button" accessibilityLabel={'Foto vergrößern: '+(p.caption||'Familienmoment')}
    disabled={!photosUrls[p.id]} onPress={()=>setViewingPhotoId(p.id)} style={styles.momentPreviewPressable}>
    {photosUrls[p.id]?<Image source={{uri:photosUrls[p.id]}} style={styles.momentImage}/>:<View style={[styles.momentImage,{backgroundColor:C.pale,justifyContent:'center',alignItems:'center'}]}><Text style={styles.micro}>Bild wird geladen</Text></View>}
    {photosUrls[p.id]?<View style={styles.momentZoomBadge}><Text style={styles.momentZoomText}>↗ Ansehen</Text></View>:null}
   </Pressable>
   <Text style={styles.momentCaption} numberOfLines={3}>{p.caption||'Ein Familienmoment'}</Text>
   <Text style={[styles.micro,{color:p.moderation_status==='approved'?C.accent:C.warningText}]}>{p.moderation_status==='approved'?'✓ Freigegeben':p.moderation_status==='pending'?'⌛ In Prüfung':'Nicht freigegeben'}</Text>
   <Button title="Foto löschen" small mode="ghost" onPress={()=>deletePhoto(p.id)}/>
  </View>)}</View>}
 </Card>:null}

 {activeMenu==='steckbrief'?<Card style={{marginTop:17}}>
  <Text style={styles.sectionTitle}>✎ Euer Familien-Steckbrief</Text>
  <Text style={[styles.sub,{marginTop:-8,marginBottom:17}]}>Eine persönliche Vorstellung, ohne private Namen oder genaue Anschrift der Kinder preiszugeben.</Text>
  <Input label="Familienname / Anzeigename" value={form.display_name} onChangeText={x=>setForm(p=>({...p,display_name:x}))} maxLength={60} placeholder="Wie sollen andere euch nennen?"/>
  <Input label="Stadt / grobe Region" value={form.region_label} onChangeText={x=>setForm(p=>({...p,region_label:x}))} maxLength={80} placeholder="Bitte keine Wohnadresse eintragen"/>
  <Input label="Das macht uns als Familie aus" multiline value={form.about} onChangeText={x=>setForm(p=>({...p,about:x}))} maxLength={500} placeholder="Wie verbringt ihr eure Freizeit? Was ist euch wichtig? Welche Begegnungen wünscht ihr euch?"/>
  <Text style={[styles.micro,{marginBottom:16}]}>Noch {Math.max(0,500-(form.about||'').length)} Zeichen verfügbar. Diese Beschreibung kann in freigegebenen Familienprofilen angezeigt werden.</Text>
  <Button title={busy?'Wird gespeichert …':'Steckbrief speichern'} disabled={busy} onPress={submit}/>
 </Card>:null}
 {['hobbys','unterwegs','treffen'].includes(activeMenu)?<Card style={{marginTop:17}}>
  <Text style={styles.sectionTitle}>{activeMenu==='hobbys'?'♫ Hobbys & Interessen':activeMenu==='unterwegs'?'☀ Freizeit & Ausflüge':'♡ Treffen & Familienalltag'}</Text>
  <Text style={[styles.sub,{marginTop:-7,marginBottom:14}]}>Wähle, was zu euch passt. Alle drei Bereiche teilen sich dieselben 12 Interessen für eure Familiensuche.</Text>
  <View style={styles.profileInterestCount}><Text style={styles.profileInterestCountText}>{(form.interests||[]).length} von 12 ausgewählt</Text></View>
  {(INTEREST_GROUPS[activeMenu]||[]).map(([heading,items])=><View key={heading} style={{marginBottom:17}}>
   <Text style={styles.label}>{heading}</Text>
   <View style={[styles.chipsRow,{marginTop:3}]}>{items.map(i=><Chip key={i} text={i} selected={form.interests?.includes(i)} onPress={()=>toggle(i)}/>)}</View>
  </View>)}
  {(form.interests||[]).length>0?<View style={styles.profileSelectedInterests}>
   <Text style={styles.label}>Eure bisherige Auswahl – zum Entfernen antippen</Text>
   <View style={[styles.chipsRow,{marginTop:3,marginBottom:6}]}>{form.interests.map(i=><Chip key={i} text={i} selected onPress={()=>toggle(i)}/>)}</View>
  </View>:null}
  <Button title={busy?'Wird gespeichert …':'Interessen speichern'} disabled={busy} onPress={submit}/>
 </Card>:null}
 {activeMenu==='sichtbarkeit'?<Card style={{marginTop:17}}>
  <Text style={styles.sectionTitle}>♡ Sichtbarkeit & Privatsphäre</Text>
  <Text style={[styles.sub,{marginTop:-8,marginBottom:17}]}>Ihr entscheidet, ob eure Familie in der Suche vorgeschlagen wird.</Text>
  <Row style={{alignItems:'center',justifyContent:'space-between',marginBottom:17}}>
   <View style={{flex:1}}><Text style={styles.label}>In der Familiensuche erscheinen</Text>
    <Text style={styles.micro}>Nur wenn euer Profil freigegeben ist und ihr sichtbar sein möchtet.</Text></View>
   <Switch value={!!form.is_discoverable} onValueChange={value=>setForm(p=>({...p,is_discoverable:value}))} trackColor={{true:C.accent}}/>
  </Row>
  <View style={styles.profilePrivacyNote}>
   <Text style={styles.label}>Was sehen andere Familien?</Text>
   <Text style={styles.body}>Familienname, grobe Region, euer Beschreibungstext und ausgewählte Interessen können im freigegebenen Profil sichtbar sein.</Text>
   <Text style={[styles.body,{marginTop:9}]}>Freigegebene Familienfotos zeigen wir in der App nur bestätigten Kontakten. Bitte in der Beta keine Kinderfotos einstellen.</Text>
   <Text style={[styles.micro,{marginTop:11}]}>Das Ausschalten der Suche ersetzt kein Löschen des Profils. Die tatsächlichen Zugriffsmöglichkeiten müssen zusätzlich serverseitig geschützt sein.</Text>
   <Text style={[styles.micro,{marginTop:11}]}>Automatische Sicherheitsprüfung: Für die Moderation können von dir eingegebene Texte und hochgeladene Fotos an den externen Dienst OpenAI übermittelt werden. Der Supabase-Datenbankstandort Frankfurt allein bedeutet daher nicht, dass sämtliche Verarbeitung in Deutschland stattfindet.</Text>
  </View>
  <Button title={busy?'Wird gespeichert …':'Sichtbarkeit speichern'} disabled={busy} onPress={submit}/>
 </Card>:null}
 {activeMenu==='konto'?<Card style={{marginTop:17}}>
  <Text style={styles.sectionTitle}>⚙ Konto, Sicherheit & Hilfe</Text>
  <Text style={[styles.micro,{marginTop:-7,marginBottom:17}]}>Mitgliedschaft: {membership?.status||'–'} · Verifizierung: {verification?.status||'–'}</Text>
  <Text style={styles.label}>Informationen & Hilfen</Text>
  <Button title="Familien-Kompass öffnen" mode="outline" onPress={openInfo}/>
  <View style={styles.profilePrivacyNote}>
   <Text style={styles.label}>Datenschutz in der privaten Beta</Text>
   <Text style={styles.body}>Dein Familienprofil enthält nur freiwillige Angaben. Für Bilder gilt ein privater Speicher mit zeitlich begrenzten Fotolinks. Freigegebene Bilder können bestätigte Kontakte sehen.</Text>
   <Text style={[styles.body,{marginTop:9}]}>Texte und Fotos werden zur Sicherheitsprüfung teilweise an OpenAI übermittelt. Vor einer öffentlichen Veröffentlichung müssen Datenschutzhinweise, Vereinbarungen mit Dienstleistern, mögliche internationale Datenübermittlung sowie Lösch- und Auskunftsprozesse rechtlich geprüft werden.</Text>
   <Text style={[styles.micro,{marginTop:11}]}>Vermeide vollständige Namen und Wohnanschriften von Kindern. Bitte vorerst keine Kinderfotos hochladen.</Text>
  </View>
  <View style={styles.profileSettingsDivider}/>
  <Text style={styles.label}>Passwort ändern</Text>
  <Input label="Neues Passwort (mindestens 12 Zeichen)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false}/>
  <Button title="Passwort aktualisieren" small mode="outline" disabled={busy||newPassword.length<12} onPress={updatePassword}/>
  {blocks.length>0?<View style={{marginTop:21}}>
   <Text style={styles.label}>Blockierte Konten</Text>
   {blocks.map(b=><Row key={b.blocked_id} style={{marginTop:7,justifyContent:'space-between'}}>
    <Text style={styles.micro}>Konto …{b.blocked_id.slice(-7)}</Text>
    <Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(b.blocked_id)}/>
   </Row>)}
  </View>:null}
  <View style={styles.profileSettingsDivider}/>
  <Text style={[styles.micro,{marginBottom:11}]}>Melde dich nur ab, wenn du dein Konto verlassen möchtest. Deine gespeicherten Profilangaben bleiben bestehen.</Text>
  <Button title="Abmelden" mode="ghost" onPress={signOut}/>
 </Card>:null}
 </View>
</ScrollView>
<MomentViewer photos={photos} urls={photosUrls} activeId={viewingPhotoId} onSelect={setViewingPhotoId}
 onClose={()=>setViewingPhotoId(null)} isOwner/>
</>;
}
const KOMPASS_TOPICS=[
 {id:'schwangerschaft',label:'Wir erwarten ein Baby',symbol:'01',desc:'Schon vor der Geburt Wichtiges vorbereiten'},
 {id:'geburt',label:'Unser Kind ist geboren',symbol:'02',desc:'Die ersten Anmeldungen und Anträge'},
 {id:'elternzeit',label:'Elternzeit & Elterngeld',symbol:'03',desc:'Arbeitgeber und Elterngeldstelle'},
 {id:'betreuung',label:'Kita & Betreuung',symbol:'04',desc:'Platzsuche, Bedarf und Anträge'},
 {id:'finanzen',label:'Finanzielle Hilfen',symbol:'05',desc:'Leistungen entdecken und prüfen'},
 {id:'besonders',label:'Besondere Lebenslagen',symbol:'06',desc:'Hilfe bei besonderen Familiensituationen'}
];
// Alle Daten werden redaktionell gepflegt. Keine automatische Anspruchsprüfung oder Eingabe
// privater Kinderdaten. Bei einem rechtlichen oder regionalen Update Quellen neu prüfen.
const KOMPASS_STEPS=[
 {id:'elternzeit',title:'Elternzeit beim Arbeitgeber anmelden',topics:['schwangerschaft','elternzeit'],type:'Rechtliche Frist',when:'Grundsätzlich 7 Wochen vor Beginn; für Zeiträume zwischen dem 3. und 8. Geburtstag in der Regel 13 Wochen vorher. Sonderfälle beachten.',office:'Dein Arbeitgeber',docs:'Geplante Beginn- und Enddaten der Elternzeit und gegebenenfalls Angaben zum Bindungszeitraum.',tip:'Das ist eine Anmeldung beim Arbeitgeber, kein Antrag beim Jugendamt.',url:'https://familienportal.de/familienportal/familienleistungen/elternzeit/faq/wann-und-wie-muss-ich-elternzeit-beantragen--124810',source:'Familienportal des Bundes'},
 {id:'mutterschaft',title:'Mutterschaftsleistungen prüfen',topics:['schwangerschaft','elternzeit'],type:'Vor der Geburt prüfen',when:'Die gewöhnliche Schutzfrist beginnt 6 Wochen vor und endet 8 Wochen nach der Geburt. Es gibt Ausnahmen.',office:'Je nach Versicherungsstatus Krankenkasse, Arbeitgeber oder zuständige Bundesstelle.',docs:'Bescheinigung über den voraussichtlichen Geburtstermin sowie weitere Nachweise nach Einzelfall.',tip:'Der Anspruch und die Antragsstelle hängen unter anderem vom Versicherungsstatus ab.',url:'https://familienportal.de/familienportal/familienleistungen/mutterschaftsleistungen',source:'Familienportal des Bundes'},
 {id:'standesamt',title:'Geburt beim Standesamt anzeigen',topics:['geburt'],type:'Rechtliche Frist',when:'Grundsätzlich innerhalb einer Woche nach der Geburt.',office:'Standesamt am Geburtsort, häufig erledigt die Geburtsklinik die Anzeige.',docs:'Geburtsbescheinigung und standesamtlich erforderliche Identitäts- und Personenstandsnachweise.',tip:'Geburtsurkunden werden für verschiedene weitere Anträge benötigt.',url:'https://familienportal.de/familienportal/lebenslagen/schwangerschaft-geburt/anmeldung-standesamt',source:'Familienportal des Bundes'},
 {id:'versicherung',title:'Krankenversicherung des Babys klären',topics:['geburt'],type:'Zeitnah erledigen',when:'Nach der Geburt zeitnah die Versicherung des Kindes klären.',office:'Deine Krankenversicherung beziehungsweise die Versicherung des anderen Elternteils.',docs:'Angaben zur Geburt und gegebenenfalls Geburtsurkunde, Versicherungsnachweise.',tip:'Ob eine kostenfreie Familienversicherung möglich ist, hängt von eurer Situation ab.',url:'https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/staatliche-leistungen/kann-ich-meine-familie-bei-meiner-krankenversicherung-und-pflegeversicherung-mitversichern--125576',source:'Familienportal des Bundes'},
 {id:'elterngeld',title:'Elterngeld beantragen',topics:['geburt','elternzeit','finanzen'],type:'Wichtiger Zeitraum',when:'Nach der Geburt, möglichst in den ersten 3 Lebensmonaten. Höchstens 3 Lebensmonate rückwirkend.',office:'Die für den Wohnort zuständige Elterngeldstelle.',docs:'In der Regel Geburtsurkunde, Einkommensnachweise sowie je nach Situation Bescheinigungen zu Mutterschaftsleistungen oder Arbeitszeit.',tip:'Bei Elterngeld zählen Lebensmonate des Kindes, nicht automatisch Kalendermonate.',url:'https://familienportal.de/familienportal/familienleistungen/elterngeld/faq/wie-kann-ich-elterngeld-beantragen--124762',source:'Familienportal des Bundes'},
 {id:'kindergeld',title:'Kindergeld beantragen',topics:['geburt','finanzen'],type:'Zeitnah beantragen',when:'Nach der Geburt möglichst zeitnah. Rückwirkende Auszahlung grundsätzlich maximal 6 Monate.',office:'Familienkasse der Bundesagentur für Arbeit.',docs:'Steuer-Identifikationsnummern und weitere Angaben je Antragsfall.',tip:'Der Kindergeldantrag kann häufig online gestellt werden.',url:'https://www.arbeitsagentur.de/familie-und-kinder/infos-rund-um-kindergeld/kindergeld-anspruch-hoehe-dauer',source:'Bundesagentur für Arbeit'},
 {id:'kita',title:'Kita-Betreuung organisieren',topics:['betreuung'],type:'Regional unterschiedlich',when:'Fristen zur Platzanmeldung und zu etwaigen Bedarfsfeststellungen hängen vom Wohnort und der gewünschten Betreuung ab.',office:'Kita-Träger, Kommune oder Jugendamt je nach Wohnort.',docs:'In der Regel Angaben zum Kind und Betreuungswunsch; weitere Nachweise je nach Kommune und Betreuungsumfang.',tip:'Ein Rechtsanspruch und eine Zusage für eine bestimmte Einrichtung sind nicht dasselbe. Informiere dich frühzeitig bei deiner Kommune.',url:'https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/kinderbetreuung',source:'Familienportal des Bundes'},
 {id:'kinderzuschlag',title:'Kinderzuschlag prüfen',topics:['finanzen'],type:'Antrag wichtig',when:'Grundsätzlich nicht rückwirkend; Bewilligungszeitraum regelmäßig 6 Monate.',office:'Familienkasse der Bundesagentur für Arbeit.',docs:'Vor allem Einkommensnachweise der letzten 6 Monate, Angaben zu Wohnkosten und ggf. Vermögen.',tip:'Ein Anspruch hängt unter anderem von Haushalt und Einkommen ab. Online-Prüfung und Antrag sind getrennte Schritte.',url:'https://www.arbeitsagentur.de/familie-und-kinder/kinderzuschlag-verstehen/kinderzuschlag-anspruch-hoehe-dauer',source:'Bundesagentur für Arbeit'},
 {id:'wohngeld',title:'Wohngeld prüfen',topics:['finanzen'],type:'Antragsmonat relevant',when:'In der Regel ab dem Monat der Antragstellung, nicht für beliebig frühere Monate.',office:'Wohngeldbehörde des Wohnorts.',docs:'Einkommensnachweise, Miet- oder Wohnkosten und Haushaltsangaben.',tip:'Je nach anderer Leistung kann ein Wohngeldanspruch ausgeschlossen sein.',url:'https://familienportal.de/familienportal/familienleistungen/weitere-leistungen/wohngeld',source:'Familienportal des Bundes'},
 {id:'buteil',title:'Bildung und Teilhabe prüfen',topics:['betreuung','finanzen'],type:'Mögliche Unterstützung',when:'Bei bestehendem Leistungsanspruch möglichst frühzeitig bei der örtlich zuständigen Stelle erkundigen.',office:'Je nach Leistungsart örtliche Kommune, Jobcenter oder andere zuständige Stelle.',docs:'Nachweis über den Leistungsbezug und die jeweilige Aktivität oder Ausgabe, je nach Verfahren.',tip:'Unter anderem können Mittagessen in Kita oder Schule und Ausflüge unterstützt werden.',url:'https://familienportal.de/familienportal/familienleistungen/bildung-und-teilhabe',source:'Familienportal des Bundes'},
 {id:'unterhaltsvorschuss',title:'Unterhaltsvorschuss prüfen',topics:['besonders','finanzen'],type:'Bei Bedarf prüfen',when:'Wenn ein Kind bei einem alleinerziehenden Elternteil lebt und Unterhalt ausbleibt oder zu wenig gezahlt wird, Voraussetzungen prüfen.',office:'Unterhaltsvorschussstelle, oft beim Jugendamt.',docs:'Je nach Fall Angaben zu Eltern, Kind, Unterhaltszahlungen und bisherigen Bemühungen.',tip:'Die Anspruchsvoraussetzungen unterscheiden sich nach Situation und Alter des Kindes.',url:'https://familienportal.de/familienportal/familienleistungen/unterhaltsvorschuss',source:'Familienportal des Bundes'},
 {id:'mutterkind',title:'Bundesstiftung Mutter und Kind prüfen',topics:['schwangerschaft','besonders'],type:'Wichtiger Zeitpunkt',when:'Hilfe bei finanzieller Notlage nur während der Schwangerschaft beantragen.',office:'Anerkannte Schwangerschaftsberatungsstelle.',docs:'Individuelle Angaben zur Schwangerschaft und zur finanziellen Situation.',tip:'Nicht bis nach der Geburt warten, wenn diese Hilfe in Betracht kommt.',url:'https://familienportal.de/bmbfsfj/themen/familie/schwangerschaft-und-kinderwunsch/bundesstiftung-mutter-und-kind/bundesstiftung-mutter-und-kind-73522',source:'Bundesfamilienministerium'},
 {id:'bayern-kita',land:'09',title:'Kita-Betreuungsbedarf in Bayern melden',topics:['betreuung'],type:'Landesrechtlicher Vorlauf',when:'In Bayern muss der Betreuungsbedarf mindestens 3 Monate vor dem gewünschten Betreuungsbeginn angemeldet werden.',office:'Je nach Gemeinde: Kommune oder örtlicher Träger. Bei erfolgloser Platzsuche hilft das Jugendamt des Landkreises oder der kreisfreien Stadt.',docs:'Betreuungswunsch, Daten des Kindes und je nach Verfahren weitere Nachweise. Konkrete Unterlagen bei der Kommune prüfen.',tip:'Eine Kita-Platzanmeldung und die formale Geltendmachung eines Rechtsanspruchs sind nicht automatisch dasselbe.',url:'https://www.stmas.bayern.de/themen/kindertagesbetreuung/angebote/',source:'Bayerisches Staatsministerium für Familie, Arbeit und Soziales'},
 {id:'bayern-elterngeld',land:'09',title:'Bayerische Elterngeldstelle finden',topics:['geburt','elternzeit','finanzen'],type:'Zuständigkeit nach Region',when:'Nach der Geburt den Antrag bei der zuständigen Regionalstelle des ZBFS einreichen; bundesweit gelten die Regeln zur Rückwirkung.',office:'Zentrum Bayern Familie und Soziales (ZBFS), zuständige Regionalstelle nach Wohnort.',docs:'Der Zuständigkeitsfinder führt zur richtigen Regionalstelle und zum Antragsweg.',tip:'Die Bearbeitung erfolgt nicht grundsätzlich durch das örtliche Jugendamt. Die konkrete Regionalstelle hängt vom Wohnort ab.',url:'https://www.zbfs.bayern.de/zustaendigkeitenfinder.php',source:'ZBFS – Zentrum Bayern Familie und Soziales'},
 {id:'landshut-kita',kreise:['09274'],title:'Kita-Beratung im Landkreis Landshut',topics:['betreuung'],type:'Lokaler Kontakt',when:'Bei Fragen zur Tagespflege oder zu Kita-Angeboten im Landkreis frühzeitig Kontakt aufnehmen; bundes- und landesrechtliche Fristen gesondert beachten.',office:'Kreisjugendamt Landshut, Fachbereich Kindertagesbetreuung.',docs:'Je nach Anliegen Angaben zum Wohnort, Betreuungstyp und gewünschten Beginn.',tip:'Das Landratsamt informiert zu Einrichtungen und Kindertagespflege im Landkreis. Für die Stadt Landshut können andere Stellen zuständig sein.',url:'https://www.landkreis-landshut.de/themen/kinder-jugend-und-familie/kindertagesstaetten-und-kinderbetreuung/',source:'Landkreis Landshut'},
 {id:'landshut-elterngeld',kreise:['09261','09274'],title:'Elterngeldstelle für Landshut und Landkreis',topics:['geburt','elternzeit','finanzen'],type:'Regionalstelle bestätigt',when:'Bundesweite Antragsfristen beachten; die Zuständigkeitsseite informiert über den Antragsweg.',office:'ZBFS Region Niederbayern, Friedhofstraße 7, 84028 Landshut.',docs:'ZBFS-Zuständigkeitsfinder für die passende Stelle und Antragsunterlagen verwenden.',tip:'Nicht beim Kreisjugendamt Landshut beantragen; zuständig ist für diese Region das ZBFS.',url:'https://www.zbfs.bayern.de/behoerde/landesbehoerde/niederbayern/',source:'ZBFS Niederbayern'},
 {id:'oder-spree-kita',regional:true,title:'Kita-Bedarfsfeststellung im Landkreis Oder-Spree',topics:['betreuung'],type:'Empfohlener Vorlauf',when:'Falls ein gesonderter Antrag nötig ist: etwa 6–8 Wochen vor Betreuungsbeginn einreichen. Dies ist nicht der Termin einer garantierten Bescheiderteilung.',office:'Jugendamt Landkreis Oder-Spree, Breitscheidstraße 7, 15848 Beeskow.',docs:'Bei Bedarf unter anderem Altersnachweis und Nachweise zur erforderlichen Betreuungszeit, je nach Fall.',tip:'Bei Kindern ab 1 Jahr bis zur Einschulung ist bis zu 30 Wochenstunden kein gesonderter Antrag zur Bedarfsfeststellung nötig; über 30 Stunden in der Regel schon. Andere Altersgruppen haben andere Regeln. Platzanmeldung separat klären.',url:'https://www.landkreis-oder-spree.de/Service-Aktuelles/Service/Was-erledige-ich-wo-/Rechtsanspruch-auf-Kindertagesbetreuung.php?FID=2426.44.1&ModID=10',source:'Landkreis Oder-Spree'}
];
function InfoScreen(){
const [topic,setTopic]=useState('schwangerschaft');
const [land,setLand]=useState(null);
const [kreis,setKreis]=useState(null);
const [picker,setPicker]=useState(null);
const [pickerSearch,setPickerSearch]=useState('');
const [expanded,setExpanded]=useState(null);
const chosen=KOMPASS_TOPICS.find(t=>t.id===topic);
const landName=BUNDESLAENDER.find(([id])=>id===land)?.[1];
const kreisName=(KREISE_NACH_LAND[land]||[]).find(([id])=>id===kreis)?.[1];
const pickerOptions=picker==='land'?BUNDESLAENDER:(KREISE_NACH_LAND[land]||[]);
const filteredOptions=pickerOptions.filter(([,name])=>name.toLocaleLowerCase('de-DE').includes(pickerSearch.trim().toLocaleLowerCase('de-DE')));
const tasks=KOMPASS_STEPS.filter(t=>t.topics.includes(topic)&&(!t.regional||kreis==='12067')&&(!t.land||t.land===land)&&(!t.kreise||t.kreise.includes(kreis)));
function openPicker(which){setPickerSearch('');setPicker(which);}
function selectRegion(id){
  if(picker==='land'){setLand(id);setKreis(null);}
  if(picker==='kreis')setKreis(id);
  setExpanded(null);setPicker(null);setPickerSearch('');
}
function openSource(url){Linking.openURL(url).catch(()=>Alert.alert('Link nicht geöffnet','Bitte die offizielle Seite später erneut öffnen.'));}
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
 <View style={styles.kompassHero}>
  <View style={styles.kompassSun} pointerEvents="none"/>
  <Text style={styles.kompassEyebrow}>☀ FAMILIENFUNKE HILFT</Text>
  <Text style={styles.kompassTitle}>Dein Familien-Kompass</Text>
  <Text style={styles.kompassSubtitle}>Anträge, Fristen und zuständige Stellen – endlich übersichtlich an einem Ort.</Text>
 </View>
 <Text style={[styles.sectionTitle,{marginTop:8}]}>1. Was beschäftigt euch?</Text>
 <View style={styles.kompassTopicGrid}>{KOMPASS_TOPICS.map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityState={{selected:topic===t.id}}
  onPress={()=>{setTopic(t.id);setExpanded(null);}} style={[styles.kompassTopic,topic===t.id&&styles.kompassTopicSelected]}>
  <Text style={styles.kompassTopicNumber}>{t.symbol}</Text>
  <Text style={styles.kompassTopicTitle}>{t.label}</Text>
 </Pressable>)}</View>
 <Text style={[styles.sectionTitle,{marginTop:24}]}>2. Wo wohnt ihr?</Text>
 <Text style={[styles.sub,{marginTop:-7,marginBottom:14}]}>Wählt zuerst euer Bundesland und dann euren Landkreis oder eure kreisfreie Stadt.</Text>
 <Text style={styles.label}>Bundesland</Text>
 <Pressable accessibilityRole="button" accessibilityLabel={'Bundesland auswählen, '+(landName||'noch nicht ausgewählt')}
   onPress={()=>openPicker('land')} style={styles.kompassPickerButton}>
  <Text style={[styles.kompassPickerValue,!landName&&styles.kompassPickerPlaceholder]}>{landName||'Bundesland auswählen'}</Text>
  <Text style={styles.kompassChevron}>⌄</Text>
 </Pressable>
 <Text style={[styles.label,{marginTop:17}]}>Landkreis oder kreisfreie Stadt</Text>
 <Pressable accessibilityRole="button" accessibilityState={{disabled:!land}}
   accessibilityLabel={'Landkreis oder kreisfreie Stadt auswählen, '+(kreisName||'noch nicht ausgewählt')}
   disabled={!land} onPress={()=>openPicker('kreis')}
   style={[styles.kompassPickerButton,!land&&styles.kompassPickerButtonDisabled]}>
  <Text style={[styles.kompassPickerValue,!kreisName&&styles.kompassPickerPlaceholder]}>{kreisName||(land?'Landkreis / Stadt auswählen':'Bitte zuerst Bundesland auswählen')}</Text>
  <Text style={styles.kompassChevron}>⌄</Text>
 </Pressable>
 {kreis==='12067'?<Text style={styles.kompassRegionNote}>✓ Pilotregion Landkreis Oder-Spree: lokale Kita-Bedarfsfeststellung recherchiert; weitere Themen folgen.</Text>:
  kreis==='09274'?<Text style={styles.kompassRegionNote}>✓ Landkreis Landshut: bayerische Kita-Fristen sowie erste lokale Kontakte und die Elterngeldstelle recherchiert.</Text>:
  kreis==='09261'?<Text style={styles.kompassRegionNote}>✓ Stadt Landshut: bayerische Regelungen und Elterngeldstelle recherchiert; städtische Kita-Stellen folgen.</Text>:
  kreis?<Text style={styles.kompassRegionNote}>{land==='09'?'✓ Bayerische Kita-Fristen und ZBFS-Zuständigkeit sind erfasst. ':''}Für {kreisName} werden weitere lokale Anträge, Zuständigkeiten und Sonderfristen noch geprüft. Bis dahin gelten die bundesweiten Grundlagen.</Text>:
  <Text style={styles.kompassRegionNote}>Die bundesweiten Informationen sind sofort nutzbar. Genaue lokale Behördenkontakte ergänzen wir Schritt für Schritt.</Text>}
 <Text style={[styles.micro,{marginBottom:20}]}>Deine Auswahl bleibt vorerst nur in dieser Ansicht und wird nicht in deinem Profil gespeichert.</Text>
 <Text style={styles.sectionTitle}>3. Euer möglicher Fahrplan</Text>
 <Text style={[styles.sub,{marginTop:-8,marginBottom:16}]}>{chosen?.desc} · {tasks.length} Informationskarten</Text>
 {tasks.map((item,i)=><Card key={item.id} style={{marginBottom:13,padding:16}}>
  <Pressable accessibilityRole="button" accessibilityLabel={item.title+'. Details '+(expanded===item.id?'schließen':'öffnen')}
   onPress={()=>setExpanded(v=>v===item.id?null:item.id)}>
   <Row style={{alignItems:'flex-start'}}>
    <View style={styles.kompassNumberCircle}><Text style={styles.kompassNumberText}>{i+1}</Text></View>
    <View style={{flex:1}}>
     <Text style={styles.cardTitle}>{item.title}</Text>
     <Text style={styles.kompassDue}>{item.type}</Text>
    </View>
    <Text style={{fontSize:22,color:C.accentDark}}>{expanded===item.id?'−':'+'}</Text>
   </Row>
   <Text style={[styles.sub,{marginTop:10}]}>{item.when}</Text>
   <Text style={[styles.micro,{marginTop:9,color:C.accentDark,fontWeight:'800'}]}>{expanded===item.id?'Details schließen':'Unterlagen, Zuständigkeit und Quelle ansehen'}</Text>
  </Pressable>
  {expanded===item.id?<View style={styles.kompassDetails}>
   <Text style={styles.label}>Zuständige Stelle</Text>
   <Text style={[styles.body,{marginBottom:13}]}>{item.office}</Text>
   <Text style={styles.label}>Was wird häufig benötigt?</Text>
   <Text style={[styles.body,{marginBottom:13}]}>{item.docs}</Text>
   <Text style={styles.label}>Gut zu wissen</Text>
   <Text style={[styles.body,{marginBottom:15}]}>{item.tip}</Text>
   <Button title={'Offizielle Quelle öffnen ↗'} mode="outline" onPress={()=>openSource(item.url)}/>
   <Text style={[styles.micro,{marginTop:10}]}>Quelle: {item.source} · redaktionell geprüft: 19.11.2026</Text>
  </View>:null}
 </Card>)}
 <Info>Diese Übersicht dient der Orientierung. Sie bestätigt keinen individuellen Anspruch, reicht keine Anträge ein und ersetzt keine Beratung. Fristen und Formulare können sich ändern. Vor dem Antrag immer die verlinkte offizielle Seite prüfen.</Info>
 <View style={{height:10}}/>
 <Text style={[styles.micro,{textAlign:'center'}]}>Persönliche Fristen und Erinnerungen folgen in späteren Versionen. Es werden hier keine persönlichen Antragsdaten gespeichert.</Text>
 <Modal visible={!!picker} animationType="slide" transparent onRequestClose={()=>setPicker(null)}>
  <View style={styles.kompassPickerShade}>
   <View style={styles.kompassPickerSheet}>
    <Row style={{justifyContent:'space-between',alignItems:'center',marginBottom:15}}>
     <View style={{flex:1}}><Text style={styles.cardTitle}>{picker==='land'?'Bundesland auswählen':'Landkreis oder Stadt auswählen'}</Text>
      <Text style={styles.micro}>{picker==='land'?'16 Bundesländer':(landName||'')} · {filteredOptions.length} Treffer</Text>
     </View>
     <Button small mode="ghost" title="✕ Schließen" onPress={()=>setPicker(null)}/>
    </Row>
    <TextInput style={styles.kompassPickerSearch} autoCapitalize="none" autoCorrect={false}
     placeholder={picker==='land'?'Bundesland suchen …':'Landkreis oder Stadt suchen …'}
     placeholderTextColor={C.muted} value={pickerSearch} onChangeText={setPickerSearch}/>
    <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1}} contentContainerStyle={{paddingBottom:20}}>
     {filteredOptions.length===0?<Text style={[styles.sub,{paddingVertical:18}]}>Keine passenden Orte gefunden.</Text>:null}
     {filteredOptions.map(([id,name])=><Pressable accessibilityRole="button" key={id}
       accessibilityState={{selected:id===(picker==='land'?land:kreis)}} onPress={()=>selectRegion(id)}
       style={[styles.kompassOption,(id===(picker==='land'?land:kreis))&&styles.kompassOptionSelected]}>
      <Text style={styles.kompassOptionName}>{name}</Text>
      <Text style={styles.kompassOptionCheck}>{id===(picker==='land'?land:kreis)?'✓':''}</Text>
     </Pressable>)}
    </ScrollView>
   </View>
  </View>
 </Modal>
</ScrollView>;
}
const styles=StyleSheet.create({
screen:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:'center',justifyContent:'center',gap:15,backgroundColor:C.bg},
scroll:{flex:1},content:{padding:19,paddingBottom:40},
brand:{fontSize:33,fontWeight:'900',color:C.ink,letterSpacing:-1.15,textAlign:'center'},
smallBrand:{fontSize:19,fontWeight:'900',color:C.ink,letterSpacing:-.7},tagline:{fontSize:15,color:C.muted,textAlign:'center',marginTop:9},
loginPage:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:20,backgroundColor:C.bg},
loginMark:{width:95,height:95,borderRadius:31,backgroundColor:C.coral,alignItems:'center',justifyContent:'center',marginBottom:22,transform:[{rotate:'-7deg'}]},
topBar:{minHeight:74,borderBottomWidth:1,borderBottomColor:'#F1E2CE',backgroundColor:'#FFFBF5',paddingHorizontal:19,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8},
headerIdentity:{flex:1,flexDirection:'row',alignItems:'center',gap:10},
headerHeartBadge:{width:38,height:38,borderRadius:13,backgroundColor:'#EC8775',alignItems:'center',justifyContent:'center'},
headerHeart:{fontSize:21,fontWeight:'900',color:C.white},
topHint:{fontSize:12,color:C.muted,marginTop:1,fontWeight:'600'},
card:{backgroundColor:C.white,borderRadius:25,padding:18,borderColor:C.line,borderWidth:1,shadowColor:'#C28368',shadowOpacity:0.07,shadowRadius:11,shadowOffset:{width:0,height:3},elevation:2},
hero:{backgroundColor:'#FFEEC8',borderRadius:28,paddingHorizontal:23,paddingVertical:27,marginBottom:25,overflow:'hidden',minHeight:238,borderColor:'#F5DDA7',borderWidth:1},
heroDecorationOne:{position:'absolute',width:165,height:165,borderRadius:83,backgroundColor:'#FFD98D',top:-64,right:-64,opacity:.95},
heroDecorationTwo:{position:'absolute',width:88,height:88,borderRadius:44,backgroundColor:'#F3A38B',opacity:0.65,bottom:-37,right:22},
heroPill:{alignSelf:'flex-start',backgroundColor:'#FFF9EE',borderRadius:40,paddingHorizontal:13,paddingVertical:7,marginBottom:12,borderColor:'#EDD8AF',borderWidth:1},
heroPillText:{fontSize:10.5,fontWeight:'900',letterSpacing:1.1,color:'#624315'},
eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:C.coralDeep},
heroTitle:{fontSize:28,fontWeight:'900',color:C.ink,letterSpacing:-.8,lineHeight:35,maxWidth:295},
heroText:{color:'#536667',fontSize:14,lineHeight:21,marginTop:10,maxWidth:285},
heroTagline:{alignSelf:'flex-start',backgroundColor:'#FFFFFF',borderRadius:12,paddingVertical:8,paddingHorizontal:10,marginTop:18,borderWidth:1,borderColor:'#F2DAB6'},
heroTaglineText:{color:C.accentDark,fontSize:11.5,fontWeight:'800'},
h:{fontSize:25,fontWeight:'900',color:C.ink,letterSpacing:-.6},
sub:{fontSize:13.5,lineHeight:21,color:C.muted,marginTop:6},
body:{fontSize:14.5,lineHeight:22,color:C.ink},
micro:{fontSize:11.5,color:C.muted,lineHeight:17},
sectionTitle:{fontSize:18,color:C.ink,fontWeight:'900',marginBottom:13},
cardTitle:{fontSize:17,fontWeight:'900',color:C.ink},
label:{fontSize:13,color:C.ink,fontWeight:'800',marginBottom:8},
input:{backgroundColor:'#FFFEFC',borderColor:'#E5DBD3',borderWidth:1,borderRadius:17,paddingHorizontal:15,paddingVertical:13,fontSize:15,color:C.ink,minHeight:48},
button:{minHeight:50,paddingHorizontal:18,paddingVertical:12,borderRadius:18,justifyContent:'center',alignItems:'center',flexDirection:'row'},
button_primary:{backgroundColor:C.accent},button_outline:{backgroundColor:C.white,borderColor:'#AEDBDD',borderWidth:1.5},
button_ghost:{backgroundColor:C.pale},buttonSmall:{minHeight:39,paddingVertical:8,paddingHorizontal:13},
buttonText:{color:C.white,fontSize:14,fontWeight:'900'},buttonTextDark:{color:C.accentDark},
chip:{borderRadius:50,borderWidth:1,borderColor:'#CBE8E2',backgroundColor:C.pale,paddingHorizontal:13,paddingVertical:8},
chipSelected:{backgroundColor:C.coralDeep,borderColor:C.coralDeep},chipText:{color:C.accentDark,fontSize:12,fontWeight:'800'},
chipsRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},
info:{backgroundColor:C.pale,borderRadius:18,paddingHorizontal:17,paddingVertical:14,marginHorizontal:12,marginTop:7,marginBottom:12},
warning:{backgroundColor:C.warning},infoText:{fontSize:12.5,lineHeight:20,color:C.accentDark},
avatar:{backgroundColor:'#FFE7D8',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarText:{fontWeight:'900',color:C.coralDeep},
match:{backgroundColor:C.sunny,borderRadius:12,paddingHorizontal:10,paddingVertical:7},matchText:{fontSize:10.5,fontWeight:'900',color:'#674516'},
refreshButton:{width:39,height:39,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:C.pale},
refreshText:{color:C.accentDark,fontSize:28,fontWeight:'700',lineHeight:31},
tabBar:{minHeight:78,borderTopWidth:1,borderTopColor:'#EBDCC9',backgroundColor:'#FFFEF9',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:4,paddingBottom:4},
tab:{flex:1,alignItems:'center',justifyContent:'center',minHeight:64,paddingVertical:7,paddingHorizontal:1,borderRadius:16,marginHorizontal:2},tabActive:{backgroundColor:'#FFF0D3'},tabPressed:{opacity:.75},tabLabel:{fontSize:10,color:'#7F9090',marginTop:5,fontWeight:'700'},tabLabelActive:{color:C.accentDark,fontWeight:'900'},
tabIconWrap:{width:30,height:30,alignItems:'center',justifyContent:'center'},
tabBadge:{position:'absolute',top:-8,right:-18,minWidth:19,height:19,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:C.coralDeep,borderColor:C.white,borderWidth:1.5,paddingHorizontal:3},
tabBadgeText:{fontSize:10,color:C.white,fontWeight:'900'},
chatUnreadBadge:{minWidth:23,height:23,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:C.coralDeep,paddingHorizontal:5},
chatUnreadText:{color:C.white,fontWeight:'900',fontSize:11},
activityCard:{padding:16,backgroundColor:'#FFF2DA',borderRadius:19,borderWidth:1,borderColor:'#EAC897',marginBottom:19},
activityCardTitle:{color:C.ink,fontWeight:'900',fontSize:16},
activityCardText:{color:C.muted,lineHeight:19,fontSize:13,marginTop:6},
activityCardAction:{color:C.accentDark,fontWeight:'900',fontSize:12,marginTop:9},
chatLimitBox:{paddingHorizontal:13,paddingTop:9,paddingBottom:6,backgroundColor:'#FFF9ED',borderTopColor:C.line,borderTopWidth:1},
chatLimitText:{fontSize:12,color:C.accentDark,fontWeight:'700',lineHeight:18},
chatLimitRefresh:{alignSelf:'flex-start',marginTop:7,paddingVertical:5,paddingHorizontal:8,borderRadius:9,backgroundColor:'#FFEAC5'},
chatLimitRefreshText:{fontWeight:'900',fontSize:12,color:C.accentDark},
chatHeader:{padding:13,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line},
chatComposer:{padding:11,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line},
bubble:{borderRadius:20,padding:13,maxWidth:'87%',marginVertical:5},mine:{backgroundColor:C.accent,alignSelf:'flex-end',borderBottomRightRadius:5},
theirs:{backgroundColor:'#FFF0E8',alignSelf:'flex-start',borderBottomLeftRadius:5},bubbleText:{color:C.ink,fontSize:14.5,lineHeight:21},
photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},photoCard:{width:'47%',padding:10},photoImage:{width:'100%',height:110,borderRadius:14,marginBottom:8},
galleryPressable:{width:'47%'},
photoDraftPreview:{width:'100%',height:230,backgroundColor:C.pale,borderRadius:18,marginBottom:14},
madeInGermanyStamp:{width:82,minHeight:48,borderColor:'#DEB773',borderWidth:1.4,borderRadius:12,backgroundColor:'#FFF6E5',alignItems:'center',justifyContent:'center',paddingVertical:4},
stampKicker:{fontSize:8,fontWeight:'800',color:'#916A2A',letterSpacing:1.2},
stampCountry:{fontSize:11,fontWeight:'900',color:C.ink,letterSpacing:.5},
stampDraft:{fontSize:6.5,fontWeight:'800',color:C.muted,letterSpacing:.4},
profileHero:{padding:20,borderRadius:26,backgroundColor:'#FFF0D8',borderColor:'#F4D6A0',borderWidth:1,overflow:'hidden'},
profileHeroSun:{position:'absolute',height:175,width:175,borderRadius:100,backgroundColor:'#FFDA8F',opacity:.68,top:-115,right:-55},
profileEyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.4,color:'#A46C23'},
profileName:{fontSize:23,fontWeight:'900',color:C.ink,letterSpacing:-.5},
profileRegion:{fontSize:13,color:C.muted,fontWeight:'700',marginTop:6},
profileStatus:{fontSize:12,color:C.accentDark,fontWeight:'800',marginTop:7},
profileAbout:{fontSize:15,lineHeight:23,color:C.ink,marginTop:18},
emptyMoments:{alignItems:'center',paddingVertical:30,paddingHorizontal:12,gap:7},
momentTile:{width:'48%',backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:18,padding:9,gap:6},
momentImage:{width:'100%',height:140,borderRadius:12,resizeMode:'cover'},
momentPreviewPressable:{position:'relative'},
momentZoomBadge:{position:'absolute',bottom:7,right:7,backgroundColor:'rgba(18,55,62,.88)',borderRadius:11,paddingHorizontal:9,paddingVertical:5},
momentZoomText:{color:'#FFFFFF',fontSize:10,fontWeight:'800'},
momentCaption:{fontSize:13,fontWeight:'800',color:C.ink,lineHeight:19},
outingSectionBar:{flexDirection:'row',padding:5,borderRadius:18,backgroundColor:'#FFF0D5',gap:5,marginBottom:20},
outingSectionButton:{flex:1,minHeight:45,borderRadius:14,justifyContent:'center',alignItems:'center',paddingHorizontal:6},
outingSectionButtonActive:{backgroundColor:'#FFFFFF',borderColor:'#E9D4B6',borderWidth:1},
outingSectionText:{color:'#71807A',fontSize:12.5,fontWeight:'800',textAlign:'center'},
outingSectionTextActive:{color:C.accentDark,fontWeight:'900'},
profileMenuGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'space-between'},
profileMenuTile:{width:'48%',backgroundColor:C.white,borderColor:C.line,borderWidth:1.5,borderRadius:19,paddingHorizontal:14,paddingVertical:15,minHeight:101,justifyContent:'center'},
profileMenuTileActive:{backgroundColor:'#FFF1D5',borderColor:'#E7B96D'},
profileMenuNumber:{color:'#B47E34',fontSize:11,fontWeight:'900',letterSpacing:1.2,marginBottom:8},
profileMenuTitle:{color:C.ink,fontSize:15.5,fontWeight:'900',lineHeight:21},
profileMenuSubtitle:{color:C.muted,fontSize:11.5,lineHeight:16,marginTop:3},
profileInterestCount:{alignSelf:'flex-start',backgroundColor:'#FFF0D3',paddingHorizontal:12,paddingVertical:7,borderRadius:14,marginBottom:18},
profileInterestCountText:{fontSize:12,color:'#855D26',fontWeight:'900'},
profileSelectedInterests:{backgroundColor:'#FFF9F0',borderRadius:16,padding:13,marginTop:4,marginBottom:18,borderColor:C.line,borderWidth:1},
profilePrivacyNote:{padding:15,borderRadius:17,backgroundColor:'#FFF5E6',marginBottom:19},
profileSettingsDivider:{height:1,backgroundColor:C.line,marginVertical:23},
kompassDiscoverCallout:{backgroundColor:'#FFF0D3',borderColor:'#EED19A',borderWidth:1,borderRadius:21,padding:17},
kompassCalloutEyebrow:{fontSize:10.5,fontWeight:'900',color:'#A06A2B',letterSpacing:.8,marginBottom:8},
kompassCalloutTitle:{fontSize:17,fontWeight:'900',color:C.ink},
kompassCalloutText:{fontSize:12.5,color:C.muted,marginTop:5,lineHeight:19},
kompassHero:{backgroundColor:'#FFEED2',borderColor:'#F2D59E',borderWidth:1,borderRadius:27,padding:22,overflow:'hidden',marginBottom:24},
kompassSun:{position:'absolute',height:165,width:165,borderRadius:85,backgroundColor:'#FFD991',top:-90,right:-58,opacity:.9},
kompassEyebrow:{fontSize:11,color:'#A16E29',fontWeight:'900',letterSpacing:1.2,marginBottom:12},
kompassTitle:{fontSize:26,fontWeight:'900',color:C.ink,letterSpacing:-.6},
kompassSubtitle:{fontSize:14,color:C.ink,lineHeight:22,marginTop:9,maxWidth:275},
kompassTopicGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},
kompassTopic:{width:'48%',backgroundColor:C.white,borderColor:C.line,borderWidth:1.5,borderRadius:20,padding:13,minHeight:95,justifyContent:'center'},
kompassTopicSelected:{backgroundColor:'#FFF3DA',borderColor:'#E7B96D'},
kompassTopicNumber:{fontSize:11,fontWeight:'900',color:'#B47828',letterSpacing:1.2,marginBottom:6},
kompassTopicTitle:{fontSize:14,fontWeight:'800',color:C.ink,lineHeight:19},
kompassNumberCircle:{height:35,width:35,borderRadius:18,backgroundColor:'#FFE5AE',justifyContent:'center',alignItems:'center'},
kompassNumberText:{fontWeight:'900',fontSize:14,color:'#825D2B'},
kompassDue:{fontSize:11,fontWeight:'900',color:'#A36B29',marginTop:6},
kompassDetails:{borderTopWidth:1,borderTopColor:C.line,marginTop:16,paddingTop:17},
kompassPickerButton:{minHeight:55,borderRadius:17,borderWidth:1.5,borderColor:'#D9C5AD',backgroundColor:C.white,paddingHorizontal:15,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
kompassPickerButtonDisabled:{backgroundColor:'#F2ECE4',opacity:.8},
kompassPickerValue:{fontSize:14.5,color:C.ink,fontWeight:'800',flex:1},
kompassPickerPlaceholder:{fontWeight:'500',color:C.muted},
kompassChevron:{fontSize:23,fontWeight:'800',color:C.accentDark},
kompassRegionNote:{fontSize:12.5,lineHeight:19,fontWeight:'600',color:C.muted,marginTop:15,marginBottom:8},
kompassPickerShade:{flex:1,backgroundColor:'rgba(15,44,52,.45)',justifyContent:'flex-end'},
kompassPickerSheet:{height:'78%',backgroundColor:C.bg,borderTopLeftRadius:25,borderTopRightRadius:25,paddingTop:22,paddingHorizontal:20,paddingBottom:25},
kompassPickerSearch:{backgroundColor:C.white,borderRadius:16,borderWidth:1,borderColor:C.line,minHeight:51,paddingHorizontal:14,fontSize:15,color:C.ink,marginBottom:14},
kompassOption:{backgroundColor:C.white,padding:14,borderBottomWidth:1,borderBottomColor:C.line,minHeight:50,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
kompassOptionSelected:{backgroundColor:'#FFF0D3'},
kompassOptionName:{fontSize:14.5,fontWeight:'600',color:C.ink,flex:1},
kompassOptionCheck:{fontSize:16,fontWeight:'800',color:C.accentDark,marginLeft:9},
modalShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,44,52,.52)',justifyContent:'center',zIndex:100},
});

