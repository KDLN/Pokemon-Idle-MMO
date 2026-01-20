/**
 * Map utility functions for position calculation
 * Phase 13: Map Overhaul - Plan 02
 */

import type { Zone } from '@/types/game'
import { DIRECTION_VECTORS, type ZonePosition } from './mapTypes'

/** Spacing between zones in pixels */
export const ZONE_SPACING = 100

/** Default center position for the starting zone */
const CENTER_X = 400
const CENTER_Y = 300

/**
 * Zone connection data with direction information
 */
export interface ZoneConnection {
  from_zone_id: number
  to_zone_id: number
  direction: string | null
}

/**
 * Canvas bounds calculated from zone positions
 */
export interface CanvasBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}

/**
 * Calculate zone positions from the direction graph using BFS traversal.
 * Starting zone is placed at center, and connected zones are positioned
 * based on their direction vectors.
 *
 * @param zones - Array of all zones
 * @param connections - Array of zone connections with direction data
 * @param startZoneId - ID of the starting zone (placed at center)
 * @returns Map of zone ID to calculated position
 */
export function calculateZonePositions(
  zones: Zone[],
  connections: ZoneConnection[],
  startZoneId: number
): Map<number, ZonePosition> {
  const positions = new Map<number, ZonePosition>()
  const visited = new Set<number>()

  // Check if start zone exists
  const startZone = zones.find(z => z.id === startZoneId)
  if (!startZone) {
    // If no start zone, place all zones in a simple grid
    zones.forEach((zone, index) => {
      const col = index % 5
      const row = Math.floor(index / 5)
      positions.set(zone.id, {
        id: zone.id,
        x: CENTER_X + (col - 2) * ZONE_SPACING,
        y: CENTER_Y + row * ZONE_SPACING,
      })
    })
    return positions
  }

  // Place start zone at center
  positions.set(startZoneId, {
    id: startZoneId,
    x: CENTER_X,
    y: CENTER_Y,
  })
  visited.add(startZoneId)

  // BFS to calculate positions based on directions
  const queue: number[] = [startZoneId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentPos = positions.get(currentId)!

    // Find connections FROM current zone (direction is from perspective of current zone)
    const outgoing = connections.filter(c => c.from_zone_id === currentId)

    for (const conn of outgoing) {
      if (visited.has(conn.to_zone_id)) continue

      // Get direction vector (default to South if no direction specified)
      const direction = conn.direction || 'S'
      const vector = DIRECTION_VECTORS[direction] || { dx: 0, dy: 1 }

      positions.set(conn.to_zone_id, {
        id: conn.to_zone_id,
        x: currentPos.x + vector.dx * ZONE_SPACING,
        y: currentPos.y + vector.dy * ZONE_SPACING,
      })
      visited.add(conn.to_zone_id)
      queue.push(conn.to_zone_id)
    }

    // Also check connections TO current zone (reverse direction)
    const incoming = connections.filter(c => c.to_zone_id === currentId)

    for (const conn of incoming) {
      if (visited.has(conn.from_zone_id)) continue

      // Reverse the direction (if they connect TO us with 'N', they're south of us)
      const direction = conn.direction || 'S'
      const vector = DIRECTION_VECTORS[direction] || { dx: 0, dy: 1 }

      // Reverse the vector
      positions.set(conn.from_zone_id, {
        id: conn.from_zone_id,
        x: currentPos.x - vector.dx * ZONE_SPACING,
        y: currentPos.y - vector.dy * ZONE_SPACING,
      })
      visited.add(conn.from_zone_id)
      queue.push(conn.from_zone_id)
    }
  }

  // Handle any disconnected zones (place them below the map)
  let disconnectedIndex = 0
  for (const zone of zones) {
    if (!positions.has(zone.id)) {
      const col = disconnectedIndex % 5
      const row = Math.floor(disconnectedIndex / 5)
      positions.set(zone.id, {
        id: zone.id,
        x: CENTER_X + (col - 2) * ZONE_SPACING,
        y: CENTER_Y + 300 + row * ZONE_SPACING,
      })
      disconnectedIndex++
    }
  }

  return positions
}

/**
 * Calculate the bounding box of all zone positions.
 * Used to determine canvas size and centering.
 *
 * @param positions - Map of zone ID to position
 * @param padding - Padding to add around the bounds (default 100px)
 * @returns Bounding box with min/max coordinates and dimensions
 */
