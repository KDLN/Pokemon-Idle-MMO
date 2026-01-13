'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Spritesheet, { type SpritesheetInstance } from 'react-responsive-spritesheet'
import type { SpriteDirection } from '@/lib/sprites/spriteAnimation'
import { DIRECTION_ROW, TRAINER_SPRITE } from '@/lib/sprites/spriteAnimation'

interface SpriteAnimatorProps {
  // Sprite sheet image URL
  image: string
  // Frame dimensions
  frameWidth: number
  frameHeight: number
  // Total steps/frames in the animation
  steps: number
  // Frames per second
  fps: number
  // Whether to loop the animation
  loop?: boolean
  // Whether to autoplay
  autoplay?: boolean
  // Animation direction
  direction?: 'forward' | 'rewind'
  // Render scale
  scale?: number
  // CSS class for styling
  className?: string
  // Callback when animation ends (if not looping)
  onEnd?: () => void
  // Callback when animation loops
  onLoop?: () => void
  // Control playback externally
  isPlaying?: boolean
  // Current frame to display (for manual control)
  frame?: number
  // Background position Y offset for multi-row sheets
  backgroundOffsetY?: number
}

/**
 * SpriteAnimator Component
 *
 * A wrapper around react-responsive-spritesheet that provides
 * a simpler API for game sprite animations.
 */
export function SpriteAnimator({
  image,
  frameWidth,
  frameHeight,
  steps,
  fps,
  loop = true,
  autoplay = true,
  direction = 'forward',
  scale = 1,
  className = '',
  onEnd,
  onLoop,
  isPlaying = true,
  frame,
  backgroundOffsetY = 0,
}: SpriteAnimatorProps) {
  const spritesheetRef = useRef<SpritesheetInstance | null>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Handle external play/pause control
  useEffect(() => {
    if (!spritesheetRef.current) return

    if (isPlaying) {
      spritesheetRef.current.play()
    } else {
      spritesheetRef.current.pause()
    }
  }, [isPlaying])

  // Handle external frame control
  useEffect(() => {
    if (!spritesheetRef.current || frame === undefined) return

    spritesheetRef.current.goToAndPause(frame)
  }, [frame])

  const handleInstance = useCallback((spritesheet: SpritesheetInstance) => {
    spritesheetRef.current = spritesheet
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoaded(false)
  }, [])

  // Calculate rendered dimensions
  const width = frameWidth * scale
  const height = frameHeight * scale

  // Show placeholder on error
  if (hasError) {
    return (
      <div
        className={`bg-gray-700 border border-gray-600 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">No sprite</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Spritesheet
        image={image}
        widthFrame={frameWidth}
        heightFrame={frameHeight}
        steps={steps}
        fps={fps}
        loop={loop}
        autoplay={autoplay}
        direction={direction}
        getInstance={handleInstance}
        onLoopComplete={onLoop}
        onEnterFrame={undefined}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width,
          height,
          backgroundPositionY: -backgroundOffsetY * scale,
        }}
      />
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-800 animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  )
}

interface DirectionalSpriteProps {
  // Sprite sheet image URL (must contain all 4 directions)
  image: string
  // Current facing direction
  direction: SpriteDirection
  // Whether the sprite is animating (walking)
  isAnimating?: boolean
  // Render scale
  scale?: number
  // CSS class
  className?: string
  // Optional: use custom frame dimensions
  frameWidth?: number
  frameHeight?: number
  // Optional: frames per direction
  framesPerDirection?: number
  // FPS when animating
  animatingFps?: number
  // FPS when idle
  idleFps?: number
}

/**
 * DirectionalSprite Component
 *
 * Handles 4-direction sprite sheets commonly used for RPG characters.
 * Automatically selects the correct row based on facing direction.
 */
export function DirectionalSprite({
  image,
  direction,
  isAnimating = false,
  scale = 2,
  className = '',
  frameWidth = TRAINER_SPRITE.frameWidth,
  frameHeight = TRAINER_SPRITE.frameHeight,
  framesPerDirection = TRAINER_SPRITE.framesPerDirection,
  animatingFps = TRAINER_SPRITE.walkFps,
  idleFps = TRAINER_SPRITE.idleFps,
}: DirectionalSpriteProps) {
  // Calculate which row to display based on direction
  const directionRow = DIRECTION_ROW[direction]
  const backgroundOffsetY = directionRow * frameHeight

  // When not animating, show idle (first frame or idle animation)
  const fps = isAnimating ? animatingFps : idleFps
  const steps = isAnimating ? framesPerDirection : 2 // Idle usually has 2 frames

  return (
    <SpriteAnimator
      image={image}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      steps={steps}
      fps={fps}
      loop
      autoplay
      scale={scale}
      className={className}
      backgroundOffsetY={backgroundOffsetY}
      isPlaying={isAnimating || fps > 0}
    />
  )
}

interface PokemonSpriteProps {
  // Pokemon species ID (1-905+)
  speciesId: number
  // Type of sprite
  variant: 'overworld' | 'battle-front' | 'battle-back' | 'icon'
  // Direction for overworld sprites
  direction?: SpriteDirection
  // Whether the sprite is animated
  isAnimating?: boolean
  // Render scale
  scale?: number
  // CSS class
  className?: string
  // Shiny variant
  shiny?: boolean
}

/**
 * PokemonSprite Component
 *
 * Renders Pokemon sprites with proper animation support.
 */
export function PokemonSprite({
  speciesId,
  variant,
  direction = 'down',
  isAnimating = false,
  scale = 2,
  className = '',
  shiny = false,
}: PokemonSpriteProps) {
  // Build the sprite URL based on variant
  const paddedId = speciesId.toString().padStart(3, '0')
  const shinyPath = shiny ? '/shiny' : ''

  let image: string
  let frameWidth: number
  let frameHeight: number
  let steps: number

  switch (variant) {
    case 'overworld':
      image = `/sprites/pokemon${shinyPath}/overworld/${paddedId}.png`
      frameWidth = 32
      frameHeight = 32
      steps = 4
      break
    case 'battle-front':
      image = `/sprites/pokemon${shinyPath}/battle/front/${paddedId}.png`
      frameWidth = 96
      frameHeight = 96
      steps = 1
      break
    case 'battle-back':
      image = `/sprites/pokemon${shinyPath}/battle/back/${paddedId}.png`
      frameWidth = 96
      frameHeight = 96
      steps = 1
      break
    case 'icon':
      image = `/sprites/pokemon/icons/${paddedId}.png`
      frameWidth = 40
      frameHeight = 30
      steps = 2 // Icons typically have 2 frames
      break
    default:
      image = `/sprites/pokemon/overworld/${paddedId}.png`
      frameWidth = 32
      frameHeight = 32
      steps = 4
  }

  // For overworld sprites, use directional animation
  if (variant === 'overworld') {
    return (
      <DirectionalSprite
        image={image}
        direction={direction}
        isAnimating={isAnimating}
        scale={scale}
        className={className}
        frameWidth={frameWidth}
        frameHeight={frameHeight}
        framesPerDirection={steps}
      />
    )
  }

  // For battle/icon sprites, simple animation
  return (
    <SpriteAnimator
      image={image}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      steps={steps}
      fps={isAnimating ? 4 : 2}
      loop
      autoplay
      scale={scale}
      className={className}
    />
  )
}

export default SpriteAnimator
