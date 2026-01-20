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
  /** Whether this zone is directly connected to current zone */
  isConnected?: boolean
  /** Minimum level (for routes) */
  minLevel?: number
  /** Maximum level (for routes) */
  maxLevel?: number
  /** Click handler */
  onClick?: () => void
  /** Travel handler - called when user wants to travel to this zone */
  onTravel?: (zoneId: number) => void
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
  isConnected = false,
  minLevel,
  maxLevel,
  onClick,
  onTravel,
}: ZoneNodeProps) {
  // Hidden zones are not rendered
  if (visibility === 'hidden') return null

  const isUnknown = visibility === 'adjacent'
  const isTown = zoneType === 'town'
  // Can travel if: visited, not current zone, and connected to current zone
  const canTravel = visibility === 'visited' && !isCurrent && isConnected

  // Handle zone click for travel
  const handleClick = () => {
    // Call general onClick for any click
    onClick?.()

    // Only trigger travel if this is a valid travel target
    if (canTravel && onTravel) {
      onTravel(id)
    }
  }

  // Determine node color based on zone type
  const getZoneClasses = () => {
    if (isUnknown) {
      // Mystery zone: muted gray with subtle pulse animation
      return 'bg-gray-700/60 border border-gray-500/30'
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
      onClick={handleClick}
      disabled={isUnknown}
      aria-disabled={!canTravel && !isCurrent && visibility === 'visited'}
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
        // Connected zones: interactive cursor and scale effect
        canTravel && 'cursor-pointer hover:scale-110 active:scale-95',
        // Visited but not connected: show as visited but dimmed
        visibility === 'visited' && !isCurrent && !isConnected && 'opacity-60 cursor-default',
        // Disabled state for unknown zones with subtle pulse
        isUnknown && 'cursor-not-allowed animate-pulse',
        // Focus styling
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
        // Flexbox for centering content
        'flex items-center justify-center'
      )}
      style={{
        left: position.x,
        top: position.y,
        // Subtle animation duration for unknown zones
        ...(isUnknown && { animationDuration: '3s' }),
      }}
      aria-label={
        isUnknown
          ? 'Unknown area'
          : canTravel
            ? `Travel to ${name}`
            : isCurrent
              ? `${name} (current location)`
              : name
      }
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
    // Unknown zones show simple "Unknown area" tooltip
    return (
      <>
        <Tooltip
          content={
            <span className="text-gray-400 text-sm">Unknown area</span>
          }
          position="top"
          delay={300}
        >
          {nodeContent}
        </Tooltip>
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
