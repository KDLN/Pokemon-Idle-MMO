# Phase 14: Battle System - Research

**Researched:** 2026-01-20
**Domain:** Progressive turn revelation, battle animations, server-authoritative catch mechanics
**Confidence:** HIGH

## Summary

This phase transforms the battle system from instant resolution to progressive turn-by-turn revelation with genuine uncertainty. The core challenge is splitting the existing bulk battle calculation into server-computed turns sent progressively to clients, while maintaining the 800ms per-turn animation budget and ensuring battles auto-resolve on disconnect.

The existing codebase already has extensive infrastructure for this transformation:
- `simulate1v1Battle` in `game.ts` already computes full turn sequences (`BattleSequence`, `BattleTurn[]`)
- `useBattleAnimation` hook already implements a state machine for battle phases
- `ClassicBattleHud` and `EncounterDisplay` already render turn-by-turn animations
- CSS animations for attack, damage, HP drain, catch sequences already exist in `globals.css`

The primary change is architectural: instead of sending the complete `battle_sequence` array in one `tick` message, the server must send turns progressively with client acknowledgment before calculating the next turn.

**Primary recommendation:** Implement a request/response turn protocol where the client requests the next turn only after completing the current animation, with server-side battle state persistence and 30-second timeout protection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | existing | WebSocket bidirectional communication | Already used in game server |
| React useState/useEffect | existing | Animation state machine | Already used in useBattleAnimation |
| CSS Animations | existing | Visual effects, HP drain, attack animations | Already defined in globals.css |
| setTimeout | native | Animation timing and sequencing | Standard for discrete animation phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | existing | Client state management for battle state | Already stores currentEncounter |
| requestAnimationFrame | native | 60fps HP bar drain animations | For smooth numeric transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| setTimeout | requestAnimationFrame | rAF is better for continuous animations but setTimeout is more appropriate for discrete turn phases with fixed delays |
| CSS animations | Framer Motion | More control but adds dependency; CSS animations already work well for current needs |
| Custom state machine | XState | More formal but overkill for 11-state battle machine already implemented |

**Installation:**
No new dependencies required. All functionality can be built with existing stack.

## Architecture Patterns

### Recommended Protocol Structure

```
Server State                    Client State
+-----------------+            +-----------------+
| Active Battles  |            | Battle Animation|
| Map<playerId,   |            | State Machine   |
|   BattleState>  |            |                 |
+-----------------+            +-----------------+
       |                              |
       | turn_ready                   | request_turn
       |----------------------------->|
       |                              |
       |<-----------------------------|
       | turn_ack                     |
       |                              |
       | (calculate next turn)        |
       |                              |
       | turn_ready                   |
       |----------------------------->|
       |                              |
```

### Pattern 1: Server-Side Battle State Management
**What:** Store active battle state in memory keyed by player ID
**When to use:** When battle enters combat phase
**Example:**
```typescript
// Server-side battle state (hub.ts)
interface ActiveBattle {
  playerId: string
  wildPokemon: WildPokemon
  leadPokemon: Pokemon
  leadSpecies: PokemonSpecies
  playerHP: number
  wildHP: number
  turnNumber: number
  startedAt: number  // For timeout
  lastActivity: number  // For timeout
  status: 'battling' | 'catching' | 'complete'
}

private activeBattles: Map<string, ActiveBattle> = new Map()
```

### Pattern 2: Turn Request/Response Protocol
**What:** Client requests next turn, server calculates and responds
**When to use:** After each turn animation completes
**Example:**
```typescript
// Client -> Server: Request next turn
{ type: 'request_turn', payload: { battle_id: string } }

// Server -> Client: Turn data
{ type: 'battle_turn', payload: {
  turn: BattleTurn,
  battleStatus: 'ongoing' | 'player_win' | 'player_faint',
  canCatch: boolean  // true only after player wins
}}

// Client -> Server: Acknowledge turn complete (triggers next)
{ type: 'turn_ack', payload: { battle_id: string } }
```

### Pattern 3: Catch-at-Throw Calculation
**What:** Calculate catch success only when client requests catch attempt
**When to use:** After battle victory, when player would throw ball
**Example:**
```typescript
// Client -> Server: Attempt catch
{ type: 'attempt_catch', payload: { battle_id: string, ball_type: BallType } }

// Server: Calculate catch result NOW (not pre-computed)
const catchResult = attemptCatch(wildPokemon, ballCount, ballType, catchRateMultiplier)

// Server -> Client: Catch sequence data
{ type: 'catch_result', payload: {
  shakeCount: number,
  success: boolean,
  breakFreeShake: number | undefined
}}
```

### Pattern 4: Animation State Machine Extension
**What:** Extend existing useBattleAnimation to handle server-driven turns
**When to use:** Replace current self-contained animation with server-paced version
**Example:**
```typescript
// Extended phases for server-driven battle
export type BattlePhase =
  | 'idle'
  | 'appear'
  | 'battle_intro'
  | 'waiting_for_turn'    // NEW: waiting for server response
  | 'turn_attack'
  | 'turn_damage'
  | 'battle_end'
  | 'waiting_for_catch'   // NEW: waiting for catch calculation
  | 'catch_throw'
  | 'catch_shake'
  | 'catch_result'
  | 'rewards'
  | 'fade_out'
```

