// Game Types for Pokemon Idle MMO

export interface Player {
  id: string
  user_id: string
  username: string
  current_zone_id: number
  pokedollars: number
  last_online: string
  created_at: string
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
  is_shiny?: boolean
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

export interface PokedexEntry {
  player_id: string
  species_id: number
  seen: boolean
  caught: boolean
  catch_count: number
  first_caught_at: string | null
}

export interface InventoryItem {
  player_id: string
  item_id: string
  quantity: number
}

// WebSocket Message Types
export interface WSMessage {
  type: string
  payload: unknown
}

export interface WildPokemon {
  species_id: number
  species: PokemonSpecies
  level: number
  max_hp: number
  stat_attack: number
  stat_defense: number
  is_shiny?: boolean
}

export interface CatchResult {
  success: boolean
  pokemon_id?: string
  balls_used: number
  caught_pokemon?: Pokemon
}

export interface EncounterEvent {
  wild_pokemon: WildPokemon
  battle_result: 'win' | 'lose' | 'fled' | 'wipe'
  catch_result?: CatchResult
  type_effectiveness?: number
  effectiveness_text?: string | null // 'super_effective', 'not_very_effective', 'no_effect'
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

export interface GameState {
  player: Player
  party: Pokemon[]
  zone: Zone
  connected_zones: Zone[]
  pokeballs: number
  pokedollars: number
  box: Pokemon[]
}

// Starter Pokemon options
export const STARTER_POKEMON = [
  { id: 1, name: 'Bulbasaur', type: 'Grass/Poison' },
  { id: 4, name: 'Charmander', type: 'Fire' },
  { id: 7, name: 'Squirtle', type: 'Water' },
] as const

// Pokemon sprite URL helper
export function getPokemonSpriteUrl(speciesId: number, isShiny: boolean = false): string {
  // Using PokeAPI sprites
  if (isShiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`
}

// XP calculation helpers
// Total XP needed to reach a given level (medium-fast growth rate)
export function getXPForLevel(level: number): number {
  return Math.floor((6 * Math.pow(level, 3)) / 5)
}

export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  // XP needed to reach next level (total threshold)
  const nextLevelXP = getXPForLevel(level + 1)
  // Current XP is the raw accumulated XP value
  // Show as progress towards the next level threshold
  const needed = nextLevelXP
  const current = xp
  const percentage = Math.min(100, Math.max(0, (current / needed) * 100))

  return { current, needed, percentage }
}
