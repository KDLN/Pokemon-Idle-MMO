'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { ShopBuffCard } from './ShopBuffCard'
import type { GuildBuffType } from '@pokemon-idle/shared'

interface GuildShopModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHOP_ITEMS: Array<{
  buffType: GuildBuffType
  name: string
  description: string
  costCurrencyPerHour: number
  costGuildPointsPerHour: number
}> = [
  {
    buffType: 'xp_bonus',
    name: 'XP Boost',
    description: 'All guild members earn 10% more XP from battles',
    costCurrencyPerHour: 1000,
    costGuildPointsPerHour: 200
  },
  {
    buffType: 'catch_rate',
    name: 'Catch Rate Boost',
    description: 'All guild members have 10% higher catch rate',
    costCurrencyPerHour: 1000,
    costGuildPointsPerHour: 200
  },
  {
    buffType: 'encounter_rate',
    name: 'Encounter Rate Boost',
    description: 'All guild members encounter Pokemon 10% more often',
    costCurrencyPerHour: 1000,
    costGuildPointsPerHour: 200
  }
]

export function GuildShopModal({ isOpen, onClose }: GuildShopModalProps) {
  const guild = useGameStore((state) => state.guild)
  const guildActiveBuffs = useGameStore((state) => state.guildActiveBuffs)
  const guildBank = useGameStore((state) => state.guildBank)
  const guildStatistics = useGameStore((state) => state.guildStatistics)

  const myRole = guild?.role
  const canPurchase = myRole === 'leader' || myRole === 'officer'
  const bankBalance = guildBank?.currency?.balance || 0
  const guildPoints = guildStatistics?.guild_points || 0

  useEffect(() => {
    if (isOpen && guild) {
      gameSocket.sendGetActiveBuffs()
      gameSocket.sendGetGuildStatistics()
    }
  }, [isOpen, guild])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Guild Shop</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 bg-gray-800 rounded p-3">
          <div>
            <span className="text-gray-400 text-sm">Bank Balance</span>
            <p className="text-yellow-400 font-bold">{bankBalance.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Guild Points</span>
            <p className="text-purple-400 font-bold">{guildPoints.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {SHOP_ITEMS.map((item) => (
            <ShopBuffCard
              key={item.buffType}
              buffType={item.buffType}
              name={item.name}
              description={item.description}
              costCurrencyPerHour={item.costCurrencyPerHour}
              costGuildPointsPerHour={item.costGuildPointsPerHour}
              activeBuff={guildActiveBuffs?.[item.buffType] || null}
              bankBalance={bankBalance}
              guildPoints={guildPoints}
              canPurchase={canPurchase}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
