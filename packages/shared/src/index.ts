// @pokemon-idle/shared
// Shared types and utilities for Pokemon Idle MMO

// Re-export all types
export * from './types/index.js'

// Chat channel constant (includes whisper for frontend compatibility)
export const CHAT_CHANNELS = ['global', 'trade', 'guild', 'system', 'whisper'] as const

// XP calculation (medium-fast growth curve)
export function xpForLevel(level: number): number {
  return Math.floor((6 * Math.pow(level, 3)) / 5)
}

// Get XP progress within current level
// Shows XP accumulated in current level vs XP needed to reach next level
export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  const currentLevelXP = xpForLevel(level)
  const nextLevelXP = xpForLevel(level + 1)
  const xpIntoLevel = xp - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  return {
    current: xpIntoLevel,
    needed: xpNeeded,
    percentage: Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100))
  }
}
