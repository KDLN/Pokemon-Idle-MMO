'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { QuestCard } from './QuestCard'
import { QuestHistoryTab } from './QuestHistoryTab'

type QuestTab = 'active' | 'history'

interface GuildQuestsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuildQuestsModal({ isOpen, onClose }: GuildQuestsModalProps) {
  const [selectedTab, setSelectedTab] = useState<QuestTab>('active')
  const [isVisible, setIsVisible] = useState(false)

  const guildQuests = useGameStore((state) => state.guildQuests)
  const guild = useGameStore((state) => state.guild)
  const myGuildRole = useGameStore((state) => state.myGuildRole)

  // Animation and fetch on open
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      gameSocket.getGuildQuests()
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isVisible) return null

  const canReroll = myGuildRole === 'leader' || myGuildRole === 'officer'

  // Format countdown timer
  const formatTimeUntil = (timestamp: string) => {
    const target = new Date(timestamp).getTime()
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) return 'Resetting...'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 6) {
      return `${hours}h ${minutes}m`
    }
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-slate-800 rounded-lg border border-slate-600 shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Guild Quests</h2>
            {guild && (
              <p className="text-sm text-slate-400">[{guild.tag}] {guild.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'active'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Quests
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'history'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {selectedTab === 'history' ? (
            <QuestHistoryTab />
          ) : !guildQuests ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">Loading quests...</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Reroll status */}
              {canReroll && (
                <div className="flex gap-4 text-sm text-slate-400">
                  <span>
                    Daily rerolls: {guildQuests.reroll_status.daily_max - guildQuests.reroll_status.daily_used} remaining
                    ({guildQuests.reroll_status.daily_cost} currency each)
                  </span>
                  <span>
                    Weekly rerolls: {guildQuests.reroll_status.weekly_max - guildQuests.reroll_status.weekly_used} remaining
                    ({guildQuests.reroll_status.weekly_cost} currency each)
                  </span>
                </div>
              )}

              {/* Daily Quests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">Daily Quests</h3>
                  <span className="text-sm text-slate-400">
                    Resets in: {formatTimeUntil(guildQuests.reset_times.daily)}
                  </span>
                </div>
                <div className="grid gap-3">
                  {guildQuests.daily.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      canReroll={canReroll}
                      rerollCost={guildQuests.reroll_status.daily_cost}
                      rerollsRemaining={guildQuests.reroll_status.daily_max - guildQuests.reroll_status.daily_used}
                    />
                  ))}
                </div>
              </div>

              {/* Weekly Quests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">Weekly Quests</h3>
                  <span className="text-sm text-slate-400">
                    Resets in: {formatTimeUntil(guildQuests.reset_times.weekly)}
                  </span>
                </div>
                <div className="grid gap-3">
                  {guildQuests.weekly.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      canReroll={canReroll}
                      rerollCost={guildQuests.reroll_status.weekly_cost}
                      rerollsRemaining={guildQuests.reroll_status.weekly_max - guildQuests.reroll_status.weekly_used}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
