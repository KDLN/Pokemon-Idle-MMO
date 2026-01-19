# Phase 6: Guild Shop & Statistics - Research

**Researched:** 2026-01-18
**Domain:** Guild buff system, statistics aggregation, leaderboard implementation
**Confidence:** HIGH

## Summary

This phase adds a guild shop where guilds can spend accumulated resources (currency from Phase 4 bank, guild points from Phase 5 quests) on temporary group buffs, and implements guild statistics and leaderboards. The codebase already has comprehensive patterns for guild functionality including bank currency handling, role-based permissions, and WebSocket broadcasting to guild members.

The buff system requires new database tables for active buffs and purchase history, modifications to the game tick processing to apply buff effects, and a new shop modal UI. The statistics system requires aggregation queries across members and a guild leaderboard with configurable ranking metrics.

**Primary recommendation:** Follow established Phase 4/5 patterns using SECURITY DEFINER functions for mutations, lazy-generation where appropriate, and the existing broadcastToGuild() method for real-time updates.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 15+ | Buff storage, expiry tracking, statistics aggregation | Existing supabase database, RPC functions |
| TypeScript | 5.x | Type definitions for buffs, shop items | Matches codebase convention |
| ws | 8.x | Real-time buff updates via WebSocket | Already used for all game communication |
| React 19 | 19.x | Shop/Statistics UI components | Established frontend framework |
| Tailwind CSS 4 | 4.x | Styling shop modal, statistics display | Existing styling approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 4.x | Frontend guild shop state | Store buff display, shop modal state |
| date-fns | 3.x | Buff duration countdown display | Already used for time formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database-stored buffs | In-memory buff cache | DB persistence survives server restart; use DB |
| Polling for buff expiry | PostgreSQL pg_notify | Polling is simpler and already used for tick |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
└── 028_guild_shop.sql           # Buff tables, shop functions, leaderboard views

packages/shared/src/types/
└── guild.ts                      # Add buff types to existing file

apps/game-server/src/
├── db.ts                         # Add buff query functions
├── hub.ts                        # Add shop handlers, modify processTicks
└── game.ts                       # Add buff modifier functions

apps/web/src/components/game/guild/
├── GuildShopModal.tsx            # Shop interface with buff purchase
├── ShopBuffCard.tsx              # Individual buff display/purchase
├── ActiveBuffsDisplay.tsx        # Active buffs with countdown
├── GuildStatisticsSection.tsx    # Guild stats grouped display
└── GuildLeaderboardModal.tsx     # Top 50 guilds leaderboard
```

### Pattern 1: Buff Storage and Expiry
**What:** Store active buffs with end_time timestamp, check on tick
**When to use:** Any time-limited guild bonus
**Example:**
```sql
-- Source: Derived from existing guild_quests pattern
CREATE TABLE guild_buffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  buff_type VARCHAR(50) NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL, -- 1.10 for +10%
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  purchased_by UUID REFERENCES players(id) ON DELETE SET NULL,
  UNIQUE(guild_id, buff_type) -- Only one active buff per type
);
```

### Pattern 2: Buff Application in Tick Processing
**What:** Check player's guild for active buffs before applying XP/catch/encounter calculations
**When to use:** During processTick in hub.ts
**Example:**
```typescript
// Source: Derived from existing processTicks pattern in hub.ts
// In processTicks(), before processing encounter:
const guildBuffs = client.session.guild
  ? await getActiveGuildBuffs(client.session.guild.id)
  : null;

// Apply to encounter rate
const baseEncounterRate = session.zone.base_encounter_rate;
const buffedEncounterRate = guildBuffs?.encounter_rate
  ? baseEncounterRate * guildBuffs.encounter_rate
  : baseEncounterRate;

