-- =============================================================
-- Hybrid.App — Script combiné V1 → V15
-- Coller dans Supabase Dashboard > SQL Editor
-- Toutes les requêtes sont idempotentes (IF NOT EXISTS / IF EXISTS)
-- =============================================================


-- ----------------------------------------------------------------
-- MIGRATION: 20260929100000_hybrid_v1.sql
-- ----------------------------------------------------------------
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
  add column if not exists hybrid_score integer not null default 0,
  add column if not exists is_pro boolean not null default false,
  add column if not exists favorite_sports text[] not null default '{}'::text[],
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now();

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
alter table public.clubs add column if not exists slug text;
alter table public.clubs add column if not exists description text;
alter table public.clubs add column if not exists avatar_url text;
alter table public.clubs add column if not exists owner_id uuid references auth.users(id) on delete set null;
create unique index if not exists clubs_slug_unique on public.clubs(slug) where slug is not null;
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
      coalesce(sum(case when sport_type::text in ('running','cycling','swimming','hiking')
        then (coalesce(nullif(metrics->>'distance_m','')::numeric,0) / 1000.0 * 1.2 + 2.0) * w else 0 end),0)
    ) as endurance,
    least(100.0, coalesce(sum(case when sport_type::text='gym' then 6.0*w else 0 end),0)) as strength,
    least(100.0, coalesce(sum(case when sport_type::text='running' then
      (case when coalesce(nullif(metrics->>'distance_m','')::numeric,0) > 0
             and duration_seconds / (nullif(metrics->>'distance_m','')::numeric/1000.0) < 330
        then 6.0 else 2.0 end) * w else 0 end),0)) as speed,
    least(100.0, count(distinct performed_at::date)::numeric / 45.0 * 100.0) as consistency,
    least(100.0, count(distinct sport_type::text)::numeric / 7.0 * 100.0) as versatility,
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


-- ----------------------------------------------------------------
-- MIGRATION: 20260929110000_multisport_v2.sql
-- ----------------------------------------------------------------
-- Hybrid.App Multisport v2
-- The existing favorite_sports text[] and activities.sport_type text fields already support
-- the expanded catalogue without a schema migration. This migration upgrades the score formula
-- so every sport family contributes instead of only the original eleven sports.

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
  where user_id=target_user and performed_at>=now()-interval '90 days'
), tagged as (
  select *, case
    when sport_type::text in ('running','trail_running','walking','nordic_walking','hiking','obstacle_course','triathlon','duathlon','cycling','mountain_biking','gravel_cycling','track_cycling','cyclocross','indoor_cycling','swimming','open_water_swimming','rowing','kayaking','canoeing','stand_up_paddle','cross_country_skiing','biathlon') then 'endurance'
    when sport_type::text in ('gym','bodybuilding','powerlifting','weightlifting','crossfit','calisthenics','functional_training','circuit_training','kettlebell','strongman','climbing','bouldering','boxing','kickboxing','muay_thai','mma','judo','bjj','karate','taekwondo','wrestling') then 'strength'
    else 'skill'
  end as bucket
  from a
), parts as (
 select
   least(100.0,coalesce(sum(case when bucket='endurance' then (2.0+least(6.0,coalesce(nullif(metrics->>'distance_m','')::numeric,0)/1000.0*.45))*w else 0 end),0)) endurance,
   least(100.0,coalesce(sum(case when bucket='strength' then (4.0+least(5.0,coalesce(nullif(metrics->>'total_volume_kg','')::numeric,0)/2500.0))*w else 0 end),0)) strength,
   least(100.0,coalesce(sum(case when sport_type::text in ('running','trail_running','athletics','tennis','badminton','padel','table_tennis','squash','football','futsal','basketball','rugby','boxing','kickboxing','mma','fencing') then (case when coalesce(rpe,0)>=7 then 4.0 else 2.5 end)*w else 0 end),0)) speed,
   least(100.0,count(distinct performed_at::date)::numeric/45.0*100.0) consistency,
   least(100.0,count(distinct sport_type::text)::numeric/10.0*100.0) versatility,
   greatest(0.0,least(100.0,50.0+5.0*(coalesce(sum(case when performed_at>=now()-interval '30 days' then w else 0 end),0)-coalesce(sum(case when performed_at<now()-interval '30 days' and performed_at>=now()-interval '60 days' then w else 0 end),0)))) progression
 from tagged
)
select round((endurance*.20+strength*.20+speed*.15+consistency*.20+versatility*.15+progression*.10)*10)::integer from parts;
$$;


