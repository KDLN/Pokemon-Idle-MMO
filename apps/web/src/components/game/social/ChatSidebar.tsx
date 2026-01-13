'use client'

import { useEffect, useRef } from 'react'
import { ChatTabs } from './ChatTabs'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { ChatChannel } from '@/types/chat'

interface ChatSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function ChatSidebar({ isCollapsed = false, onToggle }: ChatSidebarProps) {
  const player = useGameStore((state) => state.player)
  const chat = useGameStore((state) => state.chat)
  const setActiveChannel = useGameStore((state) => state.setActiveChannel)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChannel = chat.activeChannel
  const channelMessages = chat.messages[activeChannel] ?? []
  const totalUnread = Object.values(chat.unreadCounts).reduce((sum, value) => sum + value, 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages])

  const handleSend = (content: string) => {
    if (!player) return
    console.log('[chat] send', activeChannel, content)
    gameSocket.sendChatMessage(activeChannel, content)
  }

  const handleChannelChange = (channel: ChatChannel) => {
    setActiveChannel(channel)
  }

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-[#3B4CCA] text-white shadow-lg flex items-center justify-center hover:bg-[#5B6EEA] transition-colors z-50"
        title="Open Chat"
      >
        <span className="text-xl">dY'ª</span>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold bg-red-500 rounded-full flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
        <h3 className="text-white font-semibold text-sm">Chat</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-[#606080] hover:text-white transition-colors"
            title="Minimize Chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <ChatTabs
        activeChannel={activeChannel}
        onChannelChange={handleChannelChange}
        unreadCounts={chat.unreadCounts}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {channelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#606080] text-sm">
            <span className="text-2xl mb-2">dY'ª</span>
            <p>No messages yet</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          <>
            {channelMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.playerId === player?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        channel={activeChannel}
        onSend={handleSend}
        disabled={!player}
      />
    </div>
  )
}
