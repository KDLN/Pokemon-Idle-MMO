# Project Research Summary

**Project:** Pokemon Idle MMO - UI/UX Polish v1.1
**Domain:** UI/UX Polish, Design Systems, Real-Time Game Systems
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

The v1.1 milestone transforms an MVP into a polished idle game through systematic UI/UX improvements and a real-time battle system overhaul. Research confirms the existing codebase has a solid foundation: 2600+ lines of CSS with 66+ design tokens already defined, Tailwind 4 integration, server-authoritative game logic, and proven patterns like `pendingEncounterRewards` for animation/state synchronization. The strategy should be **formalize and extend, not replace** - migrating existing patterns into a proper design system rather than creating parallel structures.

The recommended approach uses Storybook 10 + CVA (class-variance-authority) for component documentation and variants, @dnd-kit for drag-to-reorder party (React 19 compatible with "use client"), and Motion v12 for gesture-based animations while preserving the extensive CSS keyframe animations already in place. The battle system requires the most significant architectural change: shifting from pre-computed "playback theater" to progressive server-client synchronization where turns are calculated and revealed incrementally, maintaining server authority while creating true uncertainty.

Key risks center on scope creep during polish (fix what was scoped, log other issues for later), animation performance (only animate transform/opacity for 60fps, keep animations under 800ms to fit within tick budget), and state management during drag operations (use refs for animation state, memoize components heavily). The existing `pendingEncounterRewards` pattern proves the team understands server-authoritative state management - this pattern must extend to all battle state to prevent race conditions.

## Key Findings

### Recommended Stack

The stack leverages existing infrastructure while adding targeted libraries for new capabilities. All additions are React 19 compatible and work with the existing Next.js 16 + Tailwind 4 setup.

**Core technologies:**
- **Storybook 10** (@storybook/nextjs-vite): Component showcase and documentation with official Next.js 16 + Tailwind 4 support
- **class-variance-authority** (^0.7.1): Component variants without conditional class spaghetti - used by shadcn/ui, integrates with existing Tailwind
- **@dnd-kit/core + @dnd-kit/sortable**: Drag-to-reorder party - 10kb, accessible (keyboard support), works with React 19 via "use client"
- **Motion v12** (motion package): Interactive animations and gestures - React 19 native support, complements existing CSS animations
- **tailwind-merge** (^3.0.0): Bulletproof component class overrides without duplication conflicts

**Avoid:**
- react-beautiful-dnd (deprecated), @dnd-kit/react experimental (unresolved issues)
- framer-motion old package (superseded by motion, React 19 type conflicts)
- Heavy component libraries (Radix, Chakra, MUI) - incompatible with existing Pokemon aesthetic

### Expected Features

**Must have (table stakes):**
- 16px minimum body text, 14px for secondary (currently reported as "too small")
- 44-48px minimum touch targets on all interactive elements
- Instant tap/click feedback with visual response
- Smooth HP/XP bar animations (not instant jumps)
- Loading indicators for async operations
- Consistent hover states on desktop

**Should have (differentiators):**
- Drag-to-reorder party (Pokemon-standard UX)
- Screen shake on critical hits, particle effects on catches
- Battle anticipation timing (pokeball shakes, HP depletes with tension)
- Smart activity log with collapsible sections and virtual scrolling
- Active buff indicators near player info
- Type effectiveness visual flair

**Defer (v2+):**
- Full theme customization system
- Sound design integration
- Time-warp offline visualization
- Complex gesture navigation (swipe zones)

### Architecture Approach

The battle system requires transitioning from pre-computed playback to progressive revelation. Currently, the server calculates entire battle outcomes upfront and sends complete `BattleSequence` data - the client animation is purely theatrical. This prevents true uncertainty and creates potential disconnect exploits.

**Major components (battle system change):**
1. **Server Battle State Machine** (hub.ts) - Manages battle phases (starting, turn_pending, turn_sent, catch_thrown, completed), handles disconnect protection via timeouts, auto-resolves abandoned battles
2. **Progressive Protocol** - New message types: `battle_start`, `battle_turn`, `catch_shake`, `catch_result` sent incrementally instead of all-at-once
3. **Client Animation Hook** - Modified `useBattleAnimation` responds to incoming turns, sends `battle_ready` acknowledgment when animation completes
4. **Disconnect Protection** - Server commits damage immediately to session, auto-resolves battles after 30-second timeout, reconnect receives current/final state

