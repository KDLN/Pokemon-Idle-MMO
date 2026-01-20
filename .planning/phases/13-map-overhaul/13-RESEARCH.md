# Phase 13: Map Overhaul - Research

**Researched:** 2026-01-20
**Domain:** Interactive Map UI with Pan/Zoom, Visual Styling
**Confidence:** HIGH

## Summary

This phase transforms the existing zone navigation into a proper interactive map with pan/zoom, fog of war, and Pokemon Gen 4-5 visual styling. The current `ZoneDisplay.tsx` component shows zone information and travel buttons but lacks a visual map representation with spatial layout.

The research identified `react-zoom-pan-pinch` as the clear standard library for pan/zoom functionality - it's lightweight (~3.7kb gzipped), uses CSS transforms for 60fps performance, supports mobile gestures, desktop mouse/wheel, and has full TypeScript support. For fog of war, CSS opacity/filter-based approaches are preferred over complex SVG filters to avoid performance issues.

**Primary recommendation:** Use react-zoom-pan-pinch v3.7.0 for pan/zoom, CSS-based fog of war with opacity transitions, and build zone nodes as styled divs with absolute positioning on a transform-enabled canvas.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-zoom-pan-pinch | 3.7.0 | Pan/zoom functionality | 1.8k GitHub stars, TypeScript native, CSS transform-based for GPU acceleration, zero dependencies |
| CSS Custom Properties | N/A | Design token integration | Already established in Phase 9, enables theming consistency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing Tooltip component | N/A | Zone hover information | Already implemented, supports keyboard/mouse |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-zoom-pan-pinch | @sasza/react-panzoom | Less popular, fewer features |
| react-zoom-pan-pinch | react-map-interaction | Heavier, less maintained |
| CSS fog of war | SVG filters + D3.js | Performance issues with many elements, complex implementation |

**Installation:**
```bash
npm install react-zoom-pan-pinch
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/game/map/
  InteractiveMap.tsx       # Main container with TransformWrapper
  MapCanvas.tsx            # Content layer with zones and connections
  ZoneNode.tsx             # Individual zone node component
  ZoneConnection.tsx       # SVG line between connected zones
  MapControls.tsx          # Zoom +/- buttons, center button
  ZoneTooltip.tsx          # Hover tooltip for zone info
  mapUtils.ts              # Position calculations, zone layout
  mapTypes.ts              # TypeScript interfaces for map
```

### Pattern 1: TransformWrapper Container
**What:** Wrap map content in react-zoom-pan-pinch components
**When to use:** For any pannable/zoomable content
**Example:**
```typescript
// Source: react-zoom-pan-pinch official docs
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'

function InteractiveMap() {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={2}
      centerOnInit={true}
      limitToBounds={false}
      wheel={{ step: 0.1 }}
      pinch={{ step: 5 }}
    >
      {({ zoomIn, zoomOut, resetTransform, centerView }) => (
        <>
          <MapControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onCenter={() => centerView(1, 0)}
          />
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <MapCanvas />
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  )
}
```

### Pattern 2: Zone Node with Fog of War
**What:** Conditional rendering/styling based on visited state
**When to use:** For each zone on the map
**Example:**
```typescript
// Zone visibility states
type ZoneVisibility = 'visited' | 'adjacent' | 'hidden'

function ZoneNode({
  zone,
  visibility,
  isCurrent,
  onClick
}: ZoneNodeProps) {
  if (visibility === 'hidden') return null

  const isUnknown = visibility === 'adjacent'

  return (
    <button
      onClick={onClick}
      disabled={visibility === 'adjacent'}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2',
        'w-12 h-12 rounded-lg transition-all duration-200',
        zone.zone_type === 'town'
          ? 'bg-amber-500/80 hover:bg-amber-400'
          : 'bg-green-500/80 hover:bg-green-400',
        isUnknown && 'bg-gray-600/50 cursor-not-allowed',
        isCurrent && 'ring-2 ring-yellow-400 ring-offset-2'
      )}
      style={{ left: zone.x, top: zone.y }}
    >
      {isUnknown ? '?' : <ZoneIcon type={zone.zone_type} />}
      {isCurrent && <PlayerIcon />}
    </button>
  )
}
```

### Pattern 3: SVG Connection Lines with Direction Arrows
**What:** Draw paths between connected zones with arrow indicators
**When to use:** Visual connection representation
**Example:**
```typescript
function ZoneConnection({
  from,
  to,
  direction,
  isReachable
}: ConnectionProps) {
  // Calculate midpoint for arrow placement
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI

  return (
    <g className={cn(
      'transition-opacity',
      !isReachable && 'opacity-30'
    )}>
      <line
        x1={from.x} y1={from.y}
        x2={to.x} y2={to.y}
        className="stroke-2 stroke-gray-500"
      />
      <polygon
        points="-6,-4 6,0 -6,4"
        transform={`translate(${midX},${midY}) rotate(${angle})`}
        className="fill-gray-500"
      />
    </g>
  )
}
```

