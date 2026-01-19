# Coding Conventions

**Analysis Date:** 2025-01-19

## Naming Patterns

**Files:**
- Components: PascalCase (`PokemonCard.tsx`, `GuildPanel.tsx`, `ChatMessage.tsx`)
- Utilities/libs: camelCase (`gameSocket.ts`, `friendUtils.ts`, `timeOfDay.ts`)
- Types: camelCase (`game.ts`, `chat.ts`, `friends.ts`, `trade.ts`)
- Index files: `index.ts` for barrel exports

**Functions:**
- camelCase for all functions: `handleTick`, `getSpeciesData`, `calculateHP`
- Event handlers prefixed with `handle`: `handleGameState`, `handleChatMessage`
- Boolean functions prefixed with `is`/`has`/`can`: `isPlayerMuted`, `isConnected`
- Getters prefixed with `get`: `getTypeColor`, `getStaggerDelay`
- Setters prefixed with `set`: `setPlayer`, `setGuildMembers`

**Variables:**
- camelCase for all variables: `speciesMap`, `currentEncounter`, `whisperHistory`
- UPPER_SNAKE_CASE for constants: `CHAT_CHANNELS`, `MAX_CHAT_LENGTH`, `SHINY_RATE`
- Private class members prefixed with `private`: `private ws: WebSocket`

**Types/Interfaces:**
- PascalCase: `PlayerSession`, `GuildMember`, `TradeOffer`
- Props interfaces: `{ComponentName}Props` pattern (`ButtonProps`, `PokemonCardProps`)
- Payloads suffixed with `Payload`: `GuildDataPayload`, `TickResult`

**Database Columns:**
- snake_case: `player_id`, `current_zone_id`, `iv_attack`, `created_at`

## Code Style

**Formatting:**
- No Prettier or other formatter configured
- 2-space indentation (implicit from TypeScript defaults)
- Single quotes for strings (consistent in codebase)
- Semicolons omitted (Next.js default)
- Trailing commas in multiline objects/arrays

**Linting:**
- ESLint with Next.js config (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`)
- Config location: `apps/web/eslint.config.mjs`
- No custom rules beyond Next.js defaults
- Run with: `npm run lint`

**TypeScript:**
- Strict mode enabled in both apps
- No `any` types (use `unknown` and type guards)
- Explicit return types on exported functions
- Use `type` imports: `import type { Player } from '@/types/game'`

## Import Organization

**Order:**
1. React imports: `'use client'` directive first, then `import { ... } from 'react'`
2. External packages: `@supabase/supabase-js`, `zustand`, `jose`, `ws`
3. Internal packages: `@pokemon-idle/shared`
4. Path aliases: `@/stores/...`, `@/types/...`, `@/lib/...`, `@/components/...`
5. Relative imports (if any)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- `@pokemon-idle/shared` maps to `../../packages/shared/dist/index`

**Example:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { create } from 'zustand'
import type { Guild, GuildMember } from '@pokemon-idle/shared'
import { useGameStore } from '@/stores/gameStore'
import type { ChatMessageData } from '@/types/chat'
import { cn, getSpeciesData } from '@/lib/ui'
import { Button } from '@/components/ui/Button'
```

## Error Handling

**Patterns:**
- Database errors logged with `console.error()` and return safe defaults:
```typescript
if (error) {
  console.error('Failed to get player:', error)
  return null
}
```
- WebSocket errors caught and logged, reconnection scheduled
- No throw statements in data fetching - return `null` or empty arrays
- Type guards for unknown payloads: `const data = payload as GuildDataPayload`

**Server-side:**
- Database operations return `null` or empty arrays on failure
- Validation errors sent to client via `error` message type
- Rate limiting with in-memory maps and periodic cleanup

**Client-side:**
- Store error state in Zustand (`guildError`, `setGuildError`)
- Display errors in system chat or toast notifications
- Graceful degradation - show loading states, not crashes

## Logging

**Framework:** `console.log`, `console.error` (native)

**Patterns:**
- Prefix WebSocket logs with `[WS]`: `console.log('[WS] Received:', msg.type)`
- Prefix debug logs: `console.log('[Debug] Level up result:', result)`
- Server startup: `console.log(\`WebSocket server running on port ${port}\`)`
- Error contexts: `console.error('Guild bank error:', data.error)`

**When to Log:**
- WebSocket connection/disconnection events
- Incoming message types (in development)
- Error conditions with context
- Server startup and configuration

## Comments

**When to Comment:**
- Section headers in large files using `// ============================================`
- Complex game logic (type effectiveness, stat calculations)
- Race condition mitigations with explanation
- Temporary workarounds with TODO markers

**JSDoc/TSDoc:**
- Not extensively used
- Function comments inline where complex
- Type interfaces self-documenting via property names

**Example section header:**
```typescript
// ============================================
// GUILD BANK HANDLERS
// ============================================
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Large message handlers acceptable (WebSocket handler pattern)
- Complex state updates in single Zustand action to avoid race conditions

**Parameters:**
- Destructure objects in function signatures where appropriate
- Use typed interfaces for complex parameter objects
- Optional parameters with defaults: `size?: 'sm' | 'md'`

**Return Values:**
- Return `null` for not-found queries
- Return empty arrays `[]` for list queries that fail
- Return objects with success/error fields for operations
- Use discriminated unions for complex returns

## Module Design

**Exports:**
- Named exports for all functions, types, components
- Default exports only for page components (Next.js requirement)
- Re-export patterns in index files for barrel exports

**Barrel Files:**
- Located at `components/game/*/index.ts`
- Re-export all public components: `export { WorldView } from './WorldView'`
- Used for: `@/components/game/world`, `@/components/game/social`, etc.

**Example barrel file:**
```typescript
// apps/web/src/components/game/world/index.ts
export { WorldView } from './WorldView'
export { TrainerSprite } from './TrainerSprite'
export { BackgroundLayer } from './BackgroundLayer'
```

## Component Patterns

**React Components:**
- Use `'use client'` directive for client components
- Props interface defined above component
- Destructure props in function signature
- Use `cn()` helper for conditional class names

**Example component structure:**
```typescript
'use client'

import { cn } from '@/lib/ui'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'base-classes',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

## State Management

**Zustand Store:**
- Single store at `apps/web/src/stores/gameStore.ts`
- Actions defined inline with state
- Use `get()` to access current state in actions
- Atomic updates for related state changes

**Pattern:**
```typescript
const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  setPlayer: (player) => set({ player }),

  // Complex updates use callback form
  addGuildMember: (member) =>
    set((state) => ({
      guildMembers: [...state.guildMembers, member],
      guild: state.guild
        ? { ...state.guild, member_count: state.guild.member_count + 1 }
        : null,
    })),
}))
```

## WebSocket Message Protocol

**Message Format:**
```typescript
{ type: string, payload: unknown }
```

**Handler Registration:**
```typescript
this.handlers.set('message_type', this.handleMessageType)
```

**Handler Naming:**
- Private methods with arrow functions to preserve `this`
- Prefixed with `handle`: `private handleGuildData = (payload: unknown) => { ... }`

---

*Convention analysis: 2025-01-19*
