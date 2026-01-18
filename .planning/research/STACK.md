# Technology Stack: Guild System

**Project:** Pokemon Idle MMO - Guild Milestone
**Researched:** 2026-01-18
**Confidence:** HIGH (aligns with existing codebase patterns)

## Recommended Stack

The guild system should use the existing stack with no new dependencies. The current architecture supports all required patterns.

### Database Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase PostgreSQL | Current | Guild data storage | Already in use, RLS patterns established |
| ENUM types | - | Guild roles, member status | Matches `friend_status`, `trade_status` patterns |
| UUID primary keys | - | Guild/membership IDs | Matches all existing tables |
| Optimistic locking | - | Concurrent operations | Pattern proven in trades, inventory |

### Real-Time Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| WebSocket (ws) | 8.18.0 | Guild events, chat | Already handles chat, trades, friend updates |
| In-memory broadcast | - | Real-time member updates | Matches `broadcast()` pattern in hub.ts |

### Permission Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Database ENUM roles | - | Leader/Officer/Member | Simple, queryable, matches existing enums |
| RLS policies | - | Data access control | Matches existing security model |
| Application-layer checks | - | Complex permission logic | Matches trade/friend validation patterns |

### No New Dependencies Required

The existing stack handles all guild requirements:
- Real-time: WebSocket already broadcasts to all clients
- Database: PostgreSQL with RLS already handles social features
- State: Zustand already manages social data (friends, trades)
- Auth: JWT validation already verified on connection

---

## Database Schema Pattern

### Core Tables

```sql
-- Guild roles enum
CREATE TYPE guild_role AS ENUM ('leader', 'officer', 'member');

-- Guild member status enum
CREATE TYPE guild_member_status AS ENUM ('invited', 'active', 'kicked');

-- Guilds table
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,  -- 2-5 char display tag
  description TEXT,
  leader_id UUID REFERENCES players(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  member_count INT DEFAULT 1,
  max_members INT DEFAULT 50,

  -- Settings
  join_type TEXT DEFAULT 'invite',  -- 'open', 'invite', 'closed'
  min_level INT DEFAULT 1,

  CONSTRAINT guild_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 30),
  CONSTRAINT guild_tag_length CHECK (char_length(tag) >= 2 AND char_length(tag) <= 5)
);

-- Guild members (junction table with roles)
CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  role guild_role NOT NULL DEFAULT 'member',
  status guild_member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES players(id),

  CONSTRAINT unique_player_guild UNIQUE (player_id, guild_id),
  CONSTRAINT one_guild_per_player UNIQUE (player_id) -- Players can only be in one guild
);
```

**Rationale:**
- Matches existing patterns: UUID keys, foreign key cascades, enums for status
- `leader_id` denormalization enables fast leader lookups without joins
- `member_count` denormalization avoids COUNT(*) on every guild view
- Unique constraint on player_id enforces single-guild membership

### Guild Chat Extension

```sql
-- Extend existing chat_messages or add guild_id column
ALTER TABLE chat_messages ADD COLUMN guild_id UUID REFERENCES guilds(id);

-- Index for guild chat queries
CREATE INDEX idx_chat_messages_guild ON chat_messages(guild_id, created_at DESC)
  WHERE guild_id IS NOT NULL;
```

**Rationale:**
- Reuses existing chat infrastructure
- Guild chat channel already exists in code (`CHAT_CHANNELS` includes 'guild')
- Just needs database support for filtering by guild

### Indexes

```sql
-- Fast guild lookups
CREATE INDEX idx_guilds_leader ON guilds(leader_id);
CREATE INDEX idx_guilds_name ON guilds(LOWER(name));

-- Member queries
CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX idx_guild_members_player ON guild_members(player_id);
CREATE INDEX idx_guild_members_role ON guild_members(guild_id, role);
```

---

## Permission System Design

### Three-Tier Role Model

| Role | Permission Level | Capabilities |
|------|-----------------|--------------|
| Leader | 3 | All permissions, transfer leadership, disband guild |
| Officer | 2 | Invite/kick members, edit description, manage invites |
| Member | 1 | View guild, chat, leave guild |

### Permission Checks (Application Layer)

```typescript
// Permission constants
const GUILD_PERMISSIONS = {
  INVITE_MEMBER: 2,      // Officer+
  KICK_MEMBER: 2,        // Officer+
  EDIT_SETTINGS: 2,      // Officer+
  PROMOTE_MEMBER: 3,     // Leader only
  DEMOTE_OFFICER: 3,     // Leader only
  TRANSFER_LEADER: 3,    // Leader only
  DISBAND: 3,            // Leader only
} as const

// Role levels
const ROLE_LEVELS = {
  'member': 1,
  'officer': 2,
  'leader': 3
} as const

// Permission check function
function hasGuildPermission(
  memberRole: GuildRole,
  permission: keyof typeof GUILD_PERMISSIONS
): boolean {
  return ROLE_LEVELS[memberRole] >= GUILD_PERMISSIONS[permission]
}
```

**Rationale:**
- Numeric levels enable simple >= checks
- Matches existing pattern: server validates all mutations
- No complex permission matrices needed for this scope

### RLS Policies Pattern

