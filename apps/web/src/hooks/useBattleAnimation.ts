'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { EncounterEvent, BattlePhase, BattleTurn } from '@/types/game'

// Phase duration constants (in ms)
const PHASE_DURATIONS = {
  appear: 800,
  battle_intro: 1000,
  turn_attack: 500,
  turn_damage: 400,
  battle_end: 1200,
  catch_throw: 600,
  catch_shake: 700,  // Per shake
  catch_result: 1200,
  rewards: 1000,
  fade_out: 500
}

const EFFECTIVENESS_MESSAGES: Record<'super' | 'not_very' | 'immune' | 'neutral', string> = {
  super: "It's super effective!",
  not_very: "It's not very effective...",
  immune: "It has no effect!",
  neutral: ''
}

function describeTurn(turn: BattleTurn): string {
  const effectiveness = EFFECTIVENESS_MESSAGES[turn.effectiveness]
  const status = turn.status_effect ? `It ${turn.status_effect}s ${turn.defender_name}!` : ''
  return [`${turn.attacker_name} used ${turn.move_name}!`, effectiveness, status].filter(Boolean).join(' ')
}

export interface BattleAnimationState {
  phase: BattlePhase
  currentTurnIndex: number
  currentTurn: BattleTurn | null
  playerHP: number
  wildHP: number
  playerMaxHP: number
  wildMaxHP: number
  currentShake: number
  totalShakes: number
  messageText: string
  showDamageNumber: boolean
  damageAmount: number
  damageTarget: 'player' | 'wild'
  isCritical: boolean
  isAnimating: boolean
}

const initialState: BattleAnimationState = {
  phase: 'idle',
  currentTurnIndex: -1,
  currentTurn: null,
  playerHP: 0,
  wildHP: 0,
  playerMaxHP: 0,
  wildMaxHP: 0,
  currentShake: 0,
  totalShakes: 0,
  messageText: '',
  showDamageNumber: false,
  damageAmount: 0,
  damageTarget: 'wild',
  isCritical: false,
  isAnimating: false
}

