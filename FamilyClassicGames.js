// Pure local game state. No player identifiers, network or persistence.
export function shuffle(items,rng=Math.random){
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
// Four in a row: row 0 is the top; gravity chooses the lowest free cell.
export function newFour(){return {cells:Array(42).fill(0),turn:1,winner:0,line:[],draw:false};}
export function dropFour(state,col){
 if(state.winner||state.draw||!Number.isInteger(col)||col<0||col>6)return state;
 let row=5;while(row>=0&&state.cells[row*7+col])row--;
 if(row<0)return state;
 const cells=[...state.cells],index=row*7+col;cells[index]=state.turn;
 let line=[];
 for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
  const chain=[index];
  for(const sign of [-1,1])for(let n=1;n<7;n++){
   const r=row+dr*n*sign,c=col+dc*n*sign;
   if(r<0||r>=6||c<0||c>=7||cells[r*7+c]!==state.turn)break;
   if(sign===-1)chain.unshift(r*7+c);else chain.push(r*7+c);
  }
  if(chain.length>=4){line=chain;break;}
 }
 return {cells,turn:3-state.turn,winner:line.length?state.turn:0,line,draw:!line.length&&cells.every(Boolean)};
}
// Sudoku: count solutions up to a cap, using minimum remaining values and bit masks.
export function countSudokuSolutions(board,n,cap=2){
 if(![4,6,9].includes(n)||board.length!==n*n)return 0;
 const br=n===9?3:2,bc=n===4?2:3,full=(1<<n)-1;
 const box=(r,c)=>Math.floor(r/br)*(n/bc)+Math.floor(c/bc);
 const rows=Array(n).fill(0),cols=Array(n).fill(0),boxes=Array(n).fill(0),a=[...board];
 for(let i=0;i<a.length;i++){
  const v=a[i],r=Math.floor(i/n),c=i%n,b=box(r,c);
  if(!Number.isInteger(v)||v<0||v>n)return 0;
  if(!v)continue;
  const bit=1<<(v-1);if((rows[r]|cols[c]|boxes[b])&bit)return 0;
  rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;
 }
 let count=0;
 function visit(){
  if(count>=cap)return;
  let idx=-1,mask=0,best=n+1;
  for(let i=0;i<a.length;i++)if(a[i]===0){
   const r=Math.floor(i/n),c=i%n,m=full&~(rows[r]|cols[c]|boxes[box(r,c)]);
   if(!m)return;
   let size=0;for(let t=m;t;t&=t-1)size++;
   if(size<best){best=size;idx=i;mask=m;if(size===1)break;}
  }
  if(idx<0){count++;return;}
  const r=Math.floor(idx/n),c=idx%n,b=box(r,c);
  for(let m=mask;m&&count<cap;m&=m-1){
   const bit=m&-m;rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;a[idx]=32-Math.clz32(bit);
   visit();a[idx]=0;rows[r]^=bit;cols[c]^=bit;boxes[b]^=bit;
  }
 }
 visit();return count;
}
export function newSudoku(n=9,rng=Math.random){
 if(![4,6,9].includes(n))n=9;
 const br=n===9?3:2,bc=n===4?2:3;
 const groups=(size)=>shuffle(Array.from({length:n/size},(_,i)=>i),rng).flatMap(g=>shuffle(Array.from({length:size},(_,i)=>g*size+i),rng));
 const rows=groups(br),cols=groups(bc),digits=shuffle(Array.from({length:n},(_,i)=>i+1),rng);
 const solution=rows.flatMap(r=>cols.map(c=>digits[(bc*(r%br)+Math.floor(r/br)+c)%n]));
 const givens=[...solution],target=n===4?6:n===6?16:38;let removed=0;
 for(const i of shuffle(solution.map((_,i)=>i),rng)){
  if(removed>=target)break;
  givens[i]=0;
  if(countSudokuSolutions(givens,n)===1)removed++;else givens[i]=solution[i];
 }
 return {n,br,bc,givens,solution,cells:[...givens],hints:0};
}
export function sudokuPut(state,index,value){
 if(!Number.isInteger(index)||index<0||index>=state.cells.length||state.givens[index]||!Number.isInteger(value)||value<0||value>state.n)return state;
 const cells=[...state.cells];cells[index]=value;return {...state,cells};
}
export function sudokuHint(state,index){
 const next=sudokuPut(state,index,state.solution[index]);
 return next===state?state:{...next,hints:state.hints+1};
}
export const sudokuWon=s=>s.cells.every((v,i)=>v===s.solution[i]);
export function sudokuConflicts(s){
 const result=new Set(),{n,br,bc,cells}=s;
 for(let i=0;i<cells.length;i++)if(cells[i])for(let j=i+1;j<cells.length;j++)if(cells[i]===cells[j]){
  const r=Math.floor(i/n),c=i%n,r2=Math.floor(j/n),c2=j%n;
  if(r===r2||c===c2||(Math.floor(r/br)===Math.floor(r2/br)&&Math.floor(c/bc)===Math.floor(c2/bc))){result.add(i);result.add(j);}
 }
 return [...result];
}
// Word scramble: meaningful hints and a fixed dictionary, not names or generated text.
export const WORDS=[
 ['little','SONNE','Sie spendet uns Licht.'],['little','MAUS','Ein kleines Tier mit langem Schwanz.'],['little','HAUS','Darin können Menschen wohnen.'],['little','BAUM','Er hat Wurzeln und einen Stamm.'],['little','FISCH','Er lebt im Wasser.'],['little','BLUME','Sie hat oft bunte Blüten.'],['little','TISCH','Darauf kann man essen.'],['little','APFEL','Eine Frucht vom Baum.'],['little','MOND','Er umkreist die Erde.'],['little','ENTE','Ein Vogel, der oft auf dem Wasser schwimmt.'],['little','STERN','Die Sonne ist auch einer.'],['little','LAMPE','Sie macht ein Zimmer hell.'],
 ['school','PLANET','Er kreist um einen Stern.'],['school','RAKETE','Sie kann Raumfahrzeuge ins All bringen.'],['school','KOMPASS','Er hilft bei der Orientierung.'],['school','WOLKEN','Sie bestehen aus Tröpfchen oder Eiskristallen.'],['school','KROKODIL','Ein großes Reptil mit vielen Zähnen.'],['school','GIRAFFE','Sie hat einen besonders langen Hals.'],['school','KLAVIER','Ein Instrument mit Tasten und Saiten.'],['school','REGENBOGEN','Bunte Farben durch Licht und Wassertropfen.'],['school','BIBLIOTHEK','Dort kann man Bücher ausleihen.'],['school','IGEL','Ein kleines Stacheltier.'],['school','PIRAT','Eine Figur in Geschichten über Seeräuber.'],['school','WALD','Ein Gebiet mit vielen Bäumen.'],
 ['family','ATMOSPHÄRE','Die Gashülle eines Planeten.'],['family','GRAVITATION','Die Anziehung zwischen Massen.'],['family','GALAXIE','Eine große Ansammlung von Sternen.'],['family','FOTOSYNTHESE','Pflanzen nutzen Licht, um Zucker herzustellen.'],['family','KONDENSATION','Gasförmig wird flüssig.'],['family','PALINDROM','Ein Wort, das vorwärts und rückwärts gleich lesbar ist.'],['family','METAMORPHOSE','Verwandlung der Körpergestalt, etwa vom Insekt zur erwachsenen Form.'],['family','CHLOROPHYLL','Grüner Blattfarbstoff.'],['family','ARCHIPEL','Eine Inselgruppe.'],['family','EQUATOR','Gedachte Linie zwischen Nord- und Südhalbkugel; hier ohne Umlaut.'],['family','THERMOMETER','Damit misst man Temperatur.'],['family','KOORDINATEN','Zahlen, die eine Position beschreiben.']
].map(([level,word,hint],id)=>({id,level,word:word==='EQUATOR'?'ÄQUATOR':word,hint:word==='EQUATOR'?'Gedachte Linie zwischen Nord- und Südhalbkugel.':hint}));
export function newWord(level,rng=Math.random,seen=[]){
 const pool=WORDS.filter(x=>x.level===level),fresh=pool.filter(x=>!seen.includes(x.id));
 const x=shuffle(fresh.length?fresh:pool,rng)[0]||WORDS[0];
 let tiles=shuffle([...x.word].map((letter,id)=>({letter,id})),rng);
 if(tiles.map(t=>t.letter).join('')===x.word){
  const j=tiles.findIndex(t=>t.letter!==tiles[0].letter);
  if(j>0)[tiles[0],tiles[j]]=[tiles[j],tiles[0]];
 }
 return {...x,tiles,selected:[]};
}
export function wordPick(s,id){
 if(!s.tiles.some(t=>t.id===id)||s.selected.includes(id)||wordWon(s))return s;
 return {...s,selected:[...s.selected,id]};
}
export function wordUndo(s){return wordWon(s)?s:{...s,selected:s.selected.slice(0,-1)};}
export const wordText=s=>s.selected.map(id=>s.tiles.find(t=>t.id===id)?.letter||'').join('');
export const wordWon=s=>wordText(s)===s.word;
