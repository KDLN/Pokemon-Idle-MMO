'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { TrainerCustomization } from '@/lib/sprites/trainerCustomization'
import type { EventCosmetics } from './SpriteTrainer'
import { TRAINER_SPRITE, DIRECTION_ROW, type SpriteDirection } from '@/lib/sprites/spriteAnimation'
import {
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  DEFAULT_TRAINER_CUSTOMIZATION,
} from '@/lib/sprites/trainerCustomization'

interface TrainerSpriteSheetProps {
  // Sprite sheet image URLs for each layer
  spriteSheets?: {
    body?: string
    hair?: string
    outfitTop?: string
    outfitBottom?: string
    hat?: string
    accessory?: string
  }
  // Current facing direction
  direction?: SpriteDirection
  // Whether the trainer is walking
  isWalking?: boolean
  // Render scale
  scale?: number
  // Customization options
  customization?: TrainerCustomization
  // Event cosmetics
  eventCosmetics?: EventCosmetics
  // CSS class
  className?: string
  // Whether to use the fallback CSS renderer when no sprites available
  useFallback?: boolean
}

/**
 * TrainerSpriteSheet Component
 *
 * Renders a trainer character using layered sprite sheets.
 * Supports color tinting for customization and falls back to
 * CSS-based rendering when sprite assets are not available.
 */
