# Roadmap: Pokemon Idle MMO v1.1

## Overview

This milestone transforms the functional MVP into a polished product through systematic UI/UX improvements, a real-time battle system overhaul, and design system formalization. Starting with bug fixes to establish baseline stability, then building design foundations before visual polish, and culminating in the complex battle system rework and theme exploration tools.

## Milestones

- v1.0 Guilds - Phases 1-7 (shipped 2026-01-19) - See `.planning/milestones/v1.0-ROADMAP.md`
- v1.1 UI/UX Polish - Phases 8-15 (in progress)

## Phases

- [x] **Phase 8: Bug Fixes** - Fix Guild Quest contributors and Bank view toggle
- [x] **Phase 9: Design System** - Formalize tokens, set up Storybook, create CVA components
- [x] **Phase 10: Layout & Responsiveness** - Typography scale, touch targets, viewport support
- [x] **Phase 11: UI Polish** - Navigation order, naming, display improvements
- [x] **Phase 12: Party Reordering** - Drag-to-reorder party with persistence
- [ ] **Phase 13: Map Overhaul** - Visual styling, interactions, zone connections
- [ ] **Phase 14: Battle System** - Progressive turn calculation and animation
- [ ] **Phase 15: Theme Exploration** - Component showcase and theme comparison tools

## Phase Details

### Phase 8: Bug Fixes
**Goal**: Establish baseline stability by fixing known bugs before larger changes
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: BUG-01, BUG-02
**Success Criteria** (what must be TRUE):
  1. User clicks "Show contributors" on any guild quest and sees contributor list without error
  2. User toggles between grid/list view in Guild Bank and display switches correctly
  3. View preference persists across page navigation
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Fix missing get_quest_details SQL function for contributor display
- [x] 08-02-PLAN.md — Fix Guild Bank view toggle and add persistence via Zustand

### Phase 9: Design System
**Goal**: Formalize existing design tokens and establish component patterns for consistent visual work
**Depends on**: Phase 8
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07
**Success Criteria** (what must be TRUE):
  1. All 66+ existing CSS variables are documented with semantic naming
  2. Typography scale (sizes, weights, line heights) is documented and applied consistently
  3. Spacing scale (margins, padding, gaps) is documented and applied consistently
  4. Storybook displays Button, Card, Badge components with interactive examples
  5. Component variants are implemented using CVA with clear documentation
**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — Install CVA/Storybook dependencies, upgrade cn() utility, configure Storybook 10
- [x] 09-02-PLAN.md — Audit tokens, create colors/spacing/typography CSS files, document in TOKENS.md
- [x] 09-03-PLAN.md — Migrate Button, Card, Badge components to CVA patterns
- [x] 09-04-PLAN.md — Create Storybook stories for Button, Card, Badge with interactive examples
- [x] 09-05-PLAN.md — Create Colors, Spacing, Typography MDX documentation pages

### Phase 10: Layout & Responsiveness
**Goal**: Make the game comfortable to use across all device sizes with proper typography and touch targets
**Depends on**: Phase 9
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, LAYOUT-06, LAYOUT-07
**Success Criteria** (what must be TRUE):
  1. All body text is at least 16px; user can read without squinting
  2. All buttons and interactive elements have 44px minimum touch targets
  3. Activity log fits available space without unnecessary scroll when few items
  4. Pokemon party panel shows all 6 Pokemon without scroll on standard viewports
  5. Game screens are usable on 375px mobile, 768px tablet, and 1280px+ desktop
**Plans**: 6 plans

Plans:
- [x] 10-01-PLAN.md — Establish responsive typography system with 16px minimum body text using clamp()
- [x] 10-02-PLAN.md — Standardize touch targets to 44px minimum across all interactive elements
- [x] 10-03-PLAN.md — Optimize party panel and activity log layouts for content-based sizing
- [x] 10-04-PLAN.md — Test and fix all game screens across mobile/tablet/desktop viewports
- [x] 10-05-PLAN.md — Fix 1024px breakpoint mismatch between JavaScript and CSS (gap closure)
- [x] 10-06-PLAN.md — Fix Box button accessibility on mobile devices (gap closure)

