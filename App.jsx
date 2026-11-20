import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking,
Platform, Pressable, RefreshControl, SafeAreaView, ScrollView,
StatusBar, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { assertResult, configured, errorMessage, supabase } from './supabase';
import { AboutFamilienfunkeScreen, TechnicalHelpScreen } from './AboutAndHelp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeIntro from './WelcomeIntro';
import FamilyGuideScreen from './FamilyGuide';
import FamilyMapScreen from './FamilyMap';
// Familienfunke: Vorlage 3 – fröhlich und lebendig.
const C = {
bg:'#FFF9F3',white:'#FFFFFF',ink:'#193C48',muted:'#647D82',
accent:'#087F87',accentDark:'#075D67',pale:'#E4F5F1',line:'#F0E5DC',
coral:'#EE7867',coralDeep:'#B9474C',sunny:'#FFE4AA',
lavender:'#F2EEFF',warning:'#FFF1D6',warningText:'#75521D',
};
const INTERESTS = ['Spielplatz','Natur','Radfahren','Wandern','Kochen','Musik','Basteln','Sport','Tiere','Lesen','Ausflüge','Spieleabende','Schwimmen','Fußball','Tanzen','Camping','Gärtnern','Fotografie','Brettspiele','Museen','Backen','Picknick','Kino','Yoga','Familiencafés','Handarbeiten','Konzerte','Reisen'];
const REGIONS = ['Landkreis Oder-Spree','Fürstenwalde/Spree','Beeskow','Eisenhüttenstadt','Bad Saarow','Storkow (Mark)','Frankfurt (Oder)','Landkreis Dahme-Spreewald','Landkreis Märkisch-Oderland','Berlin','Potsdam','Cottbus'];
const normalizeLabel = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const REGION_CLUSTERS = [
  ['Landkreis Oder-Spree','Fürstenwalde/Spree','Fürstenwalde (Spree)','Fürstenwalde','Beeskow','Eisenhüttenstadt','Bad Saarow','Storkow (Mark)','Storkow'],
].map(group=>group.map(normalizeLabel));
const sameRegion = (a,b) => {
  const x=normalizeLabel(a), y=normalizeLabel(b);
  return !!x && (x===y || REGION_CLUSTERS.some(group=>group.includes(x)&&group.includes(y)));
};
const TABS = [['market','Basar','♧'],['discover','Familien','♡'],['map','Karte','⌖'],['guide','Wegweiser','☀'],['more','Mehr','◉']];
const MARKET_CATEGORIES=['Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges'];
const ORG_KINDS=[['kita','Kita / Kindergarten'],['foerderverein','Förderverein'],['familienzentrum','Familienzentrum'],['verein','Familienverein']];
const SECTION_MESSAGES={market:'Von Familien für Familien: kostenlos einstellen, verschenken und tauschen. Unsere Gebühren sind offen – aktuell gibt es keine Onlinezahlungen. Wir verkaufen keine persönlichen Daten.',partners:'Kitas und Fördervereine stellen sich vor, zeigen freie Plätze und laden zu Flohmärkten ein. Ein Stern erscheint nur bei bestätigter Einrichtung.',discover:'Neue Familien kennenlernen – freiwillig, respektvoll und ohne genaue Standortfreigabe.',events:'Gemeinsam etwas unternehmen statt endlose Diskussionen. Veranstaltungen werden vor der Veröffentlichung geprüft.',inclusion:'Für Familien mit und ohne Behinderung: willkommen, respektiert und ohne Pflicht zur Offenlegung persönlicher Diagnosen.'};
const blankProfile = {display_name:'',region_label:'',about:'',interests:[],is_discoverable:false};
const blankData = {profiles:[],contacts:[],messages:[],events:[],eventRequests:[],photos:[],blocks:[],listings:[],marketPhotos:[],marketFavorites:[],organizations:[],partnerEvents:[]};
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
return <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityState={{selected:!!selected,disabled:!onPress}} disabled={!onPress} onPress={onPress} style={[styles.chip,selected&&styles.chipSelected]}>
<Text style={[styles.chipText,selected&&{color:C.white}]}>{selected?'✓ ':''}{text}</Text>
</Pressable>;
}
function Card({children,style}) {return <View style={[styles.card,style]}>{children}</View>;}
function H({children,sub}) {return <View style={{marginBottom:17}}><Text style={styles.h}>{children}</Text>{sub?<Text style={styles.sub}>{sub}</Text>:null}</View>;}
function Info({children,warning=false}) {return <View style={[styles.info,warning&&styles.warning]}><Text style={[styles.infoText,warning&&{color:C.warningText}]}>{children}</Text></View>;}
function Avatar({name,size=52,uri}) {return <View style={[styles.avatar,{width:size,height:size,borderRadius:size/2}]}>{uri?<Image source={{uri}} style={{width:size,height:size,borderRadius:size/2}}/>:<Text style={[styles.avatarText,{fontSize:size*.30}]}>{initial(name)}</Text>}</View>;}
function Row({children,style}) {return <View style={[{flexDirection:'row',alignItems:'center',gap:10},style]}>{children}</View>;}
function Input({label,multiline=false,style,...props}) {
return <View style={[{marginBottom:13},style]}><Text style={styles.label}>{label}</Text><TextInput
accessibilityLabel={label} placeholderTextColor="#9AAFB4" style={[styles.input,multiline&&{height:95,textAlignVertical:'top',paddingTop:12}]}
multiline={multiline} {...props}/></View>;
}
function RegionPicker({value,onChange}) {
const [open,setOpen]=useState(false);
const [search,setSearch]=useState('');
const options=REGIONS.filter(r=>normalizeLabel(r).includes(normalizeLabel(search)));
function choose(value){onChange(value);setSearch('');setOpen(false);}
return <View style={{marginBottom:15}}>
<Text style={styles.label}>Wo wohnt ihr? (Stadt oder Landkreis)</Text>
<Pressable accessibilityRole="button" accessibilityLabel="Region auswählen" onPress={()=>{setOpen(v=>!v);setSearch('');}} style={[styles.input,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
<Text style={{color:value?C.ink:C.muted,flex:1}} numberOfLines={1}>{value||'Region auswählen oder selbst eingeben'}</Text>
<Text style={{color:C.accent,fontWeight:'900'}}>{open?'⌃':'⌄'}</Text>
</Pressable>
{open?<View style={styles.regionDropdown}>
<TextInput style={[styles.input,{marginBottom:8}]} placeholder="Stadt oder Landkreis suchen" placeholderTextColor="#9AAFB4" value={search} onChangeText={setSearch} maxLength={80} autoCorrect={false}/>
<ScrollView style={{maxHeight:210}} keyboardShouldPersistTaps="always" nestedScrollEnabled>
{options.map(r=><Pressable accessibilityRole="button" key={r} onPress={()=>choose(r)} style={styles.regionOption}><Text style={styles.body}>{r}</Text>{normalizeLabel(r)===normalizeLabel(value)?<Text style={{color:C.accent}}>✓</Text>:null}</Pressable>)}
{search.trim().length>=2&&!REGIONS.some(r=>normalizeLabel(r)===normalizeLabel(search))?
<Pressable accessibilityRole="button" onPress={()=>choose(search.trim())} style={styles.regionOption}><Text style={[styles.body,{color:C.accentDark}]}>„{search.trim()}“ übernehmen</Text></Pressable>:null}
{options.length===0&&search.trim().length<2?<Text style={styles.micro}>Bitte mindestens zwei Zeichen eingeben.</Text>:null}
</ScrollView>
</View>:null}
<Text style={[styles.micro,{marginTop:6}]}>Gib bitte keine Straße oder Hausnummer an. Deine Region ist freiwillig.</Text>
</View>;
}
function Blank({title,body}) {return <Card style={{alignItems:'center',paddingVertical:30}}><Text style={{fontSize:38,marginBottom:8,color:C.coral}}>♡</Text><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.sub,{textAlign:'center'}]}>{body}</Text></Card>;}
function Login({error,setError,onHelp}) {
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
<View style={{marginTop:12}}><Button title="Hilfe bei der Anmeldung" mode="ghost" onPress={onHelp}/></View>
</Card>
</ScrollView>
</KeyboardAvoidingView>;
}
export default function App() {
const [session,setSession]=useState(undefined);
const [tab,setTab]=useState('market');
const [selectedContact,setSelectedContact]=useState(null);
const [chatReturnTab,setChatReturnTab]=useState('more');
const [detailFamily,setDetailFamily]=useState(null);
const [showEventForm,setShowEventForm]=useState(false);
const [showInfo,setShowInfo]=useState(false);
const [showLoginHelp,setShowLoginHelp]=useState(false);
const [showWelcome,setShowWelcome]=useState(false);
const [reportTarget,setReportTarget]=useState(null);
const [reportDetails,setReportDetails]=useState('');
const [error,setError]=useState('');
const [notice,setNotice]=useState('');
const [busy,setBusy]=useState(false);
const [loading,setLoading]=useState(false);
const [db,setDb]=useState(blankData);
const [myProfile,setMyProfile]=useState(null);
const [verification,setVerification]=useState(null);
const [membership,setMembership]=useState(null);
const [photosUrls,setPhotosUrls]=useState({});
const [marketPhotoUrls,setMarketPhotoUrls]=useState({});
const [marketExtraPhotoUrls,setMarketExtraPhotoUrls]=useState({});
const me=session?.user?.id;
const load=useCallback(async(silent=false)=>{
if(!me||!supabase)return;
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
supabase.from('ff_market_listings').select('*').order('created_at',{ascending:false}).limit(160),
supabase.from('ff_market_photos').select('*').order('slot',{ascending:true}).limit(800),
supabase.from('ff_market_favorites').select('*').eq('user_id',me).limit(800),
supabase.from('ff_organizations').select('*').order('created_at',{ascending:false}).limit(100),
supabase.from('ff_partner_events').select('*').order('starts_at',{ascending:true}).limit(100),
]);
const firstError=queries.find(x=>x.error)?.error;
if(firstError)throw firstError;
const [profiles,contacts,messages,events,eventRequests,photos,blocks,verificationRow,membershipRow,listings,marketPhotos,marketFavorites,organizations,partnerEvents]=queries;
const profileRow=profiles.data.find(p=>p.user_id===me)||null;
setDb({profiles:profiles.data||[],contacts:contacts.data||[],messages:messages.data||[],
events:events.data||[],eventRequests:eventRequests.data||[],photos:photos.data||[],blocks:blocks.data||[],
listings:listings.data||[],marketPhotos:marketPhotos.data||[],marketFavorites:marketFavorites.data||[],organizations:organizations.data||[],partnerEvents:partnerEvents.data||[]});
setMyProfile(profileRow);setVerification(verificationRow.data);setMembership(membershipRow.data);
setError('');
const images=await Promise.all((photos.data||[]).map(async(p)=>{
try {const {data,error:e}=await supabase.storage.from('familienfunke-photos').createSignedUrl(p.storage_path,1800);
return [p.id,e?null:data?.signedUrl||null];} catch {return [p.id,null];}
}));
setPhotosUrls(Object.fromEntries(images));
const marketImages=await Promise.all((listings.data||[]).filter(x=>x.photo_path).map(async(x)=>{
 try {const {data,error:e}=await supabase.storage.from('ff-market-photos').createSignedUrl(x.photo_path,600);return [x.id,e?null:data?.signedUrl||null];}
 catch{return [x.id,null];}
}));
setMarketPhotoUrls(Object.fromEntries(marketImages));
const extraImages=await Promise.all((marketPhotos.data||[]).map(async(p)=>{
 try{
   const {data,error:e}=await supabase.storage.from('ff-market-photos').createSignedUrl(p.photo_path,600);
   return [p.photo_path,e?null:data?.signedUrl||null];
 }catch{return [p.photo_path,null];}
}));
setMarketExtraPhotoUrls(Object.fromEntries(extraImages));
} catch(e){setError(humanError(e));}
finally{setLoading(false);}
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
// Nach jeder Anmeldung startet Familienfunke im Basar – auch nach einem Kontowechsel.
useEffect(()=>{
  setTab('market');
  setSelectedContact(null);
  setDetailFamily(null);
  setShowInfo(false);
  setShowLoginHelp(false);
  setShowEventForm(false);
},[me]);
useEffect(()=>{if(me)load();else{setDb(blankData);setMyProfile(null);setMarketPhotoUrls({});setMarketExtraPhotoUrls({});}},[me,load]);
// Einmalige Begrüßung je Konto auf diesem Gerät. Ein erneuter Aufruf unter „Mehr“ ist jederzeit möglich.
useEffect(()=>{
  let valid=true;
  setShowWelcome(false);
  if(me){
    AsyncStorage.getItem('familienfunke.welcome.v1.'+me)
      .then(seen=>{if(valid)setShowWelcome(seen!=='seen');})
      .catch(()=>{if(valid)setShowWelcome(true);});
  }
  return ()=>{valid=false;};
},[me]);
function dismissWelcome(){
  setShowWelcome(false);
  if(me){
    AsyncStorage.setItem('familienfunke.welcome.v1.'+me,'seen')
      .catch(()=>Alert.alert('Hinweis','Die Einstellung konnte auf diesem Gerät nicht gespeichert werden. Die Begrüßung könnte beim nächsten Start erneut erscheinen.'));
  }
}
const active=verification?.status==='verified'&&myProfile?.moderation_status==='approved'&&membership?.status!=='suspended';
const blocked=(uid)=>db.blocks.some(b=>b.blocker_id===me&&b.blocked_id===uid);
const findName=(uid)=>db.profiles.find(p=>p.user_id===uid)?.display_name||'Familienprofil';
const otherSide=(contact)=>contact.sender_id===me?contact.recipient_id:contact.sender_id;
const accepted=db.contacts.filter(x=>x.status==='accepted');
const pending=db.contacts.filter(x=>x.status==='pending');
const photoOf=(uid)=>db.photos.find(p=>p.owner_id===uid&&p.moderation_status==='approved')||db.photos.find(p=>p.owner_id===uid&&uid===me);
const ownPhotos=db.photos.filter(p=>p.owner_id===me);
const matches=useMemo(()=>db.profiles.filter(p=>p.user_id!==me&&p.moderation_status==='approved'&&p.is_discoverable)
.map(p=>({...p,match:(p.interests||[]).filter(x=>myProfile?.interests?.includes(x)).length,localMatch:sameRegion(p.region_label,myProfile?.region_label)}))
.sort((a,b)=>Number(b.localMatch)-Number(a.localMatch)||b.match-a.match||String(a.display_name).localeCompare(String(b.display_name))),[db.profiles,me,myProfile]);
async function reviewMarketListing(listingId){
 const {data:review,error:reviewError}=await supabase.functions.invoke('ff-market-review',{body:{listing_id:listingId}});
 if(!reviewError&&review?.status==='approved')setNotice('Deine Anzeige wurde geprüft und ist jetzt sichtbar.');
 else if(!reviewError&&review?.status==='rejected'){
   setNotice(review.reason==='live_animal'
     ?'Lebende Tiere dürfen nicht angeboten oder vermittelt werden. Die Anzeige wurde abgelehnt.'
     :'Die Anzeige wurde aufgrund der Basar-Regeln nicht freigegeben.');
 }else setNotice('Deine Anzeige ist gespeichert und bleibt bis zur Freigabe in Prüfung.');
}
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
if(!me)return <SafeAreaView style={styles.screen}><ExpoStatusBar style="dark"/>
{showLoginHelp?<><View style={styles.topBar}>
  <View style={{flex:1}}><Text style={styles.smallBrand}>Familienfunke.</Text><Text style={styles.topHint}>Hilfe zur Anmeldung</Text></View>
  <Button title="← Zur Anmeldung" small mode="ghost" onPress={()=>setShowLoginHelp(false)}/>
</View><TechnicalHelpScreen initialCategory="Anmeldung & Konto"/></>:
<Login error={error} setError={setError} onHelp={()=>setShowLoginHelp(true)}/>}
</SafeAreaView>;
const EXTRA_TITLES={contacts:'Kontakte',chat:'Nachrichten',profile:'Profil',events:'Treffen',inclusion:'Inklusion',partners:'Kita & Partnerwelt',aboutApp:'Über uns',help:'Hilfe & FAQ'};
const navTitle=detailFamily?'Familienprofil':selectedContact?'Nachrichten':showInfo?'Elternwissen':TABS.find(t=>t[0]===tab)?.[1]||EXTRA_TITLES[tab]||'Familienfunke';
function back(){if(detailFamily)setDetailFamily(null);else if(selectedContact){setSelectedContact(null);setTab(chatReturnTab);}else if(showInfo)setShowInfo(false);else if(['profile','contacts','chat','events','inclusion','partners','aboutApp','help'].includes(tab))setTab('more');}
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
{detailFamily||selectedContact||showInfo||['profile','contacts','chat','events','inclusion','partners','aboutApp','help'].includes(tab)?<Button title="← Zurück" onPress={back} small mode="ghost"/>:<Button title="⟳" onPress={()=>load()} small mode="ghost"/>}
</View>
{error?<Pressable onPress={()=>setError('')}><Info warning>{error} · Schließen ×</Info></Pressable>:null}
{notice?<Pressable onPress={()=>setNotice('')}><Info>{notice} · Schließen ×</Info></Pressable>:null}
{loading?<View style={{padding:4}}><ActivityIndicator color={C.accent}/></View>:null}
<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={0}>
{detailFamily?<FamilyDetail p={db.profiles.find(p=>p.user_id===detailFamily)}
imageUrl={photosUrls[photoOf(detailFamily)?.id]} photos={db.photos.filter(p=>p.owner_id===detailFamily&&p.moderation_status==='approved')}
photosUrls={photosUrls} active={active} disabled={busy} blocked={blocked(detailFamily)}
connection={db.contacts.find(c=>c.sender_id===detailFamily||c.recipient_id===detailFamily)}
onContact={()=>sendRequest(detailFamily)} onBlock={()=>blockUser(detailFamily)} onUnblock={()=>unblockUser(detailFamily)}
onReport={()=>report('profile',detailFamily)} onChat={(cid)=>{setChatReturnTab('discover');setDetailFamily(null);setSelectedContact(cid);setTab('chat');}}/>:
selectedContact?<ChatScreen contact={accepted.find(c=>c.id===selectedContact)} me={me} nameOf={findName}
messages={db.messages.filter(m=>m.contact_id===selectedContact)} disabled={busy} blocked={blocked}
send={(body)=>execute(async()=>{
  // Die Nachricht wird ausschliesslich von der authentifizierten Edge Function
  // geprueft und gespeichert. Kein direkter INSERT in public.messages mehr.
  const {data, error:sendError} = await supabase.functions.invoke('send-message', {
    body: {contact_id:selectedContact, body},
  });
  if(sendError){
    const status = sendError.context?.status;
    if(status===422)throw new Error('Diese Nachricht wurde wegen unserer Inhaltsregeln zurueckgehalten. Bitte formuliere sie anders.');
    if(status===401)throw new Error('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
    if(status===403)throw new Error('Nachrichten sind fuer diesen Kontakt momentan nicht erlaubt.');
    if(status===503)throw new Error('Die Sicherheitspruefung ist momentan nicht verfuegbar. Bitte spaeter erneut versuchen.');
    throw new Error('Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
  }
  if(!data?.message?.id)throw new Error('Keine eindeutige Bestaetigung vom Nachrichtenserver erhalten.');
},'Nachricht gesendet.')}
onReport={(id)=>report('message',id)} onBlock={blockUser}/>:
showInfo?<InfoScreen/>:
tab==='guide'?<FamilyGuideScreen userId={me} regionLabel={myProfile?.region_label}/>:
tab==='map'?<FamilyMapScreen userId={me} active={active} addPlace={(v)=>execute(async()=>{
 await moderateTextOrThrow([v.title,v.description,v.region_label]);
 assertResult(await supabase.from('ff_family_places').insert(v));
},'Danke! Dein Ort wartet auf Prüfung.')}/>:
tab==='market'?<MarketScreen listings={db.listings} me={me} active={active} busy={busy}
organizations={db.organizations} photoUrls={marketPhotoUrls} extraPhotoUrls={marketExtraPhotoUrls} marketPhotos={db.marketPhotos} favorites={db.marketFavorites} contacts={db.contacts}
createListing={(v,assets)=>execute(async()=>{
 // Basar-Texte nicht wegen einzelner Wörter vorab blockieren.
 // Die verpflichtende Inhalts- und Produktprüfung findet auf dem Server statt.
 const {data:inserted,error:insertError}=await supabase.from('ff_market_listings').insert({...v,seller_id:me}).select('id').single();
 if(insertError)throw insertError;
 if(assets?.length){
   try{await uploadMarketPhotos(inserted.id,assets,me);}
   catch(e){
     setNotice('Das Inserat ist gespeichert. Mindestens ein Foto konnte nicht vollständig hochgeladen werden. Es bleibt zur Sicherheit in Prüfung.');
     return;
   }
 }
 await reviewMarketListing(inserted.id);
})}
addPendingPhotos={(listingId,assets)=>execute(async()=>{
 await uploadMarketPhotos(listingId,assets,me);
 await reviewMarketListing(listingId);
})}
editListing={(listingId,v,assets)=>execute(async()=>{
 const {data,error:e}=await supabase.rpc('ff_market_edit_listing',{
   p_listing_id:listingId,p_title:v.title,p_description:v.description,
   p_category:v.category,p_item_condition:v.item_condition,
   p_trade_type:v.trade_type,p_price_cents:v.price_cents,p_region_label:v.region_label
 });
 if(e)throw e;
 if(data!==true)throw new Error('Diese Anzeige darf nicht bearbeitet werden. Bitte prüfe ihren Status.');
 if(assets?.length){
   try{await uploadMarketPhotos(listingId,assets,me);}
   catch(e){setNotice('Änderungen gespeichert, aber nicht alle Fotos konnten hochgeladen werden. Die Anzeige bleibt zur Prüfung zurückgehalten.');return;}
 }
 await reviewMarketListing(listingId);
})}
toggleFavorite={(listingId,isFavorite)=>execute(async()=>{
 if(isFavorite)assertResult(await supabase.from('ff_market_favorites').delete().eq('user_id',me).eq('listing_id',listingId));
 else assertResult(await supabase.from('ff_market_favorites').insert({user_id:me,listing_id:listingId}));
},isFavorite?'Aus der Merkliste entfernt.':'In deiner Merkliste gespeichert.')}
markListingSold={(id)=>execute(async()=>{const {data,error:e}=await supabase.rpc('ff_market_mark_sold',{p_listing_id:id});if(e)throw e;if(data!==true)throw new Error('Das Inserat konnte nicht abgeschlossen werden. Bitte aktualisiere den Basar.');},'Angebot abgeschlossen. Es ist für andere nicht mehr sichtbar.')}
onContact={sendRequest} onChat={(cid)=>{setChatReturnTab('market');setSelectedContact(cid);setTab('chat');}} nameOf={findName} blocked={blocked}/>:
tab==='partners'?<PartnersScreen organizations={db.organizations} partnerEvents={db.partnerEvents}
me={me} active={active} busy={busy}
applyOrg={(v)=>execute(async()=>{
 await moderateTextOrThrow([v.name,v.description,v.region_label]);
 assertResult(await supabase.from('ff_organizations').insert({...v,owner_id:me}));
},'Partneranfrage gespeichert. Die Einrichtung wird vor Freigabe geprüft.')}
createPartnerEvent={(v)=>execute(async()=>{
 await moderateTextOrThrow([v.title,v.description,v.region_label]);
 assertResult(await supabase.from('ff_partner_events').insert({...v,creator_id:me}));
},'Veranstaltung eingereicht. Sie erscheint nach Freigabe.')}
openInclusion={()=>setTab('inclusion')}/>:
tab==='more'?<MoreScreen navigate={setTab} openInfo={()=>setShowInfo(true)} openWelcome={()=>setShowWelcome(true)}/>:
tab==='inclusion'?<InclusionScreen/>:
tab==='aboutApp'?<AboutFamilienfunkeScreen/>:
tab==='help'?<TechnicalHelpScreen/>:
tab==='discover'?<DiscoverScreen matches={matches} requests={db.contacts} me={me} active={active} busy={busy}
myProfile={myProfile} verification={verification} membership={membership}
showFamily={setDetailFamily} onContact={sendRequest} imageFor={(uid)=>photosUrls[photoOf(uid)?.id]} blocked={blocked}/>:
tab==='contacts'?<ContactsScreen pending={pending} accepted={accepted} me={me} nameOf={findName}
respond={replyRequest} blocked={blocked} disabled={busy} onBlock={blockUser} onUnblock={unblockUser}
onChat={(id)=>{setChatReturnTab('contacts');setSelectedContact(id);setTab('chat');}}/>:
tab==='chat'?<ChatList contacts={accepted} me={me} nameOf={findName} blocked={blocked}
onChat={(id)=>{setChatReturnTab('chat');setSelectedContact(id);}} messages={db.messages}/>:
tab==='events'?<EventsScreen events={db.events} eventRequests={db.eventRequests} me={me} active={active} busy={busy}
profiles={db.profiles} showForm={showEventForm} setShowForm={setShowEventForm}
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
{TABS.map(([id,title,glyph])=><Pressable accessibilityRole="button" key={id} onPress={()=>{setTab(id);setShowEventForm(false);}}
accessibilityLabel={title} accessibilityState={{selected:tab===id||(id==='more'&&['profile','contacts','chat','events','inclusion','partners','aboutApp','help'].includes(tab))}} style={[styles.tab,(tab===id||(id==='more'&&['profile','contacts','chat','events','inclusion','partners','aboutApp','help'].includes(tab)))&&styles.tabActive]}><Text style={[styles.tabIcon,tab===id&&{color:C.accentDark}]}>{glyph}</Text><Text style={[styles.tabLabel,tab===id&&{color:C.accentDark,fontWeight:'900'}]}>{title}</Text></Pressable>)}
</View>:null}
{reportTarget?<View style={styles.modalShade}><Card style={{marginHorizontal:22,padding:24}}>
<Text style={styles.h}>Inhalt melden</Text><Text style={styles.sub}>Bitte beschreibe den Vorfall sachlich. Die Meldung geht an das Betreiberteam.</Text>
<Input label="Was ist passiert?" multiline value={reportDetails} onChangeText={setReportDetails} maxLength={2000}/>
<Row><Button title="Abbrechen" mode="outline" style={{flex:1}} onPress={()=>setReportTarget(null)}/><Button title="Melden" disabled={busy||reportDetails.trim().length<10} style={{flex:1}} onPress={sendReport}/></Row>
</Card></View>:null}
<WelcomeIntro visible={!!me&&showWelcome} onClose={dismissWelcome}/>
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

/** Der Markt wird erst nach Betreiberfreigabe anderen Mitgliedern gezeigt.
 * Bezahlen ist absichtlich NICHT implementiert. */
async function prepareMarketJpeg(asset){
 const job=ImageManipulator.ImageManipulator.manipulate(asset.uri);
 job.resize({width:900,height:null});
 const rendered=await job.renderAsync();
 const saved=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:0.7});
 const file=new File(saved.uri);
 if(file.size>5*1024*1024)throw new Error('Ein Foto ist größer als 5 MB. Bitte verwende ein kleineres Bild.');
 return new Uint8Array(await file.arrayBuffer());
}
async function uploadMarketPhotos(listingId,assets,me){
 if(!assets?.length)return;
 const [{data:listing,error:le},{data:extras,error:ee}]=await Promise.all([
  supabase.from('ff_market_listings').select('photo_path,moderation_status').eq('id',listingId).eq('seller_id',me).single(),
  supabase.from('ff_market_photos').select('slot').eq('listing_id',listingId)
 ]);
 if(le)throw le;if(ee)throw ee;
 if(listing.moderation_status!=='pending')throw new Error('Fotos können nur bei Inseraten in Prüfung hinzugefügt werden.');
 const used=new Set((extras||[]).map(x=>x.slot));
 const present=(listing.photo_path?1:0)+used.size;
 if(present+assets.length>5)throw new Error('Maximal fünf Bilder pro Inserat sind möglich.');
 let primary=!!listing.photo_path;
 for(const asset of assets){
  const bytes=await prepareMarketJpeg(asset);
  if(!primary){
   const path=`${me}/${listingId}.jpg`;
   assertResult(await supabase.storage.from('ff-market-photos').upload(path,bytes,{contentType:'image/jpeg',upsert:false}));
   assertResult(await supabase.from('ff_market_listings')
     .update({photo_path:path}).eq('id',listingId).eq('seller_id',me));
   primary=true;
  }else{
   const slot=[2,3,4,5].find(n=>!used.has(n));
   if(!slot)throw new Error('Maximal fünf Bilder pro Inserat sind möglich.');
   const path=`${me}/${listingId}/${slot}.jpg`;
   assertResult(await supabase.storage.from('ff-market-photos').upload(path,bytes,{contentType:'image/jpeg',upsert:false}));
   assertResult(await supabase.from('ff_market_photos').insert({listing_id:listingId,seller_id:me,slot,photo_path:path}));
   used.add(slot);
  }
 }
}
async function selectMarketPhotos(max=5){
 const result=await ImagePicker.launchImageLibraryAsync({
  mediaTypes:['images'],allowsMultipleSelection:true,selectionLimit:Math.max(1,Math.min(5,max)),
  quality:0.8,exif:false
 });
 return result.canceled?[]:(result.assets||[]).slice(0,Math.max(1,Math.min(5,max)));
}

