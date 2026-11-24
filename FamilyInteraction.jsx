import React,{useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';
import {GentleReveal} from './FamilyMotion';

export function ActionNotice({message,kind='success',onDismiss,actionLabel,onAction}){
 if(!message)return null;
 const danger=kind==='error';
 return <GentleReveal distance={8} style={[a.notice,danger&&a.noticeDanger]}>
   <View accessibilityLiveRegion={danger?'assertive':'polite'} style={a.noticeBody}>
     <View style={[a.noticeIcon,danger&&a.noticeIconDanger]}>
       <FamilyIcon name={danger?'shield':'check'} size={21} color={danger?C.danger:C.accentDark}/>
     </View>
     <View style={{flex:1}}>
       <Text style={a.noticeTitle}>{danger?'Das hat nicht geklappt':'Rückmeldung von Familienfunke'}</Text>
       <Text style={a.noticeText}>{message}</Text>
       {actionLabel&&onAction?<Pressable accessibilityRole="button" onPress={onAction}
         style={a.noticeAction}><Text style={a.noticeActionText}>{actionLabel}</Text></Pressable>:null}
     </View>
     {onDismiss?<Pressable accessibilityRole="button" accessibilityLabel="Hinweis schließen"
       onPress={onDismiss} style={a.close}><FamilyIcon name="close" size={18}/></Pressable>:null}
   </View>
 </GentleReveal>;
}
export function CompletionPrompt({title,items=[]}){
 const count=items.filter(x=>x.done).length;
 return <View style={a.progressCard}>
   <View style={a.progressTop}><Text style={a.progressTitle}>{title}</Text>
     <Text style={a.progressCount}>{count} von {items.length}</Text></View>
   <View accessibilityRole="progressbar"
     accessibilityLabel={title+', '+count+' von '+items.length+' Schritten'}
     style={a.progressTrack}>
     <View style={[a.progressFill,{width:items.length?((count/items.length)*100)+'%':'0%'}]}/>
   </View>
   {items.filter(x=>!x.done).slice(0,2).map(x=><Text key={x.label} style={a.nextStep}>Noch offen: {x.label}</Text>)}
   {count===items.length?<Text style={a.complete}>Grundangaben vollständig – bitte alles vor dem Absenden noch einmal prüfen.</Text>:null}
 </View>;
}
export function ContextHelp({title,children}){
 const [open,setOpen]=useState(false);
 return <View style={a.helpWrap}>
   <Pressable accessibilityRole="button" accessibilityLabel={title+' erklären'}
     accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)}
     style={({pressed})=>[a.helpButton,pressed&&{opacity:.7}]}>
     <Text style={a.helpMark}>i</Text>
     <Text style={a.helpLabel}>{title}</Text>
     <FamilyIcon name={open?'chevron-up':'chevron-down'} size={17} color={C.accentDark}/>
   </Pressable>
   {open?<GentleReveal distance={7}><Text style={a.helpText}>{children}</Text></GentleReveal>:null}
 </View>;
}
const a=StyleSheet.create({
 notice:{backgroundColor:'#E7F5EE',borderColor:'#9DCDB7',borderWidth:1,
   borderRadius:18,padding:13,marginHorizontal:12,marginTop:9,marginBottom:5},
 noticeDanger:{backgroundColor:'#FFF1EB',borderColor:'#E3BAAD'},
 noticeBody:{flexDirection:'row',alignItems:'flex-start',gap:10},
 noticeIcon:{width:36,height:36,borderRadius:12,backgroundColor:'#CEE9D9',alignItems:'center',justifyContent:'center'},
 noticeIconDanger:{backgroundColor:'#F5D8D0'},
 noticeTitle:{fontSize:15,fontWeight:'900',color:C.ink},
 noticeText:{fontSize:14,lineHeight:21,marginTop:4,color:C.ink},
 noticeAction:{minHeight:40,justifyContent:'center',marginTop:4,alignSelf:'flex-start'},
 noticeActionText:{fontWeight:'900',fontSize:14,color:C.accentDark},
 close:{width:44,height:44,alignItems:'center',justifyContent:'center'},
 progressCard:{borderRadius:17,borderColor:C.line,borderWidth:1,
   backgroundColor:C.white,padding:14,marginVertical:13},
 progressTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:9},
 progressTitle:{fontSize:16,fontWeight:'900',color:C.ink,flex:1},
 progressCount:{fontSize:14,fontWeight:'800',color:C.accentDark},
 progressTrack:{height:8,borderRadius:8,backgroundColor:'#DEEAE3',marginTop:12,overflow:'hidden'},
 progressFill:{height:'100%',borderRadius:8,backgroundColor:C.accent},
 nextStep:{fontSize:13.5,color:C.muted,marginTop:9,lineHeight:18},
 complete:{fontSize:13.5,color:C.accentDark,fontWeight:'800',marginTop:10},
 helpWrap:{marginVertical:8},
 helpButton:{flexDirection:'row',alignItems:'center',gap:8,minHeight:44,
   backgroundColor:'#F4F7F1',borderRadius:13,paddingHorizontal:10},
 helpMark:{fontSize:14,color:C.white,backgroundColor:C.accentDark,
   overflow:'hidden',borderRadius:14,width:24,height:24,textAlign:'center',fontWeight:'900',lineHeight:24},
 helpLabel:{flex:1,fontSize:14,color:C.accentDark,fontWeight:'800'},
 helpText:{fontSize:14,lineHeight:21,color:C.ink,padding:12}
});
