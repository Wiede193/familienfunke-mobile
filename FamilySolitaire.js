// Klondike, draw one, unlimited stock recycling. State is immutable.
// Cards have ids 0..51, suit 0/1 black, 2/3 red, rank 1..13.
export const rank=id=>id%13+1;
export const suit=id=>Math.floor(id/13);
export const red=id=>suit(id)>=2;
export const cardLabel=id=>['Pik','Kreuz','Herz','Karo'][suit(id)]+' '+(['Ass','2','3','4','5','6','7','8','9','10','Bube','Dame','König'][rank(id)-1]);
export const cardShort=id=>['♠','♣','♥','♦'][suit(id)]+(['A','2','3','4','5','6','7','8','9','10','B','D','K'][rank(id)-1]);
export function newSolitaire(rng=Math.random){
 const deck=Array.from({length:52},(_,i)=>i);
 for(let i=51;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 const tableau=Array.from({length:7},(_,i)=>({cards:deck.splice(0,i+1),hidden:i}));
 return {tableau,stock:deck,waste:[],foundations:[[],[],[],[]],moves:0};
}
export const solitaireWon=s=>s.foundations.every(p=>p.length===13);
export function drawSolitaire(s){
 if(solitaireWon(s)||(!s.stock.length&&!s.waste.length))return s;
 if(!s.stock.length)return {...s,stock:[...s.waste].reverse(),waste:[],moves:s.moves+1};
 return {...s,stock:s.stock.slice(0,-1),waste:[...s.waste,s.stock.at(-1)],moves:s.moves+1};
}
export function sourceCards(s,from){
 if(!from)return [];
 if(from.type==='waste')return s.waste.slice(-1);
 if(from.type==='foundation')return s.foundations[from.col]?.slice(-1)||[];
 if(from.type!=='tableau'||!Number.isInteger(from.index))return [];
 const p=s.tableau[from.col];if(!p||from.index<p.hidden||from.index>=p.cards.length)return [];
 const cards=p.cards.slice(from.index);
 return cards.every((id,i)=>!i||(rank(cards[i-1])===rank(id)+1&&red(cards[i-1])!==red(id)))?cards:[];
}
export function moveSolitaire(s,from,to){
 if(solitaireWon(s)||!to||!from||from.type===to.type&&from.col===to.col)return s;
 const cards=sourceCards(s,from);if(!cards.length)return s;
 const first=cards[0];
 if(to.type==='foundation'){
  const pile=s.foundations[to.col];
  if(!pile||cards.length!==1||suit(first)!==to.col||rank(first)!==pile.length+1)return s;
 }else if(to.type==='tableau'){
  const pile=s.tableau[to.col];if(!pile)return s;
  const last=pile.cards.at(-1);
  if(last===undefined?rank(first)!==13:rank(last)!==rank(first)+1||red(last)===red(first))return s;
 }else return s;
 const next={...s,tableau:s.tableau.map(p=>({...p,cards:[...p.cards]})),foundations:s.foundations.map(p=>[...p]),waste:[...s.waste],moves:s.moves+1};
 if(from.type==='waste')next.waste.pop();
 else if(from.type==='foundation')next.foundations[from.col].pop();
 else {
  const p=next.tableau[from.col];p.cards.splice(from.index);
  p.hidden=Math.max(0,Math.min(p.hidden,p.cards.length-1));
 }
 if(to.type==='foundation')next.foundations[to.col].push(first);
 else next.tableau[to.col].cards.push(...cards);
 return next;
}
export function autoFoundation(s,from){
 const cards=sourceCards(s,from);
 return cards.length===1?moveSolitaire(s,from,{type:'foundation',col:suit(cards[0])}):s;
}
