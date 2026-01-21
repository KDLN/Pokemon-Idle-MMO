---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\packages\shared\src\index.ts
type: module
updated: 2026-01-20
status: active
---

# index.ts (shared)

## Purpose

Main entry point for the @pokemon-idle/shared package that exports all shared types and utilities used by both frontend and backend. Provides XP calculation functions and chat channel constants that ensure consistency across the monorepo.

## Exports

- Re-exports all types from `./types/index.js` (Player, Pokemon, Zone, Guild, Trade, etc.)
- `CHAT_CHANNELS` - Constant array of valid chat channels: ['global', 'trade', 'guild', 'system', 'whisper']
- `xpForLevel(level): number` - Calculate total XP required for a level (medium-fast growth curve)
- `getXPProgress(xp, level): { current, needed, percentage }` - Calculate XP progress within current level

## Dependencies

- [[packages-shared-src-types-index]] - Type re-exports

## Used By

TBD

## Notes

- XP formula uses medium-fast growth curve: floor((6 * level^3) / 5)
- Package is consumed by both apps/web and apps/game-server
