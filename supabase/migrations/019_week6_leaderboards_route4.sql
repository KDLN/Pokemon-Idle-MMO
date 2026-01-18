-- Week 6: Leaderboards and Route 4
-- Issues #51 (Pokedex LB), #52 (Catch LB), #53 (Level LB), #54 (Weekly Reset), #55 (Route 4), #56 (Route 4 Pokemon)

-- ============================================
-- WEEKLY STATS TABLE (#54)
-- ============================================

-- Table to track weekly statistics for leaderboards
CREATE TABLE IF NOT EXISTS weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,  -- Monday of the week (DATE_TRUNC('week', date))
  pokemon_caught INT DEFAULT 0,
  highest_level INT DEFAULT 0,
  pokedex_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per player per week
  CONSTRAINT unique_player_week UNIQUE (player_id, week_start)
);

-- Indexes for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_weekly_stats_catches ON weekly_stats(week_start, pokemon_caught DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_level ON weekly_stats(week_start, highest_level DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_pokedex ON weekly_stats(week_start, pokedex_count DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_player ON weekly_stats(player_id);

-- RLS policies - leaderboards are public data
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view weekly stats (for leaderboards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_stats' AND policyname = 'Weekly stats are viewable by all'
  ) THEN
    CREATE POLICY "Weekly stats are viewable by all"
      ON weekly_stats FOR SELECT
      USING (true);
  END IF;
END $$;

-- Players can insert/update their own stats (via service role, but policy for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_stats' AND policyname = 'Players can update own weekly stats'
  ) THEN
    CREATE POLICY "Players can update own weekly stats"
      ON weekly_stats FOR ALL
      USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ============================================
-- ROUTE 4 ZONE (#55)
-- ============================================

-- Route 4 connects Mt. Moon to Cerulean City (future)
-- Transitional zone from cave to grassland
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (11, 'Route 4', 'route', 0.0333, 14, 18)
ON CONFLICT (id) DO NOTHING;

-- Update sequence to prevent ID conflicts
SELECT setval('zones_id_seq', GREATEST(11, (SELECT MAX(id) FROM zones)), true);

-- ============================================
-- ROUTE 4 ZONE CONNECTIONS
-- ============================================

-- Mt. Moon (10) <-> Route 4 (11) - bidirectional
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (10, 11),  -- Mt. Moon -> Route 4
  (11, 10)   -- Route 4 -> Mt. Moon
ON CONFLICT DO NOTHING;

-- ============================================
-- ROUTE 4 ENCOUNTER TABLE (#56)
-- ============================================

-- All Pokemon already exist in pokemon_species (from 015_evolution_data.sql)
-- Encounter rates sum to 1.0 (100%)
-- Features Sandshrew, Ekans, Mankey as primary new encounters
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (11, 27, 0.25),   -- Sandshrew 25% (Ground type, common)
  (11, 23, 0.20),   -- Ekans 20% (Poison type)
  (11, 56, 0.20),   -- Mankey 20% (Fighting type)
  (11, 21, 0.20),   -- Spearow 20% (Normal/Flying, route staple)
  (11, 74, 0.10),   -- Geodude 10% (carryover from Mt. Moon)
  (11, 41, 0.05)    -- Zubat 5% (rare on surface)
ON CONFLICT DO NOTHING;

-- ============================================
-- LEADERBOARD RPC FUNCTIONS (#51-53)
-- ============================================

-- Pokedex Leaderboard: Count unique species caught per player
CREATE OR REPLACE FUNCTION get_pokedex_leaderboard(result_limit INT DEFAULT 50)
RETURNS TABLE(player_id UUID, username TEXT, caught_count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    pe.player_id,
    p.username,
    COUNT(*) as caught_count
  FROM pokedex_entries pe
  JOIN players p ON pe.player_id = p.id
  WHERE pe.caught = true
  GROUP BY pe.player_id, p.username
  ORDER BY caught_count DESC
  LIMIT result_limit;
$$;

-- Catch Leaderboard: Sum total catches per player
CREATE OR REPLACE FUNCTION get_catch_leaderboard(result_limit INT DEFAULT 50)
RETURNS TABLE(player_id UUID, username TEXT, total_catches BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    pe.player_id,
    p.username,
    SUM(pe.catch_count)::BIGINT as total_catches
  FROM pokedex_entries pe
  JOIN players p ON pe.player_id = p.id
  GROUP BY pe.player_id, p.username
  ORDER BY total_catches DESC
  LIMIT result_limit;
$$;

-- Level Leaderboard: Highest level Pokemon per player
CREATE OR REPLACE FUNCTION get_level_leaderboard(result_limit INT DEFAULT 50)
RETURNS TABLE(player_id UUID, username TEXT, max_level INT, pokemon_name TEXT, species_id INT)
LANGUAGE SQL
STABLE
AS $$
  WITH ranked_pokemon AS (
    SELECT
      pok.owner_id,
      pok.level,
      COALESCE(pok.nickname, ps.name) as pokemon_name,
      pok.species_id,
      ROW_NUMBER() OVER (PARTITION BY pok.owner_id ORDER BY pok.level DESC, pok.caught_at ASC) as rn
    FROM pokemon pok
    JOIN pokemon_species ps ON pok.species_id = ps.id
  )
  SELECT
    rp.owner_id as player_id,
    p.username,
    rp.level as max_level,
    rp.pokemon_name,
    rp.species_id
  FROM ranked_pokemon rp
  JOIN players p ON rp.owner_id = p.id
  WHERE rp.rn = 1
  ORDER BY rp.level DESC
  LIMIT result_limit;
$$;

-- Get player's rank for a specific leaderboard type
CREATE OR REPLACE FUNCTION get_player_rank(p_player_id UUID, p_type TEXT)
RETURNS TABLE(rank BIGINT, value BIGINT)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_type = 'pokedex' THEN
    RETURN QUERY
    WITH player_stats AS (
      SELECT player_id, COUNT(*) as stat_value
      FROM pokedex_entries
      WHERE caught = true
      GROUP BY player_id
    ),
    ranked AS (
      SELECT
        ps.player_id,
        ps.stat_value,
        ROW_NUMBER() OVER (ORDER BY ps.stat_value DESC) as player_rank
      FROM player_stats ps
    )
    SELECT r.player_rank, r.stat_value
    FROM ranked r
    WHERE r.player_id = p_player_id;

  ELSIF p_type = 'catches' THEN
    RETURN QUERY
    WITH player_stats AS (
      SELECT player_id, SUM(catch_count)::BIGINT as stat_value
      FROM pokedex_entries
      GROUP BY player_id
    ),
    ranked AS (
      SELECT
        ps.player_id,
        ps.stat_value,
        ROW_NUMBER() OVER (ORDER BY ps.stat_value DESC) as player_rank
      FROM player_stats ps
    )
    SELECT r.player_rank, r.stat_value
    FROM ranked r
    WHERE r.player_id = p_player_id;

  ELSIF p_type = 'level' THEN
    RETURN QUERY
    WITH player_stats AS (
      SELECT owner_id as player_id, MAX(level)::BIGINT as stat_value
      FROM pokemon
      GROUP BY owner_id
    ),
    ranked AS (
      SELECT
        ps.player_id,
        ps.stat_value,
        ROW_NUMBER() OVER (ORDER BY ps.stat_value DESC) as player_rank
      FROM player_stats ps
    )
    SELECT r.player_rank, r.stat_value
    FROM ranked r
    WHERE r.player_id = p_player_id;
  END IF;

  RETURN;
END;
$$;
