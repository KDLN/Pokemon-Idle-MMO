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

export function WorldEventsTicker({
  events = MOCK_EVENTS,
  className = '',
}: WorldEventsTickerProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Sort by priority
  const sortedEvents = [...events].sort((a, b) => a.priority - b.priority)
  const activeEvents = sortedEvents.filter((e) => e.expiresAt.getTime() > Date.now())

  // Cycle through events (rotate which event is first in the scrolling list)
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

  // Reorder events starting from current index for display
  const displayEvents = [
    ...activeEvents.slice(currentEventIndex),
    ...activeEvents.slice(0, currentEventIndex)
  ]

  return (
    <div
      className={`bg-[var(--color-surface-base)] border-b border-[var(--color-border-subtle)] px-4 py-1.5 overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        {/* LIVE indicator */}
        <span className="text-[10px] font-pixel text-[var(--color-brand-accent)] shrink-0">LIVE</span>

        {/* Events list - horizontal scroll */}
        <div className="flex gap-8 text-xs text-[var(--color-text-secondary)] overflow-hidden">
          {displayEvents.map((event) => (
            <span key={event.id} className="whitespace-nowrap flex items-center gap-1.5">
              <span>{event.icon}</span>
              <span>{event.message}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
