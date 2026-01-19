# Technology Stack

**Analysis Date:** 2026-01-19

## Languages

**Primary:**
- TypeScript 5.x - Used throughout all packages (web, game-server, shared)

**Secondary:**
- SQL (PostgreSQL) - Database migrations in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js 20+ (specified in Dockerfile.bak)
- Browser (Next.js client-side)

**Package Manager:**
- npm (package-lock.json present)
- Monorepo structure without workspace tooling (manual cross-package builds)

## Frameworks

**Core:**
- Next.js 16.1.1 - Frontend framework with App Router (`apps/web/`)
- React 19.2.3 - UI library (latest major version)

**Build/Dev:**
- tsx 4.19.2 - TypeScript execution for game server dev mode
- tsc - TypeScript compilation for production builds

## Key Dependencies

**Frontend (`apps/web/package.json`):**
- `@supabase/ssr` ^0.8.0 - Server-side Supabase client for Next.js
- `@supabase/supabase-js` ^2.90.1 - Core Supabase client
- `zustand` ^5.0.10 - Client state management with persistence
- `canvas-confetti` ^1.9.4 - Visual effects
- `react-responsive-spritesheet` ^2.4.0 - Sprite animations

**Game Server (`apps/game-server/package.json`):**
- `ws` ^8.18.0 - WebSocket server implementation
- `jose` ^6.1.3 - JWT verification via Supabase JWKS
- `@supabase/supabase-js` ^2.49.1 - Database access
- `dotenv` ^16.4.7 - Environment variable loading

**Shared (`packages/shared/package.json`):**
- Pure TypeScript with no runtime dependencies
- Exports types and utility functions (XP calculations)

## Project Structure

**Monorepo Layout:**
```
/
├── apps/
│   ├── web/           # Next.js frontend (port 3000)
│   └── game-server/   # WebSocket server (port 8080)
├── packages/
│   └── shared/        # @pokemon-idle/shared types package
└── supabase/
    └── migrations/    # PostgreSQL migrations (001-030+)
```

**Build Order:**
1. `packages/shared` must build first (exports types to both apps)
2. Apps reference shared via file path: `"@pokemon-idle/shared": "file:../../packages/shared"`

## Configuration

**TypeScript:**
- Web: ES2017 target, bundler resolution, strict mode (`apps/web/tsconfig.json`)
- Game Server: ES2022 target, ESNext modules, strict mode (`apps/game-server/tsconfig.json`)
- Shared: ES2022 target, ESNext modules, declarations enabled (`packages/shared/tsconfig.json`)

**Styling:**
- Tailwind CSS 4 with PostCSS plugin (`apps/web/postcss.config.mjs`)
- No separate Tailwind config file (v4 uses CSS-first configuration)

**Linting:**
- ESLint 9 with Next.js config (`apps/web/eslint.config.mjs`)
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

**Environment Variables:**

Frontend (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL (ws://localhost:8080 for dev)

Game Server (`apps/game-server/.env`):
- `DATABASE_URL` - Direct PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (bypasses RLS)
- `SUPABASE_JWT_SECRET` - For JWT verification
- `PORT` - WebSocket server port (default 8080)
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

## Scripts

**Root (`package.json`):**
```bash
npm run build:shared    # Build shared package first
npm run dev:server      # Build shared + run game server
npm run dev:web         # Build shared + run web app
npm run build:all       # Build everything for production
npm run typecheck       # Type-check all packages
```

**Web (`apps/web/package.json`):**
```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint check
```

**Game Server (`apps/game-server/package.json`):**
```bash
npm run dev      # tsx watch for hot reload
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
```

## Platform Requirements

**Development:**
- Node.js 20+
- npm (for package management)
- Supabase project with configured auth
- PostgreSQL access (via Supabase or direct)

**Production:**
- Frontend: Vercel (Next.js optimized hosting)
- Game Server: Railway (Docker-based, uses Dockerfile.bak pattern)
- Database: Supabase (managed PostgreSQL)

## Module System

**ESM Throughout:**
- Game server uses `"type": "module"` in package.json
- Shared package uses `"type": "module"`
- All imports use `.js` extension for ESM compatibility
- Web uses Next.js bundler (handles both ESM and CommonJS)

---

*Stack analysis: 2026-01-19*
