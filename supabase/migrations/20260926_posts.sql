-- Migration: posts + post_likes tables
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  sport_type  TEXT,
  media_url   TEXT,
  likes_count INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user      ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created   ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_likes     ON posts (likes_count DESC);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_public_read"  ON posts      FOR SELECT USING (true);
CREATE POLICY "posts_own_insert"   ON posts      FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_own_delete"   ON posts      FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "likes_public_read"  ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_own_insert"   ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_own_delete"   ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Atomic toggle like (avoids race condition on likes_count)
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE already BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO already;

  IF already THEN
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
    RETURN FALSE;
  ELSE
    INSERT INTO post_likes(user_id, post_id) VALUES(p_user_id, p_post_id)
      ON CONFLICT DO NOTHING;
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
    RETURN TRUE;
  END IF;
END;
$$;
