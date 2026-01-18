# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**
- Not configured
- No test framework detected in `package.json` files
- No Jest, Vitest, or other test config files present

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
# npm test is not defined
```

## Test File Organization

**Location:**
- No test files detected in the codebase
- Pattern expected (if tests were added): co-located `*.test.ts` / `*.test.tsx` files

**Naming:**
- Not established (no test files exist)

**Structure:**
- Not established

## Test Structure

**Suite Organization:**
- Not established (no tests present)

**Recommended Pattern (if adding tests):**
```typescript
describe('ComponentName or functionName', () => {
  describe('scenario', () => {
    it('should expected behavior', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not established

**What to Mock (recommendations based on architecture):**
- WebSocket connections (`ws`)
- Supabase client
- External API calls (if any)

**What NOT to Mock:**
- Pure calculation functions (in `game.ts`)
- Type utilities
- Simple helper functions

## Fixtures and Factories

**Test Data:**
- Not established

**Location:**
- Suggest: `__fixtures__/` or `test/fixtures/` if tests added

**Recommended Pattern:**
```typescript
// Example factory for Pokemon
function createMockPokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'test-pokemon-1',
    owner_id: 'test-player-1',
    species_id: 1,
    level: 5,
    // ... defaults
    ...overrides
  }
}
```

## Coverage

**Requirements:**
- None enforced (no tests)

**View Coverage:**
```bash
# Not available
```

## Test Types

**Unit Tests:**
- Not present
- Candidates for unit testing:
  - `apps/game-server/src/game.ts` - Pure calculation functions
    - `calculateHP()`, `calculateStat()`, `xpForLevel()`
    - `getTypeEffectiveness()`, `calculateDamage()`
    - `rollEncounter()`, `rollLevel()`, `rollShiny()`
  - `packages/shared/src/index.ts` - XP utilities
    - `xpForLevel()`, `getXPProgress()`
  - `apps/web/src/lib/ui/index.ts` - Formatting utilities
    - `formatNumber()`, `formatTime()`, `formatRelativeTime()`, `cn()`

**Integration Tests:**
- Not present
- Candidates:
  - WebSocket message handling (`hub.ts` + `gameSocket.ts`)
  - Database operations (`db.ts`)
  - State store actions (`gameStore.ts`)

**E2E Tests:**
- Not present
- Framework not configured (Playwright or Cypress would be candidates)

## Common Patterns

**Async Testing:**
- Not established
- Recommended:
```typescript
it('should handle async operation', async () => {
  const result = await someAsyncFunction()
  expect(result).toBe(expectedValue)
})
```

**Error Testing:**
- Not established
- Recommended:
```typescript
it('should throw on invalid input', () => {
  expect(() => functionWithValidation(invalidInput)).toThrow()
})
```

## Testing Gaps Analysis

**Critical Untested Code:**

1. **Game Logic** (`apps/game-server/src/game.ts`):
   - Battle simulation (`simulate1v1Battle`, `resolveBattle`)
   - Catch mechanics (`attemptCatch`)
   - XP/Level calculations
   - Evolution logic (`findEvolutionTarget`, `checkEvolutions`)
   - Type effectiveness chart
   - These are pure functions with complex logic - high value test targets

2. **Database Operations** (`apps/game-server/src/db.ts`):
   - Player data CRUD
   - Pokemon storage/retrieval
   - Party management
   - Integration tests would catch schema mismatches

3. **WebSocket Hub** (`apps/game-server/src/hub.ts`):
   - Message routing
   - Session management
   - Authentication flow
   - Tick loop timing

4. **State Management** (`apps/web/src/stores/gameStore.ts`):
   - State transitions
   - Side effects
   - Zustand persistence

5. **UI Components** (`apps/web/src/components/`):
   - Rendering with various props
   - Event handler triggers
   - Conditional rendering logic

**Recommended Priority for Adding Tests:**

1. **High Priority** - Pure game logic functions:
   - File: `apps/game-server/src/game.ts`
   - Functions: `calculateHP`, `calculateDamage`, `getTypeEffectiveness`, `attemptCatch`
   - Rationale: Pure functions, easy to test, core game balance

2. **Medium Priority** - State management:
   - File: `apps/web/src/stores/gameStore.ts`
   - Actions: `setParty`, `updatePokemonInParty`, `applyXPGains`
   - Rationale: State transitions affect entire app

3. **Medium Priority** - WebSocket message handlers:
   - File: `apps/web/src/lib/ws/gameSocket.ts`
   - Handlers: `handleTick`, `handleGameState`, `handleEvolution`
   - Rationale: Critical data flow path

4. **Lower Priority** - UI components:
   - Files: `apps/web/src/components/ui/*.tsx`
   - Rationale: Visual verification often sufficient

## Recommended Test Setup

If adding tests, consider:

**For Backend (game-server):**
```json
// package.json additions
{
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**For Frontend (web):**
```json
// package.json additions
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^3.0.0",
    "jsdom": "^24.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Vitest Config (suggested):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // for React tests
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
```

## Manual Testing Patterns

**Current Approach:**
- Manual browser testing
- Console logging with prefixes (`[WS]`, `[Evolution]`)
- Debug commands exposed in development:
  - `window.__gameSocket` for WebSocket debugging

**Recommended Manual Test Cases:**
1. Authentication flow (login/signup)
2. WebSocket reconnection
3. Battle sequence animations
4. Evolution prompt flow
5. Party management (swap, remove)
6. Shop purchase flow
7. Chat message sending/receiving

---

*Testing analysis: 2026-01-18*
