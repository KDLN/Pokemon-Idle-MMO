'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Pokemon } from '@/types/game'
import { PokemonCard } from '../PokemonCard'
import { cn } from '@/lib/ui/cn'

interface SortablePokemonCardProps {
  pokemon: Pokemon
  onRemove?: () => void
  canRemove?: boolean
  onUsePotion?: (pokemonId: string) => void
  hasPotions?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function SortablePokemonCard({
  pokemon,
  onRemove,
  canRemove,
  onUsePotion,
  hasPotions,
  onClick,
  disabled = false,
}: SortablePokemonCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: pokemon.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift effect when dragging (per CONTEXT.md)
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'h-full touch-manipulation select-none',
        isDragging && 'opacity-50 scale-105',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      <PokemonCard
        pokemon={pokemon}
        showXP
        onClick={disabled ? undefined : onClick}
        canRemove={canRemove}
        onRemove={onRemove}
        onUsePotion={onUsePotion}
        hasPotions={hasPotions}
      />
    </div>
  )
}
