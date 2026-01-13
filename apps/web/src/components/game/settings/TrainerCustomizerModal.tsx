'use client'

import { useGameStore } from '@/stores/gameStore'
import { TrainerCustomizer } from './TrainerCustomizer'
import type { TrainerCustomization } from '@/lib/sprites/trainerCustomization'
import type { EventCosmetics } from '@/components/game/world/SpriteTrainer'

interface TrainerCustomizerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TrainerCustomizerModal({ isOpen, onClose }: TrainerCustomizerModalProps) {
  const trainerCustomization = useGameStore((state) => state.trainerCustomization)
  const setTrainerCustomization = useGameStore((state) => state.setTrainerCustomization)
  const eventCosmetics = useGameStore((state) => state.eventCosmetics)
  const setEventCosmetics = useGameStore((state) => state.setEventCosmetics)

  if (!isOpen) return null

  const handleSave = (customization: TrainerCustomization, cosmetics: EventCosmetics) => {
    setTrainerCustomization(customization)
    setEventCosmetics(cosmetics)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customizer-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#a0a0c0] hover:text-white hover:border-[#3a3a6a] transition-colors"
          aria-label="Close customizer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <TrainerCustomizer
          initialCustomization={trainerCustomization}
          initialEventCosmetics={eventCosmetics}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

export default TrainerCustomizerModal
