# Phase 15: Theme Exploration - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Provide tools to visualize and compare theme directions — a component showcase, a mock "Pokemon clean modern" theme implementation, and side-by-side comparison capability. This phase creates exploration tools for evaluating design direction, not permanently switching themes.

</domain>

<decisions>
## Implementation Decisions

### Component Showcase
- Include both reusable UI components AND game-specific elements (comprehensive)
- Organize by screen context (Battle UI, Inventory UI, Map UI, etc.) not by component type
- Live interactive components — buttons click, hovers work, inputs accept text
- Located in Storybook as a new page (dev tool context)

### Theme Direction ("Pokemon Clean Modern")
- Clean hybrid style: modern UI patterns with retro pixel accents
- Reference: Sword/Shield UI — clean panels, modern approach with game personality
- Saturated game colors: bold Pokemon type colors, high contrast, vibrant
- Subtle pixel accents: pixel font for titles only, smooth UI elsewhere
- Textured backgrounds: subtle patterns or noise for tactile, game-like feel
- Sharp corners with decorative accents: sharp edges but corner elements for game UI feel
- Beveled/3D buttons: raised appearance with shadows — classic game button feel
- Smooth and polished animations: ease-out curves, 300-400ms feels premium
- Subtle UI sounds: button clicks, menu opens — adds polish
- Typography: pixel font for headers, clean sans-serif for body text
- Iconography: standard icons for UI actions, Pokemon-style icons for game elements
- Target mood: polished and premium — clean, refined, real product feel

### Comparison Tool
- Toggle switch mode: single view, click to flip between themes (same-space comparison)
- Compare full mock screen (not individual components)
- Live components with real interactions
- Located at standalone route (/theme-compare) — shareable, accessible

### Mock Screen
- Main game view: party panel, activity log, map — the primary gameplay screen
- Uses real game state (requires WebSocket connection)
- Both full page view AND embeddable component (source for comparison toggle)
- Production ready quality: fully polished, could ship as-is

### Claude's Discretion
- Exact texture patterns for backgrounds
- Specific corner accent designs
- Sound effect selection and implementation
- Storybook page organization within screens
- Route path naming

</decisions>

<specifics>
## Specific Ideas

- Reference Sword/Shield UI for modern Pokemon aesthetic
- Pixel fonts for titles/headers only — body text stays clean sans-serif
- Beveled buttons should feel like classic game buttons (raised, shadowed)
- Textured backgrounds add tactile quality without being distracting
- Sharp corners with corner accents balance modern clean with game personality
- "Polished and premium" mood: feels like a real product, not a prototype

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-theme-exploration*
*Context gathered: 2026-01-21*
