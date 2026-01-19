'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { BankAction, BankCategory } from '@pokemon-idle/shared'

const ACTION_LABELS: Record<BankAction, string> = {
  deposit: 'Deposited',
  withdraw: 'Withdrew',
  request_created: 'Requested',
  request_fulfilled: 'Fulfilled',
  request_expired: 'Request Expired',
  request_cancelled: 'Cancelled',
}

const ACTION_COLORS: Record<BankAction, string> = {
  deposit: 'text-green-400',
  withdraw: 'text-orange-400',
  request_created: 'text-blue-400',
  request_fulfilled: 'text-purple-400',
  request_expired: 'text-gray-500',
  request_cancelled: 'text-red-400',
}

const CATEGORY_ICONS: Record<BankCategory, string> = {
  currency: '$',
  item: '*',
  pokemon: 'P',
}

export function BankLogsTab() {
  const [page, setPage] = useState(1)
  const [filterPlayer, setFilterPlayer] = useState('')
  const [filterAction, setFilterAction] = useState<BankAction | ''>('')
  const [filterCategory, setFilterCategory] = useState<BankCategory | ''>('')

  const logs = useGameStore((state) => state.guildBankLogs)
  const total = useGameStore((state) => state.guildBankLogsTotal)
  const myGuildRole = useGameStore((state) => state.myGuildRole)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const isOfficerOrLeader = myGuildRole === 'leader' || myGuildRole === 'officer'

  useEffect(() => {
    gameSocket.getBankLogs({
      page,
      limit,
      filterPlayer: filterPlayer || undefined,
      filterAction: filterAction || undefined,
      filterCategory: filterCategory || undefined,
    })
  }, [page, filterPlayer, filterAction, filterCategory])

  const formatDetails = (log: typeof logs[0]) => {
    const { details, category } = log
    if (category === 'currency' && details.amount) {
      return `${details.amount.toLocaleString()} currency`
    }
    if (category === 'item' && details.item_name) {
      return `${details.quantity || 1}x ${details.item_name}`
    }
    if (category === 'pokemon' && details.pokemon_name) {
      return `${details.pokemon_name} Lv.${details.pokemon_level}`
    }
    return JSON.stringify(details)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-slate-700 flex gap-4 flex-wrap">
        {isOfficerOrLeader && (
          <input
            type="text"
            value={filterPlayer}
            onChange={(e) => { setFilterPlayer(e.target.value); setPage(1) }}
            placeholder="Filter by player..."
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-400"
          />
        )}

        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value as BankAction | ''); setPage(1) }}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Actions</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
          <option value="request_created">Requests</option>
          <option value="request_fulfilled">Fulfilled</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value as BankCategory | ''); setPage(1) }}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Categories</option>
          <option value="currency">Currency</option>
          <option value="item">Items</option>
          <option value="pokemon">Pokemon</option>
        </select>

        <div className="ml-auto text-sm text-slate-400">
          {total} entries
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-xs text-slate-300">
                  {CATEGORY_ICONS[log.category]}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{log.player_username}</span>
                    <span className={ACTION_COLORS[log.action]}>
                      {ACTION_LABELS[log.action]}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {formatDetails(log)}
                    {log.balance_after !== null && (
                      <span className="text-slate-500 ml-2">
                        (Balance: {log.balance_after.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-slate-500 text-center py-8">No log entries</p>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 p-4 border-t border-slate-700 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm text-white"
          >
            Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded text-sm ${
                    page === pageNum
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
