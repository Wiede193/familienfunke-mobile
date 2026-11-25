-- Standalone PostgreSQL test fixture; NOT a production database script.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,service_role,anon;
grant execute on function auth.uid() to authenticated,service_role,anon;
\ir ../database/ff_tv_creator_staging.sql
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.ff_tv_creators(owner_id,display_name,channel_url,active) values ('00000000-0000-0000-0000-000000000001','Demo Creator','https://www.youtube.com/@example',true);
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
insert into public.ff_tv_submissions(video_id,title,category,rights_declared) values ('abcdefghijk','Test video','Familienküche',true);
do $$begin
 if (select count(*) from public.ff_tv_submissions)<>1 then raise exception 'Own submission not visible'; end if;
 if (select count(video_id) from public.ff_tv_public_videos)<>0 then raise exception 'Unreviewed publication'; end if;
 begin
  update public.ff_tv_creators set active=false;
  raise exception 'Creator may update verification';
 exception when insufficient_privilege then null; end;
 begin
  update public.ff_tv_submissions set state='approved';
  raise exception 'Creator may self-approve';
 exception when insufficient_privilege then null; end;
 begin
  perform public.ff_tv_review((select id from public.ff_tv_submissions limit 1),true,true,true,true,true,true);
  raise exception 'Creator may call privileged review';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.ff_tv_submissions(owner_id,video_id,title,category,rights_declared) values ('00000000-0000-0000-0000-000000000002','bcdefghijkl','Forbidden','Familienküche',true);
  raise exception 'Can forge owner';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if exists(select 1 from public.ff_tv_submissions) or exists(select 1 from public.ff_tv_creators) then raise exception 'Private data leaked'; end if;
 begin
  insert into public.ff_tv_submissions(video_id,title,category,rights_declared) values ('bcdefghijkl','Forbidden','Familienküche',true);
  raise exception 'Unverified creator can submit';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
set role service_role;
do $$begin
 begin
  perform public.ff_tv_review((select id from public.ff_tv_submissions limit 1),true,true,true,true,false,true);
  raise exception 'Review unexpectedly passed';
 exception when raise_exception then
  if sqlerrm<>'Review incomplete' then raise; end if;
 end;
end$$;
select public.ff_tv_review((select id from public.ff_tv_submissions limit 1),true,true,true,true,true,true);
reset role;
set role authenticated;
do $$begin
 if (select count(video_id) from public.ff_tv_public_videos)<>1 then raise exception 'Approved item not public'; end if;
 begin
  perform submission_id from public.ff_tv_public_videos;
  raise exception 'Private ID leaked';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
set role service_role;
select public.ff_tv_deactivate('00000000-0000-0000-0000-000000000001');
reset role;
set role authenticated;
do $$begin
 if (select count(video_id) from public.ff_tv_public_videos)<>0 then raise exception 'Deactivated video still public'; end if;
end$$;
reset role;
set role anon;
do $$begin
 begin
  perform video_id from public.ff_tv_public_videos;
  raise exception 'Anonymous access';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
select 'Creator permissions and publication lifecycle passed' as result;
