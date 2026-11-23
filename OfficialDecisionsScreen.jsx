import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Linking,Pressable,RefreshControl,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';
import SearchResultFeedback from './SearchResultFeedback';

const LEVELS=[['all','Alle'],['bund','Bund'],['brandenburg','Brandenburg'],['landkreis','Landkreis']];
const TOPICS=[['kindergeld','Kindergeld'],['elterngeld','Elterngeld'],['kita','Kita & Hort'],['schule','Schule'],['wohnen','Wohnen'],['gesundheit','Gesundheit'],['familienrecht','Familienrecht'],['leistungen','Weitere Leistungen'],['freizeit','Freizeit'],['weitere','Weitere']];
const topicName=id=>TOPICS.find(([key])=>key===id)?.[1]||'Weitere';
const STATUS={
 kabinett:'Von der Regierung beschlossen',
 parlament:'Vom Parlament beschlossen',
 vermittlung:'Vermittlung zwischen Bundestag und Bundesrat',
 vereinbarung:'Vereinbarung – noch kein Gesetz',
 verkuendet:'Amtlich verkündet',
 inkraft:'In Kraft',
 unklar:'Status nicht abschließend geprüft'
};
const HELP={
 kabinett:'Das Kabinett hat eine Entscheidung oder einen Entwurf beschlossen. Dadurch ist ein Gesetzentwurf noch nicht automatisch geltendes Recht.',
 parlament:'Das Parlament hat zugestimmt. Ob und wann eine neue Regelung gilt, muss anhand der amtlichen Verkündung geprüft werden.',
 vermittlung:'Bundestag und Bundesrat sind noch nicht einig. Der Vermittlungsausschuss sucht eine Verständigung. Daraus folgt noch kein endgültig wirksames neues Gesetz.',
 vereinbarung:'Beteiligte Institutionen haben eine Vereinbarung oder Eckpunkte beschlossen. Die notwendige parlamentarische Zustimmung und Umsetzung können noch ausstehen.',
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
 const [rows,setRows]=useState([]),[history,setHistory]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [area,setArea]=useState('all'),[query,setQuery]=useState(initialQuery);
 const [subscribed,setSubscribed]=useState(false),[preferenceLoading,setPreferenceLoading]=useState(true),[saving,setSaving]=useState(false);
 const [expanded,setExpanded]=useState(null);
 const [showSources,setShowSources]=useState(false);
 useEffect(()=>{setExpanded(focusId||null);},[focusId]);
 const [topic,setTopic]=useState('all'),[selectedTopics,setSelectedTopics]=useState([]),[editTopics,setEditTopics]=useState(false);
 const load=useCallback(async()=>{
  if(!supabase||!userId)return;
  setLoading(true);setError('');
  try{
   const {data,error:e}=await supabase.from('ff_official_decisions')
    .select('id,level,family_topic,decision_status,decision_date,status_checked_at,last_official_check_at,status_review_pending,title,source_name,source_url,published_at,official_excerpt,simple_summary,family_impact,next_step,editorial_reviewed')
    .eq('published',true).order('published_at',{ascending:false}).limit(100);
   if(e)throw e;
   let results=data||[];
   if(focusId&&!results.some(x=>x.id===focusId)){
    const focused=await supabase.from('ff_official_decisions')
     .select('id,level,family_topic,decision_status,decision_date,status_checked_at,last_official_check_at,status_review_pending,title,source_name,source_url,published_at,official_excerpt,simple_summary,family_impact,next_step,editorial_reviewed')
     .eq('id',focusId).eq('published',true).maybeSingle();
    if(!focused.error&&focused.data)results=[focused.data,...results];
   }
   setRows(results);
   if(results.length){
    const ids=results.map(item=>item.id);
    const {data:events,error:historyError}=await supabase.from('ff_decision_status_history')
      .select('id,decision_id,status,previous_status,event_kind,evidence_note,evidence_url,verified_at')
      .in('decision_id',ids).order('verified_at',{ascending:false}).limit(300);
    if(historyError)throw historyError;
    setHistory(events||[]);
   }else setHistory([]);
  }catch{setError('Die amtlichen Beschlüsse konnten nicht geladen werden. Bitte Verbindung prüfen.');}
  finally{setLoading(false);}
 },[userId,focusId]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{setQuery(initialQuery||'');},[initialQuery]);
 useEffect(()=>{
  let live=true;
  setPreferenceLoading(true);
  if(!userId||!supabase){setPreferenceLoading(false);return;}
  supabase.from('ff_decision_subscriptions').select('enabled,topics').eq('user_id',userId).maybeSingle()
   .then(({data,error:e})=>{if(live){if(e)setError('Benachrichtigungseinstellung konnte nicht geladen werden.');else {setSubscribed(!!data?.enabled);setSelectedTopics(Array.isArray(data?.topics)?data.topics:[]);}setPreferenceLoading(false);}})
   .catch(()=>{if(live){setPreferenceLoading(false);setError('Benachrichtigungseinstellung konnte nicht geladen werden.');}});
  return()=>{live=false;};
 },[userId]);
 const savePreference=async(next,topics)=>{
  if(saving||preferenceLoading||!userId)return;
  setSaving(true);
  try{
   const {error:e}=await supabase.from('ff_decision_subscriptions')
    .upsert({user_id:userId,enabled:next,topics,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   if(e)throw e;
   setSubscribed(next);setSelectedTopics(topics);
  }catch{setError('Die Einstellung konnte nicht gespeichert werden. Bitte erneut versuchen.');}
  finally{setSaving(false);}
 };
 const change=next=>savePreference(next,selectedTopics);
 const changeTopic=next=>savePreference(subscribed,next);
 const visible=useMemo(()=>{
  const words=normal(query).split(/\s+/).filter(Boolean);
  return rows.filter(x=>(area==='all'||x.level===area)&&(topic==='all'||x.family_topic===topic)&&
   words.every(w=>normal([x.title,x.source_name,x.simple_summary,x.official_excerpt].join(' ')).includes(w)))
   .sort((a,b)=>(a.id===focusId?-1:b.id===focusId?1:0));
 },[area,topic,query,rows,focusId]);
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
   <Pressable accessibilityRole="button" onPress={()=>setEditTopics(v=>!v)} style={styles.preferencesButton}>
    <Text style={styles.preferencesLabel}>Hinweisthemen: {selectedTopics.length?selectedTopics.map(topicName).join(', '):'Alle Themen'} {editTopics?'−':'+'}</Text>
   </Pressable>
   {editTopics?<View style={styles.preferenceTopics}>
    <Chip label="Alle Themen" selected={!selectedTopics.length} onPress={()=>changeTopic([])}/>
    {TOPICS.map(([id,name])=><Chip key={id} label={name} selected={selectedTopics.includes(id)} onPress={()=>changeTopic(selectedTopics.includes(id)?selectedTopics.filter(t=>t!==id):[...selectedTopics,id])}/>)}
    <Text style={styles.small}>Ohne Einschränkung erhältst du Hinweise zu allen veröffentlichten Themen. Die Themenauswahl wird auch bei ausgeschalteten Hinweisen gespeichert.</Text>
   </View>:null}
   <Text style={styles.small}>Die Auswahl gilt für dein Familienfunke-Konto. Nur nach Aktivierung neu veröffentlichte Einträge lösen Hinweise aus. Push auf den Sperrbildschirm ist dafür noch nicht eingerichtet.</Text>
  </View>
  <TextInput accessibilityLabel="Beschlüsse durchsuchen" placeholder="Beschlüsse und Themen suchen"
   placeholderTextColor={C.muted} value={query} onChangeText={setQuery} style={styles.input}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
   {LEVELS.map(([id,title])=><Chip key={id} label={title} selected={area===id} onPress={()=>setArea(id)}/>)}
  </ScrollView>
  <Text style={styles.muted}>Thema auswählen</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
   <Chip label="Alle Themen" selected={topic==='all'} onPress={()=>setTopic('all')}/>
   {TOPICS.map(([id,name])=><Chip key={id} label={name} selected={topic===id} onPress={()=>setTopic(id)}/>)}
  </ScrollView>
  <SearchResultFeedback active={!!(query.trim()||area!=='all'||topic!=='all')} query={query} count={visible.length} loading={loading} error={error} context="Amtliche Beschlüsse"
    hint="Nur veröffentlichte, recherchierte Einträge. Kein Treffer bedeutet nicht, dass es keinen Beschluss gibt."/>
   {loading&&!rows.length?<ActivityIndicator color={C.accent}/>:null}
  {error?<View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.note}>{error}</Text>
   <Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Erneut versuchen</Text></Pressable></View>:null}
  {!loading&&!visible.length?<View style={styles.card}><Text style={styles.cardHeading}>Keine passenden Einträge</Text>
   <Text style={styles.muted}>Der Monitor zeigt nur nachvollziehbare amtliche Veröffentlichungen. Fehlende Einträge bedeuten nicht, dass keine Entscheidungen getroffen wurden.</Text></View>:null}
  {visible.map(item=>{
   const open=expanded===item.id;
   return <View key={item.id} style={styles.card}>
    <Text style={styles.meta}>{item.level==='bund'?'Bund':item.level==='brandenburg'?'Brandenburg':'Landkreis'} · {topicName(item.family_topic)} · Veröffentlicht {date(item.published_at)}</Text>
    {item.decision_date?<Text style={styles.small}>Entscheidung vom {date(item.decision_date)}</Text>:null}
    <Text accessibilityRole="header" style={styles.cardHeading}>{item.title}</Text>
    <Text style={styles.status}>{STATUS[item.decision_status]||STATUS.unklar}</Text>
    {item.status_review_pending?<Text style={styles.note}>Die amtliche Quelle wurde aktualisiert. Ob sich dadurch der Rechtsstand ändert, wird noch geprüft. Angezeigt wird bis dahin der zuletzt bestätigte Stand.</Text>:null}
    {item.status_checked_at&&Date.now()-new Date(item.status_checked_at).getTime()>21*86400000?<Text style={styles.note}>Die letzte Prüfung des Verfahrensstands liegt über drei Wochen zurück. Bitte die amtliche Quelle auf neuere Entscheidungen prüfen.</Text>:null}
    <Text style={styles.question}>Was wurde entschieden?</Text>
    <Text style={styles.body} numberOfLines={open?undefined:3}>{item.editorial_reviewed&&item.simple_summary?item.simple_summary:HELP[item.decision_status]||HELP.unklar}</Text>
    {item.editorial_reviewed&&item.family_impact?<><Text style={styles.question}>Betrifft euch das?</Text><Text style={styles.body} numberOfLines={open?undefined:2}>{item.family_impact}</Text></>:null}
    <Text style={styles.question}>Gilt es schon?</Text>
    <Text style={styles.body}>{item.decision_status==='inkraft'?'Ja, laut geprüftem Verfahrensstand ist die Regelung in Kraft. Übergangsfristen prüfen.':item.decision_status==='verkuendet'?'Amtlich veröffentlicht. Der Starttermin kann später liegen.':'Aus diesem Verfahrensstand folgt noch kein neues geltendes Gesetz.'}</Text>
    {!item.editorial_reviewed?<Text style={styles.small}>Allgemeine Erklärung des Verfahrens. Eine geprüfte Erläuterung dieses konkreten Beschlusses liegt noch nicht vor.</Text>:null}
    {open?<View style={styles.details}>
      
      {item.editorial_reviewed&&item.next_step?<><Text style={styles.section}>Wie geht es weiter?</Text><Text style={styles.body}>{item.next_step}</Text></>:null}
      {item.official_excerpt?<><Text style={styles.section}>Kurztext der amtlichen Quelle</Text><Text style={styles.body}>{item.official_excerpt}</Text></>:null}
      {item.status_checked_at?<Text style={styles.small}>Rechtsstand redaktionell geprüft: {date(item.status_checked_at)}</Text>:null}
      {item.last_official_check_at?<Text style={styles.small}>Amtliche Quelle technisch abgerufen: {date(item.last_official_check_at)}. Dieser Abruf bestätigt nicht automatisch den Rechtsstand.</Text>:null}
      {history.some(event=>event.decision_id===item.id)?<>
       <Text accessibilityRole="header" style={styles.section}>Dokumentierter Verfahrensverlauf</Text>
       {history.filter(event=>event.decision_id===item.id).map(event=><View key={event.id} style={styles.historyRow}>
        <Text style={styles.meta}>{event.event_kind==='baseline'?'Erfasster Ausgangsstand':'Geprüfte Statusänderung'} · {date(event.verified_at)}</Text>
        <Text style={styles.body}>{STATUS[event.status]||STATUS.unklar}</Text>
        <Text style={styles.small}>{event.evidence_note}</Text>
        {trusted(event.evidence_url)?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(event.evidence_url)} style={styles.preferencesButton}>
         <Text style={styles.link}>Beleg für diesen Verfahrensstand</Text></Pressable>:null}
       </View>)}
      </>:null}
      <Text style={styles.small}>Ein Veröffentlichungsdatum ist nicht automatisch das Datum des Inkrafttretens. Einzelne Wirkungen und Fristen müssen aus der amtlichen Quelle hervorgehen.</Text>
    </View>:null}
    <View style={styles.actions}>
     <Pressable accessibilityRole="button" onPress={()=>setExpanded(open?null:item.id)} style={styles.action}><Text style={styles.actionText}>{open?'Weniger':'Einordnung lesen'}</Text></Pressable>
     {trusted(item.source_url)?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(item.source_url)} style={styles.action}><Text style={styles.actionText}>Amtliche Quelle öffnen</Text></Pressable>:null}
    </View>
    <Text style={styles.source}>Quelle: {item.source_name}</Text>
   </View>;
  })}
  <Pressable accessibilityRole="button" accessibilityState={{expanded:showSources}} onPress={()=>setShowSources(v=>!v)} style={styles.sourcesToggle}><Text style={styles.question}>{showSources?'Quelleninformationen ausblenden':'Quellen und Arbeitsweise anzeigen'} {showSources?'−':'+'}</Text></Pressable>
   {showSources?<View style={styles.card}>
   <Text style={styles.section}>So arbeitet der Beschluss-Monitor</Text>
   <Text style={styles.body}>Wir trennen Kabinettsentscheidungen, Parlamentsbeschlüsse, Verkündungen und Inkrafttreten. Automatisch erkannte Quellenmeldungen sind nicht dasselbe wie redaktionell geprüfte Erklärungen. Keine politischen Kommentare, keine Bewertung von Parteien.</Text>
   <Text style={styles.small}>Bund und Brandenburg zuerst. Bei Bundesgesetzen kann der weitere Weg über Bundesrat, Vermittlung und Verkündung führen. Kommunale Beschlüsse werden erst nach verlässlicher technischer Quellenanbindung ergänzt. Es besteht kein Anspruch auf Vollständigkeit.</Text>
   <Text style={styles.section}>Weitere amtliche Quellen</Text>
   <Pressable accessibilityRole="link" onPress={()=>Linking.openURL('https://dip.bundestag.de/')} style={styles.action}><Text style={styles.actionText}>Bundestag – Gesetzgebungsverfahren (DIP)</Text></Pressable>
   <Pressable accessibilityRole="link" onPress={()=>Linking.openURL('https://www.landtag.brandenburg.de/de/rss-infodienste/12411')} style={styles.action}><Text style={styles.actionText}>Landtag Brandenburg – aktuelle Gesetze</Text></Pressable>
   <Pressable accessibilityRole="link" onPress={()=>Linking.openURL('https://web.landkreis-oder-spree.de/bi/info.asp')} style={styles.action}><Text style={styles.actionText}>Oder-Spree – Kreistag und Beschlussunterlagen</Text></Pressable>
   <Text style={styles.small}>Das Bürgerinformationssystem von Oder-Spree ist als Originalquelle verlinkt. Eine automatische Auswertung und Benachrichtigung zu Kreistagsbeschlüssen ist noch nicht freigeschaltet.</Text>
  </View>:null}
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:C.bg},page:{padding:16,paddingBottom:32,gap:13},
 hero:{backgroundColor:C.sunPale,padding:22,borderRadius:22,gap:8},heading:{fontSize:25,fontWeight:'900',color:C.ink},
 intro:{fontSize:15,color:C.ink,lineHeight:22},card:{backgroundColor:C.paper,borderRadius:18,padding:18,gap:10,borderWidth:1,borderColor:C.line},
 row:{flexDirection:'row',alignItems:'center',gap:12},cardHeading:{fontSize:18,fontWeight:'800',color:C.ink,lineHeight:25},
 body:{fontSize:16,color:C.ink,lineHeight:24},muted:{fontSize:14,color:C.muted,lineHeight:20},
 small:{fontSize:14,color:C.muted,lineHeight:21},meta:{fontSize:14,fontWeight:'700',color:C.muted},
 status:{fontSize:14,fontWeight:'800',color:C.accentDark,backgroundColor:C.mint,alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:10,borderRadius:12},
 note:{fontSize:14,color:C.danger},link:{color:C.accentDark,fontWeight:'800',paddingVertical:8},
 input:{backgroundColor:C.paper,borderRadius:15,padding:14,fontSize:15,color:C.ink,borderWidth:1,borderColor:C.line,minHeight:48},
 filters:{gap:8,paddingVertical:2},preferencesButton:{paddingVertical:10,minHeight:44,justifyContent:'center'},preferencesLabel:{fontWeight:'800',color:C.accentDark,fontSize:14},preferenceTopics:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingVertical:10,paddingHorizontal:15,borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,minHeight:44,justifyContent:'center'},
 chipSelected:{backgroundColor:C.accentDark,borderColor:C.accentDark},chipText:{fontSize:14,color:C.ink,fontWeight:'700'},chipSelectedText:{color:C.white},
 question:{fontSize:15,fontWeight:'800',color:C.ink,marginTop:7},sourcesToggle:{minHeight:50,padding:14,backgroundColor:C.sunPale,borderRadius:14,justifyContent:'center'},details:{gap:8,marginTop:6,borderTopWidth:1,borderTopColor:C.line,paddingTop:12},historyRow:{backgroundColor:C.bg,borderRadius:12,padding:12,gap:5},section:{fontSize:15,fontWeight:'800',color:C.ink},
 actions:{flexDirection:'row',gap:8,flexWrap:'wrap'},action:{borderRadius:14,backgroundColor:C.sunPale,paddingVertical:11,paddingHorizontal:14,minHeight:44,justifyContent:'center'},
 actionText:{fontSize:14,fontWeight:'800',color:C.accentDark},source:{fontSize:14,color:C.muted}
});
