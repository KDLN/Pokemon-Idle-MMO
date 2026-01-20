# Phase 11: UI Polish - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve navigation ordering, rename "Power-Ups" to "Boosts" throughout UI, display active boosts with duration, show Guild Bank Pokemon with sprite and name (not numeric ID), and format transaction logs as human-readable entries.

</domain>

<decisions>
## Implementation Decisions

### Navigation ordering
- Order buttons by compass direction (N/E/S/W), then diagonals
- Display direction as arrow symbols (↑ → ↓ ← and ↗ ↘ ↙ ↖)
- Format: "↑ Route 1" (arrow prefix before zone name)
- Add direction column to zone_connections table (database migration required)
- **Claude's Discretion:** Secondary sort within same direction, current zone display, visual grouping

### Active boost display
- Show in Boosts panel (existing location), not header
- Card-based display with name, countdown timer (5:32 format), and effect description
- Effect description collapsed by default, tap/click to expand
- Timer turns red/urgent when under 1 minute remaining
- Boosts don't stack — using same boost extends duration, one entry
- On expiry: card fades out smoothly AND toast notification appears
- Empty state: prompt message "Use a boost from your inventory to enhance your training!"
- **Claude's Discretion:** Card styling details

### Guild Bank Pokemon display
- Show sprite + name + level for each Pokemon
- Toggle between grid view and list view
- Multiple sorting options: date, level, name, species, grade, IVs
- **Claude's Discretion:** Info density per view (grid compact vs list detailed)

### Transaction log format
- Detailed view: timestamp + player + action + item
- Timestamps: relative ("2 hours ago") with hover for absolute date/time
- Filter by type (deposit/withdraw/all) and by player
- **Claude's Discretion:** Visual differentiation for transaction types (color-coded icons vs same style)

### Naming change
- Rename all instances of "Power-Ups" to "Boosts" throughout UI

</decisions>

<specifics>
## Specific Ideas

No specific product references — open to standard approaches for the implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-ui-polish*
*Context gathered: 2026-01-20*
