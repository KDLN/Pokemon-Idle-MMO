'use client'

import { useState, useEffect } from 'react'
import { getPokemonSpriteUrl } from '@/types/game'
import type { Pokemon } from '@/types/game'
import { BadgeCase } from '../header/BadgeCase'

export interface PublicPlayerInfo {
  id: string
  username: string
  level: number
  party: (Pokemon | null)[]
  badges: string[]
  zoneName: string
  isOnline: boolean
  lastSeen?: Date
}

interface QuickInspectProps {
  player: PublicPlayerInfo | null
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

// Mock species data
const SPECIES_NAMES: Record<number, string> = {
  1: 'Bulbasaur',
  4: 'Charmander',
  7: 'Squirtle',
  10: 'Caterpie',
  16: 'Pidgey',
  19: 'Rattata',
}

export function QuickInspect({ player, isOpen, onClose, position }: QuickInspectProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible || !player) return null

  const partyPokemon = player.party.filter((p): p is Pokemon => p !== null)
  const leadPokemon = partyPokemon[0]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          fixed z-50 w-72 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl
          transition-all duration-200
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        style={{
          top: position?.y ?? '50%',
          left: position?.x ?? '50%',
          transform: position ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
            />
            <span className="font-semibold text-white">{player.username}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#606080] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Lead Pokemon and Level */}
          <div className="flex items-center gap-3">
            {leadPokemon && (
              <div className="relative">
                <img
                  src={getPokemonSpriteUrl(leadPokemon.species_id, leadPokemon.is_shiny)}
                  alt="Lead Pokemon"
                  className="w-16 h-16 pixelated"
                />
                {leadPokemon.is_shiny && (
                  <div className="absolute -top-1 -right-1 text-yellow-400 text-sm">✨</div>
                )}
              </div>
            )}
            <div>
              <div className="text-xs text-[#606080]">Trainer Level</div>
              <div className="text-2xl font-bold text-white">{player.level}</div>
              <div className="text-xs text-[#a0a0c0]">{player.zoneName}</div>
            </div>
          </div>

          {/* Party Preview */}
          <div>
            <div className="text-xs text-[#606080] mb-1">Party ({partyPokemon.length}/6)</div>
            <div className="flex gap-1">
              {partyPokemon.slice(0, 6).map((pokemon, i) => (
                <div
                  key={i}
                  className="relative w-10 h-10 bg-[#252542] rounded-lg flex items-center justify-center"
                  title={`${SPECIES_NAMES[pokemon.species_id] ?? '#' + pokemon.species_id} Lv.${pokemon.level}`}
                >
                  <img
                    src={getPokemonSpriteUrl(pokemon.species_id, pokemon.is_shiny)}
                    alt=""
                    className="w-8 h-8 pixelated"
                  />
                  {pokemon.is_shiny && (
                    <div className="absolute -top-0.5 -right-0.5 text-yellow-400 text-[8px]">✨</div>
                  )}
                </div>
              ))}
              {/* Empty slots */}
              {[...Array(6 - partyPokemon.length)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-10 h-10 bg-[#252542]/50 rounded-lg border border-dashed border-[#2a2a4a]"
                />
              ))}
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="text-xs text-[#606080] mb-1">Badges ({player.badges.length}/8)</div>
            <BadgeCase earnedBadges={player.badges} />
          </div>

          {/* Last seen (if offline) */}
          {!player.isOnline && player.lastSeen && (
            <div className="text-xs text-[#606080] text-center">
              Last seen: {new Date(player.lastSeen).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-3 border-t border-[#2a2a4a]">
          <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#252542] text-white rounded-lg hover:bg-[#3a3a6a] transition-colors">
            Add Friend
          </button>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#3B4CCA] text-white rounded-lg hover:bg-[#5B6EEA] transition-colors">
            Trade
          </button>
        </div>
      </div>
    </>
  )
}
