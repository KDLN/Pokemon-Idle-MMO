# Phase 11: UI Polish - Research

**Researched:** 2026-01-19
**Domain:** Frontend UI (React/TypeScript), Database Migrations (PostgreSQL)
**Confidence:** HIGH

## Summary

Phase 11 addresses five distinct UI polish improvements: navigation button ordering, renaming "Power-Ups" to "Boosts", displaying active boosts with countdown timers, improving Guild Bank Pokemon display, and formatting transaction logs for human readability.

The codebase already has solid patterns for each area:
- Navigation zones from `connectedZones` state (Zone interface exists)
- Power-Up/Boost section in GameShell's `PartyColumn` component
- Guild Bank components (`BankPokemonTab`, `BankLogsTab`) with existing view toggle infrastructure
- Design tokens and CVA components from Phase 9
- `formatRelativeTime` utility already exists in `lib/ui/index.ts`

**Primary recommendation:** Approach this phase as five independent tasks. The database migration (adding direction to zone_connections) is the only backend change; everything else is pure frontend refactoring using existing patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI components | Already in use |
| Zustand | 5.x | State management with persist | Already in use for gameStore |
| Tailwind CSS | 4.x | Styling | Already in use |
| CVA | 1.x | Component variants | Already in use (Button, Card, Badge) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn (clsx/tailwind-merge) | - | Class name merging | All component styling |
| @pokemon-idle/shared | local | Shared types | Zone, GuildBankPokemon types |

### Not Needed (Already Implemented)
| Instead of | Why Not Needed |
|------------|----------------|
| date-fns / moment | `formatRelativeTime` already exists in `lib/ui/index.ts` |
| External icon library | Arrow symbols can be Unicode characters |
| Animation library | CSS transitions sufficient for timer urgency |

**Installation:**
No new packages needed. All requirements can be met with existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── components/
│   ├── game/
│   │   ├── GameShell.tsx          # Modify: rename Power-Ups to Boosts
│   │   ├── ZoneDisplay.tsx        # Modify: sort navigation by direction
│   │   └── guild/
│   │       ├── BankPokemonTab.tsx # Modify: add sprite, sorting
│   │       └── BankLogsTab.tsx    # Modify: relative timestamps
│   └── ui/
│       └── BoostCard.tsx          # NEW: active boost card component
├── lib/
│   └── ui/
│       └── index.ts               # Has formatRelativeTime (reuse)
└── types/
    └── game.ts                    # May need Zone type extension
```

### Pattern 1: Direction-Ordered Navigation
**What:** Sort navigation buttons by compass direction (N/E/S/W, then diagonals)
**When to use:** ZoneDisplay travel buttons, MapSidebar travel list
**Example:**
```typescript
// Direction priority order (lower = higher priority)
const DIRECTION_ORDER: Record<string, number> = {
  'N': 0, 'E': 1, 'S': 2, 'W': 3,
  'NE': 4, 'SE': 5, 'SW': 6, 'NW': 7
}

// Arrow symbols for each direction
const DIRECTION_ARROWS: Record<string, string> = {
  'N': '↑', 'S': '↓', 'E': '→', 'W': '←',
  'NE': '↗', 'SE': '↘', 'SW': '↙', 'NW': '↖'
}

// Sort zones by direction
const sortedZones = connectedZones.sort((a, b) => {
  const orderA = DIRECTION_ORDER[a.direction] ?? 99
  const orderB = DIRECTION_ORDER[b.direction] ?? 99
  return orderA - orderB
})
```

### Pattern 2: Countdown Timer with Urgency State
**What:** Display remaining time with visual urgency when under 1 minute
**When to use:** Active boost cards
**Example:**
```typescript
// Format countdown as MM:SS
function formatCountdown(endTime: Date): { text: string; isUrgent: boolean } {
  const remainingMs = endTime.getTime() - Date.now()
  if (remainingMs <= 0) return { text: '0:00', isUrgent: true }

  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  const isUrgent = remainingMs < 60000 // Under 1 minute

  return {
    text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    isUrgent
  }
}

