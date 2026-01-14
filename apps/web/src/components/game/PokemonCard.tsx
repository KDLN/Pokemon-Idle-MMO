'use client'

import { getPokemonSpriteUrl, getXPProgress } from '@/types/game'
import type { Pokemon } from '@/types/game'
import {
  getSpeciesData,
  getTypeBorderClass,
  getTypeGlowClass,
  getHeldItem,
  getTypeColor,
  cn,
} from '@/lib/ui'
import { HPBar, XPBar } from '@/components/ui/ProgressBar'
import { TypeBadge, Badge } from '@/components/ui/Badge'

interface HeldItemSlotProps {
  itemId?: string | null
  size?: 'sm' | 'md'
}

function HeldItemSlot({ itemId, size = 'sm' }: HeldItemSlotProps) {
  const item = getHeldItem(itemId)
  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'

  if (!item) {
    return (
      <div
        className={cn(
          sizeClasses,
          'rounded bg-[#1a1a2e] border border-dashed border-[#2a2a4a]',
          'flex items-center justify-center opacity-40'
        )}
        title="No held item"
      >
        <span className="text-[8px] text-[#606080]">-</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        sizeClasses,
        'rounded bg-[#1a1a2e] border border-[#3a3a6a]',
        'flex items-center justify-center cursor-help',
        'transition-transform hover:scale-110'
      )}
      title={`${item.name}: ${item.description}`}
    >
      <span>{item.icon}</span>
    </div>
  )
}

interface PokemonCardProps {
  pokemon: Pokemon
  showXP?: boolean
  onClick?: () => void
  selected?: boolean
  compact?: boolean
  onRemove?: () => void
  canRemove?: boolean
  onUsePotion?: (pokemonId: string) => void
  hasPotions?: boolean
}

