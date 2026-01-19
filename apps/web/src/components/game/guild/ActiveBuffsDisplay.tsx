'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function ActiveBuffsDisplay() {
  const guildActiveBuffs = useGameStore((state) => state.guildActiveBuffs)
  const guild = useGameStore((state) => state.guild)
  const [, setTick] = useState(0)

  // Refresh every minute to update timers
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch active buffs on mount if in guild
  useEffect(() => {
    if (guild) {
      gameSocket.sendGetActiveBuffs()
    }
  }, [guild])

  if (!guild || !guildActiveBuffs) return null

  const activeBuffs = [
    { key: 'xp_bonus', name: 'XP +10%', buff: guildActiveBuffs.xp_bonus, bgColor: 'bg-blue-900/50', borderColor: 'border-blue-700', textColor: 'text-blue-300' },
    { key: 'catch_rate', name: 'Catch +10%', buff: guildActiveBuffs.catch_rate, bgColor: 'bg-green-900/50', borderColor: 'border-green-700', textColor: 'text-green-300' },
    { key: 'encounter_rate', name: 'Encounter +10%', buff: guildActiveBuffs.encounter_rate, bgColor: 'bg-purple-900/50', borderColor: 'border-purple-700', textColor: 'text-purple-300' }
  ].filter((b) => b.buff && new Date(b.buff.ends_at).getTime() > Date.now())

  if (activeBuffs.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap mb-3">
      {activeBuffs.map(({ key, name, buff, bgColor, borderColor, textColor }) => {
        const remainingMs = new Date(buff!.ends_at).getTime() - Date.now()
        const hours = Math.floor(remainingMs / (1000 * 60 * 60))
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

        return (
          <div
            key={key}
            className={`px-2 py-1 rounded text-xs font-medium ${bgColor} border ${borderColor} ${textColor}`}
          >
            {name} ({hours}h {minutes}m)
          </div>
        )
      })}
    </div>
  )
}
