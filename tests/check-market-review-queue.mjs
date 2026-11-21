import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const queue=read('database/ff_market_auto_review_queue.sql');
const cron=read('database/ff_market_auto_review_cron.sql');
const admin=read('database/ff_market_admin_manual_review.sql');
const api=read('supabase/functions/ff-market-review/index.ts');
for(const [cond,msg] of [
  [queue.includes("if tg_op='INSERT'"),'New listings are automatically queued'],
  [queue.includes("review_version=new.review_version"),'Editing a listing resets an existing job'],
  [!queue.includes('insert into public.ff_market_review_jobs select'),'Legacy test ads are never migrated into queue'],
  [queue.includes("for update of j skip locked"),'Concurrent workers must not claim same listing'],
  [queue.includes("j.attempts<4"),'Retry limit must be enforced'],
  [queue.includes("state='manual'"),'Failed or ambiguous attempts must enter manual queue'],
  [queue.includes("p_lease_id uuid"),'Worker results must be paired with lease'],
  [queue.includes("last_timestamp<p_timestamp"),'Replay of HMAC request must fail'],
  [queue.includes("grant execute on function public.ff_market_review_claim(integer) to service_role"),'Only server claims jobs'],
  [cron.includes("*/5 * * * *"),'Database cron should run every five minutes'],
  [cron.includes("x-ff-review-signature"),'Cron must use a signature'],
  [api.includes('ctx.authMode==="none"'),'Anonymous requests must verify HMAC'],
  [api.includes('auth:["user","none"]'),'Review endpoint accepts users and signed tasks'],
  [api.includes('ff_market_review_cron_verify'),'Requests must verify one-use signature'],
  [api.includes('ff_market_review_record'),'Every job result must be recorded'],
  [api.includes('ff_market_review_claim'),'Cron must fetch only eligible jobs'],
  [admin.includes('private.ff_market_review_is_staff()'),'Preview and admin decisions must check admin staff role'],
  [admin.includes('private.ff_market_review_can_preview(name)'),'Storage policy must not read private queue as app user'],
  [admin.includes("insert into private.ff_market_manual_decisions"),'Every manual decision must be logged'],
  [admin.includes("l.moderation_status<>'pending'"),'Only unchanged pending listings may be approved'],
  [admin.includes('private.is_active_adult(l.seller_id)'),'Seller verification must be rechecked before approval']
])assert.ok(cond,msg);
console.log('KI-Basar: sichere Warteschlange, HMAC-Cron und Admin-Prüfregeln geprüft.');
