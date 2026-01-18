// Game Types for Pokemon Idle MMO
// Re-exports shared types + frontend-only types

// Re-export shared types
export type {
  // Core
  Player,
  Pokemon,
  PokemonSpecies,
  Zone,
  WildPokemon,
  // Battle
  BattleTurn,
  BattleSequence,
  GymBattleMatchup,
  // Catching
  BallType,
  CatchSequence,
  CatchResult,
  EncounterEvent,
  // Progression
  LevelUpEvent,
  PendingEvolution,
  EvolutionEvent,
  // Leaderboard
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
  PlayerRank,
  // Common
  WSMessage,
  ShopItem,
  TickResult,
} from '@pokemon-idle/shared'

// Re-export XP utilities from shared
export { xpForLevel, getXPProgress } from '@pokemon-idle/shared'

// Alias for backward compatibility
export { xpForLevel as getXPForLevel } from '@pokemon-idle/shared'

// ========================
// Frontend-only types below
// ========================

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

import type { Player, Pokemon, Zone } from '@pokemon-idle/shared'

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
