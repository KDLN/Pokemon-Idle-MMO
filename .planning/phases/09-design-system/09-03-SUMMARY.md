---
phase: 09-design-system
plan: 03
subsystem: ui
tags: [cva, class-variance-authority, tailwind, typescript, components, button, card, badge]

# Dependency graph
requires:
  - phase: 09-01
    provides: CVA library and cn utility in @/lib/ui/cn
provides:
  - Button component with CVA and exported buttonVariants
  - Card component with CVA and exported cardVariants
  - Badge component with CVA and exported badgeVariants
  - Type-safe variant props with autocomplete
affects: [09-04, 09-05, any future component work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CVA for component variant definitions
    - Exporting variant definitions for style reuse
    - CSS custom properties for theming (--color-brand-*, --color-surface-*)
    - VariantProps type extension for ButtonProps/CardProps/BadgeProps

key-files:
  created: []
  modified:
    - apps/web/src/components/ui/Button.tsx
    - apps/web/src/components/ui/Card.tsx
    - apps/web/src/components/ui/Badge.tsx

key-decisions:
  - "Handle Pokemon type badges separately from CVA (dynamic color via style prop) since CVA doesn't support runtime-determined values"
  - "Import cn from '@/lib/ui/cn' for explicit path rather than barrel export"
  - "Use CSS variable tokens (--color-*) for consistent theming"

patterns-established:
  - "CVA pattern: cva(baseClasses, { variants, defaultVariants }) for component styling"
  - "Export pattern: export const [component]Variants alongside component"
  - "Props pattern: extend HTML element attributes + VariantProps<typeof [component]Variants>"

# Metrics
duration: 2min
completed: 2026-01-20
---

# Phase 9 Plan 3: Core Components CVA Migration Summary

**Button, Card, and Badge components migrated to CVA with exported variant definitions and CSS custom property theming**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-20T00:22:38Z
- **Completed:** 2026-01-20T00:24:56Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Migrated Button component to CVA with 5 variants (primary, secondary, ghost, danger, pokeball) and 4 sizes
- Migrated Card component to CVA with 3 variants (default, glass, bordered) and 4 padding options
- Migrated Badge component to CVA with 5 variants (default, success, warning, error, shiny) plus dynamic Pokemon type handling
- All three components now export their variant definitions for style reuse
- TypeScript autocomplete works for all variant props via VariantProps type

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Button component to CVA** - `9f67293` (refactor)
2. **Task 2: Migrate Card component to CVA** - `4027d71` (refactor)
3. **Task 3: Migrate Badge component to CVA** - `710b98d` (refactor)

## Files Created/Modified
- `apps/web/src/components/ui/Button.tsx` - CVA buttonVariants with 5 variants, 4 sizes, IconButton component
- `apps/web/src/components/ui/Card.tsx` - CVA cardVariants with 3 variants, 4 padding options, CardHeader component
- `apps/web/src/components/ui/Badge.tsx` - CVA badgeVariants with 5 variants, TypeBadge for Pokemon types

## Decisions Made
- **Pokemon type badges use style prop:** CVA doesn't support runtime-determined values, so Pokemon type badges use dynamic `backgroundColor` via style prop while other variants use CVA. This is the recommended CVA pattern.
- **Kept getTypeColor import from @/lib/ui:** Badge component needs Pokemon type color lookup, imported from barrel export for backward compatibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript comparison error in Badge variant check**
- **Found during:** Task 3 (Badge CVA migration)
- **Issue:** Plan specified `variant === 'type'` check, but 'type' isn't in the CVA variant union type, causing TS2367
- **Fix:** Changed condition to `type && !variant` to detect Pokemon type badges
- **Files modified:** apps/web/src/components/ui/Badge.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 710b98d (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type-safety fix. No scope creep.

## Issues Encountered

- **Build failure (pre-existing):** `npm run build` fails due to missing `lightningcss.win32-x64-msvc.node` native module. This is a pre-existing Windows infrastructure issue unrelated to the CVA migration. TypeScript compilation passes successfully, confirming the code changes are correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CVA pattern established for three core components
- Variant definitions exported for link/button style reuse
- Ready for 09-04 (Storybook stories) or 09-05 (additional components)
- Consider adding lightningcss native module to optionalDependencies or investigating build toolchain for future builds

---
*Phase: 09-design-system*
*Completed: 2026-01-20*
