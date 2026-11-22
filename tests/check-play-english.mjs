import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../FamilyPlayEnglish.js',import.meta.url),'utf8');
const {ENGLISH_QUESTIONS:questions,ENGLISH_IDEAS:ideas,ENGLISH_TOPICS:topics,makeEnglishRound}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
assert.equal(questions.length,45);assert.equal(ideas.length,8);
assert.equal(new Set(questions.map(q=>q.id)).size,45);
assert.deepEqual(topics,['all','nature','world','logic']);
for(const level of ['little','school','family'])for(const topic of ['nature','world','logic']){
 const pool=questions.filter(q=>q.level===level&&q.topic===topic);
 assert.equal(pool.length,5);
 const round=makeEnglishRound(level,topic,()=>.5);assert.equal(round.length,5);
 for(const question of round){const original=questions.find(q=>q.id===question.id);
  assert.equal(question.answers[question.correct],original.answers[original.correct]);
  assert.ok(question.question&&question.explanation&&question.answers.length===3);
 }
}
assert.equal(makeEnglishRound('little','space',()=>.5).length,0);
for(const q of questions){assert.ok(q.correct>=0&&q.correct<3);assert.equal(new Set(q.answers).size,3);}
const app=readFileSync(new URL('../FamilyPlayContent.js',import.meta.url),'utf8');
assert.match(app,/export const QUESTIONS=/);assert.match(app,/export function makeRound/);
console.log('45 English questions: answers, 3 ages, 3 subjects, rounds and German fallback checked');
