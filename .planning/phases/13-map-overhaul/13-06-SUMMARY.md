---
phase: 13-map-overhaul
plan: 06
subsystem: ui-map
tags: [travel, navigation, click-interaction, websocket, gameSocket]

dependency-graph:
  requires:
    - 13-04 (fog of war, visitedZones state)
    - 13-05 (centering, transform infrastructure)
  provides:
    - Zone click travel interaction
    - Path click travel interaction
    - Real-time zone navigation via WebSocket
  affects:
    - 13-07 through 13-08 (zone info display, data migration)

tech-stack:
  added: []
  patterns:
    - onTravel callback prop for zone travel
    - connectedZoneIds Set for O(1) lookup
    - useCallback for stable travel handler
    - Invisible SVG line for larger click targets

key-files:
  created: []
  modified:
    - apps/web/src/components/game/map/ZoneNode.tsx (travel handler, isConnected prop)
    - apps/web/src/components/game/map/MapCanvas.tsx (travel wiring, gameSocket integration)
    - apps/web/src/components/game/map/ZoneConnection.tsx (click handler, targetZoneId)
    - apps/web/src/components/game/map/ConnectionLayer.tsx (onPathClick prop, target calculation)

decisions:
  - id: 13-06-01
    decision: Validate travel against connectedZoneIds Set
    rationale: Server validates too, but client-side validation prevents unnecessary requests
  - id: 13-06-02
    decision: Use invisible 20px stroke-width line for path click targets
    rationale: Actual path line is 3px, hard to click; wider invisible target improves UX
  - id: 13-06-03
    decision: Calculate targetZoneId as "zone that's NOT current"
    rationale: Connection has two endpoints; clicking travels to the OTHER one
  - id: 13-06-04
    decision: Keep pointer-events none on inactive paths
    rationale: Only active (connected to current zone) paths should be clickable

metrics:
  duration: 5 min
  completed: 2026-01-20
---

# Phase 13 Plan 06: Zone Click Interaction Summary

**One-liner:** Click-to-travel on zones and paths via gameSocket.moveToZone with validation against connected zones.

## What Was Built

### 1. ZoneNode Travel Handler (ZoneNode.tsx)
- Added `onTravel` callback prop for travel requests
- Added `isConnected` prop to track if zone is adjacent to current
- `canTravel` computed: visited AND not current AND connected
- Click handler calls onTravel only for valid travel targets
- Connected zones: cursor-pointer, hover:scale-110, active:scale-95
- Non-connected visited zones: opacity-60, cursor-default
- Accessibility: aria-label "Travel to {name}" for connected zones

### 2. MapCanvas Travel Wiring (MapCanvas.tsx)
- Import `gameSocket` from '@/lib/ws/gameSocket'
- Get `currentZone` and `connectedZones` from gameStore
- `connectedZoneIds` Set for O(1) lookup
- `handleZoneTravel` callback validates and calls gameSocket.moveToZone
- Pass `isConnected` and `onTravel` props to ZoneNode
- Pass `onPathClick` to ConnectionLayer
- Use real currentZoneId when available, fallback to mock

### 3. Path Click Travel (ZoneConnection.tsx)
- Added `targetZoneId` and `onClick` props
- `isClickable` computed: isActive AND hasTarget AND hasHandler
- Invisible 20px-wide line for easier clicking
- Cursor-pointer on clickable paths
- Keyboard support (Enter/Space) for accessibility
- Inner line and arrow have pointer-events: none

### 4. ConnectionLayer Integration (ConnectionLayer.tsx)
- Added `onPathClick` prop callback
- Calculate target zone (the one that's NOT current):
  - If from === current, target = to
  - If to === current, target = from
- Only set targetZoneId for active, reachable paths
- Enable pointer-events on SVG when handler provided

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 6612510 | feat | Add travel handler to ZoneNode |
| d521d61 | feat | Wire travel to gameSocket in MapCanvas |
| d056219 | feat | Add path clicking for travel |

## Technical Notes

### Travel Flow
```
User clicks zone/path
  -> ZoneNode.handleClick() or ZoneConnection.handleClick()
  -> MapCanvas.handleZoneTravel(zoneId)
  -> Validates: connectedZoneIds.has(zoneId)
  -> gameSocket.moveToZone(zoneId)
  -> Server processes move_zone message
  -> Server sends zone_update message
  -> gameStore.setZone(zone, connectedZones)
  -> Map re-renders with new current zone
  -> InteractiveMap centers on new zone (from 13-05)
  -> Fog of war updates (from 13-04)
```

### Click Target Hierarchy
1. ZoneNode buttons have higher z-index (z-10) than paths (z-0)
2. Zone clicks take priority over path clicks
3. Inactive paths have pointer-events: none
4. Invisible 20px line makes paths easier to click

### State Integration
- `currentZone` from gameStore provides real current zone ID
- `connectedZones` from gameStore lists valid travel destinations
- Falls back to MOCK_CURRENT_ZONE_ID when not connected to server
- setZone action auto-marks zones as visited

## Next Phase Readiness

**Ready for 13-07:** Zone info display
- Travel wiring complete
- Click interactions working
- Map updates on zone change

**Dependencies satisfied:**
- Clicking connected zone triggers travel
- Clicking connected path triggers travel
- Non-connected zones/paths are not interactive
- Travel uses existing gameSocket.moveToZone
- Map state updates after travel
- Build passes
