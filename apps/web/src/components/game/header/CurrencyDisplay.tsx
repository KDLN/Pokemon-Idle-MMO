'use client'

import Image from 'next/image'
import { useGameStore } from '@/stores/gameStore'

const POKEBALL_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'

interface CurrencyDisplayProps {
  compact?: boolean
}

export function CurrencyDisplay({ compact = false }: CurrencyDisplayProps) {
  const pokedollars = useGameStore((state) => state.pokedollars)
  const pokeballs = useGameStore((state) => state.pokeballs)
  // Battle points would come from an extended store
  const battlePoints = 0 // Placeholder until store is updated

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Pokedollars */}
        <div className="flex items-center gap-1.5 bg-[#1a1a2e] px-2.5 py-1 rounded-full border border-[#2a2a4a]">
          <span className="text-green-400 font-bold">$</span>
          <span className="text-white text-sm font-medium">{formatNumber(pokedollars)}</span>
        </div>

        {/* Pokeballs */}
        <div className="flex items-center gap-1.5 bg-[#1a1a2e] px-2.5 py-1 rounded-full border border-[#2a2a4a]">
          <Image
            src={POKEBALL_SPRITE}
            alt="Pokeball"
            width={20}
            height={20}
            className="pixelated"
            unoptimized
          />
          <span className="text-white text-sm font-medium">{pokeballs}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Pokedollars */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#1a1a2e] to-[#252542] px-3 py-1.5 rounded-lg border border-[#2a2a4a] shadow-sm">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
          $
        </div>
        <div>
          <div className="text-[10px] text-[#606080] uppercase tracking-wide">Pokedollars</div>
          <div className="text-white font-semibold text-sm -mt-0.5">{formatNumber(pokedollars)}</div>
        </div>
      </div>

      {/* Battle Points */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#1a1a2e] to-[#252542] px-3 py-1.5 rounded-lg border border-[#2a2a4a] shadow-sm">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
          BP
        </div>
        <div>
          <div className="text-[10px] text-[#606080] uppercase tracking-wide">Battle Points</div>
          <div className="text-white font-semibold text-sm -mt-0.5">{formatNumber(battlePoints)}</div>
        </div>
      </div>

      {/* Pokeballs (compact in header) */}
      <div className="flex items-center gap-1.5 bg-[#1a1a2e] px-2.5 py-1.5 rounded-lg border border-[#2a2a4a]">
        <Image
          src={POKEBALL_SPRITE}
          alt="Pokeball"
          width={20}
          height={20}
          className="pixelated"
          unoptimized
        />
        <span className="text-white text-sm font-medium">{pokeballs}</span>
      </div>
    </div>
  )
}
