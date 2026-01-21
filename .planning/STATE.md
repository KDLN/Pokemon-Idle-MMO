# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Polish the game to feel like a real product, not a prototype — consistent visuals, responsive layouts, satisfying battle feedback.
**Current focus:** Phase 15 - Theme Exploration (COMPLETE)

## Current Position

Phase: 15 of 15 (Theme Exploration)
Plan: 4 of 4 in current phase
Status: Phase complete
Last activity: 2026-01-21 — Completed 15-04-PLAN.md (Mock Game Screen & Theme Comparison)

Progress: [██████████] 100% (All phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 37 (v1.1 + Phase 15)
- Average duration: 3.3 min
- Total execution time: 133 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08-bug-fixes | 2 | 4 min | 2 min |
| 09-design-system | 5 | 18 min | 3.6 min |
| 10-layout-responsiveness | 6 | 14 min | 2.3 min |
| 11-ui-polish | 4 | 8 min | 2 min |
| 12-party-reordering | 3 | 10 min | 3.3 min |
| 13-map-overhaul | 8 | 37 min | 4.6 min |
| 14-battle-system | 5 | 27 min | 5.4 min |
| 15-theme-exploration | 4 | 15 min | 3.75 min |

**Recent Trend:**
- Last 5 plans: 15-01 (3 min), 15-02 (4 min), 15-03 (4 min), 15-04 (4 min)
- Trend: Phase 15 complete

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
- 12-03: 60fps animation loop for smooth long-press progress display
- 12-03: Use CSS ring-2 ring-offset-2 for consistent drop zone highlighting
- 12-03: 4-second toast auto-dismiss for error feedback
- 13-01: Solid dark gradient background for map canvas (Claude's discretion)
- 13-01: Zoom limits 0.5x-2x for whole map to detail view range
- 13-01: Double-click zoom disabled to prevent accidental zoom when clicking zones
- 13-02: CSS transform for zone node centering (-translate-x/y-1/2)
- 13-02: Town nodes larger than route nodes (48px vs 40px) for visual hierarchy
- 13-02: Zone type colors: amber (town), green (route), stone (cave), emerald (forest)
- 13-03: SVG filter for glow effect on active connections
- 13-03: Dashed stroke for inactive connections, solid for active
- 13-03: Connection deduplication via min/max zone ID normalized keys
- 13-04: Start with zone 1 (Pallet Town) visited by default
- 13-04: Auto-mark zones visited in setZone action
- 13-04: 3-second pulse animation for mystery zones
- 13-04: Hide connections where either zone is hidden
- 13-05: Use 50px margin buffer for viewport visibility detection
- 13-05: setTransform with 300ms easeOut animation for smooth centering
- 13-05: Calculate initial position based on estimated viewport (640x400)
- 13-05: Use previousZoneIdRef to detect zone changes for re-centering
- 13-06: Validate travel against connectedZoneIds Set (client-side before server)
- 13-06: Use invisible 20px stroke-width line for path click targets
- 13-06: Calculate targetZoneId as "zone that's NOT current"
- 13-06: Keep pointer-events none on inactive paths
- 13-07: Header bar with indicator dots (red/yellow/green) for handheld device aesthetic
- 13-07: Subtle corner pokeball decorations (20% opacity)
- 13-07: Larger zone nodes (56px town, 44px route) with rounded-xl corners
- 13-07: Animated player marker with 1.5s ease-in-out gentle bounce
- 13-08: Use gameStore directly in InteractiveMap instead of props
- 13-08: Keep travel buttons section below map for alternative UI
- 14-01: 30-second timeout for battle inactivity with 5-second cleanup interval
- 14-01: Speed comparison determines turn order (playerFirst flag)
- 14-01: Battle state includes separate current HP and max HP for both combatants
- 14-02: Always show 3 shakes for suspense (per CONTEXT.md design)
- 14-02: Catch success calculated NOW at throw moment (not pre-decided)
- 14-02: Battle timeout auto-resolves based on HP percentage advantage
- 14-02: Coexist with legacy battle flow during transition period
- 14-02: Dynamic import for attemptCatch to avoid circular dependencies
- 14-03: useBattleAnimation reads activeBattle from store (not encounter prop)
- 14-03: waiting_for_turn and waiting_for_catch phases pause until server responds
- 14-03: Auto-select best ball type (great_ball > pokeball) for catch attempts
- 14-04: Reduced attack-lunge from 0.3s to 0.25s for snappier feel
- 14-04: Reduced pokeball-wobble from 0.7s to 0.6s while maintaining suspense
- 14-04: HP transitions over 0.4s for smooth drain effect
- 14-04: Critical HP pulses infinitely at <20% for urgency
- 14-04: Switched from currentEncounter to activeBattle for server-driven battles
- 14-05: Battle not ended immediately on disconnect - allows 30s reconnect window
- 14-05: checkAndResumeActiveBattle sends encounter_start with resume flag or battle_summary
- 15-01: Use [data-theme="modern"] selector for theme overrides
- 15-01: Theme tokens in @layer base to ensure proper cascade
- 15-01: Storybook themes: 'current' (empty attr) and 'modern'
- 15-03: Organize showcase by screen context (Battle, Party, Map, Social, Inventory, Core)
- 15-03: Include placeholder sections for components without stories
- 15-03: CoreUI is comprehensive - references all available story variants
- 15-04: Use PokeAPI sprite URLs for realistic Pokemon display in mock screen
- 15-04: Toggle switch uses data-theme attribute for CSS-only theme switching
- 15-04: MockGameScreen is 724 lines for comprehensive theme demonstration

### Pending Todos

- Empty slot drag support needed for party reordering (identified gap from 12-03)

### Blockers/Concerns

- 08-01: Requires manual migration application to production database
- 09-03: Build failure due to missing lightningcss.win32-x64-msvc.node (pre-existing Windows native module issue)
- 11-01: Requires manual migration application (032_zone_directions.sql) to production database

## Session Continuity

Last session: 2026-01-21
Stopped at: Completed 15-04-PLAN.md (Mock Game Screen & Theme Comparison)
Resume file: None

---
*State updated: 2026-01-21 after 15-04 completion*
