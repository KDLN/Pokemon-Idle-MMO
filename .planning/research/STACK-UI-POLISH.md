# Stack Research: UI/UX Polish & Design System

**Project:** Pokemon Idle MMO
**Milestone:** v1.1 - UI/UX Polish
**Researched:** 2026-01-19
**Existing Stack:** Next.js 16.1.1, React 19.2.3, Tailwind CSS 4, Zustand 5.0.10

---

## Executive Summary

The existing codebase already has a solid foundation with custom CSS animations in `globals.css` (~2600 lines), CSS custom properties for design tokens, and responsive utilities. The v1.1 milestone should formalize this into a proper design system while adding drag-and-drop party reordering and enhanced battle animations.

**Key recommendations:**
- **Design System:** Storybook 10 + Class Variance Authority (CVA) + existing CSS tokens
- **Drag-and-Drop:** @dnd-kit/core + @dnd-kit/sortable (stable packages, React 19 compatible with "use client")
- **Animation:** Motion for React v12 (framer-motion successor, React 19 native support)
- **Responsive:** Tailwind CSS 4 built-in container queries + Fluid plugin for smooth scaling

---

## Recommended Stack

### Design System Tooling

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Storybook | ^10.0.0 | Component showcase & documentation | Next.js 16 + Tailwind 4 support, ESM-only (smaller bundle), CSF Factories for better types |
| class-variance-authority | ^0.7.1 | Component variants | Used by shadcn/ui, cleaner than conditional class strings, works with existing Tailwind |
| tailwind-merge | ^3.0.0 | Merge conflicting Tailwind classes | Bulletproof component overrides, prevents duplicate utilities |

**Why Storybook over alternatives:**
- Ladle is faster (1.2s vs 8s cold start) but lacks ecosystem breadth
- Storybook 10's ESM-only mode closes the gap (29% smaller install)
- Better addon ecosystem (a11y, dark mode themes, autodocs)
- Official Next.js + Tailwind recipes maintained

### Drag-and-Drop

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop primitives | Zero dependencies, 10kb minified, accessible (keyboard support) |
| @dnd-kit/sortable | ^10.0.0 | Sortable list utilities | Built for party reordering use case, works with grid layouts |
| @dnd-kit/utilities | ^3.2.2 | CSS transform utilities | Helper for transform calculations |

**React 19 Compatibility Note:**
The stable @dnd-kit packages work with React 19 but require "use client" directive at component level. The experimental @dnd-kit/react package (v0.2.1) has unresolved issues - avoid for now.

### Animation

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| motion | ^12.24.0 | UI animations & gestures | React 19 native support, GPU-accelerated, layout animations |

**Why Motion over alternatives:**
- Framer Motion rebranded to Motion, v12 has full React 19 support
- No need for forwardRef (React 19 handles refs natively)
- Existing CSS animations can stay; Motion adds gesture-based interactions
- 120fps GPU-accelerated for battle sequences

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @storybook/addon-themes | ^10.0.0 | Dark mode toggle in Storybook | Document light/dark theme variants |
| @storybook/addon-a11y | ^10.0.0 | Accessibility auditing | Catch ARIA issues in component isolation |
| storybook-addon-tailwind-autodocs | ^0.2.0 | Tailwind theme documentation | Auto-generate design token docs |
| react-confetti-explosion | ^2.1.2 | CSS-based confetti | Catch celebrations (lighter than canvas-confetti) |
| fluid-tailwind | ^1.0.0 | Fluid typography/spacing | Smooth scaling between breakpoints |

---

## Design System Architecture

### Leveraging Existing Tokens

The codebase already has a comprehensive design token system in `globals.css`:

```css
/* Already defined - formalize, don't replace */
:root {
  /* Pokemon Colors */
  --poke-red: #EE1515;
  --poke-blue: #3B4CCA;
  --poke-yellow: #FFDE00;

  /* 18 Type Colors */
  --type-fire: #F08030;
  --type-water: #6890F0;
  /* ... */

  /* UI Semantic Colors */
  --bg-dark: #0f0f1a;
  --bg-card: #1a1a2e;
  --text-primary: #ffffff;
  --text-secondary: #a0a0c0;
}
```

**Strategy:** Export these as a formal token file for Storybook autodocs, but keep CSS custom properties as source of truth.

### CVA Component Pattern

Transform existing inline Tailwind into variant-based components:

