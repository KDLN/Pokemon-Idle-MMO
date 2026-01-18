# Domain Pitfalls: Guild System

**Domain:** Guild systems for MMO games
**Researched:** 2026-01-18
**Confidence:** MEDIUM (based on training data, patterns observed in codebase)

---

## Critical Pitfalls

Mistakes that cause exploits, data loss, or require major rewrites.

### Pitfall 1: Guild Bank Race Conditions (Item/Pokemon Duplication)

**What goes wrong:** Two members withdraw the same item simultaneously. Without proper locking, both withdrawals succeed, duplicating the item. This is the most common and severe guild system exploit.

**Why it happens:**
- Read-then-write pattern without row locking
- Optimistic locking without proper conflict handling
- No transaction isolation between concurrent requests

**Consequences:**
- Item/currency/Pokemon duplication
- Economic collapse if exploited at scale
- Requires rollback and compensation
- Player trust damage

**Warning signs:**
- Bank operations using `SELECT` followed by separate `UPDATE`
- No `FOR UPDATE` clause when reading bank contents
- No unique constraints preventing duplicate withdrawals
- Application-level quantity checks instead of database-level

**Prevention:**
1. Use database transactions with `FOR UPDATE` row locking (the project's `complete_trade` function demonstrates this pattern correctly)
2. Use atomic operations: `UPDATE ... WHERE quantity >= requested RETURNING *`
3. Add unique constraints on pending withdrawal transactions
4. Consider a withdrawal queue with serialized processing

**Codebase reference:** The existing trade system in `009_trades.sql` lines 159-287 shows the correct pattern:
```sql
-- Lock the trade row for update
SELECT * INTO v_trade FROM trades WHERE trade_id = p_trade_id FOR UPDATE;
-- Lock all Pokemon involved
PERFORM id FROM pokemon WHERE id = ANY(...) FOR UPDATE;
```

**Phase to address:** Phase 1 (Guild Bank Implementation) - Must be correct from the start

---

### Pitfall 2: Permission Bypass via Role Modification During Action

**What goes wrong:** Officer starts a bank withdrawal, gets demoted to Member mid-operation, withdrawal still completes with Officer privileges.

**Why it happens:**
- Permission checked at request start but not enforced at execution
- Role cached in session, not re-verified in transaction
- No row-level locking on member role during permission-gated operations

**Consequences:**
- Unauthorized bank access
- Kicked members completing privileged actions
- Privilege escalation attacks

**Warning signs:**
- Permission check happens in application code before database operation
- Role lookups not part of the same transaction as the privileged action
- Member table not locked when reading role for permission check

**Prevention:**
1. Re-verify permissions inside the database transaction
2. Lock the member row when checking permissions
3. Use database functions (like `complete_trade`) that verify ownership atomically

**Example pattern:**
```sql
CREATE FUNCTION withdraw_from_guild_bank(p_member_id UUID, p_item_id UUID, p_quantity INT)
RETURNS JSON AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Lock member row and verify permission in same transaction
  SELECT * INTO v_member FROM guild_members
  WHERE id = p_member_id FOR UPDATE;

  IF v_member.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- Now perform withdrawal (member role is locked)
  ...
END;
$$ LANGUAGE plpgsql;
```

**Phase to address:** Phase 1 (Permissions) - Fundamental to all privileged operations

---

### Pitfall 3: Leadership Transfer Creates Leaderless or Multi-Leader Guild

**What goes wrong:** Leader transfers leadership while being kicked, or two leadership transfers happen simultaneously. Guild ends up with zero leaders or two leaders.

**Why it happens:**
- Leadership transfer and kick operations not mutually exclusive
- No unique constraint on "leader" role within guild
- Concurrent operations on same member record

**Consequences:**
- Leaderless guilds become permanently stuck
- Multi-leader guilds have conflicting permissions
- Requires manual admin intervention

**Warning signs:**
- No `UNIQUE` constraint on `(guild_id) WHERE role = 'leader'`
- Leadership transfer doesn't lock the member table
- No check for "is this person still the leader" in the transfer function

**Prevention:**
1. Add partial unique index: `CREATE UNIQUE INDEX idx_one_leader_per_guild ON guild_members(guild_id) WHERE role = 'leader'`
2. Use `FOR UPDATE` on both source and target member rows during transfer
3. Validate current_leader_id in the transfer function
4. Consider a separate `leader_id` column on guilds table for clarity

**Phase to address:** Phase 1 (Guild CRUD) - Schema design

---

### Pitfall 4: Pokemon Ownership Verification Failure in Guild Bank

**What goes wrong:** Player deposits Pokemon they don't own (from trade, or already deposited elsewhere). Pokemon gets duplicated or orphaned.

**Why it happens:**
- Deposit checks `owner_id` but another operation changes ownership between check and deposit
- Pokemon can be in multiple places simultaneously (party, trade offer, guild bank)
- No mutual exclusion between Pokemon location states

**Consequences:**
- Pokemon duplication
- Pokemon disappearing from legitimate owner
- Data integrity violations

**Warning signs:**
- Deposit operation doesn't lock Pokemon row
- No constraint preventing Pokemon from being in multiple locations
- Application-level ownership check separate from database update

**Prevention:**
1. Lock Pokemon row before deposit: `SELECT * FROM pokemon WHERE id = ? AND owner_id = ? FOR UPDATE`
2. Add state column: `location_type ENUM('party', 'box', 'trade', 'guild_bank')`
3. Use optimistic locking with version column
4. Consider: Pokemon in guild bank might need different ownership model (guild owns it vs player deposits it)

**Project-specific consideration:** The existing Pokemon table uses `party_slot` to indicate party membership. Similar pattern needed for guild bank. May need `guild_bank_id` FK or location enum.

**Phase to address:** Phase 1 (Guild Bank) - Critical for bank design

---

### Pitfall 5: Cascade Delete Destroys Guild Bank Contents

**What goes wrong:** Guild is deleted, `ON DELETE CASCADE` wipes all bank contents including rare Pokemon, with no recovery path.

**Why it happens:**
- Foreign key cascade seems convenient during development
- No consideration for "what happens to valuable items"
- No soft-delete pattern

**Consequences:**
- Permanent data loss
- Player rage (lost their best Pokemon)
- No audit trail

**Warning signs:**
- `REFERENCES guilds(id) ON DELETE CASCADE` on bank tables
- No `deleted_at` column for soft deletes
- No pre-delete hook to return items to members

**Prevention:**
1. Use `ON DELETE RESTRICT` instead of CASCADE for bank tables
2. Implement soft-delete with `deleted_at` timestamp
3. Guild deletion should require empty bank (or return all items to members)
4. Consider "guild dissolution" process that's separate from deletion

**Phase to address:** Phase 1 (Schema Design) - Must be correct from the start

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or poor user experience.

### Pitfall 6: N+1 Queries on Guild Member List

**What goes wrong:** Loading guild member list queries each member's details individually. With 50 members, that's 50+ queries per page load.

**Why it happens:**
- Simple implementation fetches guild, then loops through member IDs
- ORM hides the actual query pattern
- Works fine with 5 members, breaks with 50

**Consequences:**
- Slow guild panel load times
- Database connection pool exhaustion
- Poor UX

**Warning signs:**
- Code like `for member in members: fetch_player_details(member.player_id)`
- Guild page loads noticeably slower as membership grows
- Database logs show many similar queries in quick succession

**Prevention:**
1. Use JOINs: `SELECT ... FROM guild_members gm JOIN players p ON gm.player_id = p.id`
2. Batch queries: `WHERE player_id IN (...)`
3. Test with maximum member count (50) during development

**Codebase reference:** The existing `getFriendsList` function in `db.ts` shows proper JOIN pattern with Supabase.

**Phase to address:** Phase 1 (Guild Read Operations) - Performance consideration from the start

---

### Pitfall 7: Inactive Guild Clogging Name Space and Resources

**What goes wrong:** Guild created, leader quits playing, guild sits forever consuming the unique name and showing in searches.

**Why it happens:**
- No activity tracking
- No automatic cleanup mechanism
- Guild names are globally unique

**Consequences:**
- Players can't create guilds with desired names
- Guild search filled with dead guilds
- Wasted database storage

**Warning signs:**
- Complaints about "name taken" for seemingly dead guilds
- Guild search returns guilds with no recent activity
- No `last_active_at` column on guilds table

**Prevention:**
1. Track `last_active_at` on guild (update on any member action)
2. Implement inactivity warnings (email/notification to leader)
3. Automatic leadership transfer to most active member after X days
4. Eventually archive/dissolve truly dead guilds (after warnings)
5. Consider releasing guild names after extended inactivity

**Phase to address:** Phase 2 or later - Can be added after core functionality works

---

### Pitfall 8: Invitation Spam and Harassment

**What goes wrong:** Guilds can invite any player repeatedly. Used for harassment or just annoying random players.

**Why it happens:**
- No cooldown on invitations
- No per-player rate limiting
- No player preference to block invites

**Consequences:**
- Player harassment
- Notification spam
- Support tickets

**Warning signs:**
- Players complaining about repeated invites from same guild
- No `invited_at` tracking for cooldowns
- No player setting to disable guild invites

**Prevention:**
1. Track pending invitations with timestamps
2. Limit invites per guild per player per time period (e.g., 1 per week per player)
3. Add player setting: "accept guild invites: all / friends only / none"
4. Integrate with existing block system (blocked players can't send guild invites)

**Codebase reference:** The existing block system in `db.ts` (`isPlayerBlocked` function) should be respected by guild invites.

**Phase to address:** Phase 2 (Invitations) - Important for social health

---

### Pitfall 9: Guild Chat Memory Leak in WebSocket Hub

**What goes wrong:** Guild chat messages stored in memory per-guild, never cleaned up. Server memory grows indefinitely.

**Why it happens:**
- Simple array/object to store recent messages
- No TTL or size limit
- Active guilds accumulate thousands of messages in memory

**Consequences:**
- Server OOM crash
- Increasing memory usage over time
- Eventually affects all players

**Warning signs:**
- Server memory usage grows over days/weeks
- Guild chat implementation uses in-memory storage
- No cleanup interval or size limits

**Prevention:**
1. Use ring buffer with fixed size for recent messages
2. Persist to database (like existing chat_messages table)
3. Only keep last N messages in memory per guild
4. Clear guild chat state when all members disconnect

**Codebase reference:** The existing chat system uses database persistence (`saveChatMessage` in `db.ts`). Guild chat should follow the same pattern.

**Phase to address:** Phase 2 (Guild Chat) - If implementing guild-specific chat

---

### Pitfall 10: Permission Complexity Explosion

**What goes wrong:** Started with 3 roles, now has 15 individual permissions, role editor, permission inheritance... system becomes unmaintainable.

**Why it happens:**
- "Just add one more permission" repeated many times
- Different members want different levels of access
- Copying WoW's full permission system without their development resources

**Consequences:**
- Complex UI nobody understands
- Bugs in permission edge cases
- Leaders can't figure out how to configure guild

**Warning signs:**
- More than 5-7 distinct permissions
- Permission inheritance or hierarchy
- Per-member permission overrides
- "Permission matrix" in the UI

**Prevention:**
1. Start with exactly 3 roles: Leader, Officer, Member
2. Each role has fixed, documented permissions (not configurable)
3. Resist requests to add more roles or per-permission toggles
4. If you must expand, do it much later when you understand actual needs

**Recommended fixed permissions:**
- **Leader:** All permissions (dissolve guild, promote to officer, demote officers, change MOTD, manage bank)
- **Officer:** Invite members, kick members, withdraw from bank, edit MOTD
- **Member:** Deposit to bank, chat, view member list

**Phase to address:** Phase 1 (Permissions) - Keep it simple from the start

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major refactoring.

### Pitfall 11: Guild Name Validation Edge Cases

**What goes wrong:** Guild names with special characters, unicode, excessive length, or offensive content get through.

**Why it happens:**
- Basic validation only (non-empty, max length)
- No profanity filter
- Unicode homoglyphs allow "duplicate" names

**Consequences:**
- Offensive guild names
- Names that break UI layout
- "Different" names that look identical

**Prevention:**
1. Character whitelist: alphanumeric + spaces only, or explicit allowed special chars
2. Length limits: 3-24 characters (matches existing username constraints)
3. Profanity filter (can reuse if one exists for usernames)
4. Consider ASCII-only to avoid homoglyph issues
5. Trim whitespace, collapse multiple spaces

**Phase to address:** Phase 1 (Guild Creation) - Simple validation

---

### Pitfall 12: No Guild Activity Log / Audit Trail

**What goes wrong:** "Who took that item from the bank?" "When did X get kicked?" Nobody knows.

**Why it happens:**
- Logs seem unnecessary during development
- Adds complexity to every operation
- Not visible to end users initially

**Consequences:**
- Cannot resolve disputes
- Cannot investigate exploits
- Lost institutional knowledge

**Prevention:**
1. Create `guild_activity_log` table from the start
2. Log: joins, leaves, kicks, promotions, demotions, bank deposits, bank withdrawals, leadership transfers
3. Include: timestamp, actor_id, target_id (if applicable), action_type, details_json
4. Expose to leader/officers in UI

**Schema suggestion:**
```sql
CREATE TABLE guild_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) NOT NULL,
  actor_id UUID REFERENCES players(id),  -- NULL for system actions
  action_type TEXT NOT NULL,  -- 'join', 'leave', 'kick', 'promote', 'bank_deposit', etc.
  target_id UUID,  -- player or item involved
  details JSONB,  -- additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Phase to address:** Phase 1 (All operations) - Add logging from the start

---

### Pitfall 13: Bank Tab/Slot Limits Not Enforced at Database Level

**What goes wrong:** Application limits bank to 100 slots, but no database constraint. Bug or exploit allows 1000 items in bank.

**Why it happens:**
- Limits enforced in application code only
- Database designed for flexibility
- "We'll add the constraint later"

**Consequences:**
- Exceeds intended capacity
- UI breaks with too many items
- Unfair advantage for exploiters

**Prevention:**
1. Add CHECK constraint or trigger on bank tables
2. Or use explicit slot model: `bank_slots` table with fixed number of rows per guild
3. Enforce limits in both application AND database

**Phase to address:** Phase 1 (Guild Bank) - Schema design

---

### Pitfall 14: Member Count Race Condition on Join

**What goes wrong:** Guild at 49/50 members. Two players join simultaneously. Guild ends up with 51 members.

**Why it happens:**
- Count checked, then insert happens separately
- No lock on guild row during join
- Unique constraint can't prevent this (members are different players)

**Prevention:**
1. Lock guild row before counting: `SELECT * FROM guilds WHERE id = ? FOR UPDATE`
2. Use CHECK constraint with trigger that counts members
3. Or use advisory lock on guild ID

**Phase to address:** Phase 1 (Join Operations) - Important for cap enforcement

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Guild CRUD | Leadership transfer race condition | Partial unique index on leader role, row locking |
| Guild CRUD | Cascade delete destroys bank | Use RESTRICT, implement dissolution process |
| Permissions | Permission bypass during demotion | Verify role inside transaction |
| Permissions | Complexity explosion | Fixed 3-role system, resist expansion |
| Guild Bank | Item duplication | FOR UPDATE locking, atomic operations |
| Guild Bank | Pokemon multi-location | Location enum or state column |
| Invitations | Spam/harassment | Rate limits, integrate with block system |
| Member Management | Count race condition | Lock guild row before counting |
| Guild Chat | Memory leak | Use database persistence like existing chat |

---

## Sources

- **Codebase analysis:** Examined existing trade system (`009_trades.sql`), friends system (`007_friends.sql`), and database patterns in `db.ts`
- **Training data:** Common MMO guild system issues from game development discussions (MEDIUM confidence - not verified with 2025/2026 sources due to WebSearch unavailability)

**Note:** WebSearch was unavailable during this research. Findings are based on codebase analysis and training knowledge. Recommend validating critical pitfalls (especially bank race conditions) against current game development resources during implementation.
