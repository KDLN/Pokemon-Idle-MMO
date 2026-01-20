---
phase: 11-ui-polish
plan: 01
subsystem: database
tags: [zone-connections, navigation, directions, supabase]

# Dependency graph
requires:
  - phase: 02-zones
    provides: zone_connections table structure
provides:
  - Direction data for zone connections
  - Zone interface with direction field
  - getConnectedZones returns direction with zones
affects: [11-02 (travel button ordering), frontend navigation UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Merge related data from junction tables into entity objects

key-files:
  created:
    - supabase/migrations/032_zone_directions.sql
  modified:
    - packages/shared/src/types/core.ts
    - apps/game-server/src/db.ts

key-decisions:
  - "Direction represents travel direction to reach destination zone"
  - "Use N/S/E/W single-letter codes for compact storage"

patterns-established:
  - "Junction table data (zone_connections) merged into entity objects when returning"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 11 Plan 01: Zone Directions Summary

**Direction column and backfill for zone_connections enabling navigation button ordering by compass direction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T12:00:00Z
- **Completed:** 2026-01-20T12:03:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added direction column to zone_connections table
- Backfilled all existing Kanto zone connections with N/S/E/W directions
- Updated Zone interface with optional direction field
- Modified getConnectedZones to return direction with zone data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration for direction column** - `be6b214` (feat)
2. **Task 2: Update Zone interface and database query** - `1d30372` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `supabase/migrations/032_zone_directions.sql` - Migration adding direction column and backfilling Kanto zones
- `packages/shared/src/types/core.ts` - Zone interface with direction field
- `apps/game-server/src/db.ts` - getConnectedZones now returns direction

## Decisions Made
- Direction is from the perspective of from_zone_id (direction you travel to reach to_zone)
- Using single-letter codes (N, S, E, W) for compact storage and easy frontend parsing
- Direction is optional (undefined) for zones added without direction data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**Manual database migration required.** Apply migration to production:
- Run `supabase/migrations/032_zone_directions.sql` in Supabase Dashboard SQL Editor
- Verify with: `SELECT * FROM zone_connections WHERE direction IS NULL;` (should return no rows for existing zones)

## Next Phase Readiness
- Direction data ready for frontend to sort travel buttons
- Plan 11-02 can implement travel button ordering with directional arrows
- No blockers

---
*Phase: 11-ui-polish*
*Completed: 2026-01-20*
