# Pokémon Idle MMO — Game Design Document

## Overview

An idle MMO monster-catching game where players deploy their trainer into the world, set priorities, and watch their adventure unfold. The core fantasy: your character is always out there catching, battling, and exploring — you make strategic decisions about where and how.

**Platform:** Web-based, mobile responsive
**Tech Stack:** Next.js (Vercel), Go (game server), Supabase (database/auth/realtime)
**Target Scale:** Friends group initially, scalable to small community

---

## 1. Core Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Player Online                Player Offline           │
│        │                            │                   │
│        ▼                            ▼                   │
│   Real-time ticks              Catch-up calc            │
│   (2-5 sec intervals)          (on reconnect)           │
│        │                            │                   │
│        ▼                            ▼                   │
│   ┌─────────────────────────────────────────────┐      │
│   │              GAME TICK                       │      │
│   │                                              │      │
│   │  1. Check encounter roll                     │      │
│   │  2. If encounter → resolve battle/catch     │      │
│   │  3. Award XP, items, progress               │      │
│   │  4. Check zone completion                    │      │
│   │  5. Check for wipe → return to center       │      │
│   │  6. Sync state                              │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Player Decisions (Active Layer):**
- Which zone to be in
- Which 6 Pokémon are in active party
- Priority mode (XP Grind, Catch All, etc.)
- Quest selection
- Team comp for raids/PvP
- When to prestige

---

## 2. Zone & Map System

### Zone Types

| Type | Auto-Actions | Unlock Method |
|------|--------------|---------------|
| **Route** | Wander, encounter, auto-battle/catch, find items | Story progression, catch X pokémon |
| **Town/City** | Heal, shop, collect quest rewards, access services | Story progression |
| **Cave/Dungeon** | Encounters, rare spawns, find items, progress deeper | Key item, quest completion |
| **Gym** | Challenge trainers, queue for leader battle | Badge prerequisites |
| **Raid Den** | Queue for party, participate in raid | Story progression, daily unlock |
| **Safari Zone** | Special catch mechanics, rare spawns | Fee/ticket entry |
| **Tower (Endgame)** | Climb floors, scaling difficulty | Post-Elite Four |

### Zone Properties

```
Zone {
  id
  name
  type: route | town | dungeon | gym | raid | safari | tower
  region: kanto
  difficulty_tier: normal | hard | elite
  base_encounter_rate: float
  encounter_table: Pokemon[]
  day_encounter_table: Pokemon[]
  night_encounter_table: Pokemon[]
  required_badges: int
  unlock_requirements: Requirement[]
  connections: Zone[] (adjacent zones)
}
```

### Map Progression (Kanto)

```
Pallet Town (start)
    │
Route 1 ─────────────────┐
    │                    │
Viridian City ───── Viridian Forest
    │
Route 2
    │
Pewter City [GYM 1]
    │
Route 3 ──── Mt. Moon ──── Route 4
                              │
                         Cerulean City [GYM 2]
                              │
                    ┌────────┴────────┐
                Route 24/25       Route 5
                (Bill's House)        │
                                 Saffron City [GYM 6]
                                      │
                            ... continues ...
```

---

## 3. Encounter & Battle System

### Encounter Rate Formula

```
base_rate = zone.base_encounter_rate (e.g., 0.15 = 15% per tick)

modifiers = {
  item_lure: 1.5,           // Active lure item
  item_incense: 1.25,       // Incense
  skill_encounter: 1.0 + (trainer.encounter_skill * 0.02),  // Trainer perk
  level_penalty: if avg_team_level > zone_level + 10 then 0.8 else 1.0,
  time_of_day: 1.0,         // Some pokemon only at night
  weather: 1.0,             // Future: weather system
}

effective_rate = base_rate * product(modifiers)

// Every tick (3-5 seconds online):
if random() < effective_rate:
    trigger_encounter()
```

### Priority Modes

