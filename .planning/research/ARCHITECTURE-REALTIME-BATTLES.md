# Architecture Research: Real-Time Battles

**Domain:** Real-time battle calculation with progressive reveal
**Researched:** 2026-01-19
**Confidence:** HIGH (based on existing codebase analysis + industry patterns)

## Executive Summary

The current architecture pre-computes entire battle outcomes on the server and sends complete `BattleSequence` data to the client for animation playback. For v1.1 real-time battles, the architecture needs to shift to **progressive server-client synchronization** where battle calculations happen turn-by-turn during animation, maintaining server authority while enabling true uncertainty.

This document outlines how to transition from "pre-computed playback" to "live calculation with progressive reveal" while preserving the existing tick loop architecture and preventing disconnect exploits.

---

## Current Architecture

### How Battles Work Now

```
+-----------------------------------------------------------------+
|                        SERVER (hub.ts)                          |
+-----------------------------------------------------------------+
|  1. processTick() runs every 1 second                           |
|  2. rollEncounter() - if encounter happens:                     |
|     a. generateWildPokemon() creates wild with stats            |
|     b. simulate1v1Battle() PRE-COMPUTES entire battle           |
|        - All turns calculated                                   |
|        - Final outcome determined                               |
|        - XP calculated                                          |
|     c. attemptCatch() PRE-COMPUTES catch result                 |
|  3. Send complete EncounterEvent with BattleSequence to client  |
+-------------------------------+---------------------------------+
                                | WebSocket 'tick' message
                                v
+-----------------------------------------------------------------+
|                        CLIENT (web)                             |
+-----------------------------------------------------------------+
|  1. gameStore receives tick with encounter                      |
|  2. useBattleAnimation() state machine plays back pre-computed  |
|     sequence purely for visual effect                           |
|  3. Outcome was already decided - animation is just theater     |
|  4. On animation complete, apply rewards to UI                  |
+-----------------------------------------------------------------+
```

### Current Data Flow

**Server sends (EncounterEvent):**
```typescript
{
  wild_pokemon: WildPokemon,
  battle_result: 'win' | 'lose' | 'fled' | 'wipe',  // Pre-determined
  battle_sequence: {                                  // All turns pre-computed
    turns: BattleTurn[],                             // Every hit pre-calculated
    final_outcome: 'player_win' | 'player_faint',
    xp_earned: number                                // Pre-calculated
  },
  catch_result?: {                                   // Pre-determined if battle won
    success: boolean,
    catch_sequence: { shake_count, break_free_shake }
  }
}
```

**Client receives all data upfront** - the animation is purely cosmetic. A player could theoretically:
1. See they'll lose, disconnect
2. Reconnect before tick processes
3. Avoid the outcome

### Problems with Current Approach

1. **No true uncertainty** - Outcome known before animation plays
2. **Potential exploit vector** - Disconnect on bad outcome preview
3. **Limits future features** - Can't implement EVs, abilities, or player intervention during battle
4. **Scalability** - Pre-computing multi-Pokemon gym battles is expensive

---

## Proposed Architecture

### Core Principle: Server-Authoritative Progressive Revelation

The server remains the **single source of truth**, but reveals outcomes incrementally as the client renders each phase. The client never knows the final outcome until it's calculated and committed.

```
+-----------------------------------------------------------------+
|                   NEW BATTLE FLOW                               |
+-----------------------------------------------------------------+
|                                                                 |
|  +----------+    battle_start     +----------+                  |
|  |  SERVER  | ------------------> |  CLIENT  |                  |
|  |          |                     |          |                  |
|  |          | <------------------ |          |                  |
|  |          |   ready_for_turn    |          |                  |
|  |          |                     |          |                  |
|  | Calculate|    battle_turn      |  Animate |                  |
|  | turn N   | ------------------> |  turn N  |                  |
|  |          |                     |          |                  |
|  |          | <------------------ |          |                  |
|  |          |   turn_complete     |          |                  |
|  |          |                     |          |                  |
|  | Calculate|    battle_turn      |  Animate |                  |
|  | turn N+1 | ------------------> |  turn N+1|                  |
|  |          |         ...         |          |                  |
|  |          |                     |          |                  |
|  | Determine|   battle_end        |  Show    |                  |
|  | outcome  | ------------------> |  result  |                  |
|  |          |                     |          |                  |
|  | If win   |   catch_phase       |  Catch   |                  |
|  | + balls  | ------------------> |  anim    |                  |
|  |          |                     |          |                  |
|  | Calculate|   catch_result      |  Reveal  |                  |
|  | at shake | ------------------> |  outcome |                  |
|  +----------+                     +----------+                  |
|                                                                 |
+-----------------------------------------------------------------+
```