### Pattern 4: Viewport Visibility Detection
**What:** Show "center on me" button when player zone is off-screen
**When to use:** To help user find their location
**Example:**
```typescript
function useIsZoneInViewport(
  zonePosition: { x: number; y: number },
  transformState: { scale: number; positionX: number; positionY: number }
) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Calculate if zone is within visible viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const transformedX = zonePosition.x * transformState.scale + transformState.positionX
    const transformedY = zonePosition.y * transformState.scale + transformState.positionY

    setIsVisible(
      transformedX > 0 && transformedX < viewportWidth &&
      transformedY > 0 && transformedY < viewportHeight
    )
  }, [zonePosition, transformState])

  return isVisible
}
```

### Anti-Patterns to Avoid
- **Using left/top for animation:** Triggers layout recalculation. Use CSS transform only.
- **SVG filters for fog of war:** Complex filters cause performance issues with many zones.
- **Separate state for pan/zoom:** Let react-zoom-pan-pinch manage all transform state.
- **Fixed pixel positions:** Use relative/percentage positions or calculate from zone graph.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan/zoom gestures | Custom touch/mouse handlers | react-zoom-pan-pinch | Touch gestures, inertia, bounds are complex; library handles edge cases |
| Tooltip positioning | Fixed position tooltip | Existing Tooltip component | Already handles viewport bounds, accessibility |
| Pixel font rendering | Custom font implementation | font-pixel class | Already set up with proper antialiasing settings |
| Zone connection layout | Manual coordinate calculation | Graph layout algorithm | Zone positions should be consistent and predictable |

**Key insight:** react-zoom-pan-pinch handles the entire gesture/transform lifecycle including inertia, bounds checking, and gesture disambiguation. Implementing this manually would require hundreds of lines of complex event handling.

## Common Pitfalls

### Pitfall 1: Transform Performance Issues
**What goes wrong:** Janky pan/zoom, dropped frames below 60fps
**Why it happens:** Animating layout properties (width, left, top) instead of transform
**How to avoid:**
- Only animate transform and opacity
- Add `will-change: transform` to transformed elements
- Use `translateZ(0)` to promote layers to GPU
**Warning signs:** DevTools shows long "Layout" or "Paint" times during interaction

### Pitfall 2: Touch Target Size
**What goes wrong:** Zone nodes hard to tap on mobile
**Why it happens:** Visual size too small for finger taps
**How to avoid:**
- Minimum 44x44px touch targets (WCAG requirement)
- Use ::before pseudo-element to expand touch area without changing visual size
- Already established pattern in project: `.touch-target-inline`
**Warning signs:** Users report difficulty selecting zones on mobile

### Pitfall 3: Fog of War State Management
**What goes wrong:** Visited zones reset on page reload
**Why it happens:** Not persisting visited zones to storage/database
**How to avoid:**
- Store visited zone IDs in player data (database or localStorage)
- Calculate adjacent zones from visited set + zone connections
- Memoize visibility calculations
**Warning signs:** Players report losing exploration progress

### Pitfall 4: Zoom Level Extremes
**What goes wrong:** Users zoom out until zones are invisible, or zoom in until only one zone visible
**Why it happens:** No bounds on zoom scale
**How to avoid:**
- Set minScale (0.5) and maxScale (2.0) based on map content size
- Test with actual zone positions to determine reasonable limits
**Warning signs:** Users get "lost" in the map or can't see overall structure

### Pitfall 5: Coordinate System Mismatch
**What goes wrong:** Zones appear in wrong positions or connections don't line up
**Why it happens:** Mixing CSS coordinates with SVG coordinates, or using different origins
**How to avoid:**
- Use consistent coordinate system throughout (e.g., top-left origin)
- Calculate zone positions in a single place (mapUtils.ts)
- Use same coordinate reference for both zones and connections
**Warning signs:** Lines don't connect to zone centers, zones jump when zooming

## Code Examples

Verified patterns from official sources:

### react-zoom-pan-pinch Setup with Controls Hook
```typescript
// Source: https://github.com/BetterTyped/react-zoom-pan-pinch
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'

// Controls must be inside TransformWrapper to access context
function MapControls() {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls()

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={() => zoomIn()}
        className="w-10 h-10 bg-surface-elevated rounded-lg border border-border-subtle"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="w-10 h-10 bg-surface-elevated rounded-lg border border-border-subtle"
      >
        -
      </button>
      <button
        onClick={() => resetTransform()}
        className="w-10 h-10 bg-surface-elevated rounded-lg border border-border-subtle"
      >
        Reset
      </button>
    </div>
  )
}

function InteractiveMap() {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={2}
      wheel={{ step: 0.1 }}
      pinch={{ step: 5 }}
    >
      <MapControls />
      <TransformComponent>
        <MapCanvas />
      </TransformComponent>
    </TransformWrapper>
  )
}
```

### CSS Transform Performance Optimization
```css
/* Source: MDN Web Docs, CSS performance guides */
.map-canvas {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}

.zone-node {
  will-change: transform, opacity;
  transition: transform 0.15s ease-out, opacity 0.2s ease-out;
}

/* Use transform for hover effects, not width/scale properties that trigger layout */
.zone-node:hover {
  transform: translate(-50%, -50%) scale(1.1);
}
```

