-- Recent discoverable adults are the only profiles queried at app startup.
-- The authenticated user's own profile is fetched by primary key separately.
create index if not exists ff_launch_discoverable_profiles_recent
on public.profiles(created_at desc,user_id)
where is_discoverable = true and moderation_status = 'approved';
