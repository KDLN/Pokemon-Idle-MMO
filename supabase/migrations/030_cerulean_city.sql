-- Pokemon Idle MMO - Cerulean City Migration
-- Migration 030
-- Adds Cerulean City, Misty's Gym, Route 24 (Nugget Bridge), and Route 25 (Bill's House area)

-- ============================================
-- 1. ADD ZONES
-- ============================================

-- Cerulean City - The second major town after Pewter City
-- No wild encounters (town type)
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (12, 'Cerulean City', 'town', 0.0000, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Route 24 (Nugget Bridge) - North of Cerulean City
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (13, 'Route 24', 'route', 0.0333, 16, 20)
ON CONFLICT (id) DO NOTHING;

-- Route 25 (Bill's House area) - East of Route 24
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (14, 'Route 25', 'route', 0.0333, 16, 20)
ON CONFLICT (id) DO NOTHING;

-- Update sequence to prevent ID conflicts
SELECT setval('zones_id_seq', GREATEST(14, (SELECT MAX(id) FROM zones)), true);

-- ============================================
-- 2. ADD ZONE CONNECTIONS (bidirectional)
-- ============================================

-- Route 4 (11) <-> Cerulean City (12)
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (11, 12),  -- Route 4 -> Cerulean City
  (12, 11)   -- Cerulean City -> Route 4
ON CONFLICT DO NOTHING;

-- Cerulean City (12) <-> Route 24 (13)
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (12, 13),  -- Cerulean City -> Route 24
  (13, 12)   -- Route 24 -> Cerulean City
ON CONFLICT DO NOTHING;

-- Route 24 (13) <-> Route 25 (14)
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (13, 14),  -- Route 24 -> Route 25
  (14, 13)   -- Route 25 -> Route 24
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ADD MISTY'S GYM
-- ============================================

INSERT INTO gym_leaders (
  id, name, title, badge_id, badge_name, specialty_type, zone_id,
  dialog_intro, dialog_win, dialog_lose,
  reward_money, reward_badge_points, required_badges
) VALUES (
  'misty',
  'Misty',
  'The Tomboyish Mermaid',
  'cascade',
  'Cascade Badge',
  'Water',
  12, -- Cerulean City
  'Hi, you''re a new face. Let me tell you, my policy is an all-out offensive with Water-type Pokemon!',
  'Wow! You''re too much, all right! You can have the Cascade Badge to show that you beat me.',
  'That was too close! You''ll need stronger Pokemon to beat me!',
  2100,
  100,
  '{boulder}'  -- Requires Boulder Badge to challenge
) ON CONFLICT (id) DO UPDATE SET
  zone_id = EXCLUDED.zone_id,
  dialog_intro = EXCLUDED.dialog_intro,
  required_badges = EXCLUDED.required_badges;

-- Misty's Team
INSERT INTO gym_leader_pokemon (gym_leader_id, species_id, level, slot) VALUES
  ('misty', 120, 18, 1),  -- Staryu Lv18
  ('misty', 121, 21, 2)   -- Starmie Lv21
ON CONFLICT (gym_leader_id, slot) DO UPDATE SET
  species_id = EXCLUDED.species_id,
  level = EXCLUDED.level;

-- ============================================
-- 4. ADD ENCOUNTER TABLES
-- ============================================

-- Route 24 (Nugget Bridge) Encounters
-- Total encounter rate: 0.20 + 0.20 + 0.20 + 0.15 + 0.15 + 0.10 = 1.00
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (13, 69, 0.20),   -- Bellsprout 20% (Grass/Poison)
  (13, 43, 0.20),   -- Oddish 20% (Grass/Poison)
  (13, 48, 0.20),   -- Venonat 20% (Bug/Poison)
  (13, 79, 0.15),   -- Slowpoke 15% (Water/Psychic)
  (13, 16, 0.15),   -- Pidgey 15% (Normal/Flying)
  (13, 63, 0.10)    -- Abra 10% (Psychic - rare)
ON CONFLICT DO NOTHING;

-- Route 25 (Bill's House area) Encounters
-- Same distribution as Route 24
-- Total encounter rate: 0.20 + 0.20 + 0.20 + 0.15 + 0.15 + 0.10 = 1.00
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (14, 69, 0.20),   -- Bellsprout 20% (Grass/Poison)
  (14, 43, 0.20),   -- Oddish 20% (Grass/Poison)
  (14, 48, 0.20),   -- Venonat 20% (Bug/Poison)
  (14, 79, 0.15),   -- Slowpoke 15% (Water/Psychic)
  (14, 16, 0.15),   -- Pidgey 15% (Normal/Flying)
  (14, 63, 0.10)    -- Abra 10% (Psychic - rare)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================

-- Check new zones:
-- SELECT id, name, zone_type, base_encounter_rate, min_level, max_level
-- FROM zones
-- WHERE id IN (12, 13, 14);

-- Check zone connections are bidirectional:
-- SELECT z1.name as from_zone, z2.name as to_zone
-- FROM zone_connections zc
-- JOIN zones z1 ON zc.from_zone_id = z1.id
-- JOIN zones z2 ON zc.to_zone_id = z2.id
-- WHERE z1.id IN (11, 12, 13, 14) OR z2.id IN (11, 12, 13, 14)
-- ORDER BY z1.id, z2.id;

-- Verify encounter rates sum to 1.0:
-- SELECT z.name, SUM(et.encounter_rate) as total_rate
-- FROM encounter_tables et
-- JOIN zones z ON et.zone_id = z.id
-- WHERE z.id IN (13, 14)
-- GROUP BY z.name;

-- Check Misty's gym:
-- SELECT id, name, badge_name, zone_id, required_badges
-- FROM gym_leaders
-- WHERE id = 'misty';

-- Check Misty's team:
-- SELECT glp.slot, ps.name, glp.level
-- FROM gym_leader_pokemon glp
-- JOIN pokemon_species ps ON glp.species_id = ps.id
-- WHERE glp.gym_leader_id = 'misty'
-- ORDER BY glp.slot;