### Battle State Machine (Server-Side)

```typescript
type BattlePhase =
  | 'idle'           // No active battle
  | 'starting'       // Wild Pokemon spawned, waiting for client ready
  | 'turn_pending'   // Server calculating next turn
  | 'turn_sent'      // Turn sent, waiting for client animation complete
  | 'battle_ending'  // Final turn played, determining outcome
  | 'catch_pending'  // Battle won, catch calculation pending
  | 'catch_thrown'   // Ball thrown, shakes pending
  | 'completed'      // Battle fully resolved

interface ActiveBattle {
  phase: BattlePhase
  wildPokemon: WildPokemon
  playerPokemonId: string
  playerCurrentHP: number
  wildCurrentHP: number
  turnNumber: number
  battleStartTime: number    // For timeout handling
  lastActionTime: number     // For disconnect detection
}
```

### Disconnect Protection

**Problem:** Player could disconnect during battle to avoid bad outcome.

**Solution:** Server commits outcomes progressively and handles disconnects gracefully:

1. **Battle timeout** - If client doesn't respond within X seconds, server auto-resolves remaining turns and applies results
2. **Reconnect handling** - On reconnect, server sends current battle state or final result if already resolved
3. **Damage persists immediately** - HP changes applied to session as soon as calculated, not after animation
4. **No "cancel battle" option** - Once battle starts, it must resolve

```typescript
interface PlayerSession {
  // ... existing fields
  activeBattle?: ActiveBattle    // NEW: Current battle state
  battleTimeout?: NodeJS.Timeout // NEW: Auto-resolve timer
}
```

---

## Server Changes

### Tick Loop Modifications

The tick loop shifts from "process everything at once" to "manage battle state machine":

```typescript
// Current: processTick does everything
const result = processTick(client.session, this.speciesMap, guildBuffs)

// New: Tick loop manages battle phases
private async processTicks() {
  for (const [, client] of this.clients) {
    if (!client.session) continue

    // If player has active battle, manage battle state
    if (client.session.activeBattle) {
      await this.processBattleTick(client)
      continue  // Skip normal encounter processing during battle
    }

    // Normal tick processing for players not in battle
    const result = await this.processIdleTick(client)
    if (result.battleStarted) {
      // New encounter - initialize battle state
      client.session.activeBattle = this.initializeBattle(result.wild)
      this.send(client, 'battle_start', {
        wild_pokemon: result.wild,
        player_pokemon: this.getLeadPokemon(client.session)
      })
    }
  }
}

private async processBattleTick(client: Client) {
  const battle = client.session!.activeBattle!

  // Check for timeout (disconnect protection)
  if (Date.now() - battle.lastActionTime > BATTLE_TIMEOUT_MS) {
    await this.autoResolveBattle(client)
    return
  }

  // State machine handles current phase
  switch (battle.phase) {
    case 'turn_pending':
      // Calculate and send next turn
      const turn = this.calculateTurn(battle, client.session!)
      battle.phase = 'turn_sent'
      this.send(client, 'battle_turn', turn)
      break

    case 'battle_ending':
      // Determine and send final outcome
      const outcome = this.determineBattleOutcome(battle)
      await this.applyBattleResults(client, outcome)
      break

    // ... other phases
  }
}
```

### New Hub Methods

