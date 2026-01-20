'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/ui/cn'
import { ConnectionLayer, type RawConnectionData } from './ConnectionLayer'
import type { MapCanvasProps, ZonePosition } from './mapTypes'

// Mock zone positions for testing (will be replaced with real data)
// Kanto map layout: Pallet Town at bottom, going north
const MOCK_POSITIONS: ZonePosition[] = [
  { id: 1, x: 400, y: 550 },  // Pallet Town (start)
  { id: 2, x: 400, y: 450 },  // Route 1
  { id: 3, x: 400, y: 350 },  // Viridian City
  { id: 4, x: 400, y: 250 },  // Route 2 (south)
  { id: 5, x: 400, y: 150 },  // Viridian Forest
  { id: 6, x: 400, y: 50 },   // Route 2 (north) / Pewter area
  { id: 7, x: 500, y: 50 },   // Pewter City
  { id: 8, x: 600, y: 50 },   // Route 3
  { id: 9, x: 700, y: 50 },   // Mt. Moon
  { id: 10, x: 700, y: 150 }, // Route 4
]

// Mock connections (bidirectional) - matches database schema
const MOCK_CONNECTIONS: RawConnectionData[] = [
  // Pallet Town <-> Route 1
  { from_zone_id: 1, to_zone_id: 2, direction: 'N' },
  { from_zone_id: 2, to_zone_id: 1, direction: 'S' },
  // Route 1 <-> Viridian City
  { from_zone_id: 2, to_zone_id: 3, direction: 'N' },
  { from_zone_id: 3, to_zone_id: 2, direction: 'S' },
  // Viridian City <-> Route 2 South
  { from_zone_id: 3, to_zone_id: 4, direction: 'N' },
  { from_zone_id: 4, to_zone_id: 3, direction: 'S' },
  // Route 2 South <-> Viridian Forest
  { from_zone_id: 4, to_zone_id: 5, direction: 'N' },
  { from_zone_id: 5, to_zone_id: 4, direction: 'S' },
  // Viridian Forest <-> Route 2 North
  { from_zone_id: 5, to_zone_id: 6, direction: 'N' },
  { from_zone_id: 6, to_zone_id: 5, direction: 'S' },
  // Route 2 North <-> Pewter City
  { from_zone_id: 6, to_zone_id: 7, direction: 'E' },
  { from_zone_id: 7, to_zone_id: 6, direction: 'W' },
  // Pewter City <-> Route 3
  { from_zone_id: 7, to_zone_id: 8, direction: 'E' },
  { from_zone_id: 8, to_zone_id: 7, direction: 'W' },
  // Route 3 <-> Mt. Moon
  { from_zone_id: 8, to_zone_id: 9, direction: 'E' },
  { from_zone_id: 9, to_zone_id: 8, direction: 'W' },
  // Mt. Moon <-> Route 4
  { from_zone_id: 9, to_zone_id: 10, direction: 'S' },
  { from_zone_id: 10, to_zone_id: 9, direction: 'N' },
]

// Mock current zone for testing
const MOCK_CURRENT_ZONE_ID = 3 // Viridian City

/**
 * MapCanvas - Content layer for zones and connections
 *
 * This is the zoomable/pannable content area inside the InteractiveMap.
 * It provides a fixed-dimension canvas with GPU-accelerated transforms.
 *
 * Features:
 * - Fixed base dimensions (800x600) for consistent layout
 * - Dark gradient background matching game theme
 * - will-change: transform for 60fps pan/zoom
 * - Placeholder content until zones are rendered
 */
export function MapCanvas({
  width = 800,
  height = 600,
  children,
}: MapCanvasProps) {
  // Create position lookup map for ConnectionLayer
  const positionsMap = useMemo(() => {
    const map = new Map<number, ZonePosition>()
    for (const pos of MOCK_POSITIONS) {
      map.set(pos.id, pos)
    }
    return map
  }, [])

  return (
    <div
      className={cn(
        'relative',
        // GPU layer promotion for smooth transforms
        'will-change-transform',
        // Dark solid background (user decision from CONTEXT.md)
        'bg-gradient-to-b from-[#152020] via-[#101820] to-[#0a1015]'
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // Force GPU layer
        transform: 'translateZ(0)',
      }}
    >
      {/* Grid pattern overlay for visual interest */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Connection layer - renders below zone nodes (z-0) */}
      <ConnectionLayer
        connections={MOCK_CONNECTIONS}
        positions={positionsMap}
        currentZoneId={MOCK_CURRENT_ZONE_ID}
        width={width}
        height={height}
      />

      {/* Zone nodes layer - renders above connections (z-10) */}
      <div className="absolute inset-0 z-10">
        {children || (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-pixel text-xs text-[var(--color-text-muted,#606080)] opacity-50">
              Map loading...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
