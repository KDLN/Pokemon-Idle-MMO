# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**
- React components: PascalCase (`PokemonCard.tsx`, `Button.tsx`, `HPBar.tsx`)
- Utility/service files: camelCase (`gameSocket.ts`, `gameStore.ts`)
- Type definition files: camelCase or lowercase (`game.ts`, `core.ts`, `battle.ts`)
- Backend modules: camelCase (`hub.ts`, `db.ts`, `game.ts`, `types.ts`)
- Index files for barrel exports: `index.ts`

**Functions:**
- camelCase for all functions: `handleLogin`, `moveToZone`, `calculateHP`
- Event handlers prefixed with `handle`: `handleTick`, `handleGameState`
- Getter functions prefixed with `get`: `getSpeciesData`, `getTypeColor`
- Boolean functions start with `is`/`has`/`roll`: `isConnected`, `rollEncounter`
- Message handlers use `handle` + message type: `handleEvolution`, `handleChatMessage`

**Variables:**
- camelCase: `reconnectAttempts`, `pokeballs`, `typeMultiplier`
- React state: `[value, setValue]` pattern
- Constants: SCREAMING_SNAKE_CASE for module-level constants: `SHINY_RATE`, `TYPE_COLORS`, `SPECIES_DATA`

**Types/Interfaces:**
- PascalCase: `Pokemon`, `PlayerSession`, `BattleResult`
- Props interfaces: `{ComponentName}Props` (e.g., `ButtonProps`, `PokemonCardProps`)
- Payloads/Data: descriptive PascalCase (`TickResult`, `EncounterEvent`)

**Database Columns:**
- snake_case in database: `species_id`, `current_hp`, `stat_attack`
- Mapped to camelCase in TypeScript where appropriate

## Code Style

**Formatting:**
- No Prettier config detected; rely on ESLint rules
- 2-space indentation (inferred from source files)
- Single quotes for strings in TypeScript
- Trailing commas in multiline arrays/objects
- Max line length: ~100-120 characters (flexible)

**Linting:**
- ESLint 9 with `eslint-config-next` for frontend
- Uses core-web-vitals and TypeScript presets
- No custom rules defined; follows Next.js defaults
- Config: `apps/web/eslint.config.mjs`

**TypeScript Settings:**
- Strict mode enabled: `"strict": true`
- No implicit any (via strict mode)
- ES Modules: `"type": "module"` in package.json
- Path aliases: `@/*` for frontend src, `@pokemon-idle/shared` for shared package

## Import Organization

**Order:**
1. Node.js built-ins (rare in this codebase)
2. External packages (`react`, `next`, `zustand`, `ws`, `jose`)
3. Internal packages (`@pokemon-idle/shared`)
4. Path-aliased imports (`@/lib/...`, `@/stores/...`, `@/components/...`)
5. Relative imports (`./types.js`, `./db.js`)

**Example from `apps/web/src/lib/ws/gameSocket.ts`:**
```typescript
import { useGameStore } from '@/stores/gameStore'
import type { TickResult, GameState, Zone, Pokemon } from '@/types/game'
import type { GymLeader, GymBattleResult } from '@/components/game/GymBattlePanel'
import type { ChatMessageData, ChatChannel } from '@/types/chat'
```

**Path Aliases:**
- Frontend: `@/*` maps to `./src/*`
- Both: `@pokemon-idle/shared` maps to shared package
- Configured in `tsconfig.json` paths

**Backend Import Convention:**
- Use `.js` extension for local imports (ESM requirement): `import { initDatabase } from './db.js'`
- Type-only imports: `import type { ... } from './types.js'`

## Error Handling

**Frontend Patterns:**
- Try/catch with state-based error display:
```typescript
try {
  const result = await someAsyncOperation()
} catch (err) {
  setError('An unexpected error occurred')
  console.error(err)
} finally {
  setLoading(false)
}
```

