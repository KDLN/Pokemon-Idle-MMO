// Catching system types

import type { Pokemon, PokemonSpecies, WildPokemon } from './core.js'
import type { BattleSequence } from './battle.js'

export type BallType = 'pokeball' | 'great_ball'

export interface CatchSequence {
  shake_count: number       // 1-3 shakes before result
  success: boolean
  break_free_shake?: number // Which shake it broke free on (if failed)
}

export interface CatchResult {
  success: boolean
  pokemon_id?: string
  balls_used: number
  ball_type: BallType
  caught_pokemon?: Pokemon & { species: PokemonSpecies }
  catch_sequence?: CatchSequence  // Animation data for frontend
  catch_strength?: number
  close_call?: boolean
  critical?: boolean
}

export interface EncounterEvent {
  wild_pokemon: WildPokemon
  battle_result: 'win' | 'lose' | 'fled' | 'wipe'
  catch_result?: CatchResult
  type_effectiveness?: number
  effectiveness_text?: string | null // 'super_effective', 'not_very_effective', 'no_effect', null
  battle_sequence?: BattleSequence   // Full battle animation data
}
