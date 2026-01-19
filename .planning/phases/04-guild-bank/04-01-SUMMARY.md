---
phase: 04-guild-bank
plan: 01
subsystem: database
tags: [postgresql, security-definer, rls, guild-bank, atomic-operations]

# Dependency graph
requires:
  - phase: 01-guild-foundation
    provides: guilds table, guild_members table, guild_role enum
provides:
  - guild_bank_currency table with capacity limits
  - guild_bank_items table with stack limits
  - guild_bank_pokemon table with slot-based storage
  - guild_bank_permissions table for role-based access
  - guild_bank_limits table for daily withdrawal caps
  - guild_bank_requests table for member request queue
  - guild_bank_logs table for full audit trail
  - 14 SECURITY DEFINER mutation functions with FOR UPDATE locking
  - 8 SECURITY DEFINER query/config functions
  - Default permissions trigger for new guilds
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER functions for atomic bank operations
    - Daily limit tracking with midnight UTC reset
    - Pokemon point-cost system based on BST tiers
    - Request system with 24-hour expiration

key-files:
  created:
    - supabase/migrations/026_guild_bank.sql

key-decisions:
  - "BST-based Pokemon withdrawal points: <300=1pt, 300-399=2pt, 400-499=5pt, 500-579=10pt, 580+=25pt"
  - "Default officer limits: 10000 currency, 20 items, 20 pokemon points daily"
  - "Default members cannot withdraw (must request)"
  - "Slot expansion doubles in price each time (5000 -> 10000 -> 20000)"
  - "Maximum 500 Pokemon slots per guild bank"
  - "Max Pokemon slots formula: base(25) + purchased + (member_count * 2)"

patterns-established:
  - "Bank mutations via SECURITY DEFINER functions with FOR UPDATE row locking"
  - "Daily limits use date_trunc('day', NOW() AT TIME ZONE 'UTC') for midnight reset"
  - "Request fulfillment calls underlying withdraw functions for atomicity"
  - "Permission checks via dedicated check_bank_permission() helper"
  - "RLS blocks all direct INSERT/UPDATE/DELETE, forces use of functions"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 4 Plan 1: Guild Bank Database Schema Summary

**Complete PostgreSQL schema with 10 tables, 22 functions, and 40 RLS policies for guild bank storage, permissions, withdrawal limits, requests, and transaction logging**

## Performance

- **Duration:** 5 min 14 sec
- **Started:** 2026-01-19T00:01:18Z
- **Completed:** 2026-01-19T00:06:32Z
- **Tasks:** 4 (combined into single migration file)
- **Files created:** 1

## Accomplishments

- Created complete guild bank database schema in single 2008-line migration
- Implemented 10 tables covering currency/items/Pokemon storage, permissions, limits, tracking, requests, and logs
- Added 14 SECURITY DEFINER mutation functions with proper FOR UPDATE locking
- Added 8 query/configuration functions for bank state retrieval and permission management
- Established BST-based Pokemon withdrawal point system (1-25 points based on rarity)
- Created default permissions trigger that auto-configures new guilds
- Added comprehensive RLS policies blocking direct mutations on all tables

## Task Commits

All tasks were implemented in a single migration file:

1. **Tasks 1-4: Complete guild bank schema** - `11c48f8` (feat)

## Files Created

- `supabase/migrations/026_guild_bank.sql` - Complete guild bank database schema with:
  - 3 enum types (bank_category, bank_action, request_status)
  - 10 tables (storage, permissions, limits, tracking, requests, logs)
  - 4 helper functions (permission check, daily limit, pokemon points, max slots)
  - 14 mutation functions (deposit/withdraw currency/items/pokemon, requests, slot expansion)
  - 8 query/config functions (get bank, get limits, get requests, get logs, set permissions)
  - 40 RLS policies for all tables

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| BST tiers: <300=1pt, 300-399=2pt, 400-499=5pt, 500-579=10pt, 580+=25pt | Balanced for Gen 1 range, legendary tier starts at 580 BST |
| Default officer limits: 10000/20/20 | Reasonable daily caps that prevent abuse while allowing functionality |
| Members cannot withdraw by default | Forces use of request system, maintains leader control |
| Slot expansion doubles each time | Provides gold sink, prevents trivial max-slot guilds |
| Max 500 Pokemon slots | Prevents runaway storage, keeps queries performant |
| Slots = base(25) + purchased + (members * 2) | Scales with guild size, rewards growing guilds |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required. Migration can be applied via Supabase Dashboard SQL Editor.

## Next Phase Readiness

- Database schema ready for game server handlers (04-02)
- All RPC functions ready to be called from db.ts
- Query functions return JSON formatted for frontend consumption
- Shared types needed next (04-02) to expose TypeScript interfaces

---
*Phase: 04-guild-bank*
*Plan: 01*
*Completed: 2026-01-18*