-- ----------------------------------------------------------------
-- MIGRATION: 20260930100000_v4_ultimate.sql
-- ----------------------------------------------------------------
-- Hybrid.App V4 Ultimate foundations
-- Run after the V1 + multisport V2 migrations in a development Supabase project first.

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Hybrid Live
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.live_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport_type text not null,
  status text not null default 'live' check (status in ('live','paused','finished')),
  visibility text not null default 'followers' check (visibility in ('public','followers','private')),
  share_location boolean not null default true,
  hide_start_end boolean not null default true,
  delayed_minutes integer not null default 5 check (delayed_minutes between 0 and 60),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  distance_km numeric(10,3) not null default 0,
  pace_seconds_per_km integer,
  heart_rate integer,
  elevation_m integer,
  current_track jsonb,
  last_lat double precision,
  last_lng double precision,
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists live_activities_user_status_idx on public.live_activities(user_id,status);
create index if not exists live_activities_status_started_idx on public.live_activities(status,started_at desc);

create table if not exists public.live_points (
  id bigserial primary key,
  live_activity_id uuid not null references public.live_activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  altitude_m numeric,
  heart_rate integer,
  speed_mps numeric,
  distance_km numeric(10,3),
  recorded_at timestamptz not null default now()
);
create index if not exists live_points_activity_time_idx on public.live_points(live_activity_id,recorded_at);

create table if not exists public.live_notes (
  id uuid primary key default gen_random_uuid(),
  live_activity_id uuid not null references public.live_activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  at_seconds integer not null default 0,
  distance_km numeric(10,3),
  created_at timestamptz not null default now()
);

