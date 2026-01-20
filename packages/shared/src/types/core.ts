// Core game types - Player, Pokemon, Species, Zone

export interface Player {
  id: string
  user_id: string
  username: string
  current_zone_id: number
  pokedollars: number
  last_online: string
  badges: string[]
  created_at?: string // Optional for frontend compatibility
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
  // Evolution data
  evolves_from_species_id: number | null
  evolution_level: number | null
  evolution_method: string | null
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
  // Individual Values (0-31) - affect stat calculations
  iv_hp: number
  iv_attack: number
  iv_defense: number
  iv_sp_attack: number
  iv_sp_defense: number
  iv_speed: number
  party_slot: number | null
  caught_at: string
  is_shiny: boolean
  catch_location?: string
  nature?: string
  original_trainer?: string
  species?: PokemonSpecies
}

export interface Zone {
  id: number
  name: string
  zone_type: 'town' | 'route'
  base_encounter_rate: number
  min_level: number
  max_level: number
  direction?: string  // N, S, E, W - from zone_connections, indicates direction to travel to reach this zone
}

export interface WildPokemon {
  species_id: number
  species: PokemonSpecies
  level: number
  max_hp: number
  stat_attack: number
  stat_defense: number
  stat_sp_attack: number
  stat_sp_defense: number
  stat_speed: number
  // Individual Values (0-31) - transferred to caught Pokemon
  iv_hp: number
  iv_attack: number
  iv_defense: number
  iv_sp_attack: number
  iv_sp_defense: number
  iv_speed: number
  is_shiny: boolean
}
