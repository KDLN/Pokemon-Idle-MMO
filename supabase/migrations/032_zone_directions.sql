-- Pokemon Idle MMO - Zone Directions Migration
-- Migration 032
-- Adds direction column to zone_connections for navigation ordering

-- ============================================
-- 1. ADD DIRECTION COLUMN
-- ============================================

ALTER TABLE zone_connections
ADD COLUMN direction TEXT;

-- ============================================
-- 2. BACKFILL EXISTING CONNECTIONS
-- Direction is from the perspective of from_zone_id
-- N = travel north to reach to_zone
-- S = travel south to reach to_zone
-- E = travel east to reach to_zone
-- W = travel west to reach to_zone
-- ============================================

-- Pallet Town (1) <-> Route 1 (2)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 1 AND to_zone_id = 2;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 2 AND to_zone_id = 1;

-- Route 1 (2) <-> Viridian City (3)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 2 AND to_zone_id = 3;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 3 AND to_zone_id = 2;

-- Viridian City (3) <-> Route 2 (4)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 3 AND to_zone_id = 4;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 4 AND to_zone_id = 3;

-- Route 2 (4) <-> Viridian Forest (5)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 4 AND to_zone_id = 5;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 5 AND to_zone_id = 4;

-- Viridian Forest (5) <-> Route 2 North (6)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 5 AND to_zone_id = 6;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 6 AND to_zone_id = 5;

-- Route 2 North (6) <-> Pewter City (7)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 6 AND to_zone_id = 7;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 7 AND to_zone_id = 6;

-- Pewter City (7) <-> Route 3 (8)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 7 AND to_zone_id = 8;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 8 AND to_zone_id = 7;

-- Route 3 (8) <-> Mt. Moon Entrance (9)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 8 AND to_zone_id = 9;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 9 AND to_zone_id = 8;

-- Mt. Moon Entrance (9) <-> Mt. Moon (10)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 9 AND to_zone_id = 10;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 10 AND to_zone_id = 9;

-- Mt. Moon (10) <-> Route 4 (11)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 10 AND to_zone_id = 11;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 11 AND to_zone_id = 10;

-- Route 4 (11) <-> Cerulean City (12)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 11 AND to_zone_id = 12;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 12 AND to_zone_id = 11;

-- Cerulean City (12) <-> Route 24 (13)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 12 AND to_zone_id = 13;
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 13 AND to_zone_id = 12;

-- Route 24 (13) <-> Route 25 (14)
UPDATE zone_connections SET direction = 'E' WHERE from_zone_id = 13 AND to_zone_id = 14;
UPDATE zone_connections SET direction = 'W' WHERE from_zone_id = 14 AND to_zone_id = 13;

-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================

-- Check all directions are set:
-- SELECT z1.name as from_zone, z2.name as to_zone, zc.direction
-- FROM zone_connections zc
-- JOIN zones z1 ON zc.from_zone_id = z1.id
-- JOIN zones z2 ON zc.to_zone_id = z2.id
-- ORDER BY z1.id, z2.id;

-- Check for any missing directions:
-- SELECT * FROM zone_connections WHERE direction IS NULL;
