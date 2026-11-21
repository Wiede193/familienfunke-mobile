import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import {FAMILY_COLORS as C} from './FamilyTheme';

const speech=['ios','android'].includes(Platform.OS)?requireOptionalNativeModule('ExpoSpeechRecognition'):null;
export default function FamilyVoiceSearch({disabled=false,onText,onBusyChange}){
 const [phase,setPhase]=useState('idle'),[notice,setNotice]=useState('');
 const control=useRef({mounted:false,session:0,phase:'idle',accept:false});
 const callbacks=useRef({onText,onBusyChange});callbacks.current={onText,onBusyChange};
 function transition(next){
  control.current.phase=next;
  if(control.current.mounted){setPhase(next);callbacks.current.onBusyChange?.(next!=='idle');}
 }
 function cancel(){
  const c=control.current;c.session++;c.accept=false;
  if(c.phase==='listening'||c.phase==='stopping'){
   transition('stopping');
   try{speech?.abort();}catch{transition('idle');}
  }else transition('idle');
 }
 useEffect(()=>{
  const c=control.current;c.mounted=true;
  if(!speech)return()=>{c.mounted=false;};
  const subs=[
   speech.addListener('result',event=>{
    const value=event?.results?.[0]?.transcript;
    if(c.mounted&&c.accept&&c.phase==='listening'&&event.isFinal&&typeof value==='string'&&value.trim()){
     c.accept=false;callbacks.current.onText?.(value.trim().slice(0,600));
     setNotice('Text eingefügt. Prüfe ihn und tippe auf Suchen oder KI fragen.');
     AccessibilityInfo.announceForAccessibility('Gesprochener Text eingefügt.');
    }
   }),
   speech.addListener('error',()=>{
    if(!c.mounted||c.phase==='idle')return;
    c.accept=false;setNotice('Spracherkennung nicht verfügbar. Bitte prüfe die lokale deutsche Spracherkennung oder nutze die Tastatur.');
    // Wait for the terminal event instead of allowing a new session while old events may arrive.
    transition('stopping');
    const session=c.session;
    Promise.resolve().then(()=>speech.getStateAsync()).then(state=>{
     if(c.mounted&&session===c.session&&c.phase==='stopping'&&state==='inactive')transition('idle');
    }).catch(()=>{});
   }),
   speech.addListener('end',()=>{
    if(!c.mounted||!['listening','stopping'].includes(c.phase))return;
    c.accept=false;transition('idle');
   })
  ];
  const appState=AppState.addEventListener('change',state=>{
   if(state!=='active'&&c.phase==='listening')cancel();
  });
  return()=>{
   c.mounted=false;c.session++;c.accept=false;
   subs.forEach(sub=>sub.remove());appState.remove();
   if(['listening','stopping'].includes(c.phase))try{speech.abort();}catch{}
  };
 },[]);
 async function start(){
  const c=control.current;
  if(!speech||!c.mounted||disabled||c.phase!=='idle')return;
  const seq=++c.session;setNotice('');
  try{
   if(!speech.supportsOnDeviceRecognition()||!speech.isRecognitionAvailable()){
    setNotice('Lokale Spracherkennung fehlt auf diesem Gerät. Du kannst die Tastatur verwenden.');return;
   }
   transition('permission');
   const permission=await speech.requestMicrophonePermissionsAsync();
   if(!c.mounted||seq!==c.session)return;
   if(!permission?.granted||AppState.currentState!=='active'){
    setNotice('Mikrofon nicht verfügbar. Prüfe die Geräteeinstellungen oder nutze die Tastatur.');transition('idle');return;
   }
   c.accept=true;transition('listening');
   speech.start({lang:'de-DE',requiresOnDeviceRecognition:true,continuous:false,interimResults:false,maxAlternatives:1,recordingOptions:{persist:false}});
  }catch{
   if(!c.mounted||seq!==c.session)return;
   c.accept=false;transition('idle');setNotice('Spracherkennung konnte nicht gestartet werden. Bitte nutze die Tastatur.');
  }
 }
 if(!speech)return null;
 return <View style={s.wrap}>
  <Pressable accessibilityRole="button" accessibilityState={{disabled:phase==='stopping'||(disabled&&phase==='idle')}} disabled={phase==='stopping'||(disabled&&phase==='idle')} onPress={phase==='idle'?start:cancel} style={s.button}>
   <Text style={s.label}>{phase==='idle'?'Spracheingabe starten':phase==='permission'?'Mikrofonanfrage abbrechen':phase==='stopping'?'Wird beendet …':'Aufnahme abbrechen'}</Text>
  </Pressable>
  <Text accessibilityLiveRegion="polite" style={s.hint}>{phase==='listening'?'Sprich jetzt. Die Erkennung endet nach einer Sprechpause.':notice||'Sprache wird nur lokal erkannt. Du entscheidest, ob du den Text absendest.'}</Text>
 </View>;
}
const s=StyleSheet.create({wrap:{alignSelf:'stretch',alignItems:'center',gap:6,marginTop:12},button:{minHeight:48,paddingHorizontal:16,paddingVertical:12,borderWidth:1,borderColor:C.accentDark,borderRadius:14,backgroundColor:C.paper,justifyContent:'center'},label:{color:C.accentDark,fontSize:16,fontWeight:'700',textAlign:'center'},hint:{fontSize:13,lineHeight:19,color:C.muted,textAlign:'center'}});
