# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-18
**Session:** Phase 4 Execution

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 4 - Guild Bank (shared storage with role-based access)

## Current Position

**Phase:** 4 of 7 - Guild Bank
**Plan:** 1 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-18 - Completed 04-01-PLAN.md (Database Schema)

**Progress:**
```
Phase 1: [==========] Guild Foundation (5/5 plans complete)
Phase 2: [=======   ] Guild Invites (3/4 plans complete)
Phase 3: [          ] Guild Chat (0/? plans)
Phase 4: [==        ] Guild Bank (1/4 plans complete)
Phase 5: [          ] Guild Quests (0/? plans)
Phase 6: [          ] Guild Shop & Statistics (0/? plans)
Phase 7: [          ] Zone Content (0/? plans)
```

**Overall:** Phase 4 IN PROGRESS - Plan 1/4 complete

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 9 |
| Tasks Completed | 26 |
| Phases Completed | 1 |
| Days Elapsed | 1 |

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
- [ ] Execute 04-02-PLAN.md (Shared Types for Guild Bank)
- [ ] Execute 04-03-PLAN.md (Game Server Handlers)
- [ ] Execute 04-04-PLAN.md (Frontend UI)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed 04-01-PLAN.md (Database Schema for Guild Bank):
- Created 2008-line migration file with complete guild bank schema
- Added 10 tables for storage, permissions, limits, tracking, requests, logs
- Added 14 SECURITY DEFINER mutation functions with FOR UPDATE locking
- Added 8 query/configuration functions for bank state and permissions
- Added 40 RLS policies blocking direct mutations
- Established BST-based Pokemon point cost system

### Next Actions

1. Execute 04-02-PLAN.md (Shared Types for Guild Bank)
2. Continue through 04-03 and 04-04
3. Phase 4 complete after 04-04

### Files Created This Session

- `supabase/migrations/026_guild_bank.sql` (created)
- `.planning/phases/04-guild-bank/04-01-SUMMARY.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-18*
