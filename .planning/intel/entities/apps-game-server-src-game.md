---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\game.ts
type: module
updated: 2026-01-20
status: active
---

# game.ts

## Purpose

Core game logic engine handling all battle mechanics, stat calculations, encounters, catching, evolution, and XP progression. Implements Pokemon-style type effectiveness chart, damage formulas, and 1v1 battle simulation. This is the authoritative source for all gameplay calculations that determine outcomes in the idle game loop.

## Exports

- `calculateHP(baseHP, level, iv): number` - Calculate Pokemon HP stat using Gen 1-3 formula
- `calculateStat(baseStat, level, iv): number` - Calculate non-HP stats using Gen 1-3 formula
- `recalculateStats(pokemon, species): void` - Recalculate all stats for a Pokemon
- `xpForLevel(level): number` - Calculate XP required for given level (medium-fast curve)
- `generateWildPokemon(species, level): WildPokemon` - Create wild Pokemon with IVs and stats
- `rollEncounter(encounterRate): boolean` - Roll for random encounter chance
- `rollEncounterSpecies(encounterTable): PokemonSpecies` - Select species from weighted table
- `rollLevel(minLevel, maxLevel): number` - Generate random level within zone range
- `rollShiny(): boolean` - Roll for shiny chance (1/4096)
- `getTypeEffectiveness(attackType, defType1, defType2): number` - Calculate type multiplier
- `simulate1v1Battle(lead, leadSpecies, wild, speciesMap): BattleSequence` - Full battle simulation
- `resolveBattle(party, wild, speciesMap): BattleResult` - Resolve encounter battle
- `attemptCatch(wild, ballCount, ballType, catchRateMultiplier): CatchResult` - Attempt to catch Pokemon
- `processTick(session, speciesMap, guildBuffs): TickResult` - Process one game tick
- `simulateGymBattle(party, gymLeader, speciesMap, alreadyDefeated): GymBattleResult` - Full gym battle
- `checkEvolutions(party, levelUps, speciesMap, suppressedEvolutions): PendingEvolution[]` - Check for evolution eligibility
- `calculateEvolutionStats(pokemon, targetSpecies): Stats` - Preview stats after evolution
- `applyEvolution(pokemon, targetSpecies, newStats): void` - Apply evolution to Pokemon

## Dependencies

- [[apps-game-server-src-types]] - Type definitions for Pokemon, battles, encounters
- [[apps-game-server-src-ivs]] - IV generation system
- [[apps-game-server-src-db]] - GymLeader type import

## Used By

TBD

## Notes

- Uses simplified Gen 1-3 damage formula with critical hits and type effectiveness
- Implements 8-tick cooldown between encounters to allow animation playback
- Guild buffs can modify encounter rate, catch rate, and XP gains
- Type effectiveness chart covers all 18 Pokemon types with full multiplier matrix
