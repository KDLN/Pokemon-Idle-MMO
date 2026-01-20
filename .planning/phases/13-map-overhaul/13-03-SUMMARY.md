---
phase: 13-map-overhaul
plan: 03
subsystem: ui-map
tags: [svg, zone-connections, direction-arrows, map-visualization]

dependency-graph:
  requires:
    - phase: 13-01
      provides: MapCanvas, mapTypes, InteractiveMap container
  provides:
    - ZoneConnection component for styled SVG path lines
    - ConnectionLayer for rendering all zone connections
    - Direction arrows indicating travel direction
    - Active path highlighting for current zone
  affects:
    - 13-04 through 13-08 (zone interactions, real data integration)

tech-stack:
  added: []
  patterns:
    - SVG filter for glow effect on active connections
    - Deduplication of bidirectional connections via Set
    - Position lookup Map for O(1) coordinate access

key-files:
  created:
    - apps/web/src/components/game/map/ZoneConnection.tsx
    - apps/web/src/components/game/map/ConnectionLayer.tsx
  modified:
    - apps/web/src/components/game/map/MapCanvas.tsx
    - apps/web/src/components/game/map/index.ts

key-decisions:
  - "Use SVG line + polygon for connection paths and arrows"
  - "Filter-based glow effect for active path highlighting"
  - "Dashed stroke for inactive connections, solid for active"
  - "pointer-events: none on SVG layer for click-through"

patterns-established:
  - "Connection deduplication: Create normalized key from min/max zone IDs"
  - "Direction arrow rotation: atan2(dy, dx) * 180/PI for correct angle"

duration: 3min
completed: 2026-01-20
---

# Phase 13 Plan 03: Zone Connection Lines Summary

**SVG connection paths with direction arrows linking zones, accent-colored highlighting for paths to current zone, and efficient bidirectional deduplication.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T19:10:38Z
- **Completed:** 2026-01-20T19:13:38Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- ZoneConnection component renders styled SVG line between any two zone positions
- Direction arrows at midpoint rotate to point in travel direction
- ConnectionLayer deduplicates bidirectional entries (A->B and B->A) to render each path once
- Active connections (to current zone) glow with accent color
- Mock Kanto map data visualizes 10 zones with proper connections

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ZoneConnection component** - `c10dc58` (feat)
2. **Task 2: Create ConnectionLayer component** - `b7e55fd` (feat)
3. **Task 3: Integrate ConnectionLayer into MapCanvas** - `afa5f4c` (feat)

## Files Created/Modified

- `apps/web/src/components/game/map/ZoneConnection.tsx` - SVG line with direction arrow between zones
- `apps/web/src/components/game/map/ConnectionLayer.tsx` - Container rendering all connections with deduplication
- `apps/web/src/components/game/map/MapCanvas.tsx` - Added mock positions/connections and ConnectionLayer
- `apps/web/src/components/game/map/index.ts` - Exports for new components and types

## Decisions Made

1. **SVG filter-based glow** - Used feGaussianBlur + feMerge for active path glow effect rather than CSS shadow (SVG filters work better for line elements)

2. **Dashed vs solid stroke** - Inactive connections use `stroke-dasharray: 6 4` for visual distinction, active paths are solid

3. **Mock data positioning** - Created Kanto-style vertical layout: Pallet Town at bottom, going north through Route 1, Viridian, Forest, to Pewter, then east to Mt. Moon

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 13-04:** Zone node rendering on top of connections
- ConnectionLayer provides visual paths between zones
- Mock positions available for zone node placement
- Z-index layering established (connections z-0, nodes z-10)

**Dependencies satisfied:**
- Lines connect all adjacent zones in mock data
- Arrows point in correct travel directions
- Active paths highlighted with glow
- Click-through works via pointer-events: none

---
*Phase: 13-map-overhaul*
*Completed: 2026-01-20*
