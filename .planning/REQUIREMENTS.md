# Requirements: Pokemon Idle MMO v1.1

**Defined:** 2026-01-19
**Core Value:** Polish the game to feel like a real product, not a prototype — consistent visuals, responsive layouts, satisfying battle feedback.

## v1 Requirements

Requirements for v1.1 release. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Guild Quest "Show contributors" button works without error
- [ ] **BUG-02**: Guild Bank view/layout toggle switches display mode correctly

### Design System

- [ ] **DS-01**: Audit existing CSS variables and document current design tokens
- [ ] **DS-02**: Create color token documentation with semantic naming
- [ ] **DS-03**: Create typography scale documentation (sizes, weights, line heights)
- [ ] **DS-04**: Create spacing scale documentation (margins, padding, gaps)
- [ ] **DS-05**: Set up Storybook 10 with Next.js 16 + Tailwind CSS 4 integration
- [ ] **DS-06**: Create CVA component variants for Button, Card, Badge components
- [ ] **DS-07**: Document component patterns in Storybook with examples

### Layout & Responsiveness

- [ ] **LAYOUT-01**: Body text uses 16px minimum font size
- [ ] **LAYOUT-02**: Interactive elements have 44px minimum touch targets
- [ ] **LAYOUT-03**: Activity log fits available space without scroll when content allows
- [ ] **LAYOUT-04**: Pokemon party panel fits screen without scroll (6 Pokemon visible)
- [ ] **LAYOUT-05**: All game screens work on mobile viewport (375px width)
- [ ] **LAYOUT-06**: All game screens work on tablet viewport (768px width)
- [ ] **LAYOUT-07**: All game screens work on desktop viewport (1280px+ width)

### UI Improvements

- [ ] **UI-01**: Navigation buttons ordered in travel direction (contextual to player location)
- [ ] **UI-02**: "Power-Ups" renamed to "Boosts" throughout UI
- [ ] **UI-03**: Active boosts display in Boosts panel with remaining duration
- [ ] **UI-04**: Guild Bank Pokemon display shows sprite and name (not numeric ID)
- [ ] **UI-05**: Guild Bank transaction logs display human-readable format (not raw JSON)
- [ ] **UI-06**: Party Pokemon can be drag-reordered
- [ ] **UI-07**: Party order changes persist to database
- [ ] **UI-08**: Party order affects which Pokemon battles first

### Map Overhaul

- [ ] **MAP-01**: Map visual styling matches game theme (colors, fonts, borders)
- [ ] **MAP-02**: Zone click/hover interactions work correctly
- [ ] **MAP-03**: Zone connections are visually clear and intuitive
- [ ] **MAP-04**: Map uses transform-based pan/zoom for smooth performance
- [ ] **MAP-05**: Current zone is clearly highlighted on map

### Battle System

- [ ] **BATTLE-01**: Battle turns calculated one at a time on server (not pre-computed)
- [ ] **BATTLE-02**: Client receives turns progressively and animates each
- [ ] **BATTLE-03**: HP bars animate down as damage is dealt
- [ ] **BATTLE-04**: Catch success/failure calculated at throw moment (not pre-decided)
- [ ] **BATTLE-05**: Battle has timeout protection (30 seconds)
- [ ] **BATTLE-06**: Disconnected battles auto-resolve on server
- [ ] **BATTLE-07**: Battle animation fits within tick timing (800ms max per turn)

### Theme Exploration

- [ ] **THEME-01**: Component showcase page displays all UI elements
- [ ] **THEME-02**: Mock game screen shows "Pokemon clean modern" theme direction
- [ ] **THEME-03**: Side-by-side comparison tool shows current vs proposed theme

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Polish

- **ADV-01**: Sound effects for battles, catches, UI interactions
- **ADV-02**: Particle effects for critical hits, evolutions, rare catches
- **ADV-03**: Screen shake for impactful moments
- **ADV-04**: Offline progress summary on reconnect

### Battle Enhancements

- **BATTLE-ADV-01**: Gym battles use progressive turn system
- **BATTLE-ADV-02**: EV system integration with battle calculations
- **BATTLE-ADV-03**: Raid/event battle support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full mobile app | Web-first, native mobile is separate project |
| Complete theme redesign | Theme exploration page first, full redesign in future milestone |
| Sound/audio system | Requires additional infrastructure, defer to v1.2 |
| Battle move selection | Idle game — battles are automatic |
| Animated Pokemon sprites | Asset complexity, stick with static for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | TBD | Pending |
| BUG-02 | TBD | Pending |
| DS-01 | TBD | Pending |
| DS-02 | TBD | Pending |
| DS-03 | TBD | Pending |
| DS-04 | TBD | Pending |
| DS-05 | TBD | Pending |
| DS-06 | TBD | Pending |
| DS-07 | TBD | Pending |
| LAYOUT-01 | TBD | Pending |
| LAYOUT-02 | TBD | Pending |
| LAYOUT-03 | TBD | Pending |
| LAYOUT-04 | TBD | Pending |
| LAYOUT-05 | TBD | Pending |
| LAYOUT-06 | TBD | Pending |
| LAYOUT-07 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| UI-05 | TBD | Pending |
| UI-06 | TBD | Pending |
| UI-07 | TBD | Pending |
| UI-08 | TBD | Pending |
| MAP-01 | TBD | Pending |
| MAP-02 | TBD | Pending |
| MAP-03 | TBD | Pending |
| MAP-04 | TBD | Pending |
| MAP-05 | TBD | Pending |
| BATTLE-01 | TBD | Pending |
| BATTLE-02 | TBD | Pending |
| BATTLE-03 | TBD | Pending |
| BATTLE-04 | TBD | Pending |
| BATTLE-05 | TBD | Pending |
| BATTLE-06 | TBD | Pending |
| BATTLE-07 | TBD | Pending |
| THEME-01 | TBD | Pending |
| THEME-02 | TBD | Pending |
| THEME-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 0
- Unmapped: 36

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
