# Codebase Structure

**Analysis Date:** 2026-01-19

## Directory Layout

```
pokemon-idle-mmo/
├── apps/
│   ├── game-server/           # Node.js WebSocket game server
│   │   └── src/               # Server source code (6 files)
│   └── web/                   # Next.js frontend application
│       ├── public/            # Static assets (sprites, maps)
│       └── src/               # Frontend source code
│           ├── app/           # Next.js App Router pages
│           ├── components/    # React components
│           ├── hooks/         # Custom React hooks
│           ├── lib/           # Utility libraries
│           ├── stores/        # Zustand state stores
│           └── types/         # Frontend-specific types
├── packages/
│   └── shared/                # Shared types and utilities
│       └── src/
│           ├── types/         # TypeScript interfaces
│           └── utils/         # Shared utility functions
├── supabase/
│   └── migrations/            # SQL migration files (001-030+)
├── .planning/                 # GSD planning documents
│   ├── codebase/              # Architecture analysis docs
│   ├── phases/                # Phase planning documents
│   └── research/              # Research notes
├── CLAUDE.md                  # AI assistant instructions
├── package.json               # Root monorepo config
└── README.md                  # Project documentation
```

## Directory Purposes

**`apps/game-server/src/`:**
- Purpose: All game server logic in 6 focused files
- Contains: WebSocket hub, game mechanics, database queries, types
- Key files:
  - `index.ts`: Entry point, server startup
  - `hub.ts`: WebSocket server, client management, message routing, tick loop
  - `game.ts`: Battle logic, stat calculations, type effectiveness, encounters
  - `db.ts`: All Supabase database queries (~2600 lines)
  - `types.ts`: Re-exports shared types + backend-only types
  - `ivs.ts`: Individual Value generation and formatting

**`apps/web/src/app/`:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components, route groups
- Key files:
  - `layout.tsx`: Root layout with fonts, metadata
  - `page.tsx`: Landing page (redirects to login/game)
  - `game/page.tsx`: Main game page (auth-protected)
  - `(auth)/login/page.tsx`: Login form
  - `(auth)/signup/page.tsx`: Signup/player creation form

**`apps/web/src/components/game/`:**
- Purpose: All game UI components (main game interface)
- Contains: Panels, modals, displays, feature-grouped subdirectories
- Key subdirectories:
  - `guild/`: Guild-related components (panel, bank, quests, shop)
  - `social/`: Chat, friends, trades, nearby players
  - `world/`: World view, trainer sprites, backgrounds
  - `encounter/`: Battle animations, floating rewards
  - `header/`: Currency display, badges, battle pass
  - `interactions/`: Town menu, world log, museum
  - `settings/`: Trainer customizer, blocked players

**`apps/web/src/components/ui/`:**
- Purpose: Reusable UI primitives
- Contains: Button, Card, Badge, ProgressBar, Tooltip
- Key files: `Button.tsx`, `Card.tsx`, `Tooltip.tsx`, `index.ts` (barrel export)

**`apps/web/src/lib/`:**
- Purpose: Utility functions, clients, helpers
- Contains: Supabase clients, WebSocket client, sprite utilities
- Key subdirectories:
  - `supabase/`: `client.ts` (browser), `server.ts` (SSR)
  - `ws/`: `gameSocket.ts` (WebSocket client singleton)
  - `sprites/`: Animation controllers, sprite catalogs
  - `zones/`: Town-specific action helpers
  - `utils/`: General utilities (friend helpers)

**`apps/web/src/stores/`:**
- Purpose: Zustand state management
- Contains: Single comprehensive game store
- Key files: `gameStore.ts` (~1200 lines, all game state and actions)

**`apps/web/src/types/`:**
- Purpose: Frontend-specific type definitions
- Contains: Types that extend or customize shared types for UI
- Key files: `game.ts`, `chat.ts`, `friends.ts`, `trade.ts`

**`packages/shared/src/`:**
- Purpose: Types and utilities shared between frontend and backend
- Contains: Core game interfaces, XP calculations
- Key files:
  - `index.ts`: Main exports, XP functions
  - `types/index.ts`: Barrel export for all types
  - `types/core.ts`: Player, Pokemon, Zone, Species
  - `types/guild.ts`: All guild-related types and payloads
  - `types/social.ts`: Chat, friends, blocked players
  - `types/trade.ts`: Trading system types

