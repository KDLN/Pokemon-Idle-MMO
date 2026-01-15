-- Migration 008: Add Viridian Forest and related Pokemon
-- Issues #15 and #16: Viridian Forest zone + Pokemon

-- ============================================
-- 1. Add new Pokemon species
-- ============================================

-- Pikachu (rare) and Butterfree (uncommon)
-- Note: Metapod (11) and Kakuna (14) already exist from migration 006
INSERT INTO pokemon_species (id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield) VALUES
  (25, 'Pikachu', 'Electric', NULL, 35, 55, 40, 50, 50, 90, 190, 112),
  (12, 'Butterfree', 'Bug', 'Flying', 60, 45, 50, 90, 80, 70, 45, 178);

-- ============================================
-- 2. Add Viridian Forest zone
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (5, 'Viridian Forest', 'route', 0.0400, 3, 6);  -- Slightly higher encounter rate for forest

-- Reset sequence to continue from 6
SELECT setval('zones_id_seq', 5);

-- ============================================
-- 3. Add Route 2 North zone (exit toward Pewter)
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (6, 'Route 2 North', 'route', 0.0333, 4, 7);

-- Reset sequence to continue from 7
SELECT setval('zones_id_seq', 6);

-- ============================================
-- 4. Add zone connections (bidirectional)
-- ============================================

INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  -- Route 2 <-> Viridian Forest
  (4, 5),  -- Route 2 -> Viridian Forest
  (5, 4),  -- Viridian Forest -> Route 2
  -- Viridian Forest <-> Route 2 North
  (5, 6),  -- Viridian Forest -> Route 2 North
  (6, 5);  -- Route 2 North -> Viridian Forest

-- ============================================
-- 5. Add Viridian Forest encounter table
-- ============================================

-- Forest-themed encounters with bug types and rare Pikachu
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (5, 10, 0.25),   -- Caterpie 25%
  (5, 13, 0.25),   -- Weedle 25%
  (5, 11, 0.15),   -- Metapod 15%
  (5, 14, 0.15),   -- Kakuna 15%
  (5, 12, 0.10),   -- Butterfree 10% (uncommon)
  (5, 16, 0.05),   -- Pidgey 5%
  (5, 25, 0.05);   -- Pikachu 5% (rare)

-- ============================================
-- 6. Add Route 2 North encounter table
-- ============================================

-- Similar to Route 2 but slightly higher level Pokemon
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (6, 16, 0.20),   -- Pidgey 20%
  (6, 19, 0.20),   -- Rattata 20%
  (6, 43, 0.20),   -- Oddish 20%
  (6, 11, 0.15),   -- Metapod 15%
  (6, 14, 0.15),   -- Kakuna 15%
  (6, 17, 0.05),   -- Pidgeotto 5%
  (6, 20, 0.05);   -- Raticate 5%
