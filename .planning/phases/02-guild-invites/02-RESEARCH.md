# Phase 2: Guild Invites - Research

**Researched:** 2026-01-18
**Domain:** Guild invite system, WebSocket notifications, PostgreSQL RLS
**Confidence:** HIGH

## Summary

This research covers how to implement a guild invite system building on the existing Phase 1 guild foundation. The codebase already has proven patterns from friend requests, trade requests, and guild membership that directly apply to guild invites.

The invite system requires: (1) a new `guild_invites` table with RLS policies, (2) SECURITY DEFINER functions for send/accept/decline operations, (3) WebSocket handlers following existing patterns, and (4) modifications to `join_guild` to respect join_mode settings.

**Primary recommendation:** Follow the friend request pattern from `007_friends.sql` and `hub.ts` handlers, adapting for guild context with role-based permission checks.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 15+ | Database with RLS | Already in use via Supabase |
| @supabase/supabase-js | 2.x | Database client | Already configured in db.ts |
| ws | 8.x | WebSocket server | Already configured in hub.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | 5.x | JWT validation | Already used for auth |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database-driven expiration | Cron job cleanup | Database approach simpler, already checking on query |

**Installation:**
No new packages needed - uses existing stack.

## Architecture Patterns

### Recommended Table Structure
```sql
-- Guild Invites Table (follows friends table pattern from 007_friends.sql)
CREATE TABLE guild_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',

  -- Prevent duplicate invites to same player from same guild
  CONSTRAINT unique_guild_invite UNIQUE (guild_id, player_id),
  -- Cannot invite yourself
  CONSTRAINT no_self_invite CHECK (player_id != invited_by)
);
```

### Pattern 1: SECURITY DEFINER Function for Invite Send
**What:** Encapsulates all validation and mutation logic in a single atomic function
**When to use:** Always for mutations that require role checks and multi-table updates
**Example:**
```sql
-- Source: Pattern from 022_guilds.sql create_guild, join_guild functions
CREATE OR REPLACE FUNCTION send_guild_invite(
  p_actor_id UUID,
  p_target_player_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor RECORD;
  v_guild RECORD;
  v_target RECORD;
  v_invite_id UUID;
BEGIN
  -- Get actor's guild membership with role
  SELECT gm.*, g.id as guild_id, g.name, g.join_mode, g.member_count, g.max_members
  INTO v_actor
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_actor_id
  FOR UPDATE OF gm;

  IF v_actor IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not in a guild');
  END IF;

  -- Only leader or officer can invite
  IF v_actor.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can send invites');
  END IF;

  -- Check join_mode allows invites
  IF v_actor.join_mode = 'closed' THEN
    RETURN json_build_object('success', false, 'error', 'Guild is closed to new members');
  END IF;

  -- Check guild not full
  IF v_actor.member_count >= v_actor.max_members THEN
    RETURN json_build_object('success', false, 'error', 'Guild is full');
  END IF;

  -- Check target player exists and is not in a guild
  SELECT p.id, p.guild_id, p.username INTO v_target
  FROM players p WHERE p.id = p_target_player_id;

  IF v_target IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player not found');
  END IF;

  IF v_target.guild_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player is already in a guild');
  END IF;

  -- Check not already invited (constraint will catch, but give nicer error)
  IF EXISTS (
    SELECT 1 FROM guild_invites
    WHERE guild_id = v_actor.guild_id AND player_id = p_target_player_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Player already has a pending invite');
  END IF;

  -- Create invite
  INSERT INTO guild_invites (guild_id, player_id, invited_by)
  VALUES (v_actor.guild_id, p_target_player_id, p_actor_id)
  RETURNING id INTO v_invite_id;

  RETURN json_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'guild_name', v_actor.name
  );
END;
$$;
```

### Pattern 2: WebSocket Handler Following Friend Request Pattern
**What:** Send notification to target player if online, update sender
**When to use:** For all invite-related actions
**Example:**
```typescript
// Source: Pattern from hub.ts handleSendFriendRequest
private async handleSendGuildInvite(client: Client, payload: { player_id: string }) {
  if (!client.session) return

  const targetPlayerId = payload?.player_id
  if (!targetPlayerId || typeof targetPlayerId !== 'string') {
    this.sendError(client, 'Player ID is required')
    return
  }

  // Check if blocked (reuse existing pattern)
  const blocked = await isPlayerBlocked(client.session.player.id, targetPlayerId)
  if (blocked) {
    this.sendError(client, 'Cannot send invite to this player')
    return
  }

  const result = await sendGuildInvite(client.session.player.id, targetPlayerId)

  if (!result.success) {
    this.send(client, 'guild_invite_error', { error: result.error })
    return
  }

  // Notify sender
  this.send(client, 'guild_invite_sent', { success: true, player_id: targetPlayerId })

  // Notify target if online (pattern from friend_request_received)
  const targetClient = this.getClientByPlayerId(targetPlayerId)
  if (targetClient) {
    this.send(targetClient, 'guild_invite_received', {
      invite_id: result.invite_id,
      guild_id: client.session.guild!.id,
      guild_name: client.session.guild!.name,
      guild_tag: client.session.guild!.tag,
      invited_by_id: client.session.player.id,
      invited_by_username: client.session.player.username,
      created_at: new Date().toISOString()
    })
  }
}
```

