'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { TradeHistoryEntry, TradeHistoryPokemon } from '@/types/trade'
import { cn } from '@/lib/ui'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function PokemonPill({ pokemon }: { pokemon: TradeHistoryPokemon }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
        pokemon.is_shiny
          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
          : "bg-[#2a2a4a] text-[#a0a0c0]"
      )}
      title={`Lv.${pokemon.level} ${pokemon.species_name}${pokemon.nickname ? ` (${pokemon.nickname})` : ''}`}
    >
      {pokemon.is_shiny && <span className="text-yellow-400">★</span>}
      <span className="truncate max-w-[80px]">
        {pokemon.nickname || pokemon.species_name}
      </span>
      <span className="text-[#606080]">Lv{pokemon.level}</span>
    </div>
  )
}

function TradeHistoryCard({ entry }: { entry: TradeHistoryEntry }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalGave = entry.my_pokemon.length
  const totalReceived = entry.their_pokemon.length

  return (
    <div className="rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-[#252542] transition-colors text-left"
      >
        {/* Trade icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {entry.partner_username}
            </span>
            <span className="text-xs text-[#606080]">
              {formatDate(entry.completed_at)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#808090]">
            <span className="text-red-400">-{totalGave}</span>
            <span>/</span>
            <span className="text-green-400">+{totalReceived}</span>
            <span className="text-[#606080]">Pokemon</span>
          </div>
        </div>

        {/* Expand icon */}
        <svg
          className={cn(
            "w-4 h-4 text-[#606080] transition-transform",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#2a2a4a] pt-3">
          {/* What I gave */}
          {entry.my_pokemon.length > 0 && (
            <div>
              <div className="text-xs text-red-400 mb-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
                Sent
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.my_pokemon.map((p) => (
                  <PokemonPill key={p.pokemon_id} pokemon={p} />
                ))}
              </div>
            </div>
          )}

          {/* What I received */}
          {entry.their_pokemon.length > 0 && (
            <div>
              <div className="text-xs text-green-400 mb-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
                Received
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.their_pokemon.map((p) => (
                  <PokemonPill key={p.pokemon_id} pokemon={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TradeHistoryProps {
  filterUsername?: string
  onFilterChange?: (username: string) => void
}

export function TradeHistory({ filterUsername = '', onFilterChange }: TradeHistoryProps) {
  const tradeHistory = useGameStore((state) => state.tradeHistory)
  const isLoading = useGameStore((state) => state.tradeHistoryLoading)
  const isConnected = useGameStore((state) => state.isConnected)
  const [localFilter, setLocalFilter] = useState(filterUsername)

  // Fetch trade history on mount and when filter changes
  useEffect(() => {
    if (isConnected) {
      gameSocket.getTradeHistory(50, localFilter || undefined)
    }
  }, [isConnected, localFilter])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange?.(localFilter)
    gameSocket.getTradeHistory(50, localFilter || undefined)
  }

  if (tradeHistory.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1a1a2e] border border-dashed border-[#2a2a4a] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2a2a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#606080] text-sm">No trade history</p>
        <p className="text-[#606080] text-xs mt-1">
          Complete trades to see them here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter input */}
      <form onSubmit={handleFilterSubmit} className="relative">
        <input
          type="text"
          value={localFilter}
          onChange={(e) => setLocalFilter(e.target.value)}
          placeholder="Filter by player..."
          className="w-full px-3 py-2 pl-8 text-sm bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-white placeholder-[#606080] focus:outline-none focus:border-[#3B4CCA]"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606080]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {localFilter && (
          <button
            type="button"
            onClick={() => {
              setLocalFilter('')
              onFilterChange?.('')
              gameSocket.getTradeHistory(50)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#606080] hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center py-4 text-[#606080] text-sm">
          Loading...
        </div>
      )}

      {/* Trade history list */}
      {!isLoading && (
        <div className="space-y-2">
          {tradeHistory.map((entry) => (
            <TradeHistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
