'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { PokemonCard, EmptyPokemonSlot } from './PokemonCard'
import { PokemonDetailPanel } from './PokemonDetailPanel'
import { Card, CardHeader } from '@/components/ui/Card'
import { getStaggerDelayStyle } from '@/lib/ui'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { Pokemon } from '@/types/game'

// Pokeball icon component
function PokeballIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// Star icon component
function StarIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

export function PartyPanel() {
  const party = useGameStore((state) => state.party)
  const inventory = useGameStore((state) => state.inventory)
  const [detailPokemon, setDetailPokemon] = useState<Pokemon | null>(null)

  const activePartyCount = party.filter(p => p !== null).length
  const totalLevel = party.filter(p => p).reduce((sum, p) => sum + (p?.level || 0), 0)
  const powerStars = Math.min(5, Math.floor(activePartyCount * 0.8) + 1)

  // Check if player has any healing potions
  const regularPotionCount = inventory.potion || 0
  const superPotionCount = inventory.super_potion || 0
  const hasPotions = regularPotionCount > 0 || superPotionCount > 0

  // Use the best available potion - verify we actually have one before sending
  const handleUsePotion = (pokemonId: string) => {
    // Prefer regular potion first (more economical), fall back to super potion
    if (regularPotionCount > 0) {
      gameSocket.usePotion(pokemonId, 'potion')
    } else if (superPotionCount > 0) {
      gameSocket.usePotion(pokemonId, 'super_potion')
    }
    // If neither exists, do nothing (button shouldn't be visible anyway)
  }

  return (
    <Card variant="glass" padding="none" className="p-2 sm:p-3">
      {/* Header */}
      <CardHeader
        icon={<PokeballIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
        title="Party"
        subtitle={`${activePartyCount}/6 Pokemon`}
        className="mb-3 sm:mb-4"
        action={
          <div className="flex items-center gap-1.5" aria-label={`Team power: ${powerStars} out of 5 stars, total level ${totalLevel}`}>
            <div className="flex gap-0.5" role="img" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= powerStars}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= powerStars ? 'text-[#FFDE00]' : 'text-[#2a2a4a]'}`}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-[#a0a0c0] font-mono">
              {totalLevel}
            </span>
          </div>
        }
      />

      {/* Party Grid - responsive columns with equal row heights */}
      <div
        className="grid grid-cols-2 gap-2 auto-rows-fr"
        role="list"
        aria-label="Pokemon party"
      >
        {party.map((pokemon, index) =>
          pokemon ? (
            <div
              key={pokemon.id}
              className="animate-slide-up h-full"
              style={getStaggerDelayStyle(index)}
              role="listitem"
            >
              <PokemonCard
                pokemon={pokemon}
                showXP
                onClick={() => setDetailPokemon(pokemon)}
                canRemove={activePartyCount > 1}
                onRemove={() => {
                  if (pokemon.party_slot) {
                    gameSocket.removeFromParty(pokemon.party_slot)
                  }
                }}
                onUsePotion={handleUsePotion}
                hasPotions={hasPotions}
              />
            </div>
          ) : (
            <EmptyPokemonSlot key={`empty-${index}`} slot={index + 1} />
          )
        )}
      </div>

      {/* Pokemon Detail Panel */}
      {detailPokemon && (
        <PokemonDetailPanel
          pokemon={detailPokemon}
          isOpen={!!detailPokemon}
          onClose={() => setDetailPokemon(null)}
        />
      )}
    </Card>
  )
}
