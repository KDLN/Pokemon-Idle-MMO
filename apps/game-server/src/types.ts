// Game server types
// Re-exports shared types + backend-only types

// Re-export all shared types for backward compatibility
export type {
  // Core
  Player,
  Pokemon,
  PokemonSpecies,
  Zone,
  WildPokemon,
  // Battle
  BattleTurn,
  BattleSequence,
  GymBattleMatchup,
  // Catching
  BallType,
  CatchSequence,
  CatchResult,
  EncounterEvent,
  // Progression
  LevelUpEvent,
  PendingEvolution,
  EvolutionEvent,
  // Social
  ChatChannel,
  ChatMessageEntry,
  FriendStatus,
  Friend,
  FriendRequest,
  OutgoingFriendRequest,
  WhisperMessage,
  BlockedPlayer,
  // Trade
  TradeStatus,
  Trade,
  TradeOfferPokemon,
  TradeOffer,
  TradeRequest,
  OutgoingTradeRequest,
  TradeHistoryPokemon,
  TradeHistoryEntry,
  // Leaderboard
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
  PlayerRank,
  // Guild
  Guild,
  GuildMember,
  GuildRole,
  GuildJoinMode,
  GuildPreview,
  PlayerGuildInfo,
  CreateGuildPayload,
  JoinGuildPayload,
  SearchGuildsPayload,
  UpdateGuildSettingsPayload,
  GuildDataPayload,
  GuildListPayload,
  GuildMemberJoinedPayload,
  GuildMemberLeftPayload,
  GuildMemberKickedPayload,
  GuildRoleChangedPayload,
  GuildDisbandedPayload,
  GuildErrorPayload,
  PromoteMemberPayload,
  DemoteMemberPayload,
  KickMemberPayload,
  TransferLeadershipPayload,
  DisbandGuildPayload,
  // Guild Invites
  GuildInvite,
  GuildOutgoingInvite,
  SendGuildInvitePayload,
  AcceptGuildInvitePayload,
  DeclineGuildInvitePayload,
  CancelGuildInvitePayload,
  GuildInviteSentPayload,
  GuildInviteReceivedPayload,
  GuildInvitesListPayload,
  GuildOutgoingInvitesPayload,
  GuildInviteAcceptedPayload,
  GuildInviteDeclinedPayload,
  GuildInviteCancelledPayload,
  // Guild Chat
  GuildMessageEntry,
  GuildChatHistoryPayload,
  GuildChatMessagePayload,
  // Guild Bank Types
  BankCategory,
  BankAction,
  BankRequestStatus,
  GuildBank,
  GuildBankItem,
  GuildBankPokemon,
  GuildBankPermission,
  GuildBankLimit,
  GuildBankPlayerOverride,
  GuildBankLog,
  GuildBankLogDetails,
  GuildBankRequest,
  GuildBankRequestDetails,
  // Guild Bank Client -> Server Payloads
  GetGuildBankPayload,
  DepositCurrencyPayload,
  WithdrawCurrencyPayload,
  DepositItemPayload,
  WithdrawItemPayload,
  DepositPokemonPayload,
  WithdrawPokemonPayload,
  CreateBankRequestPayload,
  FulfillBankRequestPayload,
  CancelBankRequestPayload,
  GetBankLogsPayload,
  GetBankRequestsPayload,
  SetBankPermissionPayload,
  SetBankLimitPayload,
  SetPlayerOverridePayload,
  RemovePlayerOverridePayload,
  ExpandPokemonSlotsPayload,
  // Guild Bank Server -> Client Payloads
  GuildBankDataPayload,
  GuildBankCurrencyUpdatedPayload,
  GuildBankItemUpdatedPayload,
  GuildBankPokemonAddedPayload,
  GuildBankPokemonRemovedPayload,
  GuildBankSlotsExpandedPayload,
  GuildBankLogsPayload,
  GuildBankRequestsPayload,
  GuildBankRequestCreatedPayload,
  GuildBankRequestFulfilledPayload,
  GuildBankMyLimitsPayload,
  GuildBankErrorPayload,
  GuildBankSuccessPayload,
  // Common
  WSMessage,
  ShopItem,
  TickResult,
} from '@pokemon-idle/shared'

// ========================
// Backend-only types below
// ========================

import type { Player, Pokemon, PokemonSpecies, Zone, PendingEvolution, Trade, PlayerGuildInfo } from '@pokemon-idle/shared'

// Move data (backend battle calculation)
export interface Move {
  name: string
  type: string
  power: number
  accuracy: number
  status?: {
    name: string
    chance: number
  }
}

// Encounter table for zone spawns
export interface EncounterTableEntry {
  zone_id: number
  species_id: number
  encounter_rate: number
  species?: PokemonSpecies
}

// Player session state (in-memory only)
export interface PlayerSession {
  player: Player
  party: (Pokemon | null)[]
  zone: Zone
  pokeballs: number
  great_balls: number
  tickNumber: number
  encounterTable: EncounterTableEntry[]
  pokedollars: number
  encounterCooldown: number // Ticks remaining before next encounter can occur
  // Evolution state
  pendingEvolutions: PendingEvolution[]
  suppressedEvolutions: Set<string> // Pokemon IDs where evolution was cancelled (re-prompt on next level up)
  // Trade state
  activeTrade?: Trade
  // Guild state (loaded on connect, updated on guild changes)
  guild?: PlayerGuildInfo
}

// Weekly stats tracking
export interface WeeklyStats {
  id: string
  player_id: string
  week_start: string
  pokemon_caught: number
  highest_level: number
  pokedex_count: number
  created_at: string
}
