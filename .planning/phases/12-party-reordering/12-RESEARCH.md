# Phase 12: Party Reordering - Research

**Researched:** 2026-01-20
**Domain:** Drag-and-drop UI, touch interactions, database persistence
**Confidence:** HIGH

## Summary

Party reordering requires a drag-and-drop implementation that works on both desktop (mouse) and mobile (touch), with long-press activation to prevent accidental drags. The existing codebase uses `party_slot` column on the `pokemon` table (1-6, nullable), which is the correct storage location. The game server already has `swap_party` and `remove_from_party` handlers that can be extended or a new `reorder_party` message type added.

The standard approach is to use **@dnd-kit** (already researched and approved in STACK-UI-POLISH.md) with `rectSwappingStrategy` for grid swapping behavior. Touch support requires the `TouchSensor` with `delay: 300` and `tolerance: 5` configuration. Visual feedback during drag should use CSS transforms (not re-rendering), with a `DragOverlay` component for the lifted card appearance.

**Primary recommendation:** Use @dnd-kit with TouchSensor delay constraint, optimistic updates with rollback on failure, and a single `reorder_party` WebSocket message that accepts the full new order array.

## Standard Stack

The established libraries for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop primitives | Zero dependencies, 10kb minified, keyboard accessible |
| @dnd-kit/sortable | ^10.0.0 | Sortable presets & strategies | Built-in grid support with `rectSwappingStrategy` |
| @dnd-kit/utilities | ^3.2.2 | CSS transform helpers | `CSS.Transform.toString()` for drag styles |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All functionality covered by dnd-kit |

**NOTE:** The STACK-UI-POLISH.md research already approved @dnd-kit. Verify it's installed:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | @hello-pangea/dnd | No grid support, party is 2x3 grid |
| @dnd-kit | Native HTML5 drag | Inconsistent touch support, no long-press delay |
| @dnd-kit | pragmatic-drag-and-drop | Smaller (4.7kb) but less grid-specific utilities |

## Architecture Patterns

### Recommended Component Structure
```
apps/web/src/components/game/
  PartyPanel.tsx           # Existing - wrap with drag context
  PokemonCard.tsx          # Existing - make sortable variant
  party/
    SortablePartyGrid.tsx  # New: DndContext + SortableContext wrapper
    SortablePokemonCard.tsx # New: useSortable wrapper around PokemonCard
    DragOverlayCard.tsx     # New: Presentational card for drag overlay
    LongPressIndicator.tsx  # New: Radial progress ring SVG
```

### Pattern 1: Sensor Configuration for Long-Press
**What:** Configure TouchSensor with 300ms delay to prevent accidental drags
**When to use:** Always for touch devices, combine with PointerSensor for mouse
**Example:**
```typescript
// Source: https://docs.dndkit.com/api-documentation/sensors/touch
'use client'

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (mouse)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,     // 300ms hold before drag starts
        tolerance: 5,   // 5px movement tolerance during hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
}
```

### Pattern 2: Grid Swapping with rectSwappingStrategy
**What:** Use swap strategy instead of move strategy for party slots
**When to use:** Occupied-to-occupied slot drag (A swaps with B)
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSwappingStrategy,
  arraySwap,
} from '@dnd-kit/sortable'

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = items.findIndex(item => item.id === active.id)
  const newIndex = items.findIndex(item => item.id === over.id)

  // Use arraySwap for swap behavior (not arrayMove)
  const newOrder = arraySwap(items, oldIndex, newIndex)
  onReorder(newOrder)
}

// In JSX:
<SortableContext items={itemIds} strategy={rectSwappingStrategy}>
```

### Pattern 3: DragOverlay for Visual Feedback
**What:** Render a floating copy of the dragged card
**When to use:** Always - prevents flickering and allows custom drag styles
**Example:**
```typescript
// Source: https://docs.dndkit.com/api-documentation/draggable/drag-overlay
import { DragOverlay } from '@dnd-kit/core'

const [activeId, setActiveId] = useState<string | null>(null)

function handleDragStart(event: DragStartEvent) {
  setActiveId(event.active.id as string)
}

function handleDragEnd(event: DragEndEvent) {
  setActiveId(null)
  // ... reorder logic
}

