// Pure game state transitions. No network, clock, timers or persistent player data.
const symbols=['Sonne','Mond','Stern','Blume','Herz','Baum','Haus','Fisch'];
function shuffle(items,rng){
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function newPairs(count=6,rng=Math.random){
 const chosen=symbols.slice(0,[4,6,8].includes(count)?count:6);
 return {cards:shuffle([...chosen,...chosen],rng),open:[],matched:[],moves:0};
}
export function flipPair(state,index){
 if(!Number.isInteger(index)||index<0||index>=state.cards.length||state.matched.includes(index)||state.open.includes(index)||state.open.length>=2)return state;
 const open=[...state.open,index];
 if(open.length===1)return {...state,open};
 const same=state.cards[open[0]]===state.cards[open[1]];
 return {...state,open:same?[]:open,matched:same?[...state.matched,...open]:state.matched,moves:state.moves+1};
}
export function closePair(state){return state.open.length===2?{...state,open:[]}:state;}
export const WIN_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function newThree(){return {cells:Array(9).fill(null),turn:'X',winner:null,line:null,draw:false};}
export function playThree(state,index){
 if(state.winner||state.draw||!Number.isInteger(index)||index<0||index>8||state.cells[index])return state;
 const cells=[...state.cells];cells[index]=state.turn;
 const line=WIN_LINES.find(line=>line.every(i=>cells[i]===state.turn))||null;
 return {cells,turn:state.turn==='X'?'O':'X',winner:line?state.turn:null,line,draw:!line&&cells.every(Boolean)};
}
export function newPattern(level='school',rng=Math.random){
 const random=(a,b)=>a+Math.floor(rng()*(b-a+1));
 let terms,answer,explanation;
 if(level==='little'){
  const a=random(1,5),step=random(1,3);terms=[a,a+step,a+step*2];answer=a+step*3;explanation='Jedes Mal kommen '+step+' dazu.';
 }else if(level==='family'&&rng()<.5){
  const a=random(1,5),step=random(2,3);terms=[a,a*step,a*step**2];answer=a*step**3;explanation='Jede Zahl wird mit '+step+' multipliziert.';
 }else{
  const a=random(2,10),step=random(2,7);terms=[a,a+step,a+2*step,a+3*step];answer=a+4*step;explanation='Die Zahlen wachsen immer um '+step+'.';
 }
 return {terms,answer,choices:shuffle([answer,answer-1,answer+1],rng),explanation};
}
