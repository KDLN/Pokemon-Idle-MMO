'use client'

import { useEffect, useState, useRef } from 'react'
import { TRAINER_SPRITE_16x32, type SpriteDirection } from '@/lib/sprites/spriteAnimation'

// Event cosmetics for showing off special items
export interface EventCosmetics {
  effect?: 'aura_fire' | 'aura_ice' | 'sparkles' | 'shadow_trail' | 'lightning'
  pet?: 'pichu' | 'eevee' | 'ditto'
  heldItem?: 'pokeball' | 'greatball' | 'masterball' | 'fishing_rod'
}

interface SpriteTrainerProps {
  direction?: 'left' | 'right' | 'up' | 'down'
  isWalking?: boolean
  scale?: number
  eventCosmetics?: EventCosmetics
  className?: string
  position?: { x: number; y: number }
  enableWalkLoop?: boolean
}

// Sprite sheet row mapping (5 rows)
// Row 0: Down, Row 1: Down-Right, Row 2: Right, Row 3: Up-Right, Row 4: Up
const SPRITE_ROW: Record<SpriteDirection, number> = {
  down: 0,
  left: 2,   // Use right row, will flip horizontally
  right: 2,
  up: 4,
}

export function SpriteTrainer({
  direction = 'right',
  isWalking = false,
  scale = 3,
  eventCosmetics,
  className = '',
  position,
  enableWalkLoop = false,
}: SpriteTrainerProps) {
  const [frame, setFrame] = useState(0)
  const [internalPosition, setInternalPosition] = useState({ x: 50, y: 0 })
  const [internalDirection, setInternalDirection] = useState<'left' | 'right'>(direction === 'left' ? 'left' : 'right')
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  const { frameWidth, frameHeight, framesPerDirection, walkFps, idleFps, sheets } = TRAINER_SPRITE_16x32

  // Use external position if provided, otherwise internal
  const currentPosition = position ?? internalPosition
  const currentDirection = position ? direction : internalDirection

  // Animation timing
  const fps = isWalking ? walkFps : idleFps
  const frameDuration = 1000 / fps

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

  // Internal walk loop (if enableWalkLoop is true and no external position)
  useEffect(() => {
    if (!enableWalkLoop || position || !isWalking) return

    const walkInterval = setInterval(() => {
      setInternalPosition((prev) => {
        let newX = prev.x + (internalDirection === 'right' ? 0.4 : -0.4)

        // Bounce off edges and change direction
        if (newX > 80) {
          setInternalDirection('left')
          newX = 80
        } else if (newX < 20) {
          setInternalDirection('right')
          newX = 20
        }

        return { ...prev, x: newX }
      })
    }, 50)

    return () => clearInterval(walkInterval)
  }, [enableWalkLoop, position, isWalking, internalDirection])

  // Sprite sheet info
  const sheet = isWalking ? sheets.walk : sheets.idle
  const row = SPRITE_ROW[currentDirection]
  const shouldFlip = currentDirection === 'left'

  // Rendered dimensions
  const width = frameWidth * scale
  const height = frameHeight * scale

  // Sprite sheet dimensions: 4 frames wide, 5 rows tall
  const sheetWidth = frameWidth * framesPerDirection
  const sheetHeight = frameHeight * 5

  // Background position
  const bgX = frame * frameWidth
  const bgY = row * frameHeight

  // Position style - only apply flip for internal walk loop mode
  // When used externally (no enableWalkLoop), parent component handles positioning and flip
  const positionStyle = enableWalkLoop ? {
    left: 0,
    right: 0,
    transform: `translateX(${currentPosition.x}%) scaleX(${shouldFlip ? -1 : 1})`,
    transition: 'transform 0.05s linear',
  } : position ? {
    left: 0,
    right: 0,
    transform: `translateX(${currentPosition.x}%)`,
    transition: 'transform 0.05s linear',
  } : {}

  return (
    <div
      className={`${enableWalkLoop ? 'absolute bottom-8' : 'relative'} ${className}`}
      style={positionStyle}
      role="img"
      aria-label="Trainer character"
    >
      {/* Main sprite container */}
      <div className="relative" style={{ width, height }}>
        {/* Base sprite */}
        <div
          style={{
            width,
            height,
            backgroundImage: `url(${sheet})`,
            backgroundPosition: `-${bgX * scale}px -${bgY * scale}px`,
            backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />

        {/* Event Cosmetics - Effects (auras, particles) */}
        {eventCosmetics?.effect && (
          <AuraEffect
            type={eventCosmetics.effect}
            scale={scale}
            frame={frame}
            spriteWidth={width}
            spriteHeight={height}
          />
        )}

        {/* Event Cosmetics - Held Items */}
        {eventCosmetics?.heldItem && (
          <HeldItem
            type={eventCosmetics.heldItem}
            scale={scale}
            direction={currentDirection}
            spriteWidth={width}
            spriteHeight={height}
          />
        )}
      </div>

      {/* Event Cosmetics - Following Pet (rendered outside main sprite container) */}
      {eventCosmetics?.pet && (
        <PetCompanion
          type={eventCosmetics.pet}
          scale={scale * 0.7}
          isWalking={isWalking}
          frame={frame}
          direction={currentDirection}
          spriteWidth={width}
        />
      )}
    </div>
  )
}

// Aura/Effect Renderer Component
function AuraEffect({
  type,
  scale,
  frame,
  spriteWidth,
  spriteHeight,
}: {
  type: string
  scale: number
  frame: number
  spriteWidth: number
  spriteHeight: number
}) {
  const s = (v: number) => v * scale

  // Animation offset for effects
  const pulseScale = 1 + Math.sin(frame * 0.5) * 0.1
  const rotateAngle = frame * 15

  switch (type) {
    case 'aura_fire':
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: -spriteWidth * 0.1,
            top: -spriteHeight * 0.15,
            width: spriteWidth * 1.2,
            height: spriteHeight * 1.2,
            zIndex: -1,
          }}
        >
          {/* Fire particles */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: s(6 + (i % 2) * 2),
                height: s(8 + (i % 2) * 2),
                left: `${30 + Math.sin(frame * 0.3 + i) * 20}%`,
                top: `${50 + Math.cos(frame * 0.4 + i) * 10 - i * 12}%`,
                background: `radial-gradient(circle, #ff6b35 0%, #ff4500 50%, transparent 70%)`,
                opacity: 0.6 + Math.sin(frame * 0.5 + i) * 0.3,
                filter: 'blur(1px)',
              }}
            />
          ))}
        </div>
      )

    case 'aura_ice':
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: -spriteWidth * 0.15,
            top: -spriteHeight * 0.1,
            width: spriteWidth * 1.3,
            height: spriteHeight * 1.15,
            zIndex: -1,
          }}
        >
          {/* Ice crystals */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: s(4),
                height: s(4),
                left: `${20 + i * 20}%`,
                top: `${25 + Math.sin(frame * 0.2 + i * 1.5) * 20}%`,
                background: '#a5f3fc',
                transform: `rotate(${45 + rotateAngle + i * 30}deg)`,
                opacity: 0.7,
                boxShadow: '0 0 4px #22d3ee',
              }}
            />
          ))}
          {/* Mist effect */}
          <div
            className="absolute rounded-full"
            style={{
              width: '80%',
              height: '40%',
              left: '10%',
              bottom: '10%',
              background: 'radial-gradient(ellipse, rgba(165, 243, 252, 0.4) 0%, transparent 70%)',
              transform: `scale(${pulseScale})`,
            }}
          />
        </div>
      )

    case 'sparkles':
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: -spriteWidth * 0.2,
            top: -spriteHeight * 0.25,
            width: spriteWidth * 1.4,
            height: spriteHeight * 1.3,
            zIndex: 100,
          }}
        >
          {/* Sparkle stars */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 15 + Math.sin(frame * 0.15 + i * 1.2) * 30 + (i % 3) * 20
            const y = 15 + Math.cos(frame * 0.2 + i * 0.8) * 30 + (i % 3) * 20
            const sparkleFrame = (frame + i * 3) % 8
            const opacity = sparkleFrame < 4 ? sparkleFrame * 0.25 : (8 - sparkleFrame) * 0.25
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: s(3),
                  height: s(3),
                  background: '#fef08a',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  transform: `scale(${0.5 + opacity})`,
                  opacity,
                  filter: 'drop-shadow(0 0 2px #facc15)',
                }}
              />
            )
          })}
        </div>
      )

    case 'shadow_trail':
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: -spriteWidth * 0.6,
            top: 0,
            width: spriteWidth * 0.8,
            height: spriteHeight,
            zIndex: -2,
          }}
        >
          {/* Shadow copies */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded"
              style={{
                width: spriteWidth * 0.8,
                height: spriteHeight * 0.85,
                left: -i * spriteWidth * 0.25,
                top: i * spriteHeight * 0.04,
                background: '#1a1a2e',
                opacity: 0.3 - i * 0.1,
                filter: `blur(${i + 1}px)`,
              }}
            />
          ))}
        </div>
      )

    case 'lightning':
      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: -spriteWidth * 0.15,
            top: -spriteHeight * 0.35,
            width: spriteWidth * 1.3,
            height: spriteHeight * 1.45,
            zIndex: 100,
          }}
        >
          {/* Electric arcs */}
          {[0, 1, 2].map((i) => {
            const showArc = (frame + i * 2) % 6 < 2
            if (!showArc) return null
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${25 + i * 20}%`,
                  top: `${10 + i * 15}%`,
                  width: s(2),
                  height: s(20),
                  background: '#facc15',
                  clipPath: 'polygon(50% 0%, 0% 40%, 30% 40%, 0% 100%, 100% 50%, 60% 50%, 100% 0%)',
                  filter: 'drop-shadow(0 0 4px #fde047)',
                  transform: `rotate(${-30 + i * 30}deg)`,
                }}
              />
            )
          })}
          {/* Static particles */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`p${i}`}
              className="absolute rounded-full"
              style={{
                width: s(2),
                height: s(2),
                left: `${30 + Math.sin(frame * 0.5 + i) * 25}%`,
                top: `${20 + Math.cos(frame * 0.4 + i) * 25}%`,
                background: '#fde047',
                opacity: frame % 3 === i % 3 ? 1 : 0.3,
                boxShadow: '0 0 3px #facc15',
              }}
            />
          ))}
        </div>
      )

    default:
      return null
  }
}

// Held Item Renderer Component
function HeldItem({
  type,
  scale,
  spriteWidth,
  spriteHeight,
}: {
  type: string
  scale: number
  direction: 'left' | 'right' | 'up' | 'down'
  spriteWidth: number
  spriteHeight: number
}) {
  const s = (v: number) => v * scale

  // Position in hand area of sprite - always position on right side
  // Parent container handles flipping for left direction
  const baseX = spriteWidth * 0.7
  const baseY = spriteHeight * 0.55

  switch (type) {
    case 'pokeball':
      return (
        <div
          className="absolute rounded-full"
          style={{
            width: s(6),
            height: s(6),
            left: baseX,
            top: baseY,
            background: 'linear-gradient(180deg, #ef4444 50%, #f5f5f5 50%)',
            border: `${s(0.5)}px solid #1a1a1a`,
            zIndex: 15,
          }}
        >
          {/* Center band */}
          <div
            className="absolute bg-[#1a1a1a]"
            style={{
              width: '100%',
              height: s(1.5),
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Button */}
          <div
            className="absolute rounded-full bg-white border border-[#1a1a1a]"
            style={{
              width: s(2),
              height: s(2),
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )

    case 'greatball':
      return (
        <div
          className="absolute rounded-full"
          style={{
            width: s(6),
            height: s(6),
            left: baseX,
            top: baseY,
            background: 'linear-gradient(180deg, #3b82f6 50%, #f5f5f5 50%)',
            border: `${s(0.5)}px solid #1a1a1a`,
            zIndex: 15,
          }}
        >
          {/* Red stripes */}
          <div
            className="absolute bg-red-500"
            style={{
              width: '100%',
              height: s(1),
              top: s(1),
            }}
          />
          {/* Center band */}
          <div
            className="absolute bg-[#1a1a1a]"
            style={{
              width: '100%',
              height: s(1.5),
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Button */}
          <div
            className="absolute rounded-full bg-white border border-[#1a1a1a]"
            style={{
              width: s(2),
              height: s(2),
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )

    case 'masterball':
      return (
        <div
          className="absolute rounded-full"
          style={{
            width: s(6),
            height: s(6),
            left: baseX,
            top: baseY,
            background: 'linear-gradient(180deg, #9333ea 50%, #f5f5f5 50%)',
            border: `${s(0.5)}px solid #1a1a1a`,
            zIndex: 15,
          }}
        >
          {/* M design */}
          <div
            className="absolute text-pink-300 font-bold"
            style={{
              fontSize: s(3),
              top: s(0.5),
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            M
          </div>
          {/* Center band */}
          <div
            className="absolute bg-[#1a1a1a]"
            style={{
              width: '100%',
              height: s(1.5),
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Button */}
          <div
            className="absolute rounded-full bg-white border border-[#1a1a1a]"
            style={{
              width: s(2),
              height: s(2),
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )

    case 'fishing_rod':
      return (
        <div
          className="absolute"
          style={{
            left: baseX,
            top: spriteHeight * 0.35,
            zIndex: 15,
            transform: 'rotate(30deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* Rod */}
          <div
            className="absolute rounded"
            style={{
              width: s(2),
              height: s(20),
              left: 0,
              top: s(-16),
              background: 'linear-gradient(180deg, #854d0e 0%, #a16207 50%, #ca8a04 100%)',
            }}
          />
          {/* Reel */}
          <div
            className="absolute rounded-full bg-gray-600"
            style={{
              width: s(4),
              height: s(4),
              left: s(-1),
              top: s(-4),
              border: `${s(0.5)}px solid #374151`,
            }}
          />
        </div>
      )

    default:
      return null
  }
}

// Pet Companion Renderer Component
function PetCompanion({
  type,
  scale,
  isWalking,
  frame,
  spriteWidth,
}: {
  type: string
  scale: number
  isWalking: boolean
  frame: number
  direction: 'left' | 'right' | 'up' | 'down'
  spriteWidth: number
}) {
  const s = (v: number) => v * scale

  // Bob animation for walking
  const bobY = isWalking ? Math.sin(frame * 0.8) * 2 : Math.sin(frame * 0.2) * 1

  // Position behind trainer - always position to the left (negative X)
  // Parent container flip handles the visual direction
  const offsetX = -spriteWidth * 0.5

  switch (type) {
    case 'pichu':
      return (
        <div
          className="absolute"
          style={{
            left: offsetX,
            bottom: s(-2),
            transform: `translateY(${bobY}px) scaleX(-1)`,
            zIndex: -1,
          }}
        >
          {/* Body */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(16),
              height: s(14),
              left: 0,
              top: s(10),
              backgroundColor: '#fde047',
              boxShadow: `inset 0 ${s(-4)}px #facc15`,
            }}
          />
          {/* Head */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(14),
              height: s(12),
              left: s(1),
              top: 0,
              backgroundColor: '#fde047',
            }}
          >
            {/* Ears */}
            <div
              className="absolute"
              style={{
                width: s(4),
                height: s(8),
                left: s(-1),
                top: s(-4),
                backgroundColor: '#1a1a1a',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                transform: 'rotate(-20deg)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: s(4),
                height: s(8),
                right: s(-1),
                top: s(-4),
                backgroundColor: '#1a1a1a',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                transform: 'rotate(20deg)',
              }}
            />
            {/* Cheeks */}
            <div
              className="absolute rounded-full bg-red-400"
              style={{ width: s(3), height: s(3), left: s(0), top: s(6) }}
            />
            <div
              className="absolute rounded-full bg-red-400"
              style={{ width: s(3), height: s(3), right: s(0), top: s(6) }}
            />
            {/* Eyes */}
            <div
              className="absolute rounded-full bg-[#1a1a1a]"
              style={{ width: s(2), height: s(2), left: s(3), top: s(4) }}
            />
            <div
              className="absolute rounded-full bg-[#1a1a1a]"
              style={{ width: s(2), height: s(2), right: s(3), top: s(4) }}
            />
          </div>
        </div>
      )

    case 'eevee':
      return (
        <div
          className="absolute"
          style={{
            left: offsetX,
            bottom: s(-2),
            transform: `translateY(${bobY}px) scaleX(-1)`,
            zIndex: -1,
          }}
        >
          {/* Body */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(18),
              height: s(12),
              left: 0,
              top: s(14),
              backgroundColor: '#c2935f',
              boxShadow: `inset 0 ${s(-3)}px #a67c4e`,
            }}
          />
          {/* Tail (fluffy) */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(10),
              height: s(14),
              left: s(-6),
              top: s(8),
              backgroundColor: '#f5deb3',
              transform: `rotate(${-20 + bobY * 2}deg)`,
            }}
          />
          {/* Head */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(16),
              height: s(14),
              left: s(4),
              top: 0,
              backgroundColor: '#c2935f',
            }}
          >
            {/* Neck fluff */}
            <div
              className="absolute rounded-full"
              style={{
                width: s(14),
                height: s(8),
                left: s(1),
                top: s(10),
                backgroundColor: '#f5deb3',
              }}
            />
            {/* Ears */}
            <div
              className="absolute"
              style={{
                width: s(6),
                height: s(10),
                left: s(-2),
                top: s(-6),
                backgroundColor: '#c2935f',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                transform: 'rotate(-15deg)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: s(6),
                height: s(10),
                right: s(-2),
                top: s(-6),
                backgroundColor: '#c2935f',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                transform: 'rotate(15deg)',
              }}
            />
            {/* Eyes */}
            <div
              className="absolute rounded-full bg-[#1a1a1a]"
              style={{ width: s(3), height: s(3), left: s(3), top: s(4) }}
            >
              <div
                className="absolute rounded-full bg-white"
                style={{ width: s(1), height: s(1), top: s(0.5), left: s(0.5) }}
              />
            </div>
            <div
              className="absolute rounded-full bg-[#1a1a1a]"
              style={{ width: s(3), height: s(3), right: s(3), top: s(4) }}
            >
              <div
                className="absolute rounded-full bg-white"
                style={{ width: s(1), height: s(1), top: s(0.5), left: s(0.5) }}
              />
            </div>
            {/* Nose */}
            <div
              className="absolute rounded-full bg-[#1a1a1a]"
              style={{ width: s(2), height: s(1.5), left: s(7), top: s(7) }}
            />
          </div>
        </div>
      )

    case 'ditto':
      return (
        <div
          className="absolute"
          style={{
            left: offsetX,
            bottom: s(-2),
            transform: `translateY(${bobY}px) scaleX(-1) scaleY(${1 + Math.sin(frame * 0.3) * 0.1})`,
            transformOrigin: 'bottom center',
            zIndex: -1,
          }}
        >
          {/* Blob body */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(18),
              height: s(16),
              left: 0,
              top: s(4),
              backgroundColor: '#c084fc',
              boxShadow: `inset 0 ${s(-4)}px #a855f7, inset 0 ${s(4)}px rgba(255,255,255,0.3)`,
            }}
          >
            {/* Face */}
            <div
              className="absolute"
              style={{ left: s(3), top: s(5), width: s(12), height: s(6) }}
            >
              {/* Eyes (beady) */}
              <div
                className="absolute rounded-full bg-[#1a1a1a]"
                style={{ width: s(2), height: s(2), left: s(2), top: 0 }}
              />
              <div
                className="absolute rounded-full bg-[#1a1a1a]"
                style={{ width: s(2), height: s(2), right: s(2), top: 0 }}
              />
              {/* Smile */}
              <div
                className="absolute bg-[#1a1a1a] rounded-b-full"
                style={{
                  width: s(4),
                  height: s(2),
                  left: s(4),
                  top: s(3),
                }}
              />
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default SpriteTrainer
