-- Pokemon Idle MMO - Seed Data
-- MVP: 10 Pokemon, 3 Zones

-- ============================================
-- ZONES
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (1, 'Pallet Town', 'town', 0.0000, 1, 1),
  (2, 'Route 1', 'route', 0.0333, 2, 5),  -- ~3.3% per tick = ~1 encounter per 30 seconds
  (3, 'Viridian City', 'town', 0.0000, 1, 1);

-- Reset sequence to continue from 4
SELECT setval('zones_id_seq', 3);

-- ============================================
-- ZONE CONNECTIONS (bidirectional)
-- ============================================

INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (1, 2),  -- Pallet Town -> Route 1
  (2, 1),  -- Route 1 -> Pallet Town
  (2, 3),  -- Route 1 -> Viridian City
  (3, 2);  -- Viridian City -> Route 1

-- ============================================
-- POKEMON SPECIES (10 for MVP)
-- ============================================

INSERT INTO pokemon_species (id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield) VALUES
  -- Starters
  (1, 'Bulbasaur', 'Grass', 'Poison', 45, 49, 49, 65, 65, 45, 45, 64),
  (4, 'Charmander', 'Fire', NULL, 39, 52, 43, 60, 50, 65, 45, 62),
  (7, 'Squirtle', 'Water', NULL, 44, 48, 65, 50, 64, 43, 45, 63),

  -- Route 1 Common Pokemon
  (16, 'Pidgey', 'Normal', 'Flying', 40, 45, 40, 35, 35, 56, 255, 50),
  (19, 'Rattata', 'Normal', NULL, 30, 56, 35, 25, 35, 72, 255, 51),

  -- Route 1 Bug Pokemon
  (10, 'Caterpie', 'Bug', NULL, 45, 30, 35, 20, 20, 45, 255, 39),
  (13, 'Weedle', 'Bug', 'Poison', 40, 35, 30, 20, 20, 50, 255, 39),

  -- Route 1 Uncommon
  (21, 'Spearow', 'Normal', 'Flying', 40, 60, 30, 31, 31, 70, 255, 52),

  -- Route 1 Rare
  (29, 'Nidoran F', 'Poison', NULL, 55, 47, 52, 40, 40, 41, 235, 55),
  (32, 'Nidoran M', 'Poison', NULL, 46, 57, 40, 40, 40, 50, 235, 55);

-- ============================================
-- ENCOUNTER TABLES
-- ============================================

-- Route 1 encounters (must sum to 1.0 for proper weighting)
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (2, 16, 0.30),   -- Pidgey 30%
  (2, 19, 0.30),   -- Rattata 30%
  (2, 10, 0.15),   -- Caterpie 15%
  (2, 13, 0.15),   -- Weedle 15%
  (2, 21, 0.05),   -- Spearow 5%
  (2, 29, 0.025),  -- Nidoran F 2.5%
  (2, 32, 0.025);  -- Nidoran M 2.5%
