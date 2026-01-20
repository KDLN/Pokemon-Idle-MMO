'use client'

import { useRef, useEffect, useMemo, useCallback } from 'react'
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchContentRef,
} from 'react-zoom-pan-pinch'
import { cn } from '@/lib/ui/cn'
import { MapCanvas, MOCK_POSITIONS, MOCK_CURRENT_ZONE_ID } from './MapCanvas'
import { MapControls } from './MapControls'
import type { MapProps, ZonePosition } from './mapTypes'

// Canvas dimensions (should match MapCanvas defaults)
const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 650

/**
 * InteractiveMap - Main container with pan/zoom functionality
 *
 * Uses react-zoom-pan-pinch for smooth gesture handling:
 * - Mouse drag to pan
 * - Scroll wheel to zoom
 * - Pinch gesture on touch devices
 * - +/- buttons for manual zoom control
 *
 * Configuration:
 * - initialScale: 1 (100% zoom)
 * - minScale: 0.5 (50% - see whole map)
 * - maxScale: 2 (200% - detail view)
 * - centerOnInit: false (we handle initial centering on current zone)
 * - limitToBounds: false (allow panning beyond canvas)
 *
 * Centering:
 * - Map centers on current zone on initial load
 * - "Center on me" button appears when zone scrolls off-screen
 * - Automatic re-center on zone change (travel)
 */
export function InteractiveMap({
  currentZoneId: _currentZoneId,
  visitedZoneIds: _visitedZoneIds,
  onZoneClick: _onZoneClick,
  onConnectionClick: _onConnectionClick,
  className,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null)
  const previousZoneIdRef = useRef<number | null>(null)

  // Use mock current zone ID for now (will use prop when wired to game state)
  const currentZoneId = MOCK_CURRENT_ZONE_ID

  // Find current zone position from mock data
  const currentZonePosition = useMemo(() => {
    return MOCK_POSITIONS.find(pos => pos.id === currentZoneId) || null
  }, [currentZoneId])

  // Calculate initial position to center on current zone
  // We need to calculate this based on expected viewport size
  const getInitialPosition = useCallback(() => {
    if (!currentZonePosition) {
      return { x: 0, y: 0 }
    }

    // Estimate viewport size (aspect ratio 16:10, max height 400px)
    // We'll use the container ref if available, otherwise estimate
    const container = containerRef.current
    const viewportWidth = container?.clientWidth || 640
    const viewportHeight = container?.clientHeight || 400

    // Calculate position to center zone in viewport
    // Position is the offset applied to the canvas
    return {
      x: viewportWidth / 2 - currentZonePosition.x,
      y: viewportHeight / 2 - currentZonePosition.y,
    }
  }, [currentZonePosition])

  // Center on current zone when zone changes (travel)
  useEffect(() => {
    // Skip on initial render
    if (previousZoneIdRef.current === null) {
      previousZoneIdRef.current = currentZoneId
      return
    }

    // Check if zone actually changed
    if (previousZoneIdRef.current === currentZoneId) {
      return
    }

    previousZoneIdRef.current = currentZoneId

    // Re-center on new zone with animation
    if (transformRef.current && currentZonePosition) {
      const container = containerRef.current
      if (!container) return

      const viewportWidth = container.clientWidth
      const viewportHeight = container.clientHeight
      const scale = transformRef.current.instance.transformState.scale

      const targetX = viewportWidth / 2 - currentZonePosition.x * scale
      const targetY = viewportHeight / 2 - currentZonePosition.y * scale

      transformRef.current.setTransform(targetX, targetY, scale, 300, 'easeOut')
    }
  }, [currentZoneId, currentZonePosition])

  // Get initial position for centering on mount
  const initialPos = getInitialPosition()

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full',
        // Aspect ratio 16:10 with max height
        'aspect-[16/10] max-h-[400px]',
        // Container styling
        'overflow-hidden rounded-lg',
        // Pokemon-style decorative border
        'poke-border',
        className
      )}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={initialPos.x}
        initialPositionY={initialPos.y}
        minScale={0.5}
        maxScale={2}
        centerOnInit={false}
        limitToBounds={false}
        wheel={{
          step: 0.1,
          smoothStep: 0.01,
        }}
        pinch={{
          step: 5,
        }}
        panning={{
          velocityDisabled: false,
        }}
        doubleClick={{
          disabled: true,
        }}
      >
        {/* MapControls must be inside TransformWrapper to access useControls */}
        <MapControls
          currentZonePosition={currentZonePosition}
          containerRef={containerRef}
        />

        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
          }}
          contentStyle={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          <MapCanvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            {/* Zone nodes and connections are rendered inside MapCanvas */}
          </MapCanvas>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
