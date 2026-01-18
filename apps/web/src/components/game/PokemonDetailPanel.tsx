'use client'

import { useState } from 'react'
import { getPokemonSpriteUrl } from '@/types/game'
import type { Pokemon } from '@/types/game'
import { getSpeciesData, cn } from '@/lib/ui'
import { TypeBadge, Badge } from '@/components/ui/Badge'
import { HPBar } from '@/components/ui/ProgressBar'
import { IVGradeBadge, IVGradeText } from './IVGradeBadge'
import { useGameStore } from '@/stores/gameStore'
import {
  getIVsFromPokemon,
  getIVColorClass,
  getIVBarColorClass,
  isPerfectIV,
  getTotalIVs,
  countPerfectIVs,
  getStatName,
  STAT_ORDER,
  type IVStats,
} from '@/lib/ivUtils'

interface PokemonDetailPanelProps {
  pokemon: Pokemon
  onClose: () => void
  isOpen: boolean
}

function IVBar({ value, label }: { value: number; label: string }) {
  const percentage = (value / 31) * 100
  const isPerfect = isPerfectIV(value)
  const colorClass = getIVColorClass(value)
  const barColorClass = getIVBarColorClass(value)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[10px] sm:text-xs font-mono w-8 text-right flex items-center justify-end gap-0.5',
          colorClass
        )}
      >
        {value}
        {isPerfect && (
          <svg
            className="w-3 h-3 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </span>
    </div>
  )
}

