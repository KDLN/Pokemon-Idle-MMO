# Project State: Pokemon Idle MMO - Guild Milestone

**Last Updated:** 2026-01-18
**Session:** Plan 01-05 Execution

## Project Reference

**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

**Current Focus:** Phase 1 - Guild Foundation (creating guilds, membership, roles, permissions)

## Current Position

**Phase:** 1 of 7 - Guild Foundation
**Plan:** 5 of 5 complete
**Status:** Phase Complete
**Last activity:** 2026-01-18 - Completed 01-05-PLAN.md (Frontend Guild UI)

**Progress:**
```
Phase 1: [==========] Guild Foundation (5/5 plans complete)
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
| Plans Completed | 5 |
| Tasks Completed | 14 |
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

### TODOs

- [x] Create Phase 1 plans
- [x] Execute 01-01-PLAN.md (Guild Database Schema)
- [x] Execute 01-02-PLAN.md (Shared Types for Guild System)
- [x] Execute 01-03-PLAN.md (WebSocket Handlers)
- [x] Execute 01-04-PLAN.md (Role Management API)
- [x] Execute 01-05-PLAN.md (Frontend Guild UI)
- [ ] Create Phase 2 plans (Guild Invites)

### Blockers

None currently.

## Session Continuity

### Last Session Summary

Completed Plan 01-05 (Frontend Guild UI):
- Added guild state to Zustand store (guild, members, role, search)
- Added WebSocket message handlers for 10 guild message types
- Created GuildPanel, CreateGuildModal, GuildList, GuildMembers components
- Integrated GuildPanel into GameShell social sidebar
- Role-based UI buttons with computed permissions per member

### Next Actions

1. Create Phase 2 CONTEXT.md for Guild Invites
2. Create Phase 2 plans
3. Execute Phase 2 - Guild Invite System

### Files Modified This Session

- `apps/web/src/stores/gameStore.ts` (modified - guild state and actions)
- `apps/web/src/lib/ws/gameSocket.ts` (modified - guild message handlers)
- `apps/web/src/components/game/guild/GuildPanel.tsx` (created)
- `apps/web/src/components/game/guild/CreateGuildModal.tsx` (created)
- `apps/web/src/components/game/guild/GuildList.tsx` (created)
- `apps/web/src/components/game/guild/GuildMembers.tsx` (created)
- `apps/web/src/components/game/guild/index.ts` (created)
- `apps/web/src/components/game/GameShell.tsx` (modified - added GuildPanel)
- `.planning/phases/01-guild-foundation/01-05-SUMMARY.md` (created)
- `.planning/STATE.md` (updated)

---

*State updated: 2026-01-18*
