-- Pokemon Idle MMO - Guild System
-- Migration 022

-- ============================================
-- ENUM TYPE
-- ============================================

CREATE TYPE guild_role AS ENUM ('leader', 'officer', 'member');

-- ============================================
-- GUILDS TABLE
-- ============================================

CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES players(id) ON DELETE RESTRICT NOT NULL,
  member_count INT DEFAULT 1,
  max_members INT DEFAULT 50,
  join_mode TEXT DEFAULT 'open' CHECK (join_mode IN ('open', 'invite_only', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Name constraints: 3-30 characters, alphanumeric + spaces
  CONSTRAINT guild_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 30),
  CONSTRAINT guild_name_format CHECK (name ~ '^[a-zA-Z0-9 ]+$'),

  -- Tag constraints: 2-5 characters, uppercase alphanumeric only
  CONSTRAINT guild_tag_length CHECK (char_length(tag) >= 2 AND char_length(tag) <= 5),
  CONSTRAINT guild_tag_format CHECK (tag ~ '^[A-Z0-9]+$'),

  -- Description constraint: max 500 characters
  CONSTRAINT guild_description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

-- ============================================
-- GUILD MEMBERS TABLE
-- ============================================

CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  role guild_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Player can only be in one guild
  CONSTRAINT unique_player_guild UNIQUE (player_id),
  -- Standard unique constraint for guild-player pair
  CONSTRAINT unique_guild_member UNIQUE (guild_id, player_id)
);

-- Partial unique index to enforce single leader per guild
CREATE UNIQUE INDEX idx_one_leader_per_guild ON guild_members(guild_id) WHERE role = 'leader';

-- ============================================
-- PLAYERS TABLE MODIFICATIONS
-- ============================================

-- Add guild_id column for fast lookups (denormalized)
ALTER TABLE players ADD COLUMN guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL;

-- Add timestamp for tracking when player left guild (24hr cooldown)
ALTER TABLE players ADD COLUMN left_guild_at TIMESTAMPTZ;

-- Index for finding players by guild
CREATE INDEX idx_players_guild ON players(guild_id) WHERE guild_id IS NOT NULL;

-- ============================================
-- TRIGGER TO SYNC players.guild_id
-- ============================================

-- Keeps players.guild_id in sync with guild_members table
CREATE OR REPLACE FUNCTION sync_player_guild_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE players SET guild_id = NEW.guild_id WHERE id = NEW.player_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE players SET guild_id = NULL, left_guild_at = NOW() WHERE id = OLD.player_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_player_guild
AFTER INSERT OR DELETE ON guild_members
FOR EACH ROW EXECUTE FUNCTION sync_player_guild_id();

-- ============================================
-- INDEXES
-- ============================================

-- Find guild by leader
CREATE INDEX idx_guilds_leader ON guilds(leader_id);

-- Case-insensitive name search
CREATE INDEX idx_guilds_name ON guilds(LOWER(name));

-- Find members by guild
CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);

-- Find guild membership by player
CREATE INDEX idx_guild_members_player ON guild_members(player_id);

-- Find members by role within a guild
CREATE INDEX idx_guild_members_role ON guild_members(guild_id, role);

-- ============================================
-- ROW LEVEL SECURITY - GUILDS
-- ============================================

ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;

-- Anyone can view guilds (for discovery/search)
CREATE POLICY "Anyone can view guilds"
  ON guilds FOR SELECT
  USING (true);

-- Only service role can insert (via create_guild function)
CREATE POLICY "Service role can insert guilds"
  ON guilds FOR INSERT
  WITH CHECK (false);  -- Blocked at RLS, use function

-- Leaders can update their guild settings
CREATE POLICY "Leaders can update own guild"
  ON guilds FOR UPDATE
  USING (
    leader_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- No direct delete - use disband_guild function
CREATE POLICY "No direct guild deletion"
  ON guilds FOR DELETE
  USING (false);

-- ============================================
-- ROW LEVEL SECURITY - GUILD MEMBERS
-- ============================================

ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

-- Members can view their guild's roster
CREATE POLICY "Members can view guild roster"
  ON guild_members FOR SELECT
  USING (
    guild_id IN (
      SELECT guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
    OR
    -- Also allow viewing public guild rosters
    guild_id IN (SELECT id FROM guilds WHERE join_mode = 'open')
  );

-- No direct insert/update/delete - use functions
CREATE POLICY "No direct member insert"
  ON guild_members FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct member update"
  ON guild_members FOR UPDATE
  USING (false);

CREATE POLICY "No direct member delete"
  ON guild_members FOR DELETE
  USING (false);