| Mode | Behavior | Ball Usage | Party Selection |
|------|----------|------------|-----------------|
| **XP Grind** | Fight everything, never catch | None | Rotates lowest-level Pokémon to front |
| **Catch All** | Catch anything not in Pokédex | Aggressive | Strongest team |
| **Catch Better** | Only catch if IVs beat current best | Selective | Strongest team |
| **Shiny Hunt** | Run from non-shinies | Shinies only | Doesn't matter |
| **Manual Queue** | Pause on encounter, await player decision | Player choice | Player choice |

Players can set: **Primary Mode** + **Fallback Mode**
Example: "Catch Better → fallback to XP Grind"

### Auto-Battle Resolution

Battles resolve instantly based on simulation:

```
function resolveBattle(playerTeam, wildPokemon, mode):
    // Calculate effective power
    playerPower = sum(pokemon.effectivePower for pokemon in playerTeam if pokemon.hp > 0)
    wildPower = wildPokemon.effectivePower
    
    // Type matchup multiplier (best matchup in party)
    typeMultiplier = getBestTypeMatchup(playerTeam, wildPokemon)
    
    // Roll outcome
    winChance = (playerPower * typeMultiplier) / (playerPower * typeMultiplier + wildPower)
    playerWins = random() < winChance
    
    if playerWins:
        if shouldCatch(mode, wildPokemon):
            return attemptCatch(wildPokemon, mode)
        else:
            return { outcome: 'victory', xp: calculateXP(wildPokemon) }
    else:
        // Damage to team
        applyDamage(playerTeam, wildPokemon)
        if allFainted(playerTeam):
            return { outcome: 'wipe' }
        else:
            return { outcome: 'fled' }
```

### Catch Mechanics

```
catchChance = baseCatchRate(pokemon.species) 
            * ballMultiplier(ballType)
            * hpMultiplier(1.0 for wild encounters)
            * statusMultiplier(1.0 for auto-battles)
            * (1 + pokedexBonus if alreadyCaught else 0)

// Ball hierarchy
pokeball: 1.0x
greatball: 1.5x
ultraball: 2.0x
masterball: guaranteed
```

### Wipe & Recovery

When all party Pokémon faint:
1. Trainer instantly returns to last visited Pokémon Center
2. All Pokémon fully healed
3. Zone progress for current "expedition" resets
4. No XP or item loss (time is the penalty)
5. 30-second "recovery" cooldown before auto-actions resume

---

## 4. Pokémon Stats

### Core Stats

```
Pokemon {
  id: uuid
  species_id: int (1-151)
  nickname: string?
  level: 1-100
  xp: int
  
  // IVs (0-31, generated on catch)
  iv_hp, iv_attack, iv_defense, iv_sp_attack, iv_sp_defense, iv_speed
  
  // EVs (0-252 each, 510 total cap)
  ev_hp, ev_attack, ev_defense, ev_sp_attack, ev_sp_defense, ev_speed
  
  // Calculated stats (recalc on level up)
  stat_hp, stat_attack, stat_defense, stat_sp_attack, stat_sp_defense, stat_speed
  
  current_hp: int
  nature: Nature?
  is_shiny: bool
  caught_at: timestamp
  caught_zone: zone_id
  original_trainer: player_id
}
```

### IV Rating System

For player convenience, show IV quality:

| Total IVs | Rating |
|-----------|--------|
| 0-90 | ★ (Decent) |
| 91-120 | ★★ (Good) |
| 121-150 | ★★★ (Great) |
| 151-175 | ★★★★ (Excellent) |
| 176-186 | ★★★★★ (Perfect) |

### Shiny Pokémon

- **Base rate:** 1/4096 per encounter
- **Shiny Charm (item):** 3x rate (1/1365)
- **Shiny bonus:** +10% to all stats (multiplicative)
- **Visual:** Distinct color palette, sparkle effect

### Natures (25 total)

Each nature: +10% to one stat, -10% to another (or neutral)
Examples:
- Adamant: +Attack, -Sp. Attack
- Jolly: +Speed, -Sp. Attack
- Modest: +Sp. Attack, -Attack

### Moves & Power Scaling

Pokémon don't learn individual moves. Instead:
- Each species has a **base power rating** and **type(s)**
- Power scales with level: `effective_power = base_power * (1 + level * 0.02)`
- Type matchups calculated from species types vs opponent

