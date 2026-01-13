'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import {
  type TrainerCustomization,
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  DEFAULT_TRAINER_CUSTOMIZATION,
} from '@/lib/sprites/trainerCustomization'

// Event cosmetics for showing off special items
export interface EventCosmetics {
  effect?: 'aura_fire' | 'aura_ice' | 'sparkles' | 'shadow_trail' | 'lightning'
  pet?: 'pichu' | 'eevee' | 'ditto'
  heldItem?: 'pokeball' | 'greatball' | 'masterball' | 'fishing_rod'
}

interface AnimatedTrainerSpriteProps {
  direction?: 'left' | 'right' | 'up' | 'down'
  isWalking?: boolean
  scale?: number
  customization?: TrainerCustomization
  eventCosmetics?: EventCosmetics
  className?: string
  // Position control for walking animation
  position?: { x: number; y: number }
  enableWalkLoop?: boolean
}

// Animation frame configurations
const WALK_FRAMES = 4
const FRAME_DURATION = 120 // ms per frame
const IDLE_BOB_FRAMES = 2
const IDLE_BOB_DURATION = 800 // ms per idle bob cycle

/**
 * @deprecated Use SpriteTrainer instead. This CSS-based trainer is kept for fallback purposes.
 */
export function AnimatedTrainerSpriteLegacy({
  direction = 'right',
  isWalking = false,
  scale = 2,
  customization = DEFAULT_TRAINER_CUSTOMIZATION,
  eventCosmetics,
  className = '',
  position,
  enableWalkLoop = false,
}: AnimatedTrainerSpriteProps) {
  const [frame, setFrame] = useState(0)
  const [idleFrame, setIdleFrame] = useState(0)
  const [internalPosition, setInternalPosition] = useState({ x: 50, y: 0 })
  const [internalDirection, setInternalDirection] = useState<'left' | 'right'>(direction === 'left' ? 'left' : 'right')
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  // Use external position if provided, otherwise internal
  const currentPosition = position ?? internalPosition
  const currentDirection = position ? direction : internalDirection

  // Get colors from customization
  const colors = useMemo(() => ({
    skin: SKIN_TONES[customization.skinTone],
    hair: HAIR_COLORS[customization.hairColor],
    top: OUTFIT_COLORS[customization.topColor],
    bottom: OUTFIT_COLORS[customization.bottomColor],
    hat: OUTFIT_COLORS[customization.hatColor],
  }), [customization])

  // Walking animation
  useEffect(() => {
    if (!isWalking) {
      setFrame(0)
      return
    }

    const animate = (time: number) => {
      if (time - lastFrameTimeRef.current >= FRAME_DURATION) {
        setFrame((prev) => (prev + 1) % WALK_FRAMES)
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
  }, [isWalking])

  // Idle bobbing animation
  useEffect(() => {
    if (isWalking) return

    const idleInterval = setInterval(() => {
      setIdleFrame((prev) => (prev + 1) % IDLE_BOB_FRAMES)
    }, IDLE_BOB_DURATION)

    return () => clearInterval(idleInterval)
  }, [isWalking])

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

  // Calculate leg rotation for walking
  const getWalkCycle = (legIndex: 0 | 1): number => {
    if (!isWalking) return 0
    // Opposite legs move opposite directions
    const phase = legIndex === 0 ? 0 : 2
    const adjustedFrame = (frame + phase) % WALK_FRAMES
    // Smooth sine wave for leg rotation
    const rotation = Math.sin((adjustedFrame / WALK_FRAMES) * Math.PI * 2) * 18
    return rotation
  }

  // Calculate arm swing for walking
  const getArmSwing = (armIndex: 0 | 1): number => {
    if (!isWalking) return 0
    const phase = armIndex === 0 ? 0 : 2
    const adjustedFrame = (frame + phase) % WALK_FRAMES
    return Math.sin((adjustedFrame / WALK_FRAMES) * Math.PI * 2) * 12
  }

  // Idle bob offset
  const idleBobY = !isWalking ? (idleFrame === 0 ? 0 : -1) : 0

  // Base dimensions (in pixels, scaled)
  const baseWidth = 32
  const baseHeight = 48
  const width = baseWidth * scale
  const height = baseHeight * scale

  // Component parts scaled
  const s = (v: number) => v * scale

  // Determine horizontal flip for direction
  const flipX = currentDirection === 'left' ? -1 : 1

  // Position style
  const positionStyle = enableWalkLoop || position ? {
    left: 0,
    right: 0,
    transform: `translateX(${currentPosition.x}%) scaleX(${flipX})`,
    transition: 'transform 0.05s linear',
  } : {
    transform: `scaleX(${flipX})`,
  }

  return (
    <div
      className={`${enableWalkLoop ? 'absolute bottom-8' : 'relative'} ${className}`}
      style={positionStyle}
      role="img"
      aria-label="Trainer character"
    >
      <div
        className="relative mx-auto"
        style={{
          width,
          height,
          transform: `translateY(${idleBobY}px)`,
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
          {/* Left leg */}
          <div
            className="absolute rounded-b"
            style={{
              width: s(6),
              height: s(14),
              left: 0,
              top: 0,
              backgroundColor: colors.bottom.base,
              borderBottom: `${s(3)}px solid ${colors.bottom.shadow}`,
              transform: `rotate(${getWalkCycle(0)}deg)`,
              transformOrigin: 'top center',
              transition: isWalking ? 'transform 0.08s ease-out' : 'none',
            }}
          />
          {/* Right leg */}
          <div
            className="absolute rounded-b"
            style={{
              width: s(6),
              height: s(14),
              right: 0,
              top: 0,
              backgroundColor: colors.bottom.base,
              borderBottom: `${s(3)}px solid ${colors.bottom.shadow}`,
              transform: `rotate(${getWalkCycle(1)}deg)`,
              transformOrigin: 'top center',
              transition: isWalking ? 'transform 0.08s ease-out' : 'none',
            }}
          />
        </div>

        {/* Body/Torso */}
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
        >
          {/* Shirt accent/stripe */}
          <div
            className="absolute"
            style={{
              width: s(4),
              height: '100%',
              left: s(7),
              backgroundColor: colors.top.accent,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Arms */}
        {/* Left arm */}
        <div
          className="absolute rounded"
          style={{
            width: s(4),
            height: s(12),
            left: s(4),
            top: s(16),
            backgroundColor: colors.top.shadow,
            transform: `rotate(${getArmSwing(0)}deg)`,
            transformOrigin: 'top center',
            transition: isWalking ? 'transform 0.08s ease-out' : 'none',
          }}
        >
          {/* Hand */}
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
        {/* Right arm */}
        <div
          className="absolute rounded"
          style={{
            width: s(4),
            height: s(12),
            right: s(4),
            top: s(16),
            backgroundColor: colors.top.shadow,
            transform: `rotate(${getArmSwing(1)}deg)`,
            transformOrigin: 'top center',
            transition: isWalking ? 'transform 0.08s ease-out' : 'none',
          }}
        >
          {/* Hand */}
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
            >
              <div
                className="absolute rounded-full bg-white"
                style={{ width: s(1), height: s(1), top: s(0.5), left: s(0.5) }}
              />
            </div>
            <div className="flex-1" />
            <div
              className="rounded-full bg-[#1a1a2e]"
              style={{ width: s(3), height: s(3) }}
            >
              <div
                className="absolute rounded-full bg-white"
                style={{ width: s(1), height: s(1), top: s(0.5), left: s(0.5) }}
              />
            </div>
          </div>

          {/* Mouth (simple) */}
          <div
            className="absolute bg-[#1a1a2e]/50 rounded-full"
            style={{
              width: s(4),
              height: s(1.5),
              left: s(6),
              top: s(11),
            }}
          />
        </div>

        {/* Hair */}
        <HairRenderer
          style={customization.hairStyle}
          color={colors.hair}
          scale={scale}
        />

        {/* Hat */}
        {customization.hatStyle !== 'none' && (
          <HatRenderer
            style={customization.hatStyle}
            color={colors.hat}
            scale={scale}
            direction={currentDirection}
          />
        )}

        {/* Accessories */}
        {customization.accessory && customization.accessory !== 'none' && (
          <AccessoryRenderer
            type={customization.accessory}
            scale={scale}
          />
        )}

        {/* Event Cosmetics - Effects (auras, particles) */}
        {eventCosmetics?.effect && (
          <EffectRenderer
            type={eventCosmetics.effect}
            scale={scale}
            frame={frame}
          />
        )}

        {/* Event Cosmetics - Held Items */}
        {eventCosmetics?.heldItem && (
          <HeldItemRenderer
            type={eventCosmetics.heldItem}
            scale={scale}
            direction={currentDirection}
            armSwing={getArmSwing(1)}
          />
        )}
      </div>

      {/* Event Cosmetics - Following Pet (rendered outside main sprite container) */}
      {eventCosmetics?.pet && (
        <PetRenderer
          type={eventCosmetics.pet}
          scale={scale * 0.7}
          isWalking={isWalking}
          frame={frame}
          direction={currentDirection}
        />
      )}
    </div>
  )
}

// Hair Renderer Component
function HairRenderer({
  style,
  color,
  scale,
}: {
  style: string
  color: { base: string; shadow: string }
  scale: number
}) {
  const s = (v: number) => v * scale

  switch (style) {
    case 'spiky':
      return (
        <div className="absolute" style={{ left: s(6), top: s(-2) }}>
          {/* Spiky hair tufts */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: s(4),
                height: s(8),
                left: s(i * 3.5),
                top: s(i % 2 === 0 ? 0 : 2),
                backgroundColor: color.base,
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                transform: `rotate(${(i - 2) * 15}deg)`,
              }}
            />
          ))}
        </div>
      )

    case 'short':
      return (
        <div
          className="absolute rounded-t-full"
          style={{
            width: s(18),
            height: s(10),
            left: s(7),
            top: s(-1),
            backgroundColor: color.base,
            boxShadow: `inset 0 ${s(-3)}px ${color.shadow}`,
          }}
        />
      )

    case 'medium':
      return (
        <>
          <div
            className="absolute rounded-t-full"
            style={{
              width: s(20),
              height: s(12),
              left: s(6),
              top: s(-2),
              backgroundColor: color.base,
            }}
          />
          {/* Side hair */}
          <div
            className="absolute rounded"
            style={{
              width: s(3),
              height: s(10),
              left: s(5),
              top: s(6),
              backgroundColor: color.shadow,
            }}
          />
          <div
            className="absolute rounded"
            style={{
              width: s(3),
              height: s(10),
              right: s(5),
              top: s(6),
              backgroundColor: color.shadow,
            }}
          />
        </>
      )

    case 'long':
      return (
        <>
          <div
            className="absolute rounded-t-full"
            style={{
              width: s(20),
              height: s(12),
              left: s(6),
              top: s(-2),
              backgroundColor: color.base,
            }}
          />
          {/* Long flowing hair */}
          <div
            className="absolute rounded-b"
            style={{
              width: s(6),
              height: s(20),
              left: s(3),
              top: s(4),
              backgroundColor: color.shadow,
            }}
          />
          <div
            className="absolute rounded-b"
            style={{
              width: s(6),
              height: s(20),
              right: s(3),
              top: s(4),
              backgroundColor: color.shadow,
            }}
          />
        </>
      )

    case 'ponytail':
      return (
        <>
          <div
            className="absolute rounded-t-full"
            style={{
              width: s(18),
              height: s(10),
              left: s(7),
              top: s(-1),
              backgroundColor: color.base,
            }}
          />
          {/* Ponytail */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(6),
              height: s(16),
              right: s(4),
              top: s(6),
              backgroundColor: color.base,
              boxShadow: `inset ${s(-2)}px 0 ${color.shadow}`,
            }}
          />
        </>
      )

    case 'afro':
      return (
        <div
          className="absolute rounded-full"
          style={{
            width: s(24),
            height: s(20),
            left: s(4),
            top: s(-6),
            backgroundColor: color.base,
            boxShadow: `inset 0 ${s(4)}px ${s(4)}px ${color.shadow}`,
          }}
        />
      )

    case 'buzz':
      return (
        <div
          className="absolute rounded-t-full"
          style={{
            width: s(16),
            height: s(6),
            left: s(8),
            top: s(0),
            backgroundColor: color.base,
            opacity: 0.8,
          }}
        />
      )

    default:
      return null
  }
}

