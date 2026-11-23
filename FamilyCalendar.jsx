import React,{useEffect,useRef,useState} from 'react';
import {Alert,AppState,Pressable,ScrollView,StyleSheet,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';
import OfficialFamilyEvents from './OfficialFamilyEvents';
import FamilyDateFields from './FamilyDateFields';
import {dayKey,monthDays,moveMonth,entryDay,entryTime,compareEntries,calendarFields} from './CalendarDates';

async function verifyAccount(userId){
 const {data,error}=await supabase.auth.getSession();
 if(error||data.session?.user?.id!==userId)throw Error('Anmeldung hat sich geändert.');
}
export async function rememberCalendarEvent(userId,kind,id){
 await verifyAccount(userId);
 if(!['family','partner'].includes(kind))throw Error('Unbekannte Veranstaltung.');
 const {error}=await supabase.from('ff_personal_calendar').insert({user_id:userId,kind,[kind==='family'?'family_event_id':'partner_event_id']:id});
 if(error?.code==='23505')return 'already';
 if(error)throw Error('Termin konnte nicht gemerkt werden. Bitte Verfügbarkeit und Kalenderlimit prüfen.');
 return 'saved';
}
export function CalendarEventButton({userId,kind,id}){
 const [busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function save(){
  if(lock.current)return;lock.current=true;setBusy(true);
  try{
   const result=await rememberCalendarEvent(userId,kind,id);
   Alert.alert(result==='already'?'Bereits im Kalender':'Im Kalender gemerkt','Dieser Eintrag ist privat. Eine Teilnahme wird dadurch nicht bestätigt.');
  }catch(e){Alert.alert('Kalender',e.message);}
  finally{lock.current=false;setBusy(false);}
 }
 return <Action disabled={busy} secondary onPress={save}>{busy?'Wird gemerkt …':'Im Kalender merken'}</Action>;
}
function Action({children,onPress,disabled=false,secondary=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
 style={[s.action,secondary&&s.secondary,disabled&&{opacity:.5}]}><Text style={[s.actionText,secondary&&{color:C.accentDark}]}>{children}</Text></Pressable>;
}
const emptyForm=(day,seed)=>({title:seed?.title||'',note:'',day,time:'',kind:seed?'outing':'personal',place_id:seed?.id||null,id:null});
const LABELS={personal:'Privater Termin',outing:'Geplanter Ausflug',family:'Familientreffen · gemerkt',partner:'Partnerveranstaltung · gemerkt'};
const monthLabel=m=>new Date(Number(m.slice(0,4)),Number(m.slice(5))-1,1,12).toLocaleDateString('de-DE',{month:'long',year:'numeric'});
export default function FamilyCalendar({userId,seed,onOpenEvent,onOpenPlace}){
 const today=dayKey(new Date()),[month,setMonth]=useState(today.slice(0,7)),[chosen,setChosen]=useState(today);
 const [form,setForm]=useState(()=>seed?emptyForm(today,seed):null),[rows,setRows]=useState([]),[officialEvents,setOfficialEvents]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const seq=useRef(0),alive=useRef(true),lock=useRef(false),scroll=useRef(null);
 const {width,fontScale}=useWindowDimensions();
 async function refresh(){
  const n=++seq.current;setLoading(true);
  try{
   const {data,error}=await supabase.rpc('ff_calendar_list');
   if(error||!Array.isArray(data))throw Error();
   if(alive.current&&n===seq.current){setRows(data);setNotice('');}
  }catch{if(alive.current&&n===seq.current){setRows([]);setNotice('Kalender konnte nicht geladen werden.');}}
  finally{if(alive.current&&n===seq.current)setLoading(false);}
 }
 useEffect(()=>{
  alive.current=true;refresh();
  const sub=AppState.addEventListener('change',x=>{if(x==='active')refresh();});
  return()=>{alive.current=false;seq.current++;sub.remove();};
 },[userId]);
 function changeMonth(delta){const next=moveMonth(month,delta);if(next<'1900-01'||next>'2100-12')return;setMonth(next);setChosen(next+'-01');}
 function openForm(value){setForm(value);scroll.current?.scrollTo({y:0,animated:false});}
 function change(k,v){setForm(old=>({...old,[k]:v}));}
 async function save(){
  if(lock.current||!form)return;lock.current=true;setBusy(true);
  try{
   const fields=calendarFields(form);
   await verifyAccount(userId);
   const response=form.id?await supabase.from('ff_personal_calendar').update(fields).eq('id',form.id).eq('user_id',userId).select('id').single():
    await supabase.from('ff_personal_calendar').insert({...fields,user_id:userId,kind:form.kind,place_id:form.place_id}).select('id').single();
   if(response.error||!response.data?.id)throw Error('Speichern nicht möglich. Bitte Verbindung und Kalenderlimit prüfen.');
   if(alive.current){setChosen(fields.day);setMonth(fields.day.slice(0,7));setForm(null);await refresh();}
  }catch(e){if(alive.current)Alert.alert('Kalender',e.message);}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function remove(row){
  Alert.alert('Kalendereintrag löschen?','Nur dein Kalendereintrag wird entfernt. Eine Veranstaltung oder Teilnahme bleibt unverändert.',[
   {text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:async()=>{
    if(lock.current)return;lock.current=true;setBusy(true);
    try{
     await verifyAccount(userId);
     const {data,error}=await supabase.from('ff_personal_calendar').delete().eq('id',row.id).eq('user_id',userId).select('id');
     if(error||data?.length!==1)throw Error();
     if(alive.current){if(form?.id===row.id)setForm(null);await refresh();}
    }catch{if(alive.current)Alert.alert('Kalender','Eintrag konnte nicht gelöscht werden.');}
    finally{lock.current=false;if(alive.current)setBusy(false);}
   }}
  ]);
 }
 const monthRows=rows.filter(r=>entryDay(r)?.startsWith(month)).sort(compareEntries);
 const unavailable=rows.filter(r=>!r.available);
 const selectedRows=monthRows.filter(r=>entryDay(r)===chosen);
 function render(row){
  const linked=['family','partner'].includes(row.kind);
  return <View key={row.id} style={s.card}>
   <View style={s.line}><View style={{flex:1}}><Text style={s.sub}>{LABELS[row.kind]}</Text>
   <Text style={s.heading}>{row.available?row.title:'Veranstaltung nicht verfügbar'}</Text>
   {row.available?<Text style={s.text}>{entryDay(row)}{entryTime(row)?' · '+entryTime(row)+' Uhr':' · Ganztägig'}{row.region_label?' · '+row.region_label:''}</Text>:<Text style={s.text}>Der Termin ist nicht mehr sichtbar oder wurde nicht freigegeben.</Text>}</View>
   <Pressable accessibilityRole="button" accessibilityLabel={(row.title||'Kalendereintrag')+' löschen'} disabled={busy} onPress={()=>remove(row)} style={s.close}><Text style={s.x}>×</Text></Pressable></View>
   {row.note?<Text style={s.text}>{row.note}</Text>:null}
   {!linked?<Action secondary disabled={busy} onPress={()=>openForm({id:row.id,title:row.title,note:row.note,day:row.day,time:entryTime(row),kind:row.kind,place_id:row.place_id})}>Bearbeiten</Action>:null}
   {linked&&row.available&&new Date(row.starts_at)>new Date()?<Action secondary onPress={()=>onOpenEvent(row.kind,row.source_id)}>Veranstaltung öffnen</Action>:null}
   {row.kind==='outing'&&row.place_id?<Action secondary onPress={()=>onOpenPlace(row.place_id)}>Ausflugsziel öffnen</Action>:null}
  </View>;
 }
 return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
  <View style={s.hero}><Text accessibilityRole="header" style={s.title}>Mein Familienkalender</Text><Text style={s.text}>Private Termine, Ausflüge und gemerkte Veranstaltungen. Nur dein Konto sieht deine Kalendereinträge.</Text></View>
  <Action onPress={()=>openForm(emptyForm(chosen,null))}>＋ Privaten Termin anlegen</Action>
  {form?<View style={s.card}>
   <Text accessibilityRole="header" style={s.heading}>{form.id?'Termin bearbeiten':form.kind==='outing'?'Ausflug einplanen':'Neuer privater Termin'}</Text>
   <Text style={s.sub}>Titel</Text><TextInput accessibilityLabel="Termintitel" style={s.input} value={form.title} maxLength={100} onChangeText={v=>change('title',v)}/>
   <FamilyDateFields title="Terminzeit auswählen" date={form.day} onDateChange={v=>change('day',v)} time={form.time} onTimeChange={v=>change('time',v)} timeOptional/>
   <Text style={s.sub}>Private Notiz (optional)</Text><TextInput accessibilityLabel="Private Notiz" multiline maxLength={500} style={[s.input,{minHeight:80,textAlignVertical:'top'}]} value={form.note} onChangeText={v=>change('note',v)}/>
   <Action disabled={busy} onPress={save}>{busy?'Wird gespeichert …':'Termin speichern'}</Action><Action secondary disabled={busy} onPress={()=>setForm(null)}>Abbrechen</Action>
  </View>:null}
  <View style={s.card}>
   <View style={s.line}><Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={()=>changeMonth(-1)} style={s.close}><Text style={s.x}>‹</Text></Pressable>
    <Text accessibilityRole="header" style={[s.heading,{flex:1,textAlign:'center'}]}>{monthLabel(month)}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={()=>changeMonth(1)} style={s.close}><Text style={s.x}>›</Text></Pressable></View>
   {width>=376&&fontScale<1.5?<><View style={s.week}>{['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=><Text key={d} style={[s.sub,s.weekDay]}>{d}</Text>)}</View>
    <View style={s.week}>{monthDays(month).map((day,i)=>{
     const count=monthRows.filter(r=>entryDay(r)===day).length;
     const publicCount=officialEvents.filter(e=>e.start_date<=day&&e.end_date>=day).length;
     return day?<Pressable key={day} accessibilityRole="button" accessibilityLabel={day+', '+count+' private Termine und '+publicCount+' offizielle Familienveranstaltungen'} accessibilityState={{selected:day===chosen}}
      onPress={()=>setChosen(day)} style={[s.day,day===chosen&&s.selected]}><Text style={[s.dayText,day===chosen&&{color:C.white}]}>{Number(day.slice(-2))}</Text>{count>0?<View style={[s.dot,day===chosen&&{backgroundColor:C.white}]}/>:null}{publicCount>0?<View style={[s.dot,{backgroundColor:'#D88D15'},day===chosen&&{backgroundColor:C.white}]}/>:null}</Pressable>:<View key={'blank'+i} style={s.day}/>;
    })}</View></>:<Text style={s.sub}>Bei großer Schrift werden die Termine als Monatsliste angezeigt.</Text>}
   <Action secondary onPress={()=>{setMonth(today.slice(0,7));setChosen(today);}}>Heute</Action>
  </View>
  {notice?<Text accessibilityLiveRegion="assertive" style={s.text}>{notice}</Text>:null}
  <Action secondary disabled={loading} onPress={refresh}>{loading?'Kalender wird geladen …':'Aktualisieren'}</Action>
  <Text accessibilityRole="header" style={s.heading}>{chosen}</Text>
  {selectedRows.length?selectedRows.map(render):!loading?<Text style={s.text}>An diesem Tag ist kein privater Termin eingetragen. Offizielle Veranstaltungen erkennst du an einem zusätzlichen Kalendermarker und findest du unten.</Text>:null}
  <Action secondary onPress={()=>openForm(emptyForm(chosen,null))}>Termin für diesen Tag anlegen</Action>
  <Text accessibilityRole="header" style={s.heading}>Weitere Termine im Monat</Text>
  {monthRows.filter(r=>entryDay(r)!==chosen).map(render)}
  {!monthRows.length&&!loading?<Text style={s.text}>Noch keine Termine in diesem Monat.</Text>:null}
  {unavailable.length?<><Text accessibilityRole="header" style={s.heading}>Nicht verfügbare Veranstaltungen</Text>{unavailable.map(render)}</>:null}
  <OfficialFamilyEvents userId={userId} month={month} compact onSaved={refresh} onEventsLoaded={setOfficialEvents}/>
  <Text style={s.sub}>Veranstaltung merken ist keine Teilnahmebestätigung. Erinnerungen, Serientermine und gemeinsame Kalender sind noch nicht verfügbar.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:16,paddingBottom:36,gap:12,backgroundColor:C.bg},hero:{padding:18,backgroundColor:C.sun,borderRadius:22,gap:8},title:{fontSize:25,fontWeight:'900',color:C.ink},heading:{fontSize:18,fontWeight:'800',color:C.ink},text:{fontSize:15,lineHeight:22,color:C.ink},sub:{fontSize:13,lineHeight:19,color:C.muted},card:{backgroundColor:C.paper,borderRadius:19,padding:14,borderWidth:1,borderColor:C.line,gap:10},line:{flexDirection:'row',alignItems:'center',gap:8},close:{minWidth:44,minHeight:44,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:C.sunPale},x:{fontSize:26,color:C.ink},input:{minHeight:48,borderWidth:1,borderColor:C.line,borderRadius:12,padding:11,fontSize:16,color:C.ink},action:{minHeight:48,justifyContent:'center',alignItems:'center',padding:12,backgroundColor:C.accentDark,borderRadius:14},secondary:{backgroundColor:C.mint},actionText:{fontSize:15,fontWeight:'800',color:C.white,textAlign:'center'},week:{flexDirection:'row',flexWrap:'wrap'},weekDay:{width:'14.2857%',textAlign:'center'},day:{width:'14.2857%',minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:12},dayText:{fontSize:15,color:C.ink,fontWeight:'700'},selected:{backgroundColor:C.accentDark},dot:{width:6,height:6,borderRadius:3,backgroundColor:C.accentDark,marginTop:3}});
