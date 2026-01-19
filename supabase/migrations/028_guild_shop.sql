-- Pokemon Idle MMO - Guild Shop & Statistics System
-- Migration 028

-- ============================================
-- GUILD POINTS COLUMN
-- ============================================

-- Add guild_points column to guilds table for accumulated quest rewards
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS guild_points INT DEFAULT 0 CHECK (guild_points >= 0);

-- ============================================
-- BUFF TABLES
-- ============================================

-- Active buffs for each guild (one per buff type)
CREATE TABLE guild_buffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  buff_type VARCHAR(50) NOT NULL CHECK (buff_type IN ('xp_bonus', 'catch_rate', 'encounter_rate')),
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.10,  -- 1.10 = +10%
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  purchased_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, buff_type)  -- Only one active buff per type per guild
);

-- Purchase history for tracking and auditing
CREATE TABLE guild_buff_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  buff_type VARCHAR(50) NOT NULL,
  duration_hours INT NOT NULL,
  cost_currency BIGINT,
  cost_guild_points INT,
  purchased_by UUID REFERENCES players(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUFF TABLE INDEXES
-- ============================================

-- Fast active buff lookups by guild and expiration
CREATE INDEX idx_guild_buffs_guild_ends ON guild_buffs(guild_id, ends_at);

-- Fast purchase history queries
CREATE INDEX idx_guild_buff_purchases_guild ON guild_buff_purchases(guild_id, purchased_at DESC);

-- ============================================
-- CLEANUP FUNCTION
-- ============================================

-- Cleanup expired buffs (called opportunistically)
CREATE OR REPLACE FUNCTION cleanup_expired_buffs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM guild_buffs WHERE ends_at < NOW();
END;
$$;

-- ============================================
-- BUFF PURCHASE FUNCTION
-- ============================================

-- Purchase a guild buff using currency or guild points
CREATE OR REPLACE FUNCTION purchase_guild_buff(
  p_player_id UUID,
  p_guild_id UUID,
  p_buff_type VARCHAR,
  p_duration_hours INT,
  p_use_guild_points BOOLEAN DEFAULT false
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_guild RECORD;
  v_bank RECORD;
  v_current_buff RECORD;
  v_cost_currency BIGINT := 0;
  v_cost_guild_points INT := 0;
  v_new_ends_at TIMESTAMPTZ;
  v_multiplier DECIMAL(3,2);
BEGIN
  -- Validate inputs
  IF p_buff_type NOT IN ('xp_bonus', 'catch_rate', 'encounter_rate') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid buff type. Must be xp_bonus, catch_rate, or encounter_rate');
  END IF;

  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RETURN json_build_object('success', false, 'error', 'Duration must be between 1 and 24 hours');
  END IF;

  -- Opportunistically cleanup expired buffs
  PERFORM cleanup_expired_buffs();

  -- Lock member row and verify role
  SELECT gm.*, g.guild_points INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can purchase buffs');
  END IF;

  -- Calculate cost based on payment method
  -- Currency: 1000 per hour
  -- Guild Points: 200 per hour (5:1 ratio, making points more valuable)
  IF p_use_guild_points THEN
    v_cost_guild_points := 200 * p_duration_hours;

    -- Lock guild row and check guild points
    SELECT * INTO v_guild
    FROM guilds
    WHERE id = p_guild_id
    FOR UPDATE;

    IF v_guild.guild_points < v_cost_guild_points THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient guild points', 'required', v_cost_guild_points, 'available', v_guild.guild_points);
    END IF;

    -- Deduct guild points
    UPDATE guilds
    SET guild_points = guild_points - v_cost_guild_points
    WHERE id = p_guild_id;
  ELSE
    v_cost_currency := 1000 * p_duration_hours;

    -- Lock bank row and check balance
    SELECT * INTO v_bank
    FROM guild_bank_currency
    WHERE guild_id = p_guild_id
    FOR UPDATE;

    IF v_bank IS NULL OR v_bank.balance < v_cost_currency THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient bank funds', 'required', v_cost_currency, 'available', COALESCE(v_bank.balance, 0));
    END IF;

    -- Deduct currency from guild bank
    UPDATE guild_bank_currency
    SET balance = balance - v_cost_currency
    WHERE guild_id = p_guild_id;
  END IF;

  -- Determine multiplier based on buff type (all +10% for now)
  v_multiplier := 1.10;

  -- Get current buff if exists (for stacking calculation)
  SELECT * INTO v_current_buff
  FROM guild_buffs
  WHERE guild_id = p_guild_id AND buff_type = p_buff_type
  FOR UPDATE;

  IF v_current_buff IS NOT NULL AND v_current_buff.ends_at > NOW() THEN
    -- Extend existing buff (stack from current end time)
    -- Cap at NOW() + 24 hours maximum
    v_new_ends_at := LEAST(
      v_current_buff.ends_at + (p_duration_hours * INTERVAL '1 hour'),
      NOW() + INTERVAL '24 hours'
    );

    UPDATE guild_buffs
    SET ends_at = v_new_ends_at, purchased_by = p_player_id
    WHERE id = v_current_buff.id;
  ELSE
    -- Create new buff or replace expired one
    v_new_ends_at := NOW() + (p_duration_hours * INTERVAL '1 hour');

    INSERT INTO guild_buffs (guild_id, buff_type, multiplier, ends_at, purchased_by)
    VALUES (p_guild_id, p_buff_type, v_multiplier, v_new_ends_at, p_player_id)
    ON CONFLICT (guild_id, buff_type) DO UPDATE SET
      multiplier = v_multiplier,
      started_at = NOW(),
      ends_at = v_new_ends_at,
      purchased_by = p_player_id;
  END IF;

  -- Record purchase history
  INSERT INTO guild_buff_purchases (guild_id, buff_type, duration_hours, cost_currency, cost_guild_points, purchased_by)
  VALUES (p_guild_id, p_buff_type, p_duration_hours, v_cost_currency, v_cost_guild_points, p_player_id);

  -- Log to guild bank logs
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'currency',
    jsonb_build_object(
      'type', 'buff_purchase',
      'buff_type', p_buff_type,
      'duration_hours', p_duration_hours,
      'cost_currency', v_cost_currency,
      'cost_guild_points', v_cost_guild_points,
      'payment_method', CASE WHEN p_use_guild_points THEN 'guild_points' ELSE 'currency' END
    ),
    CASE WHEN p_use_guild_points THEN NULL ELSE (SELECT balance FROM guild_bank_currency WHERE guild_id = p_guild_id) END
  );

  RETURN json_build_object(
    'success', true,
    'buff_type', p_buff_type,
    'ends_at', v_new_ends_at,
    'multiplier', v_multiplier,
    'cost_currency', v_cost_currency,
    'cost_guild_points', v_cost_guild_points,
    'remaining_currency', (SELECT balance FROM guild_bank_currency WHERE guild_id = p_guild_id),
    'remaining_guild_points', (SELECT guild_points FROM guilds WHERE id = p_guild_id)
  );
END;
$$;

-- ============================================
-- ACTIVE BUFFS QUERY FUNCTION
-- ============================================

-- Get all active guild buffs (for tick processing)
CREATE OR REPLACE FUNCTION get_active_guild_buffs(p_guild_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_buffs JSON;
BEGIN
  -- Cleanup expired buffs first
  PERFORM cleanup_expired_buffs();

  -- Build object with each buff type keyed
  SELECT json_build_object(
    'xp_bonus', (
      SELECT json_build_object('multiplier', multiplier, 'ends_at', ends_at)
      FROM guild_buffs
      WHERE guild_id = p_guild_id AND buff_type = 'xp_bonus' AND ends_at > NOW()
    ),
    'catch_rate', (
      SELECT json_build_object('multiplier', multiplier, 'ends_at', ends_at)
      FROM guild_buffs
      WHERE guild_id = p_guild_id AND buff_type = 'catch_rate' AND ends_at > NOW()
    ),
    'encounter_rate', (
      SELECT json_build_object('multiplier', multiplier, 'ends_at', ends_at)
      FROM guild_buffs
      WHERE guild_id = p_guild_id AND buff_type = 'encounter_rate' AND ends_at > NOW()
    )
  ) INTO v_buffs;

  RETURN v_buffs;
END;
$$;

-- ============================================
-- GUILD STATISTICS FUNCTION
-- ============================================

-- Get comprehensive guild statistics
CREATE OR REPLACE FUNCTION get_guild_statistics(p_guild_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_catches', (
      SELECT COALESCE(SUM(pe.catch_count), 0)
      FROM pokedex_entries pe
      JOIN players p ON p.id = pe.player_id
      JOIN guild_members gm ON gm.player_id = p.id
      WHERE gm.guild_id = p_guild_id
    ),
    'unique_species', (
      SELECT COUNT(DISTINCT pe.species_id)
      FROM pokedex_entries pe
      JOIN players p ON p.id = pe.player_id
      JOIN guild_members gm ON gm.player_id = p.id
      WHERE gm.guild_id = p_guild_id AND pe.caught = true
    ),
    'member_count', g.member_count,
    'avg_level', (
      SELECT COALESCE(ROUND(AVG(poke.level)::numeric, 1), 0)
      FROM pokemon poke
      JOIN players pl ON pl.id = poke.owner_id
      JOIN guild_members gm ON gm.player_id = pl.id
      WHERE gm.guild_id = p_guild_id
    ),
    'total_pokemon', (
      SELECT COUNT(*)
      FROM pokemon poke
      JOIN players pl ON pl.id = poke.owner_id
      JOIN guild_members gm ON gm.player_id = pl.id
      WHERE gm.guild_id = p_guild_id
    ),
    'days_active', EXTRACT(DAY FROM NOW() - g.created_at)::INT,
    'created_at', g.created_at,
    'guild_points', g.guild_points,
    'bank_balance', (SELECT balance FROM guild_bank_currency WHERE guild_id = p_guild_id),
    'active_buffs', (SELECT get_active_guild_buffs(p_guild_id))
  ) INTO v_stats
  FROM guilds g
  WHERE g.id = p_guild_id;

  RETURN v_stats;
END;
$$;

-- ============================================
-- GUILD LEADERBOARD FUNCTION
-- ============================================

-- Get guild leaderboard by configurable metric
CREATE OR REPLACE FUNCTION get_guild_leaderboard(
  p_metric TEXT,  -- 'catches', 'pokedex', 'members'
  p_limit INT DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure limit is reasonable
  p_limit := LEAST(GREATEST(p_limit, 1), 100);

  IF p_metric = 'members' THEN
    RETURN (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY member_count DESC, created_at ASC)::INT as rank,
          id, name, tag, member_count as value,
          (SELECT username FROM players WHERE id = g.leader_id) as leader_name
        FROM guilds g
        ORDER BY member_count DESC, created_at ASC
        LIMIT p_limit
      ) r
    );
  ELSIF p_metric = 'catches' THEN
    RETURN (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY COALESCE(total_catches, 0) DESC, g.created_at ASC)::INT as rank,
          g.id, g.name, g.tag, COALESCE(total_catches, 0)::BIGINT as value,
          (SELECT username FROM players WHERE id = g.leader_id) as leader_name
        FROM guilds g
        LEFT JOIN (
          SELECT gm.guild_id, SUM(pe.catch_count)::BIGINT as total_catches
          FROM guild_members gm
          JOIN pokedex_entries pe ON pe.player_id = gm.player_id
          GROUP BY gm.guild_id
        ) stats ON stats.guild_id = g.id
        ORDER BY COALESCE(total_catches, 0) DESC, g.created_at ASC
        LIMIT p_limit
      ) r
    );
  ELSIF p_metric = 'pokedex' THEN
    RETURN (
      SELECT json_agg(row_to_json(r)) FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY COALESCE(unique_species, 0) DESC, g.created_at ASC)::INT as rank,
          g.id, g.name, g.tag, COALESCE(unique_species, 0)::INT as value,
          (SELECT username FROM players WHERE id = g.leader_id) as leader_name
        FROM guilds g
        LEFT JOIN (
          SELECT gm.guild_id, COUNT(DISTINCT pe.species_id)::INT as unique_species
          FROM guild_members gm
          JOIN pokedex_entries pe ON pe.player_id = gm.player_id
          WHERE pe.caught = true
          GROUP BY gm.guild_id
        ) stats ON stats.guild_id = g.id
        ORDER BY COALESCE(unique_species, 0) DESC, g.created_at ASC
        LIMIT p_limit
      ) r
    );
  ELSE
    -- Default to empty array for invalid metric
    RETURN '[]'::JSON;
  END IF;
