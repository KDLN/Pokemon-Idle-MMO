-- Pokemon Evolution Data
-- Adds evolution chain columns and populates ALL Gen 1 Pokemon (1-151)
-- This allows adding new zones without needing additional species migrations

-- ============================================
-- SCHEMA CHANGES
-- ============================================

-- Add evolution columns to pokemon_species table
ALTER TABLE pokemon_species
ADD COLUMN IF NOT EXISTS evolves_from_species_id INT REFERENCES pokemon_species(id),
ADD COLUMN IF NOT EXISTS evolution_level INT,
ADD COLUMN IF NOT EXISTS evolution_method TEXT DEFAULT 'level';

-- Add index for evolution queries (finding what a species evolves into)
CREATE INDEX IF NOT EXISTS idx_pokemon_species_evolves_from
ON pokemon_species(evolves_from_species_id)
WHERE evolves_from_species_id IS NOT NULL;

-- Add comment explaining evolution_method values
COMMENT ON COLUMN pokemon_species.evolution_method IS
'Evolution trigger: level, item, trade, friendship, etc. MVP uses level only.';

-- Add constraint for valid evolution methods
ALTER TABLE pokemon_species
DROP CONSTRAINT IF EXISTS chk_evolution_method;

ALTER TABLE pokemon_species
ADD CONSTRAINT chk_evolution_method
CHECK (evolution_method IS NULL OR evolution_method IN ('level', 'item', 'trade', 'friendship', 'location', 'other'));

-- Add constraint for positive evolution levels
ALTER TABLE pokemon_species
DROP CONSTRAINT IF EXISTS chk_evolution_level_positive;

ALTER TABLE pokemon_species
ADD CONSTRAINT chk_evolution_level_positive
CHECK (evolution_level IS NULL OR evolution_level > 0);

-- Add constraint ensuring level-based evolutions have a level set
ALTER TABLE pokemon_species
DROP CONSTRAINT IF EXISTS chk_level_evolution_has_level;

ALTER TABLE pokemon_species
ADD CONSTRAINT chk_level_evolution_has_level
CHECK (evolution_method != 'level' OR evolution_level IS NOT NULL);

