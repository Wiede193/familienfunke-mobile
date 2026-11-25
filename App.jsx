import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
ActivityIndicator, Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Linking,
Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, Modal, useWindowDimensions,
StatusBar, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {photoResize} from './PhotoResize';
import { File } from 'expo-file-system';
import { assertResult, configured, errorMessage, supabase } from './supabase';
import { signPhotoPaths } from './SignedPhotoUrls';
import { EVENT_PAGE_SIZE, PHOTO_PAGE_SIZE, ascendingEventCursor, descendingRowCursor, hasFullPage } from './EventPhotoPages';
import { MARKET_OWNER_PAGE_SIZE, PARTNER_PAGE_SIZE, marketCursor, partnerEventCursor, hasMarketPage } from './MarketPartnerPages';
import { isCurrentRequest } from './RequestGeneration';
import { createChatIntentRepository,uuidFromCrypto } from './ChatSendIntent';
import { isTransientFailure, retryRead, createActionGate } from './NetworkResilience';
import { SOCIAL_PAGE_SIZE, socialCursor, hasNextSocialPage, appendUniqueRows } from './SocialPages';
import { visibleBlockTargets, mergeVisibleBlockFlags } from './BlockPages';
import BlockedAccountsPanel from './BlockedAccountsPanel';
import { AboutFamilienfunkeScreen, TechnicalHelpScreen } from './AboutAndHelp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeIntro from './WelcomeIntro';
import {FAMILY_COLORS} from './FamilyTheme';
import {FAMILY_TYPE as T,FAMILY_SPACE as S,FAMILY_UI as UI,FAMILY_RADII as R} from './FamilyTheme';
import {FAMILY_INTERESTS,FAMILY_INTEREST_GROUPS,MAX_PROFILE_INTERESTS,addFamilyInterest,removeFamilyInterest,filterFamilyInterests,normalizeInterest} from './FamilyInterests';
import FamilyIcon,{FAMILY_ROUTE_ICONS} from './FamilyIcon';
import SearchResultFeedback from './SearchResultFeedback';
import {FamilyEmptyState,FamilySkeleton} from './FamilyFeedback';
import {ActionNotice,CompletionPrompt,ContextHelp} from './FamilyInteraction';
import {SparkleIntro,FamilyAppTour,SoftTabIcon,GentleReveal} from './FamilyMotion';
import DraftTemplatePicker from './DraftTemplatePicker';
import {MARKET_DRAFT_TEMPLATES,EVENT_DRAFT_TEMPLATES,MESSAGE_DRAFT_TEMPLATES,applyMarketDraft,applyEventDraft,hasTemplatePlaceholders} from './FamilyDraftTemplates';
import FamilyGuideScreen from './FamilyGuide';
import InclusionKnowledgeScreen from './InclusionKnowledgeScreen';
import HomeAssistant from './HomeAssistant';
import FamilyCalendar,{CalendarEventButton} from './FamilyCalendar';
import FamilyDateFields from './FamilyDateFields';
import OfficialFamilyEvents from './OfficialFamilyEvents';
import FamilyPlayScreen from './FamilyPlayScreen';
import FamilyTVScreen from './FamilyTVScreen';
import SavedMarketSearches,{saveMarketSearch} from './SavedMarketSearches';
import PriceAlertPreference from './PriceAlertPreference';
import TopRightMenu,{MenuIcon,MORE_ITEMS} from './TopRightMenu';
import FamilyOutingScreen from './FamilyOutingScreen';
import PushSettings from './PushSettings';
import NotificationCenterScreen from './NotificationCenterScreen';
import {useNotificationCenter} from './NotificationCenter';
import {signOutWithPush} from './PushDevice';
import FamilyMapScreen from './FamilyMap';
import HealthyScreen from './HealthyScreen';
import OfficialDecisionsScreen from './OfficialDecisionsScreen';
import {FACT_KEYS,EMPTY_FACTS,DEFECTS,encodeArticleFacts,decodeArticleFacts,articleFactRows} from './MarketArticleFacts';
import {marketPhotoAlt,marketPhotoFacts} from './MarketAccessibleDescription';
import {compactBoxDetail,summarizeBox,packageNote,packagePersonalLimit,parsePackageNote,labelSource,BOX_MAX_ITEMS,BOX_MAX_BATCHES,BOX_MAX_PACKAGE,sizeGroups,matchingBatchPhotos,sameBoxSelection,listingDraftId} from './MarketBoxPackage';
import {keepBoxPhoto,availableBoxPhoto,loadBoxSnapshot,saveBoxSnapshot,deleteBoxStorage,makeBoxCrop} from './MarketBoxStorage';
import { cropBounds,suggestedCrop,changeCrop,pixelCrop,photoIssues,PHOTO_ISSUES } from './MarketBoxCrop';
import {suggestBoxPackages,packageCheck} from './MarketBoxSuggestions';
// Familienfunke: Vorlage 3 – fröhlich und lebendig.
const C = FAMILY_COLORS;
const INTERESTS = FAMILY_INTERESTS;
const REGIONS = ['Landkreis Oder-Spree','Fürstenwalde/Spree','Beeskow','Eisenhüttenstadt','Bad Saarow','Storkow (Mark)','Frankfurt (Oder)','Landkreis Dahme-Spreewald','Landkreis Märkisch-Oderland','Berlin','Potsdam','Cottbus'];
const normalizeLabel = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const REGION_CLUSTERS = [
  ['Landkreis Oder-Spree','Fürstenwalde/Spree','Fürstenwalde (Spree)','Fürstenwalde','Beeskow','Eisenhüttenstadt','Bad Saarow','Storkow (Mark)','Storkow'],
].map(group=>group.map(normalizeLabel));
const sameRegion = (a,b) => {
  const x=normalizeLabel(a), y=normalizeLabel(b);
  return !!x && (x===y || REGION_CLUSTERS.some(group=>group.includes(x)&&group.includes(y)));
};
const TABS = [['home','Start','home'],['market','Basar','bag'],['discover','Familien','users'],['map','Karte','map'],['guide','Wissen','book']];
const MARKET_CATEGORIES=['Kleidung','Spielzeug','Bücher','Babyausstattung','Möbel','Sonstiges'];
const ORG_KINDS=[['kita','Kita / Kindergarten'],['foerderverein','Förderverein'],['familienzentrum','Familienzentrum'],['verein','Familienverein']];
const SECTION_MESSAGES={market:'Von Familien für Familien: kostenlos einstellen, verschenken und tauschen. Unsere Gebühren sind offen – aktuell gibt es keine Onlinezahlungen. Wir verkaufen keine persönlichen Daten.',partners:'Kitas und Fördervereine stellen sich vor, zeigen freie Plätze und laden zu Flohmärkten ein. Ein Stern erscheint nur bei bestätigter Einrichtung.',discover:'Neue Familien kennenlernen – freiwillig, respektvoll und ohne genaue Standortfreigabe.',events:'Gemeinsam etwas unternehmen statt endlose Diskussionen. Veranstaltungen werden vor der Veröffentlichung geprüft.',inclusion:'Für Familien mit und ohne Behinderung: willkommen, respektiert und ohne Pflicht zur Offenlegung persönlicher Diagnosen.'};
const blankProfile = {display_name:'',region_label:'',about:'',interests:[],is_discoverable:false};
const blankData = {profiles:[],contacts:[],messages:[],events:[],eventRequests:[],photos:[],blocks:[],listings:[],marketPhotos:[],marketFavorites:[],organizations:[],partnerEvents:[]};
const chatSendIntents=createChatIntentRepository({
  storage:AsyncStorage,
  createId:async()=>{
    // Use secure device randomness when exposed; otherwise request a UUIDv4
    // from authenticated PostgreSQL before dispatching the message.
    const local=uuidFromCrypto(globalThis.crypto);
    if(local)return local;
    const {data,error}=await supabase.rpc('ff_message_request_id');
    if(error||!data)throw error||new Error('Keine sichere Nachrichtenkennung verfügbar.');
    return data;
  }
});
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
if (/FF_CONTACT_ALREADY_CLOSED/.test(msg)) return 'Diese Kontaktanfrage wurde bereits abgeschlossen. Eine neue Anfrage ist derzeit nicht möglich.';
if (/FF_CONTACT_ALREADY_CHANGED/.test(msg)) return 'Die Kontaktanfrage wurde bereits anders beantwortet. Bitte aktualisiere deine Kontakte.';
if (/FF_CONTACT_NOT_DISCOVERABLE|FF_CONTACT_NOT_ALLOWED|FF_CONTACT_STATUS_FORBIDDEN/.test(msg)) return 'Diese Kontaktaktion ist für die beteiligten Konten nicht erlaubt.';
if (/FF_CONTACT_NOT_FOUND/.test(msg)) return 'Diese Kontaktanfrage ist nicht mehr verfügbar.';
if (isTransientFailure(e)) return 'Die Verbindung zum Server ist vorübergehend gestört. Bitte prüfe dein Internet und versuche es später erneut.';
return msg;
};
const mutationError = error => isTransientFailure(error)
  ? 'Die Serverantwort ist ausgeblieben. Die Aktion könnte trotzdem gespeichert worden sein. Bitte prüfe zuerst den aktuellen Stand, bevor du sie erneut ausführst.'
  : humanError(error);
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

function Button({title,onPress,mode='primary',disabled=false,small=false,style,accessibilityLabel,hint}){
 return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel||title}
   accessibilityHint={hint} accessibilityState={{disabled:!!disabled}}
   onPress={onPress} disabled={disabled} hitSlop={2}
   style={({pressed})=>[styles.button,styles['button_'+mode],small&&styles.buttonSmall,
     disabled&&{opacity:.48},pressed&&!disabled&&styles.buttonPress,style]}>
   <Text style={[styles.buttonText,mode!=='primary'&&styles.buttonTextDark,
     small&&{fontSize:14}]}>{title}</Text>
 </Pressable>;
}
function Chip({text,selected,onPress}){
 if(!onPress)return <View style={[styles.chip,selected&&styles.chipSelected]}>
   <Text style={[styles.chipText,selected&&{color:C.white}]}>{text}</Text></View>;
 return <Pressable accessibilityRole="button" accessibilityLabel={text}
   accessibilityState={{selected:!!selected}} onPress={onPress}
   style={({pressed})=>[styles.chip,selected&&styles.chipSelected,
     pressed&&{transform:[{scale:.975}],opacity:.82}]}>
   <Text style={[styles.chipText,selected&&{color:C.white}]}>{selected?'✓ ':''}{text}</Text>
 </Pressable>;
}
function Card({children,style}){return <View style={[styles.card,style]}>{children}</View>;}
function H({children,sub}){return <View style={styles.headingWrap}>
   <View style={styles.headingBar}/>
   <View style={{flex:1}}>
     <Text accessibilityRole="header" style={styles.h}>{children}</Text>
     {sub?<Text style={styles.sub}>{sub}</Text>:null}
   </View>
 </View>;}
function Info({children,warning=false}){return <View style={[styles.info,warning&&styles.warning]}>
   <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
     style={[styles.infoMark,warning&&styles.infoMarkWarning]}>
     <FamilyIcon name={warning?'shield':'check'} size={18}
       color={warning?C.warningText:C.accentDark}/>
   </View>
   <Text style={[styles.infoText,warning&&{color:C.warningText}]}>{children}</Text>
 </View>;}
function Avatar({name,size=52,uri}) {return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.avatar,{width:size,height:size,borderRadius:size/2}]}>{uri?<Image source={{uri}} style={{width:size,height:size,borderRadius:size/2}}/>:<Text style={[styles.avatarText,{fontSize:size*.30}]}>{initial(name)}</Text>}</View>;}
function Row({children,style}) {return <View style={[{flexDirection:'row',alignItems:'center',gap:10},style]}>{children}</View>;}
function Input({label,multiline=false,style,onFocus,onBlur,helpText,errorText,...props}){
 const [focused,setFocused]=useState(false);
 const length=typeof props.value==='string'?props.value.length:0;
 const maxLength=props.maxLength;
 return <View style={[{marginBottom:14},style]}>
   <Text style={[styles.label,focused&&{color:C.accentDark}]}>{label}</Text>
   <TextInput accessibilityLabel={label} placeholderTextColor={C.muted}
     style={[styles.input,focused&&styles.inputFocused,
       !!errorText&&styles.inputInvalid,
       multiline&&{minHeight:100,textAlignVertical:'top',paddingTop:12}]}
     multiline={multiline}
     {...props}
     onFocus={event=>{setFocused(true);onFocus?.(event);}}
     onBlur={event=>{setFocused(false);onBlur?.(event);}}/>
   {errorText?<Text accessibilityRole="alert" style={styles.inputError}>{errorText}</Text>:null}
   {(helpText||focused&&maxLength)?<View style={styles.inputFoot}>
     {helpText?<Text style={styles.inputHint}>{helpText}</Text>:<View style={{flex:1}}/>}
     {focused&&maxLength?<Text style={styles.inputCounter}>{length}/{maxLength}</Text>:null}
   </View>:null}
 </View>;
}
function RegionPicker({value,onChange}) {
const [open,setOpen]=useState(false);
const [search,setSearch]=useState('');
const options=REGIONS.filter(r=>normalizeLabel(r).includes(normalizeLabel(search)));
function choose(value){onChange(value);setSearch('');setOpen(false);}
return <View style={{marginBottom:15}}>
<Text style={styles.label}>Wo wohnt ihr? (Stadt oder Landkreis)</Text>
<Pressable accessibilityRole="button" accessibilityLabel={'Region auswählen, derzeit: '+(value||'keine Region')} accessibilityState={{expanded:open}} onPress={()=>{setOpen(v=>!v);setSearch('');}} style={[styles.input,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
<Text style={{color:value?C.ink:C.muted,flex:1}} numberOfLines={1}>{value||'Region auswählen oder selbst eingeben'}</Text>
<Text style={{color:C.accent,fontWeight:'900'}}>{open?'⌃':'⌄'}</Text>
</Pressable>
{open?<View style={styles.regionDropdown}>
<TextInput accessibilityLabel="Stadt oder Landkreis suchen" style={[styles.input,{marginBottom:8}]} placeholder="Stadt oder Landkreis suchen" placeholderTextColor={C.muted} value={search} onChangeText={setSearch} maxLength={80} autoCorrect={false}/>
<ScrollView style={{maxHeight:210}} keyboardShouldPersistTaps="always" nestedScrollEnabled>
{options.map(r=><Pressable accessibilityRole="button" accessibilityLabel={'Region '+r} accessibilityState={{selected:normalizeLabel(r)===normalizeLabel(value)}} key={r} onPress={()=>choose(r)} style={styles.regionOption}><Text style={styles.body}>{r}</Text>{normalizeLabel(r)===normalizeLabel(value)?<Text style={{color:C.accent}}>✓</Text>:null}</Pressable>)}
{search.trim().length>=2&&!REGIONS.some(r=>normalizeLabel(r)===normalizeLabel(search))?
<Pressable accessibilityRole="button" onPress={()=>choose(search.trim())} style={styles.regionOption}><Text style={[styles.body,{color:C.accentDark}]}>„{search.trim()}“ übernehmen</Text></Pressable>:null}
{options.length===0&&search.trim().length<2?<Text style={styles.micro}>Bitte mindestens zwei Zeichen eingeben.</Text>:null}
</ScrollView>
</View>:null}
<Text style={[styles.micro,{marginTop:6}]}>Gib bitte keine Straße oder Hausnummer an. Deine Region ist freiwillig.</Text>
</View>;
}
function Blank({title,body,icon='heart',actionLabel,onAction}) {return <FamilyEmptyState title={title} description={body} icon={icon} actionLabel={actionLabel} onAction={onAction}/>;}
function Login({error,setError,onHelp}) {
const [email,setEmail]=useState('');
const [password,setPassword]=useState('');
const [busy,setBusy]=useState(false);
const signInLock=useRef(false);
async function submit() {
 if(signInLock.current)return;
 if (!email.includes('@')||!password) return setError('Bitte E-Mail und Passwort eingeben.');
 signInLock.current=true;
 setBusy(true);setError('');
 try{
   const {error:e}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(e)setError(humanError(e));
 }catch(e){setError(humanError(e));}
 finally{signInLock.current=false;setBusy(false);}
}
return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
<ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
<View style={styles.loginMark}><Text style={{fontSize:52,color:"#9A4A43"}}>♥</Text></View>
<Text style={styles.brand}>Familienfunke<Text style={{color:C.coral}}>.</Text></Text>
<Text style={styles.tagline}>Aus Nachbarschaft wird Freundschaft.</Text>
<View style={{height:28}}/>
<Card style={{width:'100%',padding:23}}>
<Text style={styles.h}>Willkommen zurück!</Text>
<Text style={[styles.sub,{marginBottom:21}]}>Deine Familien-Community. Die Testphase ist derzeit nur mit bereits eingerichtetem Konto zugänglich.</Text>
<Input label="E-Mail-Adresse" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/>
<Input label="Passwort" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password"/>
{error?<Info warning>{error}</Info>:null}
<Button title={busy?'Anmeldung läuft …':'Anmelden'} disabled={busy} onPress={submit}/>
<View style={{marginTop:12}}><Button title="Anmeldung, Einladung & Hilfe" mode="ghost" onPress={onHelp}/></View>
</Card>
</ScrollView>
</KeyboardAvoidingView>;
}
const EMPTY_DISCOVER_FILTERS=Object.freeze({query:'',interest:'Alle',onlyRegion:false,onlyShared:false,mode:'list',cardIndex:0});

export default function App() {
const [session,setSession]=useState(undefined);
const [tab,setTab]=useState('home');
const [menuOpen,setMenuOpen]=useState(false);
const [profileDirty,setProfileDirty]=useState(false);
const [chatDraftDirty,setChatDraftDirty]=useState(false);
const [eventDraftDirty,setEventDraftDirty]=useState(false);
const [marketSubpage,setMarketSubpage]=useState(false);
const marketBackRef=useRef(null);
const marketLeaveRef=useRef(null);
const [marketIntent,setMarketIntent]=useState(null);
const [outingDraft,setOutingDraft]=useState(null);
const [mapIntent,setMapIntent]=useState(null);
const [healthyQuery,setHealthyQuery]=useState('');
const [decisionQuery,setDecisionQuery]=useState('');
const [decisionFocusId,setDecisionFocusId]=useState(null);
const [guideQuery,setGuideQuery]=useState('');
const [inclusionQuery,setInclusionQuery]=useState('');
const [calendarSeed,setCalendarSeed]=useState(null);
const [eventIntent,setEventIntent]=useState(null);
const [extraReturnTab,setExtraReturnTab]=useState('more');
const [inboxReturnTab,setInboxReturnTab]=useState('home');
const [focusContactId,setFocusContactId]=useState(null);
const [selectedContact,setSelectedContact]=useState(null);
const [chatReturnTab,setChatReturnTab]=useState('more');
const [detailFamily,setDetailFamily]=useState(null);
const [discoverFilters,setDiscoverFilters]=useState(EMPTY_DISCOVER_FILTERS);
const [showEventForm,setShowEventForm]=useState(false);
const [showInfo,setShowInfo]=useState(false);
const [showLoginHelp,setShowLoginHelp]=useState(false);
const [showWelcome,setShowWelcome]=useState(false);
const [welcomeLoaded,setWelcomeLoaded]=useState(false);
const [showTour,setShowTour]=useState(false);
const [tourPending,setTourPending]=useState(false);
const [tourLoaded,setTourLoaded]=useState(false);
const [introPhase,setIntroPhase]=useState('checking');
const [reportTarget,setReportTarget]=useState(null);
const [reportDetails,setReportDetails]=useState('');
const [reportReason,setReportReason]=useState('');
const [error,setError]=useState('');
const [notice,setNotice]=useState('');
const [busy,setBusy]=useState(false);
const [loading,setLoading]=useState(false);
const [db,setDb]=useState(blankData);
const [connectionIssue,setConnectionIssue]=useState(false);
const [myProfile,setMyProfile]=useState(null);
const [verification,setVerification]=useState(null);
const [membership,setMembership]=useState(null);
const [photosUrls,setPhotosUrls]=useState({});
const [marketPhotoUrls,setMarketPhotoUrls]=useState({});
const [marketExtraPhotoUrls,setMarketExtraPhotoUrls]=useState({});
const [marketEpoch,setMarketEpoch]=useState(0);
const [marketOwnerCursor,setMarketOwnerCursor]=useState(null);
const [marketOwnerHasMore,setMarketOwnerHasMore]=useState(false);
const [marketOwnerBusy,setMarketOwnerBusy]=useState(false);
const [marketOwnerBusyMore,setMarketOwnerBusyMore]=useState(false);
const [marketOwnerError,setMarketOwnerError]=useState('');
const marketSeq=useRef(0);
const [photoCursor,setPhotoCursor]=useState(null);
const [photoHasMore,setPhotoHasMore]=useState(false);
const [photoBusy,setPhotoBusy]=useState(false);
const [photoBusyMore,setPhotoBusyMore]=useState(false);
const [photoLoadError,setPhotoLoadError]=useState('');
const [photoEpoch,setPhotoEpoch]=useState(0);
const photoSeq=useRef(0);
const [discoverCursor,setDiscoverCursor]=useState(null);
const [discoverMore,setDiscoverMore]=useState(false);
const [discoverLoadingMore,setDiscoverLoadingMore]=useState(false);
const [contactsCursor,setContactsCursor]=useState(null);
const [contactsMore,setContactsMore]=useState(false);
const [contactsLoadingMore,setContactsLoadingMore]=useState(false);
const me=session?.user?.id;
const photoTarget=detailFamily||(tab==='profile'?me:null);
const accountRef=useRef(me);accountRef.current=me;
const selectedContactRef=useRef(selectedContact);selectedContactRef.current=selectedContact;
useEffect(()=>{if(!selectedContact)setChatDraftDirty(false);},[selectedContact]);
useEffect(()=>{if(tab!=='events')setEventDraftDirty(false);},[tab]);
const detailFamilyRef=useRef(detailFamily);detailFamilyRef.current=detailFamily;
const loadSeq=useRef(0);
const actionGate=useRef(createActionGate());
const inbox=useNotificationCenter(me);
const load=useCallback(async(silent=false)=>{
if(!me||!supabase)return null;
const seq=++loadSeq.current;
const stillCurrent=()=>isCurrentRequest(accountRef.current,me,loadSeq.current,seq);
if(!silent)setLoading(true);
try {
const queries=await Promise.all([
retryRead(()=>supabase.rpc('ff_discover_page',{p_limit:SOCIAL_PAGE_SIZE}),{isCurrent:stillCurrent}),
 retryRead(()=>supabase.from('profiles').select('*').eq('user_id',me).maybeSingle(),{isCurrent:stillCurrent}),
retryRead(()=>supabase.rpc('ff_contacts_page',{p_limit:SOCIAL_PAGE_SIZE}),{isCurrent:stillCurrent}),
retryRead(()=>supabase.from('verifications').select('*').eq('user_id',me).maybeSingle(),{isCurrent:stillCurrent}),
retryRead(()=>supabase.from('memberships').select('*').eq('user_id',me).maybeSingle(),{isCurrent:stillCurrent}),
retryRead(()=>supabase.from('ff_organizations').select('*').eq('owner_id',me).order('created_at',{ascending:false}).limit(50),{isCurrent:stillCurrent}),
]);
if(!stillCurrent())return null;
const firstError=queries.find(x=>x.error)?.error;
if(firstError)throw firstError;
const [profiles,ownProfile,contacts,verificationRow,membershipRow,ownOrganizations]=queries;
// Fetch contact display names separately; contacts may have hidden discovery profiles.
const contactUserIds=[...new Set((contacts.data||[]).map(c=>c.sender_id===me?c.recipient_id:c.sender_id).filter(Boolean))];
// Preserve only the currently open conversation if it falls outside the newest contact page.
 const pinnedContactId=selectedContactRef.current;
 const pinnedContact=pinnedContactId&&!(contacts.data||[]).some(c=>c.id===pinnedContactId)
   ? await retryRead(()=>supabase.from('contact_requests').select('*').eq('id',pinnedContactId).maybeSingle(),{isCurrent:stillCurrent})
   : {data:null,error:null};
 if(pinnedContact.error)throw pinnedContact.error;
 if(!stillCurrent())return null;
 const allContacts=appendUniqueRows(contacts.data||[],pinnedContact.data?[pinnedContact.data]:[]);
 const linkedUserIds=[...new Set([...contactUserIds,...(pinnedContact.data?[pinnedContact.data.sender_id===me?pinnedContact.data.recipient_id:pinnedContact.data.sender_id]:[])])];
 const linkedProfiles=linkedUserIds.length
  ? await retryRead(()=>supabase.from('profiles').select('*').in('user_id',linkedUserIds),{isCurrent:stillCurrent})
  : {data:[],error:null};
if(linkedProfiles.error)throw linkedProfiles.error;
if(!stillCurrent())return null;
const blockIds=visibleBlockTargets(profiles.data,contacts.data,me,pinnedContact.data,detailFamilyRef.current);
const flags=blockIds.length?await retryRead(
  ()=>supabase.rpc('ff_block_flags',{p_user_ids:blockIds}),
  {isCurrent:stillCurrent}
):{data:[],error:null};
if(flags.error||!Array.isArray(flags.data))throw flags.error||new Error('Block flags unavailable');
if(!stillCurrent())return null;
const currentBlockFlags=mergeVisibleBlockFlags([],me,blockIds,flags.data);
const profileRow=ownProfile.data||(profiles.data||[]).find(p=>p.user_id===me)||null;
setDiscoverCursor(socialCursor(profiles.data,'user_id'));
setDiscoverMore(hasNextSocialPage(profiles.data));
setContactsCursor(socialCursor(contacts.data));
setContactsMore(hasNextSocialPage(contacts.data));
setDb(old=>!stillCurrent()?old:({profiles:appendUniqueRows(profileRow?[profileRow,...(profiles.data||[]).filter(p=>p.user_id!==me)]:(profiles.data||[]),linkedProfiles.data||[],'user_id'),contacts:allContacts,messages:[],
events:old.events,eventRequests:old.eventRequests,photos:old.photos,blocks:currentBlockFlags,
listings:old.listings,marketPhotos:old.marketPhotos,marketFavorites:[],organizations:ownOrganizations.data||[],partnerEvents:old.partnerEvents}));
setMyProfile(profileRow);setVerification(verificationRow.data);setMembership(membershipRow.data);
setError('');setConnectionIssue(false);
return {contacts:contacts.data||[],listings:[]};
} catch(e){
   if(stillCurrent()){
     setConnectionIssue(isTransientFailure(e));
     setError(isTransientFailure(e)?'':humanError(e));
   }
   return null;
 }
finally{if(stillCurrent())setLoading(false);}
},[me]);
async function loadMoreFamilies(){
 if(!me||discoverLoadingMore||!discoverMore||!discoverCursor)return;
 const requestedDuringLoad=loadSeq.current;
 setDiscoverLoadingMore(true);
 try {
  const {data,error:e}=await retryRead(
   ()=>supabase.rpc('ff_discover_page',{p_limit:SOCIAL_PAGE_SIZE,...discoverCursor}),
   {isCurrent:()=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)}
  );
  if(!isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad))return;
  if(e)throw e;
  const ids=visibleBlockTargets(data,[],me);
  const flags=ids.length?await retryRead(
    ()=>supabase.rpc('ff_block_flags',{p_user_ids:ids}),
    {isCurrent:()=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)}
  ):{data:[],error:null};
  if(flags.error||!Array.isArray(flags.data))throw flags.error||new Error('Block flags unavailable');
  if(!isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad))return;
  setDb(old=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)
    ? {...old,profiles:appendUniqueRows(old.profiles,data||[],'user_id'),
      blocks:mergeVisibleBlockFlags(old.blocks,me,ids,flags.data)}:old);
  setDiscoverCursor(socialCursor(data,'user_id'));
  setDiscoverMore(hasNextSocialPage(data));
 }catch(e){if(isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad))setError('Weitere Familien konnten nicht geladen werden. Bitte erneut versuchen.');}
 finally{if(accountRef.current===me)setDiscoverLoadingMore(false);}
}
async function loadMoreContacts(){
 if(!me||contactsLoadingMore||!contactsMore||!contactsCursor)return;
 const requestedDuringLoad=loadSeq.current;
 setContactsLoadingMore(true);
 try {
  const {data,error:e}=await retryRead(
   ()=>supabase.rpc('ff_contacts_page',{p_limit:SOCIAL_PAGE_SIZE,...contactsCursor}),
   {isCurrent:()=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)}
  );
  if(e)throw e;
  const ids=[...new Set((data||[]).map(c=>c.sender_id===me?c.recipient_id:c.sender_id).filter(Boolean))];
  const names=ids.length?await retryRead(
     ()=>supabase.from('profiles').select('*').in('user_id',ids),
     {isCurrent:()=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)}
   ):{data:[],error:null};
  if(names.error)throw names.error;
  const idsToCheck=visibleBlockTargets([],data,me);
  const flags=idsToCheck.length?await retryRead(
    ()=>supabase.rpc('ff_block_flags',{p_user_ids:idsToCheck}),
    {isCurrent:()=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)}
  ):{data:[],error:null};
  if(flags.error||!Array.isArray(flags.data))throw flags.error||new Error('Block flags unavailable');
  if(!isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad))return;
  setDb(old=>isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad)
    ? {...old,contacts:appendUniqueRows(old.contacts,data||[]),
    profiles:appendUniqueRows(old.profiles,names.data||[],'user_id'),
    blocks:mergeVisibleBlockFlags(old.blocks,me,idsToCheck,flags.data)}:old);
  setContactsCursor(socialCursor(data));
  setContactsMore(hasNextSocialPage(data));
 }catch(e){if(isCurrentRequest(accountRef.current,me,loadSeq.current,requestedDuringLoad))setError('Weitere Kontakte konnten nicht geladen werden. Bitte erneut versuchen.');}
 finally{if(accountRef.current===me)setContactsLoadingMore(false);}
}
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
// Erster Login auf diesem Gerät: sanfter, überspringbarer Auftakt.
useEffect(()=>{
 if(session!==null)return;
 let live=true;
 AsyncStorage.getItem('familienfunke.login-spark.v1')
   .then(seen=>{if(live)setIntroPhase(seen==='seen'?'done':'intro');})
   .catch(()=>{if(live)setIntroPhase('done');});
 return()=>{live=false;};
},[session]);
function finishLoginSpark(){
 setIntroPhase('done');
 AsyncStorage.setItem('familienfunke.login-spark.v1','seen').catch(()=>{});
}
// Nach jeder Anmeldung startet Familienfunke auf der KI-Startseite – auch nach Kontowechsel.
useEffect(()=>{
  setTab('home');
  setMenuOpen(false);
  setSelectedContact(null);
  setDetailFamily(null);
  setDiscoverFilters(EMPTY_DISCOVER_FILTERS);
  setShowInfo(false);
  setShowLoginHelp(false);
  setShowTour(false);
  setShowEventForm(false);
  setMarketIntent(null);setMarketSubpage(false);marketBackRef.current=null;setOutingDraft(null);setCalendarSeed(null);setMapIntent(null);setEventIntent(null);setFocusContactId(null);setInboxReturnTab('home');setExtraReturnTab('more');
  setDb(blankData);setMyProfile(null);setVerification(null);setMembership(null);
  setPhotosUrls({});setMarketPhotoUrls({});setMarketExtraPhotoUrls({});
  setMarketOwnerCursor(null);setMarketOwnerHasMore(false);setMarketOwnerError('');setMarketOwnerBusy(false);setMarketOwnerBusyMore(false);
  setPhotoCursor(null);setPhotoHasMore(false);setPhotoLoadError('');
  setDiscoverCursor(null);setDiscoverMore(false);setDiscoverLoadingMore(false);
  setContactsCursor(null);setContactsMore(false);setContactsLoadingMore(false);
  loadSeq.current++; // Invalidate in-flight queries even before the next account load.
  actionGate.current.reset();
  setBusy(false);setLoading(false);setError('');setNotice('');setConnectionIssue(false); // Never carry messages across accounts.
  setReportTarget(null);setReportDetails('');setReportReason('');
},[me]);
useEffect(()=>{if(me)load();else{setDb(blankData);setMyProfile(null);setMarketPhotoUrls({});setMarketExtraPhotoUrls({});}},[me,load]);

// Seller listings are private and no longer part of the app-start fanout.
// Fetch just the first 30 when the Basar opens, then page by seller and tuple cursor.
async function prepareOwnListingPhotos(rows){
 const ids=rows.map(r=>r.id).filter(Boolean);
 const {data:extra,error:e}=ids.length
   ? await retryRead(()=>supabase.from('ff_market_photos').select('*')
      .in('listing_id',ids).order('slot',{ascending:true}).limit(ids.length*4))
   : {data:[],error:null};
 if(e)throw e;
 const signed=await signPhotoPaths(supabase,'ff-market-photos',[
    ...rows.map(r=>r.photo_path),...(extra||[]).map(p=>p.photo_path)
 ],600);
 return {extra:extra||[],
   main:Object.fromEntries(rows.filter(r=>r.photo_path).map(r=>[r.id,signed[r.photo_path]||null])),
   links:Object.fromEntries((extra||[]).map(r=>[r.photo_path,signed[r.photo_path]||null]))};
}
const pinnedMarketListingId=marketIntent?.type==='inboxListing'?marketIntent.id:null;
useEffect(()=>{
 let alive=true;const seq=++marketSeq.current;
 setDb(old=>({...old,listings:[],marketPhotos:[]}));
 setMarketPhotoUrls({});setMarketExtraPhotoUrls({});
 setMarketOwnerCursor(null);setMarketOwnerHasMore(false);setMarketOwnerError('');
 setMarketOwnerBusy(!!me&&tab==='market');setMarketOwnerBusyMore(false);
 if(!me||tab!=='market')return()=>{alive=false;marketSeq.current++;};
 (async()=>{
  const {data,error:e}=await retryRead(
    ()=>supabase.rpc('ff_my_market_page',{p_limit:MARKET_OWNER_PAGE_SIZE}),
    {isCurrent:()=>alive&&marketSeq.current===seq&&accountRef.current===me}
  );
  if(e||!Array.isArray(data))throw e||new Error('Invalid owner listing page');
  let records=data;
  // A notification may open an older listing outside the first page.
  if(pinnedMarketListingId&&!data.some(row=>row.id===pinnedMarketListingId)){
   const {data:pinned,error:pinnedError}=await retryRead(
     ()=>supabase.from('ff_market_listings').select('*')
        .eq('id',pinnedMarketListingId).eq('seller_id',me).maybeSingle(),
     {isCurrent:()=>alive&&marketSeq.current===seq&&accountRef.current===me}
   );
   if(pinnedError)throw pinnedError;
   if(pinned)records=[...data,pinned];
  }
  const media=await prepareOwnListingPhotos(records);
  if(!alive||marketSeq.current!==seq||accountRef.current!==me)return;
  setDb(old=>({...old,listings:records,marketPhotos:media.extra}));
  setMarketPhotoUrls(media.main);setMarketExtraPhotoUrls(media.links);
  setMarketOwnerCursor(marketCursor(data));setMarketOwnerHasMore(hasMarketPage(data));
 })().catch(()=>{
  if(alive&&marketSeq.current===seq&&accountRef.current===me)setMarketOwnerError('Eigene Anzeigen konnten nicht geladen werden. Bitte erneut versuchen.');
 }).finally(()=>{
  if(alive&&marketSeq.current===seq&&accountRef.current===me)setMarketOwnerBusy(false);
 });
 return()=>{alive=false;marketSeq.current++;};
},[me,tab,marketEpoch,pinnedMarketListingId]);
async function loadMoreOwnListings(){
 if(!me||tab!=='market'||marketOwnerBusy||marketOwnerBusyMore||!marketOwnerHasMore||!marketOwnerCursor)return;
 const seq=marketSeq.current;setMarketOwnerBusyMore(true);setMarketOwnerError('');
 try{
  const {data,error:e}=await retryRead(
     ()=>supabase.rpc('ff_my_market_page',{p_limit:MARKET_OWNER_PAGE_SIZE,...marketOwnerCursor}),
     {isCurrent:()=>marketSeq.current===seq&&accountRef.current===me}
   );
  if(e||!Array.isArray(data))throw e||new Error('Invalid owner listing page');
  const media=await prepareOwnListingPhotos(data);
  if(marketSeq.current!==seq||accountRef.current!==me)return;
  setDb(old=>({...old,listings:appendUniqueRows(old.listings,data),
    marketPhotos:appendUniqueRows(old.marketPhotos,media.extra,'photo_path')}));
  setMarketPhotoUrls(old=>({...old,...media.main}));
  setMarketExtraPhotoUrls(old=>({...old,...media.links}));
  setMarketOwnerCursor(marketCursor(data));setMarketOwnerHasMore(hasMarketPage(data));
 }catch{
  if(marketSeq.current===seq&&accountRef.current===me)setMarketOwnerError('Weitere Anzeigen konnten nicht geladen werden.');
 }finally{
  if(marketSeq.current===seq&&accountRef.current===me)setMarketOwnerBusyMore(false);
 }
}


