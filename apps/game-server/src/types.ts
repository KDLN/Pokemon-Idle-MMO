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

export interface CatchResult {
  success: boolean
  pokemon_id?: string
  balls_used: number
  caught_pokemon?: Pokemon & { species: PokemonSpecies }
}

export interface EncounterEvent {
  wild_pokemon: WildPokemon
  battle_result: 'win' | 'lose' | 'fled' | 'wipe'
  catch_result?: CatchResult
  type_effectiveness?: number
  effectiveness_text?: string | null // 'super_effective', 'not_very_effective', 'no_effect', null
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
