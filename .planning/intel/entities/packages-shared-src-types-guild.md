---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\packages\shared\src\types\guild.ts
type: model
updated: 2026-01-20
status: active
---

# guild.ts (shared types)

## Purpose

Comprehensive type definitions for the guild system including core guild entities, membership, invites, chat, bank, quests, shop, buffs, and leaderboards. Contains 100+ interfaces and types covering all guild WebSocket message payloads.

## Exports

Core Types:
- `GuildRole` - 'leader' | 'officer' | 'member'
- `GuildJoinMode` - 'open' | 'invite_only' | 'closed'
- `Guild` - Full guild data with name, tag, description, member count
- `GuildMember` - Member with player info, role, online status
- `GuildPreview` - Subset of Guild for search/discovery

Bank Types:
- `GuildBank` - Bank overview with currency, items, pokemon slots
- `GuildBankItem` - Item entry with quantity and depositor
- `GuildBankPokemon` - Pokemon entry with point cost
- `GuildBankPermission` - Role-based permission matrix
- `GuildBankLimit` - Daily withdrawal limits per role

Quest Types:
- `QuestType` - 'catch_pokemon' | 'catch_type' | 'battle' | 'evolve'
- `GuildQuest` - Quest with progress, rewards, type filter
- `QuestContribution` - Player contribution tracking

Shop Types:
- `GuildBuffType` - 'xp_bonus' | 'catch_rate' | 'encounter_rate'
- `GuildBuff` - Active buff with multiplier and expiration
- `ActiveGuildBuffs` - Keyed object of current buffs
- `GuildStatistics` - Guild-wide stats for display

Plus 80+ WebSocket payload interfaces for all guild operations.

## Dependencies

None (foundational types)

## Used By

TBD

## Notes

- Bank uses point system for Pokemon (based on BST) to balance withdrawals
- Quests have daily and weekly periods with automatic reset
- Buffs have configurable duration in hours with real-time expiration
