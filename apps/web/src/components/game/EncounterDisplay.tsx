'use client'

import { useGameStore } from '@/stores/gameStore'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn, getTypeColor } from '@/lib/ui'
import { useBattleAnimation } from '@/hooks/useBattleAnimation'
import { ClassicBattleArena } from '@/components/game/ClassicBattleHud'

// Pokeball component for catch animation
function Pokeball({ className }: { className?: string }) {
  return (
    <div className={cn('w-16 h-16 relative', className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden shadow-lg">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-[#1a1a2e] -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-[3px] border-[#1a1a2e]" />
      </div>
    </div>
  )
}


// Star burst effect for catch success
function CatchStars() {
  const stars = [
    { x: '-50px', y: '-40px', delay: '0s' },
    { x: '50px', y: '-40px', delay: '0.1s' },
    { x: '-60px', y: '30px', delay: '0.2s' },
    { x: '60px', y: '30px', delay: '0.15s' },
    { x: '0px', y: '-60px', delay: '0.05s' },
    { x: '0px', y: '50px', delay: '0.25s' },
  ]

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 text-yellow-400 text-3xl animate-star-burst"
          style={{
            '--star-x': star.x,
            '--star-y': star.y,
            animationDelay: star.delay
          } as React.CSSProperties}
        >
          ✦
        </div>
      ))}
    </>
  )
}

