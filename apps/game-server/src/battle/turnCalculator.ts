import type { Pokemon, PokemonSpecies, WildPokemon, BattleTurn, Move } from '../types.js'
import { getTypeEffectiveness, calculateDamage } from '../game.js'
import type { ActiveBattle } from './battleManager.js'

// Type effectiveness category
function getEffectivenessCategory(multiplier: number): 'super' | 'neutral' | 'not_very' | 'immune' {
  if (multiplier === 0) return 'immune'
  if (multiplier >= 2) return 'super'
  if (multiplier < 1) return 'not_very'
  return 'neutral'
}

// Move selection (simplified from game.ts - uses first type-matched move)
function selectMove(attackerSpecies: PokemonSpecies, defenderType1: string, defenderType2: string | null): Move {
  const TYPE_MOVE_POOL: Record<string, Move> = {
    NORMAL: { name: 'Tackle', type: 'Normal', power: 40, accuracy: 0.95 },
    FIRE: { name: 'Ember', type: 'Fire', power: 40, accuracy: 1 },
    WATER: { name: 'Water Gun', type: 'Water', power: 45, accuracy: 0.95 },
    GRASS: { name: 'Vine Whip', type: 'Grass', power: 45, accuracy: 0.95 },
    ELECTRIC: { name: 'Spark', type: 'Electric', power: 65, accuracy: 0.9 },
    FLYING: { name: 'Peck', type: 'Flying', power: 35, accuracy: 1 },
    BUG: { name: 'Bug Bite', type: 'Bug', power: 55, accuracy: 0.9 },
    ROCK: { name: 'Rock Throw', type: 'Rock', power: 50, accuracy: 0.9 },
    POISON: { name: 'Poison Sting', type: 'Poison', power: 40, accuracy: 1 },
  }

  const typeKey = attackerSpecies.type1?.toUpperCase() ?? 'NORMAL'
  return TYPE_MOVE_POOL[typeKey] || TYPE_MOVE_POOL.NORMAL
}

export interface TurnResult {
  turn: BattleTurn
  newPlayerHP: number
  newWildHP: number
  battleEnded: boolean
  playerWon: boolean
}

/**
 * Calculate a single battle turn.
 * This is the core function for progressive turn revelation.
 * Called once per client request_turn message.
 */
export function calculateSingleTurn(battle: ActiveBattle): TurnResult {
  const {
    leadPokemon, leadSpecies, wildPokemon,
    playerHP, wildHP, playerMaxHP, wildMaxHP,
    turnNumber, playerFirst
  } = battle

  // Determine who attacks this turn based on turn parity and speed
  const isEvenTurn = turnNumber % 2 === 0
  const playerAttacks = isEvenTurn === playerFirst

  let newPlayerHP = playerHP
  let newWildHP = wildHP
  let turn: BattleTurn

  if (playerAttacks) {
    // Player attacks wild
    const move = selectMove(leadSpecies, wildPokemon.species.type1, wildPokemon.species.type2)
    const typeMultiplier = getTypeEffectiveness(
      leadSpecies.type1,
      wildPokemon.species.type1,
      wildPokemon.species.type2
    )
    const attackStat = Math.max(leadPokemon.stat_attack, leadPokemon.stat_sp_attack)
    const defenseStat = Math.max(wildPokemon.stat_defense, wildPokemon.stat_sp_defense)

    const { damage, isCritical } = calculateDamage(
      leadPokemon.level,
      attackStat,
      defenseStat,
      typeMultiplier,
      move.power
    )

    newWildHP = Math.max(0, wildHP - damage)

    turn = {
      turn_number: turnNumber,
      attacker: 'player',
      attacker_name: leadSpecies.name,
      defender_name: wildPokemon.species.name,
      damage_dealt: damage,
      is_critical: isCritical,
      effectiveness: getEffectivenessCategory(typeMultiplier),
      attacker_hp_after: playerHP,
      defender_hp_after: newWildHP,
      attacker_max_hp: playerMaxHP,
      defender_max_hp: wildMaxHP,
      move_name: move.name,
      move_type: move.type
    }
  } else {
    // Wild attacks player
    const move = selectMove(wildPokemon.species, leadSpecies.type1, leadSpecies.type2)
    const typeMultiplier = getTypeEffectiveness(
      wildPokemon.species.type1,
      leadSpecies.type1,
      leadSpecies.type2
    )
    const attackStat = Math.max(wildPokemon.stat_attack, wildPokemon.stat_sp_attack)
    const defenseStat = Math.max(leadPokemon.stat_defense, leadPokemon.stat_sp_defense)

    const { damage, isCritical } = calculateDamage(
      wildPokemon.level,
      attackStat,
      defenseStat,
      typeMultiplier,
      move.power
    )

    newPlayerHP = Math.max(0, playerHP - damage)

    turn = {
      turn_number: turnNumber,
      attacker: 'wild',
      attacker_name: wildPokemon.species.name,
      defender_name: leadSpecies.name,
      damage_dealt: damage,
      is_critical: isCritical,
      effectiveness: getEffectivenessCategory(typeMultiplier),
      attacker_hp_after: wildHP,
      defender_hp_after: newPlayerHP,
      attacker_max_hp: wildMaxHP,
      defender_max_hp: playerMaxHP,
      move_name: move.name,
      move_type: move.type
    }
  }

  const battleEnded = newPlayerHP <= 0 || newWildHP <= 0
  const playerWon = newWildHP <= 0

  return { turn, newPlayerHP, newWildHP, battleEnded, playerWon }
}
