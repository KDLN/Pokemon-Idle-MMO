'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { fireConfettiAtElement } from '@/lib/confetti'
import type { GuildQuestWithContribution, QuestContribution } from '@pokemon-idle/shared'

interface QuestCardProps {
  quest: GuildQuestWithContribution
  canReroll: boolean
  rerollCost: number
  rerollsRemaining: number
}

export function QuestCard({ quest, canReroll, rerollCost, rerollsRemaining }: QuestCardProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [contributions, setContributions] = useState<QuestContribution[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [rerolling, setRerolling] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const questDetails = useGameStore((state) => state.guildQuestDetails)
  const guildBank = useGameStore((state) => state.guildBank)

  const progressPercent = Math.min(100, (quest.current_progress / quest.target_count) * 100)
  const isComplete = quest.is_completed

  // Listen for completion event to fire confetti
  useEffect(() => {
    const handleCompletion = (e: CustomEvent) => {
      if (e.detail.quest_id === quest.id && cardRef.current) {
        fireConfettiAtElement(cardRef.current)
      }
    }

    window.addEventListener('guild-quest-completed', handleCompletion as EventListener)
    return () => window.removeEventListener('guild-quest-completed', handleCompletion as EventListener)
  }, [quest.id])

  // Update contributions when details load
  useEffect(() => {
    if (questDetails?.id === quest.id) {
      setContributions(questDetails.contributions)
      setLoadingDetails(false)
    }
  }, [questDetails, quest.id])

  const handleToggleLeaderboard = () => {
    if (!showLeaderboard && contributions.length === 0) {
      setLoadingDetails(true)
      gameSocket.getQuestDetails(quest.id)
    }
    setShowLeaderboard(!showLeaderboard)
  }

  const handleReroll = () => {
    if (rerolling || isComplete) return
    setRerolling(true)
    gameSocket.rerollQuest(quest.id)
    // Reset after a delay (will be updated by WebSocket)
    setTimeout(() => setRerolling(false), 2000)
  }

  // Quest type icon
  const getQuestIcon = () => {
    switch (quest.quest_type) {
      case 'catch_pokemon':
        return '🎣'
      case 'catch_type':
        return '🔮'
      case 'battle':
        return '⚔️'
      case 'evolve':
        return '✨'
      default:
        return '📋'
    }
  }

  // Reward display
  const getRewardText = () => {
    const parts: string[] = []
    if (quest.reward_currency) parts.push(`${quest.reward_currency.toLocaleString()} currency`)
    if (quest.reward_guild_points) parts.push(`${quest.reward_guild_points} guild points`)
    if (quest.reward_item_id && quest.reward_item_quantity) {
      parts.push(`${quest.reward_item_quantity}x ${quest.reward_item_id}`)
    }
    return parts.join(' + ')
  }

  const canAffordReroll = guildBank && guildBank.currency.balance >= rerollCost

  return (
    <div
      ref={cardRef}
      className={`p-4 rounded-lg border transition-all ${
        isComplete
          ? 'bg-green-900/30 border-green-700/50 opacity-75'
          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getQuestIcon()}</span>
          <div>
            <h4 className={`font-medium ${isComplete ? 'line-through text-slate-400' : 'text-white'}`}>
              {quest.description}
            </h4>
            {quest.type_filter && (
              <span className="text-xs text-slate-400 capitalize">
                Type: {quest.type_filter}
              </span>
            )}
          </div>
        </div>

        {/* Reroll button (leaders/officers only) */}
        {canReroll && !isComplete && rerollsRemaining > 0 && (
          <button
            onClick={handleReroll}
            disabled={rerolling || !canAffordReroll}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              canAffordReroll
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
            title={canAffordReroll ? `Reroll (${rerollCost} currency)` : 'Not enough currency'}
          >
            {rerolling ? '...' : '🔄'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>
            {quest.current_progress.toLocaleString()} / {quest.target_count.toLocaleString()}
          </span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* My contribution */}
      <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
        <span>My contribution: {quest.my_contribution.toLocaleString()}</span>
        <span className="text-yellow-400">{getRewardText()}</span>
      </div>

      {/* Leaderboard toggle */}
      <button
        onClick={handleToggleLeaderboard}
        className="text-xs text-slate-400 hover:text-white transition-colors"
      >
        {showLeaderboard ? '▼ Hide contributors' : '▶ Show contributors'}
      </button>

      {/* Contribution leaderboard (expandable) */}
      {showLeaderboard && (
        <div className="mt-2 p-2 bg-slate-800 rounded">
          {loadingDetails ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : contributions.length === 0 ? (
            <p className="text-xs text-slate-400">No contributions yet</p>
          ) : (
            <div className="space-y-1">
              {contributions.slice(0, 10).map((c, i) => (
                <div key={c.player_id} className="flex justify-between text-xs">
                  <span className={i === 0 ? 'text-yellow-400' : 'text-slate-300'}>
                    {i + 1}. {c.username}
                  </span>
                  <span className="text-slate-400">{c.contribution.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completion badge */}
      {isComplete && (
        <div className="mt-2 text-center">
          <span className="text-green-400 text-sm font-medium">Complete!</span>
        </div>
      )}
    </div>
  )
}
