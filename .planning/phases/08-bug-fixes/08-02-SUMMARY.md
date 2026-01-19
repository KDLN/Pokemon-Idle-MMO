---
phase: 08-bug-fixes
plan: 02
subsystem: ui
tags: [zustand, react, state-management, persistence, localStorage]

# Dependency graph
requires:
  - phase: v1.0 (guild milestone)
    provides: Guild Bank Pokemon tab with view toggle UI
provides:
  - Persisted guild bank view mode preference via Zustand store
  - View toggle that maintains state across navigation and refresh
affects: [guild-bank]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-persist-for-ui-preferences]

key-files:
  created: []
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/components/game/guild/BankPokemonTab.tsx

key-decisions:
  - "Use existing Zustand persist middleware for view mode storage (no new infrastructure)"
  - "Use 'as const' type assertion instead of local type to avoid duplication"

patterns-established:
  - "UI preferences: Add to gameStore with persist middleware for automatic localStorage sync"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 08 Plan 02: Fix Guild Bank View Toggle Summary

**Guild bank Pokemon view toggle now persists via Zustand store, maintaining user preference across navigation and browser refresh**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T22:22:40Z
- **Completed:** 2026-01-19T22:25:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `guildBankViewMode` state to Zustand store with persistence
- Migrated BankPokemonTab from local useState to global store
- View preference (grid/list/card) now persists across sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add guildBankViewMode to Zustand store with persistence** - `41e1b63` (feat)
2. **Task 2: Update BankPokemonTab to use Zustand store for viewMode** - `d405460` (fix)

## Files Created/Modified
- `apps/web/src/stores/gameStore.ts` - Added GuildBankViewMode type, state, and setter
- `apps/web/src/components/game/guild/BankPokemonTab.tsx` - Replaced local useState with Zustand store hooks

## Decisions Made
- Used existing Zustand persist middleware rather than manual localStorage - already configured and working in the store
- Used `as const` type assertion for the view mode array to avoid importing/exporting the type

## Deviations from Plan
- Orchestrator correction: persist middleware was imported but not applied. Added `persist()` wrapper with `partialize` to persist only `guildBankViewMode` field (commit `24907ef`).

## Issues Encountered
- Initial implementation only added state to store but didn't wrap with persist middleware, causing view preference to not survive browser refresh.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guild bank view toggle fix complete
- Ready for next bug fix plan in phase 08

---
*Phase: 08-bug-fixes*
*Completed: 2026-01-19*
