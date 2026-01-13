'use client'

import { useEffect, useRef } from 'react'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'catch' | 'battle' | 'levelup' | 'item' | 'travel' | 'system'
  message: string
  icon: string
  highlight?: boolean
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
  return (
    <div
      className={`
        flex items-start gap-2 py-1.5 px-2 rounded transition-all duration-300
        ${isNew ? 'bg-[#252542] animate-slide-up' : 'hover:bg-[#1a1a2e]'}
        ${entry.highlight ? 'bg-yellow-500/10 border-l-2 border-yellow-400' : ''}
      `}
    >
      {/* Timestamp */}
      <span className="text-[10px] text-[#606080] font-mono shrink-0 mt-0.5">
        {formatTime(entry.timestamp)}
      </span>

      {/* Icon */}
      <span className="text-sm shrink-0">{entry.icon}</span>

      {/* Message */}
      <span className={`text-sm ${getTypeColor(entry.type)} break-words`}>
        {entry.message}
      </span>
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
