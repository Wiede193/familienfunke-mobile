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

const load=async path=>import('data:text/javascript;base64,'+Buffer.from(read(path)).toString('base64'));
const classics=await load('FamilyClassicGames.js'),sol=await load('FamilySolitaire.js');
let seed=123456;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const n of [4,6,9])for(let i=0;i<20;i++){
 let puzzle=classics.newSudoku(n,rng);
 assert.equal(classics.countSudokuSolutions(puzzle.givens,n),1);
 assert.equal(classics.countSudokuSolutions(puzzle.solution,n),1);
 const fixed=puzzle.givens.findIndex(Boolean),empty=puzzle.givens.indexOf(0);
 assert.ok(empty>=0);
 assert.equal(classics.sudokuPut(puzzle,fixed,0),puzzle);
 const hint=classics.sudokuHint(puzzle,empty);
 assert.equal(hint.cells[empty],puzzle.solution[empty]);
 assert.equal(hint.hints,1);
 for(let j=0;j<puzzle.cells.length;j++)puzzle=classics.sudokuPut(puzzle,j,puzzle.solution[j]);
 assert.ok(classics.sudokuWon(puzzle));
 assert.equal(classics.sudokuConflicts(puzzle).length,0);
}
for(const moves of [[0,1,0,1,0,1,0],[0,0,1,1,2,2,3],[0,1,1,2,4,2,2,3,4,3,5,3,3],[6,5,5,4,2,4,4,3,2,3,1,3,3]]){
 let s=classics.newFour();
 for(const c of moves)s=classics.dropFour(s,c);
 assert.equal(s.winner,1);
 assert.ok(s.line.length>=4);
 assert.equal(classics.dropFour(s,6),s);
}
let column=classics.newFour();
 for(let i=0;i<6;i++)column=classics.dropFour(column,0);
 assert.equal(classics.dropFour(column,0),column);
assert.equal(classics.WORDS.length,36);
for(const [level] of LEVELS){
 const seen=[];
 for(let i=0;i<12;i++){
  let p=classics.newWord(level,rng,seen);
  assert.ok(!seen.includes(p.id));seen.push(p.id);
  assert.notEqual(p.tiles.map(t=>t.letter).join(''),p.word);
  for(const letter of p.word){
   const tile=p.tiles.find(t=>t.letter===letter&&!p.selected.includes(t.id));
   p=classics.wordPick(p,tile.id);
  }
  assert.ok(classics.wordWon(p));
 }
}
function checkDeck(s){
 const cards=[...s.stock,...s.waste,...s.tableau.flatMap(p=>p.cards),...s.foundations.flat()];
 assert.equal(cards.length,52);assert.equal(new Set(cards).size,52);
 assert.ok(s.tableau.every(p=>p.hidden>=0&&p.hidden<=Math.max(0,p.cards.length-1)));
 assert.ok(s.foundations.every((p,i)=>p.every((id,j)=>sol.suit(id)===i&&sol.rank(id)===j+1)));
}
for(let deal=0;deal<20;deal++){
 let s=sol.newSolitaire(rng);checkDeck(s);
 assert.equal(s.stock.length,24);
 assert.ok(s.tableau.every((p,i)=>p.cards.length===i+1&&p.hidden===i));
 const initial=s.stock;
 for(let i=0;i<24;i++)s=sol.drawSolitaire(s);
 assert.equal(s.stock.length,0);assert.equal(s.waste.length,24);
 s=sol.drawSolitaire(s);assert.deepEqual(s.stock,initial);
 for(let i=0;i<70;i++){
  const froms=[{type:'waste'},...s.tableau.flatMap((p,col)=>p.cards.map((_,index)=>({type:'tableau',col,index}))),...s.foundations.map((_,col)=>({type:'foundation',col}))].filter(x=>sol.sourceCards(s,x).length);
  const tos=[...s.tableau.map((_,col)=>({type:'tableau',col})),...s.foundations.map((_,col)=>({type:'foundation',col}))];
  let next=s;
  for(const x of froms){for(const y of tos){const v=sol.moveSolitaire(s,x,y);if(v!==s){next=v;break;}}if(next!==s)break;}
  s=next===s?sol.drawSolitaire(s):next;checkDeck(s);
 }
}
assert.ok(sol.solitaireWon({foundations:Array.from({length:4},(_,i)=>Array.from({length:13},(_,j)=>i*13+j))}));
for(const name of ['SudokuGame','SolitaireGame','FourGame','WordGame'])assert.ok(ui.includes('<'+name),'Missing '+name);
assert.doesNotMatch(read('FamilyClassicGameScreens.jsx'),/\b(supabase|fetch|AsyncStorage|setInterval|setTimeout)\b/);
const nav=await load('HomeNavigation.js');
for(const q of ['Sudoku','Sodoku','Solitär','4 gewinnt','Vier gewinnt','Wörterrätsel','Worträtsel'])assert.equal(nav.findHomeRoutes(q)[0]?.id,'play',q);
console.log('Klassiker: 60 eindeutige Sudokus, Vier-gewinnt-Siege, 36 Worträtsel und 20 vollständige Solitär-Austeilungen geprüft.');

