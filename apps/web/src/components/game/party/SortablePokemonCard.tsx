'use client'

import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Pokemon } from '@/types/game'
import { PokemonCard } from '../PokemonCard'
import { cn } from '@/lib/ui/cn'
import { LongPressIndicator } from './LongPressIndicator'

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
    isOver,
  } = useSortable({
    id: pokemon.id,
    disabled,
  })

  // Long-press progress tracking (for visual indicator only)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressStartRef = useRef<number | null>(null)

  // Track long-press progress for visual feedback
  useEffect(() => {
    if (disabled) return

    const handleTouchStart = () => {
      longPressStartRef.current = Date.now()
      // Animate progress over 300ms
      const animate = () => {
        if (!longPressStartRef.current) return
        const elapsed = Date.now() - longPressStartRef.current
        const progress = Math.min(elapsed / 300, 1)
        setLongPressProgress(progress)
        if (progress < 1) {
          longPressTimerRef.current = setTimeout(animate, 16) // ~60fps
        }
      }
      animate()
    }

    const handleTouchEnd = () => {
      longPressStartRef.current = null
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      setLongPressProgress(0)
    }

    const node = document.getElementById(`sortable-card-${pokemon.id}`)
    if (node) {
      node.addEventListener('touchstart', handleTouchStart, { passive: true })
      node.addEventListener('touchend', handleTouchEnd)
      node.addEventListener('touchcancel', handleTouchEnd)
    }

    return () => {
      if (node) {
        node.removeEventListener('touchstart', handleTouchStart)
        node.removeEventListener('touchend', handleTouchEnd)
        node.removeEventListener('touchcancel', handleTouchEnd)
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [pokemon.id, disabled])

  // Reset progress when drag starts
  useEffect(() => {
    if (isDragging) {
      setLongPressProgress(0)
      longPressStartRef.current = null
    }
  }, [isDragging])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift effect when dragging (per CONTEXT.md)
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      id={`sortable-card-${pokemon.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'h-full touch-manipulation select-none relative',
        isDragging && 'opacity-50',
        // Drop zone highlight (per CONTEXT.md)
        isOver && !isDragging && 'ring-2 ring-[#3B4CCA] ring-offset-2 ring-offset-[#0f0f1a] rounded-xl',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      {/* Long-press indicator */}
      <LongPressIndicator
        progress={longPressProgress}
        visible={longPressProgress > 0 && !isDragging}
      />

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
