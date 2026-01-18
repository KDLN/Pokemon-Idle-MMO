# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-18
**Session:** Plan 01-03 Execution

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 1 - Guild Foundation (creating guilds, membership, roles, permissions)

## Current Position

**Phase:** 1 of 7 - Guild Foundation
**Plan:** 3 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-18 - Completed 01-03-PLAN.md (Game Server Guild Handlers)

**Progress:**
```
Phase 1: [===       ] Guild Foundation (3/4 plans complete)
Phase 2: [          ] Guild Invites (0/? plans)
Phase 3: [          ] Guild Chat (0/? plans)
Phase 4: [          ] Guild Bank (0/? plans)
Phase 5: [          ] Guild Quests (0/? plans)
Phase 6: [          ] Guild Shop & Statistics (0/? plans)
Phase 7: [          ] Zone Content (0/? plans)
```

**Overall:** Phase 1 in progress

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 3 |
| Tasks Completed | 8 |
| Phases Completed | 0 |
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

### Technical Notes

- Follow existing patterns from friends system, trade system, and chat system
- Cache guild info in PlayerSession on connect/change (avoid N+1 queries)
- Use broadcastToGuild() for targeted WebSocket messages (not global broadcast)
- Database functions for atomic operations: create_guild, join_guild, leave_guild
- Guild mutations via SECURITY DEFINER functions with FOR UPDATE row locking
- Guild types in packages/shared/src/types/guild.ts importable from @pokemon-idle/shared
- Guild handlers follow fire-and-forget pattern (no await in switch)
- Online status calculated via isPlayerOnline() in handler

### Patterns Established

- Guild mutations via atomic functions: `create_guild()`, `join_guild()`, `leave_guild()`
- Player can only be in one guild (enforced by UNIQUE constraint on player_id)
- 24hr cooldown tracked via `players.left_guild_at` column
- Guild types follow social.ts and trade.ts patterns
- WebSocket payloads: `{Action}Payload` for client->server, `{Event}Payload` for server->client
- Guild database functions in db.ts call RPC for mutations, direct queries for reads
- broadcastToGuild() filters by session.guild.id for targeted messaging

### TODOs

- [x] Create Phase 1 plans
- [x] Execute 01-01-PLAN.md (Guild Database Schema)
- [x] Execute 01-02-PLAN.md (Shared Types for Guild System)
- [x] Execute 01-03-PLAN.md (WebSocket Handlers)
- [ ] Execute 01-04-PLAN.md (Frontend Guild UI)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed Plan 01-03 (Game Server Guild Handlers):
- Extended PlayerSession with optional guild field for session caching
- Added 7 guild database functions (createGuild, joinGuild, leaveGuild, getGuildById, getGuildMembers, getPlayerGuild, searchGuilds)
- Added broadcastToGuild() for targeted messaging to guild members
- Added 6 WebSocket message handlers (create_guild, join_guild, leave_guild, get_guild, get_guild_members, search_guilds)
- Guild info now loaded on connect alongside other player data

### Next Actions

1. Execute 01-04-PLAN.md (Frontend Guild UI)
2. Add guild components to web app
3. Connect UI to WebSocket guild messages

### Files Modified This Session

- `apps/game-server/src/types.ts` (modified - guild type exports and PlayerSession extension)
- `apps/game-server/src/db.ts` (modified - 7 guild database functions)
- `apps/game-server/src/hub.ts` (modified - broadcastToGuild and 6 handlers)
- `.planning/phases/01-guild-foundation/01-03-SUMMARY.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-18*
