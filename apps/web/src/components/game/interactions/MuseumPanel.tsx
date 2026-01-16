'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function MuseumPanel() {
  const museum = useGameStore((state) => state.museum)
  const pokedollars = useGameStore((state) => state.pokedollars)
  const closeMuseum = useGameStore((state) => state.closeMuseum)

  const [purchasing, setPurchasing] = useState(false)

  // Reset purchasing state when error occurs or membership is purchased
  useEffect(() => {
    if (museum.error || museum.hasMembership) {
      setPurchasing(false)
    }
  }, [museum.error, museum.hasMembership])

  if (!museum.isOpen) return null

  const handleBuyMembership = () => {
    if (pokedollars < (museum.cost || 50)) return

    setPurchasing(true)
    gameSocket.buyMuseumMembership()
  }

  const canAfford = pokedollars >= (museum.cost || 50)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeMuseum}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-[#2a2a4a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-b border-[#2a2a4a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏛️</span>
              <div>
                <h2 className="font-pixel text-sm text-white tracking-wider">PEWTER MUSEUM</h2>
                <p className="text-xs text-amber-400/80">of Science</p>
              </div>
            </div>
            <button
              onClick={closeMuseum}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-[#606080] hover:text-white hover:border-red-500/50 transition-colors"
            >
              X
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!museum.hasMembership ? (
            // Non-member view - purchase prompt
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to Pewter Museum!</h3>
              <p className="text-[#a0a0c0] mb-6">
                Purchase a lifetime membership to explore our exhibits featuring ancient Pokemon fossils and space artifacts.
              </p>

              <div className="bg-[#0f0f1a]/60 rounded-xl border border-[#2a2a4a] p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#606080]">Membership Cost</span>
                  <span className="text-yellow-400 font-bold">{museum.cost || 50} P</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#606080]">Your Balance</span>
                  <span className={pokedollars >= (museum.cost || 50) ? 'text-green-400' : 'text-red-400'}>
                    {pokedollars.toLocaleString()} P
                  </span>
                </div>
              </div>

              {museum.error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-red-400 text-sm">{museum.error}</p>
                </div>
              )}

              <button
                onClick={handleBuyMembership}
                disabled={!canAfford || purchasing}
                className={`
                  w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200
                  ${canAfford && !purchasing
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 hover:scale-105'
                    : 'bg-[#2a2a4a] text-[#606080] cursor-not-allowed'
                  }
                `}
              >
                {purchasing ? 'Purchasing...' : canAfford ? 'Buy Membership' : 'Not Enough Money'}
              </button>
            </div>
          ) : (
            // Member view - exhibits
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">✓</span>
                <span className="text-green-400 text-sm">Museum Member</span>
              </div>

              <div className="space-y-3">
                {museum.exhibits?.map((exhibit) => (
                  <div
                    key={exhibit.id}
                    className="bg-[#0f0f1a]/60 rounded-xl border border-[#2a2a4a] p-4 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">{exhibit.icon}</div>
                      <div>
                        <h4 className="text-white font-medium mb-1">{exhibit.name}</h4>
                        <p className="text-sm text-[#a0a0c0] leading-relaxed">{exhibit.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Easter egg hint for Old Amber */}
              <div className="mt-6 pt-4 border-t border-[#2a2a4a]">
                <p className="text-xs text-[#606080] text-center italic">
                  "The secrets of ancient Pokemon lie waiting to be discovered..."
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
