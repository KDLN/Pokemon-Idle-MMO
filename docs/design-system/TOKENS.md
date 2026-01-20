# Design Tokens

Design tokens are the atomic values that make up the visual language of Pokemon Idle MMO. They ensure consistency across all UI components.

## Token Files

| File | Purpose |
|------|---------|
| `apps/web/src/styles/tokens/colors.css` | Color palette (brand, surface, text, border, type) |
| `apps/web/src/styles/tokens/spacing.css` | Spacing scale and border radius |
| `apps/web/src/styles/tokens/typography.css` | Font sizes, weights, line heights |

## Colors

### Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-primary` | #3B4CCA | Primary buttons, links, accents (Pokemon Blue) |
| `--color-brand-primary-dark` | #2A3A99 | Hover states, gradients |
| `--color-brand-primary-light` | #5B6EEA | Borders, highlights |
| `--color-brand-secondary` | #EE1515 | Pokeball buttons, danger actions (Pokemon Red) |
| `--color-brand-secondary-dark` | #CC0000 | Hover states |
| `--color-brand-secondary-light` | #FF4444 | Borders, highlights |
| `--color-brand-accent` | #FFDE00 | Focus rings, highlights (Pokemon Yellow) |
| `--color-brand-accent-dark` | #E6C800 | Darker accent for gradients |
| `--color-brand-gold` | #B3A125 | Premium items, gold badges |

### Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface-base` | #0f0f1a | Page background |
| `--color-surface-elevated` | #1a1a2e | Cards, modals, panels |
| `--color-surface-hover` | #252542 | Hover states on elevated surfaces |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | #ffffff | Headings, important text |
| `--color-text-secondary` | #a0a0c0 | Body text, labels |
| `--color-text-muted` | #606080 | Captions, disabled text |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border-subtle` | #2a2a4a | Card borders, dividers |
| `--color-border-bright` | #3a3a6a | Active/focus borders |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | #22c55e | Success states, online indicators |
| `--color-warning` | #eab308 | Warning states, timers |
| `--color-error` | #ef4444 | Error states, danger badges |

### Pokemon Type Colors

18 type colors with base and dark variants for badges, borders, and glows.

| Token Pattern | Example | Usage |
|---------------|---------|-------|
| `--color-type-{type}` | `--color-type-fire: #F08030` | Type badges background |
| `--color-type-{type}-dark` | `--color-type-fire-dark: #9C531F` | Borders, shadows |

**Available types:** normal, fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy

### Layout-B Colors

Extended palette for the 3-column layout system.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-lb-base` | #0f1015 | Sidebar backgrounds |
| `--color-lb-elevated` | #1d1e26 | Elevated sidebar elements |
| `--color-lb-hover` | #252630 | Hover states |
| `--color-lb-border` | #3a3b48 | Layout borders |
| `--color-lb-text-dim` | #5a5b68 | Dimmed text labels |
| `--color-lb-accent` | #6366f1 | Accent color (indigo) |
| `--color-lb-accent-glow` | rgba(99, 102, 241, 0.3) | Glow effects |

## Spacing

Based on 4px (0.25rem) base unit.

### Spacing Scale

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--spacing-0` | 0 | 0px | No spacing |
| `--spacing-1` | 0.25rem | 4px | Tight spacing |
| `--spacing-2` | 0.5rem | 8px | Small gaps |
| `--spacing-3` | 0.75rem | 12px | Component padding |
| `--spacing-4` | 1rem | 16px | Standard spacing |
| `--spacing-5` | 1.25rem | 20px | Medium spacing |
| `--spacing-6` | 1.5rem | 24px | Section gaps |
| `--spacing-8` | 2rem | 32px | Large spacing |
| `--spacing-10` | 2.5rem | 40px | Extra large |
| `--spacing-12` | 3rem | 48px | Hero sections |
| `--spacing-16` | 4rem | 64px | Page margins |

### Semantic Spacing

