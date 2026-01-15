'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { Friend } from '@/types/friends'

interface FriendsListProps {
  friends: Friend[]
}

export function FriendsList({ friends }: FriendsListProps) {
  const player = useGameStore((state) => state.player)
  const connectedZones = useGameStore((state) => state.connectedZones)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // Helper to determine if friend is online (last_online within 2 minutes)
  const isOnline = (friend: Friend) => {
    if (!friend.friend_last_online) return false
    const lastOnline = new Date(friend.friend_last_online)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    return lastOnline > twoMinutesAgo
  }

  // Sort friends: online first, then alphabetically
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = isOnline(a)
    const bOnline = isOnline(b)
    if (aOnline && !bOnline) return -1
    if (!aOnline && bOnline) return 1
    return (a.friend_username || '').localeCompare(b.friend_username || '')
  })

  // Check if we can travel to friend's zone
  const canTravelTo = (friend: Friend) => {
    if (!friend.zone_id || !isOnline(friend)) return false
    return connectedZones.some((zone) => zone.id === friend.zone_id)
  }

  const handleTravelToFriend = (friend: Friend) => {
    if (friend.zone_id && canTravelTo(friend)) {
      gameSocket.moveToZone(friend.zone_id)
    }
  }

  const handleRemoveFriend = (friendId: string) => {
    gameSocket.removeFriend(friendId)
    setConfirmRemove(null)
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <svg className="w-12 h-12 text-[#606080] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-[#606080] text-sm mb-1">No friends yet</p>
        <p className="text-[#505070] text-xs">Add friends using the + button above!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#2a2a4a]">
      {sortedFriends.map((friend) => {
        const online = isOnline(friend)
        const canTravel = canTravelTo(friend)
        const isConfirming = confirmRemove === friend.friend_id

        return (
          <div
            key={friend.friend_id}
            className="p-3 hover:bg-[#22223a] transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar with online indicator */}
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B6EEA] to-[#3B4CCA] flex items-center justify-center text-white font-medium text-sm">
                  {(friend.friend_username || '?')[0].toUpperCase()}
                </div>
                {/* Online indicator */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1a1a2e] ${
                    online ? 'bg-[#4ade80]' : 'bg-[#606080]'
                  }`}
                >
                  {online && (
                    <span className="absolute inset-0 rounded-full bg-[#4ade80] animate-ping opacity-75" />
                  )}
                </div>
              </div>

              {/* Friend info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">
                    {friend.friend_username}
                  </span>
                </div>
                {/* Zone info (Issue #14) */}
                <div className="text-xs text-[#606080] truncate">
                  {online ? (
                    friend.zone_name ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {friend.zone_name}
                      </span>
                    ) : (
                      'Online'
                    )
                  ) : (
                    'Offline'
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Travel to friend button (Issue #14) */}
                {canTravel && (
                  <button
                    onClick={() => handleTravelToFriend(friend)}
                    className="p-1.5 text-[#4ade80] hover:bg-[#2a2a4a] rounded transition-colors"
                    title={`Travel to ${friend.zone_name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}

                {/* Remove friend button */}
                {isConfirming ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveFriend(friend.friend_id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="px-2 py-1 text-xs bg-[#2a2a4a] text-[#606080] rounded hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(friend.friend_id)}
                    className="p-1.5 text-[#606080] hover:text-red-400 hover:bg-[#2a2a4a] rounded transition-colors"
                    title="Remove friend"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
