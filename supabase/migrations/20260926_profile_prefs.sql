-- Migration: add preferred_unit, preferred_language, avatar_url to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_unit     TEXT NOT NULL DEFAULT 'metric'
    CHECK (preferred_unit IN ('metric', 'imperial')),
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'fr'
    CHECK (preferred_language IN ('fr', 'en')),
  ADD COLUMN IF NOT EXISTS avatar_url         TEXT;
