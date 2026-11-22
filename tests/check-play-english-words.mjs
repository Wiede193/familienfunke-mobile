import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const load=path=>import('data:text/javascript;base64,'+Buffer.from(read(path)).toString('base64'));
const english=await load('FamilyPlayEnglishPuzzles.js');
const classic=await load('FamilyClassicGames.js');
const board=await load('FamilyBoardPuzzles.js');
const {translate}=await load('FamilyLocaleModel.js');
assert.equal(english.ENGLISH_WORDS.length,36);
assert.equal(english.ENGLISH_CROSSWORDS.length,9);
assert.equal(new Set(english.ENGLISH_WORDS.map(p=>p.id)).size,36);
assert.equal(new Set(english.ENGLISH_CROSSWORDS.map(p=>p.id)).size,9);
const levels=['little','school','family'];
let solvedWords=0,solvedCrosswords=0;
for(const level of levels){
 const choices=english.ENGLISH_WORDS.filter(p=>p.level===level);
 assert.equal(choices.length,12);
 assert.equal(new Set(choices.map(x=>x.word)).size,12);
 let seen=[];
 for(let i=0;i<12;i++){
  let s=classic.newWord(level,()=>.42,seen,english.ENGLISH_WORDS);
  assert.ok(!seen.includes(s.id));
  assert.match(s.word,/^[A-Z]+$/);
  assert.ok(s.hint.length>12&&s.word.length>=3);
  assert.notEqual(s.tiles.map(x=>x.letter).join(''),s.word,'Answer should be scrambled');
  seen.push(s.id);
  for(const character of s.word){
   const tile=s.tiles.find(x=>x.letter===character&&!s.selected.includes(x.id));
   assert.ok(tile);
   s=classic.wordPick(s,tile.id);
  }
  assert.ok(classic.wordWon(s));
  solvedWords++;
 }
 const puzzles=english.ENGLISH_CROSSWORDS.filter(p=>p.level===level);
 assert.equal(puzzles.length,3);
 for(const puzzle of puzzles){
  assert.ok(puzzle.title&&puzzle.words.length===4);
  for(const word of puzzle.words){
   assert.match(word.word,/^[A-Z]+$/);
   assert.ok(word.clue.length>10);
  }
  let grid=board.buildCrossword(puzzle);
  assert.equal(grid.clues.length,4);
  assert.ok(grid.width>0&&grid.height>0);
  for(let i=0;i<grid.solution.length;i++){
   if(grid.solution[i]!==null)grid=board.crosswordPut(grid,i,grid.solution[i]);
  }
  assert.ok(board.crosswordWon(grid));
  solvedCrosswords++;
 }
}
assert.equal(classic.WORDS.length,36);
assert.equal(board.CROSSWORDS.length,9);
assert.equal(classic.newWord('little',()=>.5).level,'little');
for(const puzzle of board.CROSSWORDS)assert.equal(board.buildCrossword(puzzle).clues.length,4);
assert.equal(translate('en','Wörterrätsel'),'Word puzzle');
assert.equal(translate('en','Kreuzworträtsel'),'Crossword');
const classicScreen=read('FamilyClassicGameScreens.jsx');
const boardScreen=read('FamilyBoardPuzzleScreens.jsx');
const selector=read('FamilyPlayScreen.jsx');
assert.match(classicScreen,/newWord\(level,Math\.random,\[\],language==='en'\?ENGLISH_WORDS:undefined\)/);
assert.match(boardScreen,/language==='en'\?ENGLISH_CROSSWORDS:CROSSWORDS/);
assert.match(boardScreen,/language==='en'\?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'/);
assert.match(selector,/WordGame key=\{language\+'-'\+level\}/);
assert.match(selector,/CrosswordGame key=\{language\+'-'\+level\}/);
console.log('Validated '+solvedWords+' original English word scrambles, '+solvedCrosswords+' English crossword grids, 9 German grids and language separation');
