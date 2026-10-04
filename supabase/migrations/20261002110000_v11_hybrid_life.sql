-- Hybrid.App V11 — Hybrid Life
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
