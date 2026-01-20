# Requirements: Pokemon Idle MMO v1.1

**Defined:** 2026-01-19
**Core Value:** Polish the game to feel like a real product, not a prototype — consistent visuals, responsive layouts, satisfying battle feedback.

## v1 Requirements

Requirements for v1.1 release. Each maps to roadmap phases.

### Bug Fixes

- [x] **BUG-01**: Guild Quest "Show contributors" button works without error
- [x] **BUG-02**: Guild Bank view/layout toggle switches display mode correctly

### Design System

- [x] **DS-01**: Audit existing CSS variables and document current design tokens
- [x] **DS-02**: Create color token documentation with semantic naming
- [x] **DS-03**: Create typography scale documentation (sizes, weights, line heights)
- [x] **DS-04**: Create spacing scale documentation (margins, padding, gaps)
- [x] **DS-05**: Set up Storybook 10 with Next.js 16 + Tailwind CSS 4 integration
- [x] **DS-06**: Create CVA component variants for Button, Card, Badge components
- [x] **DS-07**: Document component patterns in Storybook with examples

### Layout & Responsiveness

- [x] **LAYOUT-01**: Body text uses 16px minimum font size
- [x] **LAYOUT-02**: Interactive elements have 44px minimum touch targets
- [x] **LAYOUT-03**: Activity log fits available space without scroll when content allows
- [x] **LAYOUT-04**: Pokemon party panel fits screen without scroll (6 Pokemon visible)
- [x] **LAYOUT-05**: All game screens work on mobile viewport (375px width)
- [x] **LAYOUT-06**: All game screens work on tablet viewport (768px width)
- [x] **LAYOUT-07**: All game screens work on desktop viewport (1280px+ width)

### UI Improvements

- [x] **UI-01**: Navigation buttons ordered in travel direction (contextual to player location)
- [x] **UI-02**: "Power-Ups" renamed to "Boosts" throughout UI
- [x] **UI-03**: Active boosts display in Boosts panel with remaining duration
- [x] **UI-04**: Guild Bank Pokemon display shows sprite and name (not numeric ID)
- [x] **UI-05**: Guild Bank transaction logs display human-readable format (not raw JSON)
- [x] **UI-06**: Party Pokemon can be drag-reordered
- [x] **UI-07**: Party order changes persist to database
- [x] **UI-08**: Party order affects which Pokemon battles first

### Map Overhaul

- [x] **MAP-01**: Map visual styling matches game theme (colors, fonts, borders)
- [x] **MAP-02**: Zone click/hover interactions work correctly
- [x] **MAP-03**: Zone connections are visually clear and intuitive
- [x] **MAP-04**: Map uses transform-based pan/zoom for smooth performance
- [x] **MAP-05**: Current zone is clearly highlighted on map

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

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 8 | Complete |
| BUG-02 | Phase 8 | Complete |
| DS-01 | Phase 9 | Complete |
| DS-02 | Phase 9 | Complete |
| DS-03 | Phase 9 | Complete |
| DS-04 | Phase 9 | Complete |
| DS-05 | Phase 9 | Complete |
| DS-06 | Phase 9 | Complete |
| DS-07 | Phase 9 | Complete |
| LAYOUT-01 | Phase 10 | Complete |
| LAYOUT-02 | Phase 10 | Complete |
| LAYOUT-03 | Phase 10 | Complete |
| LAYOUT-04 | Phase 10 | Complete |
| LAYOUT-05 | Phase 10 | Complete |
| LAYOUT-06 | Phase 10 | Complete |
| LAYOUT-07 | Phase 10 | Complete |
| UI-01 | Phase 11 | Complete |
| UI-02 | Phase 11 | Complete |
| UI-03 | Phase 11 | Complete |
| UI-04 | Phase 11 | Complete |
| UI-05 | Phase 11 | Complete |
| UI-06 | Phase 12 | Complete |
| UI-07 | Phase 12 | Complete |
| UI-08 | Phase 12 | Complete |
| MAP-01 | Phase 13 | Complete |
| MAP-02 | Phase 13 | Complete |
| MAP-03 | Phase 13 | Complete |
| MAP-04 | Phase 13 | Complete |
| MAP-05 | Phase 13 | Complete |
| BATTLE-01 | Phase 14 | Pending |
| BATTLE-02 | Phase 14 | Pending |
| BATTLE-03 | Phase 14 | Pending |
| BATTLE-04 | Phase 14 | Pending |
| BATTLE-05 | Phase 14 | Pending |
| BATTLE-06 | Phase 14 | Pending |
| BATTLE-07 | Phase 14 | Pending |
| THEME-01 | Phase 15 | Pending |
| THEME-02 | Phase 15 | Pending |
| THEME-03 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-20 after Phase 13 completion*
