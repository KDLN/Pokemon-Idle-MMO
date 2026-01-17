# Pokemon Idle MMO - Weekly Release Roadmap

## Overview
**Dev Time:** 15-20 hours/week
**Priority:** Social/Multiplayer focus with balanced content
**Strategy:** Finish WIP features first, then expand

---

## Phase 1: Foundation Polish (Weeks 1-4)
*Complete partially-built features and prepare social foundation*

### Week 1: Complete WIP Features
**Theme: "Quality of Life"**
- [x] **Potions**: Implement healing mechanic (use potions to restore HP)
- [x] **Great Ball**: Add improved catch rate (1.5x modifier)
- [x] **Town Healing**: Complete heal endpoint in TownMenu.tsx:84
- [x] **Item Tooltips**: Show item descriptions in shop/inventory

**New Content:**
- [x] Add Route 2 (north of Viridian City)
- [x] Add 5 new Pokemon species for Route 2

---

### Week 2: Friend System Foundation
**Theme: "Connect with Friends"**
- [x] **Friends Table**: Create database schema for friend relationships
- [x] **Friend Requests**: Send/accept/decline friend requests
- [x] **Friends List UI**: Show online/offline status
- [x] **Zone Visibility**: See which zone friends are in

**New Content:**
- [x] Add Viridian Forest (zone between Route 2 and Pewter)
- [x] Add Pikachu, Metapod, Kakuna, Butterfree to Viridian Forest

---

