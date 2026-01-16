'use client'

import { useEffect, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { TradeRequests } from './TradeRequests'
import { TradeModal } from './TradeModal'
import type { ActiveTradeSession } from '@/types/trade'

interface TradesPanelProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function TradesPanel({ isCollapsed = false, onToggle }: TradesPanelProps) {
  const incomingRequests = useGameStore((state) => state.incomingTradeRequests)
  const outgoingRequests = useGameStore((state) => state.outgoingTradeRequests)
  const activeTrade = useGameStore((state) => state.activeTrade)
  const isTradeModalOpen = useGameStore((state) => state.isTradeModalOpen)
  const setActiveTrade = useGameStore((state) => state.setActiveTrade)
  const setTradeModalOpen = useGameStore((state) => state.setTradeModalOpen)
  const isConnected = useGameStore((state) => state.isConnected)

  // Fetch trades data on mount and when connected
  useEffect(() => {
    if (isConnected) {
      gameSocket.getTrades()
    }
  }, [isConnected])

  const totalRequests = incomingRequests.length + outgoingRequests.length
  const pendingCount = incomingRequests.length
  const acceptedCount = outgoingRequests.filter(r => r.status === 'accepted').length

  const handleOpenTrade = (trade: ActiveTradeSession) => {
    setActiveTrade(trade)
    setTradeModalOpen(true)
  }

  const handleCloseTrade = () => {
    setTradeModalOpen(false)
  }

  if (isCollapsed) {
    return (
      <>
        <button
          onClick={onToggle}
          className="fixed bottom-36 right-4 w-12 h-12 rounded-full bg-[#3B4CCA] text-white shadow-lg flex items-center justify-center hover:bg-[#5B6EEA] transition-colors z-50"
          title="Open Trades"
          aria-label={`Open Trades panel. ${pendingCount} incoming, ${acceptedCount} ready`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          {totalRequests > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold bg-red-500 rounded-full flex items-center justify-center" aria-hidden="true">
              {totalRequests}
            </span>
          )}
        </button>

        {/* Trade Modal */}
        <TradeModal isOpen={isTradeModalOpen} onClose={handleCloseTrade} />
      </>
    )
  }

  return (
    <>
      <div className="fixed bottom-36 right-4 w-80 max-h-[400px] bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] shadow-xl overflow-hidden z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a] bg-gradient-to-r from-[#2a2a4a] to-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#5B6EEA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <h3 className="text-white font-semibold text-sm">Trades</h3>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                {pendingCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 text-[#606080] hover:text-white transition-colors rounded hover:bg-[#2a2a4a]"
                title="Minimize"
                aria-label="Minimize trades panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          <TradeRequests onOpenTrade={handleOpenTrade} />
        </div>
      </div>

      {/* Trade Modal */}
      <TradeModal isOpen={isTradeModalOpen} onClose={handleCloseTrade} />
    </>
  )
}
