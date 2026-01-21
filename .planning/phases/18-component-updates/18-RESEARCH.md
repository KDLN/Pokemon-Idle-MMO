# Phase 18: Component Updates - Research

**Researched:** 2026-01-21
**Domain:** React component migration, UI styling patterns
**Confidence:** HIGH

## Summary

Phase 18 involves porting the MockGameScreen component implementations to production by replacing current production components with Mock versions, wiring them to real data, and cleaning up obsolete code. The codebase has a complete Mock implementation in `MockGameScreen.tsx` that serves as the visual target, and production components in `GameShell.tsx` that have real data flow but different styling.

**Key findings:**
- MockGameScreen exists as a complete reference implementation with all target styling
- Production components use Zustand + WebSocket for real data (Mock uses hardcoded data)
- BeveledButton component already implemented and ready to use
- Theme CSS variables system in place from Phase 17
- Mobile layout exists but needs bottom tab bar pattern

**Primary recommendation:** Port Mock component JSX structure and styles to production components, replace data sources with Zustand selectors, use existing BeveledButton component for action buttons, implement bottom tab bar for mobile.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component framework | Next.js 16 requirement |
| Zustand | Latest | State management | Already in use for game state |
| Tailwind CSS | 4.x | Styling | Project standard |
| dnd-kit | Latest | Drag-and-drop | Already used for party reordering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | Latest | Component variants | Already used for Button variants |
| cn utility | - | Classname merging | Project utility in @/lib/ui/cn |

### No New Dependencies Required
All necessary libraries already installed and in use. This is purely a component refactoring phase.

## Architecture Patterns

### Recommended Component Structure

Production components follow this pattern:
```
components/game/
├── GameShell.tsx           # Main layout container
├── Header.tsx              # Top navigation bar
├── MockGameScreen.tsx      # Reference implementation (Mock)
├── PartyPanel.tsx          # Production party display
├── ZoneDisplay.tsx         # Production zone view (to be replaced)
├── world/
│   └── WorldView.tsx       # Production world renderer
├── social/
│   ├── ChatSidebar.tsx     # Production chat panel
│   ├── ChatMessage.tsx     # Message bubble component
│   ├── ChatInput.tsx       # Input with BeveledButton
│   └── WorldEventsTicker.tsx # Ticker bar
└── party/
    ├── SortablePokemonCard.tsx
    └── SortablePartyGrid.tsx
```

### Pattern 1: Mock to Production Migration
**What:** Port Mock component structure to production, swap data sources

**Migration steps:**
1. Copy Mock component JSX structure
2. Replace hardcoded data with Zustand selectors
3. Wire event handlers to gameSocket actions
4. Preserve existing behavior (drag-and-drop, modals, etc.)
5. Test with real data
6. Remove or deprecate old component

**Example from MockGameScreen → Production:**
```typescript
// Mock uses hardcoded data
const MOCK_PARTY = [{ id: 1, nickname: 'Pikachu', ... }]

// Production uses Zustand
const party = useGameStore((state) => state.party)

// Mock has static rendering
{MOCK_PARTY.map(pokemon => <MockPokemonCard pokemon={pokemon} />)}

// Production needs existing interactions
<SortablePartyGrid
  party={party}
  onPokemonClick={setDetailPokemon}
  onUsePotion={handleUsePotion}
/>
```

### Pattern 2: Data Flow Mapping

**Mock data sources:**
- `MOCK_PARTY` → Production: `useGameStore(state => state.party)`
- `MOCK_ZONE` → Production: `useGameStore(state => state.currentZone)`
- `MOCK_CONNECTED_ZONES` → Production: `useGameStore(state => state.connectedZones)`
- `MOCK_CURRENCY` → Production: `useGameStore(state => state.player)` (has pokedollars, pokeballs)
- `MOCK_ACTIVITY` → Production: `useGameStore(state => state.worldLog)`
- `MOCK_NEARBY_PLAYERS` → Production: Already in `NearbyPlayersSection` component

**WebSocket actions:**
- Travel buttons: `gameSocket.moveToZone(zoneId)`
- Chat messages: `gameSocket.sendChatMessage(channel, content)`
- Party actions: Already wired in `SortablePartyGrid`

### Pattern 3: Component Composition

