# Feature Landscape: Guild Systems

**Domain:** Guild/Clan systems in multiplayer games
**Researched:** 2026-01-18
**Confidence:** HIGH (guild systems are a 20+ year mature design space)

## Reference Games Analyzed

| Game | Type | Guild Size | Key Innovations |
|------|------|------------|-----------------|
| World of Warcraft | MMO | 1000 | Role hierarchy, guild bank, guild achievements |
| Pokemon GO | Mobile/AR | N/A (Teams) | Team-based raids, gym control |
| AFK Arena | Idle/Gacha | 70 | Guild bosses, donation systems, hunting grounds |
| Idle Heroes | Idle/Gacha | 25 | Guild wars, prayer currency, boss rush |
| Clash of Clans | Mobile Strategy | 50 | Donation requests, clan wars, clan games |
| Summoners War | Mobile Gacha | 30 | Guild siege, guild content, labyrinth |

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

### Foundation Layer (Must ship together)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Guild creation | Players need to form groups | Low | None | Name, tag, description, founder becomes Leader |
| Guild joining/leaving | Must be able to participate | Low | Guild exists | Join via invite, application, or open guilds |
| Member roster | Need to see who is in guild | Low | Membership | Online status, role, last active, contribution |
| Basic roles (Leader, Member) | Minimum permission distinction | Low | Membership | Leader can kick, invite; Member cannot |
| Guild chat | Social core of guilds | Low | Membership, Chat system | Dedicated channel for guild members only |

### Expected Expansion (Can ship shortly after foundation)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Invite system | Control who joins | Low | Membership | Invite codes, direct invites, or applications |
| Officer role | Delegation is expected | Low | Roles | Middle tier: can kick members, manage invites |
| Guild description/MOTD | Communication tool | Low | Guild exists | Leader/Officer editable |
| Member kick/ban | Moderation is essential | Low | Roles | Role-based: Officers kick Members, Leader kicks anyone |
| Leave cooldown | Prevent guild hopping abuse | Low | Membership | 24hr before joining new guild |
| Guild settings | Basic configuration | Low | Roles | Open/invite-only/application, who can invite |

### Resource Sharing (Core to your value prop)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Guild bank (currency) | Shared resource pool | Medium | Roles, Economy | Deposit always allowed; withdrawal role-gated |
| Guild bank (items) | Share consumables | Medium | Roles, Inventory | Potions, balls, held items |
| Deposit/withdrawal logs | Trust requires transparency | Medium | Bank | Who took what, when; prevents drama |
| Withdrawal limits | Prevent abuse | Medium | Bank, Roles | Daily/weekly caps by role |

### Engagement Loop (Your stated core value)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Guild quests (daily) | Creates daily return habit | Medium | Quest system | "Guild catches 100 Water Pokemon today" |
| Guild quests (weekly) | Longer engagement arc | Medium | Quest system | "Guild defeats 50 trainers this week" |
| Quest rewards | Incentivizes participation | Medium | Quests, Bank | Rewards go to guild bank or individual |
| Guild shop/buffs | Spend guild resources meaningfully | Medium | Bank, Buff system | XP boost, catch rate, encounter rate |

### Competition Layer

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Guild leaderboard | Comparison drives engagement | Low | Stats aggregation | Rank by total Pokedex, catches, levels |
| Guild statistics | Pride and progress visibility | Low | Stats aggregation | Total catches, active members, days old |

---

## Differentiators

Features that set product apart. Not expected, but valued when present.

### Pokemon-Specific (Thematic differentiation)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Guild Pokemon bank | Share Pokemon with guildmates | High | Bank, Pokemon system, Trust | WoW-like withdraw permissions; unique to Pokemon games |
| Guild Pokedex display | Show collective achievement | Low | Pokedex data | "Our guild has seen 142 species" |
| Guild type specialty | Guilds specialize in types | Medium | Badge system | "Water-type guild" badge, themed quests |
| Member contribution tracking | Who helped the guild most | Medium | All activities | Deposits, quests completed, Pokemon caught |

