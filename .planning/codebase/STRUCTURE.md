# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
pokemon-idle-mmo/
├── apps/
│   ├── game-server/           # Node.js WebSocket game server
│   │   ├── src/               # TypeScript source files
│   │   ├── dist/              # Compiled JavaScript (generated)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                   # Next.js frontend application
│       ├── src/
│       │   ├── app/           # Next.js App Router pages
│       │   ├── components/    # React components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Utilities and clients
│       │   ├── stores/        # Zustand state stores
│       │   └── types/         # Frontend-only TypeScript types
│       ├── public/            # Static assets (sprites, maps)
│       └── package.json
├── packages/
│   └── shared/                # Shared types and utilities
│       ├── src/
│       │   ├── types/         # TypeScript interfaces
│       │   ├── utils/         # Shared utility functions
│       │   └── index.ts       # Package entry point
│       └── package.json
├── supabase/
│   └── migrations/            # SQL migration files (numbered)
├── package.json               # Root package.json with workspace scripts
├── CLAUDE.md                  # AI assistant instructions
└── README.md                  # Project documentation
```

## Directory Purposes

**apps/game-server/src/:**
- Purpose: Game server source code
- Contains: WebSocket hub, battle logic, database queries, type definitions
- Key files:
  - `index.ts` - Server entry point, initializes DB and starts hub
  - `hub.ts` - WebSocket server, client management, tick loop, message routing
  - `game.ts` - Battle calculations, encounter processing, evolution logic
  - `db.ts` - All Supabase database queries (players, pokemon, zones, etc.)
  - `types.ts` - Backend-only types (re-exports shared + PlayerSession)
  - `ivs.ts` - IV (Individual Values) generation logic

**apps/web/src/app/:**
- Purpose: Next.js App Router pages and layouts
- Contains: Route components using React Server Components
- Key files:
  - `layout.tsx` - Root layout with global styles
  - `page.tsx` - Landing/home page
  - `game/page.tsx` - Main game page (requires auth)
  - `(auth)/login/page.tsx` - Login page
  - `(auth)/signup/page.tsx` - Signup/player creation page

**apps/web/src/components/:**
- Purpose: React UI components organized by feature
- Contains: Game panels, UI primitives, feature-specific components
- Key files:
  - `game/GameShell.tsx` - Main game container with 3-column layout
  - `game/EncounterDisplay.tsx` - Battle animation component
  - `game/PartyPanel.tsx` - Pokemon party display
  - `game/BoxPanel.tsx` - Pokemon storage PC box
  - `game/ShopPanel.tsx` - In-game shop
  - `game/GymBattlePanel.tsx` - Gym challenge interface

**apps/web/src/components/game/ subdirectories:**
- `encounter/` - Battle animation components (FloatingReward, AttackAnimation)
- `header/` - Header components (BadgeCase, CurrencyDisplay, BattlePassProgress)
- `interactions/` - Town interaction components (TownMenu, MuseumPanel, WorldLog)
- `settings/` - Settings components (TrainerCustomizer, BlockedPlayers)
- `social/` - Social features (ChatSidebar, FriendsList, TradeModal)
- `world/` - World view components (WorldView, TrainerSprite, TimeOfDayOverlay)

**apps/web/src/components/ui/:**
- Purpose: Reusable UI primitives
- Contains: Button, Card, Badge, ProgressBar, Tooltip

**apps/web/src/lib/:**
- Purpose: Client utilities, external service clients, helpers
- Contains: Supabase clients, WebSocket client, sprite utilities
- Key files:
  - `ws/gameSocket.ts` - WebSocket client singleton with message handlers
  - `supabase/client.ts` - Browser Supabase client
  - `supabase/server.ts` - Server-side Supabase client
  - `sprites/` - Sprite animation utilities
  - `utils/friendUtils.ts` - Friend status helpers
  - `ivUtils.ts` - IV grade calculation

**apps/web/src/stores/:**
- Purpose: Zustand state management
- Contains: Central game store
- Key files:
  - `gameStore.ts` - All game state (player, party, zone, chat, trades, etc.)

**apps/web/src/types/:**
- Purpose: Frontend-only TypeScript types
- Contains: Types that extend shared types or are UI-specific
- Key files:
  - `game.ts` - Game state types, re-exports from shared
  - `chat.ts` - Chat message types
  - `friends.ts` - Friend relationship types
  - `trade.ts` - Trade session types

**packages/shared/src/types/:**
- Purpose: Shared TypeScript interfaces used by both apps
- Contains: Core game types split by domain
- Key files:
  - `core.ts` - Player, Pokemon, PokemonSpecies, Zone, WildPokemon
  - `battle.ts` - BattleTurn, BattleSequence, GymBattleMatchup
  - `catching.ts` - CatchResult, EncounterEvent, CatchSequence
  - `progression.ts` - LevelUpEvent, PendingEvolution, EvolutionEvent
  - `social.ts` - Friend, FriendRequest, ChatMessageEntry, WhisperMessage
  - `trade.ts` - Trade, TradeOffer, TradeRequest, TradeHistoryEntry
  - `leaderboard.ts` - LeaderboardEntry, PlayerRank
  - `common.ts` - WSMessage, ShopItem, TickResult

**supabase/migrations/:**
- Purpose: Database schema evolution
- Contains: Numbered SQL files applied in order
- Key files:
  - `001_initial_schema.sql` - Core tables (players, pokemon, zones)
  - `009_trades.sql` - Trading system tables
  - `012_trade_history.sql` - Trade history tracking
  - `015_evolution_data.sql` - Evolution chain data
  - `019_iv_system.sql` - IV columns on pokemon table
  - `020_week6_leaderboards_route4.sql` - Leaderboard functions

## Key File Locations

**Entry Points:**
- `apps/game-server/src/index.ts`: Server bootstrap
- `apps/web/src/app/game/page.tsx`: Main game page
- `apps/web/src/app/layout.tsx`: Root React layout

**Configuration:**
- `apps/web/.env.local`: Frontend environment variables
- `apps/game-server/.env`: Server environment variables
- `apps/web/tsconfig.json`: Frontend TypeScript config
- `apps/game-server/tsconfig.json`: Server TypeScript config

**Core Logic:**
- `apps/game-server/src/hub.ts`: WebSocket management and tick loop
- `apps/game-server/src/game.ts`: Battle mechanics and encounters
- `apps/game-server/src/db.ts`: All database operations

**Testing:**
- No test files detected. Testing framework not configured.

## Naming Conventions

**Files:**
- React components: PascalCase (`GameShell.tsx`, `PartyPanel.tsx`)
- Utilities/hooks: camelCase (`gameSocket.ts`, `useBattleAnimation.ts`)
- Types: camelCase (`game.ts`, `friends.ts`)
- Index files: `index.ts` for barrel exports

**Directories:**
- Feature groupings: lowercase (`game/`, `social/`, `world/`)
- Top-level: lowercase (`app/`, `components/`, `lib/`, `stores/`)

**Components:**
- Component files named after the component they export
- Index files re-export from directory for clean imports

## Where to Add New Code

**New Game Feature (Frontend):**
- Component: `apps/web/src/components/game/[FeatureName].tsx`
- If complex, create directory: `apps/web/src/components/game/[feature]/`
- Add to GameShell.tsx if it's a panel/modal

**New Game Logic (Server):**
- Message handler: Add to `apps/game-server/src/hub.ts` in message handler map
- Game calculation: Add to `apps/game-server/src/game.ts`
- Database query: Add to `apps/game-server/src/db.ts`

**New Shared Type:**
- Add to appropriate file in `packages/shared/src/types/`
- Export from `packages/shared/src/types/index.ts`
- Re-export in both `apps/game-server/src/types.ts` and `apps/web/src/types/game.ts`

**New WebSocket Message:**
1. Define types in `packages/shared/src/types/common.ts` if shared
2. Add server handler in `apps/game-server/src/hub.ts`
3. Add client handler and send method in `apps/web/src/lib/ws/gameSocket.ts`
4. Update Zustand store if message affects state

**New Database Table:**
- Create numbered migration in `supabase/migrations/` (e.g., `022_new_feature.sql`)
- Add types to `packages/shared/src/types/`
- Add queries to `apps/game-server/src/db.ts`

**New UI Component:**
- Primitive (button, card): `apps/web/src/components/ui/`
- Game feature: `apps/web/src/components/game/`
- Export from `index.ts` in directory for clean imports

## Special Directories

**apps/web/public/:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes
- Contains: `sprites/trainers/`, `maps/`

**apps/game-server/dist/:**
- Purpose: Compiled JavaScript from TypeScript
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**packages/shared/dist/:**
- Purpose: Compiled shared package
- Generated: Yes (by `npm run build:shared`)
- Committed: No

**apps/web/.next/:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**node_modules/ (all levels):**
- Purpose: NPM dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-01-18*
