---
phase: 15-theme-exploration
plan: 02
subsystem: ui-components
tags: [css, animations, button, 3d-effects]
dependency_graph:
  requires: [15-01]
  provides: [beveled-button-component, 3d-button-css]
  affects: [future-ui-components]
tech_stack:
  added: []
  patterns: [josh-comeau-layered-button, transform-based-animations]
key_files:
  created:
    - apps/web/src/styles/button-3d.css
  modified:
    - apps/web/src/components/ui/Button.tsx
    - apps/web/src/components/ui/Button.stories.tsx
    - apps/web/src/app/globals.css
decisions: []
metrics:
  duration: 4 min
  completed: 2026-01-21
---

# Phase 15 Plan 02: Beveled 3D Button Summary

Transform-based 3D beveled button using Josh Comeau's layered approach with shadow/edge/front spans.

## What Was Built

### 3D Button CSS (`button-3d.css`)

Implemented Josh Comeau's layered button technique with five key elements:

1. **Wrapper (`.btn-3d`)**: Transparent container with filter transition
2. **Shadow layer (`.btn-3d-shadow`)**: Creates depth illusion via dark translucent background
3. **Edge layer (`.btn-3d-edge`)**: Linear gradient for beveled edge appearance
4. **Front layer (`.btn-3d-front`)**: Visible button face with transform animations

Animation characteristics:
- Hover: Lifts button (front -6px, shadow +4px) with 250ms bouncy cubic-bezier
- Active: Snappy press down (front -2px, shadow +1px) with 34ms transition
- All animations use `transform` for GPU acceleration (no box-shadow)

### BeveledButton Component

New React component in `Button.tsx`:

```tsx
<BeveledButton hue={240} saturation={60} lightness={50}>
  Click Me
</BeveledButton>
```

Props:
- `hue`: HSL hue value (0-360), default 240 (blue)
- `saturation`: HSL saturation %, default 60
- `lightness`: HSL lightness %, default 50

Separate component (not CVA variant) because HTML structure differs (three nested spans).

### Storybook Stories

Four stories demonstrating the component:
- **Beveled**: Default blue 3D button
- **BeveledColors**: Blue, red, green, yellow variants
- **BeveledInteractive**: Demo with interaction instructions
- **BeveledDisabled**: Disabled state with grayscale filter

## Technical Details

### Why Transform-Based

Per plan requirements, animations use `transform` instead of `box-shadow`:
- GPU-accelerated (compositor-only)
- No repaints on hover/click
- Smooth 60fps animations

### CSS Custom Properties

Hue theming via CSS variables:
```css
--btn-hue: 240;
--btn-saturation: 60%;
--btn-lightness: 50%;
```

Edge gradient calculates darker variants automatically:
- 0.8x saturation at edges
- 0.6x lightness at edges for depth

## Commits

| Commit | Description |
|--------|-------------|
| c6335cb | Create 3D beveled button CSS |
| 7bbca7b | Add BeveledButton component |
| 3f8659a | Add BeveledButton Storybook stories |

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues

- Storybook runtime blocked by pre-existing Windows native module issue (noted in STATE.md as 09-03 blocker)
- TypeScript compilation verified correct

## Next Phase Readiness

Button ready for use in Pokemon Clean Modern theme. Can be applied to:
- Primary action buttons
- Battle UI buttons
- Zone travel buttons

No blockers for next plan.