create table if not exists public.live_reactions (
  id uuid primary key default gen_random_uuid(),
  live_activity_id uuid not null references public.live_activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 16),
  created_at timestamptz not null default now()
);
create index if not exists live_reactions_activity_idx on public.live_reactions(live_activity_id,created_at desc);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Planning / Coach
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.training_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  sport_type text not null,
  title text not null,
  duration_minutes integer,
  status text not null default 'planned' check (status in ('planned','done','skipped')),
  source text not null default 'manual' check (source in ('manual','coach')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_plan_user_date_idx on public.training_plan_items(user_id,date);

-- Daily readiness questionnaire + future wearable signals.
create table if not exists public.readiness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  fatigue smallint check (fatigue between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  motivation smallint check (motivation between 1 and 5),
  resting_hr integer,
  hrv_ms numeric,
  sleep_minutes integer,
  score integer check (score between 0 and 100),
  created_at timestamptz not null default now(),
  unique(user_id,log_date)
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Equipment
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  name text not null,
  brand text,
  sport_type text,
  distance_km numeric(12,2) not null default 0,
  usage_minutes integer not null default 0,
  threshold_km numeric(12,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create table if not exists public.activity_equipment (
  activity_id uuid not null references public.activities(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  primary key(activity_id,equipment_id)
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Activity memories / soundtrack
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.activities add column if not exists story_data jsonb not null default '{}'::jsonb;
alter table public.activities add column if not exists route_polyline text;
alter table public.activities add column if not exists weather jsonb;
alter table public.activities add column if not exists music_summary jsonb;

-- Connections are provider-agnostic; allow music services in the same table.
-- Existing connected_sources.provider is text in the V1 migration, so no schema change is required.

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- RLS helpers
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.is_following(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.follows f where f.follower_id=viewer and f.following_id=owner);
$$;
revoke all on function public.is_following(uuid,uuid) from public;
grant execute on function public.is_following(uuid,uuid) to authenticated;

alter table public.live_activities enable row level security;
alter table public.live_points enable row level security;
alter table public.live_notes enable row level security;
alter table public.live_reactions enable row level security;
alter table public.training_plan_items enable row level security;
alter table public.readiness_logs enable row level security;
alter table public.equipment enable row level security;
alter table public.activity_equipment enable row level security;

-- Owner control
drop policy if exists "live owner write" on public.live_activities;
drop policy if exists "live viewer read" on public.live_activities;
drop policy if exists "live points owner write" on public.live_points;
drop policy if exists "live points permitted read" on public.live_points;
drop policy if exists "live notes owner write" on public.live_notes;
drop policy if exists "live notes permitted read" on public.live_notes;
drop policy if exists "live reactions visible" on public.live_reactions;
drop policy if exists "live reactions self insert" on public.live_reactions;
drop policy if exists "live reactions self delete" on public.live_reactions;
drop policy if exists "plan owner all" on public.training_plan_items;
drop policy if exists "readiness owner all" on public.readiness_logs;
drop policy if exists "equipment owner all" on public.equipment;
drop policy if exists "activity equipment owner all" on public.activity_equipment;

create policy "live owner write" on public.live_activities for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "live viewer read" on public.live_activities for select using(
  auth.uid()=user_id or visibility='public' or (visibility='followers' and public.is_following(auth.uid(),user_id))
);
create policy "live points owner write" on public.live_points for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "live points permitted read" on public.live_points for select using(
  exists(select 1 from public.live_activities l where l.id=live_points.live_activity_id and (auth.uid()=l.user_id or l.visibility='public' or (l.visibility='followers' and public.is_following(auth.uid(),l.user_id))))
);
create policy "live notes owner write" on public.live_notes for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "live notes permitted read" on public.live_notes for select using(
  exists(select 1 from public.live_activities l where l.id=live_notes.live_activity_id and (auth.uid()=l.user_id or l.visibility='public' or (l.visibility='followers' and public.is_following(auth.uid(),l.user_id))))
);
create policy "live reactions visible" on public.live_reactions for select using(
  exists(select 1 from public.live_activities l where l.id=live_reactions.live_activity_id and (auth.uid()=l.user_id or l.visibility='public' or (l.visibility='followers' and public.is_following(auth.uid(),l.user_id))))
);
create policy "live reactions self insert" on public.live_reactions for insert with check(auth.uid()=user_id);
create policy "live reactions self delete" on public.live_reactions for delete using(auth.uid()=user_id);

create policy "plan owner all" on public.training_plan_items for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "readiness owner all" on public.readiness_logs for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "equipment owner all" on public.equipment for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "activity equipment owner all" on public.activity_equipment for all using(
  exists(select 1 from public.activities a where a.id=activity_equipment.activity_id and a.user_id=auth.uid())
) with check(
  exists(select 1 from public.activities a where a.id=activity_equipment.activity_id and a.user_id=auth.uid())
  and exists(select 1 from public.equipment e where e.id=activity_equipment.equipment_id and e.user_id=auth.uid())
);

-- Supabase Realtime publication: add tables if not already present.
do $$ begin
  alter publication supabase_realtime add table public.live_activities;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_notes;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_reactions;
exception when duplicate_object then null; end $$;

-- Recommended cleanup policy for high-frequency GPS points: keep a limited live history
-- or archive them externally before production scale. Intentionally not automatic here.


-- ----------------------------------------------------------------
-- MIGRATION: 20260930110000_v5_ultimate.sql
-- ----------------------------------------------------------------
-- Hybrid.App V5 Ultimate migration
-- Apply AFTER V1 + Multisport V2 + V4 migrations in a development project first.

-- â”€â”€ V5 profile identity / monetization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.profiles add column if not exists athlete_class text;
alter table public.profiles add column if not exists pro_trial_started_at timestamptz;
alter table public.profiles add column if not exists pro_trial_ends_at timestamptz;
alter table public.profiles add column if not exists subscription_tier text not null default 'free';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;

-- Server-side progression. Client AsyncStorage remains an offline cache only.
create table if not exists public.user_progression (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  claimed_rewards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_progression enable row level security;
create policy "progression self read" on public.user_progression for select using (auth.uid()=user_id);
-- Do NOT allow arbitrary client XP increments in production. Use a verified RPC/server worker.

-- â”€â”€ Official sport credentials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.sport_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport_type text not null,
  organization text,
  level_label text not null,
  license_reference text,
  evidence_url text,
  status text not null default 'pending' check(status in ('pending','verified','rejected','expired')),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sport_credentials_rank_idx on public.sport_credentials(sport_type,verified,level_label);
alter table public.sport_credentials enable row level security;
create policy "credentials public verified" on public.sport_credentials for select using(verified=true or auth.uid()=user_id);
create policy "credentials owner submit" on public.sport_credentials for insert with check(auth.uid()=user_id and verified=false and status='pending');
create policy "credentials owner update pending" on public.sport_credentials for update using(auth.uid()=user_id and verified=false) with check(auth.uid()=user_id and verified=false);

-- â”€â”€ Verified performance records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.performance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport_type text not null,
  metric_key text not null,
  value numeric not null,
  display_value text,
  source text not null default 'manual',
  external_id text,
  verified boolean not null default false,
  verification_method text,
  achieved_at timestamptz not null,
  activity_id uuid references public.activities(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id,sport_type,metric_key,achieved_at)
);
create index if not exists performance_records_board_idx on public.performance_records(sport_type,metric_key,verified,value);
alter table public.performance_records enable row level security;
create policy "performance public verified" on public.performance_records for select using(verified=true or auth.uid()=user_id);
create policy "performance self manual insert" on public.performance_records for insert with check(auth.uid()=user_id and verified=false);
-- Verified=true must only be set by trusted server integrations / admin workflows.

-- â”€â”€ Reward ledger to prevent client-side double claiming â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_key text not null,
  reward_type text not null,
  xp_awarded integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id,reward_key)
);
alter table public.reward_claims enable row level security;
create policy "reward owner read" on public.reward_claims for select using(auth.uid()=user_id);

-- â”€â”€ Transparent Pro trial RPC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.start_my_pro_trial()
returns table(trial_started_at timestamptz, trial_ends_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare p public.profiles%rowtype;
begin
  select * into p from public.profiles where id=auth.uid() for update;
  if p.id is null then raise exception 'profile not found'; end if;
  if p.pro_trial_started_at is not null then raise exception 'trial already used'; end if;
  update public.profiles
    set pro_trial_started_at=now(), pro_trial_ends_at=now()+interval '14 days'
    where id=auth.uid();
  return query select now(), now()+interval '14 days';
end $$;
revoke all on function public.start_my_pro_trial() from public;
grant execute on function public.start_my_pro_trial() to authenticated;

-- IMPORTANT PRODUCTION RULES
-- 1) App Store / Play Store / RevenueCat webhook is authoritative for subscription_tier.
-- 2) Never let the client set verified performance, verified credentials or paid status.
-- 3) XP reward claims should be validated server-side before incrementing user_progression.
-- 4) Keep leaderboards non-pay-to-win: paid plan may unlock analysis, never higher ranking multipliers.