This simplifies the idle auto-battle while keeping type strategy relevant.

---

## 5. Progression System

### Main Story Progression

```
Pallet Town
    ↓
[Catch 3 Pokémon on Route 1]
    ↓
Viridian City unlocked
    ↓
[Catch 5 Pokémon OR reach team level 8]
    ↓
Viridian Forest unlocked
    ↓
... continues through 8 gyms ...
    ↓
Victory Road
    ↓
Elite Four (4 sequential boss battles)
    ↓
Champion Battle
    ↓
POST-GAME UNLOCKED
```

### Gym Battles

- **Format:** 3v3 auto-battle against Gym Leader
- **Requirement:** Queue when in Gym zone, minimum badge prerequisites
- **Rewards:** Badge, TM item, currency, unlock next region segment

### Elite Four

- Must defeat all 4 in sequence (no healing between)
- Failing any = restart from first
- Rewards: Champion title, endgame unlock, prestige eligibility

---

## 6. Prestige System

After defeating the Champion, players can **Prestige**.

### What Resets

- All Pokémon (except banked)
- Pokémon levels
- Story/zone progress
- Currency (Pokédollars)
- Items (except key items)

### What Carries Over

- **Pokédex completion** (caught flags)
- **Banked Pokémon** (1 slot per prestige level, max 6)
- **Prestige currency** (earned on prestige)
- **Trainer perks** (permanent upgrades)
- **Cosmetics**
- **Achievement progress**

### Bank System

| Prestige Level | Bank Slots |
|----------------|------------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |
| 6+ | 6 (max) |

Banked Pokémon retain:
- Species, IVs, Nature, Shiny status
- Reset to Level 5
- Keep nickname and original trainer info

### Prestige Currency & Perks

Earn prestige points based on:
- Pokédex completion %
- Playtime
- Achievements completed
- Shiny count

Spend on permanent trainer perks:
- +5% encounter rate (stacks)
- +5% XP gain (stacks)
- +5% catch rate (stacks)
- +1 starting Pokéball stack
- Unlock "catch better" IVs threshold options
- Cosmetic trainer appearances

---

## 7. Endgame Systems

### Difficulty Tiers

After first clear, replay regions on harder difficulties:

| Tier | Enemy Level Scale | Rewards | Unlock |
|------|-------------------|---------|--------|
| Normal | 1x | Standard | Default |
| Hard | 1.5x | +50% XP, better items | Prestige 1 |
| Elite | 2x | +100% XP, rare drops | Prestige 3 |

Each tier has separate progress tracking.

### Battle Tower

- Infinite scaling floors
- Each floor: 3 trainer battles
- Every 10 floors: Boss battle with bonus rewards
- Leaderboard: Highest floor reached
- Resets: Weekly, rewards based on peak

### Legendary Hunts

Legendary Pokémon (Articuno, Zapdos, Moltres, Mewtwo, Mew):
- Don't appear in normal encounters
- Require quest chains to unlock encounter
- Low catch rate, limited attempts per day
- Mew: Special event or extreme achievement unlock

### World Bosses

Server-wide events:
- Massive HP boss (e.g., Level 100 Mewtwo)
- All players contribute damage over event period (24-48 hours)
- Rewards based on participation tier
- If defeated: Bonus rewards for all participants

### Seasonal Leagues

- 3-month PvP seasons
- Ranked ladder with tiers (Bronze → Master)
- Season rewards: Exclusive cosmetics, prestige currency
- Soft reset each season

---

## 8. Raids

### Structure

- **Party size:** 4 players
- **Matchmaking:** Queue solo or with friends
- **Raid tiers:** 1-star (easy) to 5-star (legendary)

### Flow

```
1. Player enters Raid Den zone
2. Select raid tier (based on unlocks)
3. Queue for party (or invite friends)
4. Party fills → 60 second prep (swap team)
5. Raid begins → Server simulates battle
6. Players watch replay (skip option)
7. Results: Win/Lose, individual contribution, rewards
```

### Contribution Scoring

