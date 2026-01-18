# Requirements: Pokemon Idle MMO - Guild Milestone

**Defined:** 2026-01-18
**Core Value:** Guilds give players a reason to come back daily and feel part of something bigger than their solo grind.

## v1 Requirements

### Guild Foundation

- [ ] **GUILD-01**: Player can create a guild with name (unique), tag (3-5 chars), and description
- [ ] **GUILD-02**: Guild enforces 50 member maximum cap
- [ ] **GUILD-03**: Player can view list of guilds with search/filter
- [ ] **GUILD-04**: Player can join an open guild directly
- [ ] **GUILD-05**: Player can leave a guild (with 24hr cooldown before joining another)
- [ ] **GUILD-06**: Player can view guild member roster with online status, role, and last active
- [ ] **GUILD-07**: Guild founder automatically becomes Leader role

### Guild Roles & Permissions

- [ ] **ROLE-01**: Guild has three roles: Leader, Officer, Member
- [ ] **ROLE-02**: Leader can promote Members to Officer
- [ ] **ROLE-03**: Leader can demote Officers to Member
- [ ] **ROLE-04**: Leader can transfer leadership to another member
- [ ] **ROLE-05**: Leader can kick any member (Officer or Member)
- [ ] **ROLE-06**: Officer can kick Members (not other Officers)
- [ ] **ROLE-07**: Leader can disband guild (requires confirmation)

### Guild Invites

- [ ] **INVITE-01**: Leader/Officer can send invite to any player not in a guild
- [ ] **INVITE-02**: Player receives invite notification
- [ ] **INVITE-03**: Player can accept or decline invite
- [ ] **INVITE-04**: Invites expire after 7 days
- [ ] **INVITE-05**: Guild can set join mode: Open, Invite-Only, or Closed

### Guild Chat

- [ ] **CHAT-01**: Guild has dedicated chat channel visible only to members
- [ ] **CHAT-02**: Guild chat messages show player name, role badge, and timestamp
- [ ] **CHAT-03**: Guild chat persists history (last 100 messages)

### Guild Bank - Currency

- [ ] **BANK-01**: Guild has shared currency pool (separate from member wallets)
- [ ] **BANK-02**: Any member can deposit currency
- [ ] **BANK-03**: Officer can withdraw currency up to daily limit
- [ ] **BANK-04**: Leader can withdraw currency without limit
- [ ] **BANK-05**: Members cannot withdraw currency

### Guild Bank - Items

- [ ] **BANK-06**: Guild bank has item storage (slots for potions, balls, etc.)
- [ ] **BANK-07**: Any member can deposit items
- [ ] **BANK-08**: Officer can withdraw items up to daily limit
- [ ] **BANK-09**: Leader can withdraw items without limit
- [ ] **BANK-10**: Members cannot withdraw items

### Guild Bank - Pokemon

- [ ] **BANK-11**: Guild bank has Pokemon storage (limited slots)
- [ ] **BANK-12**: Any member can deposit Pokemon (all Pokemon allowed for now)
- [ ] **BANK-13**: Officer can withdraw Pokemon up to daily limit
- [ ] **BANK-14**: Leader can withdraw Pokemon without limit
- [ ] **BANK-15**: Members cannot withdraw Pokemon

### Guild Bank - Logs

- [ ] **LOG-01**: All bank transactions are logged (who, what, when, action)
- [ ] **LOG-02**: Leader and Officers can view full transaction log
- [ ] **LOG-03**: Members can view their own transactions only

### Guild Quests

- [ ] **QUEST-01**: Guild has daily quests (reset at midnight UTC)
- [ ] **QUEST-02**: Guild has weekly quests (reset Monday midnight UTC)
- [ ] **QUEST-03**: Quest types: catch X Pokemon, catch X of type, battle X times, evolve X Pokemon
- [ ] **QUEST-04**: All member activity counts toward guild quest progress
- [ ] **QUEST-05**: Quest progress is visible to all members
- [ ] **QUEST-06**: Completed quests reward guild bank (currency, items, or guild points)

### Guild Shop

- [ ] **SHOP-01**: Guild can spend bank currency/points on buffs
- [ ] **SHOP-02**: Buff: +10% XP for all members (1 hour)
- [ ] **SHOP-03**: Buff: +10% catch rate for all members (1 hour)
- [ ] **SHOP-04**: Buff: +10% encounter rate for all members (1 hour)
- [ ] **SHOP-05**: Active buffs are visible to all members
- [ ] **SHOP-06**: Only Leader/Officer can purchase buffs

### Guild Statistics & Leaderboard

- [ ] **STATS-01**: Guild displays total Pokemon caught (all members, all time)
- [ ] **STATS-02**: Guild displays total unique species caught (guild Pokedex)
- [ ] **STATS-03**: Guild displays member count and average level
- [ ] **STATS-04**: Guild displays age (days since creation)
- [ ] **STATS-05**: Guild leaderboard ranks guilds by configurable metric (catches, Pokedex, members)
- [ ] **STATS-06**: Player can view top 50 guilds on leaderboard

