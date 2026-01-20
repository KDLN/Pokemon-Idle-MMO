'use client'

import { useMemo } from 'react'
import { ZoneConnection } from './ZoneConnection'
import type { ZonePosition } from './mapTypes'

/**
 * Raw connection data from database
 */
export interface RawConnectionData {
  from_zone_id: number
  to_zone_id: number
  direction: string | null
}

/**
 * Props for ConnectionLayer component
 */
export interface ConnectionLayerProps {
  /** All zone connections (bidirectional entries) */
  connections: RawConnectionData[]
  /** Map of zone ID to position coordinates */
  positions: Map<number, ZonePosition>
  /** Current zone ID where the player is located */
  currentZoneId: number
  /** Width of the SVG canvas */
  width?: number
  /** Height of the SVG canvas */
  height?: number
}

/**
 * ConnectionLayer - SVG container for all zone connection lines
 *
 * Features:
 * - Renders all zone connections as SVG paths
 * - Deduplicates bidirectional entries (renders each physical connection once)
 * - Highlights connections to the current zone
 * - Positioned absolute to overlay behind zone nodes
 * - pointer-events: none to allow clicks through to zones
 */
export function ConnectionLayer({
  connections,
  positions,
  currentZoneId,
  width = 800,
  height = 600,
}: ConnectionLayerProps) {
  // Deduplicate connections - each physical path appears twice (A->B and B->A)
  // Only render each unique pair once
  const uniqueConnections = useMemo(() => {
    const seen = new Set<string>()
    const result: RawConnectionData[] = []

    for (const conn of connections) {
      // Create normalized key (smaller id first)
      const key = `${Math.min(conn.from_zone_id, conn.to_zone_id)}-${Math.max(conn.from_zone_id, conn.to_zone_id)}`

      if (!seen.has(key)) {
        seen.add(key)
        result.push(conn)
      }
    }

    return result
  }, [connections])

  return (
    <svg
      className="absolute inset-0 z-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {uniqueConnections.map((conn) => {
        const fromPos = positions.get(conn.from_zone_id)
        const toPos = positions.get(conn.to_zone_id)

        // Skip if either position is missing
        if (!fromPos || !toPos) {
          return null
        }

        // Connection is active if either zone is the current zone
        const isActive =
          conn.from_zone_id === currentZoneId ||
          conn.to_zone_id === currentZoneId

        // For now, all visible connections are reachable
        const isReachable = true

        return (
          <ZoneConnection
            key={`${conn.from_zone_id}-${conn.to_zone_id}`}
            from={fromPos}
            to={toPos}
            direction={conn.direction}
            isActive={isActive}
            isReachable={isReachable}
          />
        )
      })}
    </svg>
  )
}
