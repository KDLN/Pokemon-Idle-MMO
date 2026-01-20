'use client'

import { cn } from '@/lib/ui/cn'
import type { MapCanvasProps } from './mapTypes'

/**
 * MapCanvas - Content layer for zones and connections
 *
 * This is the zoomable/pannable content area inside the InteractiveMap.
 * It provides a fixed-dimension canvas with GPU-accelerated transforms.
 *
 * Features:
 * - Fixed base dimensions (800x600) for consistent layout
 * - Dark gradient background matching game theme
 * - will-change: transform for 60fps pan/zoom
 * - Placeholder content until zones are rendered
 */
export function MapCanvas({
  width = 800,
  height = 600,
  children,
}: MapCanvasProps) {
  return (
    <div
      className={cn(
        'relative',
        // GPU layer promotion for smooth transforms
        'will-change-transform',
        // Dark solid background (user decision from CONTEXT.md)
        'bg-gradient-to-b from-[#152020] via-[#101820] to-[#0a1015]'
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // Force GPU layer
        transform: 'translateZ(0)',
      }}
    >
      {/* Grid pattern overlay for visual interest */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content layer for zones and connections */}
      {children || (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-pixel text-xs text-[var(--color-text-muted,#606080)] opacity-50">
            Map loading...
          </span>
        </div>
      )}
    </div>
  )
}
