# Phase 5: Guild Quests - Research

**Researched:** 2026-01-18
**Domain:** Guild quest system with activity tracking and rewards
**Confidence:** HIGH

## Summary

Guild quests require tracking player activities (catches, battles, evolves) and aggregating progress toward shared goals. The codebase already has established patterns for activity tracking (weekly_stats), daily limit resets (guild bank), real-time WebSocket broadcasts (broadcastToGuild), and modal UI components.

Key implementation points:
- Quest reset mechanism uses existing UTC-based date_trunc pattern from guild bank
- Activity hooks already exist in hub.ts processTicks() where catches/battles/evolutions are processed
- Real-time broadcast uses existing broadcastToGuild() function
- Frontend follows GuildBankModal pattern with tabs for daily/weekly quests

**Primary recommendation:** Extend existing activity tracking patterns and leverage the UTC date-based reset mechanism already proven in guild bank withdrawals. Quest generation should happen lazily on first guild access after reset time.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | Supabase | Quest storage, progress tracking, history | Already used for all game data |
| WebSocket | ws | Real-time progress broadcasts | Existing game server infrastructure |
| Zustand | 5.0.10 | Frontend quest state | Existing state management pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| canvas-confetti | 1.9.x | Celebration animation | Quest completion celebration |
| react-canvas-confetti | 1.4.x | React wrapper | Cleaner React integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| canvas-confetti | CSS keyframes | Confetti library is battle-tested, CSS is lighter but less impressive |
| In-database quest gen | Server-side generation | DB functions keep logic atomic, server-side more flexible |

**Installation:**
```bash
npm install canvas-confetti
# or for React wrapper:
npm install react-canvas-confetti
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
  027_guild_quests.sql           # Schema, functions, triggers

packages/shared/src/types/
  guild.ts                       # Add quest types to existing file

apps/game-server/src/
  hub.ts                         # Quest progress hooks in processTicks
  db.ts                          # Quest database functions

apps/web/src/
  components/game/guild/
    GuildQuestsModal.tsx         # Main modal container
    QuestCard.tsx                # Individual quest display
    QuestLeaderboard.tsx         # Contribution rankings
    QuestHistory.tsx             # Past completions (paginated)
  lib/confetti.ts                # Confetti utility functions
```

### Pattern 1: Activity Tracking Hooks

**What:** Insert quest progress updates at the exact points where activities are recorded
**When to use:** Whenever a catch, battle, or evolution completes successfully
**Example:**
```typescript
// Source: Existing hub.ts processTicks() pattern
// After successful catch at line ~1260:
if (catchResult.success) {
  // Existing code...
  await updateWeeklyStats(client.session.player.id, { catches: 1 })

  // NEW: Update guild quest progress
  if (client.session.guild?.id) {
    await updateGuildQuestProgress(
      client.session.guild.id,
      client.session.player.id,
      'catch_pokemon',
      { species_id: wild.species_id, type1: wild.species.type1 }
    )
  }
}
```

### Pattern 2: UTC-Based Daily Reset

**What:** Use date_trunc('day', NOW() AT TIME ZONE 'UTC') for daily reset detection
**When to use:** Daily quest reset, daily contribution tracking
**Example:**
```sql
-- Source: Existing guild_bank_withdrawals pattern (migration 026)
-- Check if quests exist for today
SELECT * FROM guild_daily_quests
WHERE guild_id = p_guild_id
  AND quest_date = date_trunc('day', NOW() AT TIME ZONE 'UTC')::DATE;

-- If none exist, generate new daily quests
```

### Pattern 3: Weekly Reset (Monday UTC)

**What:** Use date_trunc('week', NOW() AT TIME ZONE 'UTC') for weekly boundary
**When to use:** Weekly quest reset, weekly contribution tracking
**Example:**
```sql
-- Source: Existing weekly_stats pattern (migration 020)
-- PostgreSQL week starts Monday by default with date_trunc
SELECT * FROM guild_weekly_quests
WHERE guild_id = p_guild_id
  AND week_start = date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;
```

### Pattern 4: Lazy Quest Generation

