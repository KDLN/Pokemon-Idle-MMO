---
phase: 06-guild-shop-statistics
plan: 02
subsystem: shared-types
tags: [typescript, types, guild-shop, buff, statistics, leaderboard, websocket]

dependency-graph:
  requires: [06-01]  # Database schema defines structure
  provides: [shared-types-shop-stats]  # Type-safe communication
  affects: [06-03, 06-04]  # Handlers and frontend use these types

tech-stack:
  added: []
  patterns:
    - Union types for constrained string values
    - Interface extension not used (flat types for clarity)
    - Keyed object for lookup patterns (ActiveGuildBuffs)

file-tracking:
  key-files:
    created: []
    modified:
      - packages/shared/src/types/guild.ts

decisions:
  - id: buff-type-union
    choice: "GuildBuffType = 'xp_bonus' | 'catch_rate' | 'encounter_rate'"
    rationale: "Matches database enum values for type safety"
  - id: active-buffs-keyed
    choice: "ActiveGuildBuffs uses keyed object rather than array"
    rationale: "O(1) lookup by buff type, each type can only have one active buff"
  - id: leaderboard-metric-union
    choice: "LeaderboardMetric = 'catches' | 'pokedex' | 'members'"
    rationale: "Three distinct ranking criteria matching statistics fields"
  - id: guild-rank-info-separate
    choice: "GuildRankInfo as separate type from GuildLeaderboardEntry"
    rationale: "Player's guild rank returned alongside full leaderboard"

metrics:
  duration: "~5 minutes"
  completed: "2026-01-19"
---

# Phase 6 Plan 2: Shared Types for Guild Shop & Statistics Summary

**One-liner:** TypeScript types for guild buffs (3 types), statistics (7 fields), leaderboard entries, and 10 WebSocket payloads enabling type-safe client-server communication.

## What Was Done

### Task 1: Guild Buff Types
Added type definitions for the guild buff system:
- `GuildBuffType` union: `'xp_bonus' | 'catch_rate' | 'encounter_rate'`
- `GuildBuff` interface: complete buff data with multiplier, timestamps, purchaser
- `ActiveGuildBuffs` interface: keyed by buff type for O(1) lookup
- `GuildBuffPurchase` interface: purchase history tracking
- `GuildShopItem` interface: UI configuration for shop display

### Task 2: Guild Statistics & Leaderboard Types
Added type definitions for statistics and leaderboard:
- `GuildStatistics` interface: 7 fields (total_catches, unique_species, member_count, avg_level, days_active, created_at, guild_points)
- `LeaderboardMetric` union: `'catches' | 'pokedex' | 'members'`
- `GuildLeaderboardEntry` interface: rank, guild info, value, leader_name
- `GuildRankInfo` interface: player's guild position in leaderboard

### Task 3: WebSocket Payload Types
Added client-to-server and server-to-client payload types:

**Client -> Server (4 payloads):**
- `PurchaseGuildBuffPayload`: buff_type, duration_hours, use_guild_points
- `GetActiveBuffsPayload`: empty request
- `GetGuildStatisticsPayload`: empty request
- `GetGuildLeaderboardPayload`: metric, optional limit

**Server -> Client (6 payloads):**
- `GuildActiveBuffsPayload`: buffs object
- `GuildBuffPurchasedPayload`: buff, remaining balances, purchaser info
- `GuildBuffExpiredPayload`: buff_type notification
- `GuildStatisticsPayload`: statistics object
- `GuildLeaderboardPayload`: entries array with my_guild_rank
- `GuildShopErrorPayload`: error handling

## Commits

| Hash | Message |
|------|---------|
| b717b98 | feat(06-02): add guild buff types |
| 9841749 | feat(06-02): add guild statistics and leaderboard types |
| eb491cc | feat(06-02): add WebSocket payloads for guild shop and statistics |

## Verification Results

- TypeScript compiles without errors (shared package build passes)
- GuildBuffType union type defined with 3 buff types
- GuildBuff interface with id, guild_id, buff_type, multiplier, timestamps, purchaser fields
- ActiveGuildBuffs keyed by buff type (xp_bonus, catch_rate, encounter_rate)
- GuildStatistics with 7 fields
- LeaderboardMetric union with 3 metrics
- GuildLeaderboardEntry with rank, id, name, tag, value, leader_name
- All WebSocket payloads defined (4 client->server, 6 server->client)

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

| File | Changes |
|------|---------|
| packages/shared/src/types/guild.ts | +154 lines (buff types, statistics types, WebSocket payloads) |

## Next Phase Readiness

Ready for 06-03 (WebSocket Handlers):
- All type definitions in place for handlers to use
- Payload types match handler function signatures
- Statistics and leaderboard types ready for database queries