export function EncounterDisplay() {
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const clearEncounter = useGameStore((state) => state.clearEncounter)
  const currentZone = useGameStore((state) => state.currentZone)
  const party = useGameStore((state) => state.party)

  // Get lead Pokemon info
  const leadPokemon = party.find(p => p && p.current_hp > 0) || party[0]
  const leadSpeciesData = leadPokemon ? getSpeciesData(leadPokemon.species_id) : null

  // Use the battle animation hook
  const battle = useBattleAnimation(currentEncounter, clearEncounter)

  const isRoute = currentZone?.zone_type === 'route'

  // Idle state when no encounter - show inline
  if (battle.phase === 'idle' || !currentEncounter) {
    return (
      <div className="relative rounded-2xl overflow-hidden h-[200px] sm:h-[240px]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />

        {/* Battle field effect */}
        {isRoute && (
          <div className="absolute inset-0">
            {/* Grass field */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-900/20 to-transparent" />
            {/* Animated grass tufts */}
            <div className="absolute bottom-8 left-1/4 w-6 h-8 opacity-20">
              <div className="w-full h-full bg-green-500 rounded-t-full animate-grass-sway" />
            </div>
            <div className="absolute bottom-6 right-1/3 w-4 h-6 opacity-15">
              <div className="w-full h-full bg-green-500 rounded-t-full animate-grass-sway delay-200" />
            </div>
            <div className="absolute bottom-10 right-1/4 w-5 h-7 opacity-20">
              <div className="w-full h-full bg-green-500 rounded-t-full animate-grass-sway delay-500" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full p-4">
          {isRoute ? (
            <>
              {/* Pokeball waiting indicator */}
              <div className="relative w-16 h-16 mb-3">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515]/20 to-transparent animate-pulse" />
                <Pokeball className="w-full h-full opacity-60" />
              </div>

              <div className="font-pixel text-xs text-white tracking-wider mb-1">
                EXPLORING
              </div>
              <div className="text-[#a0a0c0] text-sm">{currentZone.name}</div>

              {/* Waiting dots */}
              <div className="flex gap-1.5 mt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Town resting state */}
              <div className="relative w-16 h-16 mb-3">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-transparent animate-pulse" />
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#252542] border-2 border-[#2a2a4a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>

              <div className="font-pixel text-xs text-white tracking-wider mb-1">
                RESTING
              </div>
              <div className="text-[#a0a0c0] text-sm">{currentZone?.name}</div>
            </>
          )}
        </div>

        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#2a2a4a] pointer-events-none" />
      </div>
    )
  }

  // Battle scene - MODAL OVERLAY with Classic Pokemon Layout
  const wild = currentEncounter.wild_pokemon
  const wildSpeciesData = getSpeciesData(wild.species_id)
  const speciesName = wild.species?.name || wildSpeciesData.name
  const isShiny = wild.is_shiny || false
  const battleSeq = currentEncounter.battle_sequence
  const caught = currentEncounter.catch_result?.success
  const currentTurn = battle.currentTurn
  const catchResult = currentEncounter.catch_result
  const catchStrengthPct = Math.min(100, Math.max(0, (catchResult?.catch_strength ?? 0) * 100))
  const catchStatusLabel =
    catchResult?.critical ? 'Critical Throw!' :
    catchResult?.close_call ? 'Close Call!' :
    'Catch Chance'

  // Build message text with move info
  let messageWithMove = battle.messageText || ''
  if (currentTurn && battle.isInBattle) {
    const effectivenessText =
      currentTurn.effectiveness === 'super' ? " It's super effective!" :
      currentTurn.effectiveness === 'not_very' ? " It's not very effective..." :
      currentTurn.effectiveness === 'immune' ? " It has no effect!" : ''
    messageWithMove = `${currentTurn.attacker_name} used ${currentTurn.move_name}!${effectivenessText}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500',
          battle.phase === 'fade_out' ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Battle Arena Container */}
      <div
        className={cn(
          'relative w-full max-w-xl transition-all duration-500',
          battle.phase === 'fade_out' ? 'opacity-0 scale-90' : 'opacity-100 scale-100',
          battle.phase === 'turn_damage' && battle.currentTurn?.effectiveness === 'super' && 'animate-screen-shake'
        )}
      >
        {/* Shiny banner */}
        {isShiny && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 py-2 rounded-t-lg animate-shimmer">
            <div className="flex items-center justify-center gap-2">
              <span className="text-black text-lg">✦</span>
              <span className="font-pixel text-sm text-black tracking-widest">SHINY POKEMON!</span>
              <span className="text-black text-lg">✦</span>
            </div>
          </div>
        )}

        {/* Classic Battle Arena */}
        <ClassicBattleArena
          playerPokemon={{
            name: leadSpeciesData?.name || 'Unknown',
            level: leadPokemon?.level || 1,
            currentHp: Math.round((battle.playerHPPercent / 100) * (leadPokemon?.max_hp || 100)),
            maxHp: leadPokemon?.max_hp || 100,
            sprite: leadPokemon ? getPokemonSpriteUrl(leadPokemon.species_id, leadPokemon.is_shiny) : '',
            expPercent: 45,
          }}
          enemyPokemon={{
            name: speciesName,
            level: wild.level,
            currentHp: Math.round((battle.wildHPPercent / 100) * wild.max_hp),
            maxHp: wild.max_hp,
            sprite: getPokemonSpriteUrl(wild.species_id, isShiny),
          }}
          messageText={messageWithMove}
          showAttackAnimation={
            battle.phase === 'turn_attack' && currentTurn
              ? currentTurn.attacker === 'player' ? 'player' : 'enemy'
              : null
          }
          showDamageFlash={
            battle.phase === 'turn_damage'
              ? battle.damageTarget === 'player' ? 'player' : 'enemy'
              : null
          }
          showFaint={
            battle.phase === 'battle_end' && currentEncounter.battle_result === 'win' ? 'enemy' :
            battle.phase === 'battle_end' && currentEncounter.battle_result === 'wipe' ? 'player' :
            null
          }
          showAttackSlash={
            battle.phase === 'turn_damage' && currentTurn
              ? battle.damageTarget === 'player' ? 'player' : 'enemy'
              : null
          }
          showHpDrain={
            battle.phase === 'turn_damage'
              ? battle.damageTarget === 'player' ? 'player' : 'enemy'
              : null
          }
        >
          {/* Move type badge in message box */}
          {currentTurn && battle.isInBattle && (
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

        {/* Overlays on top of the arena */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Pokeball catch animation */}
          {battle.isInCatch && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div
                className={cn(
                  battle.phase === 'catch_throw' && 'animate-pokeball-throw',
                  battle.phase === 'catch_shake' && 'animate-pokeball-wobble',
                  battle.phase === 'catch_result' && caught && 'animate-catch-burst',
                  battle.phase === 'catch_result' && !caught && 'animate-break-free'
                )}
              >
                <Pokeball />
              </div>
              {battle.phase === 'catch_result' && caught && <CatchStars />}
            </div>
          )}

          {/* Catch meter */}
          {battle.isInCatch && catchResult && (
            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] z-20">
              <div className="w-40 h-2 bg-[#282828] rounded-full overflow-hidden border border-[#484848]">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 transition-all duration-300"
                  style={{ width: `${catchStrengthPct}%` }}
                />
              </div>
              <div className="flex items-center gap-2 font-pixel text-[#282828] bg-[#f8f8f0] px-2 py-1 rounded">
                <span className="font-semibold tracking-widest">{catchStatusLabel}</span>
              </div>
            </div>
          )}

          {/* Damage numbers */}
          {battle.showDamageNumber && (
            <div
              className={cn(
                'classic-damage-popup animate-damage-pop',
                battle.isCritical && 'critical'
              )}
              style={{
                top: battle.damageTarget === 'wild' ? '25%' : '55%',
                left: battle.damageTarget === 'wild' ? '70%' : '30%',
              }}
            >
              -{battle.damageAmount}
            </div>
          )}

          {/* Type effectiveness message */}
          {battle.phase === 'battle_intro' && currentEncounter.effectiveness_text && (
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 animate-slide-up z-20">
              {currentEncounter.effectiveness_text === 'super_effective' && (
                <div className="px-4 py-2 rounded bg-[#78C850] border-2 border-[#4E8234]">
                  <span className="font-pixel text-sm text-white tracking-wide">
                    SUPER EFFECTIVE!
                  </span>
                </div>
              )}
              {currentEncounter.effectiveness_text === 'not_very_effective' && (
                <div className="px-4 py-2 rounded bg-[#F08030] border-2 border-[#9C531F]">
                  <span className="font-pixel text-sm text-white tracking-wide">
                    NOT VERY EFFECTIVE...
                  </span>
                </div>
              )}
              {currentEncounter.effectiveness_text === 'no_effect' && (
                <div className="px-4 py-2 rounded bg-[#A8A878] border-2 border-[#6D6D4E]">
                  <span className="font-pixel text-sm text-white tracking-wide">
                    NO EFFECT!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Battle result overlay */}
          {(battle.phase === 'battle_end' || battle.phase === 'catch_result') && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              {battle.phase === 'battle_end' && currentEncounter.battle_result === 'win' && !currentEncounter.catch_result && (
                <div className="px-8 py-4 rounded bg-[#3B4CCA] border-4 border-[#2A3A99] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    VICTORY!
                  </span>
                </div>
              )}
              {battle.phase === 'catch_result' && caught && (
                <div className="px-8 py-4 rounded bg-[#78C850] border-4 border-[#4E8234] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    GOTCHA!
                  </span>
                </div>
              )}
              {battle.phase === 'catch_result' && !caught && (
                <div className="px-8 py-4 rounded bg-[#F8D030] border-4 border-[#A1871F] animate-pop-in">
                  <span className="font-pixel text-xl text-[#282828] tracking-wider">
                    BROKE FREE!
                  </span>
                </div>
              )}
              {battle.phase === 'battle_end' && currentEncounter.battle_result === 'fled' && (
                <div className="px-8 py-4 rounded bg-[#A8A878] border-4 border-[#6D6D4E] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    GOT AWAY...
                  </span>
                </div>
              )}
              {battle.phase === 'battle_end' && currentEncounter.battle_result === 'wipe' && (
                <div className="px-8 py-4 rounded bg-[#C03028] border-4 border-[#7D1F1A] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    BLACKOUT!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Rewards overlay */}
          {battle.phase === 'rewards' && currentEncounter.battle_result === 'win' && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="flex flex-col items-center gap-2">
                {battleSeq && battleSeq.xp_earned > 0 && (
                  <div className="animate-reward-float px-4 py-2 bg-[#F8D030] border-2 border-[#A1871F] rounded font-pixel text-lg text-[#282828]">
                    +{battleSeq.xp_earned} XP
                  </div>
                )}
                {caught && (
                  <div className="animate-reward-float px-4 py-2 bg-[#78C850] border-2 border-[#4E8234] rounded font-pixel text-lg text-white" style={{ animationDelay: '0.2s' }}>
                    {speciesName} caught!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sparkles for shiny/catch */}
          {(isShiny || caught) && battle.phase === 'catch_result' && (
            <>
              <div className="absolute top-[25%] left-[30%] text-yellow-400 text-lg animate-sparkle">✦</div>
              <div className="absolute top-[20%] right-[30%] text-yellow-300 text-base animate-sparkle delay-200">✦</div>
              <div className="absolute top-[40%] left-[35%] text-yellow-400 text-base animate-sparkle delay-500">✦</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