function StatRow({
  label,
  value,
  iv,
}: {
  label: string
  value: number
  iv: number
}) {
  const colorClass = getIVColorClass(iv)
  const isPerfect = isPerfectIV(iv)

  return (
    <div className="flex items-center justify-between py-1 border-b border-[#2a2a4a]/50 last:border-0">
      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] sm:text-xs text-white font-medium">
          {value}
        </span>
        <span
          className={cn(
            'text-[10px] sm:text-xs font-mono flex items-center gap-0.5',
            colorClass
          )}
        >
          [IV: {iv}]
          {isPerfect && (
            <svg
              className="w-3 h-3 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </span>
      </div>
    </div>
  )
}

export function PokemonDetailPanel({
  pokemon,
  onClose,
  isOpen,
}: PokemonDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'evs' | 'ivs'>('info')
  const player = useGameStore((state) => state.player)
  const speciesData = getSpeciesData(pokemon.species_id)
  const name = pokemon.nickname || speciesData.name
  const isShiny = pokemon.is_shiny || false
  const ivs = getIVsFromPokemon(pokemon)
  const totalIVs = getTotalIVs(pokemon)
  const perfectCount = countPerfectIVs(pokemon)

  // Format caught date if available
  const caughtDate = pokemon.caught_at
    ? new Date(pokemon.caught_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown'

  // Get original trainer name - use player's username if not specified (meaning it's theirs)
  const originalTrainer = pokemon.original_trainer || player?.username || 'Unknown'

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto">
        <div className="bg-[#1a1a2e] border-2 border-[#3a3a6a] rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div
            className="relative p-4 sm:p-6"
            style={{
              background: `linear-gradient(180deg, ${
                isShiny ? '#FFD700' : speciesData.color
              }33 0%, transparent 100%)`,
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 rounded-full bg-[#0f0f1a]/60 hover:bg-[#0f0f1a] text-[#a0a0c0] hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Pokemon sprite and basic info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={cn(
                    'absolute inset-0 blur-xl opacity-40 scale-75',
                    isShiny && 'animate-pulse'
                  )}
                  style={{
                    backgroundColor: isShiny ? '#FFD700' : speciesData.color,
                  }}
                />
                <img
                  src={getPokemonSpriteUrl(pokemon.species_id, isShiny)}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 pixelated relative z-10"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2
                    className={cn(
                      'text-lg sm:text-xl font-bold truncate',
                      isShiny ? 'text-yellow-300' : 'text-white'
                    )}
                  >
                    {name}
                  </h2>
                  <IVGradeBadge pokemon={pokemon} size="md" />
                </div>
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  <TypeBadge type={speciesData.type} size="sm" />
                  {speciesData.type2 && (
                    <TypeBadge type={speciesData.type2} size="sm" />
                  )}
                  {isShiny && (
                    <Badge variant="shiny" size="sm">
                      SHINY
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#a0a0c0]">
                  Level {pokemon.level}
                </p>
              </div>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-[#2a2a4a]">
            <button
              onClick={() => setActiveTab('info')}
              className={cn(
                'flex-1 py-2 px-4 text-xs sm:text-sm font-medium transition-colors',
                activeTab === 'info'
                  ? 'text-white bg-[#3B4CCA]/20 border-b-2 border-[#5B6EEA]'
                  : 'text-[#a0a0c0] hover:text-white hover:bg-[#252542]'
              )}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('evs')}
              className={cn(
                'flex-1 py-2 px-4 text-xs sm:text-sm font-medium transition-colors',
                activeTab === 'evs'
                  ? 'text-white bg-[#3B4CCA]/20 border-b-2 border-[#5B6EEA]'
                  : 'text-[#a0a0c0] hover:text-white hover:bg-[#252542]'
              )}
            >
              EVs
            </button>
            <button
              onClick={() => setActiveTab('ivs')}
              className={cn(
                'flex-1 py-2 px-4 text-xs sm:text-sm font-medium transition-colors',
                activeTab === 'ivs'
                  ? 'text-white bg-[#3B4CCA]/20 border-b-2 border-[#5B6EEA]'
                  : 'text-[#a0a0c0] hover:text-white hover:bg-[#252542]'
              )}
            >
              IVs
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-[50vh] overflow-y-auto">
            {/* Info Tab - OT, Date Caught, Nature, Stats */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* HP with bar */}
                <div>
                  <HPBar
                    current={pokemon.current_hp}
                    max={pokemon.max_hp}
                    size="md"
                    showLabel
                  />
                </div>

                {/* Pokemon Info */}
                <div className="bg-[#0f0f1a] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-[#2a2a4a]/50">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Original Trainer</span>
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {originalTrainer}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#2a2a4a]/50">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Date Caught</span>
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {caughtDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#2a2a4a]/50">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Nature</span>
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {pokemon.nature || 'Hardy'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Catch Location</span>
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {pokemon.catch_location || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Base Stats */}
                <div className="bg-[#0f0f1a] rounded-lg p-3">
                  <h3 className="text-[10px] sm:text-xs text-[#606080] mb-2 font-medium">STATS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">HP</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.max_hp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Attack</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.stat_attack}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Defense</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.stat_defense}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Sp. Atk</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.stat_sp_attack}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Sp. Def</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.stat_sp_defense}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[#a0a0c0]">Speed</span>
                      <span className="text-[10px] sm:text-xs text-white font-medium">{pokemon.stat_speed}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EVs Tab - Effort Values (placeholder for future) */}
            {activeTab === 'evs' && (
              <div className="space-y-4">
                {/* EV Bars - placeholder showing 0 for all stats */}
                <div className="bg-[#0f0f1a] rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">HP</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">Attack</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">Defense</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">Sp. Atk</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">Sp. Def</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0] w-14 sm:w-16 flex-shrink-0">Speed</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono w-8 text-right text-[#606080]">0</span>
                  </div>
                </div>

                {/* Total EVs */}
                <div className="bg-[#0f0f1a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-[#a0a0c0]">Total EVs</span>
                    <span className="text-xs sm:text-sm font-bold text-white">0 / 510</span>
                  </div>
                  <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all" style={{ width: '0%' }} />
                  </div>
                </div>

                {/* Coming Soon notice */}
                <div className="bg-[#3B4CCA]/10 border border-[#3B4CCA]/30 rounded-lg p-3 text-center">
                  <span className="text-[10px] sm:text-xs text-[#5B6EEA]">
                    EV training coming soon! Battle wild Pokemon to gain EVs.
                  </span>
                </div>
              </div>
            )}

            {/* IVs Tab - Individual Values */}
            {activeTab === 'ivs' && (
              <div className="space-y-4">
                {/* IV Bars */}
                <div className="bg-[#0f0f1a] rounded-lg p-3 space-y-2">
                  {STAT_ORDER.map((stat) => (
                    <IVBar
                      key={stat}
                      value={ivs[stat]}
                      label={getStatName(stat)}
                    />
                  ))}
                </div>

                {/* Total IVs */}
                <div className="bg-[#0f0f1a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-[#a0a0c0]">Total IVs</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{totalIVs} / 186</span>
                  </div>
                  <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(totalIVs / 186) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <IVGradeText pokemon={pokemon} showTotal={false} />
                    <span className="text-[10px] sm:text-xs text-[#a0a0c0]">
                      {Math.round((totalIVs / 186) * 100)}% potential
                    </span>
                  </div>
                </div>

                {/* Perfect IVs highlight */}
                {perfectCount > 0 && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-yellow-300">
                        Perfect IVs ({perfectCount})
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-yellow-200/70">
                      {STAT_ORDER.filter((stat) => ivs[stat] === 31)
                        .map((stat) => getStatName(stat))
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
