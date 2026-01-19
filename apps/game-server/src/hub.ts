import { WebSocket, WebSocketServer } from 'ws'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { IncomingMessage } from 'http'
import type {
  PlayerSession,
  WSMessage,
  PokemonSpecies,
  Zone,
  Pokemon,
  ChatChannel,
  PendingEvolution,
  EvolutionEvent,
  TradeOffer,
  WhisperMessage,
  BlockedPlayer,
  LeaderboardType,
  LeaderboardTimeframe,
  CreateGuildPayload,
  JoinGuildPayload,
  SearchGuildsPayload,
  GuildRole,
  PromoteMemberPayload,
  DemoteMemberPayload,
  KickMemberPayload,
  TransferLeadershipPayload,
  DisbandGuildPayload,
  SendGuildInvitePayload,
  AcceptGuildInvitePayload,
  DeclineGuildInvitePayload,
  CancelGuildInvitePayload,
  // Guild Bank Payloads
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
  RemovePlayerOverridePayload
} from './types.js'
import {
  getPlayerByUserId,
  getPlayerParty,
  getPlayerPokeballs,
  getPlayerGreatBalls,
  getZone,
  getConnectedZones,
  getEncounterTable,
  getPlayerBox,
  updatePlayerPokeballs,
  updatePlayerGreatBalls,
  updatePlayerLastOnline,
  updatePlayerZone,
  updatePokemonStats,
  updatePokemonHP,
  saveCaughtPokemon,
  updatePokedex,
  getCaughtSpeciesForPlayer,
  swapPartyMember,
  removeFromParty,
  savePokemonXP,
  updatePlayerMoney,
  buyItem,
  getPlayerInventory,
  useInventoryItem,
  addInventoryItem,
  getPotionHealAmount,
  SHOP_ITEMS,
  getGymLeaderByZone,
  hasPlayerDefeatedGym,
  recordGymVictory,
  addBadgeToPlayer,
  getRecentChatMessages,
  saveChatMessage,
  getPlayerByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getFriendsList,
  removeFriend,
  getPlayersInZone,
  arePlayersFriends,
  createTradeRequest,
  getIncomingTradeRequests,
  getOutgoingTradeRequests,
  cancelTradeRequest,
  acceptTradeRequest as acceptTradeRequestDb,
  declineTradeRequest as declineTradeRequestDb,
  completeTrade,
  addTradeOffer,
  removeTradeOffer,
  getTradeOffers,
  getActiveTradeIds,
  getTradeHistory,
  getMuseumMembership,
  purchaseMuseumMembership,
  evolvePokemon,
  getAllSpecies,
  blockPlayer,
  unblockPlayer,
  getBlockedPlayers,
  isPlayerBlocked,
  getLeaderboard,
  getPlayerRank,
  updateWeeklyStats,
  createGuild,
  joinGuild,
  leaveGuild,
  getGuildById,
  getGuildMembers,
  getPlayerGuild,
  searchGuilds,
  promoteMember,
  demoteMember,
  kickMember,
  transferLeadership,
  disbandGuild,
  getGuildMemberByPlayerId,
  sendGuildInvite,
  acceptGuildInvite,
  declineGuildInvite,
  cancelGuildInvite,
  getIncomingGuildInvites,
  getOutgoingGuildInvites,
  getSupabase,
  getGuildChatHistory,
  saveGuildMessage,
  // Guild Bank
  getGuildBank,
  depositCurrencyToBank,
  withdrawCurrencyFromBank,
  depositItemToBank,
  withdrawItemFromBank,
  depositPokemonToBank,
  withdrawPokemonFromBank,
  expandBankPokemonSlots,
  createBankRequest,
  fulfillBankRequest,
  cancelBankRequest,
  getBankRequests,
  getBankLogs,
  setBankPermission,
  setBankLimit,
  setPlayerBankOverride,
  removePlayerBankOverride
} from './db.js'
import { processTick, simulateGymBattle, checkEvolutions, calculateEvolutionStats, applyEvolution, createEvolutionEvent, recalculateStats } from './game.js'

interface Client {
  ws: WebSocket
  userId: string
  session: PlayerSession | null
}

const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']
const MAX_CHAT_LENGTH = 280

// Whisper rate limiting and storage constants
const MAX_WHISPER_HISTORY = 100
const WHISPER_RATE_LIMIT = 10 // Max whispers per window
const WHISPER_RATE_WINDOW_MS = 10000 // 10 second window

// Create JWKS client for Supabase ES256 tokens
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

// Track ready states for trades (trade_id -> { sender_ready, receiver_ready })
interface TradeReadyState {
  sender_ready: boolean
  receiver_ready: boolean
}

