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
