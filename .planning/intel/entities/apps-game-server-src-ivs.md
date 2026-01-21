---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\ivs.ts
type: util
updated: 2026-01-20
status: active
---

# ivs.ts

## Purpose

Individual Values (IVs) generation system that creates variation between Pokemon of the same species. Implements a bell-curve distribution using Kumaraswamy approximation to beta distribution, with special handling for perfect (31) and zero (0) IVs. Provides encounter-type modifiers for wild, legendary, gift, and shiny Pokemon.

## Exports

- `IVs` - Interface for 6-stat IV structure (hp, attack, defense, spAttack, spDefense, speed)
- `IVGenerationOptions` - Configuration for shiny bonus, zone modifier, encounter type, guaranteed values
- `generateSingleIV(floor, ceiling): number` - Generate one IV with bell-curve distribution
- `generateIVs(options): IVs` - Generate complete 6-stat IV set with modifiers
- `getTotalIVs(ivs): number` - Sum all IVs (0-186 range)
- `getIVGrade(ivs): 'S'|'A'|'B'|'C'|'D'` - Calculate grade from total IVs
- `countPerfectIVs(ivs): number` - Count stats with value 31
- `ivsToDbFormat(ivs): DbIVs` - Convert to snake_case database format
- `dbFormatToIVs(dbIVs): IVs` - Convert from database format to camelCase

## Dependencies

None (pure utility module)

## Used By

TBD

## Notes

- Perfect IV (31) has 4% base chance per stat
- Zero IV (0) has 1% base chance per stat
- Shiny Pokemon get floor of 5 and 3 guaranteed perfect IVs
- Legendary Pokemon get floor of 10 and 3 guaranteed perfect IVs
- 6x31 perfect Pokemon probability: ~1 in 244 million