### Progression (Long-term engagement)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Guild levels | Persistent progression | Medium | XP system | Level up by activity; unlock perks |
| Guild perks tree | Choices matter | High | Guild levels | Paths: combat buffs vs catch rate vs encounter rate |
| Guild achievements | Milestone celebration | Medium | Stats tracking | "Caught 10,000 Pokemon", "First Legendary" |
| Guild reputation/seasons | Competitive cycles | High | Leaderboards, Time | Seasonal rankings with rewards |

### Social Features (Depth)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Guild alliances | Multi-guild cooperation | High | Guild system | Allied guilds can share chat, coordinate |
| Guild rivalries | Friendly competition | Medium | Leaderboard | Challenge rival guilds, bragging rights |
| Guild events | Scheduled activities | High | Calendar, Quests | "Raid hour", "Catch challenge" events |
| Mentorship pairing | New player retention | Medium | Membership | Veterans paired with newcomers |

### Content (Idle game specific)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Guild zones | Exclusive grinding areas | High | Zone system | Guild-only routes with unique spawns |
| Guild bosses | Cooperative combat | High | Battle system | Weekly boss, all members contribute damage |
| Guild raids | Major shared content | Very High | Full raid system | Coordinated multi-trainer battles |
| Guild expeditions | Send trainers together | Medium | Deployment system | Pool trainers for special missions |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-money guild dues | Feels exploitative, legal issues | Use in-game currency only; donations voluntary |
| Forced daily activity requirements | Punishes casual players, burnout | Make quests opt-in with bonus rewards |
| Guild-exclusive Pokemon (permanent) | FOMO and pressure, bad UX | Timed exclusives or cosmetics only |
| Complex multi-tier hierarchies | Confusing, rarely used | 3 roles max: Leader, Officer, Member |
| Leader absence = guild dies | Punishes everyone for one person | Auto-promote officers after 30 days inactive |
| Unlimited guild bank | Exploitable for gold selling/RMT | Cap storage, withdrawal limits |
| Public guild bank logs | Privacy concerns, drama | Officer+ can view; members see own actions only |
| Mandatory voice chat | Excludes players, accessibility issues | Text-based guild chat is sufficient |
| Guild wars as core feature | Very high complexity, balance nightmare | Save for future expansion after core works |
| Negative incentives (penalties for losing) | Feels bad, reduces engagement | Positive-only rewards for participation |
| Complicated quest contribution tracking | Hard to implement fairly | Simple: guild total, not individual credit |
| Over-automation of guild management | Removes social element | Manual invite/accept flow preferred |

---

## Feature Dependencies

```
Guild Creation
    |
    ├── Membership System
    |       |
    |       ├── Roles & Permissions
    |       |       |
    |       |       ├── Guild Bank (Currency)
    |       |       |       |
    |       |       |       └── Guild Bank (Items)
    |       |       |               |
    |       |       |               └── Guild Bank (Pokemon)
    |       |       |
    |       |       └── Moderation (Kick/Ban)
    |       |
    |       └── Guild Chat (requires chat system)
    |
    ├── Guild Stats
    |       |
    |       └── Guild Leaderboard
    |
    └── Guild Quests
            |
            ├── Quest Rewards
            |
            └── Guild Shop/Buffs
                    |
                    └── Buff Application (tick loop integration)
```

### Critical Path for MVP

```
1. Guild Creation → 2. Membership → 3. Roles → 4. Guild Chat → 5. Guild Bank (Money)
```

Everything else can layer on top.

---

## MVP Recommendation

For MVP, prioritize in this order:

### Phase 1: Foundation (Must have for "guild" label)
1. Guild creation (name, tag, description)
2. Join/leave mechanics
3. Member roster with online status
4. Basic roles (Leader, Officer, Member)
5. Guild chat channel
6. Invite system

