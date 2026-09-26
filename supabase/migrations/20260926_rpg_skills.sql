-- RPG skills system: 5 core attributes updated from activities

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skill_explosivite  INTEGER NOT NULL DEFAULT 0 CHECK (skill_explosivite  BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS skill_detente      INTEGER NOT NULL DEFAULT 0 CHECK (skill_detente      BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS skill_endurance    INTEGER NOT NULL DEFAULT 0 CHECK (skill_endurance    BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS skill_force        INTEGER NOT NULL DEFAULT 0 CHECK (skill_force        BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS skill_agilite      INTEGER NOT NULL DEFAULT 0 CHECK (skill_agilite      BETWEEN 0 AND 100);

-- Function: recalculate skills for a user based on their last 365 days of activities
CREATE OR REPLACE FUNCTION recalculate_skills(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_explosivite  INTEGER := 0;
  v_detente      INTEGER := 0;
  v_endurance    INTEGER := 0;
  v_force        INTEGER := 0;
  v_agilite      INTEGER := 0;
  v_total        INTEGER := 0;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN sport_type IN ('athletics','boxing','football') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN sport_type IN ('basketball','badminton','athletics') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN sport_type IN ('running','cycling','swimming','hiking') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN sport_type IN ('gym','boxing') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN sport_type IN ('badminton','tennis','yoga','football') THEN 1 ELSE 0 END), 0),
    COUNT(*)
  INTO v_explosivite, v_detente, v_endurance, v_force, v_agilite, v_total
  FROM activities
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '365 days';

  IF v_total > 0 THEN
    UPDATE profiles SET
      skill_explosivite = LEAST(FLOOR(v_explosivite * 100.0 / GREATEST(v_total, 1))::INTEGER + LEAST(v_explosivite * 3, 40), 100),
      skill_detente     = LEAST(FLOOR(v_detente     * 100.0 / GREATEST(v_total, 1))::INTEGER + LEAST(v_detente     * 3, 40), 100),
      skill_endurance   = LEAST(FLOOR(v_endurance   * 100.0 / GREATEST(v_total, 1))::INTEGER + LEAST(v_endurance   * 3, 40), 100),
      skill_force       = LEAST(FLOOR(v_force       * 100.0 / GREATEST(v_total, 1))::INTEGER + LEAST(v_force       * 3, 40), 100),
      skill_agilite     = LEAST(FLOOR(v_agilite     * 100.0 / GREATEST(v_total, 1))::INTEGER + LEAST(v_agilite     * 3, 40), 100)
    WHERE id = p_user_id;
  END IF;
END;
$$;
