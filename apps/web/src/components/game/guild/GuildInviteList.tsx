'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildInvite } from '@pokemon-idle/shared'

// Calculate time remaining until expiration
function getTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  return 'Less than 1h'
}

interface InviteCardProps {
  invite: GuildInvite
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}

function InviteCard({ invite, onAccept, onDecline }: InviteCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-white">
            [{invite.guild_tag}] {invite.guild_name}
          </h4>
          <p className="text-sm text-gray-400">
            {invite.member_count}/{invite.max_members} members
          </p>
        </div>
        <span className="text-xs text-gray-500">
          {getTimeRemaining(invite.expires_at)}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3">
        Invited by <span className="text-white">{invite.invited_by_username}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(invite.id)}
          className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(invite.id)}
          className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

export function GuildInviteList() {
  const guild = useGameStore(state => state.guild)
  const guildInvites = useGameStore(state => state.guildInvites)

  // Fetch invites on mount (only if not in a guild)
  useEffect(() => {
    if (!guild) {
      gameSocket.getGuildInvites()
    }
  }, [guild])

  const handleAccept = (inviteId: string) => {
    gameSocket.acceptGuildInvite(inviteId)
  }

  const handleDecline = (inviteId: string) => {
    gameSocket.declineGuildInvite(inviteId)
  }

  // Don't show if already in a guild
  if (guild) return null

  // Don't show if no invites
  if (guildInvites.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        Guild Invites ({guildInvites.length})
      </h3>
      <div className="space-y-3">
        {guildInvites.map(invite => (
          <InviteCard
            key={invite.id}
            invite={invite}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </div>
    </div>
  )
}
