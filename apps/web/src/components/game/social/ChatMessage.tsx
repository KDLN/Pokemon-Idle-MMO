'use client'

import type { ChatChannel, ChatMessageData } from '@/types/chat'

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
    default:
      return 'text-white'
  }
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  if (message.isSystem) {
    return (
      <div className="chat-message chat-message-system text-sm">
        <span className="text-blue-400">[System]</span>{' '}
        <span className="text-[#a0a0c0]">{message.content}</span>
      </div>
    )
  }

  return (
    <div
      className={`
        chat-message text-sm
        ${isOwnMessage ? 'bg-[#252542]' : ''}
      `}
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-[10px] text-[#606080]">{formatTime(message.createdAt)}</span>
        <span
          className={`font-semibold ${isOwnMessage ? 'text-[#5B6EEA]' : getChannelColor(message.channel)}`}
        >
          {message.playerName}
        </span>
      </div>
      <p className="text-[#e0e0e0] break-words">{message.content}</p>
    </div>
  )
}
