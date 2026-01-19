'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function BankRequestsTab() {
  const requests = useGameStore((state) => state.guildBankRequests)
  const myGuildRole = useGameStore((state) => state.myGuildRole)
  const myPlayerId = useGameStore((state) => state.player?.id)

  const isOfficerOrLeader = myGuildRole === 'leader' || myGuildRole === 'officer'

  useEffect(() => {
    gameSocket.getBankRequests(false)
  }, [])

  const pendingRequests = requests.filter(r => r.status === 'pending')

  const formatRequestDetails = (request: typeof requests[0]) => {
    const { item_details, request_type } = request
    if (request_type === 'currency' && item_details.amount) {
      return `${item_details.amount.toLocaleString()} currency`
    }
    if (request_type === 'item' && item_details.item_name) {
      return `${item_details.quantity || 1}x ${item_details.item_name}`
    }
    if (request_type === 'pokemon' && item_details.pokemon_name) {
      return `${item_details.pokemon_name} Lv.${item_details.pokemon_level}`
    }
    return 'Unknown'
  }

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleFulfill = (requestId: string) => {
    gameSocket.fulfillBankRequest(requestId)
  }

  const handleCancel = (requestId: string) => {
    gameSocket.cancelBankRequest(requestId)
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">
          Pending Requests ({pendingRequests.length})
        </h3>
        <button
          onClick={() => gameSocket.getBankRequests(false)}
          className="text-xs text-yellow-400 hover:text-yellow-300"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {pendingRequests.map((request) => {
          const isMyRequest = request.player_id === myPlayerId

          return (
            <div
              key={request.id}
              className="bg-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-white font-medium">{request.player_username}</span>
                  <span className="text-slate-400 ml-2">requested</span>
                </div>
                <div className="text-xs text-slate-500">
                  Expires in {getTimeRemaining(request.expires_at)}
                </div>
              </div>

              <div className="text-lg text-yellow-400 mb-2">
                {formatRequestDetails(request)}
              </div>

              {request.note && (
                <div className="text-sm text-slate-400 mb-2">
                  Note: {request.note}
                </div>
              )}

              <div className="text-xs text-slate-500 mb-3">
                Requested {new Date(request.created_at).toLocaleString()}
              </div>

              <div className="flex gap-2">
                {isOfficerOrLeader && !isMyRequest && (
                  <button
                    onClick={() => handleFulfill(request.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium"
                  >
                    Fulfill Request
                  </button>
                )}

                {isMyRequest && (
                  <button
                    onClick={() => handleCancel(request.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {pendingRequests.length === 0 && (
          <p className="text-slate-500 text-center py-8">No pending requests</p>
        )}
      </div>
    </div>
  )
}
