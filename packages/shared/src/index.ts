// @pokemon-idle/shared
// Shared types and utilities for Pokemon Idle MMO
//
// This package is intended to consolidate duplicated types between
// apps/web and apps/game-server. Migration is incremental.
//
// TODO: Migrate these types from their current locations:
// - Pokemon, PokemonSpecies, WildPokemon (apps/game-server/src/types.ts, apps/web/src/types/game.ts)
// - BattleTurn, BattleSequence, CatchSequence (duplicated in both)
// - ChatChannel, ChatMessage (apps/game-server/src/types.ts, apps/web/src/types/chat.ts)
// - Friend, FriendRequest, Trade types (duplicated)
// - LeaderboardEntry, LeaderboardType (duplicated)
//
// TODO: Migrate these utilities:
// - xpForLevel / getXPForLevel (apps/game-server/src/game.ts, apps/web/src/types/game.ts)
// - CHAT_CHANNELS constant (duplicated in 3 places)

export const CHAT_CHANNELS = ['global', 'trade', 'guild', 'system'] as const
export type ChatChannel = typeof CHAT_CHANNELS[number]

// XP calculation (medium-fast growth curve)
export function xpForLevel(level: number): number {
  return Math.floor((6 * Math.pow(level, 3)) / 5)
}

// Get XP progress within current level
export function getXPProgress(currentXP: number, currentLevel: number): { current: number; needed: number; percent: number } {
  const currentLevelXP = xpForLevel(currentLevel)
  const nextLevelXP = xpForLevel(currentLevel + 1)
  const xpIntoLevel = currentXP - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  return {
    current: xpIntoLevel,
    needed: xpNeeded,
    percent: Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100))
  }
}