-- ----------------------------------------------------------------
-- MIGRATION: 20261001100000_v7_ultimate.sql
-- ----------------------------------------------------------------
-- Hybrid.App V7 â€” production sync layer for avatar/economy/rewards.
-- Apply only after reviewing against your current Supabase schema.
create table if not exists public.player_economy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 250 check (credits >= 0),
  identity_xp integer not null default 0 check (identity_xp >= 0),
  daily_streak integer not null default 0,
  last_daily date,
  active_boost jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.player_cosmetics (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  acquired_at timestamptz not null default now(),
  source text not null default 'reward',
  primary key(user_id,item_id)
);
create table if not exists public.player_equipment_loadout (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipped jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.reward_ledger (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_key text not null,
  reward_type text not null,
  xp integer not null default 0,
  credits integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id,reward_key)
);
create index if not exists reward_ledger_user_created_idx on public.reward_ledger(user_id,created_at desc);
alter table public.player_economy enable row level security;
alter table public.player_cosmetics enable row level security;
alter table public.player_equipment_loadout enable row level security;
alter table public.reward_ledger enable row level security;
drop policy if exists "economy self read" on public.player_economy;
create policy "economy self read" on public.player_economy for select using(auth.uid()=user_id);
drop policy if exists "cosmetics self read" on public.player_cosmetics;
create policy "cosmetics self read" on public.player_cosmetics for select using(auth.uid()=user_id);
drop policy if exists "loadout self read" on public.player_equipment_loadout;
create policy "loadout self read" on public.player_equipment_loadout for select using(auth.uid()=user_id);
drop policy if exists "ledger self read" on public.reward_ledger;
create policy "ledger self read" on public.reward_ledger for select using(auth.uid()=user_id);
-- IMPORTANT: in production, writes for credits/xp should go through a trusted RPC/Edge Function,
-- not arbitrary client updates, to prevent reward/leaderboard cheating.


