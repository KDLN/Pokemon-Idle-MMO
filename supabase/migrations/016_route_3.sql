-- Pokemon Idle MMO - Route 3 Migration
-- Migration 016
-- Issues #35 (Route 3 zone), #36 (Route 3 Pokemon)

-- ============================================
-- 1. ADD ROUTE 3 ZONE
-- ============================================

-- Route 3 is east of Pewter City, leading toward Mt. Moon
-- Level range 8-12 as specified in issue #35
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (8, 'Route 3', 'route', 0.0333, 8, 12);

-- Reset sequence to continue from 9
SELECT setval('zones_id_seq', 8);

-- ============================================
-- 2. ADD MT. MOON ENTRANCE ZONE
-- ============================================

-- Mt. Moon entrance is a transition zone before the cave
-- Lower encounter rate as it's more of a pathway
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (9, 'Mt. Moon Entrance', 'route', 0.0250, 10, 14);

-- Reset sequence to continue from 10
SELECT setval('zones_id_seq', 9);

-- ============================================
-- 3. ADD ZONE CONNECTIONS (bidirectional)
-- ============================================

-- Pewter City <-> Route 3
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (7, 8),  -- Pewter City -> Route 3
  (8, 7);  -- Route 3 -> Pewter City

-- Route 3 <-> Mt. Moon Entrance
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (8, 9),  -- Route 3 -> Mt. Moon Entrance
  (9, 8);  -- Mt. Moon Entrance -> Route 3

-- ============================================
-- 4. ADD ROUTE 3 ENCOUNTER TABLE
-- ============================================

-- Route 3 Pokemon encounters as specified in issue #36:
-- - Jigglypuff (#39) - common
-- - Zubat (#41) - common
-- - Paras (#46) - uncommon
-- - Geodude (#74) - uncommon
-- - Clefairy (#35) - rare
-- Also including some overlap with earlier routes for variety:
-- - Spearow (#21) - common (it's a route staple)
-- - Nidoran M/F for continued availability

INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (8, 21, 0.15),   -- Spearow 15% (common route bird)
  (8, 39, 0.20),   -- Jigglypuff 20% (common)
  (8, 41, 0.25),   -- Zubat 25% (common - preparing for Mt. Moon)
  (8, 46, 0.15),   -- Paras 15% (uncommon)
  (8, 74, 0.15),   -- Geodude 15% (uncommon)
  (8, 35, 0.05),   -- Clefairy 5% (rare)
  (8, 29, 0.025),  -- Nidoran F 2.5% (rare)
  (8, 32, 0.025);  -- Nidoran M 2.5% (rare)

-- ============================================
-- 5. ADD MT. MOON ENTRANCE ENCOUNTER TABLE
-- ============================================

-- Mt. Moon entrance has cave-dwelling Pokemon starting to appear
-- Higher rates of Zubat and Geodude to foreshadow the cave
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (9, 41, 0.35),   -- Zubat 35% (very common near caves)
  (9, 74, 0.25),   -- Geodude 25% (common near mountains)
  (9, 46, 0.15),   -- Paras 15% (found in damp areas)
  (9, 35, 0.10),   -- Clefairy 10% (more common near Mt. Moon)
  (9, 39, 0.10),   -- Jigglypuff 10%
  (9, 21, 0.05);   -- Spearow 5% (less common near caves)

-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================

-- Check Route 3 zone:
-- SELECT * FROM zones WHERE name IN ('Route 3', 'Mt. Moon Entrance');

-- Check zone connections from Pewter City:
-- SELECT z1.name as from_zone, z2.name as to_zone
-- FROM zone_connections zc
-- JOIN zones z1 ON zc.from_zone_id = z1.id
-- JOIN zones z2 ON zc.to_zone_id = z2.id
-- WHERE z1.name = 'Pewter City' OR z2.name = 'Pewter City' OR z1.name = 'Route 3' OR z2.name = 'Route 3';

-- Check Route 3 encounters:
-- SELECT z.name as zone, ps.name as pokemon, et.encounter_rate
-- FROM encounter_tables et
-- JOIN zones z ON et.zone_id = z.id
-- JOIN pokemon_species ps ON et.species_id = ps.id
-- WHERE z.name = 'Route 3'
-- ORDER BY et.encounter_rate DESC;

-- Verify encounter rates sum to 1.0:
-- SELECT z.name, SUM(et.encounter_rate) as total_rate
-- FROM encounter_tables et
-- JOIN zones z ON et.zone_id = z.id
-- WHERE z.name IN ('Route 3', 'Mt. Moon Entrance')
-- GROUP BY z.name;
