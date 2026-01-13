'use client'

import { useState, useCallback } from 'react'
import {
  type TrainerCustomization,
  DEFAULT_TRAINER_CUSTOMIZATION,
} from '@/lib/sprites/trainerCustomization'
import { SpriteTrainer, type EventCosmetics } from '@/components/game/world/SpriteTrainer'
import { RARITY_COLORS } from '@/lib/sprites/spriteCatalog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/ui'

interface TrainerCustomizerProps {
  initialCustomization?: TrainerCustomization
  initialEventCosmetics?: EventCosmetics
  onSave?: (customization: TrainerCustomization, eventCosmetics: EventCosmetics) => void
  onCancel?: () => void
}

type CategoryType = 'effects' | 'pets' | 'items'

const CATEGORIES: { id: CategoryType; label: string; icon: string }[] = [
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'pets', label: 'Pets', icon: '🐾' },
  { id: 'items', label: 'Items', icon: '🎒' },
]

// Event cosmetics options
const EFFECT_OPTIONS = [
  { id: undefined, name: 'None', rarity: 'common' as const },
  { id: 'aura_fire' as const, name: 'Blazing Aura', rarity: 'event' as const },
  { id: 'aura_ice' as const, name: 'Frost Aura', rarity: 'event' as const },
  { id: 'sparkles' as const, name: 'Sparkle Effect', rarity: 'legendary' as const },
  { id: 'shadow_trail' as const, name: 'Shadow Trail', rarity: 'epic' as const },
  { id: 'lightning' as const, name: 'Static Discharge', rarity: 'event' as const },
]

const PET_OPTIONS = [
  { id: undefined, name: 'None', rarity: 'common' as const },
  { id: 'pichu' as const, name: 'Pichu Companion', rarity: 'event' as const },
  { id: 'eevee' as const, name: 'Eevee Companion', rarity: 'legendary' as const },
  { id: 'ditto' as const, name: 'Ditto Blob', rarity: 'epic' as const },
]

const HELD_ITEM_OPTIONS = [
  { id: undefined, name: 'None', rarity: 'common' as const },
  { id: 'pokeball' as const, name: 'Pokeball', rarity: 'common' as const },
  { id: 'greatball' as const, name: 'Great Ball', rarity: 'uncommon' as const },
  { id: 'masterball' as const, name: 'Master Ball', rarity: 'legendary' as const },
  { id: 'fishing_rod' as const, name: 'Fishing Rod', rarity: 'uncommon' as const },
]