### Existing Tooltip Integration
```typescript
// Source: Project's existing Tooltip component
import { Tooltip } from '@/components/ui/Tooltip'

function ZoneNode({ zone }: { zone: Zone }) {
  return (
    <Tooltip
      content={
        <div className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
          <div className="font-pixel text-sm text-text-primary">
            {zone.name.toUpperCase()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
              zone.zone_type === 'town'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-green-500/20 text-green-400'
            )}>
              {zone.zone_type}
            </span>
            {zone.zone_type === 'route' && (
              <span className="text-xs text-text-secondary">
                Lv. {zone.min_level}-{zone.max_level}
              </span>
            )}
          </div>
        </div>
      }
      position="top"
    >
      <button className="zone-node">{/* ... */}</button>
    </Tooltip>
  )
}
```

### Zone Position Layout Calculation
```typescript
// Calculate zone positions from connection graph
// This creates a consistent spatial layout based on directions

interface ZonePosition {
  id: number
  x: number
  y: number
}

const ZONE_SPACING = 100 // pixels between zones
const DIRECTION_VECTORS: Record<string, { dx: number; dy: number }> = {
  'N': { dx: 0, dy: -1 },
  'S': { dx: 0, dy: 1 },
  'E': { dx: 1, dy: 0 },
  'W': { dx: -1, dy: 0 },
  'NE': { dx: 1, dy: -1 },
  'SE': { dx: 1, dy: 1 },
  'SW': { dx: -1, dy: 1 },
  'NW': { dx: -1, dy: -1 },
}

function calculateZonePositions(
  zones: Zone[],
  connections: Array<{ from_id: number; to_id: number; direction: string }>,
  startZoneId: number
): Map<number, ZonePosition> {
  const positions = new Map<number, ZonePosition>()
  const visited = new Set<number>()

  // Start zone at center
  positions.set(startZoneId, { id: startZoneId, x: 400, y: 300 })
  visited.add(startZoneId)

  // BFS to calculate positions based on directions
  const queue = [startZoneId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentPos = positions.get(currentId)!

    // Find connections from current zone
    const outgoing = connections.filter(c => c.from_id === currentId)

    for (const conn of outgoing) {
      if (visited.has(conn.to_id)) continue

      const vector = DIRECTION_VECTORS[conn.direction] || { dx: 0, dy: 1 }
      positions.set(conn.to_id, {
        id: conn.to_id,
        x: currentPos.x + vector.dx * ZONE_SPACING,
        y: currentPos.y + vector.dy * ZONE_SPACING,
      })
      visited.add(conn.to_id)
      queue.push(conn.to_id)
    }
  }

  return positions
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual touch handling | react-zoom-pan-pinch | 2023+ | Much simpler implementation, better mobile support |
| SVG filter fog of war | CSS opacity/transforms | Ongoing | Better performance with many elements |
| Layout property animations | Transform-only animations | 2018+ | Required for 60fps on mobile |

**Deprecated/outdated:**
- react-pinch-zoom-pan (2019): Superseded by react-zoom-pan-pinch
- Manual getBoundingClientRect for zoom: Libraries handle this better

## Open Questions

Things that couldn't be fully resolved:

1. **Zone coordinate data storage**
   - What we know: Zones have id, name, type; connections have direction
   - What's unclear: Whether x/y coordinates should be stored in DB or calculated client-side
   - Recommendation: Calculate from direction graph initially, can add explicit coordinates later if needed

2. **Visited zones persistence**
   - What we know: Need to track which zones player has visited for fog of war
   - What's unclear: Whether this exists in current database schema
   - Recommendation: Check if `pokedex_entries` pattern can be reused, or add `visited_zones` table

3. **Background style decision**
   - What we know: User marked as "Claude's discretion" - options are solid dark, parchment, or terrain-based
   - Recommendation: Start with solid dark (matches existing theme), can iterate later

## Sources

### Primary (HIGH confidence)
- react-zoom-pan-pinch GitHub: https://github.com/BetterTyped/react-zoom-pan-pinch - API, usage patterns
- react-zoom-pan-pinch npm: https://www.npmjs.com/package/react-zoom-pan-pinch - version 3.7.0 confirmed
- Project codebase: `apps/web/src/components/ui/Tooltip.tsx` - existing accessible tooltip
- Project codebase: `apps/web/src/app/globals.css` - existing design tokens and patterns

### Secondary (MEDIUM confidence)
- MDN CSS transforms: Transform-based animation for performance
- CSS 60fps guides: will-change, translateZ(0) patterns verified across multiple sources

### Tertiary (LOW confidence)
- Fog of war examples: Various approaches found, CSS-based recommended over SVG filters
- Pokemon Gen 4-5 style: Subjective visual target, implementation details to be determined

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-zoom-pan-pinch is clearly the best option, well-documented
- Architecture: HIGH - patterns are established and project already has similar component structures
- Pitfalls: HIGH - performance pitfalls well-documented, existing project patterns available
- Visual styling: MEDIUM - Gen 4-5 style is subjective, will require iteration

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable libraries, no major changes expected)
