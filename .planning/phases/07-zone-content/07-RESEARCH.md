# Phase 7: Zone Content - Research

**Researched:** 2026-01-19
**Domain:** Zone system, encounter tables, gym leaders
**Confidence:** HIGH

## Summary

This phase adds Cerulean City, Misty's Gym, and Routes 24-25 to expand the game world. The research focused on understanding existing patterns in the codebase for:

1. **Zone creation** - zones table with type, encounter rate, and level range
2. **Zone connections** - bidirectional graph in zone_connections table
3. **Encounter tables** - weighted spawn rates per zone (must sum to 1.0)
4. **Gym leaders** - gym_leaders table with team in gym_leader_pokemon table
5. **Pokemon species** - All Gen 1 Pokemon already exist in 015_evolution_data.sql

The codebase has well-established patterns that should be followed exactly. No new systems need to be created - this is purely data seeding.

**Primary recommendation:** Create a single SQL migration (030_cerulean_city.sql) following the exact patterns established in migrations 014-020.

## Standard Stack

### Core
| Table | Purpose | Pattern Source |
|-------|---------|----------------|
| zones | Location definitions | 002_seed_data.sql, 014_pewter_city.sql |
| zone_connections | Navigation graph (bidirectional) | 002_seed_data.sql, 016_route_3.sql |
| encounter_tables | Pokemon spawns per zone | 002_seed_data.sql, 016_route_3.sql |
| gym_leaders | Gym leader data | 005_gym_leaders.sql |
| gym_leader_pokemon | Gym leader teams | 005_gym_leaders.sql |
| pokemon_species | Pokemon data (already complete) | 015_evolution_data.sql |

### Current Zone IDs
| ID | Zone Name | Type |
|----|-----------|------|
| 1 | Pallet Town | town |
| 2 | Route 1 | route |
| 3 | Viridian City | town |
| 4 | Route 2 South | route |
| 5 | Viridian Forest | route |
| 6 | Route 2 North | route |
| 7 | Pewter City | town |
| 8 | Route 3 | route |
| 9 | Mt. Moon Entrance | route |
| 10 | Mt. Moon | route |
| 11 | Route 4 | route |

### New Zone IDs (Phase 7)
| ID | Zone Name | Type | Connect From | Notes |
|----|-----------|------|--------------|-------|
| 12 | Cerulean City | town | Route 4 (11), Route 24 (13) | Hub town |
| 13 | Route 24 | route | Cerulean City (12), Route 25 (14) | Nugget Bridge |
| 14 | Route 25 | route | Route 24 (13) | Bill's House area |

## Architecture Patterns

### Zone Definition Pattern
```sql
-- Source: 016_route_3.sql, 020_week6_leaderboards_route4.sql
INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (12, 'Cerulean City', 'town', 0.0000, 1, 1),  -- Towns have 0 encounter rate
  (13, 'Route 24', 'route', 0.0333, 16, 20),    -- ~3.3% per tick standard
  (14, 'Route 25', 'route', 0.0333, 16, 20)
ON CONFLICT (id) DO NOTHING;

-- Always update sequence after manual ID insertion
SELECT setval('zones_id_seq', GREATEST(14, (SELECT MAX(id) FROM zones)), true);
```

### Zone Connection Pattern (Bidirectional)
```sql
-- Source: 016_route_3.sql
-- CRITICAL: Always create BOTH directions for navigation
INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (11, 12),  -- Route 4 -> Cerulean City
  (12, 11),  -- Cerulean City -> Route 4
  (12, 13),  -- Cerulean City -> Route 24
  (13, 12),  -- Route 24 -> Cerulean City
  (13, 14),  -- Route 24 -> Route 25
  (14, 13)   -- Route 25 -> Route 24
ON CONFLICT DO NOTHING;
```

### Encounter Table Pattern
```sql
-- Source: 016_route_3.sql
-- CRITICAL: Rates MUST sum to 1.0 (100%)
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (13, 69, 0.20),   -- Bellsprout 20% (Grass/Poison)
  (13, 43, 0.20),   -- Oddish 20% (Grass/Poison)
  (13, 63, 0.15),   -- Abra 15% (Psychic) - rare, high value
  (13, 79, 0.15),   -- Slowpoke 15% (Water/Psychic)
  (13, 48, 0.15),   -- Venonat 15% (Bug/Poison)
  (13, 16, 0.15)    -- Pidgey 15% (Normal/Flying) - route staple
ON CONFLICT DO NOTHING;
```

