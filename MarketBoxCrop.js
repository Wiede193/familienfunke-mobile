// Coordinates are approximate suggestions, never a verified segmentation.
export const PHOTO_ISSUES={
 blur:'Das Bild wirkt unscharf. Halte das Handy beim Fotografieren ruhig.',
 dark:'Das Bild wirkt dunkel. Nutze helles, indirektes Tageslicht.',
 glare:'Reflexionen oder Überbelichtung können Details verdecken.',
 overlap:'Kleidungsstücke überlappen sich. Lege sie einzeln aus.',
 cutoff:'Ein Teil ist möglicherweise am Bildrand abgeschnitten.',
 crowded:'Die Artikel liegen dicht beieinander. Lass mehr Abstand.',
 perspective:'Die Aufnahme ist schräg. Fotografiere möglichst senkrecht von oben.'
};
export function cropBounds(b){
 if(!b||!['left','top','right','bottom'].every(k=>Number.isFinite(b[k])&&b[k]>=0&&b[k]<=100))return null;
 if(b.right-b.left<2||b.bottom-b.top<2)return null;
 return {left:b.left,top:b.top,right:b.right,bottom:b.bottom};
}
export function suggestedCrop(d){
 const b=cropBounds(d?.bounds);
 if(!b||d.visibility!=='isolated')return null;
 const mx=Math.min(2,(b.right-b.left)*.07),my=Math.min(2,(b.bottom-b.top)*.07);
 return {left:Math.max(0,b.left-mx),top:Math.max(0,b.top-my),right:Math.min(100,b.right+mx),bottom:Math.min(100,b.bottom+my)};
}
export function changeCrop(b,edge,delta){
 const ok=cropBounds(b);
 if(!ok||!['left','top','right','bottom'].includes(edge)||!Number.isFinite(delta))return null;
 const out={...ok};
 if(edge==='left')out.left=Math.max(0,Math.min(ok.right-2,ok.left+delta));
 if(edge==='right')out.right=Math.min(100,Math.max(ok.left+2,ok.right+delta));
 if(edge==='top')out.top=Math.max(0,Math.min(ok.bottom-2,ok.top+delta));
 if(edge==='bottom')out.bottom=Math.min(100,Math.max(ok.top+2,ok.bottom+delta));
 return cropBounds(out);
}
export function pixelCrop(bounds,width,height){
 const b=cropBounds(bounds);
 if(!b||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)return null;
 const originX=Math.floor(b.left*width/100),originY=Math.floor(b.top*height/100);
 const endX=Math.min(width,Math.ceil(b.right*width/100)),endY=Math.min(height,Math.ceil(b.bottom*height/100));
 const w=endX-originX,h=endY-originY;
 if(w<160||h<160)return null;
 return {originX,originY,width:w,height:h};
}
export function photoIssues(values){
 return Array.isArray(values)?[...new Set(values.filter(v=>Object.prototype.hasOwnProperty.call(PHOTO_ISSUES,v)))]:[];
}