// Only the currently viewed adult's photos are requested. Existing photo RLS
// permits own uploads and approved images of established contacts; never cache
// cross-account signed links after a logout or profile change.
useEffect(()=>{
 const seq=++photoSeq.current;
 let live=true;
 setDb(old=>({...old,photos:[]}));
 setPhotosUrls({});
 setPhotoCursor(null);setPhotoHasMore(false);setPhotoLoadError('');
 setPhotoBusy(!!me&&!!photoTarget);setPhotoBusyMore(false);
 if(!me||!photoTarget)return ()=>{live=false;photoSeq.current++;};
 (async()=>{
   const {data,error:e}=await retryRead(
     ()=>supabase.rpc('ff_profile_photos_page',{p_owner_id:photoTarget,p_limit:PHOTO_PAGE_SIZE}),
     {isCurrent:()=>live&&photoSeq.current===seq&&accountRef.current===me}
   );
   if(e||!Array.isArray(data))throw e||new Error('Invalid photo page');
   const signed=await signPhotoPaths(supabase,'familienfunke-photos',data.map(row=>row.storage_path),1800);
   if(!live||photoSeq.current!==seq||accountRef.current!==me)return;
   setDb(old=>({...old,photos:data}));
   setPhotosUrls(Object.fromEntries(data.map(row=>[row.id,signed[row.storage_path]||null])));
   setPhotoCursor(descendingRowCursor(data));
   setPhotoHasMore(hasFullPage(data,PHOTO_PAGE_SIZE));
 })().catch(()=>{
   if(live&&photoSeq.current===seq&&accountRef.current===me)setPhotoLoadError('Fotos konnten nicht geladen werden. Bitte erneut versuchen.');
 }).finally(()=>{
   if(live&&photoSeq.current===seq&&accountRef.current===me)setPhotoBusy(false);
 });
 return ()=>{live=false;photoSeq.current++;};
},[me,photoTarget,photoEpoch]);
async function loadMorePhotos(){
 if(!me||!photoTarget||!photoHasMore||!photoCursor||photoBusy||photoBusyMore)return;
 const seq=photoSeq.current;
 setPhotoBusyMore(true);
 try{
   const {data,error:e}=await retryRead(
     ()=>supabase.rpc('ff_profile_photos_page',{p_owner_id:photoTarget,p_limit:PHOTO_PAGE_SIZE,...photoCursor}),
     {isCurrent:()=>photoSeq.current===seq&&accountRef.current===me}
   );
   if(e||!Array.isArray(data))throw e||new Error('Invalid photo page');
   const signed=await signPhotoPaths(supabase,'familienfunke-photos',data.map(row=>row.storage_path),1800);
   if(accountRef.current!==me||photoSeq.current!==seq)return;
   setDb(old=>({...old,photos:appendUniqueRows(old.photos,data)}));
   setPhotosUrls(old=>({...old,...Object.fromEntries(data.map(row=>[row.id,signed[row.storage_path]||null]))}));
   setPhotoCursor(descendingRowCursor(data));
   setPhotoHasMore(hasFullPage(data,PHOTO_PAGE_SIZE));
   setPhotoLoadError('');
 }catch{
   if(accountRef.current===me&&photoSeq.current===seq)setPhotoLoadError('Weitere Fotos konnten nicht geladen werden.');
 }finally{
   if(accountRef.current===me&&photoSeq.current===seq)setPhotoBusyMore(false);
 }
}
async function executePhoto(fn,success){
 const ok=await executeEvent(fn,success);
 if(ok)setPhotoEpoch(x=>x+1);
 return ok;
}

// Einmalige Begrüßung je Konto auf diesem Gerät. Ein erneuter Aufruf unter „Mehr“ ist jederzeit möglich.
useEffect(()=>{
  let valid=true;
  // The three-step tour is the only automatic introduction. The longer
  // founder welcome remains available on demand from the menu.
  setShowWelcome(false);setWelcomeLoaded(!!me);
  return ()=>{valid=false;};
},[me]);
useEffect(()=>{
 let live=true;setTourPending(false);setTourLoaded(false);
 if(me)AsyncStorage.getItem('familienfunke.app-tour.v1.'+me)
   .then(seen=>{if(live)setTourPending(seen!=='seen');})
   .catch(()=>{if(live)setTourPending(false);})
   .finally(()=>{if(live)setTourLoaded(true);});
 return()=>{live=false;};
},[me]);
useEffect(()=>{
 if(me&&tab==='home'&&!busy&&!selectedContact&&!detailFamily&&!showInfo&&!reportTarget&&welcomeLoaded&&tourLoaded&&!showWelcome&&tourPending&&!showTour&&!menuOpen){
   setShowTour(true);
 }
},[me,tab,busy,selectedContact,detailFamily,showInfo,reportTarget,welcomeLoaded,tourLoaded,showWelcome,tourPending,showTour,menuOpen]);
function finishTour(){
 setTourPending(false);setShowTour(false);
 if(me)AsyncStorage.setItem('familienfunke.app-tour.v1.'+me,'seen').catch(()=>{});
}
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
async function publishMarketListing(listingId){
 const {data,error:e}=await supabase.rpc('ff_market_publish_listing',{p_listing_id:listingId});
 if(e)throw e;
 if(data!=='approved')throw new Error('Die Veröffentlichung wurde nicht bestätigt.');
 setNotice('Deine Anzeige ist jetzt im Familienbasar sichtbar.');
 return true;
}
async function sendChatMessage(body,contactId){
 if(!contactId)return false;
 const ticket=actionGate.current.acquire();
 if(ticket===null)return false;
 const actionOwner=me;
 setBusy(true);setError('');setNotice('');
 try{
 
  // Persist the intended send ID BEFORE dispatch, so a lost response or
  // app restart can reuse it. No plaintext chat text is stored on disk.
  const requestId=await chatSendIntents.reserve(actionOwner,contactId,body);
  // The server authenticates, checks the relationship, moderates new sends
  // and relies on messages.id PRIMARY KEY to deduplicate replays.
  const {data, error:sendError} = await supabase.functions.invoke('send-message', {
    body: {contact_id:contactId, body, request_id:requestId},
  });
  if(sendError){
    const status = sendError.context?.status;
    if(status===422)throw new Error('Diese Nachricht wurde wegen unserer Inhaltsregeln zurueckgehalten. Bitte formuliere sie anders.');
    if(status===401)throw new Error('Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.');
    if(status===403)throw new Error('Nachrichten sind fuer diesen Kontakt momentan nicht erlaubt.');
    if(status===429)throw new Error('Nachrichtenlimit erreicht. Bitte warte auf eine Antwort oder versuche es später erneut.');
    if(status===503)throw new Error('Die Sicherheitspruefung ist momentan nicht verfuegbar. Bitte spaeter erneut versuchen.');
    if(status===409)throw new Error('Diese Sendeanfrage wurde bereits für einen anderen Nachrichtentext verwendet. Bitte lade das Gespräch erneut.');
    if(isTransientFailure(sendError))throw new Error('Keine sichere Versandbestätigung erhalten. Bitte prüfe zuerst den Chatverlauf, bevor du die Nachricht erneut sendest.');
    throw new Error('Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
  }
  if(!data?.message?.id)throw new Error('Keine eindeutige Bestaetigung vom Nachrichtenserver erhalten.');
  if(data.message.id!==requestId)throw new Error('Der Nachrichtenserver konnte die eindeutige Sendeanfrage nicht bestätigen.');
  // Acknowledgement must not turn a committed message into a send error.
  // On a rare local storage failure, the preserved key simply replays the
  // confirmed server row instead of creating another message.
  try{await chatSendIntents.acknowledge(actionOwner,contactId,requestId);}
  catch{ /* The server has already confirmed this ID. */ }
  if(accountRef.current!==actionOwner||!actionGate.current.isActive(ticket))return false;

 setNotice(data.duplicate?'Nachricht war bereits gespeichert.':'Nachricht gesendet.');
 return true;
 }catch(e){if(accountRef.current===actionOwner&&actionGate.current.isActive(ticket))setError(mutationError(e));return false;}
 finally{
   const active=actionGate.current.isActive(ticket);
   actionGate.current.release(ticket);
   if(active&&accountRef.current===actionOwner)setBusy(false);
 }
}
// Events refresh their own cursor and request status; do not reload every app list.
async function executeEvent(fn,success){
 const ticket=actionGate.current.acquire();
 if(ticket===null)return false;
 const actionOwner=me;
 setBusy(true);setError('');setNotice('');
 try{
  await fn();
  if(accountRef.current!==actionOwner||!actionGate.current.isActive(ticket))return false;
  if(success)setNotice(success);
  return true;
 }catch(e){if(accountRef.current===actionOwner&&actionGate.current.isActive(ticket))setError(mutationError(e));return false;}
 finally{
   const active=actionGate.current.isActive(ticket);
   actionGate.current.release(ticket);
   if(active&&accountRef.current===actionOwner)setBusy(false);
 }
}
async function executeMarket(fn,success){
 // Auch nach einem fehlgeschlagenen Publish-RPC kann der Entwurf erfolgreich
 // gespeichert sein. Deshalb nur den Basar neu laden, nicht alle App-Daten.
 const ok=await executeEvent(fn,success);
 setMarketEpoch(n=>n+1);
 return ok;
}
async function execute(fn,success){
if(busy)return false;
const ticket=actionGate.current.acquire();
if(ticket===null)return false;
const actionOwner=me;
setBusy(true);setError('');setNotice('');
try{
 await fn();
 if(accountRef.current!==actionOwner||!actionGate.current.isActive(ticket))return false;
 if(success)setNotice(success);
 // The write already succeeded even if the follow-up refresh failed.
 // Never report a saved listing as unsaved: retrying might create duplicates.
 await load(true);
 return accountRef.current===actionOwner&&actionGate.current.isActive(ticket);
}
catch(e){if(accountRef.current===actionOwner&&actionGate.current.isActive(ticket))setError(mutationError(e));return false;}
finally{
 const active=actionGate.current.isActive(ticket);
 actionGate.current.release(ticket);
 if(active&&accountRef.current===actionOwner)setBusy(false);
}
}
function report(type,id){setReportDetails('');setReportReason('');setReportTarget({type,id});}
async function sendReport(){
 if(!reportTarget||reportDetails.trim().length<10)return setError('Bitte den Vorfall mit mindestens 10 Zeichen beschreiben.');
 if(reportTarget.type==='market'&&!reportReason)return setError('Bitte zuerst einen Meldegrund wählen.');
 let hidden=false;
 const ok=await executeEvent(async()=>{
   if(reportTarget.type==='market'){
     const {data,error:e}=await supabase.rpc('ff_market_report_listing',{
       p_listing_id:reportTarget.id,p_reason:reportReason,p_details:reportDetails.trim()
     });
     if(e)throw e;
     if(!data?.received)throw new Error('Die Meldung wurde nicht bestätigt.');
     hidden=!!data.temporarily_hidden;
   }else{
     assertResult(await supabase.from('reports').insert({reporter_id:me,
       subject_type:reportTarget.type,subject_id:reportTarget.id,details:reportDetails.trim()}));
   }
 },'Danke. Deine Meldung wurde übermittelt.');
 if(ok){setReportTarget(null);setReportDetails('');setReportReason('');
   if(reportTarget.type==='market'&&hidden){
     setMarketEpoch(n=>n+1);setMarketIntent({type:'search',query:''});setNotice('Die Anzeige wurde nach unabhängigen Meldungen vorläufig ausgeblendet.');
   }
 }
}
async function sendRequest(uid){
 return execute(async()=>assertResult(await supabase.rpc('ff_contact_create',{p_recipient_id:uid})),
   'Kontaktanfrage gespeichert oder bereits vorhanden.');
}
async function replyRequest(id,status){
 return execute(async()=>assertResult(await supabase.rpc('ff_contact_respond',{p_contact_id:id,p_status:status})),
   'Kontaktanfrage aktualisiert.');
}
async function blockUser(uid){
Alert.alert('Kontakt blockieren?','Die Person kann dir dann keine neuen Nachrichten schicken.',[
{text:'Abbrechen',style:'cancelled'},
{text:'Blockieren',style:'destructive',onPress:()=>execute(async()=>assertResult(await supabase.from('blocks').insert({blocker_id:me,blocked_id:uid})),'Kontakt blockiert.')},
]);
}
async function unblockUser(uid){return execute(async()=>assertResult(await supabase.from('blocks').delete().eq('blocker_id',me).eq('blocked_id',uid)),'Blockierung aufgehoben.');}
async function changePassword(password){
if(password.length<12)throw new Error('Das Passwort braucht mindestens 12 Zeichen.');
return executeEvent(async()=>assertResult(await supabase.auth.updateUser({password})),'Passwort geändert.');
}
function openInbox(){
  if(tab!=='inbox')setInboxReturnTab(tab==='push'?'more':tab);
  setDetailFamily(null);setSelectedContact(null);setShowInfo(false);
  setMarketIntent(null);setFocusContactId(null);setTab('inbox');inbox.refresh();
}
// Opening one notification must resolve only that destination, not refresh every tab.
// A missing/deleted target leaves the current screen intact.
async function openInboxEvent(event){
 const owner=me;
 if(!owner||!event?.id)return false;
 try{
   const {data:row,error:e}=await supabase.from('ff_notifications')
    .select('id,kind,contact_id,listing_id,listing_status,decision_id').eq('id',event.id).eq('user_id',me).maybeSingle();
   if(accountRef.current!==owner)return false;
   if(e)throw e;
   if(!row){setNotice('Diese Neuigkeit ist nicht mehr verfügbar.');inbox.refresh();return false;}
   if(row.kind==='decision'||row.kind==='decision_update'){
     if(!row.decision_id)return false;
     const {data:decision,error:decisionError}=await supabase.from('ff_official_decisions')
      .select('id').eq('id',row.decision_id).eq('published',true).maybeSingle();
     if(accountRef.current!==owner)return false;
     if(decisionError||!decision){setNotice('Dieser amtliche Beschluss ist nicht mehr verfügbar.');return false;}
     setDecisionFocusId(decision.id);setDecisionQuery('');setExtraReturnTab('inbox');setTab('decisions');
   }else if(row.kind==='search'||row.kind==='price'){ 
     if(!row.listing_id){setNotice('Dieses Angebot ist nicht mehr verfügbar.');return false;}
     const {data:listing,error:listingError}=await supabase.from('ff_market_listings')
       .select('id').eq('id',row.listing_id).eq('moderation_status','approved')
       .neq('seller_id',owner).maybeSingle();
     if(accountRef.current!==owner)return false;
     if(listingError)throw listingError;
     if(!listing){setNotice('Dieses Angebot ist nicht mehr verfügbar.');return false;}
     setDetailFamily(null);setSelectedContact(null);setShowInfo(false);
     setExtraReturnTab('inbox');
     setMarketIntent({type:'buyerListing',id:listing.id,returnTab:'inbox'});setTab('market');
   }else if(row.kind==='market'){
     if(!row.listing_id){setNotice('Die Anzeige ist nicht mehr verfügbar.');return false;}
     const {data:listing,error:listingError}=await supabase.from('ff_market_listings')
       .select('id').eq('id',row.listing_id).eq('seller_id',owner).maybeSingle();
     if(accountRef.current!==owner)return false;
     if(listingError)throw listingError;
     if(!listing){setNotice('Die Anzeige ist nicht mehr verfügbar.');return false;}
     // The market screen will fetch the exact older listing, including photos.
     setDetailFamily(null);setSelectedContact(null);setShowInfo(false);
     setExtraReturnTab('inbox');
     setMarketIntent({type:'inboxListing',id:listing.id});setTab('market');
   }else{
     if(!row.contact_id){setNotice('Der Kontakt ist nicht mehr verfügbar.');return false;}
     const {data:older,error:contactError}=await supabase.from('contact_requests')
       .select('*').eq('id',row.contact_id).maybeSingle();
     if(accountRef.current!==owner)return false;
     if(contactError)throw contactError;
     if(!older||(older.sender_id!==owner&&older.recipient_id!==owner)){
       setNotice('Der Kontakt ist nicht mehr verfügbar.');return false;
     }
     // The exact authorized contact may be outside the first 40-item page.
     // Check the server block status before showing the conversation.
     const counterpart=older.sender_id===owner?older.recipient_id:older.sender_id;
     const {data:flagRows,error:flagError}=await supabase.rpc('ff_block_flags',{p_user_ids:[counterpart]});
     if(accountRef.current!==owner)return false;
     if(flagError||!Array.isArray(flagRows))throw flagError||new Error('Block flags unavailable');
     setDb(old=>accountRef.current===owner?({
       ...old,contacts:appendUniqueRows([older],old.contacts),
       blocks:mergeVisibleBlockFlags(old.blocks,owner,[counterpart],flagRows)
     }):old);
     // The contact is sufficient to navigate. A slow or blocked display-name
     // lookup must not delay opening the actual conversation.
     supabase.from('profiles').select('*').eq('user_id',counterpart).maybeSingle()
       .then(({data:linked,error:profileError})=>{
         if(profileError||!linked||accountRef.current!==owner)return;
         setDb(old=>accountRef.current===owner
           ? {...old,profiles:appendUniqueRows(old.profiles,[linked],'user_id')}:old);
       }).catch(()=>{});
     setDetailFamily(null);setSelectedContact(null);setShowInfo(false);
     setMarketIntent(null);setExtraReturnTab('inbox');
     if(row.kind==='message'&&older.status==='accepted'){
       setChatReturnTab('inbox');setSelectedContact(older.id);setTab('chat');
     }else{
       setFocusContactId(older.id);setTab('contacts');
     }
   }
   return true;
 }catch(e){
   if(accountRef.current===owner)setNotice('Neuigkeit konnte nicht geöffnet werden. Bitte erneut versuchen.');
   return false;
 }
}
function navigateFromHome(id,marketQuery='',placeId=null){
  const routes=['box','sell','myListings','favorites','market','discover','map','guide','events','contacts','profile','partners','help','inclusion','outing','chat','inbox','push','aboutApp','calendar','play','healthy','decisions','tv'];
  if(!routes.includes(id))return;
  if(id==='inbox'){openInbox();return;}
  if(id==='healthy')setHealthyQuery(String(marketQuery||'').slice(0,160));
  if(id==='decisions'){setDecisionQuery(String(marketQuery||'').slice(0,160));setDecisionFocusId(typeof placeId==='string'?placeId:null);}
  if(id==='guide')setGuideQuery(String(marketQuery||'').slice(0,160));
  if(id==='inclusion')setInclusionQuery(String(marketQuery||'').slice(0,160));
  setCalendarSeed(null);
  setMapIntent(id==='map'&&typeof placeId==='string'?{id:placeId,returnTab:'home'}:null);
  setEventIntent(['events','partners'].includes(id)&&typeof placeId==='string'?{id:placeId,tab:id,owner:me}:null);
  setMarketIntent(id==='favorites'?{type:'favorites'}:id==='myListings'?{type:'myListings'}:id==='box'||id==='sell'?id:
    id==='market'&&typeof placeId==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(placeId)?
      {type:'buyerListing',id:placeId}:
    id==='market'&&marketQuery.trim()?{type:'search',query:marketQuery.slice(0,160)}:null);
  setExtraReturnTab('home');
  setTab(id==='box'||id==='sell'||id==='myListings'||id==='favorites'?'market':id);
}
function planCalendarPlace(place){
  setCalendarSeed({owner:me,place:{id:place.id,title:place.title}});
  setExtraReturnTab(tab);setTab('calendar');
}
function selectMenuItem(id){
 // Every menu destination must have a real route. The old quick 'Basar'
 // button silently failed because it was absent from MORE_ITEMS.
 const tabIds=TABS.map(([name])=>name);
 const canOpen=tabIds.includes(id)||MORE_ITEMS.some(item=>item[0]===id)
   ||['sell','myListings','more','info','refresh','welcome','tour'].includes(id);
 if(!canOpen)return;
 setMenuOpen(false);
 if(id==='refresh'){load();setNotice('Aktuelle Daten werden geladen.');return;}
 if(id==='welcome'){setShowWelcome(true);return;}
 if(id==='tour'){setShowTour(true);setTourPending(true);return;}
 if(id==='info'){setDetailFamily(null);setSelectedContact(null);setShowInfo(true);return;}
 if(id==='inbox'){openInbox();return;}
 if(id==='market'&&tab==='market'&&marketSubpage&&marketBackRef.current){
   marketBackRef.current();return;
 }
 // A new menu route must clear the old details, not stack invisible screens.
 if(id==='healthy')setHealthyQuery('');
 if(id==='decisions'){setDecisionQuery('');setDecisionFocusId(null);}
 if(id==='inclusion')setInclusionQuery('');
 if(tab===id&&!detailFamily&&!selectedContact&&!showInfo)return;
 const previous=tabIds.includes(tab)||tab==='more'?tab:(tabIds.includes(extraReturnTab)?extraReturnTab:'home');
 setDetailFamily(null);setSelectedContact(null);setShowInfo(false);
 setMarketIntent(id==='sell'?'sell':id==='myListings'?{type:'myListings'}:id==='favorites'?{type:'favorites'}:null);
 setMapIntent(null);setCalendarSeed(null);setEventIntent(null);setFocusContactId(null);setShowEventForm(false);
 setExtraReturnTab(previous===id?'home':previous);
 setTab(id==='sell'||id==='myListings'||id==='favorites'?'market':id);
}
if(!configured)return <SafeAreaView style={styles.screen}><View style={{padding:24,marginTop:80}}><Text style={styles.brand}>Familienfunke.</Text><H sub="Die App ist vorbereitet, braucht aber noch deine öffentlichen Supabase-Projektdaten.">Einrichtung erforderlich</H><Info>Bitte in der Datei .env die beiden Werte EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY eintragen. Niemals einen Secret Key verwenden.</Info></View></SafeAreaView>;
if(session===undefined)return <View style={styles.center}><ActivityIndicator color={C.accent} size="large"/><Text style={styles.sub}>Familienfunke wird gestartet …</Text></View>;
if(!me&&introPhase==='checking')return <View style={styles.center}><ActivityIndicator color={C.accent}/></View>;
if(!me&&introPhase==='intro')return <SparkleIntro onFinish={finishLoginSpark}/>;
if(!me)return <SafeAreaView style={styles.screen}><ExpoStatusBar style="dark"/>
{showLoginHelp?<><View style={styles.topBar}>
  <View style={{flex:1}}><Text style={styles.smallBrand}>Familienfunke.</Text><Text style={styles.topHint}>Hilfe zur Anmeldung</Text></View>
  <Button title="← Zur Anmeldung" small mode="ghost" onPress={()=>setShowLoginHelp(false)}/>
</View><TechnicalHelpScreen initialCategory="Anmeldung & Konto"/></>:
<Login error={error} setError={setError} onHelp={()=>setShowLoginHelp(true)}/>}
</SafeAreaView>;
const EXTRA_TITLES={tv:'Familienfunke TV',play:'Familienzeit',calendar:'Mein Familienkalender',savedSearches:'Suchaufträge',contacts:'Kontakte',chat:'Nachrichten',profile:'Profil',events:'Treffen',inclusion:'Inklusion',partners:'Kita & Partnerwelt',aboutApp:'Über uns',help:'Hilfe & FAQ',push:'Benachrichtigungen',inbox:'Neuigkeiten',outing:'Ausflugsplaner',healthy:'Sport & Gesundheit',decisions:'Beschlüsse einfach erklärt',more:'Weitere Bereiche'};
const selectedMainTab=TABS.some(t=>t[0]===tab)?tab:(TABS.some(t=>t[0]===extraReturnTab)?extraReturnTab:null);
const showBack=!!(detailFamily||selectedContact||showInfo||tab==='inbox'||tab==='outing'||tab==='more'||tab==='calendar'||tab==='play'||(tab==='map'&&mapIntent)||(tab==='market'&&(marketSubpage||marketIntent?.returnTab))||['profile','contacts','chat','events','inclusion','partners','aboutApp','help','push','savedSearches','healthy','decisions','tv'].includes(tab));
 const navTitle=detailFamily?'Familienprofil':selectedContact?'Nachrichten':showInfo?'Elternwissen':TABS.find(t=>t[0]===tab)?.[1]||EXTRA_TITLES[tab]||'Familienfunke';
function back(){
 if(detailFamily){setDetailFamily(null);return;}
 if(selectedContact){setSelectedContact(null);setTab(chatReturnTab);return;}
 if(showInfo){setShowInfo(false);return;}
 // Basar-Unterseiten zuerst schließen, bevor der übergeordnete Bereich verlassen wird.
 if(tab==='market'&&marketSubpage&&marketBackRef.current){marketBackRef.current();return;}
 if(tab==='inbox'){setTab(inboxReturnTab);return;}
 if(tab==='outing'||tab==='more'||tab==='play'){setTab(extraReturnTab==='more'?'home':extraReturnTab);return;}
 if(tab==='market'&&marketIntent?.returnTab){setMarketIntent(null);setTab(marketIntent.returnTab);return;}
 if(tab==='map'&&mapIntent){const origin=mapIntent.returnTab;setMapIntent(null);setTab(['calendar','home','healthy','inclusion'].includes(origin)?origin:'outing');return;}
 if(tab==='calendar'){setCalendarSeed(null);setTab(extraReturnTab==='calendar'?'home':extraReturnTab);return;}
 if(['events','partners'].includes(tab)&&eventIntent?.returnTab==='calendar'){setEventIntent(null);setTab('calendar');return;}
 if(['profile','contacts','chat','events','inclusion','partners','aboutApp','help','push','savedSearches','healthy','decisions','tv'].includes(tab))setTab(extraReturnTab==='more'?'home':extraReturnTab);
}
function guardProfileExit(next){
 if(selectedContact&&busy){Alert.alert('Vorgang läuft','Bitte warte auf die Rückmeldung, bevor du dieses Gespräch verlässt.');return;}
 if(selectedContact&&chatDraftDirty){
   Alert.alert('Nachricht noch nicht gesendet',
     'Dein angefangener Nachrichtentext würde beim Verlassen des Gesprächs verloren gehen.',[
       {text:'Weiter schreiben',style:'cancel'},
       {text:'Entwurf verwerfen',style:'destructive',onPress:()=>{
         setChatDraftDirty(false);next();
       }}
     ]);
   return;
 }
 if(tab==='events'&&eventDraftDirty){
   Alert.alert('Treffen noch nicht gespeichert',
     'Deine Eingaben für das geplante Treffen würden beim Wechsel verloren gehen.',[
       {text:'Treffen weiter bearbeiten',style:'cancel'},
       {text:'Eingaben verwerfen',style:'destructive',onPress:()=>{
         setEventDraftDirty(false);next();
       }}
     ]);
   return;
 }
 if(tab==='market'&&marketLeaveRef.current){
   marketLeaveRef.current(next);return;
 }
 if(tab==='profile'&&profileDirty){
  Alert.alert('Profiländerungen noch nicht gespeichert','Du hast Angaben verändert. Möchtest du sie verwerfen und den Bereich verlassen?',[
   {text:'Weiter bearbeiten',style:'cancel'},
   {text:'Änderungen verwerfen',style:'destructive',onPress:()=>{setProfileDirty(false);next();}}
  ]);
  return;
 }
 next();
}
 return <SafeAreaView style={styles.screen}>
<ExpoStatusBar style="dark"/>
<View style={styles.topBar}>
{showBack?<Pressable accessibilityRole="button" accessibilityLabel={'Zurück aus '+navTitle} accessibilityHint="Zur vorherigen Ansicht wechseln" onPress={()=>tab==='market'&&marketSubpage&&!detailFamily&&!selectedContact&&!showInfo?back():guardProfileExit(back)} style={({pressed})=>[styles.headerBackButton,pressed&&{opacity:0.72}]}>
  <Text style={styles.headerBackArrow}>‹</Text><Text style={styles.headerBackLabel}>Zurück</Text>
</Pressable>:null}
<View style={[styles.headerIdentity,showBack&&{minWidth:0}]}>
  {!showBack?<View style={styles.headerHeartBadge}><Text style={styles.headerHeart}>♥</Text></View>:null}
  <View style={{flex:1}}>
    {!showBack?<Text style={styles.smallBrand}>Familienfunke<Text style={{color:C.coral}}>.</Text></Text>:null}
    <Text numberOfLines={1} style={[styles.topHint,showBack&&{fontSize:14,fontWeight:'800',color:C.ink,marginTop:0}]}>{navTitle}</Text>
  </View>
</View>
{tab!=='inbox'&&!detailFamily&&!selectedContact&&!showInfo?<Pressable accessibilityRole="button" accessibilityLabel={'Neuigkeiten öffnen'+(inbox.unread===null?'':', '+inbox.unread+' ungelesen')} onPress={()=>guardProfileExit(openInbox)} style={styles.inboxBell}><FamilyIcon name="bell" size={22} color={C.ink}/>{inbox.unread>0?<View style={styles.inboxBadge}><Text style={styles.inboxBadgeText}>{inbox.unread>99?'99+':inbox.unread}</Text></View>:null}</Pressable>:null}

<Pressable accessibilityRole="button" accessibilityLabel="Menü öffnen" accessibilityState={{expanded:menuOpen}} onPress={()=>{Keyboard.dismiss();setMenuOpen(true);}} style={styles.headerMenuButton}><MenuIcon/><Text style={styles.headerMenuLabel}>Menü</Text></Pressable>
</View>
{connectionIssue?<View accessibilityLiveRegion="polite" style={{paddingHorizontal:12,paddingTop:8}}>
   <Info warning>Der Server ist vorübergehend nicht erreichbar. Einige Inhalte konnten nicht geladen werden.</Info>
   <Button title={loading?'Verbindung wird geprüft …':'Daten erneut laden'}
     disabled={loading} mode="outline" onPress={()=>load()}/>
 </View>:null}
<ActionNotice kind="error" message={error} onDismiss={()=>setError('')}/>
<ActionNotice message={notice} onDismiss={()=>setNotice('')}/>
{loading?<View style={{padding:4}}><ActivityIndicator color={C.accent}/></View>:null}
<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={0}>
<GentleReveal key={tab+'-'+(detailFamily?'family':selectedContact?'chat':showInfo?'info':'screen')}
  style={{flex:1}} distance={10}>
{detailFamily?<FamilyDetail p={db.profiles.find(p=>p.user_id===detailFamily)}
imageUrl={photosUrls[photoOf(detailFamily)?.id]} photos={db.photos.filter(p=>p.owner_id===detailFamily&&p.moderation_status==='approved')}
photosUrls={photosUrls} photoBusy={photoBusy} photoBusyMore={photoBusyMore} photoHasMore={photoHasMore} photoLoadError={photoLoadError} loadMorePhotos={loadMorePhotos} retryPhotos={()=>setPhotoEpoch(n=>n+1)}
active={active} disabled={busy} blocked={blocked(detailFamily)}
connection={db.contacts.find(c=>c.sender_id===detailFamily||c.recipient_id===detailFamily)}
onContact={()=>sendRequest(detailFamily)} onBlock={()=>blockUser(detailFamily)} onUnblock={()=>unblockUser(detailFamily)}
onReport={()=>report('profile',detailFamily)} onChat={(cid)=>{setChatReturnTab('discover');setDetailFamily(null);setSelectedContact(cid);setTab('chat');}}/>:
selectedContact?<ChatScreen onDraftChange={setChatDraftDirty} contact={accepted.find(c=>c.id===selectedContact)} me={me} nameOf={findName}
disabled={busy} blocked={blocked}
send={(body)=>sendChatMessage(body,selectedContact)}
onReport={(id)=>report('message',id)} onBlock={blockUser}/>:
showInfo?<InfoScreen/>:
tab==='home'?<HomeAssistant key={me} onNavigate={navigateFromHome} userId={me} profile={myProfile} active={active} inboxUnread={inbox.unread}/>:
tab==='play'?<FamilyPlayScreen key={me}/>:
tab==='tv'?<FamilyTVScreen key={me} owner={me} interests={myProfile?.interests} initialShowPrivacy={extraReturnTab==='profile'} visible={!menuOpen&&!showWelcome&&!showTour&&!reportTarget}/>:
tab==='healthy'?<HealthyScreen initialQuery={healthyQuery} onOpenMap={()=>{setExtraReturnTab('healthy');setMapIntent({layer:'bike',returnTab:'healthy'});setTab('map');}}/>:
tab==='decisions'?<OfficialDecisionsScreen key={me} userId={me} initialQuery={decisionQuery} focusId={decisionFocusId}/>:
tab==='calendar'?<FamilyCalendar key={me} userId={me} seed={calendarSeed?.owner===me?calendarSeed.place:null} onOpenEvent={(kind,id)=>{const target=kind==='family'?'events':'partners';setCalendarSeed(null);setEventIntent({id,tab:target,owner:me,returnTab:'calendar'});setTab(target);}} onOpenPlace={id=>{setCalendarSeed(null);setMapIntent({id,returnTab:'calendar'});setTab('map');}}/>:
tab==='outing'?<FamilyOutingScreen key={me} onCalendar={planCalendarPlace} draft={outingDraft?.owner===me?outingDraft.value:null} onSave={value=>{if(accountRef.current===me)setOutingDraft({owner:me,value});}} onMap={id=>{setMapIntent({id});setTab('map');}}/>:
tab==='guide'?<FamilyGuideScreen userId={me} regionLabel={myProfile?.region_label} initialKnowledgeQuery={guideQuery} onOpenHealthy={()=>{setExtraReturnTab('guide');setHealthyQuery('');setTab('healthy');}}/>:
tab==='map'?<FamilyMapScreen userId={me} onCalendar={planCalendarPlace} active={active} entryPlaceId={mapIntent?.id} entryLayer={mapIntent?.layer||'none'} addPlace={(v)=>executeEvent(async()=>{
 await moderateTextOrThrow([v.title,v.description,v.region_label]);
 assertResult(await supabase.from('ff_family_places').insert(v));
},'Danke! Dein Ort wartet auf Prüfung.')}/>:
tab==='savedSearches'?<SavedMarketSearches key={me} userId={me} onSearch={row=>{setMarketIntent({type:'savedSearch',row,returnTab:'savedSearches'});setTab('market');}} onBrowse={()=>{setMarketIntent(null);setTab('market');}}/>:
tab==='market'?<MarketScreen key={me} navigationBackRef={marketBackRef} navigationExitRef={marketLeaveRef} onBackStateChange={setMarketSubpage} onSavedSearches={()=>{setExtraReturnTab('market');setMarketIntent(null);setTab('savedSearches');}} entryIntent={marketIntent} marketRefresh={marketEpoch} listings={db.listings} me={me} active={active} busy={busy}
 ownLoading={marketOwnerBusy} ownLoadingMore={marketOwnerBusyMore} ownHasMore={marketOwnerHasMore}
 ownError={marketOwnerError} onLoadMoreOwn={loadMoreOwnListings} onRetryOwn={()=>setMarketEpoch(n=>n+1)}
organizations={db.organizations} photoUrls={marketPhotoUrls} extraPhotoUrls={marketExtraPhotoUrls} marketPhotos={db.marketPhotos} contacts={db.contacts}
createListing={(v,assets,stableId)=>executeMarket(async()=>{
 // Basar-Texte nicht wegen einzelner Wörter vorab blockieren.
 // Die verpflichtende Inhalts- und Produktprüfung findet auf dem Server statt.
 const {data:inserted,error:insertError}=await supabase.from('ff_market_listings').insert({...v,seller_id:me,...(stableId?{id:stableId}:{})}).select('id').single();
 if(insertError){
   if(stableId&&insertError.code==='23505'){
     const {data:existing,error:lookupError}=await supabase.from('ff_market_listings').select('id').eq('id',stableId).eq('seller_id',me).maybeSingle();
     if(!lookupError&&existing?.id===stableId){await publishMarketListing(existing.id);return;}
   }
   throw insertError;
 }
 if(assets?.length){
   try{await uploadMarketPhotos(inserted.id,assets,me);}
   catch(e){
     setNotice('Entwurf gespeichert. Ein Foto-Upload war unvollständig. Prüfe die Bilder unter „Meine“ und tippe auf „Jetzt veröffentlichen“.');
     return;
   }
 }
 await publishMarketListing(inserted.id);
})}
addPendingPhotos={(listingId,assets)=>executeMarket(async()=>{
 await uploadMarketPhotos(listingId,assets,me);
 await publishMarketListing(listingId);
})}
editListing={(listingId,v,assets)=>executeMarket(async()=>{
 const {data,error:e}=await supabase.rpc('ff_market_edit_listing',{
   p_listing_id:listingId,p_title:v.title,p_description:v.description,
   p_category:v.category,p_item_condition:v.item_condition,
   p_trade_type:v.trade_type,p_price_cents:v.price_cents,p_region_label:v.region_label
 });
 if(e)throw e;
 if(data!==true)throw new Error('Diese Anzeige darf nicht bearbeitet werden. Bitte prüfe ihren Status.');
 if(assets?.length){
   try{await uploadMarketPhotos(listingId,assets,me);}
   catch(e){setNotice('Änderungen als Entwurf gespeichert. Bitte prüfe die Fotos und veröffentliche unter „Meine“.');return;}
 }
 await publishMarketListing(listingId);
})}
toggleFavorite={(listingId,isFavorite)=>executeEvent(async()=>{
 if(isFavorite)assertResult(await supabase.from('ff_market_favorites').delete().eq('user_id',me).eq('listing_id',listingId));
 else assertResult(await supabase.from('ff_market_favorites').insert({user_id:me,listing_id:listingId}));
},isFavorite?'Aus der Merkliste entfernt.':'In deiner Merkliste gespeichert.')}
markListingSold={(id)=>executeMarket(async()=>{const {data,error:e}=await supabase.rpc('ff_market_mark_sold',{p_listing_id:id});if(e)throw e;if(data!==true)throw new Error('Das Inserat konnte nicht abgeschlossen werden. Bitte aktualisiere den Basar.');},'Angebot abgeschlossen. Es ist für andere nicht mehr sichtbar.')}
retryReview={(id)=>executeMarket(async()=>{
 const ownPending=db.listings.some(x=>x.id===id&&x.seller_id===me&&x.moderation_status==='pending');
 if(!ownPending)throw new Error('Nur ein eigener unveröffentlichter Entwurf kann veröffentlicht werden.');
 await publishMarketListing(id);
})}
onReportListing={id=>report('market',id)} onContact={sendRequest} onChat={(cid)=>{setChatReturnTab('market');setSelectedContact(cid);setTab('chat');}} nameOf={findName} blocked={blocked}/>:
tab==='partners'?<PartnersScreen key={me} focusId={eventIntent?.owner===me&&eventIntent.tab==='partners'?eventIntent.id:null} clearFocus={()=>setEventIntent(null)} organizations={db.organizations}
me={me} active={active} busy={busy}
applyOrg={(v)=>executeEvent(async()=>{
 await moderateTextOrThrow([v.name,v.description,v.region_label]);
 const {data:org,error:orgError}=await supabase.from('ff_organizations')
   .insert({...v,owner_id:me}).select('*').single();
 if(orgError)throw orgError;
 if(accountRef.current===me)setDb(old=>({...old,organizations:appendUniqueRows([org],old.organizations)}));
},'Partneranfrage gespeichert. Die Einrichtung wird vor Freigabe geprüft.')}
createPartnerEvent={(v)=>executeEvent(async()=>{
 await moderateTextOrThrow([v.title,v.description,v.region_label]);
 assertResult(await supabase.from('ff_partner_events').insert({...v,creator_id:me}));
},'Veranstaltung eingereicht. Sie erscheint nach Freigabe.')}
openInclusion={()=>{setExtraReturnTab(tab);setTab('inclusion');}}/>:
tab==='more'?<MoreScreen navigate={selectMenuItem} openInfo={()=>setShowInfo(true)} openWelcome={()=>setShowWelcome(true)}/>:
tab==='inclusion'?<InclusionScreen regionLabel={myProfile?.region_label} initialQuery={inclusionQuery} onOpenMap={()=>{setExtraReturnTab('inclusion');setMapIntent({returnTab:'inclusion'});setTab('map');}}/>:
tab==='aboutApp'?<AboutFamilienfunkeScreen/>:
tab==='help'?<TechnicalHelpScreen onNavigate={selectMenuItem}/>:
tab==='push'?<PushSettings key={me} userId={me} active={active}/>:
tab==='inbox'?<NotificationCenterScreen key={me} inbox={inbox} active={active} onOpen={openInboxEvent} onSettings={()=>{setExtraReturnTab('inbox');setTab('push');}}/>:
tab==='discover'?<DiscoverScreen filters={discoverFilters} setFilters={setDiscoverFilters} matches={matches} requests={db.contacts} me={me} active={active} busy={busy}
 hasMore={discoverMore} loadingMore={discoverLoadingMore} onLoadMore={loadMoreFamilies}
myProfile={myProfile} verification={verification} membership={membership}
showFamily={setDetailFamily} onContact={sendRequest} imageFor={(uid)=>photosUrls[photoOf(uid)?.id]} blocked={blocked}/>:
tab==='contacts'?<ContactsScreen focusId={focusContactId} pending={pending} accepted={accepted} me={me} nameOf={findName}
 hasMore={contactsMore} loadingMore={contactsLoadingMore} onLoadMore={loadMoreContacts}
respond={replyRequest} blocked={blocked} disabled={busy} onBlock={blockUser} onUnblock={unblockUser}
onChat={(id)=>{setChatReturnTab('contacts');setSelectedContact(id);setTab('chat');}}/>:
tab==='chat'?<ChatList contacts={accepted} me={me} nameOf={findName} blocked={blocked}
onChat={(id)=>{setChatReturnTab('chat');setSelectedContact(id);}} hasMore={contactsMore} loadingMore={contactsLoadingMore} onLoadMore={loadMoreContacts}/>:
tab==='events'?<EventsScreen key={me} onDraftChange={setEventDraftDirty} focusId={eventIntent?.owner===me&&eventIntent.tab==='events'?eventIntent.id:null} clearFocus={()=>setEventIntent(null)} me={me} active={active} busy={busy}
profiles={db.profiles} showForm={showEventForm} setShowForm={setShowEventForm}
createEvent={(event)=>executeEvent(async()=>{
  await moderateTextOrThrow([event.title,event.description,event.region_label]);
  assertResult(await supabase.from('events').insert({organizer_id:me,...event}));
},'Termin eingereicht. Er wird vor Veröffentlichung geprüft.')}
requestEvent={(id)=>executeEvent(async()=>assertResult(await supabase.from('event_requests').insert({event_id:id,requester_id:me})),'Teilnahme angefragt.')}
replyEvent={(id,requester,status)=>executeEvent(async()=>{
 const {data,error:e}=await supabase.from('event_requests')
  .update({status}).eq('event_id',id).eq('requester_id',requester)
  .select('event_id,status').single();
 if(e)throw e;
 if(data?.status!==status)throw new Error('Teilnahmeanfrage konnte nicht aktualisiert werden.');
},'Teilnahmestatus aktualisiert.')}
reportEvent={(id)=>report('event',id)}/>:
<ProfileScreen userId={me} profile={myProfile} verification={verification} membership={membership} active={active}
photos={ownPhotos} photosUrls={photosUrls} busy={busy}
 photoBusy={photoBusy} photoBusyMore={photoBusyMore} photoHasMore={photoHasMore} photoLoadError={photoLoadError} loadMorePhotos={loadMorePhotos} retryPhotos={()=>setPhotoEpoch(n=>n+1)}
save={(value)=>execute(async()=>{
  await moderateTextOrThrow([value.display_name,value.region_label,value.about,...(value.interests||[])]);
  assertResult(await supabase.from('profiles').update(value).eq('user_id',me));
},'Profil gespeichert. Textänderungen benötigen eine neue Freigabe.')}
uploadPhoto={(asset,caption)=>uploadProfilePhoto(asset,caption,me,executePhoto)}
reportPhoto={(id)=>report('photo',id)} deletePhoto={(id)=>deleteProfilePhoto(id,me,db.photos,executePhoto)}
blocks={db.blocks} onUnblock={unblockUser}
changePassword={changePassword} onDirtyChange={setProfileDirty} openTVTopics={()=>guardProfileExit(()=>{setExtraReturnTab('profile');setTab('tv');})} openInfo={()=>guardProfileExit(()=>setShowInfo(true))} signOut={()=>guardProfileExit(()=>signOutWithPush(me).catch(()=>Alert.alert('Abmeldung nicht bestätigt','Die Geräteabmeldung konnte nicht bestätigt werden. Bitte prüfe die Verbindung und versuche es erneut. Bei Bedarf deaktiviere Benachrichtigungen in den Systemeinstellungen.')))}/>}
</GentleReveal>
</KeyboardAvoidingView>
{!selectedContact&&!detailFamily&&!showInfo?<View style={styles.tabBar}>
{TABS.map(([id,title,glyph])=><Pressable accessibilityRole="button" key={id} onPress={()=>id==='market'&&tab==='market'&&marketSubpage?back():guardProfileExit(()=>{
  if(id==='market'&&tab==='market'&&marketSubpage&&marketBackRef.current){
    marketBackRef.current();return;
  }
  setMarketIntent(null);setMapIntent(null);setEventIntent(null);setCalendarSeed(null);
  setExtraReturnTab('more');if(id==='guide')setGuideQuery('');
  setTab(id);setShowEventForm(false);
})}
accessibilityLabel={title} accessibilityState={{selected:selectedMainTab===id}}
accessibilityHint="Länger drücken, um eine Erklärung zu erhalten"
onLongPress={()=>Alert.alert(title,({
  home:'Fragen stellen, Angebote finden und zur Familienzeit springen.',
  market:'Kinderartikel suchen oder eigene Anzeigen direkt einstellen.',
  discover:'Andere Familien mit passenden Interessen entdecken.',
  map:'Familienausflüge auf der Karte entdecken.',
  guide:'Offizielle Informationen und Ratgeber für Familien finden.'
})[id])}
style={({pressed})=>[styles.tab,(selectedMainTab===id)&&styles.tabActive,
  pressed&&{transform:[{scale:.96}],opacity:.84}]}><View style={[styles.tabIcon,(selectedMainTab===id)&&styles.tabIconSelected]}>
  <SoftTabIcon name={glyph} selected={selectedMainTab===id}/>
</View><Text style={[styles.tabLabel,(selectedMainTab===id)&&{color:C.accentDark,fontWeight:'800'}]}>{title}</Text></Pressable>)}
</View>:null}
<TopRightMenu visible={menuOpen&&!showWelcome&&!reportTarget} onClose={()=>setMenuOpen(false)} onSelect={id=>id==='profile'&&tab==='profile'&&!showInfo?(setMenuOpen(false)):id==='market'&&tab==='market'&&marketSubpage&&!detailFamily&&!selectedContact&&!showInfo?selectMenuItem(id):guardProfileExit(()=>selectMenuItem(id))} activeTab={showInfo?'info':tab} unread={inbox.unread}/>
{reportTarget?<Modal visible={!!reportTarget} transparent animationType="fade" onRequestClose={()=>setReportTarget(null)}>
<KeyboardAvoidingView accessibilityViewIsModal style={styles.modalShade}
  behavior={Platform.OS==='ios'?'padding':undefined}>
 <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1,width:'100%'}}
   contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingVertical:20}}>
 <Card style={{marginHorizontal:22,padding:22}}> 
