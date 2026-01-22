# Phase 19: Cleanup & Polish - Research

**Researched:** 2026-01-21
**Domain:** Code cleanup, Storybook, E2E testing
**Confidence:** HIGH

## Summary

Research for Phase 19 focused on five areas: (1) auditing experimental code for removal, (2) understanding Storybook configuration for production deployment, (3) evaluating E2E testing setup requirements, (4) integrating Storybook into the build pipeline, and (5) cataloging existing lint/type issues.

The codebase has a clear set of experimental files to remove (MockGameScreen component and /theme-compare route), along with substantial debug logging that should be cleaned up. Storybook 10.1.11 is already configured but has MDX indexing errors that need fixing before production build. No E2E testing infrastructure exists - Playwright is the recommended choice for Next.js.

**Primary recommendation:** Remove experimental code, fix Storybook MDX errors, install Playwright, integrate Storybook build into npm run build, then run E2E tests across all breakpoints.

## Files to Remove (Experimental Code Audit)

### Confirmed Experimental Files
| File | Purpose | Safe to Remove |
|------|---------|----------------|
| `apps/web/src/components/game/MockGameScreen.tsx` | Static mock for theme comparison (729 lines) | YES |
| `apps/web/src/app/theme-compare/page.tsx` | Theme comparison route using MockGameScreen | YES |

### Related Build Artifacts (Auto-removed)
The `.next/server/app/theme-compare/` folder contains build artifacts that will be automatically cleaned on next build after removing the source files.

### Orphaned Code Analysis
No orphaned utilities or hooks were found that are exclusively used by MockGameScreen. The component uses standard shared utilities:
- `@/components/ui/Card` - used elsewhere
- `@/components/ui/Button` - used elsewhere
- `@/lib/ui/cn` - used elsewhere

### Console.log Statements to Clean Up
**Location:** `apps/web/src/lib/ws/gameSocket.ts` (primary)
**Count:** 35+ console.log/error statements
**Categories:**
- Connection lifecycle: 12 statements (connect, disconnect, reconnect)
- Debug logging: 8 statements (message receive, friends data)
- Error handling: 10 statements (various error paths)
- Trade/evolution handlers: 5 statements

**Other files with console statements:**
- `apps/web/src/app/(auth)/signup/page.tsx` - 8 statements (auth flow debugging)
- `apps/web/src/app/(auth)/login/page.tsx` - 1 statement
- `apps/web/src/components/game/*.tsx` - Scattered warnings and errors

**Recommendation:** Keep console.error for production error reporting, remove console.log for debugging. Consider adding a logger utility with DEBUG flag.

### Debug Comments Found
| File | Comment |
|------|---------|
| `gameSocket.ts:140` | `// Debug handler` |
| `gameSocket.ts:254` | `// Debug: Log all incoming messages` |
| `gameSocket.ts:1035` | `// Debug level up handler` |
| `GameShell.tsx:52` | `// TODO: Replace with real data...` |

## Current Lint/Type Status

### Summary
- **Total Problems:** 123 (37 errors, 86 warnings)
- **Blocking Errors:** 37

### Error Breakdown by Category

#### React Purity Errors (react-hooks/purity)
**File:** `EvolutionModal.tsx`
**Issue:** `Math.random()` called in useMemo during render
**Fix:** Use seeded random or move to useEffect/useState initialization

```typescript
// Current (BROKEN):
const sparklePositions = useMemo(() =>
  [...Array(20)].map((_, i) => ({
    left: `${15 + Math.random() * 70}%`,
    // ...
  })), [activeEvolution?.pokemon_id])

// Fixed:
const [sparklePositions] = useState(() =>
  [...Array(20)].map((_, i) => ({
    left: `${15 + (seededRandom(i) * 70)}%`,
    // ...
  }))
)
```

#### setState in useEffect Errors (react-hooks/set-state-in-effect)
**Files:** `GymBattlePanel.tsx`, `useBattleAnimation.ts`
**Count:** 10+ errors
**Issue:** Synchronous setState calls in useEffect causing cascading renders
**Fix:** Move state initialization to component body or use useSyncExternalStore pattern

#### Unused Variables (86 warnings)
**Primary locations:**
- `gameSocket.ts` - 20+ unused imports (Guild types, etc.)
- `BoxPanel.tsx` - Unused getIVGrade, IVStats, IVGrade
- `placeholderSprites.ts`, `spriteAnimation.ts`, `spriteCatalog.ts` - Unused sprite constants

