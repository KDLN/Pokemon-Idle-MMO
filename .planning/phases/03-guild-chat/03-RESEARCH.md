# Phase 3: Guild Chat - Research

**Researched:** 2026-01-18
**Domain:** WebSocket real-time chat, PostgreSQL message storage, RLS-based access control
**Confidence:** HIGH

## Summary

The existing chat system is well-established with global, trade, guild, system, and whisper channels. The **guild channel already exists in the frontend UI** (ChatTabs.tsx) but has no backend implementation. The chat system stores messages in `chat_messages` table and broadcasts via WebSocket. Guild membership and role information is already tracked in sessions (`client.session.guild`).

The key finding is that **most infrastructure already exists**:
- Guild channel tab is already in the UI
- `broadcastToGuild()` method exists and works correctly
- `isPlayerOnline()` helper is available
- Session tracks guild info including role
- ChatMessage component already handles guild channel styling (purple)

**Primary recommendation:** Create a dedicated `guild_messages` table with RLS for isolation, add a `guild_chat_message` handler that uses `broadcastToGuild()`, and extend the frontend chat payload to include role badges.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | existing | WebSocket server | Already used for all real-time features |
| Supabase | existing | PostgreSQL + RLS | Already used for all data storage |
| Zustand | existing | Frontend state | Already manages chat state |

### No Additional Libraries Needed

This phase uses entirely existing infrastructure. No new dependencies required.

## Architecture Patterns

### Existing Chat Flow
```
Frontend                      Backend                       Database
=========                     =======                       ========
sendChatMessage()  ------>   handleChatMessage()  ------>  saveChatMessage()
     ^                              |                            |
     |                              v                            |
handleChatMessage  <------   broadcast()           <------  chat_messages
```

### Guild Chat Flow (To Implement)
```
Frontend                      Backend                         Database
=========                     =======                         ========
sendGuildChatMessage() --->  handleGuildChatMessage()  --->  saveGuildChatMessage()
     ^                              |                              |
     |                              v                              |
handleGuildChatMessage <---  broadcastToGuild()      <---  guild_messages
                                    |
                                    v
                             Validate membership
                             Attach role badge
```

### Pattern 1: Guild Message Handler
**What:** Separate handler for guild chat (not reusing handleChatMessage)
**When to use:** Guild messages need membership validation and role attachment
**Example:**
```typescript
// Source: Derived from existing handleChatMessage pattern in hub.ts:633-661
private async handleGuildChatMessage(client: Client, payload: { content?: string }) {
  if (!client.session) return

  // Validate guild membership (already in session)
  if (!client.session.guild) {
    this.sendError(client, 'You are not in a guild')
    return
  }

  const trimmedContent = (payload.content ?? '').trim()
  if (!trimmedContent) {
    this.sendError(client, 'Message cannot be empty')
    return
  }

  const safeContent = trimmedContent.slice(0, MAX_CHAT_LENGTH)

  // Save to guild_messages table
  const message = await saveGuildChatMessage(
    client.session.guild.id,
    client.session.player.id,
    safeContent
  )

  if (!message) {
    this.sendError(client, 'Unable to send message')
    return
  }

  // Broadcast only to guild members
  this.broadcastToGuild(client.session.guild.id, 'guild_chat_message', {
    ...message,
    player_name: client.session.player.username,
    role: client.session.guild.role // Include role for badge display
  })
}
```

### Pattern 2: broadcastToGuild() (Already Exists)
**What:** Broadcasts messages only to connected clients in a specific guild
**When to use:** Any guild-specific real-time updates
**Example:**
```typescript
// Source: Existing in hub.ts:671-677
private broadcastToGuild(guildId: string, type: string, payload: unknown) {
  for (const [, client] of this.clients) {
    if (client.session?.guild?.id === guildId) {
      this.send(client, type, payload)
    }
  }
}
```

### Pattern 3: Session Guild Info (Already Exists)
**What:** Guild membership and role cached in PlayerSession
**When to use:** Check membership and role without DB query
**Example:**
```typescript
// Source: types.ts:134-135 and hub.ts:362-375
interface PlayerSession {
  // ... other fields
  guild?: PlayerGuildInfo  // { id, name, tag, role }
}

// Usage in handlers:
if (!client.session.guild) {
  this.sendError(client, 'You are not in a guild')
  return
}
const role = client.session.guild.role // 'leader' | 'officer' | 'member'
```