function MarketCategoryDropdown({label,value,onChange,options,allOption=false}){
  const [expanded,setExpanded]=useState(false);
  const items=allOption?['Alle Kategorien',...options]:options;
  const selected=value==='Alle'?'Alle Kategorien':value;
  return <View style={{marginBottom:13}}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label+': '+selected}
      accessibilityState={{expanded}} onPress={()=>setExpanded(v=>!v)}
      style={styles.marketDropdown}>
      <Text style={[styles.body,{fontWeight:'700',flex:1}]}>{selected}</Text>
      <Text style={{fontSize:19,fontWeight:'800',color:C.accentDark}}>{expanded?'⌃':'⌄'}</Text>
    </Pressable>
    {expanded?<View style={styles.marketDropdownOptions}>
      {items.map(option=><Pressable accessibilityRole="button" key={option}
        accessibilityState={{selected:option===selected}} style={styles.marketDropdownOption}
        onPress={()=>{onChange(option==='Alle Kategorien'?'Alle':option);setExpanded(false);}}>
        <Text style={[styles.body,option===selected&&{color:C.accentDark,fontWeight:'900'}]}>{option}</Text>
        {option===selected?<Text style={{color:C.accentDark,fontWeight:'900'}}>✓</Text>:null}
      </Pressable>)}
    </View>:null}
  </View>;
}
function MarketScreen({listings,me,active,busy,organizations,photoUrls,contacts,createListing,uploadPendingPhoto,markListingSold,onContact,onChat,nameOf,blocked}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('Alle');
  const [tradeFilter,setTradeFilter]=useState('all');
  const [sortBy,setSortBy]=useState('newest');
  const [minPrice,setMinPrice]=useState('');
  const [maxPrice,setMaxPrice]=useState('');
  const [filterOpen,setFilterOpen]=useState(false);
  const [selectedListing,setSelectedListing]=useState(null);
  const [onlyMine,setOnlyMine]=useState(false);
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [region,setRegion]=useState('');
  const [category,setCategory]=useState('Kleidung');
  const [condition,setCondition]=useState('Gut');
  const [trade,setTrade]=useState('sell');
  const [price,setPrice]=useState('');
  const [organizationId,setOrganizationId]=useState('');
  const [photo,setPhoto]=useState(null);
  const [choosing,setChoosing]=useState(false);
  const myOrgs=organizations.filter(x=>x.owner_id===me&&x.status==='approved');
  const priceLabel=x=>x.trade_type==='gift'?'Zu verschenken':x.trade_type==='swap'?'Tausch':
    (x.price_cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  const parsePrice=value=>{
    const raw=String(value).trim().replace(',','.');
    return raw!==''&&Number.isFinite(Number(raw))?Math.round(Number(raw)*100):null;
  };
  const minimum=parsePrice(minPrice), maximum=parsePrice(maxPrice);
  const filtered=listings.filter(x=>
    ((onlyMine&&x.seller_id===me)||(!onlyMine&&x.moderation_status==='approved'))
    && !blocked(x.seller_id)
    && (filter==='Alle'||x.category===filter)
    && (tradeFilter==='all'||x.trade_type===tradeFilter)
    && (minimum===null||(x.trade_type==='sell'&&x.price_cents>=minimum))
    && (maximum===null||(x.trade_type==='sell'&&x.price_cents<=maximum))
    && normalizeLabel([x.title,x.description,x.region_label,x.category].join(' ')).includes(normalizeLabel(query))
  );
  const shown=[...filtered].sort((a,b)=>{
    if(sortBy==='low')return (a.price_cents-b.price_cents)||new Date(b.created_at)-new Date(a.created_at);
    if(sortBy==='high')return (b.price_cents-a.price_cents)||new Date(b.created_at)-new Date(a.created_at);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  async function pick(fn){
    if(choosing)return;
    setChoosing(true);
    try{const asset=await selectMarketPhoto();if(asset)await fn(asset);}
    catch(e){Alert.alert('Fotoauswahl',humanError(e));}
    finally{setChoosing(false);}
  }
  async function submit(){
    if(!active)return;
    if(title.trim().length<4||title.trim().length>100)return Alert.alert('Titel prüfen','Bitte mindestens 4 Zeichen eingeben.');
    const cents=parsePrice(price);
    if(trade==='sell'&&(cents===null||cents<0||cents>10000000))
      return Alert.alert('Preis prüfen','Bitte einen Preis in Euro zwischen 0 und 100.000 angeben.');
    const ok=await createListing({title:safeString(title,100),description:safeString(description,1500),
      category,item_condition:condition,trade_type:trade,price_cents:trade==='sell'?cents:0,
      region_label:safeString(region,80),organization_id:organizationId||null},photo);
    if(ok){setTitle('');setDescription('');setPrice('');setPhoto(null);setOrganizationId('');setOpen(false);}
  }
  function sellerInformation(x){
    const own=x.seller_id===me;
    const org=organizations.find(o=>o.id===x.organization_id&&o.status==='approved');
    const contact=contacts.find(c=>(c.sender_id===me&&c.recipient_id===x.seller_id)||(c.recipient_id===me&&c.sender_id===x.seller_id));
    return {own,org,contact,seller:org?org.name:nameOf(x.seller_id)};
  }
  function contactButton(x,contact){
    if(x.seller_id===me || x.moderation_status!=='approved')return null;
    if(contact?.status==='accepted'){
      return <Button title="Nachricht an Verkäufer schreiben" disabled={busy||!active} mode="primary" onPress={()=>onChat(contact.id)}/>;
    }
    const label=contact?.status==='pending'?'Kontaktanfrage läuft':contact?'Kontaktanfrage vorhanden':'Verkäufer kontaktieren';
    return <Button title={label} disabled={busy||!active||!!contact} mode="primary" onPress={()=>onContact(x.seller_id)}/>;
  }
  const selected=selectedListing?shown.find(x=>x.id===selectedListing):null;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <H sub="Kinderkleidung, Spielzeug und vieles mehr – direkt von Familien in deiner Nähe.">Familienbasar</H>
    <Info>{SECTION_MESSAGES.market}</Info>
    <View style={styles.marketTopActions}>
      <View style={{flex:1}}>
        <Text style={styles.marketTopTitle}>Entdecken & weitergeben</Text>
        <Text style={styles.micro}>Faire Angebote von geprüften Erwachsenen</Text>
      </View>
      <Button title={open?'Schließen':'＋ Inserieren'} small disabled={!active} onPress={()=>{setOpen(v=>!v);setSelectedListing(null);}}/>
    </View>
    {!active?<Info warning>Inserieren und Kontakt aufnehmen können nur freigegebene erwachsene Mitglieder.</Info>:null}
    <View style={{flexDirection:'row',gap:9,marginBottom:16}}>
      <View style={{flex:1}}><Button title="Stöbern" mode={!onlyMine?'primary':'outline'} small
        onPress={()=>{setOnlyMine(false);setSelectedListing(null);setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/></View>
      <View style={{flex:1}}><Button title={'Meine Inserate ('+listings.filter(x=>x.seller_id===me).length+')'}
        mode={onlyMine?'primary':'outline'} small
        onPress={()=>{setOnlyMine(true);setSelectedListing(null);setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/></View>
    </View>
    {open?<Card style={{marginBottom:18}}>
      <Text style={styles.sectionTitle}>Anzeige aufgeben</Text>
      <Text style={[styles.sub,{marginBottom:17}]}>Kostenlos einstellen. Titel, Beschreibung und Foto werden vor Veröffentlichung geprüft. Unklare Angebote warten auf manuelle Freigabe.</Text>
      <View style={{marginBottom:15}}>
        <Button title={photo?'✓ Foto ausgewählt – ändern':'＋ Artikelfoto auswählen'} mode="outline" disabled={choosing||busy}
          onPress={()=>pick(setPhoto)}/>
        {photo?<Image source={{uri:photo.uri}} style={[styles.photoDraftPreview,{marginTop:10}]} resizeMode="contain"/>:null}
        <Text style={[styles.micro,{marginTop:8}]}>Ein Foto pro Inserat ist möglich.</Text>
      </View>
      <Input label="Anzeigentitel" value={title} onChangeText={setTitle} maxLength={100} placeholder="z. B. Winterjacke Größe 116"/>
      <MarketCategoryDropdown label="Kategorie wählen" value={category} onChange={setCategory} options={MARKET_CATEGORIES}/>
      <Text style={styles.label}>Ich möchte</Text>
      <View style={[styles.chipsRow,{marginTop:0,marginBottom:16}]}>
        <Chip text="Verkaufen" selected={trade==='sell'} onPress={()=>setTrade('sell')}/>
        <Chip text="Verschenken" selected={trade==='gift'} onPress={()=>setTrade('gift')}/>
        <Chip text="Tauschen" selected={trade==='swap'} onPress={()=>setTrade('swap')}/>
      </View>
      {trade==='sell'?<Input label="Preis in €" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="z. B. 12,50"/>:null}
      <Text style={styles.label}>Zustand</Text>
      <View style={[styles.chipsRow,{marginTop:0,marginBottom:16}]}>
        {['Neu','Sehr gut','Gut','Gebraucht'].map(x=><Chip key={x} text={x} selected={condition===x} onPress={()=>setCondition(x)}/>)}
      </View>
      <Input label="Beschreibung" multiline value={description} onChangeText={setDescription} maxLength={1500} placeholder="Größe, Farbe, Zustand, Abholung …"/>
      <Input label="Ort / Region – keine Privatadresse" value={region} onChangeText={setRegion} maxLength={80} placeholder="z. B. Fürstenwalde/Spree"/>
      {myOrgs.length>0?<><Text style={styles.label}>Anbieten als</Text><View style={[styles.chipsRow,{marginTop:0,marginBottom:15}]}>
        <Chip text="Privat" selected={!organizationId} onPress={()=>setOrganizationId('')}/>
        {myOrgs.map(o=><Chip key={o.id} text={o.name} selected={organizationId===o.id} onPress={()=>setOrganizationId(o.id)}/>)}
      </View></>:null}
      <Info>Erlaubt sind auch Kuscheltiere, Tierfiguren und eindeutig harmloses Kinderspielzeug. Echte Tiere sind bei uns ausnahmslos verboten – ebenso Waffen, Drogen, Medikamente, 18+-Waren und andere gefährliche oder illegale Artikel. Die Anzeige erscheint erst nach Prüfung.</Info>
      <Button title={busy?'Wird gespeichert …':'Anzeige kostenlos einreichen'} disabled={busy||choosing||!active} onPress={submit}/>
    </Card>:null}
    {selected?<View>
      <Pressable accessibilityRole="button" onPress={()=>setSelectedListing(null)} style={{marginBottom:14,paddingVertical:8}}>
        <Text style={{color:C.accentDark,fontWeight:'800',fontSize:15}}>‹ Zurück zu den Anzeigen</Text>
      </Pressable>
      <Card style={styles.marketDetailCard}>
        <View style={styles.marketDetailImage}>
          {photoUrls[selected.id]?<Image source={{uri:photoUrls[selected.id]}} style={styles.marketFullImage} resizeMode="contain"/>:
            <View style={[styles.marketFullImage,styles.marketImagePlaceholder]}><Text style={{fontSize:34}}>♧</Text><Text style={styles.micro}>Kein Foto hinterlegt</Text></View>}
        </View>
        <Text style={[styles.marketPrice,{fontSize:26,marginTop:15}]}>{priceLabel(selected)}</Text>
        <Text style={[styles.h,{marginTop:5}]}>{selected.title}</Text>
        <Text style={[styles.sub,{marginTop:8}]}>{selected.item_condition} · {selected.category} · {selected.region_label||'Region auf Anfrage'}</Text>
        <View style={{height:1,backgroundColor:C.line,marginVertical:18}}/>
        <Text style={styles.sectionTitle}>Beschreibung</Text>
        <Text style={styles.body}>{selected.description||'Keine weiteren Angaben.'}</Text>
        {(()=>{const seller=sellerInformation(selected);return <View style={{marginTop:20}}>
          <Text style={styles.sectionTitle}>Anbieter</Text>
          <Text style={styles.body}>{seller.seller}{seller.org?' ✦':''}</Text>
          <Text style={[styles.micro,{marginTop:4}]}>Grobe Region: {selected.region_label||'auf Anfrage'}</Text>
          {seller.own&&selected.moderation_status==='pending'?<Info warning>Dein Inserat wartet auf Freigabe und ist nur für dich sichtbar.</Info>:null}
          {seller.own&&selected.moderation_status==='sold'?<Info>Dieses Angebot ist vergeben und für andere nicht mehr sichtbar. Eine Zahlung über die App hat nicht stattgefunden.</Info>:null}
          {seller.own&&selected.moderation_status==='rejected'?<Info warning>Dein Inserat wurde nicht freigegeben.</Info>:null}
          {seller.own&&selected.moderation_status==='removed'?<Info warning>Dieses Inserat wurde entfernt.</Info>:null}
          {seller.own&&selected.moderation_status==='approved'?
            <View style={{marginTop:13}}><Button title="Als vergeben markieren" mode="outline" disabled={busy}
              onPress={()=>Alert.alert('Angebot abschließen?','Das Inserat verschwindet für andere Familien aus dem Basar. Damit wird kein Kauf oder Zahlungsvorgang ausgelöst.',[
                {text:'Abbrechen',style:'cancel'},
                {text:'Als vergeben markieren',onPress:()=>markListingSold(selected.id)}
              ])}/></View>:null}
          {seller.own&&selected.moderation_status==='pending'&&!selected.photo_path?
            <View style={{marginTop:12}}><Button title="Foto ergänzen" mode="outline" disabled={choosing||busy}
              onPress={()=>pick(asset=>uploadPendingPhoto(selected.id,asset))}/></View>:null}
          <View style={{marginTop:17}}>{contactButton(selected,seller.contact)}</View>
        </View>;})()}
        <Text style={[styles.micro,{marginTop:20}]}>Keine Zahlung über Familienfunke möglich. Prüfe Artikel und Übergabe sorgfältig.</Text>
      </Card>
    </View>:<>
      <View style={styles.marketSearchBox}>
        <Text style={{fontSize:19,color:C.accentDark,marginRight:10}}>⌕</Text>
        <TextInput accessibilityLabel="Angebote durchsuchen" style={styles.marketSearchInput}
          placeholder="Was suchst du?" placeholderTextColor="#647D82" value={query} onChangeText={setQuery} returnKeyType="search"/>
        {query.length>0?<Pressable accessibilityRole="button" accessibilityLabel="Suche löschen" onPress={()=>setQuery('')}>
          <Text style={{fontSize:20,color:C.muted}}>×</Text>
        </Pressable>:null}
      </View>
      <MarketCategoryDropdown label="Kategorie" value={filter} onChange={setFilter} options={MARKET_CATEGORIES} allOption/>
      <View style={styles.marketFilters}>
        <Pressable accessibilityRole="button" accessibilityState={{expanded:filterOpen}} onPress={()=>setFilterOpen(v=>!v)}
          style={[styles.marketFilterToggle,filterOpen&&{borderColor:C.accent}]}>
          <Text style={styles.marketFilterLabel}>⚙  Filter {filterOpen?'ausblenden':'anzeigen'}</Text>
        </Pressable>
        <View style={{flex:1}}>
          <MarketSortSelect value={sortBy} onChange={setSortBy}/>
        </View>
      </View>
      {filterOpen?<Card style={{marginBottom:15,padding:15}}>
        <Text style={styles.label}>Art des Angebots</Text>
        <View style={[styles.chipsRow,{marginTop:0,marginBottom:14}]}>
          {[['all','Alle'],['sell','Verkaufen'],['gift','Verschenken'],['swap','Tauschen']].map(([id,label])=>
            <Chip key={id} text={label} selected={tradeFilter===id} onPress={()=>setTradeFilter(id)}/>)}
        </View>
        <Row style={{gap:12,alignItems:'flex-start'}}>
          <View style={{flex:1}}><Input label="Preis ab (€)" value={minPrice} onChangeText={setMinPrice} keyboardType="decimal-pad" placeholder="0"/></View>
          <View style={{flex:1}}><Input label="Preis bis (€)" value={maxPrice} onChangeText={setMaxPrice} keyboardType="decimal-pad" placeholder="100"/></View>
        </Row>
        <Button mode="ghost" title="Filter zurücksetzen" small
          onPress={()=>{setFilter('Alle');setTradeFilter('all');setMinPrice('');setMaxPrice('');setSortBy('newest');}}/>
      </Card>:null}
      <Row style={{justifyContent:'space-between',marginBottom:12}}>
        <Text style={[styles.micro,{fontWeight:'800'}]}>{shown.length} {shown.length===1?'Anzeige':'Anzeigen'} gefunden</Text>
        <Text style={styles.micro}>Neu und gebraucht</Text>
      </Row>
      {shown.length===0?<Blank title="Noch keine passenden Angebote" body="Passe die Suche oder Filter an. Neue Anzeigen erscheinen nach Freigabe."/>:
        <View style={styles.marketGrid}>
        {shown.map(x=>{
          const seller=sellerInformation(x);
          return <Pressable key={x.id} accessibilityRole="button"
            accessibilityLabel={x.title+', '+priceLabel(x)+', '+x.item_condition+', '+(x.region_label||'Region nicht angegeben')}
            onPress={()=>setSelectedListing(x.id)} style={styles.marketTile}>
            <View style={styles.marketTileImage}>
              {photoUrls[x.id]?<Image source={{uri:photoUrls[x.id]}} style={styles.marketTilePhoto} resizeMode="cover"/>:
                <View style={[styles.marketTilePhoto,styles.marketImagePlaceholder]}><Text style={{fontSize:29,color:C.coral}}>♧</Text><Text style={styles.micro}>Noch kein Foto</Text></View>}
              <View style={styles.marketPricePill}><Text style={styles.marketPricePillText} numberOfLines={1}>{priceLabel(x)}</Text></View>
            </View>
            <View style={styles.marketTileBody}>
              <Text style={styles.marketTileTitle} numberOfLines={2}>{x.title}</Text>
              <Text style={styles.micro} numberOfLines={1}>{x.item_condition} · {x.category}</Text>
              <Text style={[styles.micro,{marginTop:3}]} numberOfLines={1}>⌖ {x.region_label||'Region auf Anfrage'}</Text>
              {seller.org?<Text style={[styles.micro,{marginTop:3,color:C.accentDark}]} numberOfLines={1}>{seller.org.name} ✦</Text>:null}
              {seller.own&&x.moderation_status!=='approved'?<Text style={[styles.micro,{color:x.moderation_status==='sold'?C.accentDark:C.warningText,marginTop:4}]}>{x.moderation_status==='sold'?'Vergeben · nur für dich sichtbar':x.moderation_status==='pending'?'In Prüfung · nur für dich sichtbar':'Nicht veröffentlicht'}</Text>:null}
            </View>
          </Pressable>;
        })}
        </View>}
    </>}
  </ScrollView>;
}
function MarketSortSelect({value,onChange}){
  const [open,setOpen]=useState(false);
  const options=[['newest','Neueste zuerst'],['low','Preis aufsteigend'],['high','Preis absteigend']];
  const selected=options.find(x=>x[0]===value)?.[1]||'Neueste zuerst';
  return <View style={{position:'relative'}}>
    <Pressable accessibilityRole="button" accessibilityLabel={'Sortierung: '+selected} accessibilityState={{expanded:open}}
      onPress={()=>setOpen(x=>!x)} style={styles.marketFilterToggle}>
      <Text style={styles.marketFilterLabel} numberOfLines={1}>{selected} ⌄</Text>
    </Pressable>
    {open?<View style={styles.marketSortOptions}>
      {options.map(([id,label])=><Pressable key={id} accessibilityRole="button"
        accessibilityState={{selected:value===id}} onPress={()=>{onChange(id);setOpen(false);}}
        style={styles.marketDropdownOption}>
        <Text style={[styles.body,value===id&&{color:C.accentDark,fontWeight:'800'}]}>{label}</Text>
        {value===id?<Text style={{color:C.accentDark}}>✓</Text>:null}
      </Pressable>)}
    </View>:null}
  </View>;
}

function PartnersScreen({organizations,partnerEvents,me,active,busy,applyOrg,createPartnerEvent,openInclusion}){
  const [applying,setApplying]=useState(false);
  const [kind,setKind]=useState('kita');
  const [name,setName]=useState('');
  const [region,setRegion]=useState('');
  const [description,setDescription]=useState('');
  const [places,setPlaces]=useState(false);
  const [eventForm,setEventForm]=useState(false);
  const [eventOrg,setEventOrg]=useState('');
  const [eventTitle,setEventTitle]=useState('');
  const [eventDesc,setEventDesc]=useState('');
  const [eventRegion,setEventRegion]=useState('');
  const [eventDate,setEventDate]=useState('');
  const [eventTime,setEventTime]=useState('10:00');
  const mine=organizations.filter(o=>o.owner_id===me);
  const approvedMine=mine.filter(o=>o.status==='approved');
  const shown=organizations.filter(o=>o.status==='approved'||o.owner_id===me);
  const events=partnerEvents.filter(e=>new Date(e.starts_at)>new Date());
  async function apply(){
    if(!active||name.trim().length<3)return Alert.alert('Einrichtung','Bitte den Namen der Einrichtung angeben.');
    const ok=await applyOrg({kind,name:safeString(name,100),region_label:safeString(region,80),
       description:safeString(description,800),open_places:places});
    if(ok){setApplying(false);setName('');setDescription('');setRegion('');setPlaces(false);}
  }
  async function postEvent(){
    const start=givenDate(eventDate,eventTime);
    const org=approvedMine.find(o=>o.id===(eventOrg||approvedMine[0]?.id));
    if(!org||!start||start<=new Date()||eventTitle.trim().length<4)
      return Alert.alert('Veranstaltung prüfen','Bitte Einrichtung, Titel und zukünftiges Datum korrekt eintragen.');
    const ok=await createPartnerEvent({organization_id:org.id,title:safeString(eventTitle,100),
       description:safeString(eventDesc,1000),region_label:safeString(eventRegion,80),starts_at:start.toISOString()});
    if(ok){setEventForm(false);setEventTitle('');setEventDesc('');setEventDate('');}
  }
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <H sub="Kitas, Fördervereine und Familienzentren in deiner Region.">Kita & Partnerwelt</H>
    <Info>{SECTION_MESSAGES.partners}</Info>
    <Card style={{marginBottom:14}}>
      <Text style={styles.cardTitle}>Einrichtungen willkommen!</Text>
      <Text style={styles.sub}>Stellt eure Kita vor, zeigt bei Bedarf freie Plätze und kündigt Flohmärkte an. Ein Partnerprofil wird erst nach Prüfung öffentlich sichtbar.</Text>
      <View style={{marginTop:13}}><Button title={applying?'Antrag schließen':'＋ Einrichtung anmelden'} mode="outline" disabled={!active} onPress={()=>setApplying(x=>!x)}/></View>
    </Card>
    {applying?<Card style={{marginBottom:13}}>
      <Text style={styles.sectionTitle}>Partnerkonto beantragen</Text>
      <Text style={styles.label}>Art der Einrichtung</Text>
      <View style={styles.chipsRow}>{ORG_KINDS.map(([id,txt])=><Chip key={id} text={txt} selected={kind===id} onPress={()=>setKind(id)}/>)}</View>
      <View style={{marginTop:17}}><Input label="Name der Einrichtung" value={name} onChangeText={setName} maxLength={100}/></View>
      <Input label="Ort / Region" value={region} onChangeText={setRegion} maxLength={80}/>
      <Input label="Kurzvorstellung" multiline value={description} onChangeText={setDescription} maxLength={800}/>
      <Row style={{marginBottom:15,justifyContent:'space-between'}}>
        <Text style={[styles.label,{flex:1}]}>Einrichtung hat laut eigener Angabe freie Plätze</Text>
        <Switch accessibilityLabel="Freie Plätze melden" value={places} onValueChange={setPlaces}/>
      </Row>
      <Text style={[styles.micro,{marginBottom:12}]}>Mit diesem Antrag wird kein verifiziertes Konto erstellt. Unsere Betreiber prüfen die Einrichtung und die Berechtigung zur Vertretung. Bis dahin bleibt das Partnerprofil verborgen.</Text>
      <Button title="Antrag kostenlos einreichen" disabled={busy||!active} onPress={apply}/>
    </Card>:null}
    <Text style={styles.sectionTitle}>Kitas und Partner</Text>
    {shown.length===0?<Blank title="Partnerwelt im Aufbau" body="Nach Bestätigung der ersten Einrichtungen entstehen hier Kita-Profile, Vorstellungen und Veranstaltungen."/>:
       shown.map(o=><Card key={o.id} style={{marginBottom:12}}>
          <Row style={{alignItems:'flex-start'}}>
            <View style={{width:42,height:42,borderRadius:12,backgroundColor:C.sunny,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:21}}>✿</Text></View>
            <View style={{flex:1}}>
              <Row style={{alignItems:'baseline',gap:5,flexWrap:'wrap'}}>
                <Text style={styles.cardTitle}>{o.name}</Text>
                {o.status==='approved'?<Text accessibilityLabel="Einrichtung geprüft" style={{fontSize:13,color:C.accentDark}}>✦</Text>:null}
              </Row>
              <Text style={styles.micro}>{ORG_KINDS.find(([id])=>id===o.kind)?.[1]||'Einrichtung'} · {o.region_label||'Region folgt'}</Text>
            </View>
          </Row>
          {o.description?<Text style={[styles.body,{marginTop:11}]}>{o.description}</Text>:null}
          {o.status==='approved'&&o.open_places?<Text style={[styles.micro,{marginTop:9,color:C.accentDark,fontWeight:'800'}]}>Freie Plätze · Angabe der Einrichtung, bitte direkt erfragen</Text>:null}
          {o.owner_id===me&&o.status!=='approved'?<Text style={[styles.micro,{marginTop:11}]}>Dein Antrag ist nur für dich sichtbar. Freigabe ausstehend.</Text>:null}
       </Card>)}
    {approvedMine.length>0?<Card style={{marginTop:6,marginBottom:13}}>
        <Text style={styles.sectionTitle}>Flohmarkt oder Kita-Veranstaltung ankündigen</Text>
        <Button title={eventForm?'Formular schließen':'＋ Partnerveranstaltung erstellen'} mode="outline" onPress={()=>setEventForm(v=>!v)}/>
        {eventForm?<View style={{marginTop:15}}>
          <Text style={styles.label}>Für welche Einrichtung?</Text>
          <View style={styles.chipsRow}>{approvedMine.map(o=><Chip key={o.id} text={o.name} selected={(eventOrg||approvedMine[0]?.id)===o.id} onPress={()=>setEventOrg(o.id)}/>)}</View>
          <View style={{marginTop:16}}><Input label="Titel" maxLength={100} value={eventTitle} onChangeText={setEventTitle} placeholder="Sommerflohmarkt der Kita …"/></View>
          <Input label="Beschreibung" multiline maxLength={1000} value={eventDesc} onChangeText={setEventDesc}/>
          <Input label="Region" maxLength={80} value={eventRegion} onChangeText={setEventRegion}/>
          <Input label="Datum (JJJJ-MM-TT)" value={eventDate} onChangeText={setEventDate} placeholder="2026-12-12"/>
          <Input label="Uhrzeit (HH:MM)" value={eventTime} onChangeText={setEventTime}/>
          <Button title="Veranstaltung zur Freigabe senden" disabled={busy} onPress={postEvent}/>
        </View>:null}
    </Card>:null}
    <Text style={[styles.sectionTitle,{marginTop:15}]}>Flohmärkte & Veranstaltungen</Text>
    {events.length===0?<Blank title="Noch keine Partnerveranstaltungen" body="Bestätigte Einrichtungen können hier ihre Flohmärkte und Termine bewerben."/>:
       events.map(e=><Card key={e.id} style={{marginBottom:12}}>
          <Text style={[styles.eyebrow,{marginBottom:7}]}>{formatDate(e.starts_at)}</Text>
          <Text style={styles.cardTitle}>{e.title}</Text>
          <Text style={styles.micro}>{organizations.find(o=>o.id===e.organization_id)?.name||'Einrichtung'} · {e.region_label||'Ort auf Anfrage'}</Text>
          {e.description?<Text style={[styles.body,{marginTop:8}]}>{e.description}</Text>:null}
          {e.creator_id===me&&e.moderation_status!=='approved'?<Text style={[styles.micro,{marginTop:10}]}>Für dich sichtbar · wartet auf Freigabe</Text>:null}
       </Card>)}
    <View style={{marginTop:13}}><Button title="Inklusion und Familienunterstützung" mode="ghost" onPress={openInclusion}/></View>
  </ScrollView>;
}
function MoreScreen({navigate,openInfo,openWelcome}){
  const items=[['events','▦','Treffen & Veranstaltungen','Familientreffen planen und gemeinsam etwas unternehmen'],
  ['contacts','♡','Kontakte','Kontaktanfragen und Freundschaften verwalten'],
  ['chat','✉','Nachrichten','Private Unterhaltungen mit bestätigten Kontakten'],
  ['profile','◉','Mein Profil','Hobbys, Fotos und Privatsphäre einstellen'],
  ['inclusion','✿','Familien & Inklusion','Anlaufstelle ohne Nachweis- oder Diagnosepflicht'],
  ['partners','✿','Kitas & Partnerwelt','Einrichtungen, freie Plätze und Kita-Veranstaltungen'],
  ['aboutApp','♡','Über Familienfunke','Wie unsere Idee entstanden ist'],
  ['welcome','☀','Unser Familienfunke','Die Willkommenskarte noch einmal ansehen'],
  ['help','?','Hilfe & FAQ','Schritt-für-Schritt-Anleitungen zur App']];
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <H sub="Deine Kontakte, Einstellungen und unterstützenden Angebote.">Weitere Bereiche</H>
    {items.map(([id,icon,title,subtitle])=><Pressable accessibilityRole="button" accessibilityLabel={title} key={id} onPress={()=>id==='welcome'?openWelcome():navigate(id)}>
      <Card style={{marginBottom:12}}><Row><Text style={{fontSize:26,color:C.coral,width:36}}>{icon}</Text>
      <View style={{flex:1}}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.sub}>{subtitle}</Text></View>
      <Text style={{fontSize:20,color:C.accent}}>›</Text></Row></Card></Pressable>)}
    <Button title="Elternwissen & hilfreiche Links" mode="outline" onPress={openInfo}/>
  </ScrollView>;
}
function InclusionScreen(){
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <H sub="Gemeinsam dazugehören. Mit eigenen Bedürfnissen, Stärken und Erfahrungen.">Familien & Inklusion</H>
    <Info>{SECTION_MESSAGES.inclusion}</Info>
    <Card style={{marginBottom:14}}>
      <Text style={styles.sectionTitle}>Hier hat jede Familie ihren Platz</Text>
      <Text style={styles.body}>Familien mit behinderten Kindern, Eltern mit Behinderung und alle, die sich für Inklusion interessieren, sollen sich hier willkommen fühlen – ohne Etiketten, Pflichtangaben oder medizinische Nachweise.</Text>
    </Card>
    <Card style={{marginBottom:14}}>
      <Text style={styles.cardTitle}>Geschützter Austausch ist in Vorbereitung</Text>
      <Text style={styles.sub}>Für spätere freiwillige Gruppen planen wir einen geschützten Zugang, klare Gruppenregeln sowie Melde- und Moderationsmöglichkeiten. Noch gibt es hier keine geschlossenen Chats. Es werden auch keine Angaben über Behinderungen gespeichert.</Text>
    </Card>
    <Card style={{marginBottom:14}}>
      <Text style={styles.cardTitle}>Barrierefreiheit ist keine Sonderfunktion</Text>
      <Text style={styles.sub}>Gute Lesbarkeit, ausreichend große Bedienelemente, verständliche Sprache und Unterstützung der Bedienungshilfen sollen in der gesamten App gelten. Dieser erste Bereich ist keine Zertifizierung der App als barrierefrei.</Text>
    </Card>
    <Card><Text style={styles.cardTitle}>Gemeinsame Freizeit</Text>
      <Text style={styles.sub}>Später können Veranstaltungen freiwillige Informationen zu Zugänglichkeit, Ruhezonen, Rollstuhlzugang und Unterstützungsangeboten enthalten. Diese Angaben sollen Veranstalter bereitstellen, ohne Gesundheitsdaten der Familien abzufragen.</Text>
    </Card>
  </ScrollView>;
}

function DiscoverScreen({matches,requests,me,active,busy,myProfile,verification,membership,showFamily,onContact,imageFor,blocked}) {
const [query,setQuery]=useState('');
const [interest,setInterest]=useState('Alle');
const [onlyRegion,setOnlyRegion]=useState(false);
const [onlyShared,setOnlyShared]=useState(false);
const [mode,setMode]=useState('cards');
const [cardIndex,setCardIndex]=useState(0);
const myRegion=myProfile?.region_label||'';
const filtered=matches.filter(p=>
!blocked(p.user_id)&&
(!query||normalizeLabel(p.display_name+' '+(p.region_label||'')+' '+(p.interests||[]).join(' ')).includes(normalizeLabel(query)))&&
(interest==='Alle'||p.interests?.includes(interest))&&
(!onlyRegion||sameRegion(p.region_label,myRegion))&&
(!onlyShared||p.match>0)
);
const index=Math.min(cardIndex,Math.max(0,filtered.length-1));
function updateFilter(setter,value){setter(value);setCardIndex(0);}
function familyCard(p){
const existing=requests.find(c=>(c.sender_id===me&&c.recipient_id===p.user_id)||(c.recipient_id===me&&c.sender_id===p.user_id));
const regional=sameRegion(p.region_label,myRegion);
return <Card key={p.user_id} style={{marginBottom:12}}>
<Row><Avatar name={p.display_name} size={64} uri={imageFor(p.user_id)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{p.display_name}</Text><Text style={styles.micro}>⌖ {p.region_label||'Region nicht angegeben'}</Text>{regional?<Text style={[styles.micro,{color:C.accentDark,fontWeight:'800',marginTop:3}]}>✓ Gleiche Region</Text>:null}</View>{p.match>0?<View style={styles.match}><Text style={styles.matchText}>{p.match} gemeinsam</Text></View>:null}</Row>
{p.about?<Text style={[styles.body,{marginTop:13}]} numberOfLines={mode==='cards'?5:3}>{p.about}</Text>:null}
<View style={styles.chipsRow}>{(p.interests||[]).slice(0,mode==='cards'?8:5).map(i=><Chip key={i} text={i}/>)}</View>
<Row style={{marginTop:16}}><Button title="Profil ansehen" mode="outline" small style={{flex:1}} onPress={()=>showFamily(p.user_id)}/>
<Button title={existing?existing.status==='accepted'?'Verbunden':existing.status==='pending'?'Anfrage offen':'Angefragt':'Kontakt anfragen'} small disabled={busy||!!existing} style={{flex:1}} onPress={()=>onContact(p.user_id)}/></Row>
</Card>;
}
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<View style={styles.hero}>
<View style={styles.heroDecorationOne} pointerEvents="none"/>
<View style={styles.heroDecorationTwo} pointerEvents="none"/>
<View style={styles.heroPill}><Text style={styles.heroPillText}>✦ GEMEINSAM MEHR ERLEBEN</Text></View>
<Text style={styles.heroTitle}>Familien entdecken, die zu euch passen.</Text>
<Text style={styles.heroText}>Entdecke gemeinsame Hobbys und Familien aus deiner Region – ganz ohne Standortfreigabe.</Text>
<View style={styles.heroTagline}><Text style={styles.heroTaglineText}>♥  Aus Nachbarschaft wird Freundschaft.</Text></View>
</View>
{!active?<Info warning>Dein Konto wartet noch auf persönliche Erwachsenenprüfung oder Profilfreigabe. Profilstatus: {myProfile?.moderation_status||'–'} · Verifizierung: {verification?.status||'–'}.</Info>:null}
<Info>{SECTION_MESSAGES.discover}</Info><H sub="Nur freigegebene, freiwillig sichtbare Familienprofile.">Familien entdecken</H>
<Input label="Suche nach Familie, Region oder Interesse" placeholder="z. B. Natur, Beeskow …" value={query} onChangeText={value=>updateFilter(setQuery,value)} />
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:13}}>
{['Alle',...INTERESTS].map(i=><View key={i} style={{marginRight:6}}><Chip text={i} selected={interest===i} onPress={()=>updateFilter(setInterest,i)}/></View>)}
</ScrollView>
<View style={styles.filterPanel}>
<Row style={{justifyContent:'space-between',marginBottom:10}}>
<View style={{flex:1}}><Text style={styles.label}>Nur meine Region</Text><Text style={styles.micro}>{myRegion?'Gleiche Region oder bekannter Ort im selben Landkreis':'Bitte zuerst deine Region im Profil auswählen'}</Text></View>
<Switch disabled={!myRegion} value={onlyRegion&&!!myRegion} onValueChange={value=>updateFilter(setOnlyRegion,value)} trackColor={{true:C.accent}}/>
</Row>
<Row style={{justifyContent:'space-between'}}>
<View style={{flex:1}}><Text style={styles.label}>Gemeinsame Hobbys</Text><Text style={styles.micro}>Mindestens ein gemeinsames Interesse</Text></View>
<Switch value={onlyShared} onValueChange={value=>updateFilter(setOnlyShared,value)} trackColor={{true:C.accent}}/>
</Row>
</View>
<Row style={{justifyContent:'space-between',marginBottom:14,marginTop:5}}>
<Text style={[styles.micro,{fontWeight:'800'}]}>{filtered.length} {filtered.length===1?'Familie':'Familien'} gefunden</Text>
<Row><Chip text="Karten" selected={mode==='cards'} onPress={()=>setMode('cards')}/><Chip text="Liste" selected={mode==='list'} onPress={()=>setMode('list')}/></Row>
</Row>
{!active?<Blank title="Zunächst Freigabe abwarten" body="Sobald das Konto geprüft ist, erscheinen freigegebene Familienprofile."/>:
filtered.length===0?<Blank title="Keine passenden Familien gefunden" body="Probiere andere Interessen, eine größere Region oder entferne die Filter."/>:
mode==='cards'?<>
<Text style={[styles.micro,{textAlign:'center',marginBottom:12}]}>Familie {index+1} von {filtered.length} · Du entscheidest, wen du kontaktierst.</Text>
{familyCard(filtered[index])}
<Row style={{justifyContent:'space-between',gap:12}}>
<Button title="← Zurück" mode="outline" disabled={index===0} style={{flex:1}} onPress={()=>setCardIndex(index-1)}/>
<Button title="Nächste Familie →" mode="outline" disabled={index===filtered.length-1} style={{flex:1}} onPress={()=>setCardIndex(index+1)}/>
</Row>
</>:filtered.map(p=>familyCard(p))}
<Text style={[styles.micro,{marginTop:17,textAlign:'center'}]}>„Meine Region“ nutzt freiwillige Regionsnamen und bekannte Landkreis-Zuordnungen, keine Kilometerentfernungen. Exakte Standorte werden nicht abgefragt.</Text>
</ScrollView>;
}
function FamilyDetail({p,photos,photosUrls,active,disabled,blocked,connection,onContact,onBlock,onUnblock,onReport,onChat}){
if(!p)return <Blank title="Profil nicht verfügbar" body="Das Profil kann verborgen oder gesperrt worden sein."/>;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<Card style={{alignItems:'center',paddingTop:26}}><Avatar name={p.display_name} size={88} uri={photosUrls?.[photos?.[0]?.id]}/><Text style={[styles.h,{marginTop:12,textAlign:'center'}]}>{p.display_name}</Text><Text style={styles.sub}>⌖ {p.region_label||'Grobe Region nicht angegeben'}</Text><Text style={[styles.body,{textAlign:'center',marginTop:14}]}>{p.about||'Noch keine Beschreibung'}</Text>
<View style={[styles.chipsRow,{justifyContent:'center'}]}>{(p.interests||[]).map(i=><Chip text={i} key={i}/>)}</View>
{connection?.status==='accepted'?<Button title="Private Nachricht schreiben" onPress={()=>onChat(connection.id)}/>:
!blocked&&active?<Button title={connection?'Kontaktanfrage vorhanden':'Kontakt anfragen'} disabled={disabled||!!connection} onPress={onContact}/>:null}
<Row style={{marginTop:12}}>{blocked?<Button title="Entsperren" mode="outline" small onPress={onUnblock}/>:<Button title="Blockieren" mode="outline" small onPress={onBlock}/>}<Button title="Melden" mode="ghost" small onPress={onReport}/></Row>
</Card>
{photos?.length>0?<><H sub="Freigegebene Fotos sind nur bestätigten Kontakten sichtbar.">Familienbilder</H><View style={styles.photoGrid}>{photos.map(photo=><Card key={photo.id} style={styles.photoCard}>{photosUrls[photo.id]?<Image source={{uri:photosUrls[photo.id]}} style={styles.photoImage}/>:null}<Text style={styles.micro}>{photo.caption||'Profilfoto'}</Text></Card>)}</View></>:null}
</ScrollView>;
}
function ContactsScreen({pending,accepted,me,nameOf,respond,blocked,disabled,onBlock,onUnblock,onChat}){
const other=c=>c.sender_id===me?c.recipient_id:c.sender_id;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<H sub="Nachrichten sind erst nach gegenseitiger Bestätigung möglich.">Deine Kontakte</H>
<Text style={styles.sectionTitle}>Offene Anfragen</Text>
{pending.length===0?<Blank title="Keine offenen Anfragen" body="Neue Kontaktwünsche erscheinen hier."/>:pending.map(c=><Card key={c.id} style={{marginBottom:10}}>
<Row><Avatar name={nameOf(other(c))}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other(c))}</Text><Text style={styles.micro}>{c.recipient_id===me?'Möchte dich kennenlernen':'Von dir angefragt'}</Text></View></Row>
<Row style={{marginTop:13}}>{c.recipient_id===me?<><Button title="Annehmen" small disabled={disabled} onPress={()=>respond(c.id,'accepted')} style={{flex:1}}/><Button title="Ablehnen" mode="outline" small disabled={disabled} onPress={()=>respond(c.id,'declined')} style={{flex:1}}/></>:<Button title="Zurückziehen" small mode="outline" disabled={disabled} onPress={()=>respond(c.id,'cancelled')}/>}</Row>
</Card>)}
<Text style={styles.sectionTitle}>Bestätigte Kontakte</Text>
{accepted.length===0?<Blank title="Noch keine Kontakte" body="Bestätigte Familien erscheinen hier."/>:accepted.map(c=>{const uid=other(c);return <Card key={c.id} style={{marginBottom:10}}>
<Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text><Text style={styles.micro}>{blocked(uid)?'Blockiert':'Kontakt bestätigt'}</Text></View></Row>
<Row style={{marginTop:12}}><Button title="Nachrichten" small disabled={blocked(uid)} onPress={()=>onChat(c.id)} style={{flex:1}}/>{blocked(uid)?<Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(uid)}/>:<Button title="Blockieren" small mode="outline" onPress={()=>onBlock(uid)}/>}</Row>
</Card>;})}
</ScrollView>;
}
function ChatList({contacts,me,nameOf,messages,onChat,blocked}){
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<H sub="Persönlich und privat – nur mit bestätigten Familien.">Nachrichten</H>
{contacts.length===0?<Blank title="Noch keine Gespräche" body="Sobald eine Kontaktanfrage angenommen wurde, kannst du eine Nachricht schreiben."/>:
contacts.map(c=>{const uid=c.sender_id===me?c.recipient_id:c.sender_id;const last=messages.filter(m=>m.contact_id===c.id)[0];return <Pressable key={c.id} onPress={()=>onChat(c.id)}>
<Card style={{marginBottom:11}}><Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text><Text numberOfLines={1} style={styles.sub}>{blocked(uid)?'Kontakt blockiert':last?.body||'Noch keine Nachrichten'}</Text></View><Text style={{fontSize:23,color:C.accent}}>›</Text></Row></Card>
</Pressable>;})}
</ScrollView>;
}
function ChatScreen({contact,me,nameOf,messages,disabled,blocked,send,onReport,onBlock}) {
const [text,setText]=useState('');
if(!contact)return <Blank title="Gespräch nicht verfügbar" body="Kontakt ist nicht mehr bestätigt oder wurde verborgen."/>;
const other=contact.sender_id===me?contact.recipient_id:contact.sender_id;
const sorted=[...messages].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
async function submit(){const body=text.trim();if(!body)return; const ok=await send(body);if(ok)setText('');}
return <View style={{flex:1}}>
<Row style={styles.chatHeader}><Avatar name={nameOf(other)} size={38}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other)}</Text><Text style={styles.micro}>Privates Gespräch</Text></View><Button title="Blockieren" small mode="ghost" onPress={()=>onBlock(other)}/></Row>
<ScrollView style={{flex:1}} contentContainerStyle={{padding:16}} keyboardShouldPersistTaps="handled">
{sorted.length===0?<Blank title="Sag Hallo!" body="Hier beginnt euer privates Gespräch."/>:sorted.map(m=><View key={m.id} style={[styles.bubble,m.sender_id===me?styles.mine:styles.theirs]}>
<Text style={[styles.bubbleText,m.sender_id===me&&{color:C.white}]}>{m.body}</Text>
<Row style={{justifyContent:'space-between',marginTop:7}}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>{formatDate(m.created_at)}</Text><Pressable onPress={()=>onReport(m.id)}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>Melden</Text></Pressable></Row>
</View>)}
</ScrollView>
{blocked(other)?<Info warning>Du hast diese Person blockiert. Neue Nachrichten sind nicht erlaubt.</Info>:
<Row style={styles.chatComposer}><TextInput placeholder="Nachricht schreiben …" value={text} onChangeText={setText} maxLength={2000} multiline
placeholderTextColor="#9AAFB4" style={[styles.input,{flex:1,maxHeight:100,marginBottom:0}]}/><Button title="Senden" small disabled={disabled||!text.trim()} onPress={submit}/></Row>}
</View>;
}
function EventsScreen({events,eventRequests,me,active,busy,profiles,showForm,setShowForm,createEvent,requestEvent,replyEvent,reportEvent}){
const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [region,setRegion]=useState('');
const [date,setDate]=useState('');const [time,setTime]=useState('15:00');const [count,setCount]=useState('10');const [visibility,setVisibility]=useState('community');
const names=(uid)=>profiles.find(p=>p.user_id===uid)?.display_name||'Familie';
async function submit(){
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return Alert.alert('Termin prüfen','Bitte Datum als JJJJ-MM-TT und Zeit als HH:MM eingeben.');
const start=givenDate(date,time);const max=parseInt(count,10);
if(!start||start<=new Date()||title.trim().length<4||max<2||max>50)return Alert.alert('Bitte prüfen','Titel, zukünftigen Beginn und Teilnehmerzahl (2–50) korrigieren.');
const ok=await createEvent({title:safeString(title,100),description:safeString(description,1000),region_label:safeString(region,80),starts_at:start.toISOString(),ends_at:new Date(start.getTime()+2*60*60*1000).toISOString(),max_participants:max,visibility});
if(ok){setShowForm(false);setTitle('');setDescription('');setDate('');}
}
const upcoming=events.filter(e=>new Date(e.ends_at)>new Date());
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<Info>{SECTION_MESSAGES.events}</Info><H sub="Gemeinsame Aktivitäten statt öffentlicher Diskussionen.">Familienkalender</H>
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
<Button title="Zur Freigabe einreichen" disabled={busy} onPress={submit}/>
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
</ScrollView>;
}
function ProfileScreen({profile,verification,membership,active,photos,photosUrls,busy,save,uploadPhoto,deletePhoto,reportPhoto,blocks,onUnblock,changePassword,openInfo,signOut}){
const [form,setForm]=useState(blankProfile);
const [photoCaption,setPhotoCaption]=useState('');
const [selectedPhoto,setSelectedPhoto]=useState(null);
const [photoPickerBusy,setPhotoPickerBusy]=useState(false);
const [newPassword,setNewPassword]=useState('');
const [profileSection,setProfileSection]=useState('about');
useEffect(()=>{if(profile)setForm({...blankProfile,...profile,interests:Array.isArray(profile.interests)?profile.interests:[]});},[profile?.updated_at,profile?.user_id]);
async function submit(){if((form.display_name||'').trim().length<2)return Alert.alert('Anzeigename fehlt','Bitte mindestens zwei Zeichen angeben.');
await save({display_name:safeString(form.display_name,60),region_label:safeString(form.region_label,80),about:safeString(form.about,500),interests:(form.interests||[]).slice(0,12),is_discoverable:!!form.is_discoverable});}
function toggle(i){setForm(f=>({...f,interests:f.interests.includes(i)?f.interests.filter(x=>x!==i):f.interests.length>=12?f.interests:[...f.interests,i]}));}
async function updatePassword(){if(newPassword.length<12)return Alert.alert('Passwort','Bitte mindestens 12 Zeichen verwenden.');const ok=await changePassword(newPassword);if(ok)setNewPassword('');}
async function selectDraftPhoto(){
  if(busy||photoPickerBusy)return;
  setPhotoPickerBusy(true);
  try {
    const result=await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['images'],allowsEditing:true,quality:0.85,exif:false,
    });
    if(!result.canceled&&result.assets?.[0]?.uri){
      setSelectedPhoto(result.assets[0]);
    }
  } catch(e){
    Alert.alert('Fotoauswahl fehlgeschlagen',humanError(e));
  } finally {
    setPhotoPickerBusy(false);
  }
}
async function submitDraftPhoto(){
  if(!selectedPhoto||busy||photoPickerBusy)return;
  const ok=await uploadPhoto(selectedPhoto,photoCaption);
  if(ok){
    setSelectedPhoto(null);
    setPhotoCaption('');
  }
}
const completed=[form.display_name?.trim().length>=2,!!form.region_label?.trim(),!!form.about?.trim(),(form.interests||[]).length>0].filter(Boolean).length;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<H sub="Du entscheidest, was andere Familien von euch erfahren.">Mein Familienprofil</H>
<Card>
<Row><Avatar size={65} name={profile?.display_name}/><View style={{flex:1}}><Text style={styles.cardTitle}>{profile?.display_name||'Deine Familie'}</Text><Text style={styles.micro}>{active?'✓ Erwachsener geprüft, Profil freigegeben':'⌛ Prüfung oder Freigabe ausstehend'}</Text><Text style={styles.micro}>Mitgliedschaft: {membership?.status||'–'}</Text></View></Row>
<View style={{marginTop:15}}>
<Row style={{justifyContent:'space-between',marginBottom:6}}><Text style={styles.label}>Profil gestalten</Text><Text style={styles.micro}>{completed} von 4 freiwilligen Angaben</Text></Row>
<View style={styles.progressTrack}><View style={[styles.progressFill,{width:(completed*25)+'%'}]}/></View>
</View>
{!active?<Info warning>Neue Profilangaben werden manuell geprüft. Die Foto-/Videoverifizierung folgt erst in einer späteren Version.</Info>:null}
</Card>
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingVertical:12}} style={{marginTop:9,marginBottom:8}}>
{[['about','Über uns'],['hobbies','Hobbys'],['privacy','Sichtbarkeit'],['photos','Fotos'],['security','Konto & Sicherheit']].map(([id,title])=><Chip key={id} text={title} selected={profileSection===id} onPress={()=>setProfileSection(id)}/>)}
</ScrollView>
{profileSection==='about'?<Card>
<Text style={styles.sectionTitle}>Über eure Familie</Text>
<Text style={[styles.sub,{marginBottom:14}]}>Ein paar freiwillige Angaben helfen beim Kennenlernen.</Text>
<Input label="Anzeigename" value={form.display_name} onChangeText={x=>setForm(p=>({...p,display_name:x}))} maxLength={60}/>
<RegionPicker value={form.region_label} onChange={x=>setForm(p=>({...p,region_label:x}))}/>
<Input label="Über uns" multiline value={form.about} onChangeText={x=>setForm(p=>({...p,about:x}))} maxLength={500} placeholder="Was macht ihr gern? Was möchtet ihr gemeinsam erleben?"/>
<Button title={busy?'Bitte warten …':'Angaben speichern'} disabled={busy} onPress={submit}/>
</Card>:null}
{profileSection==='hobbies'?<Card>
<Text style={styles.sectionTitle}>Hobbys & Interessen</Text>
<Text style={[styles.sub,{marginBottom:14}]}>Wähle bis zu zwölf Themen. Danach findest du leichter Familien mit ähnlichen Interessen.</Text>
<Text style={styles.label}>Ausgewählt: {(form.interests||[]).length} von 12</Text>
<View style={[styles.chipsRow,{marginBottom:18}]}>{INTERESTS.map(i=><Chip key={i} text={i} selected={form.interests?.includes(i)} onPress={()=>toggle(i)}/>)}</View>
<Button title={busy?'Bitte warten …':'Interessen speichern'} disabled={busy} onPress={submit}/>
</Card>:null}
{profileSection==='privacy'?<Card>
<Text style={styles.sectionTitle}>Privatsphäre & Sichtbarkeit</Text>
<Text style={[styles.sub,{marginBottom:15}]}>Du bestimmst, ob andere freigegebene Familien euch entdecken können.</Text>
<Row style={{marginBottom:18,justifyContent:'space-between'}}><View style={{flex:1}}><Text style={styles.label}>Für andere Familien sichtbar</Text><Text style={styles.micro}>Erst nach Profilfreigabe und nur mit grober Regionsangabe</Text></View><Switch value={!!form.is_discoverable} onValueChange={value=>setForm(p=>({...p,is_discoverable:value}))} trackColor={{true:C.accent}}/></Row>
<Info>Deine genaue Adresse oder dein Live-Standort werden bei der Familiensuche nicht abgefragt. Kontaktanfragen musst du selbst annehmen.</Info>
<Button title={busy?'Bitte warten …':'Sichtbarkeit speichern'} disabled={busy} onPress={submit}/>
</Card>:null}
{profileSection==='photos'?<><Card style={{marginTop:13}}><Text style={styles.sectionTitle}>Profilfotos</Text><Text style={[styles.sub,{marginBottom:13}]}>Nur bestätigte Kontakte sehen freigegebene Bilder. Bitte während der Beta keine Kinderfotos hochladen.</Text>
<Text style={styles.label}>1. Foto auswählen</Text>
<Button title={selectedPhoto?'Anderes Foto auswählen':'＋ Foto auswählen'}
  disabled={busy||photoPickerBusy} mode="outline" onPress={selectDraftPhoto}/>
{selectedPhoto?<View style={{marginTop:14}}>
  <Image source={{uri:selectedPhoto.uri}} style={styles.photoDraftPreview} resizeMode="contain"/>
  <Input label="2. Kurze Bildbeschreibung (optional)" value={photoCaption}
    onChangeText={setPhotoCaption} maxLength={200}
    placeholder="Was möchtest du zu diesem Foto erzählen?"/>
  <Text style={[styles.micro,{marginBottom:12}]}>
    Dein Foto und die Beschreibung werden erst nach dem Einreichen geprüft.
    Bis zur Freigabe bleibt das Foto für andere Familien verborgen.
  </Text>
  <Row style={{alignItems:'stretch'}}>
    <Button title="Verwerfen" mode="outline" small disabled={busy||photoPickerBusy}
      style={{flex:1}} onPress={()=>{setSelectedPhoto(null);setPhotoCaption('');}}/>
    <Button title={busy?'Wird eingereicht …':'Foto einreichen'}
      disabled={busy||photoPickerBusy} style={{flex:1}} onPress={submitDraftPhoto}/>
  </Row>
</View>:<Text style={[styles.micro,{marginTop:10}]}>
  Nach der Fotoauswahl kannst du eine Beschreibung ergänzen und beides zusammen einreichen.
</Text>}
<View style={[styles.photoGrid,{marginTop:15}]}>{photos.map(p=><Card key={p.id} style={styles.photoCard}>
{photosUrls[p.id]?<Image source={{uri:photosUrls[p.id]}} style={styles.photoImage}/>:<View style={[styles.photoImage,{backgroundColor:C.pale}]}/>}
<Text style={styles.micro} numberOfLines={2}>{p.caption||'Profilbild'}</Text><Text style={[styles.micro,{color:p.moderation_status==='approved'?C.accent:C.warningText}]}>{p.moderation_status==='approved'?'Freigegeben':p.moderation_status==='pending'?'In Prüfung':'Abgelehnt'}</Text>
<Button title="Löschen" small mode="ghost" onPress={()=>deletePhoto(p.id)}/>
</Card>)}</View>
{photos.length===0?<Text style={[styles.micro,{marginTop:10}]}>Noch keine Bilder hochgeladen.</Text>:null}
</Card>
</>:null}
{profileSection==='security'?<><Card style={{marginTop:13}}><Text style={styles.sectionTitle}>Sicherheit und Einstellungen</Text>
<Button title="Elternwissen öffnen" mode="outline" onPress={openInfo}/>
<Text style={[styles.label,{marginTop:18}]}>Passwort ändern</Text><Input label="Neues Passwort (mindestens 12 Zeichen)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none"/>
<Button title="Passwort ändern" small mode="outline" disabled={busy||newPassword.length<12} onPress={updatePassword}/>
{blocks.length>0?<View style={{marginTop:18}}><Text style={styles.label}>Blockierte Konten</Text>{blocks.map(b=><Row key={b.blocked_id} style={{marginTop:7,justifyContent:'space-between'}}><Text style={styles.micro}>Konto …{b.blocked_id.slice(-7)}</Text><Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(b.blocked_id)}/></Row>)}</View>:null}
<View style={{height:16}}/><Button title="Abmelden" mode="ghost" onPress={signOut}/>
</Card>
</>:null}
</ScrollView>;
}
function InfoScreen(){
const links=[
['Elterngeld & Elternzeit','Familienportal des Bundes','https://familienportal.de/'],
['Kindergeld & Kinderzuschlag','Bundesagentur für Arbeit','https://www.arbeitsagentur.de/familie-und-kinder'],
['Bundesgesetze nachlesen','Gesetze im Internet','https://www.gesetze-im-internet.de/'],
['Kita und Schule','Deutscher Bildungsserver','https://www.bildungsserver.de/'],
];
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}><H sub="Verlässliche Quellen statt ungeprüfter Diskussionen.">Elternwissen</H>
<Info>Die Links führen zu öffentlichen Informationsangeboten. Familienfunke bietet derzeit keine individuelle Rechtsberatung oder Antragsübermittlung an.</Info>
{links.map(([name,subtitle,url])=><Pressable key={name} onPress={()=>Linking.openURL(url)}><Card style={{marginBottom:12}}><Row><View style={{flex:1}}><Text style={styles.cardTitle}>{name}</Text><Text style={styles.sub}>{subtitle}</Text></View><Text style={{fontSize:25,color:C.accent}}>↗</Text></Row></Card></Pressable>)}
</ScrollView>;
}
const styles=StyleSheet.create({

marketTopActions:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:C.white,padding:15,borderRadius:20,borderWidth:1,borderColor:C.line,marginBottom:17},
marketTopTitle:{fontSize:17,fontWeight:'900',color:C.ink,marginBottom:3},
marketDropdown:{minHeight:50,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15,paddingVertical:10,backgroundColor:C.white,borderRadius:14,borderWidth:1,borderColor:'#D0DFDE'},
marketDropdownOptions:{backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:14,marginTop:4,overflow:'hidden'},
marketDropdownOption:{minHeight:48,paddingHorizontal:15,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
marketSearchBox:{minHeight:53,backgroundColor:C.white,borderRadius:17,borderWidth:1,borderColor:'#D0DFDE',paddingHorizontal:15,flexDirection:'row',alignItems:'center',marginBottom:14},
marketSearchInput:{fontSize:16,color:C.ink,flex:1,minHeight:50},
marketFilters:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:14},
marketFilterToggle:{minHeight:47,borderRadius:14,borderWidth:1,borderColor:'#D0DFDE',backgroundColor:C.white,paddingHorizontal:10,justifyContent:'center',alignItems:'center'},
marketFilterLabel:{fontSize:12.5,fontWeight:'800',color:C.accentDark},
marketSortOptions:{backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:14,marginTop:5},
marketGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:13},
marketTile:{width:'48.3%',borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.white,overflow:'hidden',minHeight:246,shadowColor:'#986D52',shadowOpacity:0.07,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:1},
marketTileImage:{width:'100%',height:154,backgroundColor:'#F1F3EF',position:'relative'},
marketTilePhoto:{width:'100%',height:'100%'},
marketImagePlaceholder:{backgroundColor:'#F4F1EB',alignItems:'center',justifyContent:'center',gap:5},
marketPricePill:{position:'absolute',top:8,left:7,right:7,backgroundColor:'#FFFFFFF2',borderRadius:11,paddingVertical:6,paddingHorizontal:9,alignSelf:'flex-start'},
marketPricePillText:{fontSize:14,fontWeight:'900',color:C.ink},
marketTileBody:{padding:11,paddingBottom:14,gap:4},
marketTileTitle:{fontSize:15,fontWeight:'800',color:C.ink,lineHeight:19,minHeight:38},
marketDetailCard:{padding:17,marginBottom:18},
marketDetailImage:{height:285,backgroundColor:'#F4F1EB',borderRadius:18,overflow:'hidden'},
marketFullImage:{width:'100%',height:'100%'},
marketPrice:{fontWeight:'900',color:C.accentDark},

