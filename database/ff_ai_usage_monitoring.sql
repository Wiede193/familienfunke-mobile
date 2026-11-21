-- Aggregate measured token use, with no prompts, request IDs or user IDs.
create table if not exists private.ff_ai_usage_daily(
 utc_day date not null, service text not null, model text not null,
 attempts bigint not null default 0, measured bigint not null default 0,
 input_tokens bigint not null default 0, output_tokens bigint not null default 0,
 cached_tokens bigint not null default 0, estimated_usd numeric(18,8) not null default 0,
 primary key(utc_day,service,model)
);
alter table private.ff_ai_usage_daily enable row level security;
revoke all on private.ff_ai_usage_daily from public,anon,authenticated,service_role;
-- USD per million tokens, standard list rates checked 2026-11-21.
create or replace function public.ff_ai_usage_record(p_day date,p_service text,p_model text,p_stage text,
 p_input integer default 0,p_output integer default 0,p_cached integer default 0)
returns boolean language plpgsql security definer set search_path='' as $$
declare d date:=(now() at time zone 'UTC')::date;
 i numeric; o numeric; c numeric; cost numeric:=0;
begin
 if p_day is null or p_day not between d-1 and d or p_service is null
 or p_service not in ('assistant','scan','market_review') or p_model is null
 or p_stage is null or p_stage not in ('attempt','measured') then return false;end if;
 case p_model
 when 'gpt-4o-mini' then i:=0.15;o:=0.60;c:=0.075;
 when 'gpt-4o' then i:=2.50;o:=10;c:=1.25;
 else return false;
 end case;
 if p_stage='attempt' then
  insert into private.ff_ai_usage_daily(utc_day,service,model,attempts)
  values(p_day,p_service,p_model,1)
  on conflict(utc_day,service,model) do update set attempts=private.ff_ai_usage_daily.attempts+1;
 else
  if p_input is null or p_output is null or p_cached is null or p_input not between 0 and 128000
   or p_output not between 0 and 16384 or p_cached not between 0 and p_input
   or p_input+p_output=0 then return false;end if;
  cost:=((p_input-p_cached)*i+p_cached*c+p_output*o)/1000000;
  update private.ff_ai_usage_daily set measured=measured+1,input_tokens=input_tokens+p_input,
   output_tokens=output_tokens+p_output,cached_tokens=cached_tokens+p_cached,
   estimated_usd=estimated_usd+cost
   where utc_day=p_day and service=p_service and model=p_model and measured<attempts;
  if not found then return false;end if;
 end if;
 delete from private.ff_ai_usage_daily where utc_day<d-90;
 return true;
end $$;
revoke all on function public.ff_ai_usage_record(date,text,text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.ff_ai_usage_record(date,text,text,text,integer,integer,integer) to service_role;

create or replace function public.ff_admin_ai_usage()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare d date:=(now() at time zone 'UTC')::date;
begin
 if not private.ff_admin_mfa_ok() or coalesce(auth.jwt()->>'aal','')<>'aal2'
 or not exists(select 1 from private.admin_staff s where s.user_id=auth.uid() and s.is_active and s.role='owner')
 or not exists(select 1 from private.ff_admin_mfa_required m where m.user_id=auth.uid())
 then raise exception 'Geschützte Betreiberberechtigung erforderlich' using errcode='42501';end if;
 return jsonb_build_object('utc_day',d,'tracking_since','2026-11-21',
 'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.utc_day desc,x.service,x.model)
 from private.ff_ai_usage_daily x where x.utc_day>=d-29),'[]'::jsonb),
 'quotas',jsonb_build_array(
 jsonb_build_object('service','assistant','used',coalesce((select used from private.ff_app_assistant_quota where utc_day=d and scope='global'),0),'limit',500),
 jsonb_build_object('service','scan','used',coalesce((select used from private.ff_market_scan_quota where utc_day=d and scope='global'),0),'limit',300),
 jsonb_build_object('service','market_review','used',coalesce((select used from private.ff_moderation_limits where service='market_review' and scope='global' and window_kind='day' and window_start=date_trunc('day',now(),'UTC')),0),'limit',300),
 jsonb_build_object('service','text','used',coalesce((select used from private.ff_moderation_limits where service='text' and scope='global' and window_kind='day' and window_start=date_trunc('day',now(),'UTC')),0),'limit',4000),
 jsonb_build_object('service','photo','used',coalesce((select used from private.ff_moderation_limits where service='photo' and scope='global' and window_kind='day' and window_start=date_trunc('day',now(),'UTC')),0),'limit',300)
 ));
end $$;
revoke all on function public.ff_admin_ai_usage() from public,anon,authenticated;
grant execute on function public.ff_admin_ai_usage() to authenticated;
