'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'

export interface PlayerInfo {
  id: string
  username: string
  guild_id?: string | null
  is_online?: boolean
  is_friend?: boolean
}

interface PlayerActionModalProps {
  player: PlayerInfo
  onClose: () => void
}

export function PlayerActionModal({ player, onClose }: PlayerActionModalProps) {
  const guild = useGameStore(state => state.guild)
  const myGuildRole = useGameStore(state => state.myGuildRole)
  const myPlayerId = useGameStore(state => state.player?.id)
  const friends = useGameStore(state => state.friends)

  const [inviteSent, setInviteSent] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [friendRequestSent, setFriendRequestSent] = useState(false)

  // Check if this player is already a friend
  const isFriend = player.is_friend ?? friends.some(f => f.id === player.id)

  // Can invite if: I'm leader/officer, and target is not in a guild, and not myself
  const canInvite = guild && myGuildRole &&
    ['leader', 'officer'].includes(myGuildRole) &&
    !player.guild_id &&
    player.id !== myPlayerId

  // Can't do actions on yourself
  const isSelf = player.id === myPlayerId

  const handleTrade = () => {
    gameSocket.sendTradeRequest(player.id)
    onClose()
  }

  const handleAddFriend = () => {
    gameSocket.sendFriendRequest(player.username)
    setFriendRequestSent(true)
  }

  const handleRemoveFriend = () => {
    gameSocket.removeFriend(player.id)
    onClose()
  }

  const handleWhisper = () => {
    // Set whisper target in store and switch to whisper channel
    useGameStore.getState().setActiveWhisperPartner(player.username)
    useGameStore.getState().setActiveChannel('whisper')
    onClose()
  }

  const handleGuildInvite = () => {
    setInviteLoading(true)
    gameSocket.sendGuildInvite(player.id)
    setTimeout(() => {
      setInviteSent(true)
      setInviteLoading(false)
    }, 500)
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl w-[300px] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#2a2a4a]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B6EEA] to-[#3B4CCA] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">
              {player.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-white truncate">{player.username}</div>
            <div className="flex items-center gap-2">
              {player.is_online !== false && (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Online
                </div>
              )}
              {player.is_online === false && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  Offline
                </div>
              )}
              {isFriend && (
                <span className="text-xs text-[#5B6EEA]">• Friend</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252542] flex items-center justify-center text-[#606080] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="p-2">
          {isSelf ? (
            <div className="px-3 py-4 text-center text-sm text-[#606080]">
              This is you!
            </div>
          ) : (
            <>
              {/* Whisper */}
              <button
                onClick={handleWhisper}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Send Whisper</div>
                  <div className="text-xs text-[#606080]">Private message</div>
                </div>
              </button>

              {/* Trade */}
              <button
                onClick={handleTrade}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Send Trade Request</div>
                  <div className="text-xs text-[#606080]">Exchange Pokemon</div>
                </div>
              </button>

              {/* Friend actions */}
              {isFriend ? (
                <button
                  onClick={handleRemoveFriend}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-red-400">Remove Friend</div>
                    <div className="text-xs text-[#606080]">Unfriend this player</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={friendRequestSent}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">
                      {friendRequestSent ? 'Request Sent!' : 'Add Friend'}
                    </div>
                    <div className="text-xs text-[#606080]">
                      {friendRequestSent ? 'Waiting for response' : 'Stay connected'}
                    </div>
                  </div>
                </button>
              )}

              {/* Guild Invite */}
              {canInvite && (
                <button
                  onClick={handleGuildInvite}
                  disabled={inviteLoading || inviteSent}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white hover:bg-[#252542] rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#3B4CCA]/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#5B6EEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">
                      {inviteSent ? 'Invite Sent!' : inviteLoading ? 'Sending...' : 'Invite to Guild'}
                    </div>
                    <div className="text-xs text-[#606080]">
                      {inviteSent ? 'Waiting for response' : `Join ${guild?.name}`}
                    </div>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Global state for opening the modal from anywhere
let openPlayerModalCallback: ((player: PlayerInfo) => void) | null = null

export function setPlayerModalCallback(callback: (player: PlayerInfo) => void) {
  openPlayerModalCallback = callback
}

export function openPlayerModal(player: PlayerInfo) {
  if (openPlayerModalCallback) {
    openPlayerModalCallback(player)
  }
}
