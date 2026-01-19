'use client'

import { useState } from 'react'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildBuffType, GuildBuff } from '@pokemon-idle/shared'

interface ShopBuffCardProps {
  buffType: GuildBuffType
  name: string
  description: string
  costCurrencyPerHour: number
  costGuildPointsPerHour: number
  activeBuff: GuildBuff | null
  bankBalance: number
  guildPoints: number
  canPurchase: boolean  // Based on role
}

export function ShopBuffCard({
  buffType,
  name,
  description,
  costCurrencyPerHour,
  costGuildPointsPerHour,
  activeBuff,
  bankBalance,
  guildPoints,
  canPurchase
}: ShopBuffCardProps) {
  const [duration, setDuration] = useState(1)
  const [usePoints, setUsePoints] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const totalCostCurrency = costCurrencyPerHour * duration
  const totalCostPoints = costGuildPointsPerHour * duration
  const canAffordCurrency = bankBalance >= totalCostCurrency
  const canAffordPoints = guildPoints >= totalCostPoints

  const handlePurchase = async () => {
    if (!canPurchase) return
    if (usePoints && !canAffordPoints) return
    if (!usePoints && !canAffordCurrency) return

    setIsPurchasing(true)
    gameSocket.sendPurchaseGuildBuff(buffType, duration, usePoints)
    // Reset after brief delay to allow for response
    setTimeout(() => setIsPurchasing(false), 1000)
  }

  // Calculate remaining time if buff is active
  const remainingMs = activeBuff
    ? new Date(activeBuff.ends_at).getTime() - Date.now()
    : 0
  const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)))
  const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)))

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-semibold text-white">{name}</h4>
        <span className="text-green-400 text-sm">+10%</span>
      </div>

      <p className="text-gray-400 text-sm mb-3">{description}</p>

      {activeBuff && remainingMs > 0 && (
        <div className="bg-green-900/30 border border-green-700 rounded p-2 mb-3">
          <span className="text-green-400 text-sm">
            Active: {remainingHours}h {remainingMinutes}m remaining
          </span>
        </div>
      )}

      <div className="space-y-2 mb-3">
        <label className="text-gray-300 text-sm">Duration (hours)</label>
        <input
          type="range"
          min="1"
          max="24"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400">
          <span>1h</span>
          <span className="text-white font-medium">{duration}h</span>
          <span>24h</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setUsePoints(false)}
          className={`flex-1 py-2 px-3 rounded text-sm ${
            !usePoints
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Currency ({totalCostCurrency.toLocaleString()})
        </button>
        <button
          onClick={() => setUsePoints(true)}
          className={`flex-1 py-2 px-3 rounded text-sm ${
            usePoints
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Points ({totalCostPoints.toLocaleString()})
        </button>
      </div>

      <button
        onClick={handlePurchase}
        disabled={!canPurchase || isPurchasing || (usePoints ? !canAffordPoints : !canAffordCurrency)}
        className={`w-full py-2 rounded font-medium ${
          canPurchase && (usePoints ? canAffordPoints : canAffordCurrency)
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isPurchasing ? 'Purchasing...' : activeBuff ? 'Extend Buff' : 'Purchase'}
      </button>

      {!canPurchase && (
        <p className="text-red-400 text-xs mt-2 text-center">
          Only Leaders and Officers can purchase buffs
        </p>
      )}
    </div>
  )
}
