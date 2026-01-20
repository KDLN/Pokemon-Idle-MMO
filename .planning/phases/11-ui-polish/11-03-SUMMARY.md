---
phase: 11-ui-polish
plan: 03
subsystem: game-ui
tags: [boosts, countdown-timer, toast-notification, zustand]

depends_on:
  requires:
    - 09-design-system (component patterns)
    - guild-shop (guildActiveBuffs state already exists)
  provides:
    - BoostCard component with live countdown timer
    - BoostExpiredToast notification component
    - Integration with guildActiveBuffs in GameShell
  affects:
    - 11-04 (guild bank polish can reference boost card styling)

tech_stack:
  added: []
  patterns:
    - useEffect interval for real-time countdown
    - formatCountdown utility for MM:SS / HH:MM:SS display
    - Zustand store for expiredBoosts notification queue

files:
  created:
    - apps/web/src/components/game/BoostCard.tsx
    - apps/web/src/components/game/BoostExpiredToast.tsx
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/components/game/GameShell.tsx

decisions:
  - Timer shows MM:SS for under 1 hour, HH:MM:SS for longer durations
  - Red + pulse animation when under 1 minute remaining
  - Empty state prompts users to guild shop

metrics:
  duration: 3 min
  completed: 2026-01-20
---

# Phase 11 Plan 03: Active Boosts Display Summary

**One-liner:** Live countdown timers on active guild boosts with red urgency state and toast notifications on expiry.

## What Was Built

### BoostCard Component
- Displays active buff with icon, name, and multiplier percentage (+10%)
- Live countdown timer updates every second via useEffect interval
- Timer shows MM:SS format, or HH:MM:SS if over an hour remaining
- Urgency state: border turns red and timer pulses when under 1 minute
- Expandable description section shows buff effect and purchaser name
- Auto-removes from DOM when buff expires, triggers onExpire callback

### BoostExpiredToast Component
- Toast notification appears when any boost expires
- Follows LevelUpToast pattern with red gradient styling
- Auto-clears after 4 seconds
- Supports multiple simultaneous expiry notifications with staggered animation

### Store Integration
- Added `expiredBoosts: GuildBuffType[]` state to track expired buffs
- Added `addExpiredBoost()` and `clearExpiredBoosts()` actions
- PartyColumn now reads `guildActiveBuffs` from store and renders BoostCard for each active buff

### GameShell Updates
- Removed old placeholder `AVAILABLE_BOOSTS` constant and `Boost` interface
- PartyColumn renders BoostCard for xp_bonus, catch_rate, encounter_rate buffs
- Empty state shows prompt: "Use a boost from your guild shop to enhance your training!"
- BoostExpiredToast added to both mobile and desktop floating modals section

## Technical Details

```typescript
// formatCountdown returns text and urgency flag
function formatCountdown(endTime: Date): { text: string; isUrgent: boolean } {
  const remainingMs = endTime.getTime() - Date.now()
  const isUrgent = remainingMs < 60000 // Under 1 minute
  // Returns "5:32" or "1:23:45" format
}

// BoostCard handles its own expiry detection
useEffect(() => {
  const update = () => {
    const remaining = endTime.getTime() - Date.now()
    if (remaining <= 0 && !hasExpired) {
      setHasExpired(true)
      onExpire?.()
      return
    }
    setCountdown(formatCountdown(endTime))
  }
  const interval = setInterval(update, 1000)
  return () => clearInterval(interval)
}, [buff.ends_at, onExpire, hasExpired])
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] BoostCard.tsx exists with countdown timer implementation
- [x] BoostExpiredToast.tsx exists following LevelUpToast pattern
- [x] gameStore.ts has expiredBoosts state and actions
- [x] GameShell.tsx imports and renders BoostCard components
- [x] Empty state message shows when no boosts active
- [x] Timer updates every second (verified via code review)
- [x] ESLint passes for new components

## Commits

1. `ff05339` - feat(11-03): create BoostCard component with countdown timer
2. `1de5ef4` - feat(11-03): integrate active boosts display with expiry toasts

## Next Phase Readiness

Ready to proceed. No blockers.

Note: Pre-existing build failure in BankPokemonTab.tsx (IV properties missing from GuildBankPokemon type) is unrelated to this plan and existed before execution.
