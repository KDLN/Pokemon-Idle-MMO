# Phase 15: Theme Exploration - Research

**Researched:** 2026-01-20
**Domain:** UI Theming, Storybook Documentation, CSS Design Patterns
**Confidence:** HIGH

## Summary

This research investigates the technical infrastructure needed to create theme exploration tools: a component showcase in Storybook, a "Pokemon Clean Modern" theme implementation, and a theme comparison toggle at `/theme-compare`.

The codebase already has strong theming foundations: CSS custom properties in `tokens/colors.css`, Tailwind CSS 4 with `@theme` support via `@import "tailwindcss"`, and Storybook 10 with `@storybook/addon-themes` already configured. The primary work involves creating a parallel theme token set that can be swapped via `data-theme` attribute, building showcase MDX pages, and implementing beveled/3D button styling.

**Primary recommendation:** Use CSS custom properties with `[data-theme="modern"]` selector in `@layer base` to define the new theme, keeping the existing token architecture. Use Storybook MDX pages organized by screen context for the showcase. Implement the comparison toggle by swapping `data-theme` on a wrapper element.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Utility CSS with @theme directive | Native CSS variable theming, no config file needed |
| Storybook | v10.1.11 | Component documentation | @storybook/addon-themes already configured |
| @storybook/addon-themes | v10.1.11 | Theme switching in Storybook | Already using withThemeByDataAttribute |
| class-variance-authority | v0.7.1 | Variant-based component styling | Used by Button, Card, Badge |

### Supporting (No Additional Install Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @storybook/addon-docs | v10.1.11 | MDX documentation pages | Already installed, use for showcase pages |
| clsx + tailwind-merge | installed | Class composition | Used via cn() utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS variables | CSS-in-JS (styled-components) | Would require major refactor, no benefit |
| MDX showcase | Separate route | Would duplicate effort, Storybook already exists |
| data-theme attribute | CSS class toggle | data-theme is semantic, matches existing Storybook config |

**No new dependencies needed** - the existing stack fully supports the requirements.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── styles/
│   └── tokens/
│       ├── colors.css           # Base theme (current)
│       ├── colors-modern.css    # NEW: Pokemon Clean Modern theme
│       ├── spacing.css
│       └── typography.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Update: add beveled variants
│   │   └── Button.stories.tsx
│   └── game/
│       └── ... (existing)
├── app/
│   └── theme-compare/
│       └── page.tsx             # NEW: Comparison route
└── .storybook/
    ├── main.ts                  # Update: add showcase paths
    └── preview.ts               # Update: add "modern" theme option

apps/web/src/stories/            # NEW: Showcase MDX pages
├── showcase/
│   ├── BattleUI.mdx
│   ├── InventoryUI.mdx
│   ├── PartyUI.mdx
│   ├── MapUI.mdx
│   ├── SocialUI.mdx
│   └── CoreUI.mdx
```

### Pattern 1: CSS Variable Theme Switching
**What:** Define theme tokens in `:root` and override with `[data-theme="modern"]`
**When to use:** For any themeable design token (colors, shadows, borders)

**Example:**
```css
/* Source: https://simonswiss.com/posts/tailwind-v4-multi-theme */
/* In globals.css or a dedicated theme file */

@layer base {
  :root {
    /* Current theme (default) */
    --color-surface-base: #0f0f1a;
    --color-surface-elevated: #1a1a2e;
    --color-btn-shadow: transparent;
    --color-btn-edge: transparent;
  }

  [data-theme="modern"] {
    /* Pokemon Clean Modern theme */
    --color-surface-base: #1a1f2e;
    --color-surface-elevated: #252d40;
    --color-btn-shadow: hsl(0deg 0% 0% / 0.25);
    --color-btn-edge: linear-gradient(to left, hsl(220deg 60% 25%), hsl(220deg 60% 40%));
    --texture-noise-opacity: 0.04;
  }
}
```

### Pattern 2: Storybook MDX Showcase Page
**What:** MDX page that imports and displays multiple stories grouped by context
**When to use:** For the component showcase requirement

**Example:**
```mdx
// Source: https://storybook.js.org/docs/writing-docs/mdx
{/* apps/web/src/stories/showcase/BattleUI.mdx */}
import { Canvas, Meta, Story } from '@storybook/blocks';
import * as ButtonStories from '../../components/ui/Button.stories';
import * as CardStories from '../../components/ui/Card.stories';
import * as BadgeStories from '../../components/ui/Badge.stories';

