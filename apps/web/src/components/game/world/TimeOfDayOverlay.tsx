'use client'

import { useEffect, useState } from 'react'
import { getTimeOfDay, type TimeOfDay } from '@/lib/time/timeOfDay'

interface TimeOfDayOverlayProps {
  className?: string
}

// Sky gradients for each time period - matching Mock style
const SKY_GRADIENTS: Record<TimeOfDay, string> = {
  dawn: 'from-orange-900/40 via-pink-900/20 to-transparent',
  day: 'from-sky-900/30 via-transparent to-transparent',
  dusk: 'from-orange-900/40 via-purple-900/20 to-transparent',
  night: 'from-indigo-950/60 via-purple-950/30 to-transparent',
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

  return (
    <div
      className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${SKY_GRADIENTS[timeOfDay]} transition-colors duration-1000 ${className}`}
    >
      {/* Stars for night time - fixed positions */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '5%', top: '8%', animationDelay: '0s', opacity: 0.6 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '15%', top: '22%', animationDelay: '0.5s', opacity: 0.5 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '25%', top: '5%', animationDelay: '1.2s', opacity: 0.7 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '32%', top: '30%', animationDelay: '0.3s', opacity: 0.4 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '42%', top: '12%', animationDelay: '1.8s', opacity: 0.6 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '48%', top: '25%', animationDelay: '0.7s', opacity: 0.5 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '55%', top: '3%', animationDelay: '2.1s', opacity: 0.8 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '62%', top: '18%', animationDelay: '1.5s', opacity: 0.5 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '70%', top: '35%', animationDelay: '0.2s', opacity: 0.6 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '78%', top: '10%', animationDelay: '2.5s', opacity: 0.7 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '85%', top: '28%', animationDelay: '1.0s', opacity: 0.4 }} />
          <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ left: '92%', top: '6%', animationDelay: '1.7s', opacity: 0.6 }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{ left: '10%', top: '15%', animationDelay: '2.3s', opacity: 0.3 }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{ left: '38%', top: '8%', animationDelay: '0.9s', opacity: 0.4 }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{ left: '58%', top: '32%', animationDelay: '2.8s', opacity: 0.35 }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{ left: '75%', top: '20%', animationDelay: '1.3s', opacity: 0.45 }} />
        </div>
      )}

      {/* Sun/Moon indicator */}
      <div className="absolute top-4 right-4 text-2xl opacity-60">
        {timeOfDay === 'night' && '\uD83C\uDF19'}
        {timeOfDay === 'dawn' && '\uD83C\uDF05'}
        {timeOfDay === 'day' && '\u2600\uFE0F'}
        {timeOfDay === 'dusk' && '\uD83C\uDF07'}
      </div>
    </div>
  )
}
