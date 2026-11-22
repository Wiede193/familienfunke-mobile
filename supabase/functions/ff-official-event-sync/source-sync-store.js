// All writes use the server's service client. Frontend users cannot access this queue.
const norm=t=>String(t||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export async function stageCandidate(db,source,event){
 const key={source_id:source.id,external_id:event.external_id,instance_key:event.instance_key};
 const {data:old,error:lookupError}=await db.from('ff_official_event_candidates')
  .select('id,fingerprint,review_state,linked_event_id').match(key).maybeSingle();
 if(lookupError)throw lookupError;
 const {cancelled,...entry}=event;
 if(old?.fingerprint===event.fingerprint){
  const {error}=await db.from('ff_official_event_candidates')
    .update({last_seen_at:new Date().toISOString()}).eq('id',old.id);
  if(error)throw error;
  return 'unchanged';
 }
 if(old){
  const status=cancelled?'cancelled':old.review_state==='approved'?'changed':'pending';
  const {error}=await db.from('ff_official_event_candidates').update({
   ...entry,review_state:status,reviewed_at:null,last_seen_at:new Date().toISOString(),
   review_note:cancelled?'Absage in Quelle':old.review_state==='approved'?'Quelländerung: erneut prüfen':'Aktualisierte Quelle'
  }).eq('id',old.id);
  if(error)throw error;
  if(old.linked_event_id&&(cancelled||old.review_state==='approved')){
   const {error:hide}=await db.from('ff_official_family_events')
    .update({published:false}).eq('id',old.linked_event_id);
   if(hide)throw hide;
  }
  return status;
 }
 const {data:similar,error:similarError}=await db.from('ff_official_family_events')
  .select('title').eq('district',source.district).eq('start_date',event.start_date).limit(90);
 if(similarError)throw similarError;
 const duplicate=(similar||[]).some(e=>norm(e.title)===norm(event.title));
 const review_state=cancelled?'cancelled':duplicate?'duplicate':'pending';
 const {error:insertError}=await db.from('ff_official_event_candidates').insert({
  ...key,...entry,review_state,review_note:cancelled?'Quellabsage':
   duplicate?'Mögliche Dublette: redaktionell abgleichen':'Neue Familienveranstaltung: Freigabe offen'
 });
 if(insertError&&insertError.code!=='23505')throw insertError;
 return insertError?'unchanged':review_state;
}
export async function recordPageCheck(db,event,status,cancelled,reason=''){
 const {data:old,error:readError}=await db.from('ff_official_event_checks')
  .select('failure_count,review_required').eq('event_id',event.id).maybeSingle();
 if(readError)throw readError;
 const failure_count=status===200?0:(old?.failure_count||0)+1;
 const review_required=cancelled||(status===404||status===410)&&failure_count>=2||!!old?.review_required;
 const {error:upsertError}=await db.from('ff_official_event_checks').upsert({
  event_id:event.id,last_checked_at:new Date().toISOString(),last_http_status:status,
  failure_count,review_required,
  review_reason:cancelled?'Veranstalter meldet EventCancelled':review_required?reason:''
 },{onConflict:'event_id'});
 if(upsertError)throw upsertError;
 if(cancelled){
  const {error:hide}=await db.from('ff_official_family_events').update({published:false}).eq('id',event.id);
  if(hide)throw hide;
 }
 return cancelled?'cancelled':review_required?'review':'ok';
}
