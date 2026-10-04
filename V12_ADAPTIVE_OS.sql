-- Hybrid.App V12 — Adaptive OS
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
