-- Pokemon Idle MMO - Backfill Pokedex Entries Migration
-- Migration 017
--
-- This migration fixes missing Pokedex entries for players who:
-- 1. Evolved Pokemon (evolved form not registered)
-- 2. Received Pokemon via trade (traded Pokemon not registered)
-- 3. Caught Pokemon before Pokedex tracking was added/fixed
--
-- The migration scans all owned Pokemon and ensures each player has
-- a Pokedex entry marked as "caught" for each species they own.

-- ============================================
-- BACKFILL POKEDEX ENTRIES
-- ============================================

-- Insert missing pokedex entries for all Pokemon owned by players
-- Uses ON CONFLICT to handle cases where entry already exists:
-- - If entry exists with caught=false, update to caught=true
-- - If entry exists with caught=true, no change needed
-- - If entry doesn't exist, insert new entry with caught=true

INSERT INTO pokedex_entries (player_id, species_id, seen, caught, catch_count, first_caught_at)
SELECT DISTINCT
  p.owner_id as player_id,
  p.species_id,
  true as seen,
  true as caught,
  1 as catch_count,  -- Default to 1 for backfilled entries
  COALESCE(p.caught_at, NOW()) as first_caught_at
FROM pokemon p
WHERE p.owner_id IS NOT NULL
ON CONFLICT (player_id, species_id)
DO UPDATE SET
  seen = true,
  caught = true,
  -- Only update catch_count if it was 0 (meaning they hadn't caught it before)
  catch_count = CASE
    WHEN pokedex_entries.catch_count = 0 THEN 1
    ELSE pokedex_entries.catch_count
  END,
  -- Only set first_caught_at if it was null
  first_caught_at = COALESCE(pokedex_entries.first_caught_at, EXCLUDED.first_caught_at);

-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================

-- Check for any players who have Pokemon but no matching Pokedex entry:
-- SELECT p.owner_id, p.species_id, ps.name
-- FROM pokemon p
-- JOIN pokemon_species ps ON p.species_id = ps.id
-- LEFT JOIN pokedex_entries pe ON pe.player_id = p.owner_id AND pe.species_id = p.species_id
-- WHERE pe.player_id IS NULL;

-- Should return 0 rows after migration

-- Check Pokedex completion for all players:
-- SELECT
--   pl.username,
--   COUNT(DISTINCT pe.species_id) as pokedex_caught,
--   COUNT(DISTINCT p.species_id) as pokemon_owned
-- FROM players pl
-- LEFT JOIN pokedex_entries pe ON pe.player_id = pl.id AND pe.caught = true
-- LEFT JOIN pokemon p ON p.owner_id = pl.id
-- GROUP BY pl.id, pl.username;