export function useBattleAnimation(
  encounter: EncounterEvent | null,
  onComplete: () => void
) {
  const [state, setState] = useState<BattleAnimationState>(initialState)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const encounterRef = useRef<EncounterEvent | null>(null)

  // Clear any pending timeouts
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Schedule next phase transition
  const schedulePhase = useCallback((
    nextPhase: BattlePhase,
    delay: number,
    stateUpdates?: Partial<BattleAnimationState>
  ) => {
    clearPendingTimeout()
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        phase: nextPhase,
        ...stateUpdates
      }))
    }, delay)
  }, [clearPendingTimeout])

  // Process the battle sequence
  useEffect(() => {
    // New encounter started
    if (encounter && encounter !== encounterRef.current) {
      encounterRef.current = encounter
      clearPendingTimeout()

      const seq = encounter.battle_sequence
      const wild = encounter.wild_pokemon

      // Initialize HP values
      const playerStartHP = seq?.lead_starting_hp ?? 0
      const playerMaxHP = seq?.lead_max_hp ?? 0
      const wildStartHP = seq?.wild_starting_hp ?? wild.max_hp
      const wildMaxHP = seq?.wild_max_hp ?? wild.max_hp

      // Start the animation sequence
      setState({
        ...initialState,
        phase: 'appear',
        isAnimating: true,
        playerHP: playerStartHP,
        wildHP: wildStartHP,
        playerMaxHP,
        wildMaxHP,
        messageText: `Wild ${wild.species.name} appeared!`
      })
    }
  }, [encounter, clearPendingTimeout])

  // State machine transitions
  useEffect(() => {
    const enc = encounterRef.current
    if (!enc || state.phase === 'idle') return

    const seq = enc.battle_sequence
    const catchSeq = enc.catch_result?.catch_sequence

    switch (state.phase) {
      case 'appear':
        // After appear animation, show intro text
        schedulePhase('battle_intro', PHASE_DURATIONS.appear)
        break

      case 'battle_intro':
        // After intro, start battle turns (if we have sequence data)
        if (seq && seq.turns.length > 0) {
          schedulePhase('turn_attack', PHASE_DURATIONS.battle_intro, {
            currentTurnIndex: 0,
            currentTurn: seq.turns[0],
            messageText: `${seq.turns[0].attacker_name} attacks!`
          })
        } else {
          // No battle sequence - skip to end
          schedulePhase('battle_end', PHASE_DURATIONS.battle_intro, {
            messageText: enc.battle_result === 'win' ? 'Victory!' : 'Got away safely...'
          })
        }
        break

      case 'turn_attack':
        // After attack animation, show damage
        if (state.currentTurn) {
          const turn = state.currentTurn
          const damageTarget = turn.attacker === 'player' ? 'wild' : 'player'

          schedulePhase('turn_damage', PHASE_DURATIONS.turn_attack, {
            messageText: describeTurn(turn),
            showDamageNumber: true,
            damageAmount: turn.damage_dealt,
            damageTarget,
            isCritical: turn.is_critical,
            playerHP: damageTarget === 'player' ? turn.defender_hp_after : state.playerHP,
            wildHP: damageTarget === 'wild' ? turn.defender_hp_after : state.wildHP
          })
        }
        break

      case 'turn_damage':
        // After damage, either next turn or battle end
        if (seq) {
          const nextIndex = state.currentTurnIndex + 1
          if (nextIndex < seq.turns.length) {
            // More turns to show
            schedulePhase('turn_attack', PHASE_DURATIONS.turn_damage, {
              currentTurnIndex: nextIndex,
              currentTurn: seq.turns[nextIndex],
              showDamageNumber: false,
              messageText: `${seq.turns[nextIndex].attacker_name} attacks!`
            })
          } else {
            // Battle complete
            const playerWon = seq.final_outcome === 'player_win'
            schedulePhase('battle_end', PHASE_DURATIONS.turn_damage, {
              showDamageNumber: false,
              messageText: playerWon
                ? `${enc.wild_pokemon.species.name} fainted!`
                : `${seq.lead_pokemon_name} fainted!`
            })
          }
        }
        break

      case 'battle_end':
        // After battle end, either catch or rewards
        if (enc.battle_result === 'win' && enc.catch_result) {
          // Start catch sequence
          schedulePhase('catch_throw', PHASE_DURATIONS.battle_end, {
            totalShakes: catchSeq?.shake_count ?? 3,
            currentShake: 0,
            messageText: ''
          })
        } else if (enc.battle_result === 'win') {
          // No catch attempt, show rewards
          schedulePhase('rewards', PHASE_DURATIONS.battle_end)
        } else {
          // Lost or fled - fade out
          schedulePhase('fade_out', PHASE_DURATIONS.battle_end)
        }
        break

      case 'catch_throw':
        // After throw, start shaking
        schedulePhase('catch_shake', PHASE_DURATIONS.catch_throw, {
          currentShake: 1
        })
        break

      case 'catch_shake':
        // After each shake, either more shakes or result
        if (state.currentShake < state.totalShakes) {
          // More shakes
          schedulePhase('catch_shake', PHASE_DURATIONS.catch_shake, {
            currentShake: state.currentShake + 1
          })
        } else {
          // Show result
          const caught = enc.catch_result?.success ?? false
          schedulePhase('catch_result', PHASE_DURATIONS.catch_shake, {
            messageText: caught ? 'Gotcha!' : 'Oh no! It broke free!'
          })
        }
        break

      case 'catch_result':
        // After catch result, show rewards (if won) or fade out
        if (enc.battle_result === 'win') {
          schedulePhase('rewards', PHASE_DURATIONS.catch_result)
        } else {
          schedulePhase('fade_out', PHASE_DURATIONS.catch_result)
        }
        break

      case 'rewards':
        // After rewards, fade out
        schedulePhase('fade_out', PHASE_DURATIONS.rewards)
        break

      case 'fade_out':
        // After fade, complete
        timeoutRef.current = setTimeout(() => {
          setState(initialState)
          encounterRef.current = null
          onComplete()
        }, PHASE_DURATIONS.fade_out)
        break
    }
  }, [state.phase, state.currentTurnIndex, state.currentShake, schedulePhase, onComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout()
    }
  }, [clearPendingTimeout])

  // Calculate HP percentages for UI
  const playerHPPercent = state.playerMaxHP > 0
    ? (state.playerHP / state.playerMaxHP) * 100
    : 100
  const wildHPPercent = state.wildMaxHP > 0
    ? (state.wildHP / state.wildMaxHP) * 100
    : 100

  return {
    ...state,
    playerHPPercent,
    wildHPPercent,
    // Helper to check if in a specific phase
    isPhase: (phase: BattlePhase) => state.phase === phase,
    // Helper to check if in battle turns
    isInBattle: state.phase === 'turn_attack' || state.phase === 'turn_damage',
    // Helper to check if in catch sequence
    isInCatch: state.phase === 'catch_throw' || state.phase === 'catch_shake' || state.phase === 'catch_result'
  }
}