**What:** Generate quests on first access after reset rather than scheduled job
**When to use:** Quest initialization, avoiding need for cron jobs
**Example:**
```sql
-- In get_guild_quests function:
-- 1. Check for today's quests
-- 2. If none, call generate_daily_quests()
-- 3. Return quests

-- This approach:
-- - Avoids external scheduler dependency
-- - Works across timezones automatically
-- - Self-heals if generation fails
```

### Pattern 5: Real-time Progress Broadcast

**What:** Use broadcastToGuild() to push progress updates
**When to use:** Quest progress, milestone notifications, completions
**Example:**
```typescript
// Source: Existing broadcastToGuild pattern (hub.ts line 795)
// After updating quest progress in database:
this.broadcastToGuild(guildId, 'guild_quest_progress', {
  quest_id: questId,
  current_progress: newProgress,
  goal: questGoal,
  contributor_id: playerId,
  contributor_username: username,
  contribution_amount: amount
})

// On milestone (25%, 50%, 75%, 100%):
this.broadcastToGuild(guildId, 'guild_quest_milestone', {
  quest_id: questId,
  milestone: 50,  // percentage
  quest_title: 'Catch 100 Pokemon'
})
```

### Anti-Patterns to Avoid
- **Cron-based reset:** PostgreSQL cron extensions require setup; lazy generation is simpler
- **Client-side progress calculation:** Progress must be server-authoritative to prevent cheating
- **Blocking quest updates:** Quest progress should be fire-and-forget (no await in main flow)
- **Individual activity tables:** Add to existing pattern, don't create parallel tracking

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation | CSS particles | canvas-confetti | Battle-tested, performant, customizable |
| UTC time handling | Manual offset calc | PostgreSQL AT TIME ZONE | Database handles DST, consistency |
| Real-time updates | Polling | Existing WebSocket | Already working infrastructure |
| Activity counting | New tracking tables | Extend existing patterns | weekly_stats, guild_bank_withdrawals patterns |
| Pagination | Custom implementation | Existing BankLogsTab pattern | Consistent UX, proven code |

**Key insight:** The codebase has solved daily resets (guild bank), activity tracking (weekly_stats), and real-time guild broadcasts (guild chat). Guild quests should compose these patterns rather than reinvent them.

## Common Pitfalls

### Pitfall 1: Race Conditions in Progress Updates
**What goes wrong:** Multiple members' actions arrive simultaneously, causing lost progress
**Why it happens:** Concurrent updates without row locking
**How to avoid:** Use FOR UPDATE in progress update function, atomic increment
**Warning signs:** Progress occasionally decreases, reports of "lost" contributions

### Pitfall 2: Timezone Confusion for Resets
**What goes wrong:** Quests reset at wrong time for some players
**Why it happens:** Using client timezone or server local time
**How to avoid:** Always use UTC in database (AT TIME ZONE 'UTC'), display timezone to user
**Warning signs:** Players reporting quests "disappeared early" or "didn't reset"

### Pitfall 3: Quest Generation Duplicates
**What goes wrong:** Multiple quest sets generated for same day
**Why it happens:** Race condition when multiple players trigger lazy generation
**How to avoid:** Use INSERT ... ON CONFLICT, or advisory lock during generation
**Warning signs:** Guild has 6+ daily quests when should have 3-4

### Pitfall 4: Reward Double-Claiming
**What goes wrong:** Quest rewards distributed multiple times
**Why it happens:** Completion check and reward distribution not atomic
**How to avoid:** Single transaction: mark complete + distribute rewards
**Warning signs:** Guild bank balance spikes, duplicate reward logs

### Pitfall 5: Stale Progress in UI
**What goes wrong:** UI shows old progress after contributing
**Why it happens:** Local state not updated on WebSocket broadcast
**How to avoid:** WebSocket handler updates Zustand store optimistically
**Warning signs:** Players need to close/reopen modal to see their contribution

## Code Examples

Verified patterns from the existing codebase:

### Daily Reset Pattern (from guild bank)
```sql
-- Source: supabase/migrations/026_guild_bank.sql line 351
-- Calculate amount used today (since midnight UTC)
SELECT COALESCE(SUM(amount_or_points), 0) INTO v_used_today
FROM guild_bank_withdrawals
WHERE guild_id = p_guild_id
  AND player_id = p_player_id
  AND category = p_category
  AND withdrawn_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');
```

### Broadcast to Guild Pattern
```typescript
// Source: apps/game-server/src/hub.ts line 795
private broadcastToGuild(guildId: string, type: string, payload: unknown) {
  for (const [, client] of this.clients) {
    if (client.session?.guild?.id === guildId) {
      this.send(client, type, payload)
    }
  }
}
```

### Activity Tracking Hook Pattern
```typescript
// Source: apps/game-server/src/hub.ts line 1260
// After successful catch:
await updateWeeklyStats(client.session.player.id, {
  catches: 1,
  pokedex: isNewSpecies ? 1 : 0
})
```

### Modal Structure Pattern
```typescript
// Source: apps/web/src/components/game/guild/GuildBankModal.tsx
export function GuildQuestsModal({ isOpen, onClose }: GuildQuestsModalProps) {
  const [selectedTab, setSelectedTab] = useState<QuestTab>('daily')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      gameSocket.getGuildQuests()  // Fetch on open
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  // ... follows GuildBankModal pattern
}
```

### Pagination Pattern
```typescript
// Source: apps/web/src/components/game/guild/BankLogsTab.tsx
const [page, setPage] = useState(1)
const limit = 20
const totalPages = Math.ceil(total / limit)

useEffect(() => {
  gameSocket.getQuestHistory({ page, limit })
}, [page])
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cron-based daily tasks | Lazy generation on access | Established pattern | Simpler deployment, no scheduler |
| Global broadcasts | broadcastToGuild() | Phase 3 | Efficient targeted messaging |
| Manual UTC handling | PostgreSQL AT TIME ZONE | Established | Reliable timezone handling |

**Deprecated/outdated:**
- None specific to this domain; patterns are current

## Open Questions

Things that couldn't be fully resolved:

1. **Individual Bonus Distribution Method**
   - What we know: Main reward goes to guild bank, individual bonus goes to contributors
   - What's unclear: Equal split vs proportional to contribution vs participation reward
   - Recommendation: Proportional to contribution (percentage of goal completed by each member), minimum 1 currency for any contribution. Research suggests proportional keeps engagement.

2. **Reroll Cost Currency**
   - What we know: Uses guild bank currency
   - What's unclear: Specific cost amount for rerolls
   - Recommendation: 500 currency per daily reroll, 2000 per weekly reroll. Scale with average quest reward.

3. **Quest Difficulty Scaling Algorithm**
   - What we know: Based on average guild activity
   - What's unclear: Specific calculation for "average activity"
   - Recommendation: Use 7-day rolling average of guild catches/battles/evolves. Target ~80% completion rate.

## Sources

### Primary (HIGH confidence)
- supabase/migrations/026_guild_bank.sql - UTC date_trunc pattern, daily limit reset
- apps/game-server/src/hub.ts - Activity tracking hooks, broadcastToGuild pattern
- apps/game-server/src/db.ts - Database function patterns, weekly_stats
- apps/web/src/components/game/guild/GuildBankModal.tsx - Modal structure pattern
- apps/web/src/components/game/guild/BankLogsTab.tsx - Pagination pattern
- packages/shared/src/types/guild.ts - Type definition patterns

### Secondary (MEDIUM confidence)
- [canvas-confetti npm](https://www.npmjs.com/package/canvas-confetti) - Confetti library documentation
- [react-canvas-confetti GitHub](https://github.com/ulitcos/react-canvas-confetti) - React wrapper examples

### Tertiary (LOW confidence)
- WebSearch for proportional reward distribution patterns (general game design)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing proven patterns
- Architecture: HIGH - Extending established codebase patterns
- Activity tracking: HIGH - Direct reference to existing code
- Reset mechanism: HIGH - Copying guild bank pattern
- Quest generation: MEDIUM - New logic but using proven patterns
- Confetti: MEDIUM - External library, well-documented

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable patterns)
