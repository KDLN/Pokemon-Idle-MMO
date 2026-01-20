/**
 * Type definitions for Interactive Map components
 * Phase 13: Map Overhaul
 */

/**
 * Zone visibility state for fog of war
 * - 'visited': Player has been to this zone, fully visible
 * - 'adjacent': Connected to a visited zone, shows as "?" marker
 * - 'hidden': Not discovered yet, not rendered
 */
export type ZoneVisibility = 'visited' | 'adjacent' | 'hidden'

/**
 * Position of a zone on the map canvas
 */
export interface ZonePosition {
  id: number
  x: number
  y: number
}

/**
 * Direction vectors for calculating zone positions from connections
 */
export const DIRECTION_VECTORS: Record<string, { dx: number; dy: number }> = {
  'N': { dx: 0, dy: -1 },
  'S': { dx: 0, dy: 1 },
  'E': { dx: 1, dy: 0 },
  'W': { dx: -1, dy: 0 },
  'NE': { dx: 1, dy: -1 },
  'SE': { dx: 1, dy: 1 },
  'SW': { dx: -1, dy: 1 },
  'NW': { dx: -1, dy: -1 },
}

/**
 * Extended zone information for rendering on the map
 */
export interface ZoneNodeData {
  id: number
  name: string
  zone_type: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
  min_level?: number
  max_level?: number
  position: ZonePosition
  visibility: ZoneVisibility
  isCurrent: boolean
  isConnected: boolean
}

/**
 * Connection between two zones with direction
 */
export interface ConnectionData {
  from_zone_id: number
  to_zone_id: number
  direction: string | null
  fromPosition: ZonePosition
  toPosition: ZonePosition
  isReachable: boolean
}

/**
 * Props for the main InteractiveMap component
 */
export interface MapProps {
  /** Current zone ID where the player is located */
  currentZoneId: number
  /** Set of zone IDs the player has visited */
  visitedZoneIds: Set<number>
  /** Callback when a zone is clicked */
  onZoneClick?: (zoneId: number) => void
  /** Callback when a connection path is clicked */
  onConnectionClick?: (fromZoneId: number, toZoneId: number) => void
  /** Optional className for the container */
  className?: string
}

/**
 * Props for MapCanvas (content layer)
 */
export interface MapCanvasProps {
  /** Width of the canvas in pixels */
  width?: number
  /** Height of the canvas in pixels */
  height?: number
  /** Children (zone nodes, connections) */
  children?: React.ReactNode
}

/**
 * Props for MapControls
 */
export interface MapControlsProps {
  /** Optional className for styling */
  className?: string
}
