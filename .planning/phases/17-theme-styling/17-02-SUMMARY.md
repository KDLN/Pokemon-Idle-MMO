---
phase: 17-theme-styling
plan: 02
subsystem: ui
tags: [css, texture, particles, gradients, visual-polish, tailwind]

# Dependency graph
requires:
  - phase: 17-01
    provides: Noise texture utility class and infrastructure
provides:
  - Pokemon cards with type-colored backgrounds and noise texture
  - Panels and cards with tactile noise texture treatment
  - Sidebar vertical gradients for visual depth
  - Ambient particles in zone view for atmosphere
affects: [future-theme-plans, visual-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Type-colored overlays on Pokemon sprites (20% opacity)"
    - "Ambient particle system for route/forest zones"
    - "Vertical gradient pattern for sidebar backgrounds"

key-files:
  created: []
  modified:
    - apps/web/src/components/game/PokemonCard.tsx
    - apps/web/src/components/game/PartyPanel.tsx
    - apps/web/src/components/game/BoostCard.tsx
    - apps/web/src/components/game/world/WorldView.tsx
    - apps/web/src/app/globals.css

key-decisions:
  - "Applied texture-noise to both compact and full Pokemon card variants"
  - "Type-colored background overlay uses 20% opacity for subtle effect"
  - "Sidebar gradients use CSS variables (--color-surface-elevated to --color-surface-base)"
  - "Ambient particles only visible on route/forest zones, not towns"
  - "Particles use green/yellow/emerald/lime color mix for natural atmosphere"

patterns-established:
  - "texture-noise class requires parent with position: relative (already present on cards)"
  - "Type color overlays layered with glow effects for depth"
  - "Particles positioned to avoid interfering with trainer/pokemon sprites"

# Metrics
duration: 2min
completed: 2026-01-21
---

# Phase 17 Plan 02: Visual Texture and Atmosphere Summary

**Pokemon cards, panels, and zone view enhanced with noise texture, type-colored backgrounds, sidebar gradients, and ambient particles for retro-physical feel**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-21T17:38:03Z
- **Completed:** 2026-01-21T17:40:46Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Pokemon cards display type-colored background overlays (20% opacity) on sprite area
- All cards and panels enhanced with subtle noise texture via texture-noise class
- Sidebars show vertical gradient (darker at bottom) for visual depth
- Zone view displays 5 ambient floating particles on route/forest zones

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply Type-Colored Backgrounds and Texture to Pokemon Cards** - `2c3e1a1` (feat)
2. **Task 2: Add Texture to Panels and Sidebar Gradients** - `7f9fb0c` (feat)
3. **Task 3: Add Ambient Particles to Zone View** - `d5d5808` (feat)

## Files Created/Modified
- `apps/web/src/components/game/PokemonCard.tsx` - Added texture-noise class to compact and full card variants, type-colored background overlay to sprite area
- `apps/web/src/components/game/PartyPanel.tsx` - Added texture-noise to Card wrapper
- `apps/web/src/components/game/BoostCard.tsx` - Added texture-noise to boost card container
- `apps/web/src/app/globals.css` - Added vertical gradients to .map-sidebar and .party-column
- `apps/web/src/components/game/world/WorldView.tsx` - Added 5 ambient particles visible on route/forest zones

## Decisions Made

**Type-colored overlay implementation:**
- Applied to sprite container with 20% opacity
- Uses existing speciesData.color for type consistency
- Shiny Pokemon show gold overlay instead of type color
- Layered with existing glow effects for depth

**Texture application strategy:**
- Added to both compact and full Pokemon card variants
- Applied to PartyPanel and BoostCard for consistency
- Existing relative positioning on cards satisfies texture-noise requirements

**Sidebar gradient approach:**
- Updated CSS directly in globals.css (.map-sidebar and .party-column)
- Uses CSS variables for theme consistency (--color-surface-elevated to --color-surface-base)
- Linear gradient from top to bottom creates subtle depth

**Particle visibility rules:**
- Only visible when `isRoute` is true (route or forest zones)
- Hidden in towns to maintain calm town atmosphere
- 5 particles positioned to avoid trainer/pokemon sprite area
- Mix of green/yellow/emerald/lime colors for natural look

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all implementations straightforward, leveraging existing infrastructure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Visual texture treatments complete. Cards and panels now have tactile retro-physical feel matching MockGameScreen aesthetic. Ready for:
- Additional theme color updates
- Button styling enhancements
- Typography refinements

No blockers.

---
*Phase: 17-theme-styling*
*Completed: 2026-01-21*
