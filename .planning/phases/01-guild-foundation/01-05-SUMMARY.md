---
phase: 01
plan: 05
subsystem: guild-system
tags: [guild, ui, react, zustand, websocket, frontend]

dependency-graph:
  requires: [01-03, 01-04]
  provides: [guild-ui-components]
  affects: [02-01, 03-01]

tech-stack:
  added: []
  patterns: [zustand-websocket-sync, component-composition, role-based-ui]

key-files:
  created:
    - apps/web/src/components/game/guild/GuildPanel.tsx
    - apps/web/src/components/game/guild/CreateGuildModal.tsx
    - apps/web/src/components/game/guild/GuildList.tsx
    - apps/web/src/components/game/guild/GuildMembers.tsx
    - apps/web/src/components/game/guild/index.ts
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/lib/ws/gameSocket.ts
    - apps/web/src/components/game/GameShell.tsx

decisions:
  - id: guild-component-location
    choice: apps/web/src/components/game/guild/ directory
    rationale: Follows existing pattern of grouping related components (game/, social/, etc.)
  - id: role-based-button-visibility
    choice: Computed canPromote/canDemote/canKick/canTransfer per member
    rationale: Clear permission logic; buttons only render when action is allowed

metrics:
  duration: ~20 minutes
  completed: 2026-01-18
---

# Phase 01 Plan 05: Frontend Guild UI Summary

Complete React frontend for guild management with Zustand state, WebSocket sync, and role-based UI controls.

## What Was Built

### Zustand Store Extensions (gameStore.ts)

Added guild state management and WebSocket integration:

**State:**
- `guild: Guild | null` - Current guild data
- `guildMembers: GuildMember[]` - Member roster
- `myGuildRole: GuildRole | null` - Current player's role
- `guildList: GuildPreview[]` - Search results
- `guildListTotal: number` - Total guild count
- `guildError: string | null` - Error messages

**Actions:**
- `setGuild`, `setGuildMembers`, `setMyGuildRole` - State setters
- `setGuildList`, `setGuildError`, `clearGuildState` - State management

**WebSocket Send Functions:**
- `sendCreateGuild(name, tag, description)` - Create new guild
- `sendJoinGuild(guildId)` - Join open guild
- `sendLeaveGuild()` - Leave current guild
- `sendSearchGuilds(query, page)` - Search guilds
- `sendGetGuild()` - Request current guild data
- `sendPromoteMember(playerId)` - Promote to officer
- `sendDemoteMember(playerId)` - Demote to member
- `sendKickMember(playerId)` - Kick from guild
- `sendTransferLeadership(playerId)` - Transfer leader role
- `sendDisbandGuild(confirmation)` - Disband guild

### WebSocket Message Handlers (gameSocket.ts)

Added handlers for all guild message types:

| Message Type | Handler Behavior |
|--------------|------------------|
| `guild_data` | Sets guild, members, and my role |
| `guild_list` | Sets search results and total count |
| `guild_member_joined` | Adds member, increments count |
| `guild_member_left` | Removes member, decrements count |
| `guild_member_kicked` | Removes kicked member from roster |
| `guild_role_changed` | Updates member role, updates myGuildRole if self |
| `guild_disbanded` | Clears guild state, shows message |
| `guild_kicked` | Clears guild state, shows kicked message |
| `guild_left` | Clears guild state |
| `guild_error` | Sets error message |

### GuildPanel Component

Main panel that conditionally renders based on guild membership:

**No Guild State:**
- "Guilds" header with "Create Guild" button
- Error display area
- GuildList component for searching/joining

**In Guild State:**
- Guild header with tag, name, member count
- Guild description (if set)
- Leave button (for members/officers)
- Disband button (for leader only)
- Your role badge (color-coded)
- GuildMembers component

**Disband Confirmation Modal:**
- Warning text about permanent deletion
- Requires typing guild name exactly
- Cancel/Disband buttons

### CreateGuildModal Component

Modal form for creating new guilds:

- **Name field**: 3-30 characters, alphanumeric + spaces
- **Tag field**: 2-5 characters, auto-uppercased
- **Description field**: Optional, up to 500 characters
- Client-side validation with error messages
- Cancel/Create buttons

### GuildList Component

Searchable list of available guilds:

- Search input with submit button
- Guild cards showing:
  - Tag and name
  - Join mode badge (Invite Only, Closed)
  - Member count / max members
  - Description preview (truncated)
  - Join button (for open guilds with space)
  - "Full" indicator for full guilds
- Total count display

### GuildMembers Component

Member roster with role management:

**Member Row:**
- Online indicator (green/gray dot)
- Username (highlighted if self)
- Role badge (leader=yellow, officer=blue, member=gray)
- Last online time (relative format)
- Action buttons based on permissions

**Role-Based Button Visibility:**

| Your Role | Target Role | Available Actions |
|-----------|-------------|-------------------|
| Leader | Member | Promote, Lead, Kick |
| Leader | Officer | Demote, Lead, Kick |
| Leader | Leader (self) | None |
| Officer | Member | Kick |
| Officer | Officer/Leader | None |
| Member | Any | None |

**Sorting:** Leaders first, then officers, then members. Online before offline within each group.

### Integration (GameShell.tsx)

Added GuildPanel to the social sidebar alongside existing panels (friends, chat).

## Decisions Made

1. **Component Directory Structure**: Created `apps/web/src/components/game/guild/` with index.ts barrel export, following existing codebase patterns.

2. **Role-Based UI Logic**: Permission checks computed per-member in MemberRow component, keeping logic close to rendering for maintainability.

3. **Confirmation UX**: Native browser `confirm()` for quick actions (leave, promote, kick), custom modal for destructive action (disband).

4. **Error Auto-Clear**: Guild errors auto-clear after 5 seconds via useEffect timer.

## Deviations from Plan

None - plan executed exactly as written. Components were placed in `apps/web/src/components/game/guild/` (actual codebase structure) rather than direct `apps/web/src/components/` (plan examples).

## Verification Results

- UI verified: Checkpoint approved by user
- Guild creation: Working
- Guild search/join: Working
- Member roster: Working with online status
- Role management buttons: Visible based on permissions
- Disband confirmation: Working

## Commits

| Hash | Description |
|------|-------------|
| 3019ac5 | feat(01-05): add guild state to Zustand store and WebSocket handlers |
| 0a029f5 | feat(01-05): create GuildPanel and CreateGuildModal components |
| d9f91db | feat(01-05): create GuildList and GuildMembers components |
| f405887 | feat(01-05): integrate GuildPanel into social sidebar |

## Next Phase Readiness

Phase 1 (Guild Foundation) is now complete:
- Database schema (01-01)
- Shared types (01-02)
- WebSocket handlers (01-03)
- Role management API (01-04)
- Frontend UI (01-05)

Phase 2 (Guild Invites) can proceed:
- All guild CRUD operations are functional
- Real-time sync is working
- UI foundation is in place for invite UI additions
