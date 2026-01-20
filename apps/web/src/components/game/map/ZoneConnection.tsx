'use client'

import { memo } from 'react'
import type { ZonePosition } from './mapTypes'

/**
 * Props for ZoneConnection component
 */
export interface ZoneConnectionProps {
  /** Starting zone position */
  from: ZonePosition
  /** Destination zone position */
  to: ZonePosition
  /** Travel direction (N, S, E, W, etc.) */
  direction: string | null
  /** True if connected to the current zone */
  isActive: boolean
  /** True if the player can travel this path */
  isReachable: boolean
}

/**
 * ZoneConnection - SVG line with direction arrow between zones
 *
 * Renders a connection path between two zones with:
 * - Line connecting the zone centers
 * - Direction arrow at midpoint
 * - Active state styling for paths to current zone
 * - Muted styling for unreachable paths
 */
export const ZoneConnection = memo(function ZoneConnection({
  from,
  to,
  direction,
  isActive,
  isReachable,
}: ZoneConnectionProps) {
  // Calculate midpoint for arrow placement
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2

  // Calculate angle for arrow rotation (in degrees)
  // Arrow points from 'from' to 'to'
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)

  // Color based on active state
  const strokeColor = isActive
    ? 'var(--color-lb-accent, #60a5fa)' // lb-accent for active
    : 'var(--color-gray-500, #6b7280)'  // gray for inactive

  // Opacity based on reachability
  const opacity = isReachable ? 1 : 0.3

  // Stroke width based on active state
  const strokeWidth = isActive ? 3 : 2

  // Filter for glow effect on active paths
  const filterId = `glow-${from.id}-${to.id}`

  return (
    <g
      className="zone-connection transition-opacity duration-200"
      style={{ opacity }}
    >
      {/* Glow filter definition for active paths */}
      {isActive && (
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Connection line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isActive ? 'none' : '6 4'}
        filter={isActive ? `url(#${filterId})` : undefined}
        className="transition-all duration-200"
      />

      {/* Direction arrow at midpoint */}
      {direction && (
        <polygon
          points="-6,-4 6,0 -6,4"
          fill={strokeColor}
          transform={`translate(${midX}, ${midY}) rotate(${angle})`}
          filter={isActive ? `url(#${filterId})` : undefined}
          className="transition-all duration-200"
        />
      )}
    </g>
  )
})
