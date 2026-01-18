# Phase 4: Guild Bank - Research

**Researched:** 2026-01-18
**Domain:** Guild shared storage system with role-based access, transaction logging, and request workflow
**Confidence:** HIGH

## Summary

The guild bank system enables shared storage for currency, items, and Pokemon within guilds. This phase builds heavily on established patterns from Phase 1 (guild foundation) and existing systems (trade ownership transfer, inventory management). The codebase already contains all the building blocks needed.

The primary technical challenge is implementing role-based withdrawal limits with daily resets, the request system for members who cannot withdraw directly, and the rarity-weighted Pokemon withdrawal point system. The UI will follow the established modal pattern (like TradeModal) with a tabbed interface.

**Primary recommendation:** Use SECURITY DEFINER functions for all bank mutations following the existing guild pattern (create_guild, join_guild, etc.). Store bank data in separate tables (guild_bank_currency, guild_bank_items, guild_bank_pokemon) with RLS blocking direct mutations. Implement transaction logging in a guild_bank_logs table with full context per entry.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Client | 2.x | Database queries via RPC | Already used throughout |
| Zustand | 5.x | Frontend state management | Already established pattern |
| React 19 | 19.x | UI components | Already in use |
| WebSocket (ws) | 8.x | Real-time updates | Already established |
| jose | 5.x | JWT validation | Already in game-server |

### Supporting (Already in Codebase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS 4 | 4.x | Styling | All UI components |
| TypeScript | 5.x | Type safety | All code |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate bank tables | Single JSONB column | Tables better for querying/indexing |
| RPC functions | Direct table access | RPC provides atomicity and permission checks |
| Polling for updates | WebSocket broadcast | Already have broadcastToGuild() |

**Installation:**
No new packages needed. All dependencies already present.

## Architecture Patterns

### Recommended Database Structure
```
supabase/migrations/026_guild_bank.sql

-- Core storage tables
guild_bank_currency (guild_id, balance, max_capacity)
guild_bank_items (guild_id, item_id, quantity, max_stack)
guild_bank_pokemon (id, guild_id, pokemon_id, deposited_by, deposited_at, slot)

-- Permission configuration
guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw)
guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit)
guild_bank_player_overrides (guild_id, player_id, category, custom_limit)

-- Withdrawal tracking
guild_bank_withdrawals (id, guild_id, player_id, category, amount_or_points, withdrawn_at)

-- Request system
guild_bank_requests (id, guild_id, player_id, request_type, item_details, status, created_at, expires_at)

-- Transaction logging
guild_bank_logs (id, guild_id, player_id, action, category, details JSONB, balance_after, created_at)

-- Slot expansion tracking
guild_bank_expansions (guild_id, purchased_slots, next_price)
```

### Recommended Project Structure
```
apps/game-server/src/
  handlers/
    guildBank.ts        # Bank WebSocket handlers (deposit, withdraw, etc.)
  db.ts                 # Add bank query functions

apps/web/src/
  components/game/guild/
    GuildBankModal.tsx      # Main modal container with tabs
    BankCurrencyTab.tsx     # Currency deposit/withdraw UI
    BankItemsTab.tsx        # Items deposit/withdraw UI
    BankPokemonTab.tsx      # Pokemon deposit/withdraw UI
    BankLogsTab.tsx         # Transaction log viewer
    BankRequestsTab.tsx     # Request queue for officers
    BankPermissions.tsx     # Leader permission config UI
  stores/
    gameStore.ts            # Add guild bank state

packages/shared/src/types/
  guild.ts                  # Add bank-related types
```