// Hat Renderer Component
function HatRenderer({
  style,
  color,
  scale,
  direction,
}: {
  style: string
  color: { base: string; shadow: string; accent: string }
  scale: number
  direction: 'left' | 'right' | 'up' | 'down'
}) {
  const s = (v: number) => v * scale

  switch (style) {
    case 'cap':
      return (
        <>
          {/* Cap dome */}
          <div
            className="absolute rounded-t-full"
            style={{
              width: s(18),
              height: s(8),
              left: s(7),
              top: s(-2),
              backgroundColor: color.base,
              boxShadow: `inset 0 ${s(-2)}px ${color.shadow}`,
              zIndex: 10,
            }}
          />
          {/* Cap brim */}
          <div
            className="absolute"
            style={{
              width: s(8),
              height: s(3),
              left: direction === 'right' ? s(18) : s(6),
              top: s(3),
              backgroundColor: color.shadow,
              borderRadius: direction === 'right' ? `0 ${s(4)}px ${s(4)}px 0` : `${s(4)}px 0 0 ${s(4)}px`,
              zIndex: 10,
            }}
          />
          {/* Cap button */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(4),
              height: s(4),
              left: s(14),
              top: s(-4),
              backgroundColor: color.accent,
              zIndex: 11,
            }}
          />
        </>
      )

    case 'beanie':
      return (
        <>
          <div
            className="absolute rounded-t-full"
            style={{
              width: s(20),
              height: s(12),
              left: s(6),
              top: s(-4),
              backgroundColor: color.base,
              zIndex: 10,
            }}
          />
          {/* Beanie fold */}
          <div
            className="absolute"
            style={{
              width: s(20),
              height: s(4),
              left: s(6),
              top: s(4),
              backgroundColor: color.shadow,
              zIndex: 10,
            }}
          />
          {/* Pom pom */}
          <div
            className="absolute rounded-full"
            style={{
              width: s(6),
              height: s(6),
              left: s(13),
              top: s(-8),
              backgroundColor: color.accent,
              zIndex: 11,
            }}
          />
        </>
      )

    case 'headband':
      return (
        <div
          className="absolute"
          style={{
            width: s(18),
            height: s(4),
            left: s(7),
            top: s(2),
            backgroundColor: color.base,
            zIndex: 10,
          }}
        />
      )

    case 'bandana':
      return (
        <>
          <div
            className="absolute rounded-t"
            style={{
              width: s(20),
              height: s(6),
              left: s(6),
              top: s(-1),
              backgroundColor: color.base,
              zIndex: 10,
            }}
          />
          {/* Bandana tail */}
          <div
            className="absolute"
            style={{
              width: s(8),
              height: s(10),
              right: s(2),
              top: s(4),
              backgroundColor: color.shadow,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30% 80%)',
              transform: 'rotate(15deg)',
              zIndex: 9,
            }}
          />
        </>
      )

    default:
      return null
  }
}

