'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function QuestHistoryTab() {
  const [page, setPage] = useState(1)
  const limit = 20

  const history = useGameStore((state) => state.guildQuestHistory)

  useEffect(() => {
    gameSocket.getQuestHistory({ page, limit })
  }, [page])

  if (!history) {
    return <div className="p-4 text-slate-400">Loading history...</div>
  }

  const totalPages = Math.ceil(history.total / limit)

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'catch_pokemon': return '🎣'
      case 'catch_type': return '🔮'
      case 'battle': return '⚔️'
      case 'evolve': return '✨'
      default: return '📋'
    }
  }

  return (
    <div className="p-4 overflow-auto h-full">
      {history.history.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No quest history yet</p>
      ) : (
        <div className="space-y-2">
          {history.history.map((quest) => (
            <div
              key={quest.id}
              className={`p-3 rounded border ${
                quest.was_completed
                  ? 'bg-green-900/20 border-green-700/30'
                  : 'bg-red-900/20 border-red-700/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{getQuestIcon(quest.quest_type)}</span>
                  <span className={`text-sm ${quest.was_completed ? 'text-green-400' : 'text-red-400'}`}>
                    {quest.description}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(quest.archived_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>
                  {quest.final_progress}/{quest.target_count} ({quest.period})
                </span>
                {quest.was_completed && quest.reward_currency && (
                  <span className="text-yellow-400">+{quest.reward_currency} currency</span>
                )}
              </div>
              {quest.top_contributors.length > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  Top: {quest.top_contributors.map(c => c.username).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-slate-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-slate-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