### Pattern 1: SECURITY DEFINER Functions for Atomic Operations
**What:** All bank mutations go through SECURITY DEFINER stored procedures
**When to use:** Every deposit, withdraw, request operation
**Example:**
```sql
-- Source: Existing pattern from 022_guilds.sql
CREATE OR REPLACE FUNCTION guild_bank_deposit_currency(
  p_player_id UUID,
  p_guild_id UUID,
  p_amount BIGINT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank RECORD;
  v_player_balance BIGINT;
BEGIN
  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check permission
  IF NOT check_bank_permission(p_guild_id, v_member.role, 'currency', 'deposit') THEN
    RETURN json_build_object('success', false, 'error', 'No deposit permission');
  END IF;

  -- Lock player balance
  SELECT pokedollars INTO v_player_balance FROM players WHERE id = p_player_id FOR UPDATE;

  IF v_player_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- Lock bank row
  SELECT * INTO v_bank FROM guild_bank_currency WHERE guild_id = p_guild_id FOR UPDATE;

  IF v_bank.balance + p_amount > v_bank.max_capacity THEN
    RETURN json_build_object('success', false, 'error', 'Bank would exceed capacity');
  END IF;

  -- Execute transfer
  UPDATE players SET pokedollars = pokedollars - p_amount WHERE id = p_player_id;
  UPDATE guild_bank_currency SET balance = balance + p_amount WHERE guild_id = p_guild_id;

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (p_guild_id, p_player_id, 'deposit', 'currency',
          jsonb_build_object('amount', p_amount),
          v_bank.balance + p_amount);

  RETURN json_build_object('success', true, 'new_balance', v_bank.balance + p_amount);
END;
$$;
```

### Pattern 2: Daily Limit Tracking with Midnight UTC Reset
**What:** Track withdrawals per player per category per day, reset at midnight UTC
**When to use:** Officer/Member withdrawal operations
**Example:**
```sql
-- Check daily limit for withdrawals
-- Returns remaining points/count available today
CREATE OR REPLACE FUNCTION get_remaining_daily_limit(
  p_player_id UUID,
  p_guild_id UUID,
  p_category TEXT
) RETURNS INT AS $$
DECLARE
  v_member_role guild_role;
  v_daily_limit INT;
  v_used_today INT;
BEGIN
  -- Get member role
  SELECT role INTO v_member_role FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  -- Leaders have no limit
  IF v_member_role = 'leader' THEN
    RETURN -1; -- -1 indicates unlimited
  END IF;

  -- Get configured limit (check player override first, then role default)
  SELECT COALESCE(
    (SELECT custom_limit FROM guild_bank_player_overrides
     WHERE guild_id = p_guild_id AND player_id = p_player_id AND category = p_category),
    (SELECT daily_limit FROM guild_bank_limits
     WHERE guild_id = p_guild_id AND role = v_member_role AND category = p_category),
    0 -- Default to 0 if no limit configured (no permission)
  ) INTO v_daily_limit;

  -- Get amount used today (after midnight UTC)
  SELECT COALESCE(SUM(amount_or_points), 0) INTO v_used_today
  FROM guild_bank_withdrawals
  WHERE guild_id = p_guild_id
    AND player_id = p_player_id
    AND category = p_category
    AND withdrawn_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');

  RETURN GREATEST(v_daily_limit - v_used_today, 0);
END;
$$ LANGUAGE plpgsql;
```