-- ----------------------------------------------------------------
-- MIGRATION: 20261004_v8_world_identity.sql
-- ----------------------------------------------------------------
-- Hybrid.App V8 â€” World & Identity sync layer.
-- Review on a development Supabase project before applying to production.

create table if not exists public.player_identity_v8 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  card_theme text not null default 'midnight',
  card_frame text not null default 'clean',
  owned_frames jsonb not null default '["clean"]'::jsonb,
  card_title text not null default 'Hybrid Athlete',
  card_quote text not null default 'Built by movement.',
  music_visible boolean not null default true,
  show_top_record boolean not null default true,
  show_grade boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_companion_v8 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  companion_id text not null default 'wolf_nova',
  companion_mood text not null default 'proud',
  companion_gear text,
  owned_companions jsonb not null default '["wolf_nova"]'::jsonb,
  owned_gear jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_world_v8 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_stops jsonb not null default '["paris"]'::jsonb,
  room_theme text not null default 'studio',
  owned_room_themes jsonb not null default '["studio"]'::jsonb,
  pinned_trophies jsonb not null default '["first_session"]'::jsonb,
  story_template text not null default 'clean',
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_story_v8 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid,
  template text not null default 'clean',
  title text,
  caption text,
  payload jsonb not null default '{}'::jsonb,
  visibility text not null default 'private' check (visibility in ('public','followers','private')),
  created_at timestamptz not null default now()
);
create index if not exists activity_story_v8_user_idx on public.activity_story_v8(user_id,created_at desc);

create table if not exists public.season_claim_v8 (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id text not null,
  tier integer not null,
  claimed_at timestamptz not null default now(),
  primary key(user_id,season_id,tier)
);

alter table public.player_identity_v8 enable row level security;
alter table public.player_companion_v8 enable row level security;
alter table public.player_world_v8 enable row level security;
alter table public.activity_story_v8 enable row level security;
alter table public.season_claim_v8 enable row level security;

-- Private configuration is self-readable/writable.
drop policy if exists "identity v8 self" on public.player_identity_v8;
create policy "identity v8 self" on public.player_identity_v8 for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "companion v8 self" on public.player_companion_v8;
create policy "companion v8 self" on public.player_companion_v8 for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "world v8 self" on public.player_world_v8;
create policy "world v8 self" on public.player_world_v8 for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "season v8 self" on public.season_claim_v8;
create policy "season v8 self" on public.season_claim_v8 for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- Stories: owner always sees them. Public/follower visibility should be tightened against
-- your canonical follows table when it is finalized.
drop policy if exists "story v8 self read" on public.activity_story_v8;
create policy "story v8 self read" on public.activity_story_v8 for select using(auth.uid()=user_id);
drop policy if exists "story v8 self write" on public.activity_story_v8;
create policy "story v8 self write" on public.activity_story_v8 for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- IMPORTANT:
-- 1) Credits/rewards continue to be authoritative through the V7 reward ledger / trusted RPC.
-- 2) Do not award ranking points for cosmetic purchases, seasons or companions.
-- 3) If identity cards become public, expose a safe VIEW/RPC rather than all private settings.


-- ----------------------------------------------------------------
-- MIGRATION: 20261001120000_v9_track_everything.sql
-- ----------------------------------------------------------------
-- Hybrid.App V9 â€” Track Everything
-- Incremental migration. Apply after the previous Hybrid migrations on a development project first.

-- 1) Connected providers / sync health
create table if not exists public.connected_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('disconnected','pending','connected','error')),
  provider_user_id text,
  scopes jsonb not null default '[]'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,provider)
);
create index if not exists connected_sources_user_idx on public.connected_sources(user_id);

