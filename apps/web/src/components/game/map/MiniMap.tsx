'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/ui/cn'
import { useGameStore } from '@/stores/gameStore'
import { getAllZoneVisibilities } from './mapUtils'

// Zone data
interface ZoneData {
  id: number
  name: string
  zone_type: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
}

const ZONES: ZoneData[] = [
  { id: 1, name: 'Pallet Town', zone_type: 'town' },
  { id: 2, name: 'Route 1', zone_type: 'route' },
  { id: 3, name: 'Viridian City', zone_type: 'town' },
  { id: 4, name: 'Route 2', zone_type: 'route' },
  { id: 5, name: 'Viridian Forest', zone_type: 'forest' },
  { id: 6, name: 'Route 2 North', zone_type: 'route' },
  { id: 7, name: 'Pewter City', zone_type: 'town' },
  { id: 8, name: 'Route 3', zone_type: 'route' },
  { id: 9, name: 'Mt. Moon', zone_type: 'cave' },
  { id: 10, name: 'Route 4', zone_type: 'route' },
  { id: 11, name: 'Mt. Moon Exit', zone_type: 'cave' },
  { id: 12, name: 'Cerulean City', zone_type: 'town' },
  { id: 13, name: 'Route 24', zone_type: 'route' },
  { id: 14, name: 'Route 25', zone_type: 'route' },
]

// Normalized positions (0-100 scale for easy percentage positioning)
const POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 90 },   // Pallet Town (bottom left)
  2: { x: 20, y: 75 },   // Route 1
  3: { x: 20, y: 60 },   // Viridian City
  4: { x: 20, y: 45 },   // Route 2
  5: { x: 20, y: 30 },   // Viridian Forest
  6: { x: 20, y: 15 },   // Route 2 North
  7: { x: 40, y: 15 },   // Pewter City
  8: { x: 55, y: 15 },   // Route 3
  9: { x: 70, y: 15 },   // Mt. Moon
  10: { x: 70, y: 30 },  // Route 4
  11: { x: 70, y: 45 },  // Mt. Moon Exit
  12: { x: 70, y: 60 },  // Cerulean City
  13: { x: 70, y: 75 },  // Route 24
  14: { x: 85, y: 75 },  // Route 25
}

// Connection data for lines
const CONNECTIONS: Array<[number, number]> = [
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
]

// Mock connections for visibility calculation (with direction: null for simplicity)
const MOCK_CONNECTIONS = CONNECTIONS.flatMap(([a, b]) => [
  { from_zone_id: a, to_zone_id: b, direction: null as string | null },
  { from_zone_id: b, to_zone_id: a, direction: null as string | null },
])

// Zone type colors
const ZONE_COLORS: Record<ZoneData['zone_type'], string> = {
  town: '#ef4444',     // Red for towns
  route: '#3b82f6',    // Blue for routes
  forest: '#22c55e',   // Green for forest
  cave: '#6b7280',     // Gray for caves
  gym: '#f59e0b',      // Amber for gyms
  special: '#a855f7',  // Purple for special
}

interface MiniMapProps {
  className?: string
}

export function MiniMap({ className }: MiniMapProps) {
  const currentZone = useGameStore((state) => state.currentZone)
  const visitedZones = useGameStore((state) => state.visitedZones)
  const connectedZones = useGameStore((state) => state.connectedZones)

  const currentZoneId = currentZone?.id ?? 1
  const connectedZoneIds = useMemo(() => new Set(connectedZones.map(z => z.id)), [connectedZones])

  // Calculate visibility for all zones
  const zoneVisibilities = useMemo(() => {
    const zoneIds = ZONES.map(z => z.id)
    return getAllZoneVisibilities(zoneIds, visitedZones, MOCK_CONNECTIONS)
  }, [visitedZones])

  return (
    <div className={cn('relative w-full h-[140px] rounded-lg overflow-hidden', className)}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a2525] via-[#121c22] to-[#0c1218]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        {CONNECTIONS.map(([fromId, toId]) => {
          const from = POSITIONS[fromId]
          const to = POSITIONS[toId]
          if (!from || !to) return null

          const fromVis = zoneVisibilities.get(fromId) ?? 'hidden'
          const toVis = zoneVisibilities.get(toId) ?? 'hidden'

          // Only show if at least one end is visible
          if (fromVis === 'hidden' && toVis === 'hidden') return null

          const isActive = fromId === currentZoneId || toId === currentZoneId
          const isConnected = connectedZoneIds.has(fromId) || connectedZoneIds.has(toId)

          return (
            <line
              key={`${fromId}-${toId}`}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={isActive ? '#facc15' : isConnected ? '#6b7280' : '#374151'}
              strokeWidth={isActive ? 2 : 1}
              strokeOpacity={isActive ? 0.8 : 0.4}
            />
          )
        })}
      </svg>

      {/* Zone dots */}
      {ZONES.map(zone => {
        const pos = POSITIONS[zone.id]
        if (!pos) return null

        const visibility = zoneVisibilities.get(zone.id) ?? 'hidden'
        const isCurrent = zone.id === currentZoneId
        const isConnected = connectedZoneIds.has(zone.id)

        // Skip hidden zones (but show silhouette for adjacent)
        if (visibility === 'hidden') return null

        const color = ZONE_COLORS[zone.zone_type]
        const size = isCurrent ? 12 : zone.zone_type === 'town' ? 10 : 6

        return (
          <div
            key={zone.id}
            className={cn(
              'absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
              isCurrent && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent animate-pulse',
              visibility === 'adjacent' && 'opacity-30',
              visibility === 'visited' && 'opacity-100',
              isConnected && !isCurrent && 'ring-1 ring-white/30'
            )}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: size,
              height: size,
              backgroundColor: visibility === 'adjacent' ? '#4b5563' : color,
              boxShadow: isCurrent ? `0 0 8px ${color}` : undefined,
            }}
            title={visibility === 'adjacent' ? '???' : zone.name}
          />
        )
      })}

      {/* Current zone label */}
      {currentZone && POSITIONS[currentZoneId] && (
        <div
          className="absolute text-[9px] font-pixel text-yellow-400 whitespace-nowrap transform -translate-x-1/2 pointer-events-none"
          style={{
            left: `${POSITIONS[currentZoneId].x}%`,
            top: `${POSITIONS[currentZoneId].y + 10}%`,
          }}
        >
          {currentZone.name.length > 12 ? currentZone.name.slice(0, 10) + '...' : currentZone.name}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-1 right-1 flex gap-2 text-[8px] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Town
        </span>
        <span className="flex items-center gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Route
        </span>
      </div>
    </div>
  )
}
