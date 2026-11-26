import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';

// Einheitliche, auffällige Rückmeldung direkt an der Suche – ohne störende Pop-ups bei jedem Tastendruck.
export default function SearchResultFeedback({
  active=false,count=0,query='',context='',loading=false,error='',hasMore=false,hint='',compact=false
}){
  if(!active)return null;
  const total=Number.isFinite(count)?Math.max(0,Math.floor(count)):0;
  const hasResults=total>0;
  const headline=loading?'Suche läuft …':error?'Suche nicht vollständig':hasResults
    ?(hasMore?'Mindestens ':'')+total+(total===1?' Treffer':' Treffer')
    :'Keine Treffer';
  const cleaned=String(query||'').trim().slice(0,90);
  const detail=loading?'Bitte einen Moment. Die Ergebnisse werden geladen.'
    :error||(!hasResults
      ?'Versuche einen anderen Suchbegriff oder entferne einen Filter.'
      :cleaned?'Passende Ergebnisse für „'+cleaned+'“':'Passende Einträge gefunden.');
  return <View accessible accessibilityLabel={[context,headline,detail,hint].filter(Boolean).join('. ')}
    accessibilityLiveRegion="polite" style={[s.card,compact&&s.compact,!hasResults&&!loading&&s.empty]}>
    <View style={[s.marker,loading&&s.markerLoading]}/>
    <View style={[s.textWrap,compact&&s.compactText]}>
      {context&&!compact?<Text style={s.context}>{context.toUpperCase()}</Text>:null}
      <Text accessibilityRole="header" style={[s.title,compact&&s.compactTitle]}>{headline}</Text>
      {(!compact||loading||error||!hasResults)?<Text style={s.description}>{detail}</Text>:null}
      {!!hint&&!loading&&!compact?<Text style={s.hint}>{hint}</Text>:null}
    </View>
  </View>;
}
const s=StyleSheet.create({
  card:{marginTop:10,marginBottom:13,flexDirection:'row',backgroundColor:C.sunPale,
    borderRadius:17,borderWidth:1.5,borderColor:C.accentDark,overflow:'hidden',minHeight:74},
  compact:{minHeight:48,marginTop:5,marginBottom:9,borderRadius:13},
  compactText:{paddingVertical:9,paddingHorizontal:11},
  compactTitle:{fontSize:17},
  empty:{backgroundColor:C.paper,borderColor:C.line},
  marker:{width:6,backgroundColor:C.accentDark},
  markerLoading:{backgroundColor:C.coral},
  textWrap:{flex:1,paddingHorizontal:13,paddingVertical:11},
  context:{fontSize:12,fontWeight:'900',letterSpacing:0.7,color:C.accentDark,marginBottom:3},
  title:{fontSize:19,fontWeight:'900',color:C.ink},
  description:{fontSize:14,lineHeight:19,color:C.ink,marginTop:4},
  hint:{fontSize:13,lineHeight:18,color:C.muted,marginTop:5},
});
