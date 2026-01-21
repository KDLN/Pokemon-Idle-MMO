---
phase: 14-battle-system
plan: 02
subsystem: battle
tags: [websocket, battle-system, turn-based, server-authoritative]

# Dependency graph
requires:
  - phase: 14-01
    provides: BattleManager with active battle state tracking
provides:
  - Progressive turn calculation with calculateSingleTurn function
  - request_turn and attempt_catch message handlers
  - encounter_start message on wild Pokemon encounter
  - Catch-at-throw calculation for genuine uncertainty
affects: [14-03, 14-04, 14-05, future-client-battle-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Progressive turn revelation: client requests each turn individually"
    - "Catch calculation at throw moment (not pre-computed)"
    - "Battle timeout auto-resolution based on HP advantage"

key-files:
  created:
    - apps/game-server/src/battle/turnCalculator.ts
  modified:
    - apps/game-server/src/battle/index.ts
    - apps/game-server/src/hub.ts
    - apps/game-server/src/types.ts

key-decisions:
  - "Always show 3 shakes for suspense (per CONTEXT.md design)"
  - "Battle starts on encounter via battleManager.startBattle"
  - "Catch success calculated NOW at throw moment (not pre-decided)"
  - "Battle timeout auto-resolves based on HP percentage advantage"
  - "Coexist with legacy battle flow during transition period"

patterns-established:
  - "calculateSingleTurn: Pure function takes ActiveBattle, returns TurnResult"
  - "handleRequestTurn: Calculate turn on demand, update battle state, send battle_turn"
  - "handleAttemptCatch: Calculate catch NOW, update inventory, award XP"
  - "encounter_start: Sent alongside legacy tick for progressive protocol adoption"

# Metrics
duration: 7min
completed: 2026-01-21
---

# Phase 14 Plan 02: Progressive Turn Protocol Summary

**Server-side progressive turn calculation with request/response protocol, catch-at-throw mechanics, and encounter_start message integration**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-21T00:54:02Z
- **Completed:** 2026-01-21T01:01:23Z
- **Tasks:** 5
- **Files modified:** 4

## Accomplishments
- Progressive turn calculation extracted into calculateSingleTurn function
- request_turn and attempt_catch message handlers integrated into GameHub
- encounter_start message sent when wild Pokemon encountered
- Catch success calculated at throw moment for genuine uncertainty
- Battle timeout auto-resolution based on HP advantage
- Always shows 3 shakes for suspense per CONTEXT.md design decision

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract single-turn calculation from game.ts** - `4412c7f` (feat)
2. **Task 2: Add battle message types to types.ts** - `3a032d2` (feat)
3. **Task 3: Add request_turn handler with handleRequestTurn method** - `1c40e68` (feat)
4. **Task 4: Modify encounter flow in processTicks to start progressive battles** - `5f74170` (feat)
5. **Task 5: Implement catch-at-throw calculation** - `d003d4d` (feat)

## Files Created/Modified
- `apps/game-server/src/battle/turnCalculator.ts` - Single-turn calculation logic extracted from game.ts
- `apps/game-server/src/battle/index.ts` - Added calculateSingleTurn and TurnResult exports
- `apps/game-server/src/hub.ts` - Added request_turn and attempt_catch handlers, encounter_start integration
- `apps/game-server/src/types.ts` - Added StartBattlePayload, RequestTurnPayload, AttemptCatchPayload types

## Decisions Made
- **Always 3 shakes:** Per CONTEXT.md design, always show 3 shakes for maximum suspense before revealing catch result
- **Coexist with legacy:** Progressive battle messages sent alongside legacy tick messages during transition period
- **Catch at throw:** Catch success calculated when client sends attempt_catch (not pre-computed during battle)
- **Timeout resolution:** Battle timeouts auto-resolve based on HP percentage advantage (higher HP % wins)
- **Dynamic import:** Used dynamic import for attemptCatch to avoid circular dependencies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Minor TypeScript signature issues (auto-fixed):**
- getCaughtSpeciesForPlayer requires speciesIds array parameter - added `[battle.wildPokemon.species_id]`
- updatePokedex requires caught boolean parameter - added `true` for successful catches
- send method takes Client not WebSocket - corrected all send calls

All fixed during development, no plan changes needed.

## Next Phase Readiness
- Progressive turn protocol complete on server side
- Client can now request turns individually via request_turn message
- Client can attempt catches via attempt_catch message
- encounter_start message provides battle initialization data
- Ready for client-side battle UI implementation (14-03)

---
*Phase: 14-battle-system*
*Completed: 2026-01-21*