**Backend Patterns:**
- Try/catch with console.error and process.exit for fatal errors:
```typescript
try {
  initDatabase()
} catch (err) {
  console.error('Failed to initialize database:', err)
  process.exit(1)
}
```
- WebSocket message parsing uses try/catch with silent error logging

**Error Messages:**
- User-facing: Generic, non-technical ("An unexpected error occurred")
- Console: Detailed with original error object
- Server responses: JSON with `message` field

## Logging

**Framework:** `console` (native)

**Patterns:**
- Prefix logs with context: `[WS]`, `[Evolution]`, `[Evolution Handler]`
- Log message types on receive: `console.log('[WS] Received:', msg.type, msg.payload)`
- Debug logs for state transitions: `console.log('[applyEvolution] BEFORE: ...)`
- Error logs via `console.error` with full error object

**When to Log:**
- WebSocket message receipt/send
- State transitions (evolutions, level ups)
- Connection events (connect, disconnect, reconnect)
- Errors and failures

## Comments

**When to Comment:**
- Section headers using `// ===...===` delimiter pattern for large files
- Brief inline comments for non-obvious logic
- Type comments for complex data structures

**Example Section Headers:**
```typescript
// ============================================
// 1v1 BATTLE SYSTEM
// ============================================

// ============================================
// EVOLUTION LOGIC
// ============================================
```

**JSDoc/TSDoc:**
- Not used consistently
- Inline comments preferred for complex logic
- Type information carried by TypeScript interfaces

**TODO Pattern:**
- Use `TODO:` prefix for future work
- Example: `// TODO: Replace with real data from backend when news/events system is implemented`

## Function Design

**Size:**
- Small, focused functions (typically 10-40 lines)
- Larger functions broken into sections with comments

**Parameters:**
- Destructure props in React components: `({ pokemon, showXP = false, onClick }: PokemonCardProps)`
- Pass objects for many parameters; use defaults for optionals
- Order: required params first, optional with defaults last

**Return Values:**
- Single return type (no union unless necessary)
- Return objects for multiple values: `{ result, newBallCount }`
- Use `void` for side-effect functions (handlers, setters)

## Module Design

**Exports:**
- Named exports preferred over default exports
- One component per file (components)
- Related functions grouped in single file (utilities)
- Re-export from index files for packages

**Barrel Files:**
- `packages/shared/src/index.ts` re-exports all types
- `packages/shared/src/types/index.ts` re-exports type modules
- `apps/web/src/lib/ui/index.ts` exports constants and utilities

**React Component Files:**
- Single component export per file
- Related helper components in same file if small (`HeldItemSlot`, `EmptyPokemonSlot`)
- Styled variant maps at top of file (`sizeClasses`, `variantClasses`)

## React Component Patterns

**Client Components:**
- Mark with `'use client'` directive at top
- Use hooks: `useState`, `useRouter`, `useGameStore`

**Props Pattern:**
```typescript
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
```

**Variant/Size Mapping:**
```typescript
const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const variantClasses = {
  primary: 'bg-gradient-to-b from-[#3B4CCA] to-[#2a3b9a]',
  secondary: 'bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]',
}
```

**Conditional Classes:**
- Use `cn()` utility from `@/lib/ui`: `cn('base-class', condition && 'conditional-class')`

## WebSocket Message Protocol

**Client-to-Server:**
- JSON format: `{ type: string, payload: unknown }`
- Types: `move_zone`, `swap_party`, `get_state`, `send_chat_message`
- Payload contains required data for the action

**Server-to-Client:**
- Same JSON format
- Types: `tick`, `game_state`, `error`, `evolution`, `chat_message`
- Handlers registered in constructor, called via Map lookup

## State Management (Zustand)

**Store Pattern:**
- Single store for game state at `apps/web/src/stores/gameStore.ts`
- Actions are methods on the store
- Persistence middleware for key state

**Naming Actions:**
- Setters: `setPlayer`, `setParty`, `setZone`
- Adders: `addChatMessage`, `addLevelUps`
- Updaters: `updatePokemonInParty`, `updateFriendZone`

---

*Convention analysis: 2026-01-18*