// Apply to XP after battle
const xpMultiplier = guildBuffs?.xp_bonus || 1.0;
const buffedXP = Math.floor(baseXP * xpMultiplier);
```

### Pattern 3: Guild Statistics with Aggregation
**What:** Compute statistics from existing tables, not denormalized
**When to use:** Guild stats display (member count already exists, add aggregate queries)
**Example:**
```sql
-- Source: Derived from existing leaderboard patterns in 020_week6_leaderboards_route4.sql
CREATE OR REPLACE FUNCTION get_guild_statistics(p_guild_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_catches', COALESCE(SUM(pe.catch_count), 0),
    'unique_species', COUNT(DISTINCT pe.species_id) FILTER (WHERE pe.caught = true),
    'member_count', g.member_count,
    'avg_level', (SELECT AVG(level) FROM pokemon p2
                  JOIN players pl ON pl.id = p2.owner_id
                  WHERE pl.guild_id = p_guild_id),
    'days_active', EXTRACT(DAY FROM NOW() - g.created_at)::INT
  ) INTO v_stats
  FROM guilds g
  LEFT JOIN guild_members gm ON gm.guild_id = g.id
  LEFT JOIN pokedex_entries pe ON pe.player_id = gm.player_id
  WHERE g.id = p_guild_id
  GROUP BY g.id, g.member_count, g.created_at;

  RETURN v_stats;
END;
$$;
```

### Pattern 4: Guild Leaderboard with Configurable Metrics
**What:** Rank guilds by different metrics using SQL window functions
**When to use:** Guild leaderboard display
**Example:**
```sql
-- Source: Derived from existing get_leaderboard pattern in db.ts
CREATE OR REPLACE FUNCTION get_guild_leaderboard(
  p_metric TEXT,
  p_limit INT DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_metric = 'members' THEN
    RETURN (
      SELECT json_agg(row_order) FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY member_count DESC) as rank,
          id, name, tag, member_count as value,
          (SELECT username FROM players WHERE id = leader_id) as leader_name
        FROM guilds
        ORDER BY member_count DESC
        LIMIT p_limit
      ) row_order
    );
  -- Additional metrics: catches, pokedex...
  END IF;
