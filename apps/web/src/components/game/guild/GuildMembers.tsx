'use client'

import { useGameStore } from '@/stores/gameStore'
import { gameSocket } from '@/lib/ws/gameSocket'
import type { GuildMember, GuildRole } from '@pokemon-idle/shared'

function formatLastOnline(lastOnline: string | null, isOnline: boolean): string {
  if (isOnline) return 'Online'
  if (!lastOnline) return 'Unknown'

  const date = new Date(lastOnline)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function RoleBadge({ role }: { role: GuildRole }) {
  const colors = {
    leader: 'bg-yellow-600 text-yellow-100',
    officer: 'bg-blue-600 text-blue-100',
    member: 'bg-gray-600 text-gray-100',
  }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colors[role]}`}>
      {role.charAt(0).toUpperCase()}{role.slice(1)}
    </span>
  )
}

interface MemberRowProps {
  member: GuildMember
  myRole: GuildRole | null
  myPlayerId: string
}

function MemberRow({ member, myRole, myPlayerId }: MemberRowProps) {
  const isMe = member.player_id === myPlayerId
  const canManage = myRole === 'leader' || (myRole === 'officer' && member.role === 'member')
  const canPromote = myRole === 'leader' && member.role === 'member'
  const canDemote = myRole === 'leader' && member.role === 'officer'
  const canKick = canManage && !isMe && member.role !== 'leader'
  const canTransfer = myRole === 'leader' && !isMe

  const handlePromote = () => {
    if (confirm(`Promote ${member.username} to Officer?`)) {
      gameSocket.promoteMember(member.player_id)
    }
  }

  const handleDemote = () => {
    if (confirm(`Demote ${member.username} to Member?`)) {
      gameSocket.demoteMember(member.player_id)
    }
  }

  const handleKick = () => {
    if (confirm(`Kick ${member.username} from the guild?`)) {
      gameSocket.kickMember(member.player_id)
    }
  }

  const handleTransfer = () => {
    if (confirm(`Transfer leadership to ${member.username}? You will become an Officer.`)) {
      gameSocket.transferLeadership(member.player_id)
    }
  }

  return (
    <div className="bg-gray-700 rounded p-2 flex justify-between items-center">
      <div className="flex items-center gap-2">
        {/* Online indicator */}
        <div className={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />

        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isMe ? 'text-yellow-300 font-medium' : 'text-white'}`}>
              {member.username}
              {isMe && ' (you)'}
            </span>
            <RoleBadge role={member.role} />
          </div>
          <p className="text-xs text-gray-400">
            {formatLastOnline(member.last_online, member.is_online || false)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (canPromote || canDemote || canKick || canTransfer) && (
        <div className="flex gap-1">
          {canPromote && (
            <button
              onClick={handlePromote}
              title="Promote to Officer"
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
            >
              Promote
            </button>
          )}
          {canDemote && (
            <button
              onClick={handleDemote}
              title="Demote to Member"
              className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500"
            >
              Demote
            </button>
          )}
          {canTransfer && (
            <button
              onClick={handleTransfer}
              title="Transfer Leadership"
              className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500"
            >
              Lead
            </button>
          )}
          {canKick && (
            <button
              onClick={handleKick}
              title="Kick from Guild"
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
            >
              Kick
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function GuildMembers() {
  const guildMembers = useGameStore(state => state.guildMembers)
  const myGuildRole = useGameStore(state => state.myGuildRole)
  const player = useGameStore(state => state.player)

  if (!player) return null

  // Sort: leader first, then officers, then members. Online before offline within each group.
  const sortedMembers = [...guildMembers].sort((a, b) => {
    const roleOrder = { leader: 0, officer: 1, member: 2 }
    const roleCompare = roleOrder[a.role] - roleOrder[b.role]
    if (roleCompare !== 0) return roleCompare

    // Within same role, online first
    if (a.is_online && !b.is_online) return -1
    if (!a.is_online && b.is_online) return 1

    return 0
  })

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-2">Members</h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sortedMembers.map((member) => (
          <MemberRow
            key={member.player_id}
            member={member}
            myRole={myGuildRole}
            myPlayerId={player.id}
          />
        ))}
      </div>
    </div>
  )
}
