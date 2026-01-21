# Codebase Intelligence Summary

Last updated: 2026-01-20T00:00:00.000Z
Indexed files: ~110

## Architecture

Pokemon Idle MMO is a monorepo with 3 packages:
- **apps/web**: Next.js 16 frontend (React 19, Zustand, Tailwind 4)
- **apps/game-server**: Node.js WebSocket server (ws, jose, Supabase)
- **packages/shared**: Shared TypeScript types

Communication: WebSocket (JSON messages with JWT auth via Supabase JWKS)

## Naming Conventions

- Function exports: camelCase (72% of 285 exports)
- Type/Interface exports: PascalCase (95% of 180 types)

## Key Directories

- `apps/game-server/src/`: Backend - hub, game logic, db queries (6 files)
- `apps/web/src/components/game/`: Game UI components (45 files)
- `apps/web/src/stores/`: Zustand state management (1 file)
- `apps/web/src/lib/ws/`: WebSocket client (1 file)
- `packages/shared/src/types/`: Shared game types (9 files)

## File Patterns

- `*.tsx`: React components (65 files)
- `*.ts`: TypeScript modules (45 files)
- `*/index.ts`: Barrel exports for clean imports

## Key Files

- `apps/game-server/src/hub.ts`: GameHub class - WebSocket server, tick loop
- `apps/game-server/src/db.ts`: All Supabase queries (~100 exports)
- `apps/web/src/stores/gameStore.ts`: Central Zustand store
- `apps/web/src/lib/ws/gameSocket.ts`: WebSocket client singleton

Total exports: ~465
