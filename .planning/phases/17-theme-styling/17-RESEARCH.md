# Phase 17: Theme Styling - Research

**Researched:** 2026-01-21
**Domain:** CSS theming, design tokens, visual polish
**Confidence:** HIGH

## Summary

Phase 17 applies the Modern theme from MockGameScreen to the production game. The codebase already has extensive theming infrastructure in place:

- **Modern theme tokens** exist in `colors-modern.css` with `[data-theme="modern"]` selector
- **Beveled button system** fully implemented with `button-3d.css` and `BeveledButton` component
- **Noise texture utility** ready via `.texture-noise` class
- **Glass effect** available via `.glass` class
- **Pixel font** (Press Start 2P) loaded via Next.js font system

The task is **migration, not creation**. MockGameScreen demonstrates the target aesthetic — planning must identify which production components need which styling updates to match that reference.

**Primary recommendation:** Apply Modern theme globally by adding `data-theme="modern"` to root element, then systematically update components to use texture-noise, BeveledButton where appropriate, and adjust any hardcoded colors to use CSS variables.

## Standard Stack

The project uses an established stack for theming. No new libraries needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.x | Utility-first CSS framework | Industry standard, v4 uses CSS-first configuration with `@theme` directive |
| CSS Variables | Native | Design tokens system | Modern browser support, runtime theming without rebuild |
| Next.js Font | 15.x | Font optimization | Built into Next.js, auto-optimization for Google Fonts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority (CVA) | - | Component variant styling | Already used for Button and Card components |
| cn() utility | - | Tailwind class merging | Already implemented, used throughout codebase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Variables | Tailwind @theme | Project already uses CSS variables successfully; migration would be disruptive |
| Press Start 2P | Other pixel fonts | Press Start 2P is authentic retro aesthetic, already loaded |
| Custom button CSS | Pure Tailwind | 3D beveled effect requires layered DOM structure, CSS approach is cleaner |

**Installation:**
```bash
# No new packages needed - all infrastructure exists
```

## Architecture Patterns

### Current Theme System Structure
```
apps/web/src/
├── styles/
│   ├── tokens/
│   │   ├── colors.css              # Base theme tokens
│   │   ├── colors-modern.css       # Modern theme overrides ([data-theme="modern"])
│   │   ├── typography.css          # Font size/weight/spacing tokens
│   │   └── spacing.css             # Spacing tokens
│   ├── button-3d.css               # Beveled button styling (Josh Comeau inspired)
│   └── noise-texture.css           # SVG noise texture utility
├── app/
│   ├── globals.css                 # Global styles, imports all token files
│   └── layout.tsx                  # Font loading (Outfit + Press Start 2P)
└── components/
    ├── ui/
    │   ├── Button.tsx              # Button + BeveledButton components
    │   └── Card.tsx                # Card with glass/default/bordered variants
    └── game/
        └── MockGameScreen.tsx      # Reference implementation of target theme
```

### Pattern 1: Theme Toggle via data-theme Attribute
**What:** Root-level attribute that triggers CSS variable overrides
**When to use:** Enable Modern theme globally or per-component basis
**Example:**
```tsx
// Source: apps/web/src/app/theme-compare/page.tsx
<div data-theme={theme === 'modern' ? 'modern' : undefined}>
  <MockGameScreen />
</div>
```

CSS responds automatically:
```css
/* Source: apps/web/src/styles/tokens/colors-modern.css */
[data-theme="modern"] {
  --color-surface-base: #141820;
  --color-brand-primary: #4B5CDA;
  --texture-noise-opacity: 0.04;
  /* ...more overrides */
}
```

### Pattern 2: Beveled Button Component
**What:** Three-layer button structure (shadow/edge/front) for physical 3D appearance
**When to use:** Primary action buttons, prominent CTAs, retro-styled interactions
**Example:**
```tsx
// Source: apps/web/src/components/ui/Button.tsx
<BeveledButton hue={120} saturation={60} lightness={40}>
  Search Area
</BeveledButton>

// Renders as:
<button className="btn-3d" style={{ --btn-hue: 120, ... }}>
  <span className="btn-3d-shadow" />
  <span className="btn-3d-edge" />
  <span className="btn-3d-front">Search Area</span>
</button>
```

