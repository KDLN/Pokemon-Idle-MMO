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