-- ============================================
-- ALL GEN 1 POKEMON (1-151)
-- Format: id, name, type1, type2, hp, atk, def, spa, spd, spe, catch_rate, xp_yield, evolves_from, evo_level, evo_method
-- Evolution methods: level, item, trade, friendship, NULL (doesn't evolve from anything)
-- ============================================

-- Pokemon that don't exist yet will be inserted
-- Pokemon that already exist will have their evolution data updated

-- #001-003: Bulbasaur line
INSERT INTO pokemon_species VALUES
(1, 'Bulbasaur', 'Grass', 'Poison', 45, 49, 49, 65, 65, 45, 45, 64, NULL, NULL, NULL),
(2, 'Ivysaur', 'Grass', 'Poison', 60, 62, 63, 80, 80, 60, 45, 142, 1, 16, 'level'),
(3, 'Venusaur', 'Grass', 'Poison', 80, 82, 83, 100, 100, 80, 45, 236, 2, 32, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #004-006: Charmander line
INSERT INTO pokemon_species VALUES
(4, 'Charmander', 'Fire', NULL, 39, 52, 43, 60, 50, 65, 45, 62, NULL, NULL, NULL),
(5, 'Charmeleon', 'Fire', NULL, 58, 64, 58, 80, 65, 80, 45, 142, 4, 16, 'level'),
(6, 'Charizard', 'Fire', 'Flying', 78, 84, 78, 109, 85, 100, 45, 240, 5, 36, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #007-009: Squirtle line
INSERT INTO pokemon_species VALUES
(7, 'Squirtle', 'Water', NULL, 44, 48, 65, 50, 64, 43, 45, 63, NULL, NULL, NULL),
(8, 'Wartortle', 'Water', NULL, 59, 63, 80, 65, 80, 58, 45, 142, 7, 16, 'level'),
(9, 'Blastoise', 'Water', NULL, 79, 83, 100, 85, 105, 78, 45, 239, 8, 36, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #010-012: Caterpie line
INSERT INTO pokemon_species VALUES
(10, 'Caterpie', 'Bug', NULL, 45, 30, 35, 20, 20, 45, 255, 39, NULL, NULL, NULL),
(11, 'Metapod', 'Bug', NULL, 50, 20, 55, 25, 25, 30, 120, 72, 10, 7, 'level'),
(12, 'Butterfree', 'Bug', 'Flying', 60, 45, 50, 90, 80, 70, 45, 178, 11, 10, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #013-015: Weedle line
INSERT INTO pokemon_species VALUES
(13, 'Weedle', 'Bug', 'Poison', 40, 35, 30, 20, 20, 50, 255, 39, NULL, NULL, NULL),
(14, 'Kakuna', 'Bug', 'Poison', 45, 25, 50, 25, 25, 35, 120, 72, 13, 7, 'level'),
(15, 'Beedrill', 'Bug', 'Poison', 65, 90, 40, 45, 80, 75, 45, 178, 14, 10, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #016-018: Pidgey line
INSERT INTO pokemon_species VALUES
(16, 'Pidgey', 'Normal', 'Flying', 40, 45, 40, 35, 35, 56, 255, 50, NULL, NULL, NULL),
(17, 'Pidgeotto', 'Normal', 'Flying', 63, 60, 55, 50, 50, 71, 120, 122, 16, 18, 'level'),
(18, 'Pidgeot', 'Normal', 'Flying', 83, 80, 75, 70, 70, 101, 45, 216, 17, 36, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #019-020: Rattata line
INSERT INTO pokemon_species VALUES
(19, 'Rattata', 'Normal', NULL, 30, 56, 35, 25, 35, 72, 255, 51, NULL, NULL, NULL),
(20, 'Raticate', 'Normal', NULL, 55, 81, 60, 50, 70, 97, 127, 145, 19, 20, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #021-022: Spearow line
INSERT INTO pokemon_species VALUES
(21, 'Spearow', 'Normal', 'Flying', 40, 60, 30, 31, 31, 70, 255, 52, NULL, NULL, NULL),
(22, 'Fearow', 'Normal', 'Flying', 65, 90, 65, 61, 61, 100, 90, 155, 21, 20, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #023-024: Ekans line
INSERT INTO pokemon_species VALUES
(23, 'Ekans', 'Poison', NULL, 35, 60, 44, 40, 54, 55, 255, 58, NULL, NULL, NULL),
(24, 'Arbok', 'Poison', NULL, 60, 95, 69, 65, 79, 80, 90, 157, 23, 22, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #025-026: Pikachu line (Pichu not in Gen 1)
INSERT INTO pokemon_species VALUES
(25, 'Pikachu', 'Electric', NULL, 35, 55, 40, 50, 50, 90, 190, 112, NULL, NULL, NULL),
(26, 'Raichu', 'Electric', NULL, 60, 90, 55, 90, 80, 110, 75, 218, 25, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #027-028: Sandshrew line
INSERT INTO pokemon_species VALUES
(27, 'Sandshrew', 'Ground', NULL, 50, 75, 85, 20, 30, 40, 255, 60, NULL, NULL, NULL),
(28, 'Sandslash', 'Ground', NULL, 75, 100, 110, 45, 55, 65, 90, 158, 27, 22, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #029-031: Nidoran F line
INSERT INTO pokemon_species VALUES
(29, 'Nidoran F', 'Poison', NULL, 55, 47, 52, 40, 40, 41, 235, 55, NULL, NULL, NULL),
(30, 'Nidorina', 'Poison', NULL, 70, 62, 67, 55, 55, 56, 120, 128, 29, 16, 'level'),
(31, 'Nidoqueen', 'Poison', 'Ground', 90, 92, 87, 75, 85, 76, 45, 227, 30, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #032-034: Nidoran M line
INSERT INTO pokemon_species VALUES
(32, 'Nidoran M', 'Poison', NULL, 46, 57, 40, 40, 40, 50, 235, 55, NULL, NULL, NULL),
(33, 'Nidorino', 'Poison', NULL, 61, 72, 57, 55, 55, 65, 120, 128, 32, 16, 'level'),
(34, 'Nidoking', 'Poison', 'Ground', 81, 102, 77, 85, 75, 85, 45, 227, 33, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #035-036: Clefairy line (Cleffa not in Gen 1)
INSERT INTO pokemon_species VALUES
(35, 'Clefairy', 'Fairy', NULL, 70, 45, 48, 60, 65, 35, 150, 113, NULL, NULL, NULL),
(36, 'Clefable', 'Fairy', NULL, 95, 70, 73, 95, 90, 60, 25, 217, 35, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #037-038: Vulpix line
INSERT INTO pokemon_species VALUES
(37, 'Vulpix', 'Fire', NULL, 38, 41, 40, 50, 65, 65, 190, 60, NULL, NULL, NULL),
(38, 'Ninetales', 'Fire', NULL, 73, 76, 75, 81, 100, 100, 75, 177, 37, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #039-040: Jigglypuff line (Igglybuff not in Gen 1)
INSERT INTO pokemon_species VALUES
(39, 'Jigglypuff', 'Normal', 'Fairy', 115, 45, 20, 45, 25, 20, 170, 95, NULL, NULL, NULL),
(40, 'Wigglytuff', 'Normal', 'Fairy', 140, 70, 45, 85, 50, 45, 50, 196, 39, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #041-042: Zubat line (Crobat not in Gen 1)
INSERT INTO pokemon_species VALUES
(41, 'Zubat', 'Poison', 'Flying', 40, 45, 35, 30, 40, 55, 255, 49, NULL, NULL, NULL),
(42, 'Golbat', 'Poison', 'Flying', 75, 80, 70, 65, 75, 90, 90, 159, 41, 22, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #043-045: Oddish line
INSERT INTO pokemon_species VALUES
(43, 'Oddish', 'Grass', 'Poison', 45, 50, 55, 75, 65, 30, 255, 64, NULL, NULL, NULL),
(44, 'Gloom', 'Grass', 'Poison', 60, 65, 70, 85, 75, 40, 120, 138, 43, 21, 'level'),
(45, 'Vileplume', 'Grass', 'Poison', 75, 80, 85, 110, 90, 50, 45, 221, 44, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #046-047: Paras line
INSERT INTO pokemon_species VALUES
(46, 'Paras', 'Bug', 'Grass', 35, 70, 55, 45, 55, 25, 190, 57, NULL, NULL, NULL),
(47, 'Parasect', 'Bug', 'Grass', 60, 95, 80, 60, 80, 30, 75, 142, 46, 24, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #048-049: Venonat line
INSERT INTO pokemon_species VALUES
(48, 'Venonat', 'Bug', 'Poison', 60, 55, 50, 40, 55, 45, 190, 61, NULL, NULL, NULL),
(49, 'Venomoth', 'Bug', 'Poison', 70, 65, 60, 90, 75, 90, 75, 158, 48, 31, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #050-051: Diglett line
INSERT INTO pokemon_species VALUES
(50, 'Diglett', 'Ground', NULL, 10, 55, 25, 35, 45, 95, 255, 53, NULL, NULL, NULL),
(51, 'Dugtrio', 'Ground', NULL, 35, 100, 50, 50, 70, 120, 50, 149, 50, 26, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #052-053: Meowth line
INSERT INTO pokemon_species VALUES
(52, 'Meowth', 'Normal', NULL, 40, 45, 35, 40, 40, 90, 255, 58, NULL, NULL, NULL),
(53, 'Persian', 'Normal', NULL, 65, 70, 60, 65, 65, 115, 90, 154, 52, 28, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #054-055: Psyduck line
INSERT INTO pokemon_species VALUES
(54, 'Psyduck', 'Water', NULL, 50, 52, 48, 65, 50, 55, 190, 64, NULL, NULL, NULL),
(55, 'Golduck', 'Water', NULL, 80, 82, 78, 95, 80, 85, 75, 175, 54, 33, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #056-057: Mankey line
INSERT INTO pokemon_species VALUES
(56, 'Mankey', 'Fighting', NULL, 40, 80, 35, 35, 45, 70, 190, 61, NULL, NULL, NULL),
(57, 'Primeape', 'Fighting', NULL, 65, 105, 60, 60, 70, 95, 75, 159, 56, 28, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #058-059: Growlithe line
INSERT INTO pokemon_species VALUES
(58, 'Growlithe', 'Fire', NULL, 55, 70, 45, 70, 50, 60, 190, 70, NULL, NULL, NULL),
(59, 'Arcanine', 'Fire', NULL, 90, 110, 80, 100, 80, 95, 75, 194, 58, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #060-062: Poliwag line (Politoed not in Gen 1)
INSERT INTO pokemon_species VALUES
(60, 'Poliwag', 'Water', NULL, 40, 50, 40, 40, 40, 90, 255, 60, NULL, NULL, NULL),
(61, 'Poliwhirl', 'Water', NULL, 65, 65, 65, 50, 50, 90, 120, 135, 60, 25, 'level'),
(62, 'Poliwrath', 'Water', 'Fighting', 90, 95, 95, 70, 90, 70, 45, 230, 61, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #063-065: Abra line
INSERT INTO pokemon_species VALUES
(63, 'Abra', 'Psychic', NULL, 25, 20, 15, 105, 55, 90, 200, 62, NULL, NULL, NULL),
(64, 'Kadabra', 'Psychic', NULL, 40, 35, 30, 120, 70, 105, 100, 140, 63, 16, 'level'),
(65, 'Alakazam', 'Psychic', NULL, 55, 50, 45, 135, 95, 120, 50, 225, 64, NULL, 'trade')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #066-068: Machop line
INSERT INTO pokemon_species VALUES
(66, 'Machop', 'Fighting', NULL, 70, 80, 50, 35, 35, 35, 180, 61, NULL, NULL, NULL),
(67, 'Machoke', 'Fighting', NULL, 80, 100, 70, 50, 60, 45, 90, 142, 66, 28, 'level'),
(68, 'Machamp', 'Fighting', NULL, 90, 130, 80, 65, 85, 55, 45, 227, 67, NULL, 'trade')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #069-071: Bellsprout line
INSERT INTO pokemon_species VALUES
(69, 'Bellsprout', 'Grass', 'Poison', 50, 75, 35, 70, 30, 40, 255, 60, NULL, NULL, NULL),
(70, 'Weepinbell', 'Grass', 'Poison', 65, 90, 50, 85, 45, 55, 120, 137, 69, 21, 'level'),
(71, 'Victreebel', 'Grass', 'Poison', 80, 105, 65, 100, 70, 70, 45, 221, 70, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #072-073: Tentacool line
INSERT INTO pokemon_species VALUES
(72, 'Tentacool', 'Water', 'Poison', 40, 40, 35, 50, 100, 70, 190, 67, NULL, NULL, NULL),
(73, 'Tentacruel', 'Water', 'Poison', 80, 70, 65, 80, 120, 100, 60, 180, 72, 30, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #074-076: Geodude line
INSERT INTO pokemon_species VALUES
(74, 'Geodude', 'Rock', 'Ground', 40, 80, 100, 30, 30, 20, 255, 60, NULL, NULL, NULL),
(75, 'Graveler', 'Rock', 'Ground', 55, 95, 115, 45, 45, 35, 120, 137, 74, 25, 'level'),
(76, 'Golem', 'Rock', 'Ground', 80, 120, 130, 55, 65, 45, 45, 223, 75, NULL, 'trade')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #077-078: Ponyta line
INSERT INTO pokemon_species VALUES
(77, 'Ponyta', 'Fire', NULL, 50, 85, 55, 65, 65, 90, 190, 82, NULL, NULL, NULL),
(78, 'Rapidash', 'Fire', NULL, 65, 100, 70, 80, 80, 105, 60, 175, 77, 40, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #079-080: Slowpoke line (Slowking not in Gen 1)
INSERT INTO pokemon_species VALUES
(79, 'Slowpoke', 'Water', 'Psychic', 90, 65, 65, 40, 40, 15, 190, 63, NULL, NULL, NULL),
(80, 'Slowbro', 'Water', 'Psychic', 95, 75, 110, 100, 80, 30, 75, 172, 79, 37, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #081-082: Magnemite line (Magnezone not in Gen 1)
INSERT INTO pokemon_species VALUES
(81, 'Magnemite', 'Electric', 'Steel', 25, 35, 70, 95, 55, 45, 190, 65, NULL, NULL, NULL),
(82, 'Magneton', 'Electric', 'Steel', 50, 60, 95, 120, 70, 70, 60, 163, 81, 30, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #083: Farfetch'd (no evolution in Gen 1)
INSERT INTO pokemon_species VALUES
(83, 'Farfetchd', 'Normal', 'Flying', 52, 90, 55, 58, 62, 60, 45, 132, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #084-085: Doduo line
INSERT INTO pokemon_species VALUES
(84, 'Doduo', 'Normal', 'Flying', 35, 85, 45, 35, 35, 75, 190, 62, NULL, NULL, NULL),
(85, 'Dodrio', 'Normal', 'Flying', 60, 110, 70, 60, 60, 110, 45, 165, 84, 31, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #086-087: Seel line
INSERT INTO pokemon_species VALUES
(86, 'Seel', 'Water', NULL, 65, 45, 55, 45, 70, 45, 190, 65, NULL, NULL, NULL),
(87, 'Dewgong', 'Water', 'Ice', 90, 70, 80, 70, 95, 70, 75, 166, 86, 34, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #088-089: Grimer line
INSERT INTO pokemon_species VALUES
(88, 'Grimer', 'Poison', NULL, 80, 80, 50, 40, 50, 25, 190, 65, NULL, NULL, NULL),
(89, 'Muk', 'Poison', NULL, 105, 105, 75, 65, 100, 50, 75, 175, 88, 38, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #090-091: Shellder line
INSERT INTO pokemon_species VALUES
(90, 'Shellder', 'Water', NULL, 30, 65, 100, 45, 25, 40, 190, 61, NULL, NULL, NULL),
(91, 'Cloyster', 'Water', 'Ice', 50, 95, 180, 85, 45, 70, 60, 184, 90, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #092-094: Gastly line
INSERT INTO pokemon_species VALUES
(92, 'Gastly', 'Ghost', 'Poison', 30, 35, 30, 100, 35, 80, 190, 62, NULL, NULL, NULL),
(93, 'Haunter', 'Ghost', 'Poison', 45, 50, 45, 115, 55, 95, 90, 142, 92, 25, 'level'),
(94, 'Gengar', 'Ghost', 'Poison', 60, 65, 60, 130, 75, 110, 45, 225, 93, NULL, 'trade')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #095: Onix (Steelix not in Gen 1)
INSERT INTO pokemon_species VALUES
(95, 'Onix', 'Rock', 'Ground', 35, 45, 160, 30, 45, 70, 45, 77, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #096-097: Drowzee line
INSERT INTO pokemon_species VALUES
(96, 'Drowzee', 'Psychic', NULL, 60, 48, 45, 43, 90, 42, 190, 66, NULL, NULL, NULL),
(97, 'Hypno', 'Psychic', NULL, 85, 73, 70, 73, 115, 67, 75, 169, 96, 26, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #098-099: Krabby line
INSERT INTO pokemon_species VALUES
(98, 'Krabby', 'Water', NULL, 30, 105, 90, 25, 25, 50, 225, 65, NULL, NULL, NULL),
(99, 'Kingler', 'Water', NULL, 55, 130, 115, 50, 50, 75, 60, 166, 98, 28, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #100-101: Voltorb line
INSERT INTO pokemon_species VALUES
(100, 'Voltorb', 'Electric', NULL, 40, 30, 50, 55, 55, 100, 190, 66, NULL, NULL, NULL),
(101, 'Electrode', 'Electric', NULL, 60, 50, 70, 80, 80, 150, 60, 172, 100, 30, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #102-103: Exeggcute line
INSERT INTO pokemon_species VALUES
(102, 'Exeggcute', 'Grass', 'Psychic', 60, 40, 80, 60, 45, 40, 90, 65, NULL, NULL, NULL),
(103, 'Exeggutor', 'Grass', 'Psychic', 95, 95, 85, 125, 75, 55, 45, 186, 102, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #104-105: Cubone line
INSERT INTO pokemon_species VALUES
(104, 'Cubone', 'Ground', NULL, 50, 50, 95, 40, 50, 35, 190, 64, NULL, NULL, NULL),
(105, 'Marowak', 'Ground', NULL, 60, 80, 110, 50, 80, 45, 75, 149, 104, 28, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #106-107: Hitmonlee and Hitmonchan (from Tyrogue, not in Gen 1)
INSERT INTO pokemon_species VALUES
(106, 'Hitmonlee', 'Fighting', NULL, 50, 120, 53, 35, 110, 87, 45, 159, NULL, NULL, NULL),
(107, 'Hitmonchan', 'Fighting', NULL, 50, 105, 79, 35, 110, 76, 45, 159, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #108: Lickitung (Lickilicky not in Gen 1)
INSERT INTO pokemon_species VALUES
(108, 'Lickitung', 'Normal', NULL, 90, 55, 75, 60, 75, 30, 45, 77, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #109-110: Koffing line
INSERT INTO pokemon_species VALUES
(109, 'Koffing', 'Poison', NULL, 40, 65, 95, 60, 45, 35, 190, 68, NULL, NULL, NULL),
(110, 'Weezing', 'Poison', NULL, 65, 90, 120, 85, 70, 60, 60, 172, 109, 35, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #111-112: Rhyhorn line (Rhyperior not in Gen 1)
INSERT INTO pokemon_species VALUES
(111, 'Rhyhorn', 'Ground', 'Rock', 80, 85, 95, 30, 30, 25, 120, 69, NULL, NULL, NULL),
(112, 'Rhydon', 'Ground', 'Rock', 105, 130, 120, 45, 45, 40, 60, 170, 111, 42, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #113: Chansey (Blissey not in Gen 1, Happiny pre-evo not in Gen 1)
INSERT INTO pokemon_species VALUES
(113, 'Chansey', 'Normal', NULL, 250, 5, 5, 35, 105, 50, 30, 395, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #114: Tangela (Tangrowth not in Gen 1)
INSERT INTO pokemon_species VALUES
(114, 'Tangela', 'Grass', NULL, 65, 55, 115, 100, 40, 60, 45, 87, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #115: Kangaskhan (no evolution)
INSERT INTO pokemon_species VALUES
(115, 'Kangaskhan', 'Normal', NULL, 105, 95, 80, 40, 80, 90, 45, 172, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #116-117: Horsea line (Kingdra not in Gen 1)
INSERT INTO pokemon_species VALUES
(116, 'Horsea', 'Water', NULL, 30, 40, 70, 70, 25, 60, 225, 59, NULL, NULL, NULL),
(117, 'Seadra', 'Water', NULL, 55, 65, 95, 95, 45, 85, 75, 154, 116, 32, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #118-119: Goldeen line
INSERT INTO pokemon_species VALUES
(118, 'Goldeen', 'Water', NULL, 45, 67, 60, 35, 50, 63, 225, 64, NULL, NULL, NULL),
(119, 'Seaking', 'Water', NULL, 80, 92, 65, 65, 80, 68, 60, 158, 118, 33, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #120-121: Staryu line
INSERT INTO pokemon_species VALUES
(120, 'Staryu', 'Water', NULL, 30, 45, 55, 70, 55, 85, 225, 68, NULL, NULL, NULL),
(121, 'Starmie', 'Water', 'Psychic', 60, 75, 85, 100, 85, 115, 60, 182, 120, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #122: Mr. Mime (Mime Jr. not in Gen 1)
INSERT INTO pokemon_species VALUES
(122, 'Mr. Mime', 'Psychic', 'Fairy', 40, 45, 65, 100, 120, 90, 45, 161, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #123: Scyther (Scizor not in Gen 1)
INSERT INTO pokemon_species VALUES
(123, 'Scyther', 'Bug', 'Flying', 70, 110, 80, 55, 80, 105, 45, 100, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #124: Jynx (Smoochum not in Gen 1)
INSERT INTO pokemon_species VALUES
(124, 'Jynx', 'Ice', 'Psychic', 65, 50, 35, 115, 95, 95, 45, 159, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #125: Electabuzz (Elekid/Electivire not in Gen 1)
INSERT INTO pokemon_species VALUES
(125, 'Electabuzz', 'Electric', NULL, 65, 83, 57, 95, 85, 105, 45, 172, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #126: Magmar (Magby/Magmortar not in Gen 1)
INSERT INTO pokemon_species VALUES
(126, 'Magmar', 'Fire', NULL, 65, 95, 57, 100, 85, 93, 45, 173, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #127: Pinsir (no evolution)
INSERT INTO pokemon_species VALUES
(127, 'Pinsir', 'Bug', NULL, 65, 125, 100, 55, 70, 85, 45, 175, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #128: Tauros (no evolution)
INSERT INTO pokemon_species VALUES
(128, 'Tauros', 'Normal', NULL, 75, 100, 95, 40, 70, 110, 45, 172, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #129-130: Magikarp line
INSERT INTO pokemon_species VALUES
(129, 'Magikarp', 'Water', NULL, 20, 10, 55, 15, 20, 80, 255, 40, NULL, NULL, NULL),
(130, 'Gyarados', 'Water', 'Flying', 95, 125, 79, 60, 100, 81, 45, 189, 129, 20, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #131: Lapras (no evolution)
INSERT INTO pokemon_species VALUES
(131, 'Lapras', 'Water', 'Ice', 130, 85, 80, 85, 95, 60, 45, 187, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #132: Ditto (no evolution)
INSERT INTO pokemon_species VALUES
(132, 'Ditto', 'Normal', NULL, 48, 48, 48, 48, 48, 48, 35, 101, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #133-136: Eevee and Gen 1 Eeveelutions
INSERT INTO pokemon_species VALUES
(133, 'Eevee', 'Normal', NULL, 55, 55, 50, 45, 65, 55, 45, 65, NULL, NULL, NULL),
(134, 'Vaporeon', 'Water', NULL, 130, 65, 60, 110, 95, 65, 45, 184, 133, NULL, 'item'),
(135, 'Jolteon', 'Electric', NULL, 65, 65, 60, 110, 95, 130, 45, 184, 133, NULL, 'item'),
(136, 'Flareon', 'Fire', NULL, 65, 130, 60, 95, 110, 65, 45, 184, 133, NULL, 'item')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #137: Porygon (Porygon2/Porygon-Z not in Gen 1)
INSERT INTO pokemon_species VALUES
(137, 'Porygon', 'Normal', NULL, 65, 60, 70, 85, 75, 40, 45, 79, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #138-139: Omanyte line
INSERT INTO pokemon_species VALUES
(138, 'Omanyte', 'Rock', 'Water', 35, 40, 100, 90, 55, 35, 45, 71, NULL, NULL, NULL),
(139, 'Omastar', 'Rock', 'Water', 70, 60, 125, 115, 70, 55, 45, 173, 138, 40, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #140-141: Kabuto line
INSERT INTO pokemon_species VALUES
(140, 'Kabuto', 'Rock', 'Water', 30, 80, 90, 55, 45, 55, 45, 71, NULL, NULL, NULL),
(141, 'Kabutops', 'Rock', 'Water', 60, 115, 105, 65, 70, 80, 45, 173, 140, 40, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #142: Aerodactyl (no evolution)
INSERT INTO pokemon_species VALUES
(142, 'Aerodactyl', 'Rock', 'Flying', 80, 105, 65, 60, 75, 130, 45, 180, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #143: Snorlax (Munchlax not in Gen 1)
INSERT INTO pokemon_species VALUES
(143, 'Snorlax', 'Normal', NULL, 160, 110, 65, 65, 110, 30, 25, 189, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #144-146: Legendary Birds
INSERT INTO pokemon_species VALUES
(144, 'Articuno', 'Ice', 'Flying', 90, 85, 100, 95, 125, 85, 3, 261, NULL, NULL, NULL),
(145, 'Zapdos', 'Electric', 'Flying', 90, 90, 85, 125, 90, 100, 3, 261, NULL, NULL, NULL),
(146, 'Moltres', 'Fire', 'Flying', 90, 100, 90, 125, 85, 90, 3, 261, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #147-149: Dratini line
INSERT INTO pokemon_species VALUES
(147, 'Dratini', 'Dragon', NULL, 41, 64, 45, 50, 50, 50, 45, 60, NULL, NULL, NULL),
(148, 'Dragonair', 'Dragon', NULL, 61, 84, 65, 70, 70, 70, 45, 147, 147, 30, 'level'),
(149, 'Dragonite', 'Dragon', 'Flying', 91, 134, 95, 100, 100, 80, 45, 270, 148, 55, 'level')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;

-- #150-151: Mewtwo and Mew (Legendaries, no evolution)
INSERT INTO pokemon_species VALUES
(150, 'Mewtwo', 'Psychic', NULL, 106, 110, 90, 154, 90, 130, 3, 306, NULL, NULL, NULL),
(151, 'Mew', 'Psychic', NULL, 100, 100, 100, 100, 100, 100, 45, 270, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type1 = EXCLUDED.type1, type2 = EXCLUDED.type2,
  base_hp = EXCLUDED.base_hp, base_attack = EXCLUDED.base_attack, base_defense = EXCLUDED.base_defense,
  base_sp_attack = EXCLUDED.base_sp_attack, base_sp_defense = EXCLUDED.base_sp_defense, base_speed = EXCLUDED.base_speed,
  base_catch_rate = EXCLUDED.base_catch_rate, base_xp_yield = EXCLUDED.base_xp_yield,
  evolves_from_species_id = EXCLUDED.evolves_from_species_id, evolution_level = EXCLUDED.evolution_level, evolution_method = EXCLUDED.evolution_method;
