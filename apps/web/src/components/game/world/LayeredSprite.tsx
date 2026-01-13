'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  type SpriteLayer,
  type SpriteDirection,
  type AnimationState,
  type EquippedCosmetics,
  generateCharacterLayers,
  loadSpriteSheet,
  getFrameCoords,
  applyTint,
  SPRITE_WIDTH,
  SPRITE_HEIGHT,
  FRAME_DURATION,
  WALK_FRAMES,
  IDLE_FRAME,
} from '@/lib/sprites/layeredSprite'

interface LayeredSpriteProps {
  // Option 1: Provide layers directly
  layers?: SpriteLayer[]
  // Option 2: Provide cosmetics and auto-generate layers
  cosmetics?: EquippedCosmetics
  basePath?: string

  // Animation control
  direction?: SpriteDirection
  animation?: AnimationState
  isPlaying?: boolean
  frameRate?: number // ms per frame

  // Display options
  scale?: number
  className?: string

  // Position (for walking animation)
  x?: number
  y?: number

  // Callbacks
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function LayeredSprite({
  layers: providedLayers,
  cosmetics,
  basePath = '/sprites/character',
  direction = 'down',
  animation = 'idle',
  isPlaying = true,
  frameRate = FRAME_DURATION,
  scale = 2,
  className = '',
  x,
  y,
  onLoad,
  onError,
}: LayeredSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Generate layers from cosmetics if not provided directly
  const layers = useMemo(() => {
    if (providedLayers) return providedLayers
    if (cosmetics) return generateCharacterLayers(cosmetics, basePath)
    return []
  }, [providedLayers, cosmetics, basePath])

  // Canvas dimensions
  const canvasWidth = SPRITE_WIDTH * scale
  const canvasHeight = SPRITE_HEIGHT * scale

  // Load all sprite sheet images
  useEffect(() => {
    let cancelled = false

    async function loadImages() {
      setIsLoading(true)
      setError(null)

      const imageMap = new Map<string, HTMLImageElement>()

      try {
        await Promise.all(
          layers.map(async (layer) => {
            if (layer.visible === false) return

            try {
              const img = await loadSpriteSheet(layer.spriteSheet)
              if (!cancelled) {
                imageMap.set(layer.spriteSheet, img)
              }
            } catch (err) {
              // Layer failed to load - skip it but don't fail entirely
              console.warn(`Failed to load layer: ${layer.spriteSheet}`, err)
            }
          })
        )

        if (!cancelled) {
          setLoadedImages(imageMap)
          setIsLoading(false)
          onLoad?.()
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load sprites')
          setError(error)
          setIsLoading(false)
          onError?.(error)
        }
      }
    }

    loadImages()

    return () => {
      cancelled = true
    }
  }, [layers, onLoad, onError])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || animation === 'idle') {
      setCurrentFrame(IDLE_FRAME)
      return
    }

    const animate = (time: number) => {
      if (time - lastFrameTimeRef.current >= frameRate) {
        setCurrentFrame((prev) => {
          const frames = WALK_FRAMES
          const nextIndex = (frames.indexOf(prev) + 1) % frames.length
          return frames[nextIndex]
        })
        lastFrameTimeRef.current = time
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animation, frameRate])

  // Render layers to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || isLoading) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Enable pixelated rendering for crisp sprites
    ctx.imageSmoothingEnabled = false

    // Draw each layer in order
    for (const layer of layers) {
      if (layer.visible === false) continue

      const img = loadedImages.get(layer.spriteSheet)
      if (!img) continue

      // Get frame coordinates
      const { sx, sy, sw, sh } = getFrameCoords(
        direction,
        currentFrame,
        SPRITE_WIDTH,
        SPRITE_HEIGHT
      )

      // Calculate destination with offsets
      const dx = (layer.offsetX || 0) * scale
      const dy = (layer.offsetY || 0) * scale
      const dw = sw * scale
      const dh = sh * scale

      // Apply opacity if set
      const prevAlpha = ctx.globalAlpha
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity
      }

      // Draw with optional tinting
      if (layer.tintColor) {
        applyTint(
          ctx,
          img,
          sx, sy, sw, sh,
          dx, dy, dw, dh,
          layer.tintColor,
          layer.tintMode
        )
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
      }

      // Restore opacity
      ctx.globalAlpha = prevAlpha
    }
  }, [layers, loadedImages, direction, currentFrame, scale, canvasWidth, canvasHeight, isLoading])

  // Render on state changes
  useEffect(() => {
    render()
  }, [render])

  // Position style
  const positionStyle = x !== undefined && y !== undefined
    ? { transform: `translate(${x}px, ${y}px)` }
    : undefined

  if (error) {
    // Fallback display on error
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a2e]/50 rounded ${className}`}
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <span className="text-[10px] text-[#606080]">?</span>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`pixelated ${className}`}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        ...positionStyle,
      }}
      role="img"
      aria-label="Character sprite"
    />
  )
}

// Convenience wrapper for walking character with position control
interface WalkingCharacterProps extends Omit<LayeredSpriteProps, 'animation' | 'isPlaying'> {
  isWalking?: boolean
  walkSpeed?: number // pixels per second
  enableWalkLoop?: boolean
  walkBounds?: { minX: number; maxX: number }
}

export function WalkingCharacter({
  isWalking = false,
  walkSpeed = 50,
  enableWalkLoop = false,
  walkBounds = { minX: 20, maxX: 80 },
  direction: initialDirection = 'right',
  ...props
}: WalkingCharacterProps) {
  const [position, setPosition] = useState(50)
  const [direction, setDirection] = useState<SpriteDirection>(initialDirection)

  // Walk loop animation
  useEffect(() => {
    if (!enableWalkLoop || !isWalking) return

    const interval = setInterval(() => {
      setPosition((prev) => {
        const speed = (walkSpeed / 1000) * 50 // Convert to pixels per interval
        const newPos = prev + (direction === 'right' ? speed : -speed)

        // Bounce at boundaries
        if (newPos >= walkBounds.maxX) {
          setDirection('left')
          return walkBounds.maxX
        }
        if (newPos <= walkBounds.minX) {
          setDirection('right')
          return walkBounds.minX
        }

        return newPos
      })
    }, 50)

    return () => clearInterval(interval)
  }, [enableWalkLoop, isWalking, walkSpeed, walkBounds, direction])

  return (
    <div
      className="absolute bottom-8"
      style={{
        left: `${position}%`,
        transform: `translateX(-50%) scaleX(${direction === 'left' ? -1 : 1})`,
        transition: 'transform 0.05s linear',
      }}
    >
      <LayeredSprite
        {...props}
        direction={direction === 'left' ? 'right' : direction} // Flip handled by scaleX
        animation={isWalking ? 'walk' : 'idle'}
        isPlaying={isWalking}
      />
    </div>
  )
}

export default LayeredSprite