| Token | Maps To | Usage |
|-------|---------|-------|
| `--spacing-component-xs` | spacing-1 | Badge padding |
| `--spacing-component-sm` | spacing-2 | Button padding |
| `--spacing-component-md` | spacing-3 | Card padding |
| `--spacing-component-lg` | spacing-4 | Modal padding |
| `--spacing-layout-sm` | spacing-4 | Small section gaps |
| `--spacing-layout-md` | spacing-6 | Standard section gaps |
| `--spacing-layout-lg` | spacing-8 | Large section gaps |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, small elements |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Large containers, modals |
| `--radius-full` | 9999px | Pills, avatars, circular buttons |

## Typography

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family-sans` | Outfit, sans-serif | Body text, UI elements |
| `--font-family-pixel` | Press Start 2P, monospace | Retro text, battle messages |

### Font Sizes

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--font-size-xs` | 0.625rem | 10px | Badges, captions |
| `--font-size-sm` | 0.75rem | 12px | Secondary text |
| `--font-size-base` | 0.875rem | 14px | Body text |
| `--font-size-md` | 1rem | 16px | Large body text |
| `--font-size-lg` | 1.125rem | 18px | Subheadings |
| `--font-size-xl` | 1.25rem | 20px | Section headings |
| `--font-size-2xl` | 1.5rem | 24px | Page headings |
| `--font-size-3xl` | 1.875rem | 30px | Hero text |

### Pixel Font Sizes

Smaller sizes for legibility with pixel fonts.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--font-size-pixel-xs` | 0.5rem | 8px | Tiny pixel text |
| `--font-size-pixel-sm` | 0.625rem | 10px | Small pixel text |
| `--font-size-pixel-base` | 0.75rem | 12px | Standard pixel text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Labels, buttons |
| `--font-weight-semibold` | 600 | Subheadings |
| `--font-weight-bold` | 700 | Headings, emphasis |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.25 | Headings |
| `--line-height-normal` | 1.5 | Body text |
| `--line-height-relaxed` | 1.75 | Long-form text |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--letter-spacing-tight` | -0.025em | Large headings |
| `--letter-spacing-normal` | 0 | Body text |
| `--letter-spacing-wide` | 0.025em | Buttons, labels |
| `--letter-spacing-wider` | 0.05em | Uppercase text |
| `--letter-spacing-widest` | 0.1em | Pixel font text |

## Legacy Compatibility

Old variable names are aliased to new tokens in `globals.css` for backward compatibility. Existing code continues to work without changes.

| Old Name | New Token |
|----------|-----------|
| `--poke-red` | `--color-brand-secondary` |
| `--poke-blue` | `--color-brand-primary` |
| `--poke-yellow` | `--color-brand-accent` |
| `--bg-dark` | `--color-surface-base` |
| `--bg-card` | `--color-surface-elevated` |
| `--type-fire` | `--color-type-fire` |
| `--lb-accent` | `--color-lb-accent` |

**New code should use the `--color-*` tokens directly** for consistency.

## Usage in Components

### Direct CSS Usage

```css
.card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-component-md);
}

.heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
```

### Tailwind CSS Usage

```tsx
// Using CSS variables with Tailwind arbitrary values
<div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-[var(--spacing-component-md)]">
  Content
</div>
```

### TypeScript Token Access

```typescript
// For dynamic styles in components
const style = {
  backgroundColor: 'var(--color-surface-elevated)',
  borderColor: 'var(--color-border-subtle)',
};
```

## Token Count Summary

| Category | Count |
|----------|-------|
| Brand colors | 9 |
| Surface colors | 3 |
| Text colors | 3 |
| Border colors | 2 |
| Semantic colors | 3 |
| Type colors | 36 (18 types x 2) |
| Layout-B colors | 7 |
| Spacing scale | 11 |
| Semantic spacing | 7 |
| Border radius | 5 |
| Font sizes | 11 |
| Font weights | 4 |
| Line heights | 3 |
| Letter spacing | 5 |
| **Total** | **109** |
