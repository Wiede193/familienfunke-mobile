import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';

// Muster füllen nur editierbare Entwürfe, senden niemals selbst etwas.
export default function DraftTemplatePicker({title='Mit Vorlage beginnen',templates=[],onPick,selectedId=null,hint}){
 return <View style={s.box}>
  <Text accessibilityRole="header" style={s.title}>{title}</Text>
  <Text style={s.hint}>{hint||'Eine Vorlage spart Tipparbeit. Ersetze alle Markierungen und prüfe die Angaben selbst.'}</Text>
  <View style={s.options}>
   {templates.map(t=><Pressable key={t.id} accessibilityRole="button"
     accessibilityLabel={'Vorlage '+t.label+' übernehmen'}
     accessibilityState={{selected:selectedId===t.id}}
     onPress={()=>onPick?.(t)} style={({pressed})=>[s.pill,selectedId===t.id&&s.pillActive,pressed&&{opacity:.76}]}>
     <Text style={[s.pillText,selectedId===t.id&&s.pillTextActive]}>{t.label}</Text>
   </Pressable>)}
  </View>
  <Text style={s.foot}>Nur ein Beispiel, kein veröffentlichter Inhalt. [ergänzen] muss vor dem Absenden ersetzt werden.</Text>
 </View>;
}
const s=StyleSheet.create({
 box:{borderRadius:16,borderWidth:1,borderColor:'#C8E0D7',backgroundColor:'#F2FAF5',
   padding:14,marginVertical:12},
 title:{color:C.ink,fontSize:16,fontWeight:'900'},
 hint:{color:C.muted,fontSize:14,lineHeight:20,marginTop:6},
 options:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},
 pill:{minHeight:44,paddingHorizontal:13,paddingVertical:10,justifyContent:'center',
  borderColor:C.line,borderWidth:1,borderRadius:16,backgroundColor:C.white},
 pillActive:{borderColor:C.teal,backgroundColor:C.mint},
 pillText:{fontSize:14,color:C.accentDark,fontWeight:'800'},
 pillTextActive:{color:C.ink},
 foot:{color:C.muted,fontSize:12.5,lineHeight:19,marginTop:10}
});
