'use client'

import { useState, useEffect } from 'react'

export interface WorldEvent {
  id: string
  type: 'swarm' | 'legendary' | 'event' | 'maintenance' | 'bonus'
  message: string
  icon: string
  expiresAt: Date
  priority: number
}

interface WorldEventsTickerProps {
  events?: WorldEvent[]
  className?: string
}

// Mock events for development
const MOCK_EVENTS: WorldEvent[] = [
  {
    id: '1',
    type: 'swarm',
    message: 'A swarm of Magnemite has appeared in Power Plant! Ends in 14m',
    icon: '⚡',
    expiresAt: new Date(Date.now() + 840000),
    priority: 1,
  },
  {
    id: '2',
    type: 'bonus',
    message: 'Double EXP Weekend is active!',
    icon: '🎉',
    expiresAt: new Date(Date.now() + 86400000),
    priority: 2,
  },
  {
    id: '3',
    type: 'event',
    message: 'Safari Zone event: Rare Pokemon appearing!',
    icon: '🌴',
    expiresAt: new Date(Date.now() + 172800000),
    priority: 3,
  },
]

function getEventColor(type: WorldEvent['type']): string {
  switch (type) {
    case 'swarm':
      return 'text-yellow-400'
    case 'legendary':
      return 'text-purple-400'
    case 'event':
      return 'text-green-400'
    case 'maintenance':
      return 'text-red-400'
    case 'bonus':
      return 'text-blue-400'
    default:
      return 'text-white'
  }
}

function formatTimeRemaining(date: Date): string {
  const now = Date.now()
  const diff = date.getTime() - now

  if (diff <= 0) return 'Expired'

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

export function WorldEventsTicker({
  events = MOCK_EVENTS,
  className = '',
}: WorldEventsTickerProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Sort by priority
  const sortedEvents = [...events].sort((a, b) => a.priority - b.priority)
  const activeEvents = sortedEvents.filter((e) => e.expiresAt.getTime() > Date.now())

  // Cycle through events
  useEffect(() => {
    if (activeEvents.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % activeEvents.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [activeEvents.length, isHovered])

  if (activeEvents.length === 0) {
    return null
  }

  const currentEvent = activeEvents[currentEventIndex % activeEvents.length]

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] via-[#252542] to-[#1a1a2e] border-b border-[#2a2a4a] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3">
          {/* Event indicator dots */}
          {activeEvents.length > 1 && (
            <div className="flex gap-1">
              {activeEvents.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentEventIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentEventIndex % activeEvents.length
                      ? 'bg-white'
                      : 'bg-[#606080]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Event content */}
          <div
            className={`flex items-center gap-2 transition-all duration-300 ${getEventColor(currentEvent.type)}`}
          >
            <span className="text-lg animate-pulse">{currentEvent.icon}</span>
            <span className="text-sm font-medium">{currentEvent.message}</span>
          </div>

          {/* Time remaining */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-[#606080] bg-[#0f0f1a] px-2 py-1 rounded-full">
            <span>⏱️</span>
            <span>{formatTimeRemaining(currentEvent.expiresAt)}</span>
          </div>
        </div>
      </div>

      {/* Animated gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#5B6EEA] to-transparent opacity-50" />
    </div>
  )
}
