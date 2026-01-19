# Pokemon Idle MMO

## What This Is

A web-based idle MMO where players deploy trainers to catch Pokemon, with a complete guild system for social cooperation. Players can create or join guilds to share resources via a guild bank, complete daily/weekly quests together, purchase group buffs, and compete on leaderboards. The game world includes zones from Pallet Town through Cerulean City with two gym leaders (Brock, Misty).

## Core Value

Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

## Requirements

### Validated

- ✓ Core idle loop (encounters, battles, catching, evolution) — existing
- ✓ Zone system with 14 zones (Pallet Town through Route 25) — v1.0
- ✓ Friends system (add, remove, see online/zone) — existing
- ✓ Trading system (Pokemon trades between players) — existing
- ✓ Chat system (global, zone, trade, guild, whispers, blocking) — v1.0
- ✓ Leaderboards (Pokedex, catches, levels) — existing
- ✓ IV system — existing
- ✓ Gym battles (Brock, Misty) — v1.0
- ✓ Guild creation with name/tag (50 member cap) — v1.0
- ✓ Guild membership (join/leave with 24hr cooldown) — v1.0
- ✓ Guild roles (Leader, Officer, Member) with permissions — v1.0
- ✓ Guild chat channel with role badges — v1.0
- ✓ Guild invite system (open/invite-only/closed modes) — v1.0
- ✓ Guild bank currency (deposit/withdraw, role-based permissions) — v1.0
- ✓ Guild bank items (potions, balls, role-based limits) — v1.0
- ✓ Guild bank Pokemon (deposit/withdraw, point costs, slot expansion) — v1.0
- ✓ Guild bank audit logging (all transactions tracked) — v1.0
- ✓ Guild quests (daily/weekly, catch/battle/evolve types) — v1.0
- ✓ Guild shop (XP, catch rate, encounter rate buffs) — v1.0
- ✓ Guild statistics (catches, species, members, age) — v1.0
- ✓ Guild leaderboard (top 50 by catches/Pokedex/members) — v1.0
- ✓ Cerulean City zone — v1.0
- ✓ Misty's Gym (Water-type, Cascade Badge, requires Boulder Badge) — v1.0
- ✓ Route 24 zone (Nugget Bridge) — v1.0
- ✓ Route 25 zone (Bill's House area) — v1.0

### Active

**v1.1 UI/UX Polish & Design System**

- [ ] Bug fixes (Guild Quest contributors, Guild Bank view toggle)
- [ ] Design system (colors, typography, spacing, component patterns)
- [ ] Layout improvements (activity log, party display, responsive sizing)
- [ ] UI improvements (navigation order, Boosts rename, bank display, drag-reorder party)
- [ ] Map overhaul (visual styling, interactions, zone connections)
- [ ] Battle system rework (real-time calculation, turn-by-turn reveal)
- [ ] Theme exploration page (component showcase, mock screens, side-by-side comparison)

### Out of Scope

- Pokemon tradeable/non-tradeable flag system — needs admin panel, larger planning effort
- Guild raids — depends on raid system (future milestone)
- Guild-only zones — future expansion
- Guild-exclusive Pokemon — FOMO concerns, bad UX
- Guild levels with passive buffs — consider for v2 after observing v1 usage
- Complex role hierarchies (4+ tiers) — 3 roles sufficient, more is confusing
- Voice chat integration — excludes players, accessibility concerns

## Context

**Current State (v1.0 shipped):**
- Monorepo: Next.js 16 frontend, Node.js WebSocket game server, Supabase PostgreSQL
- 48,032 lines of TypeScript/SQL across 140+ files
- Real-time via WebSocket with 1-second tick loop
- 21 database tables for guild system, 58 database functions
- 50+ WebSocket message handlers for guild operations

**Tech Stack:**
- Frontend: Next.js 16, React 19, Zustand, Tailwind CSS 4
- Backend: Node.js, TypeScript, ws (WebSocket), jose (JWT)
- Database: Supabase PostgreSQL with RLS policies
- Deployment: Vercel (frontend), Railway (game server), Supabase (database)

**Patterns Established:**
- SECURITY DEFINER functions for atomic guild operations with FOR UPDATE locking
- Cached guild buffs with 5-second TTL for efficient tick processing
- Fire-and-forget WebSocket handlers (no await blocking tick loop)
- Role-based UI visibility computed per-component

## Constraints

- **Tech stack**: Must use existing Supabase + WebSocket architecture
- **Member cap**: 50 members per guild
- **Roles**: Leader > Officer > Member hierarchy (3 tiers max)
- **Pokemon deposits**: Allow all for now (admin tagging system is future work)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Allow all Pokemon in guild bank | Admin tagging system needs more planning; trust players for now | ✓ Good — works, no issues |
| WoW-style role permissions | Familiar pattern, prevents abuse, scales well | ✓ Good — intuitive UX |
| SECURITY DEFINER functions for bank | Atomic operations with proper permission checks | ✓ Good — secure, reliable |
| 5-second buff cache TTL | Balance freshness with performance | ✓ Good — minimal DB calls |
| Fire-and-forget quest progress | Don't block tick loop for quest updates | ✓ Good — no latency impact |
| Dedicated guild_messages table | Better RLS isolation than shared chat with filter | ✓ Good — clean separation |
| Denormalized member_count | Avoid COUNT(*) on every join attempt | ✓ Good — fast queries |
| BST-based Pokemon point costs | Balanced for Gen 1 range, legendary tier at 580 | ✓ Good — fair trading |
| Misty requires Boulder Badge | Matches Gen 1 progression | ✓ Good — familiar flow |

---
*Last updated: 2026-01-19 after starting v1.1 milestone*
