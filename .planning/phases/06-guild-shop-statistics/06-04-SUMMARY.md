---
phase: 06-guild-shop-statistics
plan: 04
subsystem: frontend
tags: [guild, shop, buffs, statistics, leaderboard, react, zustand, websocket]
dependency-graph:
  requires: [06-03]
  provides: [guild-shop-ui, guild-statistics-ui, guild-leaderboard-ui]
  affects: []
tech-stack:
  added: []
  patterns: [component-modal, zustand-websocket-integration]
key-files:
  created:
    - apps/web/src/components/game/guild/GuildShopModal.tsx
    - apps/web/src/components/game/guild/ShopBuffCard.tsx
    - apps/web/src/components/game/guild/ActiveBuffsDisplay.tsx
    - apps/web/src/components/game/guild/GuildStatisticsSection.tsx
    - apps/web/src/components/game/guild/GuildLeaderboardModal.tsx
  modified:
    - apps/web/src/lib/ws/gameSocket.ts
    - apps/web/src/components/game/guild/index.ts
    - apps/web/src/components/game/guild/GuildPanel.tsx
decisions:
  - Use myGuildRole from store for permission checks (not guild.role)
  - Tailwind dynamic classes with explicit color names for buff badges
  - System messages for buff purchase/expiry notifications
metrics:
  duration: 6m
  completed: 2026-01-19
---

# Phase 6 Plan 4: Frontend UI for Guild Shop & Statistics Summary

**One-liner:** Complete frontend UI for guild shop with buff purchasing, statistics display, and guild leaderboard with metric toggles.

## Changes Summary

### Task 1: WebSocket Handlers for Guild Shop
- Added 6 message type imports from @pokemon-idle/shared
- Registered 6 handlers in constructor: guild_active_buffs, guild_buff_purchased, guild_buff_expired, guild_statistics, guild_leaderboard, guild_shop_error
- Added 4 send methods: sendPurchaseGuildBuff, sendGetActiveBuffs, sendGetGuildStatistics, sendGetGuildLeaderboard
- Handler implementations update Zustand state and add guild chat system messages for buff events

### Task 2: GuildShopModal and ShopBuffCard
- ShopBuffCard component with duration slider (1-24h), currency/points payment toggle
- Shows active buff remaining time if already active
- Role-based purchase permission check (leader/officer only)
- GuildShopModal displays 3 buff options: XP Boost, Catch Rate Boost, Encounter Rate Boost
- Shows bank balance and guild points at top
- Fetches active buffs and statistics on modal open

### Task 3: Supporting Components and Integration
- ActiveBuffsDisplay: shows active buffs with countdown timers (refreshes every minute)
- GuildStatisticsSection: displays 6 statistics (catches, species, members, avg level, days, points)
- GuildLeaderboardModal: metric toggle (catches/pokedex/members), top 50 guilds, player's guild rank
- Updated GuildPanel with Shop and Leaderboard buttons
- Integrated ActiveBuffsDisplay and GuildStatisticsSection into GuildPanel
- Exported all 5 new components from index.ts

## Decisions Made

1. **myGuildRole from store**: Use separate myGuildRole state property for permission checks instead of guild.role which doesn't exist on Guild type
2. **Explicit Tailwind colors**: Use explicit color class names for buff badges (bg-blue-900/50, border-blue-700, text-blue-300) instead of dynamic string interpolation
3. **System messages for buffs**: Add guild chat system messages when buffs are purchased or expire

## Technical Notes

- Frontend builds successfully with all new components
- Follows existing modal patterns (GuildBankModal, GuildQuestsModal)
- Buff timer refreshes every 60 seconds via setInterval
- Leaderboard metric toggle triggers new WebSocket request

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed guild.role type error**
- **Found during:** Build verification
- **Issue:** GuildShopModal used `guild?.role` but Guild type doesn't have role property
- **Fix:** Changed to use `myGuildRole` from store (existing pattern)
- **Files modified:** apps/web/src/components/game/guild/GuildShopModal.tsx
- **Commit:** 593d256 (amended)

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| apps/web/src/lib/ws/gameSocket.ts | +94 | WebSocket handlers and send methods |
| apps/web/src/components/game/guild/ShopBuffCard.tsx | +122 | New buff card component |
| apps/web/src/components/game/guild/GuildShopModal.tsx | +101 | New shop modal |
| apps/web/src/components/game/guild/ActiveBuffsDisplay.tsx | +55 | New active buffs display |
| apps/web/src/components/game/guild/GuildStatisticsSection.tsx | +44 | New statistics section |
| apps/web/src/components/game/guild/GuildLeaderboardModal.tsx | +105 | New leaderboard modal |
| apps/web/src/components/game/guild/index.ts | +5 | Export new components |
| apps/web/src/components/game/guild/GuildPanel.tsx | +30 | Integrate new components |

## Commits

1. `c270adf` - feat(06-04): add WebSocket handlers for guild shop and statistics
2. `fcbc6e2` - feat(06-04): create GuildShopModal and ShopBuffCard components
3. `593d256` - feat(06-04): add ActiveBuffsDisplay, GuildStatisticsSection, GuildLeaderboardModal

## Next Phase Readiness

Phase 6 (Guild Shop & Statistics) is now complete with all 4 plans executed:
- 06-01: Database schema for buffs and statistics
- 06-02: Shared types for shop and statistics
- 06-03: Game server WebSocket handlers with buff application
- 06-04: Frontend UI components

The guild system milestone (Phases 1-6) is fully implemented.
