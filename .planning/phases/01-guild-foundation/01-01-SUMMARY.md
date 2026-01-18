---
phase: 01-guild-foundation
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, migrations, guilds]

# Dependency graph
requires: []
provides:
  - guilds table with name/tag/description and 50-member cap
  - guild_members table with role tracking (leader/officer/member)
  - guild_role enum type
  - players.guild_id and left_guild_at columns for fast lookups and cooldown
  - RLS policies for guild data protection
  - create_guild, join_guild, leave_guild atomic functions
affects: [01-02, 01-03, 01-04, 02-guild-invites, 03-guild-chat, 04-guild-bank]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER functions for all guild mutations
    - FOR UPDATE row locking to prevent race conditions
    - Denormalized member_count for performance
    - Trigger-based sync between guild_members and players.guild_id

key-files:
  created:
    - supabase/migrations/022_guilds.sql
  modified: []

key-decisions:
  - "Block all direct INSERT/UPDATE/DELETE on guild tables via RLS, force use of SECURITY DEFINER functions"
  - "Denormalize member_count on guilds table to avoid COUNT(*) on every join check"
  - "Partial unique index for single leader instead of application-level check"

patterns-established:
  - "Guild mutations via atomic functions: create_guild(), join_guild(), leave_guild()"
  - "Player can only be in one guild (enforced by UNIQUE constraint on player_id)"
  - "24hr cooldown tracked via players.left_guild_at column"

# Metrics
duration: 8min
completed: 2026-01-18
---

# Phase 1 Plan 1: Guild Database Schema Summary

**PostgreSQL schema for guild system with guilds/guild_members tables, RLS policies, and atomic SECURITY DEFINER functions for create/join/leave operations**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-18
- **Completed:** 2026-01-18
- **Tasks:** 3/3
- **Files created:** 1

## Accomplishments

- Created guilds table with name/tag uniqueness, format constraints, 50-member cap
- Created guild_members table with single-guild-per-player constraint and leader uniqueness index
- Added guild_id and left_guild_at columns to players table with sync trigger
- Implemented RLS policies allowing guild discovery while protecting mutations
- Built three atomic functions (create_guild, join_guild, leave_guild) with proper locking and validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create core guild tables and enums** - `7549b58` (feat)
2. **Task 2: Add RLS policies for guild data** - `53969d9` (feat)
3. **Task 3: Create atomic database functions** - `5ad5267` (feat)

## Files Created/Modified

- `supabase/migrations/022_guilds.sql` - Complete guild schema including tables, enums, indexes, RLS policies, and atomic functions

## Decisions Made

1. **Block direct mutations via RLS** - All INSERT/UPDATE/DELETE blocked at RLS level, forcing use of SECURITY DEFINER functions. This ensures atomic operations and proper permission checks.

2. **Denormalized member_count** - Storing member_count on guilds table avoids expensive COUNT(*) queries on every join attempt. Maintained via function logic.

3. **Partial unique index for leader** - Using `WHERE role = 'leader'` partial unique index instead of application logic ensures database-level guarantee of single leader per guild.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database migration must be applied manually:**

1. Open Supabase Dashboard SQL Editor
2. Run contents of `supabase/migrations/022_guilds.sql`
3. Verify tables exist: `SELECT * FROM guilds LIMIT 1;`

## Next Phase Readiness

- Guild schema is complete and ready for game server integration (Plan 01-02)
- Functions can be called via `SELECT create_guild(...)`, `SELECT join_guild(...)`, `SELECT leave_guild(...)`
- No blockers for next plan

---
*Phase: 01-guild-foundation*
*Plan: 01*
*Completed: 2026-01-18*