### Week 3: Trading System
**Theme: "Trade Pokemon"**
- [x] **Trade Database Schema**: Create trades/trade_offers tables (#23)
- [x] **Trade Requests**: Send trade request to online friends (#24)
- [x] **Trade UI**: Select Pokemon to offer/request (#25)
- [x] **Trade Confirmation**: Both parties confirm before executing (#26)
- [x] **Trade History**: Log completed trades (#27)

**New Content:**
- [x] Add Pewter City (town with Brock's Gym) (#28)
- [x] Move Brock's Gym from Pallet Town to Pewter City (#29)
- [x] Add Pewter Museum interaction (#30)

---

### Week 4: Pokemon Evolution
**Theme: "Watch Them Grow"**
- [x] **Evolution Data**: Add evolution chains to pokemon_species (#31)
- [x] **Level Evolution**: Trigger evolution at level thresholds (#32)
- [x] **Evolution Animation**: Show evolution sequence UI (#33)
- [x] **Cancel Evolution**: Option to stop evolution (Everstone) (#34)

**New Content:**
- [x] Add Route 3 (east of Pewter City toward Mt. Moon) (#35)
- [x] Add Jigglypuff, Clefairy, Zubat, Paras, Geodude to Route 3 (#36)

---

## Phase 2: Social Expansion (Weeks 5-8)
*Build out multiplayer features with content drops*

### Week 5: Enhanced Chat & Whispers
**Theme: "Stay Connected"**
- [ ] **Whisper System**: Direct messages to friends
- [ ] **Chat Notifications**: Unread message indicators
- [ ] **Block/Mute**: Player blocking functionality
- [ ] **Chat Commands**: /whisper, /block, /friend commands

**New Content:**
- [ ] Add Mt. Moon (cave zone with multiple floors)
- [ ] Add rare Pokemon spawns in Mt. Moon (Clefairy increased)

---

### Week 6: Leaderboards
**Theme: "Compete for Glory"**
- [ ] **Pokedex Leaderboard**: Most Pokemon caught/seen
- [ ] **Catch Leaderboard**: Total catches
- [ ] **Level Leaderboard**: Highest level Pokemon
- [ ] **Weekly Reset**: Track weekly vs all-time stats

**New Content:**
- [ ] Add Route 4 (exit of Mt. Moon toward Cerulean)
- [ ] Add Sandshrew, Ekans, Mankey, Spearow

---

### Week 7: Guild Foundation
**Theme: "Stronger Together"**
- [ ] **Guild Creation**: Create guild with name/tag
- [ ] **Guild Membership**: Join/leave guilds (50 member cap)
- [ ] **Guild Roles**: Leader, Officer, Member
- [ ] **Guild Chat**: Dedicated guild chat channel

**New Content:**
- [ ] Add Cerulean City
- [ ] Add Misty's Gym (Water-type, Cascade Badge)

---

### Week 8: Guild Features
**Theme: "Guild Benefits"**
- [ ] **Guild Bank**: Shared currency pool
- [ ] **Guild Stats**: Combined member statistics
- [ ] **Guild Leaderboard**: Rank guilds by activity
- [ ] **Guild Invites**: Invite friends to guild

**New Content:**
- [ ] Add Route 24 (Nugget Bridge north of Cerulean)
- [ ] Add Route 25 (Bill's House area)
- [ ] Add Bellsprout, Oddish, Abra, Slowpoke

---

## Phase 3: Advanced Mechanics (Weeks 9-12)
*Add depth with IVs, Natures, and Shinies*

### Week 9: Individual Values (IVs)
**Theme: "Hidden Potential"**
- [ ] **IV System**: 0-31 stats for HP/Atk/Def/SpA/SpD/Spe
- [ ] **IV Display**: Show IVs in Pokemon details
- [ ] **IV Judge**: NPC to evaluate Pokemon IVs
- [ ] **Catch Better Mode**: Prioritize high-IV Pokemon

**New Content:**
- [ ] Add Route 5 (south of Cerulean toward Saffron)
- [ ] Add Route 6 (Vermilion approach)

---

### Week 10: Natures System
**Theme: "Personality Matters"**
- [ ] **25 Natures**: Add nature to all Pokemon
- [ ] **Stat Modifiers**: +10%/-10% to stats based on nature
- [ ] **Nature Display**: Show nature and effect in UI
- [ ] **Nature Filter**: Filter box Pokemon by nature

**New Content:**
- [ ] Add Vermilion City
- [ ] Add Lt. Surge's Gym (Electric-type, Thunder Badge)
- [ ] Add S.S. Anne dock area

---

### Week 11: Shiny Pokemon
**Theme: "Rare Treasures"**
- [ ] **Shiny Flag**: Add shiny boolean to Pokemon
- [ ] **Shiny Odds**: 1/4096 base rate
- [ ] **Shiny Indicator**: Special sparkle effect in UI
- [ ] **Shiny Hunt Mode**: Priority mode for shiny hunting
- [ ] **Shiny Charm**: Item to boost shiny rate (3x)

**New Content:**
- [ ] Add Diglett's Cave
- [ ] Add Route 11 (east of Vermilion)

---

### Week 12: Priority Modes
**Theme: "Play Your Way"**
- [ ] **XP Grind Mode**: Prioritize battling over catching
- [ ] **Catch Better Mode**: Only catch higher IV Pokemon
- [ ] **Shiny Hunt Mode**: Only catch shinies
- [ ] **Manual Queue**: Player-controlled catch decisions

**New Content:**
- [ ] Add Route 9 (toward Rock Tunnel)
- [ ] Add Route 10 (Power Plant area)

---

## Phase 4: Competitive Features (Weeks 13-16)
*PvP and Battle Tower*

### Week 13: Battle Tower Foundation
**Theme: "Endless Challenge"**
- [ ] **Tower Structure**: Infinite floors, boss every 10
- [ ] **Floor Battles**: Auto-battle against AI teams
- [ ] **Progress Tracking**: Save floor progress
- [ ] **Weekly Reset**: Reset tower progress weekly

**New Content:**
- [ ] Add Rock Tunnel
- [ ] Add Lavender Town

---

### Week 14: Battle Tower Rewards
**Theme: "Climb for Prizes"**
- [ ] **Floor Rewards**: Currency per floor cleared
- [ ] **Boss Rewards**: Special items from bosses
- [ ] **Tower Leaderboard**: Highest floor reached
- [ ] **Tower Streaks**: Bonus for consecutive wins

**New Content:**
- [ ] Add Pokemon Tower (Lavender)
- [ ] Add Ghost Pokemon (Gastly, Haunter, Gengar)

---

### Week 15: PvP Foundation
**Theme: "Test Your Team"**
- [ ] **Challenge Friends**: Send PvP challenge to friends
- [ ] **Async Battles**: Submit team, battle resolves
- [ ] **Battle Results**: View battle replay/log
- [ ] **Win/Loss Tracking**: Personal PvP record

**New Content:**
- [ ] Add Celadon City
- [ ] Add Erika's Gym (Grass-type, Rainbow Badge)

---

### Week 16: Ranked PvP
**Theme: "Climb the Ladder"**
- [ ] **Elo System**: Rating-based matchmaking
- [ ] **Rank Tiers**: Bronze, Silver, Gold, Platinum, Diamond, Master
- [ ] **Ranked Rewards**: End-of-season rewards
- [ ] **PvP Leaderboard**: Top ranked players

**New Content:**
- [ ] Add Game Corner
- [ ] Add Route 7 (toward Saffron)
- [ ] Add Saffron City entrance (locked)

---

## Phase 5: Raids & Endgame (Weeks 17-20)
*Multiplayer PvE content*

### Week 17: Raid Foundation
**Theme: "Team Up"**
- [ ] **Raid Lobby**: Create/join raid groups (4 players)
- [ ] **Raid Tiers**: 1-5 star difficulty levels
- [ ] **Raid Boss**: Powerful Pokemon with high HP
- [ ] **Damage Contribution**: Track per-player damage

**New Content:**
- [ ] Add Saffron City (unlocks after certain badges)
- [ ] Add Sabrina's Gym (Psychic-type, Marsh Badge)

---

### Week 18: Raid Rewards & Polish
**Theme: "Legendary Rewards"**
- [ ] **Raid Rewards**: Based on contribution tier
- [ ] **Raid Tokens**: Currency from raids
- [ ] **Raid Shop**: Exclusive items for tokens
- [ ] **Daily Raid Limit**: Attempt restrictions

**New Content:**
- [ ] Add Fighting Dojo
- [ ] Add Silph Co. building

---

### Week 19: World Bosses
**Theme: "Server Events"**
- [ ] **World Boss Spawns**: Timed server-wide events
- [ ] **Global Damage Pool**: All players contribute
- [ ] **Participation Rewards**: Rewards for all contributors
- [ ] **Boss Schedule**: Predictable spawn times

**New Content:**
- [ ] Add Fuchsia City
- [ ] Add Koga's Gym (Poison-type, Soul Badge)
- [ ] Add Safari Zone entrance

---

### Week 20: Prestige System
**Theme: "New Game+"**
- [ ] **Prestige Unlock**: Beat Champion to unlock
- [ ] **Prestige Reset**: Reset progress, keep Pokedex
- [ ] **Prestige Perks**: Permanent bonuses
- [ ] **Difficulty Tiers**: Hard/Elite modes unlock

**New Content:**
- [ ] Add Safari Zone (special catch mechanics)
- [ ] Add rare Safari Pokemon (Chansey, Kangaskhan, Tauros)

---

## Phase 6: Events & Polish (Weeks 21-24)
*Live events and endgame content*

### Week 21: Event System
**Theme: "Limited Time"**
- [ ] **Event Framework**: Schedule events with start/end
- [ ] **Spotlight Hours**: 1-hour boosted spawns
- [ ] **Event Spawns**: Special Pokemon during events
- [ ] **Event UI**: Event timer and info display

**New Content:**
- [ ] Add Route 12-15 (Cycling Road area)
- [ ] Add Snorlax encounter event

---

### Week 22: Community Days
**Theme: "Monthly Celebrations"**
- [ ] **Community Day Events**: Full day events
- [ ] **Boosted Rates**: 3x catch rate, 1/128 shiny
- [ ] **Exclusive Moves**: Event-only Pokemon moves
- [ ] **Community Rewards**: Participation bonuses

**New Content:**
- [ ] Add Power Plant
- [ ] Add Zapdos legendary encounter (event-only)

---

### Week 23: Cinnabar & Seafoam
**Theme: "Island Adventure"**
- [ ] Add Route 19-20 (water routes)
- [ ] Add Seafoam Islands
- [ ] Add Articuno legendary encounter
- [ ] Add Cinnabar Island
- [ ] Add Blaine's Gym (Fire-type, Volcano Badge)
- [ ] Add Pokemon Mansion

---

### Week 24: Victory Road & Elite Four
**Theme: "The Final Challenge"**
- [ ] Add Route 22-23 (Victory Road approach)
- [ ] Add Victory Road
- [ ] Add Indigo Plateau
- [ ] Add Elite Four battles (Lorelei, Bruno, Agatha, Lance)
- [ ] Add Champion battle
- [ ] Complete Giovanni's Gym (Earth Badge)
- [ ] Add Mewtwo encounter (post-game)

---

## Content Summary by Phase

| Phase | Weeks | Zones Added | Pokemon Added | Major Features |
|-------|-------|-------------|---------------|----------------|
| 1 | 1-4 | 5 zones | ~15 Pokemon | WIP completion, Friends, Trading, Evolution |
| 2 | 5-8 | 7 zones | ~20 Pokemon | Chat, Leaderboards, Guilds |
| 3 | 9-12 | 8 zones | ~25 Pokemon | IVs, Natures, Shinies, Priority Modes |
| 4 | 13-16 | 6 zones | ~15 Pokemon | Battle Tower, PvP, Ranked |
| 5 | 17-20 | 5 zones | ~20 Pokemon | Raids, World Bosses, Prestige |
| 6 | 21-24 | 10 zones | ~25 Pokemon | Events, Legendaries, Elite Four |

**Total:** ~41 new zones, ~120 new Pokemon over 24 weeks

---

## Current Status

### Implemented
- 3 zones (Pallet Town, Route 1, Viridian City)
- 12 Pokemon species
- Core idle loop (encounters, battles, catching)
- Shop with 4 items
- Chat system (4 channels)
- Gym battles (Brock only)
- Badge system

### Partially Implemented (Week 1 targets)
- Potions (in shop, no healing mechanic)
- Great Ball (in shop, no catch bonus)
- Town healing (TODO in code)
- Held items (database ready, no logic)

---

## Key Files

**Database:** `supabase/migrations/`
**Game Server:** `apps/game-server/src/` (hub.ts, game.ts, db.ts)
**Web App:** `apps/web/src/components/game/`
**State:** `apps/web/src/stores/gameStore.ts`
