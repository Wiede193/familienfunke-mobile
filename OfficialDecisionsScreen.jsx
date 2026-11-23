import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Linking,Pressable,RefreshControl,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';

const LEVELS=[['all','Alle'],['bund','Bund'],['brandenburg','Brandenburg'],['landkreis','Landkreis']];
const STATUS={
 kabinett:'Von der Regierung beschlossen',
 parlament:'Vom Parlament beschlossen',
 verkuendet:'Amtlich verkündet',
 inkraft:'In Kraft',
 unklar:'Status nicht abschließend geprüft'
};
const HELP={
 kabinett:'Das Kabinett hat eine Entscheidung oder einen Entwurf beschlossen. Dadurch ist ein Gesetzentwurf noch nicht automatisch geltendes Recht.',
 parlament:'Das Parlament hat zugestimmt. Ob und wann eine neue Regelung gilt, muss anhand der amtlichen Verkündung geprüft werden.',
 verkuendet:'Das Regelwerk wurde amtlich veröffentlicht. Das Datum seines Inkrafttretens kann davon abweichen.',
 inkraft:'Die offizielle Quelle weist die Regelung als in Kraft aus.',
 unklar:'Aus der veröffentlichten Meldung lässt sich der rechtliche Status noch nicht sicher bestimmen.'
};
const trusted=url=>{
 try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&[
  'bundesregierung.de','bundeskanzler.de','bundestag.de','bundesrat.de',
  'landtag.brandenburg.de','brandenburg.de','landkreis-oder-spree.de',
  'recht.bund.de','gesetze-im-internet.de'
 ].some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}catch{return false;}
};
const date=value=>{
 const d=new Date(value);
 return Number.isNaN(d.getTime())?'Datum unbekannt':d.toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'});
};
const normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function Chip({label,selected,onPress}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress}
  style={[styles.chip,selected&&styles.chipSelected]}><Text style={[styles.chipText,selected&&styles.chipSelectedText]}>{label}</Text></Pressable>;
}
export default function OfficialDecisionsScreen({userId,initialQuery='',focusId=null}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [area,setArea]=useState('all'),[query,setQuery]=useState(initialQuery);
 const [subscribed,setSubscribed]=useState(false),[preferenceLoading,setPreferenceLoading]=useState(true),[saving,setSaving]=useState(false);
 const [expanded,setExpanded]=useState(null);
 const load=useCallback(async()=>{
  if(!supabase||!userId)return;
  setLoading(true);setError('');
  try{
   const {data,error:e}=await supabase.from('ff_official_decisions')
    .select('id,level,decision_status,title,source_name,source_url,published_at,official_excerpt,simple_summary,family_impact,next_step,editorial_reviewed')
    .eq('published',true).order('published_at',{ascending:false}).limit(100);
   if(e)throw e;
   let results=data||[];
   if(focusId&&!results.some(x=>x.id===focusId)){
    const focused=await supabase.from('ff_official_decisions')
     .select('id,level,decision_status,title,source_name,source_url,published_at,official_excerpt,simple_summary,family_impact,next_step,editorial_reviewed')
     .eq('id',focusId).eq('published',true).maybeSingle();
    if(!focused.error&&focused.data)results=[focused.data,...results];
   }
   setRows(results);
  }catch{setError('Die amtlichen Beschlüsse konnten nicht geladen werden. Bitte Verbindung prüfen.');}
  finally{setLoading(false);}
 },[userId,focusId]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{setQuery(initialQuery||'');},[initialQuery]);
 useEffect(()=>{
  let live=true;
  setPreferenceLoading(true);
  if(!userId||!supabase){setPreferenceLoading(false);return;}
  supabase.from('ff_decision_subscriptions').select('enabled').eq('user_id',userId).maybeSingle()
   .then(({data,error:e})=>{if(live){if(e)setError('Benachrichtigungseinstellung konnte nicht geladen werden.');else setSubscribed(!!data?.enabled);setPreferenceLoading(false);}})
   .catch(()=>{if(live){setPreferenceLoading(false);setError('Benachrichtigungseinstellung konnte nicht geladen werden.');}});
  return()=>{live=false;};
 },[userId]);
 const change=async next=>{
  if(saving||preferenceLoading||!userId)return;
  setSaving(true);
  try{
   const {error:e}=await supabase.from('ff_decision_subscriptions')
    .upsert({user_id:userId,enabled:next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   if(e)throw e;
   setSubscribed(next);
  }catch{setError('Die Einstellung konnte nicht gespeichert werden. Bitte erneut versuchen.');}
  finally{setSaving(false);}
 };
 const visible=useMemo(()=>{
  const words=normal(query).split(/\s+/).filter(Boolean);
  return rows.filter(x=>(area==='all'||x.level===area)&&
   words.every(w=>normal([x.title,x.source_name,x.simple_summary,x.official_excerpt].join(' ')).includes(w)))
   .sort((a,b)=>(a.id===focusId?-1:b.id===focusId?1:0));
 },[area,query,rows,focusId]);
 return <ScrollView style={styles.root} contentContainerStyle={styles.page}
  keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>}>
  <View style={styles.hero}>
   <Text accessibilityRole="header" style={styles.heading}>Beschlüsse einfach erklärt</Text>
   <Text style={styles.intro}>Was wurde offiziell entschieden? Was ist noch ein Entwurf? Hier findest du nachvollziehbare Informationen ohne Parteiwertungen oder Kommentare.</Text>
  </View>
  <View style={styles.card}>
   <View style={styles.row}>
    <View style={{flex:1}}>
     <Text style={styles.cardHeading}>Neue amtliche Beschlüsse</Text>
     <Text style={styles.muted}>Freiwillige Hinweise in deiner Neuigkeiten-Zentrale. Standardmäßig aus.</Text>
    </View>
    <Switch accessibilityLabel="In-App-Hinweise zu neuen amtlichen Beschlüssen"
     value={subscribed} onValueChange={change} disabled={saving||preferenceLoading}/>
   </View>
   <Text style={styles.small}>Die Auswahl gilt für dein Familienfunke-Konto. Nur nach Aktivierung neu veröffentlichte Einträge lösen Hinweise aus. Push auf den Sperrbildschirm ist dafür noch nicht eingerichtet.</Text>
  </View>
  <TextInput accessibilityLabel="Beschlüsse durchsuchen" placeholder="Beschlüsse und Themen suchen"
   placeholderTextColor={C.muted} value={query} onChangeText={setQuery} style={styles.input}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
   {LEVELS.map(([id,title])=><Chip key={id} label={title} selected={area===id} onPress={()=>setArea(id)}/>)}
  </ScrollView>
  {loading&&!rows.length?<ActivityIndicator color={C.accent}/>:null}
  {error?<View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.note}>{error}</Text>
   <Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Erneut versuchen</Text></Pressable></View>:null}
  {!loading&&!visible.length?<View style={styles.card}><Text style={styles.cardHeading}>Keine passenden Einträge</Text>
   <Text style={styles.muted}>Der Monitor zeigt nur nachvollziehbare amtliche Veröffentlichungen. Fehlende Einträge bedeuten nicht, dass keine Entscheidungen getroffen wurden.</Text></View>:null}
  {visible.map(item=>{
   const open=expanded===item.id||focusId===item.id;
   return <View key={item.id} style={styles.card}>
    <Text style={styles.meta}>{item.level==='bund'?'Bund':item.level==='brandenburg'?'Brandenburg':'Landkreis'} · {date(item.published_at)}</Text>
    <Text accessibilityRole="header" style={styles.cardHeading}>{item.title}</Text>
    <Text style={styles.status}>{STATUS[item.decision_status]||STATUS.unklar}</Text>
    <Text style={styles.body}>{item.editorial_reviewed&&item.simple_summary?item.simple_summary:HELP[item.decision_status]||HELP.unklar}</Text>
    {!item.editorial_reviewed?<Text style={styles.small}>Allgemeine Erklärung des Verfahrens. Eine geprüfte Erläuterung dieses konkreten Beschlusses liegt noch nicht vor.</Text>:null}
    {open?<View style={styles.details}>
      {item.editorial_reviewed&&item.family_impact?<><Text style={styles.section}>Was bedeutet das für Familien?</Text><Text style={styles.body}>{item.family_impact}</Text></>:null}
      {item.editorial_reviewed&&item.next_step?<><Text style={styles.section}>Wie geht es weiter?</Text><Text style={styles.body}>{item.next_step}</Text></>:null}
      {item.official_excerpt?<><Text style={styles.section}>Kurztext der amtlichen Quelle</Text><Text style={styles.body}>{item.official_excerpt}</Text></>:null}
      <Text style={styles.small}>Ein Veröffentlichungsdatum ist nicht automatisch das Datum des Inkrafttretens. Einzelne Wirkungen und Fristen müssen aus der amtlichen Quelle hervorgehen.</Text>
    </View>:null}
    <View style={styles.actions}>
     <Pressable accessibilityRole="button" onPress={()=>setExpanded(open?null:item.id)} style={styles.action}><Text style={styles.actionText}>{open?'Weniger':'Einordnung lesen'}</Text></Pressable>
     {trusted(item.source_url)?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(item.source_url)} style={styles.action}><Text style={styles.actionText}>Amtliche Quelle öffnen</Text></Pressable>:null}
    </View>
    <Text style={styles.source}>Quelle: {item.source_name}</Text>
   </View>;
  })}
  <View style={styles.card}>
   <Text style={styles.section}>So arbeitet der Beschluss-Monitor</Text>
   <Text style={styles.body}>Wir trennen Kabinettsentscheidungen, Parlamentsbeschlüsse, Verkündungen und Inkrafttreten. Automatisch erkannte Quellenmeldungen sind nicht dasselbe wie redaktionell geprüfte Erklärungen. Keine politischen Kommentare, keine Bewertung von Parteien.</Text>
   <Text style={styles.small}>Bund und Brandenburg zuerst. Kommunale Beschlüsse werden erst nach verlässlicher technischer Quellenanbindung ergänzt. Es besteht kein Anspruch auf Vollständigkeit.</Text>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:C.bg},page:{padding:16,paddingBottom:32,gap:13},
 hero:{backgroundColor:C.sunPale,padding:22,borderRadius:22,gap:8},heading:{fontSize:25,fontWeight:'900',color:C.ink},
 intro:{fontSize:15,color:C.ink,lineHeight:22},card:{backgroundColor:C.paper,borderRadius:18,padding:18,gap:10,borderWidth:1,borderColor:C.line},
 row:{flexDirection:'row',alignItems:'center',gap:12},cardHeading:{fontSize:18,fontWeight:'800',color:C.ink,lineHeight:25},
 body:{fontSize:15,color:C.ink,lineHeight:22},muted:{fontSize:14,color:C.muted,lineHeight:20},
 small:{fontSize:12,color:C.muted,lineHeight:18},meta:{fontSize:12,fontWeight:'700',color:C.muted},
 status:{fontSize:13,fontWeight:'800',color:C.accentDark,backgroundColor:C.mint,alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:10,borderRadius:12},
 note:{fontSize:14,color:C.danger},link:{color:C.accentDark,fontWeight:'800',paddingVertical:8},
 input:{backgroundColor:C.paper,borderRadius:15,padding:14,fontSize:15,color:C.ink,borderWidth:1,borderColor:C.line,minHeight:48},
 filters:{gap:8,paddingVertical:2},chip:{paddingVertical:10,paddingHorizontal:15,borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,minHeight:44,justifyContent:'center'},
 chipSelected:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipText:{fontSize:13,color:C.ink,fontWeight:'700'},chipSelectedText:{color:C.white},
 details:{gap:8,marginTop:6,borderTopWidth:1,borderTopColor:C.line,paddingTop:12},section:{fontSize:15,fontWeight:'800',color:C.ink},
 actions:{flexDirection:'row',gap:8,flexWrap:'wrap'},action:{borderRadius:14,backgroundColor:C.sunPale,paddingVertical:11,paddingHorizontal:14,minHeight:44,justifyContent:'center'},
 actionText:{fontSize:13,fontWeight:'800',color:C.accentDark},source:{fontSize:12,color:C.muted}
});
