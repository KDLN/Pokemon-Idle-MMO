'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn } from '@/lib/ui'

export function EncounterDisplay() {
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const clearEncounter = useGameStore((state) => state.clearEncounter)
  const currentZone = useGameStore((state) => state.currentZone)
  const [showResult, setShowResult] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'appear' | 'result' | 'fade'>('appear')

  useEffect(() => {
    if (currentEncounter) {
      setShowResult(true)
      setAnimationPhase('appear')

      const appearTimer = setTimeout(() => {
        setAnimationPhase('result')
      }, 600)

      const resultTimer = setTimeout(() => {
        setAnimationPhase('fade')
      }, 3000)

      const clearTimer = setTimeout(() => {
        setShowResult(false)
        clearEncounter()
      }, 3500)

      return () => {
        clearTimeout(appearTimer)
        clearTimeout(resultTimer)
        clearTimeout(clearTimer)
      }
    }
  }, [currentEncounter, clearEncounter])

  const isRoute = currentZone?.zone_type === 'route'

  // Idle state when no encounter
  if (!showResult || !currentEncounter) {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[280px]">
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
        <div className="relative flex flex-col items-center justify-center h-full min-h-[280px] p-6">
          {isRoute ? (
            <>
              {/* Pokeball waiting indicator */}
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515]/20 to-transparent animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden opacity-60">
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0]" />
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1a2e] -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#f0f0f0] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a2e]" />
                </div>
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

  const wild = currentEncounter.wild_pokemon
  const speciesData = getSpeciesData(wild.species_id)
  const speciesName = wild.species?.name || speciesData.name
  const caught = currentEncounter.catch_result?.success
  const brokeOut = currentEncounter.catch_result && !currentEncounter.catch_result.success
  const isShiny = wild.is_shiny || false

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden min-h-[280px]
        transition-all duration-500
        ${animationPhase === 'fade' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${isShiny ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {/* Background with type color glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at center, ${isShiny ? '#FFD700' : speciesData.color} 0%, transparent 70%)`
        }}
      />

      {/* Shiny indicator banner */}
      {isShiny && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 py-1.5 animate-shimmer">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-pixel text-[10px] text-black tracking-widest">SHINY POKEMON!</span>
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      )}

      {/* Battle scene decorations */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-900/30 to-transparent" />

      {/* Sparkles for catch success or shiny */}
      {(caught || isShiny) && animationPhase === 'result' && (
        <>
          <div className="absolute top-1/4 left-1/4 w-3 h-3 text-yellow-400 animate-sparkle">✦</div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 text-yellow-300 animate-sparkle delay-200">✦</div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 text-yellow-400 animate-sparkle delay-500">✦</div>
          <div className="absolute top-1/2 right-1/3 w-3 h-3 text-yellow-300 animate-sparkle delay-300">✦</div>
        </>
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full min-h-[280px] p-6">
        {/* Wild Pokemon */}
        <div
          className={`
            transform transition-all duration-500
            ${animationPhase === 'appear' ? 'animate-wild-appear' : ''}
            ${caught && animationPhase === 'result' ? 'animate-catch-success' : ''}
          `}
        >
          {/* Type glow behind sprite */}
          <div className="relative">
            <div
              className={`absolute inset-0 blur-2xl opacity-40 scale-75 ${isShiny ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isShiny ? '#FFD700' : speciesData.color }}
            />
            <img
              src={getPokemonSpriteUrl(wild.species_id, isShiny)}
              alt={speciesName}
              className={`
                w-28 h-28 mx-auto pixelated relative z-10
                ${animationPhase === 'result' && !caught ? 'animate-float' : ''}
              `}
            />
          </div>

          {/* Name and level */}
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="type-badge text-white text-[10px]"
                style={{ backgroundColor: speciesData.color }}
              >
                {speciesData.type}
              </span>
              {isShiny && (
                <span className="type-badge bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-[9px] font-bold">
                  SHINY
                </span>
              )}
              <span className="text-xs text-[#606080]">Lv.{wild.level}</span>
            </div>
            <div className={`font-pixel text-sm tracking-wider ${isShiny ? 'text-yellow-300' : 'text-white'}`}>
              Wild {speciesName.toUpperCase()}!
            </div>
          </div>
        </div>

        {/* Type Effectiveness Message */}
        {animationPhase === 'result' && currentEncounter.effectiveness_text && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 animate-slide-up z-20">
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

        {/* Battle Result */}
        {animationPhase !== 'appear' && (
          <div className="mt-5 animate-slide-up">
            {currentEncounter.battle_result === 'win' && (
              <>
                {caught ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40">
                      <div className="w-6 h-6 relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EE1515] to-[#CC0000] overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#f0f0f0]" />
                          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#333] -translate-y-1/2" />
                        </div>
                      </div>
                      <span className="font-pixel text-xs text-green-400 tracking-wider">
                        GOTCHA!
                      </span>
                    </div>
                    <div className="text-sm text-[#a0a0c0] mt-2">
                      {speciesName} was caught!{isShiny && ' ✨'}
                    </div>
                  </div>
                ) : brokeOut ? (
                  <div className="flex flex-col items-center">
                    <div className="px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/40">
                      <span className="font-pixel text-xs text-yellow-400 tracking-wider">
                        BROKE FREE!
                      </span>
                    </div>
                    <div className="text-sm text-[#a0a0c0] mt-2">
                      {speciesName} escaped the Pokeball!
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="px-4 py-2 rounded-full bg-[#3B4CCA]/20 border border-[#3B4CCA]/40">
                      <span className="font-pixel text-xs text-[#5B6EEA] tracking-wider">
                        VICTORY!
                      </span>
                    </div>
                    <div className="text-sm text-[#a0a0c0] mt-2">
                      Defeated wild {speciesName}!
                    </div>
                  </div>
                )}
              </>
            )}

            {currentEncounter.battle_result === 'fled' && (
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-[#606080]/20 border border-[#606080]/40">
                  <span className="font-pixel text-xs text-[#a0a0c0] tracking-wider">
                    ESCAPED
                  </span>
                </div>
                <div className="text-sm text-[#606080] mt-2">
                  Got away safely...
                </div>
              </div>
            )}

            {currentEncounter.battle_result === 'lose' && (
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-[#EE1515]/20 border border-[#EE1515]/40">
                  <span className="font-pixel text-xs text-[#EE1515] tracking-wider">
                    FLED!
                  </span>
                </div>
                <div className="text-sm text-[#a0a0c0] mt-2">
                  Wild {speciesName} got away!
                </div>
              </div>
            )}

            {currentEncounter.battle_result === 'wipe' && (
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-[#EE1515]/30 border border-[#EE1515]/50">
                  <span className="font-pixel text-xs text-[#EE1515] tracking-wider">
                    BLACKOUT!
                  </span>
                </div>
                <div className="text-sm text-[#EE1515]/80 mt-2">
                  Your team fainted! Returning to town...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Border */}
      <div
        className={`
          absolute inset-0 rounded-2xl border-2 pointer-events-none transition-colors duration-300
          ${caught ? 'border-green-500/50' : 'border-[#2a2a4a]'}
        `}
      />
    </div>
  )
}
