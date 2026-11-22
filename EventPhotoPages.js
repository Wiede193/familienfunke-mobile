// Stable, bounded cursors for the separate event and photo lists.
export const EVENT_PAGE_SIZE = 20;
export const PHOTO_PAGE_SIZE = 20;
export function ascendingEventCursor(rows) {
  const last = Array.isArray(rows) && rows.length ? rows[rows.length-1] : null;
  return last?.starts_at && last?.id ? {p_before_at:last.starts_at,p_before_id:last.id}:null;
}
export function descendingRowCursor(rows, idKey = 'id') {
  const last = Array.isArray(rows) && rows.length ? rows[rows.length-1] : null;
  return last?.created_at && last?.[idKey]
    ? {p_before_at:last.created_at,p_before_id:last[idKey]}:null;
}
export const hasFullPage = (rows,count=20) => Array.isArray(rows) && rows.length===count;
