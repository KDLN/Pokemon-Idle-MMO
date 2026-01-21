'use client'

import { useGameStore } from '@/stores/gameStore'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn, getTypeColor } from '@/lib/ui'
import { useBattleAnimation } from '@/hooks/useBattleAnimation'
import { ClassicBattleArena } from '@/components/game/ClassicBattleHud'

// Helper to get HP bar color class based on percentage
function getHPColorClass(percent: number): string {
  if (percent <= 20) return 'hp-critical'
  if (percent <= 50) return 'hp-low'
  if (percent <= 75) return 'hp-medium'
  return 'hp-high'
}

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
  const currentZone = useGameStore((state) => state.currentZone)
  const clearActiveBattle = useGameStore((state) => state.clearActiveBattle)

  // Use the server-driven battle animation hook
  const battle = useBattleAnimation(clearActiveBattle)

  const isRoute = currentZone?.zone_type === 'route'

  // Idle state when no active battle
  if (battle.phase === 'idle' || !battle.wildPokemon) {
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

  // Battle scene
  const wild = battle.wildPokemon
  const lead = battle.leadPokemon
  const wildSpeciesData = getSpeciesData(wild.species_id)
  const leadSpeciesData = lead ? getSpeciesData(lead.species_id) : null
  const speciesName = wild.species?.name || wildSpeciesData.name
  const isShiny = wild.is_shiny || false
  const currentTurn = battle.currentTurn
  const catchSuccess = battle.catchSuccess

  // HP color classes
  const playerHPClass = getHPColorClass(battle.playerHPPercent)
  const wildHPClass = getHPColorClass(battle.wildHPPercent)

  // Build message text
  let messageText = battle.messageText || ''
  if (battle.phase === 'waiting_for_turn') {
    messageText = 'Waiting...'
  } else if (battle.phase === 'waiting_for_catch') {
    messageText = 'Throwing ball...'
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
          battle.phase === 'turn_active' && currentTurn?.effectiveness === 'super' && 'animate-screen-shake',
          battle.phase === 'turn_active' && currentTurn?.is_critical && 'animate-screen-shake-critical'
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
            name: leadSpeciesData?.name || lead?.name || 'Unknown',
            level: lead?.level || 1,
            currentHp: Math.round((battle.playerHPPercent / 100) * (lead?.max_hp || 100)),
            maxHp: lead?.max_hp || 100,
            sprite: lead ? getPokemonSpriteUrl(lead.species_id, lead.is_shiny, 'back') : '',
            expPercent: 45,
            hpColorClass: playerHPClass,
          }}
          enemyPokemon={{
            name: speciesName,
            level: wild.level,
            currentHp: Math.round((battle.wildHPPercent / 100) * wild.max_hp),
            maxHp: wild.max_hp,
            sprite: getPokemonSpriteUrl(wild.species_id, isShiny),
            hpColorClass: wildHPClass,
          }}
          messageText={messageText}
          showAttackAnimation={
            battle.phase === 'turn_active' && currentTurn
              ? currentTurn.attacker === 'player' ? 'player' : 'enemy'
              : null
          }
          showDamageFlash={
            battle.phase === 'turn_active'
              ? battle.damageTarget === 'player' ? 'player' : 'enemy'
              : null
          }
          showFaint={
            battle.phase === 'battle_end' && battle.wildHP <= 0 ? 'enemy' :
            battle.phase === 'battle_end' && battle.playerHP <= 0 ? 'player' :
            null
          }
          showAttackSlash={
            battle.phase === 'turn_active' && currentTurn
              ? battle.damageTarget === 'player' ? 'player' : 'enemy'
              : null
          }
          showHpDrain={
            battle.phase === 'turn_active'
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
                  battle.phase === 'catch_result' && catchSuccess && 'animate-catch-burst',
                  battle.phase === 'catch_result' && !catchSuccess && 'animate-break-free'
                )}
              >
                <Pokeball />
              </div>
              {battle.phase === 'catch_result' && catchSuccess && <CatchStars />}
            </div>
          )}

          {/* Shake counter during catch */}
          {battle.phase === 'catch_shake' && (
            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'w-3 h-3 rounded-full border-2',
                    n <= battle.currentShake
                      ? 'bg-yellow-400 border-yellow-500'
                      : 'bg-gray-600 border-gray-500'
                  )}
                />
              ))}
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


          {/* Battle result overlay */}
          {battle.phase === 'battle_end' && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              {battle.wildHP <= 0 && battle.canCatch && (
                <div className="px-8 py-4 rounded bg-[#3B4CCA] border-4 border-[#2A3A99] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    VICTORY!
                  </span>
                </div>
              )}
              {battle.playerHP <= 0 && (
                <div className="px-8 py-4 rounded bg-[#C03028] border-4 border-[#7D1F1A] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    BLACKOUT!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Catch result overlay */}
          {battle.phase === 'catch_result' && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              {catchSuccess ? (
                <div className="px-8 py-4 rounded bg-[#78C850] border-4 border-[#4E8234] animate-pop-in">
                  <span className="font-pixel text-xl text-white tracking-wider">
                    GOTCHA!
                  </span>
                  {battle.isNewPokedexEntry && (
                    <div className="text-center mt-2 font-pixel text-sm text-yellow-300">
                      Registered to Pokedex!
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-8 py-4 rounded bg-[#F8D030] border-4 border-[#A1871F] animate-pop-in">
                  <span className="font-pixel text-xl text-[#282828] tracking-wider">
                    BROKE FREE!
                  </span>
                </div>
              )}
            </div>
          )}


          {/* Summary overlay (reconnect after timeout) */}
          {battle.phase === 'summary' && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="px-8 py-4 rounded bg-[#1a1a2e] border-4 border-[#2a2a4a] animate-pop-in max-w-xs text-center">
                <span className="font-pixel text-lg text-white tracking-wide">
                  {battle.messageText}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
