---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\game-server\src\index.ts
type: module
updated: 2026-01-20
status: active
---

# index.ts

## Purpose

Entry point for the game server that initializes the database connection, starts the GameHub WebSocket server, and sets up graceful shutdown handling. This is the bootstrap file that orchestrates server startup and cleanup.

## Exports

None (entry point)

## Dependencies

- [[apps-game-server-src-db]] - Database initialization
- [[apps-game-server-src-hub]] - GameHub WebSocket server
- dotenv/config - Environment variable loading

## Used By

TBD

## Notes

- Listens on PORT environment variable (default 8080)
- SIGINT handler ensures graceful shutdown of WebSocket connections
- Exits with code 1 if database initialization fails
