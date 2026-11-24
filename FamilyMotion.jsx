import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import FamilyIcon from './FamilyIcon';

// Alle Animationen sind kurz, laufen höchstens einmal und respektieren
// die Systemeinstellung „Bewegung reduzieren“. Keine neuen Bibliotheken.
export function useReducedMotion(){
 const [reduced,setReduced]=useState(true); // bei unbekannter Einstellung lieber ruhig
 useEffect(()=>{
   let live=true;
   AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(live)setReduced(!!v);}).catch(()=>{});
   const sub=AccessibilityInfo.addEventListener?.('reduceMotionChanged',v=>setReduced(!!v));
   return()=>{live=false;sub?.remove?.();};
 },[]);
 return reduced;
}
export function GentleReveal({children,style,delay=0,active=true,distance=18}){
 const reduced=useReducedMotion();
 const value=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
   if(!active)return;
   if(reduced){value.setValue(1);return;}
   value.setValue(0);
   const run=Animated.timing(value,{toValue:1,duration:360,delay,
     easing:Easing.out(Easing.cubic),useNativeDriver:true});
   run.start();return()=>run.stop();
 },[active,reduced,delay,value]);
 return <Animated.View style={[style,{opacity:value,transform:[
   {translateY:value.interpolate({inputRange:[0,1],outputRange:[distance,0]})}
 ]}]}>{children}</Animated.View>;
}

