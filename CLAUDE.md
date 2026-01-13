# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokemon Idle MMO is a web-based idle game where players deploy trainers to catch Pokemon. It's a monorepo with two main applications communicating via WebSocket, backed by Supabase.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Next.js Web   │◄──────────────────►│   Game Server   │
│   (port 3000)   │                    │   (port 8080)   │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  REST/Auth                           │ PostgreSQL
         ▼                                      ▼
┌─────────────────────────────────────────────────────────┐
│                       Supabase                          │
└─────────────────────────────────────────────────────────┘
```

## Commands

### Frontend (apps/web)
```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Game Server (apps/game-server)
```bash
npm run dev      # Start with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
```

### Database
Migrations are in `supabase/migrations/`. Apply manually via Supabase Dashboard SQL Editor in numbered order.

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Zustand (state), Tailwind CSS 4, Supabase SSR

**Game Server:** Node.js, TypeScript, ws (WebSocket), jose (JWT), Supabase client

**Database:** Supabase PostgreSQL with RLS policies

## Key Patterns

### WebSocket Protocol
- Client connects with JWT token: `?token=JWT`
- Server validates via Supabase JWKS endpoint using jose
- Messages are JSON: `{ type: string, payload: unknown }`
- Server runs tick loop every 1 second, pushes results to clients

### Message Types
- Client → Server: `move_zone`, `swap_party`, `get_state`, `get_shop`, `buy_item`
- Server → Client: `tick`, `game_state`, `zone_update`, `party_update`, `error`

### State Management
Zustand store at `apps/web/src/stores/gameStore.ts` manages all game state with persistence middleware.

### Game Server Files
- `hub.ts` - WebSocket hub, client management, tick loop
- `game.ts` - Battle logic, stat calculations, type effectiveness
- `db.ts` - All Supabase queries
- `types.ts` - Shared TypeScript interfaces

### Database Schema
Core tables: `players`, `pokemon`, `pokemon_species`, `zones`, `zone_connections`, `encounter_tables`, `pokedex_entries`, `inventory`

RLS policies scope player data - each user only sees their own pokemon/inventory.

## Environment Variables

**Frontend (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WS_URL` (ws://localhost:8080 for dev)

**Game Server (.env):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `PORT`
- `ALLOWED_ORIGINS`

## Deployment

- Frontend: Vercel (auto-deploys from GitHub)
- Game Server: Railway (Docker)
- Database: Supabase (managed)

## Naming Conventions

- Database columns: snake_case
- TypeScript variables: camelCase
- Types/Classes: PascalCase
