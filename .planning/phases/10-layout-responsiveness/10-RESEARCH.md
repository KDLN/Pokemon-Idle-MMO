# Phase 10: Layout & Responsiveness - Research

**Researched:** 2026-01-19
**Domain:** Responsive design, typography scaling, touch targets, mobile-first layouts
**Confidence:** HIGH

## Summary

The codebase has a solid foundation for responsive design but has specific issues that need addressing. The typography token system defaults to a 14px body text (`--font-size-base: 0.875rem`), which violates the 16px minimum requirement. Touch targets are partially addressed via a CSS media query for `(hover: none)` but need verification across all interactive elements. The 3-column game layout (`GameShell.tsx`) already has mobile breakpoints at 1024px and 640px, but the party panel and activity log need refinement to meet the "fit without scroll" requirements.

Tailwind CSS 4.1.18 is already installed and supports CSS-native configuration. The CONTEXT.md decisions mandate mobile-first design, fluid typography via clamp(), and strict 44px touch targets. The existing design token system (Phase 9) provides a good foundation for responsive tokens.

**Primary recommendation:** Establish responsive typography tokens using clamp(), audit all interactive elements for 44px touch targets, optimize party panel for 6-Pokemon display, and implement collapsible panels with proper mobile UX.

## Current State Analysis

### Typography Audit

Current typography tokens in `apps/web/src/styles/tokens/typography.css`:

| Token | Current Value | Pixels | Status |
|-------|--------------|--------|--------|
| `--font-size-xs` | 0.625rem | 10px | VIOLATION - below 16px |
| `--font-size-sm` | 0.75rem | 12px | VIOLATION - below 16px |
| `--font-size-base` | 0.875rem | 14px | VIOLATION - below 16px |
| `--font-size-md` | 1rem | 16px | OK |
| `--font-size-lg` | 1.125rem | 18px | OK |
| `--font-size-pixel-xs` | 0.5rem | 8px | Exempt (pixel font) |
| `--font-size-pixel-sm` | 0.625rem | 10px | Exempt (pixel font) |
| `--font-size-pixel-base` | 0.75rem | 12px | Exempt (pixel font) |

**Body text sources requiring update:**
1. `globals.css` - Many hardcoded font sizes (`text-xs`, `text-sm`, `text-[10px]`, `text-[11px]`)
2. `WorldLog.tsx` - Uses `text-sm` (14px), `text-[10px]`, `text-xs`
3. `PokemonCard.tsx` - Uses `text-xs` (12px), `text-[10px]`
4. `Header.tsx` - Uses `text-xs`, `text-[9px]`
5. `ChatMessage.tsx`, `FriendsList.tsx` - Uses small text sizes

**Decision from CONTEXT.md:** Fluid typography using clamp() with 16px minimum, 18px maximum for body text.

### Touch Target Audit

Current touch target handling in `globals.css`:
```css
@media (hover: none) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

**Elements needing explicit verification:**

| Component | Current Size | Touch Target Status |
|-----------|--------------|---------------------|
| Button sm | `px-3 py-1.5 text-xs` | Likely < 44px |
| Button md | `px-4 py-2 text-sm` | May be < 44px |
| Button icon | `w-10 h-10` (40px) | VIOLATION |
| Travel buttons | `padding: 10px 12px` | Needs verification |
| Map dots | 8px-12px diameter | VIOLATION |
| Close buttons | `w-8 h-8` (32px) | VIOLATION |
| Quantity controls | `w-7 h-7` (28px) | VIOLATION |
| Tab buttons | Variable padding | Needs verification |

**Decision from CONTEXT.md:** 44px minimum on ALL interactive elements (strict).

### Activity Log Analysis

`WorldLog.tsx` implementation:
- Fixed height: `h-32` (128px)
- Scroll behavior: Always shows scrollbar via `overflow-y-auto`
- Contains header (28px) + padding, leaving ~100px for entries
- Each entry is ~60px tall with padding
- **Issue:** With few entries (1-2), unnecessary scroll appears

**Decision from CONTEXT.md:** Activity log collapsed by default on mobile; fits available space without unnecessary scroll.

### Party Panel Analysis

`PartyPanel.tsx` and `PokemonCard.tsx`:
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-2`
- Card minimum height: `min-h-[120px] sm:min-h-[180px]`
- 6 Pokemon at 120px each = 720px minimum (3 rows x 2 cols)
- On mobile (375px width), cards need to fit

**Decision from CONTEXT.md:** Party panel always expanded on mobile; Claude's discretion on layout (2x3 grid, horizontal scroll, or vertical list).

**Recommendation:** 2x3 grid with 44px minimum touch target on each card.

### Game Screen Breakpoints