END;
$$;
```

### Anti-Patterns to Avoid
- **Storing buff state in-memory only:** Server restart loses buff state; always persist to DB
- **Checking buffs on every tick per-client:** Cache guild buffs with short TTL (5-10 seconds)
- **Recalculating all stats on every view:** Use aggregation queries, consider materialized views for hot paths
- **Blocking tick loop with buff queries:** Use fire-and-forget async pattern like quest progress

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-based expiry | setTimeout cleanup | DB timestamp + query filter | Server restart loses timers |
| Buff stacking logic | Custom stack tracker | ends_at arithmetic | `ends_at = GREATEST(ends_at, NOW()) + duration` |
| Role permission check | Manual role comparison | check_bank_permission pattern | Centralized, reusable |
| Currency deduction | Direct UPDATE | SECURITY DEFINER function with lock | Prevents race conditions |
| Guild member broadcast | Loop through clients | broadcastToGuild() | Already optimized |

**Key insight:** The guild bank system (Phase 4) solved most of the hard problems - currency deduction with locking, role-based permissions, transaction logging. The shop system should reuse these patterns exactly.

## Common Pitfalls

### Pitfall 1: Buff Timer Race Conditions
**What goes wrong:** Multiple purchases race to extend buff duration, losing time
**Why it happens:** Non-atomic read-modify-write of ends_at
**How to avoid:** Use UPSERT with GREATEST() in single atomic operation
**Warning signs:** Players report "lost" buff time after rapid purchases

### Pitfall 2: Stale Buff Cache in Game Loop
**What goes wrong:** Player doesn't see buff effect immediately after purchase
**Why it happens:** Buff state cached too long, tick processes before cache refresh
**How to avoid:** Short cache TTL (5s) or invalidate on purchase broadcast
**Warning signs:** "I bought the buff but it's not working"

### Pitfall 3: Statistics Query Performance
**What goes wrong:** Leaderboard/stats page causes database slowdown
**Why it happens:** Aggregating across all members, all catches on every request
**How to avoid:**
- Index on guild_id for member lookups
- Consider guild_stats summary table updated on activity
- Cache leaderboard results for 1-5 minutes
**Warning signs:** Slow page loads, DB CPU spikes

### Pitfall 4: Buff Visibility Desync
**What goes wrong:** Some members see buff active, others don't
**Why it happens:** WebSocket broadcast missed due to disconnect/reconnect
**How to avoid:** Always send active buffs on connect and guild_data refresh
**Warning signs:** Inconsistent buff displays between party members

### Pitfall 5: Leaving Guild Doesn't End Buff Effect
**What goes wrong:** Player keeps buff bonus after leaving/being kicked
**Why it happens:** Buff check uses cached session.guild which isn't updated
**How to avoid:** Clear session.guild on leave/kick, check membership in buff application
**Warning signs:** Ex-members report higher XP rates

## Code Examples

Verified patterns from official sources:

### Buff Purchase with Currency Deduction
```typescript
// Source: Derived from guild_bank_withdraw_currency pattern in 026_guild_bank.sql
CREATE OR REPLACE FUNCTION purchase_guild_buff(
  p_player_id UUID,
  p_guild_id UUID,
  p_buff_type VARCHAR,
  p_duration_hours INT,
  p_cost BIGINT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank RECORD;
  v_current_buff RECORD;
  v_new_ends_at TIMESTAMPTZ;
BEGIN
  -- Lock member row and verify role
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can purchase buffs');
  END IF;

  -- Lock bank and check balance
  SELECT * INTO v_bank
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  IF v_bank.balance < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient bank funds');
  END IF;

  -- Deduct currency
  UPDATE guild_bank_currency
  SET balance = balance - p_cost
  WHERE guild_id = p_guild_id;

  -- Calculate new end time (stack with existing buff, cap at 24h)
  SELECT * INTO v_current_buff
  FROM guild_buffs
  WHERE guild_id = p_guild_id AND buff_type = p_buff_type
  FOR UPDATE;

  IF v_current_buff IS NOT NULL THEN
    -- Extend existing buff
    v_new_ends_at := LEAST(
      GREATEST(v_current_buff.ends_at, NOW()) + (p_duration_hours * INTERVAL '1 hour'),
      NOW() + INTERVAL '24 hours'
    );
    UPDATE guild_buffs
    SET ends_at = v_new_ends_at, purchased_by = p_player_id
    WHERE id = v_current_buff.id;
  ELSE
    -- Create new buff
    v_new_ends_at := NOW() + (p_duration_hours * INTERVAL '1 hour');
    INSERT INTO guild_buffs (guild_id, buff_type, multiplier, ends_at, purchased_by)
    VALUES (p_guild_id, p_buff_type,
            CASE p_buff_type
              WHEN 'xp_bonus' THEN 1.10
              WHEN 'catch_rate' THEN 1.10
              WHEN 'encounter_rate' THEN 1.10
            END,
            v_new_ends_at, p_player_id);
  END IF;

  -- Log purchase
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id, p_player_id, 'withdraw', 'currency',
    jsonb_build_object('type', 'buff_purchase', 'buff_type', p_buff_type, 'cost', p_cost),
    v_bank.balance - p_cost
  );

  RETURN json_build_object('success', true, 'ends_at', v_new_ends_at);
END;
$$;
```

### Buff Application in Game Loop
```typescript
// Source: Derived from processTicks pattern in hub.ts
interface GuildBuffs {
  xp_bonus: number | null;      // multiplier e.g. 1.10
  catch_rate: number | null;
  encounter_rate: number | null;
}

// Cache buffs per guild with 5-second TTL
private guildBuffCache: Map<string, { buffs: GuildBuffs; expiresAt: number }> = new Map();

private async getGuildBuffs(guildId: string): Promise<GuildBuffs | null> {
  const cached = this.guildBuffCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.buffs;
  }

  const buffs = await getActiveGuildBuffs(guildId);
  this.guildBuffCache.set(guildId, {
    buffs,
    expiresAt: Date.now() + 5000 // 5 second TTL
  });
  return buffs;
}

// In processTicks, apply buffs:
const guildBuffs = client.session.guild
  ? await this.getGuildBuffs(client.session.guild.id)
  : null;

// Apply to encounter rate
if (guildBuffs?.encounter_rate) {
  encounterRate *= guildBuffs.encounter_rate;
}

// Apply to catch rate (in attemptCatch)
if (guildBuffs?.catch_rate) {
  catchChance *= guildBuffs.catch_rate;
}