### Pattern 3: Invite Acceptance Modifies join_guild
**What:** Accept invite calls modified join_guild that allows invite-based join for invite_only guilds
**When to use:** When accepting an invite
**Example:**
```sql
-- Modify join_guild to accept optional invite parameter
CREATE OR REPLACE FUNCTION join_guild(
  p_player_id UUID,
  p_guild_id UUID,
  p_invite_id UUID DEFAULT NULL  -- New optional parameter
) RETURNS JSON
-- ... existing checks ...
-- Add new check:
IF v_guild.join_mode = 'invite_only' THEN
  IF p_invite_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Guild requires an invite to join');
  END IF;
  -- Verify invite exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM guild_invites
    WHERE id = p_invite_id
    AND guild_id = p_guild_id
    AND player_id = p_player_id
    AND expires_at > NOW()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  -- Delete the used invite
  DELETE FROM guild_invites WHERE id = p_invite_id;
END IF;
-- ... rest of join logic ...
```

### Anti-Patterns to Avoid
- **Direct table inserts:** Never INSERT directly into guild_invites from client - always use SECURITY DEFINER function
- **Checking role in handler:** Role validation belongs in the database function, not the WebSocket handler
- **Forgetting block check:** Always check `isPlayerBlocked` before sending invites (matches friend request pattern)
- **Polling for invites:** Push notifications on connect and real-time, don't poll

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expiration cleanup | Cron job to delete | WHERE expires_at > NOW() filter | Simpler, no background job needed |
| Duplicate invite prevention | App-level check then insert | UNIQUE constraint + nice error | Race condition proof |
| Role permission check | If-else in handler | Database function validation | Atomic, can't bypass |
| Real-time notification | Polling endpoint | getClientByPlayerId() push | Already exists, pattern proven |
| Block system integration | Reimplementing | isPlayerBlocked() | Already handles bidirectional |

**Key insight:** The codebase already solved similar problems with friend requests and trades. The invite system is structurally identical - use the same patterns.

## Common Pitfalls

### Pitfall 1: Invitation Spam and Harassment
**What goes wrong:** Guilds can repeatedly invite the same player, used for harassment
**Why it happens:** No cooldown, no per-player rate limiting
**How to avoid:**
1. UNIQUE constraint prevents active duplicate invites
2. Integrate with block system (already exists)
3. 7-day expiration naturally limits frequency
4. Consider adding `last_declined_at` column for cooldown after decline
**Warning signs:** Players complaining, support tickets about spam

### Pitfall 2: Race Condition on Invite Accept
**What goes wrong:** Two players accept same invite simultaneously, or accept after guild fills
**Why it happens:** Check then act pattern without locking
**How to avoid:**
1. Use FOR UPDATE in accept function
2. Check member_count again before adding
3. Delete invite atomically with join
**Warning signs:** Guilds exceeding max_members, duplicate members

### Pitfall 3: Orphaned Invites After Guild Deletion
**What goes wrong:** Invites remain after guild is deleted
**Why it happens:** Missing ON DELETE CASCADE
**How to avoid:** Use `REFERENCES guilds(id) ON DELETE CASCADE`
**Warning signs:** FK violations, ghost invites in player lists

### Pitfall 4: Stale Session After Accepting Invite
**What goes wrong:** Player accepts invite but session.guild is null until reconnect
**Why it happens:** Forgot to update session in handler
**How to avoid:** Match join_guild handler pattern - update session.guild after successful accept
**Warning signs:** Player can't use guild features until refresh

### Pitfall 5: Join Mode Not Enforced
**What goes wrong:** Players join invite_only guilds without invite
**Why it happens:** Original join_guild function only checks for 'open'
**How to avoid:** Modify join_guild to require valid invite when join_mode = 'invite_only'
**Warning signs:** Guild privacy expectations violated

## Code Examples

Verified patterns from existing codebase:

### Database Function Result Pattern
```typescript
// Source: db.ts createGuild, joinGuild, etc.
export async function sendGuildInvite(
  actorId: string,
  targetPlayerId: string
): Promise<{ success: boolean; invite_id?: string; guild_name?: string; error?: string }> {
  const { data, error } = await supabase.rpc('send_guild_invite', {
    p_actor_id: actorId,
    p_target_player_id: targetPlayerId
  })

  if (error) {
    console.error('Error sending guild invite:', error)
    return { success: false, error: 'Database error' }
  }

  return data as { success: boolean; invite_id?: string; guild_name?: string; error?: string }
}
```