**Color mapping:**
- Green (confirm): `hue={120}`
- Blue (neutral): `hue={200-240}`
- Red (destructive): `hue={0}`

### Pattern 3: Texture Noise Application
**What:** SVG-based fractal noise overlay for tactile card/panel backgrounds
**When to use:** Most cards and panels per phase requirements
**Example:**
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx
<div className="texture-noise p-2 rounded-lg bg-[var(--color-surface-elevated)]">
  {/* Card content */}
</div>
```

CSS implementation:
```css
/* Source: apps/web/src/styles/noise-texture.css */
.texture-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise filter */
  opacity: var(--texture-noise-opacity, 0);
  mix-blend-mode: overlay;
}
```

### Pattern 4: Glass Effect (Header Only)
**What:** Semi-transparent backdrop with blur
**When to use:** Header only per phase requirements; sidebars use solid surfaces
**Example:**
```tsx
// Source: apps/web/src/components/game/Header.tsx
<div className="glass border-b border-[#2a2a4a] px-4 py-2">
  {/* Header content */}
</div>
```

CSS:
```css
/* Source: apps/web/src/app/globals.css */
.glass {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

### Pattern 5: Type-Colored Pokemon Cards
**What:** Pokemon cards with type color as background overlay
**When to use:** All Pokemon card displays
**Example:**
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx
<div className="w-full aspect-square rounded-lg bg-[var(--color-surface-base)] relative overflow-hidden">
  <div
    className="absolute inset-0 opacity-20"
    style={{ backgroundColor: TYPE_COLORS[pokemon.type] }}
  />
  <img src={sprite} className="relative z-10" />
</div>
```

### Pattern 6: Pixel Font Headers
**What:** Press Start 2P font for section headers
**When to use:** Section headers throughout the game
**Example:**
```tsx
// Source: apps/web/src/components/ui/Card.tsx
<h2 className="font-pixel text-[10px] sm:text-xs text-white tracking-wider uppercase">
  {title}
</h2>
```

Font loading:
```tsx
// Source: apps/web/src/app/layout.tsx
import { Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});
```

### Anti-Patterns to Avoid
- **Hardcoded colors:** Always use CSS variables (`var(--color-*)`) instead of hex codes
- **Inline `data-theme` per component:** Apply theme globally at root, not per-component
- **Mixing button styles:** Don't mix BeveledButton and regular Button in same context — choose one approach
- **Applying glass effect broadly:** Glass is header-only; sidebars/modals use solid backgrounds
- **Texture noise on interactive elements:** Apply to containers, not buttons/inputs directly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D button effect | Custom transforms/shadows | `button-3d.css` + `BeveledButton` | Josh Comeau's technique handles hover/active states, accessibility, and browser quirks |
| Tactile texture | Image files | `.texture-noise` class with SVG | SVG is scalable, no HTTP request, opacity controlled via CSS variable |
| Theme switching | Manual class swapping | `data-theme` attribute + CSS cascade | Automatic via CSS specificity, no JS state management needed |
| Pixel font sizing | Manual rem calculations | Typography tokens | `--font-size-pixel-*` tokens are exempt from 16px minimum, designed for retro aesthetic |
| Type color mapping | Component-level constants | CSS variables | `--color-type-*` tokens already defined for all 18 Pokemon types |

**Key insight:** The codebase has mature theming utilities. Resist the urge to rebuild — use what exists and extend only if gaps found.

## Common Pitfalls

### Pitfall 1: Forgetting CSS Variable Fallbacks
**What goes wrong:** CSS variables used in inline styles break when theme not applied
**Why it happens:** `style={{ backgroundColor: 'var(--color-surface-base)' }}` fails if variable undefined
**How to avoid:** Always use CSS variables via Tailwind classes (`bg-[var(--color-surface-base)]`) which handle fallbacks
**Warning signs:** Flash of unstyled content, missing backgrounds in development

### Pitfall 2: Applying texture-noise Without position: relative
**What goes wrong:** Noise overlay covers clickable elements
**Why it happens:** `.texture-noise::before` uses `position: absolute` with `inset: 0`
**How to avoid:** Parent must have `position: relative` or `isolation: isolate` per CSS
**Warning signs:** Buttons/inputs unclickable, hover states broken

### Pitfall 3: Overriding BeveledButton Structure
**What goes wrong:** Button animation breaks when child spans modified
**Why it happens:** Effect relies on specific DOM structure: `<button><shadow /><edge /><front /></button>`
**How to avoid:** Never add classes to inner spans; customize via CSS variables (`--btn-hue`, etc.)
**Warning signs:** Button doesn't lift on hover, shadow doesn't separate

### Pitfall 4: Inconsistent Theme Boundary
**What goes wrong:** Some components show Modern theme, others don't
**Why it happens:** Theme applied to child element instead of root
**How to avoid:** Apply `data-theme="modern"` to `<body>` or root `<div>` in layout
**Warning signs:** Mismatched colors between header and sidebars

### Pitfall 5: Text Too Small on Pixel Font
**What goes wrong:** Pixel font illegible at small sizes
**Why it happens:** Pixel fonts designed for specific sizes; scaling breaks pixel grid
**How to avoid:** Use `--font-size-pixel-*` tokens (8px/10px/12px) — never arbitrary sizes
**Warning signs:** Blurry text, hard-to-read headers

### Pitfall 6: Type Colors Not Readable
**What goes wrong:** Text on type-colored backgrounds has poor contrast
**Why it happens:** Some type colors (yellow, ice) are light; white text disappears
**How to avoid:** Use `--color-type-*-dark` variants for backgrounds when displaying text, or use type color as accent with dark background
**Warning signs:** User reports unreadable Pokemon type labels

## Code Examples

Verified patterns from the codebase:

### Apply Modern Theme Globally
```tsx
// Source: apps/web/src/app/theme-compare/page.tsx
export default function ThemeComparePage() {
  return (
    <div data-theme="modern">
      <GameShell />
    </div>
  )
}
```

### Card with Noise Texture
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 422)
<div className="texture-noise p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-bright)] transition-colors cursor-pointer group">
  {/* Card content */}
</div>
```

