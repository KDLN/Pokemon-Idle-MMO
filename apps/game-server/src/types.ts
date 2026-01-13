// Shared types for game server

export interface Player {
  id: string
  user_id: string
  username: string
  current_zone_id: number
  pokedollars: number
  last_online: string
}

export interface Pokemon {
  id: string
  owner_id: string
  species_id: number
  nickname: string | null
  level: number
  xp: number
  current_hp: number
  max_hp: number
  stat_attack: number
  stat_defense: number
  stat_sp_attack: number
  stat_sp_defense: number
  stat_speed: number
  party_slot: number | null
  caught_at: string
  is_shiny: boolean
  species?: PokemonSpecies
}

export interface PokemonSpecies {
  id: number
  name: string
  type1: string
  type2: string | null
  base_hp: number
  base_attack: number
  base_defense: number
  base_sp_attack: number
  base_sp_defense: number
  base_speed: number
  base_catch_rate: number
  base_xp_yield: number
}

export interface Zone {
  id: number
  name: string
  zone_type: 'town' | 'route'
  base_encounter_rate: number
  min_level: number
  max_level: number
}

export interface EncounterTableEntry {
  zone_id: number
  species_id: number
  encounter_rate: number
  species?: PokemonSpecies
}

export interface WildPokemon {
  species_id: number
  species: PokemonSpecies
  level: number
  max_hp: number
  stat_attack: number
  stat_defense: number
  is_shiny: boolean
}

// Catch sequence data for animation
export interface CatchSequence {
  shake_count: number       // 1-3 shakes before result
  success: boolean
  break_free_shake?: number // Which shake it broke free on (if failed)
}

export interface CatchResult {
  success: boolean
  pokemon_id?: string
  balls_used: number
  caught_pokemon?: Pokemon & { species: PokemonSpecies }
  catch_sequence?: CatchSequence  // Animation data for frontend
}

// Individual turn in a battle sequence
export interface BattleTurn {
  turn_number: number
  attacker: 'player' | 'wild'
  attacker_name: string
  defender_name: string
  damage_dealt: number
  is_critical: boolean
  effectiveness: 'super' | 'neutral' | 'not_very' | 'immune'
  attacker_hp_after: number
  defender_hp_after: number
  attacker_max_hp: number
  defender_max_hp: number
}

// Complete battle sequence for animation
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

export interface EncounterEvent {
  wild_pokemon: WildPokemon
  battle_result: 'win' | 'lose' | 'fled' | 'wipe'
  catch_result?: CatchResult
  type_effectiveness?: number
  effectiveness_text?: string | null // 'super_effective', 'not_very_effective', 'no_effect', null
  battle_sequence?: BattleSequence   // Full battle animation data
}

export interface LevelUpEvent {
  pokemon_id: string
  pokemon_name: string
  new_level: number
  new_stats: {
    max_hp: number
    attack: number
    defense: number
    sp_attack: number
    sp_defense: number
    speed: number
  }
}

export interface TickResult {
  tick_number: number
  encounter?: EncounterEvent
  xp_gained?: Record<string, number>
  level_ups?: LevelUpEvent[]
  pokeballs: number
  money_earned?: number
  total_money?: number
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  effect_type: 'ball' | 'potion' | 'super_potion' | 'great_ball'
}

export interface PlayerSession {
  player: Player
  party: (Pokemon | null)[]
  zone: Zone
  pokeballs: number
  tickNumber: number
  encounterTable: EncounterTableEntry[]
  pokedollars: number
}

export interface WSMessage {
  type: string
  payload: unknown
}
