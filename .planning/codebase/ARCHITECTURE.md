# Architecture

**Analysis Date:** 2026-01-19

## Pattern Overview

**Overall:** Client-Server Monorepo with Real-time WebSocket Communication

**Key Characteristics:**
- Monorepo with three packages: web frontend, game server, shared types/utilities
- Real-time game state synchronization via WebSocket (1-second tick loop)
- Supabase PostgreSQL as persistence layer with Row Level Security
- JWT-based authentication shared between REST and WebSocket connections
- Zustand-based client state management with persistence middleware

## Layers

**Frontend (Next.js Web App):**
- Purpose: React-based game UI with server-side rendering for auth pages
- Location: `apps/web/src/`
- Contains: React components, Zustand store, WebSocket client, Supabase SSR client
- Depends on: `@pokemon-idle/shared` package, Supabase, WebSocket server
- Used by: End users via browser

**Game Server (Node.js WebSocket):**
- Purpose: Authoritative game state, tick processing, real-time message handling
- Location: `apps/game-server/src/`
- Contains: WebSocket hub, game logic, database queries, session management
- Depends on: `@pokemon-idle/shared` package, Supabase service client
- Used by: Frontend via WebSocket connection

**Shared Package:**
- Purpose: Type definitions and utility functions shared between frontend and backend
- Location: `packages/shared/src/`
- Contains: TypeScript interfaces for all game entities, XP calculations
- Depends on: Nothing (pure TypeScript)
- Used by: Both `apps/web` and `apps/game-server`

**Database (Supabase PostgreSQL):**
- Purpose: Persistent storage for all game data with RLS policies
- Location: `supabase/migrations/` (schema definitions)
- Contains: Static game data (species, zones), player data (pokemon, inventory)
- Depends on: Supabase infrastructure
- Used by: Game server via service key, frontend via anon key with RLS

## Data Flow

**Authentication Flow:**

1. User authenticates via Supabase Auth (login/signup pages)
2. Frontend receives JWT access token from Supabase session
3. Frontend passes JWT as query param when connecting to WebSocket: `?token=JWT`
4. Game server validates JWT against Supabase JWKS endpoint using jose library
5. On validation, server loads player session from database

**Real-time Game Loop:**

1. Game server runs tick loop every 1 second (`hub.ts:processTicks()`)
2. Each tick processes encounters, battles, XP gains for all connected players
3. Tick results sent to clients via WebSocket: `{ type: 'tick', payload: TickResult }`
4. Frontend Zustand store updates with new state, React re-renders affected components
5. Pending animations (battles, evolutions) queue state updates until complete

**Client-Server Message Flow:**

1. Client sends JSON message: `{ type: string, payload: unknown }`
2. Server `handleMessage()` switch-cases on `type` to route to handler
3. Handler validates session, executes game logic, updates database
4. Server sends response(s) back to client (and sometimes broadcasts to others)
5. Client `gameSocket.ts` message handlers update Zustand store

**State Management:**
- Server maintains in-memory `PlayerSession` objects per connected client
- Session includes: player data, party, zone, inventory, pending evolutions, guild info
- Client Zustand store mirrors relevant server state with UI-specific additions
- Some state persisted to localStorage via Zustand persist middleware (trainer customization)

## Key Abstractions

**PlayerSession (Server-side):**
- Purpose: In-memory representation of connected player's current game state
- Examples: `apps/game-server/src/types.ts` (interface), `apps/game-server/src/hub.ts` (usage)
- Pattern: Loaded on WebSocket connect, updated during gameplay, synced to DB

**GameStore (Client-side):**
- Purpose: Centralized reactive state container for all UI data
- Examples: `apps/web/src/stores/gameStore.ts`
- Pattern: Zustand store with actions, partial persistence, selector-based subscriptions

**GameSocket (Client-side singleton):**
- Purpose: WebSocket connection manager with message routing
- Examples: `apps/web/src/lib/ws/gameSocket.ts`
- Pattern: Singleton class, handler map for message types, reconnection logic

**Shared Types:**
- Purpose: Single source of truth for data shapes
- Examples: `packages/shared/src/types/core.ts`, `packages/shared/src/types/guild.ts`
- Pattern: TypeScript interfaces re-exported from both server and client type files

## Entry Points

**Frontend Entry:**
- Location: `apps/web/src/app/layout.tsx` (root layout), `apps/web/src/app/game/page.tsx` (main game)
- Triggers: User navigates to `/game` route
- Responsibilities: Auth check, player existence check, render `GameShell` component

**Game Server Entry:**
- Location: `apps/game-server/src/index.ts`
- Triggers: `npm run dev` or `npm start`
- Responsibilities: Initialize database client, start WebSocket server, begin tick loop

**WebSocket Connection Handler:**
- Location: `apps/game-server/src/hub.ts:handleConnection()`
- Triggers: Client connects with `?token=JWT`
- Responsibilities: Validate token, load session, send initial game state, register handlers

**GameShell Component:**
- Location: `apps/web/src/components/game/GameShell.tsx`
- Triggers: Mounted when `/game` page renders
- Responsibilities: Initialize WebSocket connection, render game UI layout, manage modals

## Error Handling

**Strategy:** Fail-fast with user feedback, reconnection for transient failures

**Patterns:**
- WebSocket errors close connection with error code, client attempts reconnect
- Server sends `error` message type with payload `{ message: string }`
- Client `handleError()` updates store or shows notification
- Database errors logged server-side, generic error sent to client
- Invalid message types/payloads silently ignored (no crash)

## Cross-Cutting Concerns

**Logging:**
- Server uses `console.log/error` directly
- Structured format: `console.log('Event description:', data)`
- No client-side logging framework (browser console only)

**Validation:**
- Server validates all incoming WebSocket message payloads before processing
- Database constraints (CHECK, UNIQUE) provide last-line defense
- RLS policies enforce player-scoped data access
- Frontend validates forms before sending requests

**Authentication:**
- Supabase Auth handles user accounts, sessions, tokens
- Server validates JWT on every WebSocket connection (not per-message)
- Session state cached in-memory for duration of connection
- Reconnections require fresh token from Supabase client

---

*Architecture analysis: 2026-01-19*
