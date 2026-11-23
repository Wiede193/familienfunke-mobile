// Pure helpers for public editorial family-event listings; no GPS, cookies or personal data.
export const OFFICIAL_EVENT_DISTRICTS=[
 {id:'all',label:'Alle Regionen'},
 {id:'oder-spree',label:'Oder-Spree'},
 {id:'frankfurt-oder',label:'Frankfurt (Oder)'},
 {id:'maerkisch-oderland',label:'Märkisch-Oderland'},
 {id:'dahme-spreewald',label:'Dahme-Spreewald'},
 {id:'barnim',label:'Barnim'}
];
export const OFFICIAL_EVENT_CATEGORIES=[
 {id:'all',label:'Alle Aktivitäten'},
 {id:'holiday',label:'Feiertage & Ferien'},
 {id:'festival',label:'Familienfeste'},
 {id:'market',label:'Märkte'},
 {id:'theater',label:'Kindertheater'},
 {id:'workshop',label:'Mitmachen'},
 {id:'sport',label:'Bewegung'},
 {id:'baby',label:'Baby & Eltern'},
 {id:'outdoor',label:'Draußen'}
];
const isoDay=d=>{
 const year=d.getFullYear(),month=String(d.getMonth()+1).padStart(2,'0');
 return year+'-'+month+'-'+String(d.getDate()).padStart(2,'0');
};
export function officialEventRange(month,baseDate=new Date()){
 if(month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
  const [y,m]=month.split('-').map(Number);
  return {from:month+'-01',to:isoDay(new Date(y,m,0,12))};
 }
 const future=new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate()+90,12);
 return {from:isoDay(baseDate),to:isoDay(future)};
}
export function officialEventDay(value){
 const p=String(value||'').slice(0,10).split('-');
 return p.length===3?p[2]+'.'+p[1]+'.'+p[0]:String(value||'');
}
export function officialEventDateLabel(item){
 const start=officialEventDay(item.start_date),end=officialEventDay(item.end_date);
 const when=start===end?start:start+' – '+end;
 return when+(item.start_time?' · '+String(item.start_time).slice(0,5)+' Uhr':'');
}
export function officialEventVisible(event,district='all',category='all',today=isoDay(new Date())){
 return !!event?.published&&String(event.end_date)>=today&&
  (district==='all'||event.district===district)&&
  (category==='all'||event.category===category||(category==='holiday'&&/weihnacht|advent|nikolaus|oster|pfingst|silvester|winterzauber|laternen|martinsfest|fasching|karneval|halloween/i.test(event.title||'')));
}
