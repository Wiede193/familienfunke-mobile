-- Synchronisiert nur freigegebene amtliche RSS-Quellen, mit internem Geheimnis.
-- Der Job meldet Kandidaten nicht als redaktionell geprüfte rechtliche Wirkung.
select cron.schedule(
 'ff_official_decisions_every_three_hours',
 '17 */3 * * *',
 $job$
 select net.http_post(
   url:='https://cycqdhjvbikrlzgliloo.supabase.co/functions/v1/ff-decision-sync',
   headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-ff-official-sync',(select token from private.ff_official_sync_runtime where singleton=true)
   ),
   body:='{}'::jsonb,
   timeout_milliseconds:=90000
 );
 $job$
);
