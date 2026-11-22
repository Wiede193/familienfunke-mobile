// The API owns ordering and page limits; cursors must match the SQL tuple order.
export const MARKET_OWNER_PAGE_SIZE = 30;
export const PARTNER_PAGE_SIZE = 20;
export function marketCursor(rows) {
 const last=Array.isArray(rows)&&rows.length?rows[rows.length-1]:null;
 return last?.created_at&&last?.id?{p_before_at:last.created_at,p_before_id:last.id}:null;
}
export function partnerEventCursor(rows) {
 const last=Array.isArray(rows)&&rows.length?rows[rows.length-1]:null;
 return last?.starts_at&&last?.id?{p_before_at:last.starts_at,p_before_id:last.id}:null;
}
export const hasMarketPage=(rows,size=MARKET_OWNER_PAGE_SIZE)=>Array.isArray(rows)&&rows.length===size;
