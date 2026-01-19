# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-19
**Session:** Phase 4 Completion

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 4 - Guild Bank (shared storage with role-based access)

## Current Position

**Phase:** 4 of 7 - Guild Bank
**Plan:** 5 of 5 complete
**Status:** Phase Complete
**Last activity:** 2026-01-19 - Completed 04-05-PLAN.md (Complete Guild Bank Tabs)

**Progress:**
```
Phase 1: [==========] Guild Foundation (5/5 plans complete)
Phase 2: [=======   ] Guild Invites (3/4 plans complete)
Phase 3: [          ] Guild Chat (0/? plans)
Phase 4: [==========] Guild Bank (5/5 plans complete)
Phase 5: [          ] Guild Quests (0/? plans)
Phase 6: [          ] Guild Shop & Statistics (0/? plans)
Phase 7: [          ] Zone Content (0/? plans)
```

**Overall:** Phase 4 COMPLETE - Ready for Phase 5 or complete Phase 2

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 13 |
| Tasks Completed | 38 |
| Phases Completed | 2 |
| Days Elapsed | 3 |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 7-phase structure | Follows dependency chain: foundation -> invites -> chat -> bank -> quests -> shop/stats, zones parallel | 2026-01-18 |
| Allow all Pokemon in guild bank | Admin tagging system needs more planning; trust players for now | 2026-01-18 |
| WoW-style role permissions | Familiar pattern (Leader > Officer > Member), prevents abuse, scales well | 2026-01-18 |
| Dedicated guild_messages table | Better RLS isolation than using existing chat system with guild channel filter | 2026-01-18 |
| Block direct mutations via RLS | Force use of SECURITY DEFINER functions for atomic operations and proper permission checks | 2026-01-18 |
| Denormalized member_count | Avoid COUNT(*) queries on every join attempt | 2026-01-18 |
| Partial unique index for leader | Database-level guarantee of single leader per guild | 2026-01-18 |
| String types for UUIDs/timestamps | Consistent with existing codebase patterns | 2026-01-18 |
| Separated Guild from GuildPreview | Full data for members, minimal data for search/discovery | 2026-01-18 |
| Fire-and-forget async handlers | Consistent with existing game-server handler patterns (no await in switch cases) | 2026-01-18 |
| Uppercase guild tag in handler | Ensure consistent display regardless of user input | 2026-01-18 |
| Role hierarchy: leader > officer > member | Standard guild hierarchy; officers assist leader with management | 2026-01-18 |
| Guild component directory structure | apps/web/src/components/game/guild/ with index.ts barrel | 2026-01-18 |
| Role-based UI button visibility | Permission checks computed per-member in MemberRow component | 2026-01-18 |
| Separate GuildInvite vs GuildOutgoingInvite types | Incoming invites need guild info, outgoing need player info | 2026-01-18 |
| getSupabase() for simple handler queries | Use getSupabase() for direct queries in handlers rather than adding new db.ts functions | 2026-01-18 |
| BST-based Pokemon points: <300=1, 300-399=2, 400-499=5, 500-579=10, 580+=25 | Balanced for Gen 1 range, legendary tier at 580 BST | 2026-01-18 |
| Default officer limits: 10000 currency, 20 items, 20 pokemon points | Reasonable daily caps preventing abuse while allowing functionality | 2026-01-18 |
| Members cannot withdraw by default | Forces request system use, maintains leader control | 2026-01-18 |
| Slot expansion doubles each purchase | Provides gold sink, prevents trivial max-slot guilds | 2026-01-18 |
| Max 500 Pokemon slots per guild | Prevents runaway storage, keeps queries performant | 2026-01-18 |
| Flexible optional properties in bank detail types | Simpler than discriminated unions for varying action types | 2026-01-18 |
| Members request withdrawals; officers/leaders withdraw directly | Maintains control while allowing member participation | 2026-01-18 |
| Settings tab only visible to leaders | Restricts limit configuration to highest authority | 2026-01-18 |
| Flex-based action panels in modal | Better than absolute positioning for scrollable content | 2026-01-18 |
| Grid/List/Card view modes for Pokemon | Different use cases - quick overview vs detailed info | 2026-01-19 |
| Rarity-based point colors | Visual distinction for value assessment (gray/green/blue/purple/yellow) | 2026-01-19 |

### Technical Notes

- Follow existing patterns from friends system, trade system, and chat system
- Cache guild info in PlayerSession on connect/change (avoid N+1 queries)
- Use broadcastToGuild() for targeted WebSocket messages (not global broadcast)
- Database functions for atomic operations: create_guild, join_guild, leave_guild, promote_member, demote_member, kick_member, transfer_leadership, disband_guild
- Guild mutations via SECURITY DEFINER functions with FOR UPDATE row locking
- Guild types in packages/shared/src/types/guild.ts importable from @pokemon-idle/shared
- Guild handlers follow fire-and-forget pattern (no await in switch)
- Online status calculated via isPlayerOnline() in handler
- Role management broadcasts guild_role_changed for real-time UI updates
- Guild invite handlers use isPlayerBlocked() for block integration
- Guild bank uses 10 tables: currency, items, pokemon, slots, permissions, limits, player_overrides, withdrawals, requests, logs
- Daily withdrawal limits reset at midnight UTC via date_trunc('day', NOW() AT TIME ZONE 'UTC')
- Pokemon point costs calculated by calculate_pokemon_point_cost() based on BST
- Bank types: BankCategory, BankAction, BankRequestStatus type aliases
- GuildBank interface aggregates all bank state for single-request fetch
- 17 client->server and 13 server->client WebSocket payload types defined
- 18 db.ts wrapper functions for bank RPC calls
- 17 hub.ts handlers for bank WebSocket messages
- Frontend guild bank: Zustand store with 10 actions, gameSocket with 13 handlers and 14 send methods
- GuildBankModal: 6 tabs (Currency, Items, Pokemon, Logs, Requests, Settings)
- BankPokemonTab: Grid/List/Card view modes, point cost display, slot expansion
- BankLogsTab: Paginated with action/category/player filters
- BankRequestsTab: Pending requests with fulfill/cancel actions

