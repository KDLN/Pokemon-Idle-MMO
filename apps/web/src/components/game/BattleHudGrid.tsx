'use client'

import { BattleHud } from './BattleHud'

export interface BattleHudEntry {
  label: string
  name: string
  level: number
  healthPercent: number
  sprite: string
  types: (string | undefined)[]
  flipped?: boolean
}

interface BattleHudGridProps {
  entries: BattleHudEntry[]
}

export function BattleHudGrid({ entries }: BattleHudGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {entries.map((entry, idx) => (
        <BattleHud key={`${entry.name}-${idx}`} {...entry} />
      ))}
    </div>
  )
}
