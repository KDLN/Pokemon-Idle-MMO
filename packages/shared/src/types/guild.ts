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

// ================================
// Guild Chat Types
// ================================

// Guild chat message entry
export interface GuildMessageEntry {
  id: string
  guild_id: string
  player_id: string
  player_username: string
  player_role: GuildRole
  content: string
  created_at: string
}

// Server -> Client payloads for guild chat
export interface GuildChatHistoryPayload {
  messages: GuildMessageEntry[]
}

export interface GuildChatMessagePayload {
  message: GuildMessageEntry
}

// ================================
// Guild Bank Types
// ================================

// Bank category for deposits/withdrawals
export type BankCategory = 'currency' | 'item' | 'pokemon'

// Bank action types for logs
export type BankAction = 'deposit' | 'withdraw' | 'request_created' | 'request_fulfilled' | 'request_expired' | 'request_cancelled'

// Request status
export type BankRequestStatus = 'pending' | 'fulfilled' | 'expired' | 'cancelled'

// Guild bank overview (returned by get_guild_bank)
export interface GuildBank {
  currency: {
    balance: number
    max_capacity: number
  }
  items: GuildBankItem[]
  pokemon: GuildBankPokemon[]
  pokemon_slots: {
    used: number
    max: number
    base: number
    purchased: number
    next_expansion_price: number
  }
  permissions: GuildBankPermission[]
  limits: GuildBankLimit[]
  my_limits: {
    currency: number  // -1 = unlimited
    items: number
    pokemon_points: number
  }
}

// Single item in guild bank
export interface GuildBankItem {
  item_id: string
  quantity: number
  deposited_by: string | null  // player_id
  deposited_by_username: string | null
  last_updated: string
}

// Single Pokemon in guild bank
export interface GuildBankPokemon {
  id: string  // bank entry id
  pokemon_id: string
  slot: number
  species_id: number
  species_name: string
  nickname: string | null
  level: number
  is_shiny: boolean
  point_cost: number  // calculated from BST
  deposited_by: string | null
  deposited_by_username: string | null
  deposited_at: string
}

// Permission configuration entry
export interface GuildBankPermission {
  category: BankCategory
  role: GuildRole
  can_deposit: boolean
  can_withdraw: boolean
}

// Daily limit configuration entry
export interface GuildBankLimit {
  role: GuildRole
  category: BankCategory
  daily_limit: number  // -1 = unlimited, 0 = no permission
  pokemon_points_limit: number
}

// Player-specific limit override
export interface GuildBankPlayerOverride {
  player_id: string
  username: string
  category: BankCategory
  custom_limit: number
  set_by: string | null
  set_by_username: string | null
}

// Transaction log entry
export interface GuildBankLog {
  id: string
  player_id: string
  player_username: string
  action: BankAction
  category: BankCategory
  details: GuildBankLogDetails
  balance_after: number | null  // Only for currency
  created_at: string
}

// Log details vary by action type
export interface GuildBankLogDetails {
  amount?: number  // Currency amount
  item_id?: string
  item_name?: string
  quantity?: number
  pokemon_id?: string
  pokemon_species_id?: number
  pokemon_name?: string
  pokemon_level?: number
  pokemon_points?: number
  request_id?: string
  requester_id?: string
  requester_username?: string
}

// Request in the queue
export interface GuildBankRequest {
  id: string
  player_id: string
  player_username: string
  request_type: BankCategory
  item_details: GuildBankRequestDetails
  status: BankRequestStatus
  note: string | null
  created_at: string
  expires_at: string
  fulfilled_by: string | null
  fulfilled_by_username: string | null
  fulfilled_at: string | null
}

// Request details vary by type
export interface GuildBankRequestDetails {
  amount?: number  // For currency
  item_id?: string
  item_name?: string
  quantity?: number  // For items
  pokemon_id?: string
  pokemon_name?: string
  pokemon_level?: number
}

// ================================
// Guild Bank WebSocket Payloads
// ================================

// Client -> Server payloads

// Get full bank state
export interface GetGuildBankPayload {
  // Empty - requests full bank data
}

// Currency operations
export interface DepositCurrencyPayload {
  amount: number
}

export interface WithdrawCurrencyPayload {
  amount: number
}

// Item operations
export interface DepositItemPayload {
  item_id: string
  quantity: number
}

export interface WithdrawItemPayload {
  item_id: string
  quantity: number
}

// Pokemon operations
export interface DepositPokemonPayload {
  pokemon_id: string
}

export interface WithdrawPokemonPayload {
  pokemon_id: string
}

// Request operations
export interface CreateBankRequestPayload {
  request_type: BankCategory
  details: GuildBankRequestDetails
  note?: string
}

export interface FulfillBankRequestPayload {
  request_id: string
}

export interface CancelBankRequestPayload {
  request_id: string
}

