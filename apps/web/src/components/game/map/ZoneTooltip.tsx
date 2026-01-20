'use client'

import { cn } from '@/lib/ui/cn'

interface ZoneTooltipProps {
  /** Zone name */
  name: string
  /** Zone type - affects badge color */
  zoneType: 'town' | 'route' | 'forest' | 'cave' | 'gym' | 'special'
  /** Minimum level for encounters (routes only) */
  minLevel?: number
  /** Maximum level for encounters (routes only) */
  maxLevel?: number
}

/**
 * ZoneTooltip - Styled content for zone hover tooltip
 *
 * Displays zone information in a styled tooltip:
 * - Zone name in pixel font, uppercase
 * - Type badge (amber for towns, green for routes)
 * - Level range for routes
 */
export function ZoneTooltip({
  name,
  zoneType,
  minLevel,
  maxLevel,
}: ZoneTooltipProps) {
  const isRoute = zoneType === 'route'
  const showLevelRange = isRoute && minLevel !== undefined && maxLevel !== undefined

  // Determine badge color based on zone type
  const getBadgeClasses = () => {
    switch (zoneType) {
      case 'town':
        return 'bg-amber-500/20 text-amber-400'
      case 'route':
        return 'bg-green-500/20 text-green-400'
      case 'forest':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'cave':
        return 'bg-stone-500/20 text-stone-400'
      case 'gym':
        return 'bg-red-500/20 text-red-400'
      case 'special':
        return 'bg-purple-500/20 text-purple-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-w-[120px] max-w-[200px] p-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] shadow-xl">
      {/* Zone Name */}
      <div className="font-pixel text-sm text-white uppercase tracking-wide">
        {name}
      </div>

      {/* Type badge and level range */}
      <div className="flex items-center gap-2 mt-2">
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
            getBadgeClasses()
          )}
        >
          {zoneType}
        </span>
        {showLevelRange && (
          <span className="text-xs text-[#a0a0c0]">
            Lv. {minLevel}-{maxLevel}
          </span>
        )}
      </div>
    </div>
  )
}
