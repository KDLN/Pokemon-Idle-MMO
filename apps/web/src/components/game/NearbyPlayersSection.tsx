'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export function NearbyPlayersSection() {
  const currentZone = useGameStore((state) => state.currentZone)
  const nearbyPlayers = useGameStore((state) => state.nearbyPlayers)
  const openPlayerModal = useGameStore((state) => state.openPlayerModal)

  useEffect(() => {
    if (!currentZone) return

    gameSocket.getNearbyPlayers()

    const interval = setInterval(() => {
      gameSocket.getNearbyPlayers()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentZone?.id])

  if (!currentZone) return null

  const handlePlayerClick = (player: { id: string; username: string; guild_id?: string | null }) => {
    openPlayerModal({
      id: player.id,
      username: player.username,
      guild_id: player.guild_id,
      is_online: true  // Nearby players are always online
    })
  }

  return (
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
                onClick={() => handlePlayerClick(player)}
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
  )
}
