---
phase: 01-guild-foundation
plan: 02
subsystem: types
tags: [typescript, shared-types, websocket-messages, guild]

# Dependency graph
requires:
  - phase: none
    provides: none (foundation types)
provides:
  - Guild, GuildMember, GuildPreview, PlayerGuildInfo interfaces
  - GuildRole and GuildJoinMode type aliases
  - WebSocket message payloads for all guild operations
affects: [01-guild-foundation, game-server, web-app]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guild types in packages/shared/src/types/guild.ts"
    - "Message payload pattern: {action}Payload for client->server, {event}Payload for server->client"

key-files:
  created:
    - packages/shared/src/types/guild.ts
  modified:
    - packages/shared/src/types/index.ts

key-decisions:
  - "Used string types for UUIDs and timestamps (consistent with existing codebase)"
  - "Separated Guild (full data) from GuildPreview (search/discovery)"
  - "Included PlayerGuildInfo for session caching"

patterns-established:
  - "Guild type definitions follow existing social.ts and trade.ts patterns"
  - "WebSocket payloads split into client->server and server->client sections"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 1 Plan 02: Shared Types for Guild System Summary

**TypeScript type definitions for guild system: GuildRole enum, Guild/GuildMember/GuildPreview interfaces, and 17 WebSocket message payloads for all guild operations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T17:29:20Z
- **Completed:** 2026-01-18T17:31:39Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created comprehensive guild type definitions matching planned database schema
- Added all WebSocket message payloads for Phase 1 guild operations
- Types now importable from @pokemon-idle/shared in both web app and game server

## Task Commits

Each task was committed atomically:

1. **Task 1: Create guild types file** - `98937c7` (feat)
2. **Task 2: Export guild types from barrel files** - Already committed in `5ad5267` (Plan 01-01)

_Note: Task 2's barrel export was committed as part of Plan 01-01's database functions task, which added the guild type export to maintain import consistency._

## Files Created/Modified
- `packages/shared/src/types/guild.ts` - Guild type definitions (GuildRole, GuildJoinMode, Guild, GuildPreview, GuildMember, PlayerGuildInfo, 17 WebSocket payload interfaces)
- `packages/shared/src/types/index.ts` - Added export for guild.js

## Decisions Made
- Used string for UUIDs (consistent with existing codebase, not branded types)
- Used string for timestamps in ISO format (consistent with existing patterns)
- Kept interfaces flat (no nested objects except joined data like username)
- Used null for optional database fields, undefined for optional message fields
- Separated Guild (full data for members) from GuildPreview (minimal data for search)

## Deviations from Plan

None - plan executed exactly as written.

_Note: Task 2's barrel file change was already committed by Plan 01-01 which ran concurrently. This is expected cross-plan coordination._

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guild types available for import in game-server handlers
- Types aligned with database schema from Plan 01-01
- Ready for Plan 01-03 (WebSocket handlers) implementation

---
*Phase: 01-guild-foundation*
*Completed: 2026-01-18*
