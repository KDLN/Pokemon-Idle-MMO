'use client'

import { useGameStore } from '@/stores/gameStore'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn, getTypeColor } from '@/lib/ui'
import { useBattleAnimation } from '@/hooks/useBattleAnimation'
import { BattleSceneFrame } from '@/components/game/BattleSceneFrame'
import { BattleHudGrid } from '@/components/game/BattleHudGrid'

// HP Bar component with smooth animation
function HPBar({
  percent,
  animating = false,
  size = 'normal'
}: {
  percent: number
  animating?: boolean
  size?: 'normal' | 'small'
}) {
  const getHPColor = () => {
    if (percent > 50) return 'hp-high'
    if (percent > 20) return 'hp-mid'
    return 'hp-low'
  }

  return (
    <div className={cn('hp-bar', size === 'small' && 'h-2')}>
      <div
        className={cn('hp-bar-fill', getHPColor(), animating && 'transition-all duration-400')}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  )
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

// Damage number popup
function DamageNumber({
  amount,
  isCritical,
  target
}: {
  amount: number
  isCritical: boolean
  target: 'player' | 'wild'
}) {
  return (
    <div
      className={cn(
        'absolute font-pixel text-2xl animate-damage-pop z-30 drop-shadow-lg',
        isCritical ? 'text-yellow-400 text-3xl' : 'text-white',
        target === 'wild' ? 'top-[30%] right-[25%]' : 'bottom-[35%] left-[25%]'
      )}
    >
      {isCritical && <span className="text-sm block -mb-1">CRIT!</span>}
      -{amount}
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

  // Battle scene - MODAL OVERLAY
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

  const framePhaseClasses = cn(
    battle.phase === 'fade_out' ? 'opacity-0 scale-90' : 'opacity-100 scale-100',
    battle.phase === 'turn_damage' && battle.currentTurn?.effectiveness === 'super' && 'animate-screen-shake',
    'transition-all duration-500'
  )

  const wildTypes = [
    wildSpeciesData.type,
    wildSpeciesData.type2 ?? undefined,
  ].filter(Boolean)

  const leadTypes = [
    leadSpeciesData?.type,
    leadSpeciesData?.type2,
  ].filter(Boolean)

  const hudEntries = [
    {
      label: 'Wild Pokémon',
      name: speciesName,
      level: wild.level,
      healthPercent: battle.wildHPPercent,
      sprite: getPokemonSpriteUrl(wild.species_id, isShiny),
      types: wildTypes,
    },
    ...(leadPokemon
      ? [
          {
            label: 'Your Pokémon',
            name: leadSpeciesData?.name || 'Unknown',
            level: leadPokemon.level,
            healthPercent: battle.playerHPPercent,
            sprite: getPokemonSpriteUrl(leadPokemon.species_id, leadPokemon.is_shiny),
            types: leadTypes,
            flipped: true,
          },
        ]
      : []),
  ]

  return (
    <BattleSceneFrame
      isShiny={isShiny}
      glowColor={isShiny ? '#FFD700' : wildSpeciesData.color}
      sizeClass="max-w-lg"
      phaseClasses={framePhaseClasses}
      caught={caught}
    >
      <div className="relative flex flex-col gap-6 p-6">
        <BattleHudGrid entries={hudEntries} />

        <div className="flex-1 relative" style={{ minHeight: '140px' }}>
        {/* Pokeball catch animation */}
        {battle.isInCatch && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] text-white/80 z-20">
            <div className="w-56 h-2 bg-white/5 rounded-full overflow-hidden border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 transition-all duration-300"
                style={{ width: `${catchStrengthPct}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-widest">{catchStatusLabel}</span>
              {catchResult.close_call && <span className="text-yellow-300">Close!</span>}
              {catchResult.critical && <span className="text-emerald-300">Critical!</span>}
            </div>
          </div>
        )}

        {/* Damage numbers */}
        {battle.showDamageNumber && (
          <DamageNumber
            amount={battle.damageAmount}
            isCritical={battle.isCritical}
            target={battle.damageTarget}
          />
        )}

        {/* Type effectiveness message */}
        {battle.phase === 'battle_intro' && currentEncounter.effectiveness_text && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-slide-up z-20">
            {currentEncounter.effectiveness_text === 'super_effective' && (
              <div className="px-4 py-2 rounded-full bg-green-500/30 border-2 border-green-500/50 backdrop-blur-sm">
                <span className="font-pixel text-sm text-green-400 tracking-wide">
                  SUPER EFFECTIVE!
                </span>
              </div>
            )}
            {currentEncounter.effectiveness_text === 'not_very_effective' && (
              <div className="px-4 py-2 rounded-full bg-orange-500/30 border-2 border-orange-500/50 backdrop-blur-sm">
                <span className="font-pixel text-sm text-orange-400 tracking-wide">
                  NOT VERY EFFECTIVE...
                </span>
              </div>
            )}
            {currentEncounter.effectiveness_text === 'no_effect' && (
              <div className="px-4 py-2 rounded-full bg-gray-500/30 border-2 border-gray-500/50 backdrop-blur-sm">
                <span className="font-pixel text-sm text-gray-400 tracking-wide">
                  NO EFFECT!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Battle result overlay */}
        {(battle.phase === 'battle_end' || battle.phase === 'catch_result') && (
          <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'win' && !currentEncounter.catch_result && (
              <div className="px-8 py-4 rounded-full bg-[#3B4CCA]/40 border-2 border-[#3B4CCA]/70 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-xl text-[#5B6EEA] tracking-wider">
                  VICTORY!
                </span>
              </div>
            )}
            {battle.phase === 'catch_result' && caught && (
              <div className="px-8 py-4 rounded-full bg-green-500/40 border-2 border-green-500/70 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-xl text-green-400 tracking-wider">
                  GOTCHA!
                </span>
              </div>
            )}
            {battle.phase === 'catch_result' && !caught && (
              <div className="px-8 py-4 rounded-full bg-yellow-500/40 border-2 border-yellow-500/70 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-xl text-yellow-400 tracking-wider">
                  BROKE FREE!
                </span>
              </div>
            )}
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'fled' && (
              <div className="px-8 py-4 rounded-full bg-gray-500/40 border-2 border-gray-500/70 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-xl text-gray-400 tracking-wider">
                  GOT AWAY...
                </span>
              </div>
            )}
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'wipe' && (
              <div className="px-8 py-4 rounded-full bg-red-500/40 border-2 border-red-500/70 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-xl text-red-400 tracking-wider">
                  BLACKOUT!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Rewards overlay */}
        {battle.phase === 'rewards' && currentEncounter.battle_result === 'win' && (
          <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              {battleSeq && battleSeq.xp_earned > 0 && (
                <div className="animate-reward-float text-yellow-400 font-pixel text-lg drop-shadow-lg">
                  +{battleSeq.xp_earned} XP
                </div>
              )}
              {caught && (
                <div className="animate-reward-float text-green-400 font-pixel text-lg drop-shadow-lg" style={{ animationDelay: '0.2s' }}>
                  {speciesName} caught!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sparkles */}
        {(isShiny || caught) && battle.phase === 'catch_result' && (
          <>
            <div className="absolute top-1/4 left-1/4 text-yellow-400 text-xl animate-sparkle">バﾝ</div>
            <div className="absolute top-1/3 right-1/4 text-yellow-300 text-lg animate-sparkle delay-200">バﾝ</div>
            <div className="absolute bottom-1/3 left-1/3 text-yellow-400 text-lg animate-sparkle delay-500">バﾝ</div>
          </>
        )}
      </div>

      {/* Battle message text box */}
        <div className="flex-none bg-[#1a1a2e] border-t-2 border-[#2a2a4a] p-4">
          {currentTurn && (
            <div className="flex items-center justify-center gap-3 mb-1 text-[11px] text-white/70">
              <span className="uppercase tracking-widest">Move:</span>
              <span className="font-semibold text-white">{currentTurn.move_name}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: getTypeColor(currentTurn.move_type),
                  color: '#0f0f1a'
                }}
              >
                {currentTurn.move_type}
              </span>
              {currentTurn.status_effect && (
                <span className="text-yellow-300">Inflicts {currentTurn.status_effect}</span>
              )}
            </div>
          )}
          <p
              className={cn(
                'font-pixel text-sm text-white text-center',
                battle.messageText && 'animate-message-slide-in'
              )}
              key={battle.messageText}
            >
              {battle.messageText || '\u00A0'}
            </p>
         </div>
      </div>
    </BattleSceneFrame>
  )
}
