---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\types\game.ts
type: model
updated: 2026-01-20
status: active
---

# game.ts (frontend types)

## Purpose

Type definitions for the web frontend that re-exports shared types and defines frontend-only types. Includes battle animation phases, pokedex entries, and helper functions for Pokemon sprite URLs.

## Exports

Re-exports from @pokemon-idle/shared:
- Player, Pokemon, PokemonSpecies, Zone, WildPokemon
- BattleTurn, BattleSequence, CatchResult, EncounterEvent
- LevelUpEvent, PendingEvolution, EvolutionEvent
- LeaderboardEntry, ShopItem, TickResult

Frontend-only:
- `PokedexEntry` - Player's seen/caught status for a species
- `InventoryItem` - Player inventory entry
- `BattlePhase` - State machine phases for battle animations
- `GameState` - Full game state snapshot from server
- `STARTER_POKEMON` - Array of starter options
- `PokemonSpriteVariant` - 'front' | 'back'
- `getPokemonSpriteUrl(speciesId, isShiny, variant): string` - PokeAPI sprite URL builder

Re-exports utilities:
- `xpForLevel`, `getXPProgress`, `getXPForLevel`

## Dependencies

- [[packages-shared-src-index]] - Shared type re-exports

## Used By

TBD

## Notes

- BattlePhase enum defines 11 states for battle animation state machine
- Sprite URLs point to PokeAPI GitHub repository
