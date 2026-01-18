# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Supabase (Primary Backend):**
- Database: PostgreSQL with Row Level Security
- Authentication: JWT-based with JWKS endpoint
- SDK/Client: `@supabase/supabase-js`, `@supabase/ssr`
- Usage: All persistent data storage, user auth, real-time subscriptions

**PokeAPI (Sprite Assets):**
- Usage: Pokemon sprite images loaded via Next.js Image component
- Endpoint: `https://raw.githubusercontent.com/PokeAPI/sprites/**`
- Auth: None (public CDN)
- Configured in: `apps/web/next.config.ts` (remotePatterns)

**GitHub Actions (CI/CD):**
- Claude Code Action for automated code review
- Triggered on: issue comments, PR reviews, issues mentioning `@claude`

## Data Storage

**Primary Database:**
- Provider: Supabase PostgreSQL
- Connection: Direct via `DATABASE_URL` (game server)
- Client Access: Via Supabase JS client (both apps)
- ORM: None - Direct Supabase query builder

**Database Tables (from migrations):**
- Static data: `pokemon_species`, `zones`, `zone_connections`, `encounter_tables`
- Player data: `players`, `pokemon`, `pokedex_entries`, `inventory`
- Social: `friends`, `chat_messages`, `trades`, `trade_offers`, `trade_history`, `blocked_players`
- Progression: `gym_leaders`, `gym_leader_pokemon`, `player_gym_progress`, `weekly_stats`

**Row Level Security:**
- Enabled on player data tables
- Players can only access their own data
- Service key bypasses RLS for game server operations

**File Storage:**
- None - No user-uploaded files
- All sprites are external (PokeAPI GitHub)

**Caching:**
- Client-side: Zustand with persist middleware (`apps/web/src/stores/gameStore.ts`)
- Server-side: In-memory species cache in game hub (`this.speciesMap`)
- No Redis or external cache

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
- Method: Email/password (assumed from JWT usage)

**Implementation:**
- Frontend: `@supabase/ssr` with cookie-based session (`apps/web/src/lib/supabase/`)
  - Browser client: `createBrowserClient()` in `client.ts`
  - Server client: `createServerClient()` in `server.ts`
- Game Server: JWT verification via jose library
  - JWKS endpoint: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  - Token passed via WebSocket query param: `?token=JWT`

**Session Management:**
- Frontend: Supabase SSR handles cookie refresh
- Game Server: JWT validated on WebSocket connection
- Service Key: Used by game server for privileged operations

## Monitoring & Observability

**Error Tracking:**
- None configured
- Errors logged to console

**Logs:**
- Console logging throughout game server
- No structured logging or log aggregation

**Metrics:**
- None configured

## CI/CD & Deployment

**Frontend Hosting:**
- Platform: Vercel
- Auto-deploy: From GitHub pushes
- Config: `.vercel/` directory present

**Game Server Hosting:**
- Platform: Railway
- Deployment: Via root `package.json` scripts (`build` + `start`)
- Docker: `Dockerfile.bak` present but not currently used

**CI Pipeline:**
- GitHub Actions workflows in `.github/workflows/`
  - `claude.yml` - Claude Code automation for reviews
  - `claude-code-review.yml` - Automated code review

## Environment Configuration

**Frontend Required Env Vars (`apps/web/.env.example`):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

**Game Server Required Env Vars (`apps/game-server/.env.example`):**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
```

**Secrets Location:**
- Development: Local `.env` / `.env.local` files (gitignored)
- Production: Platform-specific (Vercel env vars, Railway env vars)

## WebSocket Protocol

**Connection:**
- URL: `NEXT_PUBLIC_WS_URL` (e.g., `ws://localhost:8080` or `wss://production-url`)
- Authentication: JWT token in query string `?token=JWT`
- Library: `ws` (server), native WebSocket (client)

**Message Format:**
```typescript
interface WSMessage {
  type: string
  payload: unknown
}
```

**Client to Server Messages:**
- `get_state`, `move_zone`, `swap_party`, `remove_from_party`
- `get_shop`, `buy_item`, `use_potion`
- `send_chat`, `send_whisper`, `get_whisper_history`
- `send_friend_request`, `accept_friend_request`, `decline_friend_request`, `remove_friend`
- `send_trade_request`, `accept_trade_request`, `cancel_trade_request`, `add_trade_offer`, `remove_trade_offer`, `ready_trade`, `complete_trade`, `get_trade_history`
- `challenge_gym`, `enter_museum`, `purchase_membership`
- `block_player`, `unblock_player`, `get_blocked_players`
- `get_leaderboard`
- `evolve_pokemon`, `cancel_evolution`

**Server to Client Messages:**
- `game_state`, `tick`, `zone_update`, `party_update`, `box_update`
- `encounter`, `xp_gained`, `level_up`, `evolution_ready`, `evolution_complete`
- `shop_data`, `inventory_update`, `money_update`
- `chat_history`, `chat_message`, `whisper_message`, `whisper_history`
- `friends_update`, `nearby_players`, `friend_zone_update`
- `trade_requests`, `trade_accepted`, `trade_offers_update`, `trade_ready_update`, `trade_complete`, `trade_history`
- `gym_data`, `gym_battle_result`, `badge_earned`
- `museum_data`, `museum_error`
- `blocked_players`
- `leaderboard_data`
- `error`

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Database Functions (Supabase RPC)

**Defined in migrations:**
- `complete_trade(p_trade_id)` - Atomic trade completion with Pokemon transfer
- `get_pokedex_leaderboard(result_limit)` - Aggregated pokedex rankings
- `get_catch_leaderboard(result_limit)` - Total catches rankings
- `get_level_leaderboard(result_limit)` - Highest level rankings
- `get_player_rank(p_player_id, p_type)` - Individual player ranking

---

*Integration audit: 2026-01-18*
