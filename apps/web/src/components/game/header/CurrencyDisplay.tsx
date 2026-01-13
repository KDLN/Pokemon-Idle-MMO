'use client'

import { useGameStore } from '@/stores/gameStore'

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
          <span className="text-lg">🔴</span>
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
        <div className="w-5 h-5 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600" style={{ clipPath: 'inset(0 0 50% 0)' }} />
          <div className="absolute inset-0 rounded-full bg-white" style={{ clipPath: 'inset(50% 0 0 0)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white border border-gray-400" />
          </div>
        </div>
        <span className="text-white text-sm font-medium">{pokeballs}</span>
      </div>
    </div>
  )
}
