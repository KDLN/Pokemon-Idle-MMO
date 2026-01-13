'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

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

export function GymBattlePanel() {
  const isGymOpen = useGameStore((state) => state.isGymOpen)
  const currentGymLeader = useGameStore((state) => state.currentGymLeader)
  const badges = useGameStore((state) => state.badges)
  const setGymOpen = useGameStore((state) => state.setGymOpen)
  const addBadge = useGameStore((state) => state.addBadge)
  const party = useGameStore((state) => state.party)

  const [battleState, setBattleState] = useState<'intro' | 'battling' | 'result'>('intro')
  const [battleResult, setBattleResult] = useState<GymBattleResult | null>(null)
  const [dialogText, setDialogText] = useState('')
  const [dialogIndex, setDialogIndex] = useState(0)

  // Reset state when panel opens
  useEffect(() => {
    if (isGymOpen && currentGymLeader) {
      setBattleState('intro')
      setBattleResult(null)
      setDialogText('')
      setDialogIndex(0)
    }
  }, [isGymOpen, currentGymLeader])

  // Typewriter effect for dialog
  useEffect(() => {
    if (!currentGymLeader || battleState !== 'intro') return

    const fullText = currentGymLeader.dialog_intro
    if (dialogIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDialogText(fullText.slice(0, dialogIndex + 1))
        setDialogIndex(dialogIndex + 1)
      }, 20)
      return () => clearTimeout(timeout)
    }
  }, [currentGymLeader, dialogIndex, battleState])

  // Expose handler for socket - must be before early return to maintain hook order
  useEffect(() => {
    // Store handler on window for socket to call
    const handler = (result: GymBattleResult) => {
      setBattleResult(result)
      setBattleState('result')

      if (result.success && result.badge_earned) {
        useGameStore.getState().addBadge(result.badge_earned)
      }
    }
    ;(window as unknown as { __gymBattleHandler?: (result: GymBattleResult) => void }).__gymBattleHandler = handler
    return () => {
      delete (window as unknown as { __gymBattleHandler?: (result: GymBattleResult) => void }).__gymBattleHandler
    }
  }, [])

  if (!isGymOpen || !currentGymLeader) return null

  const hasAlreadyBeaten = badges.includes(currentGymLeader.badge_id)
  const healthyPartyCount = party.filter(p => p && p.current_hp > 0).length

  const handleChallenge = () => {
    if (healthyPartyCount === 0) return

    setBattleState('battling')
    gameSocket.challengeGym(currentGymLeader.id)
  }

  const handleClose = () => {
    setGymOpen(false)
    setBattleState('intro')
    setBattleResult(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
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

        {/* Content based on battle state */}
        <div className="p-6">
          {battleState === 'intro' && (
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

          {battleState === 'battling' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a]">
                <div className="w-8 h-8 border-4 border-[#3B4CCA] border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-medium">Battle in progress...</span>
              </div>
            </div>
          )}

          {battleState === 'result' && battleResult && (
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

              {/* Battle Log */}
              {battleResult.battle_log && battleResult.battle_log.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-[#0f0f1a]/60 border border-[#2a2a4a] text-left max-h-40 overflow-y-auto">
                  <h4 className="text-xs text-[#606080] uppercase tracking-wider mb-2">Battle Log</h4>
                  {battleResult.battle_log.map((log, idx) => (
                    <p key={idx} className="text-xs text-[#a0a0c0] mb-1">{log}</p>
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
        {battleState === 'intro' && !hasAlreadyBeaten && (
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
