---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\components\game\GameShell.tsx
type: component
updated: 2026-01-20
status: active
---

# GameShell.tsx

## Purpose

Root game layout component that orchestrates the entire game UI. Manages WebSocket connection lifecycle, responsive layout (desktop 3-column vs mobile tabs), and coordinates between map, world view, party, and social sidebars. This is the main container that renders after authentication.

## Exports

- `GameShell({ accessToken })` - Main game container component

## Dependencies

- [[apps-web-src-stores-gamestore]] - Game state access
- [[apps-web-src-lib-ws-gamesocket]] - WebSocket connection management
- [[apps-web-src-components-ui-index]] - UI component library
- [[apps-web-src-components-game-map-interactivemap]] - Interactive world map
- Various game components: Header, WorldView, EncounterDisplay, PartyPanel, ChatSidebar, GuildPanel, etc.

## Used By

TBD

## Notes

- Desktop layout: 3 columns (Map | World+Social | Party+Activity)
- Mobile layout: Tab bar navigation between Map, Game, Party, Social views
- Connects to game server on mount, disconnects on unmount
- Fetches friends/trades data immediately after connection for accurate badge counts
