'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

interface BlockedPlayersProps {
  isOpen: boolean
  onClose: () => void
}

export function BlockedPlayers({ isOpen, onClose }: BlockedPlayersProps) {
  const blockedPlayers = useGameStore((state) => state.blockedPlayers)

  // Fetch blocked list when opening
  useEffect(() => {
    if (isOpen) {
      gameSocket.getBlockedPlayers()
    }
  }, [isOpen])

  const handleUnblock = (playerId: string, username: string) => {
    if (window.confirm(`Unblock ${username}?`)) {
      gameSocket.unblockPlayer(playerId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a]">
          <h2 className="text-white font-semibold">Blocked Players</h2>
          <button
            onClick={onClose}
            className="text-[#606080] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {blockedPlayers.length === 0 ? (
            <div className="text-center py-8 text-[#606080]">
              <div className="text-3xl mb-2">🚫</div>
              <p className="text-sm">No blocked players</p>
              <p className="text-xs mt-1">Use /block &lt;player&gt; to block someone</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-[#252542] rounded-lg"
                >
                  <div>
                    <span className="text-white font-medium">{player.blockedUsername}</span>
                    <p className="text-xs text-[#606080]">
                      Blocked {player.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnblock(player.blockedId, player.blockedUsername)}
                    className="px-3 py-1 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#2a2a4a] bg-[#0f0f1a]/50">
          <p className="text-xs text-[#606080] text-center">
            Blocked players cannot send you whispers or friend requests
          </p>
        </div>
      </div>
    </div>
  )
}