export class GameHub {
  private wss: WebSocketServer
  private clients: Map<WebSocket, Client> = new Map()
  // Reverse index for O(1) player ID lookups (maintained in connect/disconnect)
  private clientsByPlayerId: Map<string, Client> = new Map()
  private speciesMap: Map<number, PokemonSpecies> = new Map()
  private tickInterval: NodeJS.Timeout | null = null
  private presenceInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null
  private tradeReadyStates: Map<string, TradeReadyState> = new Map()
  // Tracks trades currently being completed to prevent double-completion race condition
  private tradesBeingCompleted: Set<string> = new Set()
  // In-memory whisper storage (session only, no DB persistence)
  private whisperHistory: Map<string, WhisperMessage[]> = new Map()
  // Whisper rate limiting: playerId -> timestamps of recent whispers
  private whisperRateLimits: Map<string, number[]> = new Map()

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req))

    console.log(`WebSocket server running on port ${port}`)
  }

  async start() {
    // Load all species data for evolution lookups
    // Evolution targets (like Ivysaur) may not appear in encounter tables,
    // so we load all species upfront to support evolution checks
    const allSpecies = await getAllSpecies()
    for (const species of allSpecies) {
      this.speciesMap.set(species.id, species)
    }
    console.log(`Loaded ${allSpecies.length} species for evolution lookups`)

    // Start tick loop (1 second)
    this.tickInterval = setInterval(() => this.processTicks(), 1000)

    // Update presence every 60 seconds
    this.presenceInterval = setInterval(() => this.updatePresence(), 60000)

    // Periodic cleanup of rate limit maps (every 5 minutes)
    // Removes entries for disconnected players to prevent memory leak
    this.cleanupInterval = setInterval(() => this.cleanupRateLimits(), 300000)
  }

  // Clean up rate limit entries for players who are no longer connected
  private async cleanupRateLimits() {
    const connectedPlayerIds = new Set(
      Array.from(this.clients.values())
        .filter(c => c.session)
        .map(c => c.session!.player.id)
    )

    // Remove rate limit entries for disconnected players
    for (const playerId of this.whisperRateLimits.keys()) {
      if (!connectedPlayerIds.has(playerId)) {
        this.whisperRateLimits.delete(playerId)
      }
    }

    // Also clean up whisper history for disconnected players
    for (const playerId of this.whisperHistory.keys()) {
      if (!connectedPlayerIds.has(playerId)) {
        this.whisperHistory.delete(playerId)
      }
    }

    // Clean up trade ready states for trades where both players are offline
    // or for trades that no longer exist in the database
    for (const tradeId of this.tradeReadyStates.keys()) {
      // Check if any client has this trade as active
      let tradeStillActive = false
      for (const client of this.clients.values()) {
        if (client.session?.activeTrade?.trade_id === tradeId) {
          tradeStillActive = true
          break
        }
      }
      if (!tradeStillActive) {
        this.tradeReadyStates.delete(tradeId)
      }
    }

    // Clean up trades being completed set (should be empty normally, but just in case)
    // Only keep entries for actually connected players with active trades
    for (const tradeId of this.tradesBeingCompleted) {
      let tradeStillActive = false
      for (const client of this.clients.values()) {
        if (client.session?.activeTrade?.trade_id === tradeId) {
          tradeStillActive = true
          break
        }
      }
      if (!tradeStillActive) {
        this.tradesBeingCompleted.delete(tradeId)
      }
    }
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
    }
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.wss.close()
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Get token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Missing token')
      return
    }

    // Validate JWT
    const userId = await this.validateToken(token)
    if (!userId) {
      ws.close(4002, 'Invalid token')
      return
    }

    const client: Client = { ws, userId, session: null }
    this.clients.set(ws, client)

    console.log(`Client connected: ${userId}`)

    // Load session
    try {
      await this.loadSession(client)
      // Add to reverse index for O(1) player lookups
      if (client.session) {
        this.clientsByPlayerId.set(client.session.player.id, client)
      }
      await this.sendGameState(client)
      await this.sendChatHistory(client)
      await this.sendFriendsData(client)
      await this.sendTradesData(client)
      await this.sendGuildData(client)
      // Notify other players in the zone that this player joined
      if (client.session) {
        this.broadcastNearbyPlayersToZone(client.session.zone.id)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
      ws.close(4003, 'Failed to load session')
      return
    }

    ws.on('message', (data) => this.handleMessage(client, data.toString()))
    ws.on('close', () => this.handleDisconnect(client))
    ws.on('error', (err) => console.error('WebSocket error:', err))
  }

  private async validateToken(token: string): Promise<string | null> {
    try {
      // Use jose to verify ES256 tokens with Supabase JWKs
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${SUPABASE_URL}/auth/v1`,
      })

      const userId = payload.sub
      if (!userId) {
        console.error('Token missing sub claim')
        return null
      }

      console.log('Token verified successfully for user:', userId)
      return userId
    } catch (err) {
      console.error('Token validation failed:', err)
      return null
    }
  }

  private async loadSession(client: Client) {
    const player = await getPlayerByUserId(client.userId)
    if (!player) {
      throw new Error('Player not found')
    }

    const [party, zone, pokeballs, great_balls, encounterTable, guildInfo] = await Promise.all([
      getPlayerParty(player.id),
      getZone(player.current_zone_id),
      getPlayerPokeballs(player.id),
      getPlayerGreatBalls(player.id),
      getEncounterTable(player.current_zone_id),
      getPlayerGuild(player.id)
    ])

    if (!zone) {
      throw new Error('Zone not found')
    }

    // Cache species data from encounter table
    for (const entry of encounterTable) {
      if (entry.species) {
        this.speciesMap.set(entry.species_id, entry.species)
      }
    }

    // Cache species data from party Pokemon
    for (const pokemon of party) {
      if (pokemon?.species) {
        this.speciesMap.set(pokemon.species_id, pokemon.species)
      }
    }

    client.session = {
      player,
      party,
      zone,
      pokeballs,
      great_balls,
      tickNumber: 0,
      encounterTable,
      pokedollars: player.pokedollars,
      encounterCooldown: 0,
      pendingEvolutions: [],
      suppressedEvolutions: new Set(),
      guild: guildInfo || undefined
    }

    // Update last_online immediately on connect so friends see us as online right away
    await updatePlayerLastOnline(player.id)
  }

  private handleMessage(client: Client, data: string) {
    try {
      const msg: WSMessage = JSON.parse(data)

      switch (msg.type) {
        case 'move_zone':
          this.handleMoveZone(client, msg.payload as { zone_id: number })
          break
        case 'swap_party':
          this.handleSwapParty(client, msg.payload as { box_pokemon_id: string; party_slot: number })
          break
        case 'remove_from_party':
          this.handleRemoveFromParty(client, msg.payload as { party_slot: number })
          break
        case 'buy_item':
          this.handleBuyItem(client, msg.payload as { item_id: string; quantity: number })
          break
        case 'get_shop':
          this.handleGetShop(client)
          break
        case 'get_gym':
          this.handleGetGym(client, msg.payload as { zone_id: number })
          break
        case 'challenge_gym':
          this.handleChallengeGym(client, msg.payload as { gym_leader_id: string })
          break
        case 'get_state':
          this.sendGameState(client)
          break
        case 'debug_levelup':
          // Only allow in development environment
          if (process.env.NODE_ENV === 'development') {
            this.handleDebugLevelUp(client, msg.payload as { pokemon_id?: string; levels?: number })
          } else {
            this.sendError(client, 'Debug commands are not available in production')
          }
          break
        case 'chat_message':
          this.handleChatMessage(client, msg.payload as { channel: ChatChannel; content: string })
          break
        case 'use_potion':
          this.handleUsePotion(client, msg.payload as { pokemon_id: string; item_id: string })
          break
        case 'heal_at_pokecenter':
          this.handleHealAtPokeCenter(client)
          break
        case 'send_friend_request':
          this.handleSendFriendRequest(client, msg.payload as { username: string })
          break
        case 'accept_friend_request':
          this.handleAcceptFriendRequest(client, msg.payload as { friend_id: string })
          break
        case 'decline_friend_request':
          this.handleDeclineFriendRequest(client, msg.payload as { friend_id: string })
          break
        case 'remove_friend':
          this.handleRemoveFriend(client, msg.payload as { friend_id: string })
          break
        case 'get_friends':
          this.handleGetFriends(client)
          break
        case 'get_nearby_players':
          this.handleGetNearbyPlayers(client)
          break
        case 'send_trade_request':
          this.handleSendTradeRequest(client, msg.payload as { player_id: string })
          break
        case 'accept_trade_request':
          this.handleAcceptTradeRequest(client, msg.payload as { trade_id: string })
          break
        case 'decline_trade_request':
          this.handleDeclineTradeRequest(client, msg.payload as { trade_id: string })
          break
        case 'cancel_trade_request':
          this.handleCancelTradeRequest(client, msg.payload as { trade_id: string })
          break
        case 'get_trades':
          this.handleGetTrades(client)
          break
        case 'add_trade_offer':
          this.handleAddTradeOffer(client, msg.payload as { trade_id: string; pokemon_id: string })
          break
        case 'remove_trade_offer':
          this.handleRemoveTradeOffer(client, msg.payload as { trade_id: string; pokemon_id: string })
          break
        case 'complete_trade':
          this.handleCompleteTrade(client, msg.payload as { trade_id: string })
          break
        case 'get_trade_offers':
          this.handleGetTradeOffers(client, msg.payload as { trade_id: string })
          break
        case 'set_trade_ready':
          this.handleSetTradeReady(client, msg.payload as { trade_id: string; ready: boolean })
          break
        case 'get_trade_history':
          this.handleGetTradeHistory(client, msg.payload as { limit?: number; partner_username?: string })
          break
        case 'get_museum':
          this.handleGetMuseum(client)
          break
        case 'buy_museum_membership':
          this.handleBuyMuseumMembership(client)
          break
        case 'confirm_evolution':
          this.handleConfirmEvolution(client, msg.payload as { pokemon_id: string })
          break
        case 'cancel_evolution':
          this.handleCancelEvolution(client, msg.payload as { pokemon_id: string })
          break
        // Whisper handlers (Issue #45)
        case 'send_whisper':
          this.handleSendWhisper(client, msg.payload as { to_username: string; content: string })
          break
        case 'get_whisper_history':
          this.handleGetWhisperHistory(client)
          break
        // Block handlers (Issue #47)
        case 'block_player':
          this.handleBlockPlayer(client, msg.payload as { username: string })
          break
        case 'unblock_player':
          this.handleUnblockPlayer(client, msg.payload as { player_id: string })
          break
        case 'get_blocked_players':
          this.handleGetBlockedPlayers(client)
          break
        case 'get_leaderboard':
          this.handleGetLeaderboard(client, msg.payload as { type: LeaderboardType; timeframe: LeaderboardTimeframe })
          break
        // Guild handlers
        case 'create_guild':
          this.handleCreateGuild(client, msg.payload as CreateGuildPayload)
          break
        case 'join_guild':
          this.handleJoinGuild(client, msg.payload as JoinGuildPayload)
          break
        case 'leave_guild':
          this.handleLeaveGuild(client)
          break
        case 'get_guild':
          this.handleGetGuild(client)
          break
        case 'get_guild_members':
          this.handleGetGuildMembers(client)
          break
        case 'search_guilds':
          this.handleSearchGuilds(client, msg.payload as SearchGuildsPayload)
          break
        // Guild role management handlers
        case 'promote_member':
          this.handlePromoteMember(client, msg.payload as PromoteMemberPayload)
          break
        case 'demote_member':
          this.handleDemoteMember(client, msg.payload as DemoteMemberPayload)
          break
        case 'kick_member':
          this.handleKickMember(client, msg.payload as KickMemberPayload)
          break
        case 'transfer_leadership':
          this.handleTransferLeadership(client, msg.payload as TransferLeadershipPayload)
          break
        case 'disband_guild':
          this.handleDisbandGuild(client, msg.payload as DisbandGuildPayload)
          break
        // Guild invite handlers
        case 'guild_invite_send':
          this.handleSendGuildInvite(client, msg.payload as SendGuildInvitePayload)
          break
        case 'guild_invite_accept':
          this.handleAcceptGuildInvite(client, msg.payload as AcceptGuildInvitePayload)
          break
        case 'guild_invite_decline':
          this.handleDeclineGuildInvite(client, msg.payload as DeclineGuildInvitePayload)
          break
        case 'guild_invite_cancel':
          this.handleCancelGuildInvite(client, msg.payload as CancelGuildInvitePayload)
          break
        case 'get_guild_invites':
          this.handleGetGuildInvites(client)
          break
        case 'get_guild_outgoing_invites':
          this.handleGetOutgoingGuildInvites(client)
          break
        // Guild Bank handlers
        case 'get_guild_bank':
          this.handleGetGuildBank(client)
          break
        case 'deposit_currency':
          this.handleDepositCurrency(client, msg.payload as DepositCurrencyPayload)
          break
        case 'withdraw_currency':
          this.handleWithdrawCurrency(client, msg.payload as WithdrawCurrencyPayload)
          break
        case 'deposit_item':
          this.handleDepositItem(client, msg.payload as DepositItemPayload)
          break
        case 'withdraw_item':
          this.handleWithdrawItem(client, msg.payload as WithdrawItemPayload)
          break
        case 'deposit_pokemon':
          this.handleDepositPokemon(client, msg.payload as DepositPokemonPayload)
          break
        case 'withdraw_pokemon':
          this.handleWithdrawPokemon(client, msg.payload as WithdrawPokemonPayload)
          break
        case 'expand_pokemon_slots':
          this.handleExpandPokemonSlots(client)
          break
        case 'create_bank_request':
          this.handleCreateBankRequest(client, msg.payload as CreateBankRequestPayload)
          break
        case 'fulfill_bank_request':
          this.handleFulfillBankRequest(client, msg.payload as FulfillBankRequestPayload)
          break
        case 'cancel_bank_request':
          this.handleCancelBankRequest(client, msg.payload as CancelBankRequestPayload)
          break
        case 'get_bank_requests':
          this.handleGetBankRequests(client, msg.payload as GetBankRequestsPayload)
          break
        case 'get_bank_logs':
          this.handleGetBankLogs(client, msg.payload as GetBankLogsPayload)
          break
        case 'set_bank_permission':
          this.handleSetBankPermission(client, msg.payload as SetBankPermissionPayload)
          break
        case 'set_bank_limit':
          this.handleSetBankLimit(client, msg.payload as SetBankLimitPayload)
          break
        case 'set_player_override':
          this.handleSetPlayerOverride(client, msg.payload as SetPlayerOverridePayload)
          break
        case 'remove_player_override':
          this.handleRemovePlayerOverride(client, msg.payload as RemovePlayerOverridePayload)
          break
        default:
          console.log('Unknown message type:', msg.type)
      }
    } catch (err) {
      console.error('Failed to handle message:', err)
    }
  }

  private async handleDisconnect(client: Client) {
    console.log(`Client disconnected: ${client.userId}`)

    // Clean up trade ready states for any active trades this player was in
    // Use Promise.all to ensure all notifications complete before removing client
    // Inner try-catch ensures one failure doesn't stop other cleanups
    if (client.session) {
      const playerId = client.session.player.id
      try {
        const activeTradeIds = await getActiveTradeIds(playerId)
        await Promise.all(activeTradeIds.map(async (tradeId) => {
          try {
            // Get trade details to find the partner
            const trade = await this.getTradeById(tradeId)
            if (trade) {
              // Clean up ready state
              this.tradeReadyStates.delete(tradeId)

              // Notify the other player that their trade partner disconnected
              const otherPlayerId = trade.sender_id === playerId ? trade.receiver_id : trade.sender_id
              const otherClient = this.getClientByPlayerId(otherPlayerId)
              if (otherClient) {
                this.send(otherClient, 'trade_partner_disconnected', {
                  trade_id: tradeId,
                  message: 'Your trade partner disconnected'
                })
              }
            }
          } catch (err) {
            console.error(`Failed to clean up trade ${tradeId} on disconnect:`, err)
          }
        }))
      } catch (err) {
        console.error('Failed to get active trades on disconnect:', err)
      }
    }

    // Store zone ID before cleanup for broadcasting
    const zoneId = client.session?.zone.id

    // Remove from reverse index before removing from clients map
    if (client.session) {
      this.clientsByPlayerId.delete(client.session.player.id)
      // Clear whisper history and rate limits to prevent memory leak
      this.whisperHistory.delete(client.session.player.id)
      this.whisperRateLimits.delete(client.session.player.id)
    }

    // Always remove client from map, even if cleanup failed
    this.clients.delete(client.ws)

    // Notify remaining players in the zone that this player left
    if (zoneId) {
      this.broadcastNearbyPlayersToZone(zoneId)
    }
  }

  private isValidChatChannel(channel: unknown): channel is ChatChannel {
    return typeof channel === 'string' && CHAT_CHANNELS.includes(channel as ChatChannel)
  }

  private async handleChatMessage(client: Client, payload: { channel?: ChatChannel; content?: string }) {
    if (!client.session) return

    const { channel, content } = payload || {}
    if (!channel || !this.isValidChatChannel(channel) || channel === 'system') {
      this.sendError(client, 'Invalid chat channel')
      return
    }

    const trimmedContent = (content ?? '').trim()
    if (!trimmedContent) {
      this.sendError(client, 'Message cannot be empty')
      return
    }

    const safeContent = trimmedContent.slice(0, MAX_CHAT_LENGTH)

    // Guild channel requires special handling - private to guild members only
    if (channel === 'guild') {
      await this.handleGuildChatMessage(client, safeContent)
      return
    }

    // Regular channels (global, trade)
    const message = await saveChatMessage(client.session.player.id, channel, safeContent)

    if (!message) {
      this.sendError(client, 'Unable to send message')
      return
    }

    const payloadToSend = {
      ...message,
      player_name: message.player_name || client.session.player.username,
    }

    this.broadcast('chat_message', payloadToSend)
  }

  private async handleGuildChatMessage(client: Client, content: string) {
    if (!client.session) return

    // Verify player is in a guild
    const guild = client.session.guild
    if (!guild) {
      this.sendError(client, 'You must be in a guild to use guild chat')
      return
    }

    // Save message to guild_messages table
    const message = await saveGuildMessage(
      guild.id,
      client.session.player.id,
      client.session.player.username,
      guild.role,
      content
    )

    if (!message) {
      this.sendError(client, 'Unable to send guild message')
      return
    }

    // Broadcast to guild members only
    this.broadcastToGuild(guild.id, 'guild_chat_message', { message })
  }

  private broadcast(type: string, payload: unknown) {
    for (const [, client] of this.clients) {
      this.send(client, type, payload)
    }
  }

  // Broadcast message to all online members of a guild
  private broadcastToGuild(guildId: string, type: string, payload: unknown) {
    for (const [, client] of this.clients) {
      if (client.session?.guild?.id === guildId) {
        this.send(client, type, payload)
      }
    }
  }

  private async sendChatHistory(client: Client) {
    const messages = await getRecentChatMessages(50)
    const ordered = [...messages].reverse()
    this.send(client, 'chat_history', { messages: ordered })
  }

  private async sendFriendsData(client: Client) {
    if (!client.session) return

    const [friends, incoming, outgoing] = await Promise.all([
      getFriendsList(client.session.player.id),
      getIncomingFriendRequests(client.session.player.id),
      getOutgoingFriendRequests(client.session.player.id)
    ])

    this.send(client, 'friends_data', { friends, incoming, outgoing })
  }

  private async handleMoveZone(client: Client, payload: { zone_id: number }) {
    if (!client.session) return

    const oldZoneId = client.session.zone.id
    const connectedZones = await getConnectedZones(client.session.zone.id)
    const targetZone = connectedZones.find(z => z.id === payload.zone_id)

    if (!targetZone) {
      this.sendError(client, 'Cannot move to that zone')
      return
    }

    const newZone = await getZone(payload.zone_id)
    if (!newZone) {
      this.sendError(client, 'Zone not found')
      return
    }

    await updatePlayerZone(client.session.player.id, payload.zone_id)

    client.session.zone = newZone
    client.session.player.current_zone_id = payload.zone_id
    client.session.encounterTable = await getEncounterTable(payload.zone_id)

    // Auto-heal in towns
    if (newZone.zone_type === 'town') {
      for (const pokemon of client.session.party) {
        if (pokemon) {
          pokemon.current_hp = pokemon.max_hp
        }
      }
    }

    const newConnectedZones = await getConnectedZones(payload.zone_id)

    // Get nearby players in the new zone
    const nearbyPlayers = await getPlayersInZone(newZone.id, client.session.player.id)

    this.send(client, 'zone_update', {
      zone: newZone,
      connected_zones: newConnectedZones
    })

    // Send nearby players for the new zone
    this.send(client, 'nearby_players', { players: nearbyPlayers })

    // Notify online friends about zone change (Issue #14)
    this.notifyFriendsOfZoneChange(client, newZone)

    // Notify other players in both old and new zones about the change
    this.broadcastNearbyPlayersUpdate(oldZoneId, newZone.id)
  }

  // Broadcast updated nearby players to everyone in affected zones
  private async broadcastNearbyPlayersUpdate(oldZoneId: number, newZoneId: number) {
    for (const [, otherClient] of this.clients) {
      if (!otherClient.session) continue

      const theirZoneId = otherClient.session.zone.id
      if (theirZoneId === oldZoneId || theirZoneId === newZoneId) {
        const nearbyPlayers = await getPlayersInZone(theirZoneId, otherClient.session.player.id)
        this.send(otherClient, 'nearby_players', { players: nearbyPlayers })
      }
    }
  }

  // Broadcast updated nearby players to everyone in a single zone
  private async broadcastNearbyPlayersToZone(zoneId: number) {
    for (const [, otherClient] of this.clients) {
      if (!otherClient.session) continue

      if (otherClient.session.zone.id === zoneId) {
        const nearbyPlayers = await getPlayersInZone(zoneId, otherClient.session.player.id)
        this.send(otherClient, 'nearby_players', { players: nearbyPlayers })
      }
    }
  }

  // Notify online friends when a player changes zones (Issue #14)
  private async notifyFriendsOfZoneChange(client: Client, zone: Zone) {
    if (!client.session) return

    const playerId = client.session.player.id

    // Get this player's friends list
    const friends = await getFriendsList(playerId)
    if (friends.length === 0) return

    // Find which friends are online and notify them
    for (const [, otherClient] of this.clients) {
      if (!otherClient.session) continue

      // Skip self - don't notify the player who moved about their own zone change
      if (otherClient.session.player.id === playerId) continue

      // Check if this online user is a friend
      const isFriend = friends.some(
        f => f.friend_player_id === otherClient.session!.player.id ||
             f.player_id === otherClient.session!.player.id
      )

      if (isFriend) {
        this.send(otherClient, 'friend_zone_update', {
          player_id: playerId,
          zone_id: zone.id,
          zone_name: zone.name
        })
      }
    }
  }

  private async handleSwapParty(client: Client, payload: { box_pokemon_id: string; party_slot: number }) {
    if (!client.session) return

    if (payload.party_slot < 1 || payload.party_slot > 6) {
      this.sendError(client, 'Invalid party slot')
      return
    }

    const success = await swapPartyMember(
      client.session.player.id,
      payload.box_pokemon_id,
      payload.party_slot
    )

    if (!success) {
      this.sendError(client, 'Failed to swap party member')
      return
    }

    // Reload party and box
    client.session.party = await getPlayerParty(client.session.player.id)
    const box = await getPlayerBox(client.session.player.id)

    this.send(client, 'party_update', {
      party: client.session.party,
      box
    })
  }

  private async handleRemoveFromParty(client: Client, payload: { party_slot: number }) {
    if (!client.session) return

    if (payload.party_slot < 1 || payload.party_slot > 6) {
      this.sendError(client, 'Invalid party slot')
      return
    }

    // Make sure there's at least one other Pokemon in party
    const partyCount = client.session.party.filter(p => p !== null).length
    if (partyCount <= 1) {
      this.sendError(client, 'Cannot remove last Pokemon from party')
      return
    }

    const success = await removeFromParty(
      client.session.player.id,
      payload.party_slot
    )

    if (!success) {
      this.sendError(client, 'Failed to remove from party')
      return
    }

    // Reload party and box
    client.session.party = await getPlayerParty(client.session.player.id)
    const box = await getPlayerBox(client.session.player.id)

    this.send(client, 'party_update', {
      party: client.session.party,
      box
    })
  }

  private async handleBuyItem(client: Client, payload: { item_id: string; quantity: number }) {
    if (!client.session) return

    const { item_id, quantity } = payload

    if (quantity < 1 || quantity > 99) {
      this.sendError(client, 'Invalid quantity')
      return
    }

    const result = await buyItem(
      client.session.player.id,
      item_id,
      quantity,
      client.session.pokedollars
    )

    if (!result.success) {
      this.sendError(client, result.error || 'Purchase failed')
      return
    }

    // Update session money
    client.session.pokedollars = result.newMoney

    // Update pokeballs in session if bought pokeballs
    if (item_id === 'pokeball') {
      client.session.pokeballs = result.newQuantity
    }

    // Get full inventory
    const inventory = await getPlayerInventory(client.session.player.id)

    this.send(client, 'shop_purchase', {
      success: true,
      item_id,
      quantity,
      new_money: result.newMoney,
      inventory
    })
  }

  private async handleGetShop(client: Client) {
    if (!client.session) return

    const inventory = await getPlayerInventory(client.session.player.id)

    this.send(client, 'shop_data', {
      items: SHOP_ITEMS,
      money: client.session.pokedollars,
      inventory
    })
  }

  private async handleGetGym(client: Client, payload: { zone_id: number }) {
    if (!client.session) return

    const gymLeader = await getGymLeaderByZone(payload.zone_id)

    if (!gymLeader) {
      this.sendError(client, 'No gym in this zone')
      return
    }

    this.send(client, 'gym_data', gymLeader)
  }

  private async handleChallengeGym(client: Client, payload: { gym_leader_id: string }) {
    if (!client.session) return

    // Get gym leader data
    const gymLeader = await getGymLeaderByZone(client.session.zone.id)

    if (!gymLeader || gymLeader.id !== payload.gym_leader_id) {
      this.sendError(client, 'Invalid gym challenge')
      return
    }

    // Check if already defeated
    const alreadyDefeated = await hasPlayerDefeatedGym(client.session.player.id, gymLeader.id)

    // Simulate the battle
    const result = simulateGymBattle(
      client.session.party,
      gymLeader,
      this.speciesMap,
      alreadyDefeated
    )

    // Handle victory rewards
    if (result.success) {
      const maxLevel = Math.max(...client.session.party.filter(p => p).map(p => p!.level))

      // Record the victory
      await recordGymVictory(client.session.player.id, gymLeader.id, maxLevel)

      // Award badge and money (only on first victory)
      if (result.badge_earned && !alreadyDefeated) {
        await addBadgeToPlayer(client.session.player.id, result.badge_earned)

        if (result.money_earned) {
          client.session.pokedollars += result.money_earned
          await updatePlayerMoney(client.session.player.id, client.session.pokedollars)
        }
      }
    }

    this.send(client, 'gym_battle_result', result)
  }

  private async handleUsePotion(client: Client, payload: { pokemon_id: string; item_id: string }) {
    if (!client.session) return

    const { pokemon_id, item_id } = payload

    // Find the Pokemon in party
    const pokemon = client.session.party.find(p => p?.id === pokemon_id)
    if (!pokemon) {
      this.sendError(client, 'Pokemon not found in party')
      return
    }

    // Check if Pokemon needs healing
    if (pokemon.current_hp >= pokemon.max_hp) {
      this.sendError(client, 'Pokemon is already at full HP')
      return
    }

    // Get heal amount for this potion type
    const healAmount = getPotionHealAmount(item_id)
    if (healAmount === 0) {
      this.sendError(client, 'Invalid potion type')
      return
    }

    // Use the item from inventory (atomic operation with optimistic locking)
    const result = await useInventoryItem(client.session.player.id, item_id)
    if (!result.success) {
      this.sendError(client, result.error || 'Not enough potions')
      return
    }

    // Calculate new HP (clamped to max)
    const newHp = Math.min(pokemon.current_hp + healAmount, pokemon.max_hp)

    // Save to database - pass owner ID for security verification
    const hpUpdated = await updatePokemonHP(pokemon.id, newHp, client.session.player.id)
    if (!hpUpdated) {
      // Compensating transaction: refund the potion since HP update failed
      await addInventoryItem(client.session.player.id, item_id, 1)
      this.sendError(client, 'Failed to heal Pokemon, potion refunded')
      return
    }

    // Update in-memory state only after DB success
    pokemon.current_hp = newHp

    // Get updated inventory
    const inventory = await getPlayerInventory(client.session.player.id)

    this.send(client, 'potion_used', {
      success: true,
      pokemon_id,
      new_hp: newHp,
      max_hp: pokemon.max_hp,
      item_id,
      inventory
    })
  }

  private async handleHealAtPokeCenter(client: Client) {
    if (!client.session) return

    // Check if player is in a town
    if (client.session.zone.zone_type !== 'town') {
      this.sendError(client, 'You must be in a town to use the PokeCenter')
      return
    }

    // Collect Pokemon that need healing
    const pokemonToHeal = client.session.party.filter(
      (p): p is NonNullable<typeof p> => p !== null && p.current_hp < p.max_hp
    )

    if (pokemonToHeal.length === 0) {
      // All Pokemon already at full HP, still send success
      this.send(client, 'pokecenter_heal', {
        success: true,
        healed_pokemon: [],
        party: client.session.party
      })
      return
    }

    // Heal all Pokemon in parallel for better performance - pass owner ID for security
    const playerId = client.session.player.id
    const healResults = await Promise.all(
      pokemonToHeal.map(pokemon => updatePokemonHP(pokemon.id, pokemon.max_hp, playerId))
    )

    // Update in-memory state for successfully healed Pokemon (even if some failed)
    const healedPokemon: { id: string; new_hp: number }[] = []
    pokemonToHeal.forEach((pokemon, index) => {
      if (healResults[index]) {
        pokemon.current_hp = pokemon.max_hp
        healedPokemon.push({ id: pokemon.id, new_hp: pokemon.max_hp })
      }
    })

    // Report partial success if some Pokemon weren't healed
    const allSucceeded = healResults.every(result => result)
    if (!allSucceeded) {
      console.warn(`PokeCenter partial failure: healed ${healedPokemon.length}/${pokemonToHeal.length} Pokemon`)
    }

    this.send(client, 'pokecenter_heal', {
      success: healedPokemon.length > 0,
      healed_pokemon: healedPokemon,
      party: client.session.party,
      partial_failure: !allSucceeded
    })
  }

  private async processTicks() {
    for (const [, client] of this.clients) {
      if (!client.session) continue

      const result = processTick(client.session, this.speciesMap)

      // Handle catch attempt (save ball consumption regardless of success)
      if (result.encounter?.catch_result) {
        const catchResult = result.encounter.catch_result
        const wild = result.encounter.wild_pokemon

        // Handle successful catch - save Pokemon FIRST, then consume ball
        // This prevents losing balls if Pokemon save fails
        if (catchResult.success) {
          // Pass the entire wild Pokemon to transfer IVs and stats
          // Also pass the zone name as catch location
          const pokemon = await saveCaughtPokemon(
            client.session.player.id,
            wild,
            client.session.zone.name
          )
          if (pokemon) {
            // Pokemon saved successfully - now save ball consumption
            if (catchResult.ball_type === 'great_ball') {
              await updatePlayerGreatBalls(client.session.player.id, client.session.great_balls)
            } else {
              await updatePlayerPokeballs(client.session.player.id, client.session.pokeballs)
            }
            result.encounter.catch_result.pokemon_id = pokemon.id
            // Add the caught pokemon to the result so the client can add it to their box
            result.encounter.catch_result.caught_pokemon = {
              ...pokemon,
              species: wild.species
            }
            // Check if this is a new species BEFORE updating pokedex
            const previouslyCaught = await getCaughtSpeciesForPlayer(client.session.player.id, [wild.species_id])
            const isNewSpecies = previouslyCaught.size === 0

            await updatePokedex(client.session.player.id, wild.species_id, true)

            // Update weekly stats for catch (Issue #54)
            await updateWeeklyStats(client.session.player.id, {
              catches: 1,
              pokedex: isNewSpecies ? 1 : 0
            })
          } else {
            // Pokemon save failed - refund the ball in memory AND database
            // and mark catch as failed
            if (catchResult.ball_type === 'great_ball') {
              client.session.great_balls++
              await updatePlayerGreatBalls(client.session.player.id, client.session.great_balls)
            } else {
              client.session.pokeballs++
              await updatePlayerPokeballs(client.session.player.id, client.session.pokeballs)
            }
            catchResult.success = false
            console.error(`Failed to save caught Pokemon for player ${client.session.player.id}`)
          }
        } else {
          // Failed catch - save ball consumption
          if (catchResult.ball_type === 'great_ball') {
            await updatePlayerGreatBalls(client.session.player.id, client.session.great_balls)
          } else {
            await updatePlayerPokeballs(client.session.player.id, client.session.pokeballs)
          }
          // Mark as seen in pokedex
          await updatePokedex(client.session.player.id, wild.species_id, false)
        }
      } else if (result.encounter) {
        // Lost battle - mark as seen in pokedex
        await updatePokedex(client.session.player.id, result.encounter.wild_pokemon.species_id, false)
      }

      // Save level ups (stats changed) or XP gains
      const hasLevelUps = result.level_ups && result.level_ups.length > 0
      if (hasLevelUps) {
        for (const pokemon of client.session.party) {
          if (pokemon) {
            await updatePokemonStats(pokemon)
          }
        }

        // Update weekly stats with highest level achieved (Issue #54)
        const highestLevelUp = Math.max(...result.level_ups!.map(lu => lu.new_level))
        await updateWeeklyStats(client.session.player.id, {
          level: highestLevelUp
        })

        // Clear suppressed evolutions for any Pokemon that leveled up
        // This allows them to be prompted for evolution again
        for (const levelUp of result.level_ups!) {
          client.session.suppressedEvolutions.delete(levelUp.pokemon_id)
        }

        // Check for evolutions after level ups
        const pendingEvolutions = checkEvolutions(
          client.session.party,
          result.level_ups!,
          this.speciesMap,
          client.session.suppressedEvolutions
        )

        if (pendingEvolutions.length > 0) {
          // Filter out evolutions that are already pending (prevent duplicates across ticks)
          const existingPokemonIds = new Set(client.session.pendingEvolutions.map(e => e.pokemon_id))
          const newEvolutions = pendingEvolutions.filter(e => !existingPokemonIds.has(e.pokemon_id))

          if (newEvolutions.length > 0) {
            // Add to session's pending evolutions queue
            client.session.pendingEvolutions.push(...newEvolutions)
            // Include in tick result so client knows to show evolution modal
            result.pending_evolutions = newEvolutions
          }
        }
      } else if (result.xp_gained) {
        // Save XP gains to database (only if no level up, since level up saves full stats)
        for (const pokemon of client.session.party) {
          if (pokemon && result.xp_gained[pokemon.id]) {
            await savePokemonXP(pokemon.id, pokemon.xp)
          }
        }
      }

      // Save HP after battles (even without level-up)
      // This ensures battle damage persists across page reloads for ALL party members
      if (result.encounter) {
        for (const pokemon of client.session.party) {
          if (pokemon) {
            await updatePokemonHP(pokemon.id, pokemon.current_hp, client.session.player.id)
          }
        }
      }

      // Save money earned
      if (result.money_earned && result.money_earned > 0) {
        await updatePlayerMoney(client.session.player.id, client.session.pokedollars)
      }

      this.send(client, 'tick', result)
    }
  }

  private async updatePresence() {
    for (const [, client] of this.clients) {
      if (client.session) {
        await updatePlayerLastOnline(client.session.player.id)
      }
    }
  }

  private async sendGameState(client: Client) {
    if (!client.session) return

    // Always fetch fresh party and box data from database
    // This ensures we get updated data after trades, swaps, etc.
    const [party, connectedZones, box, inventory] = await Promise.all([
      getPlayerParty(client.session.player.id),
      getConnectedZones(client.session.zone.id),
      getPlayerBox(client.session.player.id),
      getPlayerInventory(client.session.player.id)
    ])

    // Update session with fresh party data
    client.session.party = party

    this.send(client, 'game_state', {
      player: client.session.player,
      party,
      zone: client.session.zone,
      connected_zones: connectedZones,
      pokeballs: client.session.pokeballs,
      pokedollars: client.session.pokedollars,
      box,
      inventory
    })
  }

  private async sendGuildData(client: Client) {
    if (!client.session) return

    if (!client.session.guild) {
      this.send(client, 'guild_data', { guild: null, members: [], my_role: null })
      return
    }

    const guild = await getGuildById(client.session.guild.id)
    if (!guild) {
      // Guild was deleted, clear session
      client.session.guild = undefined
      this.send(client, 'guild_data', { guild: null, members: [], my_role: null })
      return
    }

    const members = await getGuildMembers(guild.id)
    this.send(client, 'guild_data', {
      guild,
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      })),
      my_role: client.session.guild.role
    })

    // Also send guild chat history
    await this.sendGuildChatHistory(client)
  }

  private async sendGuildChatHistory(client: Client) {
    if (!client.session?.guild) return

    const messages = await getGuildChatHistory(client.session.guild.id, 100)
    this.send(client, 'guild_chat_history', { messages })
  }

  private send(client: Client, type: string, payload: unknown) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type, payload }))
    }
  }

  private sendError(client: Client, message: string) {
    this.send(client, 'error', { message })
  }

  // ============================================
  // FRIEND HANDLERS
  // ============================================

  private async handleSendFriendRequest(client: Client, payload: { username: string }) {
    if (!client.session) return

    const { username } = payload
    const trimmedUsername = username?.trim() || ''

    // Validate username format (must match schema constraints)
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      this.sendError(client, 'Username must be 3-20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      this.sendError(client, 'Invalid username format')
      return
    }

    // Can't friend yourself
    if (trimmedUsername.toLowerCase() === client.session.player.username.toLowerCase()) {
      this.sendError(client, 'Cannot send friend request to yourself')
      return
    }

    // Find the target player
    const targetPlayer = await getPlayerByUsername(trimmedUsername)
    if (!targetPlayer) {
      this.sendError(client, 'Player not found')
      return
    }

    // Check if either player has blocked the other
    const blocked = await isPlayerBlocked(client.session.player.id, targetPlayer.id)
    if (blocked) {
      this.sendError(client, 'Cannot send friend request to this player')
      return
    }

    // Send the friend request
    const result = await sendFriendRequest(client.session.player.id, targetPlayer.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to send request')
      return
    }

    // Notify the sender
    this.send(client, 'friend_request_sent', {
      success: true,
      username: targetPlayer.username
    })

    // Notify the recipient if they're online
    for (const [, otherClient] of this.clients) {
      if (otherClient.session?.player.id === targetPlayer.id) {
        this.send(otherClient, 'friend_request_received', {
          friend_id: result.friend_id,
          from_player_id: client.session.player.id,
          from_username: client.session.player.username,
          created_at: new Date().toISOString()
        })
        break
      }
    }
  }

  private async handleAcceptFriendRequest(client: Client, payload: { friend_id: string }) {
    if (!client.session) return

    const friend_id = payload?.friend_id
    if (!friend_id || typeof friend_id !== 'string') {
      this.sendError(client, 'Friend request ID is required')
      return
    }

    const result = await acceptFriendRequest(client.session.player.id, friend_id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to accept request')
      return
    }

    // Get updated friends list to send back
    const [friends, incoming, outgoing] = await Promise.all([
      getFriendsList(client.session.player.id),
      getIncomingFriendRequests(client.session.player.id),
      getOutgoingFriendRequests(client.session.player.id)
    ])

    this.send(client, 'friends_update', { friends, incoming, outgoing })

    // Notify the original sender if online
    const newFriend = friends.find(f => f.friend_id === friend_id)
    if (newFriend) {
      const senderId = newFriend.player_id === client.session.player.id
        ? newFriend.friend_player_id
        : newFriend.player_id

      for (const [, otherClient] of this.clients) {
        if (otherClient.session?.player.id === senderId) {
          const [theirFriends, theirIncoming, theirOutgoing] = await Promise.all([
            getFriendsList(senderId),
            getIncomingFriendRequests(senderId),
            getOutgoingFriendRequests(senderId)
          ])
          this.send(otherClient, 'friends_update', {
            friends: theirFriends,
            incoming: theirIncoming,
            outgoing: theirOutgoing
          })
          break
        }
      }
    }
  }

  private async handleDeclineFriendRequest(client: Client, payload: { friend_id: string }) {
    if (!client.session) return

    const friend_id = payload?.friend_id
    if (!friend_id || typeof friend_id !== 'string') {
      this.sendError(client, 'Friend request ID is required')
      return
    }

    const result = await declineFriendRequest(client.session.player.id, friend_id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to decline request')
      return
    }

    // Get updated lists
    const [incoming, outgoing] = await Promise.all([
      getIncomingFriendRequests(client.session.player.id),
      getOutgoingFriendRequests(client.session.player.id)
    ])

    this.send(client, 'friends_update', {
      friends: await getFriendsList(client.session.player.id),
      incoming,
      outgoing
    })
  }

  private async handleRemoveFriend(client: Client, payload: { friend_id: string }) {
    if (!client.session) return

    const friend_id = payload?.friend_id
    if (!friend_id || typeof friend_id !== 'string') {
      this.sendError(client, 'Friend ID is required')
      return
    }

    const result = await removeFriend(client.session.player.id, friend_id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to remove friend')
      return
    }

    // Get updated friends list
    const friends = await getFriendsList(client.session.player.id)

    this.send(client, 'friends_update', {
      friends,
      incoming: await getIncomingFriendRequests(client.session.player.id),
      outgoing: await getOutgoingFriendRequests(client.session.player.id)
    })
  }

  private async handleGetFriends(client: Client) {
    if (!client.session) return

    const [friends, incoming, outgoing] = await Promise.all([
      getFriendsList(client.session.player.id),
      getIncomingFriendRequests(client.session.player.id),
      getOutgoingFriendRequests(client.session.player.id)
    ])

    this.send(client, 'friends_data', { friends, incoming, outgoing })
  }

  // NEARBY PLAYERS HANDLER
  // ============================================

  private async handleGetNearbyPlayers(client: Client) {
    if (!client.session) return

    const zoneId = client.session.zone.id
    const playerId = client.session.player.id

    const nearbyPlayers = await getPlayersInZone(zoneId, playerId)

    this.send(client, 'nearby_players', { players: nearbyPlayers })
  }

  // ============================================
  // TRADE HANDLERS
  // ============================================

  // Check if a player is online
  private isPlayerOnline(playerId: string): boolean {
    for (const [, otherClient] of this.clients) {
      if (otherClient.session?.player.id === playerId) {
        return true
      }
    }
    return false
  }

  // Get client by player ID - O(1) lookup using reverse index
  private getClientByPlayerId(playerId: string): Client | null {
    return this.clientsByPlayerId.get(playerId) || null
  }

  // Get trade by ID with optional player validation
  // NOTE: This is a lightweight version that only fetches sender_id/receiver_id/status.
  // It's intentionally simpler than db.ts:getTrade() which includes username joins.
  // This version is optimized for hub operations that just need to identify trade parties.
  // SECURITY: Returns null if player is not part of the trade to prevent info leaks
  private async getTradeById(
    tradeId: string,
    playerId?: string
  ): Promise<{ trade_id: string; sender_id: string; receiver_id: string; status: string } | null> {
    const { getSupabase } = await import('./db.js')
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('trades')
      .select('trade_id, sender_id, receiver_id, status')
      .eq('trade_id', tradeId)
      .single()

    if (error || !data) return null

    // If playerId is provided, validate player is part of the trade
    if (playerId && data.sender_id !== playerId && data.receiver_id !== playerId) {
      return null // Return null to prevent info leak about trade existence
    }

    return data
  }

  private async handleSendTradeRequest(client: Client, payload: { player_id: string }) {
    if (!client.session) return

    const { player_id: receiverId } = payload
    if (!receiverId || typeof receiverId !== 'string') {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Can't trade with yourself
    if (receiverId === client.session.player.id) {
      this.sendError(client, 'Cannot trade with yourself')
      return
    }

    // Check if they are friends
    const areFriends = await arePlayersFriends(client.session.player.id, receiverId)
    if (!areFriends) {
      this.sendError(client, 'Can only trade with friends')
      return
    }

    // Check if the receiver is online
    if (!this.isPlayerOnline(receiverId)) {
      this.sendError(client, 'Player is not online')
      return
    }

    // Create the trade request
    const result = await createTradeRequest(client.session.player.id, receiverId)

    if (!result.success) {
      // If trade already pending, provide a more helpful error message
      if (result.error === 'Trade already pending with this player') {
        this.sendError(client, 'A trade is already active with this player. Check your Trades panel.')
      } else {
        this.sendError(client, result.error || 'Failed to send trade request')
      }
      return
    }

    // Notify the sender
    this.send(client, 'trade_request_sent', {
      success: true,
      trade_id: result.trade_id
    })

    // Notify the receiver if online
    const receiverClient = this.getClientByPlayerId(receiverId)
    if (receiverClient) {
      this.send(receiverClient, 'trade_request_received', {
        trade_id: result.trade_id,
        from_player_id: client.session.player.id,
        from_username: client.session.player.username,
        status: 'pending',
        created_at: new Date().toISOString()
      })
    }
  }

  private async handleAcceptTradeRequest(client: Client, payload: { trade_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId } = payload
    if (!tradeId || typeof tradeId !== 'string') {
      this.sendError(client, 'Trade ID is required')
      return
    }

    // Get the trade with player validation
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Verify this player is the receiver
    if (trade.receiver_id !== client.session.player.id) {
      this.sendError(client, 'Only receiver can accept trade')
      return
    }

    const result = await acceptTradeRequestDb(tradeId, client.session.player.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to accept trade request')
      return
    }

    // Get updated trade lists for the receiver (current client)
    const [incoming, outgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])

    this.send(client, 'trades_update', { incoming, outgoing })

    // Notify only the sender (not all clients)
    const senderClient = this.getClientByPlayerId(trade.sender_id)
    if (senderClient?.session) {
      const [senderIncoming, senderOutgoing] = await Promise.all([
        getIncomingTradeRequests(trade.sender_id),
        getOutgoingTradeRequests(trade.sender_id)
      ])
      this.send(senderClient, 'trades_update', {
        incoming: senderIncoming,
        outgoing: senderOutgoing
      })
    }
  }

  private async handleDeclineTradeRequest(client: Client, payload: { trade_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId } = payload
    if (!tradeId || typeof tradeId !== 'string') {
      this.sendError(client, 'Trade ID is required')
      return
    }

    // Get the trade with player validation
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Verify this player is the receiver
    if (trade.receiver_id !== client.session.player.id) {
      this.sendError(client, 'Only receiver can decline trade')
      return
    }

    const result = await declineTradeRequestDb(tradeId, client.session.player.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to decline trade request')
      return
    }

    // Clean up ready state to prevent memory leak
    this.tradeReadyStates.delete(tradeId)

    // Notify both players that trade was cancelled (so modal closes)
    this.send(client, 'trade_cancelled', { trade_id: tradeId })

    // Get updated trade lists for the receiver (current client)
    const [incoming, outgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])

    this.send(client, 'trades_update', { incoming, outgoing })

    // Notify only the sender (not all clients)
    const senderClient = this.getClientByPlayerId(trade.sender_id)
    if (senderClient?.session) {
      // Send trade_cancelled to close modal if open
      this.send(senderClient, 'trade_cancelled', { trade_id: tradeId })

      const [senderIncoming, senderOutgoing] = await Promise.all([
        getIncomingTradeRequests(trade.sender_id),
        getOutgoingTradeRequests(trade.sender_id)
      ])
      this.send(senderClient, 'trades_update', {
        incoming: senderIncoming,
        outgoing: senderOutgoing
      })
    }
  }

  private async handleCancelTradeRequest(client: Client, payload: { trade_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId } = payload
    if (!tradeId || typeof tradeId !== 'string') {
      this.sendError(client, 'Trade ID is required')
      return
    }

    // Get the trade with player validation
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Verify this player is the sender
    if (trade.sender_id !== client.session.player.id) {
      this.sendError(client, 'Only sender can cancel trade')
      return
    }

    const result = await cancelTradeRequest(tradeId, client.session.player.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to cancel trade request')
      return
    }

    // Clean up ready state to prevent memory leak
    this.tradeReadyStates.delete(tradeId)

    // Notify both players that trade was cancelled (so modal closes)
    this.send(client, 'trade_cancelled', { trade_id: tradeId })

    // Get updated trade lists for the sender (current client)
    const [incoming, outgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])

    this.send(client, 'trades_update', { incoming, outgoing })

    // Notify only the receiver (not all clients)
    const receiverClient = this.getClientByPlayerId(trade.receiver_id)
    if (receiverClient?.session) {
      // Send trade_cancelled to close modal if open
      this.send(receiverClient, 'trade_cancelled', { trade_id: tradeId })

      const [receiverIncoming, receiverOutgoing] = await Promise.all([
        getIncomingTradeRequests(trade.receiver_id),
        getOutgoingTradeRequests(trade.receiver_id)
      ])
      this.send(receiverClient, 'trades_update', {
        incoming: receiverIncoming,
        outgoing: receiverOutgoing
      })
    }
  }

  private async sendTradesData(client: Client) {
    if (!client.session) return

    const [incoming, outgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])

    this.send(client, 'trades_data', { incoming, outgoing })
  }

  private async handleGetTrades(client: Client) {
    // Reuse sendTradesData for explicit requests
    await this.sendTradesData(client)
  }

  private async handleAddTradeOffer(client: Client, payload: { trade_id: string; pokemon_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId, pokemon_id: pokemonId } = payload
    if (!tradeId || !pokemonId) {
      this.sendError(client, 'Trade ID and Pokemon ID are required')
      return
    }

    // Get the trade with player validation (validates participation)
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Allow offers on pending and accepted trades
    if (trade.status !== 'pending' && trade.status !== 'accepted') {
      this.sendError(client, 'Trade is no longer active')
      return
    }

    const result = await addTradeOffer(tradeId, pokemonId, client.session.player.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to add offer')
      return
    }

    // Reset ready states when offers change
    this.resetTradeReadyState(tradeId)

    // Send updated offers to both players (including warning to both)
    const offers = await getTradeOffers(tradeId)
    const updatePayload = {
      trade_id: tradeId,
      offers,
      warning: result.warning // Pass through party safety warning to both players
    }

    this.send(client, 'trade_offers_update', updatePayload)

    // Notify the other player with the same warning so they're aware
    const otherPlayerId = trade.sender_id === client.session.player.id ? trade.receiver_id : trade.sender_id
    const otherClient = this.getClientByPlayerId(otherPlayerId)
    if (otherClient?.session) {
      this.send(otherClient, 'trade_offers_update', updatePayload)

      // Also notify them of ready state reset
      this.send(otherClient, 'trade_ready_update', {
        trade_id: tradeId,
        my_ready: false,
        their_ready: false
      })
    }

    // Notify current client of ready state reset too
    this.send(client, 'trade_ready_update', {
      trade_id: tradeId,
      my_ready: false,
      their_ready: false
    })
  }

  private async handleRemoveTradeOffer(client: Client, payload: { trade_id: string; pokemon_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId, pokemon_id: pokemonId } = payload
    if (!tradeId || !pokemonId) {
      this.sendError(client, 'Trade ID and Pokemon ID are required')
      return
    }

    // Get the trade with player validation (validates participation)
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Allow removing offers on pending and accepted trades
    if (trade.status !== 'pending' && trade.status !== 'accepted') {
      this.sendError(client, 'Trade is no longer active')
      return
    }

    const result = await removeTradeOffer(tradeId, pokemonId, client.session.player.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to remove offer')
      return
    }

    // Reset ready states when offers change
    this.resetTradeReadyState(tradeId)

    // Send updated offers to both players
    const offers = await getTradeOffers(tradeId)
    this.send(client, 'trade_offers_update', { trade_id: tradeId, offers })

    // Notify the other player
    const otherPlayerId = trade.sender_id === client.session.player.id ? trade.receiver_id : trade.sender_id
    const otherClient = this.getClientByPlayerId(otherPlayerId)
    if (otherClient?.session) {
      this.send(otherClient, 'trade_offers_update', { trade_id: tradeId, offers })

      // Also notify them of ready state reset
      this.send(otherClient, 'trade_ready_update', {
        trade_id: tradeId,
        my_ready: false,
        their_ready: false
      })
    }

    // Notify current client of ready state reset too
    this.send(client, 'trade_ready_update', {
      trade_id: tradeId,
      my_ready: false,
      their_ready: false
    })
  }

  private async handleCompleteTrade(client: Client, payload: { trade_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId } = payload
    if (!tradeId) {
      this.sendError(client, 'Trade ID is required')
      return
    }

    // Get the trade with player validation
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Only allow the receiver to complete (they accepted, so they trigger completion)
    if (trade.receiver_id !== client.session.player.id) {
      this.sendError(client, 'Only the receiver can complete the trade')
      return
    }

    if (trade.status !== 'accepted') {
      this.sendError(client, 'Trade must be accepted before completing')
      return
    }

    const offers = await getTradeOffers(tradeId)

    // Complete the trade (transfers Pokemon)
    const result = await completeTrade(tradeId)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to complete trade')
      return
    }

    void this.updatePokedexForTradeWithOffers(
      offers,
      trade.sender_id,
      trade.receiver_id,
      tradeId
    ).catch(err => {
      console.error('Failed to update pokedex after trade:', err)
    })

    // Notify both players of completion
    this.send(client, 'trade_completed', {
      trade_id: tradeId,
      transferred_count: result.transferred_count
    })

    const senderClient = this.getClientByPlayerId(trade.sender_id)
    if (senderClient?.session) {
      this.send(senderClient, 'trade_completed', {
        trade_id: tradeId,
        transferred_count: result.transferred_count
      })
    }

    // Update trade lists for both players
    const [receiverIncoming, receiverOutgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])
    this.send(client, 'trades_update', { incoming: receiverIncoming, outgoing: receiverOutgoing })

    if (senderClient?.session) {
      const [senderIncoming, senderOutgoing] = await Promise.all([
        getIncomingTradeRequests(trade.sender_id),
        getOutgoingTradeRequests(trade.sender_id)
      ])
      this.send(senderClient, 'trades_update', { incoming: senderIncoming, outgoing: senderOutgoing })
    }

    // Send fresh game state to both players with updated Pokemon ownership
    // This ensures the UI updates immediately without requiring a page refresh
    await this.sendGameState(client)
    if (senderClient?.session) {
      await this.sendGameState(senderClient)
    }
  }

  private async handleGetTradeOffers(client: Client, payload: { trade_id: string }) {
    if (!client.session) return

    const { trade_id: tradeId } = payload
    if (!tradeId) {
      this.sendError(client, 'Trade ID is required')
      return
    }

    // Get the trade with player validation (validates participation)
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    const offers = await getTradeOffers(tradeId)
    this.send(client, 'trade_offers_data', { trade_id: tradeId, offers })
  }

  private async handleSetTradeReady(client: Client, payload: { trade_id: string; ready: boolean }) {
    if (!client.session) return

    const { trade_id: tradeId, ready } = payload
    if (!tradeId || ready === undefined) {
      this.sendError(client, 'Trade ID and ready status are required')
      return
    }

    // Get the trade with player validation
    const trade = await this.getTradeById(tradeId, client.session.player.id)
    if (!trade) {
      this.sendError(client, 'Trade not found')
      return
    }

    // Only allow ready toggling on accepted trades
    if (trade.status !== 'accepted') {
      this.sendError(client, 'Trade must be accepted before setting ready status')
      return
    }

    const playerId = client.session.player.id
    const isSender = trade.sender_id === playerId

    // Get or create ready state for this trade
    let readyState = this.tradeReadyStates.get(tradeId)
    if (!readyState) {
      readyState = { sender_ready: false, receiver_ready: false }
      this.tradeReadyStates.set(tradeId, readyState)
    }

    // Update the appropriate ready status
    if (isSender) {
      readyState.sender_ready = ready
    } else {
      readyState.receiver_ready = ready
    }

    // Notify both players of ready state changes
    const otherPlayerId = isSender ? trade.receiver_id : trade.sender_id
    const otherClient = this.getClientByPlayerId(otherPlayerId)

    // Send ready update to the current client
    this.send(client, 'trade_ready_update', {
      trade_id: tradeId,
      my_ready: isSender ? readyState.sender_ready : readyState.receiver_ready,
      their_ready: isSender ? readyState.receiver_ready : readyState.sender_ready
    })

    // Send ready update to the other client
    if (otherClient?.session) {
      this.send(otherClient, 'trade_ready_update', {
        trade_id: tradeId,
        my_ready: isSender ? readyState.receiver_ready : readyState.sender_ready,
        their_ready: isSender ? readyState.sender_ready : readyState.receiver_ready
      })
    }

    // If both players are ready, auto-complete the trade
    if (readyState.sender_ready && readyState.receiver_ready) {
      // CRITICAL: Use mutex to prevent double-completion race condition
      // where both players click ready simultaneously and both trigger completion
      if (this.tradesBeingCompleted.has(tradeId)) {
        console.log(`[Trade] Trade ${tradeId} completion already in progress, skipping`)
        return
      }
      this.tradesBeingCompleted.add(tradeId)
      this.tradeReadyStates.delete(tradeId)

      const offers = await getTradeOffers(tradeId)

      // Complete the trade
      const result = await completeTrade(tradeId)

      if (result.success) {
        void this.updatePokedexForTradeWithOffers(
          offers,
          trade.sender_id,
          trade.receiver_id,
          tradeId
        ).catch(err => {
          console.error('Failed to update pokedex after trade:', err)
        })

        // Notify both players of completion
        this.send(client, 'trade_completed', {
          trade_id: tradeId,
          transferred_count: result.transferred_count
        })

        if (otherClient?.session) {
          this.send(otherClient, 'trade_completed', {
            trade_id: tradeId,
            transferred_count: result.transferred_count
          })
        }

        // Update trade lists for both players
        const [currentIncoming, currentOutgoing] = await Promise.all([
          getIncomingTradeRequests(client.session.player.id),
          getOutgoingTradeRequests(client.session.player.id)
        ])
        this.send(client, 'trades_update', { incoming: currentIncoming, outgoing: currentOutgoing })

        if (otherClient?.session) {
          const [otherIncoming, otherOutgoing] = await Promise.all([
            getIncomingTradeRequests(otherPlayerId),
            getOutgoingTradeRequests(otherPlayerId)
          ])
          this.send(otherClient, 'trades_update', { incoming: otherIncoming, outgoing: otherOutgoing })
        }
      } else {
        // Trade failed - notify both players, they need to re-ready to retry
        // (we don't restore ready state because players should consciously confirm after failure)
        this.sendError(client, result.error || 'Failed to complete trade')

        // Notify both players to reset their ready states in UI
        this.send(client, 'trade_ready_update', {
          trade_id: tradeId,
          my_ready: false,
          their_ready: false
        })

        if (otherClient?.session) {
          this.send(otherClient, 'trade_ready_update', {
            trade_id: tradeId,
            my_ready: false,
            their_ready: false
          })
          this.sendError(otherClient, result.error || 'Failed to complete trade')
        }
      }

      // Clean up the completion mutex
      this.tradesBeingCompleted.delete(tradeId)
    }
  }

  private async updatePokedexForTradeWithOffers(
    offers: TradeOffer[],
    senderId: string,
    receiverId: string,
    tradeId: string
  ) {
    const senderReceivedSpecies = new Set<number>()
    const receiverReceivedSpecies = new Set<number>()

    for (const offer of offers) {
      const speciesId = offer.pokemon?.species_id
      if (!speciesId) {
        console.warn(`Missing species_id for offer ${offer.offer_id} in trade ${tradeId}`)
        continue
      }

      if (offer.offered_by === senderId) {
        receiverReceivedSpecies.add(speciesId)
      } else if (offer.offered_by === receiverId) {
        senderReceivedSpecies.add(speciesId)
      }
    }

    await Promise.all([
      this.markNewlyCaughtSpecies(receiverId, Array.from(receiverReceivedSpecies)),
      this.markNewlyCaughtSpecies(senderId, Array.from(senderReceivedSpecies))
    ])
  }

  private async markNewlyCaughtSpecies(playerId: string, speciesIds: number[]) {
    const uniqueSpeciesIds = Array.from(new Set(speciesIds))
    if (uniqueSpeciesIds.length === 0) {
      return
    }

    const caughtSpecies = await getCaughtSpeciesForPlayer(playerId, uniqueSpeciesIds)
    const newlyCaughtSpecies = uniqueSpeciesIds.filter(speciesId => !caughtSpecies.has(speciesId))

    await Promise.all(
      newlyCaughtSpecies.map(speciesId => updatePokedex(playerId, speciesId, true))
    )
  }

  // Helper to reset ready states when trade offers change
  // Only resets if state exists - don't create entries for non-existent/cancelled trades
  // to prevent memory growth from stale trade IDs
  private resetTradeReadyState(tradeId: string) {
    const readyState = this.tradeReadyStates.get(tradeId)
    if (readyState) {
      readyState.sender_ready = false
      readyState.receiver_ready = false
    }
    // Don't create if doesn't exist - this prevents memory leak from
    // offers being modified on cancelled/completed trades
  }

  private async handleGetTradeHistory(client: Client, payload: { limit?: number; partner_username?: string }) {
    if (!client.session) return

    try {
      const { limit = 50, partner_username } = payload || {}

      // Clamp limit to reasonable range
      const safeLimit = Math.min(Math.max(1, limit || 50), 100)

      const history = await getTradeHistory(client.session.player.id, safeLimit, partner_username)

      // Transform history to be relative to the requesting player
      // (my_pokemon = what I gave, their_pokemon = what I received)
      const playerId = client.session.player.id
      const transformedHistory = history.map(entry => {
        const isPlayer1 = entry.player1_id === playerId
        return {
          id: entry.id,
          trade_id: entry.trade_id,
          partner_id: isPlayer1 ? entry.player2_id : entry.player1_id,
          partner_username: isPlayer1 ? entry.player2_username : entry.player1_username,
          my_pokemon: isPlayer1 ? entry.player1_pokemon : entry.player2_pokemon,
          their_pokemon: isPlayer1 ? entry.player2_pokemon : entry.player1_pokemon,
          completed_at: entry.completed_at
        }
      })

      this.send(client, 'trade_history', { history: transformedHistory })
    } catch (err) {
      console.error('Failed to get trade history:', err)
      this.send(client, 'trade_history_error', { error: 'Failed to load trade history' })
    }
  }

  // ============================================
  // MUSEUM HANDLERS
  // ============================================

  // Museum exhibit data (static content)
  private readonly MUSEUM_EXHIBITS = [
    {
      id: 'dome_fossil',
      name: 'Dome Fossil',
      description: 'An ancient Pokemon fossil. The Pokemon seems to have been a shellfish-like creature.',
      icon: '🪨'
    },
    {
      id: 'helix_fossil',
      name: 'Helix Fossil',
      description: 'An ancient Pokemon fossil. The spiral shape is characteristic of shellfish.',
      icon: '🐚'
    },
    {
      id: 'old_amber',
      name: 'Old Amber',
      description: 'A piece of amber containing what appears to be ancient Pokemon DNA. Scientists are working to extract it...',
      icon: '🟠'
    },
    {
      id: 'moon_stone',
      name: 'Moon Stone Display',
      description: 'A peculiar stone that fell from space. It is said to hold the power to evolve certain Pokemon.',
      icon: '🌙'
    }
  ]

  private async handleGetMuseum(client: Client) {
    if (!client.session) return

    try {
      const playerId = client.session.player.id
      const hasMembership = await getMuseumMembership(playerId)

      if (hasMembership) {
        // Member: show exhibits
        this.send(client, 'museum_data', {
          has_membership: true,
          exhibits: this.MUSEUM_EXHIBITS
        })
      } else {
        // Non-member: show purchase prompt
        this.send(client, 'museum_data', {
          has_membership: false,
          cost: 50,
          player_money: client.session.player.pokedollars
        })
      }
    } catch (err) {
      console.error('Failed to get museum data:', err)
      this.send(client, 'museum_error', { error: 'Failed to load museum' })
    }
  }

  private async handleBuyMuseumMembership(client: Client) {
    if (!client.session) return

    try {
      const playerId = client.session.player.id
      const currentMoney = client.session.player.pokedollars

      const result = await purchaseMuseumMembership(playerId, currentMoney)

      if (result.success) {
        // Update session state
        client.session.player.pokedollars = result.newMoney

        // Send success with exhibits
        this.send(client, 'museum_membership_purchased', {
          success: true,
          new_money: result.newMoney,
          exhibits: this.MUSEUM_EXHIBITS
        })
      } else {
        this.send(client, 'museum_membership_error', { error: result.error || 'Failed to purchase membership' })
      }
    } catch (err) {
      console.error('Failed to buy museum membership:', err)
      this.send(client, 'museum_membership_error', { error: 'Failed to purchase membership' })
    }
  }

  // ============================================
  // EVOLUTION HANDLERS
  // ============================================

  private async handleConfirmEvolution(client: Client, payload: unknown) {
    if (!client.session) return

    // Validate input payload
    if (!payload || typeof payload !== 'object' || !('pokemon_id' in payload)) {
      this.send(client, 'evolution_error', { error: 'Invalid evolution confirmation request' })
      return
    }
    const { pokemon_id } = payload as { pokemon_id: unknown }
    if (typeof pokemon_id !== 'string' || !pokemon_id) {
      this.send(client, 'evolution_error', { error: 'Invalid pokemon_id' })
      return
    }

    // Find the pending evolution for this Pokemon
    const pendingIndex = client.session.pendingEvolutions.findIndex(
      e => e.pokemon_id === pokemon_id
    )
    if (pendingIndex === -1) {
      this.send(client, 'evolution_error', { error: 'No pending evolution for this Pokemon' })
      return
    }

    const pending = client.session.pendingEvolutions[pendingIndex]

    // Find the Pokemon in the party
    const pokemon = client.session.party.find(p => p?.id === pokemon_id)
    if (!pokemon) {
      this.send(client, 'evolution_error', { error: 'Pokemon not found in party' })
      return
    }

    // Get the target species
    const targetSpecies = this.speciesMap.get(pending.evolution_species_id)
    if (!targetSpecies) {
      this.send(client, 'evolution_error', { error: 'Evolution target species not found' })
      return
    }

    // Get the original species for potential rollback and name lookup
    const originalSpecies = this.speciesMap.get(pending.current_species_id)
    if (!originalSpecies) {
      this.send(client, 'evolution_error', { error: 'Original species data not found' })
      return
    }

    // SECURITY: Validate evolution chain - target must evolve FROM current species
    if (targetSpecies.evolves_from_species_id !== pokemon.species_id) {
      console.error('Invalid evolution chain:', {
        current: pokemon.species_id,
        target: targetSpecies.id,
        evolves_from: targetSpecies.evolves_from_species_id
      })
      this.send(client, 'evolution_error', { error: 'Invalid evolution chain' })
      return
    }

    // Re-validate level requirements (in case of race condition or stale data)
    if (targetSpecies.evolution_method === 'level' && targetSpecies.evolution_level !== null) {
      if (pokemon.level < targetSpecies.evolution_level) {
        this.send(client, 'evolution_error', { error: 'Pokemon no longer meets level requirements' })
        return
      }
    }

    // Calculate new stats BEFORE saving (don't modify Pokemon yet)
    const newStats = calculateEvolutionStats(pokemon, targetSpecies)

    console.log(`[Evolution Confirm] Pokemon ${pokemon_id}: species_id=${pokemon.species_id} -> ${targetSpecies.id}, owner=${client.session.player.id}`)
    console.log(`[Evolution Confirm] New stats:`, newStats)

    // Save evolution to database FIRST (before modifying in-memory state)
    // Include player ID for ownership verification (security)
    // Also include current species_id for optimistic locking (prevents double-evolution)
    const saved = await evolvePokemon(
      pokemon_id,
      client.session.player.id,
      pokemon.species_id, // Current species for optimistic locking
      targetSpecies.id,
      {
        max_hp: newStats.max_hp,
        stat_attack: newStats.attack,
        stat_defense: newStats.defense,
        stat_sp_attack: newStats.sp_attack,
        stat_sp_defense: newStats.sp_defense,
        stat_speed: newStats.speed
      }
    )

    console.log(`[Evolution Confirm] Database save result: ${saved}`)

    if (!saved) {
      console.error(`[Evolution Confirm] Failed to save evolution to database for pokemon ${pokemon_id}`)
      this.send(client, 'evolution_error', { error: 'Failed to save evolution. Please try again.' })
      return
    }

    // Database save succeeded - NOW update in-memory state
    console.log(`[Evolution Confirm] Party BEFORE applyEvolution:`, client.session.party.map(p => p ? { id: p.id, species_id: p.species_id } : null))
    applyEvolution(pokemon, targetSpecies, newStats)
    console.log(`[Evolution Confirm] Party AFTER applyEvolution:`, client.session.party.map(p => p ? { id: p.id, species_id: p.species_id } : null))
    console.log(`[Evolution Confirm] Pokemon object species_id=${pokemon.species_id}`)

    // Add evolved species to cache (in case it wasn't there)
    this.speciesMap.set(targetSpecies.id, targetSpecies)

    // Create event for client notification
    const evolutionEvent = createEvolutionEvent(pokemon, targetSpecies, originalSpecies, newStats)

    // Update session state
    // Remove from pending evolutions
    client.session.pendingEvolutions.splice(pendingIndex, 1)

    // Clear suppression since evolution completed
    client.session.suppressedEvolutions.delete(pokemon_id)

    // Update pokedex - mark evolved species as caught if newly obtained
    // Fire and forget - don't block evolution completion on pokedex update
    void this.markNewlyCaughtSpecies(client.session.player.id, [targetSpecies.id]).catch(err => {
      console.error('Failed to update pokedex after evolution:', err)
    })

    // Send evolution event to client
    this.send(client, 'evolution', evolutionEvent)
  }

  // DEBUG: Quick level up for testing evolutions
  private async handleDebugLevelUp(client: Client, payload: { pokemon_id?: string; levels?: number }) {
    if (!client.session) return

    const levels = payload.levels || 1
    const pokemon = payload.pokemon_id
      ? client.session.party.find(p => p?.id === payload.pokemon_id)
      : client.session.party.find(p => p !== null) // First Pokemon in party

    if (!pokemon) {
      this.sendError(client, 'No Pokemon found')
      return
    }

    const oldLevel = pokemon.level
    pokemon.level = Math.min(100, pokemon.level + levels)

    // Recalculate stats
    const species = this.speciesMap.get(pokemon.species_id)
    if (species) {
      recalculateStats(pokemon, species)
    }

    // Save to DB
    await updatePokemonStats(pokemon)

    console.log(`[DEBUG] Leveled up Pokemon ${pokemon.id} from ${oldLevel} to ${pokemon.level}`)

    // Check for evolutions
    const levelUps = [{
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.nickname || species?.name || 'Pokemon',
      new_level: pokemon.level,
      new_stats: {
        max_hp: pokemon.max_hp,
        attack: pokemon.stat_attack,
        defense: pokemon.stat_defense,
        sp_attack: pokemon.stat_sp_attack,
        sp_defense: pokemon.stat_sp_defense,
        speed: pokemon.stat_speed
      }
    }]

    const pendingEvolutions = checkEvolutions(
      client.session.party,
      levelUps,
      this.speciesMap,
      client.session.suppressedEvolutions
    )

    if (pendingEvolutions.length > 0) {
      // Filter duplicates
      const existingPokemonIds = new Set(client.session.pendingEvolutions.map(e => e.pokemon_id))
      const newEvolutions = pendingEvolutions.filter(e => !existingPokemonIds.has(e.pokemon_id))
      if (newEvolutions.length > 0) {
        client.session.pendingEvolutions.push(...newEvolutions)
      }
    }

    // Send updated state to client
    this.send(client, 'debug_levelup_result', {
      pokemon_id: pokemon.id,
      old_level: oldLevel,
      new_level: pokemon.level,
      pending_evolutions: pendingEvolutions
    })

    // Also send party update so UI refreshes
    this.send(client, 'party_update', {
      party: client.session.party,
      box: await getPlayerBox(client.session.player.id)
    })
  }

  private handleCancelEvolution(client: Client, payload: unknown) {
    if (!client.session) return

    // Validate input payload
    if (!payload || typeof payload !== 'object' || !('pokemon_id' in payload)) {
      this.send(client, 'evolution_error', { error: 'Invalid evolution cancel request' })
      return
    }
    const { pokemon_id } = payload as { pokemon_id: unknown }
    if (typeof pokemon_id !== 'string' || !pokemon_id) {
      this.send(client, 'evolution_error', { error: 'Invalid pokemon_id' })
      return
    }

    // Find the pending evolution for this Pokemon
    const pendingIndex = client.session.pendingEvolutions.findIndex(
      e => e.pokemon_id === pokemon_id
    )
    if (pendingIndex === -1) {
      this.send(client, 'evolution_error', { error: 'No pending evolution for this Pokemon' })
      return
    }

    // Remove from pending evolutions
    client.session.pendingEvolutions.splice(pendingIndex, 1)

    // Suppress future evolutions for this Pokemon until next level up
    client.session.suppressedEvolutions.add(pokemon_id)

    // Send cancellation acknowledgment
    this.send(client, 'evolution_cancelled', { pokemon_id })
  }

  // ============================================
  // WHISPER HANDLERS (Issue #45)
  // ============================================

  private async handleSendWhisper(client: Client, payload: { to_username?: string; content?: string }) {
    if (!client.session) return

    const { to_username, content } = payload || {}

    // Rate limiting check
    const playerId = client.session.player.id
    const now = Date.now()
    const recentWhispers = (this.whisperRateLimits.get(playerId) || [])
      .filter(ts => now - ts < WHISPER_RATE_WINDOW_MS)

    if (recentWhispers.length >= WHISPER_RATE_LIMIT) {
      this.sendError(client, 'Sending too many whispers. Please wait a moment.')
      return
    }

    // Record this whisper attempt
    this.whisperRateLimits.set(playerId, [...recentWhispers, now])

    // Validate input
    if (!to_username || typeof to_username !== 'string') {
      this.sendError(client, 'Recipient username is required')
      return
    }

    const trimmedContent = (content ?? '').trim()
    if (!trimmedContent) {
      this.sendError(client, 'Message cannot be empty')
      return
    }

    const safeContent = trimmedContent.slice(0, MAX_CHAT_LENGTH)

    // Can't whisper to yourself
    if (to_username.toLowerCase() === client.session.player.username.toLowerCase()) {
      this.sendError(client, 'Cannot whisper to yourself')
      return
    }

    // Find the target player
    const targetPlayer = await getPlayerByUsername(to_username)
    if (!targetPlayer) {
      this.sendError(client, 'Player not found')
      return
    }

    // Check if they are friends (whispers only to friends)
    const areFriends = await arePlayersFriends(client.session.player.id, targetPlayer.id)
    if (!areFriends) {
      this.sendError(client, 'Can only whisper to friends')
      return
    }

    // Check if either player has blocked the other
    const blocked = await isPlayerBlocked(client.session.player.id, targetPlayer.id)
    if (blocked) {
      this.sendError(client, 'Cannot whisper to this player')
      return
    }

    // Create the whisper message
    const whisper: WhisperMessage = {
      id: crypto.randomUUID(),
      from_player_id: client.session.player.id,
      from_username: client.session.player.username,
      to_player_id: targetPlayer.id,
      to_username: targetPlayer.username,
      content: safeContent,
      created_at: new Date().toISOString()
    }

    // Store in memory for both sender and recipient
    this.storeWhisper(client.session.player.id, whisper)
    this.storeWhisper(targetPlayer.id, whisper)

    // Send confirmation to sender
    this.send(client, 'whisper_sent', { success: true, message: whisper })

    // Send to recipient if online and WebSocket is in OPEN state
    const recipientClient = this.getClientByPlayerId(targetPlayer.id)
    if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
      this.send(recipientClient, 'whisper_received', whisper)
    }
  }

  private storeWhisper(playerId: string, whisper: WhisperMessage) {
    try {
      const history = this.whisperHistory.get(playerId) || []
      // Use slice for atomic array management to avoid race conditions
      const newHistory = [...history, whisper].slice(-MAX_WHISPER_HISTORY)
      this.whisperHistory.set(playerId, newHistory)
    } catch (err) {
      // Log but don't throw - whisper was still sent successfully
      console.error(`Failed to store whisper for player ${playerId}:`, err)
    }
  }

  private async handleGetWhisperHistory(client: Client) {
    if (!client.session) return

    const history = this.whisperHistory.get(client.session.player.id) || []

    // Filter out messages from/to blocked players
    const blockedPlayers = await getBlockedPlayers(client.session.player.id)
    const blockedIds = new Set(blockedPlayers.map(b => b.blocked_id))

    const filteredHistory = history.filter(msg =>
      !blockedIds.has(msg.from_player_id) && !blockedIds.has(msg.to_player_id)
    )

    this.send(client, 'whisper_history', { messages: filteredHistory })
  }

  // ============================================
  // BLOCK HANDLERS (Issue #47)
  // ============================================

  private async handleBlockPlayer(client: Client, payload: { username?: string }) {
    if (!client.session) return

    const { username } = payload || {}

    if (!username || typeof username !== 'string') {
      this.sendError(client, 'Username is required')
      return
    }

    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      this.sendError(client, 'Username is required')
      return
    }

    // Can't block yourself
    if (trimmedUsername.toLowerCase() === client.session.player.username.toLowerCase()) {
      this.sendError(client, 'Cannot block yourself')
      return
    }

    // Find the target player
    const targetPlayer = await getPlayerByUsername(trimmedUsername)
    if (!targetPlayer) {
      this.sendError(client, 'Player not found')
      return
    }

    // Block the player (this also removes friendship)
    const result = await blockPlayer(client.session.player.id, targetPlayer.id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to block player')
      return
    }

    // Send confirmation
    this.send(client, 'player_blocked', {
      success: true,
      blocked_id: targetPlayer.id,
      blocked_username: targetPlayer.username
    })

    // Refresh friends list (blocking removes friendship)
    await this.sendFriendsData(client)

    // Send updated blocked list
    await this.handleGetBlockedPlayers(client)
  }

  private async handleUnblockPlayer(client: Client, payload: { player_id?: string }) {
    if (!client.session) return

    const { player_id } = payload || {}

    if (!player_id || typeof player_id !== 'string') {
      this.sendError(client, 'Player ID is required')
      return
    }

    const result = await unblockPlayer(client.session.player.id, player_id)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to unblock player')
      return
    }

    // Send confirmation
    this.send(client, 'player_unblocked', { success: true, player_id })

    // Send updated blocked list
    await this.handleGetBlockedPlayers(client)
  }

  private async handleGetBlockedPlayers(client: Client) {
    if (!client.session) return

    const players = await getBlockedPlayers(client.session.player.id)
    this.send(client, 'blocked_players', { players })
  }

  // ============================================
  // LEADERBOARD HANDLERS (Issues #51-54)
  // ============================================

  private async handleGetLeaderboard(
    client: Client,
    payload: { type: LeaderboardType; timeframe: LeaderboardTimeframe }
  ) {
    if (!client.session) return

    const { type, timeframe } = payload

    // Validate input
    if (!['pokedex', 'catches', 'level'].includes(type)) {
      this.sendError(client, 'Invalid leaderboard type')
      return
    }
    if (!['alltime', 'weekly'].includes(timeframe)) {
      this.sendError(client, 'Invalid leaderboard timeframe')
      return
    }

    // Fetch leaderboard data
    const entries = await getLeaderboard(type, timeframe, 50)

    // Get player's own rank
    const playerRank = await getPlayerRank(
      client.session.player.id,
      type,
      timeframe
    )

    this.send(client, 'leaderboard_data', {
      type,
      timeframe,
      entries,
      playerRank
    })
  }

  // ============================================
  // GUILD HANDLERS
  // ============================================

  private async handleCreateGuild(client: Client, payload: CreateGuildPayload) {
    if (!client.session) return

    // Validate payload
    if (!payload.name || !payload.tag) {
      this.sendError(client, 'Name and tag are required')
      return
    }

    // Validate name length (2-32 chars as per database constraint)
    const trimmedName = payload.name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 32) {
      this.sendError(client, 'Guild name must be 2-32 characters')
      return
    }

    // Validate tag length (2-6 chars as per database constraint)
    const trimmedTag = payload.tag.trim().toUpperCase()
    if (trimmedTag.length < 2 || trimmedTag.length > 6) {
      this.sendError(client, 'Guild tag must be 2-6 characters')
      return
    }

    // Check not already in guild
    if (client.session.guild) {
      this.sendError(client, 'Already in a guild')
      return
    }

    const result = await createGuild(
      client.session.player.id,
      trimmedName,
      trimmedTag,
      payload.description?.trim()
    )

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Load full guild data
    const guild = await getGuildById(result.guild_id!)
    if (!guild) {
      this.sendError(client, 'Failed to load created guild')
      return
    }

    // Update session
    client.session.guild = {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      role: 'leader'
    }

    // Send guild data to creator
    const members = await getGuildMembers(guild.id)
    this.send(client, 'guild_data', {
      guild,
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      })),
      my_role: 'leader'
    })
  }

  private async handleJoinGuild(client: Client, payload: JoinGuildPayload) {
    if (!client.session) return

    if (!payload.guild_id) {
      this.sendError(client, 'Guild ID is required')
      return
    }

    if (client.session.guild) {
      this.sendError(client, 'Already in a guild')
      return
    }

    const result = await joinGuild(client.session.player.id, payload.guild_id)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Load guild data
    const guild = await getGuildById(payload.guild_id)
    if (!guild) {
      this.sendError(client, 'Failed to load guild')
      return
    }

    // Update session
    client.session.guild = {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      role: 'member'
    }

    // Notify existing guild members of new join
    this.broadcastToGuild(guild.id, 'guild_member_joined', {
      member: {
        id: '', // Guild member ID will be set by DB, not critical for display
        guild_id: guild.id,
        player_id: client.session.player.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        username: client.session.player.username,
        last_online: null,
        is_online: true
      }
    })

    // Send full guild data to joiner
    const members = await getGuildMembers(guild.id)
    this.send(client, 'guild_data', {
      guild,
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      })),
      my_role: 'member'
    })
  }

  private async handleLeaveGuild(client: Client) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    const guildId = client.session.guild.id
    const guildName = client.session.guild.name
    const username = client.session.player.username
    const playerId = client.session.player.id

    const result = await leaveGuild(playerId)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Clear session guild
    client.session.guild = undefined

    if (result.guild_disbanded) {
      // Notify the leaver that guild is disbanded (they were the only member)
      this.send(client, 'guild_disbanded', { guild_name: guildName })
    } else {
      // Notify remaining members
      this.broadcastToGuild(guildId, 'guild_member_left', {
        player_id: playerId,
        username: username
      })

      // Confirm to leaver
      this.send(client, 'guild_left', { success: true })
    }
  }

  private async handleGetGuild(client: Client) {
    if (!client.session) return

    if (!client.session.guild) {
      this.send(client, 'guild_data', { guild: null, members: [], my_role: null })
      return
    }

    const guild = await getGuildById(client.session.guild.id)
    if (!guild) {
      // Guild was deleted, clear session
      client.session.guild = undefined
      this.send(client, 'guild_data', { guild: null, members: [], my_role: null })
      return
    }

    const members = await getGuildMembers(guild.id)
    this.send(client, 'guild_data', {
      guild,
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      })),
      my_role: client.session.guild.role
    })
  }

  private async handleGetGuildMembers(client: Client) {
    if (!client.session?.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    const members = await getGuildMembers(client.session.guild.id)
    this.send(client, 'guild_members', {
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      }))
    })
  }

  private async handleSearchGuilds(client: Client, payload: SearchGuildsPayload) {
    if (!client.session) return

    const { guilds, total } = await searchGuilds(
      payload.query,
      payload.page || 1,
      payload.limit || 20
    )

    this.send(client, 'guild_list', {
      guilds,
      total,
      page: payload.page || 1
    })
  }

  // ============================================
  // GUILD ROLE MANAGEMENT HANDLERS
  // ============================================

  private async handlePromoteMember(client: Client, payload: PromoteMemberPayload) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    if (!payload.player_id) {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Get target member info before promotion (for notification)
    const targetMember = await getGuildMemberByPlayerId(payload.player_id)
    if (!targetMember) {
      this.sendError(client, 'Player not found in guild')
      return
    }

    const result = await promoteMember(client.session.player.id, payload.player_id)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Broadcast role change to all guild members
    this.broadcastToGuild(client.session.guild.id, 'guild_role_changed', {
      player_id: payload.player_id,
      username: targetMember.username,
      old_role: 'member' as GuildRole,
      new_role: 'officer' as GuildRole
    })

    // Update the promoted player's session if online
    this.updatePlayerGuildRole(payload.player_id, 'officer')
  }

  private async handleDemoteMember(client: Client, payload: DemoteMemberPayload) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    if (!payload.player_id) {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Get target member info before demotion (for notification)
    const targetMember = await getGuildMemberByPlayerId(payload.player_id)
    if (!targetMember) {
      this.sendError(client, 'Player not found in guild')
      return
    }

    const result = await demoteMember(client.session.player.id, payload.player_id)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Broadcast role change to all guild members
    this.broadcastToGuild(client.session.guild.id, 'guild_role_changed', {
      player_id: payload.player_id,
      username: targetMember.username,
      old_role: 'officer' as GuildRole,
      new_role: 'member' as GuildRole
    })

    // Update the demoted player's session if online
    this.updatePlayerGuildRole(payload.player_id, 'member')
  }

  private async handleKickMember(client: Client, payload: KickMemberPayload) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    if (!payload.player_id) {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Get target member info before kick (for notification)
    const targetMember = await getGuildMemberByPlayerId(payload.player_id)
    if (!targetMember) {
      this.sendError(client, 'Player not found in guild')
      return
    }

    const guildId = client.session.guild.id
    const kickerUsername = client.session.player.username

    const result = await kickMember(client.session.player.id, payload.player_id)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Broadcast kick to remaining guild members
    this.broadcastToGuild(guildId, 'guild_member_kicked', {
      player_id: payload.player_id,
      username: targetMember.username,
      kicked_by: kickerUsername
    })

    // Notify kicked player and clear their session guild
    const kickedClient = this.getClientByPlayerId(payload.player_id)
    if (kickedClient?.session) {
      kickedClient.session.guild = undefined
      this.send(kickedClient, 'guild_kicked', {
        kicked_by: kickerUsername,
        guild_name: client.session.guild.name
      })
    }
  }

  private async handleTransferLeadership(client: Client, payload: TransferLeadershipPayload) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    if (!payload.player_id) {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Get target member info
    const targetMember = await getGuildMemberByPlayerId(payload.player_id)
    if (!targetMember) {
      this.sendError(client, 'Player not found in guild')
      return
    }

    const result = await transferLeadership(client.session.player.id, payload.player_id)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Update old leader's session (current client)
    client.session.guild.role = 'officer'

    // Update new leader's session if online
    this.updatePlayerGuildRole(payload.player_id, 'leader')

    // Broadcast leadership transfer to all guild members
    // Send old leader role change
    this.broadcastToGuild(client.session.guild.id, 'guild_role_changed', {
      player_id: client.session.player.id,
      username: client.session.player.username,
      old_role: 'leader' as GuildRole,
      new_role: 'officer' as GuildRole
    })

    // Send new leader role change
    this.broadcastToGuild(client.session.guild.id, 'guild_role_changed', {
      player_id: payload.player_id,
      username: targetMember.username,
      old_role: targetMember.role as GuildRole,
      new_role: 'leader' as GuildRole
    })
  }

  private async handleDisbandGuild(client: Client, payload: DisbandGuildPayload) {
    if (!client.session) return

    if (!client.session.guild) {
      this.sendError(client, 'Not in a guild')
      return
    }

    if (!payload.confirmation) {
      this.sendError(client, 'Guild name confirmation is required')
      return
    }

    const guildId = client.session.guild.id

    // Collect all guild members before disbanding (for session cleanup)
    const memberPlayerIds: string[] = []
    for (const [, otherClient] of this.clients) {
      if (otherClient.session?.guild?.id === guildId) {
        memberPlayerIds.push(otherClient.session.player.id)
      }
    }

    const result = await disbandGuild(client.session.player.id, payload.confirmation)

    if (!result.success) {
      this.send(client, 'guild_error', { error: result.error })
      return
    }

    // Broadcast disband to all guild members and clear their sessions
    const guildName = result.guild_name || client.session.guild.name
    for (const playerId of memberPlayerIds) {
      const memberClient = this.getClientByPlayerId(playerId)
      if (memberClient?.session) {
        memberClient.session.guild = undefined
        this.send(memberClient, 'guild_disbanded', { guild_name: guildName })
      }
    }
  }

  // Helper: Update a player's guild role in their session
  private updatePlayerGuildRole(playerId: string, newRole: GuildRole) {
    const playerClient = this.getClientByPlayerId(playerId)
    if (playerClient?.session?.guild) {
      playerClient.session.guild.role = newRole
    }
  }

  // ============================================
  // GUILD INVITE HANDLERS
  // ============================================

  private async handleSendGuildInvite(client: Client, payload: SendGuildInvitePayload) {
    if (!client.session) return

    const targetPlayerId = payload?.player_id
    if (!targetPlayerId || typeof targetPlayerId !== 'string') {
      this.sendError(client, 'Player ID is required')
      return
    }

    // Check actor is in a guild and has invite permission
    if (!client.session.guild) {
      this.sendError(client, 'You are not in a guild')
      return
    }

    if (!['leader', 'officer'].includes(client.session.guild.role)) {
      this.sendError(client, 'Only leaders and officers can send invites')
      return
    }

    // Check if blocked (reuse existing pattern from friend requests)
    const blocked = await isPlayerBlocked(client.session.player.id, targetPlayerId)
    if (blocked) {
      this.sendError(client, 'Cannot send invite to this player')
      return
    }

    const result = await sendGuildInvite(client.session.player.id, targetPlayerId)

    if (!result.success) {
      this.send(client, 'guild_invite_error', { error: result.error })
      return
    }

    // Get target player username for notification
    const supabase = getSupabase()
    const { data: targetData } = await supabase
      .from('players')
      .select('username')
      .eq('id', targetPlayerId)
      .single()

    const targetUsername = targetData?.username || 'Unknown'

    // Notify sender
    this.send(client, 'guild_invite_sent', {
      success: true,
      player_id: targetPlayerId,
      player_username: targetUsername
    })

    // Notify target if online
    const targetClient = this.getClientByPlayerId(targetPlayerId)
    if (targetClient) {
      // Fetch current guild info for the notification
      const guild = await getGuildById(client.session.guild.id)
      this.send(targetClient, 'guild_invite_received', {
        invite_id: result.invite_id,
        guild_id: client.session.guild.id,
        guild_name: client.session.guild.name,
        guild_tag: client.session.guild.tag,
        member_count: guild?.member_count || 0,
        max_members: guild?.max_members || 50,
        invited_by_id: client.session.player.id,
        invited_by_username: client.session.player.username,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  private async handleAcceptGuildInvite(client: Client, payload: AcceptGuildInvitePayload) {
    if (!client.session) return

    const inviteId = payload?.invite_id
    if (!inviteId || typeof inviteId !== 'string') {
      this.sendError(client, 'Invite ID is required')
      return
    }

    // Check not already in a guild
    if (client.session.guild) {
      this.sendError(client, 'Already in a guild')
      return
    }

    const result = await acceptGuildInvite(client.session.player.id, inviteId)

    if (!result.success) {
      this.send(client, 'guild_invite_error', { error: result.error })
      return
    }

    // Load guild data for session update
    const guild = await getGuildById(result.guild_id!)
    if (!guild) {
      this.sendError(client, 'Failed to load guild')
      return
    }

    // Update session (same pattern as handleJoinGuild)
    client.session.guild = {
      id: guild.id,
      name: guild.name,
      tag: guild.tag,
      role: 'member'
    }

    // Send guild data to the new member
    const members = await getGuildMembers(guild.id)
    this.send(client, 'guild_data', {
      guild,
      members: members.map(m => ({
        ...m,
        is_online: this.isPlayerOnline(m.player_id)
      })),
      my_role: 'member'
    })

    // Notify sender of acceptance
    this.send(client, 'guild_invite_accepted', {
      guild_id: guild.id,
      guild_name: guild.name
    })

    // Broadcast to guild that a new member joined
    this.broadcastToGuild(guild.id, 'guild_member_joined', {
      member: {
        id: '', // Member record ID not needed for notification
        guild_id: guild.id,
        player_id: client.session.player.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        username: client.session.player.username,
        last_online: new Date().toISOString(),
        is_online: true
      }
    })
  }

  private async handleDeclineGuildInvite(client: Client, payload: DeclineGuildInvitePayload) {
    if (!client.session) return

    const inviteId = payload?.invite_id
    if (!inviteId || typeof inviteId !== 'string') {
      this.sendError(client, 'Invite ID is required')
      return
    }

    const result = await declineGuildInvite(client.session.player.id, inviteId)

    if (!result.success) {
      this.send(client, 'guild_invite_error', { error: result.error })
      return
    }

    // Confirm decline to client
    this.send(client, 'guild_invite_declined', { invite_id: inviteId })

    // Refresh their invite list
    const invites = await getIncomingGuildInvites(client.session.player.id)
    this.send(client, 'guild_invites_list', { invites })
  }

  private async handleCancelGuildInvite(client: Client, payload: CancelGuildInvitePayload) {
    if (!client.session) return

    const inviteId = payload?.invite_id
    if (!inviteId || typeof inviteId !== 'string') {
      this.sendError(client, 'Invite ID is required')
      return
    }

    // Check in guild with permission
    if (!client.session.guild) {
      this.sendError(client, 'You are not in a guild')
      return
    }

    if (!['leader', 'officer'].includes(client.session.guild.role)) {
      this.sendError(client, 'Only leaders and officers can cancel invites')
      return
    }

    const result = await cancelGuildInvite(client.session.player.id, inviteId)

    if (!result.success) {
      this.send(client, 'guild_invite_error', { error: result.error })
      return
    }

    // Confirm cancel to client
    this.send(client, 'guild_invite_cancelled', { invite_id: inviteId })

    // Refresh outgoing invites list
    const invites = await getOutgoingGuildInvites(client.session.guild.id)
    this.send(client, 'guild_outgoing_invites', { invites })
  }

  private async handleGetGuildInvites(client: Client) {
    if (!client.session) return

    const invites = await getIncomingGuildInvites(client.session.player.id)
    this.send(client, 'guild_invites_list', { invites })
  }

  private async handleGetOutgoingGuildInvites(client: Client) {
    if (!client.session) return

    if (!client.session.guild) {
      this.send(client, 'guild_outgoing_invites', { invites: [] })
      return
    }

    if (!['leader', 'officer'].includes(client.session.guild.role)) {
      this.send(client, 'guild_outgoing_invites', { invites: [] })
      return
    }

    const invites = await getOutgoingGuildInvites(client.session.guild.id)
    this.send(client, 'guild_outgoing_invites', { invites })
  }

  // ================================
  // Guild Bank Handlers
  // ================================

  private async handleGetGuildBank(client: Client) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const bank = await getGuildBank(client.session.player.id, client.session.guild.id)
    if (!bank) {
      this.send(client, 'guild_bank_error', { error: 'Failed to load bank' })
      return
    }

    this.send(client, 'guild_bank_data', { bank })
  }

  private async handleDepositCurrency(client: Client, payload: DepositCurrencyPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await depositCurrencyToBank(
      client.session.player.id,
      client.session.guild.id,
      payload.amount
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Deposit failed' })
      return
    }

    // Broadcast to guild
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_currency_updated', {
      balance: result.new_balance,
      max_capacity: null,
      player_id: client.session.player.id,
      player_username: client.session.player.username,
      amount: payload.amount,
      action: 'deposit'
    })
  }

  private async handleWithdrawCurrency(client: Client, payload: WithdrawCurrencyPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await withdrawCurrencyFromBank(
      client.session.player.id,
      client.session.guild.id,
      payload.amount
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Withdraw failed' })
      return
    }

    // Send remaining limit to requester
    this.send(client, 'guild_bank_my_limits', {
      currency: result.remaining_limit ?? -1,
      items: -1,
      pokemon_points: -1
    })

    // Broadcast to guild
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_currency_updated', {
      balance: result.new_balance,
      max_capacity: null,
      player_id: client.session.player.id,
      player_username: client.session.player.username,
      amount: payload.amount,
      action: 'withdraw'
    })
  }

  private async handleDepositItem(client: Client, payload: DepositItemPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await depositItemToBank(
      client.session.player.id,
      client.session.guild.id,
      payload.item_id,
      payload.quantity
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Deposit failed' })
      return
    }

    // Broadcast item update
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_item_updated', {
      item: { item_id: payload.item_id, quantity: result.bank_quantity },
      player_id: client.session.player.id,
      player_username: client.session.player.username,
      quantity_changed: payload.quantity,
      action: 'deposit'
    })
  }

  private async handleWithdrawItem(client: Client, payload: WithdrawItemPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await withdrawItemFromBank(
      client.session.player.id,
      client.session.guild.id,
      payload.item_id,
      payload.quantity
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Withdraw failed' })
      return
    }

    // Send remaining limit
    this.send(client, 'guild_bank_my_limits', {
      currency: -1,
      items: result.remaining_limit ?? -1,
      pokemon_points: -1
    })

    // Broadcast (UI should refetch for current quantity)
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_item_updated', {
      item: { item_id: payload.item_id, quantity: -1 },
      player_id: client.session.player.id,
      player_username: client.session.player.username,
      quantity_changed: payload.quantity,
      action: 'withdraw'
    })
  }

  private async handleDepositPokemon(client: Client, payload: DepositPokemonPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await depositPokemonToBank(
      client.session.player.id,
      client.session.guild.id,
      payload.pokemon_id
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Deposit failed' })
      return
    }

    // Broadcast pokemon added (UI should refetch bank for full details)
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_pokemon_added', {
      pokemon: { pokemon_id: payload.pokemon_id, slot: result.slot },
      player_id: client.session.player.id,
      player_username: client.session.player.username
    })
  }

  private async handleWithdrawPokemon(client: Client, payload: WithdrawPokemonPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await withdrawPokemonFromBank(
      client.session.player.id,
      client.session.guild.id,
      payload.pokemon_id
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Withdraw failed' })
      return
    }

    // Send remaining points
    this.send(client, 'guild_bank_my_limits', {
      currency: -1,
      items: -1,
      pokemon_points: result.remaining_points ?? -1
    })

    // Broadcast pokemon removed
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_pokemon_removed', {
      pokemon_id: payload.pokemon_id,
      slot: -1,
      player_id: client.session.player.id,
      player_username: client.session.player.username
    })
  }

  private async handleExpandPokemonSlots(client: Client) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await expandBankPokemonSlots(
      client.session.player.id,
      client.session.guild.id
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Expansion failed' })
      return
    }

    // Broadcast expansion
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_slots_expanded', {
      new_total: result.new_total_slots,
      next_price: result.next_price,
      expanded_by: client.session.player.id,
      expanded_by_username: client.session.player.username
    })
  }

  private async handleCreateBankRequest(client: Client, payload: CreateBankRequestPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await createBankRequest(
      client.session.player.id,
      client.session.guild.id,
      payload.request_type,
      payload.details as Record<string, unknown>,
      payload.note
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Request failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Request created' })

    // Notify officers/leaders (broadcast to guild, UI filters by role)
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_request_created', {
      request: {
        id: result.request_id,
        player_id: client.session.player.id,
        player_username: client.session.player.username,
        request_type: payload.request_type,
        item_details: payload.details,
        status: 'pending',
        note: payload.note || null,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    })
  }

  private async handleFulfillBankRequest(client: Client, payload: FulfillBankRequestPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await fulfillBankRequest(
      client.session.player.id,
      client.session.guild.id,
      payload.request_id
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Fulfill failed' })
      return
    }

    // Broadcast fulfillment
    this.broadcastToGuild(client.session.guild.id, 'guild_bank_request_fulfilled', {
      request_id: payload.request_id,
      fulfilled_by: client.session.player.id,
      fulfilled_by_username: client.session.player.username
    })
  }

  private async handleCancelBankRequest(client: Client, payload: CancelBankRequestPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await cancelBankRequest(
      client.session.player.id,
      payload.request_id
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Cancel failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Request cancelled' })
  }

  private async handleGetBankRequests(client: Client, payload: GetBankRequestsPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const requests = await getBankRequests(
      client.session.guild.id,
      payload?.include_expired || false
    )

    this.send(client, 'guild_bank_requests', { requests })
  }

  private async handleGetBankLogs(client: Client, payload: GetBankLogsPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await getBankLogs(
      client.session.player.id,
      client.session.guild.id,
      {
        page: payload?.page,
        limit: payload?.limit,
        filterPlayer: payload?.filter_player,
        filterAction: payload?.filter_action,
        filterCategory: payload?.filter_category
      }
    )

    this.send(client, 'guild_bank_logs', {
      logs: result.logs,
      total: result.total,
      page: payload?.page || 1
    })
  }

  private async handleSetBankPermission(client: Client, payload: SetBankPermissionPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await setBankPermission(
      client.session.player.id,
      client.session.guild.id,
      payload.category,
      payload.role,
      payload.can_deposit,
      payload.can_withdraw
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Permission update failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Permission updated' })
  }

  private async handleSetBankLimit(client: Client, payload: SetBankLimitPayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await setBankLimit(
      client.session.player.id,
      client.session.guild.id,
      payload.role,
      payload.category,
      payload.daily_limit,
      payload.pokemon_points_limit
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Limit update failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Limit updated' })
  }

  private async handleSetPlayerOverride(client: Client, payload: SetPlayerOverridePayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await setPlayerBankOverride(
      client.session.player.id,
      client.session.guild.id,
      payload.player_id,
      payload.category,
      payload.custom_limit
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Override update failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Override set' })
  }

  private async handleRemovePlayerOverride(client: Client, payload: RemovePlayerOverridePayload) {
    if (!client.session?.guild) {
      this.send(client, 'guild_bank_error', { error: 'Not in a guild' })
      return
    }

    const result = await removePlayerBankOverride(
      client.session.player.id,
      client.session.guild.id,
      payload.player_id,
      payload.category
    )

    if (!result.success) {
      this.send(client, 'guild_bank_error', { error: result.error || 'Override removal failed' })
      return
    }

    this.send(client, 'guild_bank_success', { success: true, message: 'Override removed' })
  }
}
