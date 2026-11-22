// Client-side bookkeeping for bounded, server-authorized block checks.
// The actual authority is PostgreSQL RLS / private.not_blocked(...).
export const BLOCK_PAGE_SIZE=30;
export const BLOCK_FLAG_MAX_IDS=120;

export function blockPageCursor(rows){
  const last=Array.isArray(rows)&&rows.length?rows[rows.length-1]:null;
  if(!last||typeof last.blocked_id!=='string'||typeof last.created_at!=='string')return null;
  return {p_before_at:last.created_at,p_before_id:last.blocked_id};
}

export function visibleBlockTargets(profiles,contacts,owner,pinnedContact=null,pinnedProfileId=null){
  const targets=new Set();
  for(const row of profiles||[])if(row?.user_id&&row.user_id!==owner)targets.add(row.user_id);
  for(const row of [...(contacts||[]),...(pinnedContact?[pinnedContact]:[])]) {
    const other=row?.sender_id===owner?row?.recipient_id:
      row?.recipient_id===owner?row?.sender_id:null;
    if(other&&other!==owner)targets.add(other);
  }
  if(pinnedProfileId&&pinnedProfileId!==owner)targets.add(pinnedProfileId);
  return [...targets];
}

export function mergeVisibleBlockFlags(previous,owner,requestedIds,flagRows){
  const requested=new Set((requestedIds||[]).filter(x=>typeof x==='string'&&x!==owner));
  const flagged=new Set((flagRows||[]).map(row=>row?.blocked_id).filter(x=>requested.has(x)));
  const keep=(previous||[]).filter(row=>row?.blocker_id===owner&&!requested.has(row.blocked_id));
  return [...keep,...[...flagged].map(blocked_id=>({blocker_id:owner,blocked_id}))];
}
