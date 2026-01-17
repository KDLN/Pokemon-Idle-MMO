-- Week 5: Enhanced Chat & Whispers
-- Issues #45 (Whispers), #46 (Notifications), #47 (Block/Mute), #48 (Commands), #49 (Mt. Moon), #50 (Rare spawns)

-- ============================================
-- BLOCKED PLAYERS TABLE (#47)
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-blocking and duplicates
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id)
);

-- Indexes for efficient lookups (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_blocked_players_blocker ON blocked_players(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_players_blocked ON blocked_players(blocked_id);

-- RLS policies (use DO block for idempotency)
ALTER TABLE blocked_players ENABLE ROW LEVEL SECURITY;

-- Players can view their own blocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blocked_players' AND policyname = 'Players can view own blocks'
  ) THEN
    CREATE POLICY "Players can view own blocks"
      ON blocked_players FOR SELECT
      USING (blocker_id IN (SELECT id FROM players WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Players can block others
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blocked_players' AND policyname = 'Players can block others'
  ) THEN
    CREATE POLICY "Players can block others"
      ON blocked_players FOR INSERT
      WITH CHECK (blocker_id IN (SELECT id FROM players WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Players can unblock
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blocked_players' AND policyname = 'Players can unblock'
  ) THEN
    CREATE POLICY "Players can unblock"
      ON blocked_players FOR DELETE
      USING (blocker_id IN (SELECT id FROM players WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ============================================
-- MT. MOON ZONE (#49)
-- ============================================

-- Mt. Moon is a cave zone with higher encounter rate and tougher Pokemon
-- Use ON CONFLICT DO NOTHING for idempotency
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (10, 'Mt. Moon', 'route', 0.0400, 12, 16)
ON CONFLICT (id) DO NOTHING;

-- Update sequence to prevent ID conflicts (true = is_called, so next insert gets 11)
SELECT setval('zones_id_seq', GREATEST(10, (SELECT MAX(id) FROM zones)), true);

-- ============================================
-- ZONE CONNECTIONS FOR MT. MOON
-- ============================================

-- Mt. Moon Entrance (id=9) <-> Mt. Moon (id=10) - bidirectional
-- Use ON CONFLICT DO NOTHING for idempotency
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (9, 10),  -- Mt. Moon Entrance -> Mt. Moon
  (10, 9)  -- Mt. Moon -> Mt. Moon Entrance
ON CONFLICT DO NOTHING;

-- ============================================
-- MT. MOON ENCOUNTER TABLE (#50)
-- ============================================

-- Encounter rates sum to 1.0 (100%)
-- Clefairy at 15% (increased from 5% on Route 3 - this is the place to catch them!)
-- Use ON CONFLICT DO NOTHING for idempotency
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (10, 41, 0.30),   -- Zubat 30% (common cave bat)
  (10, 74, 0.25),   -- Geodude 25% (common cave rock)
  (10, 46, 0.15),   -- Paras 15% (mushroom Pokemon)
  (10, 35, 0.15),   -- Clefairy 15% (RARE - increased from 5%!)
  (10, 27, 0.10),   -- Sandshrew 10% (ground type)
  (10, 39, 0.05)   -- Jigglypuff 5% (very rare here)
ON CONFLICT DO NOTHING;
