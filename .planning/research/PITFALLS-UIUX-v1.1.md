# Pitfalls Research: UI/UX Polish (v1.1 Milestone)

**Project:** Pokemon Idle MMO v1.1 UI/UX Polish Milestone
**Researched:** 2026-01-19
**Confidence:** HIGH (based on existing codebase analysis + verified web sources)

## Executive Summary

This document catalogs pitfalls specific to the v1.1 milestone work: design system creation, responsive layout fixes, drag-to-reorder party, real-time battle calculations, and theme exploration. The codebase already has extensive CSS (2590+ lines in globals.css) with some design tokens in CSS variables, Tailwind 4 integration, and a WebSocket-based tick system. Pitfalls are prioritized by severity and mapped to specific phases.

---

## Design System Pitfalls

### Pitfall DS-1: Over-Customizing Existing Design Tokens (CRITICAL)

**What goes wrong:** The codebase already has 66+ CSS variables (colors, types, UI tokens) in `globals.css`. Creating a "new" design system risks:
- Duplicate token definitions (old `--poke-red` vs new `--color-primary`)
- Conflicts between existing Tailwind classes and new design tokens
- Breaking existing components that reference old variable names

**Why it happens:** Developers start fresh without auditing existing tokens, creating parallel systems.

**Warning signs:**
- New CSS variable names that duplicate existing semantics
- Components importing both old globals.css variables and new design tokens
- Tailwind `@theme` conflicts with custom CSS variables

**Prevention:**
1. **Audit first:** Document all 66+ existing CSS variables before creating new ones
2. **Migrate, don't duplicate:** Rename/extend existing tokens rather than creating parallel system
3. **Single source of truth:** Keep all tokens in globals.css or migrate ALL to Tailwind config
4. **Automated checks:** Lint for duplicate color values across variable definitions

**Phase impact:** Design System phase must start with audit, not creation

