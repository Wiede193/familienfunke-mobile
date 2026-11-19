import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../supabase';
import { lookupPostcode } from '../data/plzCentersGermany';

const COLORS={ink:'#243E43',teal:'#075D67',light:'#FFF4DF',pink:'#F7D8CE',muted:'#6B7E7D',coral:'#E8796C'};
const RADII=[10,25,50,100];

function Action({text,onPress,disabled,secondary=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={onPress} disabled={disabled}
  style={({pressed})=>[styles.action,secondary?styles.secondary:styles.primary,(disabled||pressed)&&{opacity:.5}]}>
  <Text style={[styles.actionLabel,secondary&&styles.secondaryLabel]}>{text}</Text>
 </Pressable>;
}

export default function NearbySwipe({ userId, active, profiles=[], requests=[], imageFor, onShowProfile, onContact, onContacts }) {
 const [enabled,setEnabled]=useState(false);
 const [statusKnown,setStatusKnown]=useState(false);
 const [radius,setRadius]=useState(25);
 const [postcode,setPostcode]=useState('');
 const [changeAreaOpen,setChangeAreaOpen]=useState(false);
 const [candidates,setCandidates]=useState([]);
 const [skipped,setSkipped]=useState([]);
 const [busy,setBusy]=useState(false);
 const [checking,setChecking]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const pendingRef=useRef(false);
 const requestRef=useRef(0);
 const swipeX=useRef(new Animated.Value(0)).current;
 const swipeActionRef=useRef(null);
 const mountedUserRef=useRef(userId);
 mountedUserRef.current=userId;

 const fetchResults=useCallback(async searchRadius=>{
   if(!userId||!supabase)return;
   const req=++requestRef.current;
   setChecking(true);setError('');
   try{
     const {data,error:e}=await supabase.rpc('ff_nearby_families',{p_radius_km:searchRadius});
     if(e)throw e;
     if(req!==requestRef.current||mountedUserRef.current!==userId)return;
     setCandidates(Array.isArray(data)?data.filter(x=>x?.user_id&&x.distance_band):[]);
     setSkipped([]);
     swipeX.setValue(0);
   }catch(e){
     if(req!==requestRef.current||mountedUserRef.current!==userId)return;
     setError('Die Nähe-Suche konnte gerade nicht geladen werden. Bitte erneut versuchen.');
     setCandidates([]);
   }finally{
     if(req===requestRef.current&&mountedUserRef.current===userId)setChecking(false);
   }
 },[userId,swipeX]);

 useEffect(()=>{
   let alive=true;
   requestRef.current++;
   setStatusKnown(false);
   setEnabled(false);
   setCandidates([]);
   setSkipped([]);
   setPostcode('');
   setChangeAreaOpen(false);
   setNotice('');
   setError('');
   if(!userId||!supabase){setStatusKnown(true);return()=>{alive=false;};}
   supabase.rpc('ff_nearby_status').then(({data,error:e})=>{
     if(!alive||mountedUserRef.current!==userId)return;
     if(e)setError('Der Status der Nähe-Suche konnte nicht geladen werden.');
     else setEnabled(data===true);
     setStatusKnown(true);
   }).catch(()=>{
     if(alive&&mountedUserRef.current===userId){setError('Nähe-Suche nicht erreichbar.');setStatusKnown(true);}
   });
   return()=>{alive=false;requestRef.current++;};
 },[userId]);

 useEffect(()=>{
   if(enabled&&active&&statusKnown)fetchResults(radius);
   else {requestRef.current++;setCandidates([]);setSkipped([]);setChecking(false);}
 },[enabled,active,statusKnown,radius,fetchResults]);

 const visible=useMemo(()=>{
   const byId=new Map(profiles.map(p=>[p.user_id,p]));
   return candidates
     .map(c=>({candidate:c,profile:byId.get(c.user_id)}))
     .filter(x=>x.profile&&!skipped.includes(x.candidate.user_id));
 },[profiles,candidates,skipped]);
 const current=visible[0]||null;
 const existing=current?requests.find(c=>(
   (c.sender_id===userId&&c.recipient_id===current.candidate.user_id)||
   (c.recipient_id===userId&&c.sender_id===current.candidate.user_id)
 )):null;

 async function changeSetting(nextEnabled){
   if(!userId||!supabase||pendingRef.current)return;
   if(nextEnabled&&!active){
     setError('Für die Nähe-Suche muss dein Familienprofil erwachsenengeprüft, freigegeben und sichtbar sein.');
     return;
   }
   let coords=null;
   if(nextEnabled){
     coords=lookupPostcode(postcode);
     if(!coords){setError('Bitte eine gültige deutsche Postleitzahl eingeben.');return;}
   }
   pendingRef.current=true;setBusy(true);setError('');setNotice('');
   try {
     const {data,error:e}=await supabase.rpc('ff_set_nearby_location',{
       p_lat_e2:coords?Math.round(coords.latitude*100):null,
       p_lon_e2:coords?Math.round(coords.longitude*100):null,
       p_enabled:nextEnabled
     });
     if(e)throw e;
     if(mountedUserRef.current!==userId)return;
     if(data!==nextEnabled)throw Error('Invalid setting response');
     setEnabled(nextEnabled);
     setPostcode(''); // Do not retain the entered postcode in local storage.
     setChangeAreaOpen(false);
     setNotice(nextEnabled?'Nähe-Suche ist aktiv. Andere freigegebene Familien in deinem Umkreis können dich ebenfalls entdecken.'
       :'Nähe-Suche deaktiviert. Der gespeicherte ungefähre Standort wurde gelöscht.');
   }catch(e){
     if(mountedUserRef.current!==userId)return;
     setError(e?.code==='P0001'&&String(e?.message||'').includes('FF_NEARBY_CHANGE_LIMIT')?
       'Du kannst deinen PLZ-Bereich aus Sicherheitsgründen nur einmal innerhalb von 24 Stunden wechseln. Ausschalten ist jederzeit möglich.':
       'Einstellung konnte nicht gespeichert werden. Prüfe bitte deine Profilfreigabe oder versuche es später erneut.');
   }finally {
     pendingRef.current=false;
     if(mountedUserRef.current===userId)setBusy(false);
   }
 }

 function skipCurrent(id){
   if(!id)return;
   setSkipped(ids=>ids.includes(id)?ids:[...ids,id]);
   swipeX.setValue(0);
 }
 const act=async side=>{
   const item=current;
   if(!item||pendingRef.current)return;
   if(side==='yes'&&existing?.status==='accepted'){onShowProfile?.(item.profile.user_id);swipeX.setValue(0);return;}
   if(side==='yes'&&existing?.status==='pending'&&existing.recipient_id===userId){onContacts?.();swipeX.setValue(0);return;}
   if(side==='yes'&&!existing){
     pendingRef.current=true;setBusy(true);
     try{
       const ok=await onContact(item.candidate.user_id);
       if(ok!==true){swipeX.setValue(0);return;}
       setNotice('Kennenlern-Anfrage verschickt! Eine Unterhaltung ist erst nach Bestätigung möglich.');
     }catch(e){
       setError('Die Anfrage konnte nicht verschickt werden.');
       swipeX.setValue(0);return;
     }finally {pendingRef.current=false;setBusy(false);}
   }
   const to=side==='yes'?360:-360;
   Animated.timing(swipeX,{toValue:to,duration:150,useNativeDriver:false}).start(()=>{
     skipCurrent(item.candidate.user_id);
   });
 };
 swipeActionRef.current=act;
 const responder=useRef(PanResponder.create({
   onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>13&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,
   onPanResponderMove:(_,g)=>swipeX.setValue(g.dx),
   onPanResponderRelease:(_,g)=>{
     if(g.dx>100)swipeActionRef.current?.('yes');
     else if(g.dx< -100)swipeActionRef.current?.('no');
     else Animated.spring(swipeX,{toValue:0,speed:22,bounciness:4,useNativeDriver:false}).start();
   },
   onPanResponderTerminate:()=>Animated.spring(swipeX,{toValue:0,useNativeDriver:false}).start()
 })).current;

 const rotate=swipeX.interpolate({inputRange:[-230,0,230],outputRange:['-7deg','0deg','7deg'],extrapolate:'clamp'});

 return <View style={styles.root}>
   <View style={styles.hero}>
     <View style={styles.sun} pointerEvents="none"/>
     <Text style={styles.eyebrow}>☀ FAMILIENFUNKE · NÄHE ENTDECKEN</Text>
     <Text style={styles.heroTitle}>Neue Menschen. Ganz in deiner Nähe.</Text>
     <Text style={styles.heroBody}>Eine Familienkarte nach der anderen – einfach weiterwischen oder kennenlernen.</Text>
   </View>
   {!statusKnown?<ActivityIndicator color={COLORS.teal} style={{marginVertical:28}}/>:
    !enabled?<View style={styles.optinCard}>
      <Text style={styles.sectionTitle}>In deiner Umgebung suchen</Text>
      <Text style={styles.help}>Trage freiwillig eine deutsche PLZ ein. Wir speichern nur einen gerundeten Mittelpunkt deines PLZ-Gebiets – keine Hausadresse, keine PLZ und keinen Live-Standort.</Text>
      <TextInput value={postcode} onChangeText={x=>setPostcode(x.replace(/\D/g,'').slice(0,5))}
        accessibilityLabel="Postleitzahl für die Nähe-Suche" placeholder="Postleitzahl (5 Ziffern)"
        placeholderTextColor="#8B9C9A" keyboardType="number-pad" maxLength={5}
        style={styles.zipInput}/>
      <Text style={styles.helpSmall}>Nur für erwachsenengeprüfte, freigegebene und sichtbare Familienprofile. Beim Einschalten können andere angemeldete Familien, die ebenfalls teilnehmen, dein Profil in einem groben Entfernungsbereich finden.</Text>
      <Action text={busy?'Wird aktiviert …':'Nähe-Suche freiwillig aktivieren'} disabled={busy||!active||postcode.length!==5} onPress={()=>changeSetting(true)}/>
      {!active?<Text style={styles.warning}>Dein Familienprofil muss zuerst freigegeben werden.</Text>:null}
    </View>:
    <View style={styles.results}>
      <View style={styles.radiusHeader}>
        <Text style={styles.sectionTitle}>Wie weit möchtest du suchen?</Text>
        <Pressable accessibilityRole="button" onPress={()=>fetchResults(radius)} disabled={checking} style={styles.refresh}>
          <Text style={styles.refreshText}>↻ Neu laden</Text>
        </Pressable>
      </View>
      <View style={styles.radiusRow}>{RADII.map(r=><Pressable key={r} accessibilityRole="button"
        accessibilityLabel={r+' Kilometer Suchradius'} accessibilityState={{selected:radius===r}}
        onPress={()=>setRadius(r)} style={[styles.radius,radius===r&&styles.radiusActive]}>
        <Text style={[styles.radiusText,radius===r&&styles.radiusTextActive]}>{r} km</Text>
      </Pressable>)}</View>
      <Text style={styles.hint}>Ungefähre PLZ-Gebietsmitten, keine exakten Entfernungen. Nur Familien, die diese Suche ebenfalls aktiviert haben.</Text>
      <Pressable accessibilityRole="button" onPress={()=>setChangeAreaOpen(v=>!v)} style={styles.changeLink}>
        <Text style={styles.changeLinkText}>{changeAreaOpen?'PLZ-Bereich ändern schließen':'Eigenen PLZ-Bereich ändern ›'}</Text>
      </Pressable>
      {changeAreaOpen?<View style={styles.changePanel}>
        <Text style={styles.help}>Ein anderes PLZ-Gebiet auswählen. Um Rückschlüsse auf Wohnorte zu verhindern, ist ein Wechsel höchstens einmal innerhalb von 24 Stunden möglich. Ausschalten bleibt jederzeit möglich.</Text>
        <TextInput value={postcode} onChangeText={x=>setPostcode(x.replace(/\D/g,'').slice(0,5))}
          keyboardType="number-pad" maxLength={5} style={styles.zipInput} accessibilityLabel="Neue Postleitzahl" placeholder="Neue PLZ (5 Ziffern)" placeholderTextColor="#8B9C9A"/>
        <Action text="Neuen PLZ-Bereich speichern" disabled={busy||postcode.length!==5} onPress={()=>changeSetting(true)}/>
      </View>:null}
      {checking?<ActivityIndicator style={{marginVertical:30}} color={COLORS.teal}/>:
       current?<View style={styles.cardStage}>
         <Animated.View {...responder.panHandlers}
           style={[styles.swipeCard,{transform:[{translateX:swipeX},{rotate}]}]}>
           <View style={styles.imageHeader}>
             {imageFor?.(current.profile.user_id)?<Image source={{uri:imageFor(current.profile.user_id)}} style={styles.headerImage} resizeMode="cover"/>:
             <View style={styles.picturePlaceholder}><View style={styles.pictureSun}/><Text style={styles.pictureMark}>♡</Text></View>}
             <View style={styles.distanceBadge}><Text style={styles.distanceText}>⌖ {current.candidate.distance_band} ungefähr</Text></View>
           </View>
           <View style={styles.cardBody}>
             <Text style={styles.familyName} numberOfLines={2}>{current.profile.display_name}</Text>
             {current.profile.region_label?<Text style={styles.region}>{current.profile.region_label}</Text>:null}
             <Text style={styles.bio} numberOfLines={4}>{current.profile.about||'Diese Familie freut sich darauf, neue Bekanntschaften zu schließen.'}</Text>
             {current.profile.sharedInterests?.length>0?<Text style={styles.common}>
               Gemeinsam: {current.profile.sharedInterests.slice(0,3).join(' · ')}
             </Text>:current.profile.similarTopics?.length>0?<Text style={styles.common}>
               Ähnliche Interessen: {current.profile.similarTopics.slice(0,2).map(x=>x.label).join(' · ')}
             </Text>:null}
             <Pressable accessibilityRole="button" onPress={()=>onShowProfile(current.profile.user_id)}
               style={styles.profileLink}><Text style={styles.profileLinkText}>Profil vollständig ansehen ›</Text></Pressable>
           </View>
         </Animated.View>
         <Text style={styles.swipeHint}>← Weiterwischen · Zum Kennenlernen nach rechts →</Text>
         <View style={styles.actionRow}>
           <Action text="✕ Weiter" secondary disabled={busy} onPress={()=>act('no')}/>
           <Action text={existing?.status==='accepted'?'✓ Schon verbunden':
            existing?.status==='pending'&&existing.recipient_id===userId?'♡ Anfrage beantworten':
            existing?'✓ Bereits angefragt':'♡ Kennenlernen'} disabled={busy} onPress={()=>act('yes')}/>
         </View>
       </View>:
       <View style={styles.emptyCard}>
         <Text style={styles.emptyIcon}>☀</Text>
         <Text style={styles.sectionTitle}>Für diesen Umkreis gibt es gerade keine weiteren Familien.</Text>
         <Text style={styles.help}>Erhöhe den Radius, lade erneut oder sieh dir alle freigegebenen Profile in der normalen Suche an.</Text>
         <Action text="Vorschläge erneut anzeigen" secondary onPress={()=>{setSkipped([]);fetchResults(radius);}}/>
       </View>}
      <Pressable accessibilityRole="button" onPress={()=>changeSetting(false)} disabled={busy} style={styles.turnOff}>
        <Text style={styles.turnOffText}>Nähe-Suche deaktivieren und gespeicherten Standort löschen</Text>
      </Pressable>
    </View>}
   {!!notice?<Text style={styles.notice}>{notice}</Text>:null}
   {!!error?<Text style={styles.error} accessibilityRole="alert">{error}</Text>:null}
   <Text style={styles.footer}>Die km-Angaben sind nur ungefähre Entfernungsbereiche. Aus Datenschutzgründen keine Straßenkarten mit Personenmarkierungen und keine genauen Wohnorte. Nachrichten sind erst nach gegenseitiger Bestätigung erlaubt.</Text>
 </View>;
}

const styles=StyleSheet.create({
 root:{paddingBottom:23},
 hero:{backgroundColor:'#FFEBC1',borderRadius:26,padding:22,overflow:'hidden',minHeight:170,borderWidth:1,borderColor:'#F4D5A0',marginBottom:17},
 sun:{position:'absolute',width:155,height:155,borderRadius:78,top:-65,right:-59,backgroundColor:'#FFD688'},
 eyebrow:{color:'#916123',fontWeight:'900',letterSpacing:1.2,fontSize:10,marginBottom:11},
 heroTitle:{color:COLORS.ink,fontWeight:'900',fontSize:24,lineHeight:31,maxWidth:280},
 heroBody:{color:'#536969',fontSize:13,lineHeight:20,marginTop:9,maxWidth:310},
 optinCard:{backgroundColor:'#FFFFFF',borderRadius:21,padding:20,borderWidth:1,borderColor:'#E9DCC9',gap:12},
 sectionTitle:{color:COLORS.ink,fontWeight:'900',fontSize:17,lineHeight:23},
 help:{color:COLORS.muted,fontSize:13.5,lineHeight:21},
 helpSmall:{color:'#778886',fontSize:12,lineHeight:19},
 zipInput:{backgroundColor:'#FFF9EF',borderWidth:1.5,borderColor:'#E6D8C4',borderRadius:15,paddingHorizontal:16,minHeight:51,fontSize:16,color:COLORS.ink},
 warning:{fontSize:12.5,fontWeight:'800',color:'#966532'},
 primary:{backgroundColor:COLORS.teal,borderWidth:1,borderColor:COLORS.teal},
 secondary:{backgroundColor:'#FFFFFF',borderWidth:1.5,borderColor:'#C5D9D7'},
 action:{flex:1,borderRadius:16,minHeight:53,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
 actionLabel:{color:'#FFFFFF',fontWeight:'900',fontSize:13.5,textAlign:'center'},
 secondaryLabel:{color:COLORS.teal},
 results:{gap:3},
 radiusHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
 refresh:{padding:7},
 refreshText:{color:COLORS.teal,fontSize:11.5,fontWeight:'900'},
 radiusRow:{flexDirection:'row',gap:8,marginTop:11},
 radius:{flex:1,minHeight:42,borderRadius:14,backgroundColor:'#FFFFFF',borderColor:'#E7DCCB',borderWidth:1,alignItems:'center',justifyContent:'center'},
 radiusActive:{backgroundColor:'#FFF0D1',borderColor:'#E8B868',borderWidth:1.5},
 radiusText:{color:'#738583',fontWeight:'800',fontSize:13},
 radiusTextActive:{color:'#84551D'},
 hint:{color:'#768583',fontSize:11.5,lineHeight:18,marginTop:10,marginBottom:12},
 cardStage:{marginTop:6},
 swipeCard:{backgroundColor:'#FFFFFF',borderRadius:24,overflow:'hidden',borderWidth:1,borderColor:'#EADCCA'},
 imageHeader:{height:197,position:'relative',backgroundColor:'#F6E9D2'},
 headerImage:{width:'100%',height:'100%'},
 picturePlaceholder:{width:'100%',height:'100%',backgroundColor:'#F9DFBD',justifyContent:'center',alignItems:'center',overflow:'hidden'},
 pictureSun:{position:'absolute',top:18,right:43,width:115,height:115,borderRadius:58,backgroundColor:'#F6BC7F'},
 pictureMark:{fontSize:88,color:'#9F7154',opacity:.75},
 distanceBadge:{position:'absolute',left:14,bottom:12,backgroundColor:'#FFFFFF',borderRadius:12,paddingHorizontal:12,paddingVertical:8},
 distanceText:{color:COLORS.teal,fontSize:12,fontWeight:'900'},
 cardBody:{padding:18},
 familyName:{color:COLORS.ink,fontSize:23,fontWeight:'900',lineHeight:29},
 region:{fontSize:11.5,color:COLORS.muted,marginTop:5},
 bio:{fontSize:13.5,lineHeight:21,color:'#526967',marginTop:13},
 common:{marginTop:12,color:'#86581F',backgroundColor:'#FFF1D8',padding:11,borderRadius:11,fontSize:12.5,fontWeight:'800',lineHeight:20},
 profileLink:{marginTop:12,paddingVertical:6,alignSelf:'flex-start'},
 profileLinkText:{fontSize:12.5,color:COLORS.teal,fontWeight:'900'},
 swipeHint:{textAlign:'center',fontSize:11.5,color:COLORS.muted,marginTop:13,marginBottom:14},
 actionRow:{flexDirection:'row',gap:11},
 emptyCard:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#EADCCA',borderRadius:21,padding:23,gap:13,alignItems:'center'},
 emptyIcon:{fontSize:33,color:COLORS.coral},
 changeLink:{alignSelf:'flex-start',paddingVertical:9,marginBottom:12},
 changeLinkText:{color:COLORS.teal,fontWeight:'900',fontSize:12.5},
 changePanel:{padding:15,borderWidth:1,borderColor:'#EFDBBF',borderRadius:16,backgroundColor:'#FFF6E8',gap:12,marginBottom:17},
 turnOff:{alignItems:'center',marginTop:22,paddingVertical:10,paddingHorizontal:12},
 turnOffText:{fontSize:11.5,color:COLORS.muted,fontWeight:'800',textAlign:'center',textDecorationLine:'underline'},
 notice:{backgroundColor:'#EBF6E7',borderRadius:13,padding:12,marginTop:13,fontSize:12.5,lineHeight:18,color:'#42624A'},
 error:{backgroundColor:'#FFF0E5',borderRadius:13,padding:12,marginTop:13,fontSize:12.5,lineHeight:18,color:'#945137'},
 footer:{fontSize:11.5,lineHeight:19,color:COLORS.muted,marginTop:15}
});