<Meta title="Showcase/Battle UI" />

# Battle UI Components

Components used in the battle encounter screen.

## Action Buttons
<Canvas of={ButtonStories.Variants} />

## HP/XP Bars
{/* Import ProgressBar stories when created */}

## Pokemon Cards
<Canvas of={CardStories.Default} />

## Type Badges
<Canvas of={BadgeStories.AllTypes} />
```

### Pattern 3: Theme Toggle Component
**What:** React component that swaps `data-theme` attribute on a wrapper
**When to use:** For the comparison route

**Example:**
```tsx
// apps/web/src/app/theme-compare/page.tsx
'use client'

import { useState } from 'react'
import { GameShell } from '@/components/game/GameShell'

export default function ThemeComparePage() {
  const [theme, setTheme] = useState<'current' | 'modern'>('current')

  return (
    <div className="min-h-screen">
      {/* Toggle control - fixed position */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 rounded-lg p-2">
        <button
          onClick={() => setTheme(t => t === 'current' ? 'modern' : 'current')}
          className="px-4 py-2 bg-white text-black rounded"
        >
          {theme === 'current' ? 'View Modern Theme' : 'View Current Theme'}
        </button>
      </div>

      {/* Themed wrapper */}
      <div data-theme={theme === 'modern' ? 'modern' : undefined}>
        <MockGameScreen />
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Inline theme values:** Don't hardcode colors in components; always use CSS variables
- **Multiple theme providers:** Don't create React context for theming; CSS variables are more performant
- **Separate component trees:** Don't build "Modern" versions of components; same components should work in both themes via CSS
- **ThemeProvider re-renders:** CSS variable approach means only the toggle component re-renders, not the entire tree

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Noise texture generation | Manual PNG creation | SVG feTurbulence filter | Scalable, tiny file size, customizable |
| Theme state management | Custom React context | CSS data-theme attribute | Zero re-renders, works with SSR |
| Component documentation | Custom route | Storybook MDX | Already configured, interactive |
| 3D button depth | Complex box-shadow math | Josh Comeau's layered approach | Proven technique, animatable |
| Storybook theme toggle | Custom addon | @storybook/addon-themes | Already installed and configured |

**Key insight:** The codebase already has theming infrastructure (CSS variables, Storybook addon-themes). The work is adding a second theme definition, not building theming from scratch.

## Common Pitfalls

### Pitfall 1: CSS Specificity Conflicts
**What goes wrong:** New theme styles don't override base styles
**Why it happens:** `@layer base` has lower specificity than utility classes
**How to avoid:**
- Use `@layer base` for theme definitions (existing pattern)
- Theme variables should be used in components, not overridden by utilities
- Test with browser DevTools to verify variable inheritance
**Warning signs:** Theme toggle doesn't change component appearance

### Pitfall 2: Storybook Theme Mismatch
**What goes wrong:** Storybook preview doesn't match app theming
**Why it happens:** Storybook has its own decorators that may not apply data-theme
**How to avoid:**
- Update `.storybook/preview.ts` to include both themes in `withThemeByDataAttribute`
- Ensure globals.css is imported in preview.ts (already done)
**Warning signs:** Components look different in Storybook vs app

### Pitfall 3: Beveled Button Animation Jank
**What goes wrong:** 3D button press animation looks choppy
**Why it happens:** Animating box-shadow is expensive; animating transform is cheap
**How to avoid:**
- Use Josh Comeau's layered approach: shadow, edge, front as separate elements
- Animate only `transform: translateY()` on press
- Use `transition: transform 34ms` for snappy response
**Warning signs:** Button animation feels sluggish or causes layout shifts

### Pitfall 4: Noise Texture Performance
**What goes wrong:** SVG noise filter causes repaint issues
**Why it happens:** Large SVG filters can be expensive on resize
**How to avoid:**
- Use `background-attachment: fixed` for the noise layer
- Apply noise to a pseudo-element, not the element itself
- Keep baseFrequency reasonable (0.5-0.7 range)
**Warning signs:** Page feels slow during scroll or resize

### Pitfall 5: Mock Screen WebSocket Dependency
**What goes wrong:** Theme comparison page crashes without WebSocket connection
**Why it happens:** GameShell components expect live game state
**How to avoid:**
- Create MockGameScreen component with static/mock data
- OR make WebSocket optional with graceful fallbacks
- Consider using Zustand mock state for comparison page
**Warning signs:** "Cannot read property of undefined" errors on theme compare route

## Code Examples

### Beveled/3D Button CSS
```css
/* Source: https://www.joshwcomeau.com/animation/3d-button/ */

/* Button wrapper - transparent background */
.btn-3d {
  position: relative;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  outline-offset: 4px;
  transition: filter 250ms;
}

/* Shadow layer - darkest, moves opposite to press */
.btn-3d-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: hsl(0deg 0% 0% / 0.25);
  transform: translateY(2px);
  transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
}

/* Edge layer - creates 3D depth illusion */
.btn-3d-edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(
    to left,
    hsl(var(--btn-hue) 100% 16%) 0%,
    hsl(var(--btn-hue) 100% 32%) 8%,
    hsl(var(--btn-hue) 100% 32%) 92%,
    hsl(var(--btn-hue) 100% 16%) 100%
  );
}

/* Front layer - main button surface */
.btn-3d-front {
  display: block;
  position: relative;
  padding: 12px 42px;
  border-radius: 12px;
  font-size: 1.25rem;
  color: white;
  background: hsl(var(--btn-hue) 100% 47%);
  transform: translateY(-4px);
  transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
}

/* Press states */
.btn-3d:hover .btn-3d-front {
  transform: translateY(-6px);
  transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
}

.btn-3d:active .btn-3d-front {
  transform: translateY(-2px);
  transition: transform 34ms;
}

.btn-3d:hover .btn-3d-shadow {
  transform: translateY(4px);
  transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
}

.btn-3d:active .btn-3d-shadow {
  transform: translateY(1px);
  transition: transform 34ms;
}
```

### SVG Noise Texture Background
```css
/* Source: https://css-tricks.com/grainy-gradients/ */

/* Define inline SVG noise filter */
.texture-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: var(--texture-noise-opacity, 0.04);
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* Apply to cards/panels */
.card-textured {
  position: relative;
  isolation: isolate; /* Create stacking context for blend mode */
}
```

### Tailwind v4 Multi-Theme Definition
```css
/* Source: https://simonswiss.com/posts/tailwind-v4-multi-theme */
/* apps/web/src/styles/tokens/colors-modern.css */

@layer base {
  [data-theme="modern"] {
    /* Surface colors - slightly warmer, more saturated */
    --color-surface-base: #141820;
    --color-surface-elevated: #1c2230;
    --color-surface-hover: #252d3d;

    /* Brand colors - higher saturation */
    --color-brand-primary: #4B5CDA;
    --color-brand-primary-dark: #3B4CCA;
    --color-brand-primary-light: #6B7EFA;

    /* Pokemon type colors - boosted saturation */
    --color-type-fire: #FF6B35;
    --color-type-water: #4A90E2;
    --color-type-grass: #5CB85C;
    --color-type-electric: #FFD93D;

    /* Button 3D effect tokens */
    --btn-shadow-offset: 4px;
    --btn-edge-visible: 1;

    /* Texture tokens */
    --texture-noise-opacity: 0.04;
    --corner-accent-visible: 1;
  }
}
```

### Storybook Preview Update
```ts
// apps/web/.storybook/preview.ts
import type { Preview } from "@storybook/react";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f1a' },
        { name: 'dark-modern', value: '#141820' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        current: "",       // No data-theme attribute (default)
        modern: "modern",  // data-theme="modern"
      },
      defaultTheme: "current",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js theme | @theme directive in CSS | Tailwind v4 (2024) | Theme defined in CSS, not JS config |
| RGB channel separation | Any color format in @theme | Tailwind v4 (2024) | Much simpler syntax |
| Box-shadow animation | Transform-based 3D buttons | 2022 (Josh Comeau) | Better performance, smoother animation |
| PNG noise textures | SVG feTurbulence | Evergreen | Smaller files, scalable |

**Deprecated/outdated:**
- `tailwind.config.js` for theme extension - still works but CSS-first is preferred
- `@apply` for component styling - CVA/className approach preferred
- ThemeProvider context for color switching - CSS variables more performant

## Open Questions

Things that couldn't be fully resolved:

1. **Sound effect implementation**
   - What we know: Web Audio API or preloaded audio files work
   - What's unclear: Best library for game UI sounds, licensing for sound assets
   - Recommendation: Defer to implementation phase; consider Howler.js if needed

2. **Exact pixel font sizing for modern theme**
   - What we know: Press Start 2P already loaded, used for headers
   - What's unclear: Optimal size for "modern" feel vs current retro size
   - Recommendation: Start with current sizes, adjust during visual review

3. **Mock screen data source**
   - What we know: GameShell needs WebSocket for real data
   - What's unclear: Whether to use real connection or static mock
   - Recommendation: Create MockGameState with representative sample data

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 docs - @theme directive and theming: https://tailwindcss.com/docs/theme
- Storybook MDX documentation: https://storybook.js.org/docs/writing-docs/mdx
- Josh Comeau 3D button tutorial: https://www.joshwcomeau.com/animation/3d-button/

### Secondary (MEDIUM confidence)
- Simon Swiss multi-theme Tailwind v4 post: https://simonswiss.com/posts/tailwind-v4-multi-theme
- CSS-Tricks grainy gradients: https://css-tricks.com/grainy-gradients/

### Tertiary (LOW confidence)
- WebSearch results for general patterns - verified against official docs above

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified all existing dependencies and patterns in codebase
- Architecture: HIGH - Patterns based on official Tailwind v4 and Storybook docs
- Theming: HIGH - CSS variable approach is well-documented and matches existing code
- Beveled buttons: HIGH - Josh Comeau tutorial is comprehensive and production-proven
- Pitfalls: MEDIUM - Based on general CSS theming experience, not project-specific issues

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable domain, no fast-moving dependencies)

---

## Appendix: Existing Codebase Reference

### Current Token Files
- `apps/web/src/styles/tokens/colors.css` - Color tokens with Pokemon type colors
- `apps/web/src/styles/tokens/typography.css` - Font tokens including pixel font
- `apps/web/src/styles/tokens/spacing.css` - Spacing tokens

### Current Storybook Config
- `apps/web/.storybook/main.ts` - Uses `@storybook/nextjs-vite` framework
- `apps/web/.storybook/preview.ts` - Already uses `withThemeByDataAttribute` decorator
- Existing stories: `Button.stories.tsx`, `Card.stories.tsx`, `Badge.stories.tsx`

### Current Fonts (from layout.tsx)
- Outfit (--font-outfit) - Body text
- Press Start 2P (--font-pixel) - Pixel/retro headers

### Game Components to Include in Showcase
Organized by screen context:

**Battle UI:**
- EncounterDisplay, ClassicBattleHud, BattleHud, BattleHudGrid, BattleSceneFrame
- AttackAnimation, FloatingReward

**Party UI:**
- PartyPanel, PokemonCard, PokemonDetailPanel, SortablePartyGrid
- IVGradeBadge, LevelUpToast

**Map UI:**
- InteractiveMap, MapCanvas, ZoneNode, ZoneTooltip, MapControls
- WorldView, BackgroundLayer, TimeOfDayOverlay

**Social UI:**
- ChatSidebar, ChatMessage, ChatInput, ChatTabs
- FriendsList, FriendRequests, TradeModal, TradeRequests

**Inventory/Shop UI:**
- ShopPanel, BoxPanel, PokedexPanel, BoostCard

**Header UI:**
- Header, CurrencyDisplay, BadgeCase, BattlePassProgress

**Core UI (reusable):**
- Button, Card, Badge, ProgressBar, Tooltip
