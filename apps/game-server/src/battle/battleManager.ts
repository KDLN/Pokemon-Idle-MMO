import type { Pokemon, PokemonSpecies, WildPokemon } from '../types.js'
import type { BattleStatus } from '@pokemon-idle/shared'

export interface ActiveBattle {
  playerId: string
  wildPokemon: WildPokemon
  leadPokemon: Pokemon
  leadSpecies: PokemonSpecies
  playerHP: number
  wildHP: number
  playerMaxHP: number
  wildMaxHP: number
  turnNumber: number
  startedAt: number       // Date.now() when battle started
  lastActivity: number    // Date.now() of last client activity
  status: BattleStatus
  playerFirst: boolean    // Determined by speed comparison
}

const BATTLE_TIMEOUT_MS = 30_000  // 30 seconds per requirement BATTLE-05

export class BattleManager {
  private activeBattles: Map<string, ActiveBattle> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval to check for timed-out battles every 5 seconds
    this.cleanupInterval = setInterval(() => this.cleanupTimedOutBattles(), 5000)
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // Start a new battle for a player
  startBattle(
    playerId: string,
    wildPokemon: WildPokemon,
    leadPokemon: Pokemon,
    leadSpecies: PokemonSpecies
  ): ActiveBattle {
    // Clean up any existing battle for this player
    this.activeBattles.delete(playerId)

    const now = Date.now()
    const playerFirst = leadPokemon.stat_speed >= wildPokemon.stat_speed

    const battle: ActiveBattle = {
      playerId,
      wildPokemon,
      leadPokemon,
      leadSpecies,
      playerHP: leadPokemon.current_hp,
      wildHP: wildPokemon.max_hp,
      playerMaxHP: leadPokemon.max_hp,
      wildMaxHP: wildPokemon.max_hp,
      turnNumber: 0,
      startedAt: now,
      lastActivity: now,
      status: 'battling',
      playerFirst
    }

    this.activeBattles.set(playerId, battle)
    return battle
  }

  // Get active battle for a player
  getBattle(playerId: string): ActiveBattle | undefined {
    return this.activeBattles.get(playerId)
  }

  // Update battle state after a turn
  updateBattle(playerId: string, updates: Partial<ActiveBattle>): ActiveBattle | undefined {
    const battle = this.activeBattles.get(playerId)
    if (!battle) return undefined

    Object.assign(battle, updates, { lastActivity: Date.now() })
    return battle
  }

  // Record client activity (prevents timeout)
  recordActivity(playerId: string): void {
    const battle = this.activeBattles.get(playerId)
    if (battle) {
      battle.lastActivity = Date.now()
    }
  }

  // End a battle (win, lose, or timeout)
  endBattle(playerId: string): ActiveBattle | undefined {
    const battle = this.activeBattles.get(playerId)
    this.activeBattles.delete(playerId)
    return battle
  }

  // Check if player has active battle
  hasBattle(playerId: string): boolean {
    return this.activeBattles.has(playerId)
  }

  // Get all active battles (for debugging/monitoring)
  getAllBattles(): Map<string, ActiveBattle> {
    return this.activeBattles
  }

  // Clean up battles that have timed out
  private cleanupTimedOutBattles(): void {
    const now = Date.now()
    for (const [playerId, battle] of this.activeBattles) {
      if (now - battle.lastActivity > BATTLE_TIMEOUT_MS) {
        console.log(`[Battle] Timeout for player ${playerId} - auto-resolving`)
        battle.status = 'timeout'
        // Battle will be auto-resolved in processTick when client reconnects
        // or cleaned up on next cleanup cycle if still stale
      }
    }
  }
}
