# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**
- TypeScript 5.x - Used throughout frontend (apps/web), game server (apps/game-server), and shared package (packages/shared)

**Secondary:**
- SQL - Database migrations and stored procedures in `supabase/migrations/`
- JSON - Configuration files throughout

## Runtime

**Environment:**
- Node.js (version unspecified, ES2022 target)
- Browsers (React 19 frontend)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present at root

## Frameworks

**Core:**
- Next.js 16.1.1 - Frontend web application framework (`apps/web`)
- React 19.2.3 - UI component library
- ws 8.18.0 - WebSocket server for real-time game communication (`apps/game-server`)

**Testing:**
- Not detected - No test framework configuration found

**Build/Dev:**
- TypeScript Compiler (tsc) - For shared package and game-server builds
- tsx 4.19.2 - TypeScript execution with hot reload for game-server development
- PostCSS with @tailwindcss/postcss - CSS processing
- ESLint 9 with eslint-config-next - Linting

## Key Dependencies

**Critical (Frontend - `apps/web/package.json`):**
- `next` 16.1.1 - App router, server components, image optimization
- `react` / `react-dom` 19.2.3 - Latest React with concurrent features
- `@supabase/ssr` 0.8.0 - Server-side Supabase client for Next.js
- `@supabase/supabase-js` 2.90.1 - Supabase JavaScript client
- `zustand` 5.0.10 - Lightweight state management with persistence middleware
- `tailwindcss` 4 - Utility-first CSS framework

**Critical (Game Server - `apps/game-server/package.json`):**
- `ws` 8.18.0 - WebSocket server
- `jose` 6.1.3 - JWT verification using JWKS endpoint
- `@supabase/supabase-js` 2.49.1 - Database client with service key
- `dotenv` 16.4.7 - Environment variable loading

**Shared Package (`packages/shared`):**
- Pure TypeScript, no runtime dependencies
- Provides shared types between frontend and game-server via `@pokemon-idle/shared`

**UI/Animation:**
- `react-responsive-spritesheet` 2.4.0 - Sprite sheet animation component

**Infrastructure:**
- `@tailwindcss/postcss` 4 - PostCSS plugin for Tailwind CSS 4
- `lightningcss-win32-x64-msvc` (optional) - Native CSS minification

## Configuration

**TypeScript Configuration:**
- Frontend (`apps/web/tsconfig.json`): ES2017 target, bundler module resolution, strict mode
- Game Server (`apps/game-server/tsconfig.json`): ES2022 target, ESNext modules, strict mode
- Shared (`packages/shared/tsconfig.json`): ES2022 target, generates declarations

**Path Aliases:**
- `@/*` - Maps to `./src/*` in frontend
- `@pokemon-idle/shared` - Maps to `../../packages/shared/dist/index`

**ESLint:**
- Uses flat config (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

**PostCSS:**
- Single plugin: `@tailwindcss/postcss`

**Next.js (`apps/web/next.config.ts`):**
- Transpiles `@pokemon-idle/shared` package
- Allows remote images from `raw.githubusercontent.com/PokeAPI/sprites/**`

**Environment:**
- Frontend: `.env.local` (gitignored)
- Game Server: `.env` (gitignored)
- Example files provided for both

## Platform Requirements

**Development:**
- Node.js with npm
- Access to Supabase project (URL + keys)
- Environment variables configured per `.env.example` files

**Production:**
- Frontend: Vercel (auto-deploy from GitHub)
- Game Server: Railway (Node.js deployment)
- Database: Supabase PostgreSQL (managed)

## Monorepo Structure

```
pokemon-idle-mmo/
├── apps/
│   ├── web/           # Next.js 16 frontend
│   └── game-server/   # Node.js WebSocket server
├── packages/
│   └── shared/        # Shared TypeScript types
├── supabase/
│   └── migrations/    # SQL migration files
└── package.json       # Root scripts for orchestration
```

**Root Scripts (`package.json`):**
- `build:shared` - Build shared package first (dependency for others)
- `dev:server` - Build shared + run game server with hot reload
- `dev:web` - Build shared + run Next.js dev server
- `build:all` - Full production build
- `typecheck` - Type check both apps
- `build` / `start` - Railway deployment (game server)

---

*Stack analysis: 2026-01-18*
