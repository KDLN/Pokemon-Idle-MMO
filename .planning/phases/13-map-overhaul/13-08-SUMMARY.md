---
phase: 13-map-overhaul
plan: 08
title: Layout Integration
subsystem: frontend-ui
tags: [map, layout, integration, gameShell]
started: 2026-01-20
completed: 2026-01-20
duration: 4min

dependency-graph:
  requires: [13-07]
  provides:
    - InteractiveMap in game layout
    - Shared state between map and ZoneDisplay
  affects: [UAT]

tech-stack:
  patterns:
    - Zustand state sharing
    - Component composition

key-files:
  modified:
    - apps/web/src/components/game/map/index.ts
    - apps/web/src/components/game/GameShell.tsx
    - apps/web/src/components/game/map/InteractiveMap.tsx

decisions:
  - id: 13-08-01
    choice: "Use gameStore directly in InteractiveMap instead of props"
    reason: "Matches existing pattern, enables automatic sync"
  - id: 13-08-02
    choice: "Keep travel buttons section below map"
    reason: "Alternative UI for quick travel, accessibility"

metrics:
  tasks: 3
  commits: 2
---

# Phase 13 Plan 08: Layout Integration Summary

**One-liner:** InteractiveMap integrated into GameShell, replaces static map, auto-syncs with ZoneDisplay via gameStore

## What Was Done

### Task 1: Barrel Export (316b475)
- Added MapFrame to `apps/web/src/components/game/map/index.ts`
- Completes the barrel export for all map components

### Task 2: GameShell Integration (3d3e807)
- Replaced static `map-canvas` with `<InteractiveMap />` in MapSidebar component
- Updated InteractiveMap to use `useGameStore` for currentZone instead of props
- Removed unused Zone interface and KANTO_ZONES array (76 lines removed)
- Kept travel buttons and nearby players sections below the map
- Mobile layout inherits changes automatically via MapSidebar

### Task 3: State Synchronization (Verified)
- Both ZoneDisplay and InteractiveMap/MapCanvas use same gameStore state:
  - `currentZone` - current player location
  - `connectedZones` - reachable destinations
  - `visitedZones` - fog of war tracking
- Both use `gameSocket.moveToZone(zoneId)` for travel
- Server responds with `zone_update` that updates shared store
- All components automatically re-render on state change

## Key Technical Details

### State Architecture
```
gameSocket.moveToZone(zoneId)
    |
    v
Server: zone_update message
    |
    v
gameSocket.setZone(zone, connectedZones) in gameStore
    |
    v
All subscribers re-render:
  - MapSidebar (travel buttons)
  - ZoneDisplay (zone info + buttons)
  - InteractiveMap (centering)
  - MapCanvas (zone nodes + fog of war)
```

### Component Tree After Integration
```
GameShell
  |
  +-- MapSidebar
  |     |
  |     +-- InteractiveMap (pan/zoom wrapper)
  |     |     |
  |     |     +-- MapCanvas (zones + connections)
  |     |
  |     +-- current-location section
  |     +-- travel-section (direction-sorted buttons)
  |     +-- NearbyPlayersSection
  |     +-- news-section
  |
  +-- center-column
  |     +-- WorldView / EncounterDisplay
  |     +-- ZoneDisplay (secondary travel UI)
```

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

- Build: PASS (compiled successfully)
- TypeScript: PASS (no errors)
- Integration verified:
  - Map reads from gameStore
  - Travel buttons read from gameStore
  - Both use gameSocket for travel actions
  - State sync is automatic

## Next Phase Readiness

Phase 13 (Map Overhaul) is now complete. All 8 plans have been executed:
1. Pan/Zoom Canvas
2. Zone Node Component
3. Connection Lines
4. Fog of War
5. Current Zone Centering
6. Zone Click Travel
7. Visual Styling
8. Layout Integration (this plan)

Ready for User Acceptance Testing (UAT) to verify all map features work correctly in production.
