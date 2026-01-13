'use client'

import { useState } from 'react'
import { GYM_BADGES, type GymBadge } from '@/lib/badges/badges'

interface BadgeCaseProps {
  earnedBadges: string[]
  compact?: boolean
}

function BadgeIcon({ badge, earned, size = 'md' }: { badge: GymBadge; earned: boolean; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'

  const renderShape = () => {
    const baseColor = earned ? badge.color : '#404060'
    const glowColor = earned ? `${badge.color}60` : 'transparent'

    switch (badge.shape) {
      case 'octagon':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <polygon
              points="7,2 17,2 22,7 22,17 17,22 7,22 2,17 2,7"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
            {earned && (
              <polygon
                points="7,2 17,2 22,7 22,17 17,22 7,22 2,17 2,7"
                fill="url(#shine)"
                opacity="0.3"
              />
            )}
          </svg>
        )

      case 'drop':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <path
              d="M12 2 C12 2 4 10 4 15 C4 19.4 7.6 22 12 22 C16.4 22 20 19.4 20 15 C20 10 12 2 12 2Z"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )

      case 'leaf':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <path
              d="M12 2 C6 6 4 12 4 16 C4 20 8 22 12 22 C16 22 20 20 20 16 C20 12 18 6 12 2Z"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
            <path
              d="M12 8 L12 18 M8 12 L16 12"
              stroke={earned ? '#fff' : '#808090'}
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>
        )

      case 'heart':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <path
              d="M12 21 C12 21 3 14 3 8.5 C3 5.5 5.5 3 8.5 3 C10.5 3 12 4 12 4 C12 4 13.5 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 14 12 21 12 21Z"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )

      case 'hexagon':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <polygon
              points="12,2 21,7 21,17 12,22 3,17 3,7"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )

      case 'diamond':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <polygon
              points="12,2 22,12 12,22 2,12"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )

      case 'star':
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <polygon
              points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )

      default: // circle
        return (
          <svg viewBox="0 0 24 24" className={sizeClasses}>
            <circle
              cx="12"
              cy="12"
              r="10"
              fill={baseColor}
              stroke={earned ? '#fff' : '#606080'}
              strokeWidth="1"
            />
          </svg>
        )
    }
  }

  return (
    <div
      className={`
        relative transition-all duration-200
        ${earned ? 'opacity-100 drop-shadow-lg' : 'opacity-40 grayscale'}
        ${earned ? 'hover:scale-110 cursor-pointer' : ''}
      `}
      title={`${badge.name} - ${badge.gym}${earned ? ' (Earned)' : ' (Locked)'}`}
      style={{
        filter: earned ? `drop-shadow(0 0 4px ${badge.color}80)` : 'none',
      }}
    >
      {renderShape()}
      {earned && (
        <div
          className="absolute inset-0 animate-pulse rounded-full"
          style={{
            background: `radial-gradient(circle, ${badge.color}20 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  )
}

export function BadgeCase({ earnedBadges, compact = false }: BadgeCaseProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const earnedCount = earnedBadges.length

  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative flex items-center gap-2 bg-[#1a1a2e] px-3 py-1.5 rounded-lg border border-[#2a2a4a] hover:border-[#3a3a6a] transition-colors"
      >
        <span className="text-sm">🏆</span>
        <span className="text-white text-sm font-medium">{earnedCount}/8</span>

        {/* Expanded dropdown */}
        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-xl z-50 min-w-[200px]">
            <div className="text-xs text-[#606080] mb-2 font-medium">Badge Case</div>
            <div className="grid grid-cols-4 gap-2">
              {GYM_BADGES.map((badge) => (
                <BadgeIcon
                  key={badge.id}
                  badge={badge}
                  earned={earnedBadges.includes(badge.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {GYM_BADGES.map((badge) => (
        <BadgeIcon
          key={badge.id}
          badge={badge}
          earned={earnedBadges.includes(badge.id)}
          size="sm"
        />
      ))}
    </div>
  )
}
