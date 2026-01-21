---
phase: 14-battle-system
plan: 01
subsystem: game-logic
tags: [battle-system, websocket, state-management, typescript]

# Dependency graph
requires:
  - phase: 13-map-overhaul
    provides: Zone travel system and game state management
provides:
  - BattleManager class for server-side active battle state
  - ActiveBattle interface with HP, turn, and timeout tracking
  - Progressive battle protocol types (BattleStatus, BattleTurnMessage, CatchResultMessage)
  - 30-second battle timeout with automatic cleanup
affects: [14-02, 14-03, progressive-battles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-side battle state stored per player ID
    - Timeout tracking via lastActivity timestamp
    - Cleanup intervals for stale state management

key-files:
  created:
    - apps/game-server/src/battle/battleManager.ts
    - apps/game-server/src/battle/index.ts
    - packages/shared/src/types/battle.ts (extended)
  modified:
    - apps/game-server/src/hub.ts

key-decisions:
  - "30-second timeout for battle inactivity with 5-second cleanup interval"
  - "Speed comparison determines turn order (playerFirst flag)"
  - "Battle state includes separate current HP and max HP for both combatants"

patterns-established:
  - "ActiveBattle state tracks both Pokemon objects and current combat state"
  - "BattleManager provides lifecycle methods: start, get, update, end, has"
  - "Timeout detection marks battles but doesn't auto-cleanup (awaits player reconnect)"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 14 Plan 01: Battle State Foundation Summary

**Server-side battle state management with BattleManager class tracking active battles per player, 30-second timeout handling, and progressive turn protocol types**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T00:46:29Z
- **Completed:** 2026-01-21T00:49:53Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- BattleManager class with in-memory battle state storage keyed by player ID
- ActiveBattle interface captures all state for progressive turn revelation
- 30-second timeout tracking with automatic cleanup interval
- Extended shared types with BattleStatus, BattleTurnMessage, and CatchResultMessage
- BattleManager initialized in GameHub with proper cleanup on shutdown

## Task Commits

Each task was committed atomically:

1. **Task 1: Add battle status types to shared package** - `3ab24f9` (feat)
2. **Task 2: Create BattleManager class for active battle state** - `e99c2a4` (feat)
3. **Task 3: Add BattleManager to hub.ts (initialize only)** - `8239416` (feat)

## Files Created/Modified
- `packages/shared/src/types/battle.ts` - Added BattleStatus, BattleTurnMessage, RequestTurnPayload, CatchResultMessage types
- `apps/game-server/src/battle/battleManager.ts` - BattleManager class with active battle state management
- `apps/game-server/src/battle/index.ts` - Barrel export for battle module
- `apps/game-server/src/hub.ts` - Initialized BattleManager instance with cleanup on stop()

## Decisions Made

**1. 30-second timeout with 5-second cleanup interval**
- Balances responsiveness with server overhead
- Cleanup interval marks battles as 'timeout' status without immediate deletion
- Allows auto-resolution when player reconnects

**2. Speed comparison determines turn order**
- playerFirst flag set during startBattle based on lead Pokemon speed vs wild speed
- Follows Pokemon battle convention (faster Pokemon attacks first)
- Stored in ActiveBattle for consistent turn execution

**3. Separate current HP and max HP tracking**
- ActiveBattle stores playerHP, wildHP, playerMaxHP, wildMaxHP
- Enables HP percentage calculations for UI without recalculating
- Supports progressive turn revelation showing HP changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Shared package build required before game server compilation**
- After adding types to packages/shared/src/types/battle.ts, needed to run `npm run build` in shared package
- TypeScript in game-server couldn't import new types until shared package was compiled
- Standard monorepo workflow, resolved by building shared package first

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 14-02 (Turn-by-turn execution):**
- BattleManager provides state storage and lifecycle management
- ActiveBattle interface has all fields needed for turn calculation
- Timeout handling infrastructure in place
- GameHub has battleManager instance initialized

**No blockers identified.**

---
*Phase: 14-battle-system*
*Completed: 2026-01-21*