<Text accessibilityRole="header" style={styles.h}>Inhalt melden</Text><Text style={styles.sub}>Bitte beschreibe den Vorfall sachlich. Die Meldung geht an das Betreiberteam.</Text>
{reportTarget.type==='market'?<View style={{marginBottom:13}}>
  <Text style={styles.label}>Warum meldest du diese Anzeige?</Text>
  <View style={styles.chipsRow}>
    {['Unzulässiger Artikel','Betrugsverdacht','Kinderschutz','Spam','Sonstiges'].map(reason=>
      <Chip key={reason} text={reason} selected={reportReason===reason} onPress={()=>setReportReason(reason)}/>)}
  </View>
  <Text style={[styles.micro,{marginTop:9}]}>Mehrere unabhängige Meldungen können die Anzeige vorläufig ausblenden. Bitte nur tatsächliche Verstöße melden.</Text>
</View>:null}
<Input label="Was ist passiert?" multiline value={reportDetails} onChangeText={setReportDetails} maxLength={reportTarget.type==='market'?1200:2000}/>
<Row><Button title="Abbrechen" mode="outline" style={{flex:1}} onPress={()=>setReportTarget(null)}/><Button title="Meldung senden" disabled={busy||reportDetails.trim().length<10||(reportTarget.type==='market'&&!reportReason)} style={{flex:1}} onPress={sendReport}/></Row>
</Card></ScrollView></KeyboardAvoidingView></Modal>:null}
<WelcomeIntro visible={!!me&&showWelcome} onClose={dismissWelcome}/>
<FamilyAppTour visible={!!me&&showTour&&!showWelcome&&!menuOpen&&!reportTarget}
  onClose={finishTour}/>
