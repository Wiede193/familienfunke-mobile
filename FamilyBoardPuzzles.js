// English draughts: forward men, short kings, mandatory captures and chains.
const dirs=p=>p<0?[[-1,-1],[-1,1],[1,-1],[1,1]]:p===1?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
export function newDraughts(){
 return {board:Array.from({length:64},(_,i)=>((i>>3)+i%8)%2===0?0:i<24?2:i>=40?1:0),turn:1,forced:null,winner:0,draw:false,quiet:0,last:null};
}
function movesFrom(s,from,capture){
 const p=s.board[from];if(!p||Math.abs(p)!==s.turn)return [];
 const r=from>>3,c=from%8,out=[];
 for(const [dr,dc] of dirs(p)){
  const y=r+dr,x=c+dc;if(y<0||y>=8||x<0||x>=8)continue;
  const middle=y*8+x;
  if(!capture&&!s.board[middle])out.push({from,to:middle});
  if(capture&&s.board[middle]&&Math.abs(s.board[middle])!==s.turn){
   const y2=y+dr,x2=x+dc;
   if(y2>=0&&y2<8&&x2>=0&&x2<8&&!s.board[y2*8+x2])out.push({from,to:y2*8+x2,capture:middle});
  }
 }
 return out;
}
export function draughtsMoves(s){
 if(s.winner||s.draw)return [];
 if(s.forced!==null)return movesFrom(s,s.forced,true);
 const from=s.board.map((_,i)=>i),captures=from.flatMap(i=>movesFrom(s,i,true));
 return captures.length?captures:from.flatMap(i=>movesFrom(s,i,false));
}
export function playDraughts(s,from,to){
 const m=draughtsMoves(s).find(x=>x.from===from&&x.to===to);if(!m)return s;
 const board=[...s.board],p=board[from];board[from]=0;board[to]=p;
 if(m.capture!==undefined)board[m.capture]=0;
 const crowned=p>0&&(to>>3)===(s.turn===1?0:7);
 if(crowned)board[to]=-p;
 const next={...s,board,last:m,quiet:m.capture!==undefined||p>0?0:s.quiet+1};
 if(m.capture!==undefined&&!crowned&&movesFrom(next,to,true).length)return {...next,forced:to};
 next.turn=3-s.turn;next.forced=null;
 if(!draughtsMoves(next).length)next.winner=s.turn;
 else if(next.quiet>=80)next.draw=true;
 return next;
}

