'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { BackgroundLayer } from './BackgroundLayer'
import { TimeOfDayOverlay } from './TimeOfDayOverlay'
import { SpriteTrainer } from './SpriteTrainer'
import { PokemonCompanion } from './PokemonCompanion'
import { getTimeOfDay, formatGameTime, type TimeOfDay } from '@/lib/time/timeOfDay'

interface WorldViewProps {
  className?: string
}

export function WorldView({ className = '' }: WorldViewProps) {
  const currentZone = useGameStore((state) => state.currentZone)
  const party = useGameStore((state) => state.party)
  const isConnected = useGameStore((state) => state.isConnected)
  const trainerCustomization = useGameStore((state) => state.trainerCustomization)
  const eventCosmetics = useGameStore((state) => state.eventCosmetics)

  const [walkDirection, setWalkDirection] = useState<'left' | 'right'>('right')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')
  const [gameTime, setGameTime] = useState('')
  const [trainerPosition, setTrainerPosition] = useState(50) // Position percentage

  // Derived state - determine visual zone type
  const getVisualZoneType = (): 'town' | 'route' | 'forest' => {
    if (!currentZone) return 'route'
    if (currentZone.zone_type === 'town') return 'town'
    // Special visual for forest zones
    if (currentZone.name.toLowerCase().includes('forest')) return 'forest'
    return 'route'
  }
  const zoneType = getVisualZoneType()
  const isRoute = zoneType === 'route' || zoneType === 'forest'
  const isWalking = isConnected && isRoute

  // Get lead Pokemon
  const leadPokemon = useMemo(() => {
    return party.find((p) => p !== null)
  }, [party])

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      setTimeOfDay(getTimeOfDay())
      setGameTime(formatGameTime())
    }

    updateTime()
    const interval = setInterval(updateTime, 30000)
    return () => clearInterval(interval)
  }, [])

  // Walk animation with position tracking
  useEffect(() => {
    if (!isWalking) return

    const speed = 0.4
    const interval = setInterval(() => {
      setTrainerPosition((prev) => {
        const newPos = prev + (walkDirection === 'right' ? speed : -speed)

        // Bounce at edges and change direction
        if (newPos >= 80) {
          setWalkDirection('left')
          return 80
        } else if (newPos <= 20) {
          setWalkDirection('right')
          return 20
        }

        return newPos
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isWalking, walkDirection])

  return (
    <div
      className={`relative w-full h-48 md:h-56 rounded-xl overflow-hidden poke-border ${className}`}
    >
      {/* Background layer */}
      <BackgroundLayer
        zoneType={zoneType}
        zoneName={currentZone?.name}
        isAnimated={isWalking}
      />

      {/* Time of day overlay */}
      <TimeOfDayOverlay />

      {/* Trainer and Pokemon */}
      <div className="absolute inset-0">
        {isWalking && (
          <>
            {/* Sprite-based trainer with cosmetic overlays */}
            <div
              className="absolute bottom-8"
              style={{
                left: `${trainerPosition}%`,
                transform: `translateX(-50%) scaleX(${walkDirection === 'left' ? -1 : 1})`,
                transition: 'left 0.05s linear',
              }}
            >
              <SpriteTrainer
                direction={walkDirection}
                isWalking={isWalking}
                scale={3}
                eventCosmetics={eventCosmetics}
              />
            </div>
            {leadPokemon && (
              <PokemonCompanion
                speciesId={leadPokemon.species_id}
                isShiny={leadPokemon.is_shiny}
                direction={walkDirection}
                isWalking={isWalking}
                offsetX={walkDirection === 'right' ? -70 : 70}
              />
            )}
          </>
        )}

        {/* Town idle state */}
        {zoneType === 'town' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-4">
            <SpriteTrainer
              direction="down"
              isWalking={false}
              scale={3}
              eventCosmetics={eventCosmetics}
            />
            {leadPokemon && (
              <PokemonCompanion
                speciesId={leadPokemon.species_id}
                isShiny={leadPokemon.is_shiny}
                direction="left"
                isWalking={false}
                offsetX={50}
              />
            )}
          </div>
        )}
      </div>

      {/* Ambient particles - only on routes/forests */}
      {isRoute && (
        <>
          <div className="absolute top-6 left-8 w-1 h-1 rounded-full bg-green-300/50 animate-pulse" aria-hidden="true" />
          <div className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-yellow-300/40 animate-pulse" aria-hidden="true" />
          <div className="absolute bottom-16 left-16 w-1 h-1 rounded-full bg-green-400/50 animate-pulse" aria-hidden="true" />
          <div className="absolute top-20 left-1/4 w-1 h-1 rounded-full bg-emerald-300/40 animate-pulse" aria-hidden="true" />
          <div className="absolute bottom-12 right-1/4 w-1.5 h-1.5 rounded-full bg-lime-300/30 animate-pulse" aria-hidden="true" />
        </>
      )}

      {/* Status overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
        {/* Zone info */}
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-sm">
          <div className="text-white font-medium">{currentZone?.name}</div>
          {isRoute && currentZone && 'level_range' in currentZone && (
            <div className="text-gray-300 text-xs">
              Lv. {(currentZone as { level_range?: { min: number; max: number } }).level_range?.min}-
              {(currentZone as { level_range?: { min: number; max: number } }).level_range?.max}
            </div>
          )}
        </div>

        {/* Time display */}
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white">
          {gameTime}
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">🔌</div>
            <div>Reconnecting...</div>
          </div>
        </div>
      )}
    </div>
  )
}
