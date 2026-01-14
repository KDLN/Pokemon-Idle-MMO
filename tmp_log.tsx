'use client'

import { useEffect, useRef } from 'react'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'catch' | 'battle' | 'levelup' | 'item' | 'travel' | 'system'
  message: string
  icon: string
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
        relative w-full rounded-2xl overflow-hidden border transition-all duration-300
        ${isNew ? 'animate-slide-up shadow-lg' : 'hover:shadow-[0_0_25px_rgba(91,110,234,0.2)]'}
        ${entry.highlight ? 'border-yellow-500/40' : 'border-[#1a1a2e]'}
      `}
    >
      <div
        className="absolute inset-0 opacity-0 animate-log-pulse"
        style={{ background: `${typeColor}11` }}
      />
      <div className="relative flex items-center gap-3 px-3 py-2 bg-[#0f0f1a]/90">
        <div className="flex flex-col text-[10px] text-[#606080]">
          <span>{formatTime(entry.timestamp)}</span>
          <span className="tracking-wider uppercase">LOG</span>
        </div>
        <div className="text-lg">{entry.icon}</div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-sm font-semibold text-white">{entry.message}</div>
          {entry.moveName && (
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
              <span className="text-xs text-[#a0a0c0]">Move:</span>
              <span className="font-bold text-white">{entry.moveName}</span>
              {entry.moveType && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: getTypeColor(entry.moveType) }}
                >
                  {entry.moveType}
                </span>
              )}
            </div>
          )}
          {entry.value && (
            <div className="text-[10px] text-white/70">{entry.value}</div>
          )}
        </div>
      </div>
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
    <div className={`poke-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
        <h3 className="text-white text-sm font-semibold flex items-center gap-2">
          <span>📜</span>
          <span>Activity Log</span>
        </h3>
        <span className="text-xs text-[#606080]">{entries.length} events</span>
      </div>

      {/* Log entries */}
      <div
        ref={logRef}
        onScroll={handleScroll}
        className="h-32 overflow-y-auto px-1 py-1 space-y-0.5 scrollbar-thin"
      >
        {displayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#606080] text-sm">
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
