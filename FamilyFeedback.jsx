import React from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C,FAMILY_TYPE as T,FAMILY_SPACE as S} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';

// Quiet, actionable empty states. No cartoon that implies unavailable content.
export function FamilyEmptyState({title,description,icon='sun',actionLabel,onAction,compact=false}){
  return <View style={[styles.empty,compact&&styles.compact]}>
    <View style={styles.iconBubble}><FamilyIcon name={icon} size={26}/></View>
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
    {description?<Text style={styles.emptyBody}>{description}</Text>:null}
    {actionLabel&&onAction?<Pressable accessibilityRole="button" accessibilityLabel={actionLabel}
      onPress={onAction} style={({pressed})=>[styles.action,pressed&&{opacity:0.8}]}>
      <Text style={styles.actionText}>{actionLabel}</Text>
      <FamilyIcon name="chevron-right" size={18} color={C.white}/>
    </Pressable>:null}
  </View>;
}

// Lightweight visual loading placeholders, not a fake loaded recommendation.
export function FamilySkeleton({rows=2,label='Inhalte werden geladen'}){
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.skeleton}>
    {Array.from({length:rows},(_,i)=><View key={i} style={styles.placeholderRow}>
      <View style={styles.placeholderPhoto}/>
      <View style={styles.placeholderText}>
        <View style={[styles.placeholderLine,{width:'77%'}]}/>
        <View style={[styles.placeholderLine,{width:'51%'}]}/>
      </View>
    </View>)}
    <ActivityIndicator color={C.accentDark} style={{alignSelf:'center',marginTop:S.xs}}/>
  </View>;
}

export function FamilySectionTitle({title,subtitle,actionLabel,onAction}){
  return <View style={styles.sectionHeader}>
    <View style={{flex:1,minWidth:0}}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {subtitle?<Text style={styles.sectionSubtitle}>{subtitle}</Text>:null}
    </View>
    {actionLabel&&onAction?<Pressable accessibilityRole="button" accessibilityLabel={actionLabel}
      onPress={onAction} style={styles.sectionAction}>
      <Text style={styles.sectionActionText}>{actionLabel}</Text>
      <FamilyIcon name="chevron-right" size={16}/>
    </Pressable>:null}
  </View>;
}
const styles=StyleSheet.create({
  empty:{backgroundColor:C.paper,borderRadius:22,borderColor:C.line,borderWidth:1,
    padding:24,alignItems:'center',gap:9,minHeight:170,justifyContent:'center'},
  compact:{padding:16,minHeight:125},
  iconBubble:{width:54,height:54,borderRadius:27,backgroundColor:C.sunPale,
    justifyContent:'center',alignItems:'center'},
  emptyTitle:{fontSize:T.card,fontWeight:'800',color:C.ink,textAlign:'center'},
  emptyBody:{fontSize:T.small,lineHeight:19,color:C.muted,textAlign:'center',maxWidth:290},
  action:{backgroundColor:C.accentDark,borderRadius:14,minHeight:S.touch,
    paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:6,marginTop:5},
  actionText:{color:C.white,fontSize:T.small,fontWeight:'800'},
  skeleton:{backgroundColor:C.paper,borderRadius:18,padding:14,gap:12,borderColor:C.line,borderWidth:1},
  placeholderRow:{flexDirection:'row',gap:11,alignItems:'center'},
  placeholderPhoto:{height:60,width:60,borderRadius:12,backgroundColor:C.sunPale},
  placeholderText:{flex:1,gap:9},
  placeholderLine:{height:10,borderRadius:7,backgroundColor:C.line},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},
  sectionTitle:{fontSize:T.section,fontWeight:'800',color:C.ink},
  sectionSubtitle:{color:C.muted,fontSize:T.small,marginTop:3,lineHeight:19},
  sectionAction:{minHeight:S.touch,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:2},
  sectionActionText:{color:C.accentDark,fontSize:T.small,fontWeight:'800'}
});
