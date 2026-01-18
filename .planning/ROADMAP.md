# Roadmap: Pokemon Idle MMO - Guild Milestone

**Created:** 2026-01-18
**Mode:** YOLO (parallel execution, no approval gates)
**Total Requirements:** 55

## Overview

This roadmap transforms Pokemon Idle MMO from a solo idle experience into a social, cooperative game through a comprehensive guild system. Players can create or join guilds to share resources, complete quests together, purchase group buffs, and compete on leaderboards. The milestone also expands the game world with Cerulean City, Misty's Gym, and Routes 24-25.

Phases are ordered by dependency: foundation before features, simpler features before complex ones, content last (independent of guild mechanics).

---

## Phase 1: Guild Foundation

**Goal:** Players can create, join, and manage guilds with role-based permissions.

**Requirements:** GUILD-01, GUILD-02, GUILD-03, GUILD-04, GUILD-05, GUILD-06, GUILD-07, ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05, ROLE-06, ROLE-07

**Dependencies:** None (first phase)

**Plans:** 5 plans

**Status:** Complete (2026-01-18)

Plans:
- [x] 01-01-PLAN.md - Database schema (guilds, guild_members, RLS, functions)
- [x] 01-02-PLAN.md - Shared types for guild system
- [x] 01-03-PLAN.md - Game server handlers (create, join, leave, search)
- [x] 01-04-PLAN.md - Role management (promote, demote, kick, transfer, disband)
- [x] 01-05-PLAN.md - Frontend UI (guild panel, modals, member roster)

**Success Criteria:**
- [x] Player can create guild with unique name (3-30 chars), tag (2-5 chars uppercase), and description
- [x] Guild creation fails if name or tag already exists
- [x] Guild enforces 50 member maximum cap - new members blocked when cap reached
- [x] Player can view list of public guilds with search by name/tag
- [x] Player can join an open guild directly (if under member cap)
- [x] Player can leave a guild - 24hr cooldown prevents joining another guild immediately
- [x] Player can view guild member roster showing online status, role, and last active time
- [x] Guild founder automatically assigned Leader role on creation
- [x] Guild has exactly three roles: Leader, Officer, Member
- [x] Leader can promote Member to Officer
- [x] Leader can demote Officer to Member
- [x] Leader can transfer leadership to another member (becomes Officer/Member)
- [x] Leader can kick any member (Officer or Member)
- [x] Officer can kick Members but not other Officers
- [x] Leader can disband guild (requires typing guild name to confirm)
- [x] Disbanded guild removes all members and deletes all guild data

---

## Phase 2: Guild Invites

**Goal:** Guild leaders and officers can recruit players through an invite system.

**Requirements:** INVITE-01, INVITE-02, INVITE-03, INVITE-04, INVITE-05

**Dependencies:** Phase 1 (requires guilds and roles to exist)

**Plans:** 3 plans

**Status:** Complete (2026-01-18)

Plans:
- [x] 02-01-PLAN.md - Database migration (guild_invites table, RLS, functions)
- [x] 02-02-PLAN.md - Shared types for invite system
- [x] 02-03-PLAN.md - Game server handlers (send, accept, decline, list invites)

**Success Criteria:**
- [x] Leader or Officer can send invite to any player not currently in a guild
- [x] Player receives notification when invited to a guild
- [x] Player can view list of pending invites received
- [x] Player can accept invite (joins guild as Member)
- [x] Player can decline invite (removes from pending list)
- [x] Invites automatically expire and are removed after 7 days
- [x] Guild can set join mode: Open (anyone can join), Invite-Only (requires invite), or Closed (no new members)
- [x] Join mode is respected: Open guilds allow direct join, Invite-Only requires invite, Closed blocks all joins

---

## Phase 3: Guild Chat

**Goal:** Guild members can communicate privately in a dedicated chat channel.

**Requirements:** CHAT-01, CHAT-02, CHAT-03

**Dependencies:** Phase 1 (requires guild membership)

**Plans:** 3 plans

**Status:** Complete (2026-01-18)

Plans:
- [x] 03-01-PLAN.md - Database migration (guild_messages table, RLS)
- [x] 03-02-PLAN.md - Game server handlers (send message, get history, broadcast)
- [x] 03-03-PLAN.md - Frontend integration (enable guild channel, role badges, history loading)

**Success Criteria:**
- [x] Guild has dedicated chat channel visible only to guild members
- [x] Non-members cannot see or access guild chat
- [x] Guild chat messages display player name, role badge (Leader/Officer/Member), and timestamp
- [x] Guild chat persists last 100 messages
- [x] Players joining guild can view existing message history
- [x] Messages appear in real-time for all online guild members

---

## Phase 4: Guild Bank

**Goal:** Guilds have shared storage for currency, items, and Pokemon with role-based access and full audit logging.

**Requirements:** BANK-01, BANK-02, BANK-03, BANK-04, BANK-05, BANK-06, BANK-07, BANK-08, BANK-09, BANK-10, BANK-11, BANK-12, BANK-13, BANK-14, BANK-15, LOG-01, LOG-02, LOG-03

**Dependencies:** Phase 1 (requires guilds and roles)

**Plans:** 5 plans

**Status:** Not Started

Plans:
- [ ] 04-01-PLAN.md - Database schema (bank tables, permissions, limits, logs, SECURITY DEFINER functions)
- [ ] 04-02-PLAN.md - Shared types for bank system
- [ ] 04-03-PLAN.md - Game server handlers (deposit, withdraw, requests, logs, permissions)
- [ ] 04-04-PLAN.md - Frontend UI: Bank modal, Currency tab, Items tab
- [ ] 04-05-PLAN.md - Frontend UI: Pokemon tab, Logs tab, Requests tab