-- 2) Hybrid native tracked sessions.
create table if not exists public.tracking_sessions_v9 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_type text not null,
  tracker_mode text not null,
  status text not null default 'running' check(status in ('running','paused','finished','discarded')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  elapsed_seconds integer not null default 0,
  distance_km numeric not null default 0,
  elevation_m numeric not null default 0,
  rpe integer check(rpe between 1 and 10),
  source_device text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tracking_sessions_v9_user_started_idx on public.tracking_sessions_v9(user_id,started_at desc);

create table if not exists public.tracking_points_v9 (
  id bigint generated by default as identity primary key,
  session_id uuid not null references public.tracking_sessions_v9(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  altitude_m double precision,
  speed_mps double precision,
  accuracy_m double precision,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists tracking_points_v9_session_idx on public.tracking_points_v9(session_id,recorded_at);

create table if not exists public.tracking_events_v9 (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tracking_sessions_v9(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  at_seconds integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tracking_events_v9_session_idx on public.tracking_events_v9(session_id,at_seconds);

create table if not exists public.activity_splits_v9 (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  split_index integer not null,
  distance_km numeric not null,
  duration_seconds numeric not null,
  pace_seconds_per_km numeric,
  heart_rate integer,
  elevation_delta_m numeric,
  created_at timestamptz not null default now(),
  unique(activity_id,split_index)
);
create index if not exists activity_splits_v9_activity_idx on public.activity_splits_v9(activity_id,split_index);

-- 3) Cross-provider dedupe.
create table if not exists public.external_activity_links_v9 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null,
  provider text not null,
  external_id text not null,
  fingerprint text,
  imported_at timestamptz not null default now(),
  unique(user_id,provider,external_id)
);
create index if not exists external_activity_links_v9_fingerprint_idx on public.external_activity_links_v9(user_id,fingerprint) where fingerprint is not null;

-- 4) Routes/segments
create table if not exists public.personal_route_efforts_v9 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid,
  sport_type text not null,
  route_hash text,
  distance_km numeric not null,
  duration_seconds integer not null,
  avg_pace_seconds_per_km numeric,
  avg_speed_kph numeric,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists personal_route_efforts_v9_user_sport_idx on public.personal_route_efforts_v9(user_id,sport_type,occurred_at desc);

-- RLS
alter table public.connected_sources enable row level security;
alter table public.tracking_sessions_v9 enable row level security;
alter table public.tracking_points_v9 enable row level security;
alter table public.tracking_events_v9 enable row level security;
alter table public.activity_splits_v9 enable row level security;
alter table public.external_activity_links_v9 enable row level security;
alter table public.personal_route_efforts_v9 enable row level security;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['connected_sources','tracking_sessions_v9','tracking_points_v9','tracking_events_v9','activity_splits_v9','external_activity_links_v9','personal_route_efforts_v9'] LOOP
    EXECUTE format('drop policy if exists %I on public.%I', t||'_self', t);
    EXECUTE format('create policy %I on public.%I for all using(auth.uid()=user_id) with check(auth.uid()=user_id)', t||'_self', t);
  END LOOP;
END $$;


-- ----------------------------------------------------------------
-- MIGRATION: 20261002100000_v10_ultimate.sql
-- ----------------------------------------------------------------
-- Hybrid.App V10 â€” Intelligence & Social OS
-- Apply after V9 migrations. Review on a staging project first.

create table if not exists public.intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_at timestamptz not null default now(),
  state text not null check (state in ('peak','building','maintain','recover','reset')),
  form_score integer not null check (form_score between 0 and 100),
  fatigue_score integer not null check (fatigue_score between 0 and 100),
  readiness_score integer not null check (readiness_score between 0 and 100),
  progression_score integer not null check (progression_score between 0 and 100),
  consistency_score integer not null check (consistency_score between 0 and 100),
  balance_score integer not null check (balance_score between 0 and 100),
  acute_load numeric not null default 0,
  chronic_load numeric not null default 0,
  load_ratio numeric not null default 0,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists intelligence_snapshots_user_time_idx on public.intelligence_snapshots(user_id,captured_at desc);
alter table public.intelligence_snapshots enable row level security;
drop policy if exists "intelligence own read" on public.intelligence_snapshots;
create policy "intelligence own read" on public.intelligence_snapshots for select using (auth.uid()=user_id);
drop policy if exists "intelligence own insert" on public.intelligence_snapshots;
create policy "intelligence own insert" on public.intelligence_snapshots for insert with check (auth.uid()=user_id);

create table if not exists public.competition_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sport_type text not null,
  starts_at timestamptz not null,
  target text,
  status text not null default 'planned' check (status in ('planned','active','finished','cancelled')),
  strategy jsonb not null default '{}'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  result_activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.competition_events enable row level security;
drop policy if exists "competition own all" on public.competition_events;
create policy "competition own all" on public.competition_events for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

create table if not exists public.activity_integrity (
  activity_id uuid primary key references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  integrity_score integer not null default 0 check (integrity_score between 0 and 100),
  status text not null default 'review' check (status in ('verified','trusted','review','manual')),
  reasons jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.activity_integrity enable row level security;
drop policy if exists "integrity readable by owner" on public.activity_integrity;
create policy "integrity readable by owner" on public.activity_integrity for select using(auth.uid()=user_id);

create table if not exists public.monthly_recaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  summary jsonb not null default '{}'::jsonb,
  share_token text unique,
  created_at timestamptz not null default now(),
  unique(user_id,month)
);
alter table public.monthly_recaps enable row level security;
drop policy if exists "recaps own all" on public.monthly_recaps;
create policy "recaps own all" on public.monthly_recaps for all using(auth.uid()=user_id) with check(auth.uid()=user_id);


-- ----------------------------------------------------------------
-- MIGRATION: 20261002110000_v11_hybrid_life.sql
-- ----------------------------------------------------------------
-- Hybrid.App V11 â€” Hybrid Life
create table if not exists public.life_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  sleep_hours numeric,
  sleep_quality int check (sleep_quality between 1 and 5),
  fatigue int check (fatigue between 1 and 5),
  soreness int check (soreness between 1 and 5),
  stress int check (stress between 1 and 5),
  motivation int check (motivation between 1 and 5),
  hydration int check (hydration between 1 and 5),
  availability_minutes int,
  pain_flag boolean not null default false,
  life_score int,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.fuel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid null references public.activities(id) on delete cascade,
  planned_duration_minutes int,
  intensity text,
  pre_plan text,
  during_plan text,
  post_plan text,
  created_at timestamptz not null default now()
);

create table if not exists public.mental_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  duration_seconds int not null default 60,
  completed_at timestamptz not null default now()
);