### Gym Leader Pattern
```sql
-- Source: 005_gym_leaders.sql
INSERT INTO gym_leaders (
  id, name, title, badge_id, badge_name, specialty_type, zone_id,
  dialog_intro, dialog_win, dialog_lose,
  reward_money, reward_badge_points, required_badges
) VALUES (
  'misty',
  'Misty',
  'The Tomboyish Mermaid',
  'cascade',
  'Cascade Badge',
  'Water',
  12,  -- Cerulean City
  'Hi, you''re a new face. Let me tell you, my policy is an all-out offensive with Water-type Pokemon!',
  'Wow! You''re too much, all right! You can have the Cascade Badge to show that you beat me.',
  'That was too close! You''ll need stronger Pokemon to beat me!',
  2100,  -- Brock gives 1200, scale up
  100,
  '{boulder}'  -- Requires Boulder Badge (progression gate)
) ON CONFLICT (id) DO UPDATE SET
  zone_id = EXCLUDED.zone_id;

-- Misty's team (Gen 1 games: Staryu Lv18, Starmie Lv21)
INSERT INTO gym_leader_pokemon (gym_leader_id, species_id, level, slot) VALUES
  ('misty', 120, 18, 1),  -- Staryu Lv18
  ('misty', 121, 21, 2)   -- Starmie Lv21
ON CONFLICT (gym_leader_id, slot) DO UPDATE SET
  species_id = EXCLUDED.species_id,
  level = EXCLUDED.level;
```

### Pokemon Species IDs (Required)
All Pokemon already exist in 015_evolution_data.sql:
| ID | Name | Type | Notes |
|----|------|------|-------|
| 16 | Pidgey | Normal/Flying | Route staple |
| 43 | Oddish | Grass/Poison | Route 24-25 |
| 48 | Venonat | Bug/Poison | Route 24-25 |
| 63 | Abra | Psychic | Rare spawn |
| 69 | Bellsprout | Grass/Poison | Route 24-25 |
| 79 | Slowpoke | Water/Psychic | Route 24-25 |
| 120 | Staryu | Water | Misty's team |
| 121 | Starmie | Water/Psychic | Misty's ace |

## Don't Hand-Roll

Problems with existing solutions - use established patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zone navigation | Custom pathfinding | zone_connections bidirectional graph | Existing UI/logic handles it |
| Spawn rates | New encounter system | encounter_tables with 1.0 sum | Game server already queries this |
| Gym progression | Custom badge tracking | required_badges array on gym_leaders | Existing validation in game server |
| Pokemon stats | New species data | pokemon_species from 015_evolution_data.sql | All Gen 1 already seeded |

**Key insight:** This phase is pure data seeding. The game server, frontend, and database schema are already built to handle new zones, encounters, and gyms.

## Common Pitfalls

### Pitfall 1: Encounter Rates Not Summing to 1.0
**What goes wrong:** Wild Pokemon spawns become unbalanced or throw errors
**Why it happens:** Forgetting that encounter_rate is a weighted probability
**How to avoid:** Always verify rates sum to exactly 1.0 before inserting
**Warning signs:** Add a verification query at end of migration:
```sql
SELECT z.name, SUM(et.encounter_rate) as total_rate
FROM encounter_tables et
JOIN zones z ON et.zone_id = z.id
WHERE z.name IN ('Route 24', 'Route 25')
GROUP BY z.name;
-- Should show 1.0000 for each
```

### Pitfall 2: One-Way Zone Connections
**What goes wrong:** Players can travel to a zone but not back
**Why it happens:** Forgetting bidirectional inserts
**How to avoid:** Always insert BOTH (A->B) AND (B->A) for every connection
**Warning signs:** Test navigation in both directions after deployment

### Pitfall 3: Sequence ID Conflicts
**What goes wrong:** Next auto-generated zone ID conflicts with manually set IDs
**Why it happens:** Not updating zones_id_seq after manual ID inserts
**How to avoid:** Always call `setval('zones_id_seq', ...)` after zone inserts
**Warning signs:** Duplicate key errors on future zone inserts

### Pitfall 4: Missing Badge Prerequisites
**What goes wrong:** Players can fight Misty before Brock
**Why it happens:** Forgetting to set required_badges array
**How to avoid:** Set `required_badges = '{boulder}'` for Misty
**Warning signs:** New players beating gyms out of order

### Pitfall 5: Town Zones with Non-Zero Encounter Rate
**What goes wrong:** Random wild Pokemon encounters in towns
**Why it happens:** Copy-pasting route zone definition
**How to avoid:** Towns MUST have `base_encounter_rate = 0.0000`
**Warning signs:** Players reporting wild Pokemon in Cerulean City

