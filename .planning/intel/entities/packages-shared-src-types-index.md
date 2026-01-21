---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\packages\shared\src\types\index.ts
type: model
updated: 2026-01-20
status: active
---

# types/index.ts (shared)

## Purpose

Barrel export file that aggregates all shared type modules into a single import point. Organizes types by domain (core, battle, catching, progression, social, trade, leaderboard, guild) for clean consumption by frontend and backend.

## Exports

Re-exports from:
- `./core.js` - Player, Pokemon, PokemonSpecies, Zone, WildPokemon
- `./battle.js` - BattleTurn, BattleSequence, GymBattleMatchup
- `./catching.js` - BallType, CatchSequence, CatchResult, EncounterEvent
- `./progression.js` - LevelUpEvent, PendingEvolution, EvolutionEvent
- `./social.js` - ChatChannel, Friend, FriendRequest, WhisperMessage, BlockedPlayer
- `./trade.js` - Trade, TradeOffer, TradeRequest, TradeHistoryEntry
- `./leaderboard.js` - LeaderboardEntry, LeaderboardType, PlayerRank
- `./common.js` - WSMessage, ShopItem, TickResult
- `./guild.js` - Guild, GuildMember, GuildBank, GuildQuest, GuildBuff (100+ guild types)

## Dependencies

- [[packages-shared-src-types-core]] - Core game entity types
- [[packages-shared-src-types-guild]] - Guild system types

## Used By

TBD
