# Project Research Summary

**Project:** Pokemon Idle MMO - Guild System
**Domain:** MMO Guild/Clan Systems (Idle Game Context)
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

The guild system for Pokemon Idle MMO is a well-understood domain with 20+ years of established patterns from WoW, Clash of Clans, and idle game predecessors like AFK Arena and Idle Heroes. The recommended approach is to leverage the existing codebase patterns entirely: the WebSocket hub, Supabase PostgreSQL with RLS, and Zustand state management already handle all the technical requirements. No new dependencies are needed. The architecture should follow the proven patterns from the friends system, trading system, and chat system already in the codebase.

The key risk is race conditions in the guild bank, which can cause item or Pokemon duplication. This is the most common and severe guild system exploit across MMO games. The existing trade system demonstrates the correct mitigation pattern with `FOR UPDATE` row locking and atomic database functions. All bank operations must follow this pattern from day one. Secondary risks include permission bypass during role changes and leadership transfer race conditions, both solvable with proper transaction design.

Build order should follow dependency chains: Core Schema (guilds, members) -> Membership Flow (invites, join/leave) -> Guild Chat (validates broadcast pattern) -> Guild Bank (complex, needs locking) -> Guild Quests (depends on tracking hooks) -> Guild Shop (depends on quest points). This order ensures each phase builds on verified foundation components.

## Key Findings

### Recommended Stack

The guild system requires no new dependencies. The existing stack handles all requirements.

**Core technologies:**
- **Supabase PostgreSQL**: Guild data storage with RLS policies for membership scoping (matches existing friends/trades patterns)
- **WebSocket (ws 8.18.0)**: Real-time guild events and chat via `broadcastToGuild()` pattern (extends existing hub.ts)
- **Database ENUMs**: `guild_role` (leader/officer/member), `guild_member_status` for clean state management (matches friend_status pattern)
- **Zustand**: Frontend guild state management with persistence (extends existing gameStore.ts)
- **SECURITY DEFINER functions**: Atomic guild operations like `create_guild`, `leave_guild`, `withdraw_from_bank` (matches complete_trade pattern)

### Expected Features

**Must have (table stakes):**
- Guild creation (name, tag, description, 50-member cap)
- Join/leave mechanics with invite system
- Member roster with online status and roles
- Three-tier roles: Leader, Officer, Member
- Guild chat channel (dedicated to members)
- Guild bank (currency and items) with role-based permissions
- Guild statistics and leaderboard

**Should have (competitive):**
- Daily/weekly guild quests ("catch 100 Water Pokemon")
- Guild shop spending bank funds on buffs
- Transaction logs for bank trust
- Withdrawal limits per role
- Guild Pokedex display

**Defer (v2+):**
- Guild levels and perks tree (complex balance)
- Guild bosses/raids (requires new battle system)
- Guild zones with exclusive spawns
- Seasonal rankings and achievements
- Guild Pokemon bank (high trust/abuse risk)

### Architecture Approach

The guild system extends existing patterns rather than introducing new ones. Core tables (`guilds`, `guild_members`) follow the friends/blocks schema pattern with ENUMs for status. A `broadcastToGuild(guildId)` method in hub.ts efficiently sends messages to online guild members using cached `session.guild.id`. Guild state loads on WebSocket connect and updates via targeted messages. Permission checks use simple numeric role levels (Member=1, Officer=2, Leader=3) with centralized helper functions.

**Major components:**
1. **Guild Tables** (guilds, guild_members, guild_join_requests, guild_invites) — Membership and configuration storage
2. **Guild Bank Tables** (guild_bank, guild_bank_log) — Item storage with audit trail
3. **Guild Activity Tables** (guild_quests, guild_quest_contributions, guild_shop_items) — Engagement loop mechanics
4. **WebSocket Handlers** — Message routing for all guild operations with permission validation
5. **PlayerSession.guild** — Cached guild state for O(1) membership checks

### Critical Pitfalls

1. **Guild Bank Race Conditions** — Use `FOR UPDATE` row locking and atomic UPDATE with quantity checks. Follow the `complete_trade` pattern in `009_trades.sql`. Never do SELECT-then-UPDATE for bank operations.

2. **Permission Bypass During Role Change** — Re-verify permissions inside the database transaction, not just at request start. Lock member row when checking role.

3. **Leadership Transfer Race Condition** — Add partial unique index: `CREATE UNIQUE INDEX ... ON guild_members(guild_id) WHERE role = 'leader'`. Lock both source and target member rows during transfer.

4. **Cascade Delete Destroys Bank** — Use `ON DELETE RESTRICT` on bank tables, not CASCADE. Guild deletion requires empty bank or explicit item return.