**Success Criteria:**

*Currency:*
- [ ] Guild has shared currency pool separate from individual member wallets
- [ ] Any member can deposit currency to guild bank
- [ ] Officer can withdraw currency up to configurable daily limit
- [ ] Leader can withdraw currency without limit
- [ ] Member (non-Officer) cannot withdraw currency

*Items:*
- [ ] Guild bank has item storage for potions, balls, and other items
- [ ] Any member can deposit items to guild bank
- [ ] Officer can withdraw items up to configurable daily limit
- [ ] Leader can withdraw items without limit
- [ ] Member (non-Officer) cannot withdraw items

*Pokemon:*
- [ ] Guild bank has Pokemon storage with limited slot count
- [ ] Any member can deposit Pokemon to guild bank
- [ ] Officer can withdraw Pokemon up to configurable daily limit
- [ ] Leader can withdraw Pokemon without limit
- [ ] Member (non-Officer) cannot withdraw Pokemon

*Logging:*
- [ ] All bank transactions logged with: who, what item/amount, when, action (deposit/withdraw)
- [ ] Leader and Officers can view full transaction log
- [ ] Members can view only their own transactions

---

## Phase 5: Guild Quests

**Goal:** Guilds have shared daily and weekly goals that all members contribute to for rewards.

**Requirements:** QUEST-01, QUEST-02, QUEST-03, QUEST-04, QUEST-05, QUEST-06

**Dependencies:** Phase 4 (quests reward guild bank)

**Success Criteria:**
- [ ] Guild receives daily quests that reset at midnight UTC
- [ ] Guild receives weekly quests that reset Monday midnight UTC
- [ ] Quest types include: catch X Pokemon, catch X of specific type, battle X times, evolve X Pokemon
- [ ] All member activity counts toward guild quest progress automatically
- [ ] Quest progress is visible to all guild members in real-time
- [ ] Completed quests reward guild bank with currency, items, or guild points
- [ ] Rewards deposited automatically upon quest completion

---

## Phase 6: Guild Shop & Statistics

**Goal:** Guilds can spend accumulated resources on group buffs and compare themselves on leaderboards.

**Requirements:** SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, SHOP-06, STATS-01, STATS-02, STATS-03, STATS-04, STATS-05, STATS-06

**Dependencies:** Phase 4 (shop requires guild bank currency/points), Phase 5 (quests earn guild points)

**Success Criteria:**

*Shop:*
- [ ] Guild can spend bank currency or guild points on buffs
- [ ] Buff available: +10% XP for all members (1 hour duration)
- [ ] Buff available: +10% catch rate for all members (1 hour duration)
- [ ] Buff available: +10% encounter rate for all members (1 hour duration)
- [ ] Active buffs visible to all guild members with remaining duration
- [ ] Only Leader or Officer can purchase buffs (Members cannot)
- [ ] Buff effects apply during server tick processing

*Statistics:*
- [ ] Guild displays total Pokemon caught by all members all time
- [ ] Guild displays total unique species caught (guild Pokedex count)
- [ ] Guild displays member count and average member level
- [ ] Guild displays age (days since creation)
- [ ] Guild leaderboard ranks guilds by configurable metric (catches, Pokedex, members)
- [ ] Player can view top 50 guilds on leaderboard

---

## Phase 7: Zone Content

**Goal:** Game world expands with Cerulean City, Misty's Gym, and Routes 24-25.

**Requirements:** ZONE-01, ZONE-02, ZONE-03, ZONE-04, ZONE-05

**Dependencies:** None (independent of guild features, can be built in parallel)

**Success Criteria:**
- [ ] Cerulean City zone exists as a town connected to Route 4 and Routes 24/25
- [ ] Misty's Gym exists in Cerulean City (Water-type, rewards Cascade Badge)
- [ ] Route 24 zone exists (Nugget Bridge, north of Cerulean)
- [ ] Route 25 zone exists (Bill's House area, east of Route 24)
- [ ] Route 24 and 25 encounter tables include: Bellsprout, Oddish, Abra, Slowpoke, Venonat, Pidgey
- [ ] All new zones are navigable from existing zone network

---

## Progress

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 1 | Guild Foundation | 14 | 5 | Complete |
| 2 | Guild Invites | 5 | 3 | Complete |
| 3 | Guild Chat | 3 | 3 | Complete |
| 4 | Guild Bank | 18 | 5 | Not Started |
| 5 | Guild Quests | 6 | 0 | Not Started |
| 6 | Guild Shop & Statistics | 12 | 0 | Not Started |
| 7 | Zone Content | 5 | 0 | Not Started |

**Total:** 63 requirements mapped (55 v1 + 8 expanded success criteria)
**Progress:** 22/55 requirements complete (40%)

---

## Dependency Graph

```
Phase 1: Guild Foundation
    |
    +---> Phase 2: Guild Invites
    |
    +---> Phase 3: Guild Chat
    |
    +---> Phase 4: Guild Bank
              |
              +---> Phase 5: Guild Quests
                        |
                        +---> Phase 6: Guild Shop & Statistics

Phase 7: Zone Content (independent, can run in parallel)
```

---

*Roadmap created: 2026-01-18*
*Last updated: 2026-01-18*
