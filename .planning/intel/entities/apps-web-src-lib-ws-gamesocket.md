---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\lib\ws\gameSocket.ts
type: service
updated: 2026-01-20
status: active
---

# gameSocket.ts

## Purpose

Singleton WebSocket client that manages the real-time connection to the game server. Handles all bidirectional communication including game state sync, chat, trades, friends, guilds, and encounters. Routes incoming messages to appropriate handlers that update the Zustand store.

## Exports

- `gameSocket` - Singleton GameSocket instance
- `ONLINE_THRESHOLD_MS` - 2 minute threshold for online status

GameSocket methods include:
- `connect(token)` - Establish WebSocket connection with JWT
- `disconnect()` - Close connection and prevent reconnect
- `send(type, payload)` - Send typed message to server
- `moveToZone(zoneId)` - Request zone change
- `swapParty(boxPokemonId, partySlot)` - Party management
- `sendFriendRequest(username, callback)` - Friend system with callback
- `sendTradeRequest(playerId)` - Trade initiation
- `confirmEvolution(pokemonId)` - Evolution confirmation
- `getGuildBank()`, `depositCurrency(amount)` - Guild bank operations
- `sendPurchaseGuildBuff(buffType, hours)` - Guild shop
- Plus 100+ more API methods

## Dependencies

- [[apps-web-src-stores-gamestore]] - State management for incoming message handling
- [[apps-web-src-types-game]] - Game types
- [[packages-shared-src-index]] - Shared guild types

## Used By

TBD

## Notes

- Implements exponential backoff reconnection (up to 5 attempts)
- Uses Map-based tracking for friend request callbacks with 30s timeout
- Exposed as window.__gameSocket in development for debugging
- Message handlers dispatch to store actions for UI updates
