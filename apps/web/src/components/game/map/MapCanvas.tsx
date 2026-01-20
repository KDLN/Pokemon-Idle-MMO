'use client'

import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/ui/cn'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { ConnectionLayer, type RawConnectionData } from './ConnectionLayer'
import { ZoneNode } from './ZoneNode'
import { getAllZoneVisibilities } from './mapUtils'
import type { MapCanvasProps, ZonePosition, ZoneVisibility } from './mapTypes'

// Mock zone data for testing (will be replaced with real data from gameStore)
interface MockZone {
  id: number
  name: string
  zone_type: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
  min_level: number
  max_level: number
}

const MOCK_ZONES: MockZone[] = [
  { id: 1, name: 'Pallet Town', zone_type: 'town', min_level: 1, max_level: 1 },
  { id: 2, name: 'Route 1', zone_type: 'route', min_level: 2, max_level: 5 },
  { id: 3, name: 'Viridian City', zone_type: 'town', min_level: 1, max_level: 1 },
  { id: 4, name: 'Route 2', zone_type: 'route', min_level: 3, max_level: 7 },
  { id: 5, name: 'Viridian Forest', zone_type: 'forest', min_level: 3, max_level: 8 },
  { id: 6, name: 'Route 2 North', zone_type: 'route', min_level: 5, max_level: 10 },
  { id: 7, name: 'Pewter City', zone_type: 'town', min_level: 1, max_level: 1 },
  { id: 8, name: 'Route 3', zone_type: 'route', min_level: 8, max_level: 12 },
  { id: 9, name: 'Mt. Moon', zone_type: 'cave', min_level: 10, max_level: 14 },
  { id: 10, name: 'Route 4', zone_type: 'route', min_level: 10, max_level: 14 },
  { id: 11, name: 'Mt. Moon Exit', zone_type: 'cave', min_level: 10, max_level: 14 },
  { id: 12, name: 'Cerulean City', zone_type: 'town', min_level: 1, max_level: 1 },
  { id: 13, name: 'Route 24', zone_type: 'route', min_level: 16, max_level: 20 },
  { id: 14, name: 'Route 25', zone_type: 'route', min_level: 16, max_level: 20 },
]

// Mock zone positions for testing (will be replaced with real data)
// Kanto map layout: Pallet Town at bottom, going north
// Exported for InteractiveMap initial centering
export const MOCK_POSITIONS: ZonePosition[] = [
  { id: 1, x: 400, y: 550 },  // Pallet Town (start)
  { id: 2, x: 400, y: 450 },  // Route 1
  { id: 3, x: 400, y: 350 },  // Viridian City
  { id: 4, x: 400, y: 250 },  // Route 2 (south)
  { id: 5, x: 400, y: 150 },  // Viridian Forest
  { id: 6, x: 400, y: 50 },   // Route 2 (north)
  { id: 7, x: 500, y: 50 },   // Pewter City
  { id: 8, x: 600, y: 50 },   // Route 3
  { id: 9, x: 700, y: 50 },   // Mt. Moon
  { id: 10, x: 700, y: 150 }, // Route 4
  { id: 11, x: 700, y: 250 }, // Mt. Moon Exit
  { id: 12, x: 700, y: 350 }, // Cerulean City
  { id: 13, x: 700, y: 450 }, // Route 24
  { id: 14, x: 800, y: 450 }, // Route 25
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
// Exported for InteractiveMap initial centering
export const MOCK_CURRENT_ZONE_ID = 3 // Viridian City

/**
 * MapCanvas - Content layer for zones and connections
 *
 * This is the zoomable/pannable content area inside the InteractiveMap.
 * It provides a fixed-dimension canvas with GPU-accelerated transforms.
 *
 * Features:
 * - Fixed base dimensions for consistent layout
 * - Dark gradient background matching game theme
 * - will-change: transform for 60fps pan/zoom
 * - Zone nodes rendered at calculated positions
 * - Connection lines between connected zones
 */
export function MapCanvas({
  width = 900,
  height = 650,
  children,
}: MapCanvasProps) {
  // Get visited zones from store (persisted)
  const visitedZones = useGameStore((state) => state.visitedZones)
  // Get current zone and connected zones from store
  const currentZone = useGameStore((state) => state.currentZone)
  const connectedZones = useGameStore((state) => state.connectedZones)

  // Use real current zone ID if available, otherwise fall back to mock
  const currentZoneId = currentZone?.id ?? MOCK_CURRENT_ZONE_ID

  // Set of connected zone IDs for quick lookup
  const connectedZoneIds = useMemo(() => {
    return new Set(connectedZones.map((z) => z.id))
  }, [connectedZones])

  // Create position lookup map for ConnectionLayer and ZoneNodes
  const positionsMap = useMemo(() => {
    const map = new Map<number, ZonePosition>()
    for (const pos of MOCK_POSITIONS) {
      map.set(pos.id, pos)
    }
    return map
  }, [])

  // Calculate visibility for all zones based on visitedZones
  const zoneVisibilities = useMemo(() => {
    const zoneIds = MOCK_ZONES.map(z => z.id)
    return getAllZoneVisibilities(zoneIds, visitedZones, MOCK_CONNECTIONS)
  }, [visitedZones])

  // Combine zone data with positions and visibility for rendering
  const zoneNodesData = useMemo(() => {
    return MOCK_ZONES.map(zone => {
      const position = positionsMap.get(zone.id)
      if (!position) return null
      const visibility = zoneVisibilities.get(zone.id) ?? 'hidden'
      return {
        ...zone,
        position,
        isCurrent: zone.id === currentZoneId,
        visibility,
        isConnected: connectedZoneIds.has(zone.id),
      }
    }).filter(Boolean) as Array<{
      id: number
      name: string
      zone_type: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
      min_level: number
      max_level: number
      position: ZonePosition
      isCurrent: boolean
      visibility: ZoneVisibility
      isConnected: boolean
    }>
  }, [positionsMap, zoneVisibilities, currentZoneId, connectedZoneIds])

  // Handle zone click (console.log for debugging)
  const handleZoneClick = (zoneId: number) => {
    const zone = MOCK_ZONES.find(z => z.id === zoneId)
    console.log(`Zone clicked: ${zone?.name ?? 'Unknown'} (ID: ${zoneId})`)
  }

  // Handle travel to a connected zone
  const handleZoneTravel = useCallback((zoneId: number) => {
    // Validate zone is connected (can only travel to adjacent zones)
    if (!connectedZoneIds.has(zoneId)) {
      console.log(`Cannot travel to zone ${zoneId} - not connected`)
      return
    }

    // Send travel request via WebSocket
    console.log(`Traveling to zone ${zoneId}`)
    gameSocket.moveToZone(zoneId)
  }, [connectedZoneIds])

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
        currentZoneId={currentZoneId}
        zoneVisibilities={zoneVisibilities}
        width={width}
        height={height}
        onPathClick={handleZoneTravel}
      />

      {/* Zone nodes layer - renders above connections (z-10) */}
      <div className="absolute inset-0 z-10">
        {zoneNodesData.map(zone => (
          <ZoneNode
            key={zone.id}
            id={zone.id}
            name={zone.name}
            zoneType={zone.zone_type}
            position={zone.position}
            isCurrent={zone.isCurrent}
            visibility={zone.visibility}
            isConnected={zone.isConnected}
            minLevel={zone.min_level}
            maxLevel={zone.max_level}
            onClick={() => handleZoneClick(zone.id)}
            onTravel={handleZoneTravel}
          />
        ))}
        {children}
      </div>
    </div>
  )
}
