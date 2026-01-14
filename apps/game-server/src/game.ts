import type {
  Pokemon,
  PokemonSpecies,
  Zone,
  WildPokemon,
  EncounterEvent,
  CatchResult,
  LevelUpEvent,
  TickResult,
  PlayerSession,
  EncounterTableEntry,
  BattleTurn,
  BattleSequence,
  CatchSequence,
  GymBattleMatchup,
  Move,
  BallType
} from './types.js'
import type { GymLeader, GymLeaderPokemon } from './db.js'

// Stat calculation
export function calculateHP(baseHP: number, level: number): number {
  return Math.floor((2 * baseHP * level / 100) + level + 10)
}

export function calculateStat(baseStat: number, level: number): number {
  return Math.floor((2 * baseStat * level / 100) + 5)
}

export function recalculateStats(pokemon: Pokemon, species: PokemonSpecies): void {
  const level = pokemon.level
  pokemon.max_hp = calculateHP(species.base_hp, level)
  pokemon.stat_attack = calculateStat(species.base_attack, level)
  pokemon.stat_defense = calculateStat(species.base_defense, level)
  pokemon.stat_sp_attack = calculateStat(species.base_sp_attack, level)
  pokemon.stat_sp_defense = calculateStat(species.base_sp_defense, level)
  pokemon.stat_speed = calculateStat(species.base_speed, level)
  pokemon.current_hp = pokemon.max_hp // Full heal on level up
}

// XP calculation (medium-fast growth)
export function xpForLevel(level: number): number {
  return Math.floor((6 * Math.pow(level, 3)) / 5)
}

// Generate wild pokemon
export function generateWildPokemon(species: PokemonSpecies, level: number): WildPokemon {
  return {
    species_id: species.id,
    species,
    level,
    max_hp: calculateHP(species.base_hp, level),
    stat_attack: calculateStat(species.base_attack, level),
    stat_defense: calculateStat(species.base_defense, level),
    is_shiny: rollShiny()
  }
}

// Roll encounter
export function rollEncounter(encounterRate: number): boolean {
  return Math.random() < encounterRate
}

// Roll species from encounter table
export function rollEncounterSpecies(encounterTable: EncounterTableEntry[]): PokemonSpecies | null {
  if (encounterTable.length === 0) return null

  const roll = Math.random()
  let cumulative = 0

  for (const entry of encounterTable) {
    cumulative += entry.encounter_rate
    if (roll < cumulative && entry.species) {
      return entry.species
    }
  }

  // Fallback to last entry
  const last = encounterTable[encounterTable.length - 1]
  return last.species || null
}

// Roll level within zone range
export function rollLevel(minLevel: number, maxLevel: number): number {
  if (maxLevel <= minLevel) return minLevel
  return minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1))
}

// Roll for shiny (1/4096 chance, like modern Pokemon games)
const SHINY_RATE = 1 / 4096
export function rollShiny(): boolean {
  return Math.random() < SHINY_RATE
}

// Type effectiveness chart
// 2 = super effective, 0.5 = not very effective, 0 = no effect
const TYPE_CHART: Record<string, Record<string, number>> = {
  NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5 },
  FIRE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, BUG: 2, ROCK: 0.5, DRAGON: 0.5, STEEL: 2 },
  WATER: { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5 },
  ELECTRIC: { WATER: 2, ELECTRIC: 0.5, GRASS: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5 },
  GRASS: { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, BUG: 0.5, ROCK: 2, DRAGON: 0.5, STEEL: 0.5 },
  ICE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: 0.5 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2, FAIRY: 0.5 },
  POISON: { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0, FAIRY: 2 },
  GROUND: { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, BUG: 0.5, ROCK: 2, STEEL: 2 },
  FLYING: { ELECTRIC: 0.5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: 0.5, STEEL: 0.5 },
  PSYCHIC: { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5 },
  BUG: { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2, STEEL: 0.5, FAIRY: 0.5 },
  ROCK: { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2, STEEL: 0.5 },
  GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5 },
  DRAGON: { DRAGON: 2, STEEL: 0.5, FAIRY: 0 },
  DARK: { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, FAIRY: 0.5 },
  STEEL: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, ROCK: 2, STEEL: 0.5, FAIRY: 2 },
  FAIRY: { FIRE: 0.5, FIGHTING: 2, POISON: 0.5, DRAGON: 2, DARK: 2, STEEL: 0.5 },
}

