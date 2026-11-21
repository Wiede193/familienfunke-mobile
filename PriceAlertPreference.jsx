import React,{useEffect,useRef,useState} from 'react';
import {Pressable,StyleSheet,Switch,Text,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';

export default function PriceAlertPreference({userId,active}){
 const [enabled,setEnabled]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  let live=true;setEnabled(null);setError('');
  supabase.rpc('ff_market_price_alert_status').then(({data,error})=>{
   if(!live)return;
   if(error||typeof data!=='boolean'){setError('Preisalarme konnten nicht geladen werden.');return;}
   setEnabled(data);
  }).catch(()=>{if(live)setError('Preisalarme konnten nicht geladen werden.');});
  return()=>{live=false;};
 },[userId,retry]);
 async function change(value){
  if(lock.current||(!active&&value))return;
  lock.current=true;setBusy(true);setError('');
  try{
   const {data,error}=await supabase.rpc('ff_market_price_alert_set',{p_enabled:value});
   if(error||data!==true)throw Error();
   if(alive.current)setEnabled(value);
  }catch{if(alive.current)setError('Änderung konnte nicht gespeichert werden.');}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>Preisalarme für gemerkte Artikel</Text>
  <Text style={s.text}>Bei neuen freigegebenen Preissenkungen erscheint ein Hinweis unter Neuigkeiten. Wiederholte Preissenkungen auf denselben bereits gemeldeten Preis erzeugen keinen neuen Hinweis. Kein externer Push-Versand.</Text>
  <View style={s.row}>
   <Text style={[s.text,{flex:1}]}>{enabled===null?'Wird geprüft …':enabled?'Preisalarme an':'Preisalarme aus'}</Text>
   <Switch accessibilityLabel="Preisalarme für gemerkte Artikel" disabled={busy||enabled===null||(!active&&!enabled)} value={enabled===true} onValueChange={change}/>
  </View>
  {error?<><Text accessibilityLiveRegion="assertive" style={s.text}>{error}</Text><Pressable accessibilityRole="button" onPress={()=>setRetry(n=>n+1)} style={s.retry}><Text style={s.title}>Erneut laden</Text></Pressable></>:null}
 </View>;
}
const s=StyleSheet.create({card:{padding:15,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,gap:8,marginBottom:12},title:{fontWeight:'800',fontSize:16,color:C.ink},text:{fontSize:14,lineHeight:21,color:C.ink},row:{flexDirection:'row',alignItems:'center',gap:10,minHeight:48},retry:{minHeight:44,justifyContent:'center',alignItems:'center',borderRadius:12,backgroundColor:C.mint}});
