---
phase: 02-guild-invites
plan: 02
subsystem: types
tags: [typescript, shared-types, websocket-messages, guild-invites]

# Dependency graph
requires:
  - phase: 01-02
    provides: GuildRole, Guild, GuildMember types
provides:
  - GuildInvite, GuildOutgoingInvite interfaces
  - WebSocket message payloads for invite operations
affects: [02-guild-invites, game-server, web-app]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invite types extend guild.ts, same file organization"
    - "Consistent payload naming: Send/Accept/Decline/Cancel for client, Sent/Received/List for server"

key-files:
  created: []
  modified:
    - packages/shared/src/types/guild.ts

key-decisions:
  - "Used string for UUIDs and timestamps (consistent with existing codebase)"
  - "Separated GuildInvite (incoming) from GuildOutgoingInvite (sent by guild staff)"
  - "Used invited_by_id vs invited_by to differentiate ID vs username fields"

patterns-established:
  - "Invite types follow existing guild.ts WebSocket payload patterns"
  - "All invite-related payloads grouped under comment headers"

# Metrics
duration: 1min
completed: 2026-01-18
---

# Phase 2 Plan 02: Shared Types for Guild Invites Summary

**TypeScript type definitions for guild invite system: GuildInvite and GuildOutgoingInvite interfaces, plus 12 WebSocket message payloads for send/accept/decline/cancel invite operations**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-18T18:50:39Z
- **Completed:** 2026-01-18T18:51:32Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added GuildInvite interface for displaying pending invites (includes guild info + inviter info)
- Added GuildOutgoingInvite interface for guild staff viewing sent invites
- Added 5 client->server payloads: SendGuildInvitePayload, AcceptGuildInvitePayload, DeclineGuildInvitePayload, CancelGuildInvitePayload, GetGuildInvitesPayload
- Added 7 server->client payloads: GuildInviteSentPayload, GuildInviteReceivedPayload, GuildInvitesListPayload, GuildOutgoingInvitesPayload, GuildInviteAcceptedPayload, GuildInviteDeclinedPayload, GuildInviteCancelledPayload, GuildMemberJoinedViaInvitePayload
- Types now importable from @pokemon-idle/shared

## Task Commits

Each task was committed atomically:

1. **Task 1: Add guild invite types to guild.ts** - `2821c40` (feat)
2. **Task 2: Verify exports and build** - No commit needed (verification only)

## Files Modified
- `packages/shared/src/types/guild.ts` - Added 105 lines with invite types and payloads

## Decisions Made
- Used `invited_by: string | null` for ID, `invited_by_username: string` for display name (consistent with existing patterns)
- Created separate GuildInvite (for invitee's view with guild info) and GuildOutgoingInvite (for guild staff's view with player info)
- Included member_count/max_members in invite to show guild capacity
- GuildMemberJoinedViaInvitePayload distinct from GuildMemberJoinedPayload to include inviter context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guild invite types available for import in game-server handlers (Plan 02-03)
- Types aligned with database schema from Plan 02-01
- Ready for Plan 02-03 (Game Server Handlers) and Plan 02-04 (Frontend UI) implementation

---
*Phase: 02-guild-invites*
*Completed: 2026-01-18*