// Apply to XP (in distributeXP result)
if (guildBuffs?.xp_bonus) {
  xpEarned = Math.floor(xpEarned * guildBuffs.xp_bonus);
}
```

### WebSocket Handler for Shop
```typescript
// Source: Derived from handleGetGuildBank pattern in hub.ts
private async handlePurchaseBuff(
  client: Client,
  payload: { buff_type: string; duration_hours?: number }
) {
  if (!client.session?.guild) {
    this.sendError(client, 'You must be in a guild');
    return;
  }

  const { buff_type, duration_hours = 1 } = payload;

  // Validate buff type
  const validBuffs = ['xp_bonus', 'catch_rate', 'encounter_rate'];
  if (!validBuffs.includes(buff_type)) {
    this.sendError(client, 'Invalid buff type');
    return;
  }

  // Calculate cost (could vary by buff type)
  const cost = 1000 * duration_hours; // Example: 1000 per hour

  const result = await purchaseGuildBuff(
    client.session.player.id,
    client.session.guild.id,
    buff_type,
    duration_hours,
    cost
  );

  if (!result.success) {
    this.sendError(client, result.error);
    return;
  }

  // Invalidate buff cache
  this.guildBuffCache.delete(client.session.guild.id);

  // Broadcast to guild
  this.broadcastToGuild(client.session.guild.id, 'guild_buff_purchased', {
    buff_type,
    ends_at: result.ends_at,
    purchased_by: client.session.player.username,
    duration_hours
  });

  // Also send to guild chat as system message
  const message = await saveGuildMessage(
    client.session.guild.id,
    null, // system message
    'System',
    'leader',
    `${client.session.player.username} activated ${buff_type.replace('_', ' ')} buff for ${duration_hours} hour(s)!`
  );
  this.broadcastToGuild(client.session.guild.id, 'guild_chat_message', { message });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store buffs in memory | Store in DB with timestamp | N/A (new feature) | Persistence across restarts |
| Poll for buff expiry | Check on tick with filter | N/A (new feature) | Simpler, already in loop |
| Separate stats table | Aggregate from existing tables | N/A (new feature) | No data sync issues |

**Deprecated/outdated:**
- N/A - This is a new feature with no prior implementation

## Open Questions

Things that couldn't be fully resolved:

1. **Buff Pricing Structure**
   - What we know: User decided both guild points and currency accepted, points should be cheaper
   - What's unclear: Exact ratio (e.g., 500 currency vs 100 guild points for same buff)
   - Recommendation: Start with 5:1 ratio, tune based on economy feedback

2. **Statistics Computation Cost**
   - What we know: Aggregating all member catches/pokedex can be expensive
   - What's unclear: Whether current indexing is sufficient for guilds with 50 members
   - Recommendation: Implement with standard queries first, add materialized view if slow

3. **Buff Effect Boundaries**
   - What we know: Buffs should end immediately when member leaves guild
   - What's unclear: Should buff check happen before every tick calculation or cached?
   - Recommendation: Use 5-second cache, check guild membership separately on leave

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/026_guild_bank.sql` - Currency handling patterns, SECURITY DEFINER functions, FOR UPDATE locking
- `supabase/migrations/027_guild_quests.sql` - Time-based mechanics, reward distribution, lazy generation
- `apps/game-server/src/hub.ts` - processTicks loop, broadcastToGuild, handler patterns
- `apps/game-server/src/game.ts` - XP calculation, catch rate, encounter rate

### Secondary (MEDIUM confidence)
- `apps/game-server/src/db.ts` - getLeaderboard patterns for ranking queries
- `packages/shared/src/types/guild.ts` - Existing type patterns for bank and quests
- `supabase/migrations/020_week6_leaderboards_route4.sql` - Leaderboard SQL patterns

### Tertiary (LOW confidence)
- N/A - All patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use
- Architecture: HIGH - Directly follows Phase 4/5 patterns
- Pitfalls: HIGH - Identified from similar features in codebase
- Buff mechanics: MEDIUM - New feature, patterns extrapolated from quests

**Research date:** 2026-01-18
**Valid until:** 2026-02-17 (30 days - stable codebase patterns)