```
total_damage = sum(player.damage_dealt for all players)
contribution% = player.damage_dealt / total_damage

base_reward = raid.reward_pool
group_reward = base_reward * 0.4 (split evenly if win)
performance_reward = base_reward * 0.6 * contribution%

// Bonus for type effectiveness, no faints, etc.
```

### Raid Rewards

- Rare Pokémon encounter (high IV floor)
- TMs
- Rare items
- Currency

### Failure

If boss HP not depleted:
- No catch opportunity
- Reduced rewards (participation only)
- Daily attempt consumed

---

## 9. PvP System

### Async Battle Model

```
1. Player A queues for ranked (or challenges friend)
2. Submits team of 6 + AI priority settings
3. Matchmaking finds Player B (similar rank)
4. Server simulates full battle
5. Both players notified of result
6. Can watch replay anytime
```

### AI Priority Settings

Players set simple instructions:
- Lead Pokémon selection
- Switch priority (type advantage, low HP, never)
- Focus fire vs spread damage

### Ranking System

```
Ranks:
  Bronze I-III
  Silver I-III
  Gold I-III
  Platinum I-III
  Diamond I-III
  Master (top 100)

Elo-based matchmaking behind ranks
Win: +15-30 points (based on opponent rank)
Lose: -15-30 points
```

### Battle Formats

- **Ranked Singles:** 6v6
- **Ranked Doubles:** Future addition
- **Unranked:** No rating change, for practice
- **Friend Battle:** Direct challenge

---

## 10. Economy

### Currencies

| Currency | Earn From | Spend On |
|----------|-----------|----------|
| **Pokédollars** | Battles, selling items, quests | Pokéballs, items, healing |
| **Prestige Points** | Prestige, achievements | Permanent perks |
| **Raid Tokens** | Raids, daily login | Raid entry, rare items |
| **Event Tokens** | Limited events | Event exclusives |

### Items

**Pokéballs:**
- Pokéball (1x)
- Great Ball (1.5x)
- Ultra Ball (2x)
- Master Ball (guaranteed, extremely rare)

**Battle Items:**
- Potions (restore HP between encounters)
- Revives (restore fainted Pokémon)
- X-Attack, X-Defense, etc. (temporary boosts)

**Encounter Items:**
- Lure (+50% encounter rate, 30 min)
- Incense (+25% encounter rate, 60 min)
- Repel (skip encounters below level X)

**Held Items (Future):**
- Boost specific stats or types
- One per Pokémon

### Global Trade Market (GTM)

Player-to-player trading:
- List Pokémon or items for sale
- Set price in Pokédollars
- 5% transaction fee
- Search/filter by species, IVs, shiny, price
- Trade history logged

---

## 11. Social Systems

### Guilds

- Create or join a guild
- Guild size: 50 players max
- Guild chat channel
- Guild raids (organized events)
- Guild leaderboard (combined stats)

**Guild Perks (Future):**
- Shared bonuses based on guild level
- Guild bank for pooled resources

### Chat

| Channel | Scope |
|---------|-------|
| Global | Server-wide |
| Zone | Current zone only |
| Guild | Guild members |
| Whisper | Direct message |
| Raid Party | Raid group |

Basic moderation: Report, mute, block

### Leaderboards

- **Pokédex Completion:** % caught
- **Total Catches:** Lifetime count
- **Shiny Count:** Total shinies
- **PvP Rank:** Current season
- **Battle Tower:** Highest floor
- **Speedrun:** Fastest Elite Four clear (per prestige)
- **Guild Rankings:** Combined metrics

### Friend System

- Add friends by username
- See online status, current zone
- Direct challenge (PvP, trade)
- Invite to raid party
- View profile (team, stats, achievements)

---

## 12. Time Systems

### Day/Night Cycle

Real-time based on player's local time:

| Time | Period | Effect |
|------|--------|--------|
| 6am - 6pm | Day | Day spawns active |
| 6pm - 6am | Night | Night spawns active |

Some Pokémon only spawn at certain times:
- Clefairy: Night only
- Zubat: Night boosted
- Butterfree: Day only

