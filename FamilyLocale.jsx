import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Modal,NativeModules,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {normalizeLanguage,resolveLanguage,localeFor,translate,SERVICE_REGION,SERVICE_CURRENCY,LANGUAGE_OPTIONS} from './FamilyLocaleModel';
import {FAMILY_COLORS as C} from './FamilyTheme';
const KEY='familienfunke.language.v1';
const Context=createContext(null);
function deviceLocale(){
 try{return NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]||NativeModules.SettingsManager?.settings?.AppleLocale||NativeModules.I18nManager?.localeIdentifier||Intl.DateTimeFormat().resolvedOptions().locale||'de-DE';}
 catch{return 'de-DE';}
}
export function FamilyLocaleProvider({children}){
 const [preference,setPreference]=useState('auto'),[ready,setReady]=useState(false),[device,setDevice]=useState(deviceLocale),[open,setOpen]=useState(false);
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 const busy=useRef(false);
 useEffect(()=>{let alive=true;AsyncStorage.getItem(KEY).then(v=>{if(alive)setPreference(normalizeLanguage(v));}).catch(()=>{if(alive)setError('read');}).finally(()=>{if(alive)setReady(true);});
 const sub=AppState.addEventListener('change',s=>{if(s==='active')setDevice(deviceLocale());});return()=>{alive=false;sub.remove();};},[]);
 const language=resolveLanguage(preference,device);
 async function choose(value){
  if(!ready||busy.current||!LANGUAGE_OPTIONS.includes(value))return;
  busy.current=true;setSaving(true);setError('');
  try{await AsyncStorage.setItem(KEY,value);setPreference(value);}catch{setError('write');}
  finally{busy.current=false;setSaving(false);}
 }
 const value=useMemo(()=>({language,locale:localeFor(language),t:key=>translate(language,key),openLanguage:()=>setOpen(true)}),[language]);
 const t=value.t;
 return <Context.Provider value={value}>{children}
  <Modal visible={open} animationType="none" onRequestClose={()=>{if(!busy.current)setOpen(false);}}>
   <SafeAreaView style={s.page} accessibilityViewIsModal>
    <ScrollView contentContainerStyle={s.content}>
     <Text accessibilityRole="header" style={s.title}>{t('Sprache & Region')}</Text>
     <Text style={s.hint}>{language==='en'?'English preview: many screens and game controls are translated. Some German content, especially legal, medical and word-based puzzles, remains untranslated. Service is currently limited to Germany.':'Englisch-Vorschau: Startseite, Navigation und ausgewählte Bedienelemente sind übersetzt. Weitere Ansichten und deutsche Inhalte bleiben zunächst deutsch.'}</Text>
     {!ready?<Text style={s.hint}>{language==='en'?'Loading language settings …':'Spracheinstellungen werden geladen …'}</Text>:null}
     {LANGUAGE_OPTIONS.map(id=><Pressable key={id} accessibilityRole="radio" accessibilityState={{checked:preference===id,disabled:!ready||saving}} disabled={!ready||saving} onPress={()=>choose(id)} style={[s.option,preference===id&&s.selected]}><Text style={s.label}>{id==='auto'?(language==='en'?'Automatic (device language)':'Automatisch (Gerätesprache)'):id==='de'?'Deutsch':'English'}</Text><Text style={s.label}>{preference===id?'✓':''}</Text></Pressable>)}
     {error?<Text accessibilityRole="alert" style={s.error}>{language==='en'?'Language settings could not be loaded or saved. Please try again.':'Spracheinstellungen konnten nicht gelesen oder gespeichert werden. Bitte erneut versuchen.'}</Text>:null}
     <Text accessibilityRole="header" style={s.heading}>{language==='en'?'Service region':'Verfügbare Region'}</Text>
     <Text style={s.label}>{language==='en'?'Germany':'Deutschland'} · {SERVICE_REGION} · {SERVICE_CURRENCY}</Text>
     <Text style={s.hint}>{language==='en'?'Changing the language does not change the service country, currency, or location.':'Eine andere Sprache ändert weder das verfügbare Land noch die Währung oder den Wohnort.'}</Text>
     <Text style={s.hint}>{language==='en'?'Your choice is saved on this device, not in your account.':'Die Auswahl wird auf diesem Gerät gespeichert, nicht im Konto.'}</Text>
     <Pressable accessibilityRole="button" disabled={saving} onPress={()=>setOpen(false)} style={s.close}><Text style={s.closeText}>{t('Schließen')}</Text></Pressable>
    </ScrollView>
   </SafeAreaView>
  </Modal>
 </Context.Provider>;
}
export function useFamilyLocale(){const value=useContext(Context);return value||{language:'de',locale:'de-DE',t:k=>k,openLanguage:()=>{}};}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{padding:20,gap:12},title:{fontSize:26,fontWeight:'800',color:C.ink},heading:{fontSize:19,fontWeight:'700',color:C.ink,marginTop:12},hint:{fontSize:16,lineHeight:23,color:C.muted},option:{minHeight:54,borderRadius:14,padding:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:C.line,backgroundColor:C.paper},selected:{backgroundColor:C.sunPale,borderColor:C.accentDark},label:{fontSize:17,color:C.ink,fontWeight:'700',flexShrink:1},close:{minHeight:50,justifyContent:'center',alignItems:'center',backgroundColor:C.accentDark,borderRadius:14},closeText:{color:C.white,fontSize:17,fontWeight:'700'},error:{fontSize:16,color:C.danger}});
