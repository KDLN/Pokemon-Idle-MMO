# Phase 9: Design System - Research

**Researched:** 2026-01-19
**Domain:** Design tokens, Storybook, CVA component patterns
**Confidence:** HIGH

## Summary

The project has a solid foundation with 69 CSS custom properties already defined in `globals.css`, a well-structured `lib/ui/index.ts` with design tokens and utility functions, and three core UI components (Button, Card, Badge) that already use variant patterns. The current implementation follows good practices but can be enhanced with CVA (class-variance-authority) for type-safe variants and documented in Storybook.

Storybook 10 is the current version, offering ESM-only distribution with faster builds via the Vite-based framework (`@storybook/nextjs-vite`). This framework is recommended for Next.js 16 projects and supports React 19. The key integration challenge is ensuring Tailwind CSS 4's new PostCSS-based configuration works with Storybook, which requires importing the CSS entry file in `.storybook/preview.ts`.

**Primary recommendation:** Formalize existing tokens into semantic categories (colors, spacing, typography), migrate Button/Card/Badge to CVA patterns, and set up Storybook 10 with `@storybook/nextjs-vite` for documentation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | ^0.7.1 | Type-safe component variants | Industry standard, used by shadcn/ui, integrates with TypeScript |
| @storybook/nextjs-vite | ^10.1.x | Storybook framework for Next.js | Official framework, faster than Webpack alternative |
| tailwind-merge | ^2.x | Merge Tailwind classes without conflicts | Prevents duplicate/conflicting utility classes with CVA |
| clsx | ^2.x | Conditional class joining | Used alongside CVA for className props |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @storybook/addon-docs | ^10.x | Documentation addon | Included by default, enables MDX |
| @storybook/addon-themes | ^10.x | Theme switching | Dark mode toggle in Storybook |
| @storybook/addon-vitest | ^10.x | Component testing | If testing components in Storybook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CVA | Tailwind variants plugin | CVA more explicit, better TypeScript integration |
| @storybook/nextjs-vite | @storybook/nextjs (Webpack) | Webpack slower but needed if custom Babel config |
| tailwind-merge | Manual class deduplication | Manual approach error-prone, tailwind-merge handles conflicts |

**Installation:**
```bash
npm install class-variance-authority tailwind-merge clsx
npm install -D @storybook/nextjs-vite @storybook/addon-docs @storybook/addon-themes
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── components/
│   └── ui/
│       ├── Button.tsx      # CVA-based component
│       ├── Card.tsx        # CVA-based component
│       ├── Badge.tsx       # CVA-based component
│       ├── index.ts        # Barrel exports (exists)
│       └── ...
├── lib/
│   └── ui/
│       ├── index.ts        # Exists: tokens, utilities
│       └── cn.ts           # Utility: clsx + tailwind-merge
├── styles/
│   └── tokens/
│       ├── colors.css      # Color tokens (from decisions)
│       ├── spacing.css     # Spacing tokens
│       └── typography.css  # Typography tokens
└── app/
    └── globals.css         # Imports token files

.storybook/
├── main.ts                 # Storybook config
├── preview.ts              # Global decorators, imports globals.css
└── manager.ts              # UI customization (optional)

docs/
└── design-system/
    ├── colors.mdx          # Color documentation (Storybook)
    ├── spacing.mdx         # Spacing documentation
    └── typography.mdx      # Typography documentation
```

### Pattern 1: CVA Component Pattern (shadcn/ui style)
**What:** Separate variant styling from component rendering
**When to use:** All reusable UI components with variants
**Example:**
```typescript
// Source: https://cva.style/docs/getting-started/variants
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const buttonVariants = cva(
  // Base classes applied to all variants
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      intent: {
        primary: "bg-gradient-to-b from-[var(--poke-blue)] to-[var(--poke-blue-dark)] text-white border border-[var(--poke-blue-light)]/30",
        secondary: "bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-dark)] text-white border border-[var(--border-subtle)]",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]",
        danger: "bg-gradient-to-b from-[var(--poke-red)] to-[var(--poke-red-dark)] text-white",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "w-10 h-10",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ intent, size, loading, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ intent, size }), className)}
      disabled={props.disabled || loading}
      {...props}
    />
  );
}

// Export variants for use in other components
export { buttonVariants };
```

### Pattern 2: Semantic Token Organization
**What:** CSS variables organized by purpose, not value
**When to use:** All design tokens
**Example:**
```css
/* Source: Design token best practices */
/* colors.css */
:root {
  /* Brand colors */
  --color-brand-primary: #3B4CCA;
  --color-brand-secondary: #EE1515;

  /* Surface colors */
  --color-surface-base: #0f0f1a;
  --color-surface-elevated: #1a1a2e;
  --color-surface-hover: #252542;

  /* Text colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0c0;
  --color-text-muted: #606080;

  /* Border colors */
  --color-border-subtle: #2a2a4a;
  --color-border-bright: #3a3a6a;
}
```

