/**
 * Individual Values (IVs) Generation System
 *
 * IVs are hidden stats (0-31) that create variation between Pokemon of the same species.
 * This module provides algorithms for generating IVs with a bell-curve distribution
 * that favors middle values while making perfect (31) and zero (0) IVs rare but achievable.
 *
 * Distribution targets:
 * - Middle values (10-20): ~50% probability
 * - Perfect IV (31): ~4% per stat
 * - Zero IV (0): ~1% per stat
 * - 6x31 perfect Pokemon: ~1 in 244 million (practically impossible via catching)
 */

export interface IVs {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface IVGenerationOptions {
  /** Shiny Pokemon get floor=5 and 3 guaranteed perfect IVs */
  isShiny?: boolean
  /** Zone-based modifier adds 0-5 to IV floor for late-game zones */
  zoneModifier?: number
  /** Encounter type affects IV floor and guaranteed perfects */
  encounterType?: 'wild' | 'gift' | 'legendary' | 'bred'
  /** Override minimum IV for all stats */
  guaranteedFloor?: number
  /** Override number of guaranteed perfect IVs */
  guaranteedPerfectCount?: number
}

// IV generation constants
const IV_MIN = 0
const IV_MAX = 31
const PERFECT_IV_CHANCE = 0.04 // 4% chance for perfect (31)
const ZERO_IV_CHANCE = 0.01 // 1% chance for zero (0)

/**
 * Beta distribution approximation using the Kumaraswamy distribution.
 * For parameters a=b=2, this produces a symmetric bell curve centered at 0.5.
 *
 * @param a Shape parameter (use 2 for bell curve)
 * @param b Shape parameter (use 2 for bell curve)
 * @returns Random value between 0 and 1 with bell-curve distribution
 */
function betaDistribution(a: number, b: number): number {
  // Kumaraswamy distribution CDF^(-1)(u) = (1 - (1-u)^(1/b))^(1/a)
  const u = Math.random()
  return Math.pow(1 - Math.pow(1 - u, 1 / b), 1 / a)
}

/**
 * Generate a single IV using a weighted distribution.
 *
 * Uses a beta distribution approximation for the bell curve,
 * with special handling for extreme values (0 and 31).
 *
 * @param floor Minimum IV value (for special encounters)
 * @param ceiling Maximum IV value (optional cap)
 * @returns IV value from 0-31
 */
export function generateSingleIV(floor: number = 0, ceiling: number = 31): number {
  // Clamp floor and ceiling to valid range
  const effectiveFloor = Math.max(IV_MIN, Math.min(floor, IV_MAX))
  const effectiveCeiling = Math.min(IV_MAX, Math.max(ceiling, effectiveFloor))

  const roll = Math.random()

  // Special roll for perfect IV (31) - only if ceiling allows
  if (effectiveCeiling >= 31 && roll < PERFECT_IV_CHANCE) {
    return 31
  }

  // Special roll for zero IV (0) - only if floor allows
  if (effectiveFloor === 0 && roll < PERFECT_IV_CHANCE + ZERO_IV_CHANCE) {
    return 0
  }

  // Generate bell-curve distributed IV using Beta(2, 2)
  const betaValue = betaDistribution(2, 2)

  // Map beta [0,1] to IV range [floor, ceiling]
  const range = effectiveCeiling - effectiveFloor
  const rawIV = effectiveFloor + Math.round(betaValue * range)

  return Math.max(effectiveFloor, Math.min(effectiveCeiling, rawIV))
}

/**
 * Generate a complete set of 6 IVs for a Pokemon.
 *
 * @param options Generation options for different encounter types
 * @returns IVs object with all 6 stat IVs
 */
export function generateIVs(options: IVGenerationOptions = {}): IVs {
  const {
    isShiny = false,
    zoneModifier = 0,
    encounterType = 'wild',
    guaranteedFloor,
    guaranteedPerfectCount,
  } = options

  // Calculate effective floor based on modifiers
  let effectiveFloor = guaranteedFloor ?? 0

  // Apply encounter type bonuses
  switch (encounterType) {
    case 'legendary':
      effectiveFloor = Math.max(effectiveFloor, 10)
      break
    case 'gift':
      effectiveFloor = Math.max(effectiveFloor, 3)
      break
    case 'bred':
      // Bred Pokemon use inheritance, floor handled separately
      break
    case 'wild':
    default:
      // No floor bonus for wild Pokemon
      break
  }

  // Shiny bonus: minimum 5 IVs
  if (isShiny) {
    effectiveFloor = Math.max(effectiveFloor, 5)
  }

  // Zone modifier: adds 0-5 to floor based on zone difficulty
  effectiveFloor = Math.min(30, effectiveFloor + zoneModifier)

  // Generate base IVs
  const statNames: (keyof IVs)[] = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']
  const ivs: IVs = {
    hp: generateSingleIV(effectiveFloor),
    attack: generateSingleIV(effectiveFloor),
    defense: generateSingleIV(effectiveFloor),
    spAttack: generateSingleIV(effectiveFloor),
    spDefense: generateSingleIV(effectiveFloor),
    speed: generateSingleIV(effectiveFloor),
  }

  // Determine number of guaranteed perfect IVs
  let perfectCount = guaranteedPerfectCount ?? 0

  // Shiny Pokemon: guarantee at least 3 perfect IVs
  if (isShiny) {
    perfectCount = Math.max(perfectCount, 3)
  }

  // Legendary Pokemon: guarantee 3 perfect IVs
  if (encounterType === 'legendary') {
    perfectCount = Math.max(perfectCount, 3)
  }

  // Apply guaranteed perfect IVs
  if (perfectCount > 0) {
    const perfectStats = statNames.filter((stat) => ivs[stat] === 31)
    const needed = perfectCount - perfectStats.length

    if (needed > 0) {
      // Shuffle non-perfect stats and set first N to 31
      const nonPerfect = statNames.filter((stat) => ivs[stat] !== 31)
      const shuffled = [...nonPerfect].sort(() => Math.random() - 0.5)

      for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
        ivs[shuffled[i]] = 31
      }
    }
  }

