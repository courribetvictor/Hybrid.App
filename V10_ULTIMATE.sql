-- Hybrid.App V10 — Intelligence & Social OS
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
