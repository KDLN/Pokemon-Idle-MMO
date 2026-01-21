---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\hub.ts
type: service
updated: 2026-01-20
status: active
---

# hub.ts

## Purpose

Core WebSocket server that manages real-time client connections, authentication, and game state synchronization. Handles all client-server communication including player sessions, tick processing, chat, trades, guilds, and friends. This is the central orchestration point for the game server, managing the game loop tick interval and broadcasting state changes to connected clients.

## Exports

- `GameHub` - Main WebSocket server class that manages client connections, session state, tick processing, and all game message routing

## Dependencies

- [[apps-game-server-src-types]] - Type definitions for messages, sessions, and game state
- [[apps-game-server-src-db]] - Database operations for players, Pokemon, zones, trades, guilds, chat
- [[apps-game-server-src-game]] - Game logic for ticks, battles, evolutions
- ws - WebSocket server implementation
- jose - JWT token validation using Supabase JWKS

## Used By

TBD

## Notes

- Runs 1-second tick loop for processing encounters and game updates
- Maintains in-memory caches for species data, trade ready states, whisper history
- Uses reverse index (clientsByPlayerId) for O(1) player lookups
- Implements rate limiting for whispers and periodic cleanup to prevent memory leaks
