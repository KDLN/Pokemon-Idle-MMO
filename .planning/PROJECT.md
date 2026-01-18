# Pokemon Idle MMO - Guild Milestone

## What This Is

A guild system for Pokemon Idle MMO that transforms the solo idle experience into a social, cooperative game. Players can create or join guilds to share resources, complete quests together, purchase group buffs, and compete on leaderboards. This milestone also adds Cerulean City with Misty's Gym and Routes 24-25.

## Core Value

Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

## Requirements

### Validated

- ✓ Core idle loop (encounters, battles, catching, evolution) — existing
- ✓ Zone system with 11 zones through Route 4 — existing
- ✓ Friends system (add, remove, see online/zone) — existing
- ✓ Trading system (Pokemon trades between players) — existing
- ✓ Chat system (global, zone, trade, whispers, blocking) — existing
- ✓ Leaderboards (Pokedex, catches, levels) — existing
- ✓ IV system — existing
- ✓ Gym battles (Brock) — existing

### Active

- [ ] Guild creation with name/tag (50 member cap)
- [ ] Guild membership (join/leave)
- [ ] Guild roles (Leader, Officer, Member) with permissions
- [ ] Guild chat channel
- [ ] Guild invite system
- [ ] Guild bank (money deposits/withdrawals, role-based permissions)
- [ ] Guild bank items (potions, balls — role-based)
- [ ] Guild bank Pokemon (deposit/withdraw — role-based, all Pokemon allowed for now)
- [ ] Guild statistics (member count, total catches, levels)
- [ ] Guild leaderboard (rank guilds by activity/stats)
- [ ] Guild quests (weekly/daily shared goals)
- [ ] Guild shop (spend resources on member buffs)
- [ ] Cerulean City zone
- [ ] Misty's Gym (Water-type, Cascade Badge)
- [ ] Route 24 zone (Nugget Bridge)
- [ ] Route 25 zone (Bill's House area)
- [ ] Route 24-25 Pokemon (Bellsprout, Oddish, Abra, Slowpoke)

### Out of Scope

- Pokemon tradeable/non-tradeable flag system — needs admin panel, larger planning effort (future TODO)
- Guild raids — depends on raid system (Week 17+)
- Guild-only zones — future expansion
- Guild-exclusive Pokemon — future expansion
- Guild levels with passive buffs — consider for v2 after core works

## Context

**Technical Environment:**
- Monorepo: Next.js 16 frontend, Node.js WebSocket game server, Supabase PostgreSQL
- Real-time via WebSocket with 1-second tick loop
- Existing patterns: friends table, trades table, chat channels, leaderboard RPCs
- RLS policies scope all player data

**Existing Patterns to Follow:**
- Friends system for membership relationships
- Trade system for item/Pokemon transfers
- Chat channels for guild chat
- Leaderboard RPCs for guild rankings

**Known Considerations:**
- Guild bank needs careful permission system (WoW-style role hierarchy)
- Guild quests need tracking per-guild, not per-player
- Buffs need to apply during tick processing on server

## Constraints

- **Tech stack**: Must use existing Supabase + WebSocket architecture
- **Member cap**: 50 members per guild (per original roadmap)
- **Roles**: Leader > Officer > Member hierarchy
- **Pokemon deposits**: Allow all for now (admin panel for tags is future work)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Allow all Pokemon in guild bank | Admin tagging system needs more planning; trust players for now | — Pending |
| WoW-style role permissions | Familiar pattern, prevents abuse, scales well | — Pending |
| Guild quests weekly/daily | Creates regular engagement loop | — Pending |
| Include zones in milestone | Keeps content flowing alongside features | — Pending |

---
*Last updated: 2026-01-18 after initialization*
