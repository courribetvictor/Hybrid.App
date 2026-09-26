-- ============================================================
-- Hybrid.App — Supabase PostgreSQL Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE preferred_unit   AS ENUM ('metric', 'imperial');
CREATE TYPE preferred_language AS ENUM ('fr', 'en');
CREATE TYPE sport_type       AS ENUM ('running', 'cycling', 'swimming', 'gym', 'badminton', 'athletics');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username          TEXT NOT NULL UNIQUE,
  height_cm         NUMERIC(5,1),
  current_weight_kg NUMERIC(5,2),
  is_pro            BOOLEAN NOT NULL DEFAULT FALSE,
  hybrid_score      FLOAT NOT NULL DEFAULT 0,
  preferred_unit    preferred_unit NOT NULL DEFAULT 'metric',
  preferred_language preferred_language NOT NULL DEFAULT 'fr',
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 3 AND 30),
  CONSTRAINT profiles_height_range    CHECK (height_cm IS NULL OR height_cm BETWEEN 50 AND 300),
  CONSTRAINT profiles_weight_range    CHECK (current_weight_kg IS NULL OR current_weight_kg BETWEEN 10 AND 700)
);

CREATE INDEX idx_profiles_username ON profiles (username);

-- ============================================================
-- BODY LOGS
-- ============================================================

CREATE TABLE body_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg           NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,1),
  calories_consumed   INT,
  logged_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT body_logs_unique_day      UNIQUE (user_id, logged_date),
  CONSTRAINT body_logs_weight_range    CHECK (weight_kg IS NULL OR weight_kg BETWEEN 10 AND 700),
  CONSTRAINT body_logs_fat_range       CHECK (body_fat_percentage IS NULL OR body_fat_percentage BETWEEN 0 AND 70),
  CONSTRAINT body_logs_calories_range  CHECK (calories_consumed IS NULL OR calories_consumed BETWEEN 0 AND 20000)
);

CREATE INDEX idx_body_logs_user_date ON body_logs (user_id, logged_date DESC);

-- ============================================================
-- ACTIVITIES
-- ============================================================

CREATE TABLE activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport_type       sport_type NOT NULL,
  duration_seconds INT NOT NULL,
  calories_burned  INT,
  -- Dynamic JSONB metrics per sport:
  --   running/cycling/swimming : { distance_m, avg_pace_s_per_km, avg_heart_rate, elevation_m }
  --   gym                      : { exercises: [{ name, sets: [{ reps, weight_kg }], one_rm_kg }] }
  --   badminton                : { sets: [{ player_score, opponent_score }], match_won }
  --   athletics                : { event, result_value, result_unit, wind_speed }
  metrics          JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT activities_duration_positive   CHECK (duration_seconds > 0),
  CONSTRAINT activities_calories_positive   CHECK (calories_burned IS NULL OR calories_burned >= 0)
);

CREATE INDEX idx_activities_user_created  ON activities (user_id, created_at DESC);
CREATE INDEX idx_activities_sport         ON activities (user_id, sport_type);
CREATE INDEX idx_activities_metrics_gin   ON activities USING gin (metrics);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================

CREATE TABLE friendships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT friendships_no_self_friend CHECK (user_id <> friend_id),
  CONSTRAINT friendships_unique_pair    UNIQUE (user_id, friend_id)
);

CREATE INDEX idx_friendships_user   ON friendships (user_id, status);
CREATE INDEX idx_friendships_friend ON friendships (friend_id, status);

-- ============================================================
-- CLUBS
-- ============================================================

CREATE TABLE clubs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  owner_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_points BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT clubs_name_length CHECK (char_length(name) BETWEEN 3 AND 60)
);

CREATE INDEX idx_clubs_leaderboard ON clubs (total_points DESC);

-- ============================================================
-- CLUB MEMBERS
-- ============================================================

CREATE TABLE club_members (
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

CREATE INDEX idx_club_members_user ON club_members (user_id);

-- ============================================================
-- WEEKLY CHALLENGES
-- ============================================================

CREATE TABLE weekly_challenges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  sport_type  sport_type NOT NULL,
  target_value NUMERIC,
  target_unit  TEXT,
  is_pro_only BOOLEAN NOT NULL DEFAULT FALSE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_challenges_date_order CHECK (end_date > start_date)
);

CREATE INDEX idx_weekly_challenges_active ON weekly_challenges (start_date, end_date);
CREATE INDEX idx_weekly_challenges_sport  ON weekly_challenges (sport_type, is_pro_only);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write, no delete from client
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_no_delete"    ON profiles FOR DELETE USING (false);

-- Body logs: own only
CREATE POLICY "body_logs_own"  ON body_logs FOR ALL USING (auth.uid() = user_id);

-- Activities: own write, public read for feed
CREATE POLICY "activities_public_read" ON activities FOR SELECT USING (true);
CREATE POLICY "activities_own_write"   ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_own_delete"  ON activities FOR DELETE USING (auth.uid() = user_id);

-- Friendships: own only
CREATE POLICY "friendships_own" ON friendships FOR ALL USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Clubs: public read, owner manages
CREATE POLICY "clubs_public_read"  ON clubs FOR SELECT USING (true);
CREATE POLICY "clubs_owner_insert" ON clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clubs_owner_update" ON clubs FOR UPDATE USING (auth.uid() = owner_id);

-- Club members: public read, own insert/delete
CREATE POLICY "club_members_public_read" ON club_members FOR SELECT USING (true);
CREATE POLICY "club_members_own_write"   ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club_members_own_delete"  ON club_members FOR DELETE USING (auth.uid() = user_id);

-- Weekly challenges: public read
CREATE POLICY "weekly_challenges_public_read" ON weekly_challenges FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Repair: recrée un profil manquant pour l'utilisateur connecté
CREATE OR REPLACE FUNCTION ensure_profile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN RETURN; END IF;
  INSERT INTO public.profiles (id, username)
  VALUES (v_uid, 'user_' || substr(v_uid::text, 1, 8))
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_profile() TO authenticated;

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync current_weight_kg on body_log insert
CREATE OR REPLACE FUNCTION sync_profile_weight()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL THEN
    UPDATE profiles SET current_weight_kg = NEW.weight_kg WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_body_log_inserted
  AFTER INSERT ON body_logs
  FOR EACH ROW EXECUTE FUNCTION sync_profile_weight();
