// Shared types for game server

export interface Player {
  id: string
  user_id: string
  username: string
  current_zone_id: number
  pokedollars: number
  last_online: string
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

export type BallType = 'pokeball' | 'great_ball'

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

// Individual turn in a battle sequence
export interface Move {
  name: string
  type: string
  power: number
  accuracy: number
  status?: {
    name: string
    chance: number
  }
}

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
  great_balls: number
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
  great_balls: number
  tickNumber: number
  encounterTable: EncounterTableEntry[]
  pokedollars: number
  encounterCooldown: number // Ticks remaining before next encounter can occur
}

export interface WSMessage {
  type: string
  payload: unknown
}

export type ChatChannel = 'global' | 'trade' | 'guild' | 'system'

export interface ChatMessageEntry {
  id: string
  player_id: string
  player_name: string
  channel: ChatChannel
  content: string
  created_at: string
}

// Friend system types
export type FriendStatus = 'pending' | 'accepted' | 'blocked'

export interface Friend {
  friend_id: string
  player_id: string
  friend_player_id: string
  status: FriendStatus
  created_at: string
  // Joined data for display
  friend_username?: string
  friend_last_online?: string
  // Zone visibility (Issue #14)
  zone_id?: number
  zone_name?: string
}

export interface FriendRequest {
  friend_id: string
  from_player_id: string
  from_username: string
  created_at: string
}

// Trade system types
export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

export interface Trade {
  trade_id: string
  sender_id: string
  receiver_id: string
  status: TradeStatus
  created_at: string
  updated_at: string
  // Joined data for display
  sender_username?: string
  receiver_username?: string
}

// Partial Pokemon data for trade offer display (only fields needed for UI)
export interface TradeOfferPokemon {
  id: string
  species_id: number
  nickname: string | null
  level: number
  is_shiny: boolean
  species?: { name: string }
}

export interface TradeOffer {
  offer_id: string
  trade_id: string
  pokemon_id: string
  offered_by: string
  created_at: string
  // Joined data for display (partial Pokemon data sufficient for trade UI)
  pokemon?: TradeOfferPokemon
}

export interface TradeRequest {
  trade_id: string
  from_player_id: string
  from_username: string
  created_at: string
}
