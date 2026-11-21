import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {QUESTIONS,LEVELS,TOPICS,IDEAS,makeRound}=await import('data:text/javascript;base64,'+Buffer.from(read('FamilyPlayContent.js')).toString('base64'));
assert.equal(QUESTIONS.length,144);
assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length);
assert.equal(IDEAS.length,24);
for(const question of QUESTIONS){
 assert.equal(question.answers.length,3);
 assert.equal(new Set(question.answers).size,3);
 assert.ok(question.correct>=0&&question.correct<3&&question.explanation.length>10);
}
for(const [level] of LEVELS)for(const [topic] of TOPICS){
 const round=makeRound(level,topic,()=>.5);
 assert.equal(round.length,5);
 assert.equal(new Set(round.map(q=>q.id)).size,round.length);
 for(const q of round){
  const original=QUESTIONS.find(x=>x.id===q.id);
  assert.equal(q.level,level);
  assert.ok(topic==='all'||q.topic===topic);
  assert.equal(q.answers[q.correct],original.answers[original.correct]);
 }
}
const ui=read('FamilyPlayScreen.jsx');
assert.doesNotMatch(ui,/\b(supabase|fetch|AsyncStorage|setInterval|setTimeout)\b/,'Offline play without persistent data or timer');
assert.match(ui,/if\(locked\.current\|\|stage/);
assert.match(ui,/announceForAccessibility/);
assert.match(ui,/Runde beenden/);
assert.match(read('App.jsx'),/tab==='play'\?<FamilyPlayScreen key=\{me\}/);
assert.match(read('HomeAssistant.jsx'),/onNavigate\('play'\)/);
assert.match(read('TopRightMenu.jsx'),/\['play'/);
console.log('Familienzeit: 144 Fragen, 24 Ideen, altersgerechte Runden, richtige Antwort nach Mischung und Offline-Spiel geprüft.');

for(const [level] of LEVELS)for(const [topic] of TOPICS){
 const first=makeRound(level,topic,()=>.5);
 const second=makeRound(level,topic,()=>.5,first.map(q=>q.id));
 const pool=QUESTIONS.filter(q=>q.level===level&&(topic==='all'||q.topic===topic));
 assert.equal(second.filter(q=>!first.some(x=>x.id===q.id)).length,Math.min(5,pool.length-5));
}
const games=await import('data:text/javascript;base64,'+Buffer.from(read('FamilyMiniGames.js')).toString('base64'));
for(const n of [4,6,8]){
 let state=games.newPairs(n,()=>.5);
 assert.equal(state.cards.length,n*2);
 const values=[...new Set(state.cards)];
 assert.equal(values.length,n);
 for(const value of values){
  const [a,b]=state.cards.flatMap((x,i)=>x===value?[i]:[]);
  state=games.flipPair(state,a);
  assert.equal(games.flipPair(state,a),state);
  state=games.flipPair(state,b);
 }
 assert.equal(state.matched.length,n*2);
 assert.equal(state.moves,n);
}
let mismatch=games.newPairs(4,()=>.5);
const wrong=mismatch.cards.findIndex(x=>x!==mismatch.cards[0]);
mismatch=games.flipPair(games.flipPair(mismatch,0),wrong);
assert.equal(mismatch.open.length,2);
assert.equal(games.flipPair(mismatch,7),mismatch);
assert.deepEqual(games.closePair(mismatch).open,[]);
let three=games.newThree();
for(const i of [0,3,1,4,2])three=games.playThree(three,i);
assert.equal(three.winner,'X');
assert.equal(games.playThree(three,8),three);
three=games.newThree();
for(const i of [0,1,2,4,3,5,7,6,8])three=games.playThree(three,i);
assert.equal(three.draw,true);
for(const [level] of LEVELS)for(const v of [0,.1,.5,.9,.999]){
 const p=games.newPattern(level,()=>v);
 assert.equal(p.choices.length,3);
 assert.equal(new Set(p.choices).size,3);
 assert.ok(p.choices.includes(p.answer));
}
assert.match(ui,/<PairsGame level=\{level\}/);
assert.match(ui,/<ThreeGame\/>/);
assert.match(ui,/<PatternGame level=\{level\}/);
assert.doesNotMatch(read('FamilyMiniGameScreens.jsx'),/\b(supabase|fetch|AsyncStorage|setInterval|setTimeout)\b/);
console.log('Mini-Spiele: Kartenpaare, Fehlversuche, Sieg, Unentschieden und Zahlenfolgen geprüft.');
