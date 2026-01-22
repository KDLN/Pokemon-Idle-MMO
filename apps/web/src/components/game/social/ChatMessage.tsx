'use client'

import type { ChatChannel, ChatMessageData } from '@/types/chat'
import type { GuildRole } from '@pokemon-idle/shared'
import { ClickableUsername } from '../ClickableUsername'

interface ChatMessageProps {
  message: ChatMessageData
  isOwnMessage?: boolean
}

function getRoleBadge(role: GuildRole): { label: string; color: string } {
  switch (role) {
    case 'leader':
      return { label: 'L', color: 'bg-yellow-500 text-black' }
    case 'officer':
      return { label: 'O', color: 'bg-blue-500 text-white' }
    case 'member':
      return { label: 'M', color: 'bg-gray-500 text-white' }
    default:
      return { label: '', color: '' }
  }
}

/**
 * Get username color based on guild role and chat channel.
 * Role-based: leader=gold, officer=blue, member=purple
 * Channel-based: trade=green, whisper=pink, default=white
 */
function getUsernameColor(role?: GuildRole, channel?: ChatChannel): string {
  // Role-based colors take priority (for guild chat)
  if (role === 'leader') return 'text-yellow-400'
  if (role === 'officer') return 'text-blue-400'
  if (role === 'member') return 'text-purple-400'
  // Channel-based colors for non-guild
  if (channel === 'trade') return 'text-green-400'
  if (channel === 'whisper') return 'text-pink-400'
  return 'text-white'
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const isWhisper = message.channel === 'whisper'
  const isGuildChat = message.channel === 'guild' && message.playerRole

  if (message.isSystem) {
    return (
      <div className="chat-message chat-message-system text-sm">
        <span className="text-blue-400">[System]</span>{' '}
        <span className="text-[#a0a0c0] whitespace-pre-wrap">{message.content}</span>
      </div>
    )
  }

  // Get role badge for guild chat messages
  const roleBadge = isGuildChat && message.playerRole ? getRoleBadge(message.playerRole) : null

  // Determine username color based on role (for guild) or channel
  const usernameColor = isOwnMessage && !isWhisper
    ? 'text-[#5B6EEA]' // Own messages in blue
    : getUsernameColor(message.playerRole, message.channel)

  return (
    <div
      className={`
        chat-message text-sm rounded-lg px-2 py-1.5
        ${isOwnMessage ? 'bg-[#252542]' : 'bg-[var(--color-surface-base)]'}
        ${isWhisper ? 'bg-purple-900/20 border-l-2 border-purple-500' : ''}
      `}
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[10px] text-[#606080]">{formatTime(message.createdAt)}</span>
        {isWhisper && <span className="text-[10px] text-purple-400">[Whisper]</span>}
        {/* Guild role badge */}
        {roleBadge && (
          <span
            className={`inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded ${roleBadge.color}`}
            title={message.playerRole}
          >
            {roleBadge.label}
          </span>
        )}
        <ClickableUsername
          playerId={message.playerId}
          username={message.playerName}
          className={`font-semibold ${usernameColor}`}
        />
      </div>
      <p className={`text-xs break-words ${isWhisper ? 'text-purple-200' : 'text-[var(--color-text-secondary)]'}`}>
        {message.content}
      </p>
    </div>
  )
}
