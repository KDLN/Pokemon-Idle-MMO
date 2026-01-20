'use client'

import { cn } from '@/lib/ui/cn'
import { Tooltip } from '@/components/ui/Tooltip'
import { ZoneTooltip } from './ZoneTooltip'
import type { ZoneVisibility } from './mapTypes'

interface ZoneNodeProps {
  /** Zone ID */
  id: number
  /** Zone name */
  name: string
  /** Zone type - affects color and badge */
  zoneType: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
  /** Position on canvas */
  position: { x: number; y: number }
  /** Whether this is the player's current zone */
  isCurrent: boolean
  /** Visibility state for fog of war */
  visibility: ZoneVisibility
  /** Minimum level (for routes) */
  minLevel?: number
  /** Maximum level (for routes) */
  maxLevel?: number
  /** Click handler */
  onClick?: () => void
}

/**
 * ZoneNode - Individual zone button on the map
 *
 * Features:
 * - Absolute positioning at calculated (x, y)
 * - Color coding by zone type (amber = town, green = route)
 * - Current zone has yellow ring and player icon
 * - Hover shows tooltip with zone info
 * - Touch targets at least 44px
 * - Town names always visible as labels
 */
export function ZoneNode({
  id,
  name,
  zoneType,
  position,
  isCurrent,
  visibility,
  minLevel,
  maxLevel,
  onClick,
}: ZoneNodeProps) {
  // Hidden zones are not rendered
  if (visibility === 'hidden') return null

  const isUnknown = visibility === 'adjacent'
  const isTown = zoneType === 'town'

  // Determine node color based on zone type
  const getZoneClasses = () => {
    if (isUnknown) {
      return 'bg-gray-600/50 hover:bg-gray-500/50'
    }
    switch (zoneType) {
      case 'town':
        return 'bg-amber-500/80 hover:bg-amber-400'
      case 'route':
        return 'bg-green-500/80 hover:bg-green-400'
      case 'forest':
        return 'bg-emerald-600/80 hover:bg-emerald-500'
      case 'cave':
        return 'bg-stone-600/80 hover:bg-stone-500'
      case 'gym':
        return 'bg-red-500/80 hover:bg-red-400'
      case 'special':
        return 'bg-purple-500/80 hover:bg-purple-400'
      default:
        return 'bg-gray-500/80 hover:bg-gray-400'
    }
  }

  // Node sizes: towns are larger than routes
  const sizeClasses = isTown ? 'w-12 h-12' : 'w-10 h-10'

  const nodeContent = (
    <button
      onClick={onClick}
      disabled={isUnknown}
      className={cn(
        'absolute rounded-lg transition-all duration-200',
        // Center the node on its position
        '-translate-x-1/2 -translate-y-1/2',
        // Size
        sizeClasses,
        // Colors
        getZoneClasses(),
        // Current zone indicator
        isCurrent && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#101820]',
        // Hover effect
        'hover:scale-110',
        // Disabled state for unknown zones
        isUnknown && 'cursor-not-allowed',
        // Focus styling
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      aria-label={isUnknown ? 'Unknown zone' : name}
    >
      {/* Touch target expansion (WCAG compliance) */}
      <span
        className="absolute inset-0 -m-1"
        aria-hidden="true"
        style={{ minWidth: '44px', minHeight: '44px' }}
      />

      {/* Unknown zone marker */}
      {isUnknown && (
        <span className="text-lg font-bold text-gray-300">?</span>
      )}

      {/* Player icon for current zone */}
      {isCurrent && !isUnknown && (
        <span
          className="absolute inset-0 flex items-center justify-center text-lg"
          aria-label="You are here"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-white drop-shadow-md"
            aria-hidden="true"
          >
            {/* Simple trainer/person silhouette */}
            <circle cx="12" cy="8" r="4" />
            <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" />
          </svg>
        </span>
      )}
    </button>
  )

  // Town labels are always visible, route labels only on hover (via tooltip)
  const townLabel = isTown && !isUnknown && (
    <div
      className="absolute text-center pointer-events-none"
      style={{
        left: position.x,
        // Position label below the node
        top: position.y + 30,
        transform: 'translateX(-50%)',
      }}
    >
      <span className="font-pixel text-[10px] text-white/80 uppercase tracking-wide whitespace-nowrap drop-shadow-md">
        {name}
      </span>
    </div>
  )

  // Wrap in tooltip for zone info on hover
  if (isUnknown) {
    // Unknown zones don't show detailed tooltip
    return (
      <>
        {nodeContent}
        {townLabel}
      </>
    )
  }

  return (
    <>
      <Tooltip
        content={
          <ZoneTooltip
            name={name}
            zoneType={zoneType}
            minLevel={minLevel}
            maxLevel={maxLevel}
          />
        }
        position="top"
        delay={150}
      >
        {nodeContent}
      </Tooltip>
      {townLabel}
    </>
  )
}
