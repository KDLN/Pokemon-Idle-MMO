---
phase: 12-party-reordering
plan: 02
subsystem: ui
tags: [dnd-kit, drag-and-drop, react, party-management, touch-events]

# Dependency graph
requires:
  - phase: 12-01
    provides: WebSocket reorder_party handler, gameSocket.reorderParty() method, @dnd-kit packages
provides:
  - SortablePartyGrid component with drag-and-drop swap behavior
  - SortablePokemonCard draggable wrapper component
  - useDragSensors hook with mouse/touch/keyboard configuration
  - Optimistic UI updates with rollback on failure
affects: [12-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [DndContext/SortableContext wrapping pattern, local drag state instead of Zustand]

key-files:
  created:
    - apps/web/src/components/game/party/SortablePartyGrid.tsx
    - apps/web/src/components/game/party/SortablePokemonCard.tsx
    - apps/web/src/components/game/party/useDragSensors.ts
  modified:
    - apps/web/src/components/game/PartyPanel.tsx

key-decisions:
  - "Local state for activeId - avoids Zustand re-render cascade during drag"
  - "rectSwappingStrategy + arraySwap for swap behavior (not shift/move)"
  - "Optimistic update with rollback on WebSocket send failure"

patterns-established:
  - "DndContext wrapper: DndContext > SortableContext > sortable items"
  - "Local drag state: Keep drag-specific state in component, not global store"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 12 Plan 02: Drag-and-Drop Frontend Summary

**Drag-and-drop party reordering using @dnd-kit with swap behavior, 300ms touch delay, and optimistic updates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20
- **Completed:** 2026-01-20
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- useDragSensors hook with 300ms touch delay, 8px mouse threshold, and keyboard support
- SortablePokemonCard wrapper with proper touch-manipulation CSS and drag styling
- SortablePartyGrid with swap logic, optimistic updates, and battle mode disabling
- PartyPanel updated to use new sortable grid component

## Task Commits

Each task was committed atomically:

1. **Task 1: Create drag sensor configuration hook** - `f8fb226` (feat)
2. **Task 2: Create SortablePokemonCard wrapper** - `032605f` (feat)
3. **Task 3: Create SortablePartyGrid with reorder logic** - `9251489` (feat)
4. **Task 4: Update PartyPanel to use SortablePartyGrid** - `6d427bf` (feat)

## Files Created/Modified
- `apps/web/src/components/game/party/useDragSensors.ts` - Sensor configuration (mouse 8px, touch 300ms, keyboard)
- `apps/web/src/components/game/party/SortablePokemonCard.tsx` - Draggable Pokemon card wrapper with useSortable
- `apps/web/src/components/game/party/SortablePartyGrid.tsx` - DndContext wrapper with swap logic
- `apps/web/src/components/game/PartyPanel.tsx` - Updated to use SortablePartyGrid

## Decisions Made
- **Local drag state:** Keep `activeId` and `previousParty` in component state rather than Zustand to avoid re-render cascade during drag operations (per RESEARCH.md pitfall DD-1)
- **Swap strategy:** Use `rectSwappingStrategy` + `arraySwap` for true swap behavior when dragging Pokemon A to Pokemon B's slot
- **Optimistic updates:** Apply party reorder immediately in UI, rollback if WebSocket send fails

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing type errors in BankPokemonTab.tsx (GuildBankPokemon missing IV properties) - unrelated to this plan, did not block execution

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Drag-and-drop frontend complete and functional
- Plan 03 can add visual polish: drag feedback indicators, error toasts, accessibility improvements
- Database persistence works via reorder_party WebSocket message from Plan 01

---
*Phase: 12-party-reordering*
*Completed: 2026-01-20*