const chess=await load('FamilyChess.js'),board=await load('FamilyBoardPuzzles.js');
for(const [depth,count] of [[1,20],[2,400],[3,8902],[4,197281]])assert.equal(chess.chessPerft(chess.newChess(),depth),count);
const kiwipete=chess.chessFromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
for(const [depth,count] of [[1,48],[2,2039],[3,97862]])assert.equal(chess.chessPerft(kiwipete,depth),count);
const sq=a=>(8-Number(a[1]))*8+a.charCodeAt(0)-97;
const move=(s,a,b,p)=>chess.playChess(s,sq(a),sq(b),p);
let c=chess.newChess();
for(const [a,b] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']]){const n=move(c,a,b);assert.notEqual(n,c);c=n;}
assert.equal(c.result?.winner,'b');assert.equal(c.result.reason,'Schachmatt');
c=chess.newChess();
for(const [a,b] of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d6']])c=move(c,a,b);
assert.equal(c.board[sq('d6')],'P');assert.equal(c.board[sq('d5')],null);
c=chess.chessFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
c=move(c,'e1','g1');assert.equal(c.board[sq('g1')],'K');assert.equal(c.board[sq('f1')],'R');
c=chess.chessFromFen('4kr2/8/8/8/8/8/8/4K2R w K - 0 1');
assert.equal(move(c,'e1','g1'),c,'Cannot castle through attack');
c=chess.chessFromFen('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
assert.equal(move(c,'e5','d6'),c,'Illegal pinned en passant');
for(const promotion of ['q','r','b','n']){
 c=chess.chessFromFen('7k/P7/8/8/8/8/8/7K w - - 0 1');
 c=move(c,'a7','a8',promotion);assert.equal(c.board[0],promotion.toUpperCase());
}
c=chess.newChess();
for(let i=0;i<2;i++)for(const [a,b] of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']])c=move(c,a,b);
assert.equal(c.result?.reason,'Dreifache Stellungswiederholung');
c=chess.chessFromFen('7k/5Q2/5K2/8/8/8/8/8 w - - 0 1');
c=move(c,'f7','g6');assert.equal(c.result?.reason,'Patt');
let dm=board.newDraughts();assert.equal(board.draughtsMoves(dm).length,7);
const db=Array(64).fill(0);db[42]=1;db[35]=2;db[21]=2;db[3]=2;
dm={...dm,board:db};assert.ok(board.draughtsMoves(dm).every(m=>m.capture!==undefined));
dm=board.playDraughts(dm,42,28);assert.equal(dm.forced,28);assert.equal(dm.turn,1);
dm=board.playDraughts(dm,28,14);assert.equal(dm.turn,2);assert.equal(dm.board[35],0);assert.equal(dm.board[21],0);
for(const p of board.CROSSWORDS){
 let s=board.buildCrossword(p);assert.equal(s.clues.length,4);
 for(const clue of s.clues)assert.equal(clue.cells.map(i=>s.solution[i]).join(''),clue.word);
 for(let i=0;i<s.solution.length;i++)if(s.solution[i])s=board.crosswordPut(s,i,s.solution[i]);
 assert.ok(board.crosswordWon(s));
}
assert.equal(board.CROSSWORDS.length,9);
for(const x of board.PICTURE_SCENES)for(const n of [2,3,4]){
 let s=board.newPicture(n,x.id,()=>.5);assert.ok(!board.pictureWon(s));
 for(let i=0;i<s.order.length;i++)if(s.order[i]!==i)s=board.swapPicture(s,i,s.order.indexOf(i));
 assert.ok(board.pictureWon(s));
}
assert.equal(board.PICTURE_SCENES.length,4);
for(const name of ['ChessGame','DraughtsGame','CrosswordGame','PictureGame'])assert.ok(ui.includes('<'+name));
for(const q of ['Schach','Dame','Dame spielen','Kreuzworträtsel','Bilderpuzzle','Puzzle'])assert.equal(nav.findHomeRoutes(q)[0]?.id,'play',q);
assert.doesNotMatch(read('FamilyBoardPuzzleScreens.jsx'),/\b(supabase|fetch|AsyncStorage|setInterval|setTimeout)\b/);
console.log('Brettspiele: Schach-Referenzstellungen, Sonderzüge, Dame-Schlagketten, 9 Kreuzworträtsel und 12 Bildpuzzlevarianten geprüft.');
