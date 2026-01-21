# Phase 18: Component Updates - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Update individual game components to match Mock versions. Port MockGameScreen implementations to production, wire them to real data, and clean up dead code. Includes Header, Ticker, Map sidebar, Zone view, Party panel, and Social area.

</domain>

<decisions>
## Implementation Decisions

### Pokemon Card Styling
- Type colors: Both background overlay (20% opacity) AND colored border for pronounced type identity
- Information density: Full info (Mock style) — sprite, name, level, type badge, HP bar, XP bar, HP/XP numbers
- Hover effects: Both card lift AND sprite scale (110%) on hover
- Drag handles: No visible handles — cards are directly draggable

### Social Area Design
- Chat messages: Rounded bubbles with subtle backgrounds (Mock style)
- Username colors: Role-based — guild master = gold, officers = distinct color, members = another
- Tab indicator: Underline accent in brand color (Mock style)
- Notification badges: Red pill badges with white numbers (Mock style)
- Timestamps: Absolute time format ("12:34 PM") not relative
- Send button: BeveledButton style from Phase 17
- Chat input styling: Claude's discretion (likely input-inset for consistency)
- Send button hue: Claude's discretion

### Zone View Atmosphere
- Ambient particles in towns: Yes, but different style than routes/forests
- Town particle style: Claude's discretion (dust motes or golden sparkles)
- Decorative pokeballs: No corner pokeball decorations — keep zone views clean
- Zone content: Centered with pixel font header ("Exploring...") like Mock
- Zone gradients: Zone-specific gradients (forest = green, cave = dark gray, water = blue, etc.)
- Sky gradient: Time-of-day system based on server/game time
- Time periods: 4 periods (dawn, day, dusk, night)
- Town time effects: Yes, same time-of-day system applies to towns

### Migration Approach
- Strategy: Port Mock implementations, wire to real data, clean up dead code
- Old component handling: Claude's discretion (risk-based assessment)
- Mock-only features (Activity Log, Boost Card): Stub them out as UI placeholders
- Map sidebar: Port fully — map visualization, travel buttons, nearby players
- Header + Ticker: Include in this phase
- Migration order: Header first, work down (Header → Ticker → Sidebars → Main content)
- Plan granularity: Fewer larger plans (~2-3 plans grouping related components)
- Breakpoints: Match Phase 16 breakpoints (1024px desktop threshold)

### Mobile Layout
- Sidebar pattern: Tabbed navigation (not drawers)
- Mobile tabs: Zone / Party / Social / Map (four tabs)
- Tab position: Fixed bottom tab bar (iOS/Android native pattern)

### Claude's Discretion
- Chat input inset styling decision
- Send button hue choice
- Town particle style (dust motes vs golden sparkles)
- Old component cleanup timing (immediate vs Phase 19)
- Exact plan groupings within the 2-3 plan constraint

</decisions>

<specifics>
## Specific Ideas

- Time-of-day sky system: dawn (orange/pink), day (blue), dusk (orange/purple), night (dark blue/purple)
- Server time source means all players see same sky — creates shared world feeling
- Bottom tab bar on mobile matches native app patterns users are familiar with
- Role-based chat colors reinforce guild hierarchy visually
- Stubbed features (Activity Log, Boost Card) show intent for future without blocking current work

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-component-updates*
*Context gathered: 2026-01-21*
