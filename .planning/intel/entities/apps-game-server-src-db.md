---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\db.ts
type: service
updated: 2026-01-20
status: active
---

# db.ts

## Purpose

Database access layer providing all Supabase queries for the game server. Handles CRUD operations for players, Pokemon, zones, inventory, chat, friends, trades, guilds, bank, quests, and leaderboards. Uses the Supabase service key for server-side access bypassing RLS policies.

## Exports

- `initDatabase(): SupabaseClient` - Initialize Supabase client with service key
- `getSupabase(): SupabaseClient` - Get initialized Supabase client
- `getPlayerByUserId(userId): Promise<Player>` - Fetch player by auth user ID
- `getPlayerParty(playerId): Promise<Pokemon[]>` - Fetch party Pokemon with species data
- `getPlayerBox(playerId): Promise<Pokemon[]>` - Fetch box Pokemon
- `getZone(zoneId): Promise<Zone>` - Fetch zone by ID
- `getConnectedZones(zoneId): Promise<Zone[]>` - Fetch traversable zones with directions
- `getEncounterTable(zoneId): Promise<EncounterTableEntry[]>` - Fetch zone spawn table
- `getAllSpecies(): Promise<PokemonSpecies[]>` - Fetch all species for evolution lookups
- `saveCaughtPokemon(playerId, wild, location): Promise<Pokemon>` - Save newly caught Pokemon
- `evolvePokemon(pokemonId, ownerId, currentSpeciesId, newSpeciesId, stats): Promise<boolean>` - Evolve Pokemon with optimistic locking
- `updatePokemonHP(pokemonId, hp, ownerId): Promise<boolean>` - Update HP with ownership check
- Plus 80+ more functions for inventory, trades, guilds, chat, leaderboards, etc.

## Dependencies

- [[apps-game-server-src-types]] - Type definitions for all database entities
- [[apps-game-server-src-game]] - calculateHP, calculateStat, xpForLevel for stat calculations
- @supabase/supabase-js - Supabase client library

## Used By

TBD

## Notes

- Uses service key to bypass RLS for server-side operations
- Includes XP fix on party/box load to ensure XP >= xpForLevel(level)
- Evolution uses optimistic locking via currentSpeciesId to prevent double-evolution
- All ownership-sensitive operations include owner_id checks for security
