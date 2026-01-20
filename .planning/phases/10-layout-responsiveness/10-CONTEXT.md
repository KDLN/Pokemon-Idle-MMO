# Phase 10: Layout & Responsiveness - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the game comfortable to use across all device sizes with proper typography and touch targets. Success means: body text at least 16px, 44px minimum touch targets, activity log fits without unnecessary scroll, party shows all 6 Pokemon without scroll on standard viewports, usable on 375px mobile, 768px tablet, 1280px+ desktop.

</domain>

<decisions>
## Implementation Decisions

### Breakpoint strategy
- Mobile-first approach — design for 375px first, enhance for larger screens
- Single column on mobile → multi-column on desktop (stack panels vertically on mobile, side-by-side on desktop)
- Standard Tailwind breakpoints: sm (640px), md (768px), lg (1024px)
- Collapsible panels on mobile — present but collapsed by default
- Default expanded on mobile: Party panel + current zone info; activity log collapsed
- Sticky header on mobile containing zone name + navigation buttons

### Typography scaling
- Fluid scaling using clamp() — smoothly scales between min/max based on viewport
- Minimum body text: 16px (never smaller)
- Maximum body text on desktop: 18px
- Pokemon card typography: Claude's discretion based on card layout

### Component adaptation
- Party panel layout on mobile: Claude's discretion (must fit all 6 with 44px touch targets)
- Activity log format on mobile: Claude's discretion (fits collapsed panel)
- Navigation buttons: Full zone labels always visible (not abbreviated)
- Modals/dialogs: Full screen on mobile, centered modal on desktop
- Map adaptation: Claude's discretion (Phase 13 will address map specifically)
- Shop/inventory layout on mobile: Claude's discretion (must meet touch targets)
- Guild panels on mobile: Claude's discretion based on content density
- No max-width constraint — use full available width on large screens

### Touch vs mouse
- No hover effects on touch devices — use `@media (hover: hover)` for hover states
- 44px minimum touch target on ALL interactive elements (strict)
- Touch-specific gestures: Claude's discretion where they clearly improve UX
- Distinct visual feedback: ripple/press effects on touch, hover transitions on mouse

### Claude's Discretion
- Party panel mobile layout (2x3 grid, horizontal scroll, or vertical list)
- Activity log compact format
- Map mobile adaptation
- Shop/inventory grid vs list
- Guild panel tabs vs accordion
- Pokemon card typography sizing
- Where to add touch gestures if beneficial

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following mobile-first best practices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-layout-responsiveness*
*Context gathered: 2026-01-19*