Current breakpoints in `GameShell.tsx` and `globals.css`:
- Mobile: `@media (max-width: 1024px)` - Single column, mobile tab bar
- Small mobile: `@media (max-width: 640px)` - Tighter spacing
- Desktop: 3-column grid (260px | 1fr | 340px)

**Target viewports from requirements:**
- Mobile: 375px width (LAYOUT-05)
- Tablet: 768px width (LAYOUT-06)
- Desktop: 1280px+ width (LAYOUT-07)

**Current Tailwind breakpoints in use:**
- `sm:` = 640px
- `md:` = 768px (tablet)
- `lg:` = 1024px

**Decision from CONTEXT.md:** Standard Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px).

## Standard Stack

The established patterns for responsive design with Tailwind CSS 4:

### Core Techniques
| Technique | Purpose | Why Standard |
|-----------|---------|--------------|
| CSS clamp() | Fluid typography scaling | Browser-native, no JS, smooth scaling |
| Tailwind breakpoint prefixes | Responsive layouts | Mobile-first, declarative, well-documented |
| CSS custom properties | Responsive tokens | Can be updated per breakpoint |
| Container queries | Component-level responsiveness | CSS-native, better than media queries for components |

### Supporting Libraries (Already Installed)
| Library | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 4.1.18 | Responsive utilities, breakpoints |
| @tailwindcss/postcss | 4.1.18 | CSS processing |

### Tailwind CSS 4 Responsive Patterns

**Breakpoint configuration** (CSS-based in Tailwind 4):
```css
@theme {
  --breakpoint-xs: 375px;   /* Mobile (add) */
  --breakpoint-sm: 640px;   /* Small tablet */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
}
```

**Fluid typography with clamp():**
```css
--font-size-body: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
/* 16px min, scales to 18px max */
```

## Architecture Patterns

### Recommended Token Updates

```css
/* typography.css - responsive updates */
:root {
  /* Body text: 16px min to 18px max */
  --font-size-body: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);

  /* Small text: 14px min (allowed for secondary info) to 16px */
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.4vw, 1rem);

  /* Captions/labels: 12px min to 14px (smallest allowed) */
  --font-size-caption: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);

  /* Headings scale more dramatically */
  --font-size-h1: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --font-size-h2: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
}
```

### Recommended Touch Target Pattern

```css
/* Base touch target utility */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* For inline elements that need expansion */
.touch-target-inline {
  position: relative;
}
.touch-target-inline::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
}
```

### Recommended Project Structure for Responsive Tokens

```
apps/web/src/
├── styles/
│   └── tokens/
│       ├── colors.css        # Existing
│       ├── spacing.css       # Existing
│       ├── typography.css    # Update with clamp()
│       └── breakpoints.css   # NEW: custom breakpoints
└── app/
    └── globals.css           # Import breakpoints.css
```

### Pattern 1: Mobile-First Collapsible Panel

**What:** Panels that collapse on mobile with accessible toggle
**When to use:** Activity log, secondary information panels

```tsx
// Accessible collapsible pattern
function CollapsiblePanel({
  title,
  children,
  defaultExpanded = false
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 touch-target"
      >
        <span className="font-medium">{title}</span>
        <ChevronIcon className={cn("transition-transform", expanded && "rotate-180")} />
      </button>
      <div
        id={contentId}
        className={cn(
          "transition-all duration-200 overflow-hidden",
          expanded ? "max-h-[500px]" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

### Pattern 2: Responsive Grid with Touch Targets

**What:** Grid that maintains touch targets at all sizes
**When to use:** Party panel, inventory grids

```tsx
// Party grid that ensures 44px touch targets
<div className={cn(
  "grid gap-2",
  "grid-cols-2",        // 2 columns on mobile
  "sm:grid-cols-3",     // 3 columns on tablet
  "lg:grid-cols-2"      // 2 columns in sidebar
)}>
  {party.map((pokemon, index) => (
    <button
      key={pokemon?.id ?? `slot-${index}`}
      className="min-h-[100px] touch-target"  // Explicit touch target
      onClick={() => selectPokemon(index)}
    >
      {pokemon ? <PokemonCard pokemon={pokemon} /> : <EmptySlot />}
    </button>
  ))}
</div>
```

### Pattern 3: Hover-Only Effects

**What:** Hover styles only on devices with hover capability
**When to use:** All hover interactions

```css
/* Apply hover only on devices that support it */
@media (hover: hover) {
  .hover-effect:hover {
    transform: scale(1.02);
    box-shadow: 0 0 20px var(--color-brand-primary);
  }
}

