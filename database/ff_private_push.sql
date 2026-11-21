-- Push is explicit opt-in, disabled for all devices until native credentials and delivery have been tested.
alter table private.ff_push_preferences add column if not exists market_alerts boolean not null default true;
create table if not exists private.ff_push_runtime(
 singleton boolean primary key default true check(singleton), enabled boolean not null default false
);
insert into private.ff_push_runtime(singleton) values(true) on conflict do nothing;
create table if not exists private.ff_push_queue(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('request','match','message','market')),
 notification_id uuid references public.ff_notifications(id) on delete cascade,
 listing_id uuid references public.ff_market_listings(id) on delete cascade,
 listing_status text, created_at timestamptz not null default now()
);
create table if not exists private.ff_push_attempts(
 request_id bigint primary key, user_id uuid not null references auth.users(id) on delete cascade,
 expo_token text not null, device_updated_at timestamptz not null,
 stage text not null check(stage in ('ticket','receipt','waiting','done')),
 ticket_id text, status text, next_check timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists ff_push_queue_due on private.ff_push_queue(created_at,user_id);
create index if not exists ff_push_attempts_due on private.ff_push_attempts(next_check) where stage<>'done';
alter table private.ff_push_runtime enable row level security;
alter table private.ff_push_queue enable row level security;
alter table private.ff_push_attempts enable row level security;
revoke all on private.ff_push_runtime,private.ff_push_queue,private.ff_push_attempts from public,anon,authenticated,service_role;

-- Native device status, never return another device's token.
create or replace function public.ff_push_device_status(p_token text default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'registered',exists(select 1 from private.ff_push_devices d where d.user_id=auth.uid() and d.expo_token=p_token),
 'matches',coalesce(p.match_alerts,true),'requests',coalesce(p.request_alerts,true),
 'messages',coalesce(p.message_alerts,true),'market',coalesce(p.market_alerts,true),
 'delivery_ready',coalesce((select enabled from private.ff_push_runtime where singleton),false))
 from (select auth.uid() as uid) v left join private.ff_push_preferences p on p.user_id=v.uid
 where v.uid is not null
$$;
create or replace function public.ff_push_enroll_device(p_token text,p_matches boolean,p_requests boolean,p_messages boolean,p_market boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or not private.is_active_adult(u) then raise exception 'Freigegebenes Konto erforderlich' using errcode='42501';end if;
 if p_token is null or p_token !~ '^(Expo|Exponent)PushToken\[[a-zA-Z0-9_-]{15,220}\]$' then
  raise exception 'Ungültiges Geräte-Token' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('ff_push_enroll:'||u::text,0));
 insert into private.ff_push_preferences(user_id,push_enabled,match_alerts,request_alerts,message_alerts,market_alerts,updated_at)
 values(u,true,coalesce(p_matches,false),coalesce(p_requests,false),coalesce(p_messages,false),coalesce(p_market,false),now())
 on conflict(user_id) do update set push_enabled=true,match_alerts=excluded.match_alerts,
 request_alerts=excluded.request_alerts,message_alerts=excluded.message_alerts,market_alerts=excluded.market_alerts,updated_at=now();
 insert into private.ff_push_devices(expo_token,user_id,updated_at) values(p_token,u,now())
 on conflict(expo_token) do update set user_id=excluded.user_id,updated_at=now();
 delete from private.ff_push_devices d where d.user_id=u and d.expo_token not in
 (select x.expo_token from private.ff_push_devices x where x.user_id=u order by x.updated_at desc,x.expo_token limit 3);
 return true;
end $$;
create or replace function public.ff_push_update_categories(p_matches boolean,p_requests boolean,p_messages boolean,p_market boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Bitte anmelden' using errcode='42501';end if;
 insert into private.ff_push_preferences(user_id,push_enabled,match_alerts,request_alerts,message_alerts,market_alerts)
 values(auth.uid(),false,coalesce(p_matches,false),coalesce(p_requests,false),coalesce(p_messages,false),coalesce(p_market,false))
 on conflict(user_id) do update set match_alerts=excluded.match_alerts,request_alerts=excluded.request_alerts,
 message_alerts=excluded.message_alerts,market_alerts=excluded.market_alerts,updated_at=now();
 return true;
end $$;
revoke all on function public.ff_push_device_status(text),public.ff_push_enroll_device(text,boolean,boolean,boolean,boolean),
 public.ff_push_update_categories(boolean,boolean,boolean,boolean) from public,anon,authenticated;
grant execute on function public.ff_push_device_status(text),public.ff_push_enroll_device(text,boolean,boolean,boolean,boolean),
 public.ff_push_update_categories(boolean,boolean,boolean,boolean) to authenticated;
-- Retire unused old registration RPCs (including the overload lacking explicit consent).
revoke execute on function public.ff_push_register(text),public.ff_push_register(text,boolean) from public,anon,authenticated;

create or replace function private.ff_queue_push()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid; k text; nid uuid; lid uuid; ls text;
begin
 if not exists(select 1 from private.ff_push_runtime where singleton and enabled) then return new;end if;
 if TG_TABLE_NAME='ff_notifications' then
   u:=new.user_id;k:=new.kind;nid:=new.id;
 elsif TG_TABLE_NAME='ff_market_listings' then
   if old.moderation_status is distinct from 'pending' or new.moderation_status not in ('approved','rejected') then return new;end if;
   u:=new.seller_id;k:='market';lid:=new.id;ls:=new.moderation_status;
 else return new;end if;
 if not private.is_active_adult(u) then return new;end if;
 if not exists(select 1 from private.ff_push_preferences p where p.user_id=u and p.push_enabled
  and case k when 'match' then p.match_alerts when 'request' then p.request_alerts when 'message' then p.message_alerts when 'market' then p.market_alerts else false end)
 or not exists(select 1 from private.ff_push_devices d where d.user_id=u) then return new;end if;
 -- No text, names, photos, or exact locations are copied into push events.
 insert into private.ff_push_queue(user_id,kind,notification_id,listing_id,listing_status) values(u,k,nid,lid,ls);
 return new;
end $$;
revoke all on function private.ff_queue_push() from public,anon,authenticated,service_role;
drop trigger if exists ff_push_on_inbox on public.ff_notifications;
create trigger ff_push_on_inbox after insert on public.ff_notifications for each row execute function private.ff_queue_push();
drop trigger if exists ff_push_on_market on public.ff_market_listings;
create trigger ff_push_on_market after update of moderation_status on public.ff_market_listings for each row execute function private.ff_queue_push();

-- Fixed Expo endpoints, no dynamic user URL. Requires operator-managed Expo access token in Vault
-- named ff_expo_push_access_token, and explicit activation after APNs/FCM device tests.
create or replace function private.ff_push_tick()
returns void language plpgsql security definer set search_path='' as $$
declare key text; hdr jsonb; r record; response jsonb; item jsonb; req bigint; failure text; done_count int:=0;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('ff_push_tick',0)) then return;end if;
 delete from private.ff_push_queue where created_at<now()-interval '5 minutes';
 delete from private.ff_push_attempts where created_at<now()-interval '3 days';
 if not exists(select 1 from private.ff_push_runtime where singleton and enabled) then return;end if;
 select decrypted_secret into key from vault.decrypted_secrets where name='ff_expo_push_access_token' limit 1;
 if key is null or length(key)<10 then return;end if;
 hdr:=jsonb_build_object('Content-Type','application/json','Accept','application/json','Authorization','Bearer '||key);
 -- Process tickets and receipts; do not retry ambiguous pushes (avoid duplicates).
 for r in select a.*,h.status_code,h.content,h.timed_out from private.ff_push_attempts a
 left join net._http_response h on h.id=a.request_id
 where a.stage in ('ticket','receipt') and (h.id is not null or a.next_check<now()-interval '5 minutes')
 order by a.next_check limit 100
 loop
  response:=null;item:=null;
  if r.status_code=200 and not coalesce(r.timed_out,false) then
   begin response:=r.content::jsonb; exception when others then response:=null;end;
  end if;
  if r.stage='ticket' then item:=response->'data';
  else item:=response->'data'->r.ticket_id;end if;
  failure:=item->'details'->>'error';
  if failure='DeviceNotRegistered' then
    delete from private.ff_push_devices d where d.expo_token=r.expo_token and d.user_id=r.user_id and d.updated_at=r.device_updated_at;
  end if;
  if r.stage='ticket' and item->>'status'='ok' and length(coalesce(item->>'id','')) between 1 and 150 then
    update private.ff_push_attempts set stage='waiting',ticket_id=item->>'id',next_check=now()+interval '15 minutes' where request_id=r.request_id;
  elsif r.stage='receipt' and item is null and r.created_at>now()-interval '23 hours' then
    update private.ff_push_attempts set stage='waiting',next_check=now()+interval '15 minutes' where request_id=r.request_id;
  else
    update private.ff_push_attempts set stage='done',status=case when item->>'status'='ok' then 'accepted' when failure='DeviceNotRegistered' then 'unregistered' else 'unknown_or_error' end where request_id=r.request_id;
  end if;
 end loop;
 for r in select * from private.ff_push_attempts where stage='waiting' and next_check<=now() order by next_check limit 50 loop
  select net.http_post(url:='https://exp.host/--/api/v2/push/getReceipts',headers:=hdr,
   body:=jsonb_build_object('ids',jsonb_build_array(r.ticket_id)),timeout_milliseconds:=10000) into req;
  update private.ff_push_attempts set request_id=req,stage='receipt',next_check=now() where request_id=r.request_id;
 end loop;
 -- One neutral signal per user per minute; recheck device ownership, consent, blocks and status.
 for r in select q.user_id,max(q.created_at) as newest
 from private.ff_push_queue q group by q.user_id order by max(q.created_at) limit 15
 loop
  if exists(
   select 1 from private.ff_push_queue q join private.ff_push_preferences p on p.user_id=q.user_id
   where q.user_id=r.user_id and q.created_at<=r.newest and p.push_enabled and private.is_active_adult(q.user_id)
   and case q.kind when 'match' then p.match_alerts when 'request' then p.request_alerts when 'message' then p.message_alerts when 'market' then p.market_alerts else false end
   and ( (q.kind='market' and exists(select 1 from public.ff_market_listings l where l.id=q.listing_id and l.seller_id=q.user_id and l.moderation_status=q.listing_status))
     or (q.kind<>'market' and exists(select 1 from public.ff_notifications n join public.contact_requests c on c.id=n.contact_id
     where n.id=q.notification_id and n.user_id=q.user_id and n.read_at is null and private.not_blocked(n.user_id,n.actor_id)
     and private.is_active_adult(n.actor_id) and ((n.kind='request' and c.status='pending') or (n.kind in ('match','message') and c.status='accepted')))))
  ) then
   insert into private.ff_push_attempts(request_id,user_id,expo_token,device_updated_at,stage)
   select net.http_post(url:='https://exp.host/--/api/v2/push/send',headers:=hdr,
      body:=jsonb_build_object('to',d.expo_token,'title','Familienfunke','body','Du hast Neuigkeiten in der App.','channelId','familienfunke','ttl',300),
      timeout_milliseconds:=10000),d.user_id,d.expo_token,d.updated_at,'ticket'
   from private.ff_push_devices d where d.user_id=r.user_id and d.updated_at<=r.newest
    and not exists(select 1 from private.ff_push_attempts a where a.expo_token=d.expo_token and a.user_id=d.user_id and a.created_at>now()-interval '1 minute')
   order by d.updated_at desc limit 3;
  end if;
  delete from private.ff_push_queue where user_id=r.user_id and created_at<=r.newest;
 end loop;
end $$;
revoke all on function private.ff_push_tick() from public,anon,authenticated,service_role;
select cron.schedule('ff_private_push_tick','* * * * *',$job$select private.ff_push_tick();$job$);
