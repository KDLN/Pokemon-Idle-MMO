'use client'

import { useGameStore } from '@/stores/gameStore'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn } from '@/lib/ui'
import { useBattleAnimation } from '@/hooks/useBattleAnimation'

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
    <div className={cn('hp-bar', size === 'small' && 'h-1.5')}>
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
    <div className={cn('w-12 h-12 relative', className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1a2e] -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a2e]" />
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
        'absolute font-pixel text-lg animate-damage-pop z-30',
        isCritical ? 'text-yellow-400 text-xl' : 'text-white',
        target === 'wild' ? 'top-1/4 right-1/4' : 'bottom-1/3 left-1/4'
      )}
    >
      {isCritical && <span className="text-xs block -mb-1">CRIT!</span>}
      -{amount}
    </div>
  )
}

// Star burst effect for catch success
function CatchStars() {
  const stars = [
    { x: '-40px', y: '-30px', delay: '0s' },
    { x: '40px', y: '-30px', delay: '0.1s' },
    { x: '-50px', y: '20px', delay: '0.2s' },
    { x: '50px', y: '20px', delay: '0.15s' },
    { x: '0px', y: '-50px', delay: '0.05s' },
    { x: '0px', y: '40px', delay: '0.25s' },
  ]

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 text-yellow-400 text-2xl animate-star-burst"
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

  // Idle state when no encounter
  if (battle.phase === 'idle' || !currentEncounter) {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[320px]">
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
        <div className="relative flex flex-col items-center justify-center h-full min-h-[320px] p-6">
          {isRoute ? (
            <>
              {/* Pokeball waiting indicator */}
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515]/20 to-transparent animate-pulse" />
                <Pokeball className="w-full h-full opacity-60" />
              </div>

              <div className="font-pixel text-xs text-white tracking-wider mb-1">
                EXPLORING
              </div>
              <div className="text-[#a0a0c0] text-sm">{currentZone.name}</div>

              {/* Waiting dots */}
              <div className="flex gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              <div className="mt-4 text-xs text-[#606080]">Wild Pokemon may appear!</div>
            </>
          ) : (
            <>
              {/* Town resting state */}
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-transparent animate-pulse" />
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#252542] border-2 border-[#2a2a4a] flex items-center justify-center">
                  <svg className="w-10 h-10 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>

              <div className="font-pixel text-xs text-white tracking-wider mb-1">
                RESTING
              </div>
              <div className="text-[#a0a0c0] text-sm">{currentZone?.name}</div>
              <div className="mt-4 text-xs text-[#606080]">Your Pokemon are healed</div>
            </>
          )}
        </div>

        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#2a2a4a] pointer-events-none" />
      </div>
    )
  }

  // Battle scene
  const wild = currentEncounter.wild_pokemon
  const wildSpeciesData = getSpeciesData(wild.species_id)
  const speciesName = wild.species?.name || wildSpeciesData.name
  const isShiny = wild.is_shiny || false
  const battleSeq = currentEncounter.battle_sequence
  const caught = currentEncounter.catch_result?.success

  // Determine container animation class
  const getContainerClass = () => {
    if (battle.phase === 'fade_out') return 'opacity-0 scale-95'
    if (battle.phase === 'turn_damage' && battle.currentTurn?.effectiveness === 'super') {
      return 'animate-screen-shake'
    }
    return 'opacity-100 scale-100'
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden min-h-[320px] transition-all duration-500',
        getContainerClass(),
        isShiny && 'ring-2 ring-yellow-400'
      )}
    >
      {/* Background with type color glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at center, ${isShiny ? '#FFD700' : wildSpeciesData.color} 0%, transparent 70%)`
        }}
      />

      {/* Shiny indicator banner */}
      {isShiny && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 py-1.5 animate-shimmer">
          <div className="flex items-center justify-center gap-2">
            <span className="text-black">✦</span>
            <span className="font-pixel text-[10px] text-black tracking-widest">SHINY POKEMON!</span>
            <span className="text-black">✦</span>
          </div>
        </div>
      )}

      {/* Battle scene ground */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-900/30 to-transparent" />

      {/* Main battle area */}
      <div className="relative h-full min-h-[320px] p-4">
        {/* Top: Wild Pokemon HUD */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-[#1a1a2e]/90 rounded-lg p-2 border border-[#2a2a4a] max-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-pixel text-xs text-white truncate">{speciesName}</span>
              <span className="text-xs text-[#606080]">Lv.{wild.level}</span>
            </div>
            <HPBar
              percent={battle.wildHPPercent}
              animating={battle.isInBattle}
              size="small"
            />
          </div>
        </div>

        {/* Wild Pokemon sprite */}
        <div className="absolute top-16 right-8 z-10">
          <div
            className={cn(
              'transform transition-all duration-300',
              battle.phase === 'appear' && 'animate-wild-slide-in',
              battle.isInBattle && battle.currentTurn?.attacker === 'wild' && 'animate-attack-lunge-wild',
              battle.isInBattle && battle.damageTarget === 'wild' && battle.showDamageNumber && 'animate-damage-flash',
              battle.phase === 'catch_throw' && 'animate-pokemon-faint',
              battle.phase === 'catch_result' && !caught && 'animate-pokemon-emerge',
              battle.wildHP <= 0 && 'animate-pokemon-faint'
            )}
          >
            {/* Type glow */}
            <div
              className={cn('absolute inset-0 blur-2xl opacity-40 scale-75', isShiny && 'animate-pulse')}
              style={{ backgroundColor: isShiny ? '#FFD700' : wildSpeciesData.color }}
            />
            <img
              src={getPokemonSpriteUrl(wild.species_id, isShiny)}
              alt={speciesName}
              className="w-24 h-24 pixelated relative z-10"
            />
          </div>
        </div>

        {/* Player Pokemon sprite (if in battle) */}
        {battleSeq && leadPokemon && (
          <div className="absolute bottom-20 left-8 z-10">
            <div
              className={cn(
                'transform transition-all duration-300',
                battle.phase === 'battle_intro' && 'animate-player-slide-in',
                battle.isInBattle && battle.currentTurn?.attacker === 'player' && 'animate-attack-lunge',
                battle.isInBattle && battle.damageTarget === 'player' && battle.showDamageNumber && 'animate-damage-flash',
                battle.phase === 'battle_end' && battleSeq.final_outcome === 'player_win' && 'animate-victory-bounce'
              )}
            >
              {/* Type glow */}
              <div
                className="absolute inset-0 blur-2xl opacity-30 scale-75"
                style={{ backgroundColor: leadSpeciesData?.color }}
              />
              <img
                src={getPokemonSpriteUrl(leadPokemon.species_id, leadPokemon.is_shiny)}
                alt={battleSeq.lead_pokemon_name}
                className="w-20 h-20 pixelated relative z-10 -scale-x-100"
              />
            </div>
          </div>
        )}

        {/* Bottom: Player Pokemon HUD */}
        {battleSeq && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-[#1a1a2e]/90 rounded-lg p-2 border border-[#2a2a4a] max-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-xs text-white truncate">{battleSeq.lead_pokemon_name}</span>
                <span className="text-xs text-[#606080]">Lv.{battleSeq.lead_level}</span>
              </div>
              <HPBar
                percent={battle.playerHPPercent}
                animating={battle.isInBattle}
                size="small"
              />
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
            {/* Catch success stars */}
            {battle.phase === 'catch_result' && caught && <CatchStars />}
          </div>
        )}

        {/* Type effectiveness message */}
        {battle.phase === 'battle_intro' && currentEncounter.effectiveness_text && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 animate-slide-up z-20">
            {currentEncounter.effectiveness_text === 'super_effective' && (
              <div className="px-3 py-1.5 rounded-full bg-green-500/30 border border-green-500/50 backdrop-blur-sm">
                <span className="font-pixel text-[10px] text-green-400 tracking-wide">
                  SUPER EFFECTIVE!
                </span>
              </div>
            )}
            {currentEncounter.effectiveness_text === 'not_very_effective' && (
              <div className="px-3 py-1.5 rounded-full bg-orange-500/30 border border-orange-500/50 backdrop-blur-sm">
                <span className="font-pixel text-[10px] text-orange-400 tracking-wide">
                  NOT VERY EFFECTIVE...
                </span>
              </div>
            )}
            {currentEncounter.effectiveness_text === 'no_effect' && (
              <div className="px-3 py-1.5 rounded-full bg-gray-500/30 border border-gray-500/50 backdrop-blur-sm">
                <span className="font-pixel text-[10px] text-gray-400 tracking-wide">
                  NO EFFECT!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Battle message text box */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-[#1a1a2e]/95 border-t-2 border-[#2a2a4a] p-3">
            <p
              className={cn(
                'font-pixel text-xs text-white text-center',
                battle.messageText && 'animate-message-slide-in'
              )}
              key={battle.messageText} // Force re-render for animation
            >
              {battle.messageText || '\u00A0'}
            </p>
          </div>
        </div>

        {/* Battle result overlay */}
        {(battle.phase === 'battle_end' || battle.phase === 'catch_result') && (
          <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'win' && !currentEncounter.catch_result && (
              <div className="px-6 py-3 rounded-full bg-[#3B4CCA]/30 border-2 border-[#3B4CCA]/60 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-sm text-[#5B6EEA] tracking-wider">
                  VICTORY!
                </span>
              </div>
            )}
            {battle.phase === 'catch_result' && caught && (
              <div className="px-6 py-3 rounded-full bg-green-500/30 border-2 border-green-500/60 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-sm text-green-400 tracking-wider">
                  GOTCHA!
                </span>
              </div>
            )}
            {battle.phase === 'catch_result' && !caught && (
              <div className="px-6 py-3 rounded-full bg-yellow-500/30 border-2 border-yellow-500/60 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-sm text-yellow-400 tracking-wider">
                  BROKE FREE!
                </span>
              </div>
            )}
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'fled' && (
              <div className="px-6 py-3 rounded-full bg-gray-500/30 border-2 border-gray-500/60 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-sm text-gray-400 tracking-wider">
                  GOT AWAY...
                </span>
              </div>
            )}
            {battle.phase === 'battle_end' && currentEncounter.battle_result === 'wipe' && (
              <div className="px-6 py-3 rounded-full bg-red-500/30 border-2 border-red-500/60 backdrop-blur-sm animate-pop-in">
                <span className="font-pixel text-sm text-red-400 tracking-wider">
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
                <div className="animate-reward-float text-yellow-400 font-pixel text-sm">
                  +{battleSeq.xp_earned} XP
                </div>
              )}
              {caught && (
                <div className="animate-reward-float text-green-400 font-pixel text-sm" style={{ animationDelay: '0.2s' }}>
                  {speciesName} caught!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sparkles for shiny or catch */}
        {(isShiny || caught) && battle.phase === 'catch_result' && (
          <>
            <div className="absolute top-1/4 left-1/4 w-3 h-3 text-yellow-400 animate-sparkle">✦</div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 text-yellow-300 animate-sparkle delay-200">✦</div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 text-yellow-400 animate-sparkle delay-500">✦</div>
            <div className="absolute top-1/2 right-1/3 w-3 h-3 text-yellow-300 animate-sparkle delay-300">✦</div>
          </>
        )}
      </div>

      {/* Border */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl border-2 pointer-events-none transition-colors duration-300',
          caught ? 'border-green-500/50' : 'border-[#2a2a4a]'
        )}
      />
    </div>
  )
}
