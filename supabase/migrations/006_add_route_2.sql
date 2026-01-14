-- Migration 006: Add Route 2 and 5 new Pokemon species
-- Route 2 connects north from Viridian City

-- ============================================
-- 1. Add new Pokemon species
-- ============================================

INSERT INTO pokemon_species (id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield) VALUES
  (11, 'Metapod', 'Bug', NULL, 50, 20, 55, 25, 25, 30, 120, 72),
  (14, 'Kakuna', 'Bug', 'Poison', 45, 25, 50, 25, 25, 35, 120, 72),
  (17, 'Pidgeotto', 'Normal', 'Flying', 63, 60, 55, 50, 50, 71, 120, 122),
  (20, 'Raticate', 'Normal', NULL, 55, 81, 60, 50, 70, 97, 127, 145),
  (43, 'Oddish', 'Grass', 'Poison', 45, 50, 55, 75, 65, 30, 255, 64);

-- ============================================
-- 2. Add Route 2 zone
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (4, 'Route 2', 'route', 0.0333, 3, 7);

-- ============================================
-- 3. Add zone connections (bidirectional)
-- ============================================

INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (3, 4),  -- Viridian City -> Route 2
  (4, 3);  -- Route 2 -> Viridian City

-- ============================================
-- 4. Add Route 2 encounter table
-- ============================================

INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (4, 16, 0.20),   -- Pidgey 20%
  (4, 19, 0.20),   -- Rattata 20%
  (4, 43, 0.20),   -- Oddish 20% (NEW - common grass type)
  (4, 11, 0.15),   -- Metapod 15% (NEW - evolution of Caterpie)
  (4, 14, 0.15),   -- Kakuna 15% (NEW - evolution of Weedle)
  (4, 17, 0.05),   -- Pidgeotto 5% (NEW - rare evolved form)
  (4, 20, 0.05);   -- Raticate 5% (NEW - rare evolved form)
