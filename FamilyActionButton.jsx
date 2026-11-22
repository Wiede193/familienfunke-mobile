import React from 'react';
import {Pressable,StyleSheet,Text} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
export default function FamilyActionButton({title='Löschen',accessibilityLabel,onPress,disabled=false,destructive=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel||title} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={[s.button,destructive&&s.destructive,disabled&&{opacity:.45}]}>
  <Text style={[s.label,destructive&&{color:C.danger}]}>{title}</Text>
 </Pressable>;
}
const s=StyleSheet.create({button:{minHeight:48,minWidth:48,borderWidth:1,borderColor:C.line,borderRadius:12,paddingHorizontal:14,paddingVertical:10,justifyContent:'center',backgroundColor:C.paper,maxWidth:'100%'},destructive:{borderColor:C.danger},label:{fontSize:15,lineHeight:21,fontWeight:'700',color:C.accentDark,textAlign:'center'}});
