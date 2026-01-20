---
phase: 13-map-overhaul
plan: 05
subsystem: ui-map
tags: [centering, viewport, pan-zoom, user-location, react-zoom-pan-pinch]

dependency-graph:
  requires:
    - 13-01 (InteractiveMap foundation, MapControls)
    - 13-02 (Zone positions, ZoneNode rendering)
    - 13-03 (Connection layer)
  provides:
    - Initial centering on current zone
    - "Center on me" button with visibility detection
    - Automatic re-centering on zone change
  affects:
    - 13-06 through 13-08 (travel, navigation interactions)

tech-stack:
  added: []
  patterns:
    - isZoneInViewport utility for visibility calculation
    - useTransformEffect for transform state tracking
    - ResizeObserver for viewport size monitoring
    - initialPositionX/Y for initial centering
    - setTransform for animated re-centering

key-files:
  created: []
  modified:
    - apps/web/src/components/game/map/mapUtils.ts (isZoneInViewport function)
    - apps/web/src/components/game/map/MapControls.tsx (Center on me button)
    - apps/web/src/components/game/map/mapTypes.ts (extended MapControlsProps)
    - apps/web/src/components/game/map/InteractiveMap.tsx (centering logic)
    - apps/web/src/components/game/map/MapCanvas.tsx (export mock data)

decisions:
  - id: 13-05-01
    decision: Use 50px margin buffer for viewport visibility
    rationale: Zone is considered "in view" with buffer to prevent button flickering at edges
  - id: 13-05-02
    decision: Use setTransform with 300ms easeOut animation
    rationale: Smooth, comfortable animation speed for centering
  - id: 13-05-03
    decision: Calculate initial position based on estimated viewport (640x400)
    rationale: Container ref may not be available during initial render, use reasonable defaults
  - id: 13-05-04
    decision: Use previousZoneIdRef to detect zone changes
    rationale: Avoid re-centering on every render, only when zone actually changes

metrics:
  duration: 4 min
  completed: 2026-01-20
---

# Phase 13 Plan 05: Map Centering and Location Summary

**One-liner:** Viewport visibility detection with "Center on me" button and automatic initial/travel centering on current zone.

## What Was Built

### 1. Viewport Visibility Detection (mapUtils.ts)
- `isZoneInViewport()` function to check if zone is visible
- Calculates transformed position from zone coords + scale/position
- Includes 50px margin buffer to prevent button flickering
- `TransformState` and `ViewportSize` TypeScript interfaces

### 2. "Center on me" Button (MapControls.tsx)
- Conditionally visible button that shows when current zone is off-screen
- Uses `useTransformEffect` to track transform state changes
- Uses `ResizeObserver` to monitor viewport size
- Accent color styling (blue) to stand out from zoom controls
- Crosshairs/target icon for quick recognition
- Smooth 300ms easeOut animation to center on zone

### 3. Initial Centering (InteractiveMap.tsx)
- Calculates initial position to center on current zone
- Uses `initialPositionX` and `initialPositionY` props instead of `centerOnInit`
- Handles both container-ref and estimated viewport sizes

### 4. Zone Change Re-centering
- `useEffect` with `previousZoneIdRef` to detect zone changes
- Automatically re-centers map with animation when player travels
- Maintains current zoom level during re-centering

### 5. Props Updates (mapTypes.ts)
- Extended `MapControlsProps` with:
  - `currentZonePosition?: { x: number; y: number } | null`
  - `containerRef?: React.RefObject<HTMLDivElement | null>`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 4b4a10c | feat | Add viewport visibility detection utility |
| 90987fb | feat | Add Center on me button to MapControls |
| c555c12 | feat | Implement initial centering and zone change re-centering |

## Technical Notes

### Visibility Calculation
The transform applies as: `screenPos = zonePos * scale + position`
- `transformedX = zonePosition.x * scale + positionX`
- `transformedY = zonePosition.y * scale + positionY`
- Zone is visible if transformed coords are within viewport + margin

### Centering Formula
To center a zone in the viewport:
- `targetX = viewportWidth / 2 - zonePosition.x * scale`
- `targetY = viewportHeight / 2 - zonePosition.y * scale`

### Component Wiring
```
InteractiveMap
  ├── containerRef → MapControls (viewport size)
  ├── currentZonePosition → MapControls (visibility check)
  └── TransformWrapper
      ├── ref → transformRef (for setTransform on zone change)
      └── MapControls
          └── useTransformEffect (transform state tracking)
```

## Next Phase Readiness

**Ready for 13-06:** Zone click interaction
- Centering infrastructure in place
- Transform state accessible
- setTransform method available for smooth navigation

**Dependencies satisfied:**
- Map centers on current zone on load
- Button appears when zone scrolls off-screen
- Click centers map smoothly
- Zone change triggers re-centering
- Build passes
