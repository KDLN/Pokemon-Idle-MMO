# Phase 15 Plan 04: Mock Game Screen & Theme Comparison Summary

**Completed:** 2026-01-21
**Duration:** 4 minutes

## One-liner

Production-quality mock game screen with noise texture backgrounds and /theme-compare route for visual theme comparison via toggle switch.

## What Was Built

### Core Deliverables

1. **Noise Texture CSS** (`apps/web/src/styles/noise-texture.css`)
   - SVG feTurbulence-based noise pattern
   - Applied via `.texture-noise` utility class
   - Opacity controlled by `--texture-noise-opacity` CSS variable
   - Uses mix-blend-mode overlay for subtle texture effect

2. **MockGameScreen Component** (`apps/web/src/components/game/MockGameScreen.tsx`)
   - 724 lines, production-quality mock of main game screen
   - Static mock data (no WebSocket required)
   - Full 3-column layout matching GameShell
   - All sections: Header, Ticker, Map, World, Party, Activity, Boosts, Chat

3. **Theme Comparison Route** (`apps/web/src/app/theme-compare/page.tsx`)
   - Accessible at `/theme-compare` (no auth required)
   - Toggle switch flips between current and modern themes
   - Theme label indicator shows active theme name
   - data-theme attribute triggers CSS variable overrides

### Technical Details

**MockGameScreen Features:**
- Actual Pokemon sprites via PokeAPI URLs
- HP and XP bars on Pokemon cards
- Nearby players section with status indicators
- Season progress bar in header
- Pokedex and Leaderboard buttons
- Handheld device aesthetic on map (indicator dots, corner pokeballs)
- Timestamped chat messages with proper bubbles
- Color-coded activity log entries

**Theme Toggle Mechanism:**
- Toggle sets `data-theme="modern"` attribute on wrapper div
- Modern theme CSS variables defined in `colors-modern.css` kick in
- All components using CSS variables automatically update
- No re-render cascade (CSS-only theme switching)

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `apps/web/src/styles/noise-texture.css` | Created | 21 |
| `apps/web/src/components/game/MockGameScreen.tsx` | Created | 724 |
| `apps/web/src/app/theme-compare/page.tsx` | Created | 60 |
| `apps/web/src/app/globals.css` | Modified | +1 |

**Total:** 3 files created, 1 modified, ~806 lines added

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 0b070e0 | feat | Add noise texture CSS and MockGameScreen component |
| 7db5cb5 | feat | Add /theme-compare route with toggle switch |
| dd375db | feat | Polish MockGameScreen to production quality |

## Verification Results

All verification criteria passed:

- [x] noise-texture.css exists with SVG feTurbulence pattern
- [x] MockGameScreen renders complete game layout with mock data
- [x] /theme-compare route accessible without authentication
- [x] Theme toggle switches between current and modern themes
- [x] Visual differences are clear (colors, textures, button styles)
- [x] MockGameScreen.tsx >= 100 lines (724 lines)
- [x] theme-compare/page.tsx contains data-theme
- [x] MockGameScreen properly imported and rendered in comparison route

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use PokeAPI sprite URLs | Real Pokemon sprites look better than placeholder emojis for production quality |
| Add XP bars to Pokemon cards | Matches actual game UI, makes theme differences more visible |
| 724-line MockGameScreen | Comprehensive mock needed to demonstrate theme on realistic UI |
| Include nearby players | Additional UI element to showcase theme styling |

## Success Criteria Status

- [x] **THEME-02:** Mock game screen demonstrates "Pokemon clean modern" theme direction
- [x] **THEME-03:** Side-by-side comparison shows current theme vs proposed theme
- [x] Comparison tool is shareable (/theme-compare URL)
- [x] Live interactive components in comparison view (buttons, inputs)
- [x] Production-ready quality (polished, complete)

## Next Phase Readiness

Phase 15 (Theme Exploration) is now complete with all 4 plans executed:
- 15-01: Modern theme tokens created
- 15-02: Beveled 3D button component created
- 15-03: Component showcase in Storybook
- 15-04: Mock game screen and theme comparison route

The theme exploration tools are ready for design review. The `/theme-compare` route can be shared for stakeholder feedback on the "Pokemon Clean Modern" theme direction.

---

*Plan: 15-04 | Phase: 15-theme-exploration | Completed: 2026-01-21*
