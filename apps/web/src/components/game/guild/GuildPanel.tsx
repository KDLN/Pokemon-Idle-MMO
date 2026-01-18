'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import { CreateGuildModal } from './CreateGuildModal'
import { GuildList } from './GuildList'
import { GuildMembers } from './GuildMembers'

export function GuildPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false)
  const [disbandConfirmation, setDisbandConfirmation] = useState('')

  const guild = useGameStore(state => state.guild)
  const myGuildRole = useGameStore(state => state.myGuildRole)
  const guildError = useGameStore(state => state.guildError)
  const setGuildError = useGameStore(state => state.setGuildError)

  // Load guild list on mount if not in a guild
  useEffect(() => {
    if (!guild) {
      gameSocket.searchGuilds()
    }
  }, [guild])

  // Clear error after 5 seconds
  useEffect(() => {
    if (guildError) {
      const timer = setTimeout(() => setGuildError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [guildError, setGuildError])

  const handleLeaveGuild = () => {
    if (confirm('Are you sure you want to leave this guild?')) {
      gameSocket.leaveGuild()
    }
  }

  const handleDisbandGuild = () => {
    if (guild && disbandConfirmation.toLowerCase() === guild.name.toLowerCase()) {
      gameSocket.disbandGuild(disbandConfirmation)
      setShowDisbandConfirm(false)
      setDisbandConfirmation('')
    }
  }

  // Not in a guild - show guild search/list
  if (!guild) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Guilds</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500"
          >
            Create Guild
          </button>
        </div>

        {guildError && (
          <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
            {guildError}
          </div>
        )}

        <GuildList />

        <CreateGuildModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    )
  }

  // In a guild - show guild info and members
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Guild Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            [{guild.tag}] {guild.name}
          </h2>
          <p className="text-sm text-gray-400">
            {guild.member_count}/{guild.max_members} members
          </p>
          {guild.description && (
            <p className="text-sm text-gray-300 mt-1">{guild.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {myGuildRole === 'leader' ? (
            <button
              onClick={() => setShowDisbandConfirm(true)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
            >
              Disband
            </button>
          ) : (
            <button
              onClick={handleLeaveGuild}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {guildError && (
        <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {guildError}
        </div>
      )}

      {/* Your Role Badge */}
      <div className="mb-4">
        <span className="text-sm text-gray-400">Your Role: </span>
        <span className={`text-sm font-medium ${
          myGuildRole === 'leader' ? 'text-yellow-400' :
          myGuildRole === 'officer' ? 'text-blue-400' :
          'text-gray-300'
        }`}>
          {myGuildRole?.charAt(0).toUpperCase()}{myGuildRole?.slice(1)}
        </span>
      </div>

      {/* Member List */}
      <GuildMembers />

      {/* Disband Confirmation Modal */}
      {showDisbandConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-red-400 mb-4">Disband Guild</h3>
            <p className="text-gray-300 mb-4">
              This action is permanent and cannot be undone. All members will be removed and all guild data will be deleted.
            </p>
            <p className="text-gray-300 mb-2">
              Type <span className="font-bold text-white">{guild.name}</span> to confirm:
            </p>
            <input
              type="text"
              value={disbandConfirmation}
              onChange={(e) => setDisbandConfirmation(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisbandConfirm(false)
                  setDisbandConfirmation('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDisbandGuild}
                disabled={disbandConfirmation.toLowerCase() !== guild.name.toLowerCase()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disband
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
