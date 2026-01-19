---
phase: 05-guild-quests
plan: 01
subsystem: database
tags: [postgres, rpc, guild-quests, lazy-generation, utc-reset]

# Dependency graph
requires:
  - phase: 04-guild-bank
    provides: guild_bank_currency, guild_bank_items, guild_bank_logs tables for reward distribution
provides:
  - Guild quest schema with 5 tables and 2 enums
  - 14 SECURITY DEFINER functions for quest operations
  - Lazy quest generation at midnight UTC
  - Activity-based difficulty scaling
  - Reroll system with currency costs
  - Quest history with top contributors
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - advisory lock for race condition prevention
    - lazy generation on first access after reset
    - UTC-based daily/weekly reset mechanics

key-files:
  created:
    - supabase/migrations/027_guild_quests.sql
  modified: []

key-decisions:
  - "Quest count scales with guild size: 3 + (members/10), max 6 daily"
  - "Weekly quests fixed at 3 per guild"
  - "2 daily rerolls at 500 currency, 1 weekly reroll at 2000 currency"
  - "Individual bonuses: 10% of reward pool distributed proportionally"
  - "Difficulty scales with 7-day rolling activity average"

patterns-established:
  - "Lazy quest generation: generate on first access if none exist for current period"
  - "Advisory lock pattern: pg_advisory_xact_lock(hashtext(guild_id || period))"
  - "Activity stats cleanup: auto-delete stats older than 30 days"
  - "Quest archive: move to history with top 3 contributors on expiration"

# Metrics
duration: 12min
completed: 2026-01-19
---

# Phase 5 Plan 1: Guild Quest Database Schema Summary

**Guild quest schema with lazy generation, activity-based difficulty scaling, reroll system, and reward distribution to guild bank**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-19T00:00:00Z
- **Completed:** 2026-01-19T00:12:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Created 5 tables for quest tracking: guild_quests, guild_quest_contributions, guild_quest_rerolls, guild_quest_history, guild_activity_stats
- Created 14 SECURITY DEFINER functions for all quest operations
- Implemented lazy generation with advisory locks preventing race conditions
- Built reroll system with role-based permissions (leader/officer only) and currency costs
- Integrated reward distribution with existing guild bank tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create quest tables and enum types** - `e824d65` (feat)
2. **Task 2: Create quest generation and progress functions** - `378d443` (feat)
3. **Task 3: Create reroll and history functions** - `826fc3f` (feat)

## Files Created/Modified
- `supabase/migrations/027_guild_quests.sql` - Complete quest schema (1370 lines)
  - 2 enum types: quest_type, quest_period
  - 5 tables with proper constraints and indexes
  - 14 functions for generation, progress, rewards, rerolls, history
  - RLS policies blocking all direct mutations

## Decisions Made
- **Quest count scaling:** 3 base + 1 per 10 members (max 6 daily) for scalable difficulty
- **Weekly fixed at 3:** Simpler than scaling, provides consistent weekly goals
- **Reroll costs:** 500 daily, 2000 weekly to prevent abuse while allowing flexibility
- **Reroll limits:** 2 daily, 1 weekly resets at midnight/Monday UTC
- **Individual bonus pool:** 10% of quest reward distributed proportionally by contribution
- **Minimum bonus:** 1 currency for any contribution (encourages participation)
- **Type filters:** 8 Pokemon types for catch_type quests (fire, water, grass, electric, normal, flying, bug, poison)
- **Base targets:** catch_pokemon=20, catch_type=10, battle=15, evolve=3 for daily

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all functions created successfully following existing patterns from 026_guild_bank.sql.

## User Setup Required

**Database migration required.** Apply migration via Supabase Dashboard SQL Editor:
1. Navigate to SQL Editor in Supabase Dashboard
2. Paste contents of `supabase/migrations/027_guild_quests.sql`
3. Execute the migration

## Next Phase Readiness
- Schema ready for shared types definition (05-02)
- Functions ready for game server handler integration (05-03)
- Tables support frontend display requirements (05-04)
- No blockers identified

---
*Phase: 05-guild-quests*
*Completed: 2026-01-19*
