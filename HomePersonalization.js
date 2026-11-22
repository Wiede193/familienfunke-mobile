// Limited previews from already fetched, account-visible data only.
// No AI request, network call, location permission or new access rights.
const region=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const base=status=>({status,requests:[],families:[],meeting:null,listings:[]});
export function selectHomeHighlights({userId,active,profile,matchingProfiles=[],contacts=[],events=[],listings=[],blocks=[],now=Date.now()}={}){
 if(!userId||!active)return base('unavailable');
 const ownRegion=region(profile?.region_label),value=base(ownRegion?'ready':'missing-region');
 const blocked=new Set(blocks.filter(b=>b.blocker_id===userId).map(b=>b.blocked_id));
 const accepted=new Set(contacts.filter(c=>c.status==='accepted'&&(c.sender_id===userId||c.recipient_id===userId)).map(c=>c.sender_id===userId?c.recipient_id:c.sender_id).filter(id=>!blocked.has(id)));
 value.requests=contacts.filter(c=>c.status==='pending'&&c.recipient_id===userId&&!blocked.has(c.sender_id)).slice(0,3);
 if(!ownRegion)return value;
 value.families=matchingProfiles.filter(p=>p.user_id!==userId&&p.moderation_status==='approved'&&p.is_discoverable===true&&!blocked.has(p.user_id)&&region(p.region_label)===ownRegion).slice(0,2).map(p=>({id:p.user_id,name:String(p.display_name||'Familienprofil').slice(0,80)}));
 const matches=events.filter(e=>{
  const begin=Date.parse(e.starts_at),end=Date.parse(e.ends_at);
  return e.id&&e.moderation_status==='approved'&&Number.isFinite(begin)&&Number.isFinite(end)&&begin>now&&end>now&&region(e.region_label)===ownRegion&&!blocked.has(e.organizer_id)&&(e.visibility==='community'||(e.visibility==='contacts'&&(e.organizer_id===userId||accepted.has(e.organizer_id))));
 }).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
 if(matches.length)value.meeting={id:matches[0].id,title:String(matches[0].title||'Familientreffen').slice(0,100),starts_at:matches[0].starts_at};
 value.listings=listings.filter(x=>x.id&&x.moderation_status==='approved'&&x.seller_id!==userId&&!blocked.has(x.seller_id)&&region(x.region_label)===ownRegion).slice(0,3).map(x=>({id:x.id,title:String(x.title||'Artikel').slice(0,100)}));
 return value;
}
