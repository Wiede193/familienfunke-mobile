-- Every six hours; a separate limit and least-recently-checked ordering
-- avoids hammering official hosts and ensures older bills are not forgotten.
-- Secrets remain in private.ff_official_sync_runtime, not inside a public URL.
select cron.schedule(
 'ff_legislation_status_monitor_6h',
 '47 */6 * * *',
 $job$
 select net.http_post(
  url:='https://cycqdhjvbikrlzgliloo.supabase.co/functions/v1/ff-decision-track',
  headers:=jsonb_build_object(
   'Content-Type','application/json',
   'x-ff-official-sync',(select token from private.ff_official_sync_runtime where singleton=true)
  ),
  body:='{}'::jsonb,
  timeout_milliseconds:=90000
 );
 $job$
);
