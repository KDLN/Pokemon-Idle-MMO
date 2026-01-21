'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getTownActions, type TownAction } from '@/lib/zones/townActions'
import { gameSocket } from '@/lib/ws/gameSocket'
import { BeveledButton } from '@/components/ui/Button'

interface TownMenuProps {
  onAction?: (action: string) => void
}

function TownMenuButton({
  action,
  onClick,
}: {
  action: TownAction
  onClick: () => void
}) {
  const isLocked = action.locked

  // Determine button color based on action type
  const getButtonColor = (): { hue: number; saturation: number; lightness: number } => {
    switch (action.action) {
      case 'shop':
        return { hue: 120, saturation: 60, lightness: 40 } // Green - commerce/positive
      case 'gym':
        return { hue: 0, saturation: 70, lightness: 45 } // Red - combat/challenging
      case 'pokecenter':
        return { hue: 200, saturation: 60, lightness: 45 } // Blue - healing/utility
      case 'museum':
      case 'daycare':
      default:
        return { hue: 220, saturation: 60, lightness: 45 } // Blue - neutral/informational
    }
  }

  const { hue, saturation, lightness } = getButtonColor()

  if (isLocked) {
    // Locked state - use muted button with dashed border
    return (
      <button
        onClick={onClick}
        disabled={true}
        className="group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1a1a2e]/50 border border-dashed border-[#2a2a4a] cursor-not-allowed opacity-60 transition-all duration-200"
        title={action.lockReason}
      >
        {/* Icon */}
        <div className="text-3xl">{action.icon}</div>

        {/* Label */}
        <div className="text-center">
          <div className="text-sm font-medium text-[#606080]">{action.label}</div>
          {action.description && (
            <div className="text-[10px] text-[#606080] mt-0.5 max-w-[80px] truncate">
              {action.description}
            </div>
          )}
        </div>

        {/* Lock indicator */}
        <div className="absolute top-2 right-2 text-sm">🔒</div>
      </button>
    )
  }

  return (
    <BeveledButton
      onClick={onClick}
      hue={hue}
      saturation={saturation}
      lightness={lightness}
      className="w-full"
      title={action.description}
    >
      <div className="flex flex-col items-center gap-1 py-0.5">
        {/* Icon */}
        <div className="text-2xl">{action.icon}</div>
        {/* Label */}
        <div className="text-xs font-medium">{action.label}</div>
      </div>
    </BeveledButton>
  )
}

export function TownMenu({ onAction }: TownMenuProps) {
  const currentZone = useGameStore((state) => state.currentZone)
  const [isHealing, setIsHealing] = useState(false)

  // Only show in towns
  if (!currentZone || currentZone.zone_type !== 'town') {
    return null
  }

  const actions = getTownActions(currentZone.name)

  const handleAction = async (actionType: string) => {
    if (actionType === 'pokecenter') {
      setIsHealing(true)
      gameSocket.healAtPokeCenter()
      // Brief animation delay
      setTimeout(() => {
        setIsHealing(false)
      }, 1500)
    }

    if (actionType === 'shop') {
      // Request shop data from server (server will open shop when data is received)
      gameSocket.getShop()
    }

    if (actionType === 'gym') {
      // Request gym data from server
      gameSocket.getGym(currentZone?.id || 1)
    }

    if (actionType === 'museum') {
      // Request museum data from server
      gameSocket.getMuseum()
    }

    onAction?.(actionType)
  }

  return (
    <div className="p-2 pt-3">
      {/* Action buttons grid */}
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <TownMenuButton
            key={action.id}
            action={action}
            onClick={() => handleAction(action.action)}
          />
        ))}
      </div>

      {/* Healing overlay */}
      {isHealing && (
        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-4xl animate-pulse mb-2">🏥</div>
            <div className="text-white font-medium">Healing your Pokemon...</div>
          </div>
        </div>
      )}
    </div>
  )
}
