'use client'

import { getTypeColor } from '@/lib/ui'

interface BattleHudProps {
  label: string
  name: string
  level: number
  healthPercent: number
  sprite: string
  types: (string | undefined)[]
  flipped?: boolean
}

export function BattleHud({ label, name, level, healthPercent, sprite, types, flipped = false }: BattleHudProps) {
  return (
    <div className="bg-[#121429]/80 border border-[#2a2a4a] rounded-xl p-3 shadow-lg flex items-center gap-4">
      <div className={`w-20 h-20 pixelated relative ${flipped ? '-scale-x-100' : ''}`}>
        <img src={sprite} alt={name} className="w-full h-full" />
        <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1 text-[10px] uppercase tracking-widest text-[#a0a0c0]">
          <span>{label}</span>
          <span>Lv.{level}</span>
        </div>
        <div className="font-pixel text-sm text-white mb-1">{name}</div>
        <div className="h-2 rounded-full bg-[#0f0f1a] border border-[#1c1c2c] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4ade80] to-[#22d3ee] transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          {types.map((type, index) => (
            type ? (
              <span
                key={`${type}-${index}`}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: getTypeColor(type) }}
              >
                {type}
              </span>
            ) : null
          ))}
        </div>
      </div>
    </div>
  )
}