```typescript
// Before (scattered conditionals)
<button className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-[--poke-red]' : 'bg-[--bg-card]'}`}>

// After (CVA + tailwind-merge)
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva(
  'px-4 py-2 rounded font-semibold transition-all', // base
  {
    variants: {
      variant: {
        pokeball: 'bg-[--poke-red] text-white hover:bg-[--poke-red-dark]',
        ghost: 'bg-transparent border border-[--border-subtle] hover:bg-[--bg-card-hover]',
        type: 'text-white', // Receives dynamic type color via style prop
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'pokeball',
      size: 'md',
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={twMerge(buttonVariants({ variant, size }), className)} {...props} />;
}
```

---

## Drag-and-Drop Implementation

### Party Reordering Pattern

```typescript
'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export function SortableParty({ pokemon, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pokemon.findIndex((p) => p.id === active.id);
      const newIndex = pokemon.findIndex((p) => p.id === over.id);
      onReorder(arrayMove(pokemon, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pokemon.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4">
          {pokemon.map((mon) => (
            <SortablePokemonCard key={mon.id} pokemon={mon} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

### Accessibility Requirements

- `KeyboardSensor` enables arrow key navigation
- `closestCenter` collision detection for 2x3 party grid
- Visual drag indicator (existing `.animate-pulse-glow` can be reused)
- Screen reader announcements via dnd-kit's built-in announcements

---

## Animation Strategy

### Preserve Existing CSS Animations

The codebase has ~80 CSS keyframe animations. Keep these for:
- Decorative/ambient effects (`.animate-firefly-*`, `.animate-grass-sway`)
- Simple transitions (`.animate-fade-in`, `.animate-slide-up`)
- Performance-critical loops (`.animate-ticker`, idle sprite animations)

### Add Motion for Interactive Animations

Use Motion for React for:
- Drag feedback (scale/shadow on drag start)
- Layout animations (party reorder, box swaps)
- Gesture-based interactions (swipe to navigate zones on mobile)
- Complex battle sequences requiring orchestration

```typescript
import { motion, AnimatePresence } from 'motion/react';

// Layout animation for party reorder
<motion.div
  layoutId={pokemon.id}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <PokemonCard pokemon={pokemon} />
</motion.div>

// Battle damage flash (supplements existing .animate-damage-flash)
<motion.div
  animate={isHit ? { filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } : {}}
  transition={{ duration: 0.15, repeat: 3 }}
>
  <PokemonSprite />
</motion.div>
```

---

## Responsive Design Patterns

### Tailwind CSS 4 Container Queries

The codebase uses viewport breakpoints extensively. Add container queries for component-level responsiveness:

```html
<!-- Zone card adapts to sidebar vs full-width context -->
<section class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
    <!-- Pokemon cards -->
  </div>
</section>
```

### Existing Breakpoint System

```css
/* Already configured via Tailwind 4 defaults */
/* sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px */
```

**Recommendation:** Add custom `xs` breakpoint for small phones:

```css
/* In globals.css */
@theme {
  --breakpoint-xs: 475px;
}
```

### Fluid Typography with fluid-tailwind

```html
<!-- Font scales smoothly from 14px (mobile) to 18px (desktop) -->
<p class="~text-sm/lg">Pokemon description</p>

<!-- Spacing scales fluidly -->
<div class="~p-4/8">Card content</div>
```

---

## Storybook Configuration

### Installation

```bash
npx storybook@latest init --type nextjs
npm install @storybook/addon-themes @storybook/addon-a11y storybook-addon-tailwind-autodocs
```

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
    'storybook-addon-tailwind-autodocs',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import '../src/app/globals.css'; // Import Tailwind + custom tokens

import { withThemeByClassName } from '@storybook/addon-themes';

export const decorators = [
  withThemeByClassName({
    themes: {
      light: '',
      dark: 'dark',
    },
    defaultTheme: 'dark', // Pokemon game aesthetic
  }),
];
```

---

## What NOT to Use

### Libraries to Avoid

| Library | Reason |
|---------|--------|
| react-beautiful-dnd | Deprecated by Atlassian, console warnings on install |
| @dnd-kit/react (experimental) | v0.2.1 has unresolved module resolution issues with Next.js |
| framer-motion (old package) | Superseded by `motion`, causes React 19 type conflicts |
| @hello-pangea/dnd | Fork of deprecated library, no grid support (party is 2x3 grid) |
| Radix UI Primitives | Overkill for this game UI; existing custom components sufficient |
| styled-components | Project uses Tailwind CSS; mixing paradigms adds complexity |
| Chakra UI / MUI | Heavy component libraries; incompatible with existing Pokemon aesthetic |

### Patterns to Avoid

| Anti-Pattern | Why | Instead |
|--------------|-----|---------|
| Inline style objects for variants | Poor DX, no autocomplete | CVA + Tailwind classes |
| CSS-in-JS runtime (Emotion) | Double styling system | Stick to Tailwind + CSS custom properties |
| Heavy canvas libraries for simple effects | Bundle bloat | CSS animations or react-confetti-explosion |
| Global animation orchestration | Hard to debug | Component-scoped Motion instances |
| Viewport-only responsive design | Components break in different contexts | Container queries (@container) |

---

## Installation Commands

### Core Dependencies

```bash
# Drag-and-drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Animation
npm install motion

# Design system utilities
npm install class-variance-authority tailwind-merge
```

### Dev Dependencies

```bash
# Storybook
npx storybook@latest init --type nextjs

# Storybook addons
npm install -D @storybook/addon-themes @storybook/addon-a11y storybook-addon-tailwind-autodocs

# Fluid typography (optional)
npm install -D fluid-tailwind
```

### Package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build -o docs/storybook"
  }
}
```

---

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| Design System (Storybook + CVA) | HIGH | Official Next.js 16 support confirmed, battle-tested pattern |
| Drag-and-Drop (@dnd-kit stable) | MEDIUM | Works with React 19 via "use client", but needs testing with existing Zustand store |
| Animation (Motion v12) | HIGH | Official React 19 support, active maintenance, comprehensive docs |
| Responsive (Tailwind 4 containers) | HIGH | Built into Tailwind 4 core, no plugin needed |
| Storybook Tailwind 4 integration | MEDIUM | Requires @source directive configuration, documented but newer pattern |

---

## Migration Notes

### Existing Component Audit

Components to prioritize for CVA refactoring:

1. **Button.tsx** - Multiple variants (pokeball, ghost, type-colored)
2. **Badge.tsx** - Type badges, status badges, rarity badges
3. **Card.tsx** - Pokemon cards, zone cards, shop item cards
4. **ProgressBar.tsx** - HP bar, XP bar, season bar

### Animation Migration Path

1. Keep all CSS keyframes in `globals.css`
2. Add Motion for drag feedback and layout transitions
3. Orchestrate battle sequences with Motion's `stagger` and `when`
4. Only replace CSS animation if Motion version is significantly better

---

## Sources

### Design System & Storybook
- [Storybook 10 Release](https://storybook.js.org/blog/storybook-10/)
- [Tailwind CSS Storybook Recipe](https://storybook.js.org/recipes/tailwindcss)
- [Building Design Systems with Storybook & Next.js](https://strapi.io/blog/building-a-design-system-with-storybook-and-nextjs)
- [Storybook 10 vs Ladle vs Histoire Comparison](https://dev.to/saswatapal/storybook-10-why-i-chose-it-over-ladle-and-histoire-for-component-documentation-2omn)

### Drag-and-Drop
- [dnd-kit Official Documentation](https://docs.dndkit.com/)
- [Top 5 DnD Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd-kit React 19 "use client" Issue](https://github.com/clauderic/dnd-kit/issues/1654)

### Animation
- [Motion for React Installation](https://motion.dev/docs/react-installation)
- [Motion Upgrade Guide (from Framer Motion)](https://motion.dev/docs/react-upgrade-guide)
- [Framer Motion + Tailwind 2025 Stack](https://dev.to/manukumar07/framer-motion-tailwind-the-2025-animation-stack-1801)

### Responsive Design
- [Tailwind CSS 4 Responsive Design Docs](https://tailwindcss.com/docs/responsive-design)
- [Tailwind Container Queries](https://tailkits.com/blog/tailwind-container-queries/)
- [Fluid for Tailwind CSS](https://fluid.tw/)

### Component Variants
- [Class Variance Authority Docs](https://cva.style/docs)
- [Building Design Systems with shadcn/ui + CVA](https://shadisbaih.medium.com/building-a-scalable-design-system-with-shadcn-ui-tailwind-css-and-design-tokens-031474b03690)

---

*Stack research for v1.1 UI/UX Polish milestone: 2026-01-19*