### Fetching Pending Invites Pattern
```typescript
// Source: Pattern from getIncomingFriendRequests in db.ts
export async function getIncomingGuildInvites(playerId: string): Promise<GuildInvite[]> {
  const { data, error } = await supabase
    .from('guild_invites')
    .select(`
      id,
      guild_id,
      invited_by,
      created_at,
      expires_at,
      guilds!inner (
        name,
        tag,
        member_count,
        max_members
      ),
      inviter:players!guild_invites_invited_by_fkey(username)
    `)
    .eq('player_id', playerId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get guild invites:', error)
    return []
  }

  // Transform to flatten joins (same pattern as friends)
  return (data || []).map(row => {
    const guildData = Array.isArray(row.guilds) ? row.guilds[0] : row.guilds
    return {
      id: row.id,
      guild_id: row.guild_id,
      guild_name: guildData.name,
      guild_tag: guildData.tag,
      member_count: guildData.member_count,
      max_members: guildData.max_members,
      invited_by: row.invited_by,
      invited_by_username: extractUsernameFromJoin(row.inviter),
      created_at: row.created_at,
      expires_at: row.expires_at
    }
  })
}
```

### RLS Policy Pattern
```sql
-- Source: Pattern from 007_friends.sql and 022_guilds.sql
ALTER TABLE guild_invites ENABLE ROW LEVEL SECURITY;

-- Players can view invites sent to them
CREATE POLICY "Players can view own invites"
  ON guild_invites FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Guild officers/leaders can view outgoing invites
CREATE POLICY "Guild staff can view outgoing invites"
  ON guild_invites FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
        AND gm.role IN ('leader', 'officer')
    )
  );

-- No direct insert/update/delete - use SECURITY DEFINER functions
CREATE POLICY "No direct invite insert"
  ON guild_invites FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct invite update"
  ON guild_invites FOR UPDATE
  USING (false);

CREATE POLICY "No direct invite delete"
  ON guild_invites FOR DELETE
  USING (false);
```

### WebSocket Message Types
```typescript
// Source: Pattern from packages/shared/src/types/guild.ts

// Add to client -> server message types
export interface SendGuildInvitePayload {
  player_id: string
}

export interface AcceptGuildInvitePayload {
  invite_id: string
}

export interface DeclineGuildInvitePayload {
  invite_id: string
}

export interface CancelGuildInvitePayload {
  invite_id: string
}

// Add to server -> client payloads
export interface GuildInviteReceivedPayload {
  invite_id: string
  guild_id: string
  guild_name: string
  guild_tag: string
  invited_by_id: string
  invited_by_username: string
  created_at: string
}

export interface GuildInvite {
  id: string
  guild_id: string
  guild_name: string
  guild_tag: string
  member_count: number
  max_members: number
  invited_by: string
  invited_by_username: string
  created_at: string
  expires_at: string
}

export interface GuildInvitesPayload {
  invites: GuildInvite[]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Check role in handler | Check role in database function | Phase 1 | Security, atomicity |
| Separate check + insert | Combined in SECURITY DEFINER | Phase 1 | Race-condition proof |
| Poll for updates | Push via WebSocket | Existing | Real-time UX |

**Deprecated/outdated:**
- None - Phase 1 patterns are current

## Open Questions

Things that couldn't be fully resolved:

1. **Invite Cooldown After Decline**
   - What we know: UNIQUE constraint prevents multiple active invites
   - What's unclear: Should there be a cooldown after decline before re-inviting?
   - Recommendation: Add `last_declined_at` column, enforce 7-day cooldown. Can implement in Phase 2 or defer.

2. **Invite Cancellation by Officer**
   - What we know: Officers can send invites
   - What's unclear: Can an officer cancel another officer's invite? Can only the sender cancel?
   - Recommendation: Allow any leader/officer to cancel any invite from their guild (simpler permission model)

3. **Update Guild Settings Handler**
   - What we know: join_mode exists on guilds table, leaders can update
   - What's unclear: Is there an existing update_guild_settings handler?
   - Recommendation: Check if exists, if not, add simple handler for leader to change join_mode

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/022_guilds.sql` - Existing guild schema, RLS, functions
- `supabase/migrations/007_friends.sql` - Friend request pattern
- `supabase/migrations/009_trades.sql` - Trade pattern with SECURITY DEFINER
- `apps/game-server/src/db.ts` - Database function patterns
- `apps/game-server/src/hub.ts` - WebSocket handler patterns
- `packages/shared/src/types/guild.ts` - Type definitions

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` - Architecture research with guild_invites table schema
- `.planning/research/PITFALLS.md` - Known pitfalls including invitation spam

### Tertiary (LOW confidence)
- None - all research derived from codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing codebase patterns
- Architecture: HIGH - Direct patterns from friends, trades, guilds
- Pitfalls: HIGH - Documented in research + derived from similar features

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable patterns)
