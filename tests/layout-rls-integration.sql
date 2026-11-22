-- Never run against production.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
insert into public.ff_layout_preferences values (auth.uid(),array['play'],array['home','play'],1);
do $ff_test$ begin
 if (select count(*) from public.ff_layout_preferences)<>1 then raise exception 'Own row missing'; end if;
 begin
  insert into public.ff_layout_preferences values ('00000000-0000-4000-8000-000000000002',array['map'],array['home'],1);
  raise exception 'Cross-account insert succeeded';
 exception when insufficient_privilege then null; end;
 begin
  update public.ff_layout_preferences set user_id='00000000-0000-4000-8000-000000000002';
  raise exception 'Ownership mutation succeeded';
 exception when insufficient_privilege then null; end;
 begin
  update public.ff_layout_preferences set home=array['secret'],revision=2;
  raise exception 'Invalid page accepted';
 exception when check_violation then null; end;
 begin
  update public.ff_layout_preferences set bottom=array['play'],revision=2;
  raise exception 'Home was removed';
 exception when check_violation then null; end;
 begin
  update public.ff_layout_preferences set bottom=array['home','play','play'],revision=2;
  raise exception 'Duplicate page accepted';
 exception when check_violation then null; end;
 begin
  update public.ff_layout_preferences set revision=99;
  raise exception 'Invalid revision accepted';
 exception when check_violation then null; end;
end; $ff_test$;
update public.ff_layout_preferences set home=array[]::text[],revision=2 where user_id=auth.uid() and revision=1;
do $ff_test$ declare n integer; begin
 update public.ff_layout_preferences set home=array['map'],revision=2 where user_id=auth.uid() and revision=1;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Stale write succeeded'; end if;
 if (select revision from public.ff_layout_preferences)<>2 then raise exception 'Revision not advanced'; end if;
end; $ff_test$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $ff_test$ declare n integer; begin
 if exists(select 1 from public.ff_layout_preferences) then raise exception 'Other account can read'; end if;
 update public.ff_layout_preferences set home=array['map'],revision=3;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Other account can update'; end if;
end; $ff_test$;
insert into public.ff_layout_preferences values (auth.uid(),array['market'],array['home','market'],1);
do $ff_test$ begin
 if (select count(*) from public.ff_layout_preferences)<>1 then raise exception 'Account isolation failed'; end if;
end; $ff_test$;
reset role;
set local role anon;
do $ff_test$ begin
 begin
  perform 1 from public.ff_layout_preferences;
  raise exception 'Anonymous access succeeded';
 exception when insufficient_privilege then null; end;
end; $ff_test$;
reset role;
delete from auth.users where id='00000000-0000-4000-8000-000000000001';
do $ff_test$ begin
 if exists(select 1 from public.ff_layout_preferences where user_id='00000000-0000-4000-8000-000000000001') then raise exception 'Account deletion cascade failed'; end if;
 if (select count(*) from public.ff_layout_preferences)<>1 then raise exception 'Unexpected deletion'; end if;
end; $ff_test$;
rollback;
