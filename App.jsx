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
// Familienfunke: Vorlage 3 – fröhlich und lebendig.
const C = {
bg:'#FFFAF2',white:'#FFFFFF',ink:'#243E43',muted:'#687E80',
accent:'#087F87',accentDark:'#075D67',pale:'#FFF2DF',line:'#EFE1D3',
coral:'#EE7867',coralDeep:'#B9474C',sunny:'#FFE3A0',
lavender:'#F2EEFF',warning:'#FFF1D6',warningText:'#75521D',
};
const INTERESTS = ['Spielplatz','Natur','Radfahren','Wandern','Kochen','Musik','Basteln','Sport','Tiere','Lesen','Ausflüge','Spieleabende'];
const TABS = [['discover','Entdecken','⌕'],['contacts','Kontakte','♡'],['chat','Nachrichten','✉'],['events','Kalender','▦'],['profile','Profil','◉']];
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
const [db,setDb]=useState(blankData);
const [myProfile,setMyProfile]=useState(null);
const [verification,setVerification]=useState(null);
const [membership,setMembership]=useState(null);
const [photosUrls,setPhotosUrls]=useState({});
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
]);
const firstError=queries.find(x=>x.error)?.error;
if(firstError)throw firstError;
const [profiles,contacts,messages,events,eventRequests,photos,blocks,verificationRow,membershipRow]=queries;
const profileRow=profiles.data.find(p=>p.user_id===me)||null;
setDb({profiles:profiles.data||[],contacts:contacts.data||[],messages:messages.data||[],
events:events.data||[],eventRequests:eventRequests.data||[],photos:photos.data||[],blocks:blocks.data||[]});
setMyProfile(profileRow);setVerification(verificationRow.data);setMembership(membershipRow.data);
setError('');
const images=await Promise.all((photos.data||[]).map(async(p)=>{
try {const {data,error:e}=await supabase.storage.from('familienfunke-photos').createSignedUrl(p.storage_path,1800);
return [p.id,e?null:data?.signedUrl||null];} catch {return [p.id,null];}
}));
setPhotosUrls(Object.fromEntries(images));
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
useEffect(()=>{if(me)load();else{setDb(blankData);setMyProfile(null);}},[me,load]);
const active=verification?.status==='verified'&&myProfile?.moderation_status==='approved'&&membership?.status!=='suspended';
const blocked=(uid)=>db.blocks.some(b=>b.blocker_id===me&&b.blocked_id===uid);
const findName=(uid)=>db.profiles.find(p=>p.user_id===uid)?.display_name||'Familienprofil';
const otherSide=(contact)=>contact.sender_id===me?contact.recipient_id:contact.sender_id;
const accepted=db.contacts.filter(x=>x.status==='accepted');
const pending=db.contacts.filter(x=>x.status==='pending');
const photoOf=(uid)=>db.photos.find(p=>p.owner_id===uid&&p.moderation_status==='approved')||db.photos.find(p=>p.owner_id===uid&&uid===me);
const ownPhotos=db.photos.filter(p=>p.owner_id===me);
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
const navTitle=detailFamily?'Familienprofil':selectedContact?'Nachrichten':showInfo?'Elternwissen':TABS.find(t=>t[0]===tab)?.[1];
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
{detailFamily||selectedContact||showInfo?<Button title="← Zurück" onPress={back} small mode="ghost"/>:<MadeInGermanyStamp/>}
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
onReport={()=>report('profile',detailFamily)} onChat={(cid)=>{setDetailFamily(null);setSelectedContact(cid);setTab('chat');}}/>:
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
tab==='discover'?<DiscoverScreen matches={matches} requests={db.contacts} me={me} active={active} busy={busy}
myProfile={myProfile} verification={verification} membership={membership}
showFamily={setDetailFamily} onContact={sendRequest} imageFor={(uid)=>photosUrls[photoOf(uid)?.id]} blocked={blocked}/>:
tab==='contacts'?<ContactsScreen pending={pending} accepted={accepted} me={me} nameOf={findName}
respond={replyRequest} blocked={blocked} disabled={busy} onBlock={blockUser} onUnblock={unblockUser}
onChat={(id)=>{setSelectedContact(id);setTab('chat');}}/>:
tab==='chat'?<ChatList contacts={accepted} me={me} nameOf={findName} blocked={blocked}
onChat={(id)=>setSelectedContact(id)} messages={db.messages}/>:
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
style={[styles.tab,tab===id&&styles.tabActive]}><Text style={[styles.tabIcon,tab===id&&{color:C.accentDark}]}>{glyph}</Text><Text style={[styles.tabLabel,tab===id&&{color:C.accentDark,fontWeight:'900'}]}>{title}</Text></Pressable>)}
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
function DiscoverScreen({matches,requests,me,active,busy,myProfile,verification,membership,showFamily,onContact,imageFor,blocked}) {
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
<H sub="Gemeinsame Aktivitäten statt öffentlicher Diskussionen.">Familienkalender</H>
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
const [editing,setEditing]=useState(false);
const [settingsOpen,setSettingsOpen]=useState(false);
const [addingMoment,setAddingMoment]=useState(false);
useEffect(()=>{if(profile)setForm({...blankProfile,...profile});},[profile?.updated_at,profile?.user_id]);
async function submit(){
 if(form.display_name.trim().length<2)return Alert.alert('Anzeigename fehlt','Bitte mindestens zwei Zeichen angeben.');
 const ok=await save({display_name:safeString(form.display_name,60),region_label:safeString(form.region_label,80),about:safeString(form.about,500),interests:(form.interests||[]).slice(0,12),is_discoverable:!!form.is_discoverable});
 if(ok)setEditing(false);
}
function toggle(i){setForm(f=>({...f,interests:f.interests.includes(i)?f.interests.filter(x=>x!==i):f.interests.length>=12?f.interests:[...f.interests,i]}));}
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
 const ok=await uploadPhoto(selectedPhoto,photoCaption);
 if(ok){setSelectedPhoto(null);setPhotoCaption('');setAddingMoment(false);}
}
const heroPhoto=photos.find(p=>p.moderation_status==='approved'&&photosUrls[p.id]);
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
  <Row style={{marginTop:19,alignItems:'stretch'}}>
   <Button title={editing?'✕ Schließen':'✎ Bearbeiten'} mode="outline" small style={{flex:1}} onPress={()=>{setEditing(v=>!v);setSettingsOpen(false);}}/>
   <Button title={settingsOpen?'✕ Schließen':'⚙ Einstellungen'} mode="ghost" small style={{flex:1}} onPress={()=>{setSettingsOpen(v=>!v);setEditing(false);}}/>
  </Row>
 </View>
 {!active?<Info warning>Angaben und Bilder sind erst nach Freigabe für andere Familien sichtbar.</Info>:null}
 {!editing&&!settingsOpen?<Card style={{marginTop:18}}>
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
   {photosUrls[p.id]?<Image source={{uri:photosUrls[p.id]}} style={styles.momentImage}/>:<View style={[styles.momentImage,{backgroundColor:C.pale,justifyContent:'center',alignItems:'center'}]}><Text style={styles.micro}>Bild wird geladen</Text></View>}
   <Text style={styles.momentCaption} numberOfLines={3}>{p.caption||'Ein Familienmoment'}</Text>
   <Text style={[styles.micro,{color:p.moderation_status==='approved'?C.accent:C.warningText}]}>{p.moderation_status==='approved'?'✓ Freigegeben':p.moderation_status==='pending'?'⌛ In Prüfung':'Nicht freigegeben'}</Text>
   <Button title="Foto löschen" small mode="ghost" onPress={()=>deletePhoto(p.id)}/>
  </View>)}</View>}
 </Card>:null}
 {editing?<Card style={{marginTop:16}}>
  <Text style={styles.sectionTitle}>✎ Familienprofil bearbeiten</Text>
  <Text style={[styles.sub,{marginTop:-7,marginBottom:16}]}>Hier kannst du eure Angaben und Interessen ändern.</Text>
  <Input label="Anzeigename" value={form.display_name} onChangeText={x=>setForm(p=>({...p,display_name:x}))} maxLength={60}/>
  <Input label="Stadt / grobe Region" value={form.region_label} onChangeText={x=>setForm(p=>({...p,region_label:x}))} maxLength={80} placeholder="Keine Wohnadresse"/>
  <Input label="Über uns" multiline value={form.about} onChangeText={x=>setForm(p=>({...p,about:x}))} maxLength={500} placeholder="Was macht ihr gern?"/>
  <Text style={styles.label}>Interessen (bis zu 12)</Text>
  <View style={[styles.chipsRow,{marginBottom:15}]}>{INTERESTS.map(i=><Chip key={i} text={i} selected={form.interests?.includes(i)} onPress={()=>toggle(i)}/>)}</View>
  <Row style={{marginBottom:20,justifyContent:'space-between'}}>
   <View style={{flex:1}}><Text style={styles.label}>In der Familiensuche sichtbar</Text><Text style={styles.micro}>Erst nach Profilfreigabe sichtbar</Text></View>
   <Switch value={!!form.is_discoverable} onValueChange={value=>setForm(p=>({...p,is_discoverable:value}))} trackColor={{true:C.accent}}/>
  </Row>
  <Button title={busy?'Bitte warten …':'Änderungen speichern'} disabled={busy} onPress={submit}/>
 </Card>:null}
 {settingsOpen?<Card style={{marginTop:16}}>
  <Text style={styles.sectionTitle}>⚙ Sicherheit und Einstellungen</Text>
  <Text style={[styles.micro,{marginBottom:12}]}>Mitgliedschaft: {membership?.status||'–'} · Verifizierung: {verification?.status||'–'}</Text>
  <Button title="Elternwissen öffnen" mode="outline" onPress={openInfo}/>
  <Text style={[styles.label,{marginTop:18}]}>Passwort ändern</Text>
  <Input label="Neues Passwort (mindestens 12 Zeichen)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none"/>
  <Button title="Passwort ändern" small mode="outline" disabled={busy||newPassword.length<12} onPress={updatePassword}/>
  {blocks.length>0?<View style={{marginTop:18}}><Text style={styles.label}>Blockierte Konten</Text>{blocks.map(b=><Row key={b.blocked_id} style={{marginTop:7,justifyContent:'space-between'}}><Text style={styles.micro}>Konto …{b.blocked_id.slice(-7)}</Text><Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(b.blocked_id)}/></Row>)}</View>:null}
  <View style={{height:16}}/><Button title="Abmelden" mode="ghost" onPress={signOut}/>
 </Card>:null}
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
momentCaption:{fontSize:13,fontWeight:'800',color:C.ink,lineHeight:19},
modalShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,44,52,.52)',justifyContent:'center',zIndex:100},
});

