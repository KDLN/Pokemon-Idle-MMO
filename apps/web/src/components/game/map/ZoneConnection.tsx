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
 * ZoneConnection - SVG line with direction arrow between zones (Gen 4-5 style)
 *
 * Renders a connection path between two zones with:
 * - Soft road-like appearance with rounded linecaps
 * - Thicker lines for better visibility
 * - Direction arrow at midpoint (larger, more stylized)
 * - Active state with glow effect
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

  // Color based on active state - warmer tones for Gen 4-5 feel
  const strokeColor = isActive
    ? '#60a5fa' // Bright blue for active paths
    : '#4b5563' // Softer gray for inactive

  // Road-like darker outline color
  const outlineColor = isActive
    ? '#1e40af' // Dark blue outline
    : '#1f2937' // Dark gray outline

  // Opacity based on reachability
  const opacity = isReachable ? 1 : 0.25

  // Stroke width based on active state (thicker for road-like feel)
  const strokeWidth = isActive ? 5 : 4
  const outlineWidth = strokeWidth + 2

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
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
          strokeWidth={24}
          strokeLinecap="round"
          className="cursor-pointer"
        />
      )}

      {/* Road outline (darker border for depth) */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={outlineColor}
        strokeWidth={outlineWidth}
        strokeLinecap="round"
        strokeDasharray={isActive ? 'none' : '8 6'}
        className="transition-all duration-200"
        style={{ pointerEvents: 'none' }}
      />

      {/* Main road/path line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isActive ? 'none' : '8 6'}
        filter={isActive ? `url(#${filterId})` : undefined}
        className={`transition-all duration-200 ${isClickable ? 'group-hover:stroke-[6px]' : ''}`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Direction arrow at midpoint - larger and more stylized */}
      {direction && (
        <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
          {/* Arrow shadow/outline for depth */}
          <polygon
            points="-8,-5 8,0 -8,5"
            fill={outlineColor}
            transform="translate(0.5, 0.5)"
            className="transition-all duration-200"
            style={{ pointerEvents: 'none' }}
          />
          {/* Main arrow */}
          <polygon
            points="-8,-5 8,0 -8,5"
            fill={strokeColor}
            filter={isActive ? `url(#${filterId})` : undefined}
            className="transition-all duration-200"
            style={{ pointerEvents: 'none' }}
          />
        </g>
      )}
    </g>
  )
})
