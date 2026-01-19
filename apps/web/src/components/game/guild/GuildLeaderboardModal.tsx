'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { LeaderboardMetric } from '@pokemon-idle/shared'

interface GuildLeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
}

const METRICS: { value: LeaderboardMetric; label: string }[] = [
  { value: 'catches', label: 'Total Catches' },
  { value: 'pokedex', label: 'Unique Species' },
  { value: 'members', label: 'Member Count' }
]

export function GuildLeaderboardModal({ isOpen, onClose }: GuildLeaderboardModalProps) {
  const [metric, setMetric] = useState<LeaderboardMetric>('catches')
  const guildLeaderboard = useGameStore((state) => state.guildLeaderboard)

  useEffect(() => {
    if (isOpen) {
      gameSocket.sendGetGuildLeaderboard(metric)
    }
  }, [isOpen, metric])

  if (!isOpen) return null

  const entries = guildLeaderboard?.entries || []
  const myRank = guildLeaderboard?.myGuildRank

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Guild Leaderboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {METRICS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                metric === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {myRank && (
          <div className="bg-blue-900/30 border border-blue-700 rounded p-3 mb-4">
            <span className="text-blue-300 text-sm">Your Guild</span>
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">{myRank.guild_name}</span>
              <span className="text-yellow-400">#{myRank.rank} ({myRank.value.toLocaleString()})</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-2 rounded ${
                entry.rank <= 3 ? 'bg-gray-800' : 'bg-gray-800/50'
              }`}
            >
              <span className={`w-8 text-center font-bold ${
                entry.rank === 1 ? 'text-yellow-400' :
                entry.rank === 2 ? 'text-gray-300' :
                entry.rank === 3 ? 'text-amber-600' :
                'text-gray-500'
              }`}>
                #{entry.rank}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{entry.name}</span>
                  <span className="text-gray-500 text-sm">[{entry.tag}]</span>
                </div>
                <span className="text-gray-400 text-xs">Leader: {entry.leader_name}</span>
              </div>
              <span className="text-green-400 font-semibold">{entry.value.toLocaleString()}</span>
            </div>
          ))}

          {entries.length === 0 && (
            <p className="text-gray-400 text-center py-4">No guilds found</p>
          )}
        </div>
      </div>
    </div>
  )
}