### Anti-Patterns to Avoid
- **Using existing chat_messages table:** Guild chat needs separate RLS policies - don't try to filter with channel='guild'
- **Broadcasting to all clients:** Always use `broadcastToGuild()` not `broadcast()` for guild messages
- **DB queries for membership check:** Use `client.session.guild` which is kept in sync

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Online status check | Custom tracking | `this.isPlayerOnline(playerId)` | Already implemented, tested, handles edge cases |
| Guild membership check | DB query on each message | `client.session.guild` | Session is synced on join/leave/kick events |
| Targeted broadcast | Filter in broadcast | `this.broadcastToGuild()` | Already implemented and used throughout codebase |
| Message validation | Custom validators | Existing pattern from handleChatMessage | Consistent with other chat handling |

**Key insight:** The guild system (Phases 1-2) already established patterns for session management and targeted broadcasts. Guild chat should follow these patterns exactly.

## Common Pitfalls

### Pitfall 1: Using chat_messages for guild chat
**What goes wrong:** RLS policies become complex; non-members could potentially see guild messages
**Why it happens:** Seems simpler to add channel='guild' filter
**How to avoid:** Create dedicated `guild_messages` table with guild_id column and RLS based on guild membership
**Warning signs:** Trying to modify existing chat_messages RLS policies

### Pitfall 2: Not handling guild leave during active chat
**What goes wrong:** Player sends guild message after being kicked but before session updates
**Why it happens:** Race condition between kick action and session update
**How to avoid:** Always verify `client.session.guild` is set AND matches the guild_id being messaged
**Warning signs:** Messages appearing from non-members

### Pitfall 3: Missing role in chat payload
**What goes wrong:** Frontend can't display role badges
**Why it happens:** Forgetting to include role in broadcast payload
**How to avoid:** Always include `role: client.session.guild.role` in guild_chat_message payloads
**Warning signs:** Badge components rendering without role data

### Pitfall 4: Loading all guild messages on history request
**What goes wrong:** Performance issues for active guilds
**Why it happens:** No limit on history query
**How to avoid:** Limit to last 100 messages (as per requirements), use pagination if needed
**Warning signs:** Slow load times when joining guild channel

### Pitfall 5: Not syncing session role on promotion/demotion
**What goes wrong:** Chat shows old role after role change
**Why it happens:** Session update logic doesn't cover all role change paths
**How to avoid:** Existing role change handlers already update `client.session.guild.role` - verify this path works
**Warning signs:** Role badge doesn't update until reconnect

## Code Examples

### Database: guild_messages Table
```sql
-- Source: Pattern from supabase/migrations/004_chat_and_progression.sql

CREATE TABLE IF NOT EXISTS guild_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying (last 100 messages per guild)
CREATE INDEX idx_guild_messages_guild_time ON guild_messages(guild_id, created_at DESC);
CREATE INDEX idx_guild_messages_player ON guild_messages(player_id);

-- Enable Row Level Security
ALTER TABLE guild_messages ENABLE ROW LEVEL SECURITY;

-- Members can view their own guild's messages
CREATE POLICY "guild_messages_select_policy"
  ON guild_messages FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Members can insert messages to their own guild
CREATE POLICY "guild_messages_insert_policy"
  ON guild_messages FOR INSERT
  WITH CHECK (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
    AND
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );
```

### Backend: db.ts Functions
```typescript
// Source: Pattern from db.ts:648-714

interface GuildChatMessageEntry {
  id: string
  guild_id: string
  player_id: string
  player_name: string
  role: GuildRole
  content: string
  created_at: string
}

export async function getGuildChatHistory(
  guildId: string,
  limit = 100
): Promise<GuildChatMessageEntry[]> {
  const { data, error } = await supabase
    .from('guild_messages')
    .select(`
      id,
      guild_id,
      player_id,
      content,
      created_at,
      player:players(username),
      member:guild_members!inner(role)
    `)
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to load guild chat history:', error)
    return []
  }

  return (data || []).map(row => ({
    id: row.id,
    guild_id: row.guild_id,
    player_id: row.player_id,
    player_name: extractUsername(row.player),
    role: row.member?.role || 'member',
    content: row.content,
    created_at: row.created_at,
  })).reverse() // Return in chronological order
}

export async function saveGuildChatMessage(
  guildId: string,
  playerId: string,
  content: string
): Promise<GuildChatMessageEntry | null> {
  const { data, error } = await supabase
    .from('guild_messages')
    .insert({
      guild_id: guildId,
      player_id: playerId,
      content,
    })
    .select(`
      id,
      guild_id,
      player_id,
      content,
      created_at,
      player:players(username),
      member:guild_members!inner(role)
    `)
    .single()

  if (error || !data) {
    console.error('Failed to save guild chat message:', error)
    return null
  }

  return {
    id: data.id,
    guild_id: data.guild_id,
    player_id: data.player_id,
    player_name: extractUsername(data.player),
    role: data.member?.role || 'member',
    content: data.content,
    created_at: data.created_at,
  }
}
```

