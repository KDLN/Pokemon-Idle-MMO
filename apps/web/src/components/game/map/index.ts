/**
 * Interactive Map Components
 * Phase 13: Map Overhaul
 */

// Main component
export { InteractiveMap } from './InteractiveMap'

// Sub-components
export { MapCanvas } from './MapCanvas'
export { MapControls } from './MapControls'
export { MapFrame } from './MapFrame'
export { ConnectionLayer } from './ConnectionLayer'
export { ZoneConnection } from './ZoneConnection'
export { ZoneNode } from './ZoneNode'
export { ZoneTooltip } from './ZoneTooltip'

// Types
export type {
  ZoneVisibility,
  ZonePosition,
  ZoneNodeData,
  ConnectionData,
  MapProps,
  MapCanvasProps,
  MapControlsProps,
} from './mapTypes'

export type { ZoneConnectionProps } from './ZoneConnection'
export type { ConnectionLayerProps, RawConnectionData } from './ConnectionLayer'

export { DIRECTION_VECTORS } from './mapTypes'

// Utilities
export { calculateZonePositions, getCanvasBounds, ZONE_SPACING } from './mapUtils'
export type { ZoneConnection as ZoneConnectionData, CanvasBounds } from './mapUtils'