// Get transaction logs
export interface GetBankLogsPayload {
  page?: number
  limit?: number
  filter_player?: string  // player_id
  filter_action?: BankAction
  filter_category?: BankCategory
}

// Get pending requests (for officers)
export interface GetBankRequestsPayload {
  include_expired?: boolean
}

// Permission configuration (leader only)
export interface SetBankPermissionPayload {
  category: BankCategory
  role: GuildRole
  can_deposit: boolean
  can_withdraw: boolean
}

export interface SetBankLimitPayload {
  role: GuildRole
  category: BankCategory
  daily_limit: number
  pokemon_points_limit?: number
}

export interface SetPlayerOverridePayload {
  player_id: string
  category: BankCategory
  custom_limit: number
}

export interface RemovePlayerOverridePayload {
  player_id: string
  category: BankCategory
}

// Slot expansion
export interface ExpandPokemonSlotsPayload {
  // Empty - just triggers expansion
}

// Server -> Client payloads

// Full bank data response
export interface GuildBankDataPayload {
  bank: GuildBank
}

// Currency update broadcast
export interface GuildBankCurrencyUpdatedPayload {
  balance: number
  max_capacity: number
  player_id: string
  player_username: string
  amount: number
  action: 'deposit' | 'withdraw'
}

// Item update broadcast
export interface GuildBankItemUpdatedPayload {
  item: GuildBankItem
  player_id: string
  player_username: string
  quantity_changed: number
  action: 'deposit' | 'withdraw'
}

// Pokemon update broadcast
export interface GuildBankPokemonAddedPayload {
  pokemon: GuildBankPokemon
  player_id: string
  player_username: string
}

export interface GuildBankPokemonRemovedPayload {
  pokemon_id: string
  slot: number
  player_id: string
  player_username: string
}

// Slots expanded broadcast
export interface GuildBankSlotsExpandedPayload {
  new_total: number
  next_price: number
  expanded_by: string
  expanded_by_username: string
}

// Transaction logs response
export interface GuildBankLogsPayload {
  logs: GuildBankLog[]
  total: number
  page: number
}

// Requests response
export interface GuildBankRequestsPayload {
  requests: GuildBankRequest[]
}

// New request notification (to officers/leaders)
export interface GuildBankRequestCreatedPayload {
  request: GuildBankRequest
}

// Request fulfilled notification
export interface GuildBankRequestFulfilledPayload {
  request_id: string
  fulfilled_by: string
  fulfilled_by_username: string
}

// My remaining limits response
export interface GuildBankMyLimitsPayload {
  currency: number
  items: number
  pokemon_points: number
}

// Error response
export interface GuildBankErrorPayload {
  error: string
  code?: string
}

// Generic success response
export interface GuildBankSuccessPayload {
  success: true
  message?: string
}

// ================================
// Guild Quest Types
// ================================

// Quest type enum matching database
export type QuestType = 'catch_pokemon' | 'catch_type' | 'battle' | 'evolve'

// Quest period
export type QuestPeriod = 'daily' | 'weekly'

// Individual quest data
export interface GuildQuest {
  id: string
  guild_id: string
  quest_type: QuestType
  period: QuestPeriod
  target_count: number
  current_progress: number
  reward_currency: number | null
  reward_guild_points: number | null
  reward_item_id: string | null
  reward_item_quantity: number | null
  type_filter: string | null  // e.g., 'water', 'fire' for catch_type
  description: string
  is_completed: boolean
  completed_at: string | null
  quest_date: string  // ISO date
  created_at: string
}

// Quest with player's contribution
export interface GuildQuestWithContribution extends GuildQuest {
  my_contribution: number
}

// Contribution entry for leaderboard
export interface QuestContribution {
  player_id: string
  username: string
  contribution: number
  rank: number
}

// Quest with full contribution leaderboard
export interface GuildQuestDetailed extends GuildQuestWithContribution {
  contributions: QuestContribution[]
}

// Reroll status
export interface QuestRerollStatus {
  daily_used: number
  daily_max: number
  weekly_used: number
  weekly_max: number
  daily_cost: number
  weekly_cost: number
}

// Reset time info
export interface QuestResetTimes {
  daily: string   // Next daily reset timestamp
  weekly: string  // Next weekly reset timestamp
}

// Full quest state returned by get_guild_quests
export interface GuildQuestsState {
  daily: GuildQuestWithContribution[]
  weekly: GuildQuestWithContribution[]
  reroll_status: QuestRerollStatus
  reset_times: QuestResetTimes
}

// History entry (archived quest)
export interface GuildQuestHistory {
  id: string
  guild_id: string
  quest_type: QuestType
  period: QuestPeriod
  target_count: number
  final_progress: number
  was_completed: boolean
  reward_currency: number | null
  reward_guild_points: number | null
  reward_item_id: string | null
  reward_item_quantity: number | null
  type_filter: string | null
  description: string
  quest_date: string
  archived_at: string
  top_contributors: QuestContribution[]
}
