import React from 'react';
import {ActivityIndicator,Pressable,Text,View,StyleSheet} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
export default function FamilyStatus({kind='loading',message,onDismiss,onRetry}){
 const loading=kind==='loading',error=kind==='error';
 return <View accessibilityLiveRegion={error?'assertive':'polite'} style={[s.box,error&&s.error]}>
  {loading?<ActivityIndicator color={C.accentDark}/>:null}
  <Text accessibilityRole={error?'alert':'text'} style={s.text}>{message||(loading?'Wird geladen …':'')}</Text>
  {onRetry?<Pressable accessibilityRole="button" onPress={onRetry} style={s.action}><Text style={s.actionText}>Erneut versuchen</Text></Pressable>:null}
  {onDismiss?<Pressable accessibilityRole="button" accessibilityLabel="Hinweis schließen" onPress={onDismiss} style={s.action}><Text style={s.actionText}>Schließen</Text></Pressable>:null}
 </View>;
}
const s=StyleSheet.create({box:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,padding:12,backgroundColor:C.mint},error:{backgroundColor:C.warning},text:{flexGrow:1,flexBasis:170,flexShrink:1,color:C.ink,fontSize:15,lineHeight:21},action:{minHeight:48,justifyContent:'center',padding:8},actionText:{fontSize:15,color:C.accentDark,fontWeight:'700'}});
