'use client'

import { gameSocket } from '@/lib/ws/gameSocket'
import type { FriendRequest, OutgoingFriendRequest } from '@/types/friends'

interface FriendRequestsProps {
  incoming: FriendRequest[]
  outgoing: OutgoingFriendRequest[]
}

export function FriendRequests({ incoming, outgoing }: FriendRequestsProps) {
  const handleAccept = (friendId: string) => {
    gameSocket.acceptFriendRequest(friendId)
  }

  const handleDecline = (friendId: string) => {
    gameSocket.declineFriendRequest(friendId)
  }

  const handleCancel = (friendId: string) => {
    gameSocket.declineFriendRequest(friendId)
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <svg className="w-12 h-12 text-[#606080] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-[#606080] text-sm mb-1">No pending requests</p>
        <p className="text-[#505070] text-xs">Friend requests will appear here</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#2a2a4a]">
      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div>
          <div className="px-3 py-2 bg-[#22223a]">
            <span className="text-xs font-medium text-[#606080] uppercase tracking-wider">
              Incoming ({incoming.length})
            </span>
          </div>
          {incoming.map((request) => (
            <div
              key={request.friend_id}
              className="p-3 hover:bg-[#22223a] transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-white font-medium text-sm">
                  {(request.from_username || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium truncate block">
                    {request.from_username}
                  </span>
                  <span className="text-xs text-[#606080]">
                    Wants to be friends
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAccept(request.friend_id)}
                    className="p-1.5 text-[#4ade80] hover:bg-[#2a2a4a] rounded transition-colors"
                    title="Accept"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDecline(request.friend_id)}
                    className="p-1.5 text-red-400 hover:bg-[#2a2a4a] rounded transition-colors"
                    title="Decline"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoing.length > 0 && (
        <div>
          <div className="px-3 py-2 bg-[#22223a]">
            <span className="text-xs font-medium text-[#606080] uppercase tracking-wider">
              Sent ({outgoing.length})
            </span>
          </div>
          {outgoing.map((request) => (
            <div
              key={request.friend_id}
              className="p-3 hover:bg-[#22223a] transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B6EEA] to-[#3B4CCA] flex items-center justify-center text-white font-medium text-sm">
                  {(request.to_username || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium truncate block">
                    {request.to_username}
                  </span>
                  <span className="text-xs text-[#606080]">
                    Pending...
                  </span>
                </div>

                {/* Cancel button */}
                <button
                  onClick={() => handleCancel(request.friend_id)}
                  className="px-2 py-1 text-xs text-[#606080] hover:text-red-400 hover:bg-[#2a2a4a] rounded transition-colors"
                  title="Cancel request"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
