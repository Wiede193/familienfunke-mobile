import React,{useState,useRef} from 'react';
import {AccessibilityInfo,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {useFamilyLocale} from './FamilyLocale';
import {fourStatus,fourCellLabel,gridCellLabel,sudokuStatus,solitaireCardName,solitaireProgress,solitaireFoundationLabel} from './FamilyGameA11y';
import {newFour,dropFour,newSudoku,sudokuPut,sudokuHint,sudokuWon,sudokuConflicts,newWord,wordPick,wordUndo,wordText,wordWon} from './FamilyClassicGames';
import {newSolitaire,drawSolitaire,moveSolitaire,autoFoundation,sourceCards,solitaireWon,cardShort,cardLabel,red} from './FamilySolitaire';

function Action({children,onPress,disabled=false,active=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled,selected:active}} disabled={disabled} onPress={onPress} style={[s.button,active&&s.selected,disabled&&{opacity:.45}]}><Text style={[s.buttonText,active&&{color:C.white}]}>{children}</Text></Pressable>;
}
function useGame(create){
 const [game,setGame]=useState(create),ref=useRef(game);
 const update=fn=>{const next=fn(ref.current);ref.current=next;setGame(next);return next;};
 return [game,update,ref];
}
const say=text=>AccessibilityInfo.announceForAccessibility(text);
export function FourGame(){
 const {t,language}=useFamilyLocale();
 const [game,update]=useGame(newFour);
 const status=fourStatus(game,language);
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Vier gewinnt")}</Text>
  <Text style={s.text}>{t("Zwei Personen spielen abwechselnd. Tippt auf eine Spalte: Der Stein fällt nach unten. Vier gleiche Steine waagerecht, senkrecht oder diagonal gewinnen.")}</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{status}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator>
   <View>
    <View style={s.row}>{Array.from({length:7},(_,c)=><Pressable key={c} accessibilityRole="button" accessibilityLabel={(language==='en'?'Drop piece in column ':'Stein in Spalte ')+(c+1)+(language==='en'?'':' werfen')} accessibilityState={{disabled:!!game.cells[c]||!!game.winner||game.draw}} disabled={!!game.cells[c]||!!game.winner||game.draw} onPress={()=>{const n=update(g=>dropFour(g,c));say(fourStatus(n,language));}} style={s.drop}><Text style={s.buttonText}>↓{c+1}</Text></Pressable>)}</View>
    <View style={s.board}>{game.cells.map((v,i)=><View key={i} accessible accessibilityLabel={fourCellLabel(v,i,language)} style={[s.disc,v===1&&s.yellow,v===2&&s.teal,game.line.includes(i)&&s.win]}><Text style={[s.discText,v===2&&{color:C.white}]}>{v||'·'}</Text></View>)}</View>
   </View>
  </ScrollView>
  <Action onPress={()=>update(newFour)}>{t("Neue Runde")}</Action>
 </View>;
}
export function SudokuGame({level}){
 const {t,language}=useFamilyLocale();
 const [game,update,ref]=useGame(()=>newSudoku(level==='little'?4:level==='school'?6:9));
 const [selected,setSelected]=useState(null),[notice,setNotice]=useState('');
 const selectedRef=useRef(null);
 function choose(i){selectedRef.current=i;setSelected(i);setNotice('');}
 function reset(n){update(()=>newSudoku(n));choose(null);}
 function enter(v){
  if(selectedRef.current===null||sudokuWon(ref.current))return;
  const next=update(g=>sudokuPut(g,selectedRef.current,v));
  if(sudokuWon(next))say(language==='en'?'Sudoku solved!':'Sudoku gelöst!');
 }
 const conflicts=sudokuConflicts(game),done=sudokuWon(game);
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>Sudoku</Text>
  <Text style={s.text}>{language==='en'?'Each number from 1 to '+game.n+' must appear exactly once in each row, column and outlined block. Choose an empty or editable cell, then a number.':<>Jede Zahl von 1 bis {game.n} muss in jeder Zeile, Spalte und jedem umrandeten Block genau einmal vorkommen. Wähle ein leeres oder selbst ausgefülltes Feld und dann eine Zahl.</>}</Text>
  <View style={s.wrap}>{[4,6,9].map(n=><Action key={n} active={game.n===n} onPress={()=>reset(n)}>{n} × {n}</Action>)}</View>
  <Text style={s.muted}>{t("Das 9×9-Feld kann auf kleinen Bildschirmen seitlich gescrollt werden.")}</Text>
  <ScrollView horizontal>
   <View style={{width:game.n*44+2,borderWidth:1,borderColor:C.accentDark,flexDirection:'row',flexWrap:'wrap'}}>
    {game.cells.map((v,i)=>{
     const r=Math.floor(i/game.n),c=i%game.n,fixed=!!game.givens[i],conflict=conflicts.includes(i);
     return <Pressable key={i} accessibilityRole="button" accessibilityLabel={gridCellLabel(r+1,c+1,v,language,{fixed,conflict})} accessibilityState={{selected:i===selected,disabled:fixed||done}} disabled={fixed||done} onPress={()=>choose(i)}
      style={[s.cell,{borderRightWidth:(c+1)%game.bc===0?2:1,borderBottomWidth:(r+1)%game.br===0?2:1,borderRightColor:(c+1)%game.bc===0?C.accentDark:C.line,borderBottomColor:(r+1)%game.br===0?C.accentDark:C.line},fixed&&{backgroundColor:C.mint},conflict&&{backgroundColor:C.peach},i===selected&&{backgroundColor:C.sun}]}>
      <Text style={[s.number,fixed&&{fontWeight:'900'},conflict&&{color:C.danger}]}>{v||' '}</Text>
     </Pressable>;
    })}
   </View>
  </ScrollView>
  <Text accessibilityLiveRegion="polite" style={s.text}>{sudokuStatus(done,conflicts.length>0,selected,language)} {notice? t('Hinweise genutzt: ')+notice:''}</Text>
  <View style={s.wrap}>{Array.from({length:game.n},(_,i)=><Action key={i} disabled={selected===null||done} onPress={()=>enter(i+1)}>{i+1}</Action>)}</View>
  <View style={s.wrap}>
   <Action disabled={selected===null||done} onPress={()=>enter(0)}>{t("Löschen")}</Action>
   <Action disabled={selected===null||done} onPress={()=>{const n=update(g=>sudokuHint(g,selectedRef.current));setNotice(String(n.hints));if(sudokuWon(n))say(language==='en'?'Sudoku solved!':'Sudoku gelöst!');}}>{t("Tipp")}</Action>
   <Action onPress={()=>reset(game.n)}>{t("Neues Rätsel")}</Action>
  </View>
 </View>;
}
export function WordGame({level}){
 const {t,language}=useFamilyLocale();
 const [game,update]=useGame(()=>newWord(level)),seen=useRef(new Set()),[revealed,setRevealed]=useState(false);const answer=wordText(game),won=wordWon(game),full=game.selected.length===game.tiles.length,finished=won||revealed;
 function next(){seen.current.add(game.id);if(seen.current.size>=12)seen.current.clear();update(()=>newWord(level,Math.random,[...seen.current]));setRevealed(false);}
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Wörterrätsel")}</Text>{language==='en'?<Text style={s.muted}>{t("Diese Wörterrätsel verwenden deutsche Wörter. Eine englische Variante wird noch erstellt.")}</Text>:null}
  <Text style={s.text}>{t("Sortiere die Buchstaben zu einem passenden Wort. Die Umschreibung hilft dir dabei.")}</Text>
  <View style={s.note}><Text style={s.heading}>{game.hint}</Text></View>
  <Text accessibilityLiveRegion="polite" style={s.word}>{answer||t('Noch keine Buchstaben')}</Text>
  <View style={s.wrap}>{game.tiles.map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityLabel={(language==='en'?'Letter ':'Buchstabe ')+t.letter+', '+(language==='en'?'position ':'Position ')+(t.id+1)} accessibilityState={{disabled:game.selected.includes(t.id)||finished}} disabled={game.selected.includes(t.id)||finished} style={[s.letter,game.selected.includes(t.id)&&{opacity:.25}]} onPress={()=>{const n=update(g=>wordPick(g,t.id));if(wordWon(n))say(t('Richtig!')+' '+n.word);}}><Text style={s.number}>{t.letter}</Text></Pressable>)}</View>
  {revealed?<Text style={s.heading}>{t('Die Lösung lautet: ')}{game.word}</Text>:won?<Text style={s.heading}>{t('Richtig!')} {game.word}</Text>:full?<Text style={s.text}>{t("Noch nicht richtig. Versuche eine andere Reihenfolge.")}</Text>:null}
  <View style={s.wrap}><Action disabled={!game.selected.length||finished} onPress={()=>update(wordUndo)}>{t("Zurück")}</Action><Action disabled={finished} onPress={()=>update(g=>({...g,selected:[]}))}>{t("Neu sortieren")}</Action></View>
  <Action onPress={()=>{if(finished)next();else {setRevealed(true);say(t('Die Lösung lautet: ')+game.word);}}}>{t(finished?'Nächstes Wort':'Lösung zeigen')}</Action>
  {!finished?<Action onPress={next}>{t("Überspringen")}</Action>:null}
 </View>;
}
const same=(a,b)=>a&&b&&a.type===b.type&&a.col===b.col&&a.index===b.index;
function Card({id,hidden=false,label,selected=false,onPress}){
 const {language}=useFamilyLocale();
 return <Pressable accessibilityRole="button" accessibilityLabel={label||(hidden?(language==='en'?'Face-down card':'Verdeckte Karte'):solitaireCardName(id,language))} accessibilityState={{selected,disabled:!onPress}} disabled={!onPress} onPress={onPress} style={[s.playCard,hidden&&s.backCard,selected&&s.selectedCard]}>
  <Text style={[s.cardText,id!=null&&red(id)&&!hidden&&{color:C.danger},hidden&&{color:C.white}]}>{hidden?'◆':id==null?'＋':cardShort(id)}</Text>
 </Pressable>;
}
export function SolitaireGame(){
 const {t,language}=useFamilyLocale();
 const [game,update,ref]=useGame(newSolitaire),[selected,setSelected]=useState(null),[notice,setNotice]=useState('');
 const current=useRef(null),history=useRef([]);
 function choose(from){current.current=from;setSelected(from);}
 function apply(next){if(next===ref.current)return false;history.current=[...history.current.slice(-99),ref.current];update(()=>next);choose(null);setNotice('');return true;}
 function tap(place){
  if(solitaireWon(ref.current))return;
  if(current.current&&same(current.current,place)){choose(null);return;}
  if(current.current&&apply(moveSolitaire(ref.current,current.current,place)))return;
  if(sourceCards(ref.current,place).length){choose(place);setNotice('Karte oder Folge ausgewählt.');}
  else {choose(null);setNotice('Dieser Zug ist nicht möglich.');}
 }
 function fresh(){history.current=[];update(newSolitaire);choose(null);setNotice('');}
 return <View style={s.card}>
  <Text accessibilityRole="header" style={s.title}>{t("Solitär – Klondike")}</Text>
  <Text style={s.text}>{t("Lege alle Karten auf die vier Zielstapel: Ass bis König, jeweils dasselbe Kartensymbol (Pik, Kreuz, Herz oder Karo). In den sieben Spielstapeln folgen die Karten absteigend und abwechselnd rot und schwarz. Leere Spielstapel beginnen mit einem König. Tippe zuerst auf die Karte oder Folge, dann auf den Zielstapel.")}</Text>
  <Text style={s.muted}>{t("Eine Karte pro Aufdecken, Nachziehstapel beliebig oft erneut nutzen. Nicht jede zufällige Austeilung ist lösbar. Die Tabelle ist seitlich scrollbar.")}</Text>
  <Text accessibilityLiveRegion="polite" style={s.heading}>{solitaireProgress(game.foundations.reduce((n,p)=>n+p.length,0),game.moves,solitaireWon(game),language)}</Text>
  <View style={s.wrap}><Action disabled={!game.stock.length&&!game.waste.length||solitaireWon(game)} onPress={()=>apply(drawSolitaire(ref.current))}>{game.stock.length?(language==='en'?'Draw card (':'Aufdecken (')+game.stock.length+')':(language==='en'?'Recycle stock':'Nachziehstapel wenden')}</Action>
   <Card id={game.waste.at(-1)} label={game.waste.length?(language==='en'?'Waste card: ':'Offene Karte: ')+solitaireCardName(game.waste.at(-1),language):(language==='en'?'No waste card':'Keine offene Karte')} selected={selected?.type==='waste'} onPress={game.waste.length?()=>tap({type:'waste'}):undefined}/>
  </View>
  <Text style={s.heading}>{t("Zielstapel")}</Text>
  <View style={s.wrap}>{game.foundations.map((p,i)=><Card key={i} id={p.at(-1)} label={solitaireFoundationLabel(i,p.at(-1),language)} selected={same(selected,{type:'foundation',col:i})} onPress={()=>tap({type:'foundation',col:i})}/>)}</View>
  <Text style={s.heading}>{t("Spielstapel")}</Text>
  <ScrollView horizontal><View style={[s.row,{alignItems:'flex-start'}]}>{game.tableau.map((pile,col)=><View key={col} style={{width:58,marginRight:4,gap:3}}>
   <Text style={s.muted}> {col+1}</Text>
   {pile.hidden>0?<View accessible accessibilityLabel={pile.hidden+(language==='en'?' face-down cards':' verdeckte Karten')} style={s.hiddenCount}><Text style={{color:C.white}}>◆ {pile.hidden}</Text></View>:null}
   {!pile.cards.length?<Card label={(language==='en'?'Empty tableau column ':'Leerer Spielstapel ')+(col+1)} onPress={()=>tap({type:'tableau',col,index:0})}/>:pile.cards.slice(pile.hidden).map((id,j)=>{
    const index=j+pile.hidden,place={type:'tableau',col,index};
    return <Card key={id} id={id} selected={same(selected,place)} onPress={()=>tap(place)}/>;
   })}
  </View>)}</View></ScrollView>
  {notice?<Text accessibilityLiveRegion="polite" style={s.text}>{t(notice)}</Text>:null}
  <View style={s.wrap}>
   <Action disabled={!selected||solitaireWon(game)} onPress={()=>{if(!apply(autoFoundation(ref.current,current.current)))setNotice('Diese Karte passt noch nicht auf einen Zielstapel.');}}>{t("Zum Zielstapel")}</Action>
   <Action disabled={!history.current.length} onPress={()=>{const last=history.current.pop();if(last){update(()=>last);choose(null);setNotice('');}}}>{t("Zug zurück")}</Action>
   <Action onPress={fresh}>{t("Neu austeilen")}</Action>
  </View>
 </View>;
}
const s=StyleSheet.create({card:{padding:16,borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,gap:12},title:{fontSize:23,fontWeight:'900',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},text:{fontSize:15,lineHeight:22,color:C.ink},muted:{fontSize:13,color:C.muted,lineHeight:19},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'},row:{flexDirection:'row'},button:{minHeight:48,minWidth:44,padding:11,borderRadius:12,backgroundColor:C.mint,alignItems:'center',justifyContent:'center'},buttonText:{fontSize:15,color:C.accentDark,fontWeight:'800',textAlign:'center'},selected:{backgroundColor:C.accentDark},drop:{width:46,height:48,justifyContent:'center',alignItems:'center'},board:{width:322,flexDirection:'row',flexWrap:'wrap',backgroundColor:C.accentDark},disc:{width:44,height:44,margin:1,borderRadius:22,backgroundColor:C.white,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:C.accentDark},yellow:{backgroundColor:C.sun},teal:{backgroundColor:C.ink},win:{borderColor:C.coral,borderWidth:4},discText:{fontSize:22,fontWeight:'900',color:C.ink},cell:{width:44,height:44,justifyContent:'center',alignItems:'center',backgroundColor:C.paper},number:{fontSize:20,color:C.ink,fontWeight:'700'},letter:{minWidth:44,minHeight:48,backgroundColor:C.sunPale,borderRadius:10,padding:8,alignItems:'center',justifyContent:'center'},word:{fontSize:23,fontWeight:'900',color:C.ink,letterSpacing:1},note:{padding:14,borderRadius:12,backgroundColor:C.sunPale},playCard:{width:56,minHeight:54,borderRadius:8,borderColor:C.line,borderWidth:1,alignItems:'center',justifyContent:'center',backgroundColor:C.paper,paddingVertical:6},backCard:{backgroundColor:C.accentDark},selectedCard:{backgroundColor:C.sunPale,borderColor:C.accentDark,borderWidth:2},cardText:{fontSize:18,fontWeight:'800',color:C.ink},hiddenCount:{minHeight:44,borderRadius:8,backgroundColor:C.accentDark,alignItems:'center',justifyContent:'center'}});
