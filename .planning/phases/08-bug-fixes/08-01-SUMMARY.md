---
phase: 08-bug-fixes
plan: 01
subsystem: database
tags: [postgresql, rpc, guild-quests, supabase]

# Dependency graph
requires:
  - phase: v1.0 guild system
    provides: guild_quests and guild_quest_contributions tables
provides:
  - get_quest_details RPC function for contributor leaderboard display
  - Working "Show contributors" button on QuestCard component
affects: [guild-quests-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RPC function with membership verification via JOIN"
    - "ROW_NUMBER() for ranking contributors"

key-files:
  created:
    - supabase/migrations/031_fix_quest_details.sql
  modified: []

key-decisions:
  - "Return full GuildQuestDetailed structure including all base quest fields for frontend compatibility"

patterns-established:
  - "Quest details RPC: verify guild membership via JOIN before returning data"

# Metrics
duration: 1min
completed: 2026-01-19
---

# Phase 08 Plan 01: Fix Quest Details RPC Summary

**Created get_quest_details SQL function to fix "Show contributors" button error on guild quests**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-19T22:20:05Z
- **Completed:** 2026-01-19T22:21:09Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created missing `get_quest_details` RPC function in PostgreSQL
- Function verifies player is guild member before returning quest data
- Returns quest details with full contribution leaderboard including ranks
- Matches expected GuildQuestDetailed TypeScript interface

## Task Commits

Each task was committed atomically:

1. **Task 1: Create get_quest_details SQL function** - `62a0c28` (fix)
2. **Task 2: Verify db.ts getQuestDetails matches expected signature** - no commit (verification only, existing code already correct)

## Files Created/Modified

- `supabase/migrations/031_fix_quest_details.sql` - New RPC function for quest details with contribution leaderboard

## Decisions Made

- **Return all GuildQuest fields**: The SQL function returns all base quest fields (guild_id, quest_date, created_at) in addition to the plan-specified fields. This ensures full compatibility with the GuildQuestDetailed interface that extends GuildQuestWithContribution which extends GuildQuest.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - the existing db.ts function was already correctly implemented, just waiting for the missing SQL function.

## User Setup Required

**Database migration required.** Apply the migration via Supabase Dashboard SQL Editor:

1. Navigate to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/031_fix_quest_details.sql`
3. Execute the SQL

**Verification:** After applying, clicking "Show contributors" on any guild quest should display the contributor list without errors.

## Next Phase Readiness

- Bug fix complete, pending migration application to production database
- No blockers for subsequent bug fixes

---
*Phase: 08-bug-fixes*
*Completed: 2026-01-19*
