# Guild System Architecture

**Project:** Pokemon Idle MMO - Guild System
**Researched:** 2026-01-18
**Confidence:** HIGH (based on existing codebase patterns)

## Executive Summary

This document defines the database schema, data flow patterns, and build order for implementing a guild system in the existing Pokemon Idle MMO architecture. The design follows established patterns from the friends system, trading system, and chat system already in the codebase.

---

## Database Schema

### Core Tables

#### `guilds` - Guild Registry

```sql
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,  -- 2-5 char abbreviation like [PKM]
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  leader_id UUID REFERENCES players(id) ON DELETE SET NULL NOT NULL,

  -- Settings
  is_public BOOLEAN DEFAULT true,  -- Can players request to join?
  min_level_requirement INT DEFAULT 1,

  -- Stats (denormalized for performance)
  member_count INT DEFAULT 1,
  total_contribution INT DEFAULT 0,  -- Lifetime guild points
  weekly_contribution INT DEFAULT 0, -- Resets weekly

  -- Constraints
  CONSTRAINT guild_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 30),
  CONSTRAINT guild_name_format CHECK (name ~ '^[a-zA-Z0-9_ ]+$'),
  CONSTRAINT guild_tag_length CHECK (char_length(tag) >= 2 AND char_length(tag) <= 5),
  CONSTRAINT guild_tag_format CHECK (tag ~ '^[A-Z0-9]+$')
);

CREATE INDEX idx_guilds_leader ON guilds(leader_id);
CREATE INDEX idx_guilds_name ON guilds(name);
CREATE INDEX idx_guilds_public ON guilds(is_public) WHERE is_public = true;
```

#### `guild_members` - Membership Junction

```sql
CREATE TYPE guild_role AS ENUM ('leader', 'officer', 'member');

CREATE TABLE guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  role guild_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Individual contribution tracking
  weekly_contribution INT DEFAULT 0,
  total_contribution INT DEFAULT 0,

  -- Constraints
  CONSTRAINT unique_guild_member UNIQUE (guild_id, player_id)
);

CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX idx_guild_members_player ON guild_members(player_id);
CREATE INDEX idx_guild_members_role ON guild_members(guild_id, role);
```

#### `guild_join_requests` - Pending Applications

```sql
CREATE TYPE join_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE guild_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status join_request_status DEFAULT 'pending' NOT NULL,
  message TEXT,  -- Optional application message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES players(id),

  -- Constraints
  CONSTRAINT unique_pending_request UNIQUE (guild_id, player_id)
);

CREATE INDEX idx_guild_requests_guild ON guild_join_requests(guild_id) WHERE status = 'pending';
CREATE INDEX idx_guild_requests_player ON guild_join_requests(player_id) WHERE status = 'pending';
```

#### `guild_invites` - Outgoing Invitations

```sql
CREATE TABLE guild_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',

  -- Constraints
  CONSTRAINT unique_guild_invite UNIQUE (guild_id, player_id)
);

CREATE INDEX idx_guild_invites_player ON guild_invites(player_id);
CREATE INDEX idx_guild_invites_expires ON guild_invites(expires_at);
```

### Storage Tables

#### `guild_bank` - Shared Item Storage

```sql
CREATE TABLE guild_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  quantity INT DEFAULT 0 CHECK (quantity >= 0),

  -- Audit trail
  last_deposited_by UUID REFERENCES players(id),
  last_deposited_at TIMESTAMPTZ,

  CONSTRAINT unique_guild_bank_item UNIQUE (guild_id, item_id)
);

CREATE INDEX idx_guild_bank_guild ON guild_bank(guild_id);
```

#### `guild_bank_log` - Transaction History

```sql
CREATE TYPE bank_action AS ENUM ('deposit', 'withdraw');

CREATE TABLE guild_bank_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL NOT NULL,
  action bank_action NOT NULL,
  item_id TEXT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guild_bank_log_guild ON guild_bank_log(guild_id);
CREATE INDEX idx_guild_bank_log_time ON guild_bank_log(created_at DESC);
```

### Activity Tables

#### `guild_quests` - Weekly Guild Challenges

