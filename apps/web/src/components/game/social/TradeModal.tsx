'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { getPokemonSpriteUrl } from '@/types/game'
import type { Pokemon } from '@/types/game'
import type { TradeOffer, TradeOfferPokemon } from '@/types/trade'
import { getSpeciesData, cn } from '@/lib/ui'
import { TypeBadge } from '@/components/ui/Badge'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
}

// Compact Pokemon card for trade offers
function TradePokemonCard({
  pokemon,
  onRemove,
  canRemove = false
}: {
  pokemon: TradeOfferPokemon
  onRemove?: () => void
  canRemove?: boolean
}) {
  const speciesData = getSpeciesData(pokemon.species_id)
  const name = pokemon.nickname || pokemon.species?.name || speciesData.name
  const isShiny = pokemon.is_shiny

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-xl transition-all duration-200',
        'bg-[#1a1a2e] border-2 border-l-4 border-[#2a2a4a]',
        isShiny && 'ring-1 ring-yellow-400/50'
      )}
      style={{ borderLeftColor: isShiny ? '#FFD700' : speciesData.color }}
    >
      {/* Remove button */}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
          title="Remove from offer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Sprite */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <div
          className={cn('absolute inset-0 rounded-lg opacity-30', isShiny && 'animate-shimmer')}
          style={{ backgroundColor: isShiny ? '#FFD700' : speciesData.color }}
        />
        <img
          src={getPokemonSpriteUrl(pokemon.species_id, isShiny)}
          alt={name}
          className="w-full h-full pixelated relative z-10"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn(
            'text-xs font-semibold truncate',
            isShiny ? 'text-yellow-300' : 'text-white'
          )}>
            {name}
          </span>
          {isShiny && (
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#a0a0c0]">Lv. {pokemon.level}</span>
          <TypeBadge type={speciesData.type} size="sm" />
        </div>
      </div>
    </div>
  )
}