/* Touch feedback for non-hover devices */
@media (hover: none) {
  .hover-effect:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
```

### Anti-Patterns to Avoid

- **Fixed pixel font sizes:** Use clamp() or responsive tokens
- **Hover-only interactions:** Always provide touch/click alternative
- **Assuming viewport size:** Use container queries where appropriate
- **Nested scrolling regions:** Confusing on mobile, avoid when possible
- **Small close buttons:** Always maintain 44px touch target

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fluid typography | Multiple breakpoint font sizes | CSS clamp() | Smooth scaling, less code |
| Touch target expansion | Manual padding calculation | `min-height`/`min-width` | More reliable, CSS-native |
| Viewport detection | `window.innerWidth` | CSS media queries + `@media` | No JS, no flash |
| Panel collapse | Custom animation | `max-height` transition or details/summary | Native accessibility |
| Breakpoint values | Hardcoded pixels | Tailwind theme variables | Centralized, maintainable |

**Key insight:** CSS is now capable of handling most responsive patterns natively. Reserve JS for interaction logic, not layout adaptation.

## Common Pitfalls

### Pitfall 1: Font Size Below Minimum on Zoom
**What goes wrong:** Text that meets 16px minimum breaks at browser zoom levels
**Why it happens:** Using `rem` but root font size is overridden
**How to avoid:** Never override root `font-size`; test at 200% zoom
**Warning signs:** Text too small on zoomed browsers, accessibility complaints

### Pitfall 2: Touch Targets Overlapping
**What goes wrong:** Expanded touch targets (44px) overlap adjacent elements
**Why it happens:** `min-width`/`min-height` without proper spacing
**How to avoid:** Ensure grid gaps accommodate touch targets: `gap-3` minimum (12px)
**Warning signs:** Wrong button triggered on tap

### Pitfall 3: Horizontal Scroll on Mobile
**What goes wrong:** Page scrolls horizontally on 375px viewport
**Why it happens:** Fixed-width elements, content overflow
**How to avoid:** Set `max-width: 100%` on containers; use `overflow-x-hidden` on body
**Warning signs:** White space on right side when scrolling

### Pitfall 4: Collapsible Panel Animation Jank
**What goes wrong:** Content jumps during collapse animation
**Why it happens:** Using `height: auto` to `height: 0` (not animatable)
**How to avoid:** Use `max-height` with a large enough value, or use CSS Grid animation
**Warning signs:** Choppy panel open/close

### Pitfall 5: Inconsistent Touch Feedback
**What goes wrong:** Some buttons have visual feedback, others don't
**Why it happens:** Missing `:active` styles on touch devices
**How to avoid:** Global touch feedback style:
```css
@media (hover: none) {
  button:active, [role="button"]:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
```
**Warning signs:** Buttons feel unresponsive on mobile

### Pitfall 6: Activity Log Fixed Height Wastes Space
**What goes wrong:** Activity log has fixed height even with 1 entry
**Why it happens:** Using `h-32` (fixed height) instead of responsive height
**How to avoid:** Use `max-h-[200px]` with `flex-shrink` to allow growth/shrink
**Warning signs:** Empty space below few log entries

## Code Examples

### Fluid Typography Implementation
```css
/* apps/web/src/styles/tokens/typography.css */
:root {
  /* Fluid body text: 16px at 375px viewport, 18px at 1280px+ */
  --font-size-body: clamp(1rem, calc(0.9375rem + 0.3125vw), 1.125rem);

  /* Fluid small text: 14px to 16px (for secondary info) */
  --font-size-sm: clamp(0.875rem, calc(0.8125rem + 0.3125vw), 1rem);

  /* Pixel font stays fixed (intentionally small) */
  --font-size-pixel-sm: 0.625rem;  /* 10px - intentional for retro style */
}
```

### Button Component with Touch Targets
```tsx
// Button size variants ensuring 44px touch targets
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "min-h-[44px]",  // Ensure touch target
  ],
  {
    variants: {
      size: {
        sm: "px-3 py-2 text-sm min-w-[44px]",   // py-2 = 8px, ensures height
        md: "px-4 py-2.5 text-base min-w-[44px]",
        lg: "px-6 py-3 text-lg min-w-[44px]",
        icon: "w-11 h-11",  // 44px
      },
    },
  }
);
```

### Party Panel Responsive Grid
```tsx
// PartyPanel.tsx - Responsive grid that fits 6 Pokemon
<div className={cn(
  "grid gap-2",
  "grid-cols-2",           // Mobile: 2x3 grid
  "xs:grid-cols-3",        // Small mobile: 3x2 grid (wider cards)
  "lg:grid-cols-2",        // Desktop sidebar: 2x3 grid
  "auto-rows-fr"           // Equal row heights
)}>
  {party.map((pokemon, index) => (
    <PokemonCard
      key={pokemon?.id ?? `slot-${index}`}
      pokemon={pokemon}
      className="min-h-[90px] sm:min-h-[120px]"  // Smaller on mobile to fit
    />
  ))}