### Beveled Action Button
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 388)
<BeveledButton hue={120} saturation={60} lightness={40}>
  Search Area
</BeveledButton>
```

### Section Header with Pixel Font
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 591)
<div className="flex items-center gap-2 mb-2">
  <span>⚡</span>
  <span className="text-xs font-pixel text-[var(--color-text-primary)] uppercase tracking-wider">
    Boosts
  </span>
</div>
```

### Pokemon Card with Type Background
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 424)
<div className="w-full aspect-square rounded-lg bg-[var(--color-surface-base)] mb-2 flex items-center justify-center relative overflow-hidden">
  <div
    className="absolute inset-0 opacity-20"
    style={{ backgroundColor: TYPE_COLORS[pokemon.type] }}
  />
  <img
    src={getPokemonSpriteUrl(pokemon.speciesId)}
    alt={pokemon.nickname}
    className="w-14 h-14 object-contain pixelated group-hover:scale-110 transition-transform"
    style={{ imageRendering: 'pixelated' }}
  />
</div>
```

### Sidebar with Vertical Gradient
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 267)
<div className="h-full bg-[var(--color-surface-elevated)] border-r border-[var(--color-border-subtle)] p-3 flex flex-col gap-3 overflow-y-auto">
  {/* Sidebar content */}
</div>
```

Note: Vertical gradient mentioned in requirements may need implementation — not currently in codebase.