const DEFAULT_MOVE: Move = {
  name: 'Tackle',
  type: 'Normal',
  power: 40,
  accuracy: 0.95,
}

const TYPE_MOVE_POOL: Record<string, Move[]> = {
  NORMAL: [
    { name: 'Tackle', type: 'Normal', power: 40, accuracy: 0.95 },
    { name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 0.9 },
  ],
  FIRE: [
    { name: 'Flame Burst', type: 'Fire', power: 50, accuracy: 0.9, status: { name: 'burn', chance: 0.2 } },
    { name: 'Ember', type: 'Fire', power: 40, accuracy: 1, status: { name: 'burn', chance: 0.1 } },
  ],
  WATER: [
    { name: 'Water Gun', type: 'Water', power: 45, accuracy: 0.95 },
    { name: 'Bubble Beam', type: 'Water', power: 50, accuracy: 0.9 },
  ],
  GRASS: [
    { name: 'Vine Whip', type: 'Grass', power: 45, accuracy: 0.95 },
    { name: 'Razor Leaf', type: 'Grass', power: 55, accuracy: 0.9 },
  ],
  ELECTRIC: [
    { name: 'Spark', type: 'Electric', power: 65, accuracy: 0.9, status: { name: 'paralysis', chance: 0.15 } },
  ],
  FLYING: [
    { name: 'Peck', type: 'Flying', power: 35, accuracy: 1 },
    { name: 'Wing Attack', type: 'Flying', power: 60, accuracy: 0.88 },
  ],
  BUG: [
    { name: 'String Shot', type: 'Bug', power: 30, accuracy: 1 },
    { name: 'Bug Bite', type: 'Bug', power: 55, accuracy: 0.9 },
  ],
  ROCK: [
    { name: 'Rock Throw', type: 'Rock', power: 50, accuracy: 0.9 },
  ],
  POISON: [
    { name: 'Poison Sting', type: 'Poison', power: 40, accuracy: 1, status: { name: 'poison', chance: 0.2 } },
  ],
}

const SPECIES_MOVES: Record<number, Move[]> = {
  1: [
    { name: 'Vine Whip', type: 'Grass', power: 45, accuracy: 0.95 },
    { name: 'Seed Bomb', type: 'Grass', power: 55, accuracy: 0.9 },
  ],
  4: [
    { name: 'Ember', type: 'Fire', power: 40, accuracy: 1 },
    { name: 'Dragon Breath', type: 'Dragon', power: 60, accuracy: 0.9 },
  ],
  7: [
    { name: 'Water Gun', type: 'Water', power: 45, accuracy: 0.95 },
    { name: 'Bubble', type: 'Water', power: 40, accuracy: 1 },
  ],
  16: [
    { name: 'Gust', type: 'Flying', power: 40, accuracy: 1 },
  ],
}

function getSpeciesMoves(species: PokemonSpecies): Move[] {
  if (SPECIES_MOVES[species.id]) {
    return SPECIES_MOVES[species.id]
  }
  const typeKey = species.type1?.toUpperCase() ?? 'NORMAL'
  return TYPE_MOVE_POOL[typeKey] || [DEFAULT_MOVE]
}

