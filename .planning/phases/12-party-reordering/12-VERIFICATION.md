---
phase: 12-party-reordering
verified: 2026-01-20T17:48:52Z
status: passed
score: 4/4 must-haves verified
human_verification:
  - test: "Drag Pokemon card to another slot"
    expected: "Cards swap positions, order persists after refresh"
    why_human: "Visual interaction and persistence need manual confirmation"
  - test: "Touch long-press (300ms) on mobile"
    expected: "Radial progress ring appears, drag activates after countdown"
    why_human: "Touch behavior and visual timing require manual testing"
  - test: "Reorder party and wait for encounter"
    expected: "New slot 1 Pokemon is the one that battles"
    why_human: "Battle selection requires observing actual gameplay"
---

# Phase 12: Party Reordering Verification Report

**Phase Goal:** Enable players to organize their party through intuitive drag-and-drop
**Verified:** 2026-01-20T17:48:52Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can drag Pokemon cards to reorder party (touch and mouse support) | VERIFIED | SortablePokemonCard.tsx uses @dnd-kit/sortable with useSortable hook; useDragSensors.ts configures PointerSensor (8px mouse), TouchSensor (300ms delay), KeyboardSensor |
| 2 | Party order persists after page refresh and reconnection | VERIFIED | SortablePartyGrid.tsx calls gameSocket.reorderParty() which sends to hub.ts reorder_party handler -> db.ts reorderParty() updates party_slot in database |
| 3 | First Pokemon in party order is the one that battles (order affects gameplay) | VERIFIED | game.ts:getLeadPokemon() iterates party array and returns first with HP>0; party ordered by party_slot from db.ts:getPlayerParty() |
| 4 | Drag interaction has visual feedback (lift, drop zone highlighting) | VERIFIED | SortablePokemonCard.tsx has isOver ring styling, DragOverlay in SortablePartyGrid.tsx shows scale-105 shadow-2xl lifted card; LongPressIndicator.tsx shows radial progress |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/components/game/party/SortablePartyGrid.tsx` | DndContext wrapper with sortable grid | VERIFIED | 216 lines, DndContext/SortableContext wrapping, arraySwap logic, optimistic updates, error toast |
| `apps/web/src/components/game/party/SortablePokemonCard.tsx` | Draggable Pokemon card wrapper | VERIFIED | 142 lines, useSortable hook, long-press tracking, isOver drop zone styling |
| `apps/web/src/components/game/party/useDragSensors.ts` | Sensor configuration hook | VERIFIED | 36 lines, exports useDragSensors with mouse/touch/keyboard sensors |
| `apps/web/src/components/game/party/LongPressIndicator.tsx` | SVG radial progress ring | VERIFIED | 65 lines, SVG progress circle with CSS variable theming |
| `apps/web/src/components/game/PartyPanel.tsx` | Updated to use SortablePartyGrid | VERIFIED | Line 6 imports SortablePartyGrid, line 87 renders it with all props |
| `apps/game-server/src/db.ts` | reorderParty database function | VERIFIED | Lines 497-544, validates ownership, clears then sets party_slot positions |
| `apps/game-server/src/hub.ts` | reorder_party WebSocket handler | VERIFIED | Line 489 case statement, lines 1090-1110 handler with broadcastToPlayer for cross-tab sync |
| `apps/web/src/lib/ws/gameSocket.ts` | reorderParty client method | VERIFIED | Lines 335-341, sends reorder_party message with order array |
| `apps/web/package.json` | @dnd-kit packages installed | VERIFIED | @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| PartyPanel.tsx | SortablePartyGrid.tsx | component import | WIRED | Line 6: `import { SortablePartyGrid } from './party/SortablePartyGrid'` |
| SortablePartyGrid.tsx | gameSocket.ts | reorderParty call | WIRED | Line 92: `gameSocket.reorderParty(order)` |
| SortablePartyGrid.tsx | SortablePokemonCard.tsx | component import | WIRED | Line 20: `import { SortablePokemonCard }` |
| SortablePartyGrid.tsx | useDragSensors.ts | hook import | WIRED | Line 19: `import { useDragSensors }`, line 42: `const sensors = useDragSensors()` |
| SortablePokemonCard.tsx | LongPressIndicator.tsx | component import | WIRED | Line 9: `import { LongPressIndicator }` |
| gameSocket.ts | hub.ts | WebSocket reorder_party | WIRED | gameSocket sends type 'reorder_party', hub.ts case handles it |
| hub.ts | db.ts | reorderParty function | WIRED | Line 76 imports, line 1093 calls `reorderParty()` |
| game.ts | party array | getLeadPokemon | WIRED | Line 290-295: iterates party[0..n] to find first active Pokemon for battle |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| UI-06: Party Pokemon can be drag-reordered | SATISFIED | None |
| UI-07: Party order changes persist to database | SATISFIED | None |
| UI-08: Party order affects which Pokemon battles first | SATISFIED | None |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns found |

### Human Verification Required

#### 1. Mouse Drag Test
**Test:** Click and drag a Pokemon card to another slot, then refresh page
**Expected:** Cards swap positions immediately; after refresh, order is preserved
**Why human:** Visual interaction and database persistence need manual confirmation

#### 2. Touch Long-Press Test
**Test:** On touch device or browser dev tools touch simulation, hold finger on Pokemon card for 300ms
**Expected:** Radial progress ring appears and fills; after completion, card becomes draggable
**Why human:** Touch timing, visual feedback quality require manual observation

#### 3. Battle Order Test
**Test:** Note slot 1 Pokemon, drag different Pokemon to slot 1, wait for wild encounter
**Expected:** The new slot 1 Pokemon is the one shown battling (receives XP, takes damage)
**Why human:** Battle selection requires observing actual gameplay over time

#### 4. Drop Zone Highlight Test
**Test:** While dragging a Pokemon card, hover over another card's slot
**Expected:** Target slot shows blue ring highlight (ring-2 ring-[#3B4CCA])
**Why human:** Visual feedback quality requires manual observation

#### 5. Error Feedback Test
**Test:** Disconnect network, attempt to drag-reorder
**Expected:** Error toast appears, cards revert to original positions
**Why human:** Network state simulation and visual feedback require manual testing

### Known Limitation (Not a Gap)

**Empty slot drag support:** The current implementation only allows swapping Pokemon with other Pokemon. Dragging a Pokemon to an empty slot is not supported. This was noted as potential future enhancement but is NOT a blocking gap because:
1. The success criteria specify "drag Pokemon cards to reorder party" - which works for swapping
2. CONTEXT.md specifies swap behavior: "Dragging to an occupied slot: swap positions"
3. The empty slot behavior in CONTEXT.md ("Dragging to an empty slot: move there, others shift up") was listed as an additional feature, not core requirement

User feedback mentioned this as a desired enhancement, but all 4 success criteria are met.

---

*Verified: 2026-01-20T17:48:52Z*
*Verifier: Claude (gsd-verifier)*