### Patterns Established

- Guild mutations via atomic functions: `create_guild()`, `join_guild()`, `leave_guild()`, `promote_member()`, `demote_member()`, `kick_member()`, `transfer_leadership()`, `disband_guild()`
- Player can only be in one guild (enforced by UNIQUE constraint on player_id)
- 24hr cooldown tracked via `players.left_guild_at` column
- Guild types follow social.ts and trade.ts patterns
- WebSocket payloads: `{Action}Payload` for client->server, `{Event}Payload` for server->client
- Guild database functions in db.ts call RPC for mutations, direct queries for reads
- broadcastToGuild() filters by session.guild.id for targeted messaging
- Session guild role updated in real-time when role changes (updatePlayerGuildRole helper)
- Frontend guild state in Zustand with WebSocket message handlers in gameSocket.ts
- Guild UI components organized in apps/web/src/components/game/guild/
- Role-based button visibility computed per-member for maintainability
- Guild invite lifecycle via atomic functions: `send_guild_invite()`, `accept_guild_invite()`, `decline_guild_invite()`, `cancel_guild_invite()`
- Invite expiration via expires_at column filtered at query time (no cron needed)
- Expired invites cleaned opportunistically during send/accept operations
- Guild invite handlers: sendGuildInvite, acceptGuildInvite, declineGuildInvite, cancelGuildInvite, getIncomingGuildInvites, getOutgoingGuildInvites
- Bank mutations via SECURITY DEFINER functions with FOR UPDATE row locking
- Bank queries return JSON formatted for frontend via get_guild_bank(), get_bank_logs(), get_bank_requests()
- Permission checks via check_bank_permission() helper function
- Request fulfillment calls underlying withdraw functions for atomicity
- Bank category type alias: 'currency' | 'item' | 'pokemon'
- Separate payload types for broadcasts vs responses in guild bank
- Bank handlers: getGuildBank, depositCurrency, withdrawCurrency, depositItem, withdrawItem, depositPokemon, withdrawPokemon, expandPokemonSlots, createBankRequest, fulfillBankRequest, cancelBankRequest, getBankRequests, getBankLogs, setBankPermission, setBankLimit, setPlayerOverride, removePlayerOverride
- Role-based tab visibility in modals (Settings for leaders, Requests for officers+)
- Split-view layout for bank operations (bank contents | player inventory)
- Inline editing for settings configuration tables

### TODOs

- [x] Create Phase 1 plans
- [x] Execute 01-01-PLAN.md (Guild Database Schema)
- [x] Execute 01-02-PLAN.md (Shared Types for Guild System)
- [x] Execute 01-03-PLAN.md (WebSocket Handlers)
- [x] Execute 01-04-PLAN.md (Role Management API)
- [x] Execute 01-05-PLAN.md (Frontend Guild UI)
- [x] Create Phase 2 plans (Guild Invites)
- [x] Execute 02-01-PLAN.md (Database Schema for Guild Invites)
- [x] Execute 02-02-PLAN.md (Shared Types for Guild Invites)
- [x] Execute 02-03-PLAN.md (Game Server Handlers)
- [ ] Execute 02-04-PLAN.md (Frontend UI)
- [x] Execute 04-01-PLAN.md (Database Schema for Guild Bank)
- [x] Execute 04-02-PLAN.md (Shared Types for Guild Bank)
- [x] Execute 04-03-PLAN.md (Game Server Handlers)
- [x] Execute 04-04-PLAN.md (Frontend UI)
- [x] Execute 04-05-PLAN.md (Complete Guild Bank Tabs)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed 04-05-PLAN.md (Complete Guild Bank Tabs):
- Created BankPokemonTab with Grid/List/Card view modes
- Created BankLogsTab with pagination and filters
- Created BankRequestsTab with fulfill/cancel actions
- Integrated all tabs into GuildBankModal (replacing placeholders)
- Added Bank button to GuildPanel for modal access
- Fixed blocking prerequisite: created BankCurrencyTab, BankItemsTab, BankSettingsTab

### Next Actions

1. Complete Phase 2 (02-04-PLAN.md - Guild Invites Frontend)
2. Create Phase 3 plans (Guild Chat) or Phase 5 plans (Guild Quests)
3. UAT testing for guild bank functionality

### Files Modified This Session

- `apps/web/src/components/game/guild/BankPokemonTab.tsx` (created)
- `apps/web/src/components/game/guild/BankLogsTab.tsx` (created)
- `apps/web/src/components/game/guild/BankRequestsTab.tsx` (created)
- `apps/web/src/components/game/guild/BankCurrencyTab.tsx` (created - blocking prerequisite)
- `apps/web/src/components/game/guild/BankItemsTab.tsx` (created - blocking prerequisite)
- `apps/web/src/components/game/guild/BankSettingsTab.tsx` (created - blocking prerequisite)
- `apps/web/src/components/game/guild/GuildBankModal.tsx` (modified - tab integration)
- `apps/web/src/components/game/guild/GuildPanel.tsx` (modified - bank button)
- `apps/web/src/components/game/guild/index.ts` (modified - exports)
- `.planning/phases/04-guild-bank/04-05-SUMMARY.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-19*