</div>
```

### Activity Log with Flex-Based Height
```tsx
// WorldLog.tsx - Fits content without unnecessary scroll
<div className={cn(
  "flex flex-col",
  "min-h-[80px]",    // Minimum when few entries
  "max-h-[200px]",   // Maximum before scroll
)}>
  <div className="flex-1 overflow-y-auto">
    {entries.length === 0 ? (
      <EmptyState />
    ) : (
      entries.map(entry => <LogEntry key={entry.id} entry={entry} />)
    )}
  </div>
</div>
```

### Modal Full-Screen on Mobile
```tsx
// Modal pattern - full screen on mobile, centered on desktop
<div className={cn(
  "fixed z-50",
  // Mobile: full screen
  "inset-0",
  // Desktop: centered modal
  "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
  "md:w-full md:max-w-2xl md:max-h-[85vh]",
  "md:rounded-2xl"
)}>
  {children}
</div>
```

## Risk Areas

### High Risk: Typography Migration
**Risk:** Changing font sizes may break existing layouts
**Mitigation:**
1. Update tokens first, let components inherit
2. Test each major component after change
3. Keep pixel font exempt (intentionally small)

### Medium Risk: Touch Target Expansion
**Risk:** 44px minimum may cause layout overflow
**Mitigation:**
1. Audit all interactive elements first
2. Increase grid gaps to accommodate
3. Use `min-h` instead of fixed `h` to allow growth

### Medium Risk: Activity Log Height
**Risk:** Dynamic height may cause layout shift
**Mitigation:**
1. Use `min-h` and `max-h` constraints
2. Transition height changes smoothly
3. Test with 0, 1, 5, 50 entries

### Low Risk: Breakpoint Changes
**Risk:** Adding xs breakpoint (375px) may conflict with existing styles
**Mitigation:**
1. xs is additive, doesn't change existing breakpoints
2. Test on actual 375px device (iPhone SE)

## Recommended Plan Breakdown

Based on the research and CONTEXT.md decisions:

### Plan 10-01: Responsive Typography System
- Add fluid typography tokens with clamp()
- Update existing typography tokens to meet 16px minimum
- Create responsive token documentation

### Plan 10-02: Touch Target Standardization
- Audit all interactive elements
- Update Button component sizes
- Update map dots, close buttons, quantity controls
- Add global touch target utilities

### Plan 10-03: Party Panel Optimization
- Implement responsive grid for 6 Pokemon
- Ensure cards fit without scroll on standard viewports
- Add compact card variant for mobile

### Plan 10-04: Activity Log Responsiveness
- Implement flex-based height (min/max)
- Add collapsible behavior on mobile
- Remove fixed height, allow content-based sizing

### Plan 10-05: Modal Full-Screen Mobile
- Update modal components for full-screen on mobile
- Centered modal on desktop
- Test on all target viewports

### Plan 10-06: Viewport Testing & Polish
- Test all screens at 375px, 768px, 1280px
- Fix any overflow or layout issues
- Verify hover-only effects don't break touch

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) - Breakpoint system, mobile-first approach
- [CSS clamp() MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) - Fluid typography function
- [WCAG Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) - 44px minimum specification

### Secondary (MEDIUM confidence)
- [Fluid Typography Tricks](https://tryhoverify.com/blog/fluid-typography-tricks-scaling-text-seamlessly-across-devices-with-tailwind-and-css-clamp/) - clamp() with Tailwind patterns
- [Tailwind CSS clamp() Guide](https://dev.to/rowsanali/how-to-use-tailwind-css-with-the-clamp-function-for-responsive-designs-2pn) - Implementation examples

### Codebase Analysis (HIGH confidence)
- `apps/web/src/styles/tokens/typography.css` - Current typography tokens
- `apps/web/src/app/globals.css` - Current responsive styles and touch targets
- `apps/web/src/components/game/GameShell.tsx` - Current layout implementation
- `apps/web/src/components/game/PartyPanel.tsx` - Party layout analysis
- `apps/web/src/components/game/interactions/WorldLog.tsx` - Activity log implementation
- `.planning/phases/10-layout-responsiveness/10-CONTEXT.md` - User decisions

## Metadata

**Confidence breakdown:**
- Typography patterns: HIGH - CSS clamp() is well-documented, widely supported
- Touch targets: HIGH - WCAG standard, CSS-native solution
- Layout patterns: HIGH - Tailwind responsive utilities are well-documented
- Pitfalls: MEDIUM - Based on common issues, may have project-specific edge cases

**Research date:** 2026-01-19
**Valid until:** 60 days (stable CSS patterns, well-documented Tailwind features)
