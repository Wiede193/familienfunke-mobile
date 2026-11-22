// PostgREST RPCs return rows in the database's cursor order.
export const SOCIAL_PAGE_SIZE = 40;
export function socialCursor(rows, key = 'id') {
  const last = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
  if (!last || typeof last.created_at !== 'string' || typeof last[key] !== 'string') return null;
  return { p_before_at: last.created_at, p_before_id: last[key] };
}
export function hasNextSocialPage(rows) {
  return Array.isArray(rows) && rows.length === SOCIAL_PAGE_SIZE;
}
export function appendUniqueRows(existing, incoming, key = 'id') {
  const byKey = new Set((existing || []).map(x => x[key]));
  return [...(existing || []), ...(incoming || []).filter(x => {
    if (!x?.[key] || byKey.has(x[key])) return false;
    byKey.add(x[key]);
    return true;
  })];
}