```typescript
// Initialize battle state when encounter happens
private initializeBattle(wild: WildPokemon, lead: Pokemon): ActiveBattle {
  return {
    phase: 'starting',
    wildPokemon: wild,
    playerPokemonId: lead.id,
    playerCurrentHP: lead.current_hp,
    wildCurrentHP: wild.max_hp,
    turnNumber: 0,
    battleStartTime: Date.now(),
    lastActionTime: Date.now()
  }
}

// Calculate a single turn (not the whole battle)
private calculateTurn(battle: ActiveBattle, session: PlayerSession): BattleTurn {
  // Move selection logic (from game.ts)
  // Damage calculation (from game.ts)
  // Returns single turn result
  // Does NOT calculate subsequent turns
}

// Handle client saying "I'm ready for next action"
private handleBattleReady(client: Client) {
  const battle = client.session?.activeBattle
  if (!battle) return

  battle.lastActionTime = Date.now()

  switch (battle.phase) {
    case 'starting':
      battle.phase = 'turn_pending'
      break
    case 'turn_sent':
      // Client finished animating turn
      if (battle.wildCurrentHP <= 0 || battle.playerCurrentHP <= 0) {
        battle.phase = 'battle_ending'
      } else {
        battle.phase = 'turn_pending'
        battle.turnNumber++
      }
      break
    // ... catch phases
  }
}

// Auto-resolve battle on disconnect/timeout
private async autoResolveBattle(client: Client) {
  const battle = client.session?.activeBattle
  if (!battle) return

  // Fast-forward remaining turns
  while (battle.wildCurrentHP > 0 && battle.playerCurrentHP > 0) {
    const turn = this.calculateTurn(battle, client.session!)
    // Apply turn to battle state
    if (turn.attacker === 'player') {
      battle.wildCurrentHP = turn.defender_hp_after
    } else {
      battle.playerCurrentHP = turn.defender_hp_after
    }
  }

  // Apply final results
  await this.applyBattleResults(client, this.determineBattleOutcome(battle))
}
```

### Game.ts Modifications

Extract turn calculation from `simulate1v1Battle`:

```typescript
// KEEP: Used for gym battles (still pre-computed for simplicity)
export function simulate1v1Battle(...): BattleSequence { ... }

// NEW: Calculate single turn for progressive battles
export function calculateSingleTurn(
  attacker: { pokemon: Pokemon, species: PokemonSpecies } | { wild: WildPokemon },
  defender: { pokemon: Pokemon, species: PokemonSpecies } | { wild: WildPokemon },
  attackerCurrentHP: number,
  defenderCurrentHP: number
): BattleTurn {
  // Extract existing damage calculation logic
  // Return single turn result
}

// NEW: Determine catch success (called at moment of throw, not before)
export function calculateCatchAttempt(
  wild: WildPokemon,
  ballType: BallType,
  catchRateMultiplier: number
): { success: boolean; shakeCount: number; breakFreeShake?: number } {
  // Existing attemptCatch logic but returns only calculation result
}
```

---

## Client Changes

### How Frontend Handles Progressive Reveal

**Key principle:** Client animates what server sends, requests next action when ready.

```typescript
// New WebSocket message handlers in gameSocket.ts

case 'battle_start':
  // Initialize battle UI, show wild appearing
  gameStore.setState({
    currentBattle: {
      phase: 'starting',
      wild: payload.wild_pokemon,
      playerPokemon: payload.player_pokemon,
      turns: []
    }
  })
  // Send ready when appear animation completes
  break

case 'battle_turn':
  // Add turn to battle state, trigger animation
  gameStore.getState().addBattleTurn(payload)
  // Animation hook will send 'battle_ready' when complete
  break

case 'battle_end':
  // Show outcome, apply rewards
  gameStore.getState().completeBattle(payload)
  break

case 'catch_shake':
  // Animate ball shake (server sends one at a time)
  gameStore.getState().addCatchShake(payload.shake_number)
  break

case 'catch_result':
  // Reveal catch outcome
  gameStore.getState().completeCatch(payload)
  break
```

### Modified useBattleAnimation Hook

```typescript
export function useBattleAnimation(
  battle: ActiveBattleState | null,
  sendReady: () => void,  // NEW: Callback to notify server
  onComplete: () => void
) {
  // State machine now driven by incoming turns, not pre-computed sequence

  useEffect(() => {
    if (!battle) return

    switch (battle.phase) {
      case 'starting':
        // Animate wild appearing
        // When done: sendReady()
        break

      case 'turn_received':
        // Animate the turn
        // When done: sendReady()
        break

      case 'waiting_turn':
        // Show "waiting..." or idle animation
        break

      case 'ending':
        // Animate outcome
        // onComplete()
        break
    }
  }, [battle?.phase, battle?.turns.length])
}
```

### Client State Machine

```typescript
type ClientBattlePhase =
  | 'starting'        // Wild appearing animation
  | 'waiting_turn'    // Waiting for server to send turn
  | 'turn_received'   // Animating turn
  | 'catch_throwing'  // Ball throw animation
  | 'catch_shaking'   // Ball shake animation
  | 'ending'          // Outcome reveal
  | 'completed'       // Battle done

interface ActiveBattleState {
  phase: ClientBattlePhase
  wild: WildPokemon
  playerPokemon: Pokemon
  playerCurrentHP: number
  wildCurrentHP: number
  turns: BattleTurn[]        // Accumulated as they arrive
  catchShakes: number        // Accumulated as they arrive
  outcome?: 'win' | 'lose'
  catchResult?: 'caught' | 'escaped'
}
```

