# Phase 12: Party Reordering - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable players to organize their party through drag-and-drop. Party order persists and affects gameplay — first Pokemon in order is the one that battles. Touch and mouse support required.

</domain>

<decisions>
## Implementation Decisions

### Drag Interaction
- Long press (~300ms) to initiate drag (prevents accidental drags)
- Radial progress ring appears during long press countdown
- Card lifts with scale up (1.05x) + elevated shadow when drag starts
- Cancel drag by dropping outside party area OR pressing Escape key

### Drop Zone Feedback
- Target slot fills with semi-transparent background color on hover
- Swap arrows appear between dragged card and target slot's Pokemon
- Quick snap animation (~100ms) when cards settle into new positions
- All 6 slots always visible (empty slots show as dashed placeholders)
- No haptic feedback — visual feedback only

### Reorder Logic
- Dragging to an occupied slot: swap positions (A↔B)
- Dragging to an empty slot: move there, others shift up to fill gap
- Example: Move slot 1 to empty slot 4 → slots 2,3 shift up to become 1,2

### Order Persistence
- Real-time sync across all open tabs/devices
- Toast notification on save failure, cards revert to original positions

### Layout During Drag
- Source slot shows as empty with dashed border while dragging
- Reordering disabled during active battle

### Claude's Discretion
- Active Pokemon indicator (position 1 badge vs subtle border vs implicit)
- Optimistic update vs wait for server confirmation
- Storage location (players table vs pokemon.party_position column)
- Dragged card offset on mobile (finger visibility)
- Auto-scroll behavior if layout ever requires scrolling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard drag-and-drop patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-party-reordering*
*Context gathered: 2026-01-20*
