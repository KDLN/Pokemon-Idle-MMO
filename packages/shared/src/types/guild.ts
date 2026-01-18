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

// ================================
// Guild Invite Types
// ================================

// Invite data (for displaying pending invites)
export interface GuildInvite {
  id: string
  guild_id: string
  guild_name: string
  guild_tag: string
  member_count: number
  max_members: number
  invited_by: string | null
  invited_by_username: string
  created_at: string
  expires_at: string
}

// Outgoing invite (for guild staff viewing sent invites)
export interface GuildOutgoingInvite {
  id: string
  player_id: string
  player_username: string
  invited_by: string
  invited_by_username: string
  created_at: string
  expires_at: string
}

// ================================
// Guild Invite WebSocket Payloads
// ================================

// Client -> Server payloads

export interface SendGuildInvitePayload {
  player_id: string
}

export interface AcceptGuildInvitePayload {
  invite_id: string
}

export interface DeclineGuildInvitePayload {
  invite_id: string
}

export interface CancelGuildInvitePayload {
  invite_id: string
}

export interface GetGuildInvitesPayload {
  // Empty - just requests list of pending invites
}

// Server -> Client payloads

export interface GuildInviteSentPayload {
  success: boolean
  player_id: string
  player_username: string
}

export interface GuildInviteReceivedPayload {
  invite_id: string
  guild_id: string
  guild_name: string
  guild_tag: string
  member_count: number
  max_members: number
  invited_by_id: string
  invited_by_username: string
  created_at: string
  expires_at: string
}

export interface GuildInvitesListPayload {
  invites: GuildInvite[]
}

export interface GuildOutgoingInvitesPayload {
  invites: GuildOutgoingInvite[]
}

export interface GuildInviteAcceptedPayload {
  guild_id: string
  guild_name: string
}

export interface GuildInviteDeclinedPayload {
  invite_id: string
}

export interface GuildInviteCancelledPayload {
  invite_id: string
}

// Notification when someone accepts an invite (sent to guild members)
export interface GuildMemberJoinedViaInvitePayload {
  player_id: string
  username: string
  invited_by_id: string
  invited_by_username: string
}