function selectMove(attacker: PokemonSpecies, defender: PokemonSpecies): Move {
  const moves = getSpeciesMoves(attacker)
  let bestMove = moves[0]
  let bestScore = 0

  for (const move of moves) {
    const effectiveness = getTypeEffectiveness(move.type, defender.type1, defender.type2)
    const score = effectiveness * move.power
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

function applyStatusEffect(move: Move): string | undefined {
  if (!move.status) return undefined
  if (Math.random() > move.status.chance) return undefined
  return move.status.name
}

// Calculate type effectiveness multiplier
export function getTypeEffectiveness(attackerType: string, defenderType1: string, defenderType2: string | null): number {
  let multiplier = 1.0
  const attackType = attackerType.toUpperCase()
  const defType1 = defenderType1.toUpperCase()

  // Check effectiveness against first type
  if (TYPE_CHART[attackType]?.[defType1] !== undefined) {
    multiplier *= TYPE_CHART[attackType][defType1]
  }

  // Check effectiveness against second type if exists
  if (defenderType2) {
    const defType2 = defenderType2.toUpperCase()
    if (TYPE_CHART[attackType]?.[defType2] !== undefined) {
      multiplier *= TYPE_CHART[attackType][defType2]
    }
  }

  return multiplier
}

// Get the best type effectiveness from party against wild Pokemon
export function getBestTypeAdvantage(party: (Pokemon | null)[], wild: WildPokemon, speciesMap: Map<number, PokemonSpecies>): { multiplier: number; attackerType: string | null } {
  let bestMultiplier = 1.0
  let bestType: string | null = null

  for (const p of party) {
    if (!p || p.current_hp <= 0) continue

    const species = speciesMap.get(p.species_id)
    if (!species) continue

    // Check type1
    const mult1 = getTypeEffectiveness(species.type1, wild.species.type1, wild.species.type2)
    if (mult1 > bestMultiplier) {
      bestMultiplier = mult1
      bestType = species.type1
    }

    // Check type2 if exists
    if (species.type2) {
      const mult2 = getTypeEffectiveness(species.type2, wild.species.type1, wild.species.type2)
      if (mult2 > bestMultiplier) {
        bestMultiplier = mult2
        bestType = species.type2
      }
    }
  }

  return { multiplier: bestMultiplier, attackerType: bestType }
}

// ============================================
// 1v1 BATTLE SYSTEM
// ============================================

// Get first healthy Pokemon (lead)
export function getLeadPokemon(party: (Pokemon | null)[]): Pokemon | null {
  for (const p of party) {
    if (p && p.current_hp > 0) return p
  }
  return null
}

// Calculate damage for a single attack
export function calculateDamage(
  attackerLevel: number,
  attackerAttack: number,
  defenderDefense: number,
  typeMultiplier: number,
  basePower: number = 40  // Default move power for idle game
): { damage: number; isCritical: boolean } {
  // Simplified damage formula based on Gen 1-3
  const levelFactor = ((2 * attackerLevel) / 5) + 2
  const attackDefenseRatio = attackerAttack / Math.max(1, defenderDefense)
  const baseDamage = ((levelFactor * basePower * attackDefenseRatio) / 50) + 2

  // Critical hit (6.25% chance)
  const isCritical = Math.random() < 0.0625
  const critMultiplier = isCritical ? 1.5 : 1

  // Random variance (85-100%)
  const randomFactor = 0.85 + Math.random() * 0.15

  // Type effectiveness
  const finalDamage = Math.max(1, Math.floor(baseDamage * typeMultiplier * critMultiplier * randomFactor))

  return { damage: finalDamage, isCritical }
}

// Convert type multiplier to effectiveness text
function getEffectivenessCategory(multiplier: number): 'super' | 'neutral' | 'not_very' | 'immune' {
  if (multiplier === 0) return 'immune'
  if (multiplier >= 2) return 'super'
  if (multiplier < 1) return 'not_very'
  return 'neutral'
}

// Simulate full 1v1 battle with turn sequence
export function simulate1v1Battle(
  lead: Pokemon,
  leadSpecies: PokemonSpecies,
  wild: WildPokemon,
  speciesMap: Map<number, PokemonSpecies>
): BattleSequence {
  const turns: BattleTurn[] = []

  let leadHP = lead.current_hp
  let wildHP = wild.max_hp
  const leadMaxHP = lead.max_hp
  const wildMaxHP = wild.max_hp

  // Calculate type effectiveness both ways
  const leadTypeMultiplier = getTypeEffectiveness(
    leadSpecies.type1,
    wild.species.type1,
    wild.species.type2
  )
  const wildTypeMultiplier = getTypeEffectiveness(
    wild.species.type1,
    leadSpecies.type1,
    leadSpecies.type2
  )

  let turnNumber = 0
  const MAX_TURNS = 10  // Prevent infinite loops

  // Determine who goes first (speed comparison)
  const leadFirst = lead.stat_speed >= wild.stat_attack // Using stat_attack as proxy for wild speed

  while (leadHP > 0 && wildHP > 0 && turnNumber < MAX_TURNS) {
    // Determine attacker based on turn and speed
    const isEvenTurn = turnNumber % 2 === 0
    const playerAttacks = isEvenTurn === leadFirst

    if (playerAttacks) {
      // Lead Pokemon attacks wild
      const attackStat = Math.max(lead.stat_attack, lead.stat_sp_attack)
  const leadMove = selectMove(leadSpecies, wild.species)
  const { damage, isCritical } = calculateDamage(
    lead.level,
    attackStat,
    wild.stat_defense,
    leadTypeMultiplier,
    leadMove.power
  )

      const wildHPBefore = wildHP
      wildHP = Math.max(0, wildHP - damage)

      const statusEffect = applyStatusEffect(leadMove)

      turns.push({
        turn_number: turnNumber,
        attacker: 'player',
        attacker_name: leadSpecies.name,
        defender_name: wild.species.name,
        damage_dealt: damage,
        is_critical: isCritical,
        effectiveness: getEffectivenessCategory(leadTypeMultiplier),
        attacker_hp_after: leadHP,
        defender_hp_after: wildHP,
        attacker_max_hp: leadMaxHP,
        defender_max_hp: wildMaxHP
        ,
        move_name: leadMove.name,
        move_type: leadMove.type,
        status_effect: statusEffect
      })
    } else {
      // Wild Pokemon attacks lead
      const wildMove = selectMove(wild.species, leadSpecies)
      const { damage, isCritical } = calculateDamage(
        wild.level,
        wild.stat_attack,
        Math.max(lead.stat_defense, lead.stat_sp_defense),
        wildTypeMultiplier,
        wildMove.power
      )

      const leadHPBefore = leadHP
      leadHP = Math.max(0, leadHP - damage)

      turns.push({
        turn_number: turnNumber,
        attacker: 'wild',
        attacker_name: wild.species.name,
        defender_name: leadSpecies.name,
        damage_dealt: damage,
        is_critical: isCritical,
        effectiveness: getEffectivenessCategory(wildTypeMultiplier),
        attacker_hp_after: wildHP,
        defender_hp_after: leadHP,
        attacker_max_hp: wildMaxHP,
        defender_max_hp: leadMaxHP
        ,
        move_name: wildMove.name,
        move_type: wildMove.type,
        status_effect: applyStatusEffect(wildMove)
      })
    }

    turnNumber++
  }

  const playerWon = wildHP <= 0
  const xpEarned = playerWon ? Math.floor((wild.species.base_xp_yield * wild.level) / 7) : 0

  return {
    lead_pokemon_id: lead.id,
    lead_pokemon_name: leadSpecies.name,
    lead_species_id: lead.species_id,
    lead_level: lead.level,
    lead_starting_hp: lead.current_hp,
    lead_max_hp: leadMaxHP,
    lead_type1: leadSpecies.type1,
    lead_type2: leadSpecies.type2,
    wild_starting_hp: wild.max_hp,
    wild_max_hp: wildMaxHP,
    turns,
    final_outcome: playerWon ? 'player_win' : 'player_faint',
    lead_final_hp: leadHP,
    xp_earned: xpEarned
  }
}

// Battle result with type effectiveness info
export interface BattleResult {
  outcome: 'win' | 'lose' | 'fled' | 'wipe'
  typeEffectiveness: number
  effectivenessText: string | null // 'super_effective', 'not_very_effective', 'no_effect', null for neutral
  battleSequence?: BattleSequence  // Full battle animation data
}

// Battle resolution using 1v1 lead Pokemon system
export function resolveBattle(
  party: (Pokemon | null)[],
  wild: WildPokemon,
  speciesMap: Map<number, PokemonSpecies>
): BattleResult {
  // Get lead Pokemon
  const lead = getLeadPokemon(party)

  if (!lead) {
    return { outcome: 'wipe', typeEffectiveness: 1, effectivenessText: null }
  }

  const leadSpecies = speciesMap.get(lead.species_id)
  if (!leadSpecies) {
    // Fallback if species not found
    return { outcome: 'fled', typeEffectiveness: 1, effectivenessText: null }
  }

  // Simulate the actual 1v1 battle
  const battleSequence = simulate1v1Battle(lead, leadSpecies, wild, speciesMap)

  // Apply damage to lead Pokemon (persistent damage!)
  lead.current_hp = battleSequence.lead_final_hp

  // Determine type effectiveness text from lead's attacks
  const leadTypeMultiplier = getTypeEffectiveness(
    leadSpecies.type1,
    wild.species.type1,
    wild.species.type2
  )

  let effectivenessText: string | null = null
  if (leadTypeMultiplier >= 2) {
    effectivenessText = 'super_effective'
  } else if (leadTypeMultiplier <= 0.5 && leadTypeMultiplier > 0) {
    effectivenessText = 'not_very_effective'
  } else if (leadTypeMultiplier === 0) {
    effectivenessText = 'no_effect'
  }

  const outcome = battleSequence.final_outcome === 'player_win' ? 'win' : 'fled'

  return {
    outcome,
    typeEffectiveness: leadTypeMultiplier,
    effectivenessText,
    battleSequence
  }
}

// Ball type modifiers
const BALL_MODIFIERS: Record<BallType, number> = {
  pokeball: 1.0,
  great_ball: 1.5
}

// Catch attempt with animation sequence data
export function attemptCatch(
  wild: WildPokemon,
  ballCount: number,
  ballType: BallType
): { result: CatchResult; newBallCount: number } {
  if (ballCount <= 0) {
    return { result: { success: false, balls_used: 0, ball_type: ballType }, newBallCount: ballCount }
  }

  const baseCatchRate = wild.species.base_catch_rate
  const ballModifier = BALL_MODIFIERS[ballType]

  let catchChance = (baseCatchRate * ballModifier) / 255.0

  // Level modifier
  const levelMod = Math.max(0.5, 1.0 - wild.level * 0.02)
  catchChance *= levelMod

  // Clamp
  catchChance = Math.max(0.05, Math.min(0.95, catchChance))

  const newBallCount = ballCount - 1
  const success = Math.random() < catchChance

  // Calculate shake count for animation
  // Success = full 3 shakes, failure = 1-3 based on how close the catch was
  let shakeCount: number
  let breakFreeShake: number | undefined

  if (success) {
    shakeCount = 3  // Full shakes on success
  } else {
    // Failed catch - break free after 1-3 shakes based on catch rate
    const normalizedChance = catchChance / 0.95
    if (normalizedChance > 0.66) {
      shakeCount = 3
      breakFreeShake = 3  // Almost had it
    } else if (normalizedChance > 0.33) {
      shakeCount = 2
      breakFreeShake = 2  // Getting close
    } else {
      shakeCount = 1
      breakFreeShake = 1  // Broke out quickly
    }
  }

  const catchSequence: CatchSequence = {
    shake_count: shakeCount,
    success,
    break_free_shake: breakFreeShake
  }

  const catchStrength = catchChance
  const closeCall = catchStrength > 0.7 && catchStrength < 0.95
  const critical = catchStrength >= 0.95

  return {
    result: {
      success,
      balls_used: 1,
      ball_type: ballType,
      catch_sequence: catchSequence,
      catch_strength: catchStrength,
      close_call: closeCall,
      critical
    },
    newBallCount
  }
}

// Calculate money earned from defeating a wild Pokemon
export function calculateMoneyReward(wild: WildPokemon): number {
  // Base reward is based on wild Pokemon's level
  // Formula: level * 10 + random bonus
  const baseReward = wild.level * 10
  const bonus = Math.floor(Math.random() * (wild.level * 5))
  return baseReward + bonus
}

// XP distribution - only lead Pokemon gets XP in 1v1 system
export function distributeXP(party: (Pokemon | null)[], wild: WildPokemon, battleSequence?: BattleSequence): Record<string, number> {
  // If we have battle sequence data, use the pre-calculated XP for lead only
  if (battleSequence) {
    const lead = getLeadPokemon(party)
    if (!lead) return {}

    const xpEarned = battleSequence.xp_earned
    lead.xp += xpEarned
    return { [lead.id]: xpEarned }
  }

  // Fallback to old behavior if no battle sequence (shouldn't happen)
  const baseXP = wild.species.base_xp_yield
  const totalXP = Math.floor((baseXP * wild.level) / 7)

  const lead = getLeadPokemon(party)
  if (!lead) return {}

  lead.xp += totalXP
  return { [lead.id]: totalXP }
}

// Check for level ups
export function checkLevelUps(party: (Pokemon | null)[], speciesMap: Map<number, PokemonSpecies>): LevelUpEvent[] {
  const levelUps: LevelUpEvent[] = []

  for (const p of party) {
    if (!p) continue

    let xpNeeded = xpForLevel(p.level + 1)
    while (p.xp >= xpNeeded && p.level < 100) {
      p.level++

      const species = speciesMap.get(p.species_id)
      if (species) {
        recalculateStats(p, species)
      }

      levelUps.push({
        pokemon_id: p.id,
        pokemon_name: species?.name || `Pokemon #${p.species_id}`,
        new_level: p.level,
        new_stats: {
          max_hp: p.max_hp,
          attack: p.stat_attack,
          defense: p.stat_defense,
          sp_attack: p.stat_sp_attack,
          sp_defense: p.stat_sp_defense,
          speed: p.stat_speed
        }
      })

      xpNeeded = xpForLevel(p.level + 1)
    }
  }

  return levelUps
}

// Process encounter
export function processEncounter(
  party: (Pokemon | null)[],
  zone: Zone,
  encounterTable: EncounterTableEntry[],
  pokeballs: number,
  great_balls: number,
  speciesMap: Map<number, PokemonSpecies>
): { encounter: EncounterEvent | null; newPokeballs: number; newGreatBalls: number } {
  const species = rollEncounterSpecies(encounterTable)
  if (!species) {
    return { encounter: null, newPokeballs: pokeballs, newGreatBalls: great_balls }
  }

  const level = rollLevel(zone.min_level, zone.max_level)
  const wild = generateWildPokemon(species, level)
  const battleResult = resolveBattle(party, wild, speciesMap)

  const encounter: EncounterEvent = {
    wild_pokemon: wild,
    battle_result: battleResult.outcome,
    type_effectiveness: battleResult.typeEffectiveness,
    effectiveness_text: battleResult.effectivenessText,
    battle_sequence: battleResult.battleSequence  // Include battle animation data
  }

  let newPokeballs = pokeballs
  let newGreatBalls = great_balls

  // If won and have any balls, attempt catch
  // Prefer Great Balls over Poke Balls for better catch rate
  if (battleResult.outcome === 'win') {
    if (great_balls > 0) {
      const { result, newBallCount } = attemptCatch(wild, great_balls, 'great_ball')
      encounter.catch_result = result
      newGreatBalls = newBallCount
    } else if (pokeballs > 0) {
      const { result, newBallCount } = attemptCatch(wild, pokeballs, 'pokeball')
      encounter.catch_result = result
      newPokeballs = newBallCount
    }
  }

  return { encounter, newPokeballs, newGreatBalls }
}

// Process tick
export function processTick(
  session: PlayerSession,
  speciesMap: Map<number, PokemonSpecies>
): TickResult {
  session.tickNumber++

  const result: TickResult = {
    tick_number: session.tickNumber,
    pokeballs: session.pokeballs,
    great_balls: session.great_balls
  }

  // Only process encounters in route zones
  if (session.zone.zone_type !== 'route') {
    return result
  }

  // Roll for encounter
  if (!rollEncounter(session.zone.base_encounter_rate)) {
    return result
  }

  // Process encounter
  const { encounter, newPokeballs, newGreatBalls } = processEncounter(
    session.party,
    session.zone,
    session.encounterTable,
    session.pokeballs,
    session.great_balls,
    speciesMap
  )

  if (!encounter) {
    return result
  }

  session.pokeballs = newPokeballs
  session.great_balls = newGreatBalls
  result.encounter = encounter
  result.pokeballs = newPokeballs
  result.great_balls = newGreatBalls

  // Apply XP and money if battle won
  if (encounter.battle_result === 'win') {
    result.xp_gained = distributeXP(session.party, encounter.wild_pokemon, encounter.battle_sequence)
    result.level_ups = checkLevelUps(session.party, speciesMap)

    // Award money
    const moneyEarned = calculateMoneyReward(encounter.wild_pokemon)
    session.pokedollars += moneyEarned
    result.money_earned = moneyEarned
    result.total_money = session.pokedollars
  }

  return result
}

// ============================================
// GYM BATTLE LOGIC
// ============================================

export interface GymBattleResult {
  success: boolean
  gym_leader_id: string
  badge_earned?: string
  badge_name?: string
  money_earned?: number
  battle_log: string[]
  matchups: GymBattleMatchup[]  // Full battle sequence data
  error?: string
}

// Calculate gym Pokemon stats
function calculateGymPokemonStats(pokemon: GymLeaderPokemon): {
  maxHp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
} {
  if (!pokemon.species) {
    return { maxHp: 20, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 }
  }
  const level = pokemon.level
  return {
    maxHp: calculateHP(pokemon.species.base_hp, level),
    attack: calculateStat(pokemon.species.base_attack, level),
    defense: calculateStat(pokemon.species.base_defense, level),
    spAttack: calculateStat(pokemon.species.base_sp_attack, level),
    spDefense: calculateStat(pokemon.species.base_sp_defense, level),
    speed: calculateStat(pokemon.species.base_speed, level)
  }
}

// Simulate a single 1v1 matchup within a gym battle
function simulateGymMatchup(
  playerPokemon: Pokemon,
  playerSpecies: PokemonSpecies,
  gymPokemon: GymLeaderPokemon,
  gymStats: { maxHp: number; attack: number; defense: number; spAttack: number; spDefense: number; speed: number }
): GymBattleMatchup {
  const turns: BattleTurn[] = []

  let playerHP = playerPokemon.current_hp
  let gymHP = gymStats.maxHp
  const playerMaxHP = playerPokemon.max_hp
  const gymMaxHP = gymStats.maxHp

  // Calculate type effectiveness both ways
  const playerTypeMultiplier = getTypeEffectiveness(
    playerSpecies.type1,
    gymPokemon.type1,
    gymPokemon.type2
  )
  const gymTypeMultiplier = getTypeEffectiveness(
    gymPokemon.type1,
    playerSpecies.type1,
    playerSpecies.type2
  )

  let turnNumber = 0
  const MAX_TURNS = 15  // Slightly longer than wild battles

  // Determine who goes first (speed comparison)
  const playerFirst = playerPokemon.stat_speed >= gymStats.speed

  while (playerHP > 0 && gymHP > 0 && turnNumber < MAX_TURNS) {
    const isEvenTurn = turnNumber % 2 === 0
    const playerAttacks = isEvenTurn === playerFirst

    if (playerAttacks) {
      // Player Pokemon attacks gym Pokemon
      const attackStat = Math.max(playerPokemon.stat_attack, playerPokemon.stat_sp_attack)
      const playerMove = selectMove(playerSpecies, {
        type1: gymPokemon.type1,
        type2: gymPokemon.type2,
        base_hp: gymStats.maxHp,
        base_attack: gymStats.attack,
        base_defense: gymStats.defense,
        base_sp_attack: gymStats.spAttack,
        base_sp_defense: gymStats.spDefense,
        base_speed: gymStats.speed,
        base_catch_rate: 0,
        base_xp_yield: 0,
        id: gymPokemon.species_id,
        name: gymPokemon.species_name
      } as PokemonSpecies)
      const { damage, isCritical } = calculateDamage(
        playerPokemon.level,
        attackStat,
        gymStats.defense,
        playerTypeMultiplier,
        playerMove.power
      )

      gymHP = Math.max(0, gymHP - damage)

      turns.push({
        turn_number: turnNumber,
        attacker: 'player',
        attacker_name: playerSpecies.name,
        defender_name: gymPokemon.species_name,
        damage_dealt: damage,
        is_critical: isCritical,
        effectiveness: getEffectivenessCategory(playerTypeMultiplier),
        attacker_hp_after: playerHP,
        defender_hp_after: gymHP,
        attacker_max_hp: playerMaxHP,
        defender_max_hp: gymMaxHP
        ,
        move_name: playerMove.name,
        move_type: playerMove.type,
        status_effect: applyStatusEffect(playerMove)
      })
    } else {
      // Gym Pokemon attacks player Pokemon
        const gymMove = selectMove(
          { id: gymPokemon.species_id, name: gymPokemon.species_name, type1: gymPokemon.type1, type2: gymPokemon.type2, base_hp: gymStats.maxHp, base_attack: gymStats.attack, base_defense: gymStats.defense, base_sp_attack: gymStats.spAttack, base_sp_defense: gymStats.spDefense, base_speed: gymStats.speed, base_catch_rate: 0, base_xp_yield: 0 },
          playerSpecies
        )
        const { damage, isCritical } = calculateDamage(
          gymPokemon.level,
          Math.max(gymStats.attack, gymStats.spAttack),
          Math.max(playerPokemon.stat_defense, playerPokemon.stat_sp_defense),
          gymTypeMultiplier,
          gymMove.power
        )

      playerHP = Math.max(0, playerHP - damage)

      turns.push({
        turn_number: turnNumber,
        attacker: 'gym',
        attacker_name: gymPokemon.species_name,
        defender_name: playerSpecies.name,
        damage_dealt: damage,
        is_critical: isCritical,
        effectiveness: getEffectivenessCategory(gymTypeMultiplier),
        attacker_hp_after: gymHP,
        defender_hp_after: playerHP,
        attacker_max_hp: gymMaxHP,
        defender_max_hp: playerMaxHP
        ,
        move_name: gymMove.name,
        move_type: gymMove.type,
        status_effect: applyStatusEffect(gymMove)
      })
    }

    turnNumber++
  }

  const playerWon = gymHP <= 0

  return {
    player_pokemon_id: playerPokemon.id,
    player_pokemon_name: playerSpecies.name,
    player_species_id: playerPokemon.species_id,
    player_level: playerPokemon.level,
    player_starting_hp: playerPokemon.current_hp,
    player_max_hp: playerMaxHP,
    player_type1: playerSpecies.type1,
    player_type2: playerSpecies.type2,
    gym_pokemon_name: gymPokemon.species_name,
    gym_species_id: gymPokemon.species_id,
    gym_level: gymPokemon.level,
    gym_starting_hp: gymMaxHP,
    gym_max_hp: gymMaxHP,
    gym_type1: gymPokemon.type1,
    gym_type2: gymPokemon.type2,
    turns,
    outcome: playerWon ? 'gym_pokemon_faint' : 'player_pokemon_faint',
    player_final_hp: playerHP
  }
}

// Simulate a full gym battle with turn-by-turn combat
export function simulateGymBattle(
  party: (Pokemon | null)[],
  gymLeader: GymLeader,
  speciesMap: Map<number, PokemonSpecies>,
  alreadyDefeated: boolean
): GymBattleResult {
  const battleLog: string[] = []
  const matchups: GymBattleMatchup[] = []

  // Check if player has healthy Pokemon
  const healthyParty = party.filter(p => p && p.current_hp > 0) as Pokemon[]
  if (healthyParty.length === 0) {
    return {
      success: false,
      gym_leader_id: gymLeader.id,
      battle_log: ['You have no healthy Pokemon!'],
      matchups: [],
      error: 'No healthy Pokemon'
    }
  }

  battleLog.push(`${gymLeader.name} wants to battle!`)

  // Track current HP for player's Pokemon (copy so we can mutate)
  const partyHP: Map<string, number> = new Map()
  for (const p of healthyParty) {
    partyHP.set(p.id, p.current_hp)
  }

  // Track remaining gym Pokemon
  const gymTeam = [...gymLeader.team].sort((a, b) => a.slot - b.slot)
  let gymIndex = 0

  // Player's current Pokemon is first healthy one
  let playerIndex = 0

  // Battle until one side runs out
  while (playerIndex < healthyParty.length && gymIndex < gymTeam.length) {
    const playerPokemon = healthyParty[playerIndex]
    const playerSpecies = speciesMap.get(playerPokemon.species_id)

    if (!playerSpecies) {
      playerIndex++
      continue
    }

    const gymPokemon = gymTeam[gymIndex]
    const gymStats = calculateGymPokemonStats(gymPokemon)

    // Create a copy of player Pokemon with current HP for this matchup
    const playerWithCurrentHP = {
      ...playerPokemon,
      current_hp: partyHP.get(playerPokemon.id) || playerPokemon.current_hp
    }

    // Simulate this matchup
    const matchup = simulateGymMatchup(playerWithCurrentHP, playerSpecies, gymPokemon, gymStats)
    matchups.push(matchup)

    // Update player Pokemon's HP in our tracking map
    partyHP.set(playerPokemon.id, matchup.player_final_hp)

    // Log the matchup result
    if (matchup.outcome === 'gym_pokemon_faint') {
      battleLog.push(`${gymPokemon.species_name} fainted!`)
      gymIndex++
    } else {
      battleLog.push(`${playerSpecies.name} fainted!`)
      playerIndex++
    }
  }

  // Determine overall outcome
  const playerWon = gymIndex >= gymTeam.length

  if (playerWon) {
    battleLog.push(`You defeated ${gymLeader.name}!`)

    const result: GymBattleResult = {
      success: true,
      gym_leader_id: gymLeader.id,
      battle_log: battleLog,
      matchups
    }

    // Only award badge and money on first victory
    if (!alreadyDefeated) {
      result.badge_earned = gymLeader.badge_id
      result.badge_name = gymLeader.badge_name
      result.money_earned = gymLeader.reward_money
      battleLog.push(`You earned the ${gymLeader.badge_name}!`)
      battleLog.push(`Received $${gymLeader.reward_money}!`)
    } else {
      battleLog.push(`(You've already earned the ${gymLeader.badge_name})`)
    }

    return result
  } else {
    battleLog.push(`You were defeated by ${gymLeader.name}!`)

    return {
      success: false,
      gym_leader_id: gymLeader.id,
      battle_log: battleLog,
      matchups
    }
  }
}
