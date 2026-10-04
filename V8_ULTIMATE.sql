-- Hybrid.App V8 — World & Identity sync layer.
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
