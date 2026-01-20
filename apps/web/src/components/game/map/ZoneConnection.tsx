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
  /** Target zone ID to travel to when clicked (only set for active paths) */
  targetZoneId?: number
  /** Click handler for travel */
  onClick?: (targetZoneId: number) => void
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
  targetZoneId,
  onClick,
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

  // Can click if active and has a target zone
  const isClickable = isActive && targetZoneId !== undefined && onClick

  // Handle path click for travel
  const handleClick = () => {
    if (isClickable && targetZoneId !== undefined) {
      onClick(targetZoneId)
    }
  }

  return (
    <g
      className={`zone-connection transition-opacity duration-200 ${isClickable ? 'cursor-pointer' : ''}`}
      style={{ opacity }}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
      aria-label={isClickable ? `Travel along path` : undefined}
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

      {/* Invisible wider line for easier clicking (hit area) */}
      {isClickable && (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="transparent"
          strokeWidth={20}
          strokeLinecap="round"
          className="cursor-pointer"
        />
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
        className={`transition-all duration-200 ${isClickable ? 'group-hover:stroke-[4px]' : ''}`}
        style={isClickable ? { pointerEvents: 'none' } : undefined}
      />

      {/* Direction arrow at midpoint */}
      {direction && (
        <polygon
          points="-6,-4 6,0 -6,4"
          fill={strokeColor}
          transform={`translate(${midX}, ${midY}) rotate(${angle})`}
          filter={isActive ? `url(#${filterId})` : undefined}
          className="transition-all duration-200"
          style={isClickable ? { pointerEvents: 'none' } : undefined}
        />
      )}
    </g>
  )
})
