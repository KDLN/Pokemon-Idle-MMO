'use client'

import { useControls } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/ui/cn'
import type { MapControlsProps } from './mapTypes'

/**
 * MapControls - Zoom control buttons for the interactive map
 *
 * Uses react-zoom-pan-pinch's useControls hook to access zoom functions.
 * Must be rendered inside a TransformWrapper component.
 *
 * Features:
 * - Zoom in (+) button
 * - Zoom out (-) button
 * - Reset view button
 * - WCAG compliant 44x44px touch targets
 * - Pixel font styling matching game theme
 */
export function MapControls({ className }: MapControlsProps) {
  const { zoomIn, zoomOut, resetTransform } = useControls()

  const buttonBaseClass = cn(
    // Size: 44x44px minimum for WCAG touch targets
    'w-11 h-11 min-w-[44px] min-h-[44px]',
    // Visual styling
    'flex items-center justify-center',
    'rounded-lg',
    'bg-[var(--color-surface-elevated,#1e1e32)]',
    'border border-[var(--color-border-subtle,#2a2a4a)]',
    // Text styling
    'font-pixel text-sm text-[var(--color-text-primary,#f0f0f0)]',
    // Transitions
    'transition-all duration-150',
    // Hover/active states
    'hover:bg-[var(--color-surface-hover,#2a2a4a)]',
    'hover:border-[var(--color-border-bright,#4a4a6a)]',
    'active:scale-95',
    // Focus visible
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--poke-yellow,#fbbf24)]'
  )

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-10',
        'flex flex-col gap-2',
        className
      )}
    >
      <button
        type="button"
        onClick={() => zoomIn()}
        className={buttonBaseClass}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className={buttonBaseClass}
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className={cn(buttonBaseClass, 'text-xs')}
        aria-label="Reset map view"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  )
}