// Selectable Pokemon card for adding to trade
function SelectablePokemonCard({
  pokemon,
  isOffered,
  onToggle
}: {
  pokemon: Pokemon
  isOffered: boolean
  onToggle: () => void
}) {
  const speciesData = getSpeciesData(pokemon.species_id)
  const name = pokemon.nickname || speciesData.name
  const isShiny = pokemon.is_shiny

  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-xl transition-all duration-200 w-full text-left',
        isOffered
          ? 'bg-[#3B4CCA]/20 border-2 border-l-4 border-[#5B6EEA] shadow-lg shadow-[#3B4CCA]/20'
          : 'bg-[#1a1a2e] border-2 border-l-4 border-[#2a2a4a] hover:border-[#3a3a6a] hover:bg-[#252542]',
        isShiny && 'ring-1 ring-yellow-400/50'
      )}
      style={{ borderLeftColor: isShiny ? '#FFD700' : speciesData.color }}
    >
      {/* Offered indicator */}
      {isOffered && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#5B6EEA] text-white flex items-center justify-center">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Sprite */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <div
          className={cn('absolute inset-0 rounded-lg opacity-30', isShiny && 'animate-shimmer')}
          style={{ backgroundColor: isShiny ? '#FFD700' : speciesData.color }}
        />
        <img
          src={getPokemonSpriteUrl(pokemon.species_id, isShiny)}
          alt={name}
          className="w-full h-full pixelated relative z-10"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn(
            'text-xs font-semibold truncate',
            isShiny ? 'text-yellow-300' : 'text-white'
          )}>
            {name}
          </span>
          {isShiny && (
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#a0a0c0]">Lv. {pokemon.level}</span>
          <TypeBadge type={speciesData.type} size="sm" />
          {pokemon.party_slot && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-[#3B4CCA]/30 text-[#5B6EEA]">
              Party
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// Empty offer placeholder
function EmptyOfferSlot() {
  return (
    <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#2a2a4a] text-[#606080] text-xs">
      No Pokemon offered yet
    </div>
  )
}

export function TradeModal({ isOpen, onClose }: TradeModalProps) {
  const [selectedTab, setSelectedTab] = useState<'party' | 'box'>('party')
  const [isVisible, setIsVisible] = useState(false)

  const activeTrade = useGameStore((state) => state.activeTrade)
  const party = useGameStore((state) => state.party)
  const box = useGameStore((state) => state.box)
  const player = useGameStore((state) => state.player)

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Request trade offers when modal opens
  useEffect(() => {
    if (isOpen && activeTrade) {
      gameSocket.getTradeOffers(activeTrade.trade_id)
    }
  }, [isOpen, activeTrade?.trade_id])

  // Get IDs of Pokemon currently offered by me
  const myOfferedIds = useMemo(() => {
    return new Set(activeTrade?.my_offers.map(o => o.pokemon_id) || [])
  }, [activeTrade?.my_offers])

  // All available Pokemon (party + box)
  const availablePokemon = useMemo(() => {
    const partyPokemon = party.filter((p): p is Pokemon => p !== null)
    return selectedTab === 'party' ? partyPokemon : box
  }, [party, box, selectedTab])

  // Handle adding/removing Pokemon from offer
  const handleTogglePokemon = (pokemonId: string) => {
    if (!activeTrade) return

    if (myOfferedIds.has(pokemonId)) {
      gameSocket.removeTradeOffer(activeTrade.trade_id, pokemonId)
    } else {
      gameSocket.addTradeOffer(activeTrade.trade_id, pokemonId)
    }
  }

  // Handle removing from offer (from the offer list)
  const handleRemoveOffer = (pokemonId: string) => {
    if (!activeTrade) return
    gameSocket.removeTradeOffer(activeTrade.trade_id, pokemonId)
  }

  // Handle ready toggle
  const handleToggleReady = () => {
    if (!activeTrade) return
    gameSocket.setTradeReady(activeTrade.trade_id, !activeTrade.my_ready)
  }

  // Handle cancel trade
  const handleCancel = () => {
    if (!activeTrade) return
    if (activeTrade.is_sender) {
      gameSocket.cancelTradeRequest(activeTrade.trade_id)
    } else {
      gameSocket.declineTradeRequest(activeTrade.trade_id)
    }
    onClose()
  }

  if (!isVisible || !activeTrade) return null

  const canReady = activeTrade.status === 'accepted' && activeTrade.my_offers.length > 0
  const bothReady = activeTrade.my_ready && activeTrade.their_ready

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-4xl md:max-h-[85vh]',
          'bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-2xl shadow-2xl',
          'border border-[#2a2a4a] flex flex-col overflow-hidden',
          'transition-all duration-200',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <div className="h-1 bg-gradient-to-r from-[#3B4CCA] via-[#5B6EEA] to-[#3B4CCA]" />
          <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B4CCA]/20 to-[#3B4CCA]/10 border border-[#3B4CCA]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <h2 className="font-pixel text-xs text-white tracking-wider">TRADE</h2>
                <p className="text-[10px] text-[#606080]">
                  Trading with <span className="text-[#5B6EEA]">{activeTrade.partner_username}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-white hover:border-[#EE1515] transition-colors"
              aria-label="Close trade"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning banner */}
        {activeTrade.warning && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs text-yellow-500">{activeTrade.warning}</span>
          </div>
        )}

        {/* Trade status banner */}
        {activeTrade.status === 'pending' && (
          <div className="px-4 py-2 bg-[#3B4CCA]/10 border-b border-[#3B4CCA]/30">
            <span className="text-xs text-[#5B6EEA]">
              {activeTrade.is_sender
                ? 'Waiting for trade partner to accept...'
                : 'Accept this trade request to start adding Pokemon'}
            </span>
          </div>
        )}

        {/* Main content - Trade offers side by side */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left side - My offer */}
          <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-[#2a2a4a] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Your Offer</h3>
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                activeTrade.my_ready
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-[#2a2a4a] text-[#606080]'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  activeTrade.my_ready ? 'bg-green-500' : 'bg-[#606080]'
                )} />
                {activeTrade.my_ready ? 'Ready' : 'Not ready'}
              </div>
            </div>

            {activeTrade.my_offers.length === 0 ? (
              <EmptyOfferSlot />
            ) : (
              <div className="space-y-2">
                {activeTrade.my_offers.map((offer) => (
                  offer.pokemon && (
                    <TradePokemonCard
                      key={offer.offer_id}
                      pokemon={offer.pokemon}
                      canRemove={activeTrade.status !== 'completed'}
                      onRemove={() => handleRemoveOffer(offer.pokemon_id)}
                    />
                  )
                ))}
              </div>
            )}
          </div>

          {/* Right side - Their offer */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{activeTrade.partner_username}&apos;s Offer</h3>
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                activeTrade.their_ready
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-[#2a2a4a] text-[#606080]'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  activeTrade.their_ready ? 'bg-green-500 animate-pulse' : 'bg-[#606080]'
                )} />
                {activeTrade.their_ready ? 'Ready' : 'Not ready'}
              </div>
            </div>

            {activeTrade.their_offers.length === 0 ? (
              <EmptyOfferSlot />
            ) : (
              <div className="space-y-2">
                {activeTrade.their_offers.map((offer) => (
                  offer.pokemon && (
                    <TradePokemonCard
                      key={offer.offer_id}
                      pokemon={offer.pokemon}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pokemon selection area (only when trade is active) */}
        {(activeTrade.status === 'pending' || activeTrade.status === 'accepted') && (
          <div className="border-t border-[#2a2a4a]">
            {/* Tabs */}
            <div className="flex border-b border-[#2a2a4a]">
              <button
                onClick={() => setSelectedTab('party')}
                className={cn(
                  'flex-1 px-4 py-2 text-xs font-medium transition-colors',
                  selectedTab === 'party'
                    ? 'bg-[#3B4CCA]/20 text-[#5B6EEA] border-b-2 border-[#5B6EEA]'
                    : 'text-[#606080] hover:text-white'
                )}
              >
                Party ({party.filter(p => p !== null).length})
              </button>
              <button
                onClick={() => setSelectedTab('box')}
                className={cn(
                  'flex-1 px-4 py-2 text-xs font-medium transition-colors',
                  selectedTab === 'box'
                    ? 'bg-[#3B4CCA]/20 text-[#5B6EEA] border-b-2 border-[#5B6EEA]'
                    : 'text-[#606080] hover:text-white'
                )}
              >
                Box ({box.length})
              </button>
            </div>

            {/* Pokemon list */}
            <div className="p-4 max-h-48 overflow-y-auto">
              {availablePokemon.length === 0 ? (
                <div className="text-center text-[#606080] text-xs py-4">
                  {selectedTab === 'party' ? 'No Pokemon in party' : 'No Pokemon in box'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availablePokemon.map((pokemon) => (
                    <SelectablePokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      isOffered={myOfferedIds.has(pokemon.id)}
                      onToggle={() => handleTogglePokemon(pokemon.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="p-4 border-t border-[#2a2a4a] flex items-center justify-between gap-3">
          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] text-[#a0a0c0] hover:text-white hover:border-red-500/50 transition-all duration-200"
          >
            {activeTrade.is_sender ? 'Cancel Trade' : 'Decline'}
          </button>

          <div className="flex items-center gap-2">
            {/* Accept button (for receiver when pending) */}
            {!activeTrade.is_sender && activeTrade.status === 'pending' && (
              <button
                onClick={() => gameSocket.acceptTradeRequest(activeTrade.trade_id)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-green-500 to-green-600 text-white font-medium shadow-lg shadow-green-500/30 hover:from-green-400 hover:to-green-500 transition-all duration-200"
              >
                Accept Trade
              </button>
            )}

            {/* Ready button (when trade is accepted) */}
            {activeTrade.status === 'accepted' && (
              <button
                onClick={handleToggleReady}
                disabled={!canReady}
                className={cn(
                  'px-6 py-2.5 rounded-xl font-medium transition-all duration-200',
                  activeTrade.my_ready
                    ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30 hover:from-yellow-400 hover:to-yellow-500'
                    : canReady
                      ? 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 hover:from-green-400 hover:to-green-500'
                      : 'bg-[#2a2a4a] text-[#606080] cursor-not-allowed'
                )}
              >
                {activeTrade.my_ready ? 'Cancel Ready' : bothReady ? 'Completing...' : 'Ready to Trade'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