// Use in component with useEffect for live updates
useEffect(() => {
  const interval = setInterval(() => {
    setCountdown(formatCountdown(expiresAt))
  }, 1000)
  return () => clearInterval(interval)
}, [expiresAt])
```

### Pattern 3: Pokemon Sprite Display
**What:** Show Pokemon sprite + name + level instead of numeric ID
**When to use:** Guild Bank Pokemon display
**Example:**
```typescript
// Already have getPokemonSpriteUrl in types/game.ts
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData } from '@/lib/ui'

// In component
const speciesData = getSpeciesData(pokemon.species_id)
const displayName = pokemon.nickname || speciesData.name

<img
  src={getPokemonSpriteUrl(pokemon.species_id, pokemon.is_shiny)}
  alt={displayName}
  className="w-10 h-10 pixelated"
/>
<span>{displayName}</span>
<span className="text-slate-400">Lv.{pokemon.level}</span>
```

### Pattern 4: Relative Timestamps with Hover
**What:** Show "2 hours ago" with hover tooltip for absolute time
**When to use:** Transaction logs, activity feeds
**Example:**
```typescript
// Already exists: formatRelativeTime in lib/ui/index.ts
import { formatRelativeTime } from '@/lib/ui'

// Component with tooltip
<span
  className="text-slate-500 cursor-help"
  title={new Date(log.created_at).toLocaleString()}
>
  {formatRelativeTime(new Date(log.created_at))}
</span>
```

### Anti-Patterns to Avoid
- **Direct DOM manipulation for timers:** Use React state, not setInterval with DOM updates
- **Inline sorting functions:** Extract sorting logic to utilities for testing
- **Hardcoded direction strings:** Use constants for type safety
- **Polling for relative time updates:** Only active boosts need live timers; logs can be static

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamps | Custom date diff | `formatRelativeTime` from `lib/ui` | Already handles edge cases |
| Pokemon sprite URLs | Custom URL builder | `getPokemonSpriteUrl` from `types/game` | Handles shiny variants |
| Species name lookup | DB query for name | `getSpeciesData` from `lib/ui` | Has all 151 Pokemon mapped |
| Class name merging | String concatenation | `cn` utility from `lib/ui` | Handles conditional classes |
| Component variants | Conditional classes | CVA (existing Button, Card, Badge) | Type-safe variants |

**Key insight:** The codebase already has utilities for most display formatting needs. Check `lib/ui/index.ts` before implementing.

## Common Pitfalls

### Pitfall 1: Timer Memory Leaks
**What goes wrong:** setInterval not cleaned up, continues running after unmount
**Why it happens:** Forgetting to return cleanup function from useEffect
**How to avoid:** Always return clearInterval in useEffect cleanup
**Warning signs:** Console warnings about state updates on unmounted components

### Pitfall 2: Database Migration for Direction
**What goes wrong:** Adding column without default causes existing rows to fail
**Why it happens:** NOT NULL constraint on new column
**How to avoid:** Either allow NULL, use DEFAULT, or backfill in same migration
**Warning signs:** Migration fails on production with existing data

### Pitfall 3: Case-Sensitivity in String Search/Replace
**What goes wrong:** Missing some "Power-Ups" instances due to case variations
**Why it happens:** Only searching for exact match "Power-Ups"
**How to avoid:** Grep with case-insensitive flag, check all variations
**Warning signs:** Users still see old term in some places

### Pitfall 4: Z-Index Stacking for Tooltips
**What goes wrong:** Hover tooltips hidden behind modals or headers
**Why it happens:** Not using design system z-index tokens
**How to avoid:** Use `Z_INDEX.tooltip` (50) from lib/ui/index.ts
**Warning signs:** Tooltips not visible in certain contexts

### Pitfall 5: Sorting Stability
**What goes wrong:** Navigation buttons reorder on every render
**Why it happens:** Sort function doesn't have stable secondary sort
**How to avoid:** Add zone.id as tiebreaker when directions are equal
**Warning signs:** Buttons visually "jumping" on state updates

## Code Examples

Verified patterns from the existing codebase:

### Navigation Button Rendering (Current - ZoneDisplay.tsx line 199-219)
```typescript
{connectedZones.map((zone) => (
  <button
    key={zone.id}
    onClick={() => gameSocket.moveToZone(zone.id)}
    className={`
      group relative px-4 py-2.5 rounded-xl text-sm font-medium
      ${zone.zone_type === 'town'
        ? 'bg-gradient-to-b from-amber-500/10 ...'
        : 'bg-gradient-to-b from-green-500/10 ...'
      }
    `}
  >
    <span className="relative z-10 flex items-center gap-2">
      <span>{zone.zone_type === 'town' ? '🏠' : '🌿'}</span>
      <span>{zone.name}</span>
    </span>
  </button>
))}
```

### Proposed Navigation with Direction (new pattern)
```typescript
// Extended Zone interface (from backend)
interface Zone {
  id: number
  name: string
  zone_type: 'town' | 'route'
  direction?: string  // NEW: 'N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW'
  // ... other fields
}