### Recommended Project Structure
```
apps/game-server/src/
  battle/
    battleManager.ts     # ActiveBattle state management
    turnCalculator.ts    # Single-turn calculation extracted from game.ts
    timeoutHandler.ts    # 30-second timeout logic
  hub.ts                 # Add battle message handlers

apps/web/src/
  hooks/
    useBattleAnimation.ts  # Extend for server-driven mode
  stores/
    gameStore.ts           # Add activeBattle state
```

### Anti-Patterns to Avoid
- **Pre-computing all turns:** Defeats the purpose of progressive revelation; player could predict outcomes
- **Client-side battle calculation:** Opens door to cheating; server must be authoritative
- **Blocking tick loop for battles:** Battle operations should be async, not block main tick
- **Storing battle state in session:** Use dedicated battle state map for cleaner separation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation timing | Manual setInterval | CSS animations + animation events | Browser-optimized, GPU-accelerated |
| HP bar smooth drain | Frame-by-frame updates | CSS transition with duration | `transition-all duration-500 ease-out` handles it |
| State machine | Giant switch statements | Existing phase-based pattern | useBattleAnimation already implements clean state machine |
| WebSocket message handling | New handler architecture | Existing handlers Map pattern | gameSocket.ts already has robust handler registration |
| Type effectiveness text | Hardcoded strings | Existing EFFECTIVENESS_MESSAGES | Already in useBattleAnimation.ts |

**Key insight:** The existing codebase has 90% of the battle animation infrastructure. The change is primarily about when data arrives (progressive vs bulk), not how it's rendered.

## Common Pitfalls

### Pitfall 1: Race Conditions in Turn Acknowledgment
**What goes wrong:** Client sends turn_ack before animation completes, or server sends next turn before client ready
**Why it happens:** Network latency and animation timing don't align perfectly
**How to avoid:** Client must explicitly request next turn after animation complete, not auto-send ack
**Warning signs:** Turns skip, animations overlap, HP jumps instead of animating

### Pitfall 2: Battle State Leak on Disconnect
**What goes wrong:** Active battle persists in memory after client disconnects without cleanup
**Why it happens:** No cleanup in handleDisconnect for battle state
**How to avoid:** Clear activeBattles entry in handleDisconnect, auto-resolve battle
**Warning signs:** Memory grows over time, stale battles appear on reconnect

### Pitfall 3: Timeout Not Enforced
**What goes wrong:** Disconnected client's battle hangs forever, blocking resources
**Why it happens:** No periodic check of lastActivity timestamp
**How to avoid:** Add cleanup interval that checks all battles for 30-second timeout
**Warning signs:** activeBattles map grows unbounded

### Pitfall 4: Animation Budget Exceeded
**What goes wrong:** Turn animations take longer than 800ms, battles feel sluggish
**Why it happens:** Compounding delays from multiple effects (attack + damage + effectiveness text)
**How to avoid:** Hard cap total turn animation at 800ms, use concurrent animations not sequential
**Warning signs:** Battle feels slow, players complain about idle game feeling blocked

### Pitfall 5: Catch Rate Revealed Through Timing
**What goes wrong:** Players can deduce catch chance from shake count before result
**Why it happens:** Shake count correlates with catch probability in current implementation
**How to avoid:** Always show 3 shakes, vary timing between shakes for suspense
**Warning signs:** Players share "if it shakes 3 times slowly, it's caught" type knowledge

## Code Examples

Verified patterns from existing codebase:

### Existing Turn Data Structure
```typescript
// Source: packages/shared/src/types/battle.ts
export interface BattleTurn {
  turn_number: number
  attacker: 'player' | 'wild' | 'gym'
  attacker_name: string
  defender_name: string
  damage_dealt: number
  is_critical: boolean
  effectiveness: 'super' | 'neutral' | 'not_very' | 'immune'
  attacker_hp_after: number
  defender_hp_after: number
  attacker_max_hp: number
  defender_max_hp: number
  move_name: string
  move_type: string
  status_effect?: string
}
```

### Existing Animation Phase Durations
```typescript
// Source: apps/web/src/hooks/useBattleAnimation.ts
const PHASE_DURATIONS = {
  appear: 800,
  battle_intro: 1000,
  turn_attack: 500,
  turn_damage: 400,
  battle_end: 1200,
  catch_throw: 600,
  catch_shake: 700,  // Per shake
  catch_result: 1200,
  rewards: 1000,
  fade_out: 500
}
// Total per turn: turn_attack (500) + turn_damage (400) = 900ms
// Current: already over 800ms budget - need to compress
```

