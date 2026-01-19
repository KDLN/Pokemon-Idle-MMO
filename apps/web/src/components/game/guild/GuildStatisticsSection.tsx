'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function GuildStatisticsSection() {
  const guildStatistics = useGameStore((state) => state.guildStatistics)
  const guild = useGameStore((state) => state.guild)

  useEffect(() => {
    if (guild) {
      gameSocket.sendGetGuildStatistics()
    }
  }, [guild])

  if (!guildStatistics) return null

  const stats = [
    { label: 'Total Catches', value: guildStatistics.total_catches.toLocaleString() },
    { label: 'Unique Species', value: guildStatistics.unique_species.toString() },
    { label: 'Members', value: guildStatistics.member_count.toString() },
    { label: 'Avg Level', value: guildStatistics.avg_level.toFixed(1) },
    { label: 'Days Active', value: guildStatistics.days_active.toString() },
    { label: 'Guild Points', value: guildStatistics.guild_points.toLocaleString() }
  ]

  return (
    <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
      <h4 className="text-white font-semibold mb-2 text-sm">Guild Statistics</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between">
            <span className="text-gray-400">{stat.label}</span>
            <span className="text-white font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
