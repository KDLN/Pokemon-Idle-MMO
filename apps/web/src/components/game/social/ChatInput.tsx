'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import type { ChatChannel, ChatMessageData } from '@/types/chat'
import { gameSocket } from '@/lib/ws/gameSocket'
import { useGameStore } from '@/stores/gameStore'

interface ChatInputProps {
  channel: ChatChannel
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  onSystemMessage?: (message: string) => void
}

const MAX_LENGTH = 280

// Sanitize username for display in system messages (prevent XSS/injection)
function sanitizeUsername(username: string): string {
  // Remove or escape potentially dangerous characters
  return username
    .replace(/[<>&"'`]/g, '') // Remove HTML/script injection chars
    .slice(0, 20) // Enforce max length (matches schema)
}

// Command help text for /help
const COMMAND_HELP = `Available commands:
/w <player> <message> - Whisper to a friend
/whisper <player> <message> - Whisper to a friend
/block <player> - Block a player
/unblock <player> - Unblock a player
/friend <player> - Send friend request
/unfriend <player> - Remove friend
/mute <player> - Mute player (session only)
/unmute <player> - Unmute player
/help - Show this message`

interface CommandResult {
  handled: boolean
  error?: string
  systemMessage?: string
}

// Parse and execute chat commands (Issue #48)
function parseAndExecuteCommand(
  input: string,
  currentPlayerId: string | undefined
): CommandResult {
  const parts = input.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (cmd) {
    case '/w':
    case '/whisper': {
      if (args.length < 2) {
        return { handled: true, error: 'Usage: /w <player> <message>' }
      }
      const [targetUser, ...messageParts] = args
      const message = messageParts.join(' ')
      gameSocket.sendWhisper(targetUser, message)
      return { handled: true }
    }

    case '/block': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /block <player>' }
      }
      const blockTarget = sanitizeUsername(args[0])
      gameSocket.blockPlayer(blockTarget)
      return { handled: true, systemMessage: `Blocking ${blockTarget}...` }
    }

    case '/unblock': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /unblock <player>' }
      }
      const unblockTarget = sanitizeUsername(args[0])
      // Need to find player ID from blocked list
      const blockedPlayers = useGameStore.getState().blockedPlayers
      const blocked = blockedPlayers.find(
        (p) => p.blockedUsername.toLowerCase() === unblockTarget.toLowerCase()
      )
      if (!blocked) {
        return { handled: true, error: `${unblockTarget} is not blocked` }
      }
      gameSocket.unblockPlayer(blocked.blockedId)
      return { handled: true, systemMessage: `Unblocking ${unblockTarget}...` }
    }

    case '/friend': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /friend <player>' }
      }
      const friendTarget = sanitizeUsername(args[0])
      gameSocket.sendFriendRequest(friendTarget)
      return { handled: true, systemMessage: `Sending friend request to ${friendTarget}...` }
    }

    case '/unfriend': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /unfriend <player>' }
      }
      const unfriendTarget = sanitizeUsername(args[0])
      // Find friend by username in friends list
      const friends = useGameStore.getState().friends
      const targetFriendUsername = unfriendTarget.toLowerCase()
      const friend = friends.find(
        (f) => f.friend_username?.toLowerCase() === targetFriendUsername
      )
      if (!friend) {
        return { handled: true, error: `${unfriendTarget} is not in your friends list` }
      }
      gameSocket.removeFriend(friend.friend_id)
      return { handled: true, systemMessage: `Removing ${unfriendTarget} from friends...` }
    }

    case '/mute': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /mute <player>' }
      }
      const muteTarget = sanitizeUsername(args[0])
      // Session-only mute - find player ID from chat messages
      const targetUsername = muteTarget.toLowerCase()
      const state = useGameStore.getState()

      // Search all channels for a message from this player
      let playerId: string | null = null
      for (const channel of ['global', 'trade', 'guild', 'system'] as const) {
        const messages = state.chat.messages[channel] || []
        const msg = messages.find(
          (m) => m.playerName.toLowerCase() === targetUsername && !m.isSystem
        )
        if (msg) {
          playerId = msg.playerId
          break
        }
      }

      if (!playerId) {
        return { handled: true, error: `Cannot find player "${muteTarget}" in recent chat` }
      }

      state.mutePlayer(playerId)
      return { handled: true, systemMessage: `Muted ${muteTarget} for this session` }
    }

    case '/unmute': {
      if (args.length !== 1) {
        return { handled: true, error: 'Usage: /unmute <player>' }
      }
      const unmuteTarget = sanitizeUsername(args[0])
      // Find player ID from chat messages
      const unmuteUsername = unmuteTarget.toLowerCase()
      const unmuteState = useGameStore.getState()

      // Search all channels for a message from this player
      let unmutePlayerId: string | null = null
      for (const channel of ['global', 'trade', 'guild', 'system'] as const) {
        const messages = unmuteState.chat.messages[channel] || []
        const msg = messages.find(
          (m) => m.playerName.toLowerCase() === unmuteUsername && !m.isSystem
        )
        if (msg) {
          unmutePlayerId = msg.playerId
          break
        }
      }

      if (!unmutePlayerId) {
        return { handled: true, error: `Cannot find player "${unmuteTarget}" in recent chat` }
      }

      unmuteState.unmutePlayer(unmutePlayerId)
      return { handled: true, systemMessage: `Unmuted ${unmuteTarget}` }
    }

    case '/help': {
      return { handled: true, systemMessage: COMMAND_HELP }
    }

    default:
      return { handled: false, error: `Unknown command: ${cmd}. Type /help for available commands.` }
  }
}

