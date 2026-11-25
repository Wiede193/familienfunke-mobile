-- STAGING PROPOSAL. Apply only in an isolated test database until acceptance.
begin;
create table public.ff_tv_creators (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
 channel_url text not null check (channel_url ~ '^https://www\.youtube\.com/(@[A-Za-z0-9_.-]+|channel/[A-Za-z0-9_-]+)$' and char_length(channel_url)<=200),
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.ff_tv_submissions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.ff_tv_creators(owner_id) on delete cascade,
 video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
 title text not null check (char_length(btrim(title)) between 3 and 140),
 category text not null check (category in ('Lesen & Lernen','Medien & Alltag','Familienküche','Erziehung & Alltag','Ausflüge & Freizeit','Kreativwerkstatt','Sport & Bewegung','Produkte im Test')),
 description text not null default '' check (char_length(description)<=500),
 rights_declared boolean not null check (rights_declared),
 commercial boolean not null default false,
 state text not null default 'pending' check (state in ('pending','approved','rejected','withdrawn')),
 created_at timestamptz not null default now(),
 unique(owner_id,video_id)
);
-- Public-facing data is a separate projection. Never expose owner_id or private notes.
create table public.ff_tv_public_videos (
 video_id text primary key check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
 submission_id uuid not null unique references public.ff_tv_submissions(id) on delete cascade,
 title text not null,
 category text not null,
 description text not null,
 creator_name text not null,
 channel_url text not null,
 commercial boolean not null,
 published_at timestamptz not null default now()
);
alter table public.ff_tv_creators enable row level security;
alter table public.ff_tv_submissions enable row level security;
alter table public.ff_tv_public_videos enable row level security;
revoke all on public.ff_tv_creators,public.ff_tv_submissions,public.ff_tv_public_videos from public,anon,authenticated;
grant select on public.ff_tv_creators,public.ff_tv_submissions to authenticated;
grant insert(video_id,title,category,description,rights_declared,commercial) on public.ff_tv_submissions to authenticated;
grant select(video_id,title,category,description,creator_name,channel_url,commercial,published_at) on public.ff_tv_public_videos to authenticated;
grant select,insert,update,delete on public.ff_tv_creators,public.ff_tv_submissions,public.ff_tv_public_videos to service_role;
create policy ff_tv_creator_own on public.ff_tv_creators for select to authenticated using (owner_id=(select auth.uid()));
create policy ff_tv_submission_own on public.ff_tv_submissions for select to authenticated using (owner_id=(select auth.uid()));
create policy ff_tv_submission_create on public.ff_tv_submissions for insert to authenticated with check (
 owner_id=(select auth.uid()) and state='pending' and rights_declared
 and exists(select 1 from public.ff_tv_creators c where c.owner_id=(select auth.uid()) and c.active)
);
create policy ff_tv_published_read on public.ff_tv_public_videos for select to authenticated using (true);
-- Serialize moderation for a submission and require all explicit checks.
-- Invoker: only the trusted operator role may execute, never a mobile client.
create function public.ff_tv_review(p_id uuid,p_approve boolean,p_rights_checked boolean,p_content_checked boolean,p_embeddable_checked boolean,p_audience_checked boolean,p_commercial_checked boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare v public.ff_tv_submissions%rowtype; c public.ff_tv_creators%rowtype;
begin
 select * into v from public.ff_tv_submissions where id=p_id for update;
 if not found or v.state<>'pending' then raise exception 'Not a pending submission'; end if;
 if p_approve is true then
  if not (p_rights_checked is true and p_content_checked is true and p_embeddable_checked is true and p_audience_checked is true and p_commercial_checked is true) then raise exception 'Review incomplete'; end if;
  select * into c from public.ff_tv_creators where owner_id=v.owner_id and active for share;
  if not found then raise exception 'Creator inactive'; end if;
  insert into public.ff_tv_public_videos(video_id,submission_id,title,category,description,creator_name,channel_url,commercial)
    values(v.video_id,v.id,v.title,v.category,v.description,c.display_name,c.channel_url,v.commercial);
  update public.ff_tv_submissions set state='approved' where id=v.id;
 elsif p_approve is false then
  update public.ff_tv_submissions set state='rejected' where id=v.id;
 else raise exception 'Missing decision'; end if;
end $$;
revoke all on function public.ff_tv_review(uuid,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon,authenticated;
grant execute on function public.ff_tv_review(uuid,boolean,boolean,boolean,boolean,boolean,boolean) to service_role;
-- Deactivation must also remove the creator's published entries in one transaction.
create function public.ff_tv_deactivate(p_owner uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.ff_tv_creators set active=false where owner_id=p_owner;
 delete from public.ff_tv_public_videos p using public.ff_tv_submissions s where p.submission_id=s.id and s.owner_id=p_owner;
 update public.ff_tv_submissions set state='withdrawn' where owner_id=p_owner and state in ('approved','pending');
end $$;
revoke all on function public.ff_tv_deactivate(uuid) from public,anon,authenticated;
grant execute on function public.ff_tv_deactivate(uuid) to service_role;
commit;