</SafeAreaView>;
}
async function uploadProfilePhoto(asset,caption,me,execute){
if(!asset?.uri)throw new Error('Bitte zuerst ein Foto auswählen.');
return execute(async()=>{
// Erst mit dem Klick auf "Foto einreichen" starten die Prüfungen.
// Eine abgelehnte Bildbeschreibung bleibt im Entwurf zur Überarbeitung.
// Das Foto wird danach zunächst privat mit Status "pending" gespeichert.
await moderateTextOrThrow([safeString(caption,200)]);
const saved=await preparePrivateJpeg(asset,1024,0.78);
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

/** Der Familienbasar veröffentlicht Angebote nach dem Upload ohne manuelle Vorabfreigabe.
 * Bezahlen ist absichtlich NICHT implementiert. */
async function preparePrivateJpeg(asset,maxEdge,compress){
 const job=ImageManipulator.ImageManipulator.manipulate(asset.uri);
 // Resolve actual dimensions if an older persisted draft has no metadata.
 let rendered;
 if(Number.isFinite(asset.width)&&asset.width>0&&Number.isFinite(asset.height)&&asset.height>0){
   const resize=photoResize(asset.width,asset.height,maxEdge);if(resize)job.resize(resize);
   rendered=await job.renderAsync();
 }else{
   rendered=await job.renderAsync();
   const resize=photoResize(rendered.width,rendered.height,maxEdge);
   if(resize){const next=ImageManipulator.ImageManipulator.manipulate(rendered);next.resize(resize);rendered=await next.renderAsync();}
 }
 return rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress});
}
async function prepareMarketJpeg(asset){
 const saved=await preparePrivateJpeg(asset,900,0.7);
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
async function scanMarketPhotos(){
 // Bewusst keine Foto-Uploads an ein Sprach- oder Bildmodell.
 throw new Error('Die automatische Fotoerkennung ist während der kostenfreien Entwicklungsphase deaktiviert.');
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
function MarketScreen({entryIntent,marketRefresh,navigationBackRef,navigationExitRef,onBackStateChange,onSavedSearches,listings,marketPhotos,me,active,busy,organizations,photoUrls,extraPhotoUrls,contacts,createListing,addPendingPhotos,editListing,toggleFavorite,markListingSold,retryReview,onReportListing,onContact,onChat,nameOf,blocked,ownLoading,ownLoadingMore,ownHasMore,ownError,onLoadMoreOwn,onRetryOwn}){
  const [open,setOpen]=useState(false);
  const {width:screenWidth,fontScale}=useWindowDimensions();
  const singleColumn=screenWidth<375||fontScale>=1.5;
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('Alle');
  const [tradeFilter,setTradeFilter]=useState('all');
  const [sortBy,setSortBy]=useState('relevance');
  const [minPrice,setMinPrice]=useState('');
  const [maxPrice,setMaxPrice]=useState('');
  const [filterOpen,setFilterOpen]=useState(false);
  const [showMarketTrust,setShowMarketTrust]=useState(false);
const [sellChoicesOpen,setSellChoicesOpen]=useState(false);
  const [savingSearch,setSavingSearch]=useState(false);
  const [buyerFocus,setBuyerFocus]=useState(null);
  const [selectedListing,setSelectedListing]=useState(null);
  const [onlyMine,setOnlyMine]=useState(false);
  const [onlyFavorites,setOnlyFavorites]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [galleryIndex,setGalleryIndex]=useState(0);
  const [searchPage,setSearchPage]=useState(0);
  const [remoteListings,setRemoteListings]=useState([]);
  const [remoteHasMore,setRemoteHasMore]=useState(false);
  const [remoteBusy,setRemoteBusy]=useState(false);
  const [remoteError,setRemoteError]=useState('');
  const [searchRetry,setSearchRetry]=useState(0);
  const [remotePhotoUrls,setRemotePhotoUrls]=useState({});
  const [remoteExtraPhotos,setRemoteExtraPhotos]=useState([]);
  const [remoteExtraUrls,setRemoteExtraUrls]=useState({});
  const [remoteOrganizations,setRemoteOrganizations]=useState([]);
  const [favoriteMap,setFavoriteMap]=useState({});
  const [favoriteBusy,setFavoriteBusy]=useState({});
  const [favoriteRefresh,setFavoriteRefresh]=useState(0);
  const searchSeq=useRef(0);
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [region,setRegion]=useState('');
  const [category,setCategory]=useState('Kleidung');
  const [condition,setCondition]=useState('Gut');
  const [trade,setTrade]=useState('sell');
  const [price,setPrice]=useState('');
  const [organizationId,setOrganizationId]=useState('');
  const [photo,setPhoto]=useState([]);
  const [choosing,setChoosing]=useState(false);
  const [quick,setQuick]=useState(false);
  const [rulesConfirmed,setRulesConfirmed]=useState(false);
  const [draftTemplateId,setDraftTemplateId]=useState(null);
  const [facts,setFacts]=useState({...EMPTY_FACTS});
  const [scanBusy,setScanBusy]=useState(false);
  const [proposal,setProposal]=useState(null);
  const [scanNotice,setScanNotice]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const [expandFacts,setExpandFacts]=useState(false);
  const [scanned,setScanned]=useState(false);
  const [askSize,setAskSize]=useState(false);
  const [boxOpen,setBoxOpen]=useState(false);
  const [boxPhoto,setBoxPhoto]=useState(null);
  const [boxDrafts,setBoxDrafts]=useState([]);
  const [boxNotice,setBoxNotice]=useState('');
  const [boxScanned,setBoxScanned]=useState(false);
  const [boxOverflow,setBoxOverflow]=useState(false);
  const [boxEditor,setBoxEditor]=useState(null);
  const [boxRegion,setBoxRegion]=useState('');
  const [boxPackageDraft,setBoxPackageDraft]=useState(null);
  const [boxBatches,setBoxBatches]=useState([]);
  const [boxCurrentBatch,setBoxCurrentBatch]=useState(null);
  const [boxSelected,setBoxSelected]=useState(null);
  const [boxFilter,setBoxFilter]=useState('all');
  const [boxStep,setBoxStep]=useState('photo');
  const [boxAdvanced,setBoxAdvanced]=useState(false);
  const [boxShowAll,setBoxShowAll]=useState(false);
  const [boxFormExtras,setBoxFormExtras]=useState(false);
  const marketScrollRef=useRef(null);
  const inMarketSubpage=boxOpen||open||!!boxEditor||!!selectedListing||sellChoicesOpen;
  useEffect(()=>{onBackStateChange(inMarketSubpage);return()=>onBackStateChange(false);},[inMarketSubpage,onBackStateChange]);
  // Tabwechsel oder Menüwechsel dürfen keine ungespeicherten Inserate
  // kommentarlos verwerfen. Interne Zurück-Wege bleiben getrennt.
  useEffect(()=>{
    navigationExitRef.current=(next)=>{
      const changed=!!(editingId||title.trim()||description.trim()||region.trim()||price.trim()||photo.length);
      if(open&&changed){
        Alert.alert('Anzeige noch nicht gespeichert',
          'Deine Eingaben würden beim Wechsel verloren gehen. Möchtest du sie wirklich verwerfen?',[
            {text:'Anzeige weiter bearbeiten',style:'cancel'},
            {text:'Entwurf verwerfen',style:'destructive',onPress:next}
          ]);
        return;
      }
      if(boxEditor||boxOpen){
        Alert.alert('Kiste lokal speichern?',
          'Die Änderungen in deiner Kiste sollen vor dem Wechsel auf diesem Gerät gesichert werden. Das ist kein Cloud-Backup.',[
            {text:'In der Kiste bleiben',style:'cancel'},
            {text:'Sichern & wechseln',onPress:async()=>{
              if(boxStorage!=='ready'){
                Alert.alert('Kiste nicht bereit','Bitte warte, bis die lokale Kiste geladen ist.');return;
              }
              try{
                await saveBoxSnapshot(me,boxSnapshot());
                next();
              }catch{
                Alert.alert('Speichern fehlgeschlagen',
                  'Der Zwischenstand wurde nicht zuverlässig gesichert. Prüfe bitte den Gerätespeicher und bleibe in der Kiste.');
              }
            }}
          ]);
        return;
      }
      next();
    };
    return()=>{navigationExitRef.current=null;};
  });
  // Header-Zurück führt zur unmittelbar vorherigen Basar-Ansicht.
  useEffect(()=>{
    navigationBackRef.current=()=>{
      if(boxEditor){saveBoxEditor();return;}
      if(boxOpen){closeBox();return;}
      if(open){
        const changed=!!(editingId||title.trim()||description.trim()||region.trim()||price.trim()||photo.length);
        const close=()=>{resetForm();setOpen(false);};
        if(changed)Alert.alert('Anzeige verlassen?','Noch nicht eingereichte Angaben werden verworfen.',[
          {text:'Weiter bearbeiten',style:'cancel'},{text:'Verwerfen',style:'destructive',onPress:close}
        ]);
        else close();
        return;
      }
      if(selectedListing){setSelectedListing(null);setBuyerFocus(null);return;}
      if(sellChoicesOpen)setSellChoicesOpen(false);
    };
    return()=>{navigationBackRef.current=null;};
  });
  useEffect(()=>{if(boxOpen||boxEditor||open||selectedListing||sellChoicesOpen)marketScrollRef.current?.scrollTo({y:0,animated:false});},[boxStep,boxOpen,boxEditor,open,selectedListing,sellChoicesOpen]);
  const [boxStorage,setBoxStorage]=useState('loading');
  // Deep-link the homepage directly into the actual selling workflows.
  // Wait for the on-device box snapshot before opening an existing box.
  useEffect(()=>{
    if(!entryIntent||boxStorage!=='ready')return;
    if(entryIntent==='box'){
      setOpen(false);setSelectedListing(null);setBoxStep(boxDrafts.length?'review':'photo');setBoxOpen(true);
    }else if(entryIntent==='sell'){
      resetForm();setBoxOpen(false);setQuick(true);setCondition('');setOpen(true);setSelectedListing(null);
    }
  },[entryIntent,boxStorage]);
  useEffect(()=>{
    if(entryIntent?.type!=='search')return;
    setBuyerFocus(null);
    setQuery(entryIntent.query||'');
    setFilter('Alle');setTradeFilter('all');setMinPrice('');setMaxPrice('');
    setSortBy('relevance');setOnlyMine(false);setOnlyFavorites(false);
    setOpen(false);setBoxOpen(false);setSelectedListing(null);
  },[entryIntent]);
  useEffect(()=>{
    if(entryIntent?.type!=='favorites')return;
    setBuyerFocus(null);setQuery('');setFilter('Alle');setTradeFilter('all');
    setMinPrice('');setMaxPrice('');
    setOnlyMine(false);setOnlyFavorites(true);
    setOpen(false);setBoxOpen(false);setSellChoicesOpen(false);setSelectedListing(null);
  },[entryIntent]);
  useEffect(()=>{
    if(entryIntent?.type!=='myListings')return;
    setBuyerFocus(null);setQuery('');setFilter('Alle');
    setTradeFilter('all');setMinPrice('');setMaxPrice('');
    setOnlyMine(true);setOnlyFavorites(false);
    setOpen(false);setBoxOpen(false);setSellChoicesOpen(false);setSelectedListing(null);
  },[entryIntent]);
  useEffect(()=>{
    if(entryIntent?.type!=='inboxListing')return;
    setBuyerFocus(null);
    setQuery('');setFilter('Alle');setTradeFilter('all');setMinPrice('');setMaxPrice('');
    setOnlyMine(true);setOnlyFavorites(false);setOpen(false);setBoxOpen(false);setGalleryIndex(0);
    setSelectedListing(entryIntent.id);
  },[entryIntent]);
  useEffect(()=>{
    if(entryIntent?.type==='savedSearch'){
      const row=entryIntent.row;
      setQuery(row.query);setFilter(row.category);setTradeFilter(row.trade_type);
      setMinPrice(row.min_cents==null?'':String(row.min_cents/100).replace('.',','));
      setMaxPrice(row.max_cents==null?'':String(row.max_cents/100).replace('.',','));
      setFilterOpen(true);setSortBy('relevance');setOnlyMine(false);setOnlyFavorites(false);
      setOpen(false);setBoxOpen(false);setBuyerFocus(null);setSelectedListing(null);
    }else if(entryIntent?.type==='buyerListing'){
      setQuery('');setFilter('Alle');setTradeFilter('all');setMinPrice('');setMaxPrice('');
      setOnlyMine(false);setOnlyFavorites(false);setOpen(false);setBoxOpen(false);setGalleryIndex(0);
      setBuyerFocus(entryIntent.id);setSelectedListing(entryIntent.id);
    }
  },[entryIntent]);
  async function saveCurrentSearch(){
    if(savingSearch||!active||onlyMine||onlyFavorites)return;
    setSavingSearch(true);
    try{
      await saveMarketSearch({query,category:filter,trade:tradeFilter,minPrice,maxPrice});
      Alert.alert('Suche gespeichert','Du findest den Suchauftrag unter Meine Suchaufträge. Dort kannst du Mitteilungen jederzeit ein- oder ausschalten.');
    }catch(e){Alert.alert('Suchauftrag',e.message||'Speichern nicht möglich.');}
    finally{setSavingSearch(false);}
  }
  const [boxSaveError,setBoxSaveError]=useState(false);
  const [boxPending,setBoxPending]=useState(null);
  const submitLock=useRef(false);
  const [boxSeq,setBoxSeq]=useState(0);
  const [boxInspect,setBoxInspect]=useState(null);
  const [boxQuality,setBoxQuality]=useState([]);
  const [boxCrop,setBoxCrop]=useState(null);
  const [boxCropFrame,setBoxCropFrame]=useState({width:0,height:0});
  const [boxBulkSize,setBoxBulkSize]=useState('');
  const [boxImageFrame,setBoxImageFrame]=useState({width:0,height:0});
  const selectedBoxIds=boxSelected===null?boxDrafts.slice(0,BOX_MAX_PACKAGE).map(d=>d.id):boxSelected.filter(id=>boxDrafts.some(d=>d.id===id));
  const selectedBoxDrafts=boxDrafts.filter(d=>selectedBoxIds.includes(d.id));
  const boxSummary=useMemo(()=>summarizeBox(boxDrafts),[boxDrafts]);
  const boxSizeGroups=useMemo(()=>sizeGroups(boxDrafts),[boxDrafts]);
  const boxSuggestions=useMemo(()=>suggestBoxPackages(boxDrafts),[boxDrafts]);
  const boxChecks=useMemo(()=>packageCheck(boxDrafts),[boxDrafts]);
  const visibleBoxDrafts=boxDrafts.filter(d=>boxFilter==='unknown'?d.category==='Kleidung'&&!d.facts.size:boxFilter==='review'?!!d.uncertainty||!d.title.trim():boxFilter==='selected'?selectedBoxIds.includes(d.id):true);
  function boxSnapshot(pending=boxPending){
    let drafts=boxDrafts,bundle=boxPackageDraft;
    if(boxEditor){
      const d={id:boxEditor.id,listingId:boxEditor.listingId,packageIds:boxEditor.packageIds,title,category,facts:{...facts},photos:photo,condition,trade,price,description,region,organizationId};
      if(boxEditor.packageIds)bundle=d;
      else drafts=drafts.map(old=>old.id===d.id?{...old,...d,sizeEvidence:d.facts.size!==old.facts.size?'seller':old.sizeEvidence}:old);
    }
    return {version:2,drafts,batches:boxBatches,currentBatch:boxCurrentBatch,photo:boxPhoto,scanned:boxScanned,overflow:boxOverflow,region:boxRegion,seq:boxSeq,selection:boxSelected,bundle,pending,quality:boxQuality};
  }
  useEffect(()=>{
    let live=true;
    loadBoxSnapshot(me).then(data=>{
      if(!live)return;
      if(data){
        const cleanPhotos=assets=>(Array.isArray(assets)?assets:[]).map(a=>availableBoxPhoto(me,a)).filter(Boolean);
        setBoxDrafts(data.drafts.slice(0,BOX_MAX_ITEMS).map(d=>({...d,photos:cleanPhotos(d.photos)})));
        const batches=data.batches.slice(0,BOX_MAX_BATCHES).map(b=>({...b,photo:availableBoxPhoto(me,b.photo)}));
        setBoxBatches(batches);setBoxCurrentBatch(data.currentBatch||null);
        setBoxPhoto(availableBoxPhoto(me,data.photo));setBoxScanned(!!data.scanned);setBoxOverflow(!!data.overflow);setBoxQuality(photoIssues(data.quality));
        setBoxRegion(data.region||'');setBoxSeq(Number.isInteger(data.seq)?data.seq:0);
        setBoxSelected(Array.isArray(data.selection)?data.selection:null);
        setBoxPending(data.pending?.listingId&&Array.isArray(data.pending.ids)?data.pending:null);
        setBoxPackageDraft(data.bundle?{...data.bundle,photos:cleanPhotos(data.bundle.photos)}:null);
        if(data.drafts.length||data.photo)setBoxNotice('Deine gespeicherte Kiste ist wieder da. Bei unterbrochenen Einreichungen prüfe zuerst „Meine“. Fehlende Fotos können neu hinzugefügt werden.');
      }
      setBoxStorage('ready');
    }).catch(()=>{if(live){setBoxStorage('error');setBoxNotice('Lokale Kiste nicht lesbar. Vor einem Neustart bitte bewusst die gespeicherte Kiste löschen.');}});
    return ()=>{live=false;};
  },[me]);
  useEffect(()=>{
    if(boxStorage!=='ready')return;
    let live=true;
    const data=boxSnapshot();
    const hasContent=data.drafts.length||data.batches.length||data.photo||data.bundle||data.pending||data.region;
    saveBoxSnapshot(me,hasContent?data:null).then(()=>{if(live)setBoxSaveError(false);}).catch(()=>{if(live)setBoxSaveError(true);});
    return ()=>{live=false;};
  },[me,boxStorage,boxDrafts,boxBatches,boxCurrentBatch,boxPhoto,boxScanned,boxOverflow,boxRegion,boxSeq,boxSelected,boxPackageDraft,boxPending,boxQuality,boxEditor,title,category,facts,photo,condition,trade,price,description,region,organizationId]);
  const packageForm=boxEditor?.packageIds?parsePackageNote(description):null;
  const cropDraft=boxCrop?boxDrafts.find(d=>d.id===boxCrop.id):null;
  const cropSource=cropDraft?boxBatches.find(b=>b.id===cropDraft.batchId)?.photo:null;
  const cropBusy=busy||scanBusy||choosing;
  const myOrgs=organizations.filter(x=>x.owner_id===me&&x.status==='approved');
  const favoriteIds=new Set(Object.keys(favoriteMap).filter(id=>favoriteMap[id]===true));
  const allMarketOrganizations=organizations.concat(remoteOrganizations);
  async function changeFavorite(listingId){
    if(favoriteBusy[listingId]||favoriteMap[listingId]===undefined)return false;
    const wasFavorite=favoriteMap[listingId];
    setFavoriteBusy(old=>({...old,[listingId]:true}));
    try{
      const ok=await toggleFavorite(listingId,wasFavorite);
      if(ok){
        setFavoriteMap(old=>({...old,[listingId]:!wasFavorite}));
        setFavoriteRefresh(n=>n+1);
      }
      return !!ok;
    }finally{setFavoriteBusy(old=>({...old,[listingId]:false}));}
  }
  const editingListing=editingId?listings.find(x=>x.id===editingId&&x.seller_id===me):null;
  const existingPhotoCount=editingListing?(editingListing.photo_path?1:0)
    +marketPhotos.filter(x=>x.listing_id===editingId).length:0;
  const galleryOf=x=>{
    const pictures=[];
    if(remotePhotoUrls[x.id]||photoUrls[x.id])pictures.push({id:'primary',uri:remotePhotoUrls[x.id]||photoUrls[x.id]});
    marketPhotos.concat(remoteExtraPhotos).filter(p=>p.listing_id===x.id).sort((a,b)=>a.slot-b.slot).forEach(p=>{
      if(remoteExtraUrls[p.photo_path]||extraPhotoUrls[p.photo_path])pictures.push({id:p.photo_path,uri:remoteExtraUrls[p.photo_path]||extraPhotoUrls[p.photo_path]});
    });
    return pictures;
  };
  function resetForm(){
    setBoxEditor(null);setEditingId(null);setTitle('');setDescription('');setRegion('');setCategory('Kleidung');
    setCondition('Gut');setTrade('sell');setPrice('');setOrganizationId('');setPhoto([]);
    setQuick(false);setRulesConfirmed(false);setDraftTemplateId(null);setFacts({...EMPTY_FACTS});setProposal(null);setScanNotice('');setConfirmed(false);setExpandFacts(false);setScanned(false);setAskSize(false);
  }
  function chooseMarketDraft(template){
    const draft=applyMarketDraft(template);if(!draft)return;
    const apply=()=>{setDraftTemplateId(template.id);setQuick(false);setTitle('');
      setDescription(draft.description);setCategory(draft.category);
      setFacts({...EMPTY_FACTS});setCondition('Gut');setConfirmed(false);};
    if(title.trim()||description.trim())Alert.alert('Entwurf ersetzen?','Titel und Beschreibung werden ersetzt.',[
      {text:'Weiter bearbeiten',style:'cancel'},{text:'Vorlage verwenden',onPress:apply}
    ]);else apply();
  }
  function beginEdit(x){
    setBoxOpen(false);resetForm();setEditingId(x.id);setOnlyMine(true);setOnlyFavorites(false);
    const decoded=decodeArticleFacts(x.description);
    setQuick(!!decoded);setFacts(decoded?.facts||{...EMPTY_FACTS});setExpandFacts(true);
    setTitle(x.title);setDescription(decoded?decoded.note:x.description||'');setRegion(x.region_label||'');
    setCategory(x.category);setCondition(x.item_condition);setTrade(x.trade_type);
    setPrice(x.trade_type==='sell'?String((x.price_cents/100).toFixed(2)).replace('.',','):'');
    setOrganizationId(x.organization_id||'');setOpen(true);setSelectedListing(null);
  }
  const priceLabel=x=>x.trade_type==='gift'?'Zu verschenken':x.trade_type==='swap'?'Tausch':
    (x.price_cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  const parsePrice=value=>{
    const raw=String(value).trim().replace(',','.');
    return raw!==''&&Number.isFinite(Number(raw))?Math.round(Number(raw)*100):null;
  };
  const minimum=parsePrice(minPrice), maximum=parsePrice(maxPrice);
  // Active buyer filters are executed against the full database, not the 160-item initial feed.
  const serverSearchActive=!onlyMine; // The complete buyer catalog is always paginated on the server.
  const searchIdentity=JSON.stringify([me,query,filter,tradeFilter,minPrice,maxPrice,onlyMine,onlyFavorites,sortBy,favoriteRefresh,marketRefresh,buyerFocus]);
  const previousSearchIdentity=useRef(searchIdentity);
  useEffect(()=>{setSearchPage(0);},[searchIdentity]);
  useEffect(()=>{
    const seq=++searchSeq.current;
    // A changed filter may render once with the previous page number.
    // Wait for page zero instead of sending an incorrect offset request.
    if(previousSearchIdentity.current!==searchIdentity){
      previousSearchIdentity.current=searchIdentity;
      if(searchPage!==0){setRemoteBusy(true);setRemoteListings([]);setRemoteHasMore(false);return;}
    }
    if(!serverSearchActive){
      setRemoteBusy(false);setRemoteError('');setRemoteListings([]);setRemoteHasMore(false);
      return;
    }
    let live=true;
    setRemoteBusy(true);
    setRemoteError('');
    if(searchPage===0){setRemoteListings([]);setRemoteHasMore(false);setRemotePhotoUrls({});setRemoteExtraPhotos([]);setRemoteExtraUrls({});setRemoteOrganizations([]);}
    const timer=setTimeout(async()=>{
      try{
        const {data,error:e}=await retryRead(
          ()=>buyerFocus?supabase.from('ff_market_listings').select('*')
            .eq('id',buyerFocus).eq('moderation_status','approved')
            :supabase.rpc('ff_market_search',{
              p_query:query.trim().slice(0,160),p_category:filter,p_trade_type:tradeFilter,
              p_min_cents:minimum,p_max_cents:maximum,p_favorites_only:onlyFavorites,
              p_sort:sortBy,p_limit:40,p_offset:searchPage*40
            }),
          {isCurrent:()=>live&&seq===searchSeq.current}
        );
        if(e)throw e;
        if(!Array.isArray(data))throw new Error('Ungültige Suchantwort');
        const records=(buyerFocus?data.map(listing=>({listing})):data).map(row=>({...row.listing,match_item:row.match_item||''}))
          .filter(row=>!!row.id&&row.moderation_status==='approved');
        if(!live||seq!==searchSeq.current)return;
        const ids=records.map(row=>row.id);
        const orgIds=[...new Set(records.map(row=>row.organization_id).filter(Boolean))];
        const current=()=>live&&seq===searchSeq.current;
        // Independent reads run together; cancelled searches cannot start signing.
        const [photoQuery,flagQuery,orgQuery]=await Promise.all([
          ids.length?retryRead(()=>supabase.from('ff_market_photos').select('*').in('listing_id',ids).order('slot',{ascending:true}),{isCurrent:current}):{data:[],error:null},
          ids.length?retryRead(()=>supabase.rpc('ff_market_favorite_flags',{p_listing_ids:ids}),{isCurrent:current}):{data:[],error:null},
          orgIds.length?retryRead(()=>supabase.from('ff_organizations').select('*').in('id',orgIds),{isCurrent:current}):{data:[],error:null}
        ]);
        if(!current())return;
        if(photoQuery.error||flagQuery.error||orgQuery.error)throw photoQuery.error||flagQuery.error||orgQuery.error;
        const extras=photoQuery.data||[];
        const flags=new Set((flagQuery.data||[]).map(row=>row.listing_id));
         const signed=await signPhotoPaths(supabase,'ff-market-photos',[
           ...records.map(row=>row.photo_path),...extras.map(row=>row.photo_path),
         ],600);
         const images=records.filter(row=>row.photo_path).map(row=>[row.id,signed[row.photo_path]||null]);
         const extraLinks=extras.map(row=>[row.photo_path,signed[row.photo_path]||null]);
         if(!live||seq!==searchSeq.current)return;
        setFavoriteMap(old=>({...old,...Object.fromEntries(ids.map(id=>[id,flags.has(id)]))}));
         setRemoteOrganizations(old=>searchPage===0?(orgQuery.data||[]):appendUniqueRows(old,orgQuery.data||[]));
         setRemoteListings(old=>searchPage===0?records:[
          ...old,...records.filter(row=>!old.some(existing=>existing.id===row.id))
        ]);
        setRemotePhotoUrls(old=>({...old,...Object.fromEntries(images)}));
        setRemoteExtraPhotos(old=>searchPage===0?extras:[...old,...extras.filter(p=>!old.some(v=>v.photo_path===p.photo_path))]);
        setRemoteExtraUrls(old=>({...old,...Object.fromEntries(extraLinks)}));
        setRemoteHasMore(!buyerFocus&&records.length===40);
        if(buyerFocus&&!records.length)setRemoteError('Dieses Angebot ist nicht mehr verfügbar.');
      }catch(e){
        if(live&&seq===searchSeq.current){
          setRemoteError('Die Suche ist gerade nicht erreichbar. Bitte erneut versuchen.');
          if(searchPage===0)setRemoteListings([]);
        }
      }finally{
        if(live&&seq===searchSeq.current)setRemoteBusy(false);
      }
    },searchPage===0?320:0);
    return ()=>{live=false;clearTimeout(timer);};
  },[serverSearchActive,query,filter,tradeFilter,minimum,maximum,onlyFavorites,sortBy,searchPage,favoriteRefresh,marketRefresh,me,buyerFocus,searchRetry,searchIdentity]);
  const filtered=serverSearchActive?remoteListings.filter(x=>!blocked(x.seller_id)):
    listings.filter(x=>
      ((onlyMine&&x.seller_id===me)||(!onlyMine&&x.moderation_status==='approved'&&(!onlyFavorites||favoriteIds.has(x.id))))
      && !blocked(x.seller_id)
      && (filter==='Alle'||x.category===filter)
      && (tradeFilter==='all'||x.trade_type===tradeFilter)
      && (minimum===null||(x.trade_type==='sell'&&x.price_cents>=minimum))
      && (maximum===null||(x.trade_type==='sell'&&x.price_cents<=maximum))
      && normalizeLabel([x.title,x.description,x.region_label,x.category].join(' ')).includes(normalizeLabel(query))
    );
  const shown=serverSearchActive?filtered:[...filtered].sort((a,b)=>{
    if(sortBy==='low')return (a.price_cents-b.price_cents)||new Date(b.created_at)-new Date(a.created_at);
    if(sortBy==='high')return (b.price_cents-a.price_cents)||new Date(b.created_at)-new Date(a.created_at);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  async function pick(fn,max=5){
    if(choosing||max<1)return;
    setChoosing(true);
    try{
      const assets=await selectMarketPhotos(max);
      if(assets.length)await fn(assets);
    }catch(e){Alert.alert('Fotoauswahl',humanError(e));}
    finally{setChoosing(false);}
  }
  function startQuick(){
    setBoxOpen(false);resetForm();setQuick(true);setCondition('');setOpen(true);setSelectedListing(null);
  }
  function showBox(){
    setOpen(false);setSelectedListing(null);setBoxAdvanced(false);setBoxShowAll(false);
    setBoxStep(boxDrafts.length?'review':'photo');setBoxOpen(true);
  }
  async function clearBox(){
    setChoosing(true);
    try{
      await deleteBoxStorage(me);
      setBoxPhoto(null);setBoxDrafts([]);setBoxNotice('');setBoxScanned(false);
      setBoxOverflow(false);setBoxEditor(null);setBoxPackageDraft(null);setBoxBatches([]);setBoxCurrentBatch(null);setBoxSelected(null);setBoxFilter('all');setBoxStep('photo');setBoxAdvanced(false);
      setBoxRegion('');setBoxInspect(null);setBoxBulkSize('');setBoxQuality([]);setBoxCrop(null);setBoxStorage('ready');setBoxSaveError(false);setBoxPending(null);
    }catch(e){setBoxNotice('Kiste konnte nicht vollständig gelöscht werden: '+humanError(e));}
    finally{setChoosing(false);}
  }
  function confirmClearBox(){
    Alert.alert('Gespeicherte Kiste löschen?','Alle noch nicht eingereichten Entwürfe und zugehörigen lokalen Fotos werden gelöscht.',[
      {text:'Abbrechen',style:'cancel'},{text:'Kiste löschen',style:'destructive',onPress:clearBox}
    ]);
  }
  function closeBox(){setBoxCrop(null);setBoxOpen(false);}
  async function recoverBoxSubmission(){
    if(!boxPending||scanBusy||busy||choosing)return;
    setScanBusy(true);
    try{
      const {data,error:e}=await supabase.from('ff_market_listings').select('id').eq('id',boxPending.listingId).eq('seller_id',me).maybeSingle();
      if(e)throw e;
      if(data?.id===boxPending.listingId){
        const saved=boxSnapshot(null);saved.drafts=saved.drafts.filter(d=>!boxPending.ids.includes(d.id));saved.bundle=null;saved.selection=null;
        await saveBoxSnapshot(me,saved);
        setBoxDrafts(saved.drafts);setBoxPackageDraft(null);setBoxSelected(null);setBoxPending(null);
        setBoxNotice('Die Anzeige wurde bereits gespeichert. Prüfe den Veröffentlichungsstatus unter „Meine“.');
      }else{
        const draft=boxPending.isPackage?boxPackageDraft:boxDrafts.find(d=>d.id===boxPending.ids[0]);
        if(!draft||draft.listingId!==boxPending.listingId)throw new Error('Der zugehörige Entwurf konnte nicht wiederhergestellt werden. Bitte prüfe „Meine“ und lösche die Kiste erst, wenn du sicher bist.');
        openBoxEditor(draft,boxPending.isPackage?boxPending.ids:null);
      }
    }catch(e){setBoxNotice('Einreichung konnte nicht abgeglichen werden: '+humanError(e));}
    finally{setScanBusy(false);}
  }
  const canCaptureBox=boxStorage==='ready'&&boxBatches.length<BOX_MAX_BATCHES&&boxDrafts.length<BOX_MAX_ITEMS;
  async function chooseBoxPhoto(asset){
    if(!asset?.uri||!canCaptureBox)return;
    if(asset.assetId&&boxBatches.some(b=>b.photo?.sourceAssetId===asset.assetId)){setBoxNotice('Dieses Galeriefoto wurde bereits als Fotogruppe erfasst. Wähle ein anderes Bild, damit die Teile nicht doppelt gezählt werden.');return;}
    const kept=await keepBoxPhoto(me,asset);
    setBoxCrop(null);setBoxQuality([]);setBoxPhoto(kept);setBoxCurrentBatch(null);setBoxNotice('');setBoxScanned(false);setBoxOverflow(false);setBoxStep('photo');
  }
  function viewBatch(batch){
    if(!batch.photo)return;
    setBoxCrop(null);setBoxQuality(photoIssues(batch.quality));setBoxPhoto(batch.photo);setBoxCurrentBatch(batch.id);setBoxScanned(true);setBoxOverflow(!batch.reusable);
  }
  function discardCurrentBatch(){
    const batch=boxBatches.find(b=>b.id===boxCurrentBatch);
    if(!batch||!batch.ids.every(id=>boxDrafts.some(d=>d.id===id)))return Alert.alert('Fotogruppe nicht erneut erfassen','Mindestens ein Teil ist nicht mehr in der Kiste. Fotografiere nur die noch verfügbaren Artikel separat, um Doppelanzeigen zu vermeiden.');
    Alert.alert('Diese Fotogruppe neu erfassen?','Nur die '+batch.ids.length+' Entwürfe dieser Gruppe und ihre Bearbeitungsstände werden verworfen. Andere Fotogruppen bleiben erhalten.',[
      {text:'Abbrechen',style:'cancel'},
      {text:'Gruppe verwerfen',style:'destructive',onPress:()=>{
        setBoxDrafts(old=>old.filter(d=>!batch.ids.includes(d.id)));
        setBoxBatches(old=>old.filter(b=>b.id!==batch.id));setBoxSelected(null);setBoxPackageDraft(null);
        setBoxCrop(null);setBoxInspect(null);setBoxPhoto(null);setBoxCurrentBatch(null);setBoxScanned(false);setBoxQuality([]);setBoxOverflow(false);
        setBoxNotice('Fotogruppe verworfen. Fotografiere die noch verfügbaren Teile erneut, diesmal einzeln nebeneinander.');setBoxStep('photo');
      }}
    ]);
  }
  async function takeBoxPhoto(){
    if(choosing||scanBusy||busy||!canCaptureBox)return;
    setChoosing(true);
    try{
      const permission=await ImagePicker.requestCameraPermissionsAsync();
      if(!permission.granted){setBoxNotice('Bitte erlaube den Kamerazugriff oder wähle ein Bild aus der Galerie.');return;}
      const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.8,exif:false});
      if(!result.canceled&&result.assets?.length)await chooseBoxPhoto(result.assets[0]);
    }catch(e){setBoxNotice(humanError(e));}
    finally{setChoosing(false);}
  }
  async function recognizeBox(){
    if(scanBusy||busy||choosing||!active||!boxPhoto||boxScanned||!canCaptureBox)return;
    setScanBusy(true);setBoxNotice('');
    try{
      const result=await scanMarketPhotos([boxPhoto],'box');
      const quality=photoIssues(result?.qualityIssues);setBoxQuality(quality);
      if(result?.status!=='ok'||!Array.isArray(result.items)||!result.items.length){
        setBoxNotice(result?.status==='unsuitable'?'Bitte verwende ein reines Foto der ausgelegten Artikel ohne Personen oder private Dokumente.':'Keine Artikel eindeutig erkannt. Du kannst einzelne Entwürfe auch manuell hinzufügen.');return;
      }
      const batchId='batch-'+boxSeq;
      const drafts=result.items.slice(0,Math.min(10,BOX_MAX_ITEMS-boxDrafts.length)).filter(x=>typeof x?.title==='string'&&MARKET_CATEGORIES.includes(x.category)).map((x,i)=>({
        id:'scan-'+boxSeq+'-'+i,batchId,listingId:listingDraftId(),title:safeString(x.title,100),category:x.category,position:safeString(x.position,50),
        facts:{...EMPTY_FACTS,...Object.fromEntries(FACT_KEYS.map(([k,,max])=>[k,safeString(x[k],max)])),detail:compactBoxDetail(x)},
        garmentType:safeString(x.garmentType,40),shape:safeString(x.shape,60),pattern:safeString(x.pattern,40),features:safeString(x.features,80),material:safeString(x.material,50),
        sizeEvidence:x.sizeEvidence==='label'?'label':'unknown',relativeSize:safeString(x.relativeSize,95),uncertainty:safeString(x.uncertainty,90),x:x.x,y:x.y,bounds:cropBounds(x.bounds),visibility:['isolated','overlapping','cutoff','unclear'].includes(x.visibility)?x.visibility:'unclear',
        confirmed:false,photos:[],condition:'',trade:'sell',price:'',description:'',region:boxRegion,organizationId:''
      }));
      if(!drafts.length){setBoxNotice('Keine weiteren Artikel erkannt.');return;}
      const incomplete=!!result.overflow||drafts.length!==result.items.length||quality.includes("cutoff");
      setBoxDrafts(old=>[...old,...drafts]);setBoxSeq(n=>n+1);setBoxScanned(true);setBoxOverflow(incomplete);
      setBoxBatches(old=>[...old,{id:batchId,photo:boxPhoto,ids:drafts.map(d=>d.id),reusable:!incomplete,quality}]);
      setBoxCurrentBatch(batchId);setBoxPackageDraft(null);setBoxStep('review');setBoxAdvanced(false);setBoxShowAll(false);
      setBoxNotice(incomplete?'Nicht alle Teile dieser Aufnahme wurden erfasst. Bitte prüfe die Liste und verwende ein passendes Paketfoto.':'Neue Fotogruppe hinzugefügt. Bitte gleiche Artikel ab und fotografiere in der nächsten Gruppe nur andere Teile.');
    }catch(e){setBoxNotice(humanError(e));}finally{setScanBusy(false);}
  }
  function openBoxCrop(d){
    const source=boxBatches.find(b=>b.id===d.batchId)?.photo;
    if(!source)return Alert.alert('Gruppenfoto fehlt','Bitte ergänze ein eigenes Artikelfoto.');
    const bounds=suggestedCrop(d);
    if(!bounds)return Alert.alert('Kein sicherer Ausschnitt vorgeschlagen','Das Stück ist möglicherweise verdeckt, abgeschnitten oder nicht klar abgrenzbar. Bitte fotografiere es einzeln.');
    if((d.photos||[]).length>=5)return Alert.alert('Maximal fünf Fotos','Entferne zuerst ein Foto im Einzelentwurf.');
    setBoxCropFrame({width:0,height:0});setBoxCrop({id:d.id,bounds,preview:null});
    setBoxInspect(d.id);setBoxFilter('all');
  }
  function adjustBoxCrop(edge,delta){
    setBoxCrop(old=>old?{...old,bounds:changeCrop(old.bounds,edge,delta)||old.bounds,preview:null}:old);
  }
  async function previewBoxCrop(){
    if(!boxCrop||!cropSource||cropBusy)return;
    const rect=pixelCrop(boxCrop.bounds,cropSource.width,cropSource.height);
    if(!rect)return Alert.alert('Ausschnitt zu klein','Bitte vergrößere den Bildbereich oder fotografiere den Artikel einzeln.');
    setScanBusy(true);
    try{
      const image=await makeBoxCrop(me,cropSource,rect);
      setBoxCrop(old=>old&&old.id===boxCrop.id?{...old,preview:image}:old);
    }catch(e){Alert.alert('Bildausschnitt',humanError(e));}
    finally{setScanBusy(false);}
  }
  async function acceptBoxCrop(){
    if(!boxCrop?.preview||!cropDraft||cropBusy||(cropDraft.photos||[]).length>=5)return;
    setScanBusy(true);
    try{
      const asset=await keepBoxPhoto(me,boxCrop.preview);
      updateBoxDraft(cropDraft.id,{photos:[asset,...(cropDraft.photos||[])].slice(0,5)});
      setBoxCrop(null);setBoxNotice('Einzelbild gespeichert. Du kannst es beim Einstellen des Artikels nochmals prüfen.');
    }catch(e){Alert.alert('Foto speichern',humanError(e));}
    finally{setScanBusy(false);}
  }
  function updateBoxDraft(id,changes,factChanges=null){
    setBoxDrafts(old=>old.map(d=>d.id===id?{...d,...changes,facts:{...d.facts,...(factChanges||{})}}:d));
    setBoxPackageDraft(null);
  }
  function applyBoxSize(){
    const val=boxBulkSize.trim();
    if(!val)return;
    const count=boxDrafts.filter(d=>d.category==='Kleidung'&&!d.facts.size).length;
    if(!count)return;
    Alert.alert('Größe '+val+' übernehmen?','Nur '+count+' Kleidungsstücke ohne Größenangabe werden ergänzt. Bitte bestätige das nur, wenn du diese Größe für alle betreffenden Stücke selbst geprüft hast.',[
      {text:'Abbrechen',style:'cancel'},{text:'Geprüft, übernehmen',onPress:()=>{
        setBoxDrafts(old=>old.map(d=>d.category==='Kleidung'&&!d.facts.size?{...d,sizeEvidence:'seller',facts:{...d.facts,size:val}}:d));setBoxPackageDraft(null);
      }}
    ]);
  }
  async function readBoxLabel(d,asset){
    if(scanBusy||busy||!active)return;
    setScanBusy(true);setBoxNotice('');
    try{
      const result=await scanMarketPhotos([asset],'box_label');
      if(result?.status!=='ok'){setBoxNotice('Das Etikett konnte nicht eindeutig gelesen werden. Bitte fotografiere es nah, gerade und ohne Unschärfe.');return;}
      const lines=[result.size&&'Größe: '+result.size,result.brand&&'Marke: '+result.brand,result.material&&'Material: '+result.material].filter(Boolean).join('\n');
      Alert.alert('Etikett: '+(d.title||'Artikel'),lines+'\n\nStimmen die Angaben und gehört das Etikett zu diesem Artikel?',[
        {text:'Verwerfen',style:'cancel'},
        {text:'Übernehmen',onPress:()=>{
          const detail=result.material?('Material: '+result.material+' · '+d.facts.detail).slice(0,100):d.facts.detail;
          updateBoxDraft(d.id,{sizeEvidence:result.size?'label':d.sizeEvidence,material:result.material||d.material||''},{
            ...(result.size?{size:result.size}:{}),...(result.brand?{brand:result.brand}:{}),detail
          });
        }}
      ]);
    }catch(e){setBoxNotice(humanError(e));}
    finally{setScanBusy(false);}
  }
  async function photographBoxLabel(d){
    if(scanBusy||choosing||busy||!active)return;
    setChoosing(true);
    try{
      const permission=await ImagePicker.requestCameraPermissionsAsync();
      if(!permission.granted){setBoxNotice('Bitte erlaube den Kamerazugriff oder wähle ein Etikettfoto aus.');return;}
      const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.9,exif:false});
      if(!result.canceled&&result.assets?.length)await readBoxLabel(d,result.assets[0]);
    }catch(e){setBoxNotice(humanError(e));}finally{setChoosing(false);}
  }
  function addBoxDraft(){
    if(boxDrafts.length>=BOX_MAX_ITEMS)return;
    setBoxDrafts(old=>[...old,{id:'manual-'+boxSeq,listingId:listingDraftId(),title:'',category:'Kleidung',position:'Manuell ergänzt',facts:{...EMPTY_FACTS},
      photos:[],condition:'',trade:'sell',price:'',description:'',region:boxRegion,organizationId:''}]);
    setBoxSeq(n=>n+1);setBoxPackageDraft(null);
  }
  function removeBoxDraft(id){
    if(boxCrop?.id===id)setBoxCrop(null);
    setBoxDrafts(old=>old.filter(d=>d.id!==id));setBoxPackageDraft(null);
  }
  function openBoxEditor(d,packageIds=null){
    setBoxCrop(null);resetForm();setBoxFormExtras(false);setBoxOpen(false);setOpen(true);setQuick(true);setBoxEditor({id:d.id,packageIds,listingId:d.listingId||listingDraftId()});
    setTitle(d.title||'');setCategory(d.category||'Kleidung');setFacts({...EMPTY_FACTS,...d.facts});
    setCondition(d.condition||'');setTrade(d.trade||'sell');setPrice(d.price||'');
    setPhoto(d.photos||[]);setDescription(d.description||'');setRegion(d.region||boxRegion);
    setOrganizationId(d.organizationId||'');setExpandFacts(true);setConfirmed(false);
  }
  function toggleBoxSelection(id){
    const next=selectedBoxIds.includes(id)?selectedBoxIds.filter(x=>x!==id):[...selectedBoxIds,id];
    if(next.length>BOX_MAX_PACKAGE)return Alert.alert('Paket voll','Eine Anzeige enthält bis zu zehn Teile. Die übrigen Teile bleiben für weitere Pakete in der Kiste.');
    setBoxSelected(next);
  }
  function openBoxPackage(preferredIds=null){
    const ids=Array.isArray(preferredIds)?preferredIds:selectedBoxIds;
    const items=boxDrafts.filter(d=>ids.includes(d.id));
    if(items.length<2||items.length>BOX_MAX_PACKAGE)return;
    setBoxSelected(ids);
    if(boxPackageDraft&&sameBoxSelection(boxPackageDraft.packageIds,ids)){openBoxEditor(boxPackageDraft,ids);return;}
    if(items.some(d=>d.title.trim().length<4))return Alert.alert('Artikel benennen','Bitte gib allen ausgewählten Artikeln einen kurzen Namen.');
    const summary=summarizeBox(items);
    const launch=()=>openBoxEditor({id:'package',listingId:listingDraftId(),title:summary.title,category:summary.category,
      facts:{...EMPTY_FACTS,size:summary.commonSize,detail:summary.detail},description:packageNote(summary.rows),
      photos:matchingBatchPhotos(items,boxBatches),region:boxRegion},ids);
    // Unbekannte Größen bleiben ausdrücklich offen – kein unnötiges Bestätigungsfenster.
    // Die überprüfbare Paketliste ist im nächsten Schritt weiterhin vollständig sichtbar.
    launch();
  }
  function saveBoxEditor(){
    if(!boxEditor)return;
    const draft={id:boxEditor.id,listingId:boxEditor.listingId,packageIds:boxEditor.packageIds,title,category,facts:{...facts},photos:[...photo],condition,trade,price,description,region,organizationId};
    if(boxEditor.packageIds)setBoxPackageDraft(draft);
    else {setBoxDrafts(old=>old.map(d=>d.id===draft.id?{...d,...draft,sizeEvidence:draft.facts.size!==d.facts.size?'seller':d.sizeEvidence}:d));setBoxPackageDraft(null);}
    if(region.trim())setBoxRegion(region.trim());
    resetForm();setOpen(false);setBoxOpen(true);setBoxStep('package');
  }
  function changeFact(key,value){setFacts(prev=>({...prev,[key]:value,...(key==='defect'&&value!=='Vorhanden'?{defectText:''}:{})}));setConfirmed(false);}
  async function takeArticlePhoto(){
    if(choosing||scanBusy||busy||existingPhotoCount+photo.length>=5)return;
    setChoosing(true);
    try{
      const permission=await ImagePicker.requestCameraPermissionsAsync();
      if(!permission.granted){setScanNotice('Bitte erlaube den Kamerazugriff in den Geräteeinstellungen oder wähle ein Foto aus der Galerie.');return;}
      const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:0.8,exif:false});
      if(!result.canceled&&result.assets?.length){
        const asset=boxEditor?await keepBoxPhoto(me,result.assets[0]):result.assets[0];
        setPhoto(old=>[...old,asset].slice(0,5-existingPhotoCount));setProposal(null);setConfirmed(false);
      }
    }catch(e){setScanNotice(humanError(e));}
    finally{setChoosing(false);}
  }
  async function recognize(){
    if(scanBusy||busy||!active||!photo.length)return;
    setScanBusy(true);setProposal(null);setScanNotice('');
    try{
      const result=await scanMarketPhotos(photo);
      if(result?.status==='ok')setProposal(result);
      else if(result?.status==='multiple')setScanNotice('Auf den Bildern sind offenbar mehrere Artikel. Bitte zeige nur einen Artikel und seine Details, oder erstelle die Anzeige selbst.');
      else if(result?.status==='unsuitable')setScanNotice('Diese Bilder eignen sich nicht für die automatische Artikelerkennung. Bitte nutze geeignete reine Artikelfotos.');
      else setScanNotice('Der Artikel konnte nicht eindeutig erkannt werden. Du kannst die Angaben selbst eingeben.');
    }catch(e){setScanNotice(humanError(e));}
    finally{setScanBusy(false);}
  }
  function useProposal(){
    if(!proposal)return;
    setTitle(proposal.title);setCategory(proposal.category);
    setFacts(prev=>({...prev,...Object.fromEntries(FACT_KEYS.map(([key])=>[key,proposal[key]||prev[key]||'']))}));
    setAskSize(!proposal.size&&!facts.size);setProposal(null);setScanned(true);setExpandFacts(false);setScanNotice('Vorschläge übernommen. Bitte prüfe alle Angaben und ergänze, was fehlt.');setConfirmed(false);
  }
  async function submit(){
    if(!active||scanBusy||busy||submitLock.current)return;
    if(!rulesConfirmed)return Alert.alert('Bitte kurz bestätigen','Bestätige die Regeln für sichere und wahrheitsgemäße Anzeigen.');
    if(hasTemplatePlaceholders(title)||hasTemplatePlaceholders(description))
      return Alert.alert('Vorlage vervollständigen','Ersetze alle Felder mit [ergänzen] oder entferne die nicht benötigten Zeilen.');
    if(boxEditor?.packageIds&&(!packageForm||packageForm.rows.length!==boxEditor.packageIds.length))return Alert.alert('Paket prüfen','Bitte kehre zur Kiste zurück und erstelle die Paketliste erneut.');
    if(boxEditor&&!photo.length)return Alert.alert('Artikelfoto fehlt',boxEditor.packageIds?'Bitte füge ein Foto des vollständigen Pakets hinzu.':'Bitte füge ein eigenes Foto dieses einzelnen Artikels hinzu.');
    if(!['Neu','Sehr gut','Gut','Gebraucht'].includes(condition))return Alert.alert('Zustand wählen','Wie ist der tatsächliche Zustand des Artikels?');
    if(quick&&!DEFECTS.includes(facts.defect))return Alert.alert('Mängel angeben','Bitte wähle, ob Mängel bekannt sind.');
    if(quick&&facts.defect==='Vorhanden'&&!facts.defectText.trim())return Alert.alert('Mängel beschreiben','Bitte beschreibe kurz die bekannten Mängel.');
    if(quick&&!confirmed)return Alert.alert('Angaben bestätigen','Bitte überprüfe den Steckbrief vor dem Einreichen.');
    if(title.trim().length<4||title.trim().length>100)return Alert.alert('Titel prüfen','Bitte mindestens 4 Zeichen eingeben.');
    const cents=parsePrice(price);
    if(trade==='sell'&&(cents===null||cents<0||cents>10000000))
      return Alert.alert('Preis prüfen','Bitte einen Preis in Euro zwischen 0 und 100.000 angeben.');
    const values={title:safeString(title,100),description:quick?encodeArticleFacts(facts,description):safeString(description,1500),
      category,item_condition:condition,trade_type:trade,price_cents:trade==='sell'?cents:0,
      region_label:safeString(region,80),organization_id:organizationId||null};
    submitLock.current=true;
    const submittedSnapshot=boxEditor?boxSnapshot({listingId:boxEditor.listingId,ids:boxEditor.packageIds||[boxEditor.id],isPackage:!!boxEditor.packageIds}):null;
    try{
    if(boxEditor){
      if(boxStorage!=='ready')return Alert.alert('Kiste nicht gespeichert','Bitte stelle zuerst die lokale Speicherung wieder her.');
      setScanBusy(true);
      try{await saveBoxSnapshot(me,submittedSnapshot);setBoxPending(submittedSnapshot.pending);}
      catch{return Alert.alert('Kiste nicht gespeichert','Bitte prüfe den Gerätespeicher und versuche es erneut.');}
    }
    const ok=editingId?await editListing(editingId,values,photo):await createListing(values,photo,boxEditor?.listingId);
    if(ok){
      const submitted=boxEditor;
      if(submitted){
        const ids=submitted.packageIds||[submitted.id];
        const saved={...submittedSnapshot,drafts:submittedSnapshot.drafts.filter(d=>!ids.includes(d.id)),bundle:null,selection:null,pending:null};
        // Persist the consumed IDs even if the screen was unmounted during the request.
        try{await saveBoxSnapshot(me,saved);}catch{/* The pending ID lets recovery reconcile the listing on return. */}
        setBoxDrafts(saved.drafts);
        setBoxSelected(null);setBoxPackageDraft(null);setBoxPending(null);
        if(region.trim())setBoxRegion(region.trim());
        setBoxNotice('Zur Prüfung eingereicht. Weitere Entwürfe kannst du jetzt bearbeiten.');setBoxStep('package');
      }
      resetForm();setOpen(false);setOnlyMine(true);setOnlyFavorites(false);setSelectedListing(null);
      if(submitted)setBoxOpen(true);
    }else if(boxEditor){
      saveBoxEditor();setBoxNotice('Einreichung unterbrochen. Wir prüfen beim Fortsetzen die bereits verwendete Anzeigen-ID.');
    }
    }finally{submitLock.current=false;if(boxEditor)setScanBusy(false);}
  }
  function sellerInformation(x){
    const own=x.seller_id===me;
    const org=allMarketOrganizations.find(o=>o.id===x.organization_id&&o.status==='approved');
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
  const selectedFacts=selected?decodeArticleFacts(selected.description):null;
  const selectedPackage=selectedFacts?parsePackageNote(selectedFacts.note):null;
  const gallery=selected?galleryOf(selected):[];
  const shownImage=gallery[Math.min(galleryIndex,Math.max(0,gallery.length-1))]?.uri;
  const imageDescription=selected?marketPhotoAlt(selected,selectedFacts,selectedPackage,galleryIndex,gallery.length):'';
  return <ScrollView ref={marketScrollRef} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    {!inMarketSubpage?<>
    <View style={[styles.marketHero,{padding:14,marginBottom:10}]}>
      <View style={{flex:1}}>
        
        <Text accessibilityRole="header" style={styles.marketHeroTitle}>Familienbasar</Text>
        <Text style={styles.marketHeroText}>Kaufen, tauschen und verschenken.</Text>
      </View>
      <View style={styles.marketHeroIcon}><FamilyIcon name="bag" size={30}/></View>
    </View>
    <View style={styles.marketTopActions}>
      <View style={{flex:1}}>
        <Text style={styles.marketTopTitle}>Etwas weitergeben?</Text>
      </View>
      <Button title={boxEditor?'‹ Zur Kiste':boxOpen?'Schließen':open?'Schließen':sellChoicesOpen?'Auswahl schließen':'＋ Inserieren'} small disabled={!active||scanBusy||busy||choosing} onPress={()=>{if(boxEditor){saveBoxEditor();}else if(boxOpen){closeBox();}else if(open){navigationBackRef.current?.();}else{setSellChoicesOpen(v=>!v);}}}/>
    </View>
    </>:null}
    {sellChoicesOpen&&!open&&!boxOpen&&active?<Card style={{marginBottom:13,backgroundColor:C.sunPale}}>
      <Text style={styles.sectionTitle}>Was möchtest du anbieten?</Text>
      <Text style={[styles.body,{marginBottom:12}]}>Wähle den passenden Weg: einen Artikel einzeln einstellen oder mehrere Kleidungsstücke gemeinsam fotografieren.</Text>
      <Button title="Einzelnen Artikel einstellen" onPress={()=>{setSellChoicesOpen(false);startQuick();}}/>
    </Card>:null}
    {sellChoicesOpen&&!open&&!boxOpen&&active?<Card style={{marginBottom:15,backgroundColor:'#FFF4DA'}}>
      <Text style={styles.sectionTitle}>Mehrere Kleidungsstücke erfassen</Text>
      <Text style={[styles.micro,{marginBottom:10}]}>Viele Sachen auf einmal erfassen. Ein Foto, mehrere Entwürfe – einzeln oder im Paket.</Text>
      <Button title={boxDrafts.length?'Kiste weiterbearbeiten ('+boxDrafts.length+')':'✦ Kiste erfassen'} disabled={busy||choosing||scanBusy||boxStorage==='loading'} onPress={()=>{setSellChoicesOpen(false);showBox();}}/>
    </Card>:null}
    {!inMarketSubpage?<>
    <Pressable accessibilityRole="button" accessibilityLabel="Informationen zu Gebühren und Datenschutz"
      accessibilityState={{expanded:showMarketTrust}} onPress={()=>setShowMarketTrust(v=>!v)}
      style={styles.marketTrust}>
      <FamilyIcon name="shield" size={18}/><Text style={styles.marketTrustText}>Geprüfte Familien · Gebühren transparent · Keine Onlinezahlung</Text>
      <FamilyIcon name={showMarketTrust?'chevron-up':'chevron-down'} size={16}/>
    </Pressable>
    {showMarketTrust?<Info>{SECTION_MESSAGES.market}</Info>:null}
    {!active?<Info warning>Inserieren und Kontakt aufnehmen können nur freigegebene erwachsene Mitglieder.</Info>:null}
    <View style={{flexDirection:'row',gap:7,marginBottom:16}}>
      <View style={{flex:1}}><Button title="Stöbern" mode={!onlyMine&&!onlyFavorites?'primary':'outline'} small
        onPress={()=>{setBuyerFocus(null);setOnlyMine(false);setOnlyFavorites(false);setSelectedListing(null);setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/></View>
      <View style={{flex:1}}><Button title={'Meine ('+listings.filter(x=>x.seller_id===me).length+(ownHasMore?'+':'')+')'}
        mode={onlyMine?'primary':'outline'} small
        onPress={()=>{setBuyerFocus(null);setOnlyMine(true);setOnlyFavorites(false);setSelectedListing(null);setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/></View>
      <View style={{flex:1}}><Button title="♡ Merkliste"
        mode={onlyFavorites?'primary':'outline'} small
        onPress={()=>{setBuyerFocus(null);setOnlyFavorites(true);setOnlyMine(false);setSelectedListing(null);setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/></View>
    </View>
    </>:null}
    {onlyFavorites&&!inMarketSubpage?<PriceAlertPreference key={me} userId={me} active={active}/>:null}
    {boxOpen&&boxPending?<Card style={{marginBottom:18,backgroundColor:'#FFF4DA'}}>
      <Text style={styles.sectionTitle}>Unterbrochene Einreichung</Text>
      <Text style={[styles.body,{marginBottom:12}]}>Wir prüfen zuerst, ob deine Anzeige bereits beim Server angekommen ist. So werden dieselben Artikel nicht versehentlich zweimal eingestellt.</Text>
      {boxNotice?<Info>{boxNotice}</Info>:null}
      <Button title={scanBusy?'Wird abgeglichen …':'Einreichung prüfen & fortsetzen'} disabled={scanBusy||busy||choosing||boxStorage!=='ready'} onPress={recoverBoxSubmission}/>
      <Button title="Kiste schließen" mode="outline" small disabled={scanBusy||busy||choosing} onPress={closeBox}/>
    </Card>:null}
    {boxOpen&&!boxPending?<Card style={{marginBottom:18}}>
      <Text style={styles.sectionTitle}>{boxStep==='photo'?'1 · Kleidung fotografieren':boxStep==='review'?'2 · Kleidung prüfen':'3 · Paket auswählen'}</Text>
      <Text style={[styles.micro,{marginBottom:12}]}>Foto › Prüfen › Paket · {boxDrafts.length} Teile erfasst</Text>
      {boxNotice?<Info>{boxNotice}</Info>:null}
      {boxStep==='photo'?<>
      <Text style={[styles.sub,{marginBottom:12}]}>Lege bis zu zehn unterschiedliche Kleidungsstücke nebeneinander und fotografiere sie von oben. Weitere Gruppen kannst du später ergänzen.</Text>
      {boxPhoto?<View onLayout={e=>setBoxImageFrame(e.nativeEvent.layout)} style={{width:'100%',height:300,borderRadius:14,marginBottom:10,overflow:'hidden',backgroundColor:C.bg}}>
        <Image accessibilityLabel="Kistenfoto. Die einzelnen erkannten Artikel sind auch unten als Textliste auswählbar." source={{uri:boxPhoto.uri}} style={{width:'100%',height:'100%'}} resizeMode="contain"/>
        {boxImageFrame.width>0&&boxImageFrame.height>0&&boxPhoto.width>0&&boxPhoto.height>0&&boxCurrentBatch?boxDrafts.map((d,i)=>{
          if(d.batchId!==boxCurrentBatch)return null;
          if(typeof d.x!=='number'||typeof d.y!=='number'||d.x<0||d.x>100||d.y<0||d.y>100)return null;
          const scale=Math.min(boxImageFrame.width/boxPhoto.width,boxImageFrame.height/boxPhoto.height);
          const w=boxPhoto.width*scale,h=boxPhoto.height*scale;
          const left=Math.max(0,Math.min(boxImageFrame.width-44,(boxImageFrame.width-w)/2+w*d.x/100-22));
          const top=Math.max(0,Math.min(boxImageFrame.height-44,(boxImageFrame.height-h)/2+h*d.y/100-22));
          return <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={'Ungefähre Position Artikel '+(i+1)} onPress={()=>{setBoxFilter('all');setBoxInspect(d.id);}} style={{position:'absolute',left,top,width:44,height:44,borderRadius:22,backgroundColor:boxInspect===d.id?C.coralDeep:C.accent,borderColor:C.white,borderWidth:2,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:12,fontWeight:'900',color:C.white}}>{i+1}</Text></Pressable>;
        }):null}
      </View>:null}
      {boxDrafts.length&&boxPhoto?<Text style={[styles.micro,{marginBottom:8}]}>Markierungen aus früheren Fotoanalysen bitte mit den tatsächlichen Artikeln abgleichen.</Text>:null}
      <Text style={[styles.micro,{marginBottom:8,color:boxSaveError||boxStorage==='error'?C.warningText:C.accentDark}]}>{boxStorage==='loading'?'Kiste wird geladen …':boxStorage==='error'?'Gespeicherte Kiste nicht lesbar':boxSaveError?'Speichern fehlgeschlagen – bitte Gerätespeicher prüfen':'Entwürfe werden auf diesem Gerät gespeichert.'}</Text>
      {boxBatches.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingBottom:10}}>
        {boxBatches.map((batch,i)=><Pressable key={batch.id} accessibilityRole="button" accessibilityLabel={'Fotogruppe '+(i+1)} onPress={()=>viewBatch(batch)} disabled={busy||scanBusy||choosing||!batch.photo} style={{borderWidth:2,borderColor:boxCurrentBatch===batch.id?C.accent:C.line,borderRadius:12,padding:5}}>
          {batch.photo?<Image accessible={false} source={{uri:batch.photo.uri}} style={{width:76,height:60,borderRadius:7}} resizeMode="cover"/>:null}
          <Text style={styles.micro}>Gruppe {i+1}</Text>
        </Pressable>)}
      </ScrollView>:null}
      <Button title={boxScanned?'＋ Neue Fotogruppe auswählen':boxPhoto?'Übersichtsbild ändern':'＋ Übersichtsbild auswählen'} disabled={busy||choosing||scanBusy||!canCaptureBox} mode="outline" onPress={()=>pick(assets=>chooseBoxPhoto(assets[0]),1)}/>
      <Button title="＋ Neue Fotogruppe fotografieren" disabled={busy||choosing||scanBusy||!canCaptureBox} mode="ghost" small onPress={takeBoxPhoto}/>
      <Text style={[styles.micro,{marginVertical:8}]}>Automatische Fotoerkennung ist vorerst deaktiviert. Du kannst Kleidungsstücke kostenlos manuell als Entwürfe erfassen und zu Paketen zusammenstellen. Entwürfe bleiben lokal auf deinem Gerät.</Text>
      <Button title="＋ Artikel manuell erfassen" mode="outline"
        disabled={boxDrafts.length>=BOX_MAX_ITEMS||busy||scanBusy||choosing||boxStorage!=='ready'}
        onPress={()=>{addBoxDraft();setBoxStep('review');setBoxAdvanced(true);}}/>
      {boxQuality.length?<View style={{backgroundColor:C.warning,borderRadius:12,padding:12,marginVertical:8}}>
        <Text style={[styles.label,{color:C.warningText}]}>Hinweise zur Fotoqualität</Text>
        {boxQuality.map(issue=><Text key={issue} style={[styles.micro,{color:C.warningText,marginBottom:5}]}>• {PHOTO_ISSUES[issue]}</Text>)}
        <Text style={styles.micro}>Bitte alle Artikelmerkmale selbst prüfen.</Text>
      </View>:null}
      {boxOverflow?<Text style={[styles.micro,{marginVertical:8,color:C.warningText}]}>Diese Fotogruppe ist nicht vollständig erfasst. Für Teilpakete passende neue Verkaufsfotos verwenden.</Text>:null}
      {boxCurrentBatch&&(boxQuality.length>0||boxOverflow)?<Button title="Diese Fotogruppe neu erfassen" mode="outline" small disabled={cropBusy} onPress={discardCurrentBatch}/>:null}
      {boxDrafts.length>0?<Button title={'Weiter: '+boxDrafts.length+' Artikel prüfen'} disabled={cropBusy} onPress={()=>{setBoxStep('review');setBoxAdvanced(false);}}/>:null}
      </>:null}
      {boxStep==='review'?<>
      <Text style={[styles.sub,{marginBottom:11}]}>Prüfe kurz die erkannten Kleidungsstücke. Fehlende Größen dürfen offen bleiben.</Text>
      {boxQuality.length?<View style={{marginBottom:10,padding:11,borderRadius:11,backgroundColor:C.warning}}>
        <Text style={[styles.micro,{color:C.warningText}]}>{PHOTO_ISSUES[boxQuality[0]]}</Text>
        <Pressable accessibilityRole="button" onPress={()=>setBoxStep('photo')} style={{paddingTop:7}}><Text style={[styles.micro,{color:C.accentDark,fontWeight:'900'}]}>Foto ansehen ›</Text></Pressable>
      </View>:null}
      {boxDrafts.length>0?<View style={{backgroundColor:'#FFF4DA',borderRadius:14,padding:12,marginVertical:10}}>
        <Text style={styles.sectionTitle}>{boxSummary.total} Teile · {boxSummary.sized} Größen erfasst</Text>
        <Text style={styles.micro}>{boxSummary.detail||'Artikel noch prüfen'}</Text>
        {boxSummary.sizes.length?<Text style={[styles.micro,{marginTop:5}]}>Erfasste Größen: {boxSummary.sizes.join(', ')}</Text>:null}
        {boxChecks.unknownSizes>0?<Text style={[styles.micro,{marginTop:5,color:C.warningText}]}>{boxChecks.unknownSizes} Größen noch unbekannt – bei Bedarf ergänzen, nicht schätzen.</Text>:null}
      </View>:null}
      {boxAdvanced&&boxDrafts.some(d=>d.category==='Kleidung'&&!d.facts.size)?<View style={{borderWidth:1,borderColor:C.line,borderRadius:14,padding:12,marginBottom:13}}>
        <Text style={styles.label}>Alles dieselbe Größe?</Text>
        <Text style={[styles.micro,{marginBottom:7}]}>Nur wenn du alle fehlenden Größen tatsächlich geprüft hast. Bereits erfasste Größen bleiben unverändert.</Text>
        <Input label="Gemeinsame Größe" value={boxBulkSize} onChangeText={setBoxBulkSize} maxLength={40} placeholder="z. B. 98/104"/>
        <Button title="Auf fehlende Größen anwenden" small mode="outline" disabled={!boxBulkSize.trim()||busy||scanBusy||choosing} onPress={applyBoxSize}/>
      </View>:null}
      {boxStep==='package'&&boxAdvanced&&boxDrafts.length>=2?<View style={{borderWidth:1,borderColor:C.line,borderRadius:14,padding:12,marginVertical:10}}>
        <Text style={styles.sectionTitle}>Paket zusammenstellen</Text>
        <Text style={styles.micro}>{selectedBoxIds.length} von {boxDrafts.length} Teilen ausgewählt · maximal zehn pro Angebot. Wähle passende Teile oder eine bekannte Größe.</Text>
        <Row style={{flexWrap:'wrap',marginTop:9}}>
          <Chip text="Erste 10 auswählen" selected={boxSelected===null} onPress={()=>setBoxSelected(null)}/>
          <Chip text="Auswahl leeren" selected={!selectedBoxIds.length} onPress={()=>setBoxSelected([])}/>
          {boxSizeGroups.filter(g=>g.ids.length>=2).map(g=><Chip key={g.size} text={'Gr. '+g.size+' · '+g.ids.length} selected={sameBoxSelection(selectedBoxIds,g.ids.slice(0,BOX_MAX_PACKAGE))} onPress={()=>setBoxSelected(g.ids.slice(0,BOX_MAX_PACKAGE))}/>)}
        </Row>
        {selectedBoxIds.length>=2?<Button title={selectedBoxIds.length+' Teile als Paket anbieten'} disabled={busy||scanBusy||choosing||boxStorage!=='ready'} onPress={openBoxPackage}/>:null}
        <Text style={[styles.micro,{marginTop:7}]}>Größen-Gruppen verwenden nur erfasste Größen. Unbekannte Größen werden nicht automatisch zugeordnet.</Text>
      </View>:null}
      {boxDrafts.length>=2?<Button title="Weiter: Paketvorschläge ansehen" disabled={cropBusy||boxStorage!=='ready'} onPress={()=>{setBoxStep('package');setBoxAdvanced(false);setBoxCrop(null);}}/>:null}
      <Button title="＋ Weitere Kleidung fotografieren" mode="outline" small disabled={cropBusy||!canCaptureBox} onPress={()=>{setBoxStep('photo');setBoxCrop(null);}}/>
      </>:null}
      {boxStep==='package'?<View style={{marginVertical:8}}>
        <Text style={[styles.sub,{marginBottom:10}]}>Wähle einen Vorschlag. Anschließend fehlen nur noch Preis, Zustand und Verkaufsfoto.</Text>
        {boxSuggestions.length?boxSuggestions.map((idea,index)=><Pressable key={idea.id}
          accessibilityRole="button" accessibilityLabel={idea.title+', '+idea.ids.length+' Artikel als Paket auswählen'}
          disabled={cropBusy||boxStorage!=='ready'} onPress={()=>openBoxPackage(idea.ids)}
          style={{padding:14,marginBottom:10,borderRadius:16,borderWidth:1,borderColor:index===0?C.accent:C.line,backgroundColor:index===0?C.pale:C.white}}>
          <Row style={{justifyContent:'space-between',alignItems:'center'}}>
            <View style={{flex:1}}>
              <Text style={[styles.body,{fontWeight:'900'}]}>{idea.title}</Text>
              <Text style={[styles.micro,{marginTop:4}]}>{idea.description}</Text>
            </View>
            <Text style={{fontSize:18,fontWeight:'900',color:C.accentDark}}>›</Text>
          </Row>
        </Pressable>):<Text style={styles.micro}>Noch nicht genügend Artikel für einen Paketvorschlag vorhanden.</Text>}
        <Text style={[styles.micro,{marginTop:2,marginBottom:8}]}>Vorschläge beruhen nur auf erfassten Größen und Kleidungsarten. Bitte selbst prüfen.</Text>
        <Button title={boxAdvanced?'Individuelle Auswahl schließen':'Auswahl selbst zusammenstellen'} mode="outline" small onPress={()=>setBoxAdvanced(v=>!v)}/>
      </View>:null}
      {(boxStep==='review'||(boxStep==='package'&&boxAdvanced))?<>
            <Text style={styles.sectionTitle}>{boxDrafts.length} offene Entwürfe</Text>
      {boxAdvanced&&boxDrafts.length?<Row style={{flexWrap:'wrap',marginBottom:10}}>
        <Chip text={'Alle · '+boxDrafts.length} selected={boxFilter==='all'} onPress={()=>setBoxFilter('all')}/>
        <Chip text={'Größen offen · '+boxDrafts.filter(d=>d.category==='Kleidung'&&!d.facts.size).length} selected={boxFilter==='unknown'} onPress={()=>setBoxFilter('unknown')}/>
        <Chip text={'Prüfhinweise · '+boxDrafts.filter(d=>!!d.uncertainty||!d.title.trim()).length} selected={boxFilter==='review'} onPress={()=>setBoxFilter('review')}/>
        <Chip text={'Im Paket · '+selectedBoxIds.length} selected={boxFilter==='selected'} onPress={()=>setBoxFilter('selected')}/>
      </Row>:null}
      {boxDrafts.length&&!visibleBoxDrafts.length?<Text style={[styles.micro,{marginBottom:10}]}>Für diesen Filter sind keine Teile vorhanden. Bitte wähle bei Bedarf „Alle“.</Text>:null}
      {(boxShowAll?visibleBoxDrafts:visibleBoxDrafts.slice(0,10)).map(d=><View key={d.id} style={{borderWidth:1,borderColor:C.line,borderRadius:13,padding:12,marginBottom:9}}>
        <Row style={{justifyContent:'space-between',alignItems:'center'}}>
          <Text style={[styles.micro,{color:C.accentDark,fontWeight:'800',flex:1}]}>ARTIKEL {boxDrafts.findIndex(x=>x.id===d.id)+1} · {d.batchId?'Gruppe '+(boxBatches.findIndex(b=>b.id===d.batchId)+1)+' · ':''}{d.position||'Position prüfen'}</Text>
          {boxStep==='package'?<Pressable accessibilityRole="checkbox" accessibilityState={{checked:selectedBoxIds.includes(d.id)}} disabled={busy||scanBusy||choosing} onPress={()=>toggleBoxSelection(d.id)} style={{padding:8,backgroundColor:selectedBoxIds.includes(d.id)?C.pale:C.bg,borderRadius:8}}>
            <Text style={{color:C.accentDark,fontWeight:'800',fontSize:12}}>{selectedBoxIds.includes(d.id)?'☑ Paket':'☐ Paket'}</Text>
          </Pressable>:null}
        </Row>
        <Text style={[styles.body,{fontWeight:'800',marginTop:4}]}>{d.title||'Neuer Artikel'}</Text>
        <Text style={styles.micro}>{[d.facts.color,d.facts.size?'Gr. '+d.facts.size:'Größe offen'].filter(Boolean).join(' · ')}</Text>
        {boxInspect===d.id&&d.facts.detail?<Text style={[styles.micro,{marginTop:4}]}>{d.facts.detail}</Text>:null}
        {boxInspect===d.id&&d.facts.brand?<Text style={styles.micro}>Marke: {d.facts.brand}</Text>:null}
        {boxInspect===d.id&&d.material?<Text style={styles.micro}>Etikettmaterial: {d.material}</Text>:null}
        <Text style={[styles.micro,{marginTop:6,color:d.facts.size?C.accentDark:C.warningText}]}>{d.facts.size?'Gr. '+d.facts.size+' · ':''}{labelSource(d)}</Text>
        {boxInspect===d.id&&!d.facts.size&&d.relativeSize?<Text style={[styles.micro,{marginTop:5}]}>Nur Größenvergleich: {d.relativeSize}</Text>:null}
        {d.uncertainty?<Text style={[styles.micro,{marginTop:5,color:C.warningText}]}>Bitte prüfen: {d.uncertainty}</Text>:null}
        <Pressable accessibilityRole="button" accessibilityState={{expanded:boxInspect===d.id}} disabled={busy||scanBusy||choosing} onPress={()=>setBoxInspect(boxInspect===d.id?null:d.id)} style={{paddingVertical:10}}><Text style={{color:C.accentDark,fontWeight:'800',fontSize:13}}>{boxInspect===d.id?'Fertig ↑':'Angaben ändern ›'}</Text></Pressable>
        {boxInspect===d.id?<View>
          <Input label="Artikelbezeichnung" value={d.title} onChangeText={v=>updateBoxDraft(d.id,{title:v,garmentType:v})} maxLength={100} placeholder="z. B. Langarmbody"/>
          <Input label="Größe (Etikett / geprüft)" value={d.facts.size} onChangeText={v=>updateBoxDraft(d.id,{sizeEvidence:v?'seller':'unknown'},{size:v})} maxLength={40} placeholder="Unbekannt darf leer bleiben"/>
          <Input label="Farbe" value={d.facts.color} onChangeText={v=>updateBoxDraft(d.id,{}, {color:v})} maxLength={40}/>
          <Input label="Marke" value={d.facts.brand} onChangeText={v=>updateBoxDraft(d.id,{}, {brand:v})} maxLength={60}/>
          <Input label="Muster, Form & weitere Merkmale" value={d.facts.detail} onChangeText={v=>updateBoxDraft(d.id,{pattern:'',shape:'',features:''},{detail:v})} maxLength={100}/>
          <Text style={styles.micro}>Etikett bitte selbst ablesen und Größe oder Marke nur bei sicherer Kenntnis eintragen.</Text>
        </View>:null}
        {!d.facts.size&&boxInspect!==d.id&&d.category==='Kleidung'?<Pressable accessibilityRole="button" disabled={busy||scanBusy||choosing} onPress={()=>setBoxInspect(d.id)} style={{paddingVertical:6}}><Text style={[styles.micro,{color:C.accentDark,fontWeight:'800'}]}>Größe ergänzen ›</Text></Pressable>:null}
        {d.photos?.length?<Image accessibilityLabel={"Artikelfoto zu "+d.title} source={{uri:d.photos[0].uri}} resizeMode="contain" style={{width:95,height:95,borderRadius:10,backgroundColor:C.bg,marginTop:8}}/>:null}
        {boxInspect===d.id&&!d.photos?.length&&suggestedCrop(d)&&boxBatches.some(b=>b.id===d.batchId&&b.photo)?<Button title="Einzelbild aus Gruppenfoto erstellen" small mode="outline" disabled={cropBusy} onPress={()=>openBoxCrop(d)}/>:null}
      {boxCrop?.id===d.id&&cropDraft&&cropSource?<View style={{backgroundColor:C.pale,borderRadius:15,padding:13,marginVertical:12}}>
        <Text style={styles.sectionTitle}>Einzelbild für {cropDraft.title}</Text>
        <Text style={[styles.micro,{marginBottom:9}]}>Der Rahmen ist ein KI-Vorschlag. Das gesamte Kleidungsstück muss darin liegen, ohne fremde Artikel oder private Details.</Text>
        <View onLayout={e=>setBoxCropFrame(e.nativeEvent.layout)} style={{width:'100%',height:300,backgroundColor:C.bg,borderRadius:10,overflow:'hidden'}}>
          <Image accessibilityLabel={"Originalfoto zur Ausschnittbearbeitung: "+cropDraft.title} source={{uri:cropSource.uri}} resizeMode="contain" style={{width:'100%',height:'100%'}}/>
          {boxCropFrame.width>0&&cropSource.width>0&&cropSource.height>0?(()=>{
            const scale=Math.min(boxCropFrame.width/cropSource.width,boxCropFrame.height/cropSource.height);
            const w=cropSource.width*scale,h=cropSource.height*scale,b=boxCrop.bounds;
            return <View pointerEvents="none" style={{position:'absolute',left:(boxCropFrame.width-w)/2+b.left*w/100,top:(boxCropFrame.height-h)/2+b.top*h/100,width:(b.right-b.left)*w/100,height:(b.bottom-b.top)*h/100,borderWidth:3,borderColor:C.accent,backgroundColor:'#087F8715'}}/>;
          })():null}
        </View>
        <Text style={[styles.label,{marginTop:10}]}>Rahmen korrigieren</Text>
        {[['left','Linker Rand'],['right','Rechter Rand'],['top','Oberer Rand'],['bottom','Unterer Rand']].map(([edge,label])=><Row key={edge} style={{alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
          <Text style={[styles.micro,{flex:1}]}>{label}</Text>
          <Button title="−" accessibilityLabel={label+" um zwei Prozent verkleinern"} mode="outline" small disabled={cropBusy} onPress={()=>adjustBoxCrop(edge,-2)}/>
          <Button title="＋" accessibilityLabel={label+" um zwei Prozent vergrößern"} mode="outline" small disabled={cropBusy} onPress={()=>adjustBoxCrop(edge,2)}/>
        </Row>)}
        <Button title={scanBusy?'Bild wird verarbeitet …':'Ausschnitt als Vorschau ansehen'} disabled={cropBusy} onPress={previewBoxCrop}/>
        {boxCrop.preview?<View style={{marginTop:12}}>
          <Image accessibilityLabel={"Vorschau des zugeschnittenen Fotos: "+cropDraft.title} source={{uri:boxCrop.preview.uri}} resizeMode="contain" style={{width:'100%',height:245,backgroundColor:C.white,borderRadius:10}}/>
          <Text style={[styles.micro,{marginVertical:8}]}>Bestätige nur, wenn wirklich das richtige, vollständige Kleidungsstück sichtbar ist. Das Bild wird erst bei der späteren Anzeige hochgeladen.</Text>
          <Button title="Richtiges Einzelbild übernehmen" disabled={cropBusy} onPress={acceptBoxCrop}/>
        </View>:null}
        <Button title="Abbrechen" mode="ghost" small disabled={cropBusy} onPress={()=>setBoxCrop(null)}/>
      </View>:null}
        {!d.photos?.length&&['overlapping','cutoff'].includes(d.visibility)?<Text style={[styles.micro,{color:C.warningText,marginTop:6}]}>Für ein vollständiges Einzelbild bitte separat fotografieren.</Text>:null}
        {boxInspect===d.id?<Text style={[styles.micro,{marginVertical:5}]}>{d.photos.length?'Artikelfoto vorhanden':'Einzelfoto nur beim Einzelverkauf nötig'} · {d.condition||'Zustand noch offen'}</Text>:null}
        {boxInspect===d.id?<Button title="Einzeln verkaufen" small mode="ghost" disabled={busy||scanBusy||choosing} onPress={()=>openBoxEditor(d)}/>:null}
        {boxInspect===d.id?<Button title="Artikel entfernen" mode="ghost" small disabled={busy||scanBusy||choosing} onPress={()=>Alert.alert('Entwurf entfernen?','Dieser Artikel bleibt unveröffentlicht.',[{text:'Abbrechen',style:'cancel'},{text:'Entfernen',style:'destructive',onPress:()=>removeBoxDraft(d.id)}])}/>:null}
      </View>)}
      {visibleBoxDrafts.length>10?<Button title={boxShowAll?'Weniger anzeigen':'Weitere '+(visibleBoxDrafts.length-10)+' Artikel anzeigen'} mode="outline" small onPress={()=>setBoxShowAll(v=>!v)}/>:null}
      {boxStep==='review'?<Button title={boxAdvanced?'Weitere Möglichkeiten schließen':'Weitere Möglichkeiten'} mode="ghost" small onPress={()=>setBoxAdvanced(v=>!v)}/>:null}
      {boxAdvanced?<View>
        <Input label="Ort / Region für weitere Entwürfe (optional)" value={boxRegion} onChangeText={setBoxRegion} maxLength={80} placeholder="z. B. Fürstenwalde"/>
        <Button title="＋ Artikel manuell ergänzen" mode="outline" disabled={boxDrafts.length>=BOX_MAX_ITEMS||busy||scanBusy||choosing||boxStorage!=='ready'} onPress={addBoxDraft}/>
      </View>:null}
      {boxStep==='package'&&boxAdvanced&&selectedBoxIds.length>=2?<View style={{marginTop:13}}>
        <Button title={selectedBoxIds.length+' ausgewählte Teile als Paket anbieten'} disabled={busy||scanBusy||choosing||boxStorage!=='ready'} onPress={openBoxPackage}/>
        <Text style={[styles.micro,{marginTop:6}]}>Verkaufsfotos werden nur übernommen, wenn vollständige Fotogruppen genau zum Paket passen. Andernfalls bitte ein aktuelles Paketfoto auswählen.</Text>
      </View>:null}
      </>:null}
      <Button title="‹ Zurück" mode="ghost" small disabled={busy||scanBusy||choosing} onPress={()=>setBoxStep(boxStep==='package'?'review':'photo')}/>
      <Button title="Kiste schließen & später fortsetzen" mode="outline" small disabled={busy||scanBusy||choosing} onPress={closeBox}/>
      {boxAdvanced?<Button title="Gespeicherte Kiste löschen" mode="ghost" small disabled={busy||scanBusy||choosing||boxStorage==='loading'} onPress={confirmClearBox}/>:null}
    </Card>:null}
    {open?<Card style={{marginBottom:18}}>
      <Text style={styles.sectionTitle}>{boxEditor?(boxEditor.packageIds?'Kistenpaket bearbeiten':'Kistenartikel bearbeiten'):editingId?'Anzeige bearbeiten':'Artikel anbieten'}</Text>
      {boxEditor?<Info>{boxEditor.packageIds?'Prüfe, ob alle Artikel in der Paketliste und auf den Fotos enthalten sind.':'Bitte zeige auf den Verkaufsfotos nur diesen einzelnen Artikel. Du kannst jederzeit zur Kiste zurückkehren.'}</Info>:null}
      <Text style={styles.sub}>Fotos, Beschreibung und Preis – alles an einem Ort.</Text>
      {!editingId&&!boxEditor?<DraftTemplatePicker
        title="Anzeige mit Steckbrief-Vorlage erstellen"
        templates={MARKET_DRAFT_TEMPLATES} selectedId={draftTemplateId}
        onPick={chooseMarketDraft}
        hint="Einheitliche Beschreibungen helfen später beim Auswerten. Kategorie, Zustand, Preis und Größen werden zusätzlich in den vorhandenen Formularfeldern gespeichert."/>:null}
       {!editingId&&!boxEditor?<View style={{flexDirection:'row',gap:8,marginVertical:10,flexWrap:'wrap'}}>
        <Chip text="Foto & Steckbrief" selected={quick} onPress={scanBusy?undefined:()=>{if(!quick){setQuick(true);setCondition('');setConfirmed(false);}}}/>
        <Chip text="Manuell schreiben" selected={!quick} onPress={scanBusy?undefined:()=>{if(quick){setQuick(false);setCondition(condition||'Gut');setProposal(null);setConfirmed(false);}}}/>
      </View>:null}
      {quick&&!editingId&&!boxEditor?<View style={{backgroundColor:'#FFF4DA',borderRadius:15,padding:13,marginBottom:13}}>
        <Text style={[styles.label,{color:C.accentDark}]}>Fotografieren. Fakten prüfen. Fertig.</Text>
        <Text style={styles.micro}>Fotografiere deinen Artikel und trage seine Eigenschaften selbst ein. Eine automatische Fotoerkennung steht derzeit nicht zur Verfügung.</Text>
      </View>:null}
      <Text style={[styles.sub,{marginBottom:17}]}>{packageForm?'Ein letzter Blick auf dein Paket – danach wird es wie gewohnt geprüft.':editingId?
        'Beim Bearbeiten wird die Anzeige kurz als Entwurf gespeichert und anschließend automatisch neu veröffentlicht. Bereits hochgeladene Fotos bleiben erhalten.':
        'Kostenlos einstellen. Bitte alle Angaben vor dem Veröffentlichen sorgfältig prüfen.'}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>1 · Fotos</Text>
      <View style={{marginBottom:15}}>
        <Button title={'＋ Fotos auswählen ('+(existingPhotoCount+photo.length)+'/5)'} mode="outline"
          disabled={choosing||busy||scanBusy||existingPhotoCount+photo.length>=5}
          onPress={()=>pick(async assets=>{const kept=boxEditor?await Promise.all(assets.map(a=>keepBoxPhoto(me,a))):assets;setPhoto(old=>[...old,...kept].slice(0,5-existingPhotoCount));setProposal(null);setConfirmed(false);},
            5-existingPhotoCount-photo.length)}/>
        {quick&&!editingId?<Button title="＋ Mit der Kamera fotografieren" mode="ghost" small disabled={choosing||busy||scanBusy||photo.length>=5} onPress={takeArticlePhoto}/>:null}
        {photo.length>0?<ScrollView horizontal style={{marginTop:11}} contentContainerStyle={{gap:9}}>
          {photo.map((asset,index)=><View key={asset.assetId||asset.uri+index} style={{width:100}}>
            <Image accessibilityLabel={"Foto "+(index+1)+" zur Anzeige"} source={{uri:asset.uri}} style={{width:100,height:100,borderRadius:13}} resizeMode="cover"/>
            <Pressable accessibilityRole="button" accessibilityLabel={'Foto '+(index+1)+' entfernen'}
              disabled={scanBusy||busy} onPress={()=>{setPhoto(p=>p.filter((_,i)=>i!==index));setProposal(null);setConfirmed(false);}} style={{padding:7,alignItems:'center'}}>
              <Text style={[styles.micro,{color:C.coralDeep,fontWeight:'900'}]}>Entfernen ×</Text>
            </Pressable>
          </View>)}
        </ScrollView>:null}
        <Text style={[styles.micro,{marginTop:8}]}>{packageForm?'Nur die tatsächlich enthaltenen Artikel zeigen.':'Bis zu fünf Bilder pro Angebot. Bei Änderungen werden alle Bilder erneut geprüft.'}</Text>
      </View>
      {quick&&!editingId&&!boxEditor?<View style={{marginBottom:16}}>
        <Text style={styles.micro}>Die Angaben werden von dir eingetragen; es findet keine KI-Fotoanalyse statt.</Text>
        {scanNotice?<Info>{scanNotice}</Info>:null}
        {proposal?<View style={{borderWidth:1,borderColor:C.line,borderRadius:14,padding:12,marginTop:10}}>
          <Text style={styles.label}>Vorschlag aus deinen Fotos – noch nicht bestätigt</Text>
          <Text style={styles.body}>{proposal.title} · {proposal.category}</Text>
          {FACT_KEYS.filter(([k])=>proposal[k]).map(([k,label])=><Text key={k} style={[styles.micro,{marginTop:5}]}>{label}: {proposal[k]}</Text>)}
          <Button title="Vorschläge übernehmen & prüfen" small onPress={useProposal} disabled={scanBusy||busy}/>
          <Button title="Verwerfen" small mode="ghost" onPress={()=>setProposal(null)}/>
        </View>:null}
      </View>:null}
      <Text accessibilityRole="header" style={styles.sectionTitle}>2 · Artikel & Eigenschaften</Text>
      {packageForm&&!boxFormExtras?<Text style={[styles.body,{fontWeight:'900',marginBottom:12}]}>{title}</Text>:<>
        <Input label="Anzeigentitel" value={title} onChangeText={v=>{setTitle(v);setConfirmed(false);}} maxLength={100} placeholder="z. B. Winterjacke Größe 116"/>
        <MarketCategoryDropdown label="Kategorie wählen" value={category} onChange={v=>{setCategory(v);setConfirmed(false);}} options={MARKET_CATEGORIES}/>
      </>}
      {packageForm?<View style={{marginBottom:14,padding:13,borderRadius:15,backgroundColor:'#FFF4DA'}}>
        <Text style={styles.sectionTitle}>Dein Paket · {packageForm.rows.length} Teile</Text>
        {packageForm.rows.map((line,i)=><Text key={i} style={[styles.body,{paddingVertical:5,borderBottomWidth:1,borderBottomColor:C.line}]}>{line}</Text>)}
        <Text style={[styles.micro,{marginTop:8}]}>{facts.size?'Gemeinsame Größe: '+facts.size:'Einzelgrößen stehen beim jeweiligen Teil.'}</Text>
        <Button title="Paketinhalt ändern" small mode="ghost" disabled={busy||scanBusy||choosing} onPress={saveBoxEditor}/>
      </View>:quick?<View style={{marginBottom:12}}>
        <Text style={styles.sectionTitle}>Artikel-Steckbrief</Text>
        <Text style={[styles.micro,{marginBottom:12}]}>Unbekanntes darf leer bleiben. Falsche Vorschläge korrigieren oder löschen.</Text>
        {scanned&&!expandFacts?<View style={{borderWidth:1,borderColor:C.line,borderRadius:12,padding:11,marginBottom:12}}>
          {FACT_KEYS.filter(([k])=>!!facts[k]).map(([k,label])=><Row key={k} style={{justifyContent:'space-between',gap:8,paddingVertical:4}}>
            <Text style={[styles.micro,{flex:1}]}>{label}</Text><Text style={[styles.body,{flex:1,textAlign:'right'}]}>{facts[k]}</Text>
          </Row>)}
          {!FACT_KEYS.some(([k])=>!!facts[k])?<Text style={styles.micro}>Keine weiteren Merkmale eindeutig erkannt.</Text>:null}
          <Button title="Merkmale ändern / ergänzen" small mode="outline" onPress={()=>setExpandFacts(true)}/>
        </View>:null}
        {(!scanned||expandFacts)?<>
          <Input label="Marke (optional)" value={facts.brand} onChangeText={v=>changeFact('brand',v)} maxLength={60} placeholder="Nur falls bekannt"/>
          {['Kleidung','Babyausstattung'].includes(category)||facts.size?<Input label="Größe (optional)" value={facts.size} onChangeText={v=>changeFact('size',v)} maxLength={40} placeholder="z. B. 104 oder 28"/>:null}
          <Input label="Farbe (optional)" value={facts.color} onChangeText={v=>changeFact('color',v)} maxLength={40} placeholder="z. B. dunkelblau"/>
          <Input label={({Bücher:'Autor / Reihe (optional)',Spielzeug:'Set / Modell (optional)',Möbel:'Maße / Modell (optional)',Babyausstattung:'Modell / Ausführung (optional)'})[category]||'Weitere Angabe (optional)'} value={facts.detail} onChangeText={v=>changeFact('detail',v)} maxLength={100} placeholder="Kurzes, wichtiges Merkmal"/>
          {scanned?<Button title="Merkmale einklappen" mode="ghost" small onPress={()=>setExpandFacts(false)}/>:null}
        </>:['Kleidung','Babyausstattung'].includes(category)&&askSize?<Input label="Welche Größe hat der Artikel? (optional)" value={facts.size} onChangeText={v=>changeFact('size',v)} maxLength={40} placeholder="Größe vom Etikett"/>:null}
      </View>:null}
      <Text accessibilityRole="header" style={styles.sectionTitle}>3 · Preis & Zustand</Text>
      {packageForm?<Text style={[styles.micro,{marginBottom:4}]}>Angebot: {trade==='sell'?'Verkaufen':trade==='gift'?'Verschenken':'Tauschen'}</Text>:null}
      {packageForm?<Button title={boxFormExtras?'Optionen wieder ausblenden':'Weitere Optionen (freiwillig)'} mode="ghost" small onPress={()=>setBoxFormExtras(v=>!v)}/>:null}
      {(!packageForm||boxFormExtras)?<><Text style={styles.label}>Ich möchte</Text>
      <View style={[styles.chipsRow,{marginTop:0,marginBottom:16}]}>
        <Chip text="Verkaufen" selected={trade==='sell'} onPress={()=>{setTrade('sell');setConfirmed(false);}}/>
        <Chip text="Verschenken" selected={trade==='gift'} onPress={()=>{setTrade('gift');setConfirmed(false);}}/>
        <Chip text="Tauschen" selected={trade==='swap'} onPress={()=>{setTrade('swap');setConfirmed(false);}}/>
      </View>
      </>:null}
      {trade==='sell'?<Input label={packageForm?"Gesamtpreis des Pakets in €":"Preis in €"} value={price} onChangeText={v=>{setPrice(v);setConfirmed(false);}} keyboardType="decimal-pad" placeholder="z. B. 12,50"/>:null}
      {packageForm&&trade==='sell'&&parsePrice(price)!==null&&parsePrice(price)>=0?<Text style={[styles.micro,{color:C.accentDark,marginBottom:12}]}>Rechnerisch {((parsePrice(price)/100)/packageForm.rows.length).toLocaleString('de-DE',{style:'currency',currency:'EUR'})} pro Teil – keine KI-Preisempfehlung.</Text>:null}
      <Text style={styles.label}>{packageForm?'Zustand des gesamten Pakets':'Zustand'}</Text>
      {packageForm?<Text style={[styles.micro,{marginBottom:7}]}>Bei unterschiedlichem Zustand bitte die schwächste zutreffende Zustandsnote wählen und Abweichungen unten angeben.</Text>:null}
      <View style={[styles.chipsRow,{marginTop:0,marginBottom:16}]}>
        {['Neu','Sehr gut','Gut','Gebraucht'].map(x=><Chip key={x} text={x} selected={condition===x} onPress={()=>{setCondition(x);setConfirmed(false);}}/>)}
      </View>
      {quick?<View style={{marginBottom:13}}>
        <Text style={styles.label}>Gibt es bekannte Mängel?</Text>
        <View style={[styles.chipsRow,{marginTop:0,marginBottom:9}]}>
          {DEFECTS.map(x=><Chip key={x} text={x} selected={facts.defect===x} onPress={()=>changeFact('defect',x)}/>)}
        </View>
        {facts.defect==='Vorhanden'?<Input label="Welche Mängel?" value={facts.defectText} onChangeText={v=>changeFact('defectText',v)} maxLength={180} multiline placeholder="z. B. kleiner Fleck am Ärmel"/>:null}
        {packageForm?(boxFormExtras?<Input label="Persönliche Notiz (optional)" multiline value={packageForm.personal} onChangeText={v=>{setDescription(packageNote(packageForm.rows,v));setConfirmed(false);}} maxLength={packagePersonalLimit(packageForm.rows)} placeholder="z. B. alles zusammen abzugeben"/>:null):<Input label="Deine persönliche Notiz (optional)" multiline value={description} onChangeText={v=>{setDescription(v);setConfirmed(false);}} maxLength={900} placeholder="Was möchtest du persönlich ergänzen?"/>}
      </View>:<Input label="Beschreibung" multiline value={description} onChangeText={setDescription} maxLength={1500} placeholder="Größe, Farbe, Zustand, Abholung …"/>}
      <Input label="Ort / Region – keine Privatadresse" value={region} onChangeText={v=>{setRegion(v);setConfirmed(false);}} maxLength={80} placeholder="z. B. Fürstenwalde/Spree"/>
      {myOrgs.length>0&&!editingId&&(!packageForm||boxFormExtras)?<><Text style={styles.label}>Anbieten als</Text><View style={[styles.chipsRow,{marginTop:0,marginBottom:15}]}>
        <Chip text="Privat" selected={!organizationId} onPress={()=>setOrganizationId('')}/>
        {myOrgs.map(o=><Chip key={o.id} text={o.name} selected={organizationId===o.id} onPress={()=>setOrganizationId(o.id)}/>)}
      </View></>:null}
      {packageForm?<Text style={[styles.micro,{marginBottom:11}]}>Dein Paket wird nach dem Hochladen sofort veröffentlicht, sofern die Grundregeln erfüllt sind.</Text>
         :<Info>Erlaubt sind Kuscheltiere, Tierfiguren und harmloses Kinderspielzeug. Verboten sind echte Tiere, Waffen, Drogen, Medikamente, 18+-Artikel und andere gefährliche oder illegale Waren. Einfache Regeln werden automatisch geprüft; problematische Anzeigen können Mitglieder melden.</Info>}
      <Text accessibilityRole="header" style={styles.sectionTitle}>4 · Prüfen & veröffentlichen</Text>
       <Pressable accessibilityRole="checkbox" accessibilityLabel="Marktplatzregeln für diese Anzeige bestätigen"
         accessibilityState={{checked:rulesConfirmed}} onPress={()=>setRulesConfirmed(v=>!v)}
         style={({pressed})=>[styles.marketRulesCheck,pressed&&styles.buttonPress]}>
         <Text style={{fontSize:21,color:C.accentDark}}>{rulesConfirmed?'☑':'☐'}</Text>
         <Text style={[styles.body,{flex:1}]}>Ich bestätige, dass mein Angebot erlaubt und korrekt beschrieben ist. Die Fotos zeigen keine Personen, Privatadressen oder Dokumente.</Text>
       </Pressable>
       {quick?<Pressable accessibilityRole="checkbox" accessibilityState={{checked:confirmed}} onPress={()=>setConfirmed(v=>!v)} style={{flexDirection:'row',gap:10,padding:12,marginBottom:12,borderRadius:12,borderWidth:1,borderColor:C.line}}>
        <Text style={{fontSize:19,color:C.accentDark}}>{confirmed?'☑':'☐'}</Text>
        <Text style={[styles.body,{flex:1}]}>{packageForm?'Ich habe Paketinhalt und Zustand geprüft.':'Ich habe die Angaben geprüft. Der Steckbrief beschreibt mein Angebot korrekt.'}</Text>
      </Pressable>:null}
      <CompletionPrompt title="Deine Anzeige – diese Angaben fehlen noch"
        items={[
          {label:'Titel mit mindestens vier Zeichen',done:title.trim().length>=4},
          {label:'Artikelzustand auswählen',done:['Neu','Sehr gut','Gut','Gebraucht'].includes(condition)},
          {label:'Preis korrekt angeben',done:trade!=='sell'||parsePrice(price)!==null&&parsePrice(price)>=0&&parsePrice(price)<=10000000},
          {label:'Alle markierten Entwurfsfelder ergänzen',done:!hasTemplatePlaceholders(title)&&!hasTemplatePlaceholders(description)},
          {label:'Marktplatzregeln bestätigen',done:rulesConfirmed},
          ...(quick?[{label:'Steckbrief und bekannte Mängel prüfen',done:!!confirmed&&DEFECTS.includes(facts.defect)&&(facts.defect!=='Vorhanden'||!!facts.defectText.trim())}]:[])
        ]}/>
      <ContextHelp title="Wann ist die Anzeige sichtbar?">
        Nach dem Einreichen erscheint die Anzeige direkt im Familienbasar. Fotos werden zuerst hochgeladen. Problematische Angebote können von Mitgliedern gemeldet und bei mehreren unabhängigen Meldungen automatisch ausgeblendet werden. Bitte keine Personen, Adressen oder privaten Dokumente auf Fotos zeigen.
      </ContextHelp>
      <Button title={busy?'Wird veröffentlicht …':editingId?'Änderungen direkt veröffentlichen':packageForm?'Paket jetzt veröffentlichen':'Anzeige jetzt veröffentlichen'} disabled={busy||choosing||scanBusy||!active||!rulesConfirmed||(quick&&!confirmed)} onPress={submit}/>
      {boxEditor?<Button title="Entwurf behalten und zurück zur Kiste" mode="outline" disabled={busy||choosing||scanBusy} onPress={saveBoxEditor}/>:null}
      {!editingId&&!boxEditor?<Button title="Viele Artikel? Zum Kistenmodus" mode="ghost" disabled={busy||choosing||scanBusy} onPress={()=>Alert.alert('Zum Kistenmodus wechseln?','Die Angaben dieser einzelnen Anzeige werden verworfen.',[{text:'Abbrechen',style:'cancel'},{text:'Wechseln',onPress:()=>{resetForm();showBox();}}])}/>:null}
    </Card>:null}
    {!boxOpen&&!boxEditor&&selected?<View>
      <Pressable accessibilityRole="button" onPress={()=>{setSelectedListing(null);setBuyerFocus(null);}} style={{marginBottom:14,paddingVertical:8}}>
        <Text style={{color:C.accentDark,fontWeight:'800',fontSize:15}}>‹ Zurück zu den Anzeigen</Text>
      </Pressable>
      <Card style={styles.marketDetailCard}>
        <View style={styles.marketDetailImage}>
          {shownImage?<Image accessibilityLabel={imageDescription} source={{uri:shownImage}} style={styles.marketFullImage} resizeMode="contain"/>:
            <View style={[styles.marketFullImage,styles.marketImagePlaceholder]}><Text style={{fontSize:34}}>♧</Text><Text style={styles.micro}>Kein Foto hinterlegt</Text></View>}
        </View>
        {gallery.length>1?<View style={{marginTop:12}}>
          <Row style={{justifyContent:'space-between',marginBottom:10}}>
            <Button title="‹ Zurück" small mode="outline" onPress={()=>setGalleryIndex(i=>(i+gallery.length-1)%gallery.length)}/>
            <Text style={[styles.micro,{fontWeight:'800'}]}>{(galleryIndex%gallery.length)+1} von {gallery.length} Bildern</Text>
            <Button title="Weiter ›" small mode="outline" onPress={()=>setGalleryIndex(i=>(i+1)%gallery.length)}/>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:9}}>
            {gallery.map((image,index)=><Pressable key={image.id} accessibilityRole="button"
              accessibilityLabel={marketPhotoAlt(selected,selectedFacts,selectedPackage,index,gallery.length)} accessibilityState={{selected:galleryIndex===index}}
              onPress={()=>setGalleryIndex(index)}>
              <Image accessible={false} source={{uri:image.uri}} style={{width:66,height:66,borderRadius:12,borderWidth:galleryIndex===index?3:1,borderColor:galleryIndex===index?C.accent:C.line}} resizeMode="cover"/>
            </Pressable>)}
          </ScrollView>
        </View>:null}
        {gallery.length>0?<View style={{marginTop:12}}>
          <Text accessibilityRole="header" style={[styles.label,{marginBottom:5}]}>Bildbeschreibung aus Artikelangaben</Text>
          <Text style={styles.micro}>{marketPhotoFacts(selected,selectedFacts,selectedPackage)}</Text>
          <Text style={[styles.micro,{marginTop:5}]}>
            Diese Angaben stammen aus dem Inserat und können ursprünglich aus KI-Vorschlägen stammen,
            die der Anbieter bestätigt hat. Einzelne Fotos wurden nicht gesondert beschrieben.
          </Text>
        </View>:null}
        <Text style={[styles.marketPrice,{fontSize:26,marginTop:15}]}>{priceLabel(selected)}</Text>
        <Text style={[styles.h,{marginTop:5}]}>{selected.title}</Text>
        {selected.seller_id!==me&&selected.moderation_status==='approved'?
          <View style={{marginTop:12}}><Button title={favoriteIds.has(selected.id)?'♥ Aus Merkliste entfernen':'♡ Zur Merkliste hinzufügen'}
            mode={favoriteIds.has(selected.id)?'primary':'outline'} disabled={busy||!active||favoriteBusy[selected.id]||favoriteMap[selected.id]===undefined}
            onPress={()=>changeFavorite(selected.id)}/></View>:null}
        <Text style={[styles.sub,{marginTop:8}]}>{selected.item_condition} · {selected.category} · {selected.region_label||'Region auf Anfrage'}</Text>
        <View style={{height:1,backgroundColor:C.line,marginVertical:18}}/>
        {selectedFacts?<View>
          <Text style={styles.sectionTitle}>Auf einen Blick</Text>
          {[['Zustand',selected.item_condition],...articleFactRows(selectedFacts.facts)].map(([label,value])=><View key={label} style={{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:C.line}}>
            <Text style={[styles.micro,{flex:1}]}>{label}</Text><Text style={[styles.body,{flex:1,fontWeight:'700',textAlign:'right'}]}>{value}</Text>
          </View>)}
          {selectedPackage?<View style={{marginTop:15}}>
            <Text style={styles.sectionTitle}>Paketinhalt · {selectedPackage.rows.length} Teile</Text>
            {selectedPackage.rows.map((line,i)=><Text key={i} style={[styles.body,{paddingVertical:6,borderBottomWidth:1,borderBottomColor:C.line}]}>{line}</Text>)}
            {selectedPackage.personal?<View style={{marginTop:12}}><Text style={styles.label}>Persönliche Notiz</Text><Text style={styles.body}>{selectedPackage.personal}</Text></View>:null}
          </View>:selectedFacts.note?<View style={{marginTop:15}}><Text style={styles.label}>Persönliche Notiz</Text><Text style={styles.body}>{selectedFacts.note}</Text></View>:null}
        </View>:<><Text style={styles.sectionTitle}>Beschreibung</Text><Text style={styles.body}>{selected.description||'Keine weiteren Angaben.'}</Text></>}
        {(()=>{const seller=sellerInformation(selected);return <View style={{marginTop:20}}>
          <Text style={styles.sectionTitle}>Anbieter</Text>
          <Text style={styles.body}>{seller.seller}{seller.org?' ✦':''}</Text>
          <Text style={[styles.micro,{marginTop:4}]}>Grobe Region: {selected.region_label||'auf Anfrage'}</Text>
          {seller.own&&selected.moderation_status==='pending'?<Info warning>Dein Entwurf ist noch nicht öffentlich. Prüfe die Angaben und tippe auf „Jetzt veröffentlichen“. Eine manuelle Freigabe ist nicht nötig.</Info>:null}
          {seller.own&&selected.moderation_status==='pending'?
            <Text style={[styles.micro,{marginTop:10}]}>Du kannst den Entwurf bearbeiten und Fotos ergänzen.</Text>:null}
          {seller.own&&selected.moderation_status==='pending'?<View style={{marginTop:10}}>
  <Button title="Jetzt veröffentlichen" disabled={busy||!active} onPress={()=>retryReview(selected.id)}/>
</View>:null}
{seller.own&&selected.moderation_status==='sold'?<Info>Dieses Angebot ist vergeben und für andere nicht mehr sichtbar. Eine Zahlung über die App hat nicht stattgefunden.</Info>:null}
          {seller.own&&selected.moderation_status==='rejected'?<Info warning>Dieses Inserat wurde gesperrt und ist nicht öffentlich sichtbar.</Info>:null}
          {seller.own&&selected.moderation_status==='removed'?<Info warning>Dieses Inserat wurde nach Meldungen oder einer Sicherheitsentscheidung ausgeblendet. Bei Fragen wende dich an den Support.</Info>:null}
          {seller.own&&['approved','pending','rejected'].includes(selected.moderation_status)?
            <View style={{marginTop:13}}><Button title="Anzeige bearbeiten" mode="outline" disabled={busy||!active}
              onPress={()=>beginEdit(selected)}/></View>:null}
          {seller.own&&selected.moderation_status==='approved'?
            <View style={{marginTop:13}}><Button title="Als vergeben markieren" mode="outline" disabled={busy}
              onPress={()=>Alert.alert('Angebot abschließen?','Das Inserat verschwindet für andere Familien aus dem Basar. Damit wird kein Kauf oder Zahlungsvorgang ausgelöst.',[
                {text:'Abbrechen',style:'cancel'},
                {text:'Als vergeben markieren',onPress:()=>markListingSold(selected.id)}
              ])}/></View>:null}
          {seller.own&&selected.moderation_status==='pending'&&
            ((selected.photo_path?1:0)+marketPhotos.filter(x=>x.listing_id===selected.id).length<5)?
            <View style={{marginTop:12}}><Button title="Weitere Fotos hinzufügen" mode="outline" disabled={choosing||busy}
              onPress={()=>pick(assets=>addPendingPhotos(selected.id,assets),
                5-(selected.photo_path?1:0)-marketPhotos.filter(x=>x.listing_id===selected.id).length)}/></View>:null}
          <View style={{marginTop:17}}>{contactButton(selected,seller.contact)}</View>
{!seller.own&&selected.moderation_status==='approved'?<Pressable accessibilityRole="button"
  accessibilityLabel="Problem mit dieser Anzeige melden"
  onPress={()=>onReportListing(selected.id)} style={styles.marketReportButton}>
  <FamilyIcon name="shield" size={18} color={C.danger}/>
  <Text style={styles.marketReportText}>Problem mit Anzeige melden</Text>
</Pressable>:null}
        </View>;})()}
        <Text style={[styles.micro,{marginTop:20}]}>Keine Zahlung über Familienfunke möglich. Prüfe Artikel und Übergabe sorgfältig.</Text>
      </Card>
    </View>:!boxOpen&&!boxEditor&&!sellChoicesOpen?<>
      <View style={styles.marketSearchBox}>
        <Text style={{fontSize:19,color:C.accentDark,marginRight:10}}>⌕</Text>
        <TextInput accessibilityLabel="Angebote durchsuchen" style={styles.marketSearchInput}
          placeholder="z. B. Kinderjeans Größe 110 blau" placeholderTextColor="#647D82" value={query} onChangeText={setQuery} returnKeyType="search"/>
        {query.length>0?<Pressable accessibilityRole="button" accessibilityLabel="Suche löschen" hitSlop={12} onPress={()=>setQuery('')}>
          <Text style={{fontSize:20,color:C.muted}}>×</Text>
        </Pressable>:null}
      </View>
      <SearchResultFeedback active={!!(query.trim()||filter!=='Alle'||tradeFilter!=='all'||minPrice||maxPrice||onlyMine||onlyFavorites)}
        query={query} count={shown.length} loading={remoteBusy||!!(onlyMine&&ownLoading)} error={remoteError||ownError}
        hasMore={remoteHasMore||ownHasMore} context="Familienbasar"
        hint="Tippe auf eine Anzeige, um Fotos, Details und Kontaktmöglichkeiten zu sehen."/>
      <Text style={styles.marketFilterHeading}>Kategorie auswählen</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}
        contentContainerStyle={{gap:7,paddingRight:15}}>
        {['Alle',...MARKET_CATEGORIES].map(choice=>
          <Chip key={choice} text={choice} selected={filter===choice} onPress={()=>setFilter(choice)}/>)}
      </ScrollView>
      <View style={styles.marketFilters}>
        <Pressable accessibilityRole="button" accessibilityState={{expanded:filterOpen}} onPress={()=>setFilterOpen(v=>!v)}
          style={[styles.marketFilterToggle,filterOpen&&{borderColor:C.accent}]}>
          <Row style={{gap:5}}><FamilyIcon name="filter" size={17}/>
          <Text style={styles.marketFilterLabel}>Filter &amp; Sortierung{filterOpen?' −':' +'}{tradeFilter!=='all'||minPrice||maxPrice||sortBy!=='relevance'?' · aktiv':''}</Text></Row>
        </Pressable>
        </View>
      {filterOpen?<Card style={{marginBottom:15,padding:15}}>
        <MarketSortSelect value={sortBy} onChange={setSortBy}/>
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
          onPress={()=>{setFilter('Alle');setTradeFilter('all');setMinPrice('');setMaxPrice('');setSortBy('relevance');}}/>
      </Card>:null}
      {filterOpen?<View style={{gap:8,marginBottom:12}}>
        {!onlyMine&&!onlyFavorites&&!buyerFocus?<Button title={savingSearch?'Speichert …':'♡ Suche speichern'} mode="outline" disabled={savingSearch||!active} onPress={saveCurrentSearch}/>:null}
        <Button title="Meine Suchaufträge" mode="ghost" onPress={onSavedSearches}/>
      </View>:null}
      <Row style={{justifyContent:'space-between',marginBottom:12}}>
        <Text style={[styles.micro,{fontWeight:'800'}]}>{shown.length}{serverSearchActive&&remoteHasMore?'+':''} {shown.length===1?'Anzeige':'Anzeigen'} gefunden</Text>
        <Text style={styles.micro}>Neu und gebraucht</Text>
      </Row>
      {remoteBusy?<FamilySkeleton rows={2} label="Suche im gesamten Familienbasar …"/>:null}
      {remoteError?<><Info warning>{remoteError}</Info>
        <Button title="Basarsuche erneut versuchen" mode="outline" disabled={remoteBusy}
          onPress={()=>setSearchRetry(n=>n+1)}/></>:null}
      {serverSearchActive&&query.trim()&&!remoteBusy&&!remoteError?<Text style={[styles.micro,{marginBottom:12}]}>Auch einzelne Teile innerhalb eines Pakets werden gefunden. Größen und Farben sind Angaben, die Verkäufer prüfen müssen.</Text>:null}
      {onlyMine&&ownLoading?<View style={{paddingVertical:12}}><ActivityIndicator color={C.accent}/></View>:null}
      {onlyMine&&ownError?<><Info warning>{ownError}</Info><Button title="Eigene Anzeigen erneut laden" mode="outline" onPress={onRetryOwn}/></>:null}
      {onlyMine&&ownHasMore?<Text style={[styles.micro,{marginBottom:10}]}>Weitere eigene Anzeigen sind vorhanden. Suche und Sortierung beziehen sich auf die bisher geladenen Einträge.</Text>:null}
      {shown.length===0?(remoteBusy||remoteError||(onlyMine&&(ownLoading||ownError))?null:<Blank icon={onlyFavorites?'heart':'bag'}
          title={onlyFavorites?'Deine Merkliste ist noch leer':'Noch keine passenden Angebote'}
          body={onlyFavorites?'Merke dir ein freigegebenes Angebot über das Herz auf einer Produktkarte.':'Passe die Suche oder Filter an. Neue Anzeigen erscheinen direkt nach dem Einstellen, solange die Grundregeln erfüllt sind.'}
          actionLabel={onlyFavorites?'Angebote entdecken':'Filter zurücksetzen'}
          onAction={()=>{setOnlyFavorites(false);setOnlyMine(false);setBuyerFocus(null);
            setFilter('Alle');setQuery('');setTradeFilter('all');setMinPrice('');setMaxPrice('');}}/>):
        <View style={styles.marketGrid}>
        {shown.map(x=>{
          const seller=sellerInformation(x);
          return <Pressable key={x.id} accessibilityRole="button"
            accessibilityLabel={marketPhotoFacts(x,decodeArticleFacts(x.description),parsePackageNote(decodeArticleFacts(x.description)?.note||''))+' Preis: '+priceLabel(x)+'. Region: '+(x.region_label||'nicht angegeben')}
            onPress={()=>{setSelectedListing(x.id);setGalleryIndex(0);}} style={[styles.marketTile,singleColumn&&{width:'100%'}]}>
            <View style={styles.marketTileImage}>
              {(remotePhotoUrls[x.id]||photoUrls[x.id])?<Image accessible={false} source={{uri:remotePhotoUrls[x.id]||photoUrls[x.id]}} style={styles.marketTilePhoto} resizeMode="cover"/>:
                <View style={[styles.marketTilePhoto,styles.marketImagePlaceholder]}>
                  <FamilyIcon name="camera" size={32} color={C.muted}/><Text style={styles.micro}>Noch kein Foto</Text>
                </View>}
              {x.trade_type==='gift'?<View style={styles.marketGiftPill}>
                <Text style={styles.marketGiftText}>Zu verschenken</Text>
              </View>:null}
              {x.seller_id!==me&&x.moderation_status==='approved'?
                <Pressable accessibilityRole="button" accessibilityLabel={favoriteMap[x.id]===undefined?'Merkliste wird geprüft':favoriteIds.has(x.id)?'Von Merkliste entfernen':'Zur Merkliste hinzufügen'} hitSlop={9}
                  disabled={busy||!active||favoriteBusy[x.id]||favoriteMap[x.id]===undefined}
                  onPress={event=>{event.stopPropagation();changeFavorite(x.id);}}
                  style={{position:'absolute',right:7,top:8,backgroundColor:'#FFFFFFF2',borderRadius:20,paddingHorizontal:10,paddingVertical:7}}>
                  <FamilyIcon name="heart" size={21} color={favoriteIds.has(x.id)?C.coralDeep:C.accentDark}/>
                </Pressable>:null}
            </View>
            <View style={styles.marketTileBody}>
              <Text style={styles.marketTileTitle} numberOfLines={2}>{x.title}</Text>
              <Text style={styles.marketTilePrice} numberOfLines={1}>{priceLabel(x)}</Text>
              {x.match_item?<Text style={[styles.micro,{color:C.accentDark,marginTop:3}]} numberOfLines={2}>Passender Artikel: {x.match_item}</Text>:null}
              {galleryOf(x).length>1?<Text style={[styles.micro,{fontWeight:'800',color:C.accentDark}]}>{galleryOf(x).length} Bilder</Text>:null}
              <Text style={styles.micro} numberOfLines={1}>{x.item_condition} · {x.category}</Text>
              <Row style={{gap:4,marginTop:5}}><FamilyIcon name="pin" size={14} color={C.muted}/>
                <Text style={styles.micro} numberOfLines={1}>{x.region_label||'Region auf Anfrage'}</Text>
              </Row>
              {seller.org?<Text style={[styles.micro,{marginTop:3,color:C.accentDark}]} numberOfLines={1}>{seller.org.name} ✦</Text>:null}
              {seller.own&&x.moderation_status!=='approved'?<Text style={[styles.micro,{color:x.moderation_status==='sold'?C.accentDark:C.warningText,marginTop:4}]}>{x.moderation_status==='sold'?'Vergeben · nur für dich sichtbar':x.moderation_status==='pending'?'Entwurf · noch nicht veröffentlicht':'Gesperrt · nicht sichtbar'}</Text>:null}
            </View>
          </Pressable>;
        })}
        </View>}
      {onlyMine&&ownHasMore?<Button title={ownLoadingMore?'Weitere eigene Anzeigen werden geladen …':'Weitere eigene Anzeigen laden'} disabled={ownLoadingMore||ownLoading} mode="outline" onPress={onLoadMoreOwn}/>:null}
      {serverSearchActive&&remoteHasMore&&!remoteBusy&&!remoteError?<Button title="Weitere Treffer laden" mode="outline" onPress={()=>setSearchPage(n=>n+1)}/>:null}
    </>:null}
  </ScrollView>;
}
function MarketSortSelect({value,onChange}){
  const [open,setOpen]=useState(false);
  const options=[['relevance','Beste Treffer'],['newest','Neueste zuerst'],['low','Preis aufsteigend'],['high','Preis absteigend']];
  const selected=options.find(x=>x[0]===value)?.[1]||'Beste Treffer';
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

function PartnersScreen({focusId,clearFocus,organizations,me,active,busy,applyOrg,createPartnerEvent,openInclusion}){
  const focus=useFocusedEvent('ff_partner_events',focusId,me);
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
  const [publicOrgs,setPublicOrgs]=useState([]);
  const [listedEvents,setListedEvents]=useState([]);
  const [linkedOrgs,setLinkedOrgs]=useState([]);
  const [orgCursor,setOrgCursor]=useState(null);
  const [eventCursor,setEventCursor]=useState(null);
  const [orgMore,setOrgMore]=useState(false);
  const [eventMore,setEventMore]=useState(false);
  const [orgBusy,setOrgBusy]=useState(false);
  const [eventBusy,setEventBusy]=useState(false);
  const [orgMoreBusy,setOrgMoreBusy]=useState(false);
  const [eventMoreBusy,setEventMoreBusy]=useState(false);
  const [partnerError,setPartnerError]=useState('');
  const [partnerEpoch,setPartnerEpoch]=useState(0);
  const partnerSeq=useRef(0);
  async function getLinkedOrgs(events){
    const ids=[...new Set((events||[]).map(e=>e.organization_id).filter(Boolean))];
    if(!ids.length)return [];
    const {data,error:e}=await supabase.from('ff_organizations').select('*').in('id',ids);
    if(e)throw e;
    return data||[];
  }
  useEffect(()=>{
    let live=true;const seq=++partnerSeq.current;
    setPublicOrgs([]);setListedEvents([]);setLinkedOrgs([]);
    setOrgCursor(null);setEventCursor(null);setOrgMore(false);setEventMore(false);
    setPartnerError('');
    setOrgBusy(!focusId);setEventBusy(!focusId);
    if(focusId)return()=>{live=false;partnerSeq.current++;};
    (async()=>{
      try{
        const [orgRes,eventRes]=await Promise.all([
          supabase.rpc('ff_partner_orgs_page',{p_limit:PARTNER_PAGE_SIZE}),
          supabase.rpc('ff_partner_events_page',{p_limit:PARTNER_PAGE_SIZE}),
        ]);
        if(orgRes.error)throw orgRes.error;
        if(eventRes.error)throw eventRes.error;
        const orgData=orgRes.data||[],eventData=eventRes.data||[];
        if(!Array.isArray(orgData)||!Array.isArray(eventData))throw new Error('Invalid partner page');
        const extra=await getLinkedOrgs(eventData);
        if(!live||seq!==partnerSeq.current)return;
        setPublicOrgs(orgData);setListedEvents(eventData);setLinkedOrgs(extra);
        setOrgCursor(marketCursor(orgData));setOrgMore(hasMarketPage(orgData,PARTNER_PAGE_SIZE));
        setEventCursor(partnerEventCursor(eventData));setEventMore(hasMarketPage(eventData,PARTNER_PAGE_SIZE));
      }catch{
        if(live&&seq===partnerSeq.current)setPartnerError('Die Partnerwelt konnte nicht geladen werden. Bitte erneut versuchen.');
      }finally{
        if(live&&seq===partnerSeq.current){setOrgBusy(false);setEventBusy(false);}
      }
    })();
    return()=>{live=false;partnerSeq.current++;};
  },[me,focusId,partnerEpoch]);
  useEffect(()=>{
    let live=true;const organizationId=focus.row?.organization_id;
    if(!focusId||!organizationId)return()=>{live=false;};
    supabase.from('ff_organizations').select('*').eq('id',organizationId).maybeSingle()
      .then(({data,error:e})=>{
        if(e)throw e;
        if(live&&data)setLinkedOrgs([data]);
      }).catch(()=>{});
    return()=>{live=false;};
  },[focusId,focus.row?.organization_id,me]);
  async function loadMorePartnerOrgs(){
    if(!orgMore||!orgCursor||orgBusy||orgMoreBusy)return;
    const seq=partnerSeq.current;setOrgMoreBusy(true);setPartnerError('');
    try{
      const {data,error:e}=await supabase.rpc('ff_partner_orgs_page',{p_limit:PARTNER_PAGE_SIZE,...orgCursor});
      if(e||!Array.isArray(data))throw e||new Error('Invalid partner org page');
      if(seq!==partnerSeq.current)return;
      setPublicOrgs(old=>appendUniqueRows(old,data));
      setOrgCursor(marketCursor(data));setOrgMore(hasMarketPage(data,PARTNER_PAGE_SIZE));
    }catch{if(seq===partnerSeq.current)setPartnerError('Weitere Einrichtungen konnten nicht geladen werden.');}
    finally{if(seq===partnerSeq.current)setOrgMoreBusy(false);}
  }
  async function loadMorePartnerEvents(){
    if(!eventMore||!eventCursor||eventBusy||eventMoreBusy)return;
    const seq=partnerSeq.current;setEventMoreBusy(true);setPartnerError('');
    try{
      const {data,error:e}=await supabase.rpc('ff_partner_events_page',{p_limit:PARTNER_PAGE_SIZE,...eventCursor});
      if(e||!Array.isArray(data))throw e||new Error('Invalid partner event page');
      const names=await getLinkedOrgs(data);
      if(seq!==partnerSeq.current)return;
      setListedEvents(old=>appendUniqueRows(old,data));
      setLinkedOrgs(old=>appendUniqueRows(old,names));
      setEventCursor(partnerEventCursor(data));setEventMore(hasMarketPage(data,PARTNER_PAGE_SIZE));
    }catch{if(seq===partnerSeq.current)setPartnerError('Weitere Partnertermine konnten nicht geladen werden.');}
    finally{if(seq===partnerSeq.current)setEventMoreBusy(false);}
  }
  const mine=organizations.filter(o=>o.owner_id===me);
  const approvedMine=mine.filter(o=>o.status==='approved');
  const allOrgs=appendUniqueRows(appendUniqueRows(organizations,publicOrgs),linkedOrgs);
  const shown=appendUniqueRows(organizations,publicOrgs).filter(o=>o.status==='approved'||o.owner_id===me);
  const events=focusId?(focus.row?[focus.row]:[]):listedEvents.filter(e=>new Date(e.starts_at)>new Date());
  async function apply(){
    if(!active||name.trim().length<3)return Alert.alert('Einrichtung','Bitte den Namen der Einrichtung angeben.');
    const ok=await applyOrg({kind,name:safeString(name,100),region_label:safeString(region,80),
       description:safeString(description,800),open_places:places});
    if(ok){setApplying(false);setName('');setDescription('');setRegion('');setPlaces(false);setPartnerEpoch(n=>n+1);}
  }
  async function postEvent(){
    const start=givenDate(eventDate,eventTime);
    const org=approvedMine.find(o=>o.id===(eventOrg||approvedMine[0]?.id));
    if(!org||!start||start<=new Date()||eventTitle.trim().length<4)
      return Alert.alert('Veranstaltung prüfen','Bitte Einrichtung, Titel und zukünftiges Datum korrekt eintragen.');
    const ok=await createPartnerEvent({organization_id:org.id,title:safeString(eventTitle,100),
       description:safeString(eventDesc,1000),region_label:safeString(eventRegion,80),starts_at:start.toISOString()});
    if(ok){setEventForm(false);setEventTitle('');setEventDesc('');setEventDate('');setPartnerEpoch(n=>n+1);}
  }
  const renderEvent=e=><Card key={e.id} style={{marginBottom:12}}>
          <Text style={[styles.eyebrow,{marginBottom:7}]}>{formatDate(e.starts_at)}</Text>
          <Text style={styles.cardTitle}>{e.title}</Text>
          <Text style={styles.micro}>{allOrgs.find(o=>o.id===e.organization_id)?.name||'Einrichtung'} · {e.region_label||'Ort auf Anfrage'}</Text>
          {e.description?<Text style={[styles.body,{marginTop:8}]}>{e.description}</Text>:null}
          {e.moderation_status==='approved'&&new Date(e.starts_at)>new Date()?<CalendarEventButton userId={me} kind="partner" id={e.id}/>:null}
          {e.creator_id===me&&e.moderation_status!=='approved'?<Text style={[styles.micro,{marginTop:10}]}>Für dich sichtbar · wartet auf Freigabe</Text>:null}
       </Card>;
  if(focusId)return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <H sub="Direkt aus deiner Suche geöffnet.">Partnerveranstaltung</H>
    <FocusedEventStatus focus={focus} clearFocus={clearFocus}/>
    {events.map(renderEvent)}
  </ScrollView>;
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
        <Switch accessibilityLabel="Freie Plätze in Einrichtung melden" value={places} onValueChange={setPlaces}/>
      </Row>
      <Text style={[styles.micro,{marginBottom:12}]}>Mit diesem Antrag wird kein verifiziertes Konto erstellt. Unsere Betreiber prüfen die Einrichtung und die Berechtigung zur Vertretung. Bis dahin bleibt das Partnerprofil verborgen.</Text>
      <Button title="Antrag kostenlos einreichen" disabled={busy||!active} onPress={apply}/>
    </Card>:null}
    <Text style={styles.sectionTitle}>Kitas und Partner</Text>
    {orgBusy?<ActivityIndicator color={C.accent}/>:null}
    {partnerError?<><Info warning>{partnerError}</Info><Button title="Partnerwelt erneut laden" mode="outline" onPress={()=>setPartnerEpoch(n=>n+1)}/></>:null}
    {shown.length===0?(orgBusy||partnerError?null:<Blank title="Partnerwelt im Aufbau" body="Nach Bestätigung der ersten Einrichtungen entstehen hier Kita-Profile, Vorstellungen und Veranstaltungen."/>):
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
    {orgMore?<Button title={orgMoreBusy?'Weitere Einrichtungen werden geladen …':'Weitere Einrichtungen laden'} disabled={orgMoreBusy} mode="outline" onPress={loadMorePartnerOrgs}/>:null}
    {approvedMine.length>0?<Card style={{marginTop:6,marginBottom:13}}>
        <Text style={styles.sectionTitle}>Flohmarkt oder Kita-Veranstaltung ankündigen</Text>
        <Button title={eventForm?'Formular schließen':'＋ Partnerveranstaltung erstellen'} mode="outline" onPress={()=>setEventForm(v=>!v)}/>
        {eventForm?<View style={{marginTop:15}}>
          <Text style={styles.label}>Für welche Einrichtung?</Text>
          <View style={styles.chipsRow}>{approvedMine.map(o=><Chip key={o.id} text={o.name} selected={(eventOrg||approvedMine[0]?.id)===o.id} onPress={()=>setEventOrg(o.id)}/>)}</View>
          <View style={{marginTop:16}}><Input label="Titel" maxLength={100} value={eventTitle} onChangeText={setEventTitle} placeholder="Sommerflohmarkt der Kita …"/></View>
          <Input label="Beschreibung" multiline maxLength={1000} value={eventDesc} onChangeText={setEventDesc}/>
          <Input label="Region" maxLength={80} value={eventRegion} onChangeText={setEventRegion}/>
          <FamilyDateFields title="Veranstaltungstermin auswählen" date={eventDate} onDateChange={setEventDate} time={eventTime} onTimeChange={setEventTime}/>
          <Button title="Veranstaltung zur Freigabe senden" disabled={busy} onPress={postEvent}/>
        </View>:null}
    </Card>:null}
    <Text style={[styles.sectionTitle,{marginTop:15}]}>Flohmärkte & Veranstaltungen</Text>
    {eventBusy?<ActivityIndicator color={C.accent}/>:null}
    {events.length===0?(eventBusy||partnerError?null:<Blank title="Noch keine Partnerveranstaltungen" body="Bestätigte Einrichtungen können hier ihre Flohmärkte und Termine bewerben."/>):
       events.map(renderEvent)}
    {eventMore?<Button title={eventMoreBusy?'Weitere Termine werden geladen …':'Weitere Partnerveranstaltungen laden'} disabled={eventMoreBusy} mode="outline" onPress={loadMorePartnerEvents}/>:null}
    <View style={{marginTop:13}}><Button title="Inklusion und Familienunterstützung" mode="ghost" onPress={openInclusion}/></View>
  </ScrollView>;
}
function MoreScreen({navigate,openInfo,openWelcome}){
  const items=MORE_ITEMS;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <H sub="Deine Kontakte, Einstellungen und unterstützenden Angebote.">Weitere Bereiche</H>
    {items.map(([id,icon,title,subtitle])=><Pressable accessibilityRole="button" accessibilityLabel={title} key={id} onPress={()=>id==='welcome'?openWelcome():navigate(id)}>
      <Card style={{marginBottom:12}}><Row><Text style={{fontSize:26,color:C.coral,width:36}}>{icon}</Text>
      <View style={{flex:1}}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.sub}>{subtitle}</Text></View>
      <Text style={{fontSize:20,color:C.accent}}>›</Text></Row></Card></Pressable>)}
    <Button title="Elternwissen & hilfreiche Links" mode="outline" onPress={openInfo}/>
  </ScrollView>;
}
function InclusionScreen({regionLabel,onOpenMap,initialQuery=''}){
 return <InclusionKnowledgeScreen regionLabel={regionLabel} onOpenMap={onOpenMap} initialQuery={initialQuery}/>;
}

function DiscoverScreen({filters,setFilters,matches,requests,me,active,busy,myProfile,verification,membership,showFamily,onContact,imageFor,blocked,hasMore,loadingMore,onLoadMore}) {
const {query,interest,onlyRegion,onlyShared,mode,cardIndex}=filters;
const update=(key,value)=>setFilters(old=>({...old,[key]:value}));
const setQuery=value=>update('query',value),setInterest=value=>update('interest',value);
const setOnlyRegion=value=>update('onlyRegion',value),setOnlyShared=value=>update('onlyShared',value);
const setMode=value=>update('mode',value),setCardIndex=value=>update('cardIndex',value);
const [showInterestFilter,setShowInterestFilter]=useState(false);
const [interestFilterQuery,setInterestFilterQuery]=useState('');
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
return <Card key={p.user_id} style={{marginBottom:12,padding:0,overflow:'hidden'}}>
<View style={styles.familyCardAccent}/>
<View style={{padding:17}}>
<Row><Avatar name={p.display_name} size={67} uri={imageFor(p.user_id)}/>
  <View style={{flex:1}}>
    <Text style={styles.cardTitle}>{p.display_name}</Text>
    <Row style={{gap:4,marginTop:6}}>
      <FamilyIcon name="pin" size={14} color={C.muted}/>
      <Text style={styles.micro}>{p.region_label||'Region nicht angegeben'}</Text>
    </Row>
    {regional?<Text style={styles.familyRegionBadge}>Aus eurer Region</Text>:null}
  </View>
  {p.match>0?<View style={styles.match}><Text style={styles.matchText}>{p.match} gemeinsam</Text></View>:null}
</Row>
{p.about?<Text style={[styles.body,{marginTop:13}]} numberOfLines={mode==='cards'?5:3}>{p.about}</Text>:null}
<View style={styles.chipsRow}>{(p.interests||[]).slice(0,mode==='cards'?8:5).map(i=><Chip key={i} text={i}/>)}</View>
<Row style={{marginTop:14,flexWrap:'wrap'}}>
<Button title="Profil ansehen" mode="outline" small style={{flex:1}} onPress={()=>showFamily(p.user_id)}/>
<Button title={existing?existing.status==='accepted'?'Verbunden':existing.status==='pending'?'Anfrage offen':'Angefragt':'Kontakt anfragen'} small disabled={busy||!!existing} style={{flex:1}} onPress={()=>onContact(p.user_id)}/>
</Row>
</View>
</Card>;
}
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
{!active?<Info warning>Dein Konto wartet noch auf persönliche Erwachsenenprüfung oder Profilfreigabe. Profilstatus: {myProfile?.moderation_status||'–'} · Verifizierung: {verification?.status||'–'}.</Info>:null}
<H sub="Gemeinsame Interessen, neue Bekanntschaften.">Familien finden</H>
<Input label="Suche nach Familie, Region oder Interesse" placeholder="z. B. Natur, Beeskow …" value={query} onChangeText={value=>updateFilter(setQuery,value)} />
<SearchResultFeedback active={!!(query.trim()||interest!=='Alle'||onlyRegion||onlyShared)} query={query} count={filtered.length}
 context="Familien entdecken" hasMore={hasMore} loading={loadingMore} hint="Nur freigegebene, freiwillig sichtbare Familienprofile."/>
<Pressable accessibilityRole="button" accessibilityState={{expanded:showInterestFilter}}
 onPress={()=>{Keyboard.dismiss();setShowInterestFilter(v=>!v);}}
 style={[styles.marketFilterToggle,{minHeight:48,marginBottom:12,alignSelf:'stretch'}]}>
 <Text style={styles.marketFilterLabel}>Filter {showInterestFilter?'−':'+'}{interest!=='Alle'||onlyRegion||onlyShared?' · aktiv':''}</Text>
 </Pressable>
 {showInterestFilter?<Card>
 <Text style={styles.label}>Interessen auswählen</Text>
 <Input label="Hobby suchen" placeholder="z. B. Bouldern, Töpfern, Brettspiele" value={interestFilterQuery}
   onChangeText={setInterestFilterQuery}/>
 <View style={[styles.chipsRow,{marginTop:8,marginBottom:12}]}>
  <Chip text="Alle" selected={interest==='Alle'} onPress={()=>{updateFilter(setInterest,'Alle');setShowInterestFilter(false);}}/>
  {filterFamilyInterests(interestFilterQuery,INTERESTS).slice(0,24).map(i=><Chip key={i} text={i} selected={interest===i} onPress={()=>{updateFilter(setInterest,i);setShowInterestFilter(false);}}/>)}
 </View>
 {filterFamilyInterests(interestFilterQuery,INTERESTS).length>24?<Text style={styles.micro}>Weitere Hobbys über das Suchfeld finden.</Text>:null}
 </Card>:null}
{showInterestFilter?<View style={styles.filterPanel}>
<Row style={{justifyContent:'space-between',marginBottom:10}}>
<View style={{flex:1}}><Text style={styles.label}>Nur meine Region</Text><Text style={styles.micro}>{myRegion?'Gleiche Region oder bekannter Ort im selben Landkreis':'Bitte zuerst deine Region im Profil auswählen'}</Text></View>
<Switch accessibilityLabel="Nur Familien aus meiner Region anzeigen" disabled={!myRegion} value={onlyRegion&&!!myRegion} onValueChange={value=>updateFilter(setOnlyRegion,value)} trackColor={{true:C.accent}}/>
</Row>
<Row style={{justifyContent:'space-between'}}>
<View style={{flex:1}}><Text style={styles.label}>Gemeinsame Hobbys</Text><Text style={styles.micro}>Mindestens ein gemeinsames Interesse</Text></View>
<Switch accessibilityLabel="Nur Familien mit gemeinsamen Hobbys anzeigen" value={onlyShared} onValueChange={value=>updateFilter(setOnlyShared,value)} trackColor={{true:C.accent}}/>
</Row>
<Button title="Filter zurücksetzen" mode="ghost" small onPress={()=>{setInterest('Alle');setOnlyRegion(false);setOnlyShared(false);setCardIndex(0);}}/>
 </View>:null}
 <Row style={{justifyContent:'space-between',marginBottom:14,marginTop:5,flexWrap:'wrap'}}>
<Text style={[styles.micro,{fontWeight:'800'}]}>{filtered.length} {filtered.length===1?'Familie':'Familien'} in geladenen Ergebnissen</Text>
<Row><Chip text="Einzelansicht" selected={mode==='cards'} onPress={()=>setMode('cards')}/><Chip text="Liste" selected={mode==='list'} onPress={()=>setMode('list')}/></Row>
</Row>
{!active?<Blank title="Zunächst Freigabe abwarten" body="Sobald das Konto geprüft ist, erscheinen freigegebene Familienprofile."/>:
filtered.length===0?<Blank title="Noch keine passenden Familien" icon="users"
  body="Vielleicht sind noch wenige Familien aktiv. Passe die Filter an oder schau später wieder vorbei."
  actionLabel="Filter zurücksetzen"
  onAction={()=>{setQuery('');setInterest('Alle');setOnlyRegion(false);setOnlyShared(false);setCardIndex(0);}}/>:
mode==='cards'?<>
<Text style={[styles.sub,{textAlign:'center',marginBottom:12}]}>Familie {index+1} von {filtered.length} · Du entscheidest, wen du kontaktierst.</Text>
{familyCard(filtered[index])}
<Row style={{justifyContent:'space-between',gap:12}}>
<Button title="← Zurück" mode="outline" disabled={index===0} style={{flex:1}} onPress={()=>setCardIndex(index-1)}/>
<Button title="Nächste Familie →" mode="outline" disabled={index===filtered.length-1} style={{flex:1}} onPress={()=>setCardIndex(index+1)}/>
</Row>
</>:filtered.map(p=>familyCard(p))}
{hasMore?<View style={{marginTop:14}}><Button title={loadingMore?'Weitere Familien werden geladen …':'Weitere Familien laden'} disabled={loadingMore} mode="outline" onPress={onLoadMore}/></View>:null}
<Text style={[styles.micro,{marginTop:17,textAlign:'center'}]}>Die Suche berücksichtigt bisher geladene Familien. Falls du nichts Passendes siehst, lade weitere Ergebnisse. „Meine Region“ nutzt freiwillige Regionsnamen und bekannte Landkreis-Zuordnungen, keine Kilometerentfernungen. Exakte Standorte werden nicht abgefragt.</Text>
</ScrollView>;
}
function FamilyDetail({p,photos,photosUrls,photoBusy,photoBusyMore,photoHasMore,photoLoadError,loadMorePhotos,retryPhotos,active,disabled,blocked,connection,onContact,onBlock,onUnblock,onReport,onChat}){
if(!p)return <Blank title="Profil nicht verfügbar" body="Das Profil kann verborgen oder gesperrt worden sein."/>;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<View style={styles.familyDetailHero}>
  <View style={styles.familyDetailSun}/>
  <Avatar name={p.display_name} size={92} uri={photosUrls?.[photos?.[0]?.id]}/>
  <Text accessibilityRole="header" style={styles.familyDetailName}>{p.display_name}</Text>
  <Row style={{gap:5,justifyContent:'center',marginTop:8}}>
    <FamilyIcon name="pin" size={17} color={C.accentDark}/>
    <Text style={styles.familyDetailRegion}>{p.region_label||'Grobe Region nicht angegeben'}</Text>
  </Row>
  <Text style={styles.familyDetailNote}>Freiwillig sichtbares Familienprofil</Text>
</View>
<Card style={styles.familyDetailBody}>
  <Text style={styles.sectionTitle}>Über diese Familie</Text>
  <Text style={styles.body}>{p.about||'Diese Familie hat noch keine Beschreibung ergänzt.'}</Text>
  {(p.interests||[]).length?<View style={{marginTop:19}}>
    <Text style={styles.sectionTitle}>Interessen & Hobbys</Text>
    <View style={styles.chipsRow}>{p.interests.map(i=><Chip text={i} key={i}/>)}</View>
  </View>:null}
  <View style={styles.familyDetailActions}>
    {!blocked&&connection?.status==='accepted'?
      <Button title="Private Nachricht schreiben" disabled={disabled} onPress={()=>onChat(connection.id)}/>:
      !blocked&&active?<Button title={connection?'Kontaktanfrage vorhanden':'Kontakt anfragen'}
        disabled={disabled||!!connection} onPress={onContact}/>:null}
    {blocked?<Text style={styles.familyDetailBlocked}>Diese Familie ist von dir blockiert.</Text>:null}
    <Row style={{marginTop:10}}>
      {blocked?<Button title="Entsperren" mode="outline" small disabled={disabled} onPress={onUnblock}/>:
        <Button title="Blockieren" mode="outline" small disabled={disabled} onPress={onBlock}/>}
      <Button title="Melden" mode="ghost" small disabled={disabled} onPress={onReport}/>
    </Row>
  </View>
</Card>
{photoBusy?<ActivityIndicator color={C.accent}/>:null}
{photoLoadError?<><Info warning>{photoLoadError}</Info><Button title="Fotos erneut laden" mode="outline" onPress={retryPhotos}/></>:null}
{photos?.length>0?<><H sub="Freigegebene Fotos sind nur bestätigten Kontakten sichtbar.">Familienbilder</H><View style={styles.photoGrid}>{photos.map(photo=><Card key={photo.id} style={styles.photoCard}>{photosUrls[photo.id]?<Image accessibilityLabel={photo.caption||"Familienfoto ohne Bildbeschreibung"} source={{uri:photosUrls[photo.id]}} style={styles.photoImage}/>:null}<Text style={styles.micro}>{photo.caption||'Profilfoto'}</Text></Card>)}</View></>:null}
{photoHasMore?<Button title={photoBusyMore?'Weitere Bilder werden geladen …':'Weitere Familienbilder laden'} disabled={photoBusyMore} mode="outline" onPress={loadMorePhotos}/>:null}
</ScrollView>;
}
function ContactsScreen({focusId,pending,accepted,me,nameOf,respond,blocked,disabled,onBlock,onUnblock,onChat,hasMore,loadingMore,onLoadMore}){
  const byFocus=(a,b)=>Number(b.id===focusId)-Number(a.id===focusId);
  const waiting=[...pending].sort(byFocus);
  const connected=[...accepted].sort(byFocus);
  const other=c=>c.sender_id===me?c.recipient_id:c.sender_id;
  const items=[
    {kind:'header',key:'pending-header',title:'Offene Anfragen'},
    ...waiting.map(row=>({kind:'pending',key:'pending-'+row.id,row})),
    ...(!waiting.length?[{kind:'empty-pending',key:'no-pending'}]:[]),
    {kind:'header',key:'accepted-header',title:'Bestätigte Kontakte'},
    ...connected.map(row=>({kind:'accepted',key:'accepted-'+row.id,row})),
    ...(!connected.length?[{kind:'empty-accepted',key:'no-accepted'}]:[])
  ];
  function renderContact({item}){
    if(item.kind==='header')return <Text style={styles.sectionTitle}>{item.title}</Text>;
    if(item.kind==='empty-pending')return <Blank title="Keine offenen Anfragen" body="Neue Kontaktwünsche erscheinen hier."/>;
    if(item.kind==='empty-accepted')return <Blank title="Noch keine Kontakte" body="Bestätigte Familien erscheinen hier."/>;
    const c=item.row,uid=other(c);
    if(item.kind==='pending')return <Card style={{marginBottom:10,borderColor:c.id===focusId?C.accent:C.line,borderWidth:c.id===focusId?2:1}}>
      <Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text>
      <Text style={styles.micro}>{c.recipient_id===me?'Möchte dich kennenlernen':'Von dir angefragt'}</Text></View></Row>
      <Row style={{marginTop:13}}>{c.recipient_id===me?<>
        <Button title="Annehmen" small disabled={disabled} onPress={()=>respond(c.id,'accepted')} style={{flex:1}}/>
        <Button title="Ablehnen" mode="outline" small disabled={disabled} onPress={()=>respond(c.id,'declined')} style={{flex:1}}/>
      </>:<Button title="Zurückziehen" small mode="outline" disabled={disabled} onPress={()=>respond(c.id,'cancelled')}/>}</Row>
    </Card>;
    return <Card style={{marginBottom:10,borderColor:c.id===focusId?C.accent:C.line,borderWidth:c.id===focusId?2:1}}>
      <Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text>
      <Text style={styles.micro}>{blocked(uid)?'Blockiert':'Kontakt bestätigt'}</Text></View></Row>
      <Row style={{marginTop:12}}>
        <Button title="Nachrichten" small disabled={blocked(uid)} onPress={()=>onChat(c.id)} style={{flex:1}}/>
        {blocked(uid)?<Button title="Entsperren" small mode="outline" onPress={()=>onUnblock(uid)}/>:
        <Button title="Blockieren" small mode="outline" onPress={()=>onBlock(uid)}/>}
      </Row>
    </Card>;
  }
  return <FlatList style={styles.scroll} contentContainerStyle={styles.content}
    data={items} keyExtractor={item=>item.key} renderItem={renderContact}
    initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<H sub="Nachrichten sind erst nach gegenseitiger Bestätigung möglich.">Deine Kontakte</H>}
    ListFooterComponent={hasMore?<View style={{marginTop:13}}>
      <Button title={loadingMore?'Kontakte werden geladen …':'Weitere Kontakte laden'}
        mode="outline" disabled={loadingMore} onPress={onLoadMore}/>
    </View>:null}/>;
}
function ChatList({contacts,me,nameOf,onChat,blocked,hasMore,loadingMore,onLoadMore}){
  const [previews,setPreviews]=useState({});
  const [previewError,setPreviewError]=useState('');
  const [previewRetry,setPreviewRetry]=useState(0);
  const alreadyLoaded=useRef(new Set());
  const previewSeq=useRef(0);
  const idsKey=contacts.map(c=>c.id).join(',');
  useEffect(()=>{
    alreadyLoaded.current=new Set();
    setPreviews({});setPreviewError('');
  },[me]);
  useEffect(()=>{
    const seq=++previewSeq.current;let live=true;
    const ids=(idsKey?idsKey.split(','):[]).filter(id=>!alreadyLoaded.current.has(id));
    if(!me||!ids.length)return()=>{live=false;previewSeq.current++;};
    (async()=>{
      // Load only previews added by new contacts; never refetch the entire
      // previously loaded conversation list when a page is appended.
      for(let index=0;index<ids.length;index+=50){
        const batch=ids.slice(index,index+50);
        const {data,error:e}=await retryRead(
          ()=>supabase.rpc('ff_chat_previews',{p_contact_ids:batch}),
          {isCurrent:()=>live&&previewSeq.current===seq}
        );
        if(e||!Array.isArray(data))throw e||new Error('Invalid chat preview page');
        if(!live||previewSeq.current!==seq)return;
        const patch={};
        for(const row of data)if(row?.contact_id&&batch.includes(row.contact_id))patch[row.contact_id]=row.body;
        batch.forEach(id=>alreadyLoaded.current.add(id));
        setPreviews(old=>({...old,...patch}));
      }
      if(live&&previewSeq.current===seq)setPreviewError('');
    })().catch(()=>{
      if(live&&previewSeq.current===seq)setPreviewError('Die neuesten Nachrichten-Vorschauen konnten nicht geladen werden.');
    });
    return()=>{live=false;previewSeq.current++;};
  },[me,idsKey,previewRetry]);

  return <FlatList style={styles.scroll} contentContainerStyle={styles.content}
    data={contacts} extraData={previews} keyExtractor={c=>c.id} initialNumToRender={12}
    maxToRenderPerBatch={12} windowSize={7}
    ListHeaderComponent={<>
      <H sub="Persönlich und privat – nur mit bestätigten Familien.">Nachrichten</H>
      {previewError?<View style={{marginBottom:12}}>
        <Info warning>{previewError}</Info>
        <Button title="Vorschauen erneut laden" mode="outline" onPress={()=>setPreviewRetry(n=>n+1)}/>
      </View>:null}
    </>}
    ListEmptyComponent={<Blank title="Noch keine Gespräche" body="Sobald eine Kontaktanfrage angenommen wurde, kannst du eine Nachricht schreiben."/>}
    renderItem={({item:c})=>{
      const uid=c.sender_id===me?c.recipient_id:c.sender_id;
      const isBlocked=blocked(uid);
      return <Pressable accessibilityRole="button"
        accessibilityLabel={'Gespräch mit '+nameOf(uid)+(isBlocked?' ist blockiert':' öffnen')}
        accessibilityState={{disabled:isBlocked}} disabled={isBlocked}
        key={c.id} onPress={()=>onChat(c.id)} style={isBlocked&&{opacity:0.65}}>
        <Card style={{marginBottom:11}}><Row><Avatar name={nameOf(uid)}/>
          <View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text>
            <Text numberOfLines={1} style={styles.sub}>{isBlocked?'Kontakt blockiert':previews[c.id]||'Noch keine Nachrichten'}</Text>
          </View><Text style={{fontSize:23,color:C.accent}}>›</Text>
        </Row></Card>
      </Pressable>;
    }}
    ListFooterComponent={hasMore?<View style={{marginTop:13}}>
      <Button title={loadingMore?'Kontakte werden geladen …':'Weitere Gespräche anzeigen'}
        disabled={loadingMore} mode="outline" onPress={onLoadMore}/>
    </View>:null}/>;
}
function ChatScreen({contact,me,nameOf,disabled,blocked,send,onReport,onBlock,onDraftChange}) {
const [text,setText]=useState('');
const [sending,setSending]=useState(false);
const sendingRef=useRef(false);
const [sendError,setSendError]=useState('');
const [showChatOptions,setShowChatOptions]=useState(false);
useEffect(()=>{onDraftChange?.(!!text.trim());},[text,onDraftChange]);
const [showMessageTemplates,setShowMessageTemplates]=useState(false);
const [messageTemplateId,setMessageTemplateId]=useState(null);
const [messages,setMessages]=useState([]);
const [hasOlder,setHasOlder]=useState(false);
const [chatLoading,setChatLoading]=useState(false);
const [olderLoading,setOlderLoading]=useState(false);
const [chatError,setChatError]=useState('');
const [refreshToken,setRefreshToken]=useState(0);
const requestSeq=useRef(0);
const chatScrollRef=useRef(null);
const scrollToLatestRef=useRef(false);
const contactId=contact?.id;
useEffect(()=>{
  const seq=++requestSeq.current;
  if(!contactId){setMessages([]);setHasOlder(false);setChatLoading(false);return;}
  let live=true;
  setMessages([]);setHasOlder(false);setChatError('');setChatLoading(true);
  supabase.rpc('ff_chat_page',{p_contact_id:contactId,p_limit:SOCIAL_PAGE_SIZE})
    .then(({data,error:e})=>{
      if(!live||requestSeq.current!==seq)return;
      if(e||!Array.isArray(data))throw e||new Error('Invalid chat page');
      scrollToLatestRef.current=true;
      setMessages(data);setHasOlder(hasNextSocialPage(data));
    })
    .catch(()=>{if(live&&requestSeq.current===seq)setChatError('Gespräch konnte nicht geladen werden.');})
    .finally(()=>{if(live&&requestSeq.current===seq)setChatLoading(false);});
  return()=>{live=false;requestSeq.current++;};
},[contactId,me,refreshToken]);
async function loadOlder(){
  const cursor=socialCursor(messages);
  if(!contactId||!hasOlder||olderLoading||chatLoading||!cursor)return;
  const seq=requestSeq.current;
  setOlderLoading(true);setChatError('');
  try{
    const {data,error:e}=await supabase.rpc('ff_chat_page',{p_contact_id:contactId,p_limit:SOCIAL_PAGE_SIZE,...cursor});
    if(requestSeq.current!==seq)return;
    if(e||!Array.isArray(data))throw e||new Error('Invalid chat page');
    scrollToLatestRef.current=false;
    setMessages(old=>appendUniqueRows(old,data));setHasOlder(hasNextSocialPage(data));
  }catch{if(requestSeq.current===seq)setChatError('Ältere Nachrichten konnten nicht geladen werden.');}
  finally{if(requestSeq.current===seq)setOlderLoading(false);}
}
async function submit(){
  const body=text.trim();if(!body||disabled||sendingRef.current||!contact||blocked(contact.sender_id===me?contact.recipient_id:contact.sender_id))return;
  if(hasTemplatePlaceholders(body))return Alert.alert('Nachrichtenvorlage ergänzen','Bitte ersetze alle markierten Angaben vor dem Senden.');
  sendingRef.current=true;setSending(true);setSendError('');
  try{
    const ok=await send(body);
    if(ok){setText('');setMessageTemplateId(null);setRefreshToken(x=>x+1);}
    else setSendError('Versand nicht bestätigt. Dein Text bleibt erhalten. Prüfe die Rückmeldung oben, bevor du erneut sendest.');
  }catch{setSendError('Versand nicht bestätigt. Dein Text bleibt erhalten.');}
  finally{sendingRef.current=false;setSending(false);}
}
if(!contact)return <Blank title="Gespräch nicht verfügbar" body="Kontakt ist nicht mehr bestätigt oder wurde verborgen."/>;
const other=contact.sender_id===me?contact.recipient_id:contact.sender_id;
const sorted=[...messages].reverse();
return <View style={{flex:1}}>
<Row style={styles.chatHeader}><Avatar name={nameOf(other)} size={38}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other)}</Text><Text style={styles.micro}>Privates Gespräch</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Gesprächsoptionen" accessibilityState={{expanded:showChatOptions}} onPress={()=>setShowChatOptions(v=>!v)} style={{minHeight:44,minWidth:44,padding:8,justifyContent:'center',alignItems:'center'}}><FamilyIcon name="menu" size={23}/></Pressable></Row>
{showChatOptions?<View style={{padding:12,backgroundColor:C.paper,borderBottomWidth:1,borderBottomColor:C.line}}><Button title="Kontakt blockieren" mode="outline" disabled={sending||disabled||blocked(other)} onPress={()=>{setShowChatOptions(false);onBlock(other);}}/><Button title="Optionen schließen" mode="ghost" small onPress={()=>setShowChatOptions(false)}/></View>:null}
<ScrollView ref={chatScrollRef} style={{flex:1}} contentContainerStyle={{padding:16}} keyboardShouldPersistTaps="handled"
onContentSizeChange={()=>{if(scrollToLatestRef.current){chatScrollRef.current?.scrollToEnd({animated:false});scrollToLatestRef.current=false;}}}>
{chatLoading?<ActivityIndicator color={C.accent}/>:null}
{chatError?<Info warning>{chatError}</Info>:null}
{chatError&&messages.length===0?<Button title="Erneut versuchen" mode="outline" onPress={()=>setRefreshToken(x=>x+1)}/>:null}
{hasOlder?<Button title={olderLoading?'Ältere Nachrichten werden geladen …':'Ältere Nachrichten laden'} mode="outline" disabled={olderLoading||chatLoading} onPress={loadOlder}/>:null}
{!chatLoading&&messages.length===0&&!chatError?<Blank title="Sag Hallo!" body="Hier beginnt euer privates Gespräch."/>:
sorted.map(m=><View key={m.id} style={[styles.bubble,m.sender_id===me?styles.mine:styles.theirs]}>
<Text style={[styles.bubbleText,m.sender_id===me&&{color:C.white}]}>{m.body}</Text>
<Row style={{justifyContent:'space-between',marginTop:7}}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>{formatDate(m.created_at)}</Text>{m.sender_id!==me?<Pressable accessibilityRole="button" accessibilityLabel={'Nachricht vom '+formatDate(m.created_at)+' melden'} hitSlop={10} onPress={()=>onReport(m.id)}><Text style={[styles.micro,m.sender_id===me&&{color:'#E4F6F6'}]}>Melden</Text></Pressable>:null}</Row>
</View>)}
</ScrollView>
{blocked(other)?<Info warning>Du hast diese Person blockiert. Neue Nachrichten sind nicht erlaubt.</Info>:
<View>
  <Pressable accessibilityRole="button" accessibilityLabel="Nachrichtenvorlagen anzeigen"
    accessibilityState={{expanded:showMessageTemplates}}
    disabled={sending} onPress={()=>setShowMessageTemplates(v=>!v)}
    style={{minHeight:44,paddingHorizontal:16,paddingVertical:10}}>
    <Text style={{fontSize:14,color:C.accentDark,fontWeight:'800'}}>{showMessageTemplates?'Vorlagen ausblenden −':'✦ Nachrichtenvorlage nutzen +'}</Text>
  </Pressable>
  {showMessageTemplates&&!sending?<DraftTemplatePicker title="Nachricht als Entwurf vorbereiten"
    templates={MESSAGE_DRAFT_TEMPLATES} selectedId={messageTemplateId}
    hint="Beispiele für den Gesprächseinstieg. Vor dem Senden anpassen; es wird niemals automatisch gesendet."
    onPick={template=>{
      const apply=()=>{setText(template.body);setMessageTemplateId(template.id);setShowMessageTemplates(false);};
      if(text.trim())Alert.alert('Deine Nachricht ersetzen?','Dein bisheriger Text wird durch die Vorlage ersetzt.',[
        {text:'Weiter schreiben',style:'cancel'},{text:'Vorlage nutzen',onPress:apply}
      ]);else apply();
    }}/>:null}
  {sendError?<Text accessibilityLiveRegion="polite" style={{fontSize:13,color:C.danger,paddingHorizontal:16,paddingBottom:7}}>{sendError}</Text>:null}
  <Row style={styles.chatComposer}><TextInput accessibilityLabel="Private Nachricht schreiben" placeholder="Nachricht schreiben …" value={text} editable={!sending} onChangeText={value=>{setText(value);setSendError('');}} maxLength={2000} multiline
  placeholderTextColor={C.muted} style={[styles.input,{flex:1,maxHeight:100,marginBottom:0}]}/><Button title={sending?'Sendet …':'Senden'} small disabled={disabled||sending||!text.trim()||hasTemplatePlaceholders(text)} onPress={submit}/></Row>
  {hasTemplatePlaceholders(text)?<Text accessibilityLiveRegion="polite" style={{fontSize:13,color:C.muted,paddingHorizontal:16,paddingBottom:7}}>Ersetze die Angaben in eckigen Klammern, bevor du sendest.</Text>:null}
</View>}
</View>;
}
// Resolve the exact clicked result again under the current account, never trust a cached search card.
function useFocusedEvent(table,id,owner){
 const [state,setState]=useState({id:null,owner:null,row:null,status:'idle'});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let live=true;
  if(!id||!owner)return;
  setState({id,owner,row:null,status:'loading'});
  (async()=>{
   const {data,error}=await supabase.from(table).select('*').eq('id',id).eq('moderation_status','approved').gt('starts_at',new Date().toISOString()).maybeSingle();
   if(!live)return;
   setState({id,owner,row:error?null:data,status:error?'error':data?'ready':'missing'});
  })().catch(()=>{if(live)setState({id,owner,row:null,status:'error'});});
  return()=>{live=false;};
 },[table,id,owner,retry]);
 const visible=state.id===id&&state.owner===owner?state:{row:null,status:'loading'};
 return {...visible,retry:()=>setRetry(n=>n+1)};
}
function FocusedEventStatus({focus,clearFocus}){
 return <View style={{gap:8,marginVertical:10}}>
  <Button title="Alle Veranstaltungen anzeigen" mode="outline" onPress={clearFocus}/>
  {focus.status==='loading'?<Text accessibilityLiveRegion="polite" style={styles.sub}>Veranstaltung wird geprüft …</Text>:null}
  {focus.status==='missing'?<Info>Diese Veranstaltung ist nicht mehr verfügbar.</Info>:null}
  {focus.status==='error'?<><Info warning>Veranstaltung konnte nicht geladen werden.</Info><Button title="Erneut versuchen" mode="outline" onPress={focus.retry}/></>:null}
 </View>;
}
function EventPendingPanel({eventId,me,busy,profiles,replyEvent}){
const [open,setOpen]=useState(false);
const [rows,setRows]=useState([]);
const [cursor,setCursor]=useState(null);
const [hasMore,setHasMore]=useState(false);
const [loading,setLoading]=useState(false);
const [loadingMore,setLoadingMore]=useState(false);
const [error,setError]=useState('');
const [revision,setRevision]=useState(0);
const seqRef=useRef(0);
useEffect(()=>{
 const seq=++seqRef.current;
 if(!open)return()=>{seqRef.current++;};
 let live=true;
 setLoading(true);setLoadingMore(false);setRows([]);setHasMore(false);setCursor(null);setError('');
 (async()=>{
  const {data,error:e}=await supabase.rpc('ff_event_pending_page',
    {p_event_id:eventId,p_limit:EVENT_PAGE_SIZE});
  if(e||!Array.isArray(data))throw e||new Error('Ungültige Antwort');
  if(!live||seqRef.current!==seq)return;
  setRows(data);setCursor(descendingRowCursor(data,'requester_id'));setHasMore(hasFullPage(data,EVENT_PAGE_SIZE));
 })().catch(()=>{if(live&&seqRef.current===seq)setError('Teilnahmeanfragen konnten nicht geladen werden.');})
 .finally(()=>{if(live&&seqRef.current===seq)setLoading(false);});
 return()=>{live=false;seqRef.current++;};
},[eventId,me,open,revision]);
async function loadMore(){
 if(!cursor||!hasMore||loadingMore||loading)return;
 const seq=seqRef.current;setLoadingMore(true);
 try{
  const {data,error:e}=await supabase.rpc('ff_event_pending_page',
    {p_event_id:eventId,p_limit:EVENT_PAGE_SIZE,...cursor});
  if(e||!Array.isArray(data))throw e||new Error('Ungültige Antwort');
  if(seqRef.current!==seq)return;
  setRows(old=>appendUniqueRows(old,data,'requester_id'));
  setCursor(descendingRowCursor(data,'requester_id'));
  setHasMore(hasFullPage(data,EVENT_PAGE_SIZE));
  setError('');
 }catch{if(seqRef.current===seq)setError('Weitere Anfragen konnten nicht geladen werden.');}
 finally{if(seqRef.current===seq)setLoadingMore(false);}
}
async function respond(requesterId,status){
 const ok=await replyEvent(eventId,requesterId,status);
 if(ok)setRevision(n=>n+1);
}
return <View style={{marginTop:12}}>
<Button title={open?'Teilnahmeanfragen schließen':'Teilnahmeanfragen anzeigen'} small mode="outline" onPress={()=>setOpen(x=>!x)}/>
{open?<View style={{marginTop:10}}>
{loading?<ActivityIndicator color={C.accent}/>:null}
{error?<Info warning>{error}</Info>:null}
{rows.length===0&&!loading&&!error?<Text style={styles.micro}>Keine offenen Anfragen.</Text>:null}
{rows.map(r=><View key={r.requester_id} style={{marginTop:9}}>
 <Text style={styles.body}>{profiles.find(p=>p.user_id===r.requester_id)?.display_name||'Anfragende Familie'}</Text>
 <Row><Button title="Annehmen" small disabled={busy} onPress={()=>respond(r.requester_id,'approved')}/>
 <Button title="Ablehnen" small mode="outline" disabled={busy} onPress={()=>respond(r.requester_id,'declined')}/></Row>
</View>)}
{hasMore?<Button title={loadingMore?'Weitere Anfragen werden geladen …':'Weitere Anfragen laden'} mode="outline" disabled={loadingMore} onPress={loadMore}/>:null}
{error&&!loading?<Button title="Erneut versuchen" mode="outline" onPress={()=>setRevision(n=>n+1)}/>:null}
</View>:null}
</View>;
}
function EventsScreen({focusId,clearFocus,me,active,busy,profiles,showForm,setShowForm,createEvent,requestEvent,replyEvent,reportEvent,onDraftChange}){
const focus=useFocusedEvent('events',focusId,me);
const [events,setEvents]=useState([]);
 const [eventView,setEventView]=useState('official');
 useEffect(()=>{if(focusId||showForm)setEventView('family');},[focusId,showForm]);
const [myRequests,setMyRequests]=useState([]);
const [focusedRequest,setFocusedRequest]=useState(null);
const [focusedRequestBusy,setFocusedRequestBusy]=useState(false);
const [focusedRequestError,setFocusedRequestError]=useState(false);
const [cursor,setCursor]=useState(null);
const [hasMore,setHasMore]=useState(false);
const [loading,setLoading]=useState(true);
const [loadingMore,setLoadingMore]=useState(false);
const [loadError,setLoadError]=useState('');
const [revision,setRevision]=useState(0);
const seqRef=useRef(0);
const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [region,setRegion]=useState('');
const [eventTemplateId,setEventTemplateId]=useState(null);
const [date,setDate]=useState('');const [time,setTime]=useState('15:00');const [count,setCount]=useState('10');const [visibility,setVisibility]=useState('community');
useEffect(()=>{onDraftChange?.(!!showForm&&!!(title.trim()||description.trim()||region.trim()||date||time!=='15:00'||count!=='10'||visibility!=='community'));},[onDraftChange,showForm,title,description,region,date,time,count,visibility]);
async function ownRequestsFor(rows){
 const ids=rows.map(row=>row.id).slice(0,EVENT_PAGE_SIZE);
 if(!ids.length)return [];
 const {data,error:e}=await supabase.rpc('ff_my_event_requests',{p_event_ids:ids});
 if(e||!Array.isArray(data))throw e||new Error('Ungültiger Teilnahmestatus');
 return data;
}
useEffect(()=>{
 const seq=++seqRef.current;let live=true;
 setEvents([]);setMyRequests([]);setHasMore(false);setCursor(null);setLoading(true);setLoadingMore(false);setLoadError('');
 (async()=>{
  const {data,error:e}=await supabase.rpc('ff_events_page',{p_limit:EVENT_PAGE_SIZE});
  if(e||!Array.isArray(data))throw e||new Error('Ungültige Veranstaltungsliste');
  const mine=await ownRequestsFor(data);
  if(!live||seqRef.current!==seq)return;
  setEvents(data);setMyRequests(mine);
  setCursor(ascendingEventCursor(data));setHasMore(hasFullPage(data,EVENT_PAGE_SIZE));
 })().catch(()=>{if(live&&seqRef.current===seq)setLoadError('Veranstaltungen konnten nicht geladen werden.');})
 .finally(()=>{if(live&&seqRef.current===seq)setLoading(false);});
 return()=>{live=false;seqRef.current++;};
},[me,revision]);
useEffect(()=>{
 let live=true;
 setFocusedRequest(null);setFocusedRequestError(false);
 setFocusedRequestBusy(!!focusId&&!!focus.row?.id);
 if(focusId&&focus.row?.id){
   supabase.rpc('ff_my_event_requests',{p_event_ids:[focus.row.id]})
     .then(({data,error:e})=>{
       if(e)throw e;
       if(live)setFocusedRequest(Array.isArray(data)?data[0]||null:null);
     }).catch(()=>{if(live){setFocusedRequest(null);setFocusedRequestError(true);}})
     .finally(()=>{if(live)setFocusedRequestBusy(false);});
 }
 return()=>{live=false;};
},[focusId,focus.row?.id,me,revision]);
async function loadMoreEvents(){
 if(!cursor||!hasMore||loadingMore||loading)return;
 const seq=seqRef.current;setLoadingMore(true);setLoadError('');
 try{
  const {data,error:e}=await supabase.rpc('ff_events_page',{p_limit:EVENT_PAGE_SIZE,...cursor});
  if(e||!Array.isArray(data))throw e||new Error('Ungültige Veranstaltungsliste');
  const mine=await ownRequestsFor(data);
  if(seqRef.current!==seq)return;
  setEvents(old=>appendUniqueRows(old,data));
  setMyRequests(old=>appendUniqueRows(old,mine,'event_id'));
  setCursor(ascendingEventCursor(data));setHasMore(hasFullPage(data,EVENT_PAGE_SIZE));
 }catch{if(seqRef.current===seq)setLoadError('Weitere Veranstaltungen konnten nicht geladen werden.');}
 finally{if(seqRef.current===seq)setLoadingMore(false);}
}
async function submit(){
 if(hasTemplatePlaceholders(description)||hasTemplatePlaceholders(title))
   return Alert.alert('Vorlage ergänzen','Ersetze alle Felder mit [ergänzen] vor dem Einreichen oder entferne nicht benötigte Angaben.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return Alert.alert('Termin prüfen','Bitte Datum als JJJJ-MM-TT und Zeit als HH:MM eingeben.');
 const start=givenDate(date,time);const max=parseInt(count,10);
 if(!start||start<=new Date()||title.trim().length<4||max<2||max>50)return Alert.alert('Bitte prüfen','Titel, zukünftigen Beginn und Teilnehmerzahl (2–50) korrigieren.');
 const ok=await createEvent({title:safeString(title,100),description:safeString(description,1000),region_label:safeString(region,80),starts_at:start.toISOString(),ends_at:new Date(start.getTime()+2*60*60*1000).toISOString(),max_participants:max,visibility});
 if(ok){setShowForm(false);setEventView('family');setTitle('');setDescription('');setRegion('');setDate('');setTime('15:00');setCount('10');setVisibility('community');setEventTemplateId(null);setRevision(n=>n+1);}
}
async function requestAndRefresh(id){
 const ok=await requestEvent(id);
 if(ok)setRevision(n=>n+1);
}
const upcoming=focusId?(focus.row?[focus.row]:[]):events.filter(e=>new Date(e.ends_at)>new Date());
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
<H sub="Ausflüge und gemeinsame Zeit planen.">Veranstaltungen</H>
 {!showForm&&!focusId?<View style={[styles.chipsRow,{marginTop:0,marginBottom:12}]}>
  <Chip text="Öffentliche Termine" selected={eventView==='official'} onPress={()=>setEventView('official')}/>
  <Chip text="Familientreffen" selected={eventView==='family'} onPress={()=>setEventView('family')}/>
 </View>:null}
{!focusId&&(showForm||eventView==='family')?<Button title={showForm?'Zum Überblick':'＋ Treffen erstellen'} disabled={!active} mode={showForm?'outline':'primary'} onPress={()=>{if(!showForm){setShowForm(true);return;}if(title.trim()||description.trim()||region.trim()||date||time!=='15:00'||count!=='10'||visibility!=='community'){Alert.alert('Entwurf verwerfen?','Deine Eingaben werden gelöscht.',[{text:'Weiter bearbeiten',style:'cancel'},{text:'Verwerfen',style:'destructive',onPress:()=>{setTitle('');setDescription('');setRegion('');setDate('');setTime('15:00');setCount('10');setVisibility('community');setEventTemplateId(null);setShowForm(false);}}]);}else setShowForm(false);}}/>:null}
{showForm?<Card style={{marginTop:14}}>
<Text style={styles.cardTitle}>Neue Aktivität</Text>
<Text style={[styles.sub,{marginBottom:15}]}>Gemeinsame Treffen werden weiterhin vor einer öffentlichen Veröffentlichung geprüft. Bitte keine Privatadressen veröffentlichen.</Text>
<CompletionPrompt title="Deine Veranstaltung vorbereiten" items={[
  {label:'Titel mit mindestens vier Zeichen',done:title.trim().length>=4},
  {label:'Datum und Uhrzeit in der Zukunft',done:!!givenDate(date,time)&&givenDate(date,time)>new Date()},
  {label:'Teilnehmendenzahl 2 bis 50',done:Number(count)>=2&&Number(count)<=50},
  {label:'Entwurf vollständig ausgefüllt',done:!hasTemplatePlaceholders(title)&&!hasTemplatePlaceholders(description)}
]}/>
<ContextHelp title="Was gehört in eine gute Veranstaltung?">
  Alter der Kinder, ein öffentlicher Treffpunkt, Kosten, mitzubringende Dinge und – soweit bekannt – Barrierefreiheit. Die Teilnahme wird erst nach einer eigenen Anfrage bestätigt.
</ContextHelp>
 <DraftTemplatePicker title="Treffen mit Vorlage planen" templates={EVENT_DRAFT_TEMPLATES}
    selectedId={eventTemplateId}
    onPick={template=>{
      const draft=applyEventDraft(template);if(!draft)return;
      const apply=()=>{setEventTemplateId(template.id);setTitle('');
        setDescription(draft.description);setRegion('');setDate('');};
      if(title.trim()||description.trim())Alert.alert('Entwurf ersetzen?','Titel und Beschreibung des bisherigen Entwurfs werden ersetzt.',[
        {text:'Weiter bearbeiten',style:'cancel'},{text:'Vorlage nutzen',onPress:apply}
      ]);else apply();
    }}
    hint="Standardfelder für Alter, öffentlichen Treffpunkt, Programm, Kosten, Barrierefreiheit und Mitbringen."/>
<Input label="Titel" placeholder="Spielplatztreffen am Samstag" maxLength={100} value={title} onChangeText={setTitle}/>
<Input label="Beschreibung" multiline maxLength={1000} value={description} onChangeText={setDescription}/>
<Input label="Grobe Region" placeholder="z. B. Potsdam" maxLength={80} value={region} onChangeText={setRegion}/>
<FamilyDateFields title="Wann findet die Aktivität statt?" date={date} onDateChange={setDate} time={time} onTimeChange={setTime}/>
<Input label="Maximale Personen (2–50)" value={count} onChangeText={setCount} keyboardType="number-pad"/>
<Text style={styles.label}>Wer soll den Termin sehen?</Text><Row style={{marginBottom:15}}><Chip text="Alle geprüften Familien" selected={visibility==='community'} onPress={()=>setVisibility('community')}/><Chip text="Nur Kontakte" selected={visibility==='contacts'} onPress={()=>setVisibility('contacts')}/></Row>
<Button title="Zur Freigabe einreichen" disabled={busy} onPress={submit}/>
</Card>:null}
{!showForm&&eventView==='official'?<>{!focusId?<OfficialFamilyEvents userId={me}/>:null}</>:null}
 {!showForm&&(focusId||eventView==='family')?<>
 <Info>{SECTION_MESSAGES.events}</Info>
<Text style={[styles.sectionTitle,{marginTop:22}]}>Anstehende Treffen</Text>
{focusId?<FocusedEventStatus focus={focus} clearFocus={clearFocus}/>:null}
{!focusId&&loading?<ActivityIndicator color={C.accent}/>:null}
{!focusId&&loadError?<Info warning>{loadError}</Info>:null}
{!focusId&&loadError&&events.length===0?<Button title="Erneut versuchen" mode="outline" onPress={()=>setRevision(n=>n+1)}/>:null}
{upcoming.length===0&&!loading&&!loadError?(focusId?null:<Blank title="Noch keine Treffen" body="Neue Aktivitäten erscheinen hier nach Freigabe."/>):upcoming.map(e=>{
 const self=e.organizer_id===me;
 const request=(focusId&&focus.row?.id===e.id?focusedRequest:null)||myRequests.find(x=>x.event_id===e.id&&x.requester_id===me);
 return <Card key={e.id} style={{marginBottom:12}}>
 <Text style={styles.eyebrow}>▦ {formatDate(e.starts_at)}</Text><Text style={[styles.cardTitle,{fontSize:19,marginTop:5}]}>{e.title}</Text>
 <Text style={[styles.sub,{marginTop:7}]}>{e.description||'Gemeinsames Familientreffen'}</Text>
 <Text style={[styles.micro,{marginTop:10}]}>⌖ {e.region_label||'Region nach Absprache'} · max. {e.max_participants} Personen</Text>
 {e.moderation_status==='approved'&&new Date(e.ends_at)>new Date()?<CalendarEventButton userId={me} kind="family" id={e.id}/>:null}
 {self?<Info warning>{e.moderation_status==='pending'?'Dein Termin wartet auf Freigabe.':'Du organisierst diesen Termin.'}</Info>:
 focusId&&focusedRequestBusy?<Info>Teilnahmestatus wird geladen …</Info>:
 focusId&&focusedRequestError?<Info warning>Teilnahmestatus derzeit nicht verfügbar. Bitte den Termin erneut öffnen.</Info>:
 request?<Info>Deine Teilnahme: {request.status==='approved'?'bestätigt':request.status==='requested'?'angefragt':request.status==='declined'?'abgelehnt':'zurückgezogen'}</Info>:
 <Button title="Teilnahme anfragen" disabled={busy||!active} small style={{marginTop:12}} onPress={()=>requestAndRefresh(e.id)}/>}
 {self?<EventPendingPanel eventId={e.id} me={me} busy={busy} profiles={profiles} replyEvent={replyEvent}/>:null}
 {!self?<Pressable accessibilityRole="button" accessibilityLabel="Veranstaltung melden" onPress={()=>reportEvent(e.id)} style={{marginTop:12,minHeight:44,justifyContent:'center'}}><Text style={styles.micro}>⚑ Veranstaltung melden</Text></Pressable>:null}
 </Card>;
})}
{!focusId&&hasMore?<Button title={loadingMore?'Weitere Veranstaltungen werden geladen …':'Weitere Veranstaltungen laden'} mode="outline" disabled={loadingMore} onPress={loadMoreEvents}/>:null}
 </>:null}
</ScrollView>;
}
function ProfileScreen({userId,profile,verification,membership,active,photos,photosUrls,busy,photoBusy,photoBusyMore,photoHasMore,photoLoadError,loadMorePhotos,retryPhotos,save,uploadPhoto,deletePhoto,reportPhoto,blocks,onUnblock,changePassword,onDirtyChange,openInfo,openTVTopics,signOut}){
const [form,setForm]=useState(blankProfile);
const [photoCaption,setPhotoCaption]=useState('');
const [selectedPhoto,setSelectedPhoto]=useState(null);
const [photoPickerBusy,setPhotoPickerBusy]=useState(false);
const [newPassword,setNewPassword]=useState('');
const [profileSection,setProfileSection]=useState('about');
const [previewOpen,setPreviewOpen]=useState(false);
const [customOpen,setCustomOpen]=useState(false);
const [interestQuery,setInterestQuery]=useState('');
const [interestGroup,setInterestGroup]=useState('Draußen & Natur');
const [customInterest,setCustomInterest]=useState('');
useEffect(()=>{if(profile)setForm({...blankProfile,...profile,interests:Array.isArray(profile.interests)?profile.interests:[]});},[profile?.updated_at,profile?.user_id]);
const initialProfile={...blankProfile,...profile};
const dirty=!!profile&&(form.display_name!==String(initialProfile.display_name||'')||
 form.region_label!==String(initialProfile.region_label||'')||
 form.about!==String(initialProfile.about||'')||
 !!form.is_discoverable!==!!initialProfile.is_discoverable||
 JSON.stringify(form.interests||[])!==JSON.stringify(Array.isArray(initialProfile.interests)?initialProfile.interests:[])||
 !!selectedPhoto||!!photoCaption||!!newPassword||!!customInterest.trim());
useEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
function switchSection(next){
 if(next===profileSection)return;
 if(!dirty){setProfileSection(next);return;}
 Alert.alert('Ungespeicherte Profiländerungen','Einige Änderungen sind noch nicht gespeichert. Sie bleiben nur vorübergehend in diesem Bildschirm.',[
 {text:'Zurück zum Formular',style:'cancel'},
 {text:'Bereich wechseln',onPress:()=>setProfileSection(next)}
 ]);
}
async function submit(){if(busy)return;if(customInterest.trim())return Alert.alert('Hobby noch nicht hinzugefügt','Füge dein eigenes Hobby zuerst zur Auswahl hinzu oder lösche die Eingabe.');if((form.display_name||'').trim().length<2)return Alert.alert('Anzeigename fehlt','Bitte mindestens zwei Zeichen angeben.');
await save({display_name:safeString(form.display_name,60),region_label:safeString(form.region_label,80),about:safeString(form.about,500),interests:(form.interests||[]).slice(0,MAX_PROFILE_INTERESTS),is_discoverable:!!form.is_discoverable});}
function toggle(i){
 if((form.interests||[]).includes(i)){
  setForm(f=>({...f,interests:removeFamilyInterest(f.interests,i)}));return;
 }
 if((form.interests||[]).length>=MAX_PROFILE_INTERESTS){
  Alert.alert('Auswahl voll','Du kannst bis zu '+MAX_PROFILE_INTERESTS+' Interessen auswählen. Entferne zuerst ein anderes Hobby.');return;
 }
 setForm(f=>({...f,interests:addFamilyInterest(f.interests,i)}));
}
function addCustomInterest(){
 const value=normalizeInterest(customInterest);
 if(value.length<2||/[\n\r@]|https?:\/\//i.test(value)){
  Alert.alert('Hobby prüfen','Bitte ein kurzes Hobby ohne Kontaktdaten, Links oder Namen von Kindern eingeben.');return;
 }
 if(addFamilyInterest(form.interests,value,MAX_PROFILE_INTERESTS+1).length===(form.interests||[]).length){
  Alert.alert('Schon ausgewählt','Dieses Hobby steht bereits in eurer Liste.');return;
 }
 if((form.interests||[]).length>=MAX_PROFILE_INTERESTS){
  Alert.alert('Auswahl voll','Entferne zuerst ein Hobby aus deiner Auswahl.');return;
 }
 setForm(f=>({...f,interests:addFamilyInterest(f.interests,value)}));
 setCustomInterest('');setInterestQuery('');setCustomOpen(false);
}
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
<Card style={{backgroundColor:C.sunPale}}>
<Row><Avatar size={65} name={profile?.display_name}/><View style={{flex:1}}><Text style={styles.cardTitle}>{profile?.display_name||'Deine Familie'}</Text><Text style={styles.micro}>{active?'✓ Erwachsener geprüft, Profil freigegeben':'⌛ Prüfung oder Freigabe ausstehend'}</Text><Text style={styles.micro}>Mitgliedschaft: {membership?.status||'–'}</Text></View></Row>
<View style={{marginTop:15}}>
<Row style={{justifyContent:'space-between',marginBottom:6}}><Text style={styles.label}>Profil gestalten</Text><Text style={styles.micro}>{completed} von 4 freiwilligen Angaben</Text></Row>
<View style={styles.progressTrack}><View style={[styles.progressFill,{width:(completed*25)+'%'}]}/></View>
</View>
{!active?<Info warning>Neue Profilangaben werden manuell geprüft. Die Foto-/Videoverifizierung folgt erst in einer späteren Version.</Info>:null}
<Pressable accessibilityRole="button" accessibilityState={{expanded:previewOpen}} onPress={()=>setPreviewOpen(v=>!v)} style={{minHeight:48,marginTop:10,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:8}}><Text style={[styles.label,{flex:1,marginBottom:0}]}>Euer Steckbrief – Vorschau</Text><FamilyIcon name={previewOpen?'chevron-up':'chevron-down'} size={20}/></Pressable>
{previewOpen?<View style={{...UI.card,padding:14}}>
 <Text style={[styles.micro,{marginTop:4,marginBottom:9}]}>So könnten eure freiwilligen Angaben nach Freigabe aussehen.</Text>
 <Text style={styles.body}>{form.about?.trim()||'Erzählt ein wenig von euch: Welche Ausflüge, Spiele oder Hobbys mögt ihr?'}</Text>
 {form.region_label?<Text style={[styles.micro,{marginTop:10}]}>Region: {form.region_label}</Text>:null}
 {(form.interests||[]).length?<View style={[styles.chipsRow,{marginTop:9}]}>{form.interests.slice(0,6).map(i=><Chip key={i} text={i}/>)}</View>:null}
 {(form.interests||[]).length>6?<Text style={[styles.micro,{marginTop:6}]}>und weitere {(form.interests||[]).length-6} Interessen</Text>:null}
</View>:null}
</Card>
{dirty?<View accessibilityLiveRegion="polite" style={{padding:10,marginTop:8,borderRadius:12,backgroundColor:C.sunPale}}><Text style={[styles.micro,{fontWeight:'700',color:C.accentDark}]}>Du hast noch nicht gespeicherte Änderungen.</Text></View>:null}
<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:11,marginBottom:14}}>
{[['about','Über uns'],['hobbies','Hobbys'],['privacy','Sichtbarkeit'],['photos','Fotos'],['security','Konto & Sicherheit']].map(([id,title])=><Chip key={id} text={title} selected={profileSection===id} onPress={()=>switchSection(id)}/>)}
</View>
{profileSection==='about'?<Card>
<Text style={styles.sectionTitle}>Über eure Familie</Text>
<Text style={[styles.sub,{marginBottom:14}]}>Ein paar freiwillige Angaben helfen beim Kennenlernen.</Text>
<Input label="Anzeigename" value={form.display_name} onChangeText={x=>setForm(p=>({...p,display_name:x}))} maxLength={60}/>
<RegionPicker value={form.region_label} onChange={x=>setForm(p=>({...p,region_label:x}))}/>
<Input label="Über uns" multiline value={form.about} onChangeText={x=>setForm(p=>({...p,about:x}))} maxLength={500} placeholder="Wir lieben ... Am Wochenende machen wir gern ... Wir würden gern andere Familien kennenlernen für ..."/>
<Button title={busy?'Bitte warten …':'Angaben speichern'} disabled={busy} onPress={submit}/>
</Card>:null}
{profileSection==='hobbies'?<Card>
<Text style={styles.sectionTitle}>Was macht euch Freude?</Text>
<Text style={[styles.sub,{marginBottom:14}]}>Wähle passende Hobbys aus verschiedenen Bereichen oder ergänze ein eigenes. Ihr entscheidet selbst, wie viel ihr teilen möchtet.</Text>
<Row style={{justifyContent:'space-between',flexWrap:'wrap',marginBottom:8}}><Text style={[styles.label,{marginBottom:0}]}>Eure Auswahl: {(form.interests||[]).length} von {MAX_PROFILE_INTERESTS}</Text><Button title={busy?'Speichert …':'Speichern'} small disabled={busy||!dirty} onPress={submit}/></Row>
{(form.interests||[]).length?<View style={[styles.chipsRow,{marginTop:9,marginBottom:18}]}>
 {(form.interests||[]).map(i=><Chip key={i} text={i+' ×'} selected onPress={()=>toggle(i)}/>)}
</View>:<Text style={[styles.micro,{marginBottom:15}]}>Noch nichts ausgewählt. Tippe einfach auf ein Hobby.</Text>}
<Input label="Hobby finden" placeholder="z. B. Reiten, Malen, Bibliothek" value={interestQuery} onChangeText={setInterestQuery}/>
{interestQuery.trim()&&!filterFamilyInterests(interestQuery,INTERESTS).length?<Text style={styles.micro}>Dieses Hobby steht noch nicht in der Liste. Ergänze es als eigenes Hobby.</Text>:null}
<Pressable accessibilityRole="button" accessibilityState={{expanded:customOpen}} onPress={()=>{setCustomOpen(v=>!v);if(!customOpen&&!customInterest&&interestQuery.trim()&&!filterFamilyInterests(interestQuery,INTERESTS).length)setCustomInterest(interestQuery.trim().slice(0,40));}} style={{minHeight:48,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:8}}><Text style={[styles.label,{flex:1,marginBottom:0}]}>Eigenes Hobby ergänzen</Text><FamilyIcon name={customOpen?'chevron-up':'plus'} size={20}/></Pressable>
{customOpen?<View>
<Input label="Weiteres Hobby (freiwillig)" placeholder="z. B. Origami" value={customInterest} onChangeText={setCustomInterest} maxLength={40}/>
<Text style={[styles.micro,{marginBottom:12}]}>Bitte keine Kontaktdaten oder Angaben zu einzelnen Kindern eingeben. Freie Hobbys sind nach Profilfreigabe für andere sichtbar.</Text>
<Button title="Hobby hinzufügen" mode="outline" disabled={!customInterest.trim()||busy} onPress={addCustomInterest}/>
</View>:null}
{!interestQuery.trim()?<View style={[styles.chipsRow,{marginBottom:10}]}>
 <Chip text="Alle" selected={interestGroup==='Alle'} onPress={()=>setInterestGroup('Alle')}/>
 {FAMILY_INTEREST_GROUPS.map(group=><Chip key={group.title} text={group.title} selected={interestGroup===group.title} onPress={()=>setInterestGroup(group.title)}/>)}
</View>:null}
{FAMILY_INTEREST_GROUPS.filter(group=>interestQuery.trim()||interestGroup==='Alle'||group.title===interestGroup).map(group=>{
 const options=filterFamilyInterests(interestQuery,group.items);
 return options.length?<View key={group.title} style={{marginBottom:12}}>
  <Text style={[styles.label,{marginBottom:8}]}>{group.title}</Text>
  <View style={styles.chipsRow}>{options.map(i=><Chip key={i} text={i} selected={form.interests?.includes(i)} onPress={()=>toggle(i)}/>)}</View>
 </View>:null;
})}
<View style={{marginTop:16}}><Button title={busy?'Speichert …':'Interessen speichern'} disabled={busy||!dirty} onPress={submit}/></View>
</Card>:null}
{profileSection==='privacy'?<Card>
<Text style={styles.sectionTitle}>Privatsphäre & Sichtbarkeit</Text>
<Text style={[styles.sub,{marginBottom:15}]}>Du bestimmst, ob andere freigegebene Familien euch entdecken können.</Text>
<Row style={{marginBottom:18,justifyContent:'space-between'}}><View style={{flex:1}}><Text style={styles.label}>Für andere Familien sichtbar</Text><Text style={styles.micro}>Erst nach Profilfreigabe und nur mit grober Regionsangabe</Text></View><Switch accessibilityLabel="Familienprofil für andere Familien sichtbar" value={!!form.is_discoverable} onValueChange={value=>setForm(p=>({...p,is_discoverable:value}))} trackColor={{true:C.accent}}/></Row>
<Info>Deine genaue Adresse oder dein Live-Standort werden bei der Familiensuche nicht abgefragt. Kontaktanfragen musst du selbst annehmen.</Info>
<Button title={busy?'Bitte warten …':'Sichtbarkeit speichern'} disabled={busy} onPress={submit}/>
<Text style={[styles.sectionTitle,{marginTop:20}]}>Private Themen für Familienfunke TV</Text><Text style={styles.sub}>Wenn du möchtest, wähle beispielsweise Inklusion & Teilhabe oder Schwangerschaft & Baby als private Themen. Keine Diagnose, keine öffentliche Angabe. Die Auswahl bleibt auf deinem Gerät.</Text><Button title="Private TV-Themen einstellen" mode="outline" onPress={openTVTopics}/>
</Card>:null}
{profileSection==='photos'?<><Card style={{marginTop:13}}><Text style={styles.sectionTitle}>Profilfotos</Text><Text style={[styles.sub,{marginBottom:13}]}>Nur bestätigte Kontakte sehen freigegebene Bilder. Bitte während der Beta keine Kinderfotos hochladen.</Text>
<Text style={styles.label}>1. Foto auswählen</Text>
<Button title={selectedPhoto?'Anderes Foto auswählen':'＋ Foto auswählen'}
  disabled={busy||photoPickerBusy} mode="outline" onPress={selectDraftPhoto}/>
{selectedPhoto?<View style={{marginTop:14}}>
  <Image accessibilityLabel="Ausgewähltes Familienfoto. Bitte eine kurze Bildbeschreibung hinzufügen." source={{uri:selectedPhoto.uri}} style={styles.photoDraftPreview} resizeMode="contain"/>
  <Input label="2. Bildbeschreibung für Screenreader (empfohlen)" value={photoCaption}
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
{photoBusy?<ActivityIndicator color={C.accent}/>:null}
{photoLoadError?<><Info warning>{photoLoadError}</Info><Button title="Fotos erneut laden" mode="outline" onPress={retryPhotos}/></>:null}
<View style={[styles.photoGrid,{marginTop:15}]}>{photos.map(p=><Card key={p.id} style={styles.photoCard}>
{photosUrls[p.id]?<Image accessibilityLabel={p.caption||"Familienfoto ohne Bildbeschreibung"} source={{uri:photosUrls[p.id]}} style={styles.photoImage}/>:<View style={[styles.photoImage,{backgroundColor:C.pale}]}/>}
<Text style={styles.micro} numberOfLines={2}>{p.caption||'Profilbild'}</Text><Text style={[styles.micro,{color:p.moderation_status==='approved'?C.accent:C.warningText}]}>{p.moderation_status==='approved'?'Freigegeben':p.moderation_status==='pending'?'In Prüfung':'Abgelehnt'}</Text>
<Button title="Löschen" small mode="ghost" onPress={()=>deletePhoto(p.id)}/>
</Card>)}</View>
{!photoBusy&&photos.length===0&&!photoLoadError?<Text style={[styles.micro,{marginTop:10}]}>Noch keine Bilder hochgeladen.</Text>:null}
{photoHasMore?<Button title={photoBusyMore?'Weitere Fotos werden geladen …':'Weitere Profilfotos laden'} mode="outline" disabled={photoBusyMore} onPress={loadMorePhotos}/>:null}
</Card>
</>:null}
{profileSection==='security'?<><Card style={{marginTop:13}}><Text style={styles.sectionTitle}>Sicherheit und Einstellungen</Text>
<Button title="Elternwissen öffnen" mode="outline" onPress={openInfo}/>
<Text style={[styles.label,{marginTop:18}]}>Passwort ändern</Text><Input label="Neues Passwort (mindestens 12 Zeichen)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none"/>
<Button title="Passwort ändern" small mode="outline" disabled={busy||newPassword.length<12} onPress={updatePassword}/>
<BlockedAccountsPanel userId={userId} disabled={busy} onUnblock={onUnblock}/>
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
{links.map(([name,subtitle,url])=><Pressable key={name} accessibilityRole="link" accessibilityLabel={name+' – '+subtitle} onPress={()=>Linking.openURL(url)}><Card style={{marginBottom:12}}><Row><View style={{flex:1}}><Text style={styles.cardTitle}>{name}</Text><Text style={styles.sub}>{subtitle}</Text></View><Text style={{fontSize:25,color:C.accent}}>↗</Text></Row></Card></Pressable>)}
</ScrollView>;
}
const styles=StyleSheet.create({
familyCardAccent:{height:4,backgroundColor:C.sun},
familyRegionBadge:{color:C.accentDark,fontSize:11.5,fontWeight:'700',marginTop:6},
familyDetailHero:{backgroundColor:C.sunPale,borderRadius:22,paddingVertical:30,
  paddingHorizontal:18,marginBottom:13,alignItems:'center',overflow:'hidden'},
familyDetailSun:{position:'absolute',width:166,height:166,borderRadius:83,
  top:-91,right:-60,backgroundColor:'#FFDF89'},
familyDetailName:{color:C.ink,fontSize:26,fontWeight:'800',marginTop:15,textAlign:'center'},
familyDetailRegion:{color:C.accentDark,fontSize:14,fontWeight:'700'},
familyDetailNote:{color:C.muted,fontSize:12,marginTop:11,textAlign:'center'},
familyDetailBody:{padding:18,marginBottom:18},
familyDetailActions:{borderTopWidth:1,borderTopColor:C.line,marginTop:19,paddingTop:17},
familyDetailBlocked:{color:C.warningText,fontSize:13,marginBottom:7},

marketHero:{backgroundColor:C.sunPale,borderRadius:R.hero,padding:18,flexDirection:'row',
  alignItems:'center',gap:12,marginBottom:13},
marketEyebrow:{color:'#6C4A18',fontSize:10.5,letterSpacing:1.2,fontWeight:'800'},
marketHeroTitle:{fontSize:27,color:C.ink,fontWeight:'800',marginTop:5},
marketHeroText:{fontSize:13.5,color:C.ink,lineHeight:19,marginTop:5},
marketHeroIcon:{width:59,height:59,borderRadius:19,backgroundColor:C.white,
  alignItems:'center',justifyContent:'center'},
marketRulesCheck:{flexDirection:'row',gap:10,alignItems:'flex-start',
   borderWidth:1.5,borderColor:'#B7D6C8',backgroundColor:'#F0F9F3',
   borderRadius:14,padding:13,marginTop:8,marginBottom:13,minHeight:60},
marketReportButton:{marginTop:18,minHeight:48,paddingHorizontal:10,borderRadius:14,
  borderColor:C.line,borderWidth:1,backgroundColor:'#FFF5F2',
  flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center'},
marketReportText:{fontSize:14,fontWeight:'800',color:C.danger},
marketTrust:{flexDirection:'row',gap:7,alignItems:'center',
  paddingVertical:11,paddingHorizontal:10,marginBottom:12,
  borderRadius:14,backgroundColor:C.mint},
marketTrustText:{fontSize:14,color:C.accentDark,fontWeight:'700',flex:1},
marketFilterHeading:{fontSize:13,color:C.ink,fontWeight:'800',marginBottom:9},
marketGiftPill:{position:'absolute',top:9,left:8,backgroundColor:C.sunPale,
  paddingVertical:6,paddingHorizontal:10,borderRadius:10},
marketGiftText:{color:'#6C4A18',fontSize:11,fontWeight:'800'},


marketTopActions:{...UI.card,flexDirection:'row',alignItems:'center',gap:12,padding:14,marginBottom:12},
marketTopTitle:{fontSize:17,fontWeight:'900',color:C.ink,marginBottom:3},
marketDropdown:{minHeight:50,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15,paddingVertical:10,backgroundColor:C.white,borderRadius:14,borderWidth:1,borderColor:'#D0DFDE'},
marketDropdownOptions:{backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:14,marginTop:4,overflow:'hidden'},
marketDropdownOption:{minHeight:48,paddingHorizontal:15,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
marketSearchBox:{minHeight:53,backgroundColor:C.white,borderRadius:17,borderWidth:1,borderColor:'#D0DFDE',paddingHorizontal:15,flexDirection:'row',alignItems:'center',marginBottom:14},
marketSearchInput:{fontSize:16,color:C.ink,flex:1,minHeight:50},
marketFilters:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:14},
marketFilterToggle:{minHeight:47,borderRadius:14,borderWidth:1,borderColor:'#D0DFDE',backgroundColor:C.white,paddingHorizontal:10,justifyContent:'center',alignItems:'center'},
marketFilterLabel:{fontSize:14,fontWeight:'800',color:C.accentDark},
marketSortOptions:{backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:14,marginTop:5},
marketGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:13},
marketTile:{...UI.card,width:'48.3%',overflow:'hidden',minHeight:262},
marketTileImage:{width:'100%',height:184,backgroundColor:'#F1F3EF',position:'relative'},
marketTilePhoto:{width:'100%',height:'100%'},
marketImagePlaceholder:{backgroundColor:'#F4F1EB',alignItems:'center',justifyContent:'center',gap:5},
marketPricePill:{position:'absolute',top:8,left:7,right:50,backgroundColor:'#FFFFFFF2',borderRadius:11,paddingVertical:6,paddingHorizontal:9,alignSelf:'flex-start'},
marketPricePillText:{fontSize:14,fontWeight:'900',color:C.ink},
marketTileBody:{padding:12,paddingBottom:15,gap:3},
marketTileTitle:{fontSize:16,fontWeight:'700',color:C.ink,lineHeight:20,minHeight:38},
marketTilePrice:{fontSize:17,fontWeight:'800',color:C.accentDark,marginTop:6},
marketDetailCard:{padding:17,marginBottom:18},
marketDetailImage:{height:285,backgroundColor:'#F4F1EB',borderRadius:18,overflow:'hidden'},
marketFullImage:{width:'100%',height:'100%'},
marketPrice:{fontWeight:'900',color:C.accentDark},

regionDropdown:{marginTop:8,padding:10,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:17},
regionOption:{minHeight:48,paddingHorizontal:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
progressTrack:{height:8,backgroundColor:C.pale,borderRadius:10,overflow:'hidden'},
progressFill:{height:'100%',backgroundColor:C.coral,borderRadius:10},
filterPanel:{borderRadius:20,backgroundColor:C.white,borderColor:C.line,borderWidth:1,padding:15,marginBottom:14},

screen:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:'center',justifyContent:'center',gap:15,backgroundColor:C.bg},
scroll:{flex:1},content:{padding:19,paddingBottom:40},
brand:{fontSize:33,fontWeight:'900',color:C.ink,letterSpacing:-1.15,textAlign:'center'},
smallBrand:{fontSize:19,fontWeight:'900',color:C.ink,letterSpacing:-.7},tagline:{fontSize:15,color:C.muted,textAlign:'center',marginTop:9},
loginPage:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:20,backgroundColor:C.bg},
loginMark:{width:95,height:95,borderRadius:31,backgroundColor:C.sun,alignItems:'center',justifyContent:'center',marginBottom:22,transform:[{rotate:'-7deg'}]},
topBar:{minHeight:64,borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:C.white,paddingHorizontal:12,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6,paddingVertical:8},
headerMenuButton:{minWidth:44,minHeight:44,paddingHorizontal:8,flexDirection:'row',gap:3,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:C.mint},
headerMenuLabel:{fontSize:12.5,fontWeight:'800',color:C.accentDark},
headerBackButton:{minHeight:48,minWidth:83,paddingHorizontal:9,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3,borderRadius:13,borderWidth:1.5,borderColor:C.accentDark,backgroundColor:C.sunPale},
headerBackArrow:{fontSize:33,lineHeight:35,color:C.accentDark,fontWeight:'800'},headerBackLabel:{fontSize:15,color:C.accentDark,fontWeight:'800'},
inboxBell:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:C.sunPale},
inboxBadge:{position:'absolute',top:0,right:0,backgroundColor:C.accentDark,minWidth:20,borderRadius:12,paddingHorizontal:4,paddingVertical:2},
inboxBadgeText:{fontSize:12,fontWeight:'900',color:C.white,textAlign:'center'},
headerIdentity:{flex:1,minWidth:125,flexDirection:'row',alignItems:'center',gap:6},
headerHeartBadge:{width:37,height:37,borderRadius:14,backgroundColor:C.sunPale,alignItems:'center',justifyContent:'center'},
headerHeart:{fontSize:21,fontWeight:'900',color:'#9A4A43'},
topHint:{fontSize:12,color:C.muted,marginTop:1,fontWeight:'600'},
card:{...UI.card,padding:16},
hero:{backgroundColor:C.sun,borderRadius:25,paddingHorizontal:23,paddingVertical:27,marginBottom:25,overflow:'hidden',minHeight:238},
heroDecorationOne:{position:'absolute',width:165,height:165,borderRadius:83,backgroundColor:'#FFE9A3',top:-64,right:-64},
heroDecorationTwo:{position:'absolute',width:88,height:88,borderRadius:44,backgroundColor:C.peach,opacity:0.65,bottom:-37,right:22},
heroPill:{alignSelf:'flex-start',backgroundColor:C.white,borderRadius:40,paddingHorizontal:13,paddingVertical:7,marginBottom:12},
heroPillText:{fontSize:10.5,fontWeight:'900',letterSpacing:1.1,color:'#624315'},
eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:C.coralDeep},
heroTitle:{fontSize:28,fontWeight:'800',color:C.ink,letterSpacing:-.8,lineHeight:35,maxWidth:295},
heroText:{color:'#66512F',fontSize:14,lineHeight:21,marginTop:10,maxWidth:285},
heroTagline:{alignSelf:'flex-start',backgroundColor:'#FFFDF3',borderRadius:12,paddingVertical:8,paddingHorizontal:10,marginTop:18},
heroTaglineText:{color:C.ink,fontSize:11.5,fontWeight:'700'},
headingWrap:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:17},
headingBar:{width:5,height:37,borderRadius:4,backgroundColor:C.sun,marginTop:3},
h:{fontSize:25,fontWeight:'800',color:C.ink,letterSpacing:-.6},
sub:{fontSize:14.5,lineHeight:21,color:C.muted,marginTop:6},
body:{fontSize:16,lineHeight:22,color:C.ink},
micro:{fontSize:14,color:C.muted,lineHeight:17},
sectionTitle:{fontSize:18,color:C.ink,fontWeight:'800',marginBottom:13},
cardTitle:{fontSize:17,fontWeight:'800',color:C.ink},
label:{fontSize:14,color:C.ink,fontWeight:'800',marginBottom:8},
input:{...UI.field,
   paddingHorizontal:15,paddingVertical:13,fontSize:16,color:C.ink,minHeight:52},
 inputFocused:{borderColor:C.accentDark,borderWidth:2,backgroundColor:'#FAFFF9'},
 inputInvalid:{borderColor:C.danger},
 inputFoot:{flexDirection:'row',alignItems:'flex-start',marginTop:6,gap:8},
 inputHint:{fontSize:13.5,lineHeight:19,color:C.muted,flex:1},
 inputCounter:{fontSize:13,color:C.accentDark,fontWeight:'700'},
 inputError:{fontSize:13.5,color:C.danger,marginTop:6},