**Key principle:** Client animates what server sends, requests next action when ready. Server never waits for client; timeout triggers auto-resolution.

### Critical Pitfalls

1. **Over-Customizing Existing Tokens (DS-1)** - The codebase has 66+ CSS variables. Creating a "new" design system risks duplicate definitions and conflicts. **Prevention:** Audit existing tokens first, migrate/rename rather than duplicate, keep single source of truth in globals.css.

2. **Layout-Triggering Animations (AN-1)** - Animating width/height/left/top causes reflow and jank. Some HP bar transitions use `width` instead of `scaleX`. **Prevention:** Only animate `transform` and `opacity` for 60fps, audit all existing transitions.

3. **Race Conditions Client/Server (RT-1)** - Optimistic UI updates during battle cause flicker when server response differs. **Prevention:** Never show optimistic battle results - always wait for server confirmation, extend `pendingEncounterRewards` pattern to all battle state.

4. **Re-render Cascade on Drag (DD-1)** - Party reorder can trigger cascading re-renders if drag state is in global store. **Prevention:** Keep drag position in local state/ref, memoize PokemonCard with React.memo, use CSS transforms during drag.

5. **Scope Creep During Polish (PP-1)** - "Fix this scroll" becomes "rewrite the grid layout." **Prevention:** Define explicit scope boundaries per task, log discovered issues for future phases, time-box work with clear acceptance criteria.

## Implications for Roadmap

Based on research, suggested phase structure with rationale:

### Phase 1: Bug Fixes
**Rationale:** Clear low-hanging fruit before larger changes; establishes baseline stability
**Delivers:** Guild Quest contributor display, Guild Bank view toggle functionality
**Addresses:** Table stakes expectation of working features
**Avoids:** PP-2 (regression risk) by isolating bug fixes before CSS refactoring

### Phase 2: Design System Foundation
**Rationale:** Must establish design tokens, component patterns, and Storybook before visual polish work; prevents DS-1 (duplicate tokens)
**Delivers:** Formalized token system, CVA-based component variants (Button, Badge, Card, ProgressBar), Storybook setup
**Uses:** Storybook 10, CVA, tailwind-merge
**Avoids:** DS-1 (token duplication), DS-3 (className leaking)
**Note:** Starts with audit of existing 66+ CSS variables, not greenfield design

### Phase 3: Responsive Layout Fixes
**Rationale:** Layout must be stable before animation and interaction work; depends on Phase 2 design tokens
**Delivers:** Fixed typography scale (16px body), touch-friendly targets (44px+), fluid layouts replacing fixed px values
**Addresses:** "Font too small", tablet gap (768-1024px), touch target violations
**Avoids:** RD-1 (fixed units), RD-2 (mobile-first reversal), RD-3 (touch targets)
**Note:** Maintain existing desktop-first pattern, don't refactor to mobile-first

### Phase 4: UI Polish Pass
**Rationale:** With design system and responsive foundation, polish individual components; depends on Phase 2-3
**Delivers:** Navigation order matching travel direction, Boosts rename, bank display improvements, activity log collapsibility
**Addresses:** Navigation ordering, activity log cut-off, power-ups visibility
**Avoids:** PP-1 (scope creep) - strict boundaries per component

### Phase 5: Drag-to-Reorder Party
**Rationale:** New interaction pattern requires stable components from Phase 2; complex enough to isolate
**Delivers:** Touch-and-hold party reordering with keyboard accessibility
**Uses:** @dnd-kit/core, @dnd-kit/sortable
**Avoids:** DD-1 (re-render cascade) via memoization and local drag state, DD-2 (library lock-in) by using maintained library

### Phase 6: Map Overhaul
**Rationale:** Map is visually distinct system; benefits from design tokens (Phase 2) and responsive patterns (Phase 3)
**Delivers:** Visual styling refresh, improved interactions, clear zone connections, return-to-position helpers
**Addresses:** "Map looks MVP/buggy", navigation issues
**Avoids:** AN-1 by using transform-based pan/zoom

