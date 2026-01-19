'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildBankPokemon } from '@pokemon-idle/shared'

type ViewMode = 'grid' | 'list' | 'card'

// Type colors for badges
const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-400',
  fighting: 'bg-orange-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-700',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-700',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
}

// Point cost tier colors
const POINT_TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400',    // Common
  2: 'text-green-400',   // Uncommon
  5: 'text-blue-400',    // Rare
  10: 'text-purple-400', // Very Rare
  25: 'text-yellow-400', // Legendary
}

export function BankPokemonTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedPokemon, setSelectedPokemon] = useState<GuildBankPokemon | null>(null)
  const [selectedOwnPokemon, setSelectedOwnPokemon] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const guildBank = useGameStore((state) => state.guildBank)
  const myPokemon = useGameStore((state) => state.box)
  const myGuildRole = useGameStore((state) => state.myGuildRole)
  const myBankLimits = useGameStore((state) => state.myBankLimits)

  const canWithdraw = myGuildRole === 'leader' || myGuildRole === 'officer'
  const remainingPoints = myBankLimits?.pokemon_points ?? -1

  // Filter bank Pokemon
  const filteredBankPokemon = useMemo(() => {
    if (!guildBank) return []
    return guildBank.pokemon.filter((p) => {
      if (searchQuery && !p.species_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
  }, [guildBank, searchQuery])

  // Get depositable Pokemon (not in party, owned by player)
  const depositablePokemon = useMemo(() => {
    if (!myPokemon) return []
    return myPokemon.filter((p) => p.party_slot === null)
  }, [myPokemon])

  const handleDeposit = () => {
    if (!selectedOwnPokemon) return
    gameSocket.depositPokemon(selectedOwnPokemon)
    setSelectedOwnPokemon(null)
  }

  const handleWithdraw = () => {
    if (!selectedPokemon || !canWithdraw) return
    if (remainingPoints !== -1 && selectedPokemon.point_cost > remainingPoints) return
    gameSocket.withdrawPokemon(selectedPokemon.pokemon_id)
    setSelectedPokemon(null)
  }

  const handleRequest = () => {
    if (!selectedPokemon) return
    gameSocket.createBankRequest('pokemon', {
      pokemon_id: selectedPokemon.pokemon_id,
      pokemon_name: selectedPokemon.nickname || selectedPokemon.species_name,
      pokemon_level: selectedPokemon.level
    })
    setSelectedPokemon(null)
  }

  const getPointColor = (points: number) => {
    return POINT_TIER_COLORS[points] || 'text-white'
  }

  if (!guildBank) return null

  const { pokemon_slots } = guildBank

  return (
    <div className="flex flex-col h-full">
      {/* Header with view toggle and slot info */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            Slots: <span className="text-white">{pokemon_slots.used}</span>
            <span className="text-slate-500">/{pokemon_slots.max}</span>
          </div>
          {myGuildRole === 'leader' && (
            <button
              onClick={() => gameSocket.expandPokemonSlots()}
              className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded"
            >
              Expand (+10 for {pokemon_slots.next_expansion_price.toLocaleString()})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white placeholder-slate-400 w-32"
          />

          {/* View Mode Toggle */}
          <div className="flex bg-slate-700 rounded overflow-hidden">
            {(['grid', 'list', 'card'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs capitalize ${
                  viewMode === mode
                    ? 'bg-yellow-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bank Pokemon (Left) */}
        <div className="w-1/2 border-r border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            Guild Bank Pokemon
            {canWithdraw && remainingPoints !== -1 && (
              <span className="ml-2 text-xs text-slate-500">
                (Daily points: {remainingPoints} remaining)
              </span>
            )}
          </h3>

          {viewMode === 'grid' && (
            <div className="grid grid-cols-4 gap-2">
              {filteredBankPokemon.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => setSelectedPokemon(pokemon)}
                  className={`p-2 rounded-lg text-center transition-colors relative ${
                    selectedPokemon?.id === pokemon.id
                      ? 'bg-yellow-500/20 border-2 border-yellow-400'
                      : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                  }`}
                >
                  {pokemon.is_shiny && (
                    <span className="absolute top-1 right-1 text-yellow-400 text-xs">*</span>
                  )}
                  <div className="text-xs text-white truncate">
                    {pokemon.nickname || pokemon.species_name}
                  </div>
                  <div className="text-xs text-slate-400">Lv.{pokemon.level}</div>
                  <div className={`text-xs ${getPointColor(pokemon.point_cost)}`}>
                    {pokemon.point_cost}pt
                  </div>
                </button>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-1">
              {filteredBankPokemon.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => setSelectedPokemon(pokemon)}
                  className={`w-full p-2 rounded flex items-center justify-between ${
                    selectedPokemon?.id === pokemon.id
                      ? 'bg-yellow-500/20 border border-yellow-400'
                      : 'bg-slate-700 hover:bg-slate-600 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pokemon.is_shiny && <span className="text-yellow-400">*</span>}
                    <span className="text-white">{pokemon.nickname || pokemon.species_name}</span>
                    <span className="text-slate-400 text-sm">Lv.{pokemon.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getPointColor(pokemon.point_cost)}`}>
                      {pokemon.point_cost}pt
                    </span>
                    <span className="text-xs text-slate-500">
                      by {pokemon.deposited_by_username || 'Unknown'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {viewMode === 'card' && (
            <div className="grid grid-cols-2 gap-3">
              {filteredBankPokemon.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => setSelectedPokemon(pokemon)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    selectedPokemon?.id === pokemon.id
                      ? 'bg-yellow-500/20 border-2 border-yellow-400'
                      : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">
                      {pokemon.is_shiny && <span className="text-yellow-400 mr-1">*</span>}
                      {pokemon.nickname || pokemon.species_name}
                    </span>
                    <span className={`text-sm font-bold ${getPointColor(pokemon.point_cost)}`}>
                      {pokemon.point_cost}pt
                    </span>
                  </div>
                  <div className="text-sm text-slate-400">Level {pokemon.level}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Deposited by {pokemon.deposited_by_username || 'Unknown'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(pokemon.deposited_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredBankPokemon.length === 0 && (
            <p className="text-slate-500 text-center py-8">No Pokemon in bank</p>
          )}
        </div>

        {/* Player's Pokemon (Right) */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Your Pokemon (Box)</h3>

          <div className="grid grid-cols-3 gap-2">
            {depositablePokemon.map((pokemon) => (
              <button
                key={pokemon.id}
                onClick={() => setSelectedOwnPokemon(pokemon.id)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  selectedOwnPokemon === pokemon.id
                    ? 'bg-green-500/20 border-2 border-green-400'
                    : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                }`}
              >
                {pokemon.is_shiny && (
                  <span className="text-yellow-400 text-xs">*</span>
                )}
                <div className="text-xs text-white truncate">
                  {pokemon.nickname || pokemon.species?.name || `Pokemon #${pokemon.species_id}`}
                </div>
                <div className="text-xs text-slate-400">Lv.{pokemon.level}</div>
              </button>
            ))}
          </div>

          {depositablePokemon.length === 0 && (
            <p className="text-slate-500 text-center py-8">No Pokemon available to deposit</p>
          )}
        </div>
      </div>

      {/* Action Panel */}
      {(selectedPokemon || selectedOwnPokemon) && (
        <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800 flex items-center justify-between">
          {selectedOwnPokemon ? (
            <>
              <span className="text-slate-400">
                Selected from your box
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDeposit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
                >
                  Deposit to Bank
                </button>
                <button
                  onClick={() => setSelectedOwnPokemon(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : selectedPokemon && (
            <>
              <div>
                <span className="text-white font-medium">
                  {selectedPokemon.nickname || selectedPokemon.species_name}
                </span>
                <span className="text-slate-400 ml-2">Lv.{selectedPokemon.level}</span>
                <span className={`ml-2 ${getPointColor(selectedPokemon.point_cost)}`}>
                  {selectedPokemon.point_cost} points
                </span>
              </div>
              <div className="flex gap-2">
                {canWithdraw ? (
                  <button
                    onClick={handleWithdraw}
                    disabled={remainingPoints !== -1 && selectedPokemon.point_cost > remainingPoints}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 disabled:text-slate-500 text-white rounded font-medium"
                  >
                    Withdraw
                  </button>
                ) : (
                  <button
                    onClick={handleRequest}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Request
                  </button>
                )}
                <button
                  onClick={() => setSelectedPokemon(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