```sql
-- Guild members can view their guild
CREATE POLICY "Members can view own guild"
  ON guilds FOR SELECT
  USING (
    id IN (
      SELECT guild_id FROM guild_members
      WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        AND status = 'active'
    )
  );

-- Anyone can view guilds (for discovery)
CREATE POLICY "Anyone can view guild info"
  ON guilds FOR SELECT
  USING (true);

-- Only officers+ can update guild settings
CREATE POLICY "Officers can update guild"
  ON guilds FOR UPDATE
  USING (
    id IN (
      SELECT guild_id FROM guild_members
      WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        AND status = 'active'
        AND role IN ('leader', 'officer')
    )
  );
```

---

## Real-Time Synchronization

### WebSocket Message Types

Add to existing message protocol:

```typescript
// Client -> Server
type: 'create_guild' | 'disband_guild' |
      'invite_to_guild' | 'accept_guild_invite' | 'decline_guild_invite' |
      'kick_from_guild' | 'leave_guild' |
      'promote_member' | 'demote_member' |
      'transfer_leadership' |
      'update_guild_settings' |
      'get_guild' | 'get_guild_members'

// Server -> Client
type: 'guild_data' | 'guild_update' |
      'guild_member_joined' | 'guild_member_left' | 'guild_member_kicked' |
      'guild_role_changed' | 'guild_disbanded' |
      'guild_invite_received'
```

### Broadcast Patterns

**Member Events (broadcast to guild members only):**
```typescript
private broadcastToGuild(guildId: string, type: string, payload: unknown) {
  for (const [, client] of this.clients) {
    if (!client.session?.guildId) continue
    if (client.session.guildId === guildId) {
      this.send(client, type, payload)
    }
  }
}
```

**Rationale:**
- Matches existing `broadcast()` pattern
- Add `guildId` to PlayerSession for O(1) guild membership checks
- No need for Supabase Realtime (adds complexity, already have WebSocket)

### Session Extension

```typescript
interface PlayerSession {
  // ... existing fields ...

  // Guild state (loaded on connect, updated on changes)
  guildId?: string
  guildRole?: GuildRole
}
```

---

## Guild Chat Integration

### Channel Filtering

The existing chat infrastructure already supports guild channel:

```typescript
const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']
```

**Changes needed:**

1. **Database:** Add `guild_id` column to `chat_messages`
2. **Send:** Validate sender is in guild before allowing guild chat
3. **Receive:** Filter guild messages by membership
4. **Broadcast:** Only send guild messages to guild members

```typescript
private async handleChatMessage(client: Client, payload: { channel: ChatChannel; content: string }) {
  // ... existing validation ...

  if (channel === 'guild') {
    if (!client.session.guildId) {
      this.sendError(client, 'You must be in a guild to use guild chat')
      return
    }

    // Save with guild_id
    const message = await saveGuildChatMessage(
      client.session.player.id,
      client.session.guildId,
      safeContent
    )

    // Broadcast only to guild members
    this.broadcastToGuild(client.session.guildId, 'chat_message', payloadToSend)
    return
  }

  // ... existing global/trade broadcast ...
}
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Real-time | WebSocket broadcast | Supabase Realtime | Already have WebSocket, adds complexity |
| Permissions | Enum + app checks | RBAC library | Overkill for 3 roles |
| Chat storage | Extend chat_messages | New guild_chat table | Unnecessary duplication |
| Member lookup | In-memory guildId | DB query per message | Performance |

---

## Implementation Notes

### Atomic Operations

Guild operations need similar patterns to trades:

```sql
-- Atomic guild creation (member_count starts at 1)
CREATE OR REPLACE FUNCTION create_guild(
  p_player_id UUID,
  p_name TEXT,
  p_tag TEXT
) RETURNS JSON AS $$
DECLARE
  v_guild_id UUID;
BEGIN
  -- Check player isn't already in a guild
  IF EXISTS (
    SELECT 1 FROM guild_members
    WHERE player_id = p_player_id AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already in a guild');
  END IF;

  -- Create guild
  INSERT INTO guilds (name, tag, leader_id)
  VALUES (p_name, p_tag, p_player_id)
  RETURNING id INTO v_guild_id;

  -- Add leader as member
  INSERT INTO guild_members (guild_id, player_id, role, status)
  VALUES (v_guild_id, p_player_id, 'leader', 'active');

  RETURN json_build_object('success', true, 'guild_id', v_guild_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Member Count Maintenance

Use triggers to maintain denormalized `member_count`:

```sql
CREATE OR REPLACE FUNCTION update_guild_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE guilds SET member_count = member_count + 1 WHERE id = NEW.guild_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE guilds SET member_count = member_count - 1 WHERE id = OLD.guild_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE guilds SET member_count = member_count + 1 WHERE id = NEW.guild_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE guilds SET member_count = member_count - 1 WHERE id = NEW.guild_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## Sources

- **Existing Codebase Analysis:**
  - `supabase/migrations/007_friends.sql` - Social table patterns, RLS policies
  - `supabase/migrations/009_trades.sql` - Complex atomic operations, SECURITY DEFINER
  - `supabase/migrations/018_week5_social.sql` - Block system, idempotent migrations
  - `apps/game-server/src/hub.ts` - WebSocket broadcast patterns
  - `apps/game-server/src/db.ts` - Query patterns, optimistic locking
  - `.planning/codebase/ARCHITECTURE.md` - System architecture reference

- **Confidence:** HIGH
  - All recommendations use patterns already proven in codebase
  - No external libraries required
  - No new infrastructure needed

---

*Stack research: 2026-01-18*
