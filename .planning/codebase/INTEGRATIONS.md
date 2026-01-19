# External Integrations

**Analysis Date:** 2026-01-19

## APIs & External Services

**PokeAPI (Sprites Only):**
- Used for Pokemon sprite images
- Configured in `apps/web/next.config.ts` as allowed remote image source
- Pattern: `https://raw.githubusercontent.com/PokeAPI/sprites/**`
- No API calls made - static sprite URLs only

## Data Storage

**Primary Database:**
- Supabase PostgreSQL (managed)
- Connection:
  - Frontend: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Game Server: `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (service role bypasses RLS)
  - Direct: `DATABASE_URL` (PostgreSQL connection string)

**Client Libraries:**
- Frontend Browser: `@supabase/ssr` createBrowserClient (`apps/web/src/lib/supabase/client.ts`)
- Frontend Server: `@supabase/ssr` createServerClient (`apps/web/src/lib/supabase/server.ts`)
- Game Server: `@supabase/supabase-js` createClient (`apps/game-server/src/db.ts`)

**Database Schema:**
- 30+ migrations in `supabase/migrations/` (001_initial_schema.sql through 030_cerulean_city.sql)
- Core tables: `players`, `pokemon`, `pokemon_species`, `zones`, `inventory`
- Social tables: `friends`, `trades`, `chat_messages`, `guilds`, `guild_members`
- RLS policies scope player data - each user sees only their own data
- Game server uses service key to bypass RLS for cross-player operations

**File Storage:**
- None - All assets served from external URLs (PokeAPI sprites)

**Caching:**
- None at infrastructure level
- Client-side: Zustand store with localStorage persistence (`apps/web/src/stores/gameStore.ts`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)

**Implementation:**
- Browser Client: Supabase SSR handles session cookies automatically
- Server Components: Cookie-based session via `next/headers`
- WebSocket Auth: JWT token passed as query param (`?token=JWT`)

**JWT Verification (Game Server):**
- Uses `jose` library for ES256 JWT verification
- Fetches public keys from Supabase JWKS endpoint
- Location: `apps/game-server/src/hub.ts`
```typescript
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
const { payload } = await jwtVerify(token, JWKS, {...})
```

**Session Flow:**
1. User logs in via Supabase Auth (frontend)
2. Supabase sets session cookie
3. Frontend extracts access token for WebSocket connection
4. Game server validates token via JWKS before accepting connection

## Real-Time Communication

**WebSocket Server:**
- Custom implementation using `ws` package
- Location: `apps/game-server/src/hub.ts`
- Port: 8080 (configurable via PORT env var)
- Protocol: JSON messages with `{ type: string, payload: unknown }` format

**Message Types (Client to Server):**
- `move_zone` - Travel between zones
- `swap_party` - Manage Pokemon party
- `get_state` - Request full game state
- `get_shop` / `buy_item` - Shop interactions
- `chat_message` / `send_whisper` - Chat system
- `send_friend_request` / `accept_friend_request` - Social features
- Guild operations: `create_guild`, `join_guild`, `guild_chat`, etc.
- Trade operations: `create_trade`, `add_trade_offer`, `confirm_trade`, etc.

**Message Types (Server to Client):**
- `tick` - Game loop update (every 1 second)
- `game_state` - Full state sync
- `zone_update` / `party_update` - Partial state updates
- `encounter` / `catch_result` - Battle events
- `chat_message` / `whisper` - Chat delivery
- `error` - Error responses

**Tick Loop:**
- Runs every 1000ms on game server
- Processes encounters, battles, XP gains
- Pushes results to connected clients

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console logging only (console.log/console.error)
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (inferred from Next.js project structure)
- Game Server: Railway (Dockerfile.bak indicates Docker deployment)

**CI Pipeline:**
- None detected (no .github/workflows for this project)

**Build Process:**
1. `npm run build:shared` - Compile shared types
2. `npm run build:web` - Next.js production build
3. `npm run build:server` - TypeScript compilation to dist/

**Docker (Game Server):**
- Base image: node:20-slim
- Build: Install deps, compile TypeScript, prune dev deps
- Expose: Port 8080
- Run: `node dist/index.js`
- Location: `apps/game-server/Dockerfile.bak`

## Environment Configuration

**Required Environment Variables:**

Frontend (apps/web/.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

Game Server (apps/game-server/.env):
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
```

**Secrets Location:**
- Local: `.env` / `.env.local` files (gitignored)
- Production: Platform-specific (Vercel env vars, Railway env vars)
- Examples provided: `.env.example` files in both apps

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Third-Party SDKs

**Supabase:**
- Primary integration for auth + database
- Frontend: `@supabase/ssr` for Next.js SSR compatibility
- Backend: `@supabase/supabase-js` with service role key
- Auth: JWKS-based JWT verification

**No Other Third-Party Services:**
- No payment processing
- No email/SMS providers
- No analytics
- No CDN (besides Vercel/Next.js defaults)

## Database Migrations

**Location:** `supabase/migrations/`

**Application Method:**
- Manual via Supabase Dashboard SQL Editor
- Run in numbered order (001, 002, etc.)

**Key Migrations:**
- `001_initial_schema.sql` - Core tables, RLS policies
- `004_chat_and_progression.sql` - Chat system
- `007_friends.sql` - Friend system
- `009_trades.sql` - Trading system
- `022_guilds.sql` - Guild system
- `027_guild_quests.sql` - Guild quests
- `028_guild_shop.sql` - Guild shop

---

*Integration audit: 2026-01-19*
