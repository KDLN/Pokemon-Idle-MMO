'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { getPokemonSpriteUrl } from '@/types/game'
import { getSpeciesData, cn } from '@/lib/ui'

type EvolutionPhase =
  | 'intro'           // "What? [Pokemon] is evolving!"
  | 'glowing'         // Original sprite glowing/pulsing
  | 'transforming'    // White silhouette morphing
  | 'reveal'          // New form revealed
  | 'congratulations' // "Congratulations! Your [Pokemon] evolved into [NewPokemon]!"

export function EvolutionModal() {
  const activeEvolution = useGameStore((state) => state.activeEvolution)
  const setActiveEvolution = useGameStore((state) => state.setActiveEvolution)
  const completeEvolutionAndAdvance = useGameStore((state) => state.completeEvolutionAndAdvance)

  const [phase, setPhase] = useState<EvolutionPhase>('intro')
  const [canCancel, setCanCancel] = useState(true)

  // Memoize sparkle positions to avoid layout thrashing on re-renders
  const sparklePositions = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      left: `${15 + Math.random() * 70}%`,
      top: `${15 + Math.random() * 70}%`,
      animationDelay: `${i * 0.15}s`,
      animationDuration: `${1 + Math.random() * 0.5}s`
    })), [activeEvolution?.pokemon_id] // Regenerate when new evolution starts
  )

  // Reset phase when new evolution starts
  useEffect(() => {
    if (activeEvolution) {
      setPhase('intro')
      setCanCancel(true)
    }
  }, [activeEvolution?.pokemon_id])

  // Progress through phases automatically
  useEffect(() => {
    if (!activeEvolution) return

    let timer: NodeJS.Timeout

    if (phase === 'intro') {
      timer = setTimeout(() => setPhase('glowing'), 2000)
    } else if (phase === 'glowing') {
      timer = setTimeout(() => {
        setCanCancel(false) // Can't cancel once transformation starts
        setPhase('transforming')
      }, 3000)
    } else if (phase === 'transforming') {
      timer = setTimeout(() => setPhase('reveal'), 2000)
    } else if (phase === 'reveal') {
      timer = setTimeout(() => setPhase('congratulations'), 1500)
    }

    return () => clearTimeout(timer)
  }, [phase, activeEvolution])

  const handleConfirm = useCallback(() => {
    if (!activeEvolution) return
    // Send confirm to server - server will execute evolution and send back result
    gameSocket.confirmEvolution(activeEvolution.pokemon_id)
  }, [activeEvolution])

  const handleCancel = useCallback(() => {
    if (!activeEvolution || !canCancel) return
    // Send cancel to server - server will acknowledge with evolution_cancelled
    // which triggers removeEvolution and processNextEvolution in the handler
    gameSocket.cancelEvolution(activeEvolution.pokemon_id)
    // Clear active evolution immediately for responsive UI, but don't process next
    // (server acknowledgement handler will process the queue to avoid double-advance)
    setActiveEvolution(null)
  }, [activeEvolution, canCancel, setActiveEvolution])

  const handleContinue = useCallback(() => {
    if (!activeEvolution) return
    // Evolution already completed on server, just close modal and process next
    // Using atomic action to avoid race conditions
    completeEvolutionAndAdvance(activeEvolution.pokemon_id)
  }, [activeEvolution, completeEvolutionAndAdvance])

  // Keyboard handler for B button to cancel
  useEffect(() => {
    if (!activeEvolution || !canCancel) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeEvolution, canCancel, handleCancel])

  if (!activeEvolution) return null

  const oldSpecies = getSpeciesData(activeEvolution.current_species_id)
  const newSpecies = getSpeciesData(activeEvolution.evolution_species_id)

  // Safety check for missing species data
  if (!oldSpecies || !newSpecies) {
    console.error('Missing species data for evolution:', {
      current: activeEvolution.current_species_id,
      target: activeEvolution.evolution_species_id
    })
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/90 z-50 animate-fade-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-[#2a2a4a] overflow-hidden animate-scale-in">
          {/* Animation area */}
          <div className="relative h-64 flex items-center justify-center bg-gradient-to-b from-[#2a2a4a]/50 to-transparent overflow-hidden">
            {/* Sparkle effects during glowing and transforming phases */}
            {(phase === 'glowing' || phase === 'transforming') && (
              <div className="absolute inset-0 pointer-events-none">
                {sparklePositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white rounded-full animate-sparkle"
                    style={pos}
                  />
                ))}
              </div>
            )}

            {/* Glow background effect */}
            {(phase === 'glowing' || phase === 'transforming') && (
              <div
                className="absolute inset-0 animate-pulse-glow"
                style={{
                  background: `radial-gradient(circle at center, ${oldSpecies.color}40 0%, transparent 70%)`
                }}
              />
            )}

            {/* Original sprite (shown in intro, glowing, transforming phases) */}
            <img
              src={getPokemonSpriteUrl(activeEvolution.current_species_id, false)}
              alt={activeEvolution.pokemon_name}
              className={cn(
                'w-32 h-32 pixelated transition-all duration-1000 relative z-10',
                phase === 'intro' && 'animate-pokemon-bounce',
                phase === 'glowing' && 'animate-evolution-glow',
                phase === 'transforming' && 'animate-evolution-white-out',
                (phase === 'reveal' || phase === 'congratulations') && 'hidden'
              )}
            />

            {/* Evolved sprite (shown in reveal and congratulations phases) */}
            {(phase === 'reveal' || phase === 'congratulations') && (
              <img
                src={getPokemonSpriteUrl(activeEvolution.evolution_species_id, false)}
                alt={activeEvolution.evolution_species_name}
                className="w-32 h-32 pixelated animate-evolution-reveal relative z-10"
              />
            )}

            {/* New form glow effect */}
            {(phase === 'reveal' || phase === 'congratulations') && (
              <div
                className="absolute inset-0 animate-fade-in"
                style={{
                  background: `radial-gradient(circle at center, ${newSpecies.color}30 0%, transparent 70%)`
                }}
              />
            )}
          </div>

          {/* Text area */}
          <div className="p-6 min-h-[80px]">
            <p className="text-center text-white font-medium text-lg leading-relaxed">
              {phase === 'intro' && (
                <>What? <span className="text-[#5B6EEA]">{activeEvolution.pokemon_name}</span> is evolving!</>
              )}
              {(phase === 'glowing' || phase === 'transforming') && (
                <span className="animate-pulse">...</span>
              )}
              {(phase === 'reveal' || phase === 'congratulations') && (
                <>
                  Congratulations!<br />
                  Your <span className="text-[#5B6EEA]">{activeEvolution.pokemon_name}</span> evolved into{' '}
                  <span className="text-[#FFD700]">{activeEvolution.evolution_species_name}</span>!
                </>
              )}
            </p>
          </div>

          {/* Buttons */}
          <div className="p-4 border-t border-[#2a2a4a] flex justify-center gap-3">
            {/* Cancel button - only during intro and glowing phases */}
            {canCancel && phase !== 'congratulations' && (
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] text-[#a0a0c0] hover:border-red-500/50 hover:text-red-400 transition-colors"
              >
                Cancel (B)
              </button>
            )}

            {/* Confirm button - during intro phase */}
            {phase === 'intro' && (
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#5B6EEA] to-[#3B4CCA] text-white font-medium shadow-lg shadow-[#3B4CCA]/30 hover:from-[#6B7EFA] hover:to-[#4B5CDA] transition-all"
              >
                Continue
              </button>
            )}

            {/* Continue button - after evolution complete */}
            {phase === 'congratulations' && (
              <button
                onClick={handleContinue}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-b from-green-500 to-green-600 text-white font-medium shadow-lg shadow-green-500/30 hover:from-green-400 hover:to-green-500 transition-all"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