**Current GameShell structure (Desktop):**
```
<div className="game-layout">
  <Header />
  <WorldEventsTicker />
  <MapSidebar />        {/* Left column */}
  <div className="center-column">
    <WorldView />       {/* Top: 256px fixed height */}
    <SocialSidebar />   {/* Bottom: flex-1 remaining space */}
  </div>
  <PartyColumn />       {/* Right column */}
</div>
```

**MockGameScreen structure (Target):**
```
<div className="game-layout">
  <MockHeader />
  <MockTicker />
  <MockMapSidebar />    {/* Left: w-64 */}
  <div className="center-column">
    <MockWorldView />   {/* Top: h-64 (256px) */}
    <MockSocialSidebar /> {/* Bottom: flex-1 */}
  </div>
  <MockPartyColumn />   {/* Right: w-72 */}
</div>
```

**Key insight:** Structure is nearly identical. Main differences are styling and data sources.

### Pattern 4: Styling Application

**CSS variables from Phase 17:**
```css
--color-brand-primary: #3B4CCA (blue)
--color-brand-secondary: #EE1515 (red)
--color-brand-accent: #FFD700 (yellow)
--color-surface-base: #0f0f1a
--color-surface-elevated: #1a1a2e
--color-border-subtle: #2a2a4a
--color-text-primary: #ffffff
--color-text-secondary: #e0e0e0
--color-text-muted: #606080
```

**Type colors available:**
All Pokemon type colors defined in `colors.css` as `--color-type-{type}` (e.g., `--color-type-fire`, `--color-type-water`)

**Utility classes available:**
- `.texture-noise` - Adds subtle noise texture
- `.glass` - Glass morphism effect
- `.font-pixel` - Pixel font (Press Start 2P)
- `.input-inset` - Inset input styling (Phase 17)
- `.btn-3d` - BeveledButton base class

### Anti-Patterns to Avoid

**Anti-pattern: Creating new components for Mock features**
- MockActivityLog is stubbed → Don't create ActivityLog component yet
- MockBoostCard exists in production → Use existing BoostCard
- Don't over-engineer placeholders for future features

**Anti-pattern: Breaking existing functionality**
- Drag-and-drop party reordering must continue working
- Long-press indicators on mobile must remain
- Modal interactions (Pokemon detail, trade, etc.) must work
- Don't remove working features to match Mock

**Anti-pattern: Exact pixel-perfect matching**
- Mock is a visual reference, not pixel-perfect spec
- Preserve responsive behavior over exact dimensions
- Mobile breakpoints already exist (1024px) - keep them

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pokemon card drag reorder | New drag system | Existing `SortablePartyGrid` with dnd-kit | Already working, tested, accessible |
| Chat message formatting | New chat component | Existing `ChatMessage` + `ChatInput` | Command parsing, whispers, muting all work |
| Type-based colors | Manual color mapping | `getTypeColor()` from @/lib/ui | Centralized, consistent with theme |
| Pokemon sprites | Custom image handling | `getPokemonSpriteUrl()` helper | Handles shiny variants, caching |
| Progress bars | Custom HP/XP bars | `<HPBar>` and `<XPBar>` components | Accessible, animated, tested |
| Button styling | Custom 3D effects | `<BeveledButton>` component | Phase 17 implementation ready |

**Key insight:** Most functionality already exists in production. Migration is about styling updates and layout adjustments, not rebuilding systems.

## Code Examples

Verified patterns from existing codebase:

### BeveledButton Usage (Phase 17)
```typescript
// Source: apps/web/src/components/ui/Button.tsx
import { BeveledButton } from '@/components/ui/Button'

<BeveledButton
  hue={120}        // Green
  saturation={60}
  lightness={40}
>
  Search Area
</BeveledButton>

<BeveledButton
  hue={200}        // Blue
  saturation={60}
  lightness={45}
>
  Use Item
</BeveledButton>
```

