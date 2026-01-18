# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-18
**Session:** Plan 01-04 Execution

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 1 - Guild Foundation (creating guilds, membership, roles, permissions)

## Current Position

**Phase:** 1 of 7 - Guild Foundation
**Plan:** 4 of 4 complete
**Status:** Phase Complete
**Last activity:** 2026-01-18 - Completed 01-04-PLAN.md (Guild API Endpoints - Role Management)

**Progress:**
```
Phase 1: [==========] Guild Foundation (4/4 plans complete)
Phase 2: [          ] Guild Invites (0/? plans)
Phase 3: [          ] Guild Chat (0/? plans)
Phase 4: [          ] Guild Bank (0/? plans)
Phase 5: [          ] Guild Quests (0/? plans)
Phase 6: [          ] Guild Shop & Statistics (0/? plans)
Phase 7: [          ] Zone Content (0/? plans)
```

**Overall:** Phase 1 COMPLETE - Ready for Phase 2

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 4 |
| Tasks Completed | 11 |
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

### TODOs

- [x] Create Phase 1 plans
- [x] Execute 01-01-PLAN.md (Guild Database Schema)
- [x] Execute 01-02-PLAN.md (Shared Types for Guild System)
- [x] Execute 01-03-PLAN.md (WebSocket Handlers)
- [x] Execute 01-04-PLAN.md (Role Management API)
- [ ] Create Phase 2 plans (Guild Invites)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed Plan 01-04 (Guild API Endpoints - Role Management):
- Added 5 database functions for role management (promote, demote, kick, transfer, disband)
- Added 6 TypeScript wrappers in db.ts
- Added 5 WebSocket handlers in hub.ts with switch cases
- Added type exports for role management payloads
- All handlers broadcast changes to guild members for real-time UI updates

### Next Actions

1. Create Phase 2 CONTEXT.md for Guild Invites
2. Create Phase 2 plans
3. Execute Phase 2 - Guild Invite System

### Files Modified This Session

- `supabase/migrations/022_guilds.sql` (modified - 5 role management functions)
- `apps/game-server/src/db.ts` (modified - 6 role management wrappers)
- `apps/game-server/src/hub.ts` (modified - 5 handlers + switch cases)
- `apps/game-server/src/types.ts` (modified - role management type exports)
- `.planning/phases/01-guild-foundation/01-04-SUMMARY.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-18*
