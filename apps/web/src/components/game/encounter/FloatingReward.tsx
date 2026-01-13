'use client'

import { useEffect, useState } from 'react'

interface FloatingRewardProps {
  type: 'exp' | 'money' | 'item'
  value: number | string
  onComplete?: () => void
}

export function FloatingReward({ type, value, onComplete }: FloatingRewardProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'exp':
        return '⭐'
      case 'money':
        return '$'
      case 'item':
        return '🎁'
      default:
        return ''
    }
  }

  const getColor = () => {
    switch (type) {
      case 'exp':
        return 'text-yellow-400'
      case 'money':
        return 'text-green-400'
      case 'item':
        return 'text-purple-400'
      default:
        return 'text-white'
    }
  }

  const getText = () => {
    switch (type) {
      case 'exp':
        return `+${value} EXP`
      case 'money':
        return `+$${value}`
      case 'item':
        return `${value}`
      default:
        return String(value)
    }
  }

  return (
    <div
      className={`
        absolute left-1/2 -translate-x-1/2
        font-pixel text-lg font-bold
        ${getColor()}
        animate-float-up-fade
        drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
        pointer-events-none
        whitespace-nowrap
      `}
      style={{
        top: '30%',
      }}
    >
      <span className="mr-1">{getIcon()}</span>
      {getText()}
    </div>
  )
}

interface FloatingRewardsContainerProps {
  rewards: Array<{
    id: string
    type: 'exp' | 'money' | 'item'
    value: number | string
  }>
  onRewardComplete?: (id: string) => void
}

export function FloatingRewardsContainer({
  rewards,
  onRewardComplete,
}: FloatingRewardsContainerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {rewards.map((reward, index) => (
        <div
          key={reward.id}
          style={{
            position: 'absolute',
            left: `${50 + (index - (rewards.length - 1) / 2) * 20}%`,
            animationDelay: `${index * 0.15}s`,
          }}
        >
          <FloatingReward
            type={reward.type}
            value={reward.value}
            onComplete={() => onRewardComplete?.(reward.id)}
          />
        </div>
      ))}
    </div>
  )
}
