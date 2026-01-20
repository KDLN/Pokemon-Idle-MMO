# Phase 13: Map Overhaul - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the map into a polished, intuitive navigation tool. Includes visual styling, zone hover/click interactions, zone connection display, and smooth pan/zoom. This builds a new interactive map component — the current ZoneDisplay shows zone info but there's no visual map with pan/zoom.

</domain>

<decisions>
## Implementation Decisions

### Map Visualization
- Gen 4-5 handheld Pokemon style — more detailed than pixel art, rounder edges, color gradients
- Zones use same shape, distinguished by color: towns amber, routes green
- Player icon overlay on current zone (not just glow or color change)
- Tooltip on hover/tap shows zone name, type (town/route), and level range
- Town names always visible as labels, route names appear on hover only
- Fog of war: unvisited zones hidden, but zones adjacent to visited areas show as "?" markers

### Zone Connections
- Paths always show direction arrows indicating travel direction
- Connections visible if at least one connected zone is known
- Clicking a path travels along it (if reachable from current position)
- Claude's Discretion: connection line styling (straight vs curved, road-like vs simple)

### Pan/Zoom Behavior
- Map centers on current zone when opened
- Zoom via pinch gesture (mobile), scroll wheel (desktop), AND visible +/- buttons
- "Center on me" button appears only when current zone is off-screen
- Claude's Discretion: zoom limits based on map size

### Visual Theming
- Pokemon-style decorative frame around the map
- Typography: pixel font for town names, sans-serif for details/tooltips
- Moderate animations: hover scale, smooth transitions, gentle feedback (not minimal, not bouncy)
- Claude's Discretion: background style (solid dark, parchment, or terrain-based)

### Claude's Discretion
- Connection line styling (path appearance)
- Zoom limits
- Background style
- Exact node sizes and spacing

</decisions>

<specifics>
## Specific Ideas

- "I want it to feel like a part of Pokemon" — Gen 4-5 handheld style specifically
- Player icon overlay for current zone (like the games show your position)
- Fog of war mechanic with "?" markers for adjacent undiscovered zones adds exploration feel
- Quick travel by clicking paths, not just zones

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-map-overhaul*
*Context gathered: 2026-01-20*