### Pattern 3: Pokemon Rarity-Weighted Point System
**What:** Different Pokemon cost different withdrawal points based on BST/rarity
**When to use:** Pokemon withdrawals
**Example:**
```sql
-- Calculate point cost for a Pokemon based on BST
-- Tiers: Common (1pt), Uncommon (2pt), Rare (5pt), Very Rare (10pt), Legendary (25pt)
CREATE OR REPLACE FUNCTION calculate_pokemon_point_cost(p_species_id INT)
RETURNS INT AS $$
DECLARE
  v_bst INT;
BEGIN
  SELECT base_hp + base_attack + base_defense + base_sp_attack + base_sp_defense + base_speed
  INTO v_bst FROM pokemon_species WHERE id = p_species_id;

  -- BST-based tiers (balanced for Gen 1 range)
  IF v_bst >= 580 THEN RETURN 25;  -- Legendary tier (Mewtwo, Dragonite)
  ELSIF v_bst >= 500 THEN RETURN 10; -- Very Rare (Alakazam, Machamp, starters final)
  ELSIF v_bst >= 400 THEN RETURN 5;  -- Rare (middle evolutions, strong Pokemon)
  ELSIF v_bst >= 300 THEN RETURN 2;  -- Uncommon (first evolutions, Pikachu)
  ELSE RETURN 1; -- Common (Rattata, Pidgey, unevolved)
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 4: Request System with 24hr Expiration
**What:** Members create requests, Officers/Leaders fulfill or let expire
**When to use:** When member wants item they cannot withdraw directly
**Example:**
```sql
CREATE OR REPLACE FUNCTION create_bank_request(
  p_player_id UUID,
  p_guild_id UUID,
  p_request_type TEXT, -- 'currency', 'item', 'pokemon'
  p_details JSONB -- { item_id, quantity } or { pokemon_id } or { amount }
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify membership
  IF NOT EXISTS (SELECT 1 FROM guild_members WHERE player_id = p_player_id AND guild_id = p_guild_id) THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Clean up expired requests opportunistically
  DELETE FROM guild_bank_requests
  WHERE guild_id = p_guild_id AND expires_at < NOW();

  -- Create request with 24hr expiration
  INSERT INTO guild_bank_requests (guild_id, player_id, request_type, item_details, status, expires_at)
  VALUES (p_guild_id, p_player_id, p_request_type, p_details, 'pending', NOW() + INTERVAL '24 hours');

  -- Log the request
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (p_guild_id, p_player_id, 'request_created', p_request_type, p_details);

  RETURN json_build_object('success', true);
END;
$$;
```

### Pattern 5: Real-time UI Updates via broadcastToGuild()
**What:** Notify all online guild members of bank changes
**When to use:** After successful bank operations
**Example:**
```typescript
// Source: Existing pattern from hub.ts
private async handleGuildBankDeposit(client: Client, payload: DepositCurrencyPayload) {
  if (!client.session?.guild) return

  const result = await depositCurrencyToBank(
    client.session.player.id,
    client.session.guild.id,
    payload.amount
  )

  if (!result.success) {
    this.send(client, 'guild_bank_error', { error: result.error })
    return
  }

  // Update depositor's session
  if (client.session) {
    client.session.pokedollars -= payload.amount
  }

  // Broadcast to all guild members
  this.broadcastToGuild(client.session.guild.id, 'guild_bank_currency_updated', {
    balance: result.new_balance,
    depositor: client.session.player.username,
    amount: payload.amount,
    action: 'deposit'
  })
}
```

### Anti-Patterns to Avoid
- **Direct table mutations:** Always use SECURITY DEFINER functions for atomicity
- **Client-side permission checks:** Server must validate all permissions
- **Polling for updates:** Use broadcastToGuild() for real-time sync
- **Storing Pokemon ownership in bank table:** Pokemon stay in pokemon table, bank references by ID
- **Running counts without locks:** Use FOR UPDATE when checking capacities

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pokemon ownership transfer | Custom UPDATE logic | Follow complete_trade() pattern | Handles party_slot clearing, ownership verification |
| Daily reset logic | Cron job | Query filter with date_trunc() | Simpler, no external dependency |
| Permission checking | Inline IF statements | Dedicated check_bank_permission() function | Reusable, single source of truth |
| Transaction logging | After-the-fact logging | Inline in same transaction | Guarantees log consistency |
| Optimistic locking | Hope for the best | FOR UPDATE on all affected rows | Prevents race conditions |
| Real-time updates | Polling | broadcastToGuild() | Already exists, proven pattern |
| Modal UI | Custom modal | Follow TradeModal pattern | Consistent UX, animation handling |

**Key insight:** The trade system's complete_trade() function demonstrates the exact pattern needed for transferring Pokemon between player and guild bank - lock rows, validate ownership, update owner_id, clear party_slot, log history.

## Common Pitfalls

### Pitfall 1: Race Condition on Capacity Checks
**What goes wrong:** Two players deposit simultaneously, both pass capacity check, bank overflows
**Why it happens:** Capacity check and update not atomic
**How to avoid:** Always use FOR UPDATE when reading balance/capacity before modification
**Warning signs:** Intermittent "bank over capacity" logs, negative available space

### Pitfall 2: Double Withdrawal via Concurrent Requests
**What goes wrong:** Player clicks withdraw twice quickly, both succeed
**Why it happens:** Daily limit check and withdrawal recording not atomic
**How to avoid:** Lock withdrawal tracking row before checking remaining limit
**Warning signs:** Players exceeding daily limits, audit log shows impossible withdrawals

### Pitfall 3: Orphaned Pokemon in Bank
**What goes wrong:** Pokemon deleted but bank reference remains
**Why it happens:** ON DELETE CASCADE not properly configured
**How to avoid:** Use `pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE`
**Warning signs:** Bank UI shows "Loading..." for missing Pokemon

### Pitfall 4: Permission Drift After Role Change
**What goes wrong:** Player demoted but still has old withdrawal permissions
**Why it happens:** Permissions cached client-side
**How to avoid:** Always recheck permissions server-side, broadcast role changes trigger UI refresh
**Warning signs:** "Permission denied" errors after successful early withdrawals

### Pitfall 5: Request Expiration Not Enforced
**What goes wrong:** Expired requests fulfilled, or request queue shows stale data
**Why it happens:** Only checking expiration on display, not on action
**How to avoid:** Filter by expires_at > NOW() in fulfill_request function, opportunistic cleanup
**Warning signs:** Requests older than 24 hours being fulfilled

### Pitfall 6: Inconsistent Balance After Failed Transaction
**What goes wrong:** Currency deducted from player but not added to bank (or vice versa)
**Why it happens:** Error between deduct and add steps, no transaction
**How to avoid:** Wrap all mutations in single SECURITY DEFINER function (auto-transaction)
**Warning signs:** Balance discrepancies, audit log totals don't match current balance

## Code Examples

Verified patterns from existing codebase:

### WebSocket Handler Pattern (from hub.ts)
```typescript
// Source: apps/game-server/src/hub.ts
// Follow fire-and-forget async pattern
case 'guild_bank_deposit':
  this.handleGuildBankDeposit(client, msg.payload as DepositCurrencyPayload)
  break
```

### Database Function Call Pattern (from db.ts)
```typescript
// Source: apps/game-server/src/db.ts
export async function depositCurrencyToBank(
  playerId: string,
  guildId: string,
  amount: number
): Promise<{ success: boolean; new_balance?: number; error?: string }> {
  const { data, error } = await supabase.rpc('guild_bank_deposit_currency', {
    p_player_id: playerId,
    p_guild_id: guildId,
    p_amount: amount
  })

  if (error) {
    console.error('Error depositing to bank:', error)
    return { success: false, error: 'Database error' }
  }

  return data as { success: boolean; new_balance?: number; error?: string }
}
```

### Zustand Store State Pattern (from gameStore.ts)
```typescript
// Source: apps/web/src/stores/gameStore.ts
// Guild bank state
guildBank: GuildBank | null
guildBankLogs: GuildBankLog[]
guildBankRequests: GuildBankRequest[]
setGuildBank: (bank: GuildBank | null) => void
setGuildBankLogs: (logs: GuildBankLog[]) => void
addGuildBankLog: (log: GuildBankLog) => void
setGuildBankRequests: (requests: GuildBankRequest[]) => void
```

### Modal Component Pattern (from TradeModal.tsx)
```typescript
// Source: apps/web/src/components/game/social/TradeModal.tsx
export function GuildBankModal({ isOpen, onClose }: GuildBankModalProps) {
  const [selectedTab, setSelectedTab] = useState<'currency' | 'items' | 'pokemon' | 'logs' | 'requests'>('currency')
  const [isVisible, setIsVisible] = useState(false)

  const guildBank = useGameStore((state) => state.guildBank)
  const myGuildRole = useGameStore((state) => state.myGuildRole)

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      gameSocket.getGuildBank()
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ... tab content based on selectedTab
}
```

### Shared Type Pattern (from guild.ts)
```typescript
// Source: packages/shared/src/types/guild.ts
export interface GuildBank {
  currency: {
    balance: number
    max_capacity: number
    contributors: { player_id: string; username: string; total: number }[]
  }
  items: GuildBankItem[]
  pokemon: GuildBankPokemon[]
  pokemon_slots: number
  pokemon_max_slots: number
}

export interface GuildBankLog {
  id: string
  player_id: string
  player_username: string
  action: 'deposit' | 'withdraw' | 'request_created' | 'request_fulfilled' | 'request_expired' | 'request_cancelled'
  category: 'currency' | 'item' | 'pokemon'
  details: Record<string, unknown>
  balance_after?: number
  created_at: string
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct SQL with RLS | SECURITY DEFINER functions | Established in 022_guilds.sql | Atomic operations, proper locking |
| REST API for real-time | WebSocket broadcast | From day 1 | Instant UI updates |
| Per-request auth | Session-cached guild info | Phase 1 | Reduced DB queries |

**Deprecated/outdated:**
- None relevant - this is a new feature building on established patterns

## Design Decisions (Claude's Discretion)

### Currency Cap Formula
**Recommendation:** Base 50,000 + 1,000 per member
- 1 member guild: 51,000 cap
- 50 member guild: 100,000 cap
- Scales linearly, simple to understand

### Pokemon Slot Expansion Pricing
**Recommendation:** Exponential scaling starting at 5,000
- First expansion (25 -> 35): 5,000
- Second expansion (35 -> 45): 10,000
- Third expansion (45 -> 55): 20,000
- Formula: 5000 * 2^(expansion_count)
- Hard cap at 500 slots

### BST Tier Boundaries for Pokemon Points
**Recommendation (Gen 1 balanced):**
| Tier | BST Range | Points | Examples |
|------|-----------|--------|----------|
| Common | < 300 | 1 | Rattata (253), Pidgey (251) |
| Uncommon | 300-399 | 2 | Pikachu (320), Raticate (413) |
| Rare | 400-499 | 5 | Alakazam (500), Machamp (505) |
| Very Rare | 500-579 | 10 | Dragonite (600 - edge) |
| Legendary | 580+ | 25 | Mewtwo (680), Mew (600) |

### Default Daily Limits
**Recommendation:**
- Officers: 10,000 currency, 20 items, 20 Pokemon points
- Members: 0 (cannot withdraw by default, must request)
- Leaders: Unlimited (no tracking needed)

### Log Entry Format
**Recommendation:** JSONB details with consistent schema
```json
{
  "amount": 1000,
  "item_id": "pokeball",
  "pokemon_id": "uuid",
  "pokemon_species_id": 25,
  "pokemon_name": "Pikachu",
  "request_id": "uuid",
  "note": "Optional context"
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Contribution Tracking Granularity**
   - What we know: Log all transactions, show "deposited by" on items
   - What's unclear: Should we track total contributions per member for display?
   - Recommendation: Add `contributor_totals` materialized view updated by trigger, low overhead

2. **Request Notification Delivery**
   - What we know: Officers need to see pending requests
   - What's unclear: Push notification vs poll vs badge counter
   - Recommendation: Badge counter on Requests tab (like guild invite count), no push for v1

3. **Pokemon Search/Filter Complexity**
   - What we know: UI needs search by name, filter by type/category
   - What's unclear: Server-side or client-side filtering for bank contents
   - Recommendation: Client-side for v1 (bank size capped at 500), add server-side if performance issues

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/022_guilds.sql` - Guild foundation patterns, SECURITY DEFINER examples
- `supabase/migrations/009_trades.sql` - Pokemon ownership transfer pattern
- `supabase/migrations/012_trade_history.sql` - Transaction logging pattern
- `apps/game-server/src/hub.ts` - WebSocket handler patterns, broadcastToGuild()
- `apps/game-server/src/db.ts` - Database query patterns, RPC calls
- `apps/web/src/stores/gameStore.ts` - Zustand state patterns
- `apps/web/src/components/game/social/TradeModal.tsx` - Modal UI pattern
- `packages/shared/src/types/guild.ts` - Existing guild types

### Secondary (MEDIUM confidence)
- `.planning/phases/04-guild-bank/04-CONTEXT.md` - User decisions and requirements
- `.planning/STATE.md` - Established patterns and decisions

### Tertiary (LOW confidence)
- None - all research based on codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing codebase libraries only
- Architecture: HIGH - Following established patterns from guild/trade systems
- Pitfalls: HIGH - Identified from existing code patterns and common distributed system issues
- UI patterns: HIGH - Direct reference to TradeModal, GuildPanel components

**Research date:** 2026-01-18
**Valid until:** Indefinite (based on stable codebase patterns, not external libraries)
