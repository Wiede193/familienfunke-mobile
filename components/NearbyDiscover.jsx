import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Animated, PanResponder, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {supabase} from '../supabase';
import {lookupPostcode} from '../data/plzCentersGermany';

const RADIUS=[10,25,50,100];
const colors={ink:'#243E43',muted:'#667B7C',teal:'#087F87',deep:'#075D67',coral:'#EC8370',cream:'#FFF8EA',sun:'#FFF0D3',line:'#EEDCC5'};
function roundPair(center){return {p_lat_e2:Math.round(center.latitude*100),p_lon_e2:Math.round(center.longitude*100)};}
const nameInitials=name=>String(name||'F').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase();
export default function NearbyDiscover({me,profiles=[],requests=[],active,busy,blocked,onContact,onProfile,onContacts}){
 const [postcode,setPostcode]=useState('');
 const [radius,setRadius]=useState(25);
 const [enabled,setEnabled]=useState(null);
 const [settingOpen,setSettingOpen]=useState(false);
 const [working,setWorking]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [rows,setRows]=useState([]);
 const [skipped,setSkipped]=useState([]);
 const [refreshCounter,setRefreshCounter]=useState(0);
 const pan=useRef(new Animated.ValueXY()).current;
 const [selectedIndex,setSelectedIndex]=useState(0);

 useEffect(()=>{
  let current=true;
  setEnabled(null);setRows([]);setSkipped([]);setPostcode('');setSelectedIndex(0);
  supabase.rpc('ff_nearby_status').then(({data,error:err})=>{
   if(!current)return;
   if(err){setError('Die Nähe-Suche ist gerade nicht erreichbar.');setEnabled(false);}
   else{setEnabled(data===true);setError('');}
  }).catch(()=>{
   if(current){setError('Die Nähe-Suche ist gerade nicht erreichbar.');setEnabled(false);}
  });
  return ()=>{current=false;};
 },[me]);

 useEffect(()=>{
  if(enabled!==true)return;
  let current=true;
  setLoading(true);setError('');
  supabase.rpc('ff_nearby_families',{p_radius_km:radius}).then(({data,error:err})=>{
   if(!current)return;
   if(err){setRows([]);setError('Die Suche konnte nicht geladen werden.');}
   else setRows(Array.isArray(data)?data:[]);
   setLoading(false);
  }).catch(()=>{
   if(current){setRows([]);setLoading(false);setError('Die Suche konnte nicht geladen werden.');}
  });
  return ()=>{current=false;};
 },[me,enabled,radius,refreshCounter]);

 const cards=useMemo(()=>{
  const mapped=new Map(profiles.filter(p=>!blocked?.(p.user_id)).map(p=>[p.user_id,p]));
  return rows.filter(r=>mapped.has(r.user_id)).map(r=>({...mapped.get(r.user_id),
     distance_band:r.distance_band,distance_bucket:r.distance_bucket}))
    .filter(p=>!skipped.includes(p.user_id))
    .sort((a,b)=>a.distance_bucket-b.distance_bucket||b.score-a.score
      ||String(a.display_name).localeCompare(String(b.display_name),'de'));
 },[rows,profiles,skipped,blocked]);
 const top=cards[0]||null;
 const topRef=useRef(null);
 topRef.current=top;
 const panReset=()=>pan.setValue({x:0,y:0});
 const moveOn=(action)=>{
  const current=topRef.current;
  if(!current||working||busy)return;
  if(action==='like'){
   const request=requests.find(c=>(c.sender_id===me&&c.recipient_id===current.user_id)||
     (c.sender_id===current.user_id&&c.recipient_id===me));
   if(request?.status==='accepted'){onProfile?.(current.user_id);return;}
   if(request?.status==='pending'){
    if(request.recipient_id===me)onContacts?.();
    else Alert.alert('Kontaktanfrage läuft','Die andere Familie kann deine Anfrage bereits sehen.');
    return;
   }
   if(request){
    Alert.alert('Kontakt bereits angefragt','Schau in deine Kontakte, ob eine frühere Anfrage noch besteht.');
    return;
   }
   onContact?.(current.user_id);
  }
  setSkipped(prev=>prev.includes(current.user_id)?prev:[...prev,current.user_id]);
  setSelectedIndex(i=>i+1);
 };
 const swipe=(direction)=>{
  if(!topRef.current||working||busy){panReset();return;}
  if(direction==='like'){
   const current=topRef.current;
   const currentRequest=requests.find(c=>(c.sender_id===me&&c.recipient_id===current.user_id)||
     (c.sender_id===current.user_id&&c.recipient_id===me));
   if(currentRequest){panReset();moveOn('like');return;}
  }
  Animated.timing(pan,{toValue:{x:direction==='like'?320:-320,y:15},duration:150,useNativeDriver:false})
   .start(()=>{moveOn(direction);panReset();});
 };
 const panResponder=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponder:(_,gesture)=>Math.abs(gesture.dx)>13&&Math.abs(gesture.dx)>Math.abs(gesture.dy)*1.35,
  onPanResponderMove:(_,gesture)=>pan.setValue({x:gesture.dx,y:Math.max(-30,Math.min(55,gesture.dy))}),
  onPanResponderRelease:(_,gesture)=>{
   if(gesture.dx>90)swipe('like');
   else if(gesture.dx<-90)swipe('skip');
   else Animated.spring(pan,{toValue:{x:0,y:0},speed:17,bounciness:5,useNativeDriver:false}).start();
  },
  onPanResponderTerminate:()=>Animated.spring(pan,{toValue:{x:0,y:0},speed:17,useNativeDriver:false}).start(),
 }),[me,requests,working,busy,pan,onContact,onProfile,onContacts]);

 async function updateLocation(enable){
  if(working)return;
  if(!active&&enable){
   Alert.alert('Profilfreigabe erforderlich','Die Nähe-Suche ist nur für geprüfte und sichtbare Erwachsenenprofile verfügbar.');
   return;
  }
  let args={p_enabled:false};
  if(enable){
   const center=lookupPostcode(postcode);
   if(!center){Alert.alert('Postleitzahl nicht gefunden','Bitte eine gültige fünfstellige Postleitzahl in Deutschland angeben.');return;}
   args={...roundPair(center),p_enabled:true};
  }
  setWorking(true);setError('');
  try{
   const {error:err}=await supabase.rpc('ff_set_nearby_location',args);
   if(err)throw err;
   setEnabled(enable);
   setPostcode('');
   setRows([]);setSkipped([]);setSelectedIndex(0);
   setSettingOpen(false);
   if(enable)setRefreshCounter(c=>c+1);
  }catch(e){setError('Die Änderung konnte nicht gespeichert werden. Bitte prüfe die Profilfreigabe und versuche es erneut.');}
  finally{setWorking(false);}
 }
 const tilt=pan.x.interpolate({inputRange:[-240,0,240],outputRange:['-9deg','0deg','9deg'],extrapolate:'clamp'});
 const acceptOpacity=pan.x.interpolate({inputRange:[0,60,140],outputRange:[0,0.35,1],extrapolate:'clamp'});
 const skipOpacity=pan.x.interpolate({inputRange:[-140,-60,0],outputRange:[1,0.35,0],extrapolate:'clamp'});

 return <View style={styles.container}>
  <View style={styles.titleCard}>
   <View style={styles.sunDecoration} pointerEvents="none"/>
   <Text style={styles.eyebrow}>☀ FAMILIENFUNKE · KONTAKTE ENTDECKEN</Text>
   <Text style={styles.heading}>Wer ist in deiner Nähe?</Text>
   <Text style={styles.subtitle}>Eine Familie nach der anderen kennenlernen. Ohne öffentlichen Live-Standort.</Text>
  </View>
  {enabled===null?<View style={styles.loader}><ActivityIndicator color={colors.teal}/><Text style={styles.note}>Nähe-Einstellungen werden geladen …</Text></View>:
   enabled===false?<View style={styles.setupCard}>
    <Text style={styles.setupTitle}>In deiner Nähe entdecken</Text>
    <Text style={styles.copy}>Gib freiwillig eine deutsche Postleitzahl ein, um passende Familien im Umkreis zu finden. Eine genaue Adresse oder GPS-Ortung brauchen wir dafür nicht.</Text>
    <Text style={styles.inputLabel}>Deine PLZ (nur zur Umkreisberechnung)</Text>
    <TextInput style={styles.input} keyboardType="number-pad" autoComplete="postal-code" textContentType="postalCode" maxLength={5}
      placeholder="z. B. 15517" placeholderTextColor="#839594" value={postcode} onChangeText={setPostcode} accessibilityLabel="Postleitzahl eingeben"/>
    <Text style={styles.privacy}>Die PLZ wird nicht gespeichert. Stattdessen hinterlegen wir nach deiner Zustimmung einen grob gerundeten PLZ-Gebietsmittelpunkt. Andere erhalten keine Koordinaten und keine genaue Entfernung. Die Suche kannst du jederzeit abschalten.</Text>
    <Pressable accessibilityRole="button" disabled={working||!active} style={[styles.primary,(!active||working)&&styles.disabled]}
      onPress={()=>updateLocation(true)}>
      <Text style={styles.primaryText}>{working?'Speichert …':'Freiwillig aktivieren'}</Text>
    </Pressable>
    {!active?<Text style={styles.note}>Dein Profil muss vorher freigegeben und für andere sichtbar sein.</Text>:null}
   </View>:
   <>
    <View style={styles.toolsRow}>
     <Text style={styles.smallHeading}>Suchradius</Text>
     <Pressable accessibilityRole="button" onPress={()=>setSettingOpen(v=>!v)} style={styles.settingsButton}>
       <Text style={styles.settingsText}>⚙ Privatsphäre</Text>
     </Pressable>
    </View>
    <View style={styles.radiusRow}>{RADIUS.map(km=><Pressable key={km} accessibilityRole="button"
      accessibilityState={{selected:radius===km}} style={[styles.radiusChip,radius===km&&styles.radiusSelected]} onPress={()=>{setRadius(km);setSkipped([]);}}>
      <Text style={[styles.radiusText,radius===km&&styles.radiusTextSelected]}>{km} km</Text>
     </Pressable>)}</View>
    {settingOpen?<View style={styles.settingsPanel}>
     <Text style={styles.setupTitle}>Deine Standortfreigabe</Text>
     <Text style={styles.copy}>Nur andere erwachsene, geprüfte Familien, die diese Suche ebenfalls aktiviert haben, können dich innerhalb ihres Suchradius finden. Es werden keine Koordinaten angezeigt.</Text>
     <Text style={styles.inputLabel}>Anderen PLZ-Bereich verwenden</Text>
     <TextInput style={styles.input} placeholder="Neue PLZ" keyboardType="number-pad" maxLength={5} value={postcode} onChangeText={setPostcode} placeholderTextColor="#839594"/>
     <Pressable accessibilityRole="button" disabled={working} style={styles.outline} onPress={()=>updateLocation(true)}>
       <Text style={styles.outlineText}>PLZ-Bereich aktualisieren</Text>
     </Pressable>
     <Pressable accessibilityRole="button" disabled={working} onPress={()=>updateLocation(false)} style={styles.disableButton}>
       <Text style={styles.disableText}>Nähe-Suche ausschalten & Standortdaten löschen</Text>
     </Pressable>
    </View>:null}
    {loading?<View style={styles.loader}><ActivityIndicator color={colors.teal}/><Text style={styles.note}>Familien im Umkreis suchen …</Text></View>:
     !top?<View style={styles.empty}>
       <Text style={styles.emptyTitle}>Gerade keine weiteren Familien im Umkreis</Text>
       <Text style={styles.copy}>Vielleicht haben in deinem Suchradius noch keine weiteren Familien die freiwillige Nähe-Suche aktiviert. Du kannst einen größeren Radius ausprobieren.</Text>
       {skipped.length>0?<Pressable accessibilityRole="button" style={styles.outline} onPress={()=>setSkipped([])}>
        <Text style={styles.outlineText}>Übersprungene Familien erneut ansehen</Text></Pressable>:null}
       <Pressable accessibilityRole="button" style={styles.outline} onPress={()=>setRefreshCounter(c=>c+1)}>
        <Text style={styles.outlineText}>Erneut suchen</Text></Pressable>
      </View>:
      <>
       <View style={styles.counterRow}>
        <Text style={styles.cardCount}>Familien in deinem gewählten Umkreis</Text>
        <Text style={styles.cardCountValue}>{cards.length}</Text>
       </View>
       <View style={styles.deck}>
        <View style={styles.underCard} pointerEvents="none"/>
        <Animated.View {...panResponder.panHandlers} style={[styles.swipeCard,{transform:[{translateX:pan.x},{translateY:pan.y},{rotate:tilt}]}]}>
         <View style={styles.poster}>
           <View style={styles.posterSun} pointerEvents="none"/>
           <View style={styles.posterHill} pointerEvents="none"/>
           <Text style={styles.posterEyebrow}>✦ JEMAND ZUM KENNENLERNEN</Text>
           <View style={styles.initialCircle}><Text style={styles.initialText}>{nameInitials(top.display_name)}</Text></View>
           <Animated.View pointerEvents="none" style={[styles.stamp,{left:16,opacity:skipOpacity,borderColor:'#9E6669'}]}><Text style={styles.skipStamp}>WEITER</Text></Animated.View>
           <Animated.View pointerEvents="none" style={[styles.stamp,{right:15,opacity:acceptOpacity,borderColor:'#3D8980'}]}><Text style={styles.likeStamp}>KENNENLERNEN</Text></Animated.View>
         </View>
         <View style={styles.cardBody}>
          <Text style={styles.distance}>Ungefähr {top.distance_band} entfernt</Text>
          <Text style={styles.cardTitle}>{top.display_name}</Text>
          <Text style={styles.region}>{top.region_label||'Region nicht angegeben'}</Text>
          <Text style={styles.about} numberOfLines={4}>{top.about||'Diese Familie freut sich darauf, andere Familien kennenzulernen.'}</Text>
          {top.sharedInterests?.length>0?<View style={styles.reason}><Text style={styles.reasonTitle}>Das verbindet euch</Text><Text style={styles.reasonBody}>{top.sharedInterests.slice(0,4).join(' · ')}</Text></View>:
           top.similarTopics?.length>0?<View style={styles.reason}><Text style={styles.reasonTitle}>Ähnliche Interessen</Text><Text style={styles.reasonBody}>{top.similarTopics.slice(0,2).map(t=>t.label).join(' · ')}</Text></View>:null}
          <Pressable accessibilityRole="button" onPress={()=>onProfile?.(top.user_id)} style={styles.profileLink}>
            <Text style={styles.profileLinkText}>Familienprofil ansehen ›</Text>
          </Pressable>
         </View>
        </Animated.View>
       </View>
       <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Nächste Familie" onPress={()=>swipe('skip')} style={styles.skipAction}>
         <Text style={styles.skipIcon}>×</Text><Text style={styles.actionLabel}>Weiter</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Familie kennenlernen" onPress={()=>swipe('like')} disabled={working||busy} style={[styles.likeAction,(working||busy)&&styles.disabled]}>
         <Text style={styles.likeIcon}>♡</Text><Text style={styles.actionLabel}>Kennenlernen</Text>
        </Pressable>
       </View>
       <Text style={styles.swipeHelp}>Nach links wischen: Weiter · Nach rechts: Kennenlernen</Text>
      </>}
   </>
  }
  {error?<Text style={styles.error}>{error}</Text>:null}
  <Text style={styles.footer}>Entfernungen sind grobe Schätzungen zwischen PLZ-Gebietsmittelpunkten, keine Live-Standorte. Nur freigegebene Erwachsene mit beidseitig aktivierter Nähe-Suche können gefunden werden. Eine Kontaktanfrage erlaubt noch keine privaten Nachrichten.</Text>
 </View>;
}
const styles=StyleSheet.create({
 container:{paddingBottom:16},
 titleCard:{backgroundColor:'#FFF0D3',borderRadius:23,padding:22,overflow:'hidden',borderWidth:1,borderColor:'#F3D9A3',marginBottom:20},
 sunDecoration:{width:150,height:150,borderRadius:75,backgroundColor:'#FFDB99',position:'absolute',right:-52,top:-74},
 eyebrow:{fontSize:10,color:'#95672D',fontWeight:'900',letterSpacing:1.2,marginBottom:12},
 heading:{fontSize:24,color:colors.ink,fontWeight:'900',lineHeight:30,maxWidth:270},
 subtitle:{fontSize:13.5,color:'#496363',lineHeight:21,marginTop:10,maxWidth:280},
 loader:{alignItems:'center',padding:25,gap:13},
 note:{fontSize:12,color:colors.muted,lineHeight:19,textAlign:'center',marginTop:7},
 setupCard:{borderWidth:1,borderColor:colors.line,borderRadius:21,backgroundColor:'#FFFFFF',padding:19,gap:11},
 setupTitle:{fontSize:18,color:colors.ink,fontWeight:'900',lineHeight:24},
 copy:{fontSize:13.5,color:colors.muted,lineHeight:21},
 inputLabel:{fontSize:12.5,color:colors.ink,fontWeight:'900',marginTop:10},
 input:{borderWidth:1,borderColor:'#D6DCD6',backgroundColor:'#FFFFFF',borderRadius:14,minHeight:50,paddingHorizontal:13,fontSize:16,color:colors.ink},
 privacy:{color:'#688184',fontSize:12,lineHeight:19,marginTop:4},
 primary:{backgroundColor:colors.teal,borderRadius:15,minHeight:49,alignItems:'center',justifyContent:'center',paddingHorizontal:13},
 primaryText:{color:'#FFFFFF',fontSize:14,fontWeight:'900'},
 disabled:{opacity:.45},
 toolsRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
 smallHeading:{fontWeight:'900',fontSize:15,color:colors.ink},
 settingsButton:{borderWidth:1,borderColor:'#D7DED4',backgroundColor:'#FFFFFF',borderRadius:13,paddingHorizontal:11,paddingVertical:9},
 settingsText:{color:colors.deep,fontSize:12,fontWeight:'800'},
 radiusRow:{flexDirection:'row',gap:7,marginBottom:17},
 radiusChip:{flex:1,alignItems:'center',justifyContent:'center',minHeight:41,borderWidth:1,borderColor:'#D9DED6',borderRadius:13,backgroundColor:'#FFFFFF'},
 radiusSelected:{backgroundColor:'#FFEEC8',borderColor:'#E9B76E'},
 radiusText:{fontSize:12.5,fontWeight:'800',color:'#698181'},
 radiusTextSelected:{color:'#8B5C1A'},
 settingsPanel:{padding:15,backgroundColor:'#FFF6E6',borderColor:'#F0DCBC',borderWidth:1,borderRadius:17,gap:12,marginBottom:18},
 outline:{borderWidth:1.5,borderColor:'#BCD8D4',borderRadius:13,backgroundColor:'#FFFFFF',minHeight:45,alignItems:'center',justifyContent:'center',paddingHorizontal:9,marginTop:4},
 outlineText:{fontWeight:'900',fontSize:12.5,color:colors.deep,textAlign:'center'},
 disableButton:{borderRadius:13,minHeight:46,padding:10,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:'#E1BEB9',backgroundColor:'#FFF5F1',marginTop:5},
 disableText:{color:'#A64D4B',fontSize:12.5,fontWeight:'900',textAlign:'center'},
 counterRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:5,marginBottom:12},
 cardCount:{fontSize:13,color:colors.muted,fontWeight:'800'},
 cardCountValue:{fontSize:14,color:colors.deep,fontWeight:'900'},
 deck:{paddingBottom:8},
 underCard:{position:'absolute',left:12,right:12,top:12,bottom:4,borderRadius:23,backgroundColor:'#F6EAD8',borderWidth:1,borderColor:'#E9DDC8'},
 swipeCard:{backgroundColor:'#FFFFFF',borderRadius:24,overflow:'hidden',borderWidth:1,borderColor:colors.line},
 poster:{height:190,backgroundColor:'#FFE8C1',overflow:'hidden',alignItems:'center',justifyContent:'center'},
 posterSun:{width:125,height:125,borderRadius:65,backgroundColor:'#FBD188',position:'absolute',right:-26,top:-32},
 posterHill:{width:260,height:140,borderRadius:130,position:'absolute',bottom:-95,left:-49,backgroundColor:'#F4C9A4'},
 posterEyebrow:{fontSize:9.5,color:'#8E642D',fontWeight:'900',letterSpacing:1,position:'absolute',top:16,left:18},
 initialCircle:{width:105,height:105,borderRadius:53,backgroundColor:'#FFFFFF',borderColor:'#E7CFB2',borderWidth:3,alignItems:'center',justifyContent:'center'},
 initialText:{fontSize:36,fontWeight:'900',color:'#BF7352'},
 stamp:{position:'absolute',top:48,borderWidth:3,borderRadius:8,paddingVertical:8,paddingHorizontal:9,transform:[{rotate:'-12deg'}]},
 skipStamp:{fontSize:14,color:'#9E6669',fontWeight:'900'},
 likeStamp:{fontSize:11,color:'#3D8980',fontWeight:'900'},
 cardBody:{padding:19,minHeight:230},
 distance:{color:'#99641E',fontSize:12,fontWeight:'900',marginBottom:8},
 cardTitle:{color:colors.ink,fontSize:24,fontWeight:'900',lineHeight:30},
 region:{color:colors.muted,fontSize:12.5,marginTop:6},
 about:{fontSize:13.5,lineHeight:21,color:'#3E5D5E',marginTop:13},
 reason:{backgroundColor:'#FFF3DD',borderRadius:13,padding:11,marginTop:12},
 reasonTitle:{fontSize:11,color:'#8B6127',fontWeight:'900'},
 reasonBody:{fontSize:12.5,color:'#4A6262',fontWeight:'800',lineHeight:19,marginTop:5},
 profileLink:{alignSelf:'flex-start',paddingVertical:9,marginTop:8},
 profileLinkText:{fontSize:13,fontWeight:'900',color:colors.teal},
 actions:{flexDirection:'row',gap:13,justifyContent:'center',marginTop:15},
 skipAction:{width:117,height:61,borderWidth:1.5,borderColor:'#E6C4B9',backgroundColor:'#FFF7F2',borderRadius:19,alignItems:'center',justifyContent:'center'},
 likeAction:{flex:1,height:61,backgroundColor:'#087F87',borderRadius:19,alignItems:'center',justifyContent:'center'},
 skipIcon:{fontSize:27,color:'#BD7666',lineHeight:28},
 likeIcon:{fontSize:27,color:'#FFFFFF',lineHeight:29},
 actionLabel:{fontWeight:'900',fontSize:12.5,color:colors.ink},
 swipeHelp:{fontSize:11.5,color:'#8B9794',textAlign:'center',marginTop:15},
 empty:{padding:22,borderWidth:1,borderColor:colors.line,borderRadius:21,backgroundColor:'#FFFFFF',gap:12},
 emptyTitle:{fontSize:17,fontWeight:'900',color:colors.ink},
 error:{color:'#A64D4B',backgroundColor:'#FFF0E9',fontSize:12.5,padding:12,borderRadius:13,marginTop:12},
 footer:{fontSize:11.5,lineHeight:19,color:'#738686',marginTop:20}
});