// Original clues, connected layouts found by bounded backtracking.
const raw=[
 ['little','Tiere','MAUS','Kleines Nagetier mit langem Schwanz.','AAL','Langer, schlangenförmiger Fisch.','AMEISE','Kleines Insekt, das oft in einem Staat lebt.','SCHAF','Es hat Wolle.'],
 ['little','Draußen','SONNE','Unser Stern.','NEST','Darin brüten viele Vögel.','ENTE','Vogel, der häufig auf Teichen schwimmt.','SEE','Große Wasserfläche im Landesinneren.'],
 ['little','Zuhause','LAMPE','Sie macht Licht.','MAUS','Kleines Nagetier.','APFEL','Frucht, die am Baum wächst.','TISCH','Daran kann man essen.'],
 ['school','Natur','WALD','Viele Bäume an einem Ort.','WOLKE','Tröpfchen oder Eiskristalle in der Luft.','DELFIN','Säugetier im Meer.','FALTER','Anderes Wort für Schmetterling.'],
 ['school','Weltraum','PLANET','Himmelskörper, der einen Stern umkreist.','MOND','Natürlicher Begleiter der Erde.','RAKETE','Sie bringt Raumfahrzeuge ins All.','STERN','Leuchtender Himmelskörper wie die Sonne.'],
 ['school','Musik','KLAVIER','Instrument mit Tasten und Saiten.','NOTE','Zeichen für einen Ton.','TROMMEL','Schlaginstrument mit Fell.','GEIGE','Streichinstrument mit vier Saiten.'],
 ['family','Wissenschaft','ATOM','Grundbaustein eines chemischen Elements.','MOLEKUEL','Verbund von Atomen, hier mit UE.','ELEKTRON','Negativ geladenes Elementarteilchen.','ION','Elektrisch geladenes Atom oder Molekül.'],
 ['family','Geografie','DELTA','Verzweigte Form mancher Flussmündungen.','ATLAS','Sammlung geografischer Karten.','MERIDIAN','Halbkreis von einem Pol zum anderen.','KONTINENT','Große zusammenhängende Landmasse.'],
 ['family','Sprache','METAPHER','Bildhafter übertragener Ausdruck.','VERB','Wortart, die häufig eine Tätigkeit bezeichnet.','SYNONYM','Wort mit ähnlicher Bedeutung.','REIM','Gleichklang von Wortenden.']
];
export const CROSSWORDS=raw.map(([level,title,...pairs],id)=>({id,level,title,words:Array.from({length:pairs.length/2},(_,i)=>({word:pairs[2*i],clue:pairs[2*i+1]}))}));
export function buildCrossword(puzzle){
 const key=(r,c)=>r+','+c;
 function place(grid,item,row,col,dir){
  const next=new Map(grid),dr=dir==='down'?1:0,dc=1-dr;
  [...item.word].forEach((letter,i)=>{
   const r=row+dr*i,c=col+dc*i,k=key(r,c),old=next.get(k);
   next.set(k,{r,c,letter,dirs:[...(old?.dirs||[]),dir]});
  });return next;
 }
 function valid(grid,item,row,col,dir){
  const read=(r,c)=>grid.get(key(r,c)),dr=dir==='down'?1:0,dc=1-dr;
  if(read(row-dr,col-dc)||read(row+dr*item.word.length,col+dc*item.word.length))return false;
  let intersects=0;
  for(let i=0;i<item.word.length;i++){
   const r=row+dr*i,c=col+dc*i,old=read(r,c);
   if(old){if(old.letter!==item.word[i]||old.dirs.includes(dir))return false;intersects++;}
   else if(read(r-dc,c-dr)||read(r+dc,c+dr))return false;
  }
  return intersects>0;
 }
 let budget=20000;
 function search(grid,entries,remaining){
  if(!remaining.length)return {grid,entries};
  if(--budget<0)return null;
  for(let j=0;j<remaining.length;j++){
   const item=remaining[j];
   for(const old of grid.values())for(const dir of ['across','down'])for(let i=0;i<item.word.length;i++){
    if(old.letter!==item.word[i]||old.dirs.includes(dir))continue;
    const row=old.r-(dir==='down'?i:0),col=old.c-(dir==='across'?i:0);
    if(!valid(grid,item,row,col,dir))continue;
    const found=search(place(grid,item,row,col,dir),[...entries,{...item,row,col,dir,id:entries.length}],remaining.filter((_,k)=>k!==j));
    if(found)return found;
   }
  }return null;
 }
 const first=puzzle.words[0],result=search(place(new Map(),first,0,0,'across'),[{...first,row:0,col:0,dir:'across',id:0}],puzzle.words.slice(1));
 if(!result)throw Error('Cannot place crossword '+puzzle.title);
 const cells=[...result.grid.values()],entries=result.entries,minR=Math.min(...cells.map(x=>x.r)),minC=Math.min(...cells.map(x=>x.c));
 const height=Math.max(...cells.map(x=>x.r))-minR+1,width=Math.max(...cells.map(x=>x.c))-minC+1;
 const solution=Array(height*width).fill(null);
 for(const x of cells)solution[(x.r-minR)*width+x.c-minC]=x.letter;
 const numbered=[...entries].sort((a,b)=>a.row-b.row||a.col-b.col);
 let number=0,prev='';for(const e of numbered){const pos=key(e.row,e.col);if(pos!==prev){number++;prev=pos;}e.number=number;}
 const clues=entries.map(e=>({...e,cells:[...e.word].map((_,i)=>(e.row-minR+(e.dir==='down'?i:0))*width+e.col-minC+(e.dir==='across'?i:0))})).sort((a,b)=>a.number-b.number);
 return {id:puzzle.id,title:puzzle.title,width,height,solution,clues,cells:solution.map(x=>x===null?null:''),hints:0};
}
export function crosswordPut(s,index,value){
 if(s.solution[index]==null||typeof value!=='string')return s;
 const v=value.toUpperCase();if(!/^[A-ZÄÖÜ]?$/.test(v))return s;
 const cells=[...s.cells];cells[index]=v;return {...s,cells};
}
export function crosswordHint(s,index){
 const next=crosswordPut(s,index,s.solution[index]);return next===s?next:{...next,hints:s.hints+1};
}
export const crosswordWon=s=>s.solution.every((x,i)=>x===s.cells[i]);

