---
phase: 11-ui-polish
plan: 04
subsystem: ui
tags: [guild-bank, sprites, sorting, relative-time]

# Dependency graph
requires:
  - phase: 09-design-system
    provides: formatRelativeTime utility in lib/ui
provides:
  - Guild Bank Pokemon display with sprites and 6 sorting options
  - Guild Bank transaction logs with relative timestamps and action icons
affects: [guild features, bank UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Relative timestamps with hover tooltips for absolute time
    - Color-coded action icons for transaction types

key-files:
  created: []
  modified:
    - apps/web/src/components/game/guild/BankPokemonTab.tsx
    - apps/web/src/components/game/guild/BankLogsTab.tsx

key-decisions:
  - "Use getPokemonSpriteUrl for consistent sprite display across bank views"
  - "Add IVs as sorting option for advanced users"

patterns-established:
  - "Relative timestamps (Xm ago, Xh ago, Xd ago) with hover for absolute datetime"
  - "Color-coded action indicators (green=deposit, orange=withdraw, blue=request)"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 11 Plan 04: Guild Bank UX Summary

**Pokemon sprites with sorting and relative timestamps in Guild Bank for better visual feedback and usability**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T13:19:41Z
- **Completed:** 2026-01-20T13:22:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Pokemon sprites now display in all three bank view modes (grid, list, card)
- Six sorting options (date, level, name, species, grade, IVs) with toggle direction
- Transaction logs show relative timestamps with hover for full date/time
- Action-specific colored icons for quick visual scanning of log types

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Pokemon sprites and sorting to BankPokemonTab** - `cee200f` (feat)
2. **Task 2: Add relative timestamps to BankLogsTab** - `53a17b4` (feat)

## Files Created/Modified
- `apps/web/src/components/game/guild/BankPokemonTab.tsx` - Added sprites, sorting state, sort controls, updated all view modes
- `apps/web/src/components/game/guild/BankLogsTab.tsx` - Added formatRelativeTime import, colored action icons, hover timestamps

## Decisions Made
- Use getPokemonSpriteUrl for sprite display (consistent with rest of app)
- Include IVs as sorting option for power users who care about IV totals
- Use Unicode symbols for action icons (down arrow deposit, up arrow withdraw)
- cursor-help class on timestamps to indicate hoverability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Guild Bank now visually matches rest of game with sprites
- Relative timestamps pattern can be applied to other timestamp displays
- No blockers

---
*Phase: 11-ui-polish*
*Completed: 2026-01-20*
