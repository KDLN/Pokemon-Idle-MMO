---
path: c:\Users\kdln\OneDrive\Documents\Code\Games\Pokemon Idle MMO\apps\web\src\components\game\map\InteractiveMap.tsx
type: component
updated: 2026-01-20
status: active
---

# InteractiveMap.tsx

## Purpose

Pannable, zoomable world map component that visualizes the game world with zone nodes and connections. Uses react-zoom-pan-pinch for smooth gesture handling (mouse drag, scroll wheel, pinch) and automatically centers on the player's current zone.

## Exports

- `InteractiveMap({ className })` - Interactive map container with zoom controls

## Dependencies

- [[apps-web-src-stores-gamestore]] - Current zone for centering
- react-zoom-pan-pinch - Pan/zoom gesture library
- MapCanvas - SVG canvas rendering zone nodes and connections
- MapControls - Zoom +/- buttons and "Center on me" button
- MapFrame - Styled container frame

## Used By

TBD

## Notes

- Canvas dimensions: 900x650 pixels
- Scale range: 0.5x (50%) to 2x (200%)
- Auto-centers on current zone on initial load and zone change
- Uses mock position data until full zone position system is implemented
- Aspect ratio 16:10 with max height 400px (excluding header)
