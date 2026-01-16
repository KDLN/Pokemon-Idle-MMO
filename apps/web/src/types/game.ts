// Game Types for Pokemon Idle MMO

export interface Player {
  id: string
  user_id: string
  username: string
  current_zone_id: number
  pokedollars: number
  last_online: string
  created_at: string
  badges: string[]
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

// Catch sequence data for animation
export interface CatchSequence {
  shake_count: number       // 1-3 shakes before result
  success: boolean
  break_free_shake?: number // Which shake it broke free on (if failed)
}

export type BallType = 'pokeball' | 'great_ball'

export interface CatchResult {
  success: boolean
  pokemon_id?: string
  balls_used: number
  ball_type?: BallType
  caught_pokemon?: Pokemon
  catch_sequence?: CatchSequence  // Animation data
  catch_strength?: number
  close_call?: boolean
  critical?: boolean
}

// Individual turn in a battle sequence
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

// Gym battle sequence for a single Pokemon matchup
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
  effectiveness_text?: string | null // 'super_effective', 'not_very_effective', 'no_effect'
  battle_sequence?: BattleSequence   // Full battle animation data
}

// Battle animation state machine phases
export type BattlePhase =
  | 'idle'           // No encounter
  | 'appear'         // Wild Pokemon appearing
  | 'battle_intro'   // "Wild X appeared!" text
  | 'turn_attack'    // Showing attack animation
  | 'turn_damage'    // Damage number + HP drain
  | 'battle_end'     // Victory/defeat message
  | 'catch_throw'    // Pokeball throw animation
  | 'catch_shake'    // Ball shaking (1-3 times)
  | 'catch_result'   // Success/failure reveal
  | 'rewards'        // XP/money floating up
  | 'fade_out'       // Fading encounter away

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

// Pending evolution that player can confirm or cancel
export interface PendingEvolution {
  pokemon_id: string
  pokemon_name: string
  current_species_id: number
  evolution_species_id: number
  evolution_species_name: string
  trigger_level: number
}

// Evolution event sent when a Pokemon evolves
export interface EvolutionEvent {
  pokemon_id: string
  pokemon_name: string // Name before evolution
  new_species_id: number
  new_species_name: string
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
  pending_evolutions?: PendingEvolution[]
  pokeballs: number
  great_balls?: number
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

// Pokemon sprite variant options
export type PokemonSpriteVariant = 'front' | 'back'

// Pokemon sprite URL helper
export function getPokemonSpriteUrl(
  speciesId: number,
  isShiny: boolean = false,
  variant: PokemonSpriteVariant = 'front'
): string {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

  if (variant === 'back') {
    return isShiny
      ? `${base}/back/shiny/${speciesId}.png`
      : `${base}/back/${speciesId}.png`
  }

  return isShiny
    ? `${base}/shiny/${speciesId}.png`
    : `${base}/${speciesId}.png`
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