END;
$$;

-- ============================================
-- PLAYER GUILD RANK FUNCTION
-- ============================================

-- Get the rank of a player's guild for a given metric
CREATE OR REPLACE FUNCTION get_player_guild_rank(
  p_player_id UUID,
  p_metric TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_guild_id UUID;
  v_rank INT;
  v_value BIGINT;
BEGIN
  -- Get player's guild
  SELECT guild_id INTO v_guild_id
  FROM guild_members
  WHERE player_id = p_player_id;

  IF v_guild_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player is not in a guild');
  END IF;

  IF p_metric = 'members' THEN
    SELECT rank, value INTO v_rank, v_value
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY member_count DESC, created_at ASC)::INT as rank,
        id,
        member_count::BIGINT as value
      FROM guilds
    ) ranked
    WHERE id = v_guild_id;
  ELSIF p_metric = 'catches' THEN
    SELECT rank, value INTO v_rank, v_value
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY COALESCE(total_catches, 0) DESC, g.created_at ASC)::INT as rank,
        g.id,
        COALESCE(total_catches, 0)::BIGINT as value
      FROM guilds g
      LEFT JOIN (
        SELECT gm.guild_id, SUM(pe.catch_count)::BIGINT as total_catches
        FROM guild_members gm
        JOIN pokedex_entries pe ON pe.player_id = gm.player_id
        GROUP BY gm.guild_id
      ) stats ON stats.guild_id = g.id
    ) ranked
    WHERE id = v_guild_id;
  ELSIF p_metric = 'pokedex' THEN
    SELECT rank, value INTO v_rank, v_value
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY COALESCE(unique_species, 0) DESC, g.created_at ASC)::INT as rank,
        g.id,
        COALESCE(unique_species, 0)::BIGINT as value
      FROM guilds g
      LEFT JOIN (
        SELECT gm.guild_id, COUNT(DISTINCT pe.species_id)::BIGINT as unique_species
        FROM guild_members gm
        JOIN pokedex_entries pe ON pe.player_id = gm.player_id
        WHERE pe.caught = true
        GROUP BY gm.guild_id
      ) stats ON stats.guild_id = g.id
    ) ranked
    WHERE id = v_guild_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid metric');
  END IF;

  RETURN json_build_object(
    'success', true,
    'guild_id', v_guild_id,
    'metric', p_metric,
    'rank', v_rank,
    'value', v_value
  );
