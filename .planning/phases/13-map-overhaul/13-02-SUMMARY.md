---
phase: 13-map-overhaul
plan: 02
subsystem: ui-map
tags: [zone-nodes, tooltips, position-calculation, bfs-traversal]

dependency-graph:
  requires:
    - Phase 13-01 (InteractiveMap, MapCanvas, MapControls)
    - Phase 9 design tokens
  provides:
    - ZoneNode component for interactive zone buttons
    - ZoneTooltip component for hover information
    - mapUtils with BFS position calculation
    - Zone rendering in MapCanvas with mock data
  affects:
    - 13-03 through 13-08 (travel, fog of war, real data integration)

tech-stack:
  added: []
  patterns:
    - BFS traversal for position calculation from direction graph
    - Tooltip wrapper pattern for zone hover info
    - CSS transform for node centering (-translate-x/y-1/2)
    - Zone-type-based color coding (amber/green/stone)

key-files:
  created:
    - apps/web/src/components/game/map/mapUtils.ts
    - apps/web/src/components/game/map/ZoneNode.tsx
    - apps/web/src/components/game/map/ZoneTooltip.tsx
  modified:
    - apps/web/src/components/game/map/MapCanvas.tsx
    - apps/web/src/components/game/map/index.ts

decisions:
  - id: 13-02-01
    decision: Use CSS transform for node centering
    rationale: transform: translate(-50%, -50%) positions node center at (x,y) coordinates
  - id: 13-02-02
    decision: Town nodes larger than route nodes (48px vs 40px)
    rationale: Visual hierarchy - towns are more important navigation landmarks
  - id: 13-02-03
    decision: Zone type colors match context expectations
    rationale: Amber for towns (warm, settled), green for routes (natural), stone for caves

metrics:
  duration: 5 min
  completed: 2026-01-20
---

# Phase 13 Plan 02: Zone Nodes and Position Calculation Summary

**One-liner:** ZoneNode components with calculated positions from direction graph, rendering towns as amber nodes and routes as green nodes on the map canvas.

## What Was Built

### 1. mapUtils Position Calculation (Task 1)
- `calculateZonePositions()`: BFS traversal from start zone to calculate all zone positions
- `getCanvasBounds()`: Calculate bounding box for canvas sizing
- `ZONE_SPACING`: 100px between adjacent zones
- `DIRECTION_VECTORS`: N/S/E/W and diagonal direction-to-offset mapping
- Handles disconnected zones with fallback grid placement

### 2. ZoneTooltip Component (Task 2)
- Styled tooltip content matching ItemTooltipContent pattern
- Zone name in pixel font, uppercase
- Type badge with zone-type-based colors:
  - Town: amber
  - Route: green
  - Forest: emerald
  - Cave: stone
  - Gym: red
  - Special: purple
- Level range display for routes

### 3. ZoneNode Component (Task 2)
- Positioned button with absolute positioning at calculated (x, y)
- `transform: translate(-50%, -50%)` for center alignment
- Size: 48px for towns, 40px for routes
- Current zone indicator: yellow ring + player icon overlay
- Fog of war support: visited/adjacent/hidden visibility states
- Touch target expansion via ::before pseudo-element (44px minimum)
- Town names always visible as labels below nodes
- Wrapped in Tooltip for zone info on hover

### 4. MapCanvas Integration (Task 3)
- MOCK_ZONES array with 14 zones (Pallet Town through Route 25)
- MOCK_POSITIONS with pre-calculated coordinates for Kanto layout
- Zone nodes rendered at positions with ZoneNode component
- Canvas size increased to 900x650 to accommodate all zones
- Click handler logs zone clicks to console (wiring to travel later)
- Exports added to index.ts: ZoneNode, ZoneTooltip, mapUtils functions

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 7385236 | feat | Create mapUtils with BFS position calculation |
| 077bc2b | feat | Create ZoneNode and ZoneTooltip components |
| a118e2c | feat | Integrate zone nodes into MapCanvas |

## Technical Notes

### Position Calculation Algorithm
```
1. Place start zone at center (400, 300)
2. BFS queue initialized with start zone
3. For each zone in queue:
   - Get outgoing connections
   - Calculate position = current + (direction * ZONE_SPACING)
   - Mark as visited, add to queue
4. Also process incoming connections (reverse direction)
5. Fallback grid for disconnected zones
```

### Zone Node Rendering
- ZoneNode receives position, renders with absolute positioning
- CSS transform centers the node on the position
- Current zone has `ring-2 ring-yellow-400` and player icon
- Tooltip appears on hover with 150ms delay

### Visual Hierarchy
- Towns: Larger nodes (48px), amber color, labels always visible
- Routes: Smaller nodes (40px), green color, names in tooltip only
- Caves: Stone color (gray-brown)
- Forests: Emerald color

## Next Phase Readiness

**Ready for 13-03 and beyond:**
- Zone nodes render correctly at positions
- Click events fire (ready to wire to travel)
- Tooltip system working for zone info
- Position calculation utilities available for real data
- Fog of war visibility states defined and supported

**Integration points for future plans:**
- Replace MOCK_ZONES with gameStore.allZones (when available)
- Replace MOCK_CURRENT_ZONE_ID with gameStore.currentZone.id
- Wire onClick to travel action
- Implement fog of war based on visited zones