### Daily Reset (Midnight UTC)

- Daily login bonus
- Raid attempts refresh
- Daily quests refresh
- Shop deals rotate

### Weekly Reset (Monday 00:00 UTC)

- Battle Tower rankings finalize
- Weekly quests refresh
- Guild contributions tally

### Events

**Types:**
- **Spotlight Hour:** 1 hour, specific Pokémon boosted spawns
- **Community Day:** 3 hours, special Pokémon, bonus XP
- **Raid Weekend:** Legendary raids available
- **Seasonal Event:** Multi-week, themed spawns/quests

**Rewards:**
- Event tokens
- Exclusive cosmetics
- Limited-time Pokémon forms

---

## 13. Technical Architecture

### Services Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│            (Next.js Web App - Vercel)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTPS / WSS
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      GAME SERVER                                 │
│                    (Go - Fly.io/Railway)                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Tick Engine │  │Battle Sim   │  │ Raid Manager│             │
│  │             │  │             │  │             │             │
│  │ - Online    │  │ - Wild      │  │ - Queues    │             │
│  │   player    │  │ - PvP       │  │ - Parties   │             │
│  │   ticks     │  │ - Raid      │  │ - Rewards   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Catch-up   │  │ Zone Manager│  │ Event Sys   │             │
│  │ Calculator │  │             │  │             │             │
│  │             │  │ - Player   │  │ - Schedule  │             │
│  │ - Offline  │  │   positions │  │ - Rewards   │             │
│  │   sim      │  │ - Visibility│  │ - Spawns    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      SUPABASE                                    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │ Auth        │  │ Realtime    │             │
│  │             │  │             │  │             │             │
│  │ - Players  │  │ - Login     │  │ - Chat      │             │
│  │ - Pokemon  │  │ - Sessions  │  │ - Presence  │             │
│  │ - Items    │  │ - OAuth     │  │ - Updates   │             │
│  │ - Trades   │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Supabase)

