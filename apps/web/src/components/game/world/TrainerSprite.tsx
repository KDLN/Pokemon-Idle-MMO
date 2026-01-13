'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface TrainerSpriteProps {
  direction?: 'left' | 'right'
  isWalking?: boolean
  scale?: number
  className?: string
}

export function TrainerSprite({
  direction = 'right',
  isWalking = true,
  scale = 2,
  className = '',
}: TrainerSpriteProps) {
  const [frame, setFrame] = useState(0)
  const [position, setPosition] = useState({ x: 50, y: 0 })
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  // Walking animation frames
  const walkFrames = 4
  const frameRate = 150 // ms per frame

  useEffect(() => {
    if (!isWalking) {
      setFrame(0)
      return
    }

    let lastFrameTime = 0

    const animate = (time: number) => {
      if (time - lastFrameTime >= frameRate) {
        setFrame((prev) => (prev + 1) % walkFrames)
        lastFrameTime = time
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

  // Horizontal walking loop
  useEffect(() => {
    if (!isWalking) return

    const walkLoop = () => {
      setPosition((prev) => {
        let newX = prev.x + (direction === 'right' ? 0.3 : -0.3)

        // Loop back when reaching edges
        if (newX > 85) newX = 15
        if (newX < 15) newX = 85

        return { ...prev, x: newX }
      })
    }

    const interval = setInterval(walkLoop, 50)
    return () => clearInterval(interval)
  }, [isWalking, direction])

  // Simple CSS-based trainer representation
  // In production, replace with actual sprite sheet
  const trainerStyle = {
    transform: `translateX(${position.x}%) scaleX(${direction === 'left' ? -1 : 1})`,
    transition: 'transform 0.05s linear',
  }

  return (
    <div
      className={`absolute bottom-8 ${className}`}
      style={{
        left: 0,
        right: 0,
        ...trainerStyle,
      }}
    >
      <div
        className="relative mx-auto"
        style={{
          width: 32 * scale,
          height: 48 * scale,
        }}
      >
        {/* Trainer body - simplified representation */}
        {/* Head */}
        <div
          className="absolute bg-amber-200 rounded-full"
          style={{
            width: 16 * scale,
            height: 16 * scale,
            left: 8 * scale,
            top: 0,
          }}
        />

        {/* Cap */}
        <div
          className="absolute bg-red-500 rounded-t-full"
          style={{
            width: 18 * scale,
            height: 8 * scale,
            left: 7 * scale,
            top: 0,
          }}
        />
        <div
          className="absolute bg-red-600"
          style={{
            width: 6 * scale,
            height: 3 * scale,
            left: direction === 'right' ? 18 * scale : 8 * scale,
            top: 6 * scale,
            borderRadius: direction === 'right' ? '0 4px 4px 0' : '4px 0 0 4px',
          }}
        />

        {/* Body */}
        <div
          className="absolute bg-blue-500 rounded-t"
          style={{
            width: 18 * scale,
            height: 20 * scale,
            left: 7 * scale,
            top: 14 * scale,
          }}
        />

        {/* Legs with walking animation */}
        <div
          className="absolute bg-blue-800"
          style={{
            width: 7 * scale,
            height: 14 * scale,
            left: 8 * scale,
            top: 32 * scale,
            transform: isWalking
              ? `rotate(${frame % 2 === 0 ? -15 : 15}deg)`
              : 'rotate(0deg)',
            transformOrigin: 'top center',
            transition: 'transform 0.1s ease',
          }}
        />
        <div
          className="absolute bg-blue-800"
          style={{
            width: 7 * scale,
            height: 14 * scale,
            left: 17 * scale,
            top: 32 * scale,
            transform: isWalking
              ? `rotate(${frame % 2 === 0 ? 15 : -15}deg)`
              : 'rotate(0deg)',
            transformOrigin: 'top center',
            transition: 'transform 0.1s ease',
          }}
        />

        {/* Shadow */}
        <div
          className="absolute bg-black/20 rounded-full"
          style={{
            width: 20 * scale,
            height: 6 * scale,
            left: 6 * scale,
            bottom: -3 * scale,
          }}
        />
      </div>
    </div>
  )
}
