# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Polish the game to feel like a real product, not a prototype — consistent visuals, responsive layouts, satisfying battle feedback.
**Current focus:** Phase 12 - Party Reordering

## Current Position

Phase: 12 of 15 (Party Reordering)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-20 — Completed 12-02-PLAN.md

Progress: [███████░] 68%

## Performance Metrics

**Velocity:**
- Total plans completed: 19 (v1.1)
- Average duration: 2.7 min
- Total execution time: 51 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08-bug-fixes | 2 | 4 min | 2 min |
| 09-design-system | 5 | 18 min | 3.6 min |
| 10-layout-responsiveness | 6 | 14 min | 2.3 min |
| 11-ui-polish | 4 | 8 min | 2 min |
| 12-party-reordering | 2 | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 11-01 (3 min), 11-02 (2 min), 11-04 (3 min), 12-01 (4 min), 12-02 (3 min)
- Trend: Frontend drag-and-drop implementation

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: All decisions from guild milestone documented with outcomes
- 08-01: Return all GuildQuest fields in get_quest_details RPC for full interface compatibility
- 08-02: Use existing Zustand persist middleware for UI preferences storage
- 09-01: Added @rollup/rollup-win32-x64-msvc as optionalDependency to fix Windows npm issue
- 09-01: Using dark-only theme in Storybook since app is dark-mode only
- 09-02: Organize tokens by semantic purpose (brand, surface, text) not value-based naming
- 09-02: Maintain backward compatibility via legacy aliases referencing new tokens
- 09-03: Handle Pokemon type badges separately from CVA (dynamic color via style prop)
- 09-03: Import cn from '@/lib/ui/cn' for explicit path
- 09-04: Use render functions for multi-component stories, include contextual usage examples
- 09-05: Use Storybook ColorPalette blocks for colors, inline JSX for spacing/typography
- 10-01: Use CSS clamp() for fluid typography: 16px min at 375px to 18px max at 1280px
- 10-01: Keep pixel font sizes unchanged for intentional retro aesthetic
- 10-02: Add min-h-[44px] to Button base classes for WCAG touch target compliance
- 10-02: Use ::before pseudo-element on map dots to expand touch area without affecting visual size
- 10-03: Always use 2-column grid for party panel (consistent height calculation)
- 10-03: Use min-h/max-h instead of fixed height for activity log (content-based sizing)
- 10-03: Reduce sprite sizes to fit 6 Pokemon in party column without scroll
- 10-05: Use <= 1024 in JS to match CSS max-width: 1024px inclusive behavior
- 10-06: Use bottom-20 lg:bottom-4 for fixed buttons to clear mobile tab bar
- 11-01: Direction is from perspective of from_zone_id (travel direction to reach destination)
- 11-01: Use single-letter codes (N/S/E/W) for compact storage
- 11-02: Use stable sort by id as secondary key when directions match
- 11-02: Display direction arrows before zone icon for visual hierarchy
- 11-03: Timer shows MM:SS for under 1 hour, HH:MM:SS for longer durations
- 11-03: Red + pulse animation when under 1 minute remaining
- 11-04: Use getPokemonSpriteUrl for consistent sprite display in Guild Bank
- 11-04: Relative timestamps with cursor-help and hover tooltips for absolute time
- 12-01: No battle check needed for party reorder - idle game has no persistent battle state
- 12-01: Use broadcastToPlayer helper for cross-tab sync (broadcasts to all player sessions)
- 12-02: Local state for activeId - avoids Zustand re-render cascade during drag
- 12-02: rectSwappingStrategy + arraySwap for swap behavior (not shift/move)
- 12-02: Optimistic update with rollback on WebSocket send failure

### Pending Todos

None yet.

### Blockers/Concerns

- 08-01: Requires manual migration application to production database
- 09-03: Build failure due to missing lightningcss.win32-x64-msvc.node (pre-existing Windows native module issue)
- 11-01: Requires manual migration application (032_zone_directions.sql) to production database

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 12-02-PLAN.md
Resume file: None

---
*State updated: 2026-01-20 after 12-02 completion*
