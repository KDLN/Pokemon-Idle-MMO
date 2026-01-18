'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildPreview } from '@pokemon-idle/shared'

export function GuildList() {
  const [searchQuery, setSearchQuery] = useState('')

  const guildList = useGameStore(state => state.guildList)
  const guildListTotal = useGameStore(state => state.guildListTotal)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    gameSocket.searchGuilds(searchQuery)
  }

  const handleJoin = (guild: GuildPreview) => {
    if (guild.join_mode !== 'open') {
      return
    }
    if (guild.member_count >= guild.max_members) {
      return
    }
    gameSocket.joinGuild(guild.id)
  }

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guilds..."
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
        >
          Search
        </button>
      </form>

      {/* Guild List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {guildList.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No guilds found</p>
        ) : (
          guildList.map((guild) => (
            <div
              key={guild.id}
              className="bg-gray-700 rounded p-3 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">[{guild.tag}] {guild.name}</span>
                  {guild.join_mode === 'invite_only' && (
                    <span className="text-xs bg-yellow-600 px-1 rounded">Invite Only</span>
                  )}
                  {guild.join_mode === 'closed' && (
                    <span className="text-xs bg-red-600 px-1 rounded">Closed</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {guild.member_count}/{guild.max_members} members
                </p>
                {guild.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">{guild.description}</p>
                )}
              </div>
              {guild.join_mode === 'open' && guild.member_count < guild.max_members && (
                <button
                  onClick={() => handleJoin(guild)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500"
                >
                  Join
                </button>
              )}
              {guild.member_count >= guild.max_members && (
                <span className="text-xs text-gray-500">Full</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Total count */}
      {guildListTotal > 0 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Showing {guildList.length} of {guildListTotal} guilds
        </p>
      )}
    </div>
  )
}
