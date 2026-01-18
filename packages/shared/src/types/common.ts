// Common types used across the system

import type { EncounterEvent } from './catching.js'
import type { LevelUpEvent, PendingEvolution } from './progression.js'

export interface WSMessage {
  type: string
  payload: unknown
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  effect_type: 'ball' | 'potion' | 'super_potion' | 'great_ball'
}

export interface TickResult {
  tick_number: number
  encounter?: EncounterEvent
  xp_gained?: Record<string, number>
  level_ups?: LevelUpEvent[]
  pending_evolutions?: PendingEvolution[]
  pokeballs: number
  great_balls: number
  money_earned?: number
  total_money?: number
}