**`supabase/migrations/`:**
- Purpose: Database schema and seed data
- Contains: Numbered SQL files applied in order
- Key files:
  - `001_initial_schema.sql`: Core tables, RLS policies
  - `002_seed_data.sql`: Pokemon species, zones, encounters
  - `015_evolution_data.sql`: Evolution chain data
  - `022_guilds.sql`: Guild system tables
  - `026_guild_bank.sql`: Guild bank system
  - `027_guild_quests.sql`: Guild quest system

## Key File Locations

**Entry Points:**
- `apps/game-server/src/index.ts`: Server startup
- `apps/web/src/app/game/page.tsx`: Main game page
- `apps/web/src/components/game/GameShell.tsx`: Game UI root

**Configuration:**
- `apps/web/.env.local`: Frontend environment variables
- `apps/game-server/.env`: Server environment variables
- `apps/web/tsconfig.json`: Frontend TypeScript config
- `apps/game-server/tsconfig.json`: Server TypeScript config

**Core Logic:**
- `apps/game-server/src/hub.ts`: WebSocket server, tick loop, message handlers
- `apps/game-server/src/game.ts`: Battle mechanics, stat calculations
- `apps/game-server/src/db.ts`: All database operations
- `apps/web/src/stores/gameStore.ts`: Client state management
- `apps/web/src/lib/ws/gameSocket.ts`: WebSocket client, message handling

**Testing:**
- No test files detected in the codebase

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `GameShell.tsx`, `BoxPanel.tsx`)
- TypeScript modules: `camelCase.ts` (e.g., `gameStore.ts`, `townActions.ts`)
- SQL migrations: `NNN_description.sql` (e.g., `022_guilds.sql`)
- Barrel exports: `index.ts`

**Directories:**
- Feature groups: `kebab-case` or `camelCase` (e.g., `game-server`, `guild`)
- React component groups: `lowercase` (e.g., `social`, `world`, `header`)

**Components:**
- Named exports matching filename: `export function GameShell() {}`
- Co-located with related components in feature directories
- Barrel exports via `index.ts` for directory imports

## Where to Add New Code

**New Feature (e.g., Achievements):**
- Shared types: `packages/shared/src/types/achievements.ts`
- Server handlers: Add to `apps/game-server/src/hub.ts` switch statement
- Server DB queries: Add to `apps/game-server/src/db.ts`
- Client store: Add state/actions to `apps/web/src/stores/gameStore.ts`
- Client handlers: Add to `apps/web/src/lib/ws/gameSocket.ts`
- UI component: `apps/web/src/components/game/AchievementsPanel.tsx`

**New Game Component:**
- Simple component: `apps/web/src/components/game/ComponentName.tsx`
- Feature with subcomponents: `apps/web/src/components/game/feature/` directory

**New UI Primitive:**
- Location: `apps/web/src/components/ui/ComponentName.tsx`
- Export: Add to `apps/web/src/components/ui/index.ts`

**New Database Table:**
- Migration: `supabase/migrations/NNN_description.sql` (increment NNN)
- Apply via Supabase Dashboard SQL Editor

**Utilities:**
- Frontend utilities: `apps/web/src/lib/utils/` or `apps/web/src/lib/` subdirectory
- Shared utilities: `packages/shared/src/utils/`

**New WebSocket Message Type:**
1. Define payload type in `packages/shared/src/types/`
2. Add handler case to `apps/game-server/src/hub.ts:handleMessage()`
3. Implement handler method in `GameHub` class
4. Add client handler to `apps/web/src/lib/ws/gameSocket.ts`
5. Update store if needed in `apps/web/src/stores/gameStore.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD methodology planning documents
- Generated: Manually via /gsd commands
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build cache and output
- Generated: Yes (by `npm run build/dev`)
- Committed: No (.gitignore)

**`dist/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (by TypeScript compiler)
- Committed: No (.gitignore)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)

**`apps/web/public/`:**
- Purpose: Static assets served at root URL
- Generated: No (manual asset management)
- Committed: Yes
- Subdirectories: `maps/` (zone backgrounds), `sprites/` (Pokemon/trainer sprites)

---

*Structure analysis: 2026-01-19*
