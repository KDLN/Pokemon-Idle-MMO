'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildBankItem } from '@pokemon-idle/shared'

// Item categories matching inventory
const ITEM_CATEGORIES = {
  healing: { name: 'Healing', items: ['potion', 'super_potion', 'hyper_potion', 'max_potion', 'full_restore', 'revive', 'max_revive'] },
  balls: { name: 'Poke Balls', items: ['poke_ball', 'great_ball', 'ultra_ball', 'master_ball'] },
  evolution: { name: 'Evolution', items: ['fire_stone', 'water_stone', 'thunder_stone', 'leaf_stone', 'moon_stone'] },
  other: { name: 'Other', items: [] } // Catch-all
}

interface SelectedItem {
  item_id: string
  source: 'bank' | 'inventory'
}

interface InventoryItem {
  item_id: string
  quantity: number
}

export function BankItemsTab() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const guildBank = useGameStore((state) => state.guildBank)
  const inventory = useGameStore((state) => state.inventory)
  const myGuildRole = useGameStore((state) => state.myGuildRole)
  const myBankLimits = useGameStore((state) => state.myBankLimits)

  const canWithdraw = myGuildRole === 'leader' || myGuildRole === 'officer'
  const remainingLimit = myBankLimits?.items ?? -1

  // Convert inventory object to array
  const inventoryArray: InventoryItem[] = useMemo(() => {
    if (!inventory) return []
    return Object.entries(inventory)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }))
  }, [inventory])

  // Group bank items by category
  const bankItemsByCategory = useMemo(() => {
    if (!guildBank) return {}
    const grouped: Record<string, GuildBankItem[]> = {}

    guildBank.items.forEach((item) => {
      let category = 'other'
      for (const [cat, config] of Object.entries(ITEM_CATEGORIES)) {
        if (config.items.includes(item.item_id)) {
          category = cat
          break
        }
      }
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(item)
    })

    return grouped
  }, [guildBank])

  // Filter inventory items
  const inventoryItems = useMemo(() => {
    if (!inventoryArray) return []
    return inventoryArray.filter((item) =>
      item.quantity > 0 &&
      (searchQuery === '' || item.item_id.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [inventoryArray, searchQuery])

  const handleDeposit = () => {
    if (!selectedItem || selectedItem.source !== 'inventory') return
    const invItem = inventoryArray?.find(i => i.item_id === selectedItem.item_id)
    if (!invItem || quantity > invItem.quantity) return

    gameSocket.depositItem(selectedItem.item_id, quantity)
    setSelectedItem(null)
    setQuantity(1)
  }

  const handleWithdraw = () => {
    if (!selectedItem || selectedItem.source !== 'bank' || !canWithdraw) return
    const bankItem = guildBank?.items.find(i => i.item_id === selectedItem.item_id)
    if (!bankItem || quantity > bankItem.quantity) return
    if (remainingLimit !== -1 && quantity > remainingLimit) return

    gameSocket.withdrawItem(selectedItem.item_id, quantity)
    setSelectedItem(null)
    setQuantity(1)
  }

  const handleRequest = () => {
    if (!selectedItem || selectedItem.source !== 'bank') return
    const bankItem = guildBank?.items.find(i => i.item_id === selectedItem.item_id)
    if (!bankItem || quantity > bankItem.quantity) return

    gameSocket.createBankRequest('item', {
      item_id: selectedItem.item_id,
      item_name: formatItemName(selectedItem.item_id),
      quantity
    })
    setSelectedItem(null)
    setQuantity(1)
  }

  const formatItemName = (itemId: string) => {
    return itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  if (!guildBank) return null

  return (
    <div className="flex flex-col h-full">
      {/* Main content area with split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bank Items (Left Side) */}
        <div className="w-1/2 border-r border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Guild Bank Items</h3>

          {Object.entries(ITEM_CATEGORIES).map(([catKey, catConfig]) => {
            const items = bankItemsByCategory[catKey]
            if (!items || items.length === 0) return null

            return (
              <div key={catKey} className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">{catConfig.name}</h4>
                <div className="grid grid-cols-4 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.item_id}
                      onClick={() => setSelectedItem({ item_id: item.item_id, source: 'bank' })}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        selectedItem?.item_id === item.item_id && selectedItem?.source === 'bank'
                          ? 'bg-yellow-500/20 border-2 border-yellow-400'
                          : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="text-xs text-white truncate">{formatItemName(item.item_id)}</div>
                      <div className="text-sm font-bold text-yellow-400">x{item.quantity}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {guildBank.items.length === 0 && (
            <p className="text-slate-500 text-center py-8">No items in bank</p>
          )}
        </div>

        {/* Inventory Items (Right Side) */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Your Inventory</h3>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full mb-3 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-400"
          />

          <div className="grid grid-cols-3 gap-2">
            {inventoryItems.map((item) => (
              <button
                key={item.item_id}
                onClick={() => setSelectedItem({ item_id: item.item_id, source: 'inventory' })}
                className={`p-2 rounded-lg text-center transition-colors ${
                  selectedItem?.item_id === item.item_id && selectedItem?.source === 'inventory'
                    ? 'bg-green-500/20 border-2 border-green-400'
                    : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                }`}
              >
                <div className="text-xs text-white truncate">{formatItemName(item.item_id)}</div>
                <div className="text-sm font-bold text-white">x{item.quantity}</div>
              </button>
            ))}
          </div>

          {inventoryItems.length === 0 && (
            <p className="text-slate-500 text-center py-8">No items in inventory</p>
          )}
        </div>
      </div>

      {/* Action Panel (Bottom - fixed within modal, not absolute) */}
      {selectedItem && (
        <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-slate-400">Selected: </span>
              <span className="text-white font-medium">{formatItemName(selectedItem.item_id)}</span>
              <span className="text-slate-400 ml-2">from {selectedItem.source}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center text-white"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600"
              >
                +
              </button>
            </div>

            {selectedItem.source === 'inventory' ? (
              <button
                onClick={handleDeposit}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
              >
                Deposit
              </button>
            ) : canWithdraw ? (
              <button
                onClick={handleWithdraw}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium"
              >
                Withdraw
              </button>
            ) : (
              <button
                onClick={handleRequest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
              >
                Request
              </button>
            )}

            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
            >
              Cancel
            </button>
          </div>

          {!canWithdraw && selectedItem.source === 'bank' && remainingLimit !== -1 && (
            <div className="text-xs text-slate-500 mt-2">
              Daily withdrawal limit remaining: {remainingLimit}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
