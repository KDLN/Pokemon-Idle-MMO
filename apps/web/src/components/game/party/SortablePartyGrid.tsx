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
      // Rollback if not connected
      setParty(previousParty.filter((p): p is Pokemon => p !== null))
      // TODO: Show toast in Plan 03
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
          className="grid grid-cols-2 gap-2 auto-rows-fr"
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
    </DndContext>
  )
}