```sql
CREATE TYPE quest_type AS ENUM ('catch', 'battle', 'evolve', 'level');
CREATE TYPE quest_status AS ENUM ('active', 'completed', 'expired');

CREATE TABLE guild_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  quest_type quest_type NOT NULL,
  target_count INT NOT NULL,  -- e.g., catch 100 Pokemon
  current_count INT DEFAULT 0,
  status quest_status DEFAULT 'active' NOT NULL,
  reward_points INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Optional filters
  target_species_id INT REFERENCES pokemon_species(id),  -- Specific species required
  target_type TEXT  -- e.g., 'fire' for catch fire-types
);

CREATE INDEX idx_guild_quests_guild ON guild_quests(guild_id);
CREATE INDEX idx_guild_quests_active ON guild_quests(guild_id) WHERE status = 'active';
```

#### `guild_quest_contributions` - Per-Member Progress

```sql
CREATE TABLE guild_quest_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES guild_quests(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  contribution INT DEFAULT 0,

  CONSTRAINT unique_quest_contribution UNIQUE (quest_id, player_id)
);

CREATE INDEX idx_quest_contributions_quest ON guild_quest_contributions(quest_id);
```

### Shop Tables

#### `guild_shop_items` - Purchasable Items

```sql
CREATE TABLE guild_shop_items (
  id TEXT PRIMARY KEY,  -- e.g., 'guild_pokeball_pack'
  name TEXT NOT NULL,
  description TEXT,
  item_id TEXT NOT NULL,  -- References inventory item to grant
  quantity INT NOT NULL DEFAULT 1,  -- How many of item_id
  guild_point_cost INT NOT NULL,
  required_guild_level INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
```

#### `guild_shop_purchases` - Purchase History

```sql
CREATE TABLE guild_shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  shop_item_id TEXT REFERENCES guild_shop_items(id) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guild_purchases_guild ON guild_shop_purchases(guild_id);
CREATE INDEX idx_guild_purchases_player ON guild_shop_purchases(player_id);
```

### Message Tables

#### `guild_messages` - Guild Chat History

```sql
CREATE TABLE guild_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT guild_message_length CHECK (char_length(content) <= 500)
);

CREATE INDEX idx_guild_messages_guild ON guild_messages(guild_id);
CREATE INDEX idx_guild_messages_time ON guild_messages(guild_id, created_at DESC);
```

---

## Row Level Security Policies

Following existing RLS patterns for player data isolation:

```sql
-- Guilds: Anyone can view public guilds, members can view their own
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public guilds are viewable"
  ON guilds FOR SELECT
  USING (is_public = true);

CREATE POLICY "Members can view own guild"
  ON guilds FOR SELECT
  USING (id IN (
    SELECT guild_id FROM guild_members
    WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  ));

CREATE POLICY "Leaders can update own guild"
  ON guilds FOR UPDATE
  USING (leader_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Guild Members: Members can view their guild's roster
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view guild roster"
  ON guild_members FOR SELECT
  USING (guild_id IN (
    SELECT guild_id FROM guild_members
    WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  ));

-- Guild Bank: Members can view, officers+ can modify
ALTER TABLE guild_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view guild bank"
  ON guild_bank FOR SELECT
  USING (guild_id IN (
    SELECT guild_id FROM guild_members
    WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  ));

-- Guild Messages: Members only
ALTER TABLE guild_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view guild messages"
  ON guild_messages FOR SELECT
  USING (guild_id IN (
    SELECT guild_id FROM guild_members
    WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  ));

CREATE POLICY "Members can post messages"
  ON guild_messages FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    AND guild_id IN (
      SELECT guild_id FROM guild_members
      WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    )
  );
```

---

## Database Functions

### `create_guild` - Atomic Guild Creation

