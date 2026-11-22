import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=p=>import('data:text/javascript;base64,'+Buffer.from(read(p)).toString('base64'));
const g=await load('FamilyGameA11y.js'),sol=await load('FamilySolitaire.js');
for(const [state,en,de] of [
 [{winner:1,draw:false},'Player 1 wins!','Spieler 1 gewinnt!'],
 [{winner:0,draw:true},'Draw','Unentschieden'],
 [{winner:0,draw:false,turn:2},'Player 2 to move','Spieler 2 ist dran']
]){assert.equal(g.fourStatus(state,'en'),en);assert.equal(g.fourStatus(state,'de'),de);}
assert.equal(g.fourCellLabel(2,6,'en'),'Row 1, column 7, player 2');
assert.equal(g.gridCellLabel(1,2,0,'en',{fixed:true,conflict:true}),'Row 1, column 2, empty, given, conflict');
assert.equal(g.gridCellLabel(1,2,'A','en',{start:3,incorrect:true}),'Row 1, column 2, A, clue start 3, incorrect');
for(const i of Array.from({length:52},(_,i)=>i)){
 assert.equal(g.solitaireCardName(i,'de'),sol.cardLabel(i));
 assert.ok(g.solitaireCardName(i,'en'));
}
assert.equal(g.solitaireCardName(0,'en'),'Spades Ace');
assert.equal(g.solitaireCardName(51,'en'),'Diamonds King');
assert.equal(g.solitaireFoundationLabel(0,0,'en'),'Spades foundation, Spades Ace');
assert.equal(g.solitaireProgress(15,23,false,'en'),'15 of 52 cards placed · 23 moves');
assert.match(g.solitaireProgress(52,170,true,'en'),/all cards/);
assert.equal(g.sudokuStatus(false,true,1,'en'),'Duplicate numbers appear in a row, column or block.');
assert.equal(g.sudokuStatus(false,false,null,'en'),'Choose a cell.');
assert.equal(g.sudokuStatus(true,false,1,'en'),'Solved!');
assert.equal(g.chessPieceName('N','en'),'White, knight');
assert.equal(g.chessPieceName('q','en'),'Black, queen');
for(const reason of ['Schachmatt','Patt','Unzureichendes Mattmaterial','Dreifache Stellungswiederholung','50-Züge-Regel'])assert.notEqual(g.chessReason(reason,'en'),reason);
assert.equal(g.chessStatus({result:{winner:null,reason:'Patt'}},false,'en'),'Draw – stalemate');
assert.equal(g.chessStatus({result:{winner:'b',reason:'Schachmatt'}},true,'en'),'Black wins – checkmate');
assert.equal(g.chessStatus({turn:'w'},true,'en'),'White to move · check');
assert.equal(g.draughtsStatus({turn:1,forced:3},false,'en'),'Player 1 to move · continue capturing');
assert.equal(g.draughtsStatus({turn:2,forced:null},true,'en'),'Player 2 to move · capture required');
assert.equal(g.draughtsPieceName(-2,'en'),'Player 2, king');
assert.equal(g.crosswordStatus(false,null,'en'),'Choose a clue or cell.');
assert.equal(g.pictureStatus(true,9,'en'),'Picture complete!');
assert.equal(g.pictureTileLabel(3,1,'en'),'Position 3, picture piece 1');
console.log('Game screenreader labels: 52 cards, status changes and DE/EN board states verified');

const classic=read('FamilyClassicGameScreens.jsx'),board=read('FamilyBoardPuzzleScreens.jsx');
for(const term of ['fourStatus(game,language)','fourCellLabel(v,i,language)','gridCellLabel(r+1,c+1,v,language,{fixed,conflict})','sudokuStatus(done,conflicts.length>0,selected,language)','solitaireProgress(','solitaireFoundationLabel(','solitaireCardName('])
 assert.ok(classic.includes(term),'Missing accessible classic game binding: '+term);
for(const term of ['chessStatus(game,chessCheck(game),language)','chessPieceName(p,language)','draughtsStatus(game,','draughtsPieceName(p,language)','gridCellLabel(Math.floor(i/game.width)+1','crosswordStatus(done,selected,language)','pictureStatus(done,game.moves,language)','pictureTileLabel(i+1,id+1,language)'])
 assert.ok(board.includes(term),'Missing accessible board binding: '+term);
assert.match(board,/accessibilityLabel=\{coord\(i\)/);
assert.match(classic,/accessibilityLiveRegion="polite"/);
assert.match(board,/accessibilityLiveRegion="polite"/);
