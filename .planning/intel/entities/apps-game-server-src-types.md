---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\types.ts
type: model
updated: 2026-01-20
status: active
---

# types.ts

## Purpose

Type definitions hub for the game server that re-exports all shared types from @pokemon-idle/shared and defines backend-only types. Provides type safety for WebSocket messages, player sessions, encounter tables, and weekly statistics tracking.

## Exports

- Re-exports ~150+ types from @pokemon-idle/shared (Player, Pokemon, Zone, Guild, Trade, etc.)
- `Move` - Backend-only move data structure for battle calculations
- `EncounterTableEntry` - Zone spawn table entry with species and rate
- `PlayerSession` - In-memory player state during connection (party, zone, inventory, guild, trade, evolution state)
- `WeeklyStats` - Weekly statistics tracking for leaderboards

## Dependencies

- [[packages-shared-src-index]] - Shared type definitions between frontend and backend

## Used By

TBD

## Notes

- PlayerSession contains all transient state: pending evolutions, suppressed evolutions, active trade, encounter cooldown
- Move interface used only for server-side battle calculations
- EncounterTableEntry extends shared types with optional resolved species data