  return ivs
}

/**
 * Calculate the total IV sum (0-186).
 * Used for grade calculation and sorting.
 */
export function getTotalIVs(ivs: IVs): number {
  return ivs.hp + ivs.attack + ivs.defense + ivs.spAttack + ivs.spDefense + ivs.speed
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
export function getIVGrade(ivs: IVs): 'S' | 'A' | 'B' | 'C' | 'D' {
  const total = getTotalIVs(ivs)

  if (total >= 156) return 'S'
  if (total >= 124) return 'A'
  if (total >= 93) return 'B'
  if (total >= 62) return 'C'
  return 'D'
}

/**
 * Count the number of perfect IVs (31).
 */
export function countPerfectIVs(ivs: IVs): number {
  const values = [ivs.hp, ivs.attack, ivs.defense, ivs.spAttack, ivs.spDefense, ivs.speed]
  return values.filter((v) => v === 31).length
}

/**
 * Convert IVs to database format (for storing).
 */
export function ivsToDbFormat(ivs: IVs): {
  iv_hp: number
  iv_attack: number
  iv_defense: number
  iv_sp_attack: number
  iv_sp_defense: number
  iv_speed: number
} {
  return {
    iv_hp: ivs.hp,
    iv_attack: ivs.attack,
    iv_defense: ivs.defense,
    iv_sp_attack: ivs.spAttack,
    iv_sp_defense: ivs.spDefense,
    iv_speed: ivs.speed,
  }
}

/**
 * Convert database format to IVs object.
 */
export function dbFormatToIVs(dbIVs: {
  iv_hp: number
  iv_attack: number
  iv_defense: number
  iv_sp_attack: number
  iv_sp_defense: number
  iv_speed: number
}): IVs {
  return {
    hp: dbIVs.iv_hp,
    attack: dbIVs.iv_attack,
    defense: dbIVs.iv_defense,
    spAttack: dbIVs.iv_sp_attack,
    spDefense: dbIVs.iv_sp_defense,
    speed: dbIVs.iv_speed,
  }
}
