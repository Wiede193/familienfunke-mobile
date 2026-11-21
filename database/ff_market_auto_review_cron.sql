-- A private, signed, bounded retry tick every five minutes.
-- No service key in the database, logs, queue, or client. HMAC is 90 seconds
-- valid and one-use; the Edge Function verifies it in the protected RPC.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function private.ff_market_review_retry_tick()
returns bigint language plpgsql security definer set search_path='' as $fn$
declare stamp bigint; request_id bigint;
begin
 if not exists(
   select 1 from public.ff_market_review_jobs j
   where (j.state in ('queued','retry') and j.due_at<=now())
      or (j.state='processing' and j.leased_until<now())
 ) then return null; end if;
 stamp:=floor(extract(epoch from clock_timestamp()))::bigint;
 select net.http_post(
   url:='https://cycqdhjvbikrlzgliloo.supabase.co/functions/v1/ff-market-review',
   headers:=jsonb_build_object(
     'content-type','application/json',
     'x-ff-review-timestamp',stamp::text,
     'x-ff-review-signature',private.ff_market_review_sign(stamp)
   ),
   body:='{"kind":"retry"}'::jsonb
 ) into request_id;
 return request_id;
end $fn$;
revoke all on function private.ff_market_review_retry_tick() from public,anon,authenticated,service_role;

select cron.schedule('ff_market_review_retry','*/5 * * * *',
  $job$select private.ff_market_review_retry_tick();$job$);
