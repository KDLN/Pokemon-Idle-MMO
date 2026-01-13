'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'

export function LevelUpToast() {
  const pendingLevelUps = useGameStore((state) => state.pendingLevelUps)
  const clearPendingLevelUps = useGameStore((state) => state.clearPendingLevelUps)

  useEffect(() => {
    if (pendingLevelUps.length > 0) {
      // Auto-clear after showing
      const timer = setTimeout(() => {
        clearPendingLevelUps()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [pendingLevelUps, clearPendingLevelUps])

  if (pendingLevelUps.length === 0) {
    return null
  }

  return (
    <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 sm:gap-3 sm:w-80">
      {pendingLevelUps.map((levelUp, index) => (
        <div
          key={`${levelUp.pokemon_id}-${levelUp.new_level}-${index}`}
          className="relative overflow-hidden rounded-xl animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Background with gold gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFDE00] via-[#F8D030] to-[#FFDE00]" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 animate-shimmer opacity-50" />

          {/* Dark inner panel */}
          <div className="relative m-0.5 rounded-[10px] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Level up icon */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-[#FFDE00] animate-pulse opacity-30" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFDE00]/20 to-[#F8D030]/10 border border-[#FFDE00]/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FFDE00]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
                  </svg>
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-[#FFDE00] tracking-wider">
                    LEVEL UP!
                  </span>
                </div>
                <div className="text-white font-semibold truncate">
                  {levelUp.pokemon_name}
                </div>
              </div>

              {/* Level badge */}
              <div className="flex-shrink-0">
                <div className="px-3 py-1.5 rounded-lg bg-[#FFDE00]/10 border border-[#FFDE00]/30">
                  <div className="text-[10px] text-[#FFDE00]/70 text-center">LV</div>
                  <div className="font-pixel text-sm text-[#FFDE00] text-center">
                    {levelUp.new_level}
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkle decorations */}
            <div className="absolute top-1 right-12 text-[#FFDE00] text-xs animate-sparkle">✦</div>
            <div className="absolute bottom-1 left-16 text-[#FFDE00] text-xs animate-sparkle delay-200">✦</div>
          </div>
        </div>
      ))}
    </div>
  )
}
