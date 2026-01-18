---
phase: 02-guild-invites
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, migrations, invites]

# Dependency graph
requires:
  - 01-01 (guilds table, guild_members table, guild_role enum)
provides:
  - guild_invites table with 7-day expiration
  - send_guild_invite function (leader/officer only)
  - accept_guild_invite function (with 24hr cooldown)
  - decline_guild_invite function
  - cancel_guild_invite function
  - RLS policies for invite visibility
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER functions for invite lifecycle
    - FOR UPDATE row locking on invite operations
    - Automatic expired invite cleanup on send/accept
    - Invites filtered by expires_at > NOW() (no cron needed)

key-files:
  created:
    - supabase/migrations/023_guild_invites.sql
  modified: []

key-decisions:
  - "7-day expiration with expires_at column instead of cron job for cleanup"
  - "Delete expired invites opportunistically during send/accept operations"
  - "Accept validates join_mode in case guild changed since invite was sent"

patterns-established:
  - "Invite lifecycle via atomic functions: send_guild_invite(), accept_guild_invite(), decline_guild_invite(), cancel_guild_invite()"
  - "Unique constraint on (guild_id, player_id) prevents duplicate invites"
  - "invited_by tracks who sent the invite (SET NULL on delete)"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 2 Plan 1: Guild Invites Database Schema Summary

**PostgreSQL schema for guild invite system with guild_invites table, RLS policies, and atomic SECURITY DEFINER functions for send/accept/decline/cancel operations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T18:50:40Z
- **Completed:** 2026-01-18T18:52:06Z
- **Tasks:** 3/3
- **Files created:** 1

## Accomplishments

- Created guild_invites table with 7-day expiration via expires_at default
- Added unique constraint to prevent duplicate invites to same player from same guild
- Added no_self_invite check constraint
- Implemented RLS policies: players view own invites, guild staff view outgoing invites
- Blocked direct INSERT/UPDATE/DELETE via RLS (force use of functions)
- Built four atomic functions with proper validation and locking

## Task Commits

All tasks completed in single migration file:

1. **Task 1: Create guild_invites table** - `88b4c69` (feat)
2. **Task 2: Add RLS policies** - included in above commit
3. **Task 3: Create SECURITY DEFINER functions** - included in above commit

## Files Created/Modified

- `supabase/migrations/023_guild_invites.sql` - Complete invite schema including table, indexes, RLS policies, and four atomic functions

## Decisions Made

1. **7-day expiration via column default** - Using `expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'` with query-time filtering instead of scheduled cleanup job.

2. **Opportunistic expired invite cleanup** - When sending or accepting invites, delete any expired invites for that player from that guild. This keeps the table clean without needing a cron.

3. **Re-validate join_mode on accept** - Even though invite was sent when guild allowed it, accept_guild_invite checks join_mode again in case leader closed the guild since.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database migration must be applied manually:**

1. Open Supabase Dashboard SQL Editor
2. Run contents of `supabase/migrations/023_guild_invites.sql`
3. Verify table exists: `SELECT * FROM guild_invites LIMIT 1;`
4. Verify functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%guild_invite%';`

## Next Phase Readiness

- Invite schema is complete and ready for shared types (Plan 02-02)
- Functions can be called via:
  - `SELECT send_guild_invite(actor_id, target_id)`
  - `SELECT accept_guild_invite(player_id, invite_id)`
  - `SELECT decline_guild_invite(player_id, invite_id)`
  - `SELECT cancel_guild_invite(actor_id, invite_id)`
- No blockers for next plan

---
*Phase: 02-guild-invites*
*Plan: 01*
*Completed: 2026-01-18*
