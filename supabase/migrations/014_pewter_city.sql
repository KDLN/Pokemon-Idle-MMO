-- Pokemon Idle MMO - Pewter City Migration
-- Migration 014
-- Issues #28 (Pewter City zone), #29 (Move Brock's Gym), #30 (Pewter Museum)

-- ============================================
-- 1. ADD PEWTER CITY ZONE
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (7, 'Pewter City', 'town', 0.0000, 1, 1);

-- Reset sequence to continue from 8
SELECT setval('zones_id_seq', 7);

-- ============================================
-- 2. ADD ZONE CONNECTIONS (bidirectional)
-- ============================================

-- Route 2 North <-> Pewter City
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (6, 7),  -- Route 2 North -> Pewter City
  (7, 6); -- Pewter City -> Route 2 North

-- Note: Route 3 connection will be added in a future migration

-- ============================================
-- 3. MOVE BROCK'S GYM TO PEWTER CITY
-- ============================================

UPDATE gym_leaders
SET zone_id = 7
WHERE id = 'brock';

-- ============================================
-- 4. ADD MUSEUM MEMBERSHIP TRACKING
-- ============================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS museum_member BOOLEAN DEFAULT FALSE;

-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================

-- Check Pewter City zone:
-- SELECT * FROM zones WHERE name = 'Pewter City';

-- Check zone connections:
-- SELECT z1.name as from_zone, z2.name as to_zone
-- FROM zone_connections zc
-- JOIN zones z1 ON zc.from_zone_id = z1.id
-- JOIN zones z2 ON zc.to_zone_id = z2.id
-- WHERE zc.from_zone_id = 7 OR zc.to_zone_id = 7;

-- Check Brock's gym location:
-- SELECT gl.name, z.name as zone_name
-- FROM gym_leaders gl
-- JOIN zones z ON gl.zone_id = z.id
-- WHERE gl.id = 'brock';

-- Check museum_member column:
-- SELECT museum_member FROM players LIMIT 1;