### Pattern 3: cn() Utility with tailwind-merge
**What:** Class name utility that merges Tailwind classes safely
**When to use:** All component className handling
**Example:**
```typescript
// Source: shadcn/ui pattern
// lib/ui/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Anti-Patterns to Avoid
- **Inline variant logic in JSX:** Use CVA to externalize variant definitions
- **Hardcoded colors in components:** Reference CSS variables instead
- **Conflicting Tailwind classes:** Use tailwind-merge to resolve conflicts
- **Mixing value-based and semantic tokens:** Keep semantic layer consistent

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class name merging | Manual string concatenation | clsx + tailwind-merge | Handles conditionals, arrays, and Tailwind conflicts |
| Component variants | If/else chains for styles | CVA | Type-safe, auto-completion, compound variants |
| Storybook config | Manual Webpack/Vite setup | @storybook/nextjs-vite | Handles Next.js specifics automatically |
| Dark mode toggle | Custom context provider | @storybook/addon-themes | Works out of the box with Storybook |

**Key insight:** CVA and tailwind-merge eliminate the "className prop hell" where components have complex conditional logic for styling. The shadcn/ui pattern of exporting `buttonVariants` separately from `Button` enables style reuse without component coupling.

## Common Pitfalls

### Pitfall 1: Storybook CSS Not Loading
**What goes wrong:** Tailwind styles not applied to Storybook stories
**Why it happens:** Tailwind CSS 4 uses new PostCSS configuration, Storybook doesn't auto-detect it
**How to avoid:** Import globals.css in `.storybook/preview.ts`:
```typescript
import '../src/app/globals.css';
```
**Warning signs:** Components render without styling in Storybook

### Pitfall 2: Node.js Version Incompatibility
**What goes wrong:** Storybook 10 fails to install or run
**Why it happens:** Storybook 10 is ESM-only, requires Node 20.19+ or 22.12+
**How to avoid:** Check Node version before installing: `node --version`
**Warning signs:** "ERR_REQUIRE_ESM" errors, failed npm install

### Pitfall 3: CVA Type Inference Issues
**What goes wrong:** VariantProps doesn't infer types correctly
**Why it happens:** TypeScript configuration or CVA version mismatch
**How to avoid:** Use `VariantProps<typeof variants>` pattern consistently
**Warning signs:** "any" types, missing autocomplete for variant props

### Pitfall 4: Tailwind Class Conflicts
**What goes wrong:** Custom className prop overrides base styles unexpectedly
**Why it happens:** Tailwind utility specificity, class order matters
**How to avoid:** Always wrap className output with tailwind-merge:
```typescript
className={cn(buttonVariants({ intent, size }), className)}
```
**Warning signs:** Inconsistent button sizes, colors not applying

### Pitfall 5: Storybook Main Config Not ESM
**What goes wrong:** Storybook 10 fails to load configuration
**Why it happens:** Storybook 10 requires ESM-only main config
**How to avoid:** Use `.storybook/main.ts` with proper exports:
```typescript
const config: StorybookConfig = { ... };
export default config;
```
**Warning signs:** "Cannot use import statement" errors

## Code Examples

Verified patterns from official sources:

### Storybook Main Configuration
```typescript
// .storybook/main.ts
// Source: https://storybook.js.org/docs/get-started/frameworks/nextjs-vite
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
};

