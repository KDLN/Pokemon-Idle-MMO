---
phase: 05-guild-quests
plan: 03
subsystem: game-server
tags: [typescript, websocket, guild-quests, activity-tracking, real-time]

# Dependency graph
requires:
  - phase: 05-guild-quests
    plan: 01
    provides: Database schema and RPC functions for guild quests
  - phase: 05-guild-quests
    plan: 02
    provides: Quest TypeScript types and WebSocket payloads
provides:
  - Quest database wrapper functions in db.ts
  - Activity hooks in processTicks for catches/battles/evolutions
  - Quest progress broadcast helper for real-time updates
  - Milestone notifications at 25%, 50%, 75%, 100%
affects: [05-04-frontend-ui, 05-05-progress-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget-async, activity-hooks-in-tick-loop]

key-files:
  created: []
  modified:
    - apps/game-server/src/db.ts
    - apps/game-server/src/hub.ts

key-decisions:
  - "Fire-and-forget pattern for quest updates - no await in tick loop"
  - "Pass Pokemon type1 for catch_type quest filtering"
  - "Every encounter counts as a battle for battle quests"
  - "Evolution tracking in handleConfirmEvolution after successful database save"

patterns-established:
  - "Activity hooks follow existing weekly stats pattern location"
  - "Quest progress broadcasts to all guild members via broadcastToGuild"
  - "Milestone detection returns 25/50/75/100 or null from database function"
  - "Completion broadcast fetches full quest details for rewards"

# Metrics
duration: 10min
completed: 2026-01-19
---

# Phase 5 Plan 03: Game Server Handlers Summary

**Activity tracking hooks in processTicks with real-time quest progress broadcasts via WebSocket**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-19T00:00:00Z
- **Completed:** 2026-01-19T00:10:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Quest database wrapper functions for all RPC calls
- Catch activity tracking with Pokemon type filter
- Battle activity tracking after HP updates
- Evolution activity tracking after successful evolution
- Quest progress broadcast helper with milestone detection
- Completion broadcasts with rewards and top contributors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add quest database wrapper functions** - `80b8b6b` (feat)
   - updateGuildQuestProgress, recordGuildActivity
   - getGuildQuests, getQuestDetails, rerollQuest, getQuestHistory

2. **Task 2 & 3: Add activity hooks and quest progress broadcast** - `e72472d` (feat)
   - Catch tracking after updateWeeklyStats
   - Battle tracking after encounter HP updates
   - Evolution tracking in handleConfirmEvolution
   - updateQuestProgress helper with broadcast logic

3. **Cleanup: Remove duplicate and export types** - `4f8f436` (chore)
   - Cleaned up duplicate updateQuestProgress method
   - Exported quest types from types.ts

## Files Created/Modified
- `apps/game-server/src/db.ts` - Added 6 quest wrapper functions
- `apps/game-server/src/hub.ts` - Added activity hooks and broadcast helper
- `apps/game-server/src/types.ts` - Exported quest types for handlers

## Functions Added

### db.ts Quest Functions
- `updateGuildQuestProgress(guildId, playerId, questType, amount, typeFilter?)` - Update progress, returns milestones
- `recordGuildActivity(guildId, activityType, amount)` - Record for difficulty scaling
- `getGuildQuests(guildId, playerId)` - Get all active quests (triggers lazy generation)
- `getQuestDetails(questId, playerId)` - Get quest with full leaderboard
- `rerollQuest(guildId, playerId, questId)` - Reroll quest (leader/officer only)
- `getQuestHistory(guildId, page, limit)` - Get paginated history

### hub.ts Activity Hooks
- **Catch hook:** After successful catch in processTicks, updates catch_pokemon quest with type filter
- **Battle hook:** After HP updates in processTicks, updates battle quest
- **Evolution hook:** After successful evolution save, updates evolve quest

### hub.ts Broadcast Helper
- `updateQuestProgress(guildId, playerId, username, questType, amount, typeFilter?)` - Fire-and-forget helper
  - Broadcasts `guild_quest_progress` for every update
  - Broadcasts `guild_quest_milestone` at 25%, 50%, 75%, 100%
  - Broadcasts `guild_quest_completed` at 100% with rewards and top 3 contributors

## Decisions Made
- Fire-and-forget pattern prevents tick loop blocking
- Pokemon primary type (type1) passed for catch_type quest filtering
- Every wild encounter counts as a battle
- Activity hooks placed after existing weekly stats tracking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Quest handlers and types already existed**
- **Found during:** Task 2
- **Issue:** hub.ts already had quest handlers and updateQuestProgress from a previous session
- **Fix:** Added activity hooks to existing structure, cleaned up duplicate method
- **Files modified:** apps/game-server/src/hub.ts, apps/game-server/src/types.ts
- **Commit:** 4f8f436

## Issues Encountered

None - plan executed with minor cleanup needed for pre-existing code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Server handlers ready for frontend integration (05-04-PLAN.md)
- Real-time broadcasts enable live progress display
- Milestone notifications ready for toast/notification UI
- All quest operations callable via WebSocket

---
*Phase: 05-guild-quests*
*Completed: 2026-01-19*
