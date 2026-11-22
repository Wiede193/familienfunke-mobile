// UI-only templates and explicit sharing. Existing moderation, RLS and
// participation-request workflows remain the only source of permission.
export function newFamilyRoundDraft(region=''){
 return {
  title:'Kleine Familienrunde',
  description:'Wir möchten andere Familien kennenlernen und uns an einem öffentlichen Ort treffen. Bitte keine Privatadressen veröffentlichen. Weitere Einzelheiten werden nach Absprache geklärt.',
  region_label:String(region||'').slice(0,80),
  time:'15:00',
  max_participants:'8',
  visibility:'community'
 };
}
export function publicMeetingShareText(event,{language='de',locale='de-DE',now=Date.now()}={}){
 if(event?.moderation_status!=='approved'||event.visibility!=='community'||!event.starts_at||!event.ends_at)return null;
 const start=Date.parse(event.starts_at),end=Date.parse(event.ends_at);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<=now||end<=now)return null;
 const when=new Date(start).toLocaleString(locale,{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
 // Never include event title, free-text description, names, exact location
 // or a fabricated registration/deep link in the message sent to outsiders.
 return language==='en'
  ?'There is an approved family meetup on Familienfunke on '+when+'. If you already have an approved family account, open the Meetups section. Attendance needs to be requested and approved separately. This is not a direct invitation link.'
  :'Auf Familienfunke gibt es am '+when+' ein freigegebenes Familientreffen. Wenn du bereits ein freigegebenes Familienkonto hast, schau im Bereich „Treffen“ vorbei. Die Teilnahme muss gesondert angefragt und bestätigt werden. Dies ist noch kein direkter Einladungslink.';
}
