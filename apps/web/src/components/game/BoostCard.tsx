'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/ui/cn'
import type { GuildBuff } from '@pokemon-idle/shared'

// Buff type display names and descriptions
const BUFF_DISPLAY: Record<string, { name: string; description: string; icon: string }> = {
  xp_bonus: {
    name: 'XP Boost',
    description: 'Increases experience points gained from battles',
    icon: '\u2B50'  // star
  },
  catch_rate: {
    name: 'Catch Rate Boost',
    description: 'Increases the chance of catching wild Pokemon',
    icon: '\uD83C\uDFAF'  // target
  },
  encounter_rate: {
    name: 'Encounter Boost',
    description: 'Increases the rate of wild Pokemon encounters',
    icon: '\uD83D\uDC3E'  // paw prints
  }
}

interface BoostCardProps {
  buff: GuildBuff
  onExpire?: () => void
}

function formatCountdown(endTime: Date): { text: string; isUrgent: boolean } {
  const remainingMs = endTime.getTime() - Date.now()
  if (remainingMs <= 0) return { text: '0:00', isUrgent: true }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const isUrgent = remainingMs < 60000 // Under 1 minute

  if (hours > 0) {
    return {
      text: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      isUrgent
    }
  }

  return {
    text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    isUrgent
  }
}

export function BoostCard({ buff, onExpire }: BoostCardProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(new Date(buff.ends_at)))
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasExpired, setHasExpired] = useState(false)

  const display = BUFF_DISPLAY[buff.buff_type] || {
    name: buff.buff_type,
    description: 'Guild boost active',
    icon: '\u26A1'  // lightning
  }

  const multiplierPercent = Math.round((buff.multiplier - 1) * 100)

  useEffect(() => {
    const update = () => {
      const endTime = new Date(buff.ends_at)
      const remaining = endTime.getTime() - Date.now()

      if (remaining <= 0 && !hasExpired) {
        setHasExpired(true)
        onExpire?.()
        return
      }

      setCountdown(formatCountdown(endTime))
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [buff.ends_at, onExpire, hasExpired])

  if (hasExpired) return null

  return (
    <div
      className={cn(
        "texture-noise p-2.5 rounded-lg border transition-all duration-300",
        countdown.isUrgent
          ? "border-red-500/50 bg-red-500/10"
          : "bg-gradient-to-r from-purple-900/30 to-purple-800/20 border-purple-500/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{display.icon}</span>
          <div className="min-w-0">
            <span className="text-white font-medium text-sm truncate block">
              {display.name}
            </span>
            <span className="text-xs text-green-400">+{multiplierPercent}%</span>
          </div>
        </div>
        <span
          className={cn(
            "font-mono text-sm flex-shrink-0",
            countdown.isUrgent ? "text-red-400 animate-pulse" : "text-[#FFDE00]"
          )}
        >
          {countdown.text}
        </span>
      </div>

      {isExpanded && (
        <p className="text-xs text-[#a0a0c0] mt-2 pt-2 border-t border-[#2a2a4a]">
          {display.description}
          {buff.purchased_by_username && (
            <span className="block mt-1 text-[#606080]">
              Purchased by {buff.purchased_by_username}
            </span>
          )}
        </p>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-[#606080] hover:text-[#a0a0c0] mt-2 transition-colors"
      >
        {isExpanded ? 'Hide details' : 'Show details'}
      </button>
    </div>
  )
}
