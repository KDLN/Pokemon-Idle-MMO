---
phase: 04-guild-bank
plan: 02
subsystem: api
tags: [typescript, websocket, shared-types, guild-bank]

# Dependency graph
requires:
  - phase: 04-01
    provides: Database schema for guild bank tables
provides:
  - Guild bank TypeScript type definitions
  - Data model types matching database schema
  - WebSocket payload types for client-server communication
affects: [04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bank types follow existing guild.ts patterns (type aliases, interfaces, Payload suffix)"
    - "Request details/log details use flexible optional properties for different action types"

key-files:
  created: []
  modified:
    - "packages/shared/src/types/guild.ts"

key-decisions:
  - "Followed existing Payload suffix convention for WebSocket types"
  - "Used flexible optional properties in GuildBankLogDetails and GuildBankRequestDetails rather than discriminated unions"
  - "Types match database schema exactly including nullable fields"

patterns-established:
  - "Bank category type alias: 'currency' | 'item' | 'pokemon'"
  - "Bank action type alias for logs: deposit, withdraw, request_*, etc."
  - "GuildBank overview interface aggregates all bank state for single-request fetch"
  - "Separate payload types for broadcasts (GuildBankCurrencyUpdatedPayload) vs responses (GuildBankDataPayload)"

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 04 Plan 02: Shared Types for Guild Bank Summary

**TypeScript types for guild bank system with 14 data model interfaces and 30 WebSocket payload types matching database schema**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T00:09:00Z
- **Completed:** 2026-01-19T00:10:43Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added 3 type aliases (BankCategory, BankAction, BankRequestStatus) matching database enums
- Added 14 data model interfaces matching 026_guild_bank.sql tables and function return types
- Added 17 client->server payload types for all bank operations
- Added 13 server->client payload types for responses and broadcasts
- All types compile successfully and are importable from @pokemon-idle/shared

## Task Commits

Each task was committed atomically:

1. **Task 1: Add guild bank data model types** - `38a3584` (feat)
2. **Task 2: Add guild bank WebSocket payload types** - `06f06de` (feat)

## Files Created/Modified
- `packages/shared/src/types/guild.ts` - Extended with Bank Types and Bank WebSocket Payloads sections (358 lines added)

## Decisions Made
- Followed existing Payload suffix convention for all WebSocket types
- Used flexible optional properties in detail interfaces (GuildBankLogDetails, GuildBankRequestDetails) to handle varying action types without complex discriminated unions
- Matched database column types exactly (string for UUIDs, number for amounts, nullable where schema allows)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All guild bank types ready for use in game-server handlers (04-03)
- Types can be imported via `import { GuildBank, GuildBankLog } from '@pokemon-idle/shared'`
- Frontend (04-04) will use same types for state management and WebSocket message handling

---
*Phase: 04-guild-bank*
*Completed: 2026-01-19*
