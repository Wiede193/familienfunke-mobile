import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {QUESTIONS,LEVELS,TOPICS,IDEAS,makeRound}=await import('data:text/javascript;base64,'+Buffer.from(read('FamilyPlayContent.js')).toString('base64'));
assert.equal(QUESTIONS.length,36);
assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length);
assert.equal(IDEAS.length,8);
for(const question of QUESTIONS){
 assert.equal(question.answers.length,3);
 assert.equal(new Set(question.answers).size,3);
 assert.ok(question.correct>=0&&question.correct<3&&question.explanation.length>10);
}
for(const [level] of LEVELS)for(const [topic] of TOPICS){
 const round=makeRound(level,topic,()=>.5);
 assert.equal(round.length,topic==='all'?5:4);
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
console.log('Familienzeit: 36 Fragen, 8 Ideen, altersgerechte Runden, richtige Antwort nach Mischung und Offline-Spiel geprüft.');