```sql
CREATE OR REPLACE FUNCTION create_guild(
  p_player_id UUID,
  p_name TEXT,
  p_tag TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guild_id UUID;
BEGIN
  -- Check player isn't already in a guild
  IF EXISTS (SELECT 1 FROM guild_members WHERE player_id = p_player_id) THEN
    RAISE EXCEPTION 'Player is already in a guild';
  END IF;

  -- Create guild
  INSERT INTO guilds (name, tag, description, leader_id)
  VALUES (p_name, UPPER(p_tag), p_description, p_player_id)
  RETURNING id INTO v_guild_id;

  -- Add leader as member
  INSERT INTO guild_members (guild_id, player_id, role)
  VALUES (v_guild_id, p_player_id, 'leader');

  RETURN v_guild_id;
END;
$$;
```

### `join_guild` - Handle Join Requests

```sql
CREATE OR REPLACE FUNCTION process_join_request(
  p_request_id UUID,
  p_processor_id UUID,
  p_accept BOOLEAN
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_processor_role guild_role;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM guild_join_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Verify processor has permission (officer or leader)
  SELECT role INTO v_processor_role
  FROM guild_members
  WHERE guild_id = v_request.guild_id AND player_id = p_processor_id;

  IF v_processor_role IS NULL OR v_processor_role = 'member' THEN
    RETURN json_build_object('success', false, 'error', 'No permission to process requests');
  END IF;

  IF p_accept THEN
    -- Check player isn't already in a guild
    IF EXISTS (SELECT 1 FROM guild_members WHERE player_id = v_request.player_id) THEN
      UPDATE guild_join_requests SET status = 'declined', processed_at = NOW(), processed_by = p_processor_id
      WHERE id = p_request_id;
      RETURN json_build_object('success', false, 'error', 'Player is already in a guild');
    END IF;

    -- Add member
    INSERT INTO guild_members (guild_id, player_id)
    VALUES (v_request.guild_id, v_request.player_id);

    -- Update member count
    UPDATE guilds SET member_count = member_count + 1 WHERE id = v_request.guild_id;

    -- Update request
    UPDATE guild_join_requests SET status = 'accepted', processed_at = NOW(), processed_by = p_processor_id
    WHERE id = p_request_id;
  ELSE
    UPDATE guild_join_requests SET status = 'declined', processed_at = NOW(), processed_by = p_processor_id
    WHERE id = p_request_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
```

### `leave_guild` - Safe Guild Exit

```sql
CREATE OR REPLACE FUNCTION leave_guild(p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_member_count INT;
BEGIN
  -- Get member info
  SELECT gm.*, g.leader_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id
  FOR UPDATE;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not in a guild');
  END IF;

  -- Check if leader
  IF v_member.role = 'leader' THEN
    -- Count remaining members
    SELECT COUNT(*) INTO v_member_count FROM guild_members WHERE guild_id = v_member.guild_id;

    IF v_member_count > 1 THEN
      RETURN json_build_object('success', false, 'error', 'Leader must transfer leadership or disband guild');
    END IF;

    -- Last member - delete guild
    DELETE FROM guilds WHERE id = v_member.guild_id;
    RETURN json_build_object('success', true, 'guild_disbanded', true);
  END IF;

  -- Remove member
  DELETE FROM guild_members WHERE player_id = p_player_id;

  -- Update member count
  UPDATE guilds SET member_count = member_count - 1 WHERE id = v_member.guild_id;

  RETURN json_build_object('success', true);
END;
$$;
```

---

## Player Table Modification

Add guild reference to players table for fast lookups:

```sql
-- Add guild_id to players for quick guild membership check
ALTER TABLE players ADD COLUMN guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL;

CREATE INDEX idx_players_guild ON players(guild_id) WHERE guild_id IS NOT NULL;

-- Trigger to keep guild_id in sync with guild_members
CREATE OR REPLACE FUNCTION sync_player_guild_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE players SET guild_id = NEW.guild_id WHERE id = NEW.player_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE players SET guild_id = NULL WHERE id = OLD.player_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_player_guild
AFTER INSERT OR DELETE ON guild_members
FOR EACH ROW EXECUTE FUNCTION sync_player_guild_id();
```

---

## WebSocket Integration

### New Message Types

Following the existing `{ type: string, payload: unknown }` pattern:

