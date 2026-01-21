---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\packages\shared\src\types\core.ts
type: model
updated: 2026-01-20
status: active
---

# core.ts (shared types)

## Purpose

Defines the core game entity interfaces that form the foundation of the Pokemon Idle MMO data model. These types are shared between frontend and backend to ensure type safety across the full stack.

## Exports

- `Player` - Player profile with id, user_id, username, zone, money, badges
- `PokemonSpecies` - Species data including base stats, types, evolution info
- `Pokemon` - Individual Pokemon with stats, IVs, level, XP, party/box position
- `Zone` - Map location with type (town/route), encounter rate, level range
- `WildPokemon` - Encounter Pokemon with calculated stats and IVs before catch

## Dependencies

None (foundational types)

## Used By

TBD

## Notes

- Pokemon interface includes all 6 IVs (iv_hp through iv_speed) for stat calculations
- Zone direction field populated from zone_connections for travel UI
- PokemonSpecies includes evolution_method and evolution_level for evolution system
