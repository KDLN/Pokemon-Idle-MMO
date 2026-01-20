'use client'

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/ui/cn'
import { MapCanvas } from './MapCanvas'
import { MapControls } from './MapControls'
import type { MapProps } from './mapTypes'

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
 * - centerOnInit: true (center content on load)
 * - limitToBounds: false (allow panning beyond canvas)
 */
export function InteractiveMap({
  currentZoneId: _currentZoneId,
  visitedZoneIds: _visitedZoneIds,
  onZoneClick: _onZoneClick,
  onConnectionClick: _onConnectionClick,
  className,
}: MapProps) {
  return (
    <div
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
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit={true}
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
        <MapControls />

        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
          }}
          contentStyle={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapCanvas>
            {/* Zone nodes and connections will be rendered here in future plans */}
          </MapCanvas>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
