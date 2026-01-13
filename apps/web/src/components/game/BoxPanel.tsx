'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { PokemonCard } from './PokemonCard'

export function BoxPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  const box = useGameStore((state) => state.box)
  const party = useGameStore((state) => state.party)

  const handleSwap = () => {
    if (selectedPokemon && selectedSlot) {
      gameSocket.swapParty(selectedPokemon, selectedSlot)
      setSelectedPokemon(null)
      setSelectedSlot(null)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#3B4CCA] to-[#2A3A99] border border-[#5B6EEA]/30 shadow-lg shadow-[#3B4CCA]/30 hover:from-[#4B5CDA] hover:to-[#3A4AA9] transition-all duration-200 hover:scale-105"
      >
        {/* Box icon */}
        <div className="w-6 h-6 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center">
          <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 3H4a2 2 0 00-2 2v2a2 2 0 001 1.72V19a2 2 0 002 2h14a2 2 0 002-2V8.72A2 2 0 0022 7V5a2 2 0 00-2-2zM4 5h16v2H4V5zm1 14V9h14v10H5zm8-8h-2v2H9v2h2v2h2v-2h2v-2h-2v-2z"/>
          </svg>
        </div>
        <span className="text-white font-medium text-sm">Box</span>
        <span className="px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#5B6EEA] text-xs font-bold">
          {box.length}
        </span>
      </button>

      {/* Slide-over Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-hidden flex flex-col animate-slide-in">
            {/* Panel background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />

            {/* Content */}
            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="relative">
                <div className="h-1 bg-gradient-to-r from-[#3B4CCA] via-[#5B6EEA] to-[#3B4CCA]" />
                <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B4CCA]/20 to-[#3B4CCA]/10 border border-[#3B4CCA]/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5B6EEA]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 3H4a2 2 0 00-2 2v2a2 2 0 001 1.72V19a2 2 0 002 2h14a2 2 0 002-2V8.72A2 2 0 0022 7V5a2 2 0 00-2-2zM4 5h16v2H4V5zm1 14V9h14v10H5z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-pixel text-xs text-white tracking-wider">PC BOX</h2>
                      <p className="text-[10px] text-[#606080]">{box.length} Pokemon stored</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-white hover:border-[#EE1515] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Swap UI */}
              {selectedPokemon && (
                <div className="p-4 bg-[#3B4CCA]/10 border-b border-[#3B4CCA]/30">
                  <p className="text-sm text-[#a0a0c0] mb-3">Select a party slot to swap with:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6].map((slot) => {
                      const partyPokemon = party[slot - 1]
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${selectedSlot === slot
                              ? 'bg-[#5B6EEA] text-white shadow-lg shadow-[#3B4CCA]/30'
                              : 'bg-[#1a1a2e] text-[#a0a0c0] border border-[#2a2a4a] hover:border-[#3B4CCA]'
                            }
                          `}
                        >
                          {partyPokemon ? `Slot ${slot}` : `Empty ${slot}`}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleSwap}
                      disabled={!selectedSlot}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-green-500 to-green-600 text-white font-medium shadow-lg shadow-green-500/30 hover:from-green-400 hover:to-green-500 disabled:from-[#2a2a4a] disabled:to-[#1a1a2e] disabled:text-[#606080] disabled:shadow-none transition-all duration-200"
                    >
                      Swap Pokemon
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPokemon(null)
                        setSelectedSlot(null)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] text-[#a0a0c0] hover:text-white hover:border-[#3a3a6a] transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Box Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                {box.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    {/* Empty box illustration */}
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 rounded-2xl bg-[#1a1a2e] border-2 border-dashed border-[#2a2a4a]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#2a2a4a]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 3H4a2 2 0 00-2 2v2a2 2 0 001 1.72V19a2 2 0 002 2h14a2 2 0 002-2V8.72A2 2 0 0022 7V5a2 2 0 00-2-2zM4 5h16v2H4V5zm1 14V9h14v10H5z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="font-pixel text-xs text-[#606080] tracking-wider mb-2">
                      BOX EMPTY
                    </div>
                    <p className="text-sm text-[#606080]">Catch Pokemon to fill it up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {box.map((pokemon, index) => (
                      <div
                        key={pokemon.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <PokemonCard
                          pokemon={pokemon}
                          selected={selectedPokemon === pokemon.id}
                          onClick={() => setSelectedPokemon(
                            selectedPokemon === pokemon.id ? null : pokemon.id
                          )}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {!selectedPokemon && box.length > 0 && (
                <div className="p-3 border-t border-[#2a2a4a] text-center">
                  <p className="text-xs text-[#606080]">
                    Tap a Pokemon to swap with your party
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