**Sources:** [Top Mistakes with React UI Libraries](https://www.sencha.com/blog/top-mistakes-developers-make-when-using-react-ui-component-library-and-how-to-avoid-them/), [CSS Variables Pitfalls](https://blog.pixelfreestudio.com/css-variables-gone-wrong-pitfalls-to-watch-out-for/)

---

### Pitfall DS-2: Tailwind 4 Configuration Drift (HIGH)

**What goes wrong:** The codebase uses Tailwind 4 with `@import "tailwindcss"` and `@theme inline` blocks. Common mistakes:
- Forgetting to scan dynamic class names (e.g., `type-${type}` patterns)
- Misconfiguring content paths, causing classes to be purged
- Using deprecated Tailwind 3 patterns (e.g., old purge config)

**Why it happens:** Tailwind 4 changed significantly from v3. Documentation is recent and developers rely on outdated knowledge.

**Warning signs:**
- Styles work in dev but disappear in production
- Classes like `type-border-${pokemonType}` not applying
- Build warnings about unused CSS

**Prevention:**
1. **Safelist dynamic classes:** Explicitly safelist type-based classes in Tailwind config
2. **Test production builds:** Always verify styles in production mode before merging
3. **Use semantic tokens:** Prefer `--type-fire` CSS variable over dynamic Tailwind classes for type colors

**Phase impact:** Design System phase needs Tailwind 4-specific configuration review

**Sources:** [Debugging Tailwind CSS 4 in 2025](https://medium.com/@sureshdotariya/debugging-tailwind-css-4-in-2025-common-mistakes-and-how-to-fix-them-b022e6cb0a63), [Tailwind CSS Large Projects Best Practices](https://medium.com/@vishalthakur2463/tailwind-css-in-large-projects-best-practices-pitfalls-bf745f72862b)

---

### Pitfall DS-3: className Props Leaking API Boundaries (MEDIUM)

**What goes wrong:** Existing components like `Button`, `Card`, `Badge` accept `className` props. During polish:
- Developers add one-off styles via className instead of extending component API
- Inconsistent variants proliferate (`className="bg-red-500"` vs using variant prop)
- Component styling becomes unpredictable

**Why it happens:** `className` is the path of least resistance for quick fixes.

**Warning signs:**
- PRs with inline Tailwind classes that duplicate existing variants
- Same visual style achieved differently across components
- Component props growing to accommodate style overrides

**Prevention:**
1. **Closed API principle:** Define explicit variants for common use cases
2. **Code review checks:** Flag `className` usage that duplicates variant functionality
3. **Document component API:** Make variants discoverable to prevent ad-hoc styling

**Phase impact:** Design System phase should establish variant patterns before polish work begins

**Sources:** [Don't Use Tailwind for Design Systems](https://sancho.dev/blog/tailwind-and-design-systems)

---

## Responsive Design Pitfalls

### Pitfall RD-1: Fixed Units Breaking Fluid Layouts (CRITICAL)

**What goes wrong:** The codebase uses many fixed pixel values:
- `.map-canvas { height: 180px; }`
- `.classic-battle-arena { max-height: 400px; }`
- `.game-layout { grid-template-columns: 260px 1fr 340px; }`

These break on:
- Tablets (1024px breakpoint is binary, not fluid)
- Ultra-wide monitors
- Browser zoom levels

**Why it happens:** Desktop-first development with mobile breakpoints added later.

**Warning signs:**
- Layout breaks between 768px and 1024px ("tablet gap")
- Content overflow on zoom >100%
- Horizontal scroll appearing unexpectedly

**Prevention:**
1. **Use relative units:** Convert fixed px to rem/em for typography, vh/vw for containers
2. **Container queries:** Use CSS container queries for component-level responsiveness
3. **Test intermediate sizes:** Test at 900px, 1100px, 1300px, not just breakpoints
4. **Zoom testing:** Test at 150% browser zoom

**Phase impact:** Responsive phase needs systematic px-to-relative audit

**Sources:** [Common Mistakes in Responsive Web Design](https://ecareinfoway.com/blog/common-mistakes-to-avoid-in-responsive-web-design), [BrowserStack Responsive Design Guide](https://www.browserstack.com/guide/common-web-design-mistakes)

---

### Pitfall RD-2: Mobile-First Reversal Causing Regressions (HIGH)

**What goes wrong:** The codebase is desktop-first (`.game-layout` defines desktop grid, then `@media (max-width: 1024px)` overrides). During polish:
- Mobile fixes break desktop layouts
- CSS specificity wars between base styles and media queries
- Duplicate code for same component at different breakpoints

**Why it happens:** Retrofitting mobile-first onto desktop-first codebase is inherently risky.

**Warning signs:**
- Using `!important` to override media query styles
- Same property set in multiple places for same element
- Mobile styles "leaking" to desktop

**Prevention:**
1. **Don't refactor to mobile-first:** Keep desktop-first approach, fix issues incrementally
2. **Isolate mobile overrides:** Group all mobile styles in clearly marked sections
3. **Use min-width sparingly:** When adding new responsive features, use max-width to match existing pattern

**Phase impact:** Responsive phase should maintain existing desktop-first pattern

**Sources:** [Mobile-first Responsive Website Best Practices 2025](https://www.engagecoders.com/responsive-web-design-mobile-first-development-best-practices-2025-guide/)

---

### Pitfall RD-3: Touch Target Size Violations (MEDIUM)

**What goes wrong:** Pokemon cards, type badges, and buttons may be too small on touch devices:
- `.type-badge { font-size: 0.55rem; padding: 0.1rem 0.35rem; }` on mobile
- Map dots at 6-8px are untappable
- Close buttons on modals too small

**Why it happens:** Visual design prioritizes information density over touch ergonomics.

**Warning signs:**
- Users tapping wrong elements on mobile
- "Fat finger" complaints in feedback
- Accessibility audit failures

**Prevention:**
1. **44x44px minimum:** Ensure all interactive elements meet WCAG touch target guidelines
2. **Hitbox expansion:** Use padding or pseudo-elements to expand touch area without visual change
3. **Mobile-specific affordances:** Larger buttons/controls on touch devices via media query

**Phase impact:** Responsive phase should audit all interactive elements for touch targets

**Sources:** [UXPin Responsive Design Best Practices](https://www.uxpin.com/studio/blog/best-practices-examples-of-excellent-responsive-design/)

---

## Animation Pitfalls

### Pitfall AN-1: Layout-Triggering Animations Causing Jank (CRITICAL)

**What goes wrong:** Animations that modify layout properties cause reflow:
- Animating `width` on HP bars instead of `transform: scaleX()`
- Animating `height` on collapsible sections
- Animating `left/top` instead of `transform: translate()`

The codebase has some good patterns (`.hp-bar-fill { transition: width 0.3s }`) but also risky ones.

**Why it happens:** Width/height transitions are intuitive; transform alternatives require more thought.

**Warning signs:**
- Frame drops during animations (use Chrome DevTools Performance tab)
- CPU spikes during UI transitions
- Animations smoother on powerful devices, janky on mobile

**Prevention:**
1. **GPU-only properties:** Animate ONLY `transform` and `opacity` for smooth 60fps
2. **will-change sparingly:** Use `will-change: transform` only where needed, remove after animation
3. **Compositor layers:** Ensure animated elements are on their own layer
4. **Reduced motion:** Respect `prefers-reduced-motion` (already in codebase, good!)

**Phase impact:** Animation phase should audit all transitions for layout triggers

**Sources:** [CSS Animation Performance Optimization](https://dev.to/nasehbadalov/optimizing-performance-in-css-animations-what-to-avoid-and-how-to-improve-it-bfa), [React Animation Performance](https://stevekinney.com/courses/react-performance/animation-performance)

---

### Pitfall AN-2: React State Updates Blocking Animation Frames (HIGH)

**What goes wrong:** The gameStore has 100+ state properties. During animations:
- Zustand state updates cause re-renders mid-animation
- Animation state stored in React state triggers reconciliation every frame
- WebSocket tick updates (1/second) interrupt animation timing

Observed in codebase: `pendingEncounterRewards` pattern correctly defers state updates until animation completes - this pattern should be extended.

**Why it happens:** Intuition is to track animation state in React state, but this causes re-renders.

**Warning signs:**
- Animations stuttering at regular intervals (tick-aligned)
- CPU profiler showing React reconciliation during animation
- `setInterval` or state updates at 16ms intervals

**Prevention:**
1. **useRef for animation state:** Store frame-by-frame values in refs, not state
2. **Batch updates:** Use Zustand's `set()` to batch multiple state changes
3. **Defer tick processing:** Queue tick results during active animations (like `pendingEncounterRewards`)
4. **requestAnimationFrame:** Drive animations with RAF, not setInterval

**Phase impact:** Animation phase needs clear separation of animation state from React state

**Sources:** [React Animations Still Laggy?](https://medium.com/@CodersWorld99/react-animations-still-laggy-d0a836d4095d), [Animations with React Performance Impact](https://dev.to/fedekau/animations-with-react-how-a-simple-component-can-affect-your-performance-2a41)

---

### Pitfall AN-3: Animation Duration Mismatch with Game Tick (MEDIUM)

**What goes wrong:** Game tick is 1 second. If battle animations take 1.5 seconds:
- Next tick arrives before animation completes
- State updates mid-animation cause visual glitches
- Queued animations stack up

**Why it happens:** Animation durations designed for visual polish, not tick synchronization.

**Warning signs:**
- Animations "skipping" or fast-forwarding
- Visual state desyncing from game state
- Animations playing over each other

**Prevention:**
1. **Animation budget:** Keep battle animations under 800ms to leave buffer before next tick
2. **Animation queue:** Process animations sequentially, defer tick processing until queue empty
3. **Interruptible animations:** Design animations that can be cut short gracefully

**Phase impact:** Animation phase should define strict timing constraints aligned with tick system

---

## Real-Time Battle Pitfalls

### Pitfall RT-1: Race Conditions Between Client and Server State (CRITICAL)

**What goes wrong:** Client optimistically updates UI while server processes action:
- XP shows increased, then corrects on server response
- Pokemon appears evolved, then reverts
- HP bar jumps erratically

The codebase already handles this for evolutions (`pendingEvolutions` with deduplication), but similar patterns needed for all battle state.

**Why it happens:** Latency between action and server confirmation creates temporal inconsistency.

**Warning signs:**
- UI "flickering" between states
- Values briefly showing wrong then correcting
- Deduplication logic needed in multiple places

**Prevention:**
1. **Authoritative server:** Never show optimistic battle results; wait for server confirmation
2. **Pending state pattern:** Extend `pendingEncounterRewards` pattern to all battle updates
3. **Idempotent handlers:** Ensure handling same message twice is safe (already done for evolutions)
4. **Sequence numbers:** Add sequence IDs to messages to detect out-of-order delivery

**Phase impact:** Battle system phase needs clear state ownership (server-authoritative)

**Sources:** [Handling Race Conditions in Real-Time Apps](https://dev.to/mattlewandowski93/handling-race-conditions-in-real-time-apps-49c8), [WebSockets Realtime Gaming](https://pusher.com/blog/websockets-realtime-gaming-low-latency/)

---

### Pitfall RT-2: Tick Synchronization Drift (HIGH)

**What goes wrong:** Client tick timer drifts from server:
- setTimeout/setInterval drift accumulates over time
- Tab backgrounding causes missed ticks
- Network latency makes tick arrival unpredictable

**Why it happens:** JavaScript timers are not precise; browser throttles background tabs.

**Warning signs:**
- Long play sessions show increasing desync
- Returning from background tab shows stale state
- Animations tied to tick timing become irregular

**Prevention:**
1. **Server timestamps:** Include server timestamp in tick messages
2. **Drift correction:** Periodically resync client timer based on server time
3. **Background handling:** On tab visibility change, request full state refresh
4. **Don't render tick timer:** Use server ticks for state, RAF for rendering

**Phase impact:** Battle system phase should audit tick handling for drift scenarios

---

### Pitfall RT-3: Battle Calculation Exploit Vectors (MEDIUM)

**What goes wrong:** If battle calculations are done client-side:
- Players can modify client to always win
- Damage calculations can be manipulated
- Catch rates can be faked

Current architecture: Server runs `processTick` and battle logic in `game.ts` - this is CORRECT. Maintain this.

**Why it happens:** Temptation to move calculations client-side for "real-time feel."

**Warning signs:**
- Battle logic appearing in client code
- Client sending "I won" instead of "I attacked"
- Damage values coming from client

**Prevention:**
1. **Server-authoritative battles:** Keep all battle calculations in `game.ts` on server
2. **Client is display-only:** Client receives battle results, never computes them
3. **Input validation:** Server validates all client actions (move zone, swap party, etc.)

**Phase impact:** Battle animation phase must NOT move any battle logic to client

---

## Polish Pass Pitfalls

### Pitfall PP-1: Scope Creep During "Polish" (CRITICAL)

**What goes wrong:** "Polish" becomes "redesign":
- Simple color changes become full theme system
- "Fix this scroll" becomes "rewrite the grid layout"
- "Add animation" becomes "new animation framework"

**Why it happens:** Polish exposes underlying issues that feel urgent to fix.

**Warning signs:**
- PRs growing beyond initial scope
- "While I'm in here, I'll also..." comments
- Phase estimates repeatedly exceeded

**Prevention:**
1. **Strict scope boundaries:** Define exactly what "polish" means for each component
2. **Bug backlog:** Log discovered issues for future phases, don't fix inline
3. **Time-boxed work:** Set hard limits per component/feature
4. **Definition of done:** Clear acceptance criteria before starting

**Phase impact:** All phases need explicit scope boundaries in roadmap

---

### Pitfall PP-2: Breaking Existing Functionality During CSS Refactor (HIGH)

**What goes wrong:** CSS changes have unexpected cascading effects:
- Changing `.poke-border` affects 20+ components
- Removing "unused" class breaks component loaded lazily
- Specificity changes flip expected styles

**Why it happens:** CSS has global scope; changes ripple unpredictably.

**Warning signs:**
- "I only changed X but Y broke"
- Styles working in isolation but not in app context
- Having to add `!important` to make changes stick

**Prevention:**
1. **Visual regression testing:** Use Chromatic/Playwright for screenshot comparison
2. **Component isolation:** Test components in Storybook before integration
3. **Incremental changes:** One class/component per PR, not bulk refactors
4. **CSS modules consideration:** For new components, consider CSS modules for isolation

**Phase impact:** All phases need visual regression testing before merge

**Sources:** [Refactoring CSS Strategy](https://www.smashingmagazine.com/2021/08/refactoring-css-strategy-regression-testing-maintenance-part2/), [Visual Regression Testing](https://www.virtuosoqa.com/post/visual-regression-testing-101)

---

### Pitfall PP-3: Accessibility Regressions (MEDIUM)

**What goes wrong:** Visual polish breaks accessibility:
- Color contrast fails after palette change
- Focus indicators removed for "cleaner" look
- Animations cause issues for vestibular disorders
- Screen reader announcements removed/broken

The codebase has some accessibility support (focus-visible styles, prefers-reduced-motion), but polish can regress this.

**Why it happens:** Accessibility is invisible in visual review.

**Warning signs:**
- Removing outline styles "because they're ugly"
- Using color alone to convey information
- Adding animations without reduced-motion variants

**Prevention:**
1. **Contrast checking:** Verify all color changes meet WCAG AA (4.5:1 for text)
2. **Focus indicators:** Every interactive element must have visible focus state
3. **Reduced motion:** Every animation needs `prefers-reduced-motion` alternative
4. **Automated audits:** Run axe-core on every PR

**Phase impact:** Design System phase should codify accessibility requirements in token definitions

**Sources:** [GeeksforGeeks React Accessibility Mistakes](https://www.geeksforgeeks.org/reactjs/most-common-mistakes-that-react-developers-make/)

---

## Drag-and-Drop Pitfalls

### Pitfall DD-1: Re-render Cascade on Drag (HIGH)

**What goes wrong:** Dragging party Pokemon triggers cascading re-renders:
- Entire party list re-renders on every drag position change
- Zustand store updates propagate to unrelated components
- FPS drops during drag operations

**Why it happens:** React reconciliation treats drag position changes as state updates.

**Warning signs:**
- Laggy drag feel, especially with 6 Pokemon
- React DevTools showing excessive re-renders
- CPU usage spikes during drag

**Prevention:**
1. **Memoize list items:** Use React.memo on `PokemonCard` with stable comparison
2. **Local drag state:** Keep drag position in local state or ref, not global store
3. **Virtualization:** If party grows, consider virtualized list (though 6 is small enough)
4. **CSS transforms:** Move elements with transform during drag, update DOM on drop

**Phase impact:** Drag-to-reorder phase needs careful state management strategy

**Sources:** [React Reorder List Performance](https://www.dhiwise.com/blog/design-converter/effortless-react-reorder-list-a-step-by-step-guide), [Optimize Performance in react-beautiful-dnd](https://egghead.io/lessons/react-optimize-performance-in-react-beautiful-dnd-with-shouldcomponentupdate-and-purecomponent)

---

### Pitfall DD-2: Library Choice Lock-in (MEDIUM)

**What goes wrong:** Choosing wrong DnD library causes rewrite later:
- `react-beautiful-dnd` is deprecated (no longer maintained)
- `react-dnd` has steep learning curve and Redux performance issues
- HTML5 drag API is inconsistent across browsers/touch devices

**Why it happens:** Picking first Google result without evaluating alternatives.

**Prevention:**
1. **Use pragmatic-drag-and-drop or dnd-kit:** Modern, maintained, performant options
2. **Evaluate touch support:** Ensure library works on mobile/tablet
3. **Minimal footprint:** Party reorder is simple; don't over-engineer

**Recommendation:** Use `@atlaskit/pragmatic-drag-and-drop` (4.7kB, battle-tested in Jira/Confluence) or `@dnd-kit/core` (well-maintained, accessible).

**Phase impact:** Drag-to-reorder phase should evaluate library options before implementation

**Sources:** [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)

---

## Idle Game-Specific Pitfalls

### Pitfall IG-1: UI Update Frequency Causing Performance Death (HIGH)

**What goes wrong:** Idle games update continuously. If every tick (1/second) triggers full UI refresh:
- CPU usage stays high even when "idle"
- Battery drain on mobile
- Background tab consumes resources

The codebase processes ticks server-side (good!) but needs to ensure client UI updates efficiently.

**Why it happens:** Natural to update entire UI when game state changes.

**Warning signs:**
- High CPU even when user isn't interacting
- Battery complaints from mobile users
- Performance tools showing constant React renders

**Prevention:**
1. **Selective subscriptions:** Components subscribe to only the state slices they need
2. **Debounce UI updates:** Batch multiple tick updates before rendering
3. **Background throttling:** When tab is hidden, skip UI updates entirely (state keeps updating)
4. **Stale-while-revalidate:** Show last state while processing update

**Phase impact:** All phases should consider idle performance impact

**Sources:** [Industry Idle Performance Optimization](https://ruoyusun.com/2022/01/28/game-pref.html), [CivIdle Optimization](https://ruoyusun.com/2024/01/23/cividle-optimization.html)

---

## Prevention Strategies Summary

| Pitfall ID | Phase | Primary Prevention |
|------------|-------|-------------------|
| DS-1 | Design System | Audit existing tokens before creating new |
| DS-2 | Design System | Test production builds, safelist dynamic classes |
| DS-3 | Design System | Define closed component APIs with explicit variants |
| RD-1 | Responsive | Convert px to relative units systematically |
| RD-2 | Responsive | Maintain desktop-first pattern, don't refactor |
| RD-3 | Responsive | Audit touch targets against 44x44px minimum |
| AN-1 | Animation | Audit transitions for layout-triggering properties |
| AN-2 | Animation | Use refs for animation state, not React state |
| AN-3 | Animation | Keep animations under 800ms (tick budget) |
| RT-1 | Battle System | Extend pendingRewards pattern to all battle state |
| RT-2 | Battle System | Add server timestamps, handle background tabs |
| RT-3 | Battle System | Keep all battle logic server-side |
| PP-1 | All Phases | Define explicit scope boundaries per task |
| PP-2 | All Phases | Visual regression testing before merge |
| PP-3 | All Phases | Automated accessibility audits on PRs |
| DD-1 | Drag-Reorder | Memoize components, local drag state |
| DD-2 | Drag-Reorder | Use pragmatic-drag-and-drop or dnd-kit |
| IG-1 | All Phases | Selective state subscriptions, background throttling |

---

## Confidence Assessment

| Category | Confidence | Rationale |
|----------|------------|-----------|
| Design System Pitfalls | HIGH | Direct codebase analysis + verified sources |
| Responsive Pitfalls | HIGH | Observed patterns in globals.css + best practices |
| Animation Pitfalls | HIGH | Performance principles well-documented |
| Real-Time Battle Pitfalls | HIGH | Existing codebase patterns (pendingRewards) validate approach |
| Polish Pass Pitfalls | MEDIUM | General software patterns, less domain-specific |
| Drag-and-Drop Pitfalls | MEDIUM | Library ecosystem verified, but implementation-specific |
| Idle Game Pitfalls | HIGH | Verified with real-world optimization case studies |

---

## Existing Codebase Strengths to Preserve

The current codebase already has good patterns that should NOT be changed:

1. **Server-authoritative game logic:** `game.ts` handles all battle calculations - KEEP THIS
2. **pendingEncounterRewards pattern:** Defers UI updates until animation completes - EXTEND THIS
3. **prefers-reduced-motion support:** Already respects user accessibility preferences
4. **CSS variables for design tokens:** 66+ variables already defined - MIGRATE, DON'T DUPLICATE
5. **Zustand store organization:** Clear state slices - USE SELECTIVE SUBSCRIPTIONS
6. **focus-visible styling:** Accessibility support for keyboard navigation

---

## Sources

- [Top Mistakes Developers Make When Using React UI Libraries](https://www.sencha.com/blog/top-mistakes-developers-make-when-using-react-ui-component-library-and-how-to-avoid-them/)
- [CSS Variables Gone Wrong: Pitfalls to Watch Out For](https://blog.pixelfreestudio.com/css-variables-gone-wrong-pitfalls-to-watch-out-for/)
- [Debugging Tailwind CSS 4 in 2025](https://medium.com/@sureshdotariya/debugging-tailwind-css-4-in-2025-common-mistakes-and-how-to-fix-them-b022e6cb0a63)
- [Don't Use Tailwind for Your Design System](https://sancho.dev/blog/tailwind-and-design-systems)
- [Common Mistakes to Avoid in Responsive Web Design](https://ecareinfoway.com/blog/common-mistakes-to-avoid-in-responsive-web-design)
- [UXPin Responsive Design Best Practices](https://www.uxpin.com/studio/blog/best-practices-examples-of-excellent-responsive-design/)
- [Optimizing Performance in CSS Animations](https://dev.to/nasehbadalov/optimizing-performance-in-css-animations-what-to-avoid-and-how-to-improve-it-bfa)
- [React Animation Performance](https://stevekinney.com/courses/react-performance/animation-performance)
- [React Animations Still Laggy?](https://medium.com/@CodersWorld99/react-animations-still-laggy-d0a836d4095d)
- [Handling Race Conditions in Real-Time Apps](https://dev.to/mattlewandowski93/handling-race-conditions-in-real-time-apps-49c8)
- [WebSockets in Realtime Gaming](https://pusher.com/blog/websockets-realtime-gaming-low-latency/)
- [Refactoring CSS: Strategy, Regression Testing And Maintenance](https://www.smashingmagazine.com/2021/08/refactoring-css-strategy-regression-testing-maintenance-part2/)
- [Visual Regression Testing 101](https://www.virtuosoqa.com/post/visual-regression-testing-101)
- [React Reorder List Performance](https://www.dhiwise.com/blog/design-converter/effortless-react-reorder-list-a-step-by-step-guide)
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [Game Performance Optimization - Industry Idle](https://ruoyusun.com/2022/01/28/game-pref.html)
- [CivIdle Optimization](https://ruoyusun.com/2024/01/23/cividle-optimization.html)