## Code Examples

### Complete Migration Structure
```sql
-- Pokemon Idle MMO - Cerulean City Migration
-- Migration 030
-- Phase 7: Zone Content

-- ============================================
-- 1. ADD CERULEAN CITY ZONE
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (12, 'Cerulean City', 'town', 0.0000, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ADD ROUTE 24 (NUGGET BRIDGE)
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (13, 'Route 24', 'route', 0.0333, 16, 20)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. ADD ROUTE 25 (BILL'S HOUSE)
-- ============================================

INSERT INTO zones (id, name, zone_type, base_encounter_rate, min_level, max_level) VALUES
  (14, 'Route 25', 'route', 0.0333, 16, 20)
ON CONFLICT (id) DO NOTHING;

-- Update sequence
SELECT setval('zones_id_seq', GREATEST(14, (SELECT MAX(id) FROM zones)), true);

-- ============================================
-- 4. ADD ZONE CONNECTIONS (BIDIRECTIONAL)
-- ============================================

INSERT INTO zone_connections (from_zone_id, to_zone_id) VALUES
  (11, 12), (12, 11),  -- Route 4 <-> Cerulean City
  (12, 13), (13, 12),  -- Cerulean City <-> Route 24
  (13, 14), (14, 13)   -- Route 24 <-> Route 25
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ADD MISTY'S GYM
-- ============================================

INSERT INTO gym_leaders (...) VALUES ('misty', ...);
INSERT INTO gym_leader_pokemon (...) VALUES
  ('misty', 120, 18, 1),  -- Staryu
  ('misty', 121, 21, 2);  -- Starmie

-- ============================================
-- 6. ADD ENCOUNTER TABLES
-- ============================================

-- Route 24 (Rates sum to 1.0)
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (13, 69, 0.20), (13, 43, 0.20), (13, 63, 0.10),
  (13, 79, 0.15), (13, 48, 0.20), (13, 16, 0.15)
ON CONFLICT DO NOTHING;

-- Route 25 (Rates sum to 1.0)
INSERT INTO encounter_tables (zone_id, species_id, encounter_rate) VALUES
  (14, 69, 0.20), (14, 43, 0.20), (14, 63, 0.10),
  (14, 79, 0.15), (14, 48, 0.20), (14, 16, 0.15)
ON CONFLICT DO NOTHING;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual zone ID management | `ON CONFLICT DO NOTHING` + `setval()` | Migration 018+ | Idempotent migrations |
| Single direction connections | Bidirectional inserts | From start | Consistent navigation |
| Hardcoded badge checks | `required_badges` array | Migration 005 | Flexible progression |

**Deprecated/outdated:**
- None - patterns are consistent across all migrations

## Open Questions

1. **Route 24/25 Level Range**
   - What we know: Route 4 is levels 14-18, progression should increase
   - What's unclear: Exact level range for Routes 24-25
   - Recommendation: Use 16-20 (slight increase, matches Gen 1 games)

2. **Encounter Rate Distribution**
   - What we know: Required Pokemon are Bellsprout, Oddish, Abra, Slowpoke, Venonat, Pidgey
   - What's unclear: Exact rarity for each
   - Recommendation: Abra 10% (rare/valuable), others 15-20% each (common)

3. **Misty's Reward Scaling**
   - What we know: Brock gives 1200 money
   - What's unclear: Exact Misty rewards
   - Recommendation: 2100 money (scale up for second gym)

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/001_initial_schema.sql` - Table definitions
- `supabase/migrations/002_seed_data.sql` - Zone/encounter patterns
- `supabase/migrations/005_gym_leaders.sql` - Gym leader patterns
- `supabase/migrations/014_pewter_city.sql` - Town zone pattern
- `supabase/migrations/015_evolution_data.sql` - All Gen 1 Pokemon exist
- `supabase/migrations/016_route_3.sql` - Route zone pattern
- `supabase/migrations/020_week6_leaderboards_route4.sql` - Latest zone pattern

### Secondary (MEDIUM confidence)
- Gen 1 Pokemon games - Level ranges, Misty's team composition

### Tertiary (LOW confidence)
- None - all findings verified in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified in existing migrations
- Architecture patterns: HIGH - copied from existing migrations
- Pitfalls: HIGH - documented based on codebase constraints

**Research date:** 2026-01-19
**Valid until:** Indefinite (patterns are stable, data seeding only)
