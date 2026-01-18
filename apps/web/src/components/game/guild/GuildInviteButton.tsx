'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

interface GuildInviteButtonProps {
  targetPlayerId: string
  targetUsername: string
  className?: string
}

export function GuildInviteButton({
  targetPlayerId,
  targetUsername,
  className = ''
}: GuildInviteButtonProps) {
  const guild = useGameStore(state => state.guild)
  const myGuildRole = useGameStore(state => state.myGuildRole)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Only show for leader/officer
  if (!guild || !myGuildRole || !['leader', 'officer'].includes(myGuildRole)) {
    return null
  }

  const handleInvite = () => {
    setLoading(true)
    gameSocket.sendGuildInvite(targetPlayerId)
    // Optimistic UI - mark as sent
    setTimeout(() => {
      setSent(true)
      setLoading(false)
    }, 500)
  }

  if (sent) {
    return (
      <span className={`text-green-400 text-sm ${className}`}>
        Invite Sent
      </span>
    )
  }

  return (
    <button
      onClick={handleInvite}
      disabled={loading}
      className={`px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-medium rounded transition-colors ${className}`}
    >
      {loading ? 'Sending...' : 'Invite to Guild'}
    </button>
  )
}
