'use client'

import { useEffect, useRef } from 'react'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'catch' | 'battle' | 'levelup' | 'evolution' | 'item' | 'travel' | 'system'
  message: string
  icon?: string
  highlight?: boolean
  moveName?: string
  moveType?: string
  value?: string
}

interface WorldLogProps {
  entries: LogEntry[]
  maxEntries?: number
  className?: string
}

function getTypeColor(type: LogEntry['type']): string {
  switch (type) {
    case 'catch':
      return 'text-green-400'
    case 'battle':
      return 'text-red-400'
    case 'levelup':
      return 'text-yellow-400'
    case 'evolution':
      return 'text-cyan-400'
    case 'item':
      return 'text-purple-400'
    case 'travel':
      return 'text-blue-400'
    case 'system':
      return 'text-[#a0a0c0]'
    default:
      return 'text-white'
  }
}

function getMoveTypeColor(moveType: string): string {
  switch (moveType.toLowerCase()) {
    case 'normal':
      return '#d1d5db'
    case 'fire':
      return '#f97316'
    case 'water':
      return '#22d3ee'
    case 'grass':
      return '#22c55e'
    case 'electric':
      return '#facc15'
    case 'flying':
      return '#a5b4fc'
    case 'psychic':
      return '#f472b6'
    case 'dark':
      return '#1e1b4b'
    case 'dragon':
      return '#a855f7'
    case 'steel':
      return '#94a3b8'
    case 'ghost':
      return '#a855f7'
    case 'rock':
      return '#fbbf24'
    case 'ground':
      return '#cbd5f5'
    case 'fairy':
      return '#fcd34d'
    case 'poison':
      return '#c084fc'
    case 'bug':
      return '#65a30d'
    case 'ice':
      return '#6ee7b7'
    default:
      return '#9ca3af'
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function LogEntryItem({ entry, isNew }: { entry: LogEntry; isNew: boolean }) {
  const typeColor = getTypeColor(entry.type)
  return (
    <div
      className={`
        texture-noise flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg
        bg-[var(--color-surface-base)]/50 transition-all duration-300
        ${isNew ? 'animate-slide-up' : ''}
        ${entry.highlight ? 'ring-1 ring-yellow-500/40' : ''}
      `}
    >
      <span className="shrink-0 text-sm">{entry.icon}</span>
      <div className="flex-1 min-w-0">
        <span className={`${typeColor}`}>{entry.message}</span>
        {entry.moveName && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
            <span className="text-[#a0a0c0]">Move:</span>
            <span className="font-medium text-white">{entry.moveName}</span>
            {entry.moveType && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ backgroundColor: getMoveTypeColor(entry.moveType) }}
              >
                {entry.moveType}
              </span>
            )}
          </div>
        )}
        {entry.value && (
          <div className="text-[10px] text-white/70 mt-0.5">{entry.value}</div>
        )}
      </div>
      <span className="text-[var(--color-text-muted)] text-[10px] shrink-0">{formatTime(entry.timestamp)}</span>
    </div>
  )
}

export function WorldLog({ entries, maxEntries = 50, className = '' }: WorldLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Track if user is at bottom
  const handleScroll = () => {
    if (!logRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = logRef.current
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 20
  }

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (isAtBottomRef.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [entries])

  const displayEntries = entries.slice(-maxEntries)

  return (
    <div
      ref={logRef}
      onScroll={handleScroll}
      className={`flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin ${className}`}
    >
      {displayEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-[var(--color-text-muted)] text-sm">
          <span className="text-xl mb-1">📋</span>
          <p>No activity yet</p>
          <p className="text-xs">Events will appear here</p>
        </div>
      ) : (
        displayEntries.map((entry, index) => (
          <LogEntryItem
            key={entry.id}
            entry={entry}
            isNew={index === displayEntries.length - 1}
          />
        ))
      )}
    </div>
  )
}

// Helper to create log entries from game events
export function createLogEntry(
  type: LogEntry['type'],
  message: string,
  icon?: string
): LogEntry {
  const defaultIcons: Record<LogEntry['type'], string> = {
    catch: '🎯',
    battle: '⚔️',
    levelup: '⬆️',
    evolution: '✨',
    item: '🎁',
    travel: '🚶',
    system: '📢',
  }

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date(),
    type,
    message,
    icon: icon || defaultIcons[type],
  }
}