// Accessory Renderer Component
function AccessoryRenderer({
  type,
  scale,
}: {
  type: string
  scale: number
}) {
  const s = (v: number) => v * scale

  switch (type) {
    case 'glasses':
      return (
        <div className="absolute" style={{ left: s(7), top: s(5), zIndex: 12 }}>
          {/* Left lens */}
          <div
            className="absolute rounded border-2 border-[#333]"
            style={{
              width: s(5),
              height: s(4),
              left: 0,
              backgroundColor: 'rgba(200, 200, 255, 0.3)',
            }}
          />
          {/* Bridge */}
          <div
            className="absolute bg-[#333]"
            style={{
              width: s(4),
              height: s(1),
              left: s(5),
              top: s(1.5),
            }}
          />
          {/* Right lens */}
          <div
            className="absolute rounded border-2 border-[#333]"
            style={{
              width: s(5),
              height: s(4),
              left: s(9),
              backgroundColor: 'rgba(200, 200, 255, 0.3)',
            }}
          />
        </div>
      )

    case 'sunglasses':
      return (
        <div className="absolute" style={{ left: s(6), top: s(5), zIndex: 12 }}>
          {/* Left lens */}
          <div
            className="absolute rounded"
            style={{
              width: s(6),
              height: s(4),
              left: 0,
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
            }}
          />
          {/* Bridge */}
          <div
            className="absolute bg-[#333]"
            style={{
              width: s(4),
              height: s(1),
              left: s(6),
              top: s(1.5),
            }}
          />
          {/* Right lens */}
          <div
            className="absolute rounded"
            style={{
              width: s(6),
              height: s(4),
              left: s(10),
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
            }}
          />
        </div>
      )

    case 'scarf':
      return (
        <>
          {/* Scarf around neck */}
          <div
            className="absolute"
            style={{
              width: s(20),
              height: s(4),
              left: s(6),
              top: s(14),
              backgroundColor: '#E91E8C',
              zIndex: 8,
            }}
          />
          {/* Scarf tail */}
          <div
            className="absolute"
            style={{
              width: s(4),
              height: s(12),
              left: s(6),
              top: s(16),
              backgroundColor: '#B8186F',
              zIndex: 7,
            }}
          />
        </>
      )

    default:
      return null
  }
}

