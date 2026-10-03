-- Hybrid.App V1 hardening migration
-- Run in Supabase SQL editor after reviewing against your existing schema.

create extension if not exists pgcrypto;

-- Profiles: server-enforced privacy and product preferences
alter table if exists public.profiles
  add column if not exists show_profile boolean not null default true,
  add column if not exists show_activities boolean not null default true,
  add column if not exists show_ranking boolean not null default true,
  add column if not exists show_body_metrics boolean not null default false,
  add column if not exists bio text,
  add column if not exists fitness_level text,
  add column if not exists hybrid_score integer not null default 0;

-- Activities: distinguish creation time from the real workout time.
alter table if exists public.activities
  add column if not exists performed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists title text,
  add column if not exists notes text,
  add column if not exists rpe smallint check (rpe between 1 and 10),
  add column if not exists mood smallint check (mood between 1 and 5),
  add column if not exists visibility text not null default 'public' check (visibility in ('public','followers','private')),
  add column if not exists source text not null default 'manual' check (source in ('manual','gps','garmin','apple_health','health_connect','strava')),
  add column if not exists source_external_id text,
  add column if not exists is_verified boolean not null default false;

update public.activities set performed_at = coalesce(performed_at, created_at, now()) where performed_at is null;
alter table if exists public.activities alter column performed_at set not null;
create unique index if not exists activities_source_external_unique on public.activities(user_id, source, source_external_id) where source_external_id is not null;
create index if not exists activities_user_performed_idx on public.activities(user_id, performed_at desc);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications jsonb not null default '{"new_challenges":true,"friend_activity":true,"reminders":false,"weekly_summary":true}'::jsonb,
  onboarding_goal text,
  updated_at timestamptz not null default now()
);

create table if not exists public.connected_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('garmin','apple_health','health_connect','strava')),
  provider_user_id text,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  avatar_url text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.club_members (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check(role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key(club_id,user_id)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false
);

-- RLS
alter table if exists public.activities enable row level security;
alter table if exists public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.connected_sources enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

-- Own activity CRUD.
drop policy if exists "activities own select" on public.activities;
create policy "activities own select" on public.activities for select using (auth.uid() = user_id);
drop policy if exists "activities own insert" on public.activities;
create policy "activities own insert" on public.activities for insert with check (auth.uid() = user_id);
drop policy if exists "activities own update" on public.activities;
create policy "activities own update" on public.activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "activities own delete" on public.activities;
create policy "activities own delete" on public.activities for delete using (auth.uid() = user_id);

-- Public/follower activity visibility is enforced by the database, not only the UI.
drop policy if exists "activities visible to others" on public.activities;
create policy "activities visible to others" on public.activities for select using (
  auth.uid() <> user_id
  and exists(select 1 from public.profiles p where p.id = activities.user_id and p.show_profile = true and p.show_activities = true)
  and (
    visibility = 'public'
    or (visibility = 'followers' and exists(
      select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = activities.user_id
    ))
  )
);

-- Profiles: owner always sees own row; others only when public.
drop policy if exists "profiles visible" on public.profiles;
create policy "profiles visible" on public.profiles for select using (auth.uid() = id or show_profile = true);
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "preferences owner all" on public.user_preferences;
create policy "preferences owner all" on public.user_preferences for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "sources owner all" on public.connected_sources;
create policy "sources owner all" on public.connected_sources for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "clubs readable" on public.clubs;
create policy "clubs readable" on public.clubs for select using(true);
drop policy if exists "club members readable" on public.club_members;
create policy "club members readable" on public.club_members for select using(true);
drop policy if exists "club members self join" on public.club_members;
create policy "club members self join" on public.club_members for insert with check(auth.uid()=user_id);
drop policy if exists "club members self leave" on public.club_members;
create policy "club members self leave" on public.club_members for delete using(auth.uid()=user_id);

-- Secure self-service account deletion. Review in your project before enabling.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- New-user trigger: copy signup metadata into the profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, username, favorite_sports, created_at)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1)),
    coalesce(array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'favorite_sports','[]'::jsonb))), array[]::text[]),
    now()
  )
  on conflict(id) do update set
    username = excluded.username,
    favorite_sports = excluded.favorite_sports;

  insert into public.user_preferences(user_id, onboarding_goal)
  values(new.id, nullif(new.raw_user_meta_data->>'onboarding_goal',''))
  on conflict(user_id) do update set onboarding_goal = excluded.onboarding_goal;
  return new;