### Phase 7: Real-Time Battle System
**Rationale:** Most complex change, requires stable foundation; isolated backend change with frontend animation work
**Delivers:** Progressive turn-by-turn reveal, anticipation timing, disconnect protection, catch-at-throw calculation
**Uses:** Motion v12 for battle animations, existing useBattleAnimation hook refactored
**Implements:** Server battle state machine, progressive WebSocket protocol
**Avoids:** RT-1 (race conditions), RT-2 (tick drift), RT-3 (client-side calculations)
**Note:** 6-phase migration path documented in ARCHITECTURE-REALTIME-BATTLES.md

### Phase 8: Theme Exploration
**Rationale:** Final phase after all components are polished; uses Storybook for side-by-side comparison
**Delivers:** Component showcase page, mock screens, theme comparison tooling
**Uses:** Storybook built in Phase 2
**Note:** Exploration only - full theme system deferred to v2+

### Phase Ordering Rationale

- **Design System before Polish:** Attempting visual polish without formalized tokens leads to DS-1 (duplicate tokens) and inconsistent results
- **Responsive before Interactions:** Drag-to-reorder and animations require stable layouts to measure and animate correctly
- **Battle System late:** Highest complexity change benefits from team velocity established in earlier phases; can be descoped if milestone timeline pressured
- **Map isolated:** Self-contained system that doesn't block other work
- **Theme Exploration last:** Requires all components to be in final state for meaningful comparison

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 7 (Battle System):** Complex state machine, needs prototype of progressive protocol before full implementation; open questions about gym battles, animation timing, reconnect behavior documented in ARCHITECTURE
- **Phase 6 (Map Overhaul):** Visual design decisions need mockups; interaction patterns (zoom/pan) need performance testing

Phases with standard patterns (skip research-phase):
- **Phase 2 (Design System):** Well-documented CVA + Storybook patterns, official recipes exist
- **Phase 5 (Drag-Reorder):** @dnd-kit has excellent docs and examples for sortable lists
- **Phase 3 (Responsive):** Standard Tailwind 4 patterns, container queries documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Next.js 16/React 19 compatibility verified, active maintenance on all libraries |
| Features | HIGH | Industry standards (WCAG, Apple/Google HIG) and established idle game patterns |
| Architecture | HIGH | Codebase analysis confirms feasibility; progressive revelation is standard game pattern |
| Pitfalls | HIGH | Direct codebase inspection + verified industry sources; existing patterns (pendingRewards) validate approach |

**Overall confidence:** HIGH

### Gaps to Address

- **Gym battle architecture:** Should gym battles remain pre-computed or also go progressive? Recommend: keep pre-computed for v1.1 simplicity, reconsider for v2
- **Animation timing budget:** 800ms max per turn assumed; needs validation against actual battle animation designs
- **Reconnect behavior:** Should player see animation of missed turns or just final state? Recommend: final state only for simplicity
- **Storybook Tailwind 4 integration:** Newer pattern, may need troubleshooting during setup

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: hub.ts, game.ts, globals.css, gameStore.ts, useBattleAnimation.ts
- [Storybook 10 Official Release](https://storybook.js.org/blog/storybook-10/)
- [Motion for React Documentation](https://motion.dev/docs/react-installation)
- [dnd-kit Official Documentation](https://docs.dndkit.com/)
- [WCAG Accessibility Guidelines](https://www.a11y-collective.com/blog/wcag-minimum-font-size/)
- [Apple/Google Touch Target Guidelines](https://devoq.medium.com/designing-for-touch-mobile-ui-ux-best-practices-c0c71aa615ee)

### Secondary (MEDIUM confidence)
- [Class Variance Authority Docs](https://cva.style/docs)
- [Tailwind CSS 4 Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Game UI Database - Pokemon References](https://gameuidatabase.com/gameData.php?id=30)
- [Client-Side Prediction and Server Reconciliation](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Top 5 Drag-and-Drop Libraries 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

### Tertiary (LOW confidence - needs validation)
- Storybook 10 + Tailwind 4 @source directive configuration (documented but newer pattern)
- @dnd-kit stable packages + React 19 "use client" requirement (works but may need testing)

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
