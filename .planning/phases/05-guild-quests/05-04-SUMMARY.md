---
phase: 05-guild-quests
plan: 04
subsystem: api
tags: [websocket, handlers, guild-quests, game-server]

# Dependency graph
requires:
  - phase: 05-guild-quests
    plan: 01
    provides: Database schema and RPC functions for guild quests
  - phase: 05-guild-quests
    plan: 02
    provides: TypeScript types for quest payloads
provides:
  - Quest WebSocket handlers (get_guild_quests, get_quest_details, reroll_quest, get_quest_history)
  - Fire-and-forget message switch pattern
  - Permission-checked reroll with guild broadcast
affects: [05-05-progress-tracking, frontend-guild-quests-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - fire-and-forget handler pattern (no await in switch)
    - permission check before mutation (role === 'member')
    - broadcastToGuild for real-time updates

key-files:
  created: []
  modified:
    - apps/game-server/src/hub.ts
    - apps/game-server/src/types.ts

key-decisions:
  - "Reroll restricted to leader/officer via role check"
  - "History pagination capped at 50 per page"
  - "Quest data response uses guild_quests_data message type"

patterns-established:
  - "Quest handlers follow guild bank handler pattern"
  - "Error responses use guild_quest_error type"
  - "Reroll broadcasts replacement quest to all members"

# Metrics
duration: 7min
completed: 2026-01-19
---

# Phase 5 Plan 04: Quest WebSocket Handlers Summary

**WebSocket message handlers for guild quest operations with fire-and-forget pattern, permission checks, and guild-wide broadcasts**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-19T01:35:27Z
- **Completed:** 2026-01-19T01:42:18Z
- **Tasks:** 3 (combined as single execution)
- **Files modified:** 2

## Accomplishments
- Added 4 WebSocket case statements for quest operations
- Implemented handleGetGuildQuests for fetching all active quests
- Implemented handleGetQuestDetails for quest with contribution leaderboard
- Implemented handleRerollQuest with leader/officer permission check and broadcast
- Implemented handleGetQuestHistory with pagination support
- Exported all quest types from types.ts for handler use

## Task Commits

Note: Work was completed during 05-03 execution but logically belongs to 05-04:

1. **Quest handlers** - `e72472d` (feat) - Added as part of activity hooks commit
2. **Type exports** - `4f8f436` (chore) - Added quest type exports to types.ts

## Files Created/Modified
- `apps/game-server/src/hub.ts` - Added 4 case statements and 4 handler methods
- `apps/game-server/src/types.ts` - Exported quest-related types

## Handlers Added

### Case Statements (message switch)
- `get_guild_quests` - Triggers lazy generation, returns full quest state
- `get_quest_details` - Returns quest with contribution leaderboard
- `reroll_quest` - Leader/officer only, broadcasts replacement
- `get_quest_history` - Paginated history (max 50 per page)

### Handler Methods
- `handleGetGuildQuests(client)` - Returns GuildQuestsState via guild_quests_data
- `handleGetQuestDetails(client, payload)` - Returns GuildQuestDetailed via guild_quest_details
- `handleRerollQuest(client, payload)` - Permission check, returns via guild_quest_rerolled broadcast
- `handleGetQuestHistory(client, payload)` - Returns paginated history via guild_quest_history

## Decisions Made
- Reroll permission: Only leader and officer roles can reroll (members cannot)
- History pagination: Default 20 per page, max 50 per page
- Error handling: All errors use guild_quest_error message type
- Reroll broadcast: Sent to all guild members including old_quest_id, new_quest, reroll status

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing db.ts functions**
- **Found during:** Task 1 verification
- **Issue:** Plan 05-04 depends on db.ts functions that were supposed to be in 05-03
- **Resolution:** Work was already completed in 05-03 commits
- **Note:** Plan 05-04 was executed as part of 05-03 with combined commits

**2. [Rule 1 - Bug] Duplicate updateQuestProgress method**
- **Found during:** TypeScript compilation
- **Issue:** Helper method was defined twice in hub.ts
- **Fix:** Duplicate was already removed in commit 4f8f436
- **Files modified:** apps/game-server/src/hub.ts

## Issues Encountered

The plan was designed to be executed after 05-03, but the work was actually completed during 05-03 execution. The handlers, type exports, and helper method were all added in commits e72472d and 4f8f436. This summary documents the logical completion of 05-04 requirements.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Handlers ready for frontend integration
- All 4 WebSocket operations functional
- Broadcasts in place for real-time updates
- Ready for 05-05 (Progress Tracking) execution

---
*Phase: 05-guild-quests*
*Completed: 2026-01-19*