**Client to Server:**
```typescript
// Guild Management
'create_guild'         -> { name: string, tag: string, description?: string }
'get_guild'            -> { guild_id?: string }  // Own guild if omitted
'update_guild'         -> { description?: string, is_public?: boolean, min_level?: number }
'disband_guild'        -> { confirmation: string }  // Requires typing guild name

// Membership
'send_guild_invite'    -> { player_id: string }
'accept_guild_invite'  -> { invite_id: string }
'decline_guild_invite' -> { invite_id: string }
'request_join_guild'   -> { guild_id: string, message?: string }
'cancel_join_request'  -> { request_id: string }
'process_join_request' -> { request_id: string, accept: boolean }
'leave_guild'          -> {}
'kick_member'          -> { player_id: string }
'promote_member'       -> { player_id: string, role: 'officer' | 'member' }
'transfer_leadership'  -> { player_id: string }

// Guild Bank
'deposit_to_bank'      -> { item_id: string, quantity: number }
'withdraw_from_bank'   -> { item_id: string, quantity: number }
'get_bank_log'         -> { limit?: number }

// Guild Quests
'get_guild_quests'     -> {}
'contribute_to_quest'  -> { quest_id: string }  // Usually automatic via game events

// Guild Shop
'get_guild_shop'       -> {}
'buy_guild_item'       -> { shop_item_id: string }

// Guild Chat
'send_guild_message'   -> { content: string }
'get_guild_messages'   -> { limit?: number, before?: string }

// Guild Search
'search_guilds'        -> { query?: string, public_only?: boolean }
```

**Server to Client:**
```typescript
// State Updates
'guild_data'           -> { guild: Guild, members: GuildMember[], myRole: GuildRole }
'guild_updated'        -> { guild: Partial<Guild> }
'guild_disbanded'      -> {}

// Membership Events
'guild_invite_received'   -> { invite: GuildInvite }
'guild_invites'           -> { invites: GuildInvite[] }
'guild_join_requests'     -> { requests: JoinRequest[] }
'guild_member_joined'     -> { member: GuildMember }
'guild_member_left'       -> { player_id: string }
'guild_member_promoted'   -> { player_id: string, new_role: GuildRole }
'guild_kicked'            -> { reason?: string }

// Bank Events
'guild_bank_data'         -> { items: BankItem[] }
'guild_bank_updated'      -> { item_id: string, quantity: number }
'guild_bank_log'          -> { log: BankLogEntry[] }

// Quest Events
'guild_quests_data'       -> { quests: GuildQuest[] }
'guild_quest_progress'    -> { quest_id: string, current: number, target: number }
'guild_quest_completed'   -> { quest_id: string, reward: number }

// Shop Events
'guild_shop_data'         -> { items: ShopItem[], guild_points: number }
'guild_shop_purchase'     -> { success: boolean, item_id: string, error?: string }

// Chat Events
'guild_message'           -> { message: GuildMessage }
'guild_message_history'   -> { messages: GuildMessage[] }

// Search Results
'guild_search_results'    -> { guilds: GuildPreview[] }
```

### PlayerSession Extension

Add guild state to the existing `PlayerSession` interface:

```typescript
// In apps/game-server/src/types.ts
export interface PlayerSession {
  // ... existing fields ...

  // Guild state
  guild?: {
    id: string
    name: string
    tag: string
    role: 'leader' | 'officer' | 'member'
  }
}
```

### GameStore Extension

Add guild state to the frontend Zustand store:

```typescript
// In apps/web/src/stores/gameStore.ts
interface GameStore {
  // ... existing fields ...

  // Guild state
  guild: Guild | null
  guildMembers: GuildMember[]
  myGuildRole: GuildRole | null
  guildInvites: GuildInvite[]
  guildJoinRequests: JoinRequest[]
  guildBank: BankItem[]
  guildQuests: GuildQuest[]
  guildShop: ShopItem[]
  guildPoints: number

  // Actions
  setGuild: (guild: Guild | null) => void
  setGuildMembers: (members: GuildMember[]) => void
  setGuildRole: (role: GuildRole | null) => void
  // ... etc
}
```

---

## Data Flow Patterns

### Guild Chat Flow (Following existing chat pattern)

1. Player sends `send_guild_message` via WebSocket
2. Server validates player is in a guild and message content
3. Server saves message to `guild_messages` table
4. Server broadcasts `guild_message` to all online guild members
5. Frontend updates Zustand store and renders message in guild chat tab

