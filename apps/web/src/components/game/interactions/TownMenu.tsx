'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getTownActions, type TownAction } from '@/lib/zones/townActions'
import { gameSocket } from '@/lib/ws/gameSocket'

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

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        group relative flex flex-col items-center gap-2 p-4 rounded-xl
        transition-all duration-200
        ${isLocked
          ? 'bg-[#1a1a2e]/50 border border-dashed border-[#2a2a4a] cursor-not-allowed opacity-60'
          : 'bg-gradient-to-br from-[#1a1a2e] to-[#252542] border border-[#2a2a4a] hover:border-[#3a3a6a] hover:shadow-lg hover:scale-105 cursor-pointer'
        }
      `}
      title={isLocked ? action.lockReason : action.description}
    >
      {/* Icon */}
      <div
        className={`
          text-3xl transition-transform
          ${!isLocked && 'group-hover:scale-110 group-hover:animate-bounce-gentle'}
        `}
      >
        {action.icon}
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={`text-sm font-medium ${isLocked ? 'text-[#606080]' : 'text-white'}`}>
          {action.label}
        </div>
        {action.description && (
          <div className="text-[10px] text-[#606080] mt-0.5 max-w-[80px] truncate">
            {action.description}
          </div>
        )}
      </div>

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2 text-sm">🔒</div>
      )}

      {/* Shine effect */}
      {!isLocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
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
      const { setShopOpen } = useGameStore.getState()
      setShopOpen(true)
    }

    if (actionType === 'gym') {
      // Request gym data from server
      gameSocket.getGym(currentZone?.id || 1)
    }

    onAction?.(actionType)
  }

  return (
    <div className="poke-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>🏠</span>
          <span>{currentZone.name}</span>
        </h3>
        <span className="text-xs text-[#606080]">Town Services</span>
      </div>

      {/* Action buttons grid - auto-fit ensures all items visible */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
