'use client'

import { useState, useRef, useEffect } from 'react'
import { gameSocket } from '@/lib/ws/gameSocket'
import { useGameStore } from '@/stores/gameStore'

// Constants
const AUTO_CLOSE_DELAY_MS = 1500
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 20

interface AddFriendProps {
  onClose: () => void
}

export function AddFriend({ onClose }: AddFriendProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isConnected = useGameStore((state) => state.isConnected)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmed = username.trim()

    // Client-side validation
    if (trimmed.length < USERNAME_MIN_LENGTH) {
      setError(`Username must be at least ${USERNAME_MIN_LENGTH} characters`)
      return
    }

    if (trimmed.length > USERNAME_MAX_LENGTH) {
      setError(`Username must be at most ${USERNAME_MAX_LENGTH} characters`)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    // Check connection before attempting
    if (!isConnected) {
      setError('Not connected to server')
      return
    }

    setIsSubmitting(true)

    // Use callback to handle server response properly (fixes race condition)
    gameSocket.sendFriendRequest(trimmed, (result) => {
      setIsSubmitting(false)

      if (result.success) {
        setSuccess(`Friend request sent to ${result.username || trimmed}!`)
        setUsername('')
        // Auto-close after success
        setTimeout(onClose, AUTO_CLOSE_DELAY_MS)
      } else {
        setError(result.error || 'Failed to send friend request')
      }
    })
  }

  return (
    <div className="p-3 bg-[#22223a] border-b border-[#2a2a4a]">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError(null)
              setSuccess(null)
            }}
            placeholder="Enter username..."
            className="flex-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-[#606080] focus:outline-none focus:border-[#5B6EEA] transition-colors"
            maxLength={20}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="px-4 py-2 bg-[#5B6EEA] text-white text-sm font-medium rounded-lg hover:bg-[#7B8EFA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Add'
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 text-[#4ade80] text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
      </form>
    </div>
  )
}
