# Pokemon Idle MMO

An idle MMO monster-catching game where players deploy their trainer into the world, set priorities, and watch their adventure unfold.

## Project Structure

```
pokemon-idle-mmo/
├── apps/
│   ├── web/                # Next.js frontend
│   └── game-server/        # Node.js WebSocket game server
├── supabase/
│   └── migrations/         # Database schema
└── pokemon-idle-mmo-gdd.md # Game Design Document
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Zustand, Tailwind CSS 4
- **Game Server:** Node.js, TypeScript, ws (WebSocket), jose (JWT)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel (frontend), Railway (game server)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migrations:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_seed_data.sql`
3. Note your project URL and anon key from Settings > API

### 2. Configure Environment Variables

**Frontend (`apps/web/.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

**Game Server (`apps/game-server/.env`):**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
```

Find the JWT secret in Supabase Dashboard > Settings > API > JWT Secret.

### 3. Start the Game Server

```bash
cd apps/game-server
npm install
npm run dev
```

### 4. Start the Frontend

```bash
cd apps/web
npm install
npm run dev
```

### 5. Play!

Open http://localhost:3000 in your browser.

## MVP Features

- 3 zones: Pallet Town, Route 1, Viridian City
- 10 Pokemon species (3 starters + 7 wild)
- Auto-encounter system (~30 second intervals)
- Auto-battle (simplified win/lose based on power)
- Catch mechanics with Pokeballs
- XP gain and leveling
- Party management (6 slots)
- Box storage for caught Pokemon

## Development

### Frontend Development

```bash
cd apps/web
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Run linter
```

### Game Server Development

```bash
cd apps/game-server
npm run dev      # Start with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
```

### Database Changes

Add new migrations to `supabase/migrations/` with sequential numbering:
- `003_feature_name.sql`

## Architecture

### Game Loop

1. Player connects via WebSocket
2. Server runs tick loop (1 second intervals)
3. On route zones, each tick has ~3.3% encounter chance
4. Encounters auto-battle and attempt catch
5. Results pushed to client in real-time

### Data Flow

```
Client (Next.js) <--WebSocket--> Game Server (Go) <--SQL--> Supabase (PostgreSQL)
                                      |
                              Tick Engine
                              Battle System
                              Catch Mechanics
```

## License

Fan project for educational purposes. Pokemon is a trademark of Nintendo/Game Freak.
