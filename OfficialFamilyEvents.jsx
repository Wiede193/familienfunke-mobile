import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {OFFICIAL_EVENT_DISTRICTS,OFFICIAL_EVENT_CATEGORIES,officialEventRange,officialEventDay,officialEventDateLabel,officialEventVisible} from './OfficialFamilyEventUtils';

// Official/third-party events are distinct from Familienfunke's own family meetings.
// No Google scraping, no automatic participation or profile/health data transfer.
const categoryName=id=>OFFICIAL_EVENT_CATEGORIES.find(x=>x.id===id)?.label||'Familienveranstaltung';
const regionName=id=>OFFICIAL_EVENT_DISTRICTS.find(x=>x.id===id)?.label||id;
function SelectRow({label,options,value,onChange}){
 return <View style={{marginTop:10}}>
  <Text style={s.sub}>{label}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingVertical:8}}>
   {options.map(option=><Pressable key={option.id} accessibilityRole="button"
     accessibilityState={{selected:value===option.id}}
     onPress={()=>onChange(option.id)} style={[s.chip,value===option.id&&s.chipSelected]}>
      <Text style={[s.chipText,value===option.id&&s.chipTextSelected]}>{option.label}</Text>
   </Pressable>)}
  </ScrollView>
 </View>;
}
export default function OfficialFamilyEvents({userId,month=null,compact=false,onSaved,onEventsLoaded}){
 const [district,setDistrict]=useState('all'),[category,setCategory]=useState('all');
 const [events,setEvents]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [revision,setRevision]=useState(0),[savingKey,setSavingKey]=useState(null);
 const seq=useRef(0),lock=useRef(false);
 const range=useMemo(()=>officialEventRange(month),[month]);
 useEffect(()=>{
  let active=true;const current=++seq.current;
  setLoading(true);setError('');
  (async()=>{
   const {data,error:failure}=await supabase.from('ff_official_family_events')
    .select('id,source_key,title,summary,category,district,city,venue,start_date,end_date,start_time,end_time,source_url,source_name,source_kind,age_note,cost_note,booking_note,accessibility_note,checked_on,published')
    .gte('end_date',range.from).lte('start_date',range.to)
    .order('start_date',{ascending:true}).order('start_time',{ascending:true}).limit(100);
   if(failure||!Array.isArray(data))throw Error('Termine können derzeit nicht geladen werden.');
   if(active&&current===seq.current){setEvents(data);onEventsLoaded?.(data);}
  })().catch(e=>{if(active&&current===seq.current){setEvents([]);onEventsLoaded?.([]);setError(e.message);}})
    .finally(()=>{if(active&&current===seq.current)setLoading(false);});
  const sub=AppState.addEventListener('change',next=>{if(next==='active'&&active)setRevision(x=>x+1);});
  return()=>{active=false;seq.current++;sub.remove();};
 },[range.from,range.to,revision,userId]);
 const shown=events.filter(e=>officialEventVisible(e,district,category));
 async function save(event){
  if(lock.current||!userId)return;
  lock.current=true;setSavingKey(event.id);
  const title=event.title.slice(0,100),day=event.start_date;
  try{
   const {data:session,error:authError}=await supabase.auth.getSession();
   if(authError||session.session?.user?.id!==userId)throw Error('Deine Anmeldung hat sich geändert.');
   const {data:existing,error:lookupError}=await supabase.from('ff_personal_calendar')
     .select('id').eq('user_id',userId).eq('kind','personal')
     .eq('title',title).eq('day',day).limit(1);
   if(lookupError)throw Error('Kalenderzugriff fehlgeschlagen.');
   if(existing?.length){
    Alert.alert('Bereits vorgemerkt','Dieser Termin steht bereits in deinem privaten Kalender.');
    return;
   }
   const note=('Öffentlicher Veranstaltungstipp – keine Anmeldung oder Teilnahmebestätigung. Quelle: '+event.source_url).slice(0,500);
   const {error:saveError}=await supabase.from('ff_personal_calendar').insert({
    user_id:userId,kind:'personal',title,day,
    local_time:event.start_time?String(event.start_time).slice(0,5):null,note
   });
   if(saveError)throw Error('Der Termin konnte nicht vorgemerkt werden. Kalenderlimit und Verbindung prüfen.');
   Alert.alert('Privat vorgemerkt','Das ist keine Anmeldung. Bitte Veranstaltungsangaben und mögliche Tickets bei der Originalquelle prüfen.');
   onSaved?.();
  }catch(e){Alert.alert('Kalender',e.message||'Speichern fehlgeschlagen.');}
  finally{lock.current=false;setSavingKey(null);}
 }
 const openSource=url=>Linking.openURL(url).catch(()=>Alert.alert('Quelle nicht erreichbar','Die Originalseite konnte nicht geöffnet werden.'));
 return <View style={s.section}>
  <Text accessibilityRole="header" style={s.heading}>{compact?'Offizielle Familienveranstaltungen im Monat':'Offizielle Familienveranstaltungen in der Region'}</Text>
  <Text style={s.description}>Öffentlich angekündigte, redaktionell ausgewählte Familienangebote mit Originalquelle. Nicht alle Termine aus Google oder regionalen Kalendern werden automatisch erfasst. Preise, Uhrzeiten und Absagen beim Veranstalter prüfen.</Text>
  <SelectRow label="Landkreis oder Stadt" options={OFFICIAL_EVENT_DISTRICTS} value={district} onChange={setDistrict}/>
  <SelectRow label="Was möchtet ihr unternehmen?" options={OFFICIAL_EVENT_CATEGORIES} value={category} onChange={setCategory}/>
  {loading?<View style={s.loading}><ActivityIndicator color={C.accentDark}/><Text style={s.sub}>Offizielle Termine laden …</Text></View>:null}
  {!loading&&error?<View style={s.card}><Text style={s.description}>{error}</Text><Pressable accessibilityRole="button" onPress={()=>setRevision(n=>n+1)} style={s.btn}><Text style={s.btnText}>Erneut laden</Text></Pressable></View>:null}
  {!loading&&!error?<Text accessibilityLiveRegion="polite" style={s.sub}>{shown.length} passende {shown.length===1?'Veranstaltung':'Veranstaltungen'} {month?'für '+month:'in den nächsten 90 Tagen'} gefunden</Text>:null}
  {!loading&&!error&&!shown.length?<Text style={s.description}>Für diese Auswahl sind aktuell keine redaktionell geprüften Termine hinterlegt. In der Originalquelle können weitere Angebote stehen.</Text>:null}
  {shown.map(event=><View key={event.id} style={s.card}>
    <Text style={s.kicker}>{categoryName(event.category)} · {regionName(event.district)}</Text>
    <Text style={s.eventTitle}>{event.title}</Text>
    <Text style={s.date}>{officialEventDateLabel(event)}</Text>
    <Text style={s.sub}>{event.venue} · {event.city}</Text>
    <Text style={s.description}>{event.summary}</Text>
    {!!event.age_note&&<Text style={s.sub}>Alter: {event.age_note}</Text>}
    {!!event.cost_note&&<Text style={s.sub}>Kosten: {event.cost_note}</Text>}
    {!!event.booking_note&&<Text style={s.sub}>Hinweis: {event.booking_note}</Text>}
    <Text style={s.sub}>Barrierefreiheit: {event.accessibility_note||'Nicht geprüft; bitte erfragen.'}</Text>
    <Text style={s.source}>Quelle: {event.source_name} · geprüft am {officialEventDay(event.checked_on)}</Text>
    <View style={s.actions}>
     <Pressable accessibilityRole="link" accessibilityLabel={'Offizielle Quelle zu '+event.title+' öffnen'}
       style={s.btn} onPress={()=>openSource(event.source_url)}>
       <Text style={s.btnText}>Originalquelle öffnen</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={event.title+' privat im Kalender vormerken'}
       accessibilityState={{disabled:!!savingKey,busy:savingKey===event.id}}
       disabled={!!savingKey} onPress={()=>save(event)} style={[s.btn,s.secondary]}>
       <Text style={s.secondaryText}>{savingKey===event.id?'Wird vorgemerkt …':'Privat vormerken'}</Text>
     </Pressable>
    </View>
  </View>)}
 </View>;
}
const s=StyleSheet.create({
 section:{marginTop:20,gap:9},heading:{fontSize:19,fontWeight:'800',color:C.ink},
 description:{fontSize:14,lineHeight:21,color:C.ink},sub:{fontSize:13,lineHeight:19,color:C.muted},
 chip:{minHeight:44,paddingHorizontal:12,paddingVertical:10,justifyContent:'center',backgroundColor:C.paper,borderColor:C.line,borderWidth:1,borderRadius:22},
 chipSelected:{backgroundColor:C.accentDark,borderColor:C.accentDark},
 chipText:{fontSize:13,fontWeight:'700',color:C.ink},chipTextSelected:{color:C.white},
 card:{padding:15,borderWidth:1,borderColor:C.line,borderRadius:17,backgroundColor:C.paper,gap:7},
 kicker:{fontSize:12,fontWeight:'800',color:C.accentDark},eventTitle:{fontSize:17,fontWeight:'800',color:C.ink},
 date:{fontSize:15,fontWeight:'800',color:C.ink},source:{fontSize:12,lineHeight:17,color:C.muted,marginTop:3},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:7},
 btn:{paddingVertical:12,paddingHorizontal:13,borderRadius:12,minHeight:44,backgroundColor:C.accentDark,justifyContent:'center'},
 btnText:{fontSize:13,fontWeight:'800',color:C.white},secondary:{backgroundColor:C.mint},
 secondaryText:{fontSize:13,fontWeight:'800',color:C.accentDark},
 loading:{padding:16,alignItems:'center',gap:8}
});