### Pokemon Card with Type Styling
```typescript
// Source: apps/web/src/components/game/MockGameScreen.tsx (lines 417-478)
function MockPokemonCard({ pokemon }) {
  return (
    <div className="texture-noise p-2 rounded-lg bg-[var(--color-surface-elevated)]
                    border border-[var(--color-border-subtle)]
                    hover:border-[var(--color-border-bright)]
                    transition-colors cursor-pointer group">
      {/* Sprite with type-colored background */}
      <div className="w-full aspect-square rounded-lg bg-[var(--color-surface-base)]
                      mb-2 flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: TYPE_COLORS[pokemon.type] }}
        />
        <img
          src={getPokemonSpriteUrl(pokemon.speciesId)}
          className="w-14 h-14 pixelated group-hover:scale-110 transition-transform"
        />
      </div>

      {/* Type badge */}
      <div
        className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase"
        style={{ backgroundColor: TYPE_COLORS[pokemon.type], color: 'white' }}
      >
        {pokemon.type}
      </div>

      {/* HP and XP bars with numbers */}
      <div className="h-1.5 rounded-full bg-[var(--color-surface-base)] overflow-hidden">
        <div className="h-full bg-[var(--color-success)]" style={{ width: `${hpPercent}%` }} />
      </div>
      <span className="text-[9px] text-[var(--color-text-muted)]">HP {hp}/{maxHp}</span>
    </div>
  )
}
```

### Chat Message Bubble Styling
```typescript
// Source: apps/web/src/components/game/social/ChatMessage.tsx
export function ChatMessage({ message, isOwnMessage }) {
  return (
    <div className={`chat-message text-sm rounded-lg px-2 py-1
                     ${isOwnMessage ? 'bg-[#252542]' : ''}`}>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[10px] text-[#606080]">{formatTime(message.createdAt)}</span>
        <span className="font-semibold text-white">{message.playerName}</span>
      </div>
      <p className="break-words text-[#e0e0e0]">{message.content}</p>
    </div>
  )
}
```

### Chat Input with BeveledButton
```typescript
// Source: apps/web/src/components/game/social/ChatInput.tsx (lines 308-322)
<div className="flex gap-2">
  <input
    className="input-inset w-full px-3 py-2 rounded-lg text-sm"
    placeholder="Type a message..."
  />
  <button className="px-4 py-2 rounded-lg bg-[#3B4CCA] text-white hover:bg-[#5B6EEA]">
    Send
  </button>
</div>

// Should become:
<BeveledButton hue={240}>Send</BeveledButton>
```

### Zone Background Gradients
```typescript
// Source: apps/web/src/components/game/MockGameScreen.tsx (lines 371-412)
function MockWorldView() {
  return (
    <div className="texture-noise h-full relative rounded-xl overflow-hidden
                    bg-gradient-to-b from-[#2a3a2a] to-[#1a2a1a]
                    border border-[var(--color-border-subtle)]">
      {/* Sky gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-transparent to-transparent" />

      {/* Forest floor gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/40 to-transparent" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-pixel text-sm text-[var(--color-text-primary)]">Exploring...</div>
        <div className="text-[var(--color-text-secondary)]">{MOCK_ZONE.name}</div>
      </div>

      {/* Ambient particles */}
      <div className="absolute top-10 left-10 w-1 h-1 rounded-full bg-green-300/50 animate-pulse" />
    </div>
  )
}
```

## Mobile Implementation Gap

### Current Mobile Layout
**Source:** `GameShell.tsx` lines 530-586

**Structure:**
```typescript
if (isMobile) {
  return (
    <div className="game-layout">
      <Header />
      <WorldEventsTicker />

      {/* Show single active tab content */}
      {mobileTab === 'map' && <MapSidebar className="mobile-active" />}
      {mobileTab === 'game' && <WorldView />}
      {mobileTab === 'party' && <PartyColumn className="mobile-active" />}
      {mobileTab === 'social' && <SocialSidebar />}
    </div>
  )
}
```

**Current tab switching:** State-based (`mobileTab` state variable)
**Current breakpoint:** 1024px (`window.innerWidth <= 1024`)

### Target Mobile Layout (from CONTEXT.md)

**Required changes:**
1. **Add fixed bottom tab bar** (iOS/Android native pattern)
2. **Four tabs:** Zone / Party / Social / Map
3. **Tab bar styling:** Fixed positioning, icon + label

**Gap analysis:**
- ✅ Tab switching logic exists
- ✅ Breakpoint detection exists
- ❌ Bottom tab bar UI missing
- ❌ Native app styling missing