---

## Message Protocol

### New/Modified WebSocket Messages

**Client -> Server:**
```typescript
// Player ready for next battle action
{ type: 'battle_ready' }

// Player requests catch attempt (after battle win)
{ type: 'throw_ball', payload: { ball_type: BallType } }
```

**Server -> Client:**
```typescript
// Battle initiated
{ type: 'battle_start', payload: {
  wild_pokemon: WildPokemon,
  player_pokemon: { id, name, species_id, current_hp, max_hp, level }
}}

// Single turn result
{ type: 'battle_turn', payload: BattleTurn }

// Battle concluded
{ type: 'battle_end', payload: {
  outcome: 'player_win' | 'player_faint',
  player_final_hp: number,
  xp_earned: number,
  money_earned: number,
  can_catch: boolean  // Has balls and won?
}}

// Catch phase started
{ type: 'catch_start', payload: { ball_type: BallType }}

// Individual shake
{ type: 'catch_shake', payload: { shake_number: 1 | 2 | 3 }}

// Catch result
{ type: 'catch_result', payload: {
  success: boolean,
  caught_pokemon?: Pokemon & { species: PokemonSpecies }
}}

// Battle forcibly resolved (timeout/disconnect recovery)
{ type: 'battle_resolved', payload: {
  outcome: 'player_win' | 'player_faint',
  turns: BattleTurn[],  // All turns that happened
  catch_result?: CatchResult
}}
```

### Backward Compatibility

During migration, support both patterns:

```typescript
// Server can send either:
// OLD: { type: 'tick', payload: { encounter: EncounterEvent } }
// NEW: { type: 'battle_start', ... } followed by { type: 'battle_turn', ... }

// Client detects mode by message type
```

---

## Migration Path

### Phase 1: Battle State Infrastructure (No Visible Change)

