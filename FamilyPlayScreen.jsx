import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {useFamilyLocale} from './FamilyLocale';
import {ENGLISH_QUESTIONS,ENGLISH_IDEAS,ENGLISH_TOPICS,makeEnglishRound} from './FamilyPlayEnglish';
import {LEVELS,TOPICS,IDEAS,QUESTIONS,makeRound,shuffled} from './FamilyPlayContent';
import {PairsGame,ThreeGame,PatternGame} from './FamilyMiniGameScreens';
import {SudokuGame,SolitaireGame,FourGame,WordGame} from './FamilyClassicGameScreens';
import {ChessGame,DraughtsGame,CrosswordGame,PictureGame} from './FamilyBoardPuzzleScreens';

function Action({children,onPress,secondary=false,disabled=false}){
 return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{disabled}} onPress={onPress} style={[s.action,secondary&&s.secondary,disabled&&{opacity:.5}]}><Text style={[s.actionText,secondary&&{color:C.accentDark}]}>{children}</Text></Pressable>;
}
function Choices({label,items,value,onChange}){
 const {t}=useFamilyLocale();
 return <View style={s.group}><Text accessibilityRole="header" style={s.heading}>{t(label)}</Text><View style={s.chips}>
  {items.map(([id,title])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:id===value}} onPress={()=>onChange(id)} style={[s.chip,id===value&&s.active]}><Text style={[s.text,id===value&&{color:C.white,fontWeight:'800'}]}>{t(title)}</Text></Pressable>)}
 </View></View>;
}
export default function FamilyPlayScreen(){
 const {t,language}=useFamilyLocale();
 const [level,setLevel]=useState('school'),[topic,setTopic]=useState('all'),[round,setRound]=useState([]),[index,setIndex]=useState(0),[answer,setAnswer]=useState(null),[score,setScore]=useState(0),[stage,setStage]=useState('start'),[ideas,setIdeas]=useState(()=>IDEAS.slice(0,3));
 const scroll=useRef(null),locked=useRef(false),seen=useRef(new Set());
 const sourceQuestions=language==='en'?ENGLISH_QUESTIONS:QUESTIONS;
 const sourceIdeas=language==='en'?ENGLISH_IDEAS:IDEAS;
 const availableTopics=language==='en'?TOPICS.filter(([id])=>ENGLISH_TOPICS.includes(id)):TOPICS;
 const shownIdeas=language==='en'?ENGLISH_IDEAS.filter(x=>ideas.some(y=>y.id===x.id)).slice(0,3):ideas;
 useEffect(()=>{locked.current=false;seen.current.clear();setStage('start');setTopic('all');setRound([]);setAnswer(null);setScore(0);setIdeas(sourceIdeas.slice(0,3));},[language]);
 const top=()=>scroll.current?.scrollTo({y:0,animated:false});
 const start=()=>{
 const pool=sourceQuestions.filter(q=>q.level===level&&(topic==='all'||q.topic===topic));
 if(pool.every(q=>seen.current.has(q.id)))pool.forEach(q=>seen.current.delete(q.id));
 const nextRound=language==='en'?makeEnglishRound(level,ENGLISH_TOPICS.includes(topic)?topic:'all',Math.random,[...seen.current]):makeRound(level,topic,Math.random,[...seen.current]);
 nextRound.forEach(q=>seen.current.add(q.id));
 setRound(nextRound);setIndex(0);setAnswer(null);setScore(0);locked.current=false;setStage('round');top();};
 const question=round[index];
 function select(i){
  if(locked.current||stage!=='round'||!question)return;
  locked.current=true;setAnswer(i);
  if(i===question.correct)setScore(n=>n+1);
  AccessibilityInfo.announceForAccessibility((i===question.correct?(language==='en'?'Correct. ':'Richtig. '):(language==='en'?'The correct answer is ':'Die richtige Antwort ist ')+question.answers[question.correct]+'. ')+question.explanation);
 }
 function next(){
  if(answer===null||!locked.current)return;
  locked.current=false;
  if(index+1===round.length){setStage('done');top();return;}
  setIndex(n=>n+1);setAnswer(null);locked.current=false;top();
 }
 return <ScrollView ref={scroll} contentContainerStyle={s.page}>
  <View style={s.hero}><Text style={s.eyebrow}>{t("GEMEINSAM SPIELEN")}</Text><Text accessibilityRole="header" style={s.title}>{t("Familienzeit")}</Text><Text style={s.text}>{t("Kleine Wissensabenteuer und Ideen für Zeit miteinander. Ohne Zeitdruck oder öffentliche Bestenliste.")}</Text></View>
  {stage==='start'?<>
   <View style={s.card}>
    <Text accessibilityRole="header" style={s.titleSmall}>{t("Familienquiz")}</Text>
    <Text style={s.text}>{t(language==='en'?'Fünf Fragen pro Runde aus 45 englischen Fragen zu Natur, Alltag und Logik. Noch nicht gespielte Fragen werden bevorzugt.':'Fünf kurze Fragen pro Runde aus 144 Fragen in sechs Themen. Noch nicht gespielte Fragen werden bevorzugt. Ihr könnt euch gemeinsam beraten. Für jüngere Kinder liest ein Erwachsener vor.')}</Text>
    <Choices label={t("Altersstufe")} items={LEVELS} value={level} onChange={setLevel}/>
    <Choices label={t("Thema")} items={availableTopics} value={topic} onChange={setTopic}/>
    <Action onPress={start}>{t("Quiz starten")}</Action>
   </View>
   <Text accessibilityRole="header" style={s.titleSmall}>{t("Mini-Spiele")}</Text>
   {[['pairs','Paare finden','Merkt euch die Symbole und findet alle Paare.'],['three','Drei gewinnt','Spielt zu zweit abwechselnd X und O.'],['pattern','Zahlen-Detektive','Entdeckt Regeln in Zahlenfolgen.'],['sudoku','Sudoku','Zahlenrätsel mit 4×4, 6×6 oder 9×9 Feldern.'],['solitaire','Solitär','Klassisches Klondike mit 52 Karten.'],['four','Vier gewinnt','Zu zweit vier Steine in eine Reihe bringen.'],['word','Wörterrätsel','Buchstaben mit einem Hinweis zum gesuchten Wort sortieren.'],['chess','Schach','Zwei Personen, klassische Zugregeln und Sonderzüge.'],['draughts','Dame','Zu zweit auf dem 8×8-Brett mit Schlagzwang.'],['crossword','Kreuzworträtsel','Neun kleine Rätsel passend zur Altersstufe.'],['picture','Bilderpuzzle','Vier Bildmotive mit 4, 9 oder 16 Teilen.']].map(([id,title,description])=><View key={id} style={s.card}><Text accessibilityRole="header" style={s.heading}>{t(title)}</Text><Text style={s.text}>{t(description)}</Text><Action secondary onPress={()=>{setStage(id);top();}}>{language==='en'?'Play '+t(title):title+' spielen'}</Action></View>)}
   <Text accessibilityRole="header" style={s.titleSmall}>{t("Gemeinsam etwas machen")}</Text>
   <Text style={s.muted}>{t("Ideen ab etwa vier Jahren, mit erwachsener Begleitung.")}</Text>
   {shownIdeas.map(idea=><View style={s.card} key={idea.id}><Text style={s.eyebrow}>{idea.duration}</Text><Text style={s.heading}>{idea.title}</Text><Text style={s.text}>{idea.text}</Text></View>)}
   <Action secondary onPress={()=>setIdeas(old=>shuffled(sourceIdeas.filter(x=>!old.some(y=>y.id===x.id))).slice(0,3))}>{t("Andere Ideen zeigen")}</Action>
  </>:['pairs','three','pattern','sudoku','solitaire','four','word','chess','draughts','crossword','picture'].includes(stage)?<>
    {stage==='pairs'?<PairsGame level={level}/>:stage==='three'?<ThreeGame/>:stage==='pattern'?<PatternGame level={level}/>:stage==='sudoku'?<SudokuGame level={level}/>:stage==='solitaire'?<SolitaireGame/>:stage==='four'?<FourGame/>:stage==='word'?<WordGame level={level}/>:stage==='chess'?<ChessGame/>:stage==='draughts'?<DraughtsGame/>:stage==='crossword'?<CrosswordGame level={level}/>:<PictureGame level={level}/>}
    <Action secondary onPress={()=>{setStage('start');top();}}>{t("Spiel beenden")}</Action>
  </>:stage==='round'&&question?<View style={s.card}>
   <Text style={s.eyebrow}>{t('FRAGE')} {index+1} {t('VON')} {round.length}</Text>
   <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.track}><View style={[s.fill,{width:((index+1)/round.length*100)+'%'}]}/></View>
   <Text accessibilityRole="header" style={s.titleSmall}>{question.question}</Text>
   {question.answers.map((text,i)=>{
    const revealed=answer!==null,correct=revealed&&i===question.correct,wrong=revealed&&answer===i&&!correct;
    return <Pressable key={i} accessibilityRole="button" accessibilityLabel={text+(correct?', '+t('richtig'):wrong?', '+t('nicht richtig'):'')} accessibilityState={{disabled:revealed,selected:answer===i}} disabled={revealed} onPress={()=>select(i)} style={[s.answer,correct&&s.correct,wrong&&s.wrong]}>
     <Text style={s.answerText}>{correct?'✓ ':wrong?'× ':''}{text}</Text>
    </Pressable>;
   })}
   {answer!==null?<View accessibilityLiveRegion="polite" style={s.explanation}><Text style={s.heading}>{t(answer===question.correct?'Richtig!':'Gut überlegt!')}</Text><Text style={s.text}>{question.explanation}</Text></View>:null}
   <Action disabled={answer===null} onPress={next}>{t(index+1===round.length?'Ergebnis ansehen':'Nächste Frage')}</Action>
   <Action secondary onPress={()=>{setStage('start');locked.current=false;top();}}>{t("Runde beenden")}</Action>
  </View>:<View style={s.card}>
   <Text accessibilityRole="header" style={s.titleSmall}>{t("Runde geschafft!")}</Text>
   <Text style={s.score}>{score} {t('von')} {round.length}</Text><Text style={s.text}>{t("So viele Fragen habt ihr richtig beantwortet. Das Schönste: Ihr habt zusammen etwas gelernt.")}</Text>
   <Action onPress={start}>{t("Noch eine Runde")}</Action>
   <Action secondary onPress={()=>{setStage('start');top();}}>{t("Thema oder Alter wechseln")}</Action>
  </View>}
  <Text style={s.muted}>{t("Alle Inhalte sind fest in der App hinterlegt. Antworten und Altersauswahl werden nicht gespeichert oder weitergegeben.")}</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:16,paddingBottom:36,gap:12,backgroundColor:C.bg},hero:{backgroundColor:C.sun,borderRadius:24,padding:20,gap:8},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:.7,color:C.accentDark},title:{fontSize:29,fontWeight:'900',color:C.ink},titleSmall:{fontSize:22,fontWeight:'900',color:C.ink},heading:{fontSize:17,fontWeight:'800',color:C.ink},text:{fontSize:16,lineHeight:24,color:C.ink},muted:{fontSize:13,lineHeight:19,color:C.muted},card:{padding:16,borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,gap:12},group:{gap:8},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:44,padding:10,paddingHorizontal:13,borderRadius:18,backgroundColor:C.mint,justifyContent:'center'},active:{backgroundColor:C.accentDark},action:{minHeight:48,alignItems:'center',justifyContent:'center',padding:12,borderRadius:14,backgroundColor:C.accentDark},actionText:{color:C.white,fontSize:16,fontWeight:'800',textAlign:'center'},secondary:{backgroundColor:C.mint},answer:{minHeight:54,justifyContent:'center',padding:14,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.bg},answerText:{fontSize:17,fontWeight:'700',color:C.ink},correct:{backgroundColor:C.mint,borderColor:C.accentDark,borderWidth:2},wrong:{backgroundColor:C.peach,borderColor:C.danger,borderWidth:2},explanation:{padding:14,borderRadius:14,backgroundColor:C.sunPale,gap:6},track:{height:7,backgroundColor:C.line,borderRadius:5,overflow:'hidden'},fill:{height:7,backgroundColor:C.accentDark,borderRadius:5},score:{fontSize:34,fontWeight:'900',color:C.accentDark}});
