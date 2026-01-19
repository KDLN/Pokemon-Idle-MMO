---
phase: 05-guild-quests
plan: 02
subsystem: api
tags: [typescript, websocket, guild-quests, shared-types]

# Dependency graph
requires:
  - phase: 05-guild-quests
    plan: 01
    provides: Database schema for guild quests
provides:
  - Quest data types (GuildQuest, GuildQuestWithContribution, GuildQuestHistory)
  - Quest type aliases (QuestType, QuestPeriod)
  - Contribution tracking types (QuestContribution, QuestRerollStatus)
  - WebSocket payloads for all quest operations
affects: [05-03-game-server-handlers, 05-04-frontend-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [quest-type-hierarchy, contribution-tracking-types]

key-files:
  created: []
  modified:
    - packages/shared/src/types/guild.ts

key-decisions:
  - "Quest types extend base GuildQuest with contribution/leaderboard data"
  - "Milestone payloads support 25/50/75/100 percentage markers"
  - "Reroll status tracks daily and weekly pools separately"

patterns-established:
  - "Quest contribution leaderboard: QuestContribution[] with rank field"
  - "Quest reset notification includes new quests and reset times"
  - "History archives include top_contributors for display"

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 5 Plan 02: Shared Types for Guild Quests Summary

**TypeScript types for guild quests with contribution tracking, reroll status, milestone notifications, and all WebSocket payloads**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T00:00:00Z
- **Completed:** 2026-01-19T00:05:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Quest data types matching database schema (GuildQuest, GuildQuestHistory)
- Contribution tracking types (QuestContribution, GuildQuestWithContribution, GuildQuestDetailed)
- Reroll and reset time tracking types (QuestRerollStatus, QuestResetTimes)
- Full WebSocket payload coverage for client-server communication

## Task Commits

Each task was committed atomically:

1. **Task 1: Add quest data types** - `d892be4` (feat)
2. **Task 2: Add quest WebSocket payloads** - `6d70a32` (feat)
3. **Task 3: Verify exports** - N/A (verification only, no code changes)

## Files Created/Modified
- `packages/shared/src/types/guild.ts` - Added 19 quest-related types and interfaces

## Types Added

### Quest Data Types (Task 1)
- `QuestType` - Union type: 'catch_pokemon' | 'catch_type' | 'battle' | 'evolve'
- `QuestPeriod` - Union type: 'daily' | 'weekly'
- `GuildQuest` - Base quest data matching database schema
- `GuildQuestWithContribution` - Quest with player's contribution count
- `QuestContribution` - Leaderboard entry (player_id, username, contribution, rank)
- `GuildQuestDetailed` - Quest with full contribution leaderboard
- `QuestRerollStatus` - Tracks daily/weekly reroll counts and costs
- `QuestResetTimes` - Next daily/weekly reset timestamps
- `GuildQuestsState` - Aggregates daily/weekly quests with reroll and reset info
- `GuildQuestHistory` - Archived quest with final_progress and top_contributors

### WebSocket Payloads (Task 2)

**Client -> Server:**
- `GetGuildQuestsPayload` - Request full quest state
- `GetQuestDetailsPayload` - Request quest details with leaderboard
- `RerollQuestPayload` - Reroll a quest
- `GetQuestHistoryPayload` - Paginated history request

**Server -> Client:**
- `GuildQuestsDataPayload` - Full quest state response
- `GuildQuestDetailsPayload` - Quest details with leaderboard
- `GuildQuestProgressPayload` - Real-time progress broadcast
- `GuildQuestMilestonePayload` - 25/50/75/100% milestone notifications
- `GuildQuestCompletedPayload` - Completion with rewards and top contributors
- `GuildQuestRerolledPayload` - Quest replaced broadcast
- `GuildQuestHistoryPayload` - Paginated history response
- `GuildQuestsResetPayload` - Daily/weekly reset notification
- `GuildQuestErrorPayload` - Error response

## Decisions Made
- Quest types extend base GuildQuest interface progressively (WithContribution -> Detailed)
- Milestone notifications use union type for percentage (25 | 50 | 75 | 100) for type safety
- Reroll status tracks daily and weekly pools separately for flexible limits
- History includes top_contributors array for leaderboard display in archives

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Quest types ready for game server handlers (05-03-PLAN.md)
- WebSocket payloads define full API contract
- All types exportable from @pokemon-idle/shared

---
*Phase: 05-guild-quests*
*Completed: 2026-01-19*
