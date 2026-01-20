---
phase: 13-map-overhaul
plan: 01
subsystem: ui-map
tags: [react-zoom-pan-pinch, pan-zoom, interactive-map, gesture-handling]

dependency-graph:
  requires:
    - Phase 9 design tokens (color variables, poke-border class)
  provides:
    - InteractiveMap component with pan/zoom
    - MapCanvas content layer
    - MapControls zoom buttons
    - Map TypeScript interfaces
  affects:
    - 13-02 through 13-08 (zone rendering, connections, interactions)

tech-stack:
  added:
    - react-zoom-pan-pinch@3.7.0
  patterns:
    - TransformWrapper/TransformComponent for pan/zoom
    - useControls hook for zoom control access
    - will-change: transform for GPU acceleration

key-files:
  created:
    - apps/web/src/components/game/map/mapTypes.ts
    - apps/web/src/components/game/map/MapControls.tsx
    - apps/web/src/components/game/map/MapCanvas.tsx
    - apps/web/src/components/game/map/InteractiveMap.tsx
    - apps/web/src/components/game/map/index.ts
  modified:
    - apps/web/package.json (added react-zoom-pan-pinch)
    - apps/web/src/components/game/guild/BankPokemonTab.tsx (bug fix)

decisions:
  - id: 13-01-01
    decision: Use solid dark gradient background for map canvas
    rationale: Matches game theme, marked as Claude's discretion in CONTEXT.md
  - id: 13-01-02
    decision: Set zoom limits to 0.5x-2x
    rationale: 0.5x shows whole map, 2x provides detail without pixelation
  - id: 13-01-03
    decision: Disable double-click zoom
    rationale: Prevents accidental zoom when clicking zones

metrics:
  duration: 4 min
  completed: 2026-01-20
---

# Phase 13 Plan 01: Foundation Map Components Summary

**One-liner:** TransformWrapper-based interactive map container with pan/zoom gestures and zoom control buttons using react-zoom-pan-pinch.

## What Was Built

### 1. Package Installation
- Added `react-zoom-pan-pinch@3.7.0` for gesture handling
- ~3.7kb gzipped, zero runtime dependencies

### 2. TypeScript Types (mapTypes.ts)
- `ZoneVisibility`: 'visited' | 'adjacent' | 'hidden' for fog of war
- `ZonePosition`: { id, x, y } coordinates
- `ZoneNodeData`: Extended zone info for rendering
- `ConnectionData`: Zone connection with positions
- `MapProps`, `MapCanvasProps`, `MapControlsProps`: Component interfaces
- `DIRECTION_VECTORS`: N/S/E/W to dx/dy mapping for position calculation

### 3. MapControls Component
- Three buttons: zoom in (+), zoom out (-), reset
- Uses `useControls()` hook from react-zoom-pan-pinch
- WCAG compliant 44x44px touch targets
- Positioned absolute top-right with z-10
- Pixel font styling with hover/focus states

### 4. MapCanvas Component
- Fixed 800x600 base dimensions
- Dark gradient background (solid dark theme)
- `will-change: transform` for GPU acceleration
- Subtle grid pattern overlay for visual depth
- Placeholder "Map loading..." text

### 5. InteractiveMap Component
- Wraps MapCanvas in TransformWrapper + TransformComponent
- Configuration:
  - initialScale: 1 (100%)
  - minScale: 0.5 (50% zoom out)
  - maxScale: 2 (200% zoom in)
  - centerOnInit: true
  - limitToBounds: false (allows panning beyond canvas)
  - wheel.step: 0.1 (10% per scroll)
  - pinch.step: 5 (touch gesture sensitivity)
  - doubleClick.disabled: true
- 16:10 aspect ratio, max-height 400px
- Pokemon-style decorative border (poke-border class)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed BankPokemonTab type error**
- **Found during:** Task 3 build verification
- **Issue:** Pre-existing type error - `GuildBankPokemon` type doesn't have IV fields, but code tried to sort by IVs
- **Fix:** Removed 'ivs' from SortOption type and UI dropdown
- **Files modified:** apps/web/src/components/game/guild/BankPokemonTab.tsx
- **Commit:** e92b56e

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 3c1984a | feat | Install react-zoom-pan-pinch and create map types |
| 75ae69e | feat | Create MapControls component |
| e92b56e | fix | Remove IVs sort option from BankPokemonTab (blocking bug) |
| 51b4b14 | feat | Create MapCanvas and InteractiveMap components |

## Technical Notes

### Pan/Zoom Behavior
- Mouse drag: Pans the map
- Scroll wheel: Zooms in/out
- Pinch gesture: Zooms on touch devices
- +/- buttons: Manual zoom control
- Reset button: Returns to initial scale and position

### Performance Considerations
- `will-change: transform` promotes layer to GPU
- `transform: translateZ(0)` forces compositing
- Only transform and opacity animated (no layout thrashing)
- Smooth 60fps pan/zoom expected

### Integration Points
- MapControls must be inside TransformWrapper (uses context)
- MapCanvas receives children for zone nodes (future plans)
- Types exported from index.ts for external use

## Next Phase Readiness

**Ready for 13-02:** Zone node rendering
- InteractiveMap provides container
- MapCanvas provides content layer
- ZoneNodeData type defines zone props
- DIRECTION_VECTORS ready for position calculation

**Dependencies satisfied:**
- Pan/zoom works
- Controls work
- Types defined
- Build passes
