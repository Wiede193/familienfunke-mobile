import React,{useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {monthDays,moveMonth,dayKey} from './CalendarDates';

const quickTimes=['08:00','09:00','10:00','12:00','14:00','15:00','16:00','18:00','20:00'];
const monthTitle=month=>new Date(Number(month.slice(0,4)),Number(month.slice(5))-1,1,12).toLocaleDateString('de-DE',{month:'long',year:'numeric'});
const showDay=day=>new Date(day+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'short'});
/** Date selection without a new native dependency; text entry is an optional fallback. */
export default function FamilyDateFields({date,onDateChange,time,onTimeChange,timeOptional=false,title='Datum und Uhrzeit'}){
 const today=dayKey(new Date());
 const [month,setMonth]=useState((date&&/^\d{4}-\d{2}-\d{2}$/.test(date)?date:today).slice(0,7));
 const [custom,setCustom]=useState(false),[expanded,setExpanded]=useState(!date);
 const {width,fontScale}=useWindowDimensions();
 const safeDays=monthDays(month).filter(Boolean);
 function shift(delta){const next=moveMonth(month,delta);if(next>='1900-01'&&next<='2100-12')setMonth(next);}
 return <View style={s.container}>
  <Text accessibilityRole="header" style={s.heading}>{title}</Text>
  <Pressable accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(v=>!v)} style={s.toggle}>
   <Text style={s.toggleText}>{/^\d{4}-\d{2}-\d{2}$/.test(date||'')?showDay(date):'Datum auswählen'} · {time||'Ganztägig'} {expanded?'−':'Ändern +'}</Text>
  </Pressable>
  {expanded?<>
  <View style={s.row}>
   <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" style={s.nav} onPress={()=>shift(-1)}><Text style={s.arrow}>‹</Text></Pressable>
   <Text style={[s.month,{flex:1}]}>{monthTitle(month)}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" style={s.nav} onPress={()=>shift(1)}><Text style={s.arrow}>›</Text></Pressable>
  </View>
  {width>=390&&fontScale<1.45?<View style={s.days}>
   {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=><Text key={d} style={s.weekday}>{d}</Text>)}
   {monthDays(month).map((day,i)=>day?
    <Pressable key={day} accessibilityRole="button" accessibilityLabel={'Datum '+showDay(day)} accessibilityState={{selected:day===date}} onPress={()=>onDateChange(day)} style={[s.day,day===date&&s.selected]}>
     <Text style={[s.dayText,day===date&&s.selectedText]}>{Number(day.slice(-2))}</Text>
    </Pressable>:<View key={'empty-'+i} style={s.day}/>)}
  </View>:<ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={s.strip}>
   {safeDays.map(day=><Pressable key={day} accessibilityRole="button" accessibilityLabel={'Datum '+showDay(day)} accessibilityState={{selected:date===day}} onPress={()=>onDateChange(day)} style={[s.stripDay,date===day&&s.selected]}>
    <Text style={[s.dayText,date===day&&s.selectedText]}>{showDay(day)}</Text>
   </Pressable>)}
  </ScrollView>}
  <Text style={s.selectedDate}>Ausgewähltes Datum: {/^\d{4}-\d{2}-\d{2}$/.test(date||'')?showDay(date):'Bitte Datum auswählen'}</Text>
  <Text style={s.label}>Uhrzeit {timeOptional?'(optional)':''}</Text>
  <View style={s.times}>
   {timeOptional?<Pressable accessibilityRole="button" accessibilityState={{selected:!time}} onPress={()=>onTimeChange('')} style={[s.time,!time&&s.selected]}><Text style={[s.timeText,!time&&s.selectedText]}>Ganztägig</Text></Pressable>:null}
   {quickTimes.map(slot=><Pressable key={slot} accessibilityRole="button" accessibilityState={{selected:slot===time}} onPress={()=>onTimeChange(slot)} style={[s.time,time===slot&&s.selected]}>
    <Text style={[s.timeText,time===slot&&s.selectedText]}>{slot}</Text>
   </Pressable>)}
  </View>
  <Pressable accessibilityRole="button" accessibilityState={{expanded:custom}} style={s.other} onPress={()=>setCustom(v=>!v)}>
   <Text style={s.otherText}>{custom?'Manuelle Eingabe schließen':'Andere Uhrzeit oder Datum eingeben'}</Text>
  </Pressable>
  {custom?<View style={s.manual}>
   <Text style={s.label}>Datum (JJJJ-MM-TT)</Text>
   <TextInput accessibilityLabel="Datum als Jahr Monat Tag" style={s.input} placeholder="2026-12-05" value={date} onChangeText={onDateChange} maxLength={10} keyboardType="numbers-and-punctuation"/>
   <Text style={s.label}>Uhrzeit (HH:MM)</Text>
   <TextInput accessibilityLabel="Uhrzeit als Stunden Doppelpunkt Minuten" style={s.input} placeholder="15:30" value={time} onChangeText={onTimeChange} maxLength={5} keyboardType="numbers-and-punctuation"/>
  </View>:null}
  </>:null}
 </View>;
}
const s=StyleSheet.create({
 container:{gap:10},toggle:{minHeight:48,borderRadius:13,backgroundColor:C.sunPale,paddingHorizontal:13,paddingVertical:11,justifyContent:'center'},toggleText:{fontSize:15,fontWeight:'800',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},
 row:{flexDirection:'row',alignItems:'center',gap:9},
 nav:{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:C.sunPale},
 arrow:{fontSize:28,color:C.ink},month:{fontSize:16,color:C.ink,fontWeight:'800',textAlign:'center'},
 days:{flexDirection:'row',flexWrap:'wrap'},weekday:{width:'14.2857%',textAlign:'center',fontSize:14,color:C.muted,paddingVertical:8},
 day:{width:'14.2857%',minHeight:46,alignItems:'center',justifyContent:'center',borderRadius:10},
 dayText:{fontSize:15,color:C.ink,fontWeight:'700'},
 selected:{backgroundColor:C.accentDark},selectedText:{color:C.white},
 strip:{gap:8,paddingVertical:6},stripDay:{minWidth:76,minHeight:48,borderRadius:12,backgroundColor:C.mint,padding:10,justifyContent:'center',alignItems:'center'},
 selectedDate:{fontSize:14,color:C.accentDark,fontWeight:'700'},
 label:{fontSize:15,color:C.ink,fontWeight:'700'},times:{flexDirection:'row',flexWrap:'wrap',gap:8},
 time:{minHeight:46,minWidth:72,paddingHorizontal:12,justifyContent:'center',alignItems:'center',backgroundColor:C.mint,borderRadius:13},
 timeText:{fontSize:15,color:C.ink,fontWeight:'700'},
 other:{minHeight:44,justifyContent:'center',alignItems:'flex-start'},
 otherText:{fontSize:14,color:C.accentDark,fontWeight:'800'},
 manual:{gap:8},input:{minHeight:48,borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,fontSize:16,color:C.ink,backgroundColor:C.white}
});
