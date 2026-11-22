import React,{useRef,useState} from 'react';
import {AccessibilityInfo,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {useFamilyLocale} from './FamilyLocale';
import {gridCellLabel,chessStatus,chessPieceName,draughtsStatus,draughtsPieceName,crosswordStatus,pictureStatus,pictureTileLabel} from './FamilyGameA11y';
import {newChess,chessMoves,playChess,chessCheck} from './FamilyChess';
import {newDraughts,draughtsMoves,playDraughts,CROSSWORDS,buildCrossword,crosswordPut,crosswordHint,crosswordWon,PICTURE_SCENES,pictureTile,newPicture,swapPicture,pictureWon} from './FamilyBoardPuzzles';
const say=text=>AccessibilityInfo.announceForAccessibility(text);
function Action({children,onPress,disabled=false,active=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled,selected:active}} disabled={disabled} onPress={onPress} style={[s.button,active&&s.active,disabled&&{opacity:.5}]}><Text style={[s.buttonText,active&&{color:C.white}]}>{children}</Text></Pressable>;
}
function usePosition(create){
 const [game,setGame]=useState(create),ref=useRef(game);
 const update=value=>{ref.current=value;setGame(value);return value;};
 return [game,update,ref];
}
const coord=i=>'abcdefgh'[i%8]+(8-(i>>3));
const pieces={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const names={k:'König',q:'Dame',r:'Turm',b:'Läufer',n:'Springer',p:'Bauer'};
function Board({board,selected,moves,last,onTap,render,label,disabled,language='de'}){
 return <ScrollView horizontal><View style={s.board}>{board.map((p,i)=>{
  const target=moves.some(m=>m.to===i),chosen=i===selected,dark=((i>>3)+i%8)%2===1;
  return <Pressable key={i} accessibilityRole="button" accessibilityLabel={coord(i)+', '+label(p)+(target?(language==='en'?', possible move':', möglicher Zug'):'')} accessibilityState={{selected:chosen,disabled}} disabled={disabled} onPress={()=>onTap(i)} style={[s.square,dark&&s.darkSquare,last?.to===i&&s.last,chosen&&s.chosen,target&&s.target]}>
   {render(p)}{target?<View style={s.dot}/>:null}
  </Pressable>;
 })}</View></ScrollView>;
}
export function ChessGame(){
 const {t,language}=useFamilyLocale();
 const [game,update,ref]=usePosition(newChess),[selected,setSelected]=useState(null),[promotion,setPromotion]=useState(null);
 const current=useRef(null),pending=useRef(null);
 const choose=i=>{current.current=i;setSelected(i);};
 const moves=chessMoves(game).filter(m=>m.from===selected);
 function finish(from,to,p){
  const old=ref.current,next=playChess(old,from,to,p);
  if(old!==next){update(next);choose(null);pending.current=null;setPromotion(null);say(chessStatus(next,!next.result&&chessCheck(next),language));}
 }
 function tap(i){
  const g=ref.current;if(g.result||pending.current)return;
  const available=chessMoves(g).filter(m=>m.from===current.current&&m.to===i);
  if(available.length){
   if(available.some(m=>m.promotion)){const p={from:current.current,to:i};pending.current=p;setPromotion(p);}
   else finish(current.current,i,'q');
  }else if(g.board[i]&&((g.board[i]===g.board[i].toUpperCase())===(g.turn==='w')))choose(i===current.current?null:i);
  else choose(null);
 }
 function reset(){update(newChess());choose(null);pending.current=null;setPromotion(null);}
 const status=chessStatus(game,chessCheck(game),language);
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Schach")}</Text>
  <Text style={s.text}>{t("Zwei Personen am selben Gerät. Wähle eine Figur und ein markiertes Zielfeld. Rochade, en passant und Bauernumwandlung sind möglich.")}</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{status}</Text>
  <Board board={game.board} selected={selected} moves={moves} last={game.last} disabled={!!game.result||!!promotion} onTap={tap}
   language={language} label={p=>chessPieceName(p,language)} render={p=><Text style={s.piece}>{pieces[p]||''}</Text>}/>
  {promotion?<View style={s.note}><Text style={s.heading}>{t("Bauernumwandlung")}</Text><View style={s.wrap}>{['q','r','b','n'].map(p=><Action key={p} onPress={()=>{if(pending.current)finish(pending.current.from,pending.current.to,p);}}>{language==='en'?({q:'Queen',r:'Rook',b:'Bishop',n:'Knight'})[p]:names[p]}</Action>)}</View></View>:null}
  <Text style={s.muted}>{t("Freizeitregeln ohne Uhr: dreifache Wiederholung und 50-Züge-Regel gelten automatisch als Remis. Das Brett lässt sich seitlich scrollen.")}</Text>
  <Action onPress={reset}>{t("Neue Partie")}</Action>
 </View>;
}
export function DraughtsGame(){
 const {t,language}=useFamilyLocale();
 const [game,update,ref]=usePosition(newDraughts),[selected,setSelected]=useState(null),current=useRef(null);
 const choose=i=>{current.current=i;setSelected(i);};
 const allMoves=draughtsMoves(game);
 const moves=allMoves.filter(m=>m.from===selected);
 const status=draughtsStatus(game,allMoves.some(m=>m.capture!==undefined),language);
 function tap(i){
  const old=ref.current;if(old.winner||old.draw)return;
  const next=playDraughts(old,current.current,i);
  if(next!==old){update(next);choose(next.forced);say(draughtsStatus(next,draughtsMoves(next).some(m=>m.capture!==undefined),language));}
  else if(old.forced===null)choose(draughtsMoves(old).some(m=>m.from===i)?i:null);
 }
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Dame")}</Text>
  <Text style={s.text}>{t("Englische 8×8-Variante: einfache Steine ziehen und schlagen diagonal vorwärts, gekrönte Damen auch rückwärts – jeweils über ein Feld. Schlagen ist Pflicht, Schlagketten werden fortgesetzt.")}</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{status}</Text>
  <Board board={game.board} selected={selected} moves={moves} last={game.last} disabled={!!game.winner||game.draw} onTap={tap}
   language={language} label={p=>draughtsPieceName(p,language)}
   render={p=>p?<View style={[s.stone,Math.abs(p)===2&&s.stone2]}><Text style={[s.stoneText,Math.abs(p)===2&&{color:C.white}]}>{p<0?'D':Math.abs(p)}</Text></View>:null}/>
  <Text style={s.muted}>{t("Eine Dame entsteht beim Erreichen der Gegenseite. Bei 80 Halbzügen ohne Schlag oder Bauernzug endet diese Freizeitvariante remis.")}</Text>
  <Action onPress={()=>{update(newDraughts());choose(null);}}>{t("Neue Partie")}</Action>
 </View>;
}
export function CrosswordGame({level}){
 const {t,language}=useFamilyLocale();
 const pool=CROSSWORDS.filter(x=>x.level===level);
 const [game,update,ref]=usePosition(()=>buildCrossword(pool[0])),[selected,setSelected]=useState(null),[clue,setClue]=useState(null),[check,setCheck]=useState(false);
 const current=useRef(null),clueRef=useRef(null);
 function choose(i,c=null){current.current=i;setSelected(i);clueRef.current=c;setClue(c);}
 function load(id){update(buildCrossword(pool.find(x=>x.id===id)||pool[0]));choose(null);setCheck(false);}
 function enter(letter,hint=false){
  const i=current.current;if(i===null||crosswordWon(ref.current))return;
  const next=hint?crosswordHint(ref.current,i):crosswordPut(ref.current,i,letter);update(next);
  if(crosswordWon(next)){say(language==='en'?'Crossword solved!':'Kreuzworträtsel gelöst!');return;}
  if(letter||hint){
   const active=next.clues.find(x=>x.id===clueRef.current)||next.clues.find(x=>x.cells.includes(i));
   const j=active?.cells.indexOf(i);
   if(active&&j>=0&&j+1<active.cells.length)choose(active.cells[j+1],active.id);
  }
 }
 const selectedClue=game.clues.find(x=>x.id===clue);
 const done=crosswordWon(game);
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Kreuzworträtsel")}</Text>{language==='en'?<Text style={s.muted}>{t("Diese Kreuzworträtsel verwenden deutsche Begriffe und Hinweise. Eine englische Variante wird noch erstellt.")}</Text>:null}
  <Text style={s.text}>{t("Wähle ein Rätsel und eine Frage. Trage die Buchstaben ein. Gemeinsame Felder verbinden die Wörter.")}</Text>
  <View style={s.wrap}>{pool.map(p=><Action key={p.id} active={p.id===game.id} onPress={()=>load(p.id)}>{p.title}</Action>)}</View>
  <ScrollView horizontal><View style={{width:game.width*44,flexDirection:'row',flexWrap:'wrap'}}>{game.cells.map((v,i)=>{
   if(v===null)return <View key={i} style={s.block}/>;
   const n=game.clues.find(c=>c.cells[0]===i)?.number;
   const wrong=check&&v&&v!==game.solution[i];
   return <Pressable key={i} accessibilityRole="button" accessibilityLabel={gridCellLabel(Math.floor(i/game.width)+1,i%game.width+1,v,language,{start:n,incorrect:!!wrong})} accessibilityState={{selected:i===selected,disabled:done}} disabled={done} onPress={()=>choose(i,selectedClue?.cells.includes(i)?clue:game.clues.find(c=>c.cells.includes(i))?.id)}
    style={[s.crossCell,selectedClue?.cells.includes(i)&&s.last,wrong&&s.wrong,i===selected&&s.chosen]}>
    {n?<Text style={s.clueNumber}>{n}</Text>:null}<Text style={s.letter}>{v}</Text>
   </Pressable>;
  })}</View></ScrollView>
  {game.clues.map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityState={{selected:c.id===clue,disabled:done}} disabled={done} onPress={()=>choose(c.cells.find(i=>!game.cells[i])??c.cells[0],c.id)} style={[s.note,c.id===clue&&s.chosen]}>
   <Text style={s.heading}>{c.number} {t(c.dir==='across'?'Waagerecht':'Senkrecht')} · {c.cells.length} {t('Buchstaben')}</Text><Text style={s.text}>{c.clue}</Text>
  </Pressable>)}
  <Text accessibilityLiveRegion="polite" style={s.heading}>{crosswordStatus(done,selected,language)}</Text>
  <View style={s.wrap}>{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'].map(letter=><Action key={letter} disabled={selected===null||done} onPress={()=>enter(letter)}>{letter}</Action>)}</View>
  <View style={s.wrap}><Action disabled={selected===null||done} onPress={()=>enter('')}>{t("Löschen")}</Action><Action disabled={selected===null||done} onPress={()=>enter('',true)}>{t("Tipp")}</Action><Action active={check} onPress={()=>setCheck(x=>!x)}>{t("Prüfen")}</Action><Action onPress={()=>load(game.id)}>{t("Neu beginnen")}</Action></View>
  <Text style={s.muted}>{t('Hinweise genutzt: ')}{game.hints}</Text>
 </View>;
}
function PixelTile({pixels,size}){
 const side=Math.sqrt(pixels.length);
 return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{width:size,height:size,flexDirection:'row',flexWrap:'wrap'}}>
  {pixels.map((color,i)=><View key={i} style={{width:size/side,height:size/side,backgroundColor:color}}/>)}
 </View>;
}
export function PictureGame({level}){
 const {t,language}=useFamilyLocale();
 const [game,update,ref]=usePosition(()=>newPicture(level==='little'?2:level==='school'?3:4)),[selected,setSelected]=useState(null),current=useRef(null),[show,setShow]=useState(true);
 const choose=i=>{current.current=i;setSelected(i);};
 const scene=PICTURE_SCENES[game.sceneId],done=pictureWon(game),tile=72;
 function reset(n,id){update(newPicture(n,id));choose(null);}
 function tap(i){
  if(pictureWon(ref.current))return;
  if(current.current===null){choose(i);return;}
  const next=swapPicture(ref.current,current.current,i);update(next);choose(null);if(pictureWon(next))say(language==='en'?'Picture puzzle solved!':'Bildpuzzle gelöst!');
 }
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Bilderpuzzle")}</Text>
  <Text style={s.text}>{t("Tippe zwei Bildteile nacheinander an, um sie zu tauschen. Stelle das Motiv wieder her.")}</Text>
  <View style={s.wrap}>{[2,3,4].map(n=><Action key={n} active={n===game.n} onPress={()=>reset(n,game.sceneId)}>{n*n} {language==='en'?'pieces':'Teile'}</Action>)}</View>
  <View style={s.wrap}>{PICTURE_SCENES.map(x=><Action key={x.id} active={x.id===scene.id} onPress={()=>reset(game.n,x.id)}{t(x.title)}</Action>)}</View>
  <Action active={show} onPress={()=>setShow(v=>!v)}{t(show?'Vorlage ausblenden':'Vorlage anzeigen')}</Action>
  {show?<View accessible accessibilityLabel={t('Vorlage: ')+t(scene.title)}><PixelTile pixels={scene.pixels} size={120}/></View>:null}
  <ScrollView horizontal><View style={{width:game.n*(tile+4),flexDirection:'row',flexWrap:'wrap'}}>{game.order.map((id,i)=><Pressable key={i}
   accessibilityRole="button" accessibilityLabel={pictureTileLabel(i+1,id+1,language)} accessibilityState={{selected:i===selected,disabled:done}} disabled={done} onPress={()=>tap(i)}
   style={{width:tile+4,height:tile+4,borderWidth:2,borderColor:i===selected?C.accentDark:C.paper}}>
   <PixelTile pixels={pictureTile(scene,game.n,id)} size={tile}/>
  </Pressable>)}</View></ScrollView>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{pictureStatus(done,game.moves,language)}</Text>
  <Action onPress={()=>reset(game.n,scene.id)}>{t("Neu mischen")}</Action>
 </View>;
}
const s=StyleSheet.create({card:{padding:16,borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,gap:12},title:{fontSize:23,fontWeight:'900',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},text:{fontSize:15,lineHeight:22,color:C.ink},muted:{fontSize:13,color:C.muted,lineHeight:19},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},button:{minWidth:44,minHeight:48,padding:11,borderRadius:12,backgroundColor:C.mint,alignItems:'center',justifyContent:'center'},buttonText:{fontSize:15,fontWeight:'800',color:C.accentDark,textAlign:'center'},active:{backgroundColor:C.accentDark},board:{width:352,flexDirection:'row',flexWrap:'wrap'},square:{width:44,height:44,backgroundColor:C.sunPale,alignItems:'center',justifyContent:'center',borderWidth:.5,borderColor:C.line},darkSquare:{backgroundColor:'#90B9B1'},last:{backgroundColor:C.mint},chosen:{backgroundColor:C.sun,borderWidth:2,borderColor:C.accentDark},target:{borderWidth:2,borderColor:C.accentDark},piece:{fontSize:31,color:C.ink,lineHeight:40},dot:{position:'absolute',bottom:3,right:3,width:7,height:7,borderRadius:4,backgroundColor:C.accentDark},stone:{width:32,height:32,borderRadius:16,backgroundColor:C.sun,borderWidth:2,borderColor:C.ink,alignItems:'center',justifyContent:'center'},stone2:{backgroundColor:C.ink},stoneText:{fontSize:16,fontWeight:'900',color:C.ink},note:{padding:12,borderRadius:12,backgroundColor:C.bg,gap:4},block:{width:44,height:44,backgroundColor:C.ink},crossCell:{width:44,height:44,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,alignItems:'center',justifyContent:'center'},clueNumber:{position:'absolute',top:1,left:2,fontSize:10,color:C.ink},letter:{fontSize:20,fontWeight:'800',color:C.ink},wrong:{backgroundColor:C.peach}});