#### img Element Warnings (6 warnings)
**Files:** signup/page.tsx, BattleHud.tsx, ClassicBattleHud.tsx, EvolutionModal.tsx
**Fix:** Replace `<img>` with `<Image />` from `next/image` where beneficial (not always needed for sprites)

## Storybook Current State

### Configuration
**Version:** Storybook 10.1.11
**Framework:** `@storybook/nextjs-vite`
**Config files:**
- `.storybook/main.ts`
- `.storybook/preview.ts`

### Current Build Script
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

### Required Changes for /storybook Deployment

#### 1. Fix MDX Indexing Errors
**Current Error:**
```
Unable to index files:
- ./src/stories/showcase/BattleUI.mdx: Unexpected character `2`
- ./src/stories/showcase/InventoryUI.mdx: Unexpected character `1`
```

**Likely Cause:** MDX v2/v3 parsing issues in Storybook 10. The `<` character or import paths may need escaping.

**Investigation needed:** The MDX files appear syntactically correct. The error may be related to:
1. File path containing numbers being misinterpreted
2. Import statement parsing issues
3. Canvas component rendering

**Fix approaches:**
- Run `npx storybook automigrate` to identify issues
- Simplify MDX files to just component stories without showcase MDX
- Update import syntax if needed

#### 2. Update Build Output Directory
**Change:** Add `--output-dir public/storybook` to build command

**New script:**
```json
"build-storybook": "storybook build --output-dir public/storybook"
```

#### 3. Integrate into Main Build
**Current build script:**
```json
"build": "cd ../../packages/shared && npm run build && cd ../../apps/web && next build"
```

**New build script:**
```json
"build": "cd ../../packages/shared && npm run build && cd ../../apps/web && storybook build --output-dir public/storybook && next build"
```

**Note:** Storybook must build BEFORE Next.js so the static files are in `public/` for Next.js to copy.

### Existing Stories
| Component | Stories File | Stories Count |
|-----------|-------------|---------------|
| Button | Button.stories.tsx | 9 stories (including BeveledButton) |
| Card | Card.stories.tsx | 6 stories |
| Badge | Badge.stories.tsx | 7 stories |

### Components Needing Stories
| Component | File | Priority |
|-----------|------|----------|
| ProgressBar | ProgressBar.tsx | HIGH - Has HP/XP variants |
| Tooltip | Tooltip.tsx | MEDIUM - Complex positioning |

### Showcase MDX Files (6 files)
- CoreUI.mdx - Comprehensive component library
- BattleUI.mdx - Battle screen components
- InventoryUI.mdx - Shop/box/pokedex components
- PartyUI.mdx - Party management components
- MapUI.mdx - Map navigation components
- SocialUI.mdx - Chat/guild components

**Status:** These files have parsing errors and need to be fixed or simplified.

## E2E Testing Setup Requirements

### Current State
- **Playwright:** Not installed
- **Cypress:** Not installed
- **Test files:** None in `e2e/` or `*.spec.ts` patterns

### Recommended: Playwright

**Why Playwright over Cypress:**
1. Built-in Next.js support with webServer config
2. Faster test execution with parallel workers
3. Better CI/CD integration
4. Official Next.js documentation recommends it
5. Free and open source (Cypress requires payment for parallel)

### Installation

```bash
npm init playwright@latest
```

**Prompts to answer:**
- Where to put E2E tests: `e2e` or `tests`
- Add GitHub Actions workflow: Yes (optional)
- Install browsers: Yes

### Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Desktop (1440px)
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    // Tablet (768px)
    {
      name: 'tablet',
      use: { ...devices['iPad'], viewport: { width: 768, height: 1024 } },
    },
    // Mobile (375px)
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test Scope (from CONTEXT.md)
**Core gameplay loop:**
1. Login/signup flow
2. Zone navigation
3. Pokemon encounter/catch
4. Party management

**Guild basics:**
1. Guild create
2. Guild join
3. Guild chat

### Test Structure Recommendation

```
e2e/
  auth/
    login.spec.ts
    signup.spec.ts
  gameplay/
    zone-navigation.spec.ts
    pokemon-catch.spec.ts
    party-management.spec.ts
  guild/
    guild-create-join.spec.ts
    guild-chat.spec.ts
  helpers/
    auth.ts       # Login helper for reuse
    test-data.ts  # Test accounts, mock data
```

