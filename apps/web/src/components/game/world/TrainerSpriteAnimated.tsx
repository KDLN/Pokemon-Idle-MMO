'use client'

import { useEffect, useState, useRef } from 'react'
import { TRAINER_SPRITE_16x32, type SpriteDirection } from '@/lib/sprites/spriteAnimation'

type AnimationState = 'idle' | 'walk' | 'run'

// Eris Esra sprite sheet row mapping (5 rows, no left - flip right instead)
// Row 0: Down, Row 1: Down-Right, Row 2: Right, Row 3: Up-Right, Row 4: Up
const SPRITE_ROW: Record<SpriteDirection, number> = {
  down: 0,
  left: 2,   // Use right row, will flip horizontally
  right: 2,
  up: 4,
}

interface TrainerSpriteAnimatedProps {
  /** Current facing direction (down, left, right, up) */
  direction?: SpriteDirection
  /** Current animation state */
  animation?: AnimationState
  /** Render scale (default 3 for 16x32 -> 48x96 display) */
  scale?: number
  /** CSS class */
  className?: string
}

/**
 * TrainerSpriteAnimated Component
 *
 * Renders an animated trainer using the Eris Esra 16x32 sprite sheets.
 * Uses CSS background-position for proper multi-row sprite sheet support.
 */
export function TrainerSpriteAnimated({
  direction = 'down',
  animation = 'idle',
  scale = 3,
  className = '',
}: TrainerSpriteAnimatedProps) {
  const [frame, setFrame] = useState(0)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  const { frameWidth, frameHeight, framesPerDirection, walkFps, runFps, idleFps, sheets } = TRAINER_SPRITE_16x32

  // Get the correct sprite sheet and FPS based on animation state
  const getConfig = () => {
    switch (animation) {
      case 'run':
        return { sheet: sheets.run, fps: runFps }
      case 'walk':
        return { sheet: sheets.walk, fps: walkFps }
      case 'idle':
      default:
        return { sheet: sheets.idle, fps: idleFps }
    }
  }

  const { sheet, fps } = getConfig()
  const frameDuration = 1000 / fps

  // Calculate row based on direction (use local SPRITE_ROW mapping)
  const row = SPRITE_ROW[direction]

  // Flip horizontally for left direction (sprite sheet only has right-facing)
  const shouldFlip = direction === 'left'

  // Animation loop
  useEffect(() => {
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
  }, [frameDuration, framesPerDirection])

  // Rendered dimensions
  const width = frameWidth * scale
  const height = frameHeight * scale

  // Sprite sheet dimensions: 4 frames wide, 5 rows tall (64x160)
  // Row layout: 0=down, 1=left, 2=right, 3=up, 4=extra/unused
  const sheetWidth = frameWidth * framesPerDirection  // 16 * 4 = 64
  const sheetHeight = frameHeight * 5                  // 32 * 5 = 160

  // Calculate background position (in original sprite sheet pixels, then CSS handles scaling)
  // X position: which frame in the row (0-3)
  // Y position: which row (direction: 0=down, 1=left, 2=right, 3=up)
  const bgX = frame * frameWidth
  const bgY = row * frameHeight

  return (
    <div
      className={`${className}`}
      style={{
        width,
        height,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `-${bgX * scale}px -${bgY * scale}px`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: shouldFlip ? 'scaleX(-1)' : undefined,
      }}
    />
  )
}

interface WalkingTrainerProps {
  /** Initial direction */
  direction?: SpriteDirection
  /** Whether the trainer is walking */
  isWalking?: boolean
  /** Whether the trainer is running */
  isRunning?: boolean
  /** Render scale */
  scale?: number
  /** CSS class */
  className?: string
  /** Enable automatic walk loop (back and forth) */
  enableWalkLoop?: boolean
  /** Position override (percentage 0-100) */
  position?: { x: number }
}

/**
 * WalkingTrainer Component
 *
 * A higher-level component that handles walking/running logic
 * with optional automatic back-and-forth movement.
 */
export function WalkingTrainer({
  direction: initialDirection = 'right',
  isWalking = false,
  isRunning = false,
  scale = 3,
  className = '',
  enableWalkLoop = false,
  position,
}: WalkingTrainerProps) {
  const [internalPosition, setInternalPosition] = useState(50)
  const [internalDirection, setInternalDirection] = useState<SpriteDirection>(initialDirection)

  // Determine animation state
  const animation: AnimationState = isRunning ? 'run' : isWalking ? 'walk' : 'idle'

  // Automatic walk loop
  useEffect(() => {
    if (!enableWalkLoop || (!isWalking && !isRunning)) return

    const speed = isRunning ? 0.8 : 0.4
    const interval = setInterval(() => {
      setInternalPosition((prev) => {
        const newPos = prev + (internalDirection === 'right' ? speed : -speed)

        // Bounce at edges
        if (newPos >= 85) {
          setInternalDirection('left')
          return 85
        } else if (newPos <= 15) {
          setInternalDirection('right')
          return 15
        }

        return newPos
      })
    }, 50)

    return () => clearInterval(interval)
  }, [enableWalkLoop, isWalking, isRunning, internalDirection])

  const currentPosition = position?.x ?? internalPosition
  const currentDirection = position ? initialDirection : internalDirection

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `translateX(${currentPosition}%)`,
        transition: 'transform 0.05s linear',
      }}
    >
      <TrainerSpriteAnimated
        direction={currentDirection}
        animation={animation}
        scale={scale}
      />
    </div>
  )
}

export default TrainerSpriteAnimated
