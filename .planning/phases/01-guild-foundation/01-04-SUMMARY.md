---
phase: 01
plan: 04
subsystem: guild-system
tags: [guild, api, websocket, role-management, database]

dependency-graph:
  requires: [01-02, 01-03]
  provides: [guild-role-management-api]
  affects: [01-05, 02-01]

tech-stack:
  added: []
  patterns: [rpc-functions, websocket-handlers, session-state-sync]

key-files:
  created: []
  modified:
    - supabase/migrations/022_guilds.sql
    - apps/game-server/src/db.ts
    - apps/game-server/src/hub.ts
    - apps/game-server/src/types.ts

decisions:
  - id: role-hierarchy
    choice: leader > officer > member with specific permissions
    rationale: Standard guild hierarchy pattern; officers assist leader with day-to-day management

metrics:
  duration: ~15 minutes
  completed: 2026-01-18
---

# Phase 01 Plan 04: Guild API Endpoints - Role Management Summary

Guild role management WebSocket API with database functions for promote, demote, kick, transfer leadership, and disband operations.

## What Was Built

### Database Functions (022_guilds.sql)

Added 5 PostgreSQL functions with atomic operations and row-level locking:

1. **promote_member(actor_id, target_id)** - Leader promotes member to officer
   - Validates actor is leader
   - Validates target is member (not already officer/leader)
   - Uses FOR UPDATE locking for safe concurrent access

2. **demote_member(actor_id, target_id)** - Leader demotes officer to member
   - Validates actor is leader
   - Validates target is officer (not leader/member)

3. **kick_member(actor_id, target_id)** - Leader/officer kicks member
   - Leader can kick anyone except self
   - Officer can kick members only (not other officers)
   - Cascades through triggers to update player.guild_id

4. **transfer_leadership(actor_id, target_id)** - Leader transfers to another member
   - Old leader becomes officer
   - New leader gets leader role
   - Updates both guild_members and guilds.leader_id

5. **disband_guild(actor_id, confirmation)** - Leader disbands with name confirmation
   - Requires exact guild name match (case-insensitive)
   - Cascades delete to all guild_members
   - Triggers update player.left_guild_at for cooldown

### Database Wrappers (db.ts)

Added TypeScript wrappers calling the RPC functions:
- `promoteMember(actorId, targetId)`
- `demoteMember(actorId, targetId)`
- `kickMember(actorId, targetId)`
- `transferLeadership(actorId, targetId)`
- `disbandGuild(actorId, confirmation)`
- `getGuildMemberByPlayerId(playerId)` - Helper for username/role lookups

### WebSocket Handlers (hub.ts)

Added 5 message handlers with real-time broadcasting:

| Message Type | Handler | Broadcasts |
|--------------|---------|------------|
| `promote_member` | handlePromoteMember | `guild_role_changed` |
| `demote_member` | handleDemoteMember | `guild_role_changed` |
| `kick_member` | handleKickMember | `guild_member_kicked`, `guild_kicked` |
| `transfer_leadership` | handleTransferLeadership | `guild_role_changed` (x2) |
| `disband_guild` | handleDisbandGuild | `guild_disbanded` |

Each handler:
- Validates session and guild membership
- Calls db function for atomic operation
- Broadcasts changes to all online guild members
- Updates affected player sessions in real-time

### Type Exports (types.ts)

Added re-exports from shared package:
- `GuildRole`
- `PromoteMemberPayload`
- `DemoteMemberPayload`
- `KickMemberPayload`
- `TransferLeadershipPayload`
- `DisbandGuildPayload`
- `GuildMemberKickedPayload`
- `GuildRoleChangedPayload`
- `GuildDisbandedPayload`

## Decisions Made

1. **Role Hierarchy**: leader > officer > member
   - Leader: full control (promote, demote, kick anyone, transfer, disband)
   - Officer: limited control (kick members only)
   - Member: no management permissions

2. **Real-time Session Updates**: When a role changes, the affected player's session is updated immediately if they're online, so they don't need to reconnect to see their new permissions.

3. **Disband Confirmation**: Requires typing guild name to prevent accidental disbands.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- Build: PASS (`npm run build` completes without errors)
- Database functions: 5 functions in 022_guilds.sql
- DB wrappers: 6 functions in db.ts
- WebSocket handlers: 5 handlers in hub.ts with switch cases

## Commits

| Hash | Description |
|------|-------------|
| aab1100 | feat(01-04): add role management database functions |
| cd4b977 | feat(01-04): add role management database wrappers to db.ts |
| beaa922 | feat(01-04): add role management handlers to hub.ts |

## Next Phase Readiness

Plan 01-05 (Guild UI Components) can proceed:
- All role management APIs are complete
- WebSocket message types match shared type definitions
- Broadcast messages provide real-time update hooks for UI