regionDropdown:{marginTop:8,padding:10,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:17},
regionOption:{minHeight:43,paddingHorizontal:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
progressTrack:{height:8,backgroundColor:C.pale,borderRadius:10,overflow:'hidden'},
progressFill:{height:'100%',backgroundColor:C.coral,borderRadius:10},
filterPanel:{borderRadius:20,backgroundColor:C.white,borderColor:C.line,borderWidth:1,padding:15,marginBottom:14},

screen:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:'center',justifyContent:'center',gap:15,backgroundColor:C.bg},
scroll:{flex:1},content:{padding:19,paddingBottom:40},
brand:{fontSize:33,fontWeight:'900',color:C.ink,letterSpacing:-1.15,textAlign:'center'},
smallBrand:{fontSize:19,fontWeight:'900',color:C.ink,letterSpacing:-.7},tagline:{fontSize:15,color:C.muted,textAlign:'center',marginTop:9},
loginPage:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:20,backgroundColor:C.bg},
loginMark:{width:95,height:95,borderRadius:31,backgroundColor:C.coral,alignItems:'center',justifyContent:'center',marginBottom:22,transform:[{rotate:'-7deg'}]},
topBar:{minHeight:74,borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:C.white,paddingHorizontal:19,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8},
headerIdentity:{flex:1,flexDirection:'row',alignItems:'center',gap:10},
headerHeartBadge:{width:37,height:37,borderRadius:13,backgroundColor:C.coral,alignItems:'center',justifyContent:'center'},
headerHeart:{fontSize:21,fontWeight:'900',color:C.white},
topHint:{fontSize:12,color:C.muted,marginTop:1,fontWeight:'600'},
card:{backgroundColor:C.white,borderRadius:25,padding:18,borderColor:C.line,borderWidth:1,shadowColor:'#C28368',shadowOpacity:0.07,shadowRadius:11,shadowOffset:{width:0,height:3},elevation:2},
hero:{backgroundColor:C.accentDark,borderRadius:29,paddingHorizontal:23,paddingVertical:27,marginBottom:25,overflow:'hidden',minHeight:238},
heroDecorationOne:{position:'absolute',width:165,height:165,borderRadius:83,backgroundColor:'#137D85',top:-64,right:-64},
heroDecorationTwo:{position:'absolute',width:88,height:88,borderRadius:44,backgroundColor:C.coral,opacity:0.65,bottom:-37,right:22},
heroPill:{alignSelf:'flex-start',backgroundColor:C.sunny,borderRadius:40,paddingHorizontal:13,paddingVertical:7,marginBottom:12},
heroPillText:{fontSize:10.5,fontWeight:'900',letterSpacing:1.1,color:'#624315'},
eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:C.coralDeep},
heroTitle:{fontSize:28,fontWeight:'900',color:C.white,letterSpacing:-.8,lineHeight:35,maxWidth:295},
heroText:{color:'#E5F8F6',fontSize:14,lineHeight:21,marginTop:10,maxWidth:285},
heroTagline:{alignSelf:'flex-start',backgroundColor:'rgba(255,255,255,0.13)',borderRadius:12,paddingVertical:8,paddingHorizontal:10,marginTop:18},
heroTaglineText:{color:C.white,fontSize:11.5,fontWeight:'700'},
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
tabBar:{height:77,borderTopWidth:1,borderTopColor:C.line,backgroundColor:C.white,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:5},
tab:{flex:1,alignItems:'center',paddingVertical:8,borderRadius:16,marginHorizontal:2},tabActive:{backgroundColor:C.pale},tabIcon:{fontSize:25,color:'#8E9FA4',fontWeight:'500'},tabLabel:{fontSize:10,color:'#8E9FA4',marginTop:3,fontWeight:'600'},
chatHeader:{padding:13,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line},
chatComposer:{padding:11,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line},
bubble:{borderRadius:20,padding:13,maxWidth:'87%',marginVertical:5},mine:{backgroundColor:C.accent,alignSelf:'flex-end',borderBottomRightRadius:5},
theirs:{backgroundColor:'#FFF0E8',alignSelf:'flex-start',borderBottomLeftRadius:5},bubbleText:{color:C.ink,fontSize:14.5,lineHeight:21},
photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},photoCard:{width:'47%',padding:10},photoImage:{width:'100%',height:110,borderRadius:14,marginBottom:8},
photoDraftPreview:{width:'100%',height:230,backgroundColor:C.pale,borderRadius:18,marginBottom:14},
modalShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,44,52,.52)',justifyContent:'center',zIndex:100},
});

