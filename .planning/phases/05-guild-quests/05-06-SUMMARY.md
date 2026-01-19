---
phase: 05-guild-quests
plan: 06
subsystem: frontend
tags: [guild, quests, ui, confetti, modal]

dependency-graph:
  requires: ["05-03", "05-04"]
  provides: ["guild-quests-ui"]
  affects: ["06-stats"]

tech-stack:
  added: []
  patterns:
    - Modal with tabs
    - Expandable card sections
    - Custom events for cross-component communication

key-files:
  created:
    - apps/web/src/lib/confetti.ts
    - apps/web/src/components/game/guild/QuestCard.tsx
    - apps/web/src/components/game/guild/QuestHistoryTab.tsx
    - apps/web/src/components/game/guild/GuildQuestsModal.tsx
  modified:
    - apps/web/src/stores/gameStore.ts
    - apps/web/src/lib/ws/gameSocket.ts
    - apps/web/src/components/game/guild/index.ts
    - apps/web/src/components/game/guild/GuildPanel.tsx

decisions:
  - decision: "Added guild quest state management as blocking fix"
    rationale: "Plan referenced non-existent store state; required for UI to function"
  - decision: "Custom event for quest completion confetti"
    rationale: "Cross-component communication without prop drilling"
  - decision: "Purple color for Quests button"
    rationale: "Distinct from Bank (yellow) and Leave/Disband (red)"

metrics:
  duration: "~15 minutes"
  completed: "2026-01-19"
---

# Phase 5 Plan 6: Guild Quests UI Summary

Guild Quests modal with daily/weekly sections, progress bars, reroll functionality, history tab, and confetti celebration.

## What Was Built

### Confetti Utility (apps/web/src/lib/confetti.ts)
- `fireConfetti()` - Burst from both sides of screen
- `fireConfettiAtElement()` - Burst centered on specific element
- Uses canvas-confetti library (already installed)

### QuestCard Component
- Progress bar with current/target and percentage
- Quest type icons (catch, battle, evolve)
- Reward display with currency/items/guild points
- Expandable contribution leaderboard (fetched on demand)
- Reroll button for leaders/officers with currency check
- Confetti animation on quest completion via custom event

### GuildQuestsModal Component
- Two tabs: Active Quests, History
- Daily and weekly quests in separate sections
- Reset countdown timers (shows time when <6 hours, date otherwise)
- Reroll status for leaders/officers showing remaining rerolls and cost
- Keyboard escape to close

### QuestHistoryTab Component
- Paginated list of archived quests
- Color-coded by completion status (green/red)
- Shows final progress, rewards earned, top contributors

### Integration
- Quests button added to GuildPanel (purple color)
- All components exported from index.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing guild quest state and WebSocket handlers**
- **Found during:** Task pre-check
- **Issue:** Plan referenced `guildQuests`, `guildQuestDetails`, `guildQuestHistory` state and `getGuildQuests`, `getQuestDetails`, `rerollQuest`, `getQuestHistory` methods which didn't exist
- **Fix:** Added guild quest state to gameStore and 9 WebSocket handlers + 4 methods to gameSocket
- **Files modified:** gameStore.ts, gameSocket.ts
- **Commit:** 545fc5d

## Technical Notes

- Quest completion triggers `guild-quest-completed` CustomEvent
- QuestCard listens for event and fires confetti at its element
- Quest details (full leaderboard) fetched lazily on expand
- Reset countdown uses `formatTimeUntil` helper in modal

## Commits

| Hash | Message |
|------|---------|
| 545fc5d | feat(05-06): add confetti utility and guild quest state/handlers |
| 9142a1b | feat(05-06): create QuestCard component |
| 219e501 | feat(05-06): create GuildQuestsModal and integrate with GuildPanel |

## Next Phase Readiness

All guild quests UI complete. Phase 5 is now complete:
- 05-01: Database schema
- 05-02: Shared types
- 05-03: Activity hooks
- 05-04: WebSocket handlers
- 05-05: Frontend state management (done as part of 05-06)
- 05-06: Guild Quests UI (this plan)

Ready for Phase 6: Guild Shop & Statistics.
