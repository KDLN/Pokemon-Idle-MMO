-- Pokemon Idle MMO - Guild Quests System
-- Migration 027

-- ============================================
-- ENUM TYPES
-- ============================================

-- Quest types for different activities
CREATE TYPE quest_type AS ENUM ('catch_pokemon', 'catch_type', 'battle', 'evolve');

-- Quest period: daily or weekly
CREATE TYPE quest_period AS ENUM ('daily', 'weekly');

-- ============================================
-- CORE TABLES
-- ============================================

-- Active quests for each guild
CREATE TABLE guild_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  quest_type quest_type NOT NULL,
  period quest_period NOT NULL,
  target_count INT NOT NULL CHECK (target_count > 0),
  current_progress INT NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  reward_currency INT,
  reward_guild_points INT,
  reward_item_id VARCHAR(50),
  reward_item_quantity INT,
  type_filter VARCHAR(20), -- For catch_type quests: 'water', 'fire', etc.
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  quest_date DATE NOT NULL, -- For dailies: current date, for weeklies: week start (Monday)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, quest_type, period, quest_date, type_filter)
);

-- Individual member contributions to quests
CREATE TABLE guild_quest_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES guild_quests(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  contribution INT NOT NULL DEFAULT 0 CHECK (contribution >= 0),
  last_contributed_at TIMESTAMPTZ,
  UNIQUE(quest_id, player_id)
);

-- Track daily/weekly reroll usage
CREATE TABLE guild_quest_rerolls (
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  period quest_period NOT NULL,
  rerolls_used INT DEFAULT 0 CHECK (rerolls_used >= 0),
  reset_date DATE NOT NULL,
  PRIMARY KEY(guild_id, period, reset_date)
);

-- Completed quest archive for history
CREATE TABLE guild_quest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  quest_type quest_type NOT NULL,
  period quest_period NOT NULL,
  target_count INT NOT NULL,
  final_progress INT NOT NULL,
  was_completed BOOLEAN NOT NULL,
  reward_currency INT,
  reward_guild_points INT,
  reward_item_id VARCHAR(50),
  reward_item_quantity INT,
  type_filter VARCHAR(20),
  description TEXT NOT NULL,
  quest_date DATE NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  top_contributors JSONB -- Array of {player_id, username, contribution}
);

