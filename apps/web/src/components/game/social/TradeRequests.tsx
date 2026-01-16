'use client'

import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { IncomingTradeRequest, OutgoingTradeRequest, ActiveTradeSession } from '@/types/trade'
import { cn } from '@/lib/ui'

interface TradeRequestsProps {
  onOpenTrade: (trade: ActiveTradeSession) => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function IncomingTradeCard({
  request,
  onAccept,
  onDecline,
  onOpen
}: {
  request: IncomingTradeRequest
  onAccept: () => void
  onDecline: () => void
  onOpen: () => void
}) {
  const isAccepted = request.status === 'accepted'

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] animate-slide-up">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B4CCA]/20 to-[#3B4CCA]/10 border border-[#3B4CCA]/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{request.from_username}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            isAccepted ? 'text-green-400' : 'text-[#606080]'
          )}>
            {isAccepted ? 'In Progress' : 'Wants to trade'}
          </span>
          <span className="text-[#606080]">• {formatTimeAgo(request.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isAccepted ? (
          <button
            onClick={onOpen}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#3B4CCA] to-[#2A3A99] text-white text-xs font-medium shadow-lg shadow-[#3B4CCA]/20 hover:from-[#4B5CDA] hover:to-[#3A4AA9] transition-all"
          >
            Open Trade
          </button>
        ) : (
          <>
            <button
              onClick={onDecline}
              className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] flex items-center justify-center text-[#606080] hover:text-red-500 hover:border-red-500/50 transition-colors"
              title="Decline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={onAccept}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-green-500 to-green-600 text-white text-xs font-medium shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-green-500 transition-all"
            >
              Accept
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function OutgoingTradeCard({
  request,
  onCancel,
  onOpen
}: {
  request: OutgoingTradeRequest
  onCancel: () => void
  onOpen: () => void
}) {
  const isAccepted = request.status === 'accepted'

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] animate-slide-up">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B4CCA]/20 to-[#3B4CCA]/10 border border-[#3B4CCA]/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{request.to_username}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            isAccepted ? 'text-green-400' : 'text-[#606080]'
          )}>
            {isAccepted ? 'Accepted!' : 'Pending...'}
          </span>
          <span className="text-[#606080]">• {formatTimeAgo(request.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isAccepted ? (
          <button
            onClick={onOpen}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#3B4CCA] to-[#2A3A99] text-white text-xs font-medium shadow-lg shadow-[#3B4CCA]/20 hover:from-[#4B5CDA] hover:to-[#3A4AA9] transition-all"
          >
            Open Trade
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-[#a0a0c0] text-xs font-medium hover:text-white hover:border-[#3a3a6a] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export function TradeRequests({ onOpenTrade }: TradeRequestsProps) {
  const rawIncomingRequests = useGameStore((state) => state.incomingTradeRequests)
  const rawOutgoingRequests = useGameStore((state) => state.outgoingTradeRequests)
  const player = useGameStore((state) => state.player)

  // Filter to only show active trades (pending or accepted)
  // This provides extra safety in case cancelled/completed trades aren't removed from state
  const incomingRequests = rawIncomingRequests.filter(r => r.status === 'pending' || r.status === 'accepted')
  const outgoingRequests = rawOutgoingRequests.filter(r => r.status === 'pending' || r.status === 'accepted')

  const handleAccept = (request: IncomingTradeRequest) => {
    gameSocket.acceptTradeRequest(request.trade_id)
    // Open the trade modal after accepting
    handleOpenIncomingTrade(request, 'accepted')
  }

  const handleOpenIncomingTrade = (request: IncomingTradeRequest, overrideStatus?: 'accepted') => {
    const session: ActiveTradeSession = {
      trade_id: request.trade_id,
      partner_id: request.from_player_id,
      partner_username: request.from_username,
      is_sender: false,
      status: overrideStatus || request.status,
      my_offers: [],
      their_offers: [],
      my_ready: false,
      their_ready: false
    }
    onOpenTrade(session)
  }

  const handleDecline = (tradeId: string) => {
    gameSocket.declineTradeRequest(tradeId)
  }

  const handleCancel = (tradeId: string) => {
    gameSocket.cancelTradeRequest(tradeId)
  }

  const handleOpenTrade = (request: OutgoingTradeRequest) => {
    const session: ActiveTradeSession = {
      trade_id: request.trade_id,
      partner_id: request.to_player_id,
      partner_username: request.to_username,
      is_sender: true,
      status: request.status,
      my_offers: [],
      their_offers: [],
      my_ready: false,
      their_ready: false
    }
    onOpenTrade(session)
  }

  const hasAnyRequests = incomingRequests.length > 0 || outgoingRequests.length > 0

  if (!hasAnyRequests) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1a1a2e] border border-dashed border-[#2a2a4a] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2a2a4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        <p className="text-[#606080] text-sm">No trade requests</p>
        <p className="text-[#606080] text-xs mt-1">
          Visit a player in your zone to start trading
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[#606080] uppercase tracking-wider mb-2">
            Incoming ({incomingRequests.length})
          </h4>
          <div className="space-y-2">
            {incomingRequests.map((request, index) => (
              <div key={request.trade_id} style={{ animationDelay: `${index * 0.05}s` }}>
                <IncomingTradeCard
                  request={request}
                  onAccept={() => handleAccept(request)}
                  onDecline={() => handleDecline(request.trade_id)}
                  onOpen={() => handleOpenIncomingTrade(request)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing requests */}
      {outgoingRequests.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[#606080] uppercase tracking-wider mb-2">
            Outgoing ({outgoingRequests.length})
          </h4>
          <div className="space-y-2">
            {outgoingRequests.map((request, index) => (
              <div key={request.trade_id} style={{ animationDelay: `${index * 0.05}s` }}>
                <OutgoingTradeCard
                  request={request}
                  onCancel={() => handleCancel(request.trade_id)}
                  onOpen={() => handleOpenTrade(request)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
