-- Migration: Add Individual Values (IVs) to Pokemon
-- IVs are hidden stats (0-31) that create variation between Pokemon of the same species
-- This affects battle performance and adds depth to catching/breeding

-- Add IV columns to pokemon table
ALTER TABLE pokemon
  ADD COLUMN IF NOT EXISTS iv_hp INT DEFAULT 0 CHECK (iv_hp >= 0 AND iv_hp <= 31),
  ADD COLUMN IF NOT EXISTS iv_attack INT DEFAULT 0 CHECK (iv_attack >= 0 AND iv_attack <= 31),
  ADD COLUMN IF NOT EXISTS iv_defense INT DEFAULT 0 CHECK (iv_defense >= 0 AND iv_defense <= 31),
  ADD COLUMN IF NOT EXISTS iv_sp_attack INT DEFAULT 0 CHECK (iv_sp_attack >= 0 AND iv_sp_attack <= 31),
  ADD COLUMN IF NOT EXISTS iv_sp_defense INT DEFAULT 0 CHECK (iv_sp_defense >= 0 AND iv_sp_defense <= 31),
  ADD COLUMN IF NOT EXISTS iv_speed INT DEFAULT 0 CHECK (iv_speed >= 0 AND iv_speed <= 31);

-- Backfill existing Pokemon with random IVs
-- Uses uniform random distribution for simplicity (proper bell curve used in game code)
UPDATE pokemon SET
  iv_hp = FLOOR(RANDOM() * 32),
  iv_attack = FLOOR(RANDOM() * 32),
  iv_defense = FLOOR(RANDOM() * 32),
  iv_sp_attack = FLOOR(RANDOM() * 32),
  iv_sp_defense = FLOOR(RANDOM() * 32),
  iv_speed = FLOOR(RANDOM() * 32)
WHERE iv_hp = 0 AND iv_attack = 0 AND iv_defense = 0
  AND iv_sp_attack = 0 AND iv_sp_defense = 0 AND iv_speed = 0;

-- Note: Stats will be recalculated on next Pokemon load by the game server
-- The stat formulas change from:
--   HP = floor((2 * base * level / 100) + level + 10)
--   Stat = floor((2 * base * level / 100) + 5)
-- To:
--   HP = floor(((2 * base + IV) * level / 100) + level + 10)
--   Stat = floor(((2 * base + IV) * level / 100) + 5)

COMMENT ON COLUMN pokemon.iv_hp IS 'Individual Value for HP stat (0-31)';
COMMENT ON COLUMN pokemon.iv_attack IS 'Individual Value for Attack stat (0-31)';
COMMENT ON COLUMN pokemon.iv_defense IS 'Individual Value for Defense stat (0-31)';
COMMENT ON COLUMN pokemon.iv_sp_attack IS 'Individual Value for Sp. Attack stat (0-31)';
COMMENT ON COLUMN pokemon.iv_sp_defense IS 'Individual Value for Sp. Defense stat (0-31)';
COMMENT ON COLUMN pokemon.iv_speed IS 'Individual Value for Speed stat (0-31)';

-- Add catch_location column to track where Pokemon was caught
ALTER TABLE pokemon
  ADD COLUMN IF NOT EXISTS catch_location TEXT;

COMMENT ON COLUMN pokemon.catch_location IS 'Zone name where the Pokemon was caught';
