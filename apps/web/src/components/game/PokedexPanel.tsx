'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPokemonSpriteUrl } from '@/types/game'
import type { PokedexEntry } from '@/types/game'
import { SPECIES_DATA, getTypeColor } from '@/lib/ui'

// Build species list from centralized SPECIES_DATA (all 151 Gen 1 Pokemon)
// Sorted by dex number
const ALL_SPECIES = Object.entries(SPECIES_DATA)
  .map(([id, data]) => ({
    id: Number(id),
    name: data.name,
    type: data.type,
    type2: data.type2,
    color: data.color,
  }))
  .sort((a, b) => a.id - b.id)

interface PokedexPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function PokedexPanel({ isOpen, onClose }: PokedexPanelProps) {
  const [entries, setEntries] = useState<PokedexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchPokedex()
    }
  }, [isOpen])

  async function fetchPokedex() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get player ID
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!player) return

      // Get pokedex entries
      const { data: pokedexData } = await supabase
        .from('pokedex_entries')
        .select('*')
        .eq('player_id', player.id)

      setEntries(pokedexData || [])
    } catch (err) {
      console.error('Failed to fetch pokedex:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getEntryForSpecies = (speciesId: number) =>
    entries.find(e => e.species_id === speciesId)

  const seenCount = entries.filter(e => e.seen).length
  const caughtCount = entries.filter(e => e.caught).length
  const completionPercent = Math.round((caughtCount / ALL_SPECIES.length) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl animate-pop-in">
        {/* Pokedex outer shell */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EE1515] to-[#CC0000]" />

        {/* Main content area */}
        <div className="relative m-2 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]">
          {/* Header - Pokedex style */}
          <div className="relative">
            {/* Top decorative bar */}
            <div className="h-1 bg-gradient-to-r from-[#EE1515] via-[#FF4444] to-[#EE1515]" />

            <div className="px-5 py-4 flex items-center justify-between border-b border-[#2a2a4a]">
              <div className="flex items-center gap-4">
                {/* Pokedex LED lights */}
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 rounded-full bg-[#3B82F6] animate-pulse-glow" />
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#3B82F6]" />
                    <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#EE1515]" />
                    <div className="w-2 h-2 rounded-full bg-[#FFDE00]" />
                    <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  </div>
                </div>

                <div>
                  <h2 className="font-pixel text-sm text-white tracking-wider">POKEDEX</h2>
                  <p className="text-xs text-[#606080]">Kanto Region</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-white hover:border-[#EE1515] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-5 py-3 border-b border-[#2a2a4a] bg-[#0f0f1a]/50">
            <div className="flex items-center justify-between gap-6">
              {/* Seen/Caught counters */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#606080] uppercase tracking-wider">Seen</div>
                    <div className="font-pixel text-xs text-white">{seenCount}/{ALL_SPECIES.length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#f0f0f0]" />
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#333] -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#606080] uppercase tracking-wider">Caught</div>
                    <div className="font-pixel text-xs text-green-400">{caughtCount}/{ALL_SPECIES.length}</div>
                  </div>
                </div>
              </div>

              {/* Completion bar */}
              <div className="flex-1 max-w-[200px]">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#606080]">Completion</span>
                  <span className="text-[#FFDE00] font-medium">{completionPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1a2e] border border-[#2a2a4a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFDE00] to-[#F8D030] transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pokemon Grid */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-200px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-[#2a2a4a] border-t-[#EE1515] animate-spin mb-4" />
                <div className="text-[#606080] text-sm">Loading Pokedex data...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {ALL_SPECIES.map((species, index) => {
                  const entry = getEntryForSpecies(species.id)
                  const seen = entry?.seen || false
                  const caught = entry?.caught || false

                  return (
                    <div
                      key={species.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div
                        className={`
                          group relative p-3 rounded-xl border-2 text-center transition-all duration-200
                          ${caught
                            ? 'border-green-500/50 bg-gradient-to-b from-green-500/10 to-transparent hover:border-green-500'
                            : seen
                              ? 'border-[#3B4CCA]/50 bg-gradient-to-b from-[#3B4CCA]/10 to-transparent hover:border-[#3B4CCA]'
                              : 'border-[#2a2a4a] bg-[#1a1a2e]/50 hover:border-[#3a3a6a]'
                          }
                          hover:scale-105
                        `}
                      >
                        {/* Caught badge */}
                        {caught && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {/* Sprite or Silhouette */}
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          {/* Type color glow for seen Pokemon */}
                          {seen && (
                            <div
                              className="absolute inset-0 blur-lg opacity-30 scale-75"
                              style={{ backgroundColor: species.color }}
                            />
                          )}
                          <img
                            src={getPokemonSpriteUrl(species.id)}
                            alt={seen ? species.name : '???'}
                            className={`
                              w-full h-full pixelated relative z-10
                              transition-all duration-200
                              ${!seen ? 'brightness-0 opacity-30' : 'group-hover:scale-110'}
                            `}
                          />
                        </div>

                        {/* Number */}
                        <div className="font-mono text-[10px] text-[#606080] mb-1">
                          #{species.id.toString().padStart(3, '0')}
                        </div>

                        {/* Name */}
                        <div className={`text-xs font-semibold truncate ${seen ? 'text-white' : 'text-[#404060]'}`}>
                          {seen ? species.name : '???'}
                        </div>

                        {/* Type badges */}
                        {seen && (
                          <div className="mt-2 flex justify-center gap-1 flex-wrap">
                            <span
                              className="type-badge text-white"
                              style={{ backgroundColor: getTypeColor(species.type) }}
                            >
                              {species.type}
                            </span>
                            {species.type2 && (
                              <span
                                className="type-badge text-white"
                                style={{ backgroundColor: getTypeColor(species.type2) }}
                              >
                                {species.type2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Catch count */}
                        {caught && entry && entry.catch_count > 0 && (
                          <div className="mt-2 text-[10px] text-[#606080]">
                            <span className="text-green-400 font-medium">{entry.catch_count}</span> caught
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-[#2a2a4a] text-center">
            <p className="text-xs text-[#606080]">
              Catch Pokemon on routes to complete your Pokedex!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