```typescript
// In hub.ts (following existing handleChatMessage pattern)
private async handleGuildMessage(client: Client, payload: { content: string }) {
  if (!client.session?.guild) {
    this.sendError(client, 'Not in a guild')
    return
  }

  const content = (payload.content || '').trim().slice(0, 500)
  if (!content) {
    this.sendError(client, 'Message cannot be empty')
    return
  }

  // Save to database
  const message = await saveGuildMessage(client.session.guild.id, client.session.player.id, content)

  // Broadcast to all online guild members
  this.broadcastToGuild(client.session.guild.id, 'guild_message', {
    ...message,
    player_name: client.session.player.username
  })
}

// New method for guild-scoped broadcasts
private broadcastToGuild(guildId: string, type: string, payload: unknown) {
  for (const [, otherClient] of this.clients) {
    if (otherClient.session?.guild?.id === guildId) {
      this.send(otherClient, type, payload)
    }
  }
}
```

### Quest Contribution Flow (Automatic on game events)

1. Player catches Pokemon / wins battle / levels up
2. Server checks if player has active guild quests matching the action
3. Server increments `guild_quest_contributions` and `guild_quests.current_count`
4. Server broadcasts progress update to online guild members
5. If quest completed, award points and broadcast completion

```typescript
// In processTick (after successful catch)
if (result.encounter?.catch_result?.success && client.session.guild) {
  await this.processGuildQuestContribution(
    client.session.guild.id,
    client.session.player.id,
    'catch',
    result.encounter.wild_pokemon
  )
}
```

### Bank Transaction Flow

1. Player sends `deposit_to_bank` or `withdraw_from_bank`
2. Server validates:
   - Player is in a guild
   - Player has permission (deposit: all members, withdraw: officers+)
   - Player has item (for deposit) or bank has item (for withdraw)
3. Server uses atomic transaction to move item
4. Server logs transaction to `guild_bank_log`
5. Server broadcasts `guild_bank_updated` to online guild members

---

## Integration Points with Existing Systems

### Chat System Integration

The existing chat system already has a `guild` channel defined in `CHAT_CHANNELS`:

```typescript
const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']
```

Guild messages can either:
1. **Use existing chat system:** Route guild messages through `chat_messages` with `channel = 'guild'` filtered by guild membership
2. **Use dedicated system (recommended):** Use separate `guild_messages` table for better isolation and RLS

**Recommendation:** Use dedicated `guild_messages` table because:
- RLS is simpler (guild membership check only)
- No risk of leaking guild messages to non-members
- Can have different retention policies
- Easier to query guild-specific history

### Friends System Integration

Guild members are implicitly visible to each other. Consider:
- Show guild tag next to names in friends list
- Allow guild-mates to trade even if not friends (optional)
- Show online guild members count in guild panel

### Trade System Integration

- Guild bank uses existing inventory item IDs
- Depositing items uses similar pattern to `useInventoryItem`
- Could add guild-exclusive trade items (future feature)

### Leaderboard Integration

- Add guild leaderboards (total catches, highest level, etc.)
- Individual contributions tracked in `guild_members`
- Weekly reset of `weekly_contribution` field

---

## Build Order (Dependency Graph)

```
Phase 1: Core Schema (Foundation)
  |
  +-> guilds table
  +-> guild_members table
  +-> player.guild_id column + trigger
  |
  v
Phase 2: Membership Flow
  |
  +-> guild_join_requests table
  +-> guild_invites table
  +-> Database functions (create_guild, join_guild, leave_guild)
  +-> WebSocket handlers for membership
  +-> Frontend guild panel (create, join, leave)
  |
  v
Phase 3: Guild Chat
  |
  +-> guild_messages table
  +-> WebSocket handlers for chat
  +-> Frontend chat tab integration
  |
  v
Phase 4: Guild Bank
  |
  +-> guild_bank table
  +-> guild_bank_log table
  +-> Permission checks (officer+)
  +-> WebSocket handlers
  +-> Frontend bank UI
  |
  v
Phase 5: Guild Quests
  |
  +-> guild_quests table
  +-> guild_quest_contributions table
  +-> Quest generation logic
  +-> Automatic contribution tracking
  +-> WebSocket handlers
  +-> Frontend quest UI
  |
  v
Phase 6: Guild Shop
  |
  +-> guild_shop_items table (seed data)
  +-> guild_shop_purchases table
  +-> Guild points tracking
  +-> WebSocket handlers
  +-> Frontend shop UI
```

