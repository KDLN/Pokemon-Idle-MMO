'use client'

import { useGameStore } from '@/stores/gameStore'

interface ClickableUsernameProps {
  playerId: string
  username: string
  guildId?: string | null
  isOnline?: boolean
  isFriend?: boolean
  className?: string
  children?: React.ReactNode
}

export function ClickableUsername({
  playerId,
  username,
  guildId,
  isOnline,
  isFriend,
  className = '',
  children
}: ClickableUsernameProps) {
  const openPlayerModal = useGameStore(state => state.openPlayerModal)
  const myPlayerId = useGameStore(state => state.player?.id)

  // Don't make your own name clickable (or make it do nothing)
  const isSelf = playerId === myPlayerId

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openPlayerModal({
      id: playerId,
      username,
      guild_id: guildId,
      is_online: isOnline,
      is_friend: isFriend
    })
  }

  return (
    <button
      onClick={handleClick}
      className={`hover:underline cursor-pointer ${isSelf ? 'text-yellow-400' : ''} ${className}`}
      title={isSelf ? 'This is you!' : `Click to interact with ${username}`}
    >
      {children || username}
    </button>
  )
}
