'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSwappingStrategy,
  arraySwap,
} from '@dnd-kit/sortable'
import type { Pokemon } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { useDragSensors } from './useDragSensors'
import { SortablePokemonCard } from './SortablePokemonCard'
import { PokemonCard, EmptyPokemonSlot } from '../PokemonCard'
import { getStaggerDelayStyle } from '@/lib/ui'
import { cn } from '@/lib/ui/cn'

interface SortablePartyGridProps {
  party: (Pokemon | null)[]
  onPokemonClick: (pokemon: Pokemon) => void
  canRemove: boolean
  onRemove: (partySlot: number) => void
  onUsePotion: (pokemonId: string) => void
  hasPotions: boolean
}

export function SortablePartyGrid({
  party,
  onPokemonClick,
  canRemove,
  onRemove,
  onUsePotion,
  hasPotions,
}: SortablePartyGridProps) {
  const sensors = useDragSensors()
  const currentEncounter = useGameStore((state) => state.currentEncounter)
  const setParty = useGameStore((state) => state.setParty)

  // Local state for active drag (NOT in Zustand - per RESEARCH.md pitfall DD-1)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [previousParty, setPreviousParty] = useState<(Pokemon | null)[] | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Disable drag during battle
  const isDragDisabled = !!currentEncounter

  // Get sortable item IDs (only non-null Pokemon)
  const sortableIds = party
    .filter((p): p is Pokemon => p !== null)
    .map(p => p.id)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setPreviousParty([...party])
  }, [party])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      setPreviousParty(null)
      return
    }

    // Find indices in the party array
    const oldIndex = party.findIndex(p => p?.id === active.id)
    const newIndex = party.findIndex(p => p?.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      setPreviousParty(null)
      return
    }

    // Swap positions (per CONTEXT.md: "dragging to occupied slot: swap positions")
    const newParty = arraySwap([...party], oldIndex, newIndex)

    // Optimistic update
    setParty(newParty.filter((p): p is Pokemon => p !== null))

    // Build order array for server (array of IDs, null for empty)
    const order = newParty.map(p => p?.id ?? null)

    // Send to server
    const sent = gameSocket.reorderParty(order)

    if (!sent && previousParty) {
      // Rollback if not connected (per CONTEXT.md)
      setParty(previousParty.filter((p): p is Pokemon => p !== null))
      setSaveError('Failed to save party order. Please try again.')
      setTimeout(() => setSaveError(null), 4000)
    }

    setPreviousParty(null)
  }, [party, setParty, previousParty])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    if (previousParty) {
      setParty(previousParty.filter((p): p is Pokemon => p !== null))
    }
    setPreviousParty(null)
  }, [previousParty, setParty])

  const activePokemon = activeId
    ? party.find(p => p?.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={sortableIds}
        strategy={rectSwappingStrategy}
      >
        <div
          className={cn(
            "grid grid-cols-2 gap-2 auto-rows-fr relative",
            isDragDisabled && "pointer-events-none"
          )}
          role="list"
          aria-label="Pokemon party"
        >
          {party.map((pokemon, index) =>
            pokemon ? (
              <div
                key={pokemon.id}
                className="animate-slide-up h-full"
                style={getStaggerDelayStyle(index)}
                role="listitem"
              >
                <SortablePokemonCard
                  pokemon={pokemon}
                  onClick={() => onPokemonClick(pokemon)}
                  canRemove={canRemove}
                  onRemove={() => onRemove(pokemon.party_slot!)}
                  onUsePotion={onUsePotion}
                  hasPotions={hasPotions}
                  disabled={isDragDisabled}
                />
              </div>
            ) : (
              <EmptyPokemonSlot key={`empty-${index}`} slot={index + 1} />
            )
          )}

          {/* Battle-disabled overlay */}
          {isDragDisabled && (
            <div
              className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-30"
              aria-label="Party reordering disabled during battle"
            >
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                Reordering disabled during battle
              </span>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Drag overlay - shows lifted card appearance (per CONTEXT.md) */}
      <DragOverlay dropAnimation={{ duration: 100, easing: 'ease-out' }}>
        {activePokemon ? (
          <div className="scale-105 shadow-2xl rounded-xl">
            <PokemonCard
              pokemon={activePokemon}
              showXP
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Error toast for save failures */}
      {saveError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="relative overflow-hidden rounded-xl">
            {/* Background with red gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/80 via-red-600/80 to-red-500/80" />

            {/* Dark inner panel */}
            <div className="relative m-0.5 rounded-[10px] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-pixel text-xs text-red-400 tracking-wider">
                    ERROR
                  </div>
                  <div className="text-white text-sm">
                    {saveError}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
