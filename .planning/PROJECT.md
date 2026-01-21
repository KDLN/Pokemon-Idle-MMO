# Pokemon Idle MMO

## What This Is

A web-based idle MMO where players deploy trainers to catch Pokemon, with a complete guild system for social cooperation and polished UI/UX. Features include real-time progressive battles with animated turn-by-turn reveals, an interactive pan/zoom map with fog-of-war, drag-to-reorder party management, and a comprehensive design system with Storybook documentation. The game world spans 14 zones from Pallet Town through Cerulean City with two gym leaders (Brock, Misty).

## Core Value

Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

## Requirements

### Validated

**v1.0 — Guilds**
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

**v1.1 — UI/UX Polish**
- ✓ Bug fixes (Guild Quest contributors, Guild Bank view toggle) — v1.1
- ✓ Design system (colors, typography, spacing, component patterns) — v1.1
- ✓ CVA component variants for Button, Card, Badge — v1.1
- ✓ Storybook 10 documentation with interactive examples — v1.1
- ✓ 16px minimum body text with responsive clamp() typography — v1.1
- ✓ 44px minimum touch targets on all interactive elements — v1.1
- ✓ Responsive layouts for mobile (375px), tablet (768px), desktop (1280px+) — v1.1
- ✓ Navigation buttons ordered by travel direction — v1.1
- ✓ "Power-Ups" renamed to "Boosts" with countdown timers — v1.1
- ✓ Guild Bank Pokemon shows sprite and name — v1.1
- ✓ Guild Bank transaction logs with relative timestamps — v1.1
- ✓ Party drag-to-reorder with persistence and visual feedback — v1.1
- ✓ Interactive map with pan/zoom and fog-of-war — v1.1
- ✓ Zone connections visually clear with clickable paths — v1.1
- ✓ Progressive battle system (server-authoritative, turn-by-turn) — v1.1
- ✓ Catch calculated at throw moment (genuine uncertainty) — v1.1
- ✓ HP bars animate smoothly (0.4s transition) — v1.1
- ✓ Battle timeout protection (30 seconds) — v1.1
- ✓ Component showcase and theme comparison tools — v1.1

### Active

**v1.2 — Theme Finalization**

Apply the approved Modern theme layout and styling from MockGameScreen to the actual game.

- [ ] Two-sidebar layout (left: party/inventory, right: zone info/actions)
- [ ] Balanced center proportions (zone content constrained, social expanded)
- [ ] Modern theme color palette applied to all components
- [ ] Beveled button styling on action buttons
- [ ] Card and typography styling matches Modern theme
- [ ] Component updates (PartySidebar, ZoneView, ChatPanel)
- [ ] Cleanup MockGameScreen and theme-compare after migration

### Out of Scope

- Pokemon tradeable/non-tradeable flag system — needs admin panel, larger planning effort
- Guild raids — depends on raid system (future milestone)
- Guild-only zones — future expansion
- Guild-exclusive Pokemon — FOMO concerns, bad UX
- Guild levels with passive buffs — consider for v2 after observing v1 usage
- Complex role hierarchies (4+ tiers) — 3 roles sufficient, more is confusing
- Voice chat integration — excludes players, accessibility concerns
- Full mobile app — web-first, native mobile is separate project
- Complete theme redesign — theme exploration page first, full redesign in future milestone
- Sound/audio system — requires additional infrastructure, defer to v1.2+
- Battle move selection — idle game, battles are automatic
- Animated Pokemon sprites — asset complexity, stick with static for now

## Context

**Current State (v1.2 in progress):**
- Monorepo: Next.js 16 frontend, Node.js WebSocket game server, Supabase PostgreSQL
- 32,865 lines of TypeScript across 140+ files
- Real-time via WebSocket with 1-second tick loop
- Design system with CVA components, Storybook 10, semantic tokens
- Interactive map with react-zoom-pan-pinch, fog-of-war, calculated zone positions
- Progressive battle system with BattleManager server state, 800ms animation budget

**Tech Stack:**
- Frontend: Next.js 16, React 19, Zustand, Tailwind CSS 4, CVA, @dnd-kit, react-zoom-pan-pinch
- Backend: Node.js, TypeScript, ws (WebSocket), jose (JWT)
- Database: Supabase PostgreSQL with RLS policies
- Documentation: Storybook 10 with theme switching
- Deployment: Vercel (frontend), Railway (game server), Supabase (database)

**Patterns Established:**
- SECURITY DEFINER functions for atomic guild operations with FOR UPDATE locking
- Cached guild buffs with 5-second TTL for efficient tick processing
- Fire-and-forget WebSocket handlers (no await blocking tick loop)
- Role-based UI visibility computed per-component
- CVA for type-safe component variants with cn() utility
- Server-authoritative battle state with BattleManager
- Optimistic UI updates with rollback on failure

**Tech Debt:**
- Map uses hardcoded MOCK_POSITIONS instead of server-provided zone data
- BeveledButton component only used in MockGameScreen (experimental)
- Some map components use inline CSS variable fallbacks

## Constraints

- **Tech stack**: Must use existing Supabase + WebSocket architecture
- **Member cap**: 50 members per guild
- **Roles**: Leader > Officer > Member hierarchy (3 tiers max)
- **Pokemon deposits**: Allow all for now (admin tagging system is future work)
- **Animation budget**: 800ms max per battle turn for smooth feel

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
| CVA + tailwind-merge for components | Type-safe variants with class conflict resolution | ✓ Good — clean APIs |
| clamp() for fluid typography | Responsive text without breakpoint jumps | ✓ Good — smooth scaling |
| Server-authoritative battles | Prevents cheating, enables real catch uncertainty | ✓ Good — genuine tension |
| Catch at throw moment | Not pre-computed; player experiences true RNG | ✓ Good — exciting catches |
| @dnd-kit for party reorder | Swap behavior with local state prevents cascade | ✓ Good — smooth UX |
| Fog of war starting zone 1 | Pallet Town always visible for new players | ✓ Good — clear start |
| 800ms animation budget | Fits within tick timing, feels snappy | ✓ Good — responsive feel |
| Theme via data-theme attribute | CSS-only switching without JS re-renders | ✓ Good — performant |

---
*Last updated: 2026-01-21 after v1.2 milestone initialization*
