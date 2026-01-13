'use client'

import { useEffect, useState } from 'react'

interface AttackAnimationProps {
  type?: 'physical' | 'special' | 'status'
  targetPosition?: 'left' | 'right' | 'center'
  onComplete?: () => void
}

export function AttackAnimation({
  type = 'physical',
  targetPosition = 'center',
  onComplete,
}: AttackAnimationProps) {
  const [phase, setPhase] = useState<'active' | 'complete'>('active')

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('complete')
      onComplete?.()
    }, 400)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (phase === 'complete') return null

  const getPositionClasses = () => {
    switch (targetPosition) {
      case 'left':
        return 'left-1/4'
      case 'right':
        return 'left-3/4'
      default:
        return 'left-1/2'
    }
  }

  const renderEffect = () => {
    switch (type) {
      case 'physical':
        return (
          <div className="relative">
            {/* Impact lines */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white animate-attack-line"
                style={{
                  width: 4,
                  height: 20 + Math.random() * 20,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                  transformOrigin: 'center',
                  animationDelay: `${i * 0.02}s`,
                }}
              />
            ))}
            {/* Central flash */}
            <div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-white/80 rounded-full animate-flash-out" />
          </div>
        )

      case 'special':
        return (
          <div className="relative">
            {/* Energy particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-particle-burst"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%)`,
                  animationDelay: `${i * 0.03}s`,
                  ['--angle' as string]: `${i * 45}deg`,
                }}
              />
            ))}
            {/* Glow */}
            <div className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-yellow-300/60 rounded-full animate-pulse-quick blur-md" />
          </div>
        )

      case 'status':
        return (
          <div className="relative">
            {/* Status rings */}
            <div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-4 border-purple-400 rounded-full animate-ring-expand" />
            <div
              className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-4 border-purple-300 rounded-full animate-ring-expand"
              style={{ animationDelay: '0.1s' }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`absolute ${getPositionClasses()} top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20`}
    >
      {renderEffect()}
    </div>
  )
}

interface DamageNumberProps {
  damage: number
  isCritical?: boolean
  isHealing?: boolean
  position?: { x: number; y: number }
  onComplete?: () => void
}

export function DamageNumber({
  damage,
  isCritical = false,
  isHealing = false,
  position = { x: 50, y: 30 },
  onComplete,
}: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 1000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  const textColor = isHealing ? 'text-green-400' : isCritical ? 'text-red-500' : 'text-white'
  const fontSize = isCritical ? 'text-2xl' : 'text-xl'

  return (
    <div
      className={`
        absolute pointer-events-none
        font-pixel font-bold
        ${textColor} ${fontSize}
        animate-damage-pop
        drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
      `}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {isHealing ? '+' : '-'}{damage}
      {isCritical && <span className="text-sm ml-1">!</span>}
    </div>
  )
}