// Sorted and formatted
const sortedZones = [...connectedZones].sort((a, b) => {
  const orderA = DIRECTION_ORDER[a.direction || ''] ?? 99
  const orderB = DIRECTION_ORDER[b.direction || ''] ?? 99
  return orderA - orderB || a.id - b.id  // Stable sort
})

{sortedZones.map((zone) => (
  <button key={zone.id} onClick={() => gameSocket.moveToZone(zone.id)} ...>
    <span className="flex items-center gap-2">
      {zone.direction && (
        <span className="text-[#a0a0c0]">{DIRECTION_ARROWS[zone.direction]}</span>
      )}
      <span>{zone.name}</span>
    </span>
  </button>
))}
```

### Active Boost Card Component (new component)
```typescript
// Based on existing ShopBuffCard pattern (line 57-133)
interface ActiveBoostCardProps {
  name: string
  description: string
  expiresAt: Date
  onExpire?: () => void
}

function ActiveBoostCard({ name, description, expiresAt, onExpire }: ActiveBoostCardProps) {
  const [countdown, setCountdown] = useState({ text: '', isUrgent: false })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const update = () => {
      const remaining = expiresAt.getTime() - Date.now()
      if (remaining <= 0) {
        onExpire?.()
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setCountdown({
        text: `${mins}:${secs.toString().padStart(2, '0')}`,
        isUrgent: remaining < 60000
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  return (
    <div className={cn(
      "p-3 rounded-xl border transition-colors",
      countdown.isUrgent
        ? "border-red-500/50 bg-red-500/10"
        : "border-[#2a2a4a] bg-[#1a1a2e]"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">{name}</span>
        <span className={cn(
          "font-mono text-sm",
          countdown.isUrgent ? "text-red-400 animate-pulse" : "text-[#FFDE00]"
        )}>
          {countdown.text}
        </span>
      </div>
      {isExpanded && (
        <p className="text-sm text-[#a0a0c0] mt-2">{description}</p>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-[#606080] hover:text-[#a0a0c0] mt-1"
      >
        {isExpanded ? 'Hide details' : 'Show details'}
      </button>
    </div>
  )
}
```

### Guild Bank Pokemon with Sprite (enhancement to existing)
```typescript
// Current BankPokemonTab.tsx grid view (line 163-187)
// Missing: sprite image, proper species name lookup

// Enhanced version:
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData } from '@/lib/ui'

{filteredBankPokemon.map((pokemon) => {
  const speciesData = getSpeciesData(pokemon.species_id)
  const displayName = pokemon.nickname || speciesData.name

  return (
    <button key={pokemon.id} onClick={() => setSelectedPokemon(pokemon)} ...>
      <img
        src={getPokemonSpriteUrl(pokemon.species_id, pokemon.is_shiny)}
        alt={displayName}
        className="w-10 h-10 pixelated"
      />
      <div className="text-xs text-white truncate">{displayName}</div>
      <div className="text-xs text-slate-400">Lv.{pokemon.level}</div>
    </button>
  )
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Emoji icons for direction | Unicode arrows | This phase | Cleaner, more readable |
| Static placeholder Power-Ups | Dynamic active boosts | This phase | Functional boost system |
| Numeric Pokemon IDs | Sprite + name display | This phase | User-friendly bank |
| Raw JSON in logs | Formatted entries | This phase | Readable transaction history |

**Deprecated/outdated:**
- `AVAILABLE_BUFFS` constant in GameShell.tsx: Static placeholder, replace with real boost data from store

## Database Migration Required

### Adding Direction to zone_connections
```sql
-- Migration: Add direction column to zone_connections
ALTER TABLE zone_connections
ADD COLUMN direction TEXT;

-- Backfill existing connections with directions
-- (Values based on actual Kanto geography)
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 1 AND to_zone_id = 2;  -- Pallet -> Route 1
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 2 AND to_zone_id = 1;  -- Route 1 -> Pallet
UPDATE zone_connections SET direction = 'N' WHERE from_zone_id = 2 AND to_zone_id = 3;  -- Route 1 -> Viridian
UPDATE zone_connections SET direction = 'S' WHERE from_zone_id = 3 AND to_zone_id = 2;  -- Viridian -> Route 1
-- ... continue for all zone connections
```

### Zone Interface Extension
```typescript
// In @pokemon-idle/shared types/core.ts
export interface Zone {
  id: number
  name: string
  zone_type: 'town' | 'route'
  base_encounter_rate: number
  min_level: number
  max_level: number
  direction?: string  // NEW: populated from zone_connections when queried
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Boost expiry notification mechanism**
   - What we know: Toast notification on expiry is required
   - What's unclear: Does the game already have a toast system? (Need to check LevelUpToast pattern)
   - Recommendation: Reuse LevelUpToast pattern or existing toast infrastructure

2. **Active boost data source**
   - What we know: Guild buffs exist (`guildActiveBuffs` in store)
   - What's unclear: Are personal boosts separate? What triggers them?
   - Recommendation: Start with guild buffs, expand to personal if needed

3. **Sorting options persistence**
   - What we know: User decided multiple sorting options for bank
   - What's unclear: Should sort preference persist (like view mode does)?
   - Recommendation: Use same persist middleware pattern as guildBankViewMode

## Sources

### Primary (HIGH confidence)
- `apps/web/src/components/game/GameShell.tsx` - Current Power-Ups implementation
- `apps/web/src/components/game/ZoneDisplay.tsx` - Current navigation rendering
- `apps/web/src/components/game/guild/BankPokemonTab.tsx` - Current bank Pokemon display
- `apps/web/src/components/game/guild/BankLogsTab.tsx` - Current log formatting
- `apps/web/src/lib/ui/index.ts` - Existing utilities (formatRelativeTime, getSpeciesData)
- `apps/web/src/types/game.ts` - getPokemonSpriteUrl function
- `packages/shared/src/types/core.ts` - Zone interface definition
- `supabase/migrations/001_initial_schema.sql` - zone_connections table structure

### Secondary (MEDIUM confidence)
- `apps/web/src/stores/gameStore.ts` - State structure for zones, active buffs
- `apps/game-server/src/db.ts` - getConnectedZones implementation

### Tertiary (LOW confidence)
- None - all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified all tools already in use
- Architecture: HIGH - Patterns extracted from existing code
- Pitfalls: HIGH - Common React patterns, verified timer handling
- Database migration: MEDIUM - Schema change, needs careful backfill

**Research date:** 2026-01-19
**Valid until:** 60 days (stable patterns, no external dependencies)