```sql
-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_online TIMESTAMPTZ DEFAULT NOW(),
  
  -- Current state
  current_zone_id INT REFERENCES zones(id),
  priority_mode TEXT DEFAULT 'catch_all',
  fallback_mode TEXT DEFAULT 'xp_grind',
  
  -- Currencies
  pokedollars BIGINT DEFAULT 3000,
  prestige_points BIGINT DEFAULT 0,
  raid_tokens INT DEFAULT 3,
  
  -- Progression
  prestige_level INT DEFAULT 0,
  badges INT[] DEFAULT '{}',
  elite_four_cleared BOOLEAN DEFAULT FALSE,
  
  -- Stats
  total_catches INT DEFAULT 0,
  total_battles INT DEFAULT 0,
  playtime_seconds BIGINT DEFAULT 0
);

-- Pokemon instances
CREATE TABLE pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES players(id) ON DELETE CASCADE,
  species_id INT NOT NULL, -- 1-151
  nickname TEXT,
  
  level INT DEFAULT 5,
  xp INT DEFAULT 0,
  current_hp INT NOT NULL,
  
  -- IVs
  iv_hp INT NOT NULL,
  iv_attack INT NOT NULL,
  iv_defense INT NOT NULL,
  iv_sp_attack INT NOT NULL,
  iv_sp_defense INT NOT NULL,
  iv_speed INT NOT NULL,
  
  -- EVs
  ev_hp INT DEFAULT 0,
  ev_attack INT DEFAULT 0,
  ev_defense INT DEFAULT 0,
  ev_sp_attack INT DEFAULT 0,
  ev_sp_defense INT DEFAULT 0,
  ev_speed INT DEFAULT 0,
  
  -- Meta
  nature TEXT,
  is_shiny BOOLEAN DEFAULT FALSE,
  is_banked BOOLEAN DEFAULT FALSE,
  caught_at TIMESTAMPTZ DEFAULT NOW(),
  caught_zone_id INT REFERENCES zones(id),
  original_trainer_id UUID REFERENCES players(id),
  
  -- Party
  party_slot INT, -- 1-6 if in party, NULL otherwise
  
  CONSTRAINT valid_party_slot CHECK (party_slot IS NULL OR party_slot BETWEEN 1 AND 6)
);

-- Pokedex entries
CREATE TABLE pokedex_entries (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  species_id INT NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  caught BOOLEAN DEFAULT FALSE,
  caught_count INT DEFAULT 0,
  first_caught_at TIMESTAMPTZ,
  best_iv_total INT DEFAULT 0,
  shiny_caught BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (player_id, species_id)
);

-- Zones
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL, -- route, town, dungeon, gym, raid, safari, tower
  region TEXT DEFAULT 'kanto',
  difficulty_tier TEXT DEFAULT 'normal',
  base_encounter_rate DECIMAL(4,3) DEFAULT 0.150,
  required_badges INT DEFAULT 0,
  
  -- Unlock requirements (JSON)
  unlock_requirements JSONB DEFAULT '[]'
);

-- Zone connections
CREATE TABLE zone_connections (
  from_zone_id INT REFERENCES zones(id),
  to_zone_id INT REFERENCES zones(id),
  PRIMARY KEY (from_zone_id, to_zone_id)
);

-- Encounter tables
CREATE TABLE encounter_tables (
  zone_id INT REFERENCES zones(id),
  species_id INT NOT NULL,
  rarity DECIMAL(5,4) NOT NULL, -- 0.0001 to 1.0
  min_level INT NOT NULL,
  max_level INT NOT NULL,
  time_of_day TEXT DEFAULT 'any', -- any, day, night
  
  PRIMARY KEY (zone_id, species_id, time_of_day)
);

-- Player inventory
CREATE TABLE inventory (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  
  PRIMARY KEY (player_id, item_id)
);

-- Items definition
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL, -- ball, potion, held, key, tm
  effect JSONB DEFAULT '{}'
);

-- Trade market listings
CREATE TABLE market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES players(id),
  pokemon_id UUID REFERENCES pokemon(id),
  item_id INT REFERENCES items(id),
  quantity INT DEFAULT 1,
  price BIGINT NOT NULL,
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  buyer_id UUID REFERENCES players(id),
  
  CONSTRAINT one_listing_type CHECK (
    (pokemon_id IS NOT NULL AND item_id IS NULL) OR
    (pokemon_id IS NULL AND item_id IS NOT NULL)
  )
);

-- Guilds
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL, -- 3-5 char tag
  leader_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  member_count INT DEFAULT 1
);

-- Guild membership
CREATE TABLE guild_members (
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- leader, officer, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (guild_id, player_id)
);

-- PvP matches
CREATE TABLE pvp_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a_id UUID REFERENCES players(id),
  player_b_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  
  player_a_team JSONB NOT NULL, -- snapshot of team
  player_b_team JSONB NOT NULL,
  battle_log JSONB NOT NULL, -- for replay
  
  ranked BOOLEAN DEFAULT TRUE,
  rating_change_a INT,
  rating_change_b INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raids
CREATE TABLE raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_tier INT NOT NULL, -- 1-5
  boss_species_id INT NOT NULL,
  boss_level INT NOT NULL,
  boss_hp BIGINT NOT NULL,
  current_hp BIGINT NOT NULL,
  
  status TEXT DEFAULT 'waiting', -- waiting, in_progress, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raid participants
CREATE TABLE raid_participants (
  raid_id UUID REFERENCES raids(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team JSONB NOT NULL, -- snapshot
  damage_dealt BIGINT DEFAULT 0,
  rewards JSONB,
  
  PRIMARY KEY (raid_id, player_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL, -- global, zone:{id}, guild:{id}, whisper:{id}
  sender_id UUID REFERENCES players(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player zone progress
CREATE TABLE zone_progress (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  zone_id INT REFERENCES zones(id),
  unlocked BOOLEAN DEFAULT FALSE,
  catches_in_zone INT DEFAULT 0,
  battles_in_zone INT DEFAULT 0,
  
  PRIMARY KEY (player_id, zone_id)
);

-- Quests
CREATE TABLE quests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL, -- main, daily, weekly, event
  requirements JSONB NOT NULL,
  rewards JSONB NOT NULL
);

-- Player quest progress
CREATE TABLE player_quests (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  quest_id INT REFERENCES quests(id),
  progress JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  PRIMARY KEY (player_id, quest_id)
);

-- Indexes
CREATE INDEX idx_pokemon_owner ON pokemon(owner_id);
CREATE INDEX idx_pokemon_party ON pokemon(owner_id, party_slot) WHERE party_slot IS NOT NULL;
CREATE INDEX idx_market_active ON market_listings(sold_at) WHERE sold_at IS NULL;
CREATE INDEX idx_chat_channel ON chat_messages(channel, created_at DESC);
CREATE INDEX idx_players_online ON players(last_online DESC);
```