export function PokemonCard({ pokemon, showXP = false, onClick, selected, compact, onRemove, canRemove, onUsePotion, hasPotions }: PokemonCardProps) {
  const xpProgress = getXPProgress(pokemon.xp, pokemon.level)
  const speciesData = getSpeciesData(pokemon.species_id)
  const name = pokemon.nickname || speciesData.name
  const isShiny = pokemon.is_shiny || false
  const heldItem = (pokemon as Pokemon & { held_item?: string }).held_item

  const typeBorderClass = getTypeBorderClass(speciesData.type)
  const typeGlowClass = getTypeGlowClass(speciesData.type)

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-200',
          typeBorderClass,
          selected
            ? 'bg-[#3B4CCA]/20 border-2 border-l-4 border-[#5B6EEA] shadow-lg shadow-[#3B4CCA]/20'
            : 'bg-[#1a1a2e] border-2 border-l-4 border-[#2a2a4a] hover:border-[#3a3a6a] hover:bg-[#252542]',
          isShiny && 'ring-2 ring-yellow-400/50'
        )}
        style={{ borderLeftColor: isShiny ? '#FFD700' : speciesData.color }}
      >
        {/* Shiny indicator */}
        {isShiny && (
          <div className="absolute top-1 right-1 text-yellow-400 animate-pulse">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}

        {/* Held item indicator */}
        {heldItem && (
          <div className="absolute bottom-1 right-1">
            <HeldItemSlot itemId={heldItem} size="sm" />
          </div>
        )}

        {/* Sprite */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
          <div
            className={cn('absolute inset-0 rounded-lg opacity-30', isShiny && 'animate-shimmer')}
            style={{ backgroundColor: isShiny ? '#FFD700' : speciesData.color }}
          />
          <img
            src={getPokemonSpriteUrl(pokemon.species_id, isShiny)}
            alt={name}
            className="w-full h-full pixelated relative z-10 group-hover:scale-110 transition-transform"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
            <span className={cn(
              'text-xs sm:text-sm font-semibold truncate',
              isShiny ? 'text-yellow-300' : 'text-white'
            )}>
              {name}
            </span>
            <TypeBadge type={speciesData.type} size="sm" />
          </div>
          <div className="text-[10px] sm:text-xs text-[#a0a0c0]">Lv. {pokemon.level}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      role="article"
      aria-label={`${name}, level ${pokemon.level}${isShiny ? ', shiny' : ''}`}
      className={cn(
        'group relative rounded-xl overflow-hidden transition-all duration-300 h-full',
        typeBorderClass,
        onClick && 'cursor-pointer',
        selected && cn('ring-2 ring-[#5B6EEA] ring-offset-2 ring-offset-[#0f0f1a] scale-[1.02]', typeGlowClass),
        !selected && 'hover:scale-[1.02]',
        isShiny && 'ring-2 ring-yellow-400/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA] focus-visible:ring-offset-2'
      )}
      style={{ borderLeftColor: isShiny ? '#FFD700' : speciesData.color }}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Remove button */}
      {onRemove && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove from party"
          aria-label={`Remove ${name} from party`}
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Potion button - shown when Pokemon needs healing and player has potions */}
      {onUsePotion && hasPotions && pokemon.current_hp < pokemon.max_hp && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUsePotion(pokemon.id)
          }}
          className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/90 hover:bg-purple-500 text-white flex items-center justify-center transition-all hover:scale-110"
          title="Use Potion"
          aria-label={`Use potion on ${name}`}
        >
          <span className="text-sm">💜</span>
        </button>
      )}

      {/* Shiny sparkle effect */}
      {isShiny && (
        <>
          <div className={cn(
            "absolute z-20 text-yellow-400 animate-pulse",
            onRemove && canRemove ? "top-7 right-1.5 sm:top-8 sm:right-2" : "top-1.5 right-1.5 sm:top-2 sm:right-2"
          )}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/5 animate-shimmer" />
        </>
      )}

      {/* Card background with type color accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
      <div
        className="absolute top-0 left-0 right-0 h-16 sm:h-24 opacity-20"
        style={{
          background: `linear-gradient(180deg, ${isShiny ? '#FFD700' : speciesData.color} 0%, transparent 100%)`
        }}
      />

      {/* Content */}
      <div className="relative p-2 sm:p-3">
        {/* Header with type badges */}
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1 flex-wrap">
            <TypeBadge type={speciesData.type} size="sm" />
            {speciesData.type2 && (
              <TypeBadge type={speciesData.type2} size="sm" />
            )}
            {isShiny && (
              <Badge variant="shiny" size="sm">SHINY</Badge>
            )}
          </div>
          <span className="font-pixel text-[8px] sm:text-[10px] text-[#606080]">
            Lv.{pokemon.level}
          </span>
        </div>

        {/* Pokemon Sprite */}
        <div className="relative flex justify-center mb-2 sm:mb-3">
          <div className="relative">
            {/* Glow effect */}
            <div
              className={cn('absolute inset-0 blur-xl opacity-30 scale-75', isShiny && 'animate-pulse')}
              style={{ backgroundColor: isShiny ? '#FFD700' : speciesData.color }}
            />
            <img
              src={getPokemonSpriteUrl(pokemon.species_id, isShiny)}
              alt={name}
              className="w-14 h-14 sm:w-20 sm:h-20 pixelated relative z-10 group-hover:animate-bounce-gentle"
            />
          </div>
        </div>

        {/* Name and Held Item Row */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className={cn(
            'font-semibold text-xs sm:text-sm truncate',
            isShiny ? 'text-yellow-300' : 'text-white'
          )}>
            {name}
          </div>
          <HeldItemSlot itemId={heldItem} size="md" />
        </div>

        {/* HP Bar */}
        <div className="mb-1.5 sm:mb-2">
          <HPBar
            current={pokemon.current_hp}
            max={pokemon.max_hp}
            size="sm"
            showLabel
          />
        </div>

        {/* XP Bar */}
        {showXP && (
          <XPBar
            current={xpProgress.current}
            needed={xpProgress.needed}
            size="sm"
            showLabel
          />
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Border */}
      <div
        className="absolute inset-0 rounded-xl border-2 border-l-4 border-[#2a2a4a] group-hover:border-[#3a3a6a] transition-colors pointer-events-none"
        style={{ borderLeftColor: isShiny ? '#FFD700' : speciesData.color }}
      />
    </div>
  )
}

export function EmptyPokemonSlot({ slot, onClick }: { slot: number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      role="listitem"
      aria-label={`Empty party slot ${slot}${onClick ? ', click to add Pokemon' : ''}`}
      className={cn(
        'relative rounded-xl overflow-hidden min-h-[120px] sm:min-h-[180px] h-full',
        'flex flex-col items-center justify-center gap-1.5 sm:gap-2',
        'bg-[#1a1a2e]/50 border-2 border-dashed border-[#2a2a4a]',
        onClick && 'cursor-pointer hover:border-[#3a3a6a] hover:bg-[#1a1a2e]',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA] focus-visible:ring-offset-2'
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Pokeball outline */}
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-[#2a2a4a] flex items-center justify-center opacity-30" aria-hidden="true">
        <div className="w-full h-0.5 bg-[#2a2a4a]" />
      </div>
      <span className="text-[#606080] text-[10px] sm:text-xs">Slot {slot}</span>
    </div>
  )
}
