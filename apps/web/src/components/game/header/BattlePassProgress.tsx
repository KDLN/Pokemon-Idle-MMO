'use client'

import { useState } from 'react'

interface SeasonProgress {
  current: number
  goal: number
  tier: number
  maxTier: number
  seasonName: string
  daysRemaining: number
}

interface BattlePassProgressProps {
  progress?: SeasonProgress
  compact?: boolean
}

const DEFAULT_PROGRESS: SeasonProgress = {
  current: 0,
  goal: 1000,
  tier: 1,
  maxTier: 50,
  seasonName: 'Season 1',
  daysRemaining: 30,
}

export function BattlePassProgress({
  progress = DEFAULT_PROGRESS,
  compact = false,
}: BattlePassProgressProps) {
  const [showDetails, setShowDetails] = useState(false)
  const percentage = Math.min((progress.current / progress.goal) * 100, 100)

  if (compact) {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="relative flex items-center gap-2 bg-[#1a1a2e] px-3 py-1.5 rounded-lg border border-[#2a2a4a] hover:border-[#3a3a6a] transition-colors"
      >
        <span className="text-sm">🎫</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Tier {progress.tier}</span>
          <div className="w-16 h-1.5 bg-[#2a2a4a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Expanded dropdown */}
        {showDetails && (
          <div
            className="absolute top-full right-0 mt-2 p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-xl z-50 min-w-[240px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-pixel text-xs text-[#a0a0c0]">{progress.seasonName}</div>
              <div className="text-xs text-[#606080]">{progress.daysRemaining} days left</div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {progress.tier}
              </div>
              <div>
                <div className="text-white font-semibold">Tier {progress.tier}</div>
                <div className="text-xs text-[#606080]">
                  {progress.current}/{progress.goal} XP to next tier
                </div>
              </div>
            </div>

            <div className="season-bar mb-2">
              <div
                className="season-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-[#606080]">
              <span>Current: Tier {progress.tier}</span>
              <span>Max: Tier {progress.maxTier}</span>
            </div>

            {/* Upcoming rewards preview */}
            <div className="mt-3 pt-3 border-t border-[#2a2a4a]">
              <div className="text-xs text-[#606080] mb-2">Next Rewards</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#252542] rounded-lg p-2 text-center">
                  <div className="text-lg mb-1">🎁</div>
                  <div className="text-xs text-white">Mystery Box</div>
                </div>
                <div className="flex-1 bg-[#252542] rounded-lg p-2 text-center">
                  <div className="text-lg mb-1">💰</div>
                  <div className="text-xs text-white">500 BP</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#252542] px-4 py-2 rounded-lg border border-[#2a2a4a]">
      {/* Tier badge */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
        {progress.tier}
      </div>

      {/* Progress info */}
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-[#a0a0c0] font-medium">{progress.seasonName}</span>
          <span className="text-xs text-[#606080]">
            {progress.current}/{progress.goal}
          </span>
        </div>
        <div className="season-bar">
          <div
            className="season-bar-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Days remaining */}
      <div className="text-center px-2">
        <div className="text-lg font-bold text-white">{progress.daysRemaining}</div>
        <div className="text-[10px] text-[#606080]">days</div>
      </div>
    </div>
  )
}