### Phase 11: UI Polish
**Goal**: Improve navigation, naming, and display quality throughout the UI
**Depends on**: Phase 10
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Navigation buttons are ordered by travel direction (contextual to player location)
  2. All instances of "Power-Ups" read "Boosts" throughout the UI
  3. Active boosts display in Boosts panel with remaining duration visible
  4. Guild Bank Pokemon display shows sprite and name (not numeric ID)
  5. Guild Bank transaction logs show human-readable format (not raw JSON)
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md — Add direction data to zone connections (database migration + backend)
- [x] 11-02-PLAN.md — Implement navigation direction sorting and rename Power-Ups to Boosts
- [x] 11-03-PLAN.md — Create active boosts display with countdown timers and expiry notifications
- [x] 11-04-PLAN.md — Enhance Guild Bank with Pokemon sprites, sorting, and relative timestamps

### Phase 12: Party Reordering
**Goal**: Enable players to organize their party through intuitive drag-and-drop
**Depends on**: Phase 11
**Requirements**: UI-06, UI-07, UI-08
**Success Criteria** (what must be TRUE):
  1. User can drag Pokemon cards to reorder party (touch and mouse support)
  2. Party order persists after page refresh and reconnection
  3. First Pokemon in party order is the one that battles (order affects gameplay)
  4. Drag interaction has visual feedback (lift, drop zone highlighting)
**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md — Install @dnd-kit packages and add backend reorder_party endpoint
- [x] 12-02-PLAN.md — Implement drag-and-drop party reordering using @dnd-kit
- [x] 12-03-PLAN.md — Add visual polish: long-press indicator, drag overlay, error feedback

### Phase 13: Map Overhaul
**Goal**: Transform the map into a polished, intuitive navigation tool
**Depends on**: Phase 9 (uses design tokens)
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05
**Success Criteria** (what must be TRUE):
  1. Map styling matches game theme (colors, fonts, borders consistent with design system)
  2. Zone hover and click interactions work reliably
  3. Zone connections are visually clear (player can see which zones connect)
  4. Map pan/zoom is smooth (no jank, uses transform-based movement)
  5. Current zone is clearly highlighted and distinguishable from other zones
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

### Phase 14: Battle System
**Goal**: Create genuine battle uncertainty through progressive turn revelation
**Depends on**: Phase 10 (stable layouts for animation)
**Requirements**: BATTLE-01, BATTLE-02, BATTLE-03, BATTLE-04, BATTLE-05, BATTLE-06, BATTLE-07
**Success Criteria** (what must be TRUE):
  1. Battle turns are calculated one at a time on server (not pre-computed bulk)
  2. Player sees each turn animate before knowing the next turn's outcome
  3. HP bars animate smoothly as damage is dealt (not instant jumps)
  4. Catch success/failure is unknown until ball animation completes
  5. Battles timeout after 30 seconds if client disconnects
  6. Each turn animation completes within 800ms budget
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

### Phase 15: Theme Exploration
**Goal**: Provide tools to visualize and compare theme directions
**Depends on**: Phase 9 (Storybook), Phase 14 (all components finalized)
**Requirements**: THEME-01, THEME-02, THEME-03
**Success Criteria** (what must be TRUE):
  1. Component showcase page displays all UI elements in one place
  2. Mock game screen demonstrates "Pokemon clean modern" theme direction
  3. Side-by-side comparison shows current theme vs proposed theme
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Bug Fixes | v1.1 | 2/2 | Complete | 2026-01-19 |
| 9. Design System | v1.1 | 5/5 | Complete | 2026-01-19 |
| 10. Layout & Responsiveness | v1.1 | 6/6 | Complete | 2026-01-20 |
| 11. UI Polish | v1.1 | 4/4 | Complete | 2026-01-20 |
| 12. Party Reordering | v1.1 | 3/3 | Complete | 2026-01-20 |
| 13. Map Overhaul | v1.1 | 0/? | Not started | - |
| 14. Battle System | v1.1 | 0/? | Not started | - |
| 15. Theme Exploration | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-01-19*
*v1.1 milestone: 8 phases, 39 requirements*
