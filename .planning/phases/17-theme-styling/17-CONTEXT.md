# Phase 17: Theme Styling - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply Modern theme colors, typography, and component styles from MockGameScreen to the production game. This includes updating CSS variables/design tokens, applying beveled button styling, updating card/panel styling, and ensuring consistent interactive states. No new features — visual polish only.

</domain>

<decisions>
## Implementation Decisions

### Color palette approach
- Update existing CSS variables/tokens directly — no parallel theme system
- Glass effects applied to header only — sidebars and modals use solid surfaces
- Pokemon type colors should be revisited to ensure clean matching and readable text
- Brand colors (blue/red/gold) — Claude's discretion to fine-tune during implementation

### Claude's Discretion: Colors
- Zone-aware accent colors vs unified palette — pick what looks best
- Brand color fine-tuning — adjust if needed during implementation
- Type color saturation — balance visibility against dark theme with readability

### Button styling patterns
- Lean retro/physical — default to beveled buttons where reasonable
- Action-based colors — green for confirm, red for destructive, blue for neutral
- Header navigation buttons stay special (unique gradient treatment, not standard BeveledButton)
- Beveled treatment for prominent icon buttons — skip for tiny/minimal icon buttons
- Form inputs have subtle inset/border look to match the physical button aesthetic

### Claude's Discretion: Buttons
- Disabled button styling — choose between gray/flat or beveled/muted

### Card & panel styling
- Noise texture applied broadly — most cards and panels get the texture-noise treatment
- All Pokemon cards get type-colored background overlay
- Ambient particles included in zone view
- Sidebars have subtle vertical gradient (slightly darker at bottom)
- Map keeps handheld device aesthetic (indicator dots, device-like frame)

### Claude's Discretion: Cards
- Card borders — decide based on context (interactive vs static)
- Modal backdrop — blur vs dark overlay based on performance/visual impact

### Typography & pixel fonts
- Pixel font used for section headers throughout the game
- Mixed case allowed — uppercase for labels/headers, mixed case for longer text
- Numbers always use monospace font for alignment
- Minimum text size 12px — no 9-10px sizes for readability

</decisions>

<specifics>
## Specific Ideas

- User approved MockGameScreen layout: "This looks so good!"
- Clean matching and readable text prioritized for type colors
- Retro/physical feel preferred over clean/modern where applicable
- Header buttons (Pokedex, Leaderboard) are brand identity — keep their unique styling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-theme-styling*
*Context gathered: 2026-01-21*
