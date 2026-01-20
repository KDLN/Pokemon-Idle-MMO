'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/ui/cn'

interface MapFrameProps {
  /** Map content to wrap */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Optional title (defaults to "MAP") */
  title?: string
}

/**
 * MapFrame - Pokemon-style decorative frame for the map
 *
 * Features:
 * - Gen 4-5 handheld aesthetic with rounded corners
 * - Double-border effect (inner/outer)
 * - Gradient background with depth shadows
 * - Optional header bar with title
 * - Corner pokeball decorations (subtle)
 */
export function MapFrame({
  children,
  className,
  title = 'MAP',
}: MapFrameProps) {
  return (
    <div className={cn('map-frame relative', className)}>
      {/* Header bar with title */}
      <div className="map-frame-header">
        <span className="map-frame-title">{title}</span>
        {/* Decorative dots in header */}
        <div className="map-frame-dots">
          <span className="map-frame-dot map-frame-dot-red" />
          <span className="map-frame-dot map-frame-dot-yellow" />
          <span className="map-frame-dot map-frame-dot-green" />
        </div>
      </div>

      {/* Content area with inner border */}
      <div className="map-frame-content">
        {children}
      </div>

      {/* Corner pokeball decorations */}
      <div className="map-frame-corner map-frame-corner-tl" aria-hidden="true">
        <PokeballCorner />
      </div>
      <div className="map-frame-corner map-frame-corner-br" aria-hidden="true">
        <PokeballCorner />
      </div>
    </div>
  )
}

/**
 * Small pokeball icon for corner decorations
 */
function PokeballCorner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 opacity-20"
      fill="currentColor"
    >
      {/* Top half - red */}
      <path
        d="M12 2C6.48 2 2 6.48 2 12h20c0-5.52-4.48-10-10-10z"
        className="text-red-500"
        fill="currentColor"
      />
      {/* Bottom half - white/light */}
      <path
        d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10H2z"
        className="text-gray-300"
        fill="currentColor"
      />
      {/* Center band */}
      <rect x="2" y="11" width="20" height="2" className="text-gray-600" fill="currentColor" />
      {/* Center circle */}
      <circle cx="12" cy="12" r="3" className="text-gray-400" fill="currentColor" />
      <circle cx="12" cy="12" r="2" className="text-white" fill="currentColor" />
    </svg>
  )
}