export function ChatInput({
  channel,
  onSend,
  disabled = false,
  placeholder,
  onSystemMessage,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [commandError, setCommandError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const player = useGameStore((state) => state.player)

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    // Clear any previous command error
    setCommandError(null)

    // Check for commands (Issue #48)
    if (trimmed.startsWith('/')) {
      const result = parseAndExecuteCommand(trimmed, player?.id)

      if (result.handled) {
        if (result.error) {
          setCommandError(result.error)
          // Auto-clear error after 3 seconds
          setTimeout(() => setCommandError(null), 3000)
        } else {
          // Command executed successfully
          if (result.systemMessage && onSystemMessage) {
            onSystemMessage(result.systemMessage)
          }
          setMessage('')
        }
        inputRef.current?.focus()
        return
      }

      // Unknown command - show error but don't send
      if (result.error) {
        setCommandError(result.error)
        setTimeout(() => setCommandError(null), 3000)
        inputRef.current?.focus()
        return
      }
    }

    // Regular message
    onSend(trimmed)
    setMessage('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder
    switch (channel) {
      case 'global':
        return 'Say something to everyone... (or /help)'
      case 'trade':
        return 'Post a trade offer...'
      case 'guild':
        return 'Message your guild...'
      case 'system':
        return 'System messages only'
      case 'whisper':
        return 'Type /w <player> <message>...'
      default:
        return 'Type a message...'
    }
  }

  const isSystemChannel = channel === 'system'
  const charactersLeft = MAX_LENGTH - message.length
  const isNearLimit = charactersLeft < 50

  return (
    <div className="p-2 border-t border-[#2a2a4a]">
      {/* Command error display */}
      {commandError && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-xs whitespace-pre-wrap">
          {commandError}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled || isSystemChannel}
            className={`
              w-full px-3 py-2 rounded-lg text-sm
              bg-[#0f0f1a] border border-[#2a2a4a]
              text-white placeholder-[#606080]
              focus:outline-none focus:border-[#5B6EEA]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              ${message.startsWith('/') ? 'border-purple-500/50' : ''}
            `}
          />

          {/* Character count */}
          {message.length > 0 && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                isNearLimit ? 'text-yellow-400' : 'text-[#606080]'
              } ${charactersLeft < 0 ? 'text-red-400' : ''}`}
            >
              {charactersLeft}
            </span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || isSystemChannel || !message.trim()}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${message.trim() && !disabled && !isSystemChannel
              ? 'bg-[#3B4CCA] text-white hover:bg-[#5B6EEA]'
              : 'bg-[#2a2a4a] text-[#606080] cursor-not-allowed'
            }
          `}
        >
          Send
        </button>
      </div>

      {isSystemChannel && (
        <p className="text-xs text-[#606080] mt-1 text-center">
          System messages are read-only
        </p>
      )}
    </div>
  )
}
