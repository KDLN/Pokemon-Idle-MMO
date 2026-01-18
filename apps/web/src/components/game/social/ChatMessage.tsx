'use client'

import type { ChatChannel, ChatMessageData } from '@/types/chat'
import { ClickableUsername } from '../ClickableUsername'

interface ChatMessageProps {
  message: ChatMessageData
  isOwnMessage?: boolean
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function getChannelColor(channel: ChatChannel): string {
  switch (channel) {
    case 'global':
      return 'text-white'
    case 'trade':
      return 'text-green-400'
    case 'guild':
      return 'text-purple-400'
    case 'system':
      return 'text-blue-400'
    case 'whisper':
      return 'text-pink-400' // Pink/purple for whispers (like WoW)
    default:
      return 'text-white'
  }
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const isWhisper = message.channel === 'whisper'

  if (message.isSystem) {
    return (
      <div className="chat-message chat-message-system text-sm">
        <span className="text-blue-400">[System]</span>{' '}
        <span className="text-[#a0a0c0] whitespace-pre-wrap">{message.content}</span>
      </div>
    )
  }

  return (
    <div
      className={`
        chat-message text-sm rounded-lg px-2 py-1
        ${isOwnMessage ? 'bg-[#252542]' : ''}
        ${isWhisper ? 'bg-purple-900/20 border-l-2 border-purple-500' : ''}
      `}
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[10px] text-[#606080]">{formatTime(message.createdAt)}</span>
        {isWhisper && <span className="text-[10px] text-purple-400">[Whisper]</span>}
        <ClickableUsername
          playerId={message.playerId}
          username={message.playerName}
          className={`font-semibold ${isOwnMessage && !isWhisper ? 'text-[#5B6EEA]' : getChannelColor(message.channel)}`}
        />
      </div>
      <p className={`break-words ${isWhisper ? 'text-purple-200' : 'text-[#e0e0e0]'}`}>
        {message.content}
      </p>
    </div>
  )
}
