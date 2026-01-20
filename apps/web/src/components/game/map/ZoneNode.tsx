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
 * ZoneNode - Individual zone button on the map (Gen 4-5 style)
 *
 * Features:
 * - Absolute positioning at calculated (x, y)
 * - Color coding by zone type with gradient styling
 * - Current zone has yellow glow ring and animated player icon
 * - Hover shows tooltip with zone info
 * - Touch targets at least 44px
 * - Town names always visible as labels with pixel font
 * - Rounded corners (rounded-xl) for softer Gen 4-5 aesthetic
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

  // Get zone type CSS class for gradient styling
  const getZoneTypeClass = () => {
    if (isUnknown) return ''
    switch (zoneType) {
      case 'town':
        return 'zone-node-town'
      case 'route':
        return 'zone-node-route'
      case 'forest':
        return 'zone-node-forest'
      case 'cave':
        return 'zone-node-cave'
      default:
        return 'zone-node-route'
    }
  }

  // Node sizes: towns are larger than routes (increased for better visibility)
  const sizeClasses = isTown ? 'w-14 h-14' : 'w-11 h-11'

  const nodeContent = (
    <button
      onClick={handleClick}
      disabled={isUnknown}
      aria-disabled={!canTravel && !isCurrent && visibility === 'visited'}
      className={cn(
        'absolute transition-all duration-200',
        // Center the node on its position
        '-translate-x-1/2 -translate-y-1/2',
        // Size
        sizeClasses,
        // Rounder corners for Gen 4-5 aesthetic
        'rounded-xl',
        // Base polished styling (gradient overlay, shadows)
        !isUnknown && 'zone-node-polished',
        // Zone type gradient colors
        getZoneTypeClass(),
        // Unknown zone styling
        isUnknown && 'bg-gray-700/60 border border-gray-500/30 rounded-lg',
        // Current zone enhanced glow
        isCurrent && 'zone-node-current',
        // Connected zones: interactive cursor and scale effect
        canTravel && 'cursor-pointer hover:scale-110 hover:brightness-110 active:scale-95',
        // Visited but not connected: show as visited but dimmed
        visibility === 'visited' && !isCurrent && !isConnected && 'opacity-50 cursor-default',
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
        <span className="text-xl font-bold text-gray-300/80 drop-shadow-md">?</span>
      )}

      {/* Player icon for current zone - animated bounce */}
      {isCurrent && !isUnknown && (
        <span
          className="absolute inset-0 flex items-center justify-center player-marker-animated"
          aria-label="You are here"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 fill-white drop-shadow-lg"
            aria-hidden="true"
          >
            {/* Simple trainer/person silhouette */}
            <circle cx="12" cy="7" r="4" />
            <path d="M12 13c-4.5 0-7 2.5-7 5v2h14v-2c0-2.5-2.5-5-7-5z" />
          </svg>
        </span>
      )}
    </button>
  )

  // Town labels are always visible with pixel font styling
  const townLabel = isTown && !isUnknown && (
    <div
      className="absolute text-center pointer-events-none"
      style={{
        left: position.x,
        // Position label below the node (adjusted for larger node)
        top: position.y + 34,
        transform: 'translateX(-50%)',
      }}
    >
      <span className="zone-label">
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