// Effect Renderer Component (auras, particles, etc.)
function EffectRenderer({
  type,
  scale,
  frame,
}: {
  type: string
  scale: number
  frame: number
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
            left: s(-4),
            top: s(-8),
            width: s(40),
            height: s(60),
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
                left: s(10 + Math.sin(frame * 0.3 + i) * 8),
                top: s(20 + Math.cos(frame * 0.4 + i) * 4 - i * 6),
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
            left: s(-6),
            top: s(-4),
            width: s(44),
            height: s(56),
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
                left: s(12 + i * 6),
                top: s(10 + Math.sin(frame * 0.2 + i * 1.5) * 8),
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
              width: s(30),
              height: s(20),
              left: s(6),
              bottom: s(4),
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
            left: s(-8),
            top: s(-12),
            width: s(48),
            height: s(64),
            zIndex: 100,
          }}
        >
          {/* Sparkle stars */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 8 + Math.sin(frame * 0.15 + i * 1.2) * 16 + i * 5
            const y = 8 + Math.cos(frame * 0.2 + i * 0.8) * 20 + (i % 3) * 12
            const sparkleFrame = (frame + i * 3) % 8
            const opacity = sparkleFrame < 4 ? sparkleFrame * 0.25 : (8 - sparkleFrame) * 0.25
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: s(x),
                  top: s(y),
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
            left: s(-20),
            top: s(0),
            width: s(30),
            height: s(50),
            zIndex: -2,
          }}
        >
          {/* Shadow copies */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded"
              style={{
                width: s(24),
                height: s(40),
                left: s(-i * 8),
                top: s(i * 2),
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
            left: s(-6),
            top: s(-16),
            width: s(44),
            height: s(70),
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
                  left: s(10 + i * 8),
                  top: s(4 + i * 8),
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
                left: s(12 + Math.sin(frame * 0.5 + i) * 12),
                top: s(10 + Math.cos(frame * 0.4 + i) * 15),
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
function HeldItemRenderer({
  type,
  scale,
  direction,
  armSwing,
}: {
  type: string
  scale: number
  direction: 'left' | 'right' | 'up' | 'down'
  armSwing: number
}) {
  const s = (v: number) => v * scale
  const isLeft = direction === 'left'

  // Position in hand (adjusts with arm swing)
  const baseX = isLeft ? s(3) : s(25)
  const baseY = s(26) + armSwing * 0.3

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
            top: s(16),
            zIndex: 15,
            transform: `rotate(${isLeft ? -30 : 30}deg)`,
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

// Pet Renderer Component (following companion)
function PetRenderer({
  type,
  scale,
  isWalking,
  frame,
  direction,
}: {
  type: string
  scale: number
  isWalking: boolean
  frame: number
  direction: 'left' | 'right' | 'up' | 'down'
}) {
  const s = (v: number) => v * scale
  const isLeft = direction === 'left'

  // Bob animation for walking
  const bobY = isWalking ? Math.sin(frame * 0.8) * 2 : Math.sin(frame * 0.2) * 1

  // Position behind trainer
  const offsetX = isLeft ? s(50) : s(-25)

  switch (type) {
    case 'pichu':
      return (
        <div
          className="absolute"
          style={{
            left: offsetX,
            bottom: s(-2),
            transform: `translateY(${bobY}px) scaleX(${isLeft ? 1 : -1})`,
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
            transform: `translateY(${bobY}px) scaleX(${isLeft ? 1 : -1})`,
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
            transform: `translateY(${bobY}px) scaleX(${isLeft ? 1 : -1}) scaleY(${1 + Math.sin(frame * 0.3) * 0.1})`,
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

export default AnimatedTrainerSpriteLegacy
