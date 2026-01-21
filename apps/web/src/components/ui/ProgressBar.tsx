'use client'

import { cn } from '@/lib/ui'

interface ProgressBarProps {
  value: number
  max: number
  variant?: 'hp' | 'xp' | 'season' | 'default'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max,
  variant = 'default',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const getBarColorClass = () => {
    if (variant === 'hp') {
      // HP color thresholds: >50% green, 30-50% yellow, <30% red
      if (percentage > 50) return 'bg-[var(--color-success)]'
      if (percentage >= 30) return 'bg-[var(--color-warning)]'
      return 'bg-[var(--color-error)]'
    }
    if (variant === 'xp') {
      return 'bg-gradient-to-r from-[#5B6EEA] to-[#3B4CCA]'
    }
    if (variant === 'season') {
      return 'bg-gradient-to-r from-[#B3A125] to-[#FFDE00]'
    }
    return 'bg-gradient-to-r from-[#3B4CCA] to-[#5B6EEA]'
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-[#606080] font-medium uppercase">
            {variant === 'hp' ? 'HP' : variant === 'xp' ? 'EXP' : ''}
          </span>
          <span className="text-[#a0a0c0] font-mono">
            {value}<span className="text-[#606080]">/{max}</span>
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-[#1a1a2e] border border-[#2a2a4a] overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            getBarColorClass()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// HP Bar with automatic coloring
interface HPBarProps {
  current: number
  max: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function HPBar({ current, max, ...props }: HPBarProps) {
  return <ProgressBar value={current} max={max} variant="hp" {...props} />
}

// XP Bar
interface XPBarProps {
  current: number
  needed: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function XPBar({ current, needed, ...props }: XPBarProps) {
  return <ProgressBar value={current} max={needed} variant="xp" {...props} />
}
