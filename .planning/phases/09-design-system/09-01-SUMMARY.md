---
phase: 09-design-system
plan: 01
subsystem: ui
tags: [cva, tailwind-merge, clsx, storybook, design-system]

# Dependency graph
requires:
  - phase: 08-bug-fixes
    provides: stable codebase for design system work
provides:
  - cn() utility with tailwind-merge for class conflict resolution
  - CVA package for type-safe component variants
  - Storybook 10 for component documentation and development
affects: [09-02, 09-03, 09-04, 09-05, 10-responsive]

# Tech tracking
tech-stack:
  added: [class-variance-authority, tailwind-merge, clsx, @storybook/nextjs-vite, @storybook/addon-docs, @storybook/addon-themes, storybook]
  patterns: [cn() utility pattern combining clsx + twMerge]

key-files:
  created:
    - apps/web/src/lib/ui/cn.ts
    - apps/web/.storybook/main.ts
    - apps/web/.storybook/preview.ts
  modified:
    - apps/web/package.json
    - apps/web/src/lib/ui/index.ts

key-decisions:
  - "Added @rollup/rollup-win32-x64-msvc as optionalDependency to fix Windows npm issue"
  - "Using dark-only theme since app is dark-mode only"

patterns-established:
  - "cn() pattern: cn(baseClasses, variantClasses, className) for CVA components"

# Metrics
duration: 8min
completed: 2026-01-19
---

# Phase 9 Plan 1: Foundation Tooling Summary

**CVA, tailwind-merge, and Storybook 10 installed with cn() utility upgraded for class conflict resolution**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-19T12:00:00Z
- **Completed:** 2026-01-19T12:08:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Installed CVA ecosystem (class-variance-authority, clsx, tailwind-merge)
- Created cn() utility that merges Tailwind classes without conflicts
- Configured Storybook 10 with Next.js + Vite and dark theme
- Storybook starts successfully on port 6006 with globals.css loaded

## Task Commits

Each task was committed atomically:

1. **Task 1: Install CVA and utility dependencies** - `cfece92` (chore)
2. **Task 2: Create cn() utility with tailwind-merge** - `0b4cdd1` (feat)
3. **Task 3: Configure Storybook 10 with Next.js + Tailwind** - `e61de1d` (feat)

## Files Created/Modified

- `apps/web/src/lib/ui/cn.ts` - New cn() utility with clsx + tailwind-merge
- `apps/web/src/lib/ui/index.ts` - Updated to export cn from new module
- `apps/web/.storybook/main.ts` - Storybook configuration with nextjs-vite
- `apps/web/.storybook/preview.ts` - Preview config with globals.css and dark theme
- `apps/web/package.json` - Added CVA, Storybook packages, and scripts

## Decisions Made

1. **Moved rollup native package to optionalDependencies** - @rollup/rollup-win32-x64-msvc is needed for Storybook on Windows due to a known npm bug with optional dependencies. Placed in optionalDependencies to not affect non-Windows platforms.

2. **Dark-only theme in Storybook** - Since the app is dark-mode only, configured Storybook with dark background (#0f0f1a) as default. Theme switching infrastructure exists for future use.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed rollup optional dependency issue on Windows**
- **Found during:** Task 3 (Storybook configuration)
- **Issue:** Storybook failed to start with "Cannot find module @rollup/rollup-win32-x64-msvc" - known npm bug with optional dependencies
- **Fix:** Installed @rollup/rollup-win32-x64-msvc and added to optionalDependencies
- **Files modified:** apps/web/package.json
- **Verification:** Storybook starts successfully
- **Committed in:** e61de1d (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to unblock Storybook on Windows. No scope creep.

## Issues Encountered

None beyond the documented deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- cn() utility ready for CVA component patterns
- Storybook ready for component stories
- Plan 09-02 can now create Button and Card base components with CVA

---
*Phase: 09-design-system*
*Completed: 2026-01-19*
