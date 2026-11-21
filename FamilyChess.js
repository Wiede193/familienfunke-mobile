// Local chess engine. 0=a8, 63=h1. Uppercase white, lowercase black.
// No clocks; repetition and fifty-move draws are automatic in this casual variant.
const side=p=>p===null?null:p===p.toUpperCase()?'w':'b';
const other=c=>c==='w'?'b':'w';
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const at=(r,c)=>r*8+c;
const diag=[[-1,-1],[-1,1],[1,-1],[1,1]],orth=[[-1,0],[1,0],[0,-1],[0,1]],all=[...diag,...orth];
const knights=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
export function chessAttacked(board,i,by){
 if(i<0)return false;
 const r=i>>3,c=i%8;
 for(const [dr,dc] of knights){const y=r+dr,x=c+dc;if(inside(y,x)&&board[at(y,x)]===(by==='w'?'N':'n'))return true;}
 const pr=r+(by==='w'?1:-1);
 for(const dc of [-1,1])if(inside(pr,c+dc)&&board[at(pr,c+dc)]===(by==='w'?'P':'p'))return true;
 for(const [dr,dc] of all)for(let step=1;step<=7;step++){
  const y=r+dr*step,x=c+dc*step;if(!inside(y,x))break;
  const p=board[at(y,x)];if(!p)continue;
  if(side(p)===by){const k=p.toLowerCase();if(k==='q'||(dr&&dc?k==='b':k==='r')||(step===1&&k==='k'))return true;}
  break;
 }
 return false;
}
export const chessCheck=(s,who=s.turn)=>chessAttacked(s.board,s.board.indexOf(who==='w'?'K':'k'),other(who));
function pseudo(s){
 const out=[],b=s.board,who=s.turn,enemy=other(who);
 for(let from=0;from<64;from++){
  const p=b[from];if(!p||side(p)!==who)continue;
  const k=p.toLowerCase(),r=from>>3,c=from%8;
  function add(to,extra={}){
   if(b[to]&&(side(b[to])===who||b[to].toLowerCase()==='k'))return;
   if(k==='p'&&(to>>3)===(who==='w'?0:7))for(const promotion of ['q','r','b','n'])out.push({from,to,promotion,...extra});
   else out.push({from,to,...extra});
  }
  if(k==='p'){
   const dr=who==='w'?-1:1,one=at(r+dr,c);
   if(inside(r+dr,c)&&!b[one]){
    add(one);
    const two=at(r+2*dr,c);if(r===(who==='w'?6:1)&&!b[two])add(two,{double:true});
   }
   for(const dc of [-1,1])if(inside(r+dr,c+dc)){
    const to=at(r+dr,c+dc);
    if(b[to]&&side(b[to])===enemy)add(to);
    else if(to===s.ep&&!b[to]&&b[at(r,c+dc)]===(who==='w'?'p':'P'))add(to,{enPassant:true});
   }
  }else if(k==='n'||k==='k'){
   for(const [dr,dc] of k==='n'?knights:all)if(inside(r+dr,c+dc))add(at(r+dr,c+dc));
   if(k==='k'&&from===(who==='w'?60:4)&&!chessCheck(s)){
    for(const [letter,rook,empty,through,to] of who==='w'?[['K',63,[61,62],61,62],['Q',56,[57,58,59],59,58]]:[['k',7,[5,6],5,6],['q',0,[1,2,3],3,2]]){
     if(!s.castle.includes(letter)||b[rook]!== (who==='w'?'R':'r')||empty.some(i=>b[i]))continue;
     const trial=[...b];trial[from]=null;trial[through]=p;
     if(!chessAttacked(trial,through,enemy))add(to,{castle:rook});
    }
   }
  }else{
   for(const [dr,dc] of k==='b'?diag:k==='r'?orth:all)for(let step=1;step<=7;step++){
    const y=r+dr*step,x=c+dc*step;if(!inside(y,x))break;
    const to=at(y,x);add(to);if(b[to])break;
   }
  }
 }
 return out;
}
function apply(s,m){
 const b=[...s.board],p=b[m.from],capture=b[m.to],who=s.turn,k=p.toLowerCase();
 b[m.from]=null;b[m.to]=m.promotion?(who==='w'?m.promotion.toUpperCase():m.promotion):p;
 if(m.enPassant)b[m.to+(who==='w'?8:-8)]=null;
 if(m.castle!==undefined){const dest=m.to>m.from?m.to-1:m.to+1;b[dest]=b[m.castle];b[m.castle]=null;}
 let castle=s.castle;
 if(k==='k')castle=castle.replace(who==='w'?/[KQ]/g:/[kq]/g,'');
 for(const [i,letter] of [[0,'q'],[7,'k'],[56,'Q'],[63,'K']])if(m.from===i||m.to===i)castle=castle.replace(letter,'');
 return {...s,board:b,turn:other(who),castle,ep:m.double?(m.from+m.to)/2:null,half:k==='p'||capture||m.enPassant?0:s.half+1,last:m,moves:s.moves+1};
}
export function chessMoves(s){
 if(s.result)return [];
 return pseudo(s).filter(m=>!chessCheck(apply(s,m),s.turn));
}
function key(s){
 const ep=s.ep!==null&&chessMoves(s).some(m=>m.enPassant)?s.ep:'-';
 return s.board.map(p=>p||'.').join('')+' '+s.turn+' '+s.castle+' '+ep;
}
function dead(s){
 const pieces=s.board.flatMap((p,i)=>p&&p.toLowerCase()!=='k'?[{p:p.toLowerCase(),i}]:[]);
 if(!pieces.length)return true;
 if(pieces.length===1&&['b','n'].includes(pieces[0].p))return true;
 return pieces.every(x=>x.p==='b')&&new Set(pieces.map(x=>((x.i>>3)+x.i%8)%2)).size===1;
}
export function chessFromFen(fen){
 const [placement,turn='w',rights='-',ep='-',half='0']=fen.split(' ');
 const board=placement.split('/').flatMap(row=>[...row].flatMap(x=>/[1-8]/.test(x)?Array(Number(x)).fill(null):[x]));
 if(board.length!==64||!board.includes('K')||!board.includes('k'))throw Error('Invalid position');
 const s={board,turn,castle:rights==='-'?'':rights,ep:ep==='-'?null:(8-Number(ep[1]))*8+ep.charCodeAt(0)-97,half:Number(half),moves:0,last:null,result:null,repetitions:{}};
 s.repetitions[key(s)]=1;return s;
}
export function newChess(){return chessFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');}
export function playChess(s,from,to,promotion='q'){
 const m=chessMoves(s).find(m=>m.from===from&&m.to===to&&(!m.promotion||m.promotion===promotion));
 if(!m)return s;
 const next=apply(s,m),moves=chessMoves(next),k=key(next);
 next.repetitions={...s.repetitions,[k]:(s.repetitions[k]||0)+1};
 if(!moves.length)next.result=chessCheck(next)?{winner:s.turn,reason:'Schachmatt'}:{winner:null,reason:'Patt'};
 else if(dead(next))next.result={winner:null,reason:'Unzureichendes Mattmaterial'};
 else if(next.repetitions[k]>=3)next.result={winner:null,reason:'Dreifache Stellungswiederholung'};
 else if(next.half>=100)next.result={winner:null,reason:'50-Züge-Regel'};
 return next;
}
// Perft ignores casual repetition/draw adjudication and exercises raw legal moves.
export function chessPerft(s,depth){
 if(depth===0)return 1;
 return chessMoves(s).reduce((n,m)=>n+chessPerft(apply(s,m),depth-1),0);
}
