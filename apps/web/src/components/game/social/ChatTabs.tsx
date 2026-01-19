'use client'

import type { ChatChannel } from '@/types/chat'
import { useGameStore } from '@/stores/gameStore'

interface ChatTabsProps {
  activeChannel: ChatChannel
  onChannelChange: (channel: ChatChannel) => void
  unreadCounts: Record<ChatChannel, number>
}

const ALL_CHANNELS: { id: ChatChannel; label: string; icon: string; color?: string }[] = [
  { id: 'global', label: 'Global', icon: '🌐' },
  { id: 'trade', label: 'Trade', icon: '💰' },
  { id: 'guild', label: 'Guild', icon: '⚔️' },
  { id: 'system', label: 'System', icon: '📢' },
  { id: 'whisper', label: 'Whisper', icon: '💬', color: '#a855f7' }, // Purple for whispers
]

export function ChatTabs({ activeChannel, onChannelChange, unreadCounts }: ChatTabsProps) {
  const guild = useGameStore((state) => state.guild)

  // Filter out guild channel if player is not in a guild
  const channels = ALL_CHANNELS.filter((channel) =>
    channel.id !== 'guild' || guild !== null
  )
  return (
    <div className="flex border-b border-[#2a2a4a]">
      {channels.map((channel) => {
        const isActive = activeChannel === channel.id
        const unreadCount = unreadCounts[channel.id] || 0

        return (
          <button
            key={channel.id}
            onClick={() => onChannelChange(channel.id)}
            className={`
              relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium
              transition-colors
              ${isActive
                ? 'text-white bg-[#252542] border-b-2 border-[#5B6EEA]'
                : 'text-[#606080] hover:text-[#a0a0c0] hover:bg-[#1a1a2e]'
              }
            `}
          >
            <span>{channel.icon}</span>
            <span className="hidden sm:inline">{channel.label}</span>

            {/* Unread indicator */}
            {unreadCount > 0 && !isActive && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
