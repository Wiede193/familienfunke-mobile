export const pad=n=>String(n).padStart(2,'0');
export const dayKey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
export function validDay(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split('-').map(Number);
 return y>=1900&&y<=2100&&dayKey(new Date(y,m-1,d,12))===value;
}
export const validTime=value=>value===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function monthDays(month){
 const [y,m]=month.split('-').map(Number);
 const first=new Date(y,m-1,1,12),offset=(first.getDay()+6)%7;
 return [...Array(offset).fill(null),...Array.from({length:new Date(y,m,0,12).getDate()},(_,i)=>dayKey(new Date(y,m-1,i+1,12)))];
}
export function moveMonth(month,delta){
 const [y,m]=month.split('-').map(Number);
 return dayKey(new Date(y,m-1+delta,1,12)).slice(0,7);
}
export function entryDay(row){
 if(!row.available)return null;
 if(row.day)return row.day;
 const d=new Date(row.starts_at);
 return row.starts_at&&!Number.isNaN(d.getTime())?dayKey(d):null;
}
export function entryTime(row){
 if(row.local_time)return row.local_time.slice(0,5);
 if(!row.starts_at)return '';
 const d=new Date(row.starts_at);
 return Number.isNaN(d.getTime())?'':pad(d.getHours())+':'+pad(d.getMinutes());
}
export const compareEntries=(a,b)=>((entryDay(a)||'').localeCompare(entryDay(b)||'')||entryTime(a).localeCompare(entryTime(b))||a.id.localeCompare(b.id));
export function calendarFields(form){
 const title=String(form.title||'').trim(),note=String(form.note||'').trim();
 if(title.length<2||title.length>100||note.length>500||!validDay(form.day)||!validTime(form.time))throw Error('Bitte Titel, Datum und Uhrzeit prüfen.');
 return {title,day:form.day,local_time:form.time||null,note};
}

// Format a civil calendar date without UTC parsing or timezone-dependent day shifts.
export function displayCalendarDay(value,locale='de-DE'){
 if(!validDay(value))return value||'–';
 const [y,m,d]=value.split('-').map(Number);
 return new Date(y,m-1,d,12).toLocaleDateString(locale,{day:'2-digit',month:'short',year:'numeric'});
}
