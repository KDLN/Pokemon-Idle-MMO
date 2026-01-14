'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { getPokemonSpriteUrl, type GymBattleMatchup, type BattleTurn } from '@/types/game'
import { cn, getTypeColor } from '@/lib/ui'
import { ClassicBattleArena } from '@/components/game/ClassicBattleHud'

// Gym leader data interface
export interface GymLeader {
  id: string
  name: string
  title: string
  badge_id: string
  badge_name: string
  specialty_type: string
  dialog_intro: string
  dialog_win: string
  dialog_lose: string
  reward_money: number
  reward_badge_points: number
  team: GymLeaderPokemon[]
}

export interface GymLeaderPokemon {
  species_id: number
  species_name: string
  level: number
  slot: number
  type1: string
  type2: string | null
}

export interface GymBattleResult {
  success: boolean
  gym_leader_id: string
  badge_earned?: string
  badge_name?: string
  money_earned?: number
  battle_log?: string[]
  matchups?: GymBattleMatchup[]
  error?: string
}

// Type colors for Pokemon display
const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A878',
  Fire: '#F08030',
  Water: '#6890F0',
  Electric: '#F8D030',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Dark: '#705848',
  Steel: '#B8B8D0',
  Fairy: '#EE99AC',
}

// Badge icons
const BADGE_ICONS: Record<string, string> = {
  boulder: '🪨',
  cascade: '💧',
  thunder: '⚡',
  rainbow: '🌈',
  soul: '💜',
  marsh: '🔮',
  volcano: '🌋',
  earth: '🌍',
}

// Animation timing constants
const TIMING = {
  TURN_ATTACK: 600,
  TURN_DAMAGE: 500,
  MATCHUP_TRANSITION: 1200,
  RESULT_DELAY: 1500,
}

type GymBattlePhase =
  | 'intro'
  | 'battling'
  | 'turn_attack'
  | 'turn_damage'
  | 'matchup_transition'
  | 'result'

