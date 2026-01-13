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
  EncounterTableEntry
} from './types.js'

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

// Battle result with type effectiveness info
export interface BattleResult {
  outcome: 'win' | 'lose' | 'fled' | 'wipe'
  typeEffectiveness: number
  effectivenessText: string | null // 'super_effective', 'not_very_effective', 'no_effect', null for neutral
}

// Battle resolution with type effectiveness
export function resolveBattle(
  party: (Pokemon | null)[],
  wild: WildPokemon,
  speciesMap: Map<number, PokemonSpecies>
): BattleResult {
  let partyPower = 0
  let healthyPokemon = 0

  for (const p of party) {
    if (p && p.current_hp > 0) {
      healthyPokemon++
      partyPower += (p.stat_attack + p.stat_sp_attack) * p.level
    }
  }

  if (healthyPokemon === 0) {
    return { outcome: 'wipe', typeEffectiveness: 1, effectivenessText: null }
  }

  // Get type advantage
  const { multiplier: typeMultiplier } = getBestTypeAdvantage(party, wild, speciesMap)

  // Apply type effectiveness to party power
  const effectivePower = partyPower * typeMultiplier

  const wildPower = (wild.stat_attack + wild.max_hp) * wild.level
  let winChance = effectivePower / (effectivePower + wildPower)

  // Clamp between 10% and 95%
  winChance = Math.max(0.1, Math.min(0.95, winChance))

  // Determine effectiveness text
  let effectivenessText: string | null = null
  if (typeMultiplier >= 2) {
    effectivenessText = 'super_effective'
  } else if (typeMultiplier <= 0.5 && typeMultiplier > 0) {
    effectivenessText = 'not_very_effective'
  } else if (typeMultiplier === 0) {
    effectivenessText = 'no_effect'
  }

  if (Math.random() < winChance) {
    return { outcome: 'win', typeEffectiveness: typeMultiplier, effectivenessText }
  }
  return { outcome: 'fled', typeEffectiveness: typeMultiplier, effectivenessText }
}

// Catch attempt
export function attemptCatch(wild: WildPokemon, pokeballs: number): { result: CatchResult; newPokeballs: number } {
  if (pokeballs <= 0) {
    return { result: { success: false, balls_used: 0 }, newPokeballs: pokeballs }
  }

  const baseCatchRate = wild.species.base_catch_rate
  const ballModifier = 1.0 // Pokeball

  let catchChance = (baseCatchRate * ballModifier) / 255.0

  // Level modifier
  const levelMod = Math.max(0.5, 1.0 - wild.level * 0.02)
  catchChance *= levelMod

  // Clamp
  catchChance = Math.max(0.05, Math.min(0.95, catchChance))

  const newPokeballs = pokeballs - 1

  if (Math.random() < catchChance) {
    return { result: { success: true, balls_used: 1 }, newPokeballs }
  }

  return { result: { success: false, balls_used: 1 }, newPokeballs }
}

// Calculate money earned from defeating a wild Pokemon
export function calculateMoneyReward(wild: WildPokemon): number {
  // Base reward is based on wild Pokemon's level
  // Formula: level * 10 + random bonus
  const baseReward = wild.level * 10
  const bonus = Math.floor(Math.random() * (wild.level * 5))
  return baseReward + bonus
}

// XP distribution
export function distributeXP(party: (Pokemon | null)[], wild: WildPokemon): Record<string, number> {
  const baseXP = wild.species.base_xp_yield
  const totalXP = Math.floor((baseXP * wild.level) / 7)

  let participants = 0
  for (const p of party) {
    if (p && p.current_hp > 0) participants++
  }

  if (participants === 0) return {}

  const xpPerPokemon = Math.max(1, Math.floor(totalXP / participants))
  const result: Record<string, number> = {}

  for (const p of party) {
    if (p && p.current_hp > 0) {
      result[p.id] = xpPerPokemon
      p.xp += xpPerPokemon
    }
  }

  return result
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
  speciesMap: Map<number, PokemonSpecies>
): { encounter: EncounterEvent | null; newPokeballs: number } {
  const species = rollEncounterSpecies(encounterTable)
  if (!species) {
    return { encounter: null, newPokeballs: pokeballs }
  }

  const level = rollLevel(zone.min_level, zone.max_level)
  const wild = generateWildPokemon(species, level)
  const battleResult = resolveBattle(party, wild, speciesMap)

  const encounter: EncounterEvent = {
    wild_pokemon: wild,
    battle_result: battleResult.outcome,
    type_effectiveness: battleResult.typeEffectiveness,
    effectiveness_text: battleResult.effectivenessText
  }

  let newPokeballs = pokeballs

  // If won and have pokeballs, attempt catch
  if (battleResult.outcome === 'win' && pokeballs > 0) {
    const { result, newPokeballs: remaining } = attemptCatch(wild, pokeballs)
    encounter.catch_result = result
    newPokeballs = remaining
  }

  return { encounter, newPokeballs }
}

// Process tick
export function processTick(
  session: PlayerSession,
  speciesMap: Map<number, PokemonSpecies>
): TickResult {
  session.tickNumber++

  const result: TickResult = {
    tick_number: session.tickNumber,
    pokeballs: session.pokeballs
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
  const { encounter, newPokeballs } = processEncounter(
    session.party,
    session.zone,
    session.encounterTable,
    session.pokeballs,
    speciesMap
  )

  if (!encounter) {
    return result
  }

  session.pokeballs = newPokeballs
  result.encounter = encounter
  result.pokeballs = newPokeballs

  // Apply XP and money if battle won
  if (encounter.battle_result === 'win') {
    result.xp_gained = distributeXP(session.party, encounter.wild_pokemon)
    result.level_ups = checkLevelUps(session.party, speciesMap)

    // Award money
    const moneyEarned = calculateMoneyReward(encounter.wild_pokemon)
    session.pokedollars += moneyEarned
    result.money_earned = moneyEarned
    result.total_money = session.pokedollars
  }

  return result
}
