# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-18
**Session:** Phase 2 Execution

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 2 - Guild Invites (invite system, join modes)

## Current Position

**Phase:** 2 of 7 - Guild Invites
**Plan:** 2 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-18 - Completed 02-01-PLAN.md (Database Schema) and 02-02-PLAN.md (Shared Types)

**Progress:**
```
Phase 1: [==========] Guild Foundation (5/5 plans complete) ✓
Phase 2: [=====     ] Guild Invites (2/4 plans complete)
Phase 3: [          ] Guild Chat (0/? plans)
Phase 4: [          ] Guild Bank (0/? plans)
Phase 5: [          ] Guild Quests (0/? plans)
Phase 6: [          ] Guild Shop & Statistics (0/? plans)
Phase 7: [          ] Zone Content (0/? plans)
```

**Overall:** Phase 2 IN PROGRESS - Wave 1 COMPLETE (2/2), ready for Wave 2

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 7 |
| Tasks Completed | 19 |
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
- [ ] Execute 02-03-PLAN.md (Game Server Handlers)
- [ ] Execute 02-04-PLAN.md (Frontend UI)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed Phase 2 Planning (Guild Invites):
- Created CONTEXT.md with requirements and success criteria
- Researched implementation approach (02-RESEARCH.md)
- Created 4 execution plans in 2 waves:
  - Wave 1: 02-01 (Database Schema) + 02-02 (Shared Types) - parallel
  - Wave 2: 02-03 (Game Server) + 02-04 (Frontend UI) - depends on wave 1
- Key finding: join_mode already exists on guilds table from Phase 1

### Next Actions

1. Execute Phase 2: `/gsd:execute-phase 2`
2. Wave 1: Apply migration 023_guild_invites.sql + add invite types
3. Wave 2: Add handlers + frontend components
4. Human verification checkpoint in Plan 02-04

### Files Created This Session

- `.planning/phases/02-guild-invites/CONTEXT.md` (created)
- `.planning/phases/02-guild-invites/02-RESEARCH.md` (created)
- `.planning/phases/02-guild-invites/02-01-PLAN.md` (created)
- `.planning/phases/02-guild-invites/02-02-PLAN.md` (created)
- `.planning/phases/02-guild-invites/02-03-PLAN.md` (created)
- `.planning/phases/02-guild-invites/02-04-PLAN.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-18*
