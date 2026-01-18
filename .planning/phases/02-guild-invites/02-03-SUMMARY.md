---
phase: 02-guild-invites
plan: 03
type: summary
status: complete
subsystem: game-server
tags: [websocket, handlers, guild-invites, database, typescript]
requires:
  - 02-01  # Database schema for invites
  - 02-02  # Shared types for invites
provides:
  - "WebSocket handlers for guild invite operations"
  - "Database functions for invite CRUD operations"
  - "Real-time invite notifications"
affects:
  - 02-04  # Frontend UI needs these handlers
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget async handlers (no await in switch)"
    - "isPlayerBlocked() integration for social features"
    - "broadcastToGuild() for guild-targeted messages"
key-files:
  created: []
  modified:
    - apps/game-server/src/db.ts
    - apps/game-server/src/hub.ts
    - apps/game-server/src/types.ts
decisions:
  - id: "getSupabase-for-queries"
    description: "Use getSupabase() for direct queries in handlers rather than adding new db.ts functions"
    rationale: "Simple query for target username; pattern already used elsewhere"
metrics:
  duration: "~4 minutes"
  completed: 2026-01-18
---

# Phase 2 Plan 3: Game Server Handlers for Guild Invites - Summary

WebSocket handlers and database functions for guild invite system in game-server.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add database functions for invites in db.ts | 257ebad |
| 2 | Add type imports for invite payloads in types.ts | 257ebad |
| 3 | Add WebSocket handlers in hub.ts | 257ebad |

## What Was Built

### Database Functions (db.ts)

Six new functions for guild invite operations:

1. **sendGuildInvite(actorId, targetPlayerId)** - Calls `send_guild_invite` RPC
2. **acceptGuildInvite(playerId, inviteId)** - Calls `accept_guild_invite` RPC
3. **declineGuildInvite(playerId, inviteId)** - Calls `decline_guild_invite` RPC
4. **cancelGuildInvite(actorId, inviteId)** - Calls `cancel_guild_invite` RPC
5. **getIncomingGuildInvites(playerId)** - Fetches pending invites with guild info
6. **getOutgoingGuildInvites(guildId)** - Fetches sent invites with player info

### WebSocket Message Types

| Message Type | Direction | Handler |
|--------------|-----------|---------|
| guild_invite_send | client->server | handleSendGuildInvite |
| guild_invite_accept | client->server | handleAcceptGuildInvite |
| guild_invite_decline | client->server | handleDeclineGuildInvite |
| guild_invite_cancel | client->server | handleCancelGuildInvite |
| get_guild_invites | client->server | handleGetGuildInvites |
| get_guild_outgoing_invites | client->server | handleGetOutgoingGuildInvites |

### Response Message Types

| Message Type | When Sent |
|--------------|-----------|
| guild_invite_sent | After successfully sending invite |
| guild_invite_received | Real-time notification to target player |
| guild_invite_accepted | After accepting invite |
| guild_invite_declined | After declining invite |
| guild_invite_cancelled | After cancelling invite |
| guild_invites_list | Response to get_guild_invites |
| guild_outgoing_invites | Response to get_guild_outgoing_invites |
| guild_invite_error | On any invite operation failure |
| guild_data | Full guild data sent after accepting invite |
| guild_member_joined | Broadcast to guild when member joins via invite |

### Handler Features

- **Block integration**: Uses `isPlayerBlocked()` before sending invite
- **Permission checks**: Leader/officer validation for send/cancel
- **Real-time notifications**: Uses `getClientByPlayerId()` for online targets
- **Session updates**: Updates `client.session.guild` after accepting
- **Guild broadcasts**: Uses `broadcastToGuild()` for member joined notification

## Verification Results

- [x] Database functions added to db.ts (6 functions)
- [x] Type imports added to types.ts (11 invite-related types)
- [x] Switch cases added for 6 message types
- [x] handleSendGuildInvite includes isPlayerBlocked check
- [x] handleSendGuildInvite notifies target via getClientByPlayerId
- [x] handleAcceptGuildInvite updates client.session.guild
- [x] handleAcceptGuildInvite broadcasts to guild
- [x] npm run build completes without errors

## Deviations from Plan

None - plan executed exactly as written.

## Patterns Followed

1. **Fire-and-forget handlers**: No await in switch cases, matches existing handlers
2. **Permission validation**: Check session.guild.role before privileged operations
3. **Session update on join**: Same pattern as handleJoinGuild
4. **Real-time notifications**: Same pattern as friend request handlers
5. **Error handling**: Return guild_invite_error with descriptive message

## Next Phase Readiness

Ready for 02-04-PLAN.md (Frontend UI) which depends on these handlers.
