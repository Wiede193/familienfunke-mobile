import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,Switch,Pressable,StyleSheet,Linking} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {useFamilyLocale} from './FamilyLocale';
import PriceAlertPreference from './PriceAlertPreference';
import {pushStatus,enablePush,disablePush,changePushCategories} from './PushDevice';
const TYPES=[['messages','Nachrichten'],['requests','Kontaktanfragen'],['matches','Neue bestätigte Kontakte'],['market','Status meiner Basar-Anzeigen']];
const initial={messages:true,requests:true,matches:true,market:true};
function Action({children,onPress,disabled,secondary}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={[s.button,secondary&&s.secondary,disabled&&{opacity:.5}]}><Text style={[s.buttonText,secondary&&{color:C.ink}]}>{children}</Text></Pressable>;
}
export default function PushSettings({userId,active}){
 const {t}=useFamilyLocale();
 const [choices,setChoices]=useState(initial),[status,setStatus]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{
  let valid=true;
  pushStatus(userId).then(v=>{if(valid){setStatus(v);setChoices(Object.fromEntries(TYPES.map(([k])=>[k,!!v?.[k]])));}}).catch(()=>{if(valid)setNotice('Status konnte nicht geladen werden. Bitte erneut öffnen.');});
  return()=>{valid=false};
 },[userId]);
 async function act(fn,message){
  if(busy)return;setBusy(true);setNotice('');
  try{await fn();setStatus(await pushStatus(userId));setNotice(message);}
  catch(e){setNotice(e?.message||'Aktion nicht bestätigt. Bitte erneut versuchen.');}
  finally{setBusy(false);}
 }
 return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
  <Text accessibilityRole="header" style={s.heading}>{t("Benachrichtigungen")}</Text>
  <Text style={s.text}>{t("Du entscheidest, worüber dich Familienfunke informieren darf. Push ist freiwillig und standardmäßig ausgeschaltet.")}</Text>
  <View style={s.card}>
   <Text accessibilityRole="header" style={s.title}>{t("Dieses Gerät")}</Text>
   <Text style={s.text}>{status===null?t("Gerätestatus wird geprüft."):status.registered?t("Dieses Gerät ist angemeldet."):t("Dieses Gerät ist nicht angemeldet.")}</Text>
   {status&&!status.delivery_ready&&<Text style={s.text}>{t("Der Versand ist noch in Vorbereitung. Eine Registrierung ist keine Zustellgarantie.")}</Text>}
   {!active&&<Text style={s.text}>{t("Push ist erst nach Freigabe deines Familienkontos verfügbar.")}</Text>}
   {status?.registered?<Action secondary disabled={busy} onPress={()=>act(()=>disablePush(userId),'Dieses Gerät wurde abgemeldet.')}>{t("Push auf diesem Gerät ausschalten")}</Action>:
    <Action disabled={busy||!status||!active} onPress={()=>act(()=>enablePush(userId,choices),'Geräteanmeldung bestätigt.')}>{t("Push auf diesem Gerät aktivieren")}</Action>}
   <Action secondary onPress={()=>Linking.openSettings().catch(()=>setNotice('Geräteeinstellungen konnten nicht geöffnet werden.'))}>{t("Systemberechtigungen öffnen")}</Action>
  </View>
  <View style={s.card}>
   <Text accessibilityRole="header" style={s.title}>{t("Welche Neuigkeiten?")}</Text>
   <Text style={s.text}>{t("Diese Auswahl gilt für deine angemeldeten Geräte. Auf dem Sperrbildschirm steht nur ein allgemeiner Hinweis.")}</Text>
   {TYPES.map(([k,label])=><View key={k} style={s.row}><Text style={[s.text,{flex:1}]}>{t(label)}</Text><Switch accessibilityLabel={t(label)} disabled={busy||!status} value={!!choices[k]} onValueChange={v=>setChoices(prev=>({...prev,[k]:v}))}/></View>)}
   <Action disabled={busy||!status} onPress={()=>act(()=>changePushCategories(userId,choices),'Auswahl gespeichert.')}>{t("Auswahl speichern")}</Action>
  </View>
  <PriceAlertPreference key={userId} userId={userId} active={active}/>
  <Text accessibilityLiveRegion="polite" style={s.text}>{t(notice)}</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:16,paddingBottom:32,backgroundColor:C.bg,gap:12},heading:{fontSize:26,fontWeight:'900',color:C.ink},title:{fontSize:19,fontWeight:'800',color:C.ink},text:{fontSize:15,color:C.ink,lineHeight:22},card:{backgroundColor:C.paper,padding:16,borderRadius:22,borderColor:C.line,borderWidth:1,gap:10},row:{flexDirection:'row',alignItems:'center',minHeight:48,gap:12},button:{backgroundColor:C.accent,minHeight:48,borderRadius:15,padding:12,alignItems:'center',justifyContent:'center'},secondary:{backgroundColor:C.mint},buttonText:{color:C.white,fontSize:15,fontWeight:'800',textAlign:'center'}});