5. **Pokemon Multi-Location Bug** — If implementing guild Pokemon bank, add location state column or enum to prevent Pokemon existing in party, trade, and bank simultaneously.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Schema & Membership
**Rationale:** Everything depends on guilds and guild_members tables. Cannot test any feature without membership working.
**Delivers:** Create guild, join/leave, member roster, basic roles
**Addresses:** Foundation Layer features (creation, joining, roster, roles)
**Avoids:** Leadership race condition (add partial unique index from start)

### Phase 2: Invitations & Moderation
**Rationale:** Control who joins is essential before adding valuable features like bank
**Delivers:** Invite system, kick/ban, join requests, cooldowns
**Addresses:** Expected Expansion features (invite, officer role, kick/ban)
**Avoids:** Invitation spam (integrate with existing block system)

### Phase 3: Guild Chat
**Rationale:** Simpler than bank, validates the broadcastToGuild pattern before complex features
**Delivers:** Guild chat channel with persistence and history
**Addresses:** Foundation Layer (guild chat)
**Avoids:** Memory leak (use database persistence like existing chat)

### Phase 4: Guild Bank
**Rationale:** Core value proposition, but needs tested membership and broadcast patterns first
**Delivers:** Currency/item deposits, withdrawals, transaction logs
**Addresses:** Resource Sharing features (bank, logs, limits)
**Avoids:** Duplication exploit (FOR UPDATE locking), permission bypass (in-transaction role verification)

### Phase 5: Guild Quests
**Rationale:** Requires game event hooks (catch, battle) which need bank to store rewards
**Delivers:** Daily/weekly quests, automatic contribution tracking, progress display
**Addresses:** Engagement Loop features (quests, rewards)
**Uses:** Existing tick loop for contribution events

### Phase 6: Guild Shop & Leaderboard
**Rationale:** Shop spends quest points, leaderboard aggregates all prior activity
**Delivers:** Guild shop items, buff purchases, guild rankings
**Addresses:** Competition Layer and engagement loop completion
**Implements:** Points economy from quests -> shop spending

### Phase Ordering Rationale

- **Dependency chain:** Core -> Membership -> Chat -> Bank -> Quests -> Shop follows strict dependencies
- **Risk gradient:** Simpler features first (chat) before complex ones (bank with race conditions)
- **Pattern validation:** Chat validates broadcast pattern before bank relies on it
- **Value delivery:** Each phase delivers usable functionality even if later phases are delayed
- **Pitfall timing:** Database constraints (unique leader index, RESTRICT cascade) go in Phase 1 before any dependent code

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Guild Bank):** High-risk for race conditions. Recommend code review of trade system locking patterns before implementation.
- **Phase 5 (Guild Quests):** Quest definition and reward balance needs game design input. Research may need designer consultation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core Schema):** Well-documented, matches existing friends/trades migrations
- **Phase 2 (Invitations):** Standard pattern, existing friend request flow is template
- **Phase 3 (Guild Chat):** Existing chat system provides complete template

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Uses existing codebase patterns exclusively; no new dependencies |
| Features | HIGH | 20+ year mature design space; table stakes well-established across WoW, idle games |
| Architecture | HIGH | Based on direct analysis of existing codebase (hub.ts, db.ts, migrations) |
| Pitfalls | MEDIUM | Core pitfalls from training data; recommend validating bank race conditions against current resources |

**Overall confidence:** HIGH

### Gaps to Address

- **Guild Quests Balance:** Quest targets (e.g., "catch 100 Pokemon") and reward amounts need game designer input. Research identified the structure but not specific values.
- **Guild Shop Items:** What items/buffs to sell and at what point costs needs design validation. Consider starting with small set and expanding.
- **Pokemon Bank Deferral:** Guild Pokemon bank was flagged as high complexity and abuse risk. Confirm this deferral is acceptable or scope alternative implementation.
- **Multi-Server Future:** If scaling to multiple game servers, guild broadcasts need pub/sub (Redis) instead of in-memory. Current design assumes single server.

## Sources

### Primary (HIGH confidence)
- **Existing Codebase:**
  - `supabase/migrations/007_friends.sql` - Social table patterns, RLS policies
  - `supabase/migrations/009_trades.sql` - Atomic operations, FOR UPDATE locking, SECURITY DEFINER
  - `supabase/migrations/018_week5_social.sql` - Block system integration
  - `apps/game-server/src/hub.ts` - WebSocket broadcast patterns, session management
  - `apps/game-server/src/db.ts` - Query patterns, optimistic locking
  - `.planning/codebase/ARCHITECTURE.md` - System architecture reference

### Secondary (MEDIUM confidence)
- **Training Data:** Guild system patterns from WoW, Clash of Clans, AFK Arena, Idle Heroes
- **Game Design Principles:** Three-tier role hierarchy, bank withdrawal limits, daily/weekly quest cadence

### Tertiary (LOW confidence)
- **WebSearch unavailable:** Pitfall validations (especially bank race conditions) should be cross-referenced with 2025/2026 game development resources during implementation

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