export function GymBattlePanel() {
  const isGymOpen = useGameStore((state) => state.isGymOpen)
  const currentGymLeader = useGameStore((state) => state.currentGymLeader)
  const badges = useGameStore((state) => state.badges)
  const setGymOpen = useGameStore((state) => state.setGymOpen)
  const party = useGameStore((state) => state.party)

  const [battlePhase, setBattlePhase] = useState<GymBattlePhase>('intro')
  const [battleResult, setBattleResult] = useState<GymBattleResult | null>(null)
  const [dialogText, setDialogText] = useState('')
  const [dialogIndex, setDialogIndex] = useState(0)

  // Battle animation state
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [currentTurn, setCurrentTurn] = useState<BattleTurn | null>(null)
  const [playerHP, setPlayerHP] = useState(0)
  const [gymHP, setGymHP] = useState(0)
  const [playerMaxHP, setPlayerMaxHP] = useState(0)
  const [gymMaxHP, setGymMaxHP] = useState(0)
  const [showDamageNumber, setShowDamageNumber] = useState(false)
  const [damageAmount, setDamageAmount] = useState(0)
  const [damageTarget, setDamageTarget] = useState<'player' | 'gym'>('gym')
  const [isCritical, setIsCritical] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [faintingPokemon, setFaintingPokemon] = useState<'player' | 'enemy' | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear pending timeouts
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Reset state when panel opens
  useEffect(() => {
    if (isGymOpen && currentGymLeader) {
      setBattlePhase('intro')
      setBattleResult(null)
      setDialogText('')
      setDialogIndex(0)
      setCurrentMatchupIndex(0)
      setCurrentTurnIndex(0)
      setCurrentTurn(null)
      setShowDamageNumber(false)
      setMessageText('')
      setFaintingPokemon(null)
    }
  }, [isGymOpen, currentGymLeader])

  // Typewriter effect for dialog
  useEffect(() => {
    if (!currentGymLeader || battlePhase !== 'intro') return

    const fullText = currentGymLeader.dialog_intro
    if (dialogIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDialogText(fullText.slice(0, dialogIndex + 1))
        setDialogIndex(dialogIndex + 1)
      }, 20)
      return () => clearTimeout(timeout)
    }
  }, [currentGymLeader, dialogIndex, battlePhase])

  // Start battle animation when we get a result with matchups
  const startBattleAnimation = useCallback((result: GymBattleResult) => {
    if (!result.matchups || result.matchups.length === 0) {
      // No matchups, just show result
      setBattlePhase('result')
      return
    }

    // Initialize first matchup
    const firstMatchup = result.matchups[0]
    setPlayerHP(firstMatchup.player_starting_hp)
    setPlayerMaxHP(firstMatchup.player_max_hp)
    setGymHP(firstMatchup.gym_starting_hp)
    setGymMaxHP(firstMatchup.gym_max_hp)
    setCurrentMatchupIndex(0)
    setCurrentTurnIndex(0)
    setMessageText(`Go, ${firstMatchup.player_pokemon_name}!`)
    setBattlePhase('battling')

    // Start the turn sequence after a short delay
    timeoutRef.current = setTimeout(() => {
      if (firstMatchup.turns.length > 0) {
        const turn = firstMatchup.turns[0]
        setCurrentTurn(turn)
        setMessageText(`${turn.attacker_name} attacks!`)
        setBattlePhase('turn_attack')
      }
    }, 1000)
  }, [])

  // Battle animation state machine
  useEffect(() => {
    if (!battleResult?.matchups || battlePhase === 'intro' || battlePhase === 'result') return
    // Don't interfere with the initial battling phase - let the timeout from startBattleAnimation run
    if (battlePhase === 'battling') return

    const matchups = battleResult.matchups
    const currentMatchup = matchups[currentMatchupIndex]
    if (!currentMatchup) {
      setBattlePhase('result')
      return
    }

    clearPendingTimeout()

    switch (battlePhase) {
      case 'turn_attack':
        // After attack animation, show damage
        if (currentTurn) {
          timeoutRef.current = setTimeout(() => {
            const target = currentTurn.attacker === 'player' ? 'gym' : 'player'
            setShowDamageNumber(true)
            setDamageAmount(currentTurn.damage_dealt)
            setDamageTarget(target)
            setIsCritical(currentTurn.is_critical)

            // Update HP bars
            if (target === 'gym') {
              setGymHP(currentTurn.defender_hp_after)
            } else {
              setPlayerHP(currentTurn.defender_hp_after)
            }

            setBattlePhase('turn_damage')
          }, TIMING.TURN_ATTACK)
        }
        break

      case 'turn_damage':
        // After damage, either next turn or check for KO
        timeoutRef.current = setTimeout(() => {
          setShowDamageNumber(false)

          const nextTurnIndex = currentTurnIndex + 1

          // Check if current matchup is over
          if (nextTurnIndex >= currentMatchup.turns.length) {
            // Matchup over - show result message and set faint animation
            if (currentMatchup.outcome === 'gym_pokemon_faint') {
              setMessageText(`${currentMatchup.gym_pokemon_name} fainted!`)
              setFaintingPokemon('enemy')
            } else {
              setMessageText(`${currentMatchup.player_pokemon_name} fainted!`)
              setFaintingPokemon('player')
            }

            // Check if there's another matchup
            const nextMatchupIndex = currentMatchupIndex + 1
            if (nextMatchupIndex < matchups.length) {
              setBattlePhase('matchup_transition')
            } else {
              // Battle over
              timeoutRef.current = setTimeout(() => {
                setBattlePhase('result')
              }, TIMING.RESULT_DELAY)
            }
            return
          }

          // Continue to next turn
          const nextTurn = currentMatchup.turns[nextTurnIndex]
          setCurrentTurnIndex(nextTurnIndex)
          setCurrentTurn(nextTurn)
          setMessageText(`${nextTurn.attacker_name} attacks!`)
          setBattlePhase('turn_attack')
        }, TIMING.TURN_DAMAGE)
        break

      case 'matchup_transition':
        // Transition to next matchup
        timeoutRef.current = setTimeout(() => {
          const nextMatchupIndex = currentMatchupIndex + 1
          const nextMatchup = matchups[nextMatchupIndex]

          if (nextMatchup) {
            // Clear faint animation before showing new Pokemon
            setFaintingPokemon(null)
            setCurrentMatchupIndex(nextMatchupIndex)
            setCurrentTurnIndex(0)
            setPlayerHP(nextMatchup.player_starting_hp)
            setPlayerMaxHP(nextMatchup.player_max_hp)
            setGymHP(nextMatchup.gym_starting_hp)
            setGymMaxHP(nextMatchup.gym_max_hp)

            // Determine message based on what happened
            const prevMatchup = matchups[currentMatchupIndex]
            if (prevMatchup.outcome === 'player_pokemon_faint') {
              setMessageText(`Go, ${nextMatchup.player_pokemon_name}!`)
            } else {
              setMessageText(`${currentGymLeader?.name} sent out ${nextMatchup.gym_pokemon_name}!`)
            }

            // Start next matchup's turns
            timeoutRef.current = setTimeout(() => {
              if (nextMatchup.turns.length > 0) {
                const turn = nextMatchup.turns[0]
                setCurrentTurn(turn)
                setMessageText(`${turn.attacker_name} attacks!`)
                setBattlePhase('turn_attack')
              }
            }, 1000)
          } else {
            setBattlePhase('result')
          }
        }, TIMING.MATCHUP_TRANSITION)
        break
    }

    return () => clearPendingTimeout()
  }, [battlePhase, currentTurn, currentTurnIndex, currentMatchupIndex, battleResult, currentGymLeader, clearPendingTimeout])

  // Expose handler for socket - must be before early return to maintain hook order
  useEffect(() => {
    const handler = (result: GymBattleResult) => {
      setBattleResult(result)

      if (result.success && result.badge_earned) {
        useGameStore.getState().addBadge(result.badge_earned)
      }

      // Start the battle animation
      startBattleAnimation(result)
    }
    ;(window as unknown as { __gymBattleHandler?: (result: GymBattleResult) => void }).__gymBattleHandler = handler
    return () => {
      delete (window as unknown as { __gymBattleHandler?: (result: GymBattleResult) => void }).__gymBattleHandler
      clearPendingTimeout()
    }
  }, [startBattleAnimation, clearPendingTimeout])

  if (!isGymOpen || !currentGymLeader) return null

  const hasAlreadyBeaten = badges.includes(currentGymLeader.badge_id)
  const healthyPartyCount = party.filter(p => p && p.current_hp > 0).length
  const currentMatchup = battleResult?.matchups?.[currentMatchupIndex]

  const handleChallenge = () => {
    if (healthyPartyCount === 0) return

    setBattlePhase('battling')
    setMessageText('Battle start!')
    gameSocket.challengeGym(currentGymLeader.id)
  }

  const handleClose = () => {
    clearPendingTimeout()
    setGymOpen(false)
    setBattlePhase('intro')
    setBattleResult(null)
  }

  // Calculate HP percentages
  const playerHPPercent = playerMaxHP > 0 ? (playerHP / playerMaxHP) * 100 : 100
  const gymHPPercent = gymMaxHP > 0 ? (gymHP / gymMaxHP) * 100 : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={battlePhase === 'intro' || battlePhase === 'result' ? handleClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-[#2a2a4a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative">
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(to right, ${TYPE_COLORS[currentGymLeader.specialty_type] || '#3B4CCA'}, #3B4CCA, ${TYPE_COLORS[currentGymLeader.specialty_type] || '#3B4CCA'})`
            }}
          />
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#2a2a4a]/50 to-transparent">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: `linear-gradient(to bottom right, ${TYPE_COLORS[currentGymLeader.specialty_type] || '#3B4CCA'}40, #2a2a4a)`
                }}
              >
                {BADGE_ICONS[currentGymLeader.badge_id] || '🏟️'}
              </div>
              <div>
                <h2 className="font-pixel text-sm text-white tracking-wider">{currentGymLeader.name.toUpperCase()}</h2>
                <p className="text-xs text-[#a0a0c0]">{currentGymLeader.title}</p>
              </div>
            </div>

            {/* Badge Status */}
            {hasAlreadyBeaten && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-green-400 text-xs font-medium">Badge Earned</span>
                <span>{BADGE_ICONS[currentGymLeader.badge_id] || '🏅'}</span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-white hover:border-red-500/50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content based on battle phase */}
        <div className="p-6">
          {battlePhase === 'intro' && (
            <>
              {/* Gym Leader Dialog */}
              <div className="mb-6 p-4 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a]">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] flex items-center justify-center text-3xl flex-shrink-0">
                    {currentGymLeader.name === 'Brock' ? '👨‍🦲' : '🧑'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm leading-relaxed min-h-[60px]">
                      {dialogText}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Gym Leader's Team Preview */}
              <div className="mb-6">
                <h3 className="text-xs text-[#606080] uppercase tracking-wider mb-3">
                  {currentGymLeader.name}&apos;s Team
                </h3>
                <div className="flex gap-3">
                  {currentGymLeader.team.map((pokemon, idx) => (
                    <div
                      key={idx}
                      className="flex-1 p-3 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.species_id}.png`}
                          alt={pokemon.species_name}
                          className="w-10 h-10 pixelated"
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{pokemon.species_name}</div>
                          <div className="text-[#a0a0c0] text-xs">Lv.{pokemon.level}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: TYPE_COLORS[pokemon.type1] || '#888' }}
                        >
                          {pokemon.type1}
                        </span>
                        {pokemon.type2 && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] text-white"
                            style={{ backgroundColor: TYPE_COLORS[pokemon.type2] || '#888' }}
                          >
                            {pokemon.type2}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge Button */}
              <div className="flex justify-center">
                {hasAlreadyBeaten ? (
                  <div className="text-center">
                    <p className="text-[#a0a0c0] text-sm mb-2">
                      You&apos;ve already earned the {currentGymLeader.badge_name}!
                    </p>
                    <button
                      onClick={handleChallenge}
                      disabled={healthyPartyCount === 0}
                      className="px-6 py-3 rounded-xl font-medium text-sm bg-[#2a2a4a] text-[#a0a0c0] hover:bg-[#3a3a5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rematch for Fun
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleChallenge}
                    disabled={healthyPartyCount === 0}
                    className={`
                      px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200
                      ${healthyPartyCount > 0
                        ? 'bg-gradient-to-b from-red-500 to-red-700 text-white hover:from-red-400 hover:to-red-600 active:scale-95 shadow-lg shadow-red-500/25'
                        : 'bg-[#2a2a4a] text-[#606080] cursor-not-allowed'
                      }
                    `}
                  >
                    {healthyPartyCount === 0 ? 'Heal Your Pokemon First!' : 'Challenge!'}
                  </button>
                )}
              </div>
            </>
          )}

        {/* Battle Animation - Classic Pokemon Style */}
        {(battlePhase === 'battling' || battlePhase === 'turn_attack' || battlePhase === 'turn_damage' || battlePhase === 'matchup_transition') && currentMatchup && (
          <div className="relative">
            <ClassicBattleArena
              playerPokemon={{
                name: currentMatchup.player_pokemon_name,
                level: currentMatchup.player_level,
                currentHp: playerHP,
                maxHp: playerMaxHP,
                sprite: getPokemonSpriteUrl(currentMatchup.player_species_id, false, 'back'),
                expPercent: 45,
              }}
              enemyPokemon={{
                name: currentMatchup.gym_pokemon_name,
                level: currentMatchup.gym_level,
                currentHp: gymHP,
                maxHp: gymMaxHP,
                sprite: getPokemonSpriteUrl(currentMatchup.gym_species_id),
              }}
              messageText={messageText}
              showAttackAnimation={
                battlePhase === 'turn_attack' && currentTurn
                  ? currentTurn.attacker === 'player' ? 'player' : 'enemy'
                  : null
              }
              showDamageFlash={
                battlePhase === 'turn_damage'
                  ? damageTarget === 'player' ? 'player' : 'enemy'
                  : null
              }
              showFaint={faintingPokemon}
              showAttackSlash={
                battlePhase === 'turn_damage' && currentTurn
                  ? damageTarget === 'player' ? 'player' : 'enemy'
                  : null
              }
              showHpDrain={
                battlePhase === 'turn_damage'
                  ? damageTarget === 'player' ? 'player' : 'enemy'
                  : null
              }
            >
              {/* Move info overlay */}
              {currentTurn && (
                <div className="classic-move-info">
                  <span className="classic-move-name">{currentTurn.move_name}</span>
                  <span
                    className="classic-move-type"
                    style={{ backgroundColor: getTypeColor(currentTurn.move_type) }}
                  >
                    {currentTurn.move_type}
                  </span>
                  {currentTurn.is_critical && (
                    <span className="text-[#f8c830] font-pixel text-[8px]">CRITICAL HIT!</span>
                  )}
                </div>
              )}
            </ClassicBattleArena>

            {/* Damage popup overlay */}
            {showDamageNumber && (
              <div
                className={cn(
                  'classic-damage-popup animate-damage-pop',
                  isCritical && 'critical'
                )}
                style={{
                  top: damageTarget === 'gym' ? '25%' : '55%',
                  left: damageTarget === 'gym' ? '70%' : '30%',
                }}
              >
                -{damageAmount}
              </div>
            )}
          </div>
        )}

          {/* Loading state when no matchup yet */}
          {battlePhase === 'battling' && !currentMatchup && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a]">
                <div className="w-8 h-8 border-4 border-[#3B4CCA] border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-medium">Battle starting...</span>
              </div>
            </div>
          )}

          {battlePhase === 'result' && battleResult && (
            <div className="text-center">
              {battleResult.success ? (
                <>
                  {/* Victory */}
                  <div className="mb-6">
                    <div className="text-6xl mb-4 animate-bounce">🏆</div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">Victory!</h3>
                    <p className="text-[#a0a0c0]">{currentGymLeader.dialog_win}</p>
                  </div>

                  {/* Rewards */}
                  {!hasAlreadyBeaten && (
                    <div className="flex justify-center gap-4 mb-6">
                      {battleResult.badge_name && (
                        <div className="px-4 py-3 rounded-xl bg-[#0f0f1a]/60 border border-green-500/30">
                          <div className="text-2xl mb-1">{BADGE_ICONS[battleResult.badge_earned || ''] || '🏅'}</div>
                          <div className="text-green-400 text-sm font-medium">{battleResult.badge_name}</div>
                        </div>
                      )}
                      {battleResult.money_earned && (
                        <div className="px-4 py-3 rounded-xl bg-[#0f0f1a]/60 border border-[#FFDE00]/30">
                          <div className="text-2xl mb-1">💰</div>
                          <div className="text-[#FFDE00] text-sm font-medium">${battleResult.money_earned.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Defeat */}
                  <div className="mb-6">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-2xl font-bold text-red-400 mb-2">Defeated...</h3>
                    <p className="text-[#a0a0c0]">{currentGymLeader.dialog_lose}</p>
                  </div>
                </>
              )}

              {/* Battle Summary */}
              {battleResult.matchups && battleResult.matchups.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a] text-left max-h-40 overflow-y-auto">
                  <h4 className="text-xs text-[#606080] uppercase tracking-wider mb-2">Battle Summary</h4>
                  {battleResult.matchups.map((matchup, idx) => (
                    <div key={idx} className="text-xs text-[#a0a0c0] mb-1 flex items-center gap-2">
                      <img
                        src={getPokemonSpriteUrl(matchup.player_species_id)}
                        alt={matchup.player_pokemon_name}
                        className="w-5 h-5 pixelated"
                      />
                      <span>{matchup.player_pokemon_name}</span>
                      <span className="text-[#606080]">vs</span>
                      <img
                        src={getPokemonSpriteUrl(matchup.gym_species_id)}
                        alt={matchup.gym_pokemon_name}
                        className="w-5 h-5 pixelated"
                      />
                      <span>{matchup.gym_pokemon_name}</span>
                      <span className="ml-auto">
                        {matchup.outcome === 'gym_pokemon_faint' ? (
                          <span className="text-green-400">Win</span>
                        ) : (
                          <span className="text-red-400">Loss</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl font-medium text-sm bg-gradient-to-b from-[#3B4CCA] to-[#2a3b9a] text-white hover:from-[#4B5CDA] hover:to-[#3B4CCA] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer with reward info */}
        {battlePhase === 'intro' && !hasAlreadyBeaten && (
          <div className="px-6 py-4 border-t border-[#2a2a4a] bg-[#0f0f1a]/50">
            <div className="flex items-center justify-center gap-6 text-xs text-[#606080]">
              <span>Reward: <span className="text-[#FFDE00]">${currentGymLeader.reward_money.toLocaleString()}</span></span>
              <span>Badge: <span className="text-green-400">{currentGymLeader.badge_name}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
