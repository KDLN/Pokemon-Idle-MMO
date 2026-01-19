---
phase: 06
plan: 01
subsystem: guild-shop
tags: [database, sql, buffs, statistics, leaderboard]

dependency-graph:
  requires:
    - 022_guilds.sql (guilds table)
    - 026_guild_bank.sql (guild_bank_currency, guild_bank_logs)
  provides:
    - Guild buff storage (guild_buffs table)
    - Guild buff purchases history (guild_buff_purchases table)
    - Guild points column on guilds table
    - Buff purchase function with currency/points payment
    - Statistics aggregation (catches, species, levels, pokemon count)
    - Leaderboard ranking by catches/pokedex/members
  affects:
    - 06-02 (shared types need buff type definitions)
    - 06-03 (game server needs buff query functions)
    - 06-04 (frontend needs shop UI)

tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER functions for atomic buff purchases
    - FOR UPDATE row locking for race condition prevention
    - Opportunistic cleanup pattern (expired buffs)
    - Window functions for leaderboard ranking
    - UPSERT for buff stacking logic

key-files:
  created:
    - supabase/migrations/028_guild_shop.sql
  modified: []

decisions:
  - key: buff-pricing
    choice: "Currency 1000/hr OR Guild Points 200/hr (5:1 ratio)"
    rationale: "Points are harder to earn from quests, should be more valuable"
  - key: buff-stacking
    choice: "Stack duration from current ends_at, cap at 24 hours total"
    rationale: "Allows multiple purchases while preventing indefinite buff duration"
  - key: statistics-aggregation
    choice: "Real-time aggregation via JOINs, no denormalized stats table"
    rationale: "Simpler implementation, indexes should provide adequate performance"
  - key: leaderboard-metrics
    choice: "Three metrics: catches, pokedex (unique species), members"
    rationale: "Cover different aspects of guild activity and engagement"

metrics:
  duration: "~2 minutes"
  completed: "2026-01-19"
---

# Phase 06 Plan 01: Guild Shop Database Schema Summary

Guild buff storage, statistics aggregation, and leaderboard ranking database infrastructure.

## What Was Built

### Tables Created

1. **guild_buffs** - Active buff storage with one buff per type per guild
   - Buff types: xp_bonus, catch_rate, encounter_rate
   - Multiplier (1.10 = +10%), started_at, ends_at timestamps
   - Unique constraint on (guild_id, buff_type)

2. **guild_buff_purchases** - Purchase history for auditing
   - Tracks duration, cost_currency, cost_guild_points
   - Links to purchasing player

### Schema Modifications

- Added `guild_points` column to guilds table (INT DEFAULT 0)

### Functions Created

1. **purchase_guild_buff()** - SECURITY DEFINER atomic purchase
   - Validates leader/officer role
   - Accepts currency OR guild points payment
   - Handles buff stacking with 24h cap
   - Records purchase history and bank logs

2. **get_active_guild_buffs()** - Returns current buffs for tick processing
   - Keyed by buff_type (xp_bonus, catch_rate, encounter_rate)
   - Includes multiplier and ends_at for each

3. **get_guild_statistics()** - Comprehensive guild stats
   - total_catches, unique_species, member_count
   - avg_level, total_pokemon, days_active
   - guild_points, bank_balance, active_buffs

4. **get_guild_leaderboard()** - Ranked guild listing
   - Supports catches, pokedex, members metrics
   - Returns top 50 (configurable) with rank, value, leader_name

5. **get_player_guild_rank()** - Player's guild rank for a metric
   - Returns rank and value for player's guild

6. **cleanup_expired_buffs()** - Opportunistic cleanup
   - Called at start of purchase_guild_buff and get_active_guild_buffs

### Indexes

- `idx_guild_buffs_guild_ends` - Fast active buff lookups
- `idx_guild_buff_purchases_guild` - Purchase history queries
- `idx_players_guild_id` - Leaderboard member joins
- `idx_pokedex_player_caught` - Pokedex statistics

### RLS Policies

- Guild members can SELECT buffs and purchases
- All direct INSERT/UPDATE/DELETE blocked (force function use)

## Technical Decisions

### Buff Pricing Structure
- **Currency**: 1000 per hour (from guild bank)
- **Guild Points**: 200 per hour (earned from quests)
- Ratio of 5:1 makes guild points more valuable

### Buff Stacking Behavior
- New purchase extends from current ends_at (if active)
- Maximum cap of 24 hours from NOW()
- Prevents indefinite buff accumulation

### Statistics Computation
- Real-time aggregation using JOINs through guild_members
- No denormalized stats table needed
- Indexes on guild_id and caught status for performance

## Deviations from Plan

None - plan executed exactly as written. All three tasks were effectively combined since they targeted the same migration file.

## Verification Results

- Migration file: 549 lines (exceeds 300 minimum)
- Contains guild_buffs and guild_buff_purchases tables
- Contains purchase_guild_buff with role check, currency/points deduction, stacking, 24h cap
- Contains get_active_guild_buffs for tick processing
- Contains get_guild_statistics with all required metrics
- Contains get_guild_leaderboard with catches/pokedex/members metrics
- Has RLS policies and 4 indexes
- Has GRANT statements for all functions

## Commits

| Hash | Message |
|------|---------|
| 1cbb547 | feat(06-01): create guild shop database schema |

## Next Steps

- 06-02: Add shared TypeScript types for buffs, shop, statistics
- 06-03: Add game server handlers and buff application in tick
- 06-04: Create frontend shop and statistics UI
