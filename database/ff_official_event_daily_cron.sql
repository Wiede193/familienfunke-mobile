-- One low-frequency daily task. The cron job contains no literal credentials.
-- pg_cron resolves a random server-only token from the private table at execution time.
select cron.schedule(
 'ff_official_event_sync_daily',
 '25 5 * * *',
 $cron$
 select net.http_post(
   url:='https://cycqdhjvbikrlzgliloo.supabase.co/functions/v1/ff-official-event-sync',
   headers:=jsonb_build_object(
     'Content-Type','application/json',
     'x-ff-official-sync',(
       select token from private.ff_official_sync_runtime where singleton=true
     )
   ),
   body:='{}'::jsonb,
   timeout_milliseconds:=90000
 );
 $cron$
);
