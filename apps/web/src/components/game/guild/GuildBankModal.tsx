'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { BankCurrencyTab } from './BankCurrencyTab'
import { BankItemsTab } from './BankItemsTab'
import { BankSettingsTab } from './BankSettingsTab'
import { BankPokemonTab } from './BankPokemonTab'
import { BankLogsTab } from './BankLogsTab'
import { BankRequestsTab } from './BankRequestsTab'

type BankTab = 'currency' | 'items' | 'pokemon' | 'logs' | 'requests' | 'settings'

interface GuildBankModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuildBankModal({ isOpen, onClose }: GuildBankModalProps) {
  const [selectedTab, setSelectedTab] = useState<BankTab>('currency')
  const [isVisible, setIsVisible] = useState(false)

  const guildBank = useGameStore((state) => state.guildBank)
  const guild = useGameStore((state) => state.guild)
  const myGuildRole = useGameStore((state) => state.myGuildRole)
  const guildBankRequests = useGameStore((state) => state.guildBankRequests)

  // Animation handling (following TradeModal pattern)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      gameSocket.getGuildBank()
      // Also fetch requests for officers/leaders
      if (myGuildRole === 'leader' || myGuildRole === 'officer') {
        gameSocket.getBankRequests()
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, myGuildRole])

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isVisible) return null

  const pendingRequestCount = Array.isArray(guildBankRequests)
    ? guildBankRequests.filter(r => r.status === 'pending').length
    : 0

  const tabs: { id: BankTab; label: string; badge?: number; leaderOnly?: boolean }[] = [
    { id: 'currency', label: 'Currency' },
    { id: 'items', label: 'Items' },
    { id: 'pokemon', label: 'Pokemon' },
    { id: 'logs', label: 'Logs' },
    // Only show requests tab for officers/leaders
    ...(myGuildRole === 'leader' || myGuildRole === 'officer'
      ? [{ id: 'requests' as BankTab, label: 'Requests', badge: pendingRequestCount }]
      : []
    ),
    // Only show settings tab for leaders
    ...(myGuildRole === 'leader'
      ? [{ id: 'settings' as BankTab, label: 'Settings', leaderOnly: true }]
      : []
    ),
  ]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-slate-800 rounded-lg border border-slate-600 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Guild Bank</h2>
            {guild && (
              <p className="text-sm text-slate-400">[{guild.tag}] {guild.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                selectedTab === tab.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {!guildBank ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Loading bank...</p>
            </div>
          ) : (
            <>
              {selectedTab === 'currency' && <BankCurrencyTab />}
              {selectedTab === 'items' && <BankItemsTab />}
              {selectedTab === 'pokemon' && <BankPokemonTab />}
              {selectedTab === 'logs' && <BankLogsTab />}
              {selectedTab === 'requests' && <BankRequestsTab />}
              {selectedTab === 'settings' && <BankSettingsTab />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