button:{minHeight:52,paddingHorizontal:18,paddingVertical:12,borderRadius:R.button,justifyContent:'center',alignItems:'center',flexDirection:'row'},
buttonPress:{transform:[{scale:.985}],opacity:.89},
button_primary:{backgroundColor:UI.primary.backgroundColor},button_outline:{backgroundColor:UI.secondary.backgroundColor,borderColor:UI.secondary.borderColor,borderWidth:UI.secondary.borderWidth},
button_ghost:{backgroundColor:C.pale},buttonSmall:{minHeight:44,paddingVertical:9,paddingHorizontal:13},
buttonText:{color:C.white,fontSize:15,fontWeight:'800',textAlign:'center',flexShrink:1},buttonTextDark:{color:C.accentDark},
chip:{minHeight:46,justifyContent:'center',borderRadius:50,borderWidth:1,borderColor:'#CBE8E2',backgroundColor:C.pale,paddingHorizontal:14,paddingVertical:8},
chipSelected:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipText:{color:C.accentDark,fontSize:14,fontWeight:'800'},
chipsRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},
info:{backgroundColor:C.pale,borderRadius:18,paddingHorizontal:14,paddingVertical:14,
   marginHorizontal:0,marginTop:7,marginBottom:12,
   flexDirection:'row',alignItems:'flex-start',gap:10},
 infoMark:{width:30,height:30,borderRadius:11,backgroundColor:'#D9EEE3',alignItems:'center',justifyContent:'center'},
 infoMarkWarning:{backgroundColor:'#F9DFA8'},
