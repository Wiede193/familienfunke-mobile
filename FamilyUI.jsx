import React from 'react';
import {Image,Pressable,Text,TextInput,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {styles} from './FamilyAppStyles';
const initial = (name) => String(name||'F').split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
export function Button({title, onPress, mode='primary', disabled=false, small=false, style,accessibilityLabel}) {
return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel||title} accessibilityState={{disabled:!!disabled}} onPress={onPress} disabled={disabled}
style={({pressed})=>[styles.button,styles[`button_${mode}`],small&&styles.buttonSmall,disabled&&{opacity:0.46},pressed&&{opacity:.8},style]}>
<Text style={[styles.buttonText,mode!=='primary'&&styles.buttonTextDark,small&&{fontSize:13}]}>{title}</Text>
</Pressable>;
}
export function Chip({text,selected,onPress}) {
if(!onPress)return <View style={[styles.chip,selected&&styles.chipSelected]}>
<Text style={[styles.chipText,selected&&{color:C.white}]}>{text}</Text></View>;
return <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityState={{selected:!!selected}} onPress={onPress} style={[styles.chip,selected&&styles.chipSelected]}>
<Text style={[styles.chipText,selected&&{color:C.white}]}>{selected?'✓ ':''}{text}</Text>
</Pressable>;
}
export function Card({children,style}) {return <View style={[styles.card,style]}>{children}</View>;}
export function H({children,sub}) {return <View style={styles.headingWrap}>
  <View style={styles.headingBar}/>
  <View style={{flex:1}}>
    <Text accessibilityRole="header" style={styles.h}>{children}</Text>
    {sub?<Text style={styles.sub}>{sub}</Text>:null}
  </View>
</View>;}
export function Info({children,warning=false}) {return <View style={[styles.info,warning&&styles.warning]}><Text style={[styles.infoText,warning&&{color:C.warningText}]}>{children}</Text></View>;}
export function Avatar({name,size=52,uri}) {return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.avatar,{width:size,height:size,borderRadius:size/2}]}>{uri?<Image source={{uri}} style={{width:size,height:size,borderRadius:size/2}}/>:<Text style={[styles.avatarText,{fontSize:size*.30}]}>{initial(name)}</Text>}</View>;}
export function Row({children,style}) {return <View style={[{flexDirection:'row',alignItems:'center',gap:10},style]}>{children}</View>;}
export function Input({label,multiline=false,style,...props}) {
return <View style={[{marginBottom:13},style]}><Text style={styles.label}>{label}</Text><TextInput
accessibilityLabel={label} placeholderTextColor={C.muted} style={[styles.input,multiline&&{minHeight:95,textAlignVertical:'top',paddingTop:12}]}
multiline={multiline} {...props}/></View>;
}
export function Blank({title,body}) {return <Card style={{alignItems:'center',paddingVertical:30}}><Text style={{fontSize:38,marginBottom:8,color:C.coral}}>♡</Text><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.sub,{textAlign:'center'}]}>{body}</Text></Card>;}
