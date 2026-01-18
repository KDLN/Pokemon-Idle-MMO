/**
 * IV (Individual Values) Utility Functions
 *
 * Provides grade calculation, color coding, and display helpers for the IV system.
 */

import type { Pokemon } from '@/types/game'

export type IVGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface IVStats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

/**
 * Extract IVs from a Pokemon object into a simpler format.
 */
export function getIVsFromPokemon(pokemon: Pokemon): IVStats {
  return {
    hp: pokemon.iv_hp ?? 0,
    attack: pokemon.iv_attack ?? 0,
    defense: pokemon.iv_defense ?? 0,
    spAttack: pokemon.iv_sp_attack ?? 0,
    spDefense: pokemon.iv_sp_defense ?? 0,
    speed: pokemon.iv_speed ?? 0,
  }
}

/**
 * Calculate the total IV sum (0-186).
 */
export function getTotalIVs(pokemon: Pokemon): number {
  return (
    (pokemon.iv_hp ?? 0) +
    (pokemon.iv_attack ?? 0) +
    (pokemon.iv_defense ?? 0) +
    (pokemon.iv_sp_attack ?? 0) +
    (pokemon.iv_sp_defense ?? 0) +
    (pokemon.iv_speed ?? 0)
  )
}

/**
 * Calculate IV grade based on total IVs.
 *
 * Grade thresholds:
 * - S: 156-186 (84%+) - Exceptional
 * - A: 124-155 (67-83%) - Excellent
 * - B: 93-123 (50-66%) - Good
 * - C: 62-92 (33-49%) - Average
 * - D: 0-61 (0-32%) - Below average
 */
export function getIVGrade(pokemon: Pokemon): IVGrade {
  const total = getTotalIVs(pokemon)

  if (total >= 156) return 'S'
  if (total >= 124) return 'A'
  if (total >= 93) return 'B'
  if (total >= 62) return 'C'
  return 'D'
}

/**
 * Get the grade description text.
 */
export function getGradeDescription(grade: IVGrade): string {
  switch (grade) {
    case 'S':
      return 'Exceptional'
    case 'A':
      return 'Excellent'
    case 'B':
      return 'Good'
    case 'C':
      return 'Average'
    case 'D':
      return 'Below Average'
  }
}

/**
 * Get the background color class for a grade badge.
 */
export function getGradeColorClass(grade: IVGrade): string {
  switch (grade) {
    case 'S':
      return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
    case 'A':
      return 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
    case 'B':
      return 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
    case 'C':
      return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
    case 'D':
      return 'bg-gradient-to-br from-red-400 to-red-500 text-white'
  }
}

/**
 * Get the border color class for a grade.
 */
export function getGradeBorderClass(grade: IVGrade): string {
  switch (grade) {
    case 'S':
      return 'border-yellow-400'
    case 'A':
      return 'border-emerald-400'
    case 'B':
      return 'border-blue-400'
    case 'C':
      return 'border-gray-400'
    case 'D':
      return 'border-red-400'
  }
}

/**
 * Get the color class for an individual IV value.
 *
 * Color coding:
 * - 0-10: red (poor)
 * - 11-20: yellow (average)
 * - 21-30: green (good)
 * - 31: gold (perfect)
 */
export function getIVColorClass(iv: number): string {
  if (iv === 31) return 'text-yellow-400'
  if (iv >= 21) return 'text-emerald-400'
  if (iv >= 11) return 'text-yellow-500'
  return 'text-red-400'
}

/**
 * Get the background color class for an IV bar.
 */
export function getIVBarColorClass(iv: number): string {
  if (iv === 31) return 'bg-gradient-to-r from-yellow-400 to-amber-400'
  if (iv >= 21) return 'bg-gradient-to-r from-emerald-400 to-green-400'
  if (iv >= 11) return 'bg-gradient-to-r from-yellow-500 to-amber-500'
  return 'bg-gradient-to-r from-red-400 to-red-500'
}

/**
 * Check if an IV is perfect (31).
 */
export function isPerfectIV(iv: number): boolean {
  return iv === 31
}

/**
 * Count the number of perfect IVs (31).
 */
export function countPerfectIVs(pokemon: Pokemon): number {
  const ivs = getIVsFromPokemon(pokemon)
  return Object.values(ivs).filter((v) => v === 31).length
}

/**
 * Get IV percentage (0-100%) for display.
 */
export function getIVPercentage(iv: number): number {
  return Math.round((iv / 31) * 100)
}

/**
 * Get total IV percentage (0-100%) for display.
 */
export function getTotalIVPercentage(pokemon: Pokemon): number {
  return Math.round((getTotalIVs(pokemon) / 186) * 100)
}

/**
 * Format IV for display with optional star for perfect.
 */
export function formatIV(iv: number): string {
  return iv === 31 ? '31' : String(iv)
}

/**
 * Get stat name for display.
 */
export function getStatName(stat: keyof IVStats): string {
  switch (stat) {
    case 'hp':
      return 'HP'
    case 'attack':
      return 'Attack'
    case 'defense':
      return 'Defense'
    case 'spAttack':
      return 'Sp. Atk'
    case 'spDefense':
      return 'Sp. Def'
    case 'speed':
      return 'Speed'
  }
}

/**
 * Get all stat names in order.
 */
export const STAT_ORDER: (keyof IVStats)[] = [
  'hp',
  'attack',
  'defense',
  'spAttack',
  'spDefense',
  'speed',
]

/**
 * Sort Pokemon by total IVs (highest first).
 */
export function sortByTotalIVs(pokemon: Pokemon[]): Pokemon[] {
  return [...pokemon].sort((a, b) => getTotalIVs(b) - getTotalIVs(a))
}

/**
 * Sort Pokemon by a specific IV stat (highest first).
 */
export function sortByIVStat(
  pokemon: Pokemon[],
  stat: keyof IVStats
): Pokemon[] {
  const getIV = (p: Pokemon): number => {
    switch (stat) {
      case 'hp':
        return p.iv_hp ?? 0
      case 'attack':
        return p.iv_attack ?? 0
      case 'defense':
        return p.iv_defense ?? 0
      case 'spAttack':
        return p.iv_sp_attack ?? 0
      case 'spDefense':
        return p.iv_sp_defense ?? 0
      case 'speed':
        return p.iv_speed ?? 0
    }
  }
  return [...pokemon].sort((a, b) => getIV(b) - getIV(a))
}

/**
 * Sort Pokemon by grade (S first, then A, B, C, D).
 */
export function sortByGrade(pokemon: Pokemon[]): Pokemon[] {
  const gradeOrder: Record<IVGrade, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }
  return [...pokemon].sort(
    (a, b) => gradeOrder[getIVGrade(a)] - gradeOrder[getIVGrade(b)]
  )
}

/**
 * Filter Pokemon by minimum grade.
 */
export function filterByMinGrade(
  pokemon: Pokemon[],
  minGrade: IVGrade
): Pokemon[] {
  const gradeOrder: Record<IVGrade, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 }
  const minOrder = gradeOrder[minGrade]
  return pokemon.filter((p) => gradeOrder[getIVGrade(p)] <= minOrder)
}

/**
 * Filter Pokemon that have at least one perfect IV.
 */
export function filterHasPerfectIV(pokemon: Pokemon[]): Pokemon[] {
  return pokemon.filter((p) => countPerfectIVs(p) > 0)
}

/**
 * Filter Pokemon that have at least N perfect IVs.
 */
export function filterByMinPerfectIVs(
  pokemon: Pokemon[],
  minPerfect: number
): Pokemon[] {
  return pokemon.filter((p) => countPerfectIVs(p) >= minPerfect)
}