### Zone Content

- [ ] **ZONE-01**: Cerulean City zone (town, connected to Route 4 and Routes 24/25)
- [ ] **ZONE-02**: Misty's Gym in Cerulean City (Water-type, Cascade Badge)
- [ ] **ZONE-03**: Route 24 zone (Nugget Bridge, north of Cerulean)
- [ ] **ZONE-04**: Route 25 zone (Bill's House area, east of Route 24)
- [ ] **ZONE-05**: Route 24-25 Pokemon: Bellsprout, Oddish, Abra, Slowpoke, Venonat, Pidgey

## v2 Requirements (Deferred)

### Guild Progression
- **PROG-01**: Guild levels (XP from activity)
- **PROG-02**: Guild perks tree (unlock bonuses at levels)
- **PROG-03**: Guild achievements (milestone badges)

### Pokemon Tagging
- **TAG-01**: Admin panel to tag Pokemon (legendary, event, starter, gift)
- **TAG-02**: Non-tradeable flag prevents guild bank deposit
- **TAG-03**: Pokemon display shows tags in UI

### Advanced Features
- **ADV-01**: Guild alliances
- **ADV-02**: Guild rivalries
- **ADV-03**: Guild events calendar
- **ADV-04**: Mentorship pairing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Guild raids | Requires raid system (Week 17+) |
| Guild-only zones | Future expansion after core works |
| Guild-exclusive Pokemon | FOMO concerns, bad UX |
| Real-money guild dues | Exploitative, legal issues |
| Guild wars | Very high complexity, balance nightmare |
| Complex role hierarchies (4+ tiers) | Confusing, rarely used; 3 roles max |
| Voice chat integration | Excludes players, accessibility; text chat sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GUILD-01 | Phase 1 | Complete |
| GUILD-02 | Phase 1 | Complete |
| GUILD-03 | Phase 1 | Complete |
| GUILD-04 | Phase 1 | Complete |
| GUILD-05 | Phase 1 | Complete |
| GUILD-06 | Phase 1 | Complete |
| GUILD-07 | Phase 1 | Complete |
| ROLE-01 | Phase 1 | Complete |
| ROLE-02 | Phase 1 | Complete |
| ROLE-03 | Phase 1 | Complete |
| ROLE-04 | Phase 1 | Complete |
| ROLE-05 | Phase 1 | Complete |
| ROLE-06 | Phase 1 | Complete |
| ROLE-07 | Phase 1 | Complete |
| INVITE-01 | Phase 2 | Pending |
| INVITE-02 | Phase 2 | Pending |
| INVITE-03 | Phase 2 | Pending |
| INVITE-04 | Phase 2 | Pending |
| INVITE-05 | Phase 2 | Pending |
| CHAT-01 | Phase 3 | Pending |
| CHAT-02 | Phase 3 | Pending |
| CHAT-03 | Phase 3 | Pending |
| BANK-01 | Phase 4 | Pending |
| BANK-02 | Phase 4 | Pending |
| BANK-03 | Phase 4 | Pending |
| BANK-04 | Phase 4 | Pending |
| BANK-05 | Phase 4 | Pending |
| BANK-06 | Phase 4 | Pending |
| BANK-07 | Phase 4 | Pending |
| BANK-08 | Phase 4 | Pending |
| BANK-09 | Phase 4 | Pending |
| BANK-10 | Phase 4 | Pending |
| BANK-11 | Phase 4 | Pending |
| BANK-12 | Phase 4 | Pending |
| BANK-13 | Phase 4 | Pending |
| BANK-14 | Phase 4 | Pending |
| BANK-15 | Phase 4 | Pending |
| LOG-01 | Phase 4 | Pending |
| LOG-02 | Phase 4 | Pending |
| LOG-03 | Phase 4 | Pending |
| QUEST-01 | Phase 5 | Pending |
| QUEST-02 | Phase 5 | Pending |
| QUEST-03 | Phase 5 | Pending |
| QUEST-04 | Phase 5 | Pending |
| QUEST-05 | Phase 5 | Pending |
| QUEST-06 | Phase 5 | Pending |
| SHOP-01 | Phase 6 | Pending |
| SHOP-02 | Phase 6 | Pending |
| SHOP-03 | Phase 6 | Pending |
| SHOP-04 | Phase 6 | Pending |
| SHOP-05 | Phase 6 | Pending |
| SHOP-06 | Phase 6 | Pending |
| STATS-01 | Phase 6 | Pending |
| STATS-02 | Phase 6 | Pending |
| STATS-03 | Phase 6 | Pending |
| STATS-04 | Phase 6 | Pending |
| STATS-05 | Phase 6 | Pending |
| STATS-06 | Phase 6 | Pending |
| ZONE-01 | Phase 7 | Pending |
| ZONE-02 | Phase 7 | Pending |
| ZONE-03 | Phase 7 | Pending |
| ZONE-04 | Phase 7 | Pending |
| ZONE-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓
- Complete: 14 (Phase 1)

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 after Phase 1 complete*