export function getCanvasBounds(
  positions: Map<number, ZonePosition>,
  padding = 100
): CanvasBounds {
  if (positions.size === 0) {
    return {
      minX: 0,
      maxX: 800,
      minY: 0,
      maxY: 600,
      width: 800,
      height: 600,
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x)
    maxX = Math.max(maxX, pos.x)
    minY = Math.min(minY, pos.y)
    maxY = Math.max(maxY, pos.y)
  }

  // Add padding
  minX -= padding
  maxX += padding
  minY -= padding
  maxY += padding

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Transform state from react-zoom-pan-pinch
 */
export interface TransformState {
  scale: number
  positionX: number
  positionY: number
}

/**
 * Viewport dimensions
 */
export interface ViewportSize {
  width: number
  height: number
}

/**
 * Check if a zone position is visible within the current viewport.
 * Used to determine when to show the "Center on me" button.
 *
 * @param zonePosition - The zone's position in canvas coordinates
 * @param transformState - Current transform state (scale, positionX, positionY)
 * @param viewportSize - Viewport dimensions (width, height)
 * @param margin - Buffer around viewport edges (default 50px)
 * @returns true if zone is visible in viewport, false if scrolled out of view
 */
export function isZoneInViewport(
  zonePosition: { x: number; y: number },
  transformState: TransformState,
  viewportSize: ViewportSize,
  margin = 50
): boolean {
  const { scale, positionX, positionY } = transformState
  const { width, height } = viewportSize

  // Calculate the zone's position in screen coordinates
  // The transform applies as: screenPos = zonePos * scale + position
  const transformedX = zonePosition.x * scale + positionX
  const transformedY = zonePosition.y * scale + positionY

  // Check if within viewport bounds (with margin buffer)
  const inHorizontalBounds =
    transformedX >= -margin && transformedX <= width + margin
  const inVerticalBounds =
    transformedY >= -margin && transformedY <= height + margin

  return inHorizontalBounds && inVerticalBounds
}

// Re-export DIRECTION_VECTORS for convenience
export { DIRECTION_VECTORS } from './mapTypes'

/**
 * Zone visibility type for fog of war
 */
export type { ZoneVisibility } from './mapTypes'

/**
 * Get all zone IDs adjacent to a given zone
 *
 * @param zoneId - Zone ID to find neighbors for
 * @param connections - Array of zone connections
 * @returns Array of adjacent zone IDs
 */
export function getAdjacentZones(
  zoneId: number,
  connections: ZoneConnection[]
): number[] {
  const adjacent: number[] = []

  for (const conn of connections) {
    if (conn.from_zone_id === zoneId) {
      adjacent.push(conn.to_zone_id)
    } else if (conn.to_zone_id === zoneId) {
      adjacent.push(conn.from_zone_id)
    }
  }

  return adjacent
}

/**
 * Calculate the visibility state for a zone based on visited zones.
 *
 * Visibility rules:
 * - 'visited': Zone has been visited by the player
 * - 'adjacent': Zone is connected to a visited zone (mystery marker)
 * - 'hidden': Zone is not discovered (neither visited nor adjacent to visited)
 *
 * @param zoneId - Zone ID to check visibility for
 * @param visitedZones - Array of visited zone IDs
 * @param connections - Array of zone connections
 * @returns ZoneVisibility state ('visited', 'adjacent', or 'hidden')
 */
export function getZoneVisibility(
  zoneId: number,
  visitedZones: number[],
  connections: ZoneConnection[]
): 'visited' | 'adjacent' | 'hidden' {
  // Create visited set for O(1) lookup
  const visitedSet = new Set(visitedZones)

  // If zone is visited, return 'visited'
  if (visitedSet.has(zoneId)) {
    return 'visited'
  }

  // Check if zone is adjacent to any visited zone
  // A zone is adjacent if it appears in a connection with any visited zone
  for (const conn of connections) {
    // Check if connection involves this zone
    if (conn.from_zone_id === zoneId) {
      if (visitedSet.has(conn.to_zone_id)) {
        return 'adjacent'
      }
    } else if (conn.to_zone_id === zoneId) {
      if (visitedSet.has(conn.from_zone_id)) {
        return 'adjacent'
      }
    }
  }

  // Not visited and not adjacent to any visited zone
  return 'hidden'
}

/**
 * Calculate visibility for all zones at once.
 * More efficient when calculating visibility for multiple zones.
 *
 * @param zoneIds - Array of all zone IDs
 * @param visitedZones - Array of visited zone IDs
 * @param connections - Array of zone connections
 * @returns Map of zone ID to visibility state
 */
export function getAllZoneVisibilities(
  zoneIds: number[],
  visitedZones: number[],
  connections: ZoneConnection[]
): Map<number, 'visited' | 'adjacent' | 'hidden'> {
  const visitedSet = new Set(visitedZones)
  const result = new Map<number, 'visited' | 'adjacent' | 'hidden'>()

  // Pre-compute set of all zones adjacent to any visited zone
  const adjacentToVisited = new Set<number>()
  for (const conn of connections) {
    if (visitedSet.has(conn.from_zone_id)) {
      adjacentToVisited.add(conn.to_zone_id)
    }
    if (visitedSet.has(conn.to_zone_id)) {
      adjacentToVisited.add(conn.from_zone_id)
    }
  }

  // Calculate visibility for each zone
  for (const zoneId of zoneIds) {
    if (visitedSet.has(zoneId)) {
      result.set(zoneId, 'visited')
    } else if (adjacentToVisited.has(zoneId)) {
      result.set(zoneId, 'adjacent')
    } else {
      result.set(zoneId, 'hidden')
    }
  }

  return result
}