### Package.json Scripts

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug"
```

## Build Integration Approach

### Final Build Script Structure

```json
{
  "scripts": {
    "build": "cd ../../packages/shared && npm run build && cd ../../apps/web && npm run build:storybook && next build",
    "build:storybook": "storybook build --output-dir public/storybook",
    "storybook": "storybook dev -p 6006",
    "test:e2e": "playwright test",
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

### Build Order
1. Build shared package
2. Build Storybook to `public/storybook`
3. Build Next.js (includes `public/` in output)

### Deployment Verification
After build, verify:
- `/storybook/index.html` exists
- All Storybook assets load
- No 404s for JS/CSS bundles

## Common Pitfalls

### Pitfall 1: Storybook staticDirs Conflict
**What goes wrong:** Building Storybook to `public/storybook` while `staticDirs: ["../public"]` causes recursive copy
**Why it happens:** Storybook tries to copy `public/` which now contains `storybook/` output
**How to avoid:** Build Storybook first, then Next.js. The existing staticDirs config is fine.
**Warning signs:** Build hangs or produces massive output

### Pitfall 2: E2E Tests Against Dev Server
**What goes wrong:** Tests pass in dev but fail in production
**Why it happens:** Dev server has hot reload, different caching, debug behavior
**How to avoid:** Always test against production build (`npm run build && npm run start`)
**Warning signs:** Flaky tests, timing-dependent failures

### Pitfall 3: Console.log in Production
**What goes wrong:** Debug logs leak to production, expose internal state
**Why it happens:** Forgot to remove development debugging
**How to avoid:** Lint rule or build-time strip of console.log
**Warning signs:** Browser console showing game state in production

### Pitfall 4: Incomplete Experimental Removal
**What goes wrong:** Dead imports, orphaned files, broken references
**Why it happens:** Manual removal misses dependencies
**How to avoid:** After removal, run `npm run build` and `npm run lint` to catch issues
**Warning signs:** TypeScript errors, missing exports

## Architecture Patterns

### Pattern: Conditional Debug Logging
**What:** Single logger that respects environment
**When to use:** Replace scattered console.log
**Example:**
```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
}
```

### Pattern: Page Object Model for E2E
**What:** Abstraction layer for UI interactions
**When to use:** E2E tests with shared UI patterns
**Example:**
```typescript
// e2e/pages/game.page.ts
export class GamePage {
  constructor(private page: Page) {}

  async navigateToZone(zoneName: string) {
    await this.page.getByRole('button', { name: zoneName }).click()
    await this.page.waitForURL(`**/game?zone=*`)
  }

  async catchPokemon() {
    await this.page.getByRole('button', { name: 'Catch' }).click()
    await this.page.waitForSelector('[data-testid="catch-result"]')
  }
}
```

## Open Questions

1. **MDX Error Root Cause**
   - What we know: Files appear syntactically correct
   - What's unclear: Why Storybook 10 fails to index them
   - Recommendation: Try removing showcase MDX files first, add back incrementally

2. **E2E Test Accounts**
   - What we know: Need authenticated tests
   - What's unclear: Test account strategy (dedicated accounts? seed data?)
   - Recommendation: Create dedicated test accounts in Supabase for E2E

3. **Storybook in CI/CD**
   - What we know: Building to public/ works locally
   - What's unclear: Vercel build behavior with Storybook
   - Recommendation: Test deployment to Vercel preview before merging

## Sources

### Primary (HIGH confidence)
- Codebase audit via Glob/Grep/Read tools
- ESLint output from `npm run lint`
- Package.json and Storybook config files
- [Next.js Playwright Testing Guide](https://nextjs.org/docs/pages/guides/testing/playwright)

### Secondary (MEDIUM confidence)
- [Playwright Best Practices 2026](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/)
- [Storybook Static Build Docs](https://storybook.js.org/docs/configure/integration/images-and-assets)
- [MDX Troubleshooting](https://mdxjs.com/docs/troubleshooting-mdx/)

### Tertiary (LOW confidence)
- [Storybook MDX v2 Issues](https://github.com/storybookjs/storybook/discussions/24789) - May not apply to v10

## Metadata

**Confidence breakdown:**
- Files to remove: HIGH - Direct codebase audit
- Lint issues: HIGH - ESLint output
- Storybook config: HIGH - Direct file reading
- E2E setup: HIGH - Official Next.js docs
- MDX error fix: MEDIUM - Need to validate approach

**Research date:** 2026-01-21
**Valid until:** 30 days (stable domain, no fast-moving dependencies)
