---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\stores\gameStore.ts
type: service
updated: 2026-01-20
status: active
---

# gameStore.ts

## Purpose

Central Zustand store managing all client-side game state including player data, party, inventory, chat, friends, trades, guild, and UI state. Uses persistence middleware to save UI preferences (visited zones, bank view mode) to localStorage. This is the single source of truth for the React frontend.

## Exports

- `useGameStore` - Zustand hook providing access to all game state and actions

State includes:
- Player profile, party (6 slots), box, inventory, resources
- Zone navigation with visited zones for fog-of-war
- Encounter state with pending rewards for animation timing
- Evolution queue with active/pending evolutions
- Chat messages by channel with unread counts
- Friends list, requests, whispers, blocked players
- Trade requests, active trade session, trade history
- Guild data, members, invites, bank, quests, buffs

Actions include:
- setPlayer, setParty, setZone, setInventory
- addToBox, updatePokemonInParty
- addPendingEvolutions, completeEvolutionAndAdvance
- addChatMessage, setActiveChannel
- setActiveTrade, updateTradeOffers
- setGuildData, updateGuildBuff, replaceQuest

## Dependencies

- zustand - State management library
- zustand/middleware - persist middleware for localStorage
- [[apps-web-src-types-game]] - Game type definitions
- [[packages-shared-src-index]] - Shared types for guild, trade, etc.

## Used By

TBD

## Notes

- Pending encounter rewards delay XP/level-up UI updates until battle animation completes
- Evolution queue uses atomic completeEvolutionAndAdvance to prevent race conditions
- Persists only visitedZones and guildBankViewMode to localStorage
