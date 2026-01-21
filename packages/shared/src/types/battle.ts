// Battle system types

export interface BattleTurn {
  turn_number: number
  attacker: 'player' | 'wild' | 'gym'
  attacker_name: string
  defender_name: string
  damage_dealt: number
  is_critical: boolean
  effectiveness: 'super' | 'neutral' | 'not_very' | 'immune'
  attacker_hp_after: number
  defender_hp_after: number
  attacker_max_hp: number
  defender_max_hp: number
  move_name: string
  move_type: string
  status_effect?: string
}

export interface BattleSequence {
  lead_pokemon_id: string
  lead_pokemon_name: string
  lead_species_id: number
  lead_level: number
  lead_starting_hp: number
  lead_max_hp: number
  lead_type1: string
  lead_type2: string | null
  wild_starting_hp: number
  wild_max_hp: number
  turns: BattleTurn[]
  final_outcome: 'player_win' | 'player_faint'
  lead_final_hp: number
  xp_earned: number
}

export interface GymBattleMatchup {
  player_pokemon_id: string
  player_pokemon_name: string
  player_species_id: number
  player_level: number
  player_starting_hp: number
  player_max_hp: number
  player_type1: string
  player_type2: string | null
  gym_pokemon_name: string
  gym_species_id: number
  gym_level: number
  gym_starting_hp: number
  gym_max_hp: number
  gym_type1: string
  gym_type2: string | null
  turns: BattleTurn[]
  outcome: 'player_pokemon_faint' | 'gym_pokemon_faint'
  player_final_hp: number
}

// Battle status for progressive turns
export type BattleStatus = 'battling' | 'catching' | 'complete' | 'timeout'

// Server -> Client: Single turn data
export interface BattleTurnMessage {
  turn: BattleTurn
  battleStatus: 'ongoing' | 'player_win' | 'player_faint'
  playerHP: number
  wildHP: number
  canCatch: boolean  // true only after player wins
}

// Client -> Server: Request next turn
export interface RequestTurnPayload {
  battle_id: string
}

// Server -> Client: Catch result with animation data
export interface CatchResultMessage {
  shakeCount: number  // Always 3 for suspense
  success: boolean
  isNewPokedexEntry: boolean
  catchStrength: number  // For catch meter display
}
