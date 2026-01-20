---
phase: 12-party-reordering
plan: 01
subsystem: api
tags: [websocket, dnd-kit, drag-and-drop, party-management]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: WebSocket infrastructure, party_slot column
provides:
  - reorderParty database function with ownership validation
  - reorder_party WebSocket message handler
  - gameSocket.reorderParty() client method
  - broadcastToPlayer helper for cross-tab sync
  - @dnd-kit packages installed for UI implementation
affects: [12-02, 12-03]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: [broadcastToPlayer for cross-tab sync]

key-files:
  created: []
  modified:
    - apps/game-server/src/db.ts
    - apps/game-server/src/hub.ts
    - apps/web/src/lib/ws/gameSocket.ts
    - apps/web/package.json

key-decisions:
  - "No battle check needed - idle game has no persistent battle state"
  - "Use broadcastToPlayer helper for cross-tab sync (broadcasts party_update to all player sessions)"

patterns-established:
  - "broadcastToPlayer: Helper method to send messages to all sessions for a player"

# Metrics
duration: 4min
completed: 2026-01-20
---

# Phase 12 Plan 01: Backend Infrastructure Summary

**WebSocket reorder_party endpoint with database validation and cross-tab broadcast, plus @dnd-kit packages installed**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-20
- **Completed:** 2026-01-20
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- reorderParty database function validates ownership before updating party_slot positions
- reorder_party WebSocket handler with broadcastToPlayer for cross-tab sync
- gameSocket.reorderParty() client method ready for frontend use
- @dnd-kit packages installed for Plan 02 drag-and-drop UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @dnd-kit packages** - `720f24a` (chore)
2. **Task 2: Add reorderParty database function** - `4a57200` (feat)
3. **Task 3: Add reorder_party WebSocket handler** - `5511de4` (feat)
4. **Task 4: Add reorderParty client method** - `15f6441` (feat)

## Files Created/Modified
- `apps/web/package.json` - Added @dnd-kit dependencies
- `apps/game-server/src/db.ts` - reorderParty function with ownership validation
- `apps/game-server/src/hub.ts` - reorder_party handler + broadcastToPlayer helper
- `apps/web/src/lib/ws/gameSocket.ts` - reorderParty client method

## Decisions Made
- **Removed battle check:** Plan suggested checking `client.session.encounter` but PlayerSession type has no such property. This is an idle game where battles auto-resolve per tick - no persistent battle state exists. Party reordering is allowed anytime.
- **broadcastToPlayer pattern:** Created reusable helper that iterates all clients and sends to those matching player ID, enabling cross-tab sync as specified in CONTEXT.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed non-existent encounter property check**
- **Found during:** Task 3 (reorder_party handler)
- **Issue:** Plan specified `if (client.session.encounter)` check but `encounter` property does not exist on PlayerSession type
- **Fix:** Removed the battle check since the game is idle-based with no persistent battle state
- **Files modified:** apps/game-server/src/hub.ts
- **Verification:** TypeScript compiles successfully
- **Committed in:** 5511de4 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Removed invalid type access. No functional loss - idle game has no battle state to check.

## Issues Encountered
- Pre-existing type errors in BankPokemonTab.tsx (GuildBankPokemon missing IV properties) - unrelated to this plan, did not block execution

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend infrastructure complete and ready for frontend drag-and-drop UI
- Plan 02 can use gameSocket.reorderParty() to persist order changes
- @dnd-kit packages already installed

---
*Phase: 12-party-reordering*
*Completed: 2026-01-20*