warning:{backgroundColor:C.warning},infoText:{fontSize:14,lineHeight:21,color:C.accentDark,flex:1},
avatar:{backgroundColor:C.peach,alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarText:{fontWeight:'900',color:C.coralDeep},
match:{backgroundColor:C.sunny,borderRadius:12,paddingHorizontal:10,paddingVertical:7},matchText:{fontSize:10.5,fontWeight:'900',color:'#674516'},
tabBar:{minHeight:80,borderTopWidth:1,borderTopColor:C.line,backgroundColor:C.white,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:8,paddingBottom:3},
tab:{flex:1,alignItems:'center',justifyContent:'center',minHeight:62,paddingVertical:6,borderRadius:16,marginHorizontal:2},tabActive:{backgroundColor:C.sunPale},tabIcon:{width:35,height:29,alignItems:'center',justifyContent:'center'},tabIconSelected:{borderRadius:10},tabLabel:{fontSize:12.5,color:C.muted,marginTop:3,fontWeight:'700',textAlign:'center'},
chatHeader:{padding:13,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line},
chatComposer:{padding:11,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line},
bubble:{borderRadius:20,padding:13,maxWidth:'87%',marginVertical:5},mine:{backgroundColor:C.accent,alignSelf:'flex-end',borderBottomRightRadius:5},
theirs:{backgroundColor:'#FFF0E8',alignSelf:'flex-start',borderBottomLeftRadius:5},bubbleText:{color:C.ink,fontSize:14.5,lineHeight:21},
photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},photoCard:{width:'47%',padding:10},photoImage:{width:'100%',height:110,borderRadius:14,marginBottom:8},
photoDraftPreview:{width:'100%',height:230,backgroundColor:C.pale,borderRadius:18,marginBottom:14},
modalShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,44,52,.52)',justifyContent:'center',zIndex:100},
});

