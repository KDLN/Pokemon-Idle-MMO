'use client'

import { useEffect, useState } from 'react'
import { getTimeOfDay, TIME_COLORS, type TimeOfDay } from '@/lib/time/timeOfDay'

interface TimeOfDayOverlayProps {
  className?: string
}

export function TimeOfDayOverlay({ className = '' }: TimeOfDayOverlayProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    // Update immediately
    setTimeOfDay(getTimeOfDay())

    // Update every minute
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const colors = TIME_COLORS[timeOfDay]

  return (
    <div
      className={`pointer-events-none absolute inset-0 transition-all duration-[30000ms] ${className}`}
      style={{
        background: colors.gradient,
        boxShadow: `inset 0 0 100px ${colors.overlay}`,
      }}
    >
      {/* Stars for night time */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 40}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Sun/Moon indicator */}
      <div className="absolute top-4 right-4 text-2xl opacity-60">
        {timeOfDay === 'night' && '🌙'}
        {timeOfDay === 'morning' && '🌅'}
        {timeOfDay === 'day' && '☀️'}
        {timeOfDay === 'evening' && '🌇'}
      </div>
    </div>
  )
}