const PARTICLES=Array.from({length:10},(_,index)=>({
 index,angle:(index*360/10-90)*Math.PI/180,
 color:[C.coral,C.sun,C.teal,'#A5D3BE'][index%4]
}));
export function SparkleIntro({onFinish}){
 const reduced=useReducedMotion();
 const burst=useRef(new Animated.Value(0)).current;
 const done=useRef(false);
 const finish=()=>{if(done.current)return;done.current=true;onFinish?.();};
 useEffect(()=>{
   if(reduced){const t=setTimeout(finish,120);return()=>clearTimeout(t);}
   burst.setValue(0);
   const animation=Animated.timing(burst,{toValue:1,duration:860,
     easing:Easing.out(Easing.cubic),useNativeDriver:true});
   animation.start();
   const t=setTimeout(finish,1150);
   return()=>{clearTimeout(t);animation.stop();};
 },[reduced,burst]);
 return <View style={m.intro} accessibilityViewIsModal>
   <View style={m.burstArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
     {PARTICLES.map(p=><Animated.View key={p.index} style={[m.particle,{
       backgroundColor:p.color,opacity:burst.interpolate({inputRange:[0,.15,.7,1],outputRange:[0,1,1,0]}),
       transform:[
         {translateX:burst.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(p.angle)*112]})},
         {translateY:burst.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(p.angle)*112]})},
         {scale:burst.interpolate({inputRange:[0,.3,1],outputRange:[.2,1,.5]})}
       ]}]}/>)}
     <Animated.View style={[m.introHeart,{opacity:burst.interpolate({inputRange:[0,.2,.7,1],outputRange:[.2,1,1,1]}),
       transform:[{scale:burst.interpolate({inputRange:[0,.4,1],outputRange:[.7,1.07,1]})}]}]}>
       <Text style={m.heartText}>♥</Text>
     </Animated.View>
   </View>
   <Text style={m.introTitle}>Familienfunke</Text>
   <Text style={m.introSubtitle}>Ein Funke. Viele Möglichkeiten.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Animation überspringen"
     style={m.skipIntro} onPress={finish}><Text style={m.skipText}>Überspringen</Text></Pressable>
 </View>;
}
const TOUR=[
 {id:'search',title:'Alles mit einer Suche finden',text:'Auf der Startseite kannst du nach Angeboten, Ausflügen und Familienwissen suchen. Tippe auf „Ergebnisse anzeigen“, um passende Treffer zu öffnen.',icon:'search'},
 {id:'community',title:'Teilen und gemeinsam erleben',text:'Im Basar gibst du Kinderartikel weiter. Unter Familien findest du Kontakte mit ähnlichen Hobbys; auf der Karte findest du Ausflugsziele.',icon:'users'},
 {id:'profile',title:'Gestalte eure Familienwelt',text:'Im Menü oben rechts findest du Profil, Nachrichten, Termine und Einstellungen. Region und Hobbys sind freiwillig und helfen bei Empfehlungen.',icon:'heart'}
];
export const APP_TOUR_STEPS=TOUR;
export function FamilyAppTour({visible,onClose}){
 const [step,setStep]=useState(0);
 const reduced=useReducedMotion();
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(visible)setStep(0);},[visible]);
 useEffect(()=>{
   if(!visible)return;
   if(reduced){progress.setValue(1);return;}
   progress.setValue(0);
   const a=Animated.timing(progress,{toValue:1,duration:250,easing:Easing.out(Easing.cubic),useNativeDriver:true});
   a.start();return()=>a.stop();
 },[visible,step,reduced,progress]);
 if(!visible)return null;
 const item=TOUR[step];
 const next=()=>step===TOUR.length-1?onClose?.():setStep(x=>x+1);
 return <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
   <View accessibilityViewIsModal style={m.tourShade}>
     <Animated.View style={[m.tourCard,{
       opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[9,0]})}]
     }]}>
       <ScrollView bounces={false} contentContainerStyle={{padding:20}}>
       <View style={m.tourIcon}><FamilyIcon name={item.icon} size={30}/></View>
       <Text style={m.tourCount}>DEINE APP-TOUR · {step+1} / {TOUR.length}</Text>
       <Text accessibilityRole="header" style={m.tourTitle}>{item.title}</Text>
       <Text style={m.tourBody}>{item.text}</Text>
       <View style={m.dots}>{TOUR.map((p,i)=><View key={p.id}
         style={[m.dot,i===step&&m.dotActive]}/>)}</View>
       <View style={m.tourActions}>
         <Pressable accessibilityRole="button" accessibilityLabel="Tour überspringen" onPress={onClose}
           style={m.tourSecondary}><Text style={m.tourSecondaryText}>Überspringen</Text></Pressable>
         {step>0?<Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Tour-Schritt"
           onPress={()=>setStep(x=>x-1)} style={m.tourSecondary}><Text style={m.tourSecondaryText}>Zurück</Text></Pressable>:null}
         <Pressable accessibilityRole="button" accessibilityLabel={step===TOUR.length-1?'Tour abschließen':'Nächster Tour-Schritt'}
           onPress={next} style={m.tourPrimary}>
           <Text style={m.tourPrimaryText}>{step===TOUR.length-1?'Fertig':'Weiter'}</Text>
           <FamilyIcon name="chevron-right" size={18} color={C.white}/>
         </Pressable>
       </View>
       </ScrollView>
     </Animated.View>
   </View>
 </Modal>;
}
export function SoftTabIcon({name,selected}){
 const reduced=useReducedMotion();
 const glow=useRef(new Animated.Value(selected?1:0)).current;
 useEffect(()=>{
   if(reduced){glow.setValue(selected?1:0);return;}
   const a=Animated.timing(glow,{toValue:selected?1:0,duration:230,
     easing:Easing.out(Easing.quad),useNativeDriver:false});a.start();
   return()=>a.stop();
 },[selected,reduced,glow]);
 return <Animated.View style={{width:40,height:37,borderRadius:15,justifyContent:'center',alignItems:'center',
   backgroundColor:glow.interpolate({inputRange:[0,1],outputRange:['#FFFFFF00','#FFEBAD']}),
   transform:[{scale:glow.interpolate({inputRange:[0,1],outputRange:[1,1.08]})}]}}>
   <FamilyIcon name={name} size={24} color={selected?C.accentDark:C.muted}/>
 </Animated.View>;
}
const m=StyleSheet.create({
 intro:{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center',padding:24},
 burstArea:{width:260,height:260,justifyContent:'center',alignItems:'center'},
 particle:{position:'absolute',width:12,height:12,borderRadius:6},
 introHeart:{width:112,height:112,borderRadius:56,backgroundColor:C.sun,justifyContent:'center',
  alignItems:'center',borderWidth:7,borderColor:'#FFF0CF'},
 heartText:{color:C.coralDeep,fontSize:66,fontWeight:'900'},
 introTitle:{fontSize:32,fontWeight:'900',color:C.ink,marginTop:10},
 introSubtitle:{fontSize:16,color:C.muted,marginTop:8},
 skipIntro:{marginTop:45,minHeight:48,justifyContent:'center',paddingHorizontal:24},
 skipText:{color:C.accentDark,fontSize:15,fontWeight:'800'},
 tourShade:{flex:1,backgroundColor:'rgba(20,39,43,.68)',justifyContent:'center',alignItems:'center',padding:20},
 tourIcon:{width:58,height:58,borderRadius:19,backgroundColor:C.sunPale,alignItems:'center',justifyContent:'center',marginBottom:15},
 tourArrowWrap:{position:'absolute',width:30,height:55,justifyContent:'center',alignItems:'center'},
 tourArrow:{fontSize:40,fontWeight:'900',color:C.sun,textShadowColor:'#202B2B',textShadowRadius:8},
 tourCard:{width:'100%',maxWidth:480,maxHeight:'90%',backgroundColor:C.paper,
  borderRadius:23,borderColor:C.sun,borderWidth:2,shadowColor:'#1C3033',shadowOpacity:.16,shadowRadius:12,elevation:9},
 tourCount:{fontSize:12,fontWeight:'900',letterSpacing:1.1,color:C.accentDark},
 tourTitle:{fontSize:21,fontWeight:'900',color:C.ink,marginTop:7,lineHeight:27},
 tourBody:{fontSize:15,lineHeight:23,color:C.muted,marginTop:9},
 dots:{flexDirection:'row',gap:7,marginTop:18},
 dot:{height:7,width:7,backgroundColor:C.line,borderRadius:4},
 dotActive:{width:22,backgroundColor:C.teal},
 tourActions:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',
   flexWrap:'wrap',gap:8,marginTop:18},
 tourSecondary:{minHeight:44,justifyContent:'center',paddingHorizontal:8},
 tourSecondaryText:{fontSize:14,color:C.accentDark,fontWeight:'800'},
 tourPrimary:{minHeight:47,backgroundColor:C.teal,borderRadius:15,paddingHorizontal:15,
   flexDirection:'row',alignItems:'center',gap:6},
 tourPrimaryText:{fontSize:15,color:C.white,fontWeight:'900'}
});