export default config;
```

### Storybook Preview Configuration
```typescript
// .storybook/preview.ts
// Source: https://storybook.js.org/recipes/tailwindcss
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
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "dark",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
```

### Badge Component with CVA
```typescript
// components/ui/Badge.tsx
// Source: https://ui.shadcn.com/docs/components/badge + existing codebase
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const badgeVariants = cva(
  "inline-flex items-center font-bold uppercase tracking-wide rounded",
  {
    variants: {
      variant: {
        default: "bg-[var(--border-subtle)] text-[var(--text-secondary)]",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        error: "bg-red-500/20 text-red-400 border border-red-500/30",
        shiny: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, size, className, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { badgeVariants };
```

### MDX Documentation Example
```mdx
{/* docs/design-system/colors.mdx */}
{/* Source: https://storybook.js.org/docs/writing-docs/mdx */}
import { Meta, ColorPalette, ColorItem } from '@storybook/blocks';

<Meta title="Design System/Colors" />

# Color Tokens

Our color system uses semantic naming to describe purpose, not value.

## Brand Colors

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="--color-brand-primary"
    colors={{ Default: '#3B4CCA', Dark: '#2A3A99', Light: '#5B6EEA' }}
  />
  <ColorItem
    title="Secondary"
    subtitle="--color-brand-secondary"
    colors={{ Default: '#EE1515', Dark: '#CC0000', Light: '#FF4444' }}
  />
</ColorPalette>

## Surface Colors

Used for backgrounds and containers.

<ColorPalette>
  <ColorItem
    title="Base"
    subtitle="--color-surface-base"
    colors={{ Default: '#0f0f1a' }}
  />
  <ColorItem
    title="Elevated"
    subtitle="--color-surface-elevated"
    colors={{ Default: '#1a1a2e' }}
  />
</ColorPalette>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @storybook/nextjs (Webpack) | @storybook/nextjs-vite | Storybook 10 | 2-3x faster builds |
| tailwind.config.js | CSS-only config (Tailwind 4) | Tailwind CSS 4 | No config file needed |
| Manual class conditions | CVA | 2023 | Type-safe variants |
| test-runner | addon-vitest | Storybook 10 | Faster component tests |
| CommonJS Storybook config | ESM-only | Storybook 10 | 29% smaller install |

**Deprecated/outdated:**
- `@storybook/testing-library`: Use `@storybook/test` instead
- `test-runner`: Use `addon-vitest` for Vite projects
- CommonJS main.js: Must use ESM exports in Storybook 10

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Tailwind CSS 4 + Storybook 10 integration pattern**
   - What we know: Import globals.css in preview.ts works for most setups
   - What's unclear: Whether @tailwindcss/postcss plugin needs special Storybook config
   - Recommendation: Test during implementation, fall back to Tailwind CLI if needed

2. **Theme switching with data-theme vs class**
   - What we know: Both approaches work with addon-themes
   - What's unclear: Which pattern is used in existing globals.css (review needed)
   - Recommendation: Check current implementation and maintain consistency

3. **Static build deployment path**
   - What we know: Decided "alongside app on Vercel"
   - What's unclear: Exact Vercel configuration for storybook-static
   - Recommendation: Configure in vercel.json during implementation

## Sources

### Primary (HIGH confidence)
- [Storybook 10 Release Notes](https://storybook.js.org/blog/storybook-10/) - ESM-only, Next.js 16 support
- [Storybook for Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite) - Installation, configuration
- [CVA Documentation](https://cva.style/docs) - Variants API, TypeScript integration
- [CVA Variants Guide](https://cva.style/docs/getting-started/variants) - Compound variants, default variants

### Secondary (MEDIUM confidence)
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button) - CVA implementation patterns
- [shadcn/ui Badge](https://ui.shadcn.com/docs/components/badge) - Badge variant patterns
- [Storybook Tailwind Recipe](https://storybook.js.org/recipes/tailwindcss) - CSS integration
- [Storybook MDX Docs](https://storybook.js.org/docs/writing-docs/mdx) - MDX documentation patterns

### Tertiary (LOW confidence)
- [Tailwind CSS 4 Storybook Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/16451) - Community workarounds
- [Medium: Tailwind v4.1 Storybook Integration](https://medium.com/@ayomitunde.isijola/integrating-storybook-with-tailwind-css-v4-1-f520ae018c10) - React + Vite specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, widely adopted patterns
- Architecture: HIGH - Based on shadcn/ui and official Storybook patterns
- Pitfalls: MEDIUM - Some Tailwind 4 specific issues are community-reported, not officially documented

**Research date:** 2026-01-19
**Valid until:** 30 days (stable libraries, well-documented patterns)

## Existing Codebase Analysis

### Current CSS Variables (69 total)
- **Pokemon Colors:** 14 variables (poke-red, poke-blue, poke-yellow, poke-gold variants)
- **Type Colors:** 36 variables (18 types x 2 shades each)
- **UI Colors:** 8 variables (bg-dark, bg-card, border-subtle, text-primary, etc.)
- **Gradients:** 2 variables (gradient-pokeball, gradient-shine)
- **Layout-B Variables:** 9 variables (lb-bg-base, lb-accent, etc.)

### Current Component Patterns
**Button.tsx:**
- Already uses variant objects (`sizeClasses`, `variantClasses`)
- Variants: primary, secondary, ghost, danger, pokeball
- Sizes: sm, md, lg, icon
- Has loading state
- Uses `cn()` utility

**Card.tsx:**
- Variants: default, glass, bordered
- Padding: none, sm, md, lg
- Includes CardHeader sub-component

**Badge.tsx:**
- Variants: default, type, success, warning, error, shiny
- Sizes: sm, md
- Has TypeBadge sub-component
- Uses `getTypeColor()` for Pokemon types

### Current Utilities (lib/ui/index.ts)
- SPACING tokens defined
- ANIMATION_DELAYS defined
- Z_INDEX layers defined
- TYPE_COLORS map
- `cn()` utility (simple filter+join, should upgrade to tailwind-merge)
- Various formatting utilities

**Gap Analysis:**
1. `cn()` doesn't use tailwind-merge - can cause class conflicts
2. Components use variant objects but not CVA - no TypeScript variant inference
3. CSS variables not organized by category - all in single :root block
4. No Storybook setup exists
5. No documentation for component patterns
