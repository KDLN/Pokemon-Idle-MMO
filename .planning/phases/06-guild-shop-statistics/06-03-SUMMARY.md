---
phase: 06-guild-shop-statistics
plan: 03
subsystem: game-server
tags: [websocket, handlers, buffs, statistics, leaderboard, caching]
dependency-graph:
  requires: ["06-01", "06-02"]
  provides: ["guild-buff-handlers", "statistics-handlers", "buff-aware-game-logic"]
  affects: ["06-04"]
tech-stack:
  added: []
  patterns:
    - "Buff cache with 5-second TTL for efficient tick processing"
    - "Multiplier application through function parameter chaining"
key-files:
  created: []
  modified:
    - "apps/game-server/src/db.ts"
    - "apps/game-server/src/types.ts"
    - "apps/game-server/src/game.ts"
    - "apps/game-server/src/hub.ts"
decisions:
  - key: "buff-cache-ttl"
    choice: "5-second TTL"
    rationale: "Balances freshness with performance - buffs don't change frequently"
  - key: "xp-bonus-in-memory"
    choice: "Apply bonus XP to Pokemon XP in memory after distributeXP"
    rationale: "Ensures Pokemon's in-memory state reflects total XP including buff bonus"
  - key: "system-message-on-purchase"
    choice: "Send guild chat system message when buff purchased"
    rationale: "Makes buff activation visible to all guild members"
metrics:
  duration: "~15 minutes"
  completed: "2026-01-19"
---

# Phase 6 Plan 3: WebSocket Handlers for Guild Shop & Statistics Summary

Guild members can now purchase buffs via WebSocket, with buff effects applying during tick processing. Statistics and leaderboards are accessible via WebSocket handlers.

## What Was Built

### Database Wrapper Functions (db.ts)

Added 5 new functions for guild shop and statistics:

1. **purchaseGuildBuff** - Purchase buff with currency or guild points
2. **getActiveGuildBuffs** - Get all active buffs (keyed object for O(1) lookup)
3. **getGuildStatistics** - Get comprehensive guild statistics
4. **getGuildLeaderboard** - Get top 50 guilds by metric
5. **getPlayerGuildRank** - Get player's guild rank for a metric

### Type Exports (types.ts)

Re-exported from shared package:
- `GuildBuffType`, `GuildBuff`, `ActiveGuildBuffs`
- `GuildStatistics`, `LeaderboardMetric`, `GuildLeaderboardEntry`, `GuildRankInfo`
- WebSocket payload types for shop/statistics operations

### Buff-Aware Game Logic (game.ts)

Modified 3 functions to support guild buffs:

1. **processTick** - Added `guildBuffs` parameter
   - Applies encounter rate buff to rollEncounter
   - Passes catch rate multiplier to processEncounter
   - Applies XP buff multiplier to distributeXP result

2. **processEncounter** - Added `catchRateMultiplier` parameter
   - Passes multiplier to attemptCatch calls

3. **attemptCatch** - Added `catchRateMultiplier` parameter
   - Applies multiplier after base catch rate calculation

### WebSocket Handlers (hub.ts)

Added buff cache and 4 new handlers:

**Buff Cache:**
- `guildBuffCache` - Map with 5-second TTL entries
- `getGuildBuffsCached()` - Fetch buffs with caching
- `invalidateGuildBuffCache()` - Clear cache on buff purchase

**Modified processTicks:**
- Fetches guild buffs (cached) for players in guilds
- Passes buffs to processTick for buff application

**New Handlers:**
1. `handlePurchaseGuildBuff` - Validate and purchase buff, broadcast to guild, send system message
2. `handleGetActiveBuffs` - Return current active buffs
3. `handleGetGuildStatistics` - Return guild statistics
4. `handleGetGuildLeaderboard` - Return leaderboard with player's guild rank

## Technical Details

### Buff Application Flow

```
processTicks()
  |
  v
getGuildBuffsCached(guildId)  // 5s TTL cache
  |
  v
processTick(session, speciesMap, guildBuffs)
  |
  +-> encounter_rate buff applied to rollEncounter()
  |
  +-> catch_rate buff extracted as catchRateMultiplier
  |
  v
processEncounter(..., catchRateMultiplier)
  |
  v
attemptCatch(..., catchRateMultiplier)  // Buff applied here
  |
  v
distributeXP()
  |
  v
XP buff multiplier applied to result
Pokemon in-memory XP updated with bonus
```

### Buff Multiplier Values

- XP Bonus: 1.10 (10% increase)
- Catch Rate: 1.10 (10% increase)
- Encounter Rate: 1.10 (10% increase)

Multipliers are configurable in the database function.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8dab712 | feat | Add database wrappers and type exports for guild shop |
| c7b59f5 | feat | Add buff support to game tick processing |
| 748c42e | feat | Add WebSocket handlers for guild shop and statistics |

## Files Changed

| File | Lines | Changes |
|------|-------|---------|
| apps/game-server/src/db.ts | +107 | New shop/stats functions |
| apps/game-server/src/types.ts | +18 | Type re-exports |
| apps/game-server/src/game.ts | +32 | Buff parameter support |
| apps/game-server/src/hub.ts | +178 | Handlers, cache, processTicks |

## Verification Completed

- [x] db.ts contains all 5 new database wrapper functions
- [x] types.ts re-exports all new types from shared package
- [x] game.ts processTick accepts guildBuffs parameter
- [x] game.ts applies encounter rate buff to rollEncounter
- [x] game.ts applies catch rate buff to attemptCatch
- [x] game.ts applies XP buff to distributeXP result
- [x] hub.ts has buff cache with 5s TTL
- [x] hub.ts processTicks fetches and passes guild buffs
- [x] hub.ts has 4 new WebSocket handlers
- [x] TypeScript compiles without errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Ready for 06-04: Frontend UI for Guild Shop & Statistics

Required for frontend:
- WebSocket handlers operational (this plan)
- Database functions callable (06-01)
- Shared types available (06-02)

Frontend needs to implement:
- Guild shop UI with buff purchase
- Active buffs display
- Guild statistics panel
- Guild leaderboard view