alter table public.life_logs enable row level security;
alter table public.fuel_plans enable row level security;
alter table public.mental_sessions enable row level security;

do $$ begin
  create policy "life logs own" on public.life_logs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "fuel plans own" on public.fuel_plans for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "mental sessions own" on public.mental_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;

create index if not exists life_logs_user_date_idx on public.life_logs(user_id, log_date desc);
create index if not exists fuel_plans_user_idx on public.fuel_plans(user_id, created_at desc);
create index if not exists mental_sessions_user_idx on public.mental_sessions(user_id, completed_at desc);


-- ----------------------------------------------------------------
-- MIGRATION: 20261002120000_v12_adaptive_os.sql
-- ----------------------------------------------------------------
-- Hybrid.App V12 â€” Adaptive OS
-- Apply after previous migrations. Review on a staging project first.

create table if not exists public.adaptive_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'suggestions' check (mode in ('manual','suggestions','autopilot')),
  preferred_rest_day int,
  max_hard_sessions_per_week int not null default 3,
  preferred_session_minutes int not null default 60,
  explain_recommendations boolean not null default true,
  availability jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.adaptive_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal_type text not null default 'hybrid',
  sport_type text,
  target text,
  priority int not null default 2 check (priority between 1 and 3),
  deadline date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists adaptive_goals_user_idx on public.adaptive_goals(user_id, active, priority);

