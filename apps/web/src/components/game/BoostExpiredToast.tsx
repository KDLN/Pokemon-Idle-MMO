'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import type { GuildBuffType } from '@pokemon-idle/shared'

const BUFF_NAMES: Record<GuildBuffType, string> = {
  xp_bonus: 'XP Boost',
  catch_rate: 'Catch Rate Boost',
  encounter_rate: 'Encounter Boost'
}

export function BoostExpiredToast() {
  const expiredBoosts = useGameStore((state) => state.expiredBoosts)
  const clearExpiredBoosts = useGameStore((state) => state.clearExpiredBoosts)

  useEffect(() => {
    if (expiredBoosts.length > 0) {
      const timer = setTimeout(() => {
        clearExpiredBoosts()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [expiredBoosts, clearExpiredBoosts])

  if (expiredBoosts.length === 0) return null

  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-4 z-50 flex flex-col gap-2 sm:w-72">
      {expiredBoosts.map((buffType, index) => (
        <div
          key={`${buffType}-${index}`}
          className="relative overflow-hidden rounded-xl animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Background with red gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/80 via-red-600/80 to-red-500/80" />

          {/* Dark inner panel */}
          <div className="relative m-0.5 rounded-[10px] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400">{'\u23F0'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-xs text-red-400 tracking-wider">
                  BOOST EXPIRED
                </div>
                <div className="text-white text-sm truncate">
                  {BUFF_NAMES[buffType] || buffType}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