### Frontend: Chat Payload Type Extension
```typescript
// Source: Pattern from apps/web/src/types/chat.ts

// Extend ChatMessageData for guild messages with role
export interface GuildChatMessageData extends ChatMessageData {
  role?: 'leader' | 'officer' | 'member'
  guildId?: string
}
```

### Frontend: Role Badge Component
```typescript
// Source: New component following existing styling patterns

interface RoleBadgeProps {
  role: 'leader' | 'officer' | 'member'
}

const ROLE_CONFIG = {
  leader: { label: 'Leader', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  officer: { label: 'Officer', color: 'text-blue-400', bg: 'bg-blue-400/20' },
  member: { label: '', color: '', bg: '' }, // No badge for regular members
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]
  if (!config.label) return null

  return (
    <span className={`text-[10px] px-1 rounded ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  )
}
```

### WebSocket Message Types
```typescript
// Client -> Server
{ type: 'guild_chat_message', payload: { content: string } }
{ type: 'get_guild_chat_history', payload: {} }

// Server -> Client
{ type: 'guild_chat_message', payload: GuildChatMessageEntry }
{ type: 'guild_chat_history', payload: { messages: GuildChatMessageEntry[] } }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single chat table with channel filter | Dedicated tables per privacy level | Phase 1-2 design decision | Better RLS isolation |
| Poll for new messages | WebSocket push via broadcastToGuild | Already implemented | Real-time updates |

**Already current:**
- Session-based guild membership (no repeated DB lookups)
- Targeted broadcasts with `broadcastToGuild()`
- Online status via `isPlayerOnline()`

## Open Questions

None - all research areas have been resolved:

1. **How to determine guild membership?** RESOLVED - Use `client.session.guild`
2. **How to broadcast to guild only?** RESOLVED - Use `broadcastToGuild()`
3. **How to display role badges?** RESOLVED - Include role in payload, create RoleBadge component
4. **Message storage approach?** RESOLVED - Dedicated `guild_messages` table with RLS

## Sources

### Primary (HIGH confidence)
- `apps/game-server/src/hub.ts` - handleChatMessage (633-661), broadcastToGuild (671-677), isPlayerOnline (1514-1521)
- `apps/game-server/src/types.ts` - PlayerSession with guild info (119-136)
- `apps/game-server/src/db.ts` - saveChatMessage, getRecentChatMessages patterns (648-714)
- `supabase/migrations/004_chat_and_progression.sql` - chat_messages table structure
- `supabase/migrations/022_guilds.sql` - guild_members table and RLS patterns
- `apps/web/src/components/game/social/ChatTabs.tsx` - Guild channel already exists in UI
- `apps/web/src/components/game/social/ChatMessage.tsx` - Message rendering pattern
- `apps/web/src/lib/ws/gameSocket.ts` - WebSocket message handlers
- `packages/shared/src/types/guild.ts` - GuildRole, GuildMember types

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using entirely existing infrastructure
- Architecture: HIGH - Patterns established in Phases 1-2 and existing chat system
- Pitfalls: HIGH - Based on direct code analysis of existing implementations

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (stable - no external dependencies)

---

## Key Implementation Insights

1. **Guild channel tab already exists** - ChatTabs.tsx line 14 already has `{ id: 'guild', label: 'Guild', icon: '...' }`

2. **ChatSidebar prevents sending on certain channels** - Line 104-108 blocks sending on whisper channel, will need similar logic or modification for guild

3. **Session guild role is kept in sync** - Hub.ts updates `client.session.guild.role` on promote/demote (lines 3210, 3278)

4. **broadcastToGuild is proven** - Already used for member_joined, member_left, role_changed events

5. **Message format consistency** - Follow existing ChatPayload structure: `{ id, player_id, player_name, channel, content, created_at }`