### Real-Time Sync Strategy

**What syncs via WebSocket (Go server):**
- Player position changes
- Encounter events
- Battle results
- Raid state
- Other players in zone

**What syncs via Supabase Realtime:**
- Chat messages
- Trade market updates
- Friend online status
- Guild activity

**Offline Catch-Up:**
```go
func CalculateCatchUp(player Player, offlineDuration time.Duration) CatchUpResult {
    maxOffline := 8 * time.Hour // Cap offline progression
    if offlineDuration > maxOffline {
        offlineDuration = maxOffline
    }
    
    // Simulate ticks at reduced efficiency (80%)
    tickCount := int(offlineDuration.Seconds() / 5) // 5 sec ticks
    efficiencyMultiplier := 0.8
    
    result := CatchUpResult{}
    zone := GetZone(player.CurrentZoneID)
    
    for i := 0; i < tickCount; i++ {
        if rand.Float64() < zone.BaseEncounterRate * efficiencyMultiplier {
            encounter := SimulateEncounter(player, zone)
            result.Encounters = append(result.Encounters, encounter)
        }
    }
    
    return result
}
```

### API Endpoints

**REST (Next.js API routes via Supabase):**
- Auth (login, register, session)
- Player profile CRUD
- Pokemon management
- Inventory
- Market listings
- Guild management
- Leaderboards

**WebSocket (Go server):**
- `connect` - Establish session
- `move_zone` - Change location
- `set_party` - Update active party
- `set_priority` - Change auto-battle mode
- `encounter_result` - Receive encounter outcomes
- `join_raid_queue` - Enter raid matchmaking
- `pvp_challenge` - Challenge player
- `zone_players` - See others in zone

---

## 14. MVP Scope (V0.1)

### Included

**Core:**
- [ ] Player registration/login (Supabase Auth)
- [ ] 3 zones: Pallet Town, Route 1, Viridian City
- [ ] 10 Pokémon species (starters, Route 1 commons)
- [ ] Basic encounter/catch loop
- [ ] Auto-battle (win/lose based on level)
- [ ] XP gain and leveling
- [ ] Party management (6 slots)
- [ ] Priority mode: Catch All only
- [ ] Pokéballs only (no other items)
- [ ] Pokedex tracking

**Technical:**
- [ ] Next.js frontend with basic UI
- [ ] Go server with tick engine
- [ ] Supabase database
- [ ] Online ticks only (no offline catch-up yet)

### Excluded from MVP

- IVs/EVs (all Pokemon equal stats initially)
- Natures
- Shinies
- Other priority modes
- Gyms, Elite Four
- PvP
- Raids
- Trading/Market
- Guilds
- Chat
- Events
- Prestige

### MVP Success Criteria

- Can create account and start game
- Character auto-wanders Route 1
- Encounters wild Pokémon every ~30 seconds
- Can catch Pokémon, see them in box
- Pokémon gain XP and level up
- Can switch party members
- Can move between 3 zones
- Friends can see each other online

---

## Next Steps

1. **Set up repo and project structure**
2. **Supabase: Create database schema (MVP subset)**
3. **Next.js: Auth flow + basic shell UI**
4. **Go server: Tick engine + WebSocket handler**
5. **Integration: Connect all three layers**
6. **Playtest with friends**
7. **Iterate based on feedback**

---

*Document version: 1.0*
*Last updated: January 2025*
