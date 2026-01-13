'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import type { ChatChannel } from './ChatMessage'

interface ChatInputProps {
  channel: ChatChannel
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const MAX_LENGTH = 280

export function ChatInput({
  channel,
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

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
        return 'Say something to everyone...'
      case 'trade':
        return 'Post a trade offer...'
      case 'guild':
        return 'Message your guild...'
      case 'system':
        return 'System messages only'
      default:
        return 'Type a message...'
    }
  }

  const isSystemChannel = channel === 'system'
  const charactersLeft = MAX_LENGTH - message.length
  const isNearLimit = charactersLeft < 50

  return (
    <div className="p-2 border-t border-[#2a2a4a]">
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