// Original pixel illustrations, each 12 by 12. Identical pieces are interchangeable.
const scenes=[
 {title:'Sonnenwiese',pixel:(r,c)=>{
  if((r-2)**2+(c-9)**2<=4)return '#FFB83E';
  if(r===7&&c>=2&&c<=4||r===8&&c===3)return '#EE7867';
  if(r>=9&&c===3)return '#286C4A';
  if(r>=8)return (r+c)%5===0?'#A3C878':'#579B61';
  if(r===6&&c>=5&&c<=10||r===5&&c>=6&&c<=9||r===4&&c>=7&&c<=8)return '#6FAF70';
  return '#BDE4EC';
 }},
 {title:'Kleines Haus',pixel:(r,c)=>{
  if(r>=10)return '#86B66D';
  if(r>=5&&r<=9&&c>=3&&c<=8){
   if(r>=7&&c===5)return '#8E644E';
   if(r===6&&(c===4||c===7))return '#75BBD0';
   return '#FFDD79';
  }
  if(r>=2&&r<=4&&Math.abs(c-5.5)<=r-1)return '#B9474C';
  if(r>=7&&c===10)return '#4C8F60';
  return '#D4EAF2';
 }},
 {title:'Unter Wasser',pixel:(r,c)=>{
  if(r>=10)return '#F4D99D';
  if(c===1&&r>=7||c===10&&r>=8)return '#4A9974';
  if(r>=4&&r<=7&&c>=3&&c<=8&&Math.abs(r-5.5)+Math.abs(c-5.5)<=4){
   if(r===5&&c===7)return '#253D43';return '#F1A34A';
  }
  if(c===2&&r>=4&&r<=7)return '#EE7867';
  if(r===2&&c===8||r===3&&c===9||r===1&&c===10)return '#FFFFFF';
  return r<4?'#91CFE5':'#60B6CC';
 }},
 {title:'Berge',pixel:(r,c)=>{
  if((r-2)**2+(c-2)**2<=2)return '#FFDD79';
  if(r>=10)return '#6EA86D';
  if(r>=3&&Math.abs(c-8)<=r-3)return r<6?'#FFF9F0':'#879BA5';
  if(r>=5&&Math.abs(c-3)<=r-5)return r<7?'#FFF9F0':'#A6B4BE';
  return '#CCE7F1';
 }}
];
export const PICTURE_SCENES=scenes.map((x,id)=>({id,title:x.title,pixels:Array.from({length:144},(_,i)=>x.pixel(Math.floor(i/12),i%12))}));
export function pictureTile(scene,n,index){
 const size=12/n,row=Math.floor(index/n)*size,col=index%n*size;
 return Array.from({length:size*size},(_,i)=>scene.pixels[(row+Math.floor(i/size))*12+col+i%size]);
}
export const pictureWon=s=>s.order.every((tile,i)=>s.signatures[tile]===s.signatures[i]);
export function newPicture(n=3,sceneId=0,rng=Math.random){
 if(![2,3,4].includes(n))n=3;
 const scene=PICTURE_SCENES[sceneId%PICTURE_SCENES.length]||PICTURE_SCENES[0],order=Array.from({length:n*n},(_,i)=>i);
 const signatures=order.map(i=>pictureTile(scene,n,i).join(','));
 for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const s={n,sceneId:scene.id,order,signatures,moves:0};
 if(pictureWon(s)){const j=order.findIndex(t=>signatures[t]!==signatures[order[0]]);if(j>0)[order[0],order[j]]=[order[j],order[0]];}
 return s;
}
export function swapPicture(s,a,b){
 if(pictureWon(s)||a===b||![a,b].every(i=>Number.isInteger(i)&&i>=0&&i<s.order.length))return s;
 const order=[...s.order];[order[a],order[b]]=[order[b],order[a]];return {...s,order,moves:s.moves+1};
}
