-- Hybrid.App V14 — Identity 2D
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
