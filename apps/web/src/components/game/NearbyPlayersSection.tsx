'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

interface NearbyPlayer {
  id: string
  username: string
}

function PlayerActionModal({
  player,
  onClose
}: {
  player: NearbyPlayer
  onClose: () => void
}) {
  const handleTrade = () => {
    gameSocket.sendTradeRequest(player.id)
    onClose()
  }

  const handleAddFriend = () => {
    gameSocket.sendFriendRequest(player.username)
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl w-[280px] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[#2a2a4a]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B6EEA] to-[#3B4CCA] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {player.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{player.username}</div>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Online
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252542] flex items-center justify-center text-[#606080] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={handleTrade}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium">Send Trade Request</div>
              <div className="text-xs text-[#606080]">Exchange Pokemon</div>
            </div>
          </button>
          <button
            onClick={handleAddFriend}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium">Add Friend</div>
              <div className="text-xs text-[#606080]">Stay connected</div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function NearbyPlayersSection() {
  const currentZone = useGameStore((state) => state.currentZone)
  const nearbyPlayers = useGameStore((state) => state.nearbyPlayers)
  const [selectedPlayer, setSelectedPlayer] = useState<NearbyPlayer | null>(null)

  useEffect(() => {
    if (!currentZone) return

    gameSocket.getNearbyPlayers()

    const interval = setInterval(() => {
      gameSocket.getNearbyPlayers()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentZone?.id])

  if (!currentZone) return null

  return (
    <>
      <div className="nearby-section">
        <div className="section-label">
          <span>Players Nearby</span>
          <span className="nearby-count">
            <span className="nearby-dot" />
            {nearbyPlayers.length + 1}
          </span>
        </div>
        <div className="nearby-list">
          {nearbyPlayers.length === 0 ? (
            <div className="nearby-empty">
              <span className="nearby-empty-icon">👤</span>
              <span>No other trainers here</span>
            </div>
          ) : (
            <>
              {nearbyPlayers.slice(0, 4).map((player) => (
                <button
                  key={player.id}
                  className="nearby-player"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="nearby-avatar">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="nearby-name">{player.username}</span>
                  <span className="nearby-status" />
                </button>
              ))}
              {nearbyPlayers.length > 4 && (
                <div className="nearby-more">
                  +{nearbyPlayers.length - 4} more
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedPlayer && (
        <PlayerActionModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  )
}
