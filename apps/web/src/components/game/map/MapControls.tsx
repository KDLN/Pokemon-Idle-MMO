'use client'

import { useState, useEffect, useCallback } from 'react'
import { useControls, useTransformEffect } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/ui/cn'
import { isZoneInViewport, type TransformState } from './mapUtils'
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
 * - "Center on me" button (shows when current zone is off-screen)
 * - WCAG compliant 44x44px touch targets
 * - Pixel font styling matching game theme
 */
export function MapControls({
  className,
  currentZonePosition,
  containerRef,
}: MapControlsProps) {
  const { zoomIn, zoomOut, resetTransform, setTransform } = useControls()

  // Track transform state for visibility calculation
  const [transformState, setTransformState] = useState<TransformState>({
    scale: 1,
    positionX: 0,
    positionY: 0,
  })

  // Track viewport size
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // Update transform state on changes
  useTransformEffect(({ state }) => {
    setTransformState({
      scale: state.scale,
      positionX: state.positionX,
      positionY: state.positionY,
    })
  })

  // Track viewport size from container
  useEffect(() => {
    if (!containerRef?.current) return

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setViewportSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [containerRef])

  // Calculate if current zone is visible
  const isCurrentZoneVisible = currentZonePosition
    ? isZoneInViewport(currentZonePosition, transformState, viewportSize)
    : true // If no position, don't show button

  // Center on current zone
  const handleCenterOnMe = useCallback(() => {
    if (!currentZonePosition || viewportSize.width === 0) return

    // Calculate position to center the zone
    // setTransform uses position as offset from origin
    const targetX = viewportSize.width / 2 - currentZonePosition.x * transformState.scale
    const targetY = viewportSize.height / 2 - currentZonePosition.y * transformState.scale

    setTransform(targetX, targetY, transformState.scale, 300, 'easeOut')
  }, [currentZonePosition, viewportSize, transformState.scale, setTransform])

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

      {/* Center on me button - shows when current zone is off-screen */}
      {!isCurrentZoneVisible && currentZonePosition && (
        <button
          type="button"
          onClick={handleCenterOnMe}
          className={cn(
            buttonBaseClass,
            // More prominent styling with accent color
            'bg-[var(--lb-accent,#3b82f6)]',
            'border-[var(--lb-accent,#3b82f6)]',
            'text-white',
            'hover:bg-[var(--lb-accent-hover,#2563eb)]',
            'hover:border-[var(--lb-accent-hover,#2563eb)]',
            // Add margin top for visual separation
            'mt-2'
          )}
          aria-label="Center map on current location"
        >
          {/* Crosshairs/target icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