**Implementation needed:**
```typescript
// Source: GameShell.tsx lines 389-434 (MobileTabBar component exists but needs styling)
function MobileTabBar({ activeTab, onTabChange, badges }) {
  return (
    <div className="mobile-tab-bar">  {/* Needs: fixed bottom, native styling */}
      <button className={activeTab === 'map' ? 'active' : ''}>
        <span className="tab-icon">🗺️</span>
        <span>Map</span>
      </button>
      {/* ... other tabs ... */}
    </div>
  )
}
```

**Styling requirements:**
- Fixed bottom positioning (`position: fixed; bottom: 0; left: 0; right: 0`)
- Safe area insets for iOS (`padding-bottom: env(safe-area-inset-bottom)`)
- Active tab indicator (underline or background highlight)
- Badge pills on Social tab for notifications

## Common Pitfalls

### Pitfall 1: Breaking Drag-and-Drop Party Reordering
**What goes wrong:** Changing Pokemon card structure without preserving dnd-kit integration

**Why it happens:** Mock cards are simpler than production cards (no drag handles, long-press indicators)

**How to avoid:**
- Keep `SortablePokemonCard` wrapper component
- Only update `PokemonCard` visual styling
- Test drag reordering after style changes
- Preserve `group-hover` classes for Remove button

**Warning signs:**
- Cards no longer draggable
- Long-press indicator disappears on mobile
- Drop zone highlights broken

### Pitfall 2: Data Mismatches Between Mock and Production
**What goes wrong:** Mock data structure doesn't match real API data

**Why it happens:** Mock uses simplified data for demonstration

**Examples:**
```typescript
// Mock structure (simplified)
{ id: 1, nickname: 'Pikachu', species: 'pikachu', type: 'electric' }

// Production structure (from API)
{
  id: 'uuid',
  nickname: 'Pikachu',
  species_id: 25,
  species_name: 'pikachu',
  current_hp: 45,
  max_hp: 55,
  // ... many more fields
}
```

**How to avoid:**
- Map Mock visual patterns, not data structures
- Use existing helper functions (`getSpeciesData`, `getPokemonSpriteUrl`)
- Check TypeScript types for actual data shape
- Test with real API data, not just mock data

**Verification:** Read `@/types/game.ts` for actual Pokemon interface

### Pitfall 3: CSS Specificity Conflicts
**What goes wrong:** New styles don't apply due to existing CSS specificity

**Why it happens:** Production has nested component styles, Mock uses flat structure

**How to avoid:**
- Use same specificity as existing styles
- Leverage existing utility classes (`.texture-noise`, `.glass`)
- Test in browser DevTools to verify styles apply
- Don't add `!important` unless absolutely necessary

**Warning signs:**
- Styles work in Mock but not in production component
- Need to duplicate styles with higher specificity
- Tailwind classes overridden by global CSS

### Pitfall 4: Removing Features That Don't Exist in Mock
**What goes wrong:** Deleting working production features because Mock doesn't show them

**Why it happens:** Mock is simplified for theme comparison, not feature complete

**Examples of features to preserve:**
- Pokemon detail modal (click to view stats)
- Potion button on low HP Pokemon
- Remove from party button
- IV grade badges
- Held item indicators
- Shiny sparkle effects

**How to avoid:**
- Review CONTEXT.md for "Mock-only features" vs real features
- Ask "Does this feature work in production?" before removing
- Stub out Mock-only features (Activity Log, Boost Card shown as placeholders)

**Rule:** If it works in production and users rely on it, keep it even if Mock doesn't show it

### Pitfall 5: Mobile Layout Breaking Desktop
**What goes wrong:** Mobile-specific changes affect desktop layout

**Why it happens:** Shared component structure between mobile and desktop

**How to avoid:**
- Use responsive classes (`lg:block`, `lg:hidden`)
- Test both mobile and desktop after changes
- Keep mobile tab bar separate from desktop layout
- Use `isMobile` state to conditionally render different structures

**Verification steps:**
1. Resize browser to <1024px (mobile)
2. Verify bottom tab bar appears
3. Resize to >1024px (desktop)
4. Verify three-column layout works
5. Check all breakpoints in between

## State of the Art

### Current Approach vs Target

