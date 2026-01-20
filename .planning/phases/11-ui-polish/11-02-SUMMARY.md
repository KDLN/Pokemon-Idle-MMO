---
phase: 11-ui-polish
plan: 02
subsystem: ui
tags: [react, navigation, ux, sorting, compass]

# Dependency graph
requires:
  - phase: 11-01
    provides: "Zone direction data (N/S/E/W) in database and types"
provides:
  - "Direction-sorted navigation buttons (N, E, S, W, then diagonals)"
  - "Direction arrows displayed before zone names"
  - "Renamed Power-Ups to Boosts throughout UI"
affects: [11-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useMemo for sorted zone lists with DIRECTION_ORDER constant"
    - "Unicode arrow symbols for compass directions"

key-files:
  created: []
  modified:
    - "apps/web/src/components/game/GameShell.tsx"
    - "apps/web/src/components/game/ZoneDisplay.tsx"

key-decisions:
  - "Use stable sort by id as secondary sort key when directions match"
  - "Display arrows before zone icon for visual hierarchy"

patterns-established:
  - "DIRECTION_ORDER record for compass sorting priority"
  - "DIRECTION_ARROWS record for Unicode arrow symbols"

# Metrics
duration: 2min
completed: 2026-01-20
---

# Phase 11 Plan 02: Navigation Directions Summary

**Navigation buttons sorted by compass direction (N/E/S/W) with arrow indicators, Power-Ups renamed to Boosts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-20
- **Completed:** 2026-01-20
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Navigation buttons in MapSidebar sorted by compass direction with arrows
- Navigation buttons in ZoneDisplay sorted by compass direction with arrows
- Renamed "Power-Ups" section to "Boosts" throughout UI
- Renamed PowerUp interface to Boost, AVAILABLE_BUFFS to AVAILABLE_BOOSTS

## Task Commits

Each task was committed atomically:

1. **Task 1: Add direction sorting and arrows to MapSidebar** - `b52925f` (feat)
2. **Task 2: Add direction sorting and arrows to ZoneDisplay** - `a999b77` (feat)

## Files Created/Modified
- `apps/web/src/components/game/GameShell.tsx` - Direction constants, sorted travel list, arrows, Boosts rename
- `apps/web/src/components/game/ZoneDisplay.tsx` - Direction constants, sorted travel list, arrows

## Decisions Made
- Use stable sort by id as secondary key when directions match (ensures consistent ordering)
- Display direction arrows before zone icon (arrow -> icon -> name) for clear visual hierarchy
- Arrows displayed in muted color (#a0a0c0) to not overpower zone name

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Direction ordering and arrows working in both MapSidebar and ZoneDisplay
- Ready for additional UI polish work
- Requires 11-01 migration (032_zone_directions.sql) applied to production for directions to display

---
*Phase: 11-ui-polish*
*Completed: 2026-01-20*
