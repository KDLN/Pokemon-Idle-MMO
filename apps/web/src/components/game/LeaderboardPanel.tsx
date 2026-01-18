'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { LeaderboardEntry, LeaderboardType, LeaderboardTimeframe } from '@/types/game'
import { getPokemonSpriteUrl } from '@/types/game'
import Image from 'next/image'

interface LeaderboardPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Trophy icon component
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

// Rank badge component for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="w-6 h-6 flex items-center justify-center text-lg">🥇</span>
  }
  if (rank === 2) {
    return <span className="w-6 h-6 flex items-center justify-center text-lg">🥈</span>
  }
  if (rank === 3) {
    return <span className="w-6 h-6 flex items-center justify-center text-lg">🥉</span>
  }
  return <span className="w-6 h-6 flex items-center justify-center text-sm text-[#606080]">#{rank}</span>
}

// Format value based on leaderboard type
function formatValue(value: number, type: LeaderboardType, entry?: LeaderboardEntry): string {
  switch (type) {
    case 'pokedex':
      return `${value}/151`
    case 'catches':
      return `${value.toLocaleString()} caught`
    case 'level':
      if (entry?.pokemon_name) {
        return `Lv. ${value} ${entry.pokemon_name}`
      }
      return `Lv. ${value}`
    default:
      return String(value)
  }
}

// Leaderboard entry row
function LeaderboardRow({
  entry,
  type,
  isCurrentPlayer
}: {
  entry: LeaderboardEntry
  type: LeaderboardType
  isCurrentPlayer: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 transition-colors ${
        isCurrentPlayer
          ? 'bg-[#5B6EEA]/20 border-l-2 border-[#5B6EEA]'
          : 'hover:bg-[#2a2a4a]/50'
      }`}
    >
      <RankBadge rank={entry.rank} />

      {/* Pokemon sprite for level leaderboard */}
      {type === 'level' && entry.pokemon_species_id && (
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image
            src={getPokemonSpriteUrl(entry.pokemon_species_id)}
            alt={entry.pokemon_name || 'Pokemon'}
            fill
            className="object-contain pixelated"
            unoptimized
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isCurrentPlayer ? 'text-white font-semibold' : 'text-[#a0a0c0]'}`}>
          {entry.username}
          {isCurrentPlayer && <span className="ml-1 text-xs text-[#5B6EEA]">(You)</span>}
        </p>
      </div>

      <div className="text-right">
        <p className={`text-sm ${isCurrentPlayer ? 'text-[#5B6EEA] font-semibold' : 'text-[#808090]'}`}>
          {formatValue(entry.value, type, entry)}
        </p>
      </div>
    </div>
  )
}

export function LeaderboardPanel({ isOpen, onClose }: LeaderboardPanelProps) {
  const player = useGameStore((state) => state.player)
  const entries = useGameStore((state) => state.leaderboardEntries)
  const leaderboardType = useGameStore((state) => state.leaderboardType)
  const leaderboardTimeframe = useGameStore((state) => state.leaderboardTimeframe)
  const playerRank = useGameStore((state) => state.leaderboardPlayerRank)
  const loading = useGameStore((state) => state.leaderboardLoading)
  const isConnected = useGameStore((state) => state.isConnected)
  const setLeaderboardType = useGameStore((state) => state.setLeaderboardType)
  const setLeaderboardTimeframe = useGameStore((state) => state.setLeaderboardTimeframe)

  // Fetch leaderboard when opened or type/timeframe changes
  useEffect(() => {
    if (isConnected && isOpen) {
      gameSocket.getLeaderboard(leaderboardType, leaderboardTimeframe)
    }
  }, [isConnected, isOpen, leaderboardType, leaderboardTimeframe])

  // Check if current player is in the visible entries
  const isPlayerInList = entries.some((e) => e.player_id === player?.id)

  if (!isOpen) {
    return null
  }

  const tabs: { id: LeaderboardType; label: string }[] = [
    { id: 'pokedex', label: 'Pokedex' },
    { id: 'catches', label: 'Catches' },
    { id: 'level', label: 'Level' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 max-h-[80vh] bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a] bg-gradient-to-r from-[#3a2a1a] to-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-white font-semibold">Leaderboards</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#606080] hover:text-white transition-colors rounded hover:bg-[#2a2a4a]"
            title="Close"
            aria-label="Close leaderboard panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex border-b border-[#2a2a4a] bg-[#1a1a2e]">
          <button
            onClick={() => setLeaderboardTimeframe('alltime')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              leaderboardTimeframe === 'alltime'
                ? 'text-[#FFD700] bg-[#3a2a1a]'
                : 'text-[#606080] hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setLeaderboardTimeframe('weekly')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              leaderboardTimeframe === 'weekly'
                ? 'text-[#FFD700] bg-[#3a2a1a]'
                : 'text-[#606080] hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex border-b border-[#2a2a4a]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeaderboardType(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                leaderboardType === tab.id
                  ? 'text-[#FFD700] border-b-2 border-[#FFD700] bg-[#1a1a2e]'
                  : 'text-[#606080] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-[#606080]">
              <p className="text-sm">No data yet</p>
              <p className="text-xs mt-1">
                {leaderboardTimeframe === 'weekly' ? 'Start catching Pokemon this week!' : 'Be the first on the leaderboard!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a4a]/50">
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.player_id}
                  entry={entry}
                  type={leaderboardType}
                  isCurrentPlayer={entry.player_id === player?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Your Rank Footer (if not in visible list) */}
        {playerRank && !isPlayerInList && (
          <div className="border-t border-[#2a2a4a] bg-[#2a2a4a]/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#606080]">Your Rank:</span>
                <span className="text-sm font-semibold text-[#FFD700]">#{playerRank.rank}</span>
              </div>
              <span className="text-sm text-[#5B6EEA]">
                {formatValue(playerRank.value, leaderboardType)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
