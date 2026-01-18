# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Real-time Client-Server Architecture with WebSocket Communication

**Key Characteristics:**
- Monorepo with three packages: web app, game server, shared types
- Game server runs a 1-second tick loop, pushing state updates to connected clients
- Frontend uses client-side state management (Zustand) synced via WebSocket messages
- Supabase handles authentication (JWT), database (PostgreSQL), and RLS policies
- Stateful server: player sessions are held in-memory on game server

## Layers

**Presentation Layer (Frontend):**
- Purpose: Render game UI, handle user interactions, animate encounters
- Location: `apps/web/src/`
- Contains: React components, Zustand store, WebSocket client, Tailwind CSS
- Depends on: Game server (WebSocket), Supabase (Auth)
- Used by: Browser clients

**Game Logic Layer (Game Server):**
- Purpose: Process game ticks, battles, catches, evolution, trading, chat
- Location: `apps/game-server/src/`
- Contains: Hub (WebSocket management), Game (battle logic), DB queries
- Depends on: Supabase (Database, JWT verification)
- Used by: Frontend via WebSocket

**Shared Types Layer:**
- Purpose: TypeScript interfaces shared between frontend and backend
- Location: `packages/shared/src/`
- Contains: Type definitions, XP calculation utilities
- Depends on: Nothing
- Used by: Both apps/web and apps/game-server

**Data Layer (Supabase):**
- Purpose: Persistent storage, authentication, row-level security
- Location: `supabase/migrations/` (schema)
- Contains: PostgreSQL tables, RLS policies, database functions
- Depends on: Supabase cloud service
- Used by: Game server (via service key), Frontend (via anon key for auth only)

## Data Flow

**Game Tick Flow:**

1. Server runs 1-second tick loop in `hub.ts`
2. For each connected client, call `processTick()` from `game.ts`
3. Tick checks for encounters, battles, XP, evolution eligibility
4. Server sends `tick` message with results to client WebSocket
5. Frontend receives tick, updates Zustand store, triggers animations

**Authentication Flow:**

1. User logs in via Supabase Auth on frontend
2. Frontend receives JWT access token
3. Client connects to WebSocket with token in query string: `?token=JWT`
4. Server validates JWT using jose library against Supabase JWKS endpoint
5. Server loads player session from database

**Zone Movement Flow:**

1. Frontend sends `move_zone` message with target zone_id
2. Server validates zone connectivity, updates player in DB
3. Server loads new zone's encounter table
4. Server sends `zone_update` to client with new zone and connected zones
5. Server broadcasts `nearby_players` to all players in old and new zones

**State Management:**
- Server holds authoritative state in `PlayerSession` objects (in-memory)
- Frontend holds UI state in Zustand store with persistence middleware
- State syncs via WebSocket messages on connect and on state changes
- Reconnection triggers full state refresh from server

## Key Abstractions

**PlayerSession (Server):**
- Purpose: In-memory representation of connected player's game state
- Examples: `apps/game-server/src/types.ts` (PlayerSession interface)
- Pattern: Mutable object updated on each tick, persisted to DB on changes

**GameStore (Frontend):**
- Purpose: Client-side state container for all game data
- Examples: `apps/web/src/stores/gameStore.ts`
- Pattern: Zustand store with actions for each state mutation

**WebSocket Message Protocol:**
- Purpose: Structured communication between client and server
- Examples: `{ type: string, payload: unknown }` format
- Pattern: Type-based routing with handler map

**Encounter Event:**
- Purpose: Represents a wild Pokemon encounter with battle/catch data
- Examples: `packages/shared/src/types/catching.ts`
- Pattern: Immutable data object passed from server to client

## Entry Points

**Frontend Entry:**
- Location: `apps/web/src/app/game/page.tsx`
- Triggers: User navigates to /game route
- Responsibilities: Auth check, redirect if needed, render GameShell with access token

**Game Server Entry:**
- Location: `apps/game-server/src/index.ts`
- Triggers: Node.js process start
- Responsibilities: Initialize DB connection, start GameHub on port

**WebSocket Connection Entry:**
- Location: `apps/game-server/src/hub.ts` (handleConnection method)
- Triggers: Client WebSocket connection
- Responsibilities: Validate JWT, load session, send initial state, register handlers

## Error Handling

**Strategy:** Graceful degradation with error messages to client

**Patterns:**
- Server catches all errors in message handlers, sends `error` message to client
- Database query failures return null/empty, logged to console
- WebSocket disconnect triggers cleanup and trade cancellation
- Frontend displays connection status indicator, auto-reconnects with exponential backoff

## Cross-Cutting Concerns

**Logging:** Console.log statements throughout server code. No structured logging framework.

**Validation:** Server validates all client messages before processing. Zone connectivity, item ownership, trade participation all checked.

**Authentication:** JWT verified on every WebSocket connection. No per-message auth (trust established connection). Player ownership verified on all mutations.

**Rate Limiting:** Encounter cooldown (8 ticks), whisper rate limit (10 per 10 seconds).

---

*Architecture analysis: 2026-01-18*
