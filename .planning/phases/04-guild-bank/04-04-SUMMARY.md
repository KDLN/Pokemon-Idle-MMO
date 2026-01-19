---
phase: 04-guild-bank
plan: 04
subsystem: ui
tags: [react, zustand, websocket, guild-bank, modal, tabs]

# Dependency graph
requires:
  - phase: 04-02
    provides: GuildBank shared types
  - phase: 04-03
    provides: WebSocket handlers on game server
provides:
  - Guild bank state management in Zustand store
  - WebSocket handlers for all guild bank operations
  - GuildBankModal with tabbed interface
  - BankCurrencyTab with deposit/withdraw/request
  - BankItemsTab with split view bank/inventory
  - BankSettingsTab for leader limit configuration
affects: [04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tabbed modal with dynamic tab visibility based on role
    - Split-view for bank vs player inventory
    - Inline editing for settings tables

key-files:
  created:
    - apps/web/src/components/game/guild/GuildBankModal.tsx
    - apps/web/src/components/game/guild/BankItemsTab.tsx
    - apps/web/src/components/game/guild/BankSettingsTab.tsx
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/lib/ws/gameSocket.ts
    - apps/web/src/components/game/guild/index.ts

key-decisions:
  - "Members can request withdrawals; only officers/leaders withdraw directly"
  - "Settings tab only visible to leaders"
  - "Requests tab with badge count only for officers/leaders"

patterns-established:
  - "Role-based tab visibility in modal interfaces"
  - "Split-view layout for bank operations (bank | inventory)"

# Metrics
duration: 18min
completed: 2025-01-18
---

# Phase 04 Plan 04: Guild Bank Withdrawal System Summary

**Guild bank modal with role-based tabs, currency/item deposit-withdraw UI, and leader-only limit configuration**

## Performance

- **Duration:** 18 min
- **Started:** 2025-01-18T19:23:00Z
- **Completed:** 2025-01-18T19:41:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Zustand store now tracks guildBank, guildBankLogs, guildBankRequests, myBankLimits with 10+ actions
- WebSocket handlers for 13 guild bank message types plus 14 send methods
- Tabbed modal UI with Currency, Items, Pokemon, Logs, Requests, Settings tabs
- Currency tab with balance display, deposit/withdraw toggle, quick amount buttons
- Items tab with categorized bank view and inventory search/selection
- Settings tab for leaders to configure daily withdrawal limits per role

## Task Commits

Each task was committed atomically:

1. **Task 1: Guild bank state and WebSocket handlers** - `d8e7a46` (feat)
2. **Task 2: GuildBankModal with tabbed interface** - `42583a0` (feat)
3. **Task 3: BankCurrencyTab, BankItemsTab, BankSettingsTab** - `5adc54b` (feat)

## Files Created/Modified
- `apps/web/src/stores/gameStore.ts` - Added guildBank state and 10 actions
- `apps/web/src/lib/ws/gameSocket.ts` - Added 13 handlers and 14 send methods
- `apps/web/src/components/game/guild/GuildBankModal.tsx` - Main modal with 6 tabs
- `apps/web/src/components/game/guild/BankCurrencyTab.tsx` - Currency deposit/withdraw (existed)
- `apps/web/src/components/game/guild/BankItemsTab.tsx` - Items with split view
- `apps/web/src/components/game/guild/BankSettingsTab.tsx` - Leader limit configuration
- `apps/web/src/components/game/guild/index.ts` - Updated exports

## Decisions Made
- Used flex-based layout instead of absolute positioning for action panels (better modal behavior)
- Members see "Request" button instead of "Withdraw" for items/pokemon
- Pending request count badge on Requests tab for officers/leaders
- Leaders always unlimited (read-only row in settings table)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing BankPokemonTab.tsx had TypeScript error (`species_name` not on Pokemon type) - already fixed in prior work

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Modal UI complete for currency/items, placeholder content for Pokemon/Logs/Requests tabs
- BankPokemonTab.tsx exists from separate work (plan 04-05), can be integrated
- Ready for remaining tab implementations and GuildPanel integration

---
*Phase: 04-guild-bank*
*Completed: 2025-01-18*