end;
$$;

-- Hybrid Score: server-side source of truth. Manual activities are useful but
-- receive 65% weight; verified connected/GPS activities receive 100%.
create or replace function public.calculate_hybrid_score(target_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
with a as (
  select *, case when is_verified then 1.0 else 0.65 end as w
  from public.activities
  where user_id = target_user and performed_at >= now() - interval '90 days'
), parts as (
  select
    least(100.0,
      coalesce(sum(case when sport_type in ('running','cycling','swimming','hiking')
        then (coalesce(nullif(metrics->>'distance_m','')::numeric,0) / 1000.0 * 1.2 + 2.0) * w else 0 end),0)
    ) as endurance,
    least(100.0, coalesce(sum(case when sport_type='gym' then 6.0*w else 0 end),0)) as strength,
    least(100.0, coalesce(sum(case when sport_type='running' then
      (case when coalesce(nullif(metrics->>'distance_m','')::numeric,0) > 0
             and duration_seconds / (nullif(metrics->>'distance_m','')::numeric/1000.0) < 330
        then 6.0 else 2.0 end) * w else 0 end),0)) as speed,
    least(100.0, count(distinct performed_at::date)::numeric / 45.0 * 100.0) as consistency,
    least(100.0, count(distinct sport_type)::numeric / 7.0 * 100.0) as versatility,
    greatest(0.0, least(100.0, 50.0 + 5.0 * (
      coalesce(sum(case when performed_at >= now()-interval '30 days' then w else 0 end),0)
      - coalesce(sum(case when performed_at < now()-interval '30 days' and performed_at >= now()-interval '60 days' then w else 0 end),0)
    ))) as progression
  from a
)
select round((endurance*.20 + strength*.20 + speed*.15 + consistency*.20 + versatility*.15 + progression*.10) * 10)::integer
from parts;
$$;

create or replace function public.refresh_hybrid_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid;
begin
  uid := coalesce(new.user_id, old.user_id);
  update public.profiles set hybrid_score = public.calculate_hybrid_score(uid) where id = uid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists activities_refresh_hybrid_score on public.activities;
create trigger activities_refresh_hybrid_score
after insert or update or delete on public.activities
for each row execute function public.refresh_hybrid_score();

-- Club ranking derived from current member scores.
create or replace view public.club_leaderboard as
select c.id, c.name, c.slug, c.avatar_url,
       count(cm.user_id)::integer as member_count,
       coalesce(sum(case when p.show_ranking then p.hybrid_score else 0 end),0)::bigint as total_points
from public.clubs c
left join public.club_members cm on cm.club_id=c.id
left join public.profiles p on p.id=cm.user_id
group by c.id;

-- Sensitive profile columns are not readable through normal public profile queries.
-- The owner gets the complete row through a SECURITY DEFINER RPC.
create or replace function public.get_my_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$ select p from public.profiles p where p.id = auth.uid(); $$;
revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- Keep public/social reads limited to non-sensitive columns. If your project has
-- custom grants already, review these statements before applying.
revoke select on public.profiles from anon, authenticated;
grant select (id, username, avatar_url, is_pro, hybrid_score, created_at, favorite_sports, bio, fitness_level, show_profile, show_activities, show_ranking, show_body_metrics)
on public.profiles to anon, authenticated;

create unique index if not exists profiles_username_lower_unique on public.profiles(lower(username));

-- Body metrics are owner-only unless the profile explicitly opts in.
alter table if exists public.body_logs enable row level security;
drop policy if exists "body logs owner all" on public.body_logs;
create policy "body logs owner all" on public.body_logs for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "body logs shared when enabled" on public.body_logs;
create policy "body logs shared when enabled" on public.body_logs for select
using (
  auth.uid() <> user_id
  and exists(select 1 from public.profiles p where p.id=body_logs.user_id and p.show_profile=true and p.show_body_metrics=true)
);


-- Privacy-safe username availability check used during registration.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles p
    where lower(p.username) = lower(trim(candidate))
  );
$$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;


-- Ensure signup metadata is copied into profile/preferences.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
