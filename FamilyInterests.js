// Gemeinsamer Interessen-Katalog für Profil und Familiensuche.
// Bestehende Interessen bleiben beim Bearbeiten erhalten, auch wenn sie nicht
// mehr im Vorschlagskatalog stehen. Keine personenbezogenen Daten eingeben.
export const MAX_PROFILE_INTERESTS=24;
export const FAMILY_INTEREST_GROUPS=[
 {title:'Draußen & Natur',items:['Spielplatz','Natur','Spazierengehen','Wandern','Radfahren','Camping','Picknick','Geocaching','Gärtnern','Angeln','Tiere','Tierbeobachtung','Bauernhof','Strand & See']},
 {title:'Sport & Bewegung',items:['Sport','Schwimmen','Fußball','Basketball','Volleyball','Turnen','Yoga','Joggen','Fitness','Klettern','Bouldern','Reiten','Tanzen','Skaten','Badminton','Tischtennis']},
 {title:'Kreativ & Musik',items:['Musik','Singen','Instrumente spielen','Basteln','Malen','Zeichnen','Töpfern','Nähen','Stricken','Häkeln','Handarbeiten','Fotografie','Theater','Konzerte','DIY & Heimwerken']},
 {title:'Zuhause & Spiele',items:['Kochen','Backen','Lesen','Hörbücher','Hörspiele','Brettspiele','Spieleabende','Puzzeln','Videospiele','Kino','Filme & Serien','Garten','Technik & Tüfteln']},
 {title:'Ausflüge mit Kindern',items:['Ausflüge','Familiencafés','Indoorspielplätze','Freizeitparks','Tierpark & Zoo','Museen','Bibliotheken','Schwimmbäder','Trampolinparks','Kinderflohmärkte','Reisen','Fahrradtouren','Kinderkonzerte']},
 {title:'Gemeinschaft & Alltag',items:['Freunde treffen','Eltern-Kind-Treffen','Spielgruppen','Nachbarschaft','Ehrenamt','Feste feiern','Gemeinsame Spaziergänge','Gemeinsam kochen','Sprachen lernen','Familientreffen','Mehrgenerationen-Ausflüge']}
];
export const FAMILY_INTERESTS=[...new Set(FAMILY_INTEREST_GROUPS.flatMap(group=>group.items))];
export const normalizeInterest=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,40);
const key=value=>normalizeInterest(value).toLocaleLowerCase('de-DE')
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function filterFamilyInterests(query='',items=FAMILY_INTERESTS){
 const term=key(query);
 return term?items.filter(label=>key(label).includes(term)):items;
}
export function addFamilyInterest(current,label,max=MAX_PROFILE_INTERESTS){
 const chosen=Array.isArray(current)?current:[];
 const normalized=normalizeInterest(label);
 if(normalized.length<2||normalized.length>40||/[\n\r@]|https?:\/\//i.test(normalized))return chosen;
 if(chosen.some(item=>key(item)===key(normalized)))return chosen;
 return chosen.length>=max?chosen:[...chosen,normalized];
}
export function removeFamilyInterest(current,label){
 const chosen=Array.isArray(current)?current:[];
 return chosen.filter(item=>key(item)!==key(label));
}
