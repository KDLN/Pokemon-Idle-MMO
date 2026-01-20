/**
 * Interactive Map Components
 * Phase 13: Map Overhaul
 */

// Main component
export { InteractiveMap } from './InteractiveMap'

// Sub-components
export { MapCanvas } from './MapCanvas'
export { MapControls } from './MapControls'
export { ConnectionLayer } from './ConnectionLayer'
export { ZoneConnection } from './ZoneConnection'

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