### Existing HP Bar Animation CSS
```css
/* Source: apps/web/src/app/globals.css */
@keyframes hp-drain {
  from { width: var(--hp-from); }
  to { width: var(--hp-to); }
}

.animate-hp-drain {
  animation: hp-drain 0.4s ease-out forwards;
}
```

### Existing Attack Animation CSS
```css
/* Source: apps/web/src/app/globals.css */
@keyframes attack-lunge {
  0% { transform: translateX(0); }
  40% { transform: translateX(30px); }
  100% { transform: translateX(0); }
}

.animate-attack-lunge {
  animation: attack-lunge 0.3s ease-out;
}
```

### Existing Message Handler Pattern
```typescript
// Source: apps/web/src/lib/ws/gameSocket.ts
this.handlers.set('tick', this.handleTick)
this.handlers.set('game_state', this.handleGameState)
// Pattern: Register handler in constructor, implement as method
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-computed battle arrays | Server-authoritative progressive turns | This phase | Real uncertainty, no spoilers |
| Instant catch result | Catch calculated at throw moment | This phase | Genuine suspense |
| Client-side battle state | Server manages active battles | This phase | Cheat prevention |

**Deprecated/outdated:**
- Sending complete `battle_sequence` in tick result: Will be replaced with progressive protocol
- Auto-advancing turns in useBattleAnimation: Will request from server instead

## Open Questions

Things that couldn't be fully resolved:

1. **Encounter Cooldown Interaction**
   - What we know: Currently ENCOUNTER_COOLDOWN_TICKS = 8 seconds between encounters
   - What's unclear: Should cooldown start when battle begins or when it ends?
   - Recommendation: Start cooldown when battle ends to prevent overlapping battles

2. **Reconnect During Battle**
   - What we know: On reconnect, show summary text per requirements
   - What's unclear: What if battle is still ongoing (not timed out yet)?
   - Recommendation: If battle still active (<30s), resume progressive turns; if completed, show summary

3. **Multiple Tabs**
   - What we know: broadcastToPlayer exists for cross-tab sync
   - What's unclear: Should battle be synchronized across tabs or only in active tab?
   - Recommendation: Battle in single tab only; other tabs see "Battle in progress" message

## Animation Budget Analysis

Per requirement BATTLE-07: 800ms max per turn

**Current phase durations (from useBattleAnimation.ts):**
- turn_attack: 500ms
- turn_damage: 400ms
- **Total: 900ms (over budget)**

**Recommended compressed timing:**
- turn_attack + turn_damage concurrent: 500ms
- HP drain runs alongside damage display
- Text updates immediately, no separate phase
- **Total: ~500ms per turn (well under budget)**

**Implementation:**
```typescript
// Instead of sequential phases
schedulePhase('turn_attack', 500)
schedulePhase('turn_damage', 400) // After attack

// Use concurrent animations
setState({
  phase: 'turn_active',
  showAttackAnimation: true,
  showDamageNumber: true,  // Show simultaneously
  playerHP: newHP,  // HP starts draining immediately
})
schedulePhase('turn_complete', 500) // Single 500ms phase
```

## Suspense Mechanisms

### HP Bar Suspense
- Drain animation over 300-500ms (per requirements)
- Green > 50%, Yellow 20-50%, Red < 20%
- Pulse animation when critical (<20%)

### Catch Suspense
- Always show 3 shakes (hide probability correlation)
- Variable pause between shakes: 0.5s, 0.7s, 0.9s
- Outcome revealed only after final shake animation
- Ball wobble timing doesn't correlate with success

## Sources

### Primary (HIGH confidence)
- `apps/game-server/src/game.ts` - Existing battle calculation logic
- `apps/web/src/hooks/useBattleAnimation.ts` - Existing animation state machine
- `packages/shared/src/types/battle.ts` - Existing type definitions
- `apps/web/src/app/globals.css` - Existing animation CSS
- `.planning/phases/14-battle-system/14-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)
- [WebSockets for Game Development](https://playgama.com/blog/general/understanding-websockets-a-beginners-guide-for-game-development/) - Real-time game patterns
- [Turn-based Game State Machine on npm](https://www.npmjs.com/search?q=turn-based) - Server-authoritative pattern reference
- [requestAnimationFrame vs setTimeout](https://blog.openreplay.com/requestanimationframe-settimeout-use/) - Animation timing best practices
- [Tailwind CSS Transitions](https://tailwindcss.com/docs/animation) - CSS animation utilities

### Tertiary (LOW confidence)
- [XState Introduction](https://geekyants.com/blog/introduction-to-state-machines-in-react-with-xstate) - Formal state machine patterns (not adopting, but informed design)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only existing libraries, no new dependencies
- Architecture: HIGH - Clear patterns from existing codebase, well-understood WebSocket protocols
- Animation timing: HIGH - Existing CSS animations proven to work, only need compression
- Pitfalls: MEDIUM - Some edge cases around reconnect/timeout may need iteration

**Research date:** 2026-01-20
**Valid until:** 60 days (stable architecture, no external dependencies changing)
