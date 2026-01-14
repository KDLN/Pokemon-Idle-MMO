'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { ShopItem } from '@/types/game'

// PokeAPI item sprite URLs
const ITEM_SPRITES: Record<string, string> = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  great_ball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  potion: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  super_potion: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
}

// Fallback emojis if sprite fails to load
const ITEM_ICONS: Record<string, string> = {
  ball: '🔴',
  great_ball: '🔵',
  potion: '💜',
  super_potion: '💗',
}

// Get sprite URL by item ID
function getItemSprite(itemId: string): string | null {
  return ITEM_SPRITES[itemId] || null
}

// Item sprite component with fallback
function ItemSprite({ itemId, effectType, size = 32 }: { itemId: string; effectType: string; size?: number }) {
  const spriteUrl = getItemSprite(itemId)
  const [imageError, setImageError] = useState(false)

  if (!spriteUrl || imageError) {
    return <span className="text-2xl">{ITEM_ICONS[effectType] || '📦'}</span>
  }

  return (
    <Image
      src={spriteUrl}
      alt={itemId}
      width={size}
      height={size}
      className="pixelated"
      onError={() => setImageError(true)}
      unoptimized
    />
  )
}

export function ShopPanel() {
  const isShopOpen = useGameStore((state) => state.isShopOpen)
  const shopItems = useGameStore((state) => state.shopItems)
  const pokedollars = useGameStore((state) => state.pokedollars)
  const inventory = useGameStore((state) => state.inventory)
  const setShopOpen = useGameStore((state) => state.setShopOpen)

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [purchasing, setPurchasing] = useState<string | null>(null)

  if (!isShopOpen) return null

  const getQuantity = (itemId: string) => quantities[itemId] || 1
  const setQuantity = (itemId: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, Math.min(99, qty)) }))
  }

  const handleBuy = (item: ShopItem) => {
    const qty = getQuantity(item.id)
    const totalCost = item.price * qty

    if (pokedollars < totalCost) return

    setPurchasing(item.id)
    gameSocket.buyItem(item.id, qty)

    // Reset after a short delay
    setTimeout(() => {
      setPurchasing(null)
      setQuantity(item.id, 1)
    }, 500)
  }

  const canAfford = (item: ShopItem) => {
    const qty = getQuantity(item.id)
    return pokedollars >= item.price * qty
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setShopOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-[#2a2a4a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative">
          <div className="h-1.5 bg-gradient-to-r from-[#3B4CCA] via-[#5B6EEA] to-[#3B4CCA]" />
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#2a2a4a]/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B4CCA] to-[#2a2a4a] flex items-center justify-center">
                <span className="text-xl">🏪</span>
              </div>
              <div>
                <h2 className="font-pixel text-sm text-white tracking-wider">POKE MART</h2>
                <p className="text-xs text-[#a0a0c0]">Viridian City</p>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#FFDE00]/30">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FFDE00] to-[#B3A125] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#333]">P</span>
              </div>
              <span className="text-[#FFDE00] font-bold">{pokedollars.toLocaleString()}</span>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShopOpen(false)}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-white hover:border-red-500/50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="px-6 py-3 border-b border-[#2a2a4a]">
          <div className="text-xs text-[#606080] mb-2 uppercase tracking-wider">Your Inventory</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(inventory).length > 0 ? (
              Object.entries(inventory).map(([itemId, qty]) => {
                const shopItem = shopItems.find(i => i.id === itemId)
                return (
                  <div
                    key={itemId}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0f0f1a] border border-[#2a2a4a]"
                  >
                    <ItemSprite itemId={itemId} effectType={shopItem?.effect_type || 'ball'} size={20} />
                    <span className="text-xs text-[#a0a0c0]">{qty}</span>
                  </div>
                )
              })
            ) : (
              <span className="text-xs text-[#606080]">No items yet</span>
            )}
          </div>
        </div>

        {/* Shop Items */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          <div className="grid gap-3">
            {shopItems.map((item) => {
              const qty = getQuantity(item.id)
              const totalCost = item.price * qty
              const affordable = canAfford(item)
              const isPurchasing = purchasing === item.id

              return (
                <div
                  key={item.id}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-200
                    ${affordable
                      ? 'bg-[#0f0f1a]/60 border-[#2a2a4a] hover:border-[#3B4CCA]/50'
                      : 'bg-[#0f0f1a]/30 border-[#2a2a4a]/50 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Item Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] flex items-center justify-center">
                      <ItemSprite itemId={item.id} effectType={item.effect_type} size={32} />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-xs text-[#FFDE00]">${item.price}</span>
                      </div>
                      <p className="text-xs text-[#606080] truncate">{item.description}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(item.id, qty - 1)}
                        disabled={qty <= 1}
                        className="w-7 h-7 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#a0a0c0] hover:text-white hover:border-[#3B4CCA]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-7 rounded-lg bg-[#0f0f1a] border border-[#2a2a4a] text-center text-white text-sm focus:outline-none focus:border-[#3B4CCA]/50"
                        min="1"
                        max="99"
                      />
                      <button
                        onClick={() => setQuantity(item.id, qty + 1)}
                        disabled={qty >= 99}
                        className="w-7 h-7 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#a0a0c0] hover:text-white hover:border-[#3B4CCA]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!affordable || isPurchasing}
                      className={`
                        px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                        ${affordable && !isPurchasing
                          ? 'bg-gradient-to-b from-[#3B4CCA] to-[#2a3b9a] text-white hover:from-[#4B5CDA] hover:to-[#3B4CCA] active:scale-95'
                          : 'bg-[#2a2a4a] text-[#606080] cursor-not-allowed'
                        }
                      `}
                    >
                      {isPurchasing ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </span>
                      ) : (
                        <>
                          <span className="text-[#FFDE00]">${totalCost.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a4a] bg-[#0f0f1a]/50">
          <p className="text-xs text-[#606080] text-center">
            Welcome! Let me know if there&apos;s anything you need.
          </p>
        </div>
      </div>
    </div>
  )
}
