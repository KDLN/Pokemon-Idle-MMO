'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { ChatTabs } from './ChatTabs'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { ChatChannel, ChatMessageData, WhisperMessageData } from '@/types/chat'

interface ChatSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

// Convert whisper to chat message format for inline display
function whisperToChatMessage(
  whisper: WhisperMessageData,
  currentPlayerId: string | undefined
): ChatMessageData {
  const isSent = whisper.fromPlayerId === currentPlayerId
  return {
    id: whisper.id,
    playerId: whisper.fromPlayerId,
    playerName: isSent ? `To ${whisper.toUsername}` : `From ${whisper.fromUsername}`,
    channel: 'whisper' as ChatChannel,
    content: whisper.content,
    createdAt: whisper.createdAt,
    isSystem: false,
  }
}

export function ChatSidebar({ isCollapsed = false, onToggle }: ChatSidebarProps) {
  const player = useGameStore((state) => state.player)
  const chat = useGameStore((state) => state.chat)
  const whispers = useGameStore((state) => state.whispers)
  const whisperUnreadCount = useGameStore((state) => state.whisperUnreadCount)
  const blockedPlayers = useGameStore((state) => state.blockedPlayers)
  const mutedPlayers = useGameStore((state) => state.mutedPlayers)
  const setActiveChannel = useGameStore((state) => state.setActiveChannel)
  const clearWhisperUnread = useGameStore((state) => state.clearWhisperUnread)
  const addChatMessage = useGameStore((state) => state.addChatMessage)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [systemMessages, setSystemMessages] = useState<ChatMessageData[]>([])

  const activeChannel = chat.activeChannel

  // Get blocked player IDs for filtering
  const blockedIds = useMemo(
    () => new Set(blockedPlayers.map((p) => p.blockedId)),
    [blockedPlayers]
  )

  // Filter messages by blocked/muted players
  const filteredMessages = useMemo(() => {
    if (activeChannel === 'whisper') {
      // Show whispers as chat messages
      return whispers.map((w) => whisperToChatMessage(w, player?.id))
    }

    const messages = chat.messages[activeChannel] ?? []
    return messages.filter((msg) => {
      // Don't filter system messages
      if (msg.isSystem) return true
      // Filter blocked players
      if (blockedIds.has(msg.playerId)) return false
      // Filter muted players
      if (mutedPlayers.has(msg.playerId)) return false
      return true
    })
  }, [activeChannel, chat.messages, whispers, player?.id, blockedIds, mutedPlayers])

  // Include local system messages (from commands)
  const channelMessages = useMemo(() => {
    if (activeChannel === 'whisper') {
      return [...filteredMessages, ...systemMessages].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )
    }
    return filteredMessages
  }, [activeChannel, filteredMessages, systemMessages])

  // Calculate total unread including whispers
  const totalUnread = useMemo(() => {
    const chatUnread = Object.entries(chat.unreadCounts)
      .filter(([channel]) => channel !== 'whisper')
      .reduce((sum, [, count]) => sum + count, 0)
    return chatUnread + whisperUnreadCount
  }, [chat.unreadCounts, whisperUnreadCount])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages])

  // Clear whisper unread when viewing whisper channel
  useEffect(() => {
    if (activeChannel === 'whisper') {
      clearWhisperUnread()
    }
  }, [activeChannel, clearWhisperUnread])

  const handleSend = (content: string) => {
    if (!player) return
    // Don't send regular messages on whisper channel - use commands instead
    if (activeChannel === 'whisper') {
      return
    }
    gameSocket.sendChatMessage(activeChannel, content)
  }

  const handleChannelChange = (channel: ChatChannel) => {
    setActiveChannel(channel)
  }

  // Handle system messages from commands (e.g., /help output)
  const handleSystemMessage = (message: string) => {
    const systemMsg: ChatMessageData = {
      id: `system-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      channel: activeChannel,
      content: message,
      createdAt: new Date(),
      isSystem: true,
    }
    setSystemMessages((prev) => [...prev.slice(-10), systemMsg])
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
        unreadCounts={{
          ...chat.unreadCounts,
          whisper: whisperUnreadCount,
        }}
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
        onSystemMessage={handleSystemMessage}
      />
    </div>
  )
}
