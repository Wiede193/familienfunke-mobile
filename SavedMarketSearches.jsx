import React,{useEffect,useRef,useState} from 'react';
import {Alert,Pressable,ScrollView,StyleSheet,Switch,Text,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {confirmRemoval} from './FamilyActions';
import FamilyActionButton from './FamilyActionButton';

const money=c=>(c/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
export function savedSearchLabel(x){
 return [x.query||'Alle passenden Artikel',x.category!=='Alle'?x.category:null,
 x.trade_type==='gift'?'Zu verschenken':x.trade_type==='swap'?'Tausch':x.trade_type==='sell'?'Verkauf':null,
 x.min_cents!=null?'ab '+money(x.min_cents):null,x.max_cents!=null?'bis '+money(x.max_cents):null].filter(Boolean).join(' · ');
}
export function buildSavedSearch({query,category,trade,minPrice,maxPrice}){
 const parse=v=>{
  const t=String(v??'').trim().replace(',','.');
  if(!t)return null;
  if(!/^\d+(?:\.\d{1,2})?$/.test(t))throw Error('Bitte gültige Preise mit höchstens zwei Nachkommastellen eingeben.');
  const n=Math.round(Number(t)*100);
  if(!Number.isSafeInteger(n)||n>10000000)throw Error('Bitte Preisgrenze prüfen.');
  return n;
 };
 const q=String(query??'').trim(),min=parse(minPrice),max=parse(maxPrice);
 if(q.length>160)throw Error('Die Suche darf höchstens 160 Zeichen enthalten.');
 if(min!==null&&max!==null&&min>max)throw Error('Der Mindestpreis liegt über dem Höchstpreis.');
 if(['gift','swap'].includes(trade)&&(min!==null||max!==null))throw Error('Entferne die Preisfilter für Tausch- oder Geschenkangebote.');
 if(!q&&category==='Alle'&&trade==='all'&&min===null&&max===null)throw Error('Wähle zuerst einen Suchbegriff oder Filter.');
 return {query:q,category,trade_type:trade,min_cents:min,max_cents:max};
}
export async function saveMarketSearch(filters){
 const p=buildSavedSearch(filters);
 const {data,error}=await supabase.rpc('ff_saved_market_search_save',{
 p_query:p.query,p_category:p.category,p_trade_type:p.trade_type,p_min_cents:p.min_cents,p_max_cents:p.max_cents});
 if(error||typeof data!=='string')throw Error(error?.code==='22023'?'Suchfilter prüfen. Maximal zehn Suchaufträge sind möglich.':'Suchauftrag konnte nicht gespeichert werden.');
 return data;
}
function Action({children,onPress,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.5}]}><Text style={s.buttonText}>{children}</Text></Pressable>;
}
export default function SavedMarketSearches({userId,onSearch,onBrowse}){
 const [rows,setRows]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false};},[]);
 useEffect(()=>{
  let live=true;setError('');
  supabase.rpc('ff_saved_market_searches_list').then(({data,error})=>{
   if(!live)return;
   if(error||!Array.isArray(data)){setRows(null);setError('Suchaufträge konnten nicht geladen werden.');return;}
   setRows(data);
  }).catch(()=>{if(live)setError('Suchaufträge konnten nicht geladen werden.');});
  return()=>{live=false};
 },[userId,reload]);
 async function mutate(name,args){
  if(busy)return;setBusy(true);setError('');
  try{
   const {data,error}=await supabase.rpc(name,args);
   if(error||data!==true)throw Error();
   if(alive.current)setReload(n=>n+1);
  }catch{if(alive.current)setError('Änderung konnte nicht gespeichert werden.');}
  finally{if(alive.current)setBusy(false);}
 }
 return <ScrollView contentContainerStyle={s.page}>
  <Text accessibilityRole="header" style={s.title}>Meine Suchaufträge</Text>
  <Text style={s.text}>Deine gespeicherten Suchen und Filter. Bei neuen freigegebenen Treffern erhältst du auf Wunsch Hinweise unter Neuigkeiten. Bestehende Anzeigen kannst du jederzeit durch Öffnen der Suche finden.</Text>
  <Text style={s.note}>Bis zu 10 Suchaufträge. Hinweise sind derzeit in der App verfügbar, externer Push-Versand ist noch nicht aktiv.</Text>
  {error?<><Text accessibilityLiveRegion="assertive" style={s.text}>{error}</Text><Action onPress={()=>setReload(n=>n+1)}>Erneut laden</Action></>:null}
  {!rows&&!error?<Text style={s.text}>Suchaufträge werden geladen …</Text>:null}
  {rows?.length===0?<Text style={s.text}>Noch keine Suchaufträge gespeichert.</Text>:null}
  {rows?.map(row=><View key={row.id} style={s.card}>
   <View style={s.row}><Text accessibilityRole="header" style={[s.heading,{flex:1}]}>{row.query||row.category}</Text>
    </View>
   <Text style={s.text}>{savedSearchLabel(row)}</Text>
   <View style={s.row}><Text style={[s.text,{flex:1}]}>Mitteilungen {row.enabled?'aktiv':'stumm'}</Text><Switch accessibilityLabel={'Mitteilungen für '+(row.query||row.category)} disabled={busy} value={row.enabled} onValueChange={v=>mutate('ff_saved_market_search_toggle',{p_id:row.id,p_enabled:v})}/></View>
   <Action onPress={()=>onSearch(row)}>Suche öffnen</Action>
   <FamilyActionButton title="Löschen" accessibilityLabel={'Suchauftrag '+(row.query||row.category)+' löschen'} disabled={busy} destructive onPress={()=>confirmRemoval({title:'Suchauftrag löschen?',description:'Du erhältst keine neuen Hinweise zu dieser Suche. Vorhandene Anzeigen bleiben erhalten.',onConfirm:()=>mutate('ff_saved_market_search_delete',{p_id:row.id})})}/>
  </View>)}
  <Action onPress={onBrowse}>Neue Suche im Basar starten</Action>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:16,paddingBottom:32,gap:12,backgroundColor:C.bg},title:{fontSize:27,fontWeight:'900',color:C.ink},heading:{fontSize:18,fontWeight:'800',color:C.ink},text:{fontSize:15,lineHeight:22,color:C.ink},note:{fontSize:13,lineHeight:19,color:C.ink,backgroundColor:C.sunPale,padding:12,borderRadius:12},card:{backgroundColor:C.paper,padding:16,gap:10,borderColor:C.line,borderWidth:1,borderRadius:18},row:{flexDirection:'row',alignItems:'center',gap:10,minHeight:44},close:{minWidth:44,minHeight:44,justifyContent:'center',alignItems:'center',borderRadius:12,backgroundColor:C.sunPale},x:{fontSize:27,color:C.ink},button:{minHeight:48,justifyContent:'center',alignItems:'center',padding:12,borderRadius:14,backgroundColor:C.mint},buttonText:{fontSize:15,fontWeight:'800',color:C.accentDark,textAlign:'center'}});