END;
$$;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Fast leaderboard queries - index on guild_id for member lookups
CREATE INDEX IF NOT EXISTS idx_players_guild_id ON players(guild_id) WHERE guild_id IS NOT NULL;

-- Fast pokedex queries for statistics
CREATE INDEX IF NOT EXISTS idx_pokedex_player_caught ON pokedex_entries(player_id) WHERE caught = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on buff tables
ALTER TABLE guild_buffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_buff_purchases ENABLE ROW LEVEL SECURITY;

-- Guild buffs: members can view
CREATE POLICY "Guild members can view buffs"
  ON guild_buffs FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Block direct mutations (force use of functions)
CREATE POLICY "No direct buff insert"
  ON guild_buffs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct buff update"
  ON guild_buffs FOR UPDATE
  USING (false);

CREATE POLICY "No direct buff delete"
  ON guild_buffs FOR DELETE
  USING (false);

-- Guild buff purchases: members can view history
CREATE POLICY "Guild members can view buff purchases"
  ON guild_buff_purchases FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Block direct mutations
CREATE POLICY "No direct buff purchase insert"
  ON guild_buff_purchases FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct buff purchase update"
  ON guild_buff_purchases FOR UPDATE
  USING (false);

CREATE POLICY "No direct buff purchase delete"
  ON guild_buff_purchases FOR DELETE
  USING (false);

-- ============================================
-- FUNCTION GRANTS
-- ============================================

GRANT SELECT ON guild_buffs TO authenticated;
GRANT SELECT ON guild_buff_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_guild_buff TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_guild_buffs TO authenticated;
GRANT EXECUTE ON FUNCTION get_guild_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_guild_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_guild_rank TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_buffs TO authenticated;