### Ambient Particles (Zone View)
```tsx
// Source: apps/web/src/components/game/MockGameScreen.tsx (line 398)
<div className="absolute top-10 left-10 w-1 h-1 rounded-full bg-green-300/50 animate-pulse" />
<div className="absolute top-20 right-16 w-1.5 h-1.5 rounded-full bg-yellow-300/40 animate-pulse" />
<div className="absolute bottom-24 left-20 w-1 h-1 rounded-full bg-green-400/50 animate-pulse" />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript config (`tailwind.config.js`) | CSS-first with `@theme` directive | Tailwind v4 (2024) | Design tokens live in CSS, no context switching |
| Manually coded theme toggle | `data-theme` attribute cascade | Industry standard (2023+) | Simpler implementation, CSS handles switching |
| Image-based textures | SVG data URIs | Modern practice | No HTTP requests, scalable, controllable via CSS |
| Flat button styles | Layered 3D buttons | Josh Comeau pattern (2021) | Retro aesthetic, better feedback |
| Single theme | Modern theme as opt-in | Phase 17 decision | Gradual migration path, backwards compatible |

**Deprecated/outdated:**
- **Hardcoded colors in components:** Phase 17 moves all colors to CSS variables for consistency
- **Mixed font sizing:** Typography tokens now standardized with minimum 12px for body text

## Open Questions

Things that couldn't be fully resolved:

1. **Zone-aware accent colors**
   - What we know: Phase context says "Claude's discretion" on zone-aware vs unified palette
   - What's unclear: Do different zone types (forest/town/route) need different accent colors?
   - Recommendation: Start with unified palette from Modern theme; add zone colors only if user feedback suggests it enhances immersion

2. **Sidebar vertical gradient implementation**
   - What we know: Phase requirements mention "sidebars have subtle vertical gradient (slightly darker at bottom)"
   - What's unclear: MockGameScreen uses solid `bg-[var(--color-surface-elevated)]` — gradient not implemented yet
   - Recommendation: Add CSS gradient to sidebar backgrounds: `bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-base)]`

3. **Card border context-based rules**
   - What we know: Phase context says "decide based on context (interactive vs static)"
   - What's unclear: Exact rules for when borders should be visible/bright
   - Recommendation: Interactive cards (clickable) get `hover:border-[var(--color-border-bright)]`, static cards use subtle borders

4. **Modal backdrop preference**
   - What we know: Phase context says "blur vs dark overlay based on performance/visual impact"
   - What's unclear: No performance testing done on backdrop-filter across devices
   - Recommendation: Use dark overlay (`bg-black/60`) by default; blur only if user requests and performance acceptable

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - All CSS files, components, and theme implementation examined directly
- `apps/web/src/styles/tokens/colors-modern.css` - Modern theme token definitions
- `apps/web/src/styles/button-3d.css` - Beveled button implementation (Josh Comeau technique)
- `apps/web/src/styles/noise-texture.css` - Texture utility class
- `apps/web/src/components/ui/Button.tsx` - BeveledButton component
- `apps/web/src/components/game/MockGameScreen.tsx` - Reference implementation of target aesthetic
- `apps/web/src/app/theme-compare/page.tsx` - Theme toggle implementation

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4.0 - Official Blog](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first configuration approach
- [Theme variables - Tailwind CSS Docs](https://tailwindcss.com/docs/theme) - @theme directive documentation
- [Tailwind CSS 4 @theme Guide - Medium](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06) - Design tokens best practices

### Tertiary (LOW confidence)
- None - all findings verified from codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in use, versions confirmed from package.json and imports
- Architecture: HIGH - Patterns extracted from working components in codebase
- Pitfalls: MEDIUM - Inferred from common CSS pitfalls and component structure; not all tested empirically

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (60 days) - CSS patterns stable; Tailwind 4 mature; no rapid changes expected

---

**Ready for planning.** All theme infrastructure exists. Planning phase should focus on systematic component updates rather than building new utilities.