### Why This Order?

1. **Core Schema First:** Everything depends on `guilds` and `guild_members` tables
2. **Membership Before Features:** Can't use guild features without being in a guild
3. **Chat Before Bank:** Chat is simpler, validates the broadcast pattern
4. **Bank Before Quests:** Quests may reward items deposited to bank
5. **Quests Before Shop:** Quests earn guild points spent in shop
6. **Shop Last:** Depends on guild points from quests

---

## Anti-Patterns to Avoid

### 1. Global Broadcasts for Guild Events

**Wrong:** Broadcasting to all clients then filtering on frontend
```typescript
// BAD: Wastes bandwidth, potential info leak
this.broadcast('guild_message', { guild_id, content })
```

**Right:** Broadcast only to guild members
```typescript
// GOOD: Targeted broadcast
this.broadcastToGuild(guildId, 'guild_message', { content })
```

### 2. Checking Membership on Every Message

**Wrong:** Query database for membership on every guild action
```typescript
// BAD: N+1 queries
const member = await getGuildMember(playerId)
if (!member) return
```

**Right:** Cache guild info in PlayerSession on connect/change
```typescript
// GOOD: O(1) check
if (!client.session?.guild) return
```

### 3. Optimistic Updates Without Verification

**Wrong:** Updating frontend before server confirmation
```typescript
// BAD: Can desync if server rejects
dispatch(addGuildMember(player))
socket.send({ type: 'add_member', payload: { player_id } })
```

**Right:** Wait for server confirmation
```typescript
// GOOD: Server is source of truth
socket.send({ type: 'add_member', payload: { player_id } })
// Server broadcasts 'guild_member_joined' to all members
```

### 4. Inline Permission Checks

**Wrong:** Duplicating role checks everywhere
```typescript
// BAD: Easy to miss checks
if (member.role !== 'leader' && member.role !== 'officer') {
  return sendError('No permission')
}
```

**Right:** Centralized permission helper
```typescript
// GOOD: Single source of truth
function canManageMembers(role: GuildRole): boolean {
  return role === 'leader' || role === 'officer'
}
```

---

## Scalability Considerations

| Concern | At 100 guilds | At 10K guilds | At 100K guilds |
|---------|---------------|---------------|----------------|
| Guild search | Simple LIKE query | Add full-text search index | Consider external search (Algolia) |
| Member count updates | Direct UPDATE | Still fine (atomic) | Still fine (atomic) |
| Quest progress | Direct UPDATE | Batch updates | Consider event sourcing |
| Bank transactions | Direct queries | Add optimistic locking | Distributed locks if multi-server |
| Chat history | Direct queries | Add pagination | Consider archiving old messages |

### Multi-Server Considerations

Current architecture assumes single game server. If scaling to multiple servers:

1. **Guild broadcasts:** Need pub/sub (Redis) instead of in-memory iteration
2. **Session cache:** PlayerSession.guild must sync across servers
3. **Bank transactions:** Need distributed locking
4. **Quest progress:** Consider event queue (Kafka/RabbitMQ)

---

## Sources

- Existing codebase patterns (HIGH confidence):
  - `apps/game-server/src/hub.ts` - WebSocket message handling patterns
  - `apps/game-server/src/db.ts` - Database query patterns
  - `supabase/migrations/007_friends.sql` - Friends system schema pattern
  - `supabase/migrations/009_trades.sql` - Trade system with RLS
  - `apps/web/src/stores/gameStore.ts` - Zustand store patterns

- Database design based on:
  - Existing RLS policy patterns in migrations
  - Foreign key relationships matching existing tables
  - Index patterns from `021_performance_indexes.sql`

---

*Architecture research: 2026-01-18*