export function TrainerSpriteSheet({
  spriteSheets,
  direction = 'down',
  isWalking = false,
  scale = 2,
  customization = DEFAULT_TRAINER_CUSTOMIZATION,
  eventCosmetics,
  className = '',
  useFallback = true,
}: TrainerSpriteSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({})
  const [spritesAvailable, setSpritesAvailable] = useState(false)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  // Get customization colors
  const colors = useMemo(() => ({
    skin: SKIN_TONES[customization.skinTone],
    hair: HAIR_COLORS[customization.hairColor],
    top: OUTFIT_COLORS[customization.topColor],
    bottom: OUTFIT_COLORS[customization.bottomColor],
    hat: OUTFIT_COLORS[customization.hatColor],
  }), [customization])

  // Frame dimensions
  const { frameWidth, frameHeight, framesPerDirection, walkFps } = TRAINER_SPRITE
  const width = frameWidth * scale
  const height = frameHeight * scale

  // Load sprite sheet images
  useEffect(() => {
    if (!spriteSheets) {
      setSpritesAvailable(false)
      return
    }

    const images: Record<string, HTMLImageElement> = {}
    const loadPromises: Promise<void>[] = []

    Object.entries(spriteSheets).forEach(([key, url]) => {
      if (!url) return

      const promise = new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          images[key] = img
          resolve()
        }
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${url}`)
          resolve()
        }
        img.src = url
      })

      loadPromises.push(promise)
    })

    Promise.all(loadPromises).then(() => {
      setLoadedImages(images)
      setSpritesAvailable(Object.keys(images).length > 0)
    })
  }, [spriteSheets])

  // Animation loop
  useEffect(() => {
    if (!isWalking) {
      setFrame(0)
      return
    }

    const frameDuration = 1000 / walkFps

    const animate = (time: number) => {
      if (time - lastFrameTimeRef.current >= frameDuration) {
        setFrame((prev) => (prev + 1) % framesPerDirection)
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
  }, [isWalking, walkFps, framesPerDirection])

  // Render sprite sheets to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !spritesAvailable) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Get source coordinates
    const row = DIRECTION_ROW[direction]
    const sx = frame * frameWidth
    const sy = row * frameHeight

    // Draw each layer in order
    const layers: Array<{ key: string; tint?: string }> = [
      { key: 'body', tint: colors.skin.base },
      { key: 'outfitBottom', tint: colors.bottom.base },
      { key: 'outfitTop', tint: colors.top.base },
      { key: 'hair', tint: colors.hair.base },
    ]

    // Add optional layers
    if (customization.hatStyle !== 'none') {
      layers.push({ key: 'hat', tint: colors.hat.base })
    }
    if (customization.accessory !== 'none') {
      layers.push({ key: 'accessory' })
    }

    layers.forEach(({ key, tint }) => {
      const img = loadedImages[key]
      if (!img) return

      if (tint) {
        // Draw with tint using temporary canvas
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = frameWidth
        tempCanvas.height = frameHeight
        const tempCtx = tempCanvas.getContext('2d')!

        // Draw the frame
        tempCtx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight)

        // Apply tint
        tempCtx.globalCompositeOperation = 'multiply'
        tempCtx.fillStyle = tint
        tempCtx.fillRect(0, 0, frameWidth, frameHeight)

        // Restore alpha
        tempCtx.globalCompositeOperation = 'destination-in'
        tempCtx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight)

        // Draw to main canvas
        ctx.drawImage(tempCanvas, 0, 0, frameWidth, frameHeight, 0, 0, width, height)
      } else {
        // Draw without tint
        ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, width, height)
      }
    })
  }, [
    frame,
    direction,
    loadedImages,
    spritesAvailable,
    colors,
    customization,
    width,
    height,
    frameWidth,
    frameHeight,
  ])

  // If no sprites available and fallback enabled, import and use CSS renderer
  if (!spritesAvailable && useFallback) {
    // Dynamic import would be better but for simplicity, we'll render a simple placeholder
    // The actual AnimatedTrainerSprite should be used as fallback
    return (
      <div
        className={`relative ${className}`}
        style={{ width, height }}
      >
        <FallbackTrainerSprite
          direction={direction}
          isWalking={isWalking}
          scale={scale}
          customization={customization}
          frame={frame}
        />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pixelated ${className}`}
      style={{
        imageRendering: 'pixelated',
        width,
        height,
      }}
    />
  )
}

/**
 * Fallback trainer sprite using CSS shapes
 * This is a simplified version for when no sprite sheets are available
 */
function FallbackTrainerSprite({
  direction,
  isWalking,
  scale,
  customization,
  frame,
}: {
  direction: SpriteDirection
  isWalking: boolean
  scale: number
  customization: TrainerCustomization
  frame: number
}) {
  const colors = useMemo(() => ({
    skin: SKIN_TONES[customization.skinTone],
    hair: HAIR_COLORS[customization.hairColor],
    top: OUTFIT_COLORS[customization.topColor],
    bottom: OUTFIT_COLORS[customization.bottomColor],
    hat: OUTFIT_COLORS[customization.hatColor],
  }), [customization])

  const s = (v: number) => v * scale
  const flipX = direction === 'left' ? -1 : 1

  // Simple walk cycle calculation
  const legRotation = isWalking ? Math.sin((frame / 4) * Math.PI * 2) * 18 : 0

  return (
    <div
      className="relative"
      style={{
        width: s(32),
        height: s(48),
        transform: `scaleX(${flipX})`,
      }}
    >
      {/* Shadow */}
      <div
        className="absolute rounded-full bg-black/25"
        style={{
          width: s(22),
          height: s(6),
          left: s(5),
          bottom: s(-2),
          filter: 'blur(2px)',
        }}
      />

      {/* Legs */}
      <div className="absolute" style={{ left: s(8), top: s(32), width: s(16), height: s(14) }}>
        <div
          className="absolute rounded-b"
          style={{
            width: s(6),
            height: s(14),
            left: 0,
            backgroundColor: colors.bottom.base,
            borderBottom: `${s(3)}px solid ${colors.bottom.shadow}`,
            transform: `rotate(${legRotation}deg)`,
            transformOrigin: 'top center',
          }}
        />
        <div
          className="absolute rounded-b"
          style={{
            width: s(6),
            height: s(14),
            right: 0,
            backgroundColor: colors.bottom.base,
            borderBottom: `${s(3)}px solid ${colors.bottom.shadow}`,
            transform: `rotate(${-legRotation}deg)`,
            transformOrigin: 'top center',
          }}
        />
      </div>

      {/* Body */}
      <div
        className="absolute rounded-t"
        style={{
          width: s(18),
          height: s(18),
          left: s(7),
          top: s(15),
          backgroundColor: colors.top.base,
          boxShadow: `inset 0 ${s(-4)}px ${colors.top.shadow}`,
        }}
      />

      {/* Arms */}
      <div
        className="absolute rounded"
        style={{
          width: s(4),
          height: s(12),
          left: s(4),
          top: s(16),
          backgroundColor: colors.top.shadow,
          transform: `rotate(${-legRotation * 0.7}deg)`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: s(4),
            height: s(4),
            left: 0,
            bottom: s(-1),
            backgroundColor: colors.skin.base,
          }}
        />
      </div>
      <div
        className="absolute rounded"
        style={{
          width: s(4),
          height: s(12),
          right: s(4),
          top: s(16),
          backgroundColor: colors.top.shadow,
          transform: `rotate(${legRotation * 0.7}deg)`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: s(4),
            height: s(4),
            left: 0,
            bottom: s(-1),
            backgroundColor: colors.skin.base,
          }}
        />
      </div>

      {/* Head */}
      <div
        className="absolute rounded-full"
        style={{
          width: s(16),
          height: s(16),
          left: s(8),
          top: s(1),
          backgroundColor: colors.skin.base,
          boxShadow: `inset 0 ${s(4)}px ${s(4)}px ${colors.skin.shadow}`,
        }}
      >
        {/* Eyes */}
        <div className="absolute flex gap-[4px]" style={{ top: s(6), left: s(3), width: s(10) }}>
          <div
            className="rounded-full bg-[#1a1a2e]"
            style={{ width: s(3), height: s(3) }}
          />
          <div className="flex-1" />
          <div
            className="rounded-full bg-[#1a1a2e]"
            style={{ width: s(3), height: s(3) }}
          />
        </div>
      </div>

      {/* Hair */}
      <div
        className="absolute rounded-t-full"
        style={{
          width: s(18),
          height: s(10),
          left: s(7),
          top: s(-1),
          backgroundColor: colors.hair.base,
          boxShadow: `inset 0 ${s(-3)}px ${colors.hair.shadow}`,
        }}
      />
    </div>
  )
}

export default TrainerSpriteSheet