| Aspect | Current (Production) | Target (Mock) | Change Needed |
|--------|---------------------|---------------|---------------|
| Header | Exists, has all features | Same features, different spacing | Minor spacing adjustments |
| Ticker | WorldEventsTicker exists | MockTicker simpler | Keep production, adjust styling |
| Map Sidebar | InteractiveMap component | Static map placeholder | Keep InteractiveMap, add Mock visual styling |
| Zone View | WorldView with sprites | MockWorldView centered text | Hybrid: keep sprites, add centered text overlay |
| Party Cards | Full featured with drag | Simpler Mock cards | Keep features, apply Mock styling |
| Chat Panel | Full chat with tabs | MockSocialSidebar simpler tabs | Keep tabs, apply bubble styling |
| Mobile | Tab switching exists | Needs bottom tab bar | Add bottom tab bar UI |

### Migration Strategy Evolution

**Old approach (Phase 16):** Build from scratch
**Current approach (Phase 18):** Port Mock to production with data wiring

**Why the change:**
- Mock already demonstrates desired visual style
- Production has working features that must be preserved
- Faster to port styles than rebuild functionality

**Impact:**
- Less risk of breaking existing features
- Clearer visual target for styling
- Easier to verify completion (does it match Mock?)

## Open Questions

Things that couldn't be fully resolved:

1. **Activity Log Component**
   - What we know: Mock shows activity log, production has `WorldLog` component
   - What's unclear: Should WorldLog be styled to match Mock or is it different enough to keep separate?
   - Recommendation: Check if WorldLog shows same data as MockActivityLog. If yes, apply Mock styling. If no, keep as-is.

2. **Map Visualization Fidelity**
   - What we know: Mock has simple static map, production has InteractiveMap with real zone nodes
   - What's unclear: How much of Mock's aesthetic should override InteractiveMap functionality?
   - Recommendation: Keep InteractiveMap functionality, apply Mock container styling (rounded corners, handheld device aesthetic from lines 269-305)

3. **Time-of-Day Sky Gradients**
   - What we know: CONTEXT.md requires 4 time periods (dawn/day/dusk/night), production has TimeOfDayOverlay
   - What's unclear: Are sky gradients already implemented or need to be added?
   - Recommendation: Check `TimeOfDayOverlay.tsx` component. If it has 4 periods, verify colors match. If not, implement.

4. **Bottom Tab Bar Safe Areas**
   - What we know: Mobile needs bottom tab bar
   - What's unclear: iOS safe area handling for devices with notches/home indicators
   - Recommendation: Use `env(safe-area-inset-bottom)` in CSS, test on actual iOS device or simulator

## Sources

### Primary (HIGH confidence)
- Apps/web/src/components/game/MockGameScreen.tsx - Complete Mock reference implementation
- Apps/web/src/components/game/GameShell.tsx - Current production layout
- Apps/web/src/components/ui/Button.tsx - BeveledButton component from Phase 17
- Apps/web/src/styles/button-3d.css - 3D button styling system
- Apps/web/src/app/globals.css - Theme CSS variables
- .planning/phases/18-component-updates/18-CONTEXT.md - User decisions and constraints

### Secondary (MEDIUM confidence)
- Apps/web/src/components/game/PartyPanel.tsx - Current party implementation
- Apps/web/src/components/game/PokemonCard.tsx - Card styling with type colors
- Apps/web/src/components/game/social/ChatSidebar.tsx - Chat implementation
- Apps/web/src/components/game/social/ChatMessage.tsx - Message bubble styling
- Apps/web/src/components/game/world/WorldView.tsx - Zone rendering with sprites

### Verified Patterns
- Pokemon card structure: Type-colored borders and backgrounds confirmed
- BeveledButton: Fully implemented with HSL color customization
- Chat bubbles: Rounded backgrounds with timestamp formatting (absolute time)
- Mobile tab switching: Logic exists, needs UI component
- Drag-and-drop: dnd-kit integration working, must preserve

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Clear mapping from Mock to production, existing patterns documented
- Pitfalls: HIGH - Specific risks identified from comparing Mock vs production code

**Research date:** 2026-01-21
**Valid until:** 60 days (stable codebase, no fast-moving dependencies)

**Key takeaway:** This is a styling migration, not a feature rebuild. Preserve all working production features while applying Mock visual patterns. The main work is CSS/JSX updates and mobile bottom tab bar implementation.
