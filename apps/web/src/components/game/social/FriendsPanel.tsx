'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { countOnlineFriends } from '@/lib/utils/friendUtils'
import { FriendsList } from './FriendsList'
import { FriendRequests } from './FriendRequests'
import { AddFriend } from './AddFriend'

interface FriendsPanelProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

type FriendsTab = 'friends' | 'requests'

export function FriendsPanel({ isCollapsed = false, onToggle }: FriendsPanelProps) {
  const friends = useGameStore((state) => state.friends)
  const incomingRequests = useGameStore((state) => state.incomingFriendRequests)
  const outgoingRequests = useGameStore((state) => state.outgoingFriendRequests)
  const isConnected = useGameStore((state) => state.isConnected)

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)

  // Fetch friends data on mount and when connected
  useEffect(() => {
    if (isConnected) {
      gameSocket.getFriends()
    }
  }, [isConnected])

  // Use memoized count of online friends
  const onlineFriendsCount = useMemo(() => countOnlineFriends(friends), [friends])

  const totalRequests = incomingRequests.length + outgoingRequests.length

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-[#5B6EEA] text-white shadow-lg flex items-center justify-center hover:bg-[#7B8EFA] transition-colors z-50"
        title="Open Friends"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        {(onlineFriendsCount > 0 || totalRequests > 0) && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold bg-green-500 rounded-full flex items-center justify-center">
            {totalRequests > 0 ? totalRequests : onlineFriendsCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 max-h-[500px] bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] shadow-xl overflow-hidden z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a] bg-gradient-to-r from-[#2a2a4a] to-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#5B6EEA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-white font-semibold text-sm">Friends</h3>
          <span className="text-xs text-[#4ade80]">
            {onlineFriendsCount} online
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddFriend(!showAddFriend)}
            className="p-1.5 text-[#606080] hover:text-[#5B6EEA] transition-colors rounded hover:bg-[#2a2a4a]"
            title="Add Friend"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 text-[#606080] hover:text-white transition-colors rounded hover:bg-[#2a2a4a]"
              title="Minimize"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Add Friend Form */}
      {showAddFriend && (
        <AddFriend onClose={() => setShowAddFriend(false)} />
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a4a]">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'friends'
              ? 'text-[#5B6EEA] border-b-2 border-[#5B6EEA] bg-[#1a1a2e]'
              : 'text-[#606080] hover:text-white'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'text-[#5B6EEA] border-b-2 border-[#5B6EEA] bg-[#1a1a2e]'
              : 'text-[#606080] hover:text-white'
          }`}
        >
          Requests
          {totalRequests > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
              {totalRequests}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'friends' ? (
          <FriendsList friends={friends} />
        ) : (
          <FriendRequests
            incoming={incomingRequests}
            outgoing={outgoingRequests}
          />
        )}
      </div>
    </div>
  )
}
