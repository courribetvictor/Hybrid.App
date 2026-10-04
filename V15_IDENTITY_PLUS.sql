-- Hybrid.App V15 — Identity Plus / Art Polish
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