create table if not exists public.adaptive_plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  phase text not null,
  source text not null default 'adaptive_os',
  confidence int,
  input_snapshot jsonb not null default '{}'::jsonb,
  plan jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists adaptive_plan_versions_user_week_idx on public.adaptive_plan_versions(user_id, week_start desc);

create table if not exists public.digital_twin_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  recovery_profile jsonb not null default '{}'::jsonb,
  tolerance_profile jsonb not null default '{}'::jsonb,
  timing_profile jsonb not null default '{}'::jsonb,
  confidence int,
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create table if not exists public.smart_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  tags text[] not null default '{}',
  sentiment text,
  activity_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists smart_journal_user_idx on public.smart_journal_entries(user_id, created_at desc);

alter table public.adaptive_preferences enable row level security;
alter table public.adaptive_goals enable row level security;
alter table public.adaptive_plan_versions enable row level security;
alter table public.digital_twin_snapshots enable row level security;
alter table public.smart_journal_entries enable row level security;

do $$ begin
  create policy "adaptive_preferences_own" on public.adaptive_preferences for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "adaptive_goals_own" on public.adaptive_goals for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "adaptive_plan_versions_own" on public.adaptive_plan_versions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "digital_twin_snapshots_own" on public.digital_twin_snapshots for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "smart_journal_entries_own" on public.smart_journal_entries for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
exception when duplicate_object then null; end $$;


-- ----------------------------------------------------------------
-- MIGRATION: 20261003100000_v14_identity_2d.sql
-- ----------------------------------------------------------------
-- Hybrid.App V14 â€” Identity 2D
-- Stores only customization metadata. Selfie images are NOT stored here.
create table if not exists public.avatar_identity_v14 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expression text not null default 'neutral',
  pose text not null default 'casual',
  background text not null default 'paper',
  card_theme text not null default 'editorial',
  silhouette text not null default 'athletic',
  face_shape text not null default 'oval',
  grain numeric not null default 0.28,
  outline numeric not null default 1.0,
  photo_assist_opt_in boolean not null default false,
  ai_last_confidence numeric,
  ai_last_summary text,
  updated_at timestamptz not null default now()
);
alter table public.avatar_identity_v14 enable row level security;
drop policy if exists "avatar_identity_v14_select_own" on public.avatar_identity_v14;
create policy "avatar_identity_v14_select_own" on public.avatar_identity_v14 for select using (auth.uid() = user_id);
drop policy if exists "avatar_identity_v14_insert_own" on public.avatar_identity_v14;
create policy "avatar_identity_v14_insert_own" on public.avatar_identity_v14 for insert with check (auth.uid() = user_id);
drop policy if exists "avatar_identity_v14_update_own" on public.avatar_identity_v14;
create policy "avatar_identity_v14_update_own" on public.avatar_identity_v14 for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- MIGRATION: 20261004100000_v15_identity_plus.sql
-- ----------------------------------------------------------------
-- Hybrid.App V15 â€” Identity Plus / Art Polish
-- Adds server-side storage for saved outfits while keeping selfies local-only by default.
create table if not exists public.avatar_outfits_v15 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  equipment jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists avatar_outfits_v15_user_idx on public.avatar_outfits_v15(user_id);
alter table public.avatar_outfits_v15 enable row level security;
drop policy if exists "avatar_outfits_v15_select_own" on public.avatar_outfits_v15;
create policy "avatar_outfits_v15_select_own" on public.avatar_outfits_v15 for select using (auth.uid() = user_id);
drop policy if exists "avatar_outfits_v15_insert_own" on public.avatar_outfits_v15;
create policy "avatar_outfits_v15_insert_own" on public.avatar_outfits_v15 for insert with check (auth.uid() = user_id);
drop policy if exists "avatar_outfits_v15_update_own" on public.avatar_outfits_v15;
create policy "avatar_outfits_v15_update_own" on public.avatar_outfits_v15 for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "avatar_outfits_v15_delete_own" on public.avatar_outfits_v15;
create policy "avatar_outfits_v15_delete_own" on public.avatar_outfits_v15 for delete using (auth.uid() = user_id);

alter table if exists public.avatar_identity_v14
  add column if not exists art_version integer not null default 15,
  add column if not exists favorite_background text,
  add column if not exists favorite_card_theme text;


