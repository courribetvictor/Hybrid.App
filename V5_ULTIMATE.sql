-- Hybrid.App V5 Ultimate migration
-- Apply AFTER V1 + Multisport V2 + V4 migrations in a development project first.

-- ── V5 profile identity / monetization ────────────────────────
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

-- ── Official sport credentials ─────────────────────────────────
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

-- ── Verified performance records ───────────────────────────────
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

-- ── Reward ledger to prevent client-side double claiming ───────
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

-- ── Transparent Pro trial RPC ──────────────────────────────────
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
