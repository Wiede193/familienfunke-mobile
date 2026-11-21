import React,{useState,useRef} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {newPairs,flipPair,closePair,newThree,playThree,newPattern} from './FamilyMiniGames';

const GLYPHS={Sonne:'☀',Mond:'☾',Stern:'★',Blume:'✿',Herz:'♥',Baum:'♠',Haus:'⌂',Fisch:'≈'};
function Action({children,onPress}){
 return <Pressable accessibilityRole="button" onPress={onPress} style={s.action}><Text style={s.actionText}>{children}</Text></Pressable>;
}
export function PairsGame({level}){
 const count=level==='little'?4:level==='family'?8:6;
 const [game,setGame]=useState(()=>newPairs(count)),current=useRef(game);
 const {fontScale}=useWindowDimensions();
 function update(next){current.current=next;setGame(next);}
 function flip(i){
  const old=current.current,next=flipPair(old,i);
  if(next===old)return;
  update(next);
  AccessibilityInfo.announceForAccessibility(next.matched.length>old.matched.length?'Paar gefunden!':next.open.length===2?'Kein Paar. Bitte Karten verdecken.':'Karte '+(i+1)+': '+next.cards[i]);
 }
 const done=game.matched.length===game.cards.length;
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>Paare finden</Text>
  <Text style={s.text}>Deckt zwei gleiche Karten auf. Bei zwei verschiedenen Karten könnt ihr euch die Symbole merken und sie anschließend wieder verdecken.</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{game.matched.length/2} von {count} Paaren · {game.moves} Versuche</Text>
  <View style={s.tiles}>{game.cards.map((name,i)=>{
   const matched=game.matched.includes(i),shown=matched||game.open.includes(i);
   const disabled=matched||shown||game.open.length===2;
   return <Pressable key={i} accessibilityRole="button" accessibilityLabel={'Karte '+(i+1)+(matched?', Paar gefunden: '+name:shown?', '+name:', verdeckt')} accessibilityState={{disabled}} disabled={disabled} onPress={()=>flip(i)}
    style={[s.tile,{width:fontScale>=1.5?'48%':'23%'},shown&&s.revealed,matched&&s.matched]}>
    <Text style={[s.symbol,!shown&&{color:C.accentDark}]}>{shown?GLYPHS[name]:'?'}</Text>{shown?<Text style={s.small}>{name}</Text>:null}
   </Pressable>;
  })}</View>
  {game.open.length===2?<Action onPress={()=>update(closePair(current.current))}>Karten wieder verdecken</Action>:null}
  {done?<Text accessibilityLiveRegion="polite" style={s.heading}>Alle Paare gefunden!</Text>:null}
  <Action onPress={()=>update(newPairs(count))}>Neue Runde</Action>
 </View>;
}
export function ThreeGame(){
 const [game,setGame]=useState(newThree),current=useRef(game);
 function update(next){current.current=next;setGame(next);}
 function move(i){
  const next=playThree(current.current,i);if(next===current.current)return;update(next);
  AccessibilityInfo.announceForAccessibility(next.winner?next.winner+' gewinnt!':next.draw?'Unentschieden.':next.turn+' ist dran.');
 }
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>Drei gewinnt</Text>
  <Text style={s.text}>Zwei Personen spielen abwechselnd X und O. Drei gleiche Zeichen in einer Reihe, Spalte oder Diagonale gewinnt.</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{game.winner?game.winner+' gewinnt!':game.draw?'Unentschieden':game.turn+' ist dran'}</Text>
  <View style={s.tiles}>{game.cells.map((cell,i)=>{
   const disabled=!!cell||!!game.winner||game.draw;
   return <Pressable key={i} accessibilityRole="button" accessibilityLabel={'Zeile '+(Math.floor(i/3)+1)+', Spalte '+(i%3+1)+', '+(cell||'frei')} accessibilityState={{disabled}} disabled={disabled} onPress={()=>move(i)}
    style={[s.tile,{width:'31%'},game.line?.includes(i)&&s.matched]}><Text style={s.symbol}>{cell||'·'}</Text></Pressable>;
  })}</View>
  <Action onPress={()=>update(newThree())}>Neue Runde</Action>
 </View>;
}
export function PatternGame({level}){
 const [question,setQuestion]=useState(()=>newPattern(level)),[answer,setAnswer]=useState(null);
 const locked=useRef(false);
 function choose(n){if(locked.current)return;locked.current=true;setAnswer(n);AccessibilityInfo.announceForAccessibility((n===question.answer?'Richtig. ':'Die Lösung ist '+question.answer+'. ')+question.explanation);}
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>Zahlen-Detektive</Text>
  <Text style={s.text}>Findet die Regel. Welche Zahl gehört an die letzte Stelle?</Text>
  <View style={s.tiles}>{[...question.terms,'?'].map((n,i)=><View key={i} style={[s.number,n==='?'&&s.matched]}><Text style={s.heading}>{n}</Text></View>)}</View>
  {question.choices.map(n=><Pressable key={n} accessibilityRole="button" disabled={answer!==null} accessibilityState={{disabled:answer!==null,selected:answer===n}} onPress={()=>choose(n)} style={[s.action,answer!==null&&n===question.answer&&s.matched]}><Text style={s.actionText}>{n}{answer!==null&&n===question.answer?' ✓':''}</Text></Pressable>)}
  {answer!==null?<><Text accessibilityLiveRegion="polite" style={s.text}>{answer===question.answer?'Richtig! ':'Die Lösung ist '+question.answer+'. '}{question.explanation}</Text><Action onPress={()=>{setQuestion(newPattern(level));setAnswer(null);locked.current=false;}}>Nächstes Rätsel</Action></>:null}
 </View>;
}
const s=StyleSheet.create({card:{padding:16,borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,gap:12},title:{fontSize:23,fontWeight:'900',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},text:{fontSize:15,lineHeight:22,color:C.ink},small:{fontSize:12,color:C.ink,textAlign:'center'},tiles:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:8},tile:{minHeight:66,padding:5,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.sunPale,alignItems:'center',justifyContent:'center'},revealed:{backgroundColor:C.white,borderColor:C.accent},matched:{backgroundColor:C.mint,borderColor:C.accentDark},symbol:{fontSize:29,fontWeight:'800',color:C.ink},number:{minWidth:44,minHeight:48,padding:10,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:C.sunPale},action:{minHeight:48,justifyContent:'center',alignItems:'center',backgroundColor:C.mint,borderRadius:14,padding:12},actionText:{fontSize:16,fontWeight:'800',color:C.accentDark}});