-- 7-day rolling activity stats for difficulty scaling
CREATE TABLE guild_activity_stats (
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  total_catches INT DEFAULT 0 CHECK (total_catches >= 0),
  total_battles INT DEFAULT 0 CHECK (total_battles >= 0),
  total_evolves INT DEFAULT 0 CHECK (total_evolves >= 0),
  PRIMARY KEY(guild_id, stat_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_guild_quests_guild_date ON guild_quests(guild_id, quest_date);
CREATE INDEX idx_guild_quests_active ON guild_quests(guild_id, period, is_completed);
CREATE INDEX idx_guild_quest_contributions_quest ON guild_quest_contributions(quest_id);
CREATE INDEX idx_guild_quest_history_guild ON guild_quest_history(guild_id, archived_at DESC);
CREATE INDEX idx_guild_activity_stats_guild ON guild_activity_stats(guild_id, stat_date DESC);

-- ============================================
-- ROW LEVEL SECURITY - Block Direct Mutations
-- ============================================

-- Enable RLS on all quest tables
ALTER TABLE guild_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_quest_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_quest_rerolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_quest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_activity_stats ENABLE ROW LEVEL SECURITY;

-- Guild quests table policies
CREATE POLICY "Guild members can view quests"
  ON guild_quests FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct quests insert"
  ON guild_quests FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct quests update"
  ON guild_quests FOR UPDATE
  USING (false);

CREATE POLICY "No direct quests delete"
  ON guild_quests FOR DELETE
  USING (false);

-- Quest contributions table policies
CREATE POLICY "Guild members can view contributions"
  ON guild_quest_contributions FOR SELECT
  USING (
    quest_id IN (
      SELECT gq.id FROM guild_quests gq
      JOIN guild_members gm ON gm.guild_id = gq.guild_id
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct contributions insert"
  ON guild_quest_contributions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct contributions update"
  ON guild_quest_contributions FOR UPDATE
  USING (false);

CREATE POLICY "No direct contributions delete"
  ON guild_quest_contributions FOR DELETE
  USING (false);

-- Quest rerolls table policies
CREATE POLICY "Guild members can view rerolls"
  ON guild_quest_rerolls FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct rerolls insert"
  ON guild_quest_rerolls FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct rerolls update"
  ON guild_quest_rerolls FOR UPDATE
  USING (false);

CREATE POLICY "No direct rerolls delete"
  ON guild_quest_rerolls FOR DELETE
  USING (false);

-- Quest history table policies
CREATE POLICY "Guild members can view history"
  ON guild_quest_history FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct history insert"
  ON guild_quest_history FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct history update"
  ON guild_quest_history FOR UPDATE
  USING (false);

CREATE POLICY "No direct history delete"
  ON guild_quest_history FOR DELETE
  USING (false);

-- Activity stats table policies
CREATE POLICY "Guild members can view activity stats"
  ON guild_activity_stats FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct activity stats insert"
  ON guild_activity_stats FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct activity stats update"
  ON guild_activity_stats FOR UPDATE
  USING (false);

CREATE POLICY "No direct activity stats delete"
  ON guild_activity_stats FOR DELETE
  USING (false);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get guild's 7-day rolling average activity
CREATE OR REPLACE FUNCTION get_guild_average_activity(p_guild_id UUID)
RETURNS TABLE (avg_catches INT, avg_battles INT, avg_evolves INT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(CEIL(AVG(total_catches))::INT, 0) as avg_catches,
    COALESCE(CEIL(AVG(total_battles))::INT, 0) as avg_battles,
    COALESCE(CEIL(AVG(total_evolves))::INT, 0) as avg_evolves
  FROM guild_activity_stats
  WHERE guild_id = p_guild_id
    AND stat_date >= (CURRENT_DATE - INTERVAL '7 days');
END;
$$;

-- Calculate quest target based on type, period, and activity level
CREATE OR REPLACE FUNCTION calculate_quest_target(
  p_quest_type quest_type,
  p_period quest_period,
  p_avg_activity INT
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_target INT;
  v_scaled_target INT;
  v_min_target INT;
  v_max_target INT;
BEGIN
  -- Base targets for daily quests
  CASE p_quest_type
    WHEN 'catch_pokemon' THEN v_base_target := 20;
    WHEN 'catch_type' THEN v_base_target := 10;
    WHEN 'battle' THEN v_base_target := 15;
    WHEN 'evolve' THEN v_base_target := 3;
    ELSE v_base_target := 10;
  END CASE;

  -- Scale by activity (target 80% completion rate)
  -- If avg_activity = 0, use base target
  IF p_avg_activity > 0 THEN
    v_scaled_target := CEIL(p_avg_activity * 1.25)::INT;
    -- Clamp between 50% and 200% of base
    v_min_target := CEIL(v_base_target * 0.5)::INT;
    v_max_target := v_base_target * 2;
    v_scaled_target := GREATEST(v_min_target, LEAST(v_scaled_target, v_max_target));
  ELSE
    v_scaled_target := v_base_target;
  END IF;

  -- Weekly quests = daily * 5 (not 7, to account for varying activity)
  IF p_period = 'weekly' THEN
    v_scaled_target := v_scaled_target * 5;
  END IF;

  RETURN v_scaled_target;
END;
$$;

-- Calculate quest rewards based on type, period, and target
CREATE OR REPLACE FUNCTION calculate_quest_reward(
  p_quest_type quest_type,
  p_period quest_period,
  p_target INT
)
RETURNS TABLE (
  reward_currency INT,
  reward_guild_points INT,
  reward_item_id VARCHAR(50),
  reward_item_quantity INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_currency INT;
  v_base_guild_points INT;
  v_multiplier DECIMAL;
  v_item_roll DECIMAL;
BEGIN
  -- Base rewards: currency = target * 10, guild_points = target / 2
  v_base_currency := p_target * 10;
  v_base_guild_points := GREATEST(p_target / 2, 1);

  -- Type-specific quests (catch_type) give 1.5x rewards
  IF p_quest_type = 'catch_type' THEN
    v_multiplier := 1.5;
  ELSE
    v_multiplier := 1.0;
  END IF;

  -- Weekly = daily rewards * 5
  IF p_period = 'weekly' THEN
    v_multiplier := v_multiplier * 5;
  END IF;

  reward_currency := CEIL(v_base_currency * v_multiplier)::INT;
  reward_guild_points := CEIL(v_base_guild_points * v_multiplier)::INT;

  -- 20% chance of bonus item reward
  v_item_roll := random();
  IF v_item_roll < 0.10 THEN
    -- 10% chance: potion
    reward_item_id := 'potion';
    reward_item_quantity := CASE WHEN p_period = 'weekly' THEN 5 ELSE 1 END;
  ELSIF v_item_roll < 0.20 THEN
    -- 10% chance: pokeball
    reward_item_id := 'pokeball';
    reward_item_quantity := CASE WHEN p_period = 'weekly' THEN 10 ELSE 3 END;
  ELSE
    reward_item_id := NULL;
    reward_item_quantity := NULL;
  END IF;

  RETURN NEXT;
END;
$$;

-- Generate description for a quest
CREATE OR REPLACE FUNCTION generate_quest_description(
  p_quest_type quest_type,
  p_target INT,
  p_type_filter VARCHAR DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE p_quest_type
    WHEN 'catch_pokemon' THEN
      RETURN 'Catch ' || p_target || ' Pokemon';
    WHEN 'catch_type' THEN
      RETURN 'Catch ' || p_target || ' ' || INITCAP(p_type_filter) || '-type Pokemon';
    WHEN 'battle' THEN
      RETURN 'Win ' || p_target || ' battles';
    WHEN 'evolve' THEN
      RETURN 'Evolve ' || p_target || ' Pokemon';
    ELSE
      RETURN 'Complete ' || p_target || ' activities';
  END CASE;
END;
$$;

-- ============================================
-- QUEST GENERATION FUNCTIONS
-- ============================================

-- Generate daily quests for a guild (lazy generation)
CREATE OR REPLACE FUNCTION generate_daily_quests(p_guild_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE;
  v_yesterday DATE;
  v_quest_count INT;
  v_member_count INT;
  v_activity RECORD;
  v_quest_types quest_type[];
  v_type_filters VARCHAR[];
  v_quest_type quest_type;
  v_type_filter VARCHAR;
  v_target INT;
  v_reward RECORD;
  v_description TEXT;
  i INT;
BEGIN
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_guild_id::text || 'daily'));

  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_yesterday := v_today - INTERVAL '1 day';

  -- Check if today's quests already exist
  IF EXISTS (
    SELECT 1 FROM guild_quests
    WHERE guild_id = p_guild_id
      AND period = 'daily'
      AND quest_date = v_today
  ) THEN
    RETURN; -- Already generated
  END IF;

  -- Archive yesterday's incomplete quests
  PERFORM archive_expired_quests();

  -- Get member count for quest scaling
  SELECT member_count INTO v_member_count
  FROM guilds
  WHERE id = p_guild_id;

  IF v_member_count IS NULL THEN
    v_member_count := 1;
  END IF;

  -- Calculate quest count: 3 + (member_count / 10), max 6
  v_quest_count := LEAST(3 + (v_member_count / 10), 6);

  -- Get 7-day activity average
  SELECT * INTO v_activity FROM get_guild_average_activity(p_guild_id);

  -- Available quest types
  v_quest_types := ARRAY['catch_pokemon', 'catch_type', 'battle', 'evolve']::quest_type[];

  -- Available type filters for catch_type quests
  v_type_filters := ARRAY['fire', 'water', 'grass', 'electric', 'normal', 'flying', 'bug', 'poison'];

  -- Generate quests ensuring diversity
  FOR i IN 1..v_quest_count LOOP
    -- Ensure at least one of each type if we have 4+ quests
    IF i <= 4 THEN
      v_quest_type := v_quest_types[i];
    ELSE
      -- Random for extra quests
      v_quest_type := v_quest_types[1 + floor(random() * 4)::INT];
    END IF;

    -- For catch_type quests, pick a random type filter
    IF v_quest_type = 'catch_type' THEN
      v_type_filter := v_type_filters[1 + floor(random() * array_length(v_type_filters, 1))::INT];
    ELSE
      v_type_filter := NULL;
    END IF;

    -- Calculate target based on activity
    CASE v_quest_type
      WHEN 'catch_pokemon' THEN
        v_target := calculate_quest_target(v_quest_type, 'daily', v_activity.avg_catches);
      WHEN 'catch_type' THEN
        v_target := calculate_quest_target(v_quest_type, 'daily', v_activity.avg_catches / 4);
      WHEN 'battle' THEN
        v_target := calculate_quest_target(v_quest_type, 'daily', v_activity.avg_battles);
      WHEN 'evolve' THEN
        v_target := calculate_quest_target(v_quest_type, 'daily', v_activity.avg_evolves);
    END CASE;

    -- Calculate rewards
    SELECT * INTO v_reward FROM calculate_quest_reward(v_quest_type, 'daily', v_target);

    -- Generate description
    v_description := generate_quest_description(v_quest_type, v_target, v_type_filter);

    -- Insert quest (ON CONFLICT DO NOTHING to handle duplicates)
    INSERT INTO guild_quests (
      guild_id, quest_type, period, target_count, reward_currency,
      reward_guild_points, reward_item_id, reward_item_quantity,
      type_filter, description, quest_date
    ) VALUES (
      p_guild_id, v_quest_type, 'daily', v_target, v_reward.reward_currency,
      v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
      v_type_filter, v_description, v_today
    ) ON CONFLICT (guild_id, quest_type, period, quest_date, type_filter) DO NOTHING;
  END LOOP;
END;
$$;

-- Generate weekly quests for a guild (lazy generation)
CREATE OR REPLACE FUNCTION generate_weekly_quests(p_guild_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_last_week_start DATE;
  v_activity RECORD;
  v_quest_types quest_type[];
  v_type_filters VARCHAR[];
  v_quest_type quest_type;
  v_type_filter VARCHAR;
  v_target INT;
  v_reward RECORD;
  v_description TEXT;
  i INT;
BEGIN
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_guild_id::text || 'weekly'));

  -- PostgreSQL week starts Monday by default
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;
  v_last_week_start := v_week_start - INTERVAL '7 days';

  -- Check if this week's quests already exist
  IF EXISTS (
    SELECT 1 FROM guild_quests
    WHERE guild_id = p_guild_id
      AND period = 'weekly'
      AND quest_date = v_week_start
  ) THEN
    RETURN; -- Already generated
  END IF;

  -- Archive last week's incomplete quests
  PERFORM archive_expired_quests();

  -- Get 7-day activity average
  SELECT * INTO v_activity FROM get_guild_average_activity(p_guild_id);

  -- Available type filters for catch_type quests
  v_type_filters := ARRAY['fire', 'water', 'grass', 'electric', 'normal', 'flying', 'bug', 'poison'];

  -- Fixed 3 weekly quests with variety
  -- Quest 1: catch_pokemon
  v_target := calculate_quest_target('catch_pokemon', 'weekly', v_activity.avg_catches);
  SELECT * INTO v_reward FROM calculate_quest_reward('catch_pokemon', 'weekly', v_target);
  v_description := generate_quest_description('catch_pokemon', v_target, NULL);

  INSERT INTO guild_quests (
    guild_id, quest_type, period, target_count, reward_currency,
    reward_guild_points, reward_item_id, reward_item_quantity,
    type_filter, description, quest_date
  ) VALUES (
    p_guild_id, 'catch_pokemon', 'weekly', v_target, v_reward.reward_currency,
    v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
    NULL, v_description, v_week_start
  ) ON CONFLICT (guild_id, quest_type, period, quest_date, type_filter) DO NOTHING;

  -- Quest 2: battle
  v_target := calculate_quest_target('battle', 'weekly', v_activity.avg_battles);
  SELECT * INTO v_reward FROM calculate_quest_reward('battle', 'weekly', v_target);
  v_description := generate_quest_description('battle', v_target, NULL);

  INSERT INTO guild_quests (
    guild_id, quest_type, period, target_count, reward_currency,
    reward_guild_points, reward_item_id, reward_item_quantity,
    type_filter, description, quest_date
  ) VALUES (
    p_guild_id, 'battle', 'weekly', v_target, v_reward.reward_currency,
    v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
    NULL, v_description, v_week_start
  ) ON CONFLICT (guild_id, quest_type, period, quest_date, type_filter) DO NOTHING;

  -- Quest 3: evolve or catch_type (random)
  IF random() < 0.5 THEN
    v_target := calculate_quest_target('evolve', 'weekly', v_activity.avg_evolves);
    SELECT * INTO v_reward FROM calculate_quest_reward('evolve', 'weekly', v_target);
    v_description := generate_quest_description('evolve', v_target, NULL);

    INSERT INTO guild_quests (
      guild_id, quest_type, period, target_count, reward_currency,
      reward_guild_points, reward_item_id, reward_item_quantity,
      type_filter, description, quest_date
    ) VALUES (
      p_guild_id, 'evolve', 'weekly', v_target, v_reward.reward_currency,
      v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
      NULL, v_description, v_week_start
    ) ON CONFLICT (guild_id, quest_type, period, quest_date, type_filter) DO NOTHING;
  ELSE
    v_type_filter := v_type_filters[1 + floor(random() * array_length(v_type_filters, 1))::INT];
    v_target := calculate_quest_target('catch_type', 'weekly', v_activity.avg_catches / 4);
    SELECT * INTO v_reward FROM calculate_quest_reward('catch_type', 'weekly', v_target);
    v_description := generate_quest_description('catch_type', v_target, v_type_filter);

    INSERT INTO guild_quests (
      guild_id, quest_type, period, target_count, reward_currency,
      reward_guild_points, reward_item_id, reward_item_quantity,
      type_filter, description, quest_date
    ) VALUES (
      p_guild_id, 'catch_type', 'weekly', v_target, v_reward.reward_currency,
      v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
      v_type_filter, v_description, v_week_start
    ) ON CONFLICT (guild_id, quest_type, period, quest_date, type_filter) DO NOTHING;
  END IF;
END;
$$;

-- ============================================
-- QUEST RETRIEVAL FUNCTION
-- ============================================

-- Get all active guild quests (lazy generation)
CREATE OR REPLACE FUNCTION get_guild_quests(p_guild_id UUID, p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_daily_quests JSON;
  v_weekly_quests JSON;
  v_daily_rerolls INT;
  v_weekly_rerolls INT;
  v_today DATE;
  v_week_start DATE;
  v_daily_reset TIMESTAMPTZ;
  v_weekly_reset TIMESTAMPTZ;
BEGIN
  -- Verify player is guild member
  SELECT * INTO v_member
  FROM guild_members
  WHERE guild_id = p_guild_id AND player_id = p_player_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Lazy generation: ensure today's and this week's quests exist
  PERFORM generate_daily_quests(p_guild_id);
  PERFORM generate_weekly_quests(p_guild_id);

  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;

  -- Calculate reset times
  v_daily_reset := (v_today + INTERVAL '1 day')::TIMESTAMPTZ;
  v_weekly_reset := (v_week_start + INTERVAL '7 days')::TIMESTAMPTZ;

  -- Get daily quests with player's contribution
  SELECT json_agg(quest_row ORDER BY quest_row.quest_type) INTO v_daily_quests
  FROM (
    SELECT
      gq.id,
      gq.quest_type::TEXT,
      gq.target_count,
      gq.current_progress,
      gq.reward_currency,
      gq.reward_guild_points,
      gq.reward_item_id,
      gq.reward_item_quantity,
      gq.type_filter,
      gq.description,
      gq.is_completed,
      gq.completed_at,
      COALESCE(gqc.contribution, 0) as my_contribution,
      (
        SELECT json_agg(contrib ORDER BY contrib.contribution DESC)
        FROM (
          SELECT
            c.player_id,
            p.username,
            c.contribution
          FROM guild_quest_contributions c
          JOIN players p ON p.id = c.player_id
          WHERE c.quest_id = gq.id AND c.contribution > 0
          ORDER BY c.contribution DESC
          LIMIT 10
        ) contrib
      ) as leaderboard
    FROM guild_quests gq
    LEFT JOIN guild_quest_contributions gqc ON gqc.quest_id = gq.id AND gqc.player_id = p_player_id
    WHERE gq.guild_id = p_guild_id
      AND gq.period = 'daily'
      AND gq.quest_date = v_today
  ) quest_row;

  -- Get weekly quests with player's contribution
  SELECT json_agg(quest_row ORDER BY quest_row.quest_type) INTO v_weekly_quests
  FROM (
    SELECT
      gq.id,
      gq.quest_type::TEXT,
      gq.target_count,
      gq.current_progress,
      gq.reward_currency,
      gq.reward_guild_points,
      gq.reward_item_id,
      gq.reward_item_quantity,
      gq.type_filter,
      gq.description,
      gq.is_completed,
      gq.completed_at,
      COALESCE(gqc.contribution, 0) as my_contribution,
      (
        SELECT json_agg(contrib ORDER BY contrib.contribution DESC)
        FROM (
          SELECT
            c.player_id,
            p.username,
            c.contribution
          FROM guild_quest_contributions c
          JOIN players p ON p.id = c.player_id
          WHERE c.quest_id = gq.id AND c.contribution > 0
          ORDER BY c.contribution DESC
          LIMIT 10
        ) contrib
      ) as leaderboard
    FROM guild_quests gq
    LEFT JOIN guild_quest_contributions gqc ON gqc.quest_id = gq.id AND gqc.player_id = p_player_id
    WHERE gq.guild_id = p_guild_id
      AND gq.period = 'weekly'
      AND gq.quest_date = v_week_start
  ) quest_row;

  -- Get reroll counts
  SELECT COALESCE(rerolls_used, 0) INTO v_daily_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'daily' AND reset_date = v_today;

  SELECT COALESCE(rerolls_used, 0) INTO v_weekly_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'weekly' AND reset_date = v_week_start;

  RETURN json_build_object(
    'success', true,
    'daily', COALESCE(v_daily_quests, '[]'::JSON),
    'weekly', COALESCE(v_weekly_quests, '[]'::JSON),
    'daily_rerolls_remaining', 2 - COALESCE(v_daily_rerolls, 0),
    'weekly_rerolls_remaining', 1 - COALESCE(v_weekly_rerolls, 0),
    'reset_times', json_build_object(
      'daily', v_daily_reset,
      'weekly', v_weekly_reset
    )
  );
END;
$$;

-- ============================================
-- QUEST PROGRESS FUNCTION
-- ============================================

-- Update quest progress (called by game server on activity)
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_guild_id UUID,
  p_player_id UUID,
  p_quest_type quest_type,
  p_amount INT,
  p_type_filter VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE;
  v_week_start DATE;
  v_quest RECORD;
  v_new_progress INT;
  v_was_completed BOOLEAN;
  v_milestone INT;
  v_updated_quests JSON[];
  v_result JSON;
BEGIN
  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;

  -- Find all matching active quests (could match both catch_pokemon and catch_type)
  FOR v_quest IN
    SELECT * FROM guild_quests
    WHERE guild_id = p_guild_id
      AND is_completed = false
      AND (
        -- Match exact quest type
        (quest_type = p_quest_type AND (type_filter IS NULL OR type_filter = p_type_filter))
        -- Also match catch_pokemon for any catch_type activity
        OR (p_quest_type = 'catch_type' AND quest_type = 'catch_pokemon')
      )
      AND (
        (period = 'daily' AND quest_date = v_today)
        OR (period = 'weekly' AND quest_date = v_week_start)
      )
    FOR UPDATE
  LOOP
    v_was_completed := v_quest.is_completed;

    -- Increment progress
    v_new_progress := LEAST(v_quest.current_progress + p_amount, v_quest.target_count);

    UPDATE guild_quests
    SET current_progress = v_new_progress
    WHERE id = v_quest.id;

    -- Upsert contribution record
    INSERT INTO guild_quest_contributions (quest_id, player_id, contribution, last_contributed_at)
    VALUES (v_quest.id, p_player_id, p_amount, NOW())
    ON CONFLICT (quest_id, player_id) DO UPDATE SET
      contribution = guild_quest_contributions.contribution + p_amount,
      last_contributed_at = NOW();

    -- Check for completion
    IF v_new_progress >= v_quest.target_count AND NOT v_was_completed THEN
      UPDATE guild_quests
      SET is_completed = true, completed_at = NOW()
      WHERE id = v_quest.id;

      -- Distribute rewards
      PERFORM distribute_quest_rewards(v_quest.id);

      v_milestone := 100;
    ELSE
      -- Check for milestone (25%, 50%, 75%)
      v_milestone := NULL;
      IF v_quest.current_progress < v_quest.target_count * 0.25 AND v_new_progress >= v_quest.target_count * 0.25 THEN
        v_milestone := 25;
      ELSIF v_quest.current_progress < v_quest.target_count * 0.5 AND v_new_progress >= v_quest.target_count * 0.5 THEN
        v_milestone := 50;
      ELSIF v_quest.current_progress < v_quest.target_count * 0.75 AND v_new_progress >= v_quest.target_count * 0.75 THEN
        v_milestone := 75;
      END IF;
    END IF;

    -- Add to results
    v_result := json_build_object(
      'quest_id', v_quest.id,
      'quest_type', v_quest.quest_type::TEXT,
      'period', v_quest.period::TEXT,
      'description', v_quest.description,
      'new_progress', v_new_progress,
      'target_count', v_quest.target_count,
      'is_completed', (v_new_progress >= v_quest.target_count),
      'milestone', v_milestone
    );
    v_updated_quests := array_append(v_updated_quests, v_result);
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'updated_quests', COALESCE(to_json(v_updated_quests), '[]'::JSON)
  );
END;
$$;

-- ============================================
-- REWARD DISTRIBUTION FUNCTION
-- ============================================

-- Distribute rewards when quest is completed
CREATE OR REPLACE FUNCTION distribute_quest_rewards(p_quest_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_total_contribution INT;
  v_contrib RECORD;
  v_player_bonus INT;
  v_individual_bonus_pool INT;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest
  FROM guild_quests
  WHERE id = p_quest_id;

  IF v_quest IS NULL THEN
    RETURN;
  END IF;

  -- Deposit main currency reward to guild bank
  IF v_quest.reward_currency > 0 THEN
    UPDATE guild_bank_currency
    SET balance = balance + v_quest.reward_currency
    WHERE guild_id = v_quest.guild_id;

    -- Log the deposit
    INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
    VALUES (
      v_quest.guild_id,
      NULL,
      'deposit',
      'currency',
      jsonb_build_object(
        'source', 'quest_reward',
        'quest_id', p_quest_id,
        'quest_description', v_quest.description,
        'amount', v_quest.reward_currency
      ),
      (SELECT balance FROM guild_bank_currency WHERE guild_id = v_quest.guild_id)
    );
  END IF;

  -- Deposit item reward to guild bank if any
  IF v_quest.reward_item_id IS NOT NULL AND v_quest.reward_item_quantity > 0 THEN
    INSERT INTO guild_bank_items (guild_id, item_id, quantity, deposited_by, last_updated)
    VALUES (v_quest.guild_id, v_quest.reward_item_id, v_quest.reward_item_quantity, NULL, NOW())
    ON CONFLICT (guild_id, item_id) DO UPDATE SET
      quantity = LEAST(guild_bank_items.quantity + v_quest.reward_item_quantity, 99),
      last_updated = NOW();

    -- Log the deposit
    INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
    VALUES (
      v_quest.guild_id,
      NULL,
      'deposit',
      'item',
      jsonb_build_object(
        'source', 'quest_reward',
        'quest_id', p_quest_id,
        'quest_description', v_quest.description,
        'item_id', v_quest.reward_item_id,
        'quantity', v_quest.reward_item_quantity
      )
    );
  END IF;

  -- Calculate individual bonuses: 10% of reward currency distributed proportionally
  v_individual_bonus_pool := GREATEST(CEIL(v_quest.reward_currency * 0.1), 0)::INT;

  IF v_individual_bonus_pool > 0 THEN
    -- Get total contribution
    SELECT COALESCE(SUM(contribution), 0) INTO v_total_contribution
    FROM guild_quest_contributions
    WHERE quest_id = p_quest_id;

    IF v_total_contribution > 0 THEN
      -- Distribute to each contributor proportionally
      FOR v_contrib IN
        SELECT * FROM guild_quest_contributions
        WHERE quest_id = p_quest_id AND contribution > 0
      LOOP
        -- Calculate bonus (minimum 1 for any contribution)
        v_player_bonus := GREATEST(
          CEIL(v_individual_bonus_pool * (v_contrib.contribution::DECIMAL / v_total_contribution)),
          1
        )::INT;

        -- Add to player's currency directly
        UPDATE players
        SET pokedollars = pokedollars + v_player_bonus
        WHERE id = v_contrib.player_id;
      END LOOP;
    END IF;
  END IF;
END;
$$;
