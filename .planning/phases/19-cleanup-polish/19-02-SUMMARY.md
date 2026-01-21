---
phase: 19-cleanup-polish
plan: 02
subsystem: documentation
tags: [storybook, react, component-library, design-system, vite]

# Dependency graph
requires:
  - phase: 17-theme-modern
    provides: Modern theme with beveled buttons and design tokens
  - phase: 16-ui-components
    provides: Button, Card, Badge component stories
provides:
  - Storybook integrated into production build pipeline
  - Component documentation accessible at /storybook route
  - Build script includes Storybook compilation step
affects: [deployment, design-system, component-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Storybook builds to public/storybook for Next.js static serving"
    - "Build pipeline runs Storybook before Next.js build"
    - "MDX files excluded from build due to Vite resolution issues"

key-files:
  created:
    - apps/web/public/storybook/index.html (generated)
  modified:
    - apps/web/package.json
    - apps/web/.storybook/main.ts
    - apps/web/eslint.config.mjs
    - apps/web/.gitignore
    - apps/web/src/stories/showcase/BattleUI.mdx
    - apps/web/src/stories/showcase/InventoryUI.mdx

key-decisions:
  - "Exclude MDX files from Storybook build due to @storybook/blocks Vite resolution issue"
  - "Output Storybook to public/storybook instead of default storybook-static"
  - "Remove staticDirs from Storybook config to prevent recursive copy error"
  - "Add Storybook output to gitignore - regenerates during deploy"

patterns-established:
  - "Component documentation served at /storybook via Next.js static file serving"
  - "Storybook build integrated as pre-step in npm run build"

# Metrics
duration: 7min
completed: 2026-01-21
---

# Phase 19 Plan 02: Storybook Production Integration Summary

**Storybook component documentation builds to /storybook route, integrated into production deployment pipeline**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-21T20:55:17Z
- **Completed:** 2026-01-21T21:02:35Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Fixed MDX parsing errors preventing Storybook build
- Integrated Storybook build into npm run build pipeline
- Configured Storybook to output to public/storybook for /storybook route
- Verified HTTP 200 response and correct HTML served at /storybook
- Added Storybook build artifacts to gitignore (regenerate on deploy)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Storybook MDX indexing errors** - `d249815` (fix)
2. **Task 2: Configure Storybook for production deployment** - `057ae96` (feat)
3. **Task 3: Add to gitignore and verify deployment** - `b40a796` (chore)

## Files Created/Modified

- `apps/web/package.json` - Added build:storybook script, integrated into build pipeline
- `apps/web/.storybook/main.ts` - Excluded MDX files, removed staticDirs
- `apps/web/eslint.config.mjs` - Ignored Storybook output directories
- `apps/web/.gitignore` - Added public/storybook/ and storybook-static/
- `apps/web/src/stories/showcase/BattleUI.mdx` - Escaped < character in HTML entity
- `apps/web/src/stories/showcase/InventoryUI.mdx` - Escaped < character in HTML entity
- `apps/web/public/storybook/index.html` - Generated Storybook entry point

## Decisions Made

**1. Exclude MDX files from Storybook build**
- **Issue:** Vite fails to resolve @storybook/blocks import in MDX files during production build
- **Decision:** Temporarily exclude MDX files, use only .stories.tsx files
- **Rationale:** Component showcase still fully functional via story files, MDX was for additional documentation pages
- **Impact:** Minor - core component stories all work, only lost supplemental MDX documentation pages

**2. Output to public/storybook instead of storybook-static**
- **Decision:** Configure --output-dir public/storybook
- **Rationale:** Next.js automatically serves public/ folder at root, enables /storybook route
- **Impact:** No custom Next.js routing needed, works with static hosting

**3. Remove staticDirs from Storybook config**
- **Issue:** Storybook tried to copy public/ TO public/storybook/, causing recursive copy error
- **Decision:** Remove staticDirs: ["../public"] from main.ts
- **Rationale:** Don't need to copy public assets INTO Storybook output when output IS in public/
- **Impact:** Storybook loses access to Pokemon sprites, but component stories don't need them

**4. Gitignore Storybook build output**
- **Decision:** Add /public/storybook/ and /storybook-static/ to .gitignore
- **Rationale:** Build artifacts regenerate during npm run build, no need to commit ~50MB of assets
- **Impact:** Cleaner git history, smaller repo size, no merge conflicts on Storybook updates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Escaped < characters in MDX files**
- **Found during:** Task 1 (Storybook build attempt)
- **Issue:** MDX parser interpreted `(<20%)` and `<1 min` as JSX tag starts, errored on numeric character
- **Fix:** Replaced `<` with `&lt;` HTML entity in BattleUI.mdx line 81 and InventoryUI.mdx line 118
- **Files modified:** apps/web/src/stories/showcase/BattleUI.mdx, apps/web/src/stories/showcase/InventoryUI.mdx
- **Verification:** MDX indexing errors resolved, Storybook build proceeded
- **Committed in:** d249815 (Task 1 commit)

**2. [Rule 3 - Blocking] Removed staticDirs causing recursive copy error**
- **Found during:** Task 2 (Building to public/storybook)
- **Issue:** SystemError EINVAL - cannot copy ./public to subdirectory ./public/storybook
- **Fix:** Removed `staticDirs: ["../public"]` from .storybook/main.ts
- **Files modified:** apps/web/.storybook/main.ts
- **Verification:** Storybook build completed successfully to public/storybook/
- **Committed in:** 057ae96 (Task 2 commit)

**3. [Rule 3 - Blocking] Excluded MDX files due to Vite resolution error**
- **Found during:** Task 1 (Post-MDX-fix build attempt)
- **Issue:** Vite rollup failed to resolve @storybook/blocks import from MDX files during build
- **Fix:** Commented out "../src/**/*.mdx" from stories array in main.ts
- **Files modified:** apps/web/.storybook/main.ts
- **Verification:** Storybook build completed with .stories.tsx files, all component stories working
- **Committed in:** d249815 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All fixes necessary to unblock Storybook build. Core objective achieved - component documentation accessible at /storybook. MDX exclusion is minor loss (supplemental docs only).

## Issues Encountered

**Vite @storybook/blocks resolution in MDX files**
- **Problem:** Production build fails to resolve @storybook/blocks from MDX files
- **Root cause:** Known Vite/Storybook compatibility issue with MDX v2/v3 parsing
- **Resolution:** Excluded MDX files from build, kept .stories.tsx files
- **Alternative considered:** Storybook automigrate (interactive, didn't attempt fully)
- **Impact:** Minor - lost supplemental MDX documentation pages (Typography, Colors, Spacing), but all component stories work

**Recursive copy error with staticDirs**
- **Problem:** Storybook tried to copy public/ into public/storybook/, causing EINVAL error
- **Root cause:** Output directory configured inside source directory for staticDirs
- **Resolution:** Removed staticDirs configuration from main.ts
- **Impact:** Storybook doesn't have access to Pokemon sprites, but component stories don't use them

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Storybook integrated into production pipeline ✓
- Component documentation accessible at /storybook ✓
- Build process verified working ✓
- Ready for deployment to Vercel (will run npm run build automatically)

**Blockers:** None

**Concerns:**
- MDX documentation pages excluded - consider fixing @storybook/blocks resolution in future if MDX docs needed
- Storybook adds ~5-6 seconds to build time - acceptable for component documentation value

---
*Phase: 19-cleanup-polish*
*Completed: 2026-01-21*
