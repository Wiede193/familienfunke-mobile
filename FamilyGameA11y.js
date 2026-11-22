// Pure, presentation-only game speech strings. Never change game state or save data.
const english=language=>language==='en';
const position=(row,col,language)=>english(language)?'Row '+row+', column '+col:'Zeile '+row+', Spalte '+col;
export function fourStatus(game,language='de'){
 const en=english(language);
 if(game.winner)return(en?'Player ':'Spieler ')+game.winner+(en?' wins!':' gewinnt!');
 if(game.draw)return en?'Draw':'Unentschieden';
 return(en?'Player ':'Spieler ')+game.turn+(en?' to move':' ist dran');
}
export function fourCellLabel(value,index,language='de'){
 return position(Math.floor(index/7)+1,index%7+1,language)+', '+(value?(english(language)?'player ':'Spieler ')+value:(english(language)?'empty':'frei'));
}
export function gridCellLabel(row,col,value,language='de',options={}){
 const en=english(language);
 let out=position(row,col,language)+', '+(value|| (en?'empty':'leer'));
 if(options.start)out+=en?', clue start '+options.start:', Start '+options.start;
 if(options.fixed)out+=en?', given':', vorgegeben';
 if(options.conflict)out+=en?', conflict':', Konflikt';
 if(options.incorrect)out+=en?', incorrect':', nicht richtig';
 return out;
}
export function sudokuStatus(done,conflicts,selected,language='de'){
 const en=english(language);
 if(done)return en?'Solved!':'Gelöst!';
 if(conflicts)return en?'Duplicate numbers appear in a row, column or block.':'Es gibt doppelte Zahlen in einer Zeile, Spalte oder einem Block.';
 if(selected===null)return en?'Choose a cell.':'Wähle ein Feld.';
 return en?'Cell selected.':'Feld ausgewählt.';
}
export function solitaireCardName(id,language='de'){
 const en=english(language);
 if(id===null||id===undefined)return en?'Empty card slot':'Leerer Kartenplatz';
 if(!Number.isInteger(id)||id<0||id>51)return en?'Unknown card':'Unbekannte Karte';
 const suits=en?['Spades','Clubs','Hearts','Diamonds']:['Pik','Kreuz','Herz','Karo'];
 const ranks=en?['Ace','2','3','4','5','6','7','8','9','10','Jack','Queen','King']:['Ass','2','3','4','5','6','7','8','9','10','Bube','Dame','König'];
 return suits[Math.floor(id/13)]+' '+ranks[id%13];
}
export function solitaireProgress(placed,moves,won,language='de'){
 const en=english(language);
 if(won)return en?'Completed – all cards moved to foundations!':'Geschafft – alle Karten abgelegt!';
 return en?placed+' of 52 cards placed · '+moves+' moves':placed+' von 52 Karten abgelegt · '+moves+' Züge';
}
export function solitaireFoundationLabel(suitIndex,topId,language='de'){
 const suit=english(language)?['Spades','Clubs','Hearts','Diamonds'][suitIndex]:['Pik','Kreuz','Herz','Karo'][suitIndex];
 return suit+(english(language)?' foundation, ':' Zielstapel, ')+(topId===null||topId===undefined?(english(language)?'empty':'leer'):solitaireCardName(topId,language));
}
export function chessReason(reason,language='de'){
 if(!english(language))return reason;
 return ({'Schachmatt':'checkmate','Patt':'stalemate','Unzureichendes Mattmaterial':'insufficient mating material','Dreifache Stellungswiederholung':'threefold repetition','50-Züge-Regel':'50-move rule'})[reason]||reason;
}
export function chessPieceName(piece,language='de'){
 const en=english(language);
 const names=en?{k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'}:{k:'König',q:'Dame',r:'Turm',b:'Läufer',n:'Springer',p:'Bauer'};
 if(!piece)return en?'empty':'frei';
 return (piece===piece.toUpperCase()?(en?'White, ':'Weiß, '):(en?'Black, ':'Schwarz, '))+names[piece.toLowerCase()];
}
export function chessStatus(game,inCheck,language='de'){
 const en=english(language);
 const side=w=>(w==='w'?(en?'White':'Weiß'):(en?'Black':'Schwarz'));
 if(game.result){
  const reason=chessReason(game.result.reason,language);
  return game.result.winner?side(game.result.winner)+(en?' wins – ':' gewinnt – ')+reason:(en?'Draw – ':'Remis – ')+reason;
 }
 return side(game.turn)+(en?' to move':' ist dran')+(inCheck?(en?' · check':' · Schach'):'');
}
export function draughtsStatus(game,hasCapture,language='de'){
 const en=english(language),player=(en?'Player ':'Spieler ');
 if(game.winner)return player+game.winner+(en?' wins!':' gewinnt!');
 if(game.draw)return en?'Draw':'Unentschieden';
 return player+game.turn+(en?' to move':' ist dran')+(game.forced!==null?(en?' · continue capturing':' · Weiter schlagen'):hasCapture?(en?' · capture required':' · Schlagzwang'):'');
}
export function draughtsPieceName(value,language='de'){
 const en=english(language);
 return value?(en?'Player ':'Spieler ')+Math.abs(value)+(value<0?(en?', king':', Dame'):(en?', piece':', Stein')):(en?'empty':'frei');
}
export function crosswordStatus(done,selected,language='de'){
 const en=english(language);
 return done?(en?'Solved!':'Gelöst!'):selected===null?(en?'Choose a clue or cell.':'Wähle eine Frage oder ein Feld.'):(en?'Enter letters':'Buchstaben eingeben');
}
export function pictureStatus(done,moves,language='de'){
 const en=english(language);
 return done?(en?'Picture complete!':'Bild fertig!'):moves+(en?' swaps':' Tauschzüge');
}
export function pictureTileLabel(slot,part,language='de'){
 const en=english(language);
 return (en?'Position ':'Bildteil ')+slot+(en?', picture piece ':', Motivteil ')+part;
}
