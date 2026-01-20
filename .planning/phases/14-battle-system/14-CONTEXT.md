# Phase 14: Battle System - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Progressive turn calculation and animation — transforming battles from instant resolution to turn-by-turn reveals with genuine uncertainty. Server calculates turns one at a time, client animates each before knowing the next outcome. Catch success is unknown until ball animation completes.

</domain>

<decisions>
## Implementation Decisions

### Turn Presentation
- Animated sprites + text: Pokemon sprites show attack animations alongside text log
- Attacker sprite slides toward defender then back (classic Pokemon feel)
- Variable pause between turns: longer for big hits, shorter for misses/weak attacks
- Type effectiveness announced with text + visual cue ("It's super effective!" plus screen flash)
- Move name and animation happen simultaneously
- Single message box for text (one message at a time, like classic Pokemon dialog)
- Critical hits get distinct visual treatment (screen shake, flash, or callout)
- Misses explicitly shown with text ("attack missed!") and visual cue (whiff animation)

### HP Bar Behavior
- Smooth drain animation over ~300-500ms
- Floating damage numbers appear from the Pokemon that took damage
- Classic green/yellow/red thresholds: green >50%, yellow 20-50%, red <20%
- Critical HP (<20%) shows pulsing bar (no sound)

### Catch Sequence
- Pokeball throw arc toward Pokemon, lands, shakes 1-3 times before result
- Suspenseful shakes: each shake has a pause, outcome unknown until final shake/break
- Catch success: ball glows + "Gotcha!" or "[Pokemon] was caught!" text
- Catch failure: ball pops open with flash, Pokemon sprite re-emerges
- Catch rate never shown directly — preserves uncertainty
- Boost indicator only when boosts active (shows "+10%" icon, not base rate)
- First-time catches (new Pokedex entry) get extra fanfare + "Registered to Pokedex!" message
- Different Pokeball types have distinct visual animations (Great Ball, Ultra Ball, etc.)

### Battle Pacing
- Snappy (faster) default pacing — quick animations, brief pauses, keeps idle feel flowing
- No skip option — battles play through to preserve progressive reveal and uncertainty
- Battle continues server-side if player disconnects
- On reconnect: summary only (text: "You won! Caught Pidgey. +50 XP.")
- 30-second timeout for disconnected clients (per requirements)
- 800ms animation budget per turn (per requirements)

### Claude's Discretion
- Exact animation timing within 800ms budget
- Screen flash colors and intensities
- Damage number styling and float behavior
- Specific shake timing for Pokeball suspense
- How to compress pacing when HP is low (both Pokemon critical)

</decisions>

<specifics>
## Specific Ideas

- "Classic Pokemon feel" for attack animations — slide toward target, not just flash effects
- Single message box like mainline Pokemon games, not a scrolling log
- Suspense is key for catches — the shakes should feel uncertain until the final moment
- Boost indicator addresses future monetization: players see their boosts are active without knowing exact rates

</specifics>

<deferred>
## Deferred Ideas

- Speed control (1x/2x/4x toggle) — needs different handling for raids vs solo; future consideration
- Auto-battle mode as prestige/unlock feature — future convenience option
- Sound effects — not discussed, could be separate audio phase

</deferred>

---

*Phase: 14-battle-system*
*Context gathered: 2026-01-20*
