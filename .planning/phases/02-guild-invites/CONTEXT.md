# Phase 2 Context: Guild Invites

**Phase:** 2 of 7
**Goal:** Guild leaders and officers can recruit players through an invite system.

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| INVITE-01 | Leader/Officer can send invite to any player not in a guild | Must |
| INVITE-02 | Player receives invite notification | Must |
| INVITE-03 | Player can accept or decline invite | Must |
| INVITE-04 | Invites expire after 7 days | Must |
| INVITE-05 | Guild can set join mode: Open, Invite-Only, or Closed | Must |

## Dependencies

- Phase 1 complete (guilds, guild_members, roles exist)
- Existing patterns: WebSocket handlers, RLS policies, SECURITY DEFINER functions
- Existing tables: guilds, guild_members, players

## Success Criteria

- Leader or Officer can send invite to any player not currently in a guild
- Player receives notification when invited to a guild
- Player can view list of pending invites received
- Player can accept invite (joins guild as Member)
- Player can decline invite (removes from pending list)
- Invites automatically expire and are removed after 7 days
- Guild can set join mode: Open (anyone can join), Invite-Only (requires invite), Closed (no new members)
- Join mode is respected: Open guilds allow direct join, Invite-Only requires invite, Closed blocks all joins

## Technical Considerations

### Database
- New table: `guild_invites` (guild_id, player_id, invited_by, created_at, expires_at)
- New column on guilds: `join_mode` enum ('open', 'invite_only', 'closed')
- RLS policies for invite visibility
- Function to auto-expire old invites (or check on query)

### WebSocket Messages
- Client → Server: `guild_invite_send`, `guild_invite_accept`, `guild_invite_decline`, `guild_set_join_mode`
- Server → Client: `guild_invite_received`, `guild_invite_list`, `guild_invite_accepted`, `guild_invite_declined`

### Frontend
- Invite button on player search/profile
- Pending invites list in guild panel
- Accept/Decline buttons on invites
- Join mode setting in guild settings (Leader/Officer only)

## Phase 1 Patterns to Follow

- SECURITY DEFINER functions for mutations
- FOR UPDATE row locking for race condition prevention
- broadcastToGuild() for targeted messaging
- Fire-and-forget async handlers (no await in switch)
- Zustand store actions with WebSocket message handlers
