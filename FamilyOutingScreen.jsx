import React,{useRef,useState,useEffect} from 'react';
import {ActivityIndicator,AccessibilityInfo,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {CURATED_FAMILY_PLACES} from './FamilyMapCurated';
import {NATIONAL_FAMILY_PLACES} from './FamilyMapNational';
import {ORIGINS,AGES,RADII,BUDGETS,INTERESTS,DURATIONS,localOrigins,remoteOrigins,selectOutings,orderOutings,planSteps} from './FamilyOutingPlan';

const CATALOG=[...CURATED_FAMILY_PLACES,...NATIONAL_FAMILY_PLACES];
const initial={query:'',origin:null,prefs:{ages:[],radius:25,budget:50,interest:'any',duration:'full'},result:null};
function Action({children,onPress,disabled=false,secondary=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
 style={[s.button,secondary&&s.secondary,disabled&&{opacity:.5}]}><Text style={[s.buttonText,secondary&&{color:C.accentDark}]}>{children}</Text></Pressable>;
}
function Pick({title,items,selected,onChange}){
 return <View style={s.group}>
  <Text accessibilityRole="header" style={s.label}>{title}</Text>
  <View style={s.chips}>{items.map(([value,label])=>{
   const active=Array.isArray(selected)?selected.includes(value):selected===value;
   return <Pressable key={String(value)} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:active}}
    onPress={()=>onChange(value)} style={[s.chip,active&&s.active]}><Text style={[s.chipText,active&&{color:C.white}]}>{label}</Text></Pressable>;
  })}</View>
 </View>;
}
export default function FamilyOutingScreen({draft,onSave,onMap,onCalendar}){
 const [form,setForm]=useState(()=>draft||initial);
 const [remote,setRemote]=useState([]),[looking,setLooking]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const current=useRef(form);const seq=useRef(0),alive=useRef(true),locked=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;seq.current++;};},[]);
 function save(next){current.current=next;setForm(next);onSave(next);}
 function change(next){seq.current++;locked.current=false;setBusy(false);setLooking(false);setNotice('');save({...next,result:null});}
 function pref(key,value){change({...current.current,prefs:{...current.current.prefs,[key]:value}});}
 function chooseOrigin(origin){setRemote([]);change({...current.current,query:origin.title,origin});}
 async function searchOrigin(){
  const query=current.current.query.trim();
  if(query.length<3||looking||busy||locked.current)return;
  locked.current=true;const request=++seq.current;setLooking(true);setNotice('');setRemote([]);
  try{
    const {data,error}=await supabase.functions.invoke('ff-geocode',{body:{query}});
    if(!alive.current||request!==seq.current)return;
    if(error||!Array.isArray(data?.places))throw Error();
    const places=remoteOrigins(data.places);setRemote(places);
    if(!places.length)setNotice('Keine passenden Ortszentren gefunden. Bitte nur Stadt oder Gemeinde suchen.');
  }catch{if(alive.current&&request===seq.current)setNotice('Ortssuche gerade nicht verfügbar. Wähle einen vorhandenen Ortsvorschlag oder versuche es später.');}
  finally{if(alive.current&&request===seq.current){locked.current=false;setLooking(false);}}
 }
 async function generate(useAI){
  const snapshot=current.current;
  if(locked.current||!snapshot.origin||!snapshot.prefs.ages.length)return;
  const candidates=selectOutings(snapshot.origin,CATALOG,snapshot.prefs);
  const request=++seq.current;locked.current=true;setBusy(true);setNotice('');
  try{
   let selected=candidates.slice(0,3),mode='local';
   if(useAI&&candidates.length){
     const {ages,budget,interest,duration}=snapshot.prefs;
     try{
       const {data,error}=await supabase.functions.invoke('ff-app-assistant',{body:{mode:'outing',preferences:{ages,budget,interest,duration},candidate_ids:candidates.map(p=>p.id)}});
       if(!alive.current||request!==seq.current)return;
       const ranked=orderOutings(candidates,data?.outing_ids);
       if(!error&&ranked.length){selected=ranked;mode='ai';}
       else setNotice('KI-Auswahl gerade nicht verfügbar oder Kontingent erreicht. Stattdessen werden passende Katalogtreffer angezeigt.');
     }catch{if(alive.current&&request===seq.current)setNotice('KI-Auswahl gerade nicht verfügbar. Stattdessen werden Katalogtreffer angezeigt.');}
   }
   if(!alive.current||request!==seq.current)return;
   save({...snapshot,result:{ids:selected.map(p=>p.id),mode,candidateCount:candidates.length}});
   AccessibilityInfo.announceForAccessibility(selected.length?selected.length+' Ausflugsvorschläge verfügbar.':'Keine passenden Katalogziele gefunden.');
  }finally{if(alive.current&&request===seq.current){locked.current=false;setBusy(false);}}
 }
 const local=form.origin?[]:localOrigins(form.query);
 const candidates=form.result?selectOutings(form.origin,CATALOG,form.prefs):[];
 const results=form.result?orderOutings(candidates,form.result.ids):[];
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
  <View style={s.hero}><Text accessibilityRole="header" style={s.title}>Euer nächster Familienausflug</Text>
   <Text style={s.text}>Wählt eure Wünsche. Die KI sortiert vorhandene Ausflugsziele passend zu eurem Familienalltag.</Text>
  </View>
  <View style={s.card}>
   <Text accessibilityRole="header" style={s.heading}>1. Wo startet ihr?</Text>
   <Text style={s.muted}>Stadt oder Gemeinde, keine genaue Wohnadresse. Keine GPS-Freigabe.</Text>
   <TextInput accessibilityLabel="Ausgangsort eingeben" value={form.query} maxLength={90} autoCorrect={false} returnKeyType="search"
    onChangeText={query=>{setRemote([]);change({...current.current,query,origin:null});}} onSubmitEditing={searchOrigin}
    placeholder="z. B. Frankfurt (Oder)" placeholderTextColor={C.muted} style={s.input}/>
   {form.origin?<Text style={s.selectedOrigin}>Ausgewählt: {form.origin.title}</Text>:<>
    {!form.query.trim()?<View style={s.chips}>{ORIGINS.slice(0,6).map(origin=><Action key={origin.title} secondary onPress={()=>chooseOrigin(origin)}>{origin.title}</Action>)}</View>:null}
    {[...local,...remote.filter(p=>!local.some(x=>x.title===p.title))].map((origin,i)=><Pressable accessibilityRole="button" accessibilityLabel={origin.title+' als Ausgangsort wählen'} key={origin.title+i} onPress={()=>chooseOrigin(origin)} style={s.origin}>
     <Text style={s.label}>{origin.title}</Text>{origin.subtitle?<Text style={s.muted}>{origin.subtitle}</Text>:null}</Pressable>)}
    <Action secondary disabled={looking||busy||form.query.trim().length<3} onPress={searchOrigin}>{looking?'Ortssuche läuft …':'Deutschlandweit Ort suchen'}</Action>
    <Text style={s.muted}>Nur beim Start der externen Ortssuche wird der Suchtext an Photon/OpenStreetMap übermittelt. Keine privaten Adressen eingeben.</Text>
   </>}
  </View>
  <View style={s.card}>
   <Text accessibilityRole="header" style={s.heading}>2. Was passt zu euch?</Text>
   <Pick title="Alter der Kinder (mehrere möglich)" items={AGES} selected={form.prefs.ages} onChange={v=>pref('ages',form.prefs.ages.includes(v)?form.prefs.ages.filter(x=>x!==v):[...form.prefs.ages,v])}/>
   <Pick title="Umkreis in Luftlinie" items={RADII.map(x=>[x,x+' km'])} selected={form.prefs.radius} onChange={v=>pref('radius',v)}/>
   <Pick title="Gesamtbudget für den Ausflug" items={BUDGETS.map(x=>[x,x===0?'0 €':'bis '+x+' €'])} selected={form.prefs.budget} onChange={v=>pref('budget',v)}/>
   <Pick title="Was möchtet ihr erleben?" items={INTERESTS} selected={form.prefs.interest} onChange={v=>pref('interest',v)}/>
   <Pick title="Wie viel Zeit habt ihr?" items={DURATIONS} selected={form.prefs.duration} onChange={v=>pref('duration',v)}/>
   <Text style={s.muted}>Das sind Wünsche, keine Preis- oder Altersgarantie. Bei 0 € werden nur mögliche öffentliche Natur- und Spielziele berücksichtigt. Die KI erhält nur Altersgruppen, Budget, Interesse, Dauer und öffentliche Zielkandidaten, nicht eure Kontodaten oder Ausgangskoordinaten.</Text>
   <Action disabled={busy||looking||!form.origin||!form.prefs.ages.length} onPress={()=>generate(true)}>{busy?'Ausflug wird geplant …':'Ausflug mit KI planen'}</Action>
   <Action secondary disabled={busy||looking||!form.origin||!form.prefs.ages.length} onPress={()=>generate(false)}>Ohne KI passende Ziele finden</Action>
  </View>
  {notice?<Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text>:null}
  {busy?<ActivityIndicator color={C.accent}/>:null}
  {form.result?<View style={s.card}>
   <Text accessibilityRole="header" style={s.heading}>{form.result.mode==='ai'?'Eure KI-Auswahl':'Passende Ziele aus dem Katalog'}</Text>
   <Text style={s.muted}>{form.result.candidateCount} passende Katalogziele im gewählten Radius; bis zu drei Vorschläge. Keine Live-Prüfung von Wetter, Öffnungszeiten, Fahrzeiten oder Preisen.</Text>
   {!results.length?<Text style={s.note}>Der bisherige Ausflugskatalog enthält keine passenden Ziele. Erweitert den Radius, ändert das Interesse oder Budget oder nutzt die Familienkarte.</Text>:null}
   {results.length>0?<>
    <Text style={s.note}>Gesamtbudget: {form.prefs.budget} €. Eintritt, Anfahrt und Verpflegung sind nicht berechnet. Kein Ziel ist als budgetkonform bestätigt.</Text>
    {results.map((p,i)=><View style={s.destination} key={p.id}>
      <Text accessibilityRole="header" style={s.heading}>{i+1}. {p.title}</Text>
      <Text style={s.muted}>{p.region_label} · ca. {Math.round(p.km)} km Luftlinie</Text>
      <Text style={s.text}>{p.description}</Text>
      {p.lowCostLead?<Text style={s.muted}>Öffentliches Natur-/Spielziel als möglicher Spartipp. Aktuelle Kosten und Zugang prüfen.</Text>:null}
      <Action secondary onPress={()=>onMap(p.id)}>Auf Familienkarte ansehen</Action>
      <Action secondary onPress={()=>onCalendar(p)}>Im Kalender einplanen</Action>
      {p.info_url?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(p.info_url).catch(()=>setNotice('Betreiberseite konnte nicht geöffnet werden.'))} style={s.link}><Text style={s.linkText}>Aktuelle Besuchsinfos beim Betreiber prüfen ↗</Text></Pressable>:null}
    </View>)}
    <Text accessibilityRole="header" style={s.heading}>Flexibler Ablauf</Text>
    {planSteps(form.prefs.duration,results,form.prefs.ages).map(step=><Text key={step} style={s.text}>{step}</Text>)}
   </>:null}
  </View>:null}
 </ScrollView>;
}
const s=StyleSheet.create({
 page:{padding:16,paddingBottom:40,gap:13,backgroundColor:C.bg},hero:{backgroundColor:C.sun,borderRadius:24,padding:20,gap:10},
 title:{fontSize:27,fontWeight:'900',color:C.ink},heading:{fontSize:19,fontWeight:'900',color:C.ink},label:{fontSize:16,fontWeight:'800',color:C.ink},
 text:{fontSize:15,lineHeight:23,color:C.ink},muted:{fontSize:13,lineHeight:19,color:C.muted},
 card:{backgroundColor:C.paper,borderRadius:22,padding:16,borderWidth:1,borderColor:C.line,gap:12},
 input:{minHeight:48,padding:12,borderRadius:13,borderWidth:1,borderColor:C.line,fontSize:16,color:C.ink},
 group:{gap:8},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:13,paddingVertical:8,borderRadius:20,backgroundColor:C.mint},active:{backgroundColor:C.accentDark},chipText:{fontSize:14,fontWeight:'700',color:C.ink},
 button:{minHeight:48,justifyContent:'center',alignItems:'center',padding:12,borderRadius:14,backgroundColor:C.accentDark},
 secondary:{backgroundColor:C.mint},buttonText:{fontSize:15,fontWeight:'800',color:C.white,textAlign:'center'},
 origin:{minHeight:48,justifyContent:'center',padding:12,borderWidth:1,borderColor:C.line,borderRadius:12},selectedOrigin:{fontSize:15,fontWeight:'800',color:C.accentDark},
 note:{backgroundColor:C.sunPale,padding:12,borderRadius:12,color:C.ink,fontSize:14,lineHeight:20},
 destination:{borderWidth:1,borderColor:C.line,borderRadius:16,padding:14,gap:9},link:{minHeight:44,justifyContent:'center'},linkText:{color:C.accentDark,fontSize:14,fontWeight:'800'}
});
