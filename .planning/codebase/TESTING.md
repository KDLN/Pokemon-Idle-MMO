# Testing Patterns

**Analysis Date:** 2025-01-19

## Test Framework

**Runner:**
- Not configured - no test framework installed
- No Jest, Vitest, or other test runner present in `package.json`

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
# Tests would need to be added to package.json scripts
```

## Test File Organization

**Location:**
- No test files exist in the codebase
- No `__tests__` directories
- No `.test.ts` or `.spec.ts` files (only in node_modules)

**Recommended Pattern (if adding tests):**
- Co-located tests: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Or separate `__tests__/` directories per feature

## Current Testing Status

**Coverage:** No automated testing

**Manual Testing:**
- Development servers for both apps
- Browser-based testing of UI
- Console logging for debugging WebSocket messages

## Recommended Test Setup

**For Frontend (apps/web):**

Install Vitest (recommended for Vite/Next.js):
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

**For Game Server (apps/game-server):**

Install Vitest:
```bash
npm install -D vitest
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

## Test Structure (Recommended)

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { calculateHP, calculateStat, xpForLevel } from './game'

describe('calculateHP', () => {
  it('calculates HP correctly at level 1 with 0 IVs', () => {
    // Base HP 45, Level 1, IV 0
    expect(calculateHP(45, 1, 0)).toBe(11)
  })

  it('calculates HP correctly at level 50 with max IVs', () => {
    // Base HP 45, Level 50, IV 31
    expect(calculateHP(45, 50, 31)).toBe(120)
  })
})
```

**Patterns:**
- Group related tests in `describe` blocks
- Clear test names describing expected behavior
- One assertion per test when possible
- Use `beforeEach` for shared setup

## Mocking (Recommended)

**Framework:** Vitest built-in mocking

**Patterns:**
```typescript
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null }),
    })),
  })),
}))

// Mock WebSocket
vi.mock('ws', () => ({
  WebSocket: vi.fn(),
  WebSocketServer: vi.fn(() => ({
    on: vi.fn(),
  })),
}))
```

**What to Mock:**
- External APIs (Supabase)
- WebSocket connections
- Time-based functions (`Date.now()`, `setTimeout`)
- Random number generation for deterministic tests

**What NOT to Mock:**
- Pure calculation functions (`calculateHP`, `xpForLevel`)
- Type utilities and helpers
- State management logic

## Fixtures and Factories (Recommended)

**Test Data:**
```typescript
// tests/fixtures/pokemon.ts
import type { Pokemon, PokemonSpecies } from '@pokemon-idle/shared'

export const mockSpecies: PokemonSpecies = {
  id: 1,
  name: 'Bulbasaur',
  type1: 'GRASS',
  type2: 'POISON',
  base_hp: 45,
  base_attack: 49,
  base_defense: 49,
  base_sp_attack: 65,
  base_sp_defense: 65,
  base_speed: 45,
  base_catch_rate: 45,
  base_xp_yield: 64,
  evolves_from_species_id: null,
  evolution_level: 16,
  evolution_method: 'level',
}

export const mockPokemon: Pokemon = {
  id: 'test-pokemon-1',
  owner_id: 'test-player-1',
  species_id: 1,
  nickname: null,
  level: 5,
  xp: 125,
  current_hp: 20,
  max_hp: 20,
  stat_attack: 10,
  stat_defense: 10,
  stat_sp_attack: 12,
  stat_sp_defense: 12,
  stat_speed: 10,
  iv_hp: 15,
  iv_attack: 15,
  iv_defense: 15,
  iv_sp_attack: 15,
  iv_sp_defense: 15,
  iv_speed: 15,
  party_slot: 1,
  caught_at: '2025-01-01T00:00:00Z',
  is_shiny: false,
}

export function createMockPokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return { ...mockPokemon, ...overrides }
}
```

**Location:**
- `apps/game-server/tests/fixtures/`
- `apps/web/src/test/fixtures/`

## Coverage

**Requirements:** None enforced

**Recommended Targets:**
- Game logic (calculation functions): 90%+
- WebSocket message handlers: 80%+
- React components: 70%+
- Utilities: 90%+

**View Coverage (if configured):**
```bash
npm run test -- --coverage
```

## Test Types

**Unit Tests:**
- Pure functions (stat calculations, XP formulas)
- Type effectiveness calculations
- Utility functions (`cn()`, `formatNumber()`)
- State update logic

**Integration Tests:**
- WebSocket message handling flow
- Store updates from server messages
- Database query chains

**E2E Tests:**
- Not configured
- Playwright or Cypress recommended for future
- Would cover: login flow, game actions, trades

## Common Patterns (Recommended)

**Async Testing:**
```typescript
import { describe, it, expect } from 'vitest'

describe('Database Operations', () => {
  it('fetches player by user ID', async () => {
    const player = await getPlayerByUserId('test-user-id')
    expect(player).not.toBeNull()
    expect(player?.username).toBe('TestPlayer')
  })
})
```

**Error Testing:**
```typescript
describe('Error Handling', () => {
  it('returns null when player not found', async () => {
    const player = await getPlayerByUserId('nonexistent-id')
    expect(player).toBeNull()
  })

  it('returns empty array when no encounters', async () => {
    const encounters = await getEncounterTable(999)
    expect(encounters).toEqual([])
  })
})
```

**Zustand Store Testing:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useGameStore } from '@/stores/gameStore'

describe('Game Store', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('sets player data', () => {
    const { result } = renderHook(() => useGameStore())

    act(() => {
      result.current.setPlayer(mockPlayer)
    })

    expect(result.current.player).toEqual(mockPlayer)
  })
})
```

## Priority Test Areas

**High Priority (game-critical logic):**
1. `apps/game-server/src/game.ts` - Battle calculations, stat formulas
2. `apps/game-server/src/ivs.ts` - IV generation
3. `packages/shared/src/index.ts` - XP calculations

**Medium Priority:**
4. `apps/game-server/src/db.ts` - Database query functions
5. `apps/web/src/stores/gameStore.ts` - State management
6. `apps/web/src/lib/ui/index.ts` - UI utilities

**Lower Priority:**
7. React components (visual testing)
8. WebSocket integration tests

---

*Testing analysis: 2025-01-19*