// In JSX - IMPORTANT: Use presentational component, not useSortable component
<DragOverlay dropAnimation={{ duration: 100, easing: 'ease-out' }}>
  {activeId ? (
    <DragOverlayCard
      pokemon={findPokemon(activeId)}
      style={{ transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
    />
  ) : null}
</DragOverlay>
```

### Pattern 4: Optimistic Update with Rollback
**What:** Update UI immediately, revert if server fails
**When to use:** All reorder operations
**Example:**
```typescript
// Source: Best practice from research
async function handleReorder(newPartyOrder: (Pokemon | null)[]) {
  // 1. Save previous state for rollback
  const previousOrder = [...party]

  // 2. Optimistically update local state
  setParty(newPartyOrder)

  // 3. Send to server
  const success = await gameSocket.reorderParty(newPartyOrder.map(p => p?.id ?? null))

  // 4. Rollback if failed
  if (!success) {
    setParty(previousOrder)
    toast.error('Failed to save party order')
  }
}
```

### Pattern 5: Radial Progress Ring for Long-Press
**What:** SVG circle that fills during the 300ms hold
**When to use:** Visual feedback during long-press countdown
**Example:**
```typescript
// Source: SVG strokeDasharray pattern
interface LongPressIndicatorProps {
  progress: number // 0-1
  size?: number
}

export function LongPressIndicator({ progress, size = 48 }: LongPressIndicatorProps) {
  const circumference = 2 * Math.PI * 18 // radius 18
  const offset = circumference * (1 - progress)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="absolute inset-0 m-auto pointer-events-none"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-[#3B4CCA]"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 50ms linear' }}
      />
    </svg>
  )
}
```

### Anti-Patterns to Avoid
- **Storing drag position in Zustand:** Keep drag state LOCAL to prevent re-render cascade (Pitfall DD-1)
- **Using same component in DragOverlay:** Creates ID collision, use presentational variant
- **arrayMove instead of arraySwap:** Wrong behavior for grid swapping
- **Missing touch-action CSS:** Set `touch-action: manipulation` on draggable cards
- **Animating during active battle:** Check encounter state before allowing drag

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch hold detection | setTimeout + touchstart/end | TouchSensor delay constraint | Handles edge cases, cancellation |
| Grid collision detection | Distance calculation | closestCenter from @dnd-kit | Optimized, handles empty slots |
| Item position animation | Manual CSS transitions | useSortable transform/transition | Synced with drag state |
| Swap vs insert logic | if/else position comparison | arraySwap + rectSwappingStrategy | Battle-tested, handles edge cases |
| Drag overlay rendering | Clone + absolute position | DragOverlay component | Handles portal, z-index, cleanup |

**Key insight:** dnd-kit was designed for exactly this use case. The complexity is in edge cases (cancel mid-drag, rapid swaps, touch vs mouse) that are already handled.

## Common Pitfalls

### Pitfall 1: Re-render Cascade During Drag (DD-1 from PITFALLS-UIUX-v1.1.md)
**What goes wrong:** Every drag position change triggers full party list re-render
**Why it happens:** Storing activeId or drag position in Zustand global store
**How to avoid:**
- Keep `activeId` in local useState, not Zustand
- Use React.memo on SortablePokemonCard with stable props
- dnd-kit uses CSS transforms during drag, not re-renders
**Warning signs:** Laggy drag feel, CPU spikes during drag

### Pitfall 2: Wrong Sorting Strategy for Grid Swap
**What goes wrong:** Items slide/shift instead of swapping positions
**Why it happens:** Using default `rectSortingStrategy` + `arrayMove`
**How to avoid:**
- Use `rectSwappingStrategy` for the SortableContext
- Use `arraySwap` (not `arrayMove`) in handleDragEnd
**Warning signs:** Pokemon shifts to fill gaps instead of swapping

### Pitfall 3: Touch-Action CSS Missing
**What goes wrong:** Touch drag doesn't work, or page scrolls during drag
**Why it happens:** Browser default touch behavior interferes
**How to avoid:**
- Set `touch-action: manipulation` on draggable cards
- If using scroll container, set `touch-action: none` only on drag handle
**Warning signs:** Touch hold triggers context menu, page bounces

### Pitfall 4: Drag During Battle
**What goes wrong:** User reorders party mid-battle, causes state desync
**Why it happens:** No check for active encounter
**How to avoid:**
- Check `currentEncounter` state before enabling drag
- Show visual indicator that reordering is disabled during battle
**Warning signs:** Party order changes, but battle uses old order

### Pitfall 5: DragOverlay ID Collision
**What goes wrong:** Unexpected behavior, drag snaps incorrectly
**Why it happens:** Rendering useSortable component inside DragOverlay
**How to avoid:**
- Create separate presentational PokemonCard (no useSortable)
- Render this presentational version inside DragOverlay
**Warning signs:** Console warnings about duplicate draggable IDs

## Code Examples

### WebSocket Message Type for Reordering
```typescript
// New message type: reorder_party
// Client -> Server payload
interface ReorderPartyPayload {
  order: (string | null)[] // Array of 6 pokemon IDs (null for empty slots)
}

// Example: [uuid1, uuid2, null, uuid3, null, null]
// This moves pokemon to slots 1,2,4 in that order

// Server validates:
// 1. All UUIDs belong to player
// 2. All UUIDs are currently in party (party_slot is not null)
// 3. Array length is exactly 6
```

### Database Update Pattern
```typescript
// Source: Existing pattern in db.ts
export async function reorderParty(
  playerId: string,
  newOrder: (string | null)[]
): Promise<boolean> {
  // Validate array length
  if (newOrder.length !== 6) return false

  // Update each pokemon's party_slot in a transaction
  // Use batch update for efficiency
  for (let slot = 1; slot <= 6; slot++) {
    const pokemonId = newOrder[slot - 1]
    if (pokemonId) {
      await supabase
        .from('pokemon')
        .update({ party_slot: slot })
        .eq('id', pokemonId)
        .eq('owner_id', playerId) // Security: verify ownership
    }
  }

  // Clear party_slot for any pokemon not in new order
  const inPartyIds = newOrder.filter(Boolean)
  await supabase
    .from('pokemon')
    .update({ party_slot: null })
    .eq('owner_id', playerId)
    .not('id', 'in', `(${inPartyIds.join(',')})`)
    .not('party_slot', 'is', null)

  return true
}
```

### CSS for Draggable Cards
```css
/* Add to globals.css or component styles */
.pokemon-card-draggable {
  touch-action: manipulation;
  user-select: none;
  cursor: grab;
}

.pokemon-card-draggable:active {
  cursor: grabbing;
}

.pokemon-card-dragging {
  opacity: 0.5;
  border: 2px dashed var(--border-subtle);
}

.pokemon-card-over {
  background: rgba(59, 76, 202, 0.2);
  border-color: var(--poke-blue);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2023 (deprecated) | Must use dnd-kit, not rbd |
| Global drag state | Local useState | Always | Prevents re-render cascade |
| arrayMove for grids | arraySwap | dnd-kit 6.0 | True swap behavior |
| onTouchStart timeouts | TouchSensor delay | dnd-kit native | Built-in cancellation handling |

**Deprecated/outdated:**
- react-beautiful-dnd: Deprecated by Atlassian, console warnings
- @dnd-kit/react (experimental v0.2.1): Module resolution issues with Next.js
- framer-motion for drag: Use @dnd-kit, motion only for animations after drop

## Open Questions

Things that couldn't be fully resolved:

1. **Empty slot drop behavior**
   - What we know: Dragging to empty slot should move there, shift others up
   - What's unclear: Exact shift logic when moving to empty vs occupied
   - Recommendation: User decided "swap" for occupied, "shift up" for empty - implement per CONTEXT.md

2. **Real-time sync across tabs**
   - What we know: WebSocket broadcasts party_update to all client connections
   - What's unclear: Whether existing party_update handler is sufficient
   - Recommendation: Verify existing party_update works, add if needed

3. **Dragged card finger offset on mobile**
   - What we know: dnd-kit's DragOverlay can be positioned
   - What's unclear: Best offset value for finger visibility
   - Recommendation: Claude's discretion per CONTEXT.md - test with 20-30px vertical offset

## Sources

### Primary (HIGH confidence)
- [dnd-kit Official Documentation](https://docs.dndkit.com/) - Sortable preset, sensors, strategies
- [dnd-kit Touch Sensor](https://docs.dndkit.com/api-documentation/sensors/touch) - Delay constraint configuration
- [dnd-kit Drag Overlay](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) - Overlay pattern

### Secondary (MEDIUM confidence)
- [dnd-kit GitHub Discussion #485](https://github.com/clauderic/dnd-kit/discussions/485) - rectSwappingStrategy + arraySwap pattern
- [STACK-UI-POLISH.md](../../research/STACK-UI-POLISH.md) - Pre-approved library versions
- [PITFALLS-UIUX-v1.1.md](../../research/PITFALLS-UIUX-v1.1.md) - DD-1, DD-2 pitfall mitigation

### Tertiary (LOW confidence)
- [LogRocket SVG Progress Tutorial](https://blog.logrocket.com/build-svg-circular-progress-component-react-hooks/) - Radial progress ring pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @dnd-kit already approved in prior research, official docs verified
- Architecture: HIGH - Patterns from official documentation and GitHub discussions
- Pitfalls: HIGH - Referenced from project-specific PITFALLS document

**Research date:** 2026-01-20
**Valid until:** 60 days (stable library, well-documented)