1. Add `ActiveBattle` type and `activeBattle` field to `PlayerSession`
2. Add battle phase tracking without changing behavior
3. Add timeout handling infrastructure
4. Add new message types (but don't send them yet)

**Risk:** LOW - Pure additions, no behavior change

### Phase 2: Server-Side Progressive Calculation

1. Refactor `simulate1v1Battle` to support single-turn calculation
2. Modify encounter processing to initialize battle state instead of pre-computing
3. Implement `processBattleTick` state machine
4. Auto-resolve still produces complete `BattleSequence` for backward compatibility

**Risk:** MEDIUM - Battle logic changes, needs thorough testing

### Phase 3: Progressive Protocol

1. Enable new message types (`battle_start`, `battle_turn`, etc.)
2. Send turns one at a time instead of all at once
3. Client still receives full sequence, but incrementally

**Risk:** MEDIUM - Protocol change, client must handle both patterns

### Phase 4: Client Progressive Animation

1. Modify `useBattleAnimation` to work incrementally
2. Add `battle_ready` acknowledgment
3. Remove pre-computed sequence assumption
4. Update gameStore battle state management

**Risk:** MEDIUM - Animation timing changes

### Phase 5: Catch at Throw Time

1. Move catch calculation from encounter processing to `throw_ball` handler
2. Send shake results incrementally
3. Calculate success only after final shake

**Risk:** LOW - Isolated change, catch is independent subsystem

### Phase 6: Remove Legacy Pattern

1. Remove pre-computed battle support
2. Clean up backward compatibility code
3. Simplify message protocol

**Risk:** LOW - Cleanup only

---

## Build Order

Dependencies between changes:

```
1. Battle State Infrastructure
   +-- 2. Server Progressive Calculation
       +-- 3. Progressive Protocol
       |   +-- 4. Client Progressive Animation
       |       +-- 6. Remove Legacy
       +-- 5. Catch at Throw Time
           +-- 6. Remove Legacy
```

**Recommended implementation order:**

| Phase | Depends On | Can Parallel With |
|-------|------------|-------------------|
| 1. Infrastructure | - | - |
| 2. Server Calc | 1 | - |
| 3. Protocol | 2 | - |
| 4. Client Animation | 3 | 5 |
| 5. Catch Changes | 2 | 4 |
| 6. Cleanup | 4, 5 | - |

---

## Component Boundaries

### Server Components

| Component | Responsibility | Modified Files |
|-----------|---------------|----------------|
| Hub | Battle state machine, timeout handling | `hub.ts` |
| Game | Turn calculation, damage formulas | `game.ts` |
| Types | Battle state types | `types.ts` |
| DB | No changes needed | - |

### Client Components

| Component | Responsibility | Modified Files |
|-----------|---------------|----------------|
| gameSocket | New message handlers | `gameSocket.ts` |
| gameStore | Battle state management | `gameStore.ts` |
| useBattleAnimation | Progressive animation | `useBattleAnimation.ts` |
| EncounterDisplay | UI updates | `EncounterDisplay.tsx` |

### Shared Package

| Component | Responsibility | Modified Files |
|-----------|---------------|----------------|
| Types | New message payload types | `types/*.ts` |

---

## Scalability Considerations

| Concern | Current | With Progressive | At Scale |
|---------|---------|------------------|----------|
| Memory per player | Low (no battle state) | +~200 bytes per active battle | Negligible |
| CPU per battle | Spike (all turns at once) | Distributed over animation time | Better |
| Network messages | 1 large message | 5-15 small messages | Slightly more overhead, better perceived latency |
| Disconnect handling | No special handling | Battle timeout + auto-resolve | Robust |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Battle Resolution
**What:** Letting client calculate damage or determine outcomes
**Why bad:** Exploitable, desync potential
**Instead:** Server calculates everything, client only animates

### Anti-Pattern 2: Optimistic Updates for Battle State
**What:** Client predicts turn outcomes before server confirms
**Why bad:** Misleading if server disagrees, complicated reconciliation
**Instead:** Client shows "calculating..." until server sends turn

### Anti-Pattern 3: Blocking Tick Loop on Battle
**What:** Making tick loop wait for client animation
**Why bad:** Other players affected, scalability nightmare
**Instead:** Async battle processing, non-blocking state machine

### Anti-Pattern 4: Persisting Battle State to Database
**What:** Saving `ActiveBattle` to database
**Why bad:** Overcomplicated, battles are short-lived
**Instead:** In-memory only, reconstruct on disconnect if needed

---

## Sources

**Codebase Analysis (HIGH confidence):**
- `apps/game-server/src/hub.ts` - Current tick loop and WebSocket handling
- `apps/game-server/src/game.ts` - Battle calculation logic (simulate1v1Battle, calculateDamage)
- `apps/game-server/src/types.ts` - PlayerSession and battle types
- `apps/web/src/hooks/useBattleAnimation.ts` - Current client animation state machine
- `packages/shared/src/types/battle.ts` - BattleSequence, BattleTurn types

**Industry Patterns (MEDIUM confidence):**
- [Turn-Based Game Architecture Guide](https://outscal.com/blog/turn-based-game-architecture) - State machines, command patterns
- [Client-Side Prediction and Server Reconciliation](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html) - Server authority patterns
- [Game Server Synchronization](https://engineering.monstar-lab.com/en/post/2021/02/09/Game-server-Synchronization/) - State-synchronized vs input-synchronized
- [Server Authoritative Card Games](https://www.mplgaming.com/server-authoritative-games/) - Anti-cheat through server authority
- [WebSocket Multiplayer Architecture](https://dev.to/dowerdev/building-a-real-time-multiplayer-game-server-with-socketio-and-redis-architecture-and-583m) - Room-based game patterns

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Current architecture analysis | HIGH | Direct codebase inspection |
| Progressive revelation pattern | HIGH | Well-established game dev pattern |
| Disconnect protection | HIGH | Standard server-authoritative approach |
| Migration path | MEDIUM | Depends on testing thoroughness |
| Performance impact | MEDIUM | Need to verify under load |

---

## Open Questions

1. **Gym battles:** Should gym battles also become progressive, or remain pre-computed since they're player-initiated and more complex?

2. **Animation timing:** If server sends turns faster than client animates, should we queue or drop? (Recommend: queue with max buffer)

3. **Reconnect mid-battle:** Should player see animation of missed turns, or just final state? (Recommend: final state only for simplicity)

4. **Battle timeout duration:** How long to wait before auto-resolving? (Recommend: 30 seconds, covers network hiccups without letting exploits work)

---

*Architecture research completed: 2026-01-19*
