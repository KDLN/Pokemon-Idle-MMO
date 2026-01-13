'use client'

import { useEffect, useState } from 'react'
import { getPokemonSpriteUrl } from '@/types/game'

interface PokemonCompanionProps {
  speciesId: number
  isShiny?: boolean
  direction?: 'left' | 'right'
  isWalking?: boolean
  scale?: number
  offsetX?: number
  className?: string
}

export function PokemonCompanion({
  speciesId,
  isShiny = false,
  direction = 'right',
  isWalking = true,
  scale = 1.5,
  offsetX = -60,
  className = '',
}: PokemonCompanionProps) {
  const [bobOffset, setBobOffset] = useState(0)
  const [hopFrame, setHopFrame] = useState(0)

  // Bobbing animation
  useEffect(() => {
    if (!isWalking) {
      setBobOffset(0)
      return
    }

    const bobInterval = setInterval(() => {
      setBobOffset((prev) => (prev + 1) % 4)
    }, 200)

    return () => clearInterval(bobInterval)
  }, [isWalking])

  // Hop animation for walking
  useEffect(() => {
    if (!isWalking) return

    const hopInterval = setInterval(() => {
      setHopFrame((prev) => (prev + 1) % 2)
    }, 300)

    return () => clearInterval(hopInterval)
  }, [isWalking])

  const spriteUrl = getPokemonSpriteUrl(speciesId, isShiny)
  const bobY = isWalking ? [0, -4, -2, 2][bobOffset] : 0
  const hopY = isWalking ? hopFrame * -3 : 0

  return (
    <div
      className={`absolute transition-transform ${className}`}
      style={{
        bottom: 16,
        left: `calc(50% + ${offsetX}px)`,
        transform: `translateY(${bobY + hopY}px) scaleX(${direction === 'left' ? -1 : 1})`,
      }}
    >
      <div className="relative">
        {/* Pokemon sprite */}
        <img
          src={spriteUrl}
          alt="Pokemon companion"
          className="pixelated drop-shadow-lg"
          style={{
            width: 48 * scale,
            height: 48 * scale,
            imageRendering: 'pixelated',
          }}
          draggable={false}
        />

        {/* Shiny sparkle effect */}
        {isShiny && (
          <div className="absolute -top-2 -right-2 animate-sparkle">
            ✨
          </div>
        )}

        {/* Shadow */}
        <div
          className="absolute bg-black/20 rounded-full"
          style={{
            width: 32 * scale,
            height: 8 * scale,
            left: 8 * scale,
            bottom: -4 * scale,
            transform: `scaleY(${1 - Math.abs(hopY) * 0.05})`,
          }}
        />
      </div>
    </div>
  )
}
