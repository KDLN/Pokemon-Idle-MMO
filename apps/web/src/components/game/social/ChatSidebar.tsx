'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatTabs } from './ChatTabs'
import { ChatMessage, type ChatChannel, type ChatMessageData } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useGameStore } from '@/stores/gameStore'

interface ChatSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

// Mock messages for development
const MOCK_MESSAGES: ChatMessageData[] = [
  {
    id: '1',
    playerId: 'system',
    playerName: 'System',
    channel: 'system',
    content: 'Welcome to Pokemon Idle MMO! Good luck on your journey!',
    createdAt: new Date(Date.now() - 300000),
    isSystem: true,
  },
  {
    id: '2',
    playerId: 'user1',
    playerName: 'AshKetchum',
    channel: 'global',
    content: 'Hey everyone! Just caught my first shiny!',
    createdAt: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    playerId: 'user2',
    playerName: 'MistyWater',
    channel: 'global',
    content: 'Congrats! What Pokemon was it?',
    createdAt: new Date(Date.now() - 180000),
  },
  {
    id: '4',
    playerId: 'user3',
    playerName: 'BrockRock',
    channel: 'trade',
    content: 'LF: Bulbasaur FT: Charmander',
    createdAt: new Date(Date.now() - 120000),
  },
]

export function ChatSidebar({ isCollapsed = false, onToggle }: ChatSidebarProps) {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('global')
  const [messages, setMessages] = useState<ChatMessageData[]>(MOCK_MESSAGES)
  const [unreadCounts, setUnreadCounts] = useState<Record<ChatChannel, number>>({
    global: 0,
    trade: 2,
    guild: 0,
    system: 1,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const player = useGameStore((state) => state.player)

  // Filter messages by channel
  const channelMessages = messages.filter((m) => m.channel === activeChannel)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages])

  // Mark channel as read when switching
  useEffect(() => {
    setUnreadCounts((prev) => ({ ...prev, [activeChannel]: 0 }))
  }, [activeChannel])

  const handleSend = (content: string) => {
    if (!player) return

    const newMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      playerId: player.id,
      playerName: player.username,
      channel: activeChannel,
      content,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])

    // TODO: Send to server via WebSocket
    // gameSocket.sendChatMessage(activeChannel, content)
  }

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-[#3B4CCA] text-white shadow-lg flex items-center justify-center hover:bg-[#5B6EEA] transition-colors z-50"
        title="Open Chat"
      >
        <span className="text-xl">💬</span>
        {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold bg-red-500 rounded-full flex items-center justify-center">
            {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
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
        onChannelChange={setActiveChannel}
        unreadCounts={unreadCounts}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {channelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#606080] text-sm">
            <span className="text-2xl mb-2">💬</span>
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
