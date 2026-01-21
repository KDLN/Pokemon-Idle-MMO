'use client'

import { useReducer, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { BattleTurn, ActiveBattle } from '@pokemon-idle/shared'

// Compressed phase durations to fit 800ms budget (BATTLE-07)
const PHASE_DURATIONS = {
  appear: 600,
  battle_intro: 800,
  turn_active: 500,      // Attack + damage shown together
  battle_end: 1000,
  catch_throw: 500,
  catch_shake: 600,      // Per shake (3 shakes = 1800ms total)
  catch_result: 1000,
  rewards: 800,
  fade_out: 400,
  summary: 2000
}

export type BattlePhase =
  | 'idle'
  | 'appear'
  | 'battle_intro'
  | 'waiting_for_turn'
  | 'turn_active'
  | 'battle_end'
  | 'waiting_for_catch'
  | 'catch_throw'
  | 'catch_shake'
  | 'catch_result'
  | 'rewards'
  | 'fade_out'
  | 'summary'

export interface BattleAnimationState {
  phase: BattlePhase
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
  canCatch: boolean
  catchSuccess: boolean | null
  isNewPokedexEntry: boolean
}

const EFFECTIVENESS_MESSAGES = {
  super: "It's super effective!",
  not_very: "It's not very effective...",
  immune: "It has no effect!",
  neutral: ''
} as const

function describeTurn(turn: BattleTurn): string {
  const effectiveness = EFFECTIVENESS_MESSAGES[turn.effectiveness]
  return [`${turn.attacker_name} used ${turn.move_name}!`, effectiveness].filter(Boolean).join(' ')
}

type BattleAnimationAction =
  | { type: 'START_BATTLE'; battle: ActiveBattle }
  | { type: 'SET_PHASE'; phase: BattlePhase; updates?: Partial<BattleAnimationState> }
  | { type: 'PROCESS_TURN'; turn: BattleTurn; playerHP: number; wildHP: number; canCatch: boolean }
  | { type: 'PROCESS_CATCH_RESULT'; shakeCount: number; success: boolean; isNewPokedexEntry: boolean }
  | { type: 'SHOW_SUMMARY'; message: string }
  | { type: 'RESET' }

function battleAnimationReducer(state: BattleAnimationState, action: BattleAnimationAction): BattleAnimationState {
  switch (action.type) {
    case 'START_BATTLE':
      return {
        phase: 'appear',
        currentTurn: null,
        playerHP: action.battle.playerHP,
        wildHP: action.battle.wildHP,
        playerMaxHP: action.battle.playerMaxHP,
        wildMaxHP: action.battle.wildMaxHP,
        currentShake: 0,
        totalShakes: 3,
        messageText: `Wild ${action.battle.wildPokemon.species.name} appeared!`,
        showDamageNumber: false,
        damageAmount: 0,
        damageTarget: 'wild',
        isCritical: false,
        isAnimating: true,
        canCatch: false,
        catchSuccess: null,
        isNewPokedexEntry: false
      }
    case 'SET_PHASE':
      return { ...state, phase: action.phase, ...action.updates }
    case 'PROCESS_TURN': {
      const damageTarget = action.turn.attacker === 'player' ? 'wild' : 'player'
      return {
        ...state,
        phase: 'turn_active',
        currentTurn: action.turn,
        messageText: describeTurn(action.turn),
        showDamageNumber: true,
        damageAmount: action.turn.damage_dealt,
        damageTarget,
        isCritical: action.turn.is_critical,
        playerHP: action.playerHP,
        wildHP: action.wildHP,
        canCatch: action.canCatch
      }
    }
    case 'PROCESS_CATCH_RESULT':
      return {
        ...state,
        phase: 'catch_throw',
        totalShakes: action.shakeCount,
        catchSuccess: action.success,
        isNewPokedexEntry: action.isNewPokedexEntry
      }
    case 'SHOW_SUMMARY':
      return {
        ...state,
        phase: 'summary',
        messageText: action.message,
        isAnimating: true
      }
    case 'RESET':
      return {
        phase: 'idle',
        currentTurn: null,
        playerHP: 0,
        wildHP: 0,
        playerMaxHP: 0,
        wildMaxHP: 0,
        currentShake: 0,
        totalShakes: 3,
        messageText: '',
        showDamageNumber: false,
        damageAmount: 0,
        damageTarget: 'wild',
        isCritical: false,
        isAnimating: false,
        canCatch: false,
        catchSuccess: null,
        isNewPokedexEntry: false
      }
    default:
      return state
  }
}

export function useBattleAnimation(onComplete: () => void) {
  const activeBattle = useGameStore((state) => state.activeBattle)
  const clearActiveBattle = useGameStore((state) => state.clearActiveBattle)

  const [state, dispatch] = useReducer(battleAnimationReducer, {
    phase: 'idle',
    currentTurn: null,
    playerHP: 0,
    wildHP: 0,
    playerMaxHP: 0,
    wildMaxHP: 0,
    currentShake: 0,
    totalShakes: 3,
    messageText: '',
    showDamageNumber: false,
    damageAmount: 0,
    damageTarget: 'wild',
    isCritical: false,
    isAnimating: false,
    canCatch: false,
    catchSuccess: null,
    isNewPokedexEntry: false
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const battleRef = useRef(activeBattle)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const schedulePhase = useCallback((
    nextPhase: BattlePhase,
    delay: number,
    updates?: Partial<BattleAnimationState>
  ) => {
    clearPendingTimeout()
    timeoutRef.current = setTimeout(() => {
      dispatch({ type: 'SET_PHASE', phase: nextPhase, updates })
    }, delay)
  }, [clearPendingTimeout])

  // Handle new battle starting
  useEffect(() => {
    if (activeBattle && activeBattle !== battleRef.current && activeBattle.status === 'intro') {
      battleRef.current = activeBattle
      clearPendingTimeout()
      dispatch({ type: 'START_BATTLE', battle: activeBattle })
    }

    // Update battleRef when battle changes
    battleRef.current = activeBattle
  }, [activeBattle, clearPendingTimeout])

  // Handle turn received from server
  useEffect(() => {
    if (!activeBattle?.currentTurn || state.phase !== 'waiting_for_turn') return

    dispatch({
      type: 'PROCESS_TURN',
      turn: activeBattle.currentTurn,
      playerHP: activeBattle.playerHP,
      wildHP: activeBattle.wildHP,
      canCatch: activeBattle.canCatch
    })
  }, [activeBattle?.currentTurn, activeBattle?.playerHP, activeBattle?.wildHP, activeBattle?.canCatch, state.phase])

  // Handle catch result from server
  useEffect(() => {
    if (!activeBattle?.catchResult || state.phase !== 'waiting_for_catch') return

    dispatch({
      type: 'PROCESS_CATCH_RESULT',
      shakeCount: activeBattle.catchResult.shakeCount,
      success: activeBattle.catchResult.success,
      isNewPokedexEntry: activeBattle.catchResult.isNewPokedexEntry
    })
  }, [activeBattle?.catchResult, state.phase])

  // State machine transitions
  useEffect(() => {
    if (!activeBattle || state.phase === 'idle') return

    switch (state.phase) {
      case 'appear':
        schedulePhase('battle_intro', PHASE_DURATIONS.appear)
        break

      case 'battle_intro':
        // Request first turn from server
        schedulePhase('waiting_for_turn', PHASE_DURATIONS.battle_intro)
        setTimeout(() => gameSocket.requestTurn(), PHASE_DURATIONS.battle_intro)
        break

      case 'turn_active':
        // After turn animation, check battle status
        const battleStatus = activeBattle.canCatch ? 'player_win' :
                            (activeBattle.playerHP <= 0 ? 'player_faint' : 'ongoing')

        if (battleStatus === 'ongoing') {
          // Request next turn
          schedulePhase('waiting_for_turn', PHASE_DURATIONS.turn_active, {
            showDamageNumber: false
          })
          setTimeout(() => gameSocket.requestTurn(), PHASE_DURATIONS.turn_active)
        } else if (battleStatus === 'player_win') {
          // Battle won, show end then wait for catch
          schedulePhase('battle_end', PHASE_DURATIONS.turn_active, {
            showDamageNumber: false,
            messageText: `${activeBattle.wildPokemon.species.name} fainted!`
          })
        } else {
          // Player fainted
          schedulePhase('battle_end', PHASE_DURATIONS.turn_active, {
            showDamageNumber: false,
            messageText: `${activeBattle.leadPokemon.name} fainted!`
          })
        }
        break

      case 'battle_end':
        if (state.canCatch) {
          // Auto-attempt catch with best available ball
          schedulePhase('waiting_for_catch', PHASE_DURATIONS.battle_end, {
            messageText: ''
          })
          // Determine ball type (prefer great balls if available)
          const inventory = useGameStore.getState().inventory
          const ballType = (inventory.great_ball || 0) > 0 ? 'great_ball' : 'pokeball'
          setTimeout(() => gameSocket.attemptCatch(ballType), PHASE_DURATIONS.battle_end)
        } else {
          // No catch - fade out
          schedulePhase('fade_out', PHASE_DURATIONS.battle_end)
        }
        break

      case 'catch_throw':
        schedulePhase('catch_shake', PHASE_DURATIONS.catch_throw, {
          currentShake: 1
        })
        break

      case 'catch_shake':
        if (state.currentShake < state.totalShakes) {
          schedulePhase('catch_shake', PHASE_DURATIONS.catch_shake, {
            currentShake: state.currentShake + 1
          })
        } else {
          schedulePhase('catch_result', PHASE_DURATIONS.catch_shake, {
            messageText: state.catchSuccess ? 'Gotcha!' : 'Oh no! It broke free!'
          })
        }
        break

      case 'catch_result':
        if (state.catchSuccess) {
          schedulePhase('rewards', PHASE_DURATIONS.catch_result)
        } else {
          schedulePhase('fade_out', PHASE_DURATIONS.catch_result)
        }
        break

      case 'rewards':
        schedulePhase('fade_out', PHASE_DURATIONS.rewards)
        break

      case 'fade_out':
        timeoutRef.current = setTimeout(() => {
          dispatch({ type: 'SET_PHASE', phase: 'idle', updates: { isAnimating: false } })
          clearActiveBattle()
          onComplete()
        }, PHASE_DURATIONS.fade_out)
        break

      case 'summary':
        // Battle summary from timeout/reconnect
        schedulePhase('fade_out', PHASE_DURATIONS.summary, {
          messageText: activeBattle.battleSummary?.message || ''
        })
        break
    }
  }, [state.phase, state.currentShake, state.canCatch, state.catchSuccess, state.totalShakes, activeBattle, schedulePhase, clearActiveBattle, onComplete])

  // Handle battle summary (timeout/reconnect)
  useEffect(() => {
    if (activeBattle?.battleSummary && state.phase !== 'summary') {
      dispatch({
        type: 'SHOW_SUMMARY',
        message: activeBattle.battleSummary.message
      })
    }
  }, [activeBattle?.battleSummary, state.phase])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPendingTimeout()
  }, [clearPendingTimeout])

  // Calculate HP percentages
  const playerHPPercent = state.playerMaxHP > 0 ? (state.playerHP / state.playerMaxHP) * 100 : 100
  const wildHPPercent = state.wildMaxHP > 0 ? (state.wildHP / state.wildMaxHP) * 100 : 100

  return {
    ...state,
    playerHPPercent,
    wildHPPercent,
    isPhase: (phase: BattlePhase) => state.phase === phase,
    isInBattle: state.phase === 'turn_active' || state.phase === 'waiting_for_turn',
    isInCatch: ['catch_throw', 'catch_shake', 'catch_result', 'waiting_for_catch'].includes(state.phase),
    wildPokemon: activeBattle?.wildPokemon || null,
    leadPokemon: activeBattle?.leadPokemon || null
  }
}
