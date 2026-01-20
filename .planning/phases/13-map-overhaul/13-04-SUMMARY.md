---
phase: 13-map-overhaul
plan: 04
subsystem: ui-map
tags: [fog-of-war, visited-zones, zone-visibility, persistence]

dependency-graph:
  requires:
    - Phase 13-02 (ZoneNode, MapCanvas)
    - Phase 13-03 (ConnectionLayer)
  provides:
    - visitedZones state with localStorage persistence
    - Zone visibility calculation (visited/adjacent/hidden)
    - Fog of war rendering in map
  affects:
    - 13-05 through 13-08 (travel will mark zones visited)
    - All future map features (visibility determines rendering)

tech-stack:
  added: []
  patterns:
    - Zustand persist middleware for visited zones
    - Set-based visibility calculation with O(1) lookup
    - Batch visibility calculation for all zones
    - CSS animate-pulse for mystery zone attention

key-files:
  created: []
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/components/game/map/mapUtils.ts
    - apps/web/src/components/game/map/MapCanvas.tsx
    - apps/web/src/components/game/map/ConnectionLayer.tsx
    - apps/web/src/components/game/map/ZoneNode.tsx

decisions:
  - id: 13-04-01
    decision: Start with zone 1 (Pallet Town) visited by default
    rationale: Player starts in Pallet Town, should see starting area immediately
  - id: 13-04-02
    decision: Auto-mark zones visited in setZone action
    rationale: Visiting a zone should automatically reveal it without manual calls
  - id: 13-04-03
    decision: 3-second pulse animation for mystery zones
    rationale: Subtle attention draw without being distracting
  - id: 13-04-04
    decision: Hide connections where either zone is hidden
    rationale: Only show paths between zones player can see

metrics:
  duration: 4 min
  completed: 2026-01-20
---

# Phase 13 Plan 04: Fog of War System Summary

**One-liner:** Fog of war using visitedZones in gameStore with persistence, hiding unexplored zones and showing adjacent zones as pulsing mystery markers.

## What Was Built

### 1. visitedZones State in gameStore (Task 1)
- Added `visitedZones: number[]` to store interface
- Added `markZoneVisited(zoneId)` action using Set for deduplication
- Modified `setZone` to auto-mark zone as visited when player travels
- Initial state includes zone 1 (Pallet Town) as visited
- Added to persist partialize for localStorage persistence

### 2. Visibility Calculation in mapUtils (Task 2)
- `getAdjacentZones(zoneId, connections)`: Find all neighboring zone IDs
- `getZoneVisibility(zoneId, visitedZones, connections)`: Single zone visibility
  - Returns 'visited' if zoneId in visitedZones
  - Returns 'adjacent' if connected to any visited zone
  - Returns 'hidden' otherwise
- `getAllZoneVisibilities(zoneIds, visitedZones, connections)`: Batch calculation
  - Pre-computes adjacentToVisited set for efficiency
  - Returns Map<number, ZoneVisibility>
- Uses Set for O(1) lookup of visited zones

### 3. MapCanvas Fog of War Integration (Task 3)
- Imports visitedZones from gameStore via selector
- Calculates zoneVisibilities using getAllZoneVisibilities
- Passes visibility to each ZoneNode
- Passes zoneVisibilities to ConnectionLayer

### 4. ConnectionLayer Visibility Filtering (Task 3)
- Added zoneVisibilities prop to interface
- Hides connections where either zone is hidden
- Marks connections to adjacent zones as isReachable=false (dashed style)
- Visible connections only between visited and/or adjacent zones

### 5. ZoneNode Mystery Zone Styling (Task 3)
- Hidden zones: return null (not rendered)
- Adjacent zones:
  - Gray background with subtle border
  - Question mark icon centered
  - 3-second pulse animation for attention
  - cursor-not-allowed (cannot click)
  - "Unknown area" tooltip on hover
- Visited zones: full rendering with all features

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 4bfebf8 | feat | Add visitedZones state to gameStore with persistence |
| 3f28746 | feat | Add zone visibility calculation functions |
| 6ba19c5 | feat | Implement fog of war in map components |

## Technical Notes

### Visibility Algorithm
```
For each zone:
1. Check if zone ID in visitedZones Set -> 'visited'
2. Check if any connection links zone to a visited zone -> 'adjacent'
3. Otherwise -> 'hidden'

Batch optimization:
1. Create visitedSet from visitedZones array
2. Pre-compute adjacentToVisited set by scanning all connections
3. For each zone: visited > adjacent > hidden
```

### Persistence Strategy
- visitedZones stored in 'pokemon-idle-ui-prefs' localStorage key
- Persisted alongside guildBankViewMode in partialize
- Survives page refresh, browser close
- Auto-updated when player travels to new zone

### Visual Design
- Mystery zones use subtle gray color (bg-gray-700/60)
- Border adds definition: border-gray-500/30
- 3-second animation cycle (slower than default pulse)
- Question mark centered with flexbox
- "Unknown area" tooltip has 300ms delay (longer than normal)

## Next Phase Readiness

**Ready for 13-05 and beyond:**
- Fog of war renders correctly on map
- Visited zones fully visible and interactive
- Adjacent zones show as discoverable mysteries
- Hidden zones completely invisible
- State persists across sessions

**Integration points for future plans:**
- Travel to zone will auto-mark as visited (already implemented in setZone)
- Real zone data will replace mock data (visibility system is data-agnostic)
- Can add "reveal all" debug feature by setting all zones as visited
