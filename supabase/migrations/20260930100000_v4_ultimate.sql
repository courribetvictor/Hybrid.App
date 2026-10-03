-- Hybrid.App V4 Ultimate foundations
-- Run after the V1 + multisport V2 migrations in a development Supabase project first.

-- ─────────────────────────────────────────────────────────────
-- Hybrid Live
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Planning / Coach
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Equipment
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Activity memories / soundtrack
-- ─────────────────────────────────────────────────────────────
alter table public.activities add column if not exists story_data jsonb not null default '{}'::jsonb;
alter table public.activities add column if not exists route_polyline text;
alter table public.activities add column if not exists weather jsonb;
alter table public.activities add column if not exists music_summary jsonb;

-- Connections are provider-agnostic; allow music services in the same table.
-- Existing connected_sources.provider is text in the V1 migration, so no schema change is required.

-- ─────────────────────────────────────────────────────────────
-- RLS helpers
-- ─────────────────────────────────────────────────────────────
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