export function TrainerCustomizer({
  initialCustomization = DEFAULT_TRAINER_CUSTOMIZATION,
  initialEventCosmetics = {},
  onSave,
  onCancel,
}: TrainerCustomizerProps) {
  const [customization] = useState<TrainerCustomization>(initialCustomization)
  const [eventCosmetics, setEventCosmetics] = useState<EventCosmetics>(initialEventCosmetics)
  const [activeCategory, setActiveCategory] = useState<CategoryType>('effects')
  const [isWalking, setIsWalking] = useState(true)

  const updateEventCosmetic = useCallback(<K extends keyof EventCosmetics>(
    key: K,
    value: EventCosmetics[K]
  ) => {
    setEventCosmetics((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRandomize = useCallback(() => {
    // Random event cosmetics
    const randomEffect = EFFECT_OPTIONS[Math.floor(Math.random() * EFFECT_OPTIONS.length)]
    const randomPet = PET_OPTIONS[Math.floor(Math.random() * PET_OPTIONS.length)]
    const randomItem = HELD_ITEM_OPTIONS[Math.floor(Math.random() * HELD_ITEM_OPTIONS.length)]
    setEventCosmetics({
      effect: randomEffect.id,
      pet: randomPet.id,
      heldItem: randomItem.id,
    })
  }, [])

  const handleReset = useCallback(() => {
    setEventCosmetics({})
  }, [])

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'effects':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Special Effects</h3>
            <p className="text-xs text-[#606080]">Show off event rewards and rare effects!</p>
            <div className="flex flex-wrap gap-2">
              {EFFECT_OPTIONS.map((option) => (
                <button
                  key={option.id ?? 'none'}
                  onClick={() => updateEventCosmetic('effect', option.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200',
                    'border hover:scale-105',
                    eventCosmetics.effect === option.id
                      ? 'bg-[#3B4CCA] border-[#5B6EEA] text-white'
                      : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#a0a0c0] hover:border-[#3a3a6a] hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA]'
                  )}
                  aria-pressed={eventCosmetics.effect === option.id}
                >
                  <span className="flex items-center gap-2">
                    {option.name}
                    {option.rarity !== 'common' && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] uppercase font-bold',
                        RARITY_COLORS[option.rarity].bg,
                        RARITY_COLORS[option.rarity].text
                      )}>
                        {option.rarity}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'pets':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Following Pet</h3>
            <p className="text-xs text-[#606080]">A companion that follows you around!</p>
            <div className="flex flex-wrap gap-2">
              {PET_OPTIONS.map((option) => (
                <button
                  key={option.id ?? 'none'}
                  onClick={() => updateEventCosmetic('pet', option.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200',
                    'border hover:scale-105',
                    eventCosmetics.pet === option.id
                      ? 'bg-[#3B4CCA] border-[#5B6EEA] text-white'
                      : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#a0a0c0] hover:border-[#3a3a6a] hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA]'
                  )}
                  aria-pressed={eventCosmetics.pet === option.id}
                >
                  <span className="flex items-center gap-2">
                    {option.name}
                    {option.rarity !== 'common' && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] uppercase font-bold',
                        RARITY_COLORS[option.rarity].bg,
                        RARITY_COLORS[option.rarity].text
                      )}>
                        {option.rarity}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'items':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Held Item</h3>
            <p className="text-xs text-[#606080]">Visible items your trainer holds!</p>
            <div className="flex flex-wrap gap-2">
              {HELD_ITEM_OPTIONS.map((option) => (
                <button
                  key={option.id ?? 'none'}
                  onClick={() => updateEventCosmetic('heldItem', option.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200',
                    'border hover:scale-105',
                    eventCosmetics.heldItem === option.id
                      ? 'bg-[#3B4CCA] border-[#5B6EEA] text-white'
                      : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#a0a0c0] hover:border-[#3a3a6a] hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA]'
                  )}
                  aria-pressed={eventCosmetics.heldItem === option.id}
                >
                  <span className="flex items-center gap-2">
                    {option.name}
                    {option.rarity !== 'common' && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] uppercase font-bold',
                        RARITY_COLORS[option.rarity].bg,
                        RARITY_COLORS[option.rarity].text
                      )}>
                        {option.rarity}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card variant="default" padding="none" className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a4a]">
        <h2 className="font-pixel text-sm sm:text-base text-white tracking-wider">
          CUSTOMIZE TRAINER
        </h2>
        <p className="text-xs text-[#606080] mt-1">
          Add effects, pets, and items to your trainer
        </p>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Preview Panel */}
        <div className="p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-[#2a2a4a] flex flex-col items-center">
          {/* Trainer Preview */}
          <div
            className="relative w-40 h-48 sm:w-48 sm:h-56 rounded-xl overflow-hidden mb-4"
            style={{
              background: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)',
            }}
          >
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#228B22] to-[#32CD32]" />

            {/* Trainer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <SpriteTrainer
                direction="right"
                isWalking={isWalking}
                scale={4}
                eventCosmetics={eventCosmetics}
              />
            </div>
          </div>

          {/* Animation toggle */}
          <button
            onClick={() => setIsWalking(!isWalking)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all',
              'border',
              isWalking
                ? 'bg-[#3B4CCA]/20 border-[#5B6EEA] text-[#5B6EEA]'
                : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#a0a0c0]'
            )}
          >
            {isWalking ? '⏸ Pause' : '▶ Walk'}
          </button>

          {/* Quick actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={handleRandomize}>
              🎲 Random
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              ↺ Reset
            </Button>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-6">
            {CATEGORIES.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all',
                  'flex items-center gap-1 sm:gap-2',
                  activeCategory === id
                    ? 'bg-[#3B4CCA] text-white'
                    : 'bg-[#1a1a2e] text-[#a0a0c0] hover:bg-[#252542] hover:text-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6EEA]'
                )}
                aria-pressed={activeCategory === id}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Category Content */}
          <div className="min-h-[200px]">{renderCategoryContent()}</div>
        </div>
      </div>

      {/* Footer Actions */}
      {(onSave || onCancel) && (
        <div className="p-4 border-t border-[#2a2a4a] flex justify-end gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button variant="primary" onClick={() => onSave(customization, eventCosmetics)}>
              Save Changes
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default TrainerCustomizer
