// Guild system types

// Role enum matching database guild_role type
export type GuildRole = 'leader' | 'officer' | 'member'

// Join mode options
export type GuildJoinMode = 'open' | 'invite_only' | 'closed'

// Full guild data (for members viewing their own guild)
export interface Guild {
  id: string
  name: string
  tag: string
  description: string | null
  leader_id: string
  member_count: number
  max_members: number
  join_mode: GuildJoinMode
  created_at: string
}

// Guild preview for search/discovery (subset of Guild)
export interface GuildPreview {
  id: string
  name: string
  tag: string
  description: string | null
  member_count: number
  max_members: number
  join_mode: GuildJoinMode
}

// Guild member with player info
export interface GuildMember {
  id: string
  guild_id: string
  player_id: string
  role: GuildRole
  joined_at: string
  // Joined data from players table
  username: string
  last_online: string | null
  is_online?: boolean
}

// Player's guild info (cached in session)
export interface PlayerGuildInfo {
  id: string
  name: string
  tag: string
  role: GuildRole
}

// ================================
// WebSocket Message Payloads
// ================================

// Client -> Server payloads
export interface CreateGuildPayload {
  name: string
  tag: string
  description?: string
}

export interface JoinGuildPayload {
  guild_id: string
}

export interface KickMemberPayload {
  player_id: string
}

export interface PromoteMemberPayload {
  player_id: string
}

export interface DemoteMemberPayload {
  player_id: string
}

export interface TransferLeadershipPayload {
  player_id: string
}

export interface DisbandGuildPayload {
  confirmation: string  // Must match guild name
}

export interface SearchGuildsPayload {
  query?: string
  page?: number
  limit?: number
}

export interface UpdateGuildSettingsPayload {
  description?: string
  join_mode?: GuildJoinMode
}

// Server -> Client payloads
export interface GuildDataPayload {
  guild: Guild
  members: GuildMember[]
  my_role: GuildRole
}

export interface GuildListPayload {
  guilds: GuildPreview[]
  total: number
  page: number
}

export interface GuildMemberJoinedPayload {
  member: GuildMember
}

export interface GuildMemberLeftPayload {
  player_id: string
  username: string
}

export interface GuildMemberKickedPayload {
  player_id: string
  username: string
  kicked_by: string
}

export interface GuildRoleChangedPayload {
  player_id: string
  username: string
  old_role: GuildRole
  new_role: GuildRole
}

export interface GuildDisbandedPayload {
  guild_name: string
}

export interface GuildErrorPayload {
  error: string
}