### Phase 2: Resources (Your stated feature: Guild bank)
7. Guild bank (currency) with role-based permissions
8. Guild bank (items) with deposit/withdrawal
9. Transaction logs (Officer+ visible)
10. Withdrawal limits per role

### Phase 3: Engagement (Your stated core value: daily return)
11. Daily guild quests (simple: "catch X", "battle Y")
12. Weekly guild quests (larger goals)
13. Quest progress tracking
14. Guild statistics display

### Phase 4: Competition & Rewards
15. Guild leaderboard
16. Guild shop (spend bank funds on buffs)
17. Buff application to members

### Phase 5: Pokemon-Specific (Differentiator)
18. Guild Pokemon bank
19. Pokemon deposit/withdrawal with restrictions
20. Guild Pokedex display

---

## Defer to Post-MVP

| Feature | Reason to Defer |
|---------|-----------------|
| Guild levels & perks | Complex; needs balance testing with core first |
| Guild bosses/raids | Requires new battle system; Week 17+ per roadmap |
| Guild zones | Requires zone system expansion |
| Guild alliances | Social feature, not core value |
| Guild achievements | Nice-to-have polish |
| Seasonal rankings | Needs stable leaderboard first |
| Guild events | Calendar system overhead |

---

## Complexity Estimates

| Feature Category | Estimate | Rationale |
|------------------|----------|-----------|
| Foundation (creation, membership, roles, chat) | Low-Medium | Follows existing friends/chat patterns |
| Guild bank (currency, items) | Medium | New tables, permission logic, UI |
| Guild bank (Pokemon) | Medium-High | Pokemon transfer logic, trust issues |
| Guild quests | Medium | Quest definition, progress tracking, rewards |
| Guild shop/buffs | Medium | New buff system, tick loop integration |
| Leaderboard | Low | Existing leaderboard patterns |
| Statistics | Low | Aggregation queries |

---

## Sources and Confidence

| Finding | Confidence | Basis |
|---------|------------|-------|
| 3-tier role hierarchy (Leader/Officer/Member) | HIGH | Universal pattern across WoW, Clash of Clans, idle games |
| Guild bank with withdrawal limits | HIGH | Established anti-abuse pattern |
| Daily/weekly quest cadence | HIGH | Standard mobile/idle engagement loop |
| Transaction logging for trust | HIGH | WoW guild bank, enterprise patterns |
| Anti-features list | HIGH | Post-mortems, community complaints across games |
| Pokemon bank as differentiator | MEDIUM | Unique to this game type; risk of abuse |
| Guild levels/perks as deferral | MEDIUM | Adds complexity; core needs validation first |

**Note:** WebSearch was unavailable. Findings based on training data about well-established guild patterns. The core patterns (roles, banks, quests, leaderboards) are stable across 20+ years of guild system implementations. Pokemon-specific features are extrapolated from game design principles.

---

## Alignment with PROJECT.md

| PROJECT.md Requirement | Status | Feature Mapping |
|------------------------|--------|-----------------|
| Guild creation with name/tag (50 member cap) | Table Stakes | Foundation Layer |
| Guild membership (join/leave) | Table Stakes | Foundation Layer |
| Guild roles (Leader, Officer, Member) | Table Stakes | Foundation + Expected Expansion |
| Guild chat channel | Table Stakes | Foundation Layer |
| Guild invite system | Table Stakes | Expected Expansion |
| Guild bank (money) | Table Stakes | Resource Sharing |
| Guild bank items | Table Stakes | Resource Sharing |
| Guild bank Pokemon | Differentiator | Pokemon-Specific |
| Guild statistics | Table Stakes | Competition Layer |
| Guild leaderboard | Table Stakes | Competition Layer |
| Guild quests (weekly/daily) | Table Stakes | Engagement Loop |
| Guild shop (buffs) | Table Stakes | Engagement Loop |

All PROJECT.md requirements align with industry table stakes or are Pokemon-specific differentiators. The scope is appropriate for a meaningful guild system.
