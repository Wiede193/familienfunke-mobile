-- Familienrelevante Beschlüsse: konkrete Sachgebiete, belegter Verfahrensstand
-- und individuelle THEMENauswahl ohne Zugriff auf fremde Konten.
alter table public.ff_official_decisions
 add column if not exists family_topic text not null default 'weitere',
 add column if not exists decision_date date,
 add column if not exists status_checked_at timestamptz;
alter table public.ff_official_decisions
 drop constraint if exists ff_official_decisions_family_topic_check;
alter table public.ff_official_decisions
 add constraint ff_official_decisions_family_topic_check
 check (family_topic in ('kindergeld','elterngeld','kita','schule','wohnen','gesundheit','familienrecht','leistungen','freizeit','weitere'));
alter table public.ff_official_decisions
 drop constraint if exists ff_official_decisions_decision_status_check;
alter table public.ff_official_decisions
 add constraint ff_official_decisions_decision_status_check
 check (decision_status in ('kabinett','parlament','vermittlung','vereinbarung','verkuendet','inkraft','unklar'));
update public.ff_official_decisions
 set family_topic='freizeit'
 where family_topic='weitere' and title ilike '%bibliothek%';
create unique index if not exists ff_official_decisions_source_url_unique
 on public.ff_official_decisions(source_url);
create index if not exists ff_official_decisions_topic_recent
 on public.ff_official_decisions(family_topic,published_at desc) where published=true;

alter table public.ff_decision_subscriptions
 add column if not exists topics text[] not null default '{}'::text[];
alter table public.ff_decision_subscriptions drop constraint if exists ff_decision_subscriptions_topics_check;
alter table public.ff_decision_subscriptions add constraint ff_decision_subscriptions_topics_check
 check (cardinality(topics)<=10 and
  topics <@ array['kindergeld','elterngeld','kita','schule','wohnen','gesundheit','familienrecht','leistungen','freizeit','weitere']::text[]
  and array_position(topics,null) is null
 );

create or replace function private.ff_decision_publish_notice()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.published and (tg_op='INSERT' or not old.published) then
  insert into public.ff_notifications(user_id,kind,decision_id)
  select s.user_id,'decision',new.id from public.ff_decision_subscriptions s
  where s.enabled=true and (cardinality(s.topics)=0 or new.family_topic=any(s.topics))
  on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function private.ff_decision_publish_notice() from public,anon,authenticated;
