import { useGameStore } from '@/stores/gameStore'
import type { TickResult, GameState, Zone, Pokemon, ShopItem, EvolutionEvent, LeaderboardEntry, LeaderboardType, LeaderboardTimeframe, PlayerRank, WildPokemon } from '@/types/game'
import type { BattleTurn } from '@pokemon-idle/shared'
import type { GymLeader, GymBattleResult } from '@/components/game/GymBattlePanel'
import type { ChatMessageData, ChatChannel, WhisperMessageData, BlockedPlayerData } from '@/types/chat'
import type { Friend, FriendRequest, OutgoingFriendRequest } from '@/types/friends'
import type { IncomingTradeRequest, OutgoingTradeRequest, TradeOffer, TradeHistoryEntry } from '@/types/trade'
import type {
  GuildDataPayload,
  GuildListPayload,
  GuildMemberJoinedPayload,
  GuildMemberLeftPayload,
  GuildMemberKickedPayload,
  GuildRoleChangedPayload,
  GuildDisbandedPayload,
  GuildErrorPayload,
  GuildInvite,
  GuildInvitesListPayload,
  GuildOutgoingInvitesPayload,
  GuildInviteReceivedPayload,
  GuildInviteAcceptedPayload,
  GuildInviteDeclinedPayload,
  GuildInviteCancelledPayload,
  GuildInviteSentPayload,
  GuildMessageEntry,
  GuildChatHistoryPayload,
  GuildChatMessagePayload,
  GuildBankDataPayload,
  GuildBankCurrencyUpdatedPayload,
  GuildBankPokemonRemovedPayload,
  GuildBankLogsPayload,
  GuildBankRequestsPayload,
  GuildBankRequestCreatedPayload,
  GuildBankRequestFulfilledPayload,
  GuildBankMyLimitsPayload,
  GuildBankErrorPayload,
  GuildBankSuccessPayload,
  GuildQuestsDataPayload,
  GuildQuestDetailsPayload,
  GuildQuestProgressPayload,
  GuildQuestMilestonePayload,
  GuildQuestCompletedPayload,
  GuildQuestRerolledPayload,
  GuildQuestHistoryPayload,
  GuildQuestsResetPayload,
  GuildQuestErrorPayload,
  GuildActiveBuffsPayload,
  GuildBuffPurchasedPayload,
  GuildBuffExpiredPayload,
  GuildStatisticsPayload,
  GuildLeaderboardPayload,
  GuildShopErrorPayload,
} from '@pokemon-idle/shared'

type MessageHandler = (payload: unknown) => void

type ChatPayload = {
  id: string
  player_id: string
  player_name: string
  channel: ChatChannel
  content: string
  created_at: string
}

// Constants - exported for use in other components
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

// Friend request callback type
type FriendRequestCallback = (result: { success: boolean; error?: string; username?: string }) => void

class GameSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private token: string | null = null
  private handlers: Map<string, MessageHandler> = new Map()
  // Map-based tracking for friend request callbacks to prevent race conditions
  private pendingFriendRequests: Map<string, FriendRequestCallback> = new Map()

  constructor() {
    // Set up default handlers
    this.handlers.set('tick', this.handleTick)
    this.handlers.set('game_state', this.handleGameState)
    this.handlers.set('zone_update', this.handleZoneUpdate)
    this.handlers.set('party_update', this.handlePartyUpdate)
    this.handlers.set('shop_data', this.handleShopData)
    this.handlers.set('shop_purchase', this.handleShopPurchase)
    this.handlers.set('gym_data', this.handleGymData)
    this.handlers.set('gym_battle_result', this.handleGymBattleResult)
    this.handlers.set('chat_history', this.handleChatHistory)
    this.handlers.set('chat_message', this.handleChatMessage)
    this.handlers.set('potion_used', this.handlePotionUsed)
    this.handlers.set('pokecenter_heal', this.handlePokeCenterHeal)
    this.handlers.set('error', this.handleError)
    // Friends handlers
    this.handlers.set('friends_data', this.handleFriendsData)
    this.handlers.set('friends_update', this.handleFriendsUpdate)
    this.handlers.set('friend_request_received', this.handleFriendRequestReceived)
    this.handlers.set('friend_request_sent', this.handleFriendRequestSent)
    this.handlers.set('friend_zone_update', this.handleFriendZoneUpdate)
    // Nearby players handler
    this.handlers.set('nearby_players', this.handleNearbyPlayers)
    // Trade handlers
    this.handlers.set('trades_data', this.handleTradesData)
    this.handlers.set('trades_update', this.handleTradesUpdate)
    this.handlers.set('trade_request_received', this.handleTradeRequestReceived)
    this.handlers.set('trade_offers_update', this.handleTradeOffersUpdate)
    this.handlers.set('trade_offers_data', this.handleTradeOffersData)
    this.handlers.set('trade_ready_update', this.handleTradeReadyUpdate)
    this.handlers.set('trade_completed', this.handleTradeCompleted)
    this.handlers.set('trade_cancelled', this.handleTradeCancelled)
    this.handlers.set('trade_partner_disconnected', this.handleTradePartnerDisconnected)
    this.handlers.set('trade_history', this.handleTradeHistory)
    this.handlers.set('trade_history_error', this.handleTradeHistoryError)
    // Museum handlers
    this.handlers.set('museum_data', this.handleMuseumData)
    this.handlers.set('museum_membership_purchased', this.handleMuseumMembershipPurchased)
    this.handlers.set('museum_error', this.handleMuseumError)
    this.handlers.set('museum_membership_error', this.handleMuseumMembershipError)
    // Evolution handlers
    this.handlers.set('evolution', this.handleEvolution)
    this.handlers.set('evolution_cancelled', this.handleEvolutionCancelled)
    this.handlers.set('evolution_error', this.handleEvolutionError)
    // Debug handler
    this.handlers.set('debug_levelup_result', this.handleDebugLevelUp)
    // Whisper handlers (Issue #45)
    this.handlers.set('whisper_sent', this.handleWhisperSent)
    this.handlers.set('whisper_received', this.handleWhisperReceived)
    this.handlers.set('whisper_history', this.handleWhisperHistory)
    // Block handlers (Issue #47)
    this.handlers.set('blocked_players', this.handleBlockedPlayers)
    this.handlers.set('player_blocked', this.handlePlayerBlocked)
    this.handlers.set('player_unblocked', this.handlePlayerUnblocked)
    // Leaderboard handlers (Issues #51-54)
    this.handlers.set('leaderboard_data', this.handleLeaderboardData)
    // Guild handlers
    this.handlers.set('guild_data', this.handleGuildData)
    this.handlers.set('guild_list', this.handleGuildList)
    this.handlers.set('guild_member_joined', this.handleGuildMemberJoined)
    this.handlers.set('guild_member_left', this.handleGuildMemberLeft)
    this.handlers.set('guild_member_kicked', this.handleGuildMemberKicked)
    this.handlers.set('guild_role_changed', this.handleGuildRoleChanged)
    this.handlers.set('guild_disbanded', this.handleGuildDisbanded)
    this.handlers.set('guild_kicked', this.handleGuildKicked)
    this.handlers.set('guild_left', this.handleGuildLeft)
    this.handlers.set('guild_created', this.handleGuildCreated)
    this.handlers.set('guild_joined', this.handleGuildJoined)
    this.handlers.set('guild_error', this.handleGuildError)
    // Guild invite handlers
    this.handlers.set('guild_invites_list', this.handleGuildInvitesList)
    this.handlers.set('guild_outgoing_invites', this.handleGuildOutgoingInvites)
    this.handlers.set('guild_invite_received', this.handleGuildInviteReceived)
    this.handlers.set('guild_invite_sent', this.handleGuildInviteSent)
    this.handlers.set('guild_invite_accepted', this.handleGuildInviteAccepted)
    this.handlers.set('guild_invite_declined', this.handleGuildInviteDeclined)
    this.handlers.set('guild_invite_cancelled', this.handleGuildInviteCancelled)
    this.handlers.set('guild_invite_error', this.handleGuildInviteError)
    // Guild chat handlers
    this.handlers.set('guild_chat_history', this.handleGuildChatHistory)
    this.handlers.set('guild_chat_message', this.handleGuildChatMessage)
    // Guild bank handlers
    this.handlers.set('guild_bank_data', this.handleGuildBankData)
    this.handlers.set('guild_bank_currency_updated', this.handleGuildBankCurrencyUpdated)
    this.handlers.set('guild_bank_item_updated', this.handleGuildBankItemUpdated)
    this.handlers.set('guild_bank_pokemon_added', this.handleGuildBankPokemonAdded)
    this.handlers.set('guild_bank_pokemon_removed', this.handleGuildBankPokemonRemoved)
    this.handlers.set('guild_bank_slots_expanded', this.handleGuildBankSlotsExpanded)
    this.handlers.set('guild_bank_logs', this.handleGuildBankLogs)
    this.handlers.set('guild_bank_requests', this.handleGuildBankRequests)
    this.handlers.set('guild_bank_request_created', this.handleGuildBankRequestCreated)
    this.handlers.set('guild_bank_request_fulfilled', this.handleGuildBankRequestFulfilled)
    this.handlers.set('guild_bank_my_limits', this.handleGuildBankMyLimits)
    this.handlers.set('guild_bank_error', this.handleGuildBankError)
    this.handlers.set('guild_bank_success', this.handleGuildBankSuccess)
    // Guild quest handlers
    this.handlers.set('guild_quests_data', this.handleGuildQuestsData)
    this.handlers.set('guild_quest_details', this.handleGuildQuestDetails)
    this.handlers.set('guild_quest_progress', this.handleGuildQuestProgress)
    this.handlers.set('guild_quest_milestone', this.handleGuildQuestMilestone)
    this.handlers.set('guild_quest_completed', this.handleGuildQuestCompleted)
    this.handlers.set('guild_quest_rerolled', this.handleGuildQuestRerolled)
    this.handlers.set('guild_quest_history', this.handleGuildQuestHistory)
    this.handlers.set('guild_quests_reset', this.handleGuildQuestsReset)
    this.handlers.set('guild_quest_error', this.handleGuildQuestError)
    // Guild shop/statistics handlers
    this.handlers.set('guild_active_buffs', this.handleGuildActiveBuffs)
    this.handlers.set('guild_buff_purchased', this.handleGuildBuffPurchased)
    this.handlers.set('guild_buff_expired', this.handleGuildBuffExpired)
    this.handlers.set('guild_statistics', this.handleGuildStatistics)
    this.handlers.set('guild_leaderboard', this.handleGuildLeaderboard)
    this.handlers.set('guild_shop_error', this.handleGuildShopError)
    // Progressive battle handlers
    this.handlers.set('encounter_start', this.handleEncounterStart)
    this.handlers.set('battle_turn', this.handleBattleTurn)
    this.handlers.set('catch_result', this.handleCatchResult)
    this.handlers.set('catch_complete', this.handleCatchComplete)
    this.handlers.set('battle_summary', this.handleBattleSummary)
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    this.token = token
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`

    console.log('Connecting to game server...')
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('Connected to game server')
      const wasReconnect = this.reconnectAttempts > 0
      this.reconnectAttempts = 0
      useGameStore.getState().setConnected(true)

      // On reconnection, request fresh state to ensure UI is in sync
      // The server sends initial state on connect, but we explicitly request it
      // to handle any edge cases where the initial send might be missed
      if (wasReconnect) {
        console.log('Reconnected - requesting fresh state')
        // Give the server a moment to process the connection
        setTimeout(() => {
          this.getState()
          this.send('get_friends')
          this.send('get_trades')
          this.send('get_whisper_history')
          this.getGuild()
          this.getGuildInvites()
        }, 100)
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: unknown }
        // Debug: Log all incoming messages
        console.log('[WS] Received:', msg.type, msg.payload)
        const handler = this.handlers.get(msg.type)
        if (handler) {
          handler(msg.payload)
        } else {
          console.log('Unknown message type:', msg.type)
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }

    this.ws.onclose = (event) => {
      console.log('Disconnected from game server:', event.code, event.reason)
      useGameStore.getState().setConnected(false)
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.token = null
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnect
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    if (!this.token) {
      console.log('No token, not reconnecting')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token)
      }
    }, delay)
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  send(type: string, payload: unknown = {}) {
    if (!this.isConnected()) {
      console.error('WebSocket not connected')
      return false
    }

    this.ws!.send(JSON.stringify({ type, payload }))
    return true
  }

  // Move to a different zone
  moveToZone(zoneId: number) {
    this.send('move_zone', { zone_id: zoneId })
  }

  // Swap a party member with a box Pokemon
  swapParty(boxPokemonId: string, partySlot: number) {
    this.send('swap_party', { box_pokemon_id: boxPokemonId, party_slot: partySlot })
  }

  // Remove a Pokemon from party (send to box)
  removeFromParty(partySlot: number) {
    this.send('remove_from_party', { party_slot: partySlot })
  }

  // Reorder party Pokemon
  // order: Array of 6 Pokemon IDs (null for empty slots), in desired position order
  // Returns true if message sent, false if not connected
  reorderParty(order: (string | null)[]): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }
    this.send('reorder_party', { order })
    return true
  }

  // Request current game state
  getState() {
    this.send('get_state')
  }

  // Request shop data
  getShop() {
    this.send('get_shop')
  }

  // Buy an item from the shop
  buyItem(itemId: string, quantity: number) {
    this.send('buy_item', { item_id: itemId, quantity })
  }

  // Request gym data for the current zone
  getGym(zoneId: number) {
    this.send('get_gym', { zone_id: zoneId })
  }

  // Challenge a gym leader
  challengeGym(gymLeaderId: string) {
    this.send('challenge_gym', { gym_leader_id: gymLeaderId })
  }

  // Send a chat message to the server
  sendChatMessage(channel: ChatChannel, content: string) {
    this.send('chat_message', { channel, content })
  }

  // Use a potion on a Pokemon
  usePotion(pokemonId: string, itemId: string) {
    this.send('use_potion', { pokemon_id: pokemonId, item_id: itemId })
  }

  // Heal all Pokemon at PokeCenter (free)
  healAtPokeCenter() {
    this.send('heal_at_pokecenter')
  }

  // ============================================
  // FRIEND METHODS
  // ============================================

  // Request friends list data
  getFriends() {
    this.send('get_friends')
  }

  // Send a friend request by username with optional callback
  // Uses Map-based tracking keyed by lowercase username to prevent race conditions
  // Includes 30-second timeout to prevent memory leaks if server never responds
  sendFriendRequest(username: string, callback?: FriendRequestCallback): boolean {
    if (!this.isConnected()) {
      callback?.({ success: false, error: 'Not connected to server' })
      return false
    }
    const normalizedUsername = username.toLowerCase()
    if (callback) {
      this.pendingFriendRequests.set(normalizedUsername, callback)
      // Timeout after 30 seconds to prevent memory leak
      setTimeout(() => {
        const pendingCallback = this.pendingFriendRequests.get(normalizedUsername)
        if (pendingCallback === callback) {
          this.pendingFriendRequests.delete(normalizedUsername)
          callback({ success: false, error: 'Request timed out' })
        }
      }, 30000)
    }
    this.send('send_friend_request', { username })
    return true
  }

  // Accept a pending friend request
  acceptFriendRequest(friendId: string) {
    this.send('accept_friend_request', { friend_id: friendId })
  }

  // Decline a pending friend request
  declineFriendRequest(friendId: string) {
    this.send('decline_friend_request', { friend_id: friendId })
  }

  // Remove an accepted friend
  removeFriend(friendId: string) {
    this.send('remove_friend', { friend_id: friendId })
  }

  // Message handlers - using arrow functions to avoid binding issues
  private handleTick = (payload: unknown) => {
    const result = payload as TickResult
    const store = useGameStore.getState()

    // Update pokeball count
    store.setPokeballs(result.pokeballs)

    // Update inventory with current ball counts
    if (result.great_balls !== undefined) {
      const currentInventory = store.inventory
      store.setInventory({
        ...currentInventory,
        pokeball: result.pokeballs,
        great_ball: result.great_balls
      })
    }

    // Update money if earned
    if (result.total_money !== undefined) {
      store.setPokedollars(result.total_money)
    }

    // Handle encounter
    if (result.encounter) {
      store.setCurrentEncounter(result.encounter)

      // If caught, add to box immediately
      if (result.encounter.catch_result?.success && result.encounter.catch_result.caught_pokemon) {
        store.addToBox(result.encounter.catch_result.caught_pokemon)
      }

      // Queue XP/level-ups/evolutions to be applied AFTER the battle animation completes
      // This prevents the XP bar and stats from updating before the player sees the battle
      const xpGained = result.xp_gained || null
      store.setPendingEncounterRewards({
        xpGained,
        xpApplied: !!xpGained,
        levelUps: result.level_ups || null,
        pendingEvolutions: result.pending_evolutions || null,
      })

      if (xpGained) {
        store.applyXPGains(xpGained)
      }
    } else {
      // No encounter - apply XP/level-ups/evolutions immediately (shouldn't happen, but handle it)
      if (result.xp_gained) {
        store.applyXPGains(result.xp_gained)
      }

      if (result.level_ups && result.level_ups.length > 0) {
        store.addLevelUps(result.level_ups)

        // Update party stats for leveled up Pokemon
        for (const levelUp of result.level_ups) {
          store.updatePokemonInParty(levelUp.pokemon_id, {
            level: levelUp.new_level,
            max_hp: levelUp.new_stats.max_hp,
            current_hp: levelUp.new_stats.max_hp, // Full heal on level up
            stat_attack: levelUp.new_stats.attack,
            stat_defense: levelUp.new_stats.defense,
            stat_sp_attack: levelUp.new_stats.sp_attack,
            stat_sp_defense: levelUp.new_stats.sp_defense,
            stat_speed: levelUp.new_stats.speed,
          })
        }
      }

      if (result.pending_evolutions && result.pending_evolutions.length > 0) {
        store.addPendingEvolutions(result.pending_evolutions)
      }
    }
  }

  private handleGameState = (payload: unknown) => {
    const state = payload as GameState & { inventory?: Record<string, number> }
    const store = useGameStore.getState()

    store.setPlayer(state.player)
    store.setParty(state.party)
    store.setZone(state.zone, state.connected_zones)
    store.setPokeballs(state.pokeballs)
    store.setPokedollars(state.pokedollars)
    store.setBox(state.box || [])
    if (state.inventory) {
      store.setInventory(state.inventory)
    }
    // Load badges from player data (always set, defaulting to empty array)
    store.setBadges(state.player.badges || [])
    store.setLoading(false)
  }

  private handleZoneUpdate = (payload: unknown) => {
    const { zone, connected_zones } = payload as { zone: Zone; connected_zones: Zone[] }
    useGameStore.getState().setZone(zone, connected_zones)
  }

  private handlePartyUpdate = (payload: unknown) => {
    const { party, box } = payload as { party: Pokemon[]; box: Pokemon[] }
    const store = useGameStore.getState()
    store.setParty(party)
    if (box) {
      store.setBox(box)
    }
  }

  private handleError = (payload: unknown) => {
    const { message, context } = payload as { message: string; context?: { username?: string } }
    console.error('Server error:', message)
    // If error has username context, find and invoke the corresponding callback
    if (context?.username) {
      const normalizedUsername = context.username.toLowerCase()
      const callback = this.pendingFriendRequests.get(normalizedUsername)
      if (callback) {
        callback({ success: false, error: message })
        this.pendingFriendRequests.delete(normalizedUsername)
      }
    }
  }

  private handleShopData = (payload: unknown) => {
    const { items, money, inventory } = payload as {
      items: ShopItem[]
      money: number
      inventory: Record<string, number>
    }
    const store = useGameStore.getState()
    store.setShopItems(items)
    store.setPokedollars(money)
    store.setInventory(inventory)
    store.setShopOpen(true)
  }

  private handleShopPurchase = (payload: unknown) => {
    const { success, new_money, inventory } = payload as {
      success: boolean
      item_id: string
      quantity: number
      new_money: number
      inventory: Record<string, number>
    }
    if (success) {
      const store = useGameStore.getState()
      store.setPokedollars(new_money)
      store.setInventory(inventory)
      // Update pokeballs if we bought pokeballs
      if (inventory.pokeball !== undefined) {
        store.setPokeballs(inventory.pokeball)
      }
    }
  }

  private handleGymData = (payload: unknown) => {
    const gymLeader = payload as GymLeader | null
    const store = useGameStore.getState()
    if (gymLeader) {
      store.setCurrentGymLeader(gymLeader)
      store.setGymOpen(true)
    }
  }

  private handleGymBattleResult = (payload: unknown) => {
    const result = payload as GymBattleResult
    const store = useGameStore.getState()

    // Update badges if we won
    if (result.success && result.badge_earned) {
      store.addBadge(result.badge_earned)
    }

    // Update money if we earned any
    if (result.money_earned) {
      store.setPokedollars(store.pokedollars + result.money_earned)
    }

    // Store the result for the GymBattlePanel to consume
    store.setPendingGymBattleResult(result)
  }

  private handleChatHistory = (payload: unknown) => {
    const { messages } = payload as { messages?: ChatPayload[] }
    if (!messages) return

    const grouped: Record<ChatChannel, ChatMessageData[]> = {
      global: [],
      trade: [],
      guild: [],
      system: [],
      whisper: [],
    }

    for (const msg of messages) {
      const chatMessage = this.mapChatPayload(msg)
      // Only add to non-whisper channels (whispers handled separately)
      if (chatMessage.channel !== 'whisper') {
        grouped[chatMessage.channel].push(chatMessage)
      }
    }

    useGameStore.getState().setChatMessages(grouped)
  }

  private handleChatMessage = (payload: unknown) => {
    const chatMessage = this.mapChatPayload(payload as ChatPayload)
    useGameStore.getState().addChatMessage(chatMessage)
  }

  private handlePotionUsed = (payload: unknown) => {
    const { success, pokemon_id, new_hp, inventory } = payload as {
      success: boolean
      pokemon_id: string
      new_hp: number
      max_hp: number
      item_id: string
      inventory: Record<string, number>
    }
    if (success) {
      const store = useGameStore.getState()
      store.updatePokemonInParty(pokemon_id, { current_hp: new_hp })
      store.setInventory(inventory)
    }
  }

  private handlePokeCenterHeal = (payload: unknown) => {
    const { success, party } = payload as {
      success: boolean
      healed_pokemon: { id: string; new_hp: number }[]
      party: Pokemon[]
    }
    if (success) {
      const store = useGameStore.getState()
      store.setParty(party)
    }
  }

  private mapChatPayload(payload: ChatPayload): ChatMessageData {
    return {
      id: payload.id,
      playerId: payload.player_id,
      playerName: payload.player_name,
      channel: payload.channel,
      content: payload.content,
      createdAt: new Date(payload.created_at),
      isSystem: payload.player_id === 'system',
    }
  }

  // ============================================
  // FRIEND HANDLERS
  // ============================================

  private handleFriendsData = (payload: unknown) => {
    const { friends, incoming, outgoing } = payload as {
      friends: Friend[]
      incoming: FriendRequest[]
      outgoing: OutgoingFriendRequest[]
    }
    console.log('[WS] friends_data received:', { friends: friends?.length, incoming: incoming?.length, outgoing: outgoing?.length })
    console.log('[WS] friends details:', friends)
    useGameStore.getState().setAllFriendsData({ friends, incoming, outgoing })
  }

  private handleFriendsUpdate = (payload: unknown) => {
    const { friends, incoming, outgoing } = payload as {
      friends: Friend[]
      incoming: FriendRequest[]
      outgoing: OutgoingFriendRequest[]
    }
    useGameStore.getState().setAllFriendsData({ friends, incoming, outgoing })
  }

  private handleFriendRequestReceived = (payload: unknown) => {
    const request = payload as FriendRequest
    const store = useGameStore.getState()
    // Add to incoming requests
    store.setIncomingFriendRequests([request, ...store.incomingFriendRequests])
  }

  private handleFriendRequestSent = (payload: unknown) => {
    const { success, username, error } = payload as { success: boolean; username: string; error?: string }
    const normalizedUsername = username.toLowerCase()
    const callback = this.pendingFriendRequests.get(normalizedUsername)
    if (callback) {
      callback({ success, username, error })
      this.pendingFriendRequests.delete(normalizedUsername)
    }
    if (success) {
      // Refresh friends data to get the new outgoing request
      this.getFriends()
    }
  }

  private handleFriendZoneUpdate = (payload: unknown) => {
    const { player_id, zone_id, zone_name } = payload as {
      player_id: string
      zone_id: number
      zone_name: string
    }
    useGameStore.getState().updateFriendZone(player_id, zone_id, zone_name)
  }

  private handleNearbyPlayers = (payload: unknown) => {
    const { players } = payload as {
      players: { id: string; username: string }[]
    }
    useGameStore.getState().setNearbyPlayers(players)
  }

  // Request nearby players from server
  getNearbyPlayers() {
    this.send('get_nearby_players', {})
  }

  // ============================================
  // TRADE METHODS
  // ============================================

  // Request trade requests data
  getTrades() {
    this.send('get_trades', {})
  }

  // Send a trade request to a player
  sendTradeRequest(playerId: string) {
    this.send('send_trade_request', { player_id: playerId })
  }

  // Accept a trade request
  acceptTradeRequest(tradeId: string) {
    this.send('accept_trade_request', { trade_id: tradeId })
  }

  // Decline a trade request
  declineTradeRequest(tradeId: string) {
    this.send('decline_trade_request', { trade_id: tradeId })
  }

  // Cancel a trade request (sender only)
  cancelTradeRequest(tradeId: string) {
    this.send('cancel_trade_request', { trade_id: tradeId })
  }

  // Add a Pokemon to the trade offer
  addTradeOffer(tradeId: string, pokemonId: string) {
    this.send('add_trade_offer', { trade_id: tradeId, pokemon_id: pokemonId })
  }

  // Remove a Pokemon from the trade offer
  removeTradeOffer(tradeId: string, pokemonId: string) {
    this.send('remove_trade_offer', { trade_id: tradeId, pokemon_id: pokemonId })
  }

  // Get trade offers for a trade
  getTradeOffers(tradeId: string) {
    this.send('get_trade_offers', { trade_id: tradeId })
  }

  // Set ready status for the trade
  setTradeReady(tradeId: string, ready: boolean) {
    this.send('set_trade_ready', { trade_id: tradeId, ready })
  }

  // Complete the trade (receiver only, after both ready)
  completeTrade(tradeId: string) {
    this.send('complete_trade', { trade_id: tradeId })
  }

  // Get trade history
  getTradeHistory(limit?: number, partnerUsername?: string) {
    useGameStore.getState().setTradeHistoryLoading(true)
    this.send('get_trade_history', { limit, partner_username: partnerUsername })
  }

  // ============================================
  // TRADE HANDLERS
  // ============================================

  private handleTradesData = (payload: unknown) => {
    const { incoming, outgoing } = payload as {
      incoming: IncomingTradeRequest[]
      outgoing: OutgoingTradeRequest[]
    }
    useGameStore.getState().setAllTradesData({ incoming, outgoing })
  }

  private handleTradesUpdate = (payload: unknown) => {
    const { incoming, outgoing } = payload as {
      incoming: IncomingTradeRequest[]
      outgoing: OutgoingTradeRequest[]
    }
    useGameStore.getState().setAllTradesData({ incoming, outgoing })
  }

  private handleTradeRequestReceived = (payload: unknown) => {
    const request = payload as IncomingTradeRequest
    const store = useGameStore.getState()
    store.setIncomingTradeRequests([request, ...store.incomingTradeRequests])
  }

  private handleTradeOffersUpdate = (payload: unknown) => {
    const { trade_id, offers, warning } = payload as {
      trade_id: string
      offers: TradeOffer[]
      warning?: string
    }
    useGameStore.getState().updateTradeOffers(trade_id, offers, warning)
  }

  private handleTradeOffersData = (payload: unknown) => {
    const { trade_id, offers } = payload as {
      trade_id: string
      offers: TradeOffer[]
    }
    useGameStore.getState().updateTradeOffers(trade_id, offers)
  }

  private handleTradeReadyUpdate = (payload: unknown) => {
    const { trade_id, my_ready, their_ready } = payload as {
      trade_id: string
      my_ready: boolean
      their_ready: boolean
    }
    const store = useGameStore.getState()
    if (store.activeTrade?.trade_id === trade_id) {
      store.setTradeReady(my_ready, their_ready)
    }
  }

  private handleTradeCompleted = (payload: unknown) => {
    const { trade_id, transferred_count } = payload as {
      trade_id: string
      transferred_count: number
    }
    const store = useGameStore.getState()
    // Close the trade modal and clear active trade
    if (store.activeTrade?.trade_id === trade_id) {
      store.setActiveTrade(null)
      store.setTradeModalOpen(false)
    }
    // Refresh trades list
    this.getTrades()
    // Request updated game state to get new Pokemon ownership
    this.getState()
    console.log(`Trade completed! ${transferred_count} Pokemon transferred.`)
  }

  private handleTradeCancelled = (payload: unknown) => {
    const { trade_id } = payload as { trade_id: string }
    const store = useGameStore.getState()
    // Close the trade modal if this trade was cancelled
    if (store.activeTrade?.trade_id === trade_id) {
      store.setActiveTrade(null)
      store.setTradeModalOpen(false)
    }
    // Refresh trades list
    this.getTrades()
  }

  private handleTradePartnerDisconnected = (payload: unknown) => {
    const { trade_id, message } = payload as { trade_id: string; message: string }
    const store = useGameStore.getState()
    // Set warning without affecting offers (preserves both my_offers and their_offers)
    if (store.activeTrade?.trade_id === trade_id) {
      store.setTradeWarning(trade_id, message || 'Your trade partner disconnected')
    }
    console.log('Trade partner disconnected:', message)
  }

  private handleTradeHistory = (payload: unknown) => {
    const { history } = payload as { history: TradeHistoryEntry[] }
    useGameStore.getState().setTradeHistory(history)
  }

  private handleTradeHistoryError = (payload: unknown) => {
    const { error } = payload as { error: string }
    console.error('Trade history error:', error)
    // Stop loading state on error
    useGameStore.getState().setTradeHistoryLoading(false)
  }

  // ============================================
  // MUSEUM METHODS
  // ============================================

  // Request museum data (checks membership and returns exhibits or purchase prompt)
  getMuseum() {
    this.send('get_museum')
  }

  // Purchase museum membership (one-time 50 currency fee)
  buyMuseumMembership() {
    this.send('buy_museum_membership')
  }

  // ============================================
  // MUSEUM HANDLERS
  // ============================================

  private handleMuseumData = (payload: unknown) => {
    const data = payload as {
      has_membership: boolean
      cost?: number
      player_money?: number
      exhibits?: Array<{ id: string; name: string; description: string; icon: string }>
    }
    useGameStore.getState().openMuseum(data)
  }

  private handleMuseumMembershipPurchased = (payload: unknown) => {
    const { success, new_money, exhibits } = payload as {
      success: boolean
      new_money: number
      exhibits: Array<{ id: string; name: string; description: string; icon: string }>
    }
    if (success) {
      const store = useGameStore.getState()
      store.setPokedollars(new_money)
      store.openMuseum({ has_membership: true, exhibits })
    }
  }

  private handleMuseumError = (payload: unknown) => {
    const { error } = payload as { error: string }
    console.error('Museum error:', error)
    useGameStore.getState().closeMuseum()
  }

  private handleMuseumMembershipError = (payload: unknown) => {
    const { error } = payload as { error: string }
    console.error('Museum membership error:', error)
    useGameStore.getState().setMuseumError(error)
  }

  // ============================================
  // EVOLUTION METHODS
  // ============================================

  // Confirm evolution (player lets it happen)
  confirmEvolution(pokemonId: string) {
    this.send('confirm_evolution', { pokemon_id: pokemonId })
  }

  // Cancel evolution (player presses B)
  cancelEvolution(pokemonId: string) {
    this.send('cancel_evolution', { pokemon_id: pokemonId })
  }

  // ============================================
  // EVOLUTION HANDLERS
  // ============================================

  private handleEvolution = (payload: unknown) => {
    const event = payload as EvolutionEvent
    const store = useGameStore.getState()

    console.log('[Evolution Handler] Before update, party:', store.party.map(p => p ? { id: p.id, species_id: p.species_id } : null))

    // Update the Pokemon in party with new species and stats
    store.updatePokemonInParty(event.pokemon_id, {
      species_id: event.new_species_id,
      max_hp: event.new_stats.max_hp,
      current_hp: event.new_stats.max_hp, // Full heal on evolution
      stat_attack: event.new_stats.attack,
      stat_defense: event.new_stats.defense,
      stat_sp_attack: event.new_stats.sp_attack,
      stat_sp_defense: event.new_stats.sp_defense,
      stat_speed: event.new_stats.speed,
    })

    console.log('[Evolution Handler] After update, party:', useGameStore.getState().party.map(p => p ? { id: p.id, species_id: p.species_id } : null))

    // Atomically remove from pending evolutions and advance queue
    // Using combined action to avoid race conditions
    store.completeEvolutionAndAdvance(event.pokemon_id)

    // Add to world log
    store.addLogEntry({
      id: `evolution-${event.pokemon_id}-${Date.now()}`,
      type: 'evolution',
      message: `${event.pokemon_name} evolved into ${event.new_species_name}!`,
      timestamp: new Date(),
    })
  }

  private handleEvolutionCancelled = (payload: unknown) => {
    const { pokemon_id } = payload as { pokemon_id: string }
    const store = useGameStore.getState()
    // Atomically remove and advance queue
    store.completeEvolutionAndAdvance(pokemon_id)
  }

  private handleEvolutionError = (payload: unknown) => {
    const { error } = payload as { error: string }
    console.error('Evolution error:', error)
  }

  // Debug level up handler
  private handleDebugLevelUp = (payload: unknown) => {
    const result = payload as {
      pokemon_id: string
      old_level: number
      new_level: number
      pending_evolutions: Array<{
        pokemon_id: string
        pokemon_name: string
        current_species_id: number
        evolution_species_id: number
        evolution_species_name: string
        trigger_level: number
      }>
    }
    console.log('[Debug] Level up result:', result)
    const store = useGameStore.getState()

    // Add pending evolutions to the queue
    if (result.pending_evolutions && result.pending_evolutions.length > 0) {
      store.addPendingEvolutions(result.pending_evolutions)
    }
  }

  // ============================================
  // WHISPER METHODS (Issue #45)
  // ============================================

  // Send a whisper to a friend
  sendWhisper(toUsername: string, content: string) {
    this.send('send_whisper', { to_username: toUsername, content })
  }

  // Request whisper history
  getWhisperHistory() {
    this.send('get_whisper_history')
  }

  // ============================================
  // WHISPER HANDLERS
  // ============================================

  private handleWhisperSent = (payload: unknown) => {
    const { success, message } = payload as {
      success: boolean
      message?: {
        id: string
        from_player_id: string
        from_username: string
        to_player_id: string
        to_username: string
        content: string
        created_at: string
      }
    }
    if (success && message) {
      const whisper: WhisperMessageData = {
        id: message.id,
        fromPlayerId: message.from_player_id,
        fromUsername: message.from_username,
        toPlayerId: message.to_player_id,
        toUsername: message.to_username,
        content: message.content,
        createdAt: new Date(message.created_at),
      }
      useGameStore.getState().addWhisper(whisper)
    }
  }

  private handleWhisperReceived = (payload: unknown) => {
    const message = payload as {
      id: string
      from_player_id: string
      from_username: string
      to_player_id: string
      to_username: string
      content: string
      created_at: string
    }
    const whisper: WhisperMessageData = {
      id: message.id,
      fromPlayerId: message.from_player_id,
      fromUsername: message.from_username,
      toPlayerId: message.to_player_id,
      toUsername: message.to_username,
      content: message.content,
      createdAt: new Date(message.created_at),
    }
    useGameStore.getState().addWhisper(whisper)
  }

  private handleWhisperHistory = (payload: unknown) => {
    const { messages } = payload as {
      messages: Array<{
        id: string
        from_player_id: string
        from_username: string
        to_player_id: string
        to_username: string
        content: string
        created_at: string
      }>
    }
    const whispers: WhisperMessageData[] = (messages || []).map((msg) => ({
      id: msg.id,
      fromPlayerId: msg.from_player_id,
      fromUsername: msg.from_username,
      toPlayerId: msg.to_player_id,
      toUsername: msg.to_username,
      content: msg.content,
      createdAt: new Date(msg.created_at),
    }))
    useGameStore.getState().setWhispers(whispers)
  }

  // ============================================
  // BLOCK METHODS (Issue #47)
  // ============================================

  // Block a player by username
  blockPlayer(username: string) {
    this.send('block_player', { username })
  }

  // Unblock a player by player ID
  unblockPlayer(playerId: string) {
    this.send('unblock_player', { player_id: playerId })
  }

  // Request list of blocked players
  getBlockedPlayers() {
    this.send('get_blocked_players')
  }

  // ============================================
  // BLOCK HANDLERS
  // ============================================

  private handleBlockedPlayers = (payload: unknown) => {
    const { players } = payload as {
      players: Array<{
        id: string
        blocked_id: string
        blocked_username: string
        created_at: string
      }>
    }
    const blockedPlayers: BlockedPlayerData[] = (players || []).map((p) => ({
      id: p.id,
      blockedId: p.blocked_id,
      blockedUsername: p.blocked_username,
      createdAt: new Date(p.created_at),
    }))
    useGameStore.getState().setBlockedPlayers(blockedPlayers)
  }

  private handlePlayerBlocked = (payload: unknown) => {
    const { success, blocked_id, blocked_username } = payload as {
      success: boolean
      blocked_id: string
      blocked_username: string
    }
    if (success) {
      const blockedPlayer: BlockedPlayerData = {
        id: crypto.randomUUID(), // We'll get the real ID on next fetch
        blockedId: blocked_id,
        blockedUsername: blocked_username,
        createdAt: new Date(),
      }
      useGameStore.getState().addBlockedPlayer(blockedPlayer)
    }
  }

  private handlePlayerUnblocked = (payload: unknown) => {
    const { success, player_id } = payload as {
      success: boolean
      player_id: string
    }
    if (success) {
      useGameStore.getState().removeBlockedPlayer(player_id)
    }
  }

  // ============================================
  // LEADERBOARD HANDLERS (Issues #51-54)
  // ============================================

  private handleLeaderboardData = (payload: unknown) => {
    const data = payload as {
      type: LeaderboardType
      timeframe: LeaderboardTimeframe
      entries: LeaderboardEntry[]
      playerRank: PlayerRank | null
    }
    useGameStore.getState().setLeaderboardData(data)
  }

  // Request leaderboard data
  getLeaderboard(type: LeaderboardType, timeframe: LeaderboardTimeframe) {
    useGameStore.getState().setLeaderboardLoading(true)
    this.send('get_leaderboard', { type, timeframe })
  }

  // ============================================
  // GUILD METHODS
  // ============================================

  // Request current guild data
  getGuild() {
    this.send('get_guild')
  }

  // Create a new guild
  createGuild(name: string, tag: string, description?: string) {
    this.send('create_guild', { name, tag, description })
  }

  // Join an open guild
  joinGuild(guildId: string) {
    this.send('join_guild', { guild_id: guildId })
  }

  // Leave current guild
  leaveGuild() {
    this.send('leave_guild')
  }

  // Search for guilds
  searchGuilds(query?: string, page: number = 1, limit: number = 20) {
    this.send('search_guilds', { query, page, limit })
  }

  // Promote a member (member -> officer)
  promoteMember(playerId: string) {
    this.send('promote_member', { player_id: playerId })
  }

  // Demote a member (officer -> member)
  demoteMember(playerId: string) {
    this.send('demote_member', { player_id: playerId })
  }

  // Kick a member from the guild
  kickMember(playerId: string) {
    this.send('kick_member', { player_id: playerId })
  }

  // Transfer leadership to another member
  transferLeadership(playerId: string) {
    this.send('transfer_leadership', { player_id: playerId })
  }

  // Disband the guild (requires confirmation matching guild name)
  disbandGuild(confirmation: string) {
    this.send('disband_guild', { confirmation })
  }

  // ============================================
  // GUILD INVITE METHODS
  // ============================================

  // Send a guild invite to a player
  sendGuildInvite(playerId: string) {
    this.send('guild_invite_send', { player_id: playerId })
  }

  // Accept a guild invite
  acceptGuildInvite(inviteId: string) {
    this.send('guild_invite_accept', { invite_id: inviteId })
  }

  // Decline a guild invite
  declineGuildInvite(inviteId: string) {
    this.send('guild_invite_decline', { invite_id: inviteId })
  }

  // Cancel an outgoing guild invite (guild staff only)
  cancelGuildInvite(inviteId: string) {
    this.send('guild_invite_cancel', { invite_id: inviteId })
  }

  // Request list of pending guild invites (for current player)
  getGuildInvites() {
    this.send('get_guild_invites')
  }

  // Request list of outgoing guild invites (for guild staff)
  getGuildOutgoingInvites() {
    this.send('get_guild_outgoing_invites')
  }

  // ============================================
  // GUILD HANDLERS
  // ============================================

  private handleGuildData = (payload: unknown) => {
    const data = payload as GuildDataPayload
    useGameStore.getState().setGuildData({
      guild: data.guild,
      members: data.members,
      myRole: data.my_role,
    })
  }

  private handleGuildList = (payload: unknown) => {
    const data = payload as GuildListPayload
    useGameStore.getState().setGuildList(data.guilds, data.total)
  }

  private handleGuildMemberJoined = (payload: unknown) => {
    const data = payload as GuildMemberJoinedPayload
    useGameStore.getState().addGuildMember(data.member)
  }

  private handleGuildMemberLeft = (payload: unknown) => {
    const data = payload as GuildMemberLeftPayload
    useGameStore.getState().removeGuildMember(data.player_id)
  }

  private handleGuildMemberKicked = (payload: unknown) => {
    const data = payload as GuildMemberKickedPayload
    useGameStore.getState().removeGuildMember(data.player_id)
  }

  private handleGuildRoleChanged = (payload: unknown) => {
    const data = payload as GuildRoleChangedPayload
    useGameStore.getState().updateGuildMemberRole(data.player_id, data.new_role)
  }

  private handleGuildDisbanded = (payload: unknown) => {
    const data = payload as GuildDisbandedPayload
    const store = useGameStore.getState()
    store.clearGuildState()
    store.setGuildError(`Guild "${data.guild_name}" has been disbanded`)
  }

  private handleGuildKicked = () => {
    const store = useGameStore.getState()
    store.clearGuildState()
    store.setGuildError('You have been kicked from the guild')
  }

  private handleGuildLeft = () => {
    useGameStore.getState().clearGuildState()
  }

  private handleGuildCreated = (_payload: unknown) => {
    // After guild creation, request fresh guild data
    this.getGuild()
  }

  private handleGuildJoined = (_payload: unknown) => {
    // After joining guild, request fresh guild data
    this.getGuild()
  }

  private handleGuildError = (payload: unknown) => {
    const data = payload as GuildErrorPayload
    useGameStore.getState().setGuildError(data.error)
  }

  // ============================================
  // GUILD INVITE HANDLERS
  // ============================================

  private handleGuildInvitesList = (payload: unknown) => {
    const data = payload as GuildInvitesListPayload
    useGameStore.getState().setGuildInvites(data.invites)
  }

  private handleGuildOutgoingInvites = (payload: unknown) => {
    const data = payload as GuildOutgoingInvitesPayload
    useGameStore.getState().setGuildOutgoingInvites(data.invites)
  }

  private handleGuildInviteReceived = (payload: unknown) => {
    const data = payload as GuildInviteReceivedPayload
    const invite: GuildInvite = {
      id: data.invite_id,
      guild_id: data.guild_id,
      guild_name: data.guild_name,
      guild_tag: data.guild_tag,
      member_count: data.member_count,
      max_members: data.max_members,
      invited_by: data.invited_by_id,
      invited_by_username: data.invited_by_username,
      created_at: data.created_at,
      expires_at: data.expires_at,
    }
    useGameStore.getState().addGuildInvite(invite)
    // Show notification in system chat
    useGameStore.getState().addChatMessage({
      id: `guild-invite-${data.invite_id}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'system',
      content: `You received a guild invite from [${data.guild_tag}] ${data.guild_name}! Check the Guild tab to respond.`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildInviteSent = (payload: unknown) => {
    const data = payload as GuildInviteSentPayload
    if (data.success) {
      // Refresh outgoing invites to get the new one
      this.getGuildOutgoingInvites()
    }
  }

  private handleGuildInviteAccepted = (_payload: unknown) => {
    // Clear all invites after joining a guild
    useGameStore.getState().clearGuildInvites()
    // Request fresh guild data
    this.getGuild()
  }

  private handleGuildInviteDeclined = (payload: unknown) => {
    const data = payload as GuildInviteDeclinedPayload
    useGameStore.getState().removeGuildInvite(data.invite_id)
  }

  private handleGuildInviteCancelled = (payload: unknown) => {
    const data = payload as GuildInviteCancelledPayload
    useGameStore.getState().removeGuildOutgoingInvite(data.invite_id)
  }

  private handleGuildInviteError = (payload: unknown) => {
    const data = payload as { error: string }
    // Show error in system chat and set guild error state
    useGameStore.getState().setGuildError(data.error)
    // Also add to system chat for visibility
    useGameStore.getState().addChatMessage({
      id: `guild-invite-error-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'system',
      content: `Guild invite failed: ${data.error}`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  // ============================================
  // Guild Chat Handlers
  // ============================================

  private handleGuildChatHistory = (payload: unknown) => {
    const data = payload as GuildChatHistoryPayload
    // Convert guild messages to chat messages with role info
    const chatMessages = data.messages.map((msg: GuildMessageEntry) => ({
      id: msg.id,
      playerId: msg.player_id,
      playerName: msg.player_username,
      channel: 'guild' as ChatChannel,
      content: msg.content,
      createdAt: new Date(msg.created_at),
      playerRole: msg.player_role,
    }))
    // Set all guild channel messages at once
    useGameStore.getState().setGuildChatHistory(chatMessages)
  }

  private handleGuildChatMessage = (payload: unknown) => {
    const data = payload as GuildChatMessagePayload
    const msg = data.message
    // Convert guild message to chat message with role info
    useGameStore.getState().addChatMessage({
      id: msg.id,
      playerId: msg.player_id,
      playerName: msg.player_username,
      channel: 'guild' as ChatChannel,
      content: msg.content,
      createdAt: new Date(msg.created_at),
      playerRole: msg.player_role,
    })
  }

  // ============================================
  // Guild Bank Handlers
  // ============================================

  private handleGuildBankData = (payload: unknown) => {
    const data = payload as GuildBankDataPayload
    useGameStore.getState().setGuildBank(data.bank)
  }

  private handleGuildBankCurrencyUpdated = (payload: unknown) => {
    const data = payload as GuildBankCurrencyUpdatedPayload
    useGameStore.getState().updateGuildBankCurrency(data.balance)
  }

  private handleGuildBankItemUpdated = (_payload: unknown) => {
    // Refetch bank for accurate data
    this.getGuildBank()
  }

  private handleGuildBankPokemonAdded = (_payload: unknown) => {
    // Refetch bank for full pokemon data
    this.getGuildBank()
  }

  private handleGuildBankPokemonRemoved = (payload: unknown) => {
    const data = payload as GuildBankPokemonRemovedPayload
    useGameStore.getState().removeGuildBankPokemon(data.pokemon_id)
  }

  private handleGuildBankSlotsExpanded = (_payload: unknown) => {
    // Refetch bank for updated slot counts
    this.getGuildBank()
  }

  private handleGuildBankLogs = (payload: unknown) => {
    const data = payload as GuildBankLogsPayload
    useGameStore.getState().setGuildBankLogs(data.logs, data.total)
  }

  private handleGuildBankRequests = (payload: unknown) => {
    const data = payload as GuildBankRequestsPayload
    useGameStore.getState().setGuildBankRequests(data.requests)
  }

  private handleGuildBankRequestCreated = (payload: unknown) => {
    const data = payload as GuildBankRequestCreatedPayload
    useGameStore.getState().addGuildBankRequest(data.request)
  }

  private handleGuildBankRequestFulfilled = (payload: unknown) => {
    const data = payload as GuildBankRequestFulfilledPayload
    useGameStore.getState().removeGuildBankRequest(data.request_id)
  }

  private handleGuildBankMyLimits = (payload: unknown) => {
    const data = payload as GuildBankMyLimitsPayload
    useGameStore.getState().setMyBankLimits(data)
  }

  private handleGuildBankError = (payload: unknown) => {
    const data = payload as GuildBankErrorPayload
    console.error('Guild bank error:', data.error)
  }

  private handleGuildBankSuccess = (payload: unknown) => {
    const data = payload as GuildBankSuccessPayload
    console.log('Guild bank success:', data.message)
  }

  // ============================================
  // Guild Bank Methods
  // ============================================

  getGuildBank() {
    this.send('get_guild_bank', {})
  }

  depositCurrency(amount: number) {
    this.send('deposit_currency', { amount })
  }

  withdrawCurrency(amount: number) {
    this.send('withdraw_currency', { amount })
  }

  depositItem(itemId: string, quantity: number) {
    this.send('deposit_item', { item_id: itemId, quantity })
  }

  withdrawItem(itemId: string, quantity: number) {
    this.send('withdraw_item', { item_id: itemId, quantity })
  }

  depositPokemon(pokemonId: string) {
    this.send('deposit_pokemon', { pokemon_id: pokemonId })
  }

  withdrawPokemon(pokemonId: string) {
    this.send('withdraw_pokemon', { pokemon_id: pokemonId })
  }

  expandPokemonSlots() {
    this.send('expand_pokemon_slots', {})
  }

  createBankRequest(requestType: string, details: Record<string, unknown>, note?: string) {
    this.send('create_bank_request', { request_type: requestType, details, note })
  }

  fulfillBankRequest(requestId: string) {
    this.send('fulfill_bank_request', { request_id: requestId })
  }

  cancelBankRequest(requestId: string) {
    this.send('cancel_bank_request', { request_id: requestId })
  }

  getBankRequests(includeExpired: boolean = false) {
    this.send('get_bank_requests', { include_expired: includeExpired })
  }

  getBankLogs(options: { page?: number; limit?: number; filterPlayer?: string; filterAction?: string; filterCategory?: string } = {}) {
    this.send('get_bank_logs', {
      page: options.page,
      limit: options.limit,
      filter_player: options.filterPlayer,
      filter_action: options.filterAction,
      filter_category: options.filterCategory
    })
  }

  // Permission configuration (leader only)
  setBankPermission(category: string, role: string, canDeposit: boolean, canWithdraw: boolean) {
    this.send('set_bank_permission', { category, role, can_deposit: canDeposit, can_withdraw: canWithdraw })
  }

  setBankLimit(role: string, category: string, dailyLimit: number, pokemonPointsLimit?: number) {
    this.send('set_bank_limit', { role, category, daily_limit: dailyLimit, pokemon_points_limit: pokemonPointsLimit })
  }

  setPlayerOverride(playerId: string, category: string, customLimit: number) {
    this.send('set_player_override', { player_id: playerId, category, custom_limit: customLimit })
  }

  removePlayerOverride(playerId: string, category: string) {
    this.send('remove_player_override', { player_id: playerId, category })
  }

  // ============================================
  // Guild Quest Handlers
  // ============================================

  private handleGuildQuestsData = (payload: unknown) => {
    const data = payload as GuildQuestsDataPayload
    useGameStore.getState().setGuildQuests(data.quests)
  }

  private handleGuildQuestDetails = (payload: unknown) => {
    const data = payload as GuildQuestDetailsPayload
    useGameStore.getState().setGuildQuestDetails(data.quest)
  }

  private handleGuildQuestProgress = (payload: unknown) => {
    const data = payload as GuildQuestProgressPayload
    const store = useGameStore.getState()
    store.updateQuestProgress(data.quest_id, data.current_progress, data.is_completed)
    // Update my contribution if I'm the contributor
    if (data.contributor_id === store.player?.id) {
      store.updateQuestContribution(data.quest_id, data.contributor_id, data.contribution_amount)
    }
  }

  private handleGuildQuestMilestone = (payload: unknown) => {
    const data = payload as GuildQuestMilestonePayload
    // Add milestone to system chat
    const milestoneText = data.milestone === 100 ? 'COMPLETE' : `${data.milestone}%`
    useGameStore.getState().addChatMessage({
      id: `quest-milestone-${data.quest_id}-${data.milestone}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `[${data.period.toUpperCase()}] Quest "${data.quest_description}" is ${milestoneText}! (${data.current_progress}/${data.target_count})`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildQuestCompleted = (payload: unknown) => {
    const data = payload as GuildQuestCompletedPayload
    // Dispatch custom event for confetti celebration
    window.dispatchEvent(new CustomEvent('guild-quest-completed', {
      detail: { quest_id: data.quest_id }
    }))
    // Add completion message to guild chat
    const rewards: string[] = []
    if (data.reward_currency) rewards.push(`${data.reward_currency.toLocaleString()} currency`)
    if (data.reward_guild_points) rewards.push(`${data.reward_guild_points} guild points`)
    if (data.reward_item_id && data.reward_item_quantity) {
      rewards.push(`${data.reward_item_quantity}x ${data.reward_item_id}`)
    }
    useGameStore.getState().addChatMessage({
      id: `quest-complete-${data.quest_id}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `[${data.period.toUpperCase()}] Quest "${data.quest_description}" COMPLETED! Rewards: ${rewards.join(', ')}`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildQuestRerolled = (payload: unknown) => {
    const data = payload as GuildQuestRerolledPayload
    useGameStore.getState().replaceQuest(data.old_quest_id, data.new_quest, data.new_reroll_status)
    // Add message to guild chat
    useGameStore.getState().addChatMessage({
      id: `quest-reroll-${data.new_quest.id}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `${data.rerolled_by_username} rerolled a quest. New quest: "${data.new_quest.description}"`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildQuestHistory = (payload: unknown) => {
    const data = payload as GuildQuestHistoryPayload
    useGameStore.getState().setGuildQuestHistory({
      history: data.history,
      total: data.total,
      page: data.page
    })
  }

  private handleGuildQuestsReset = (payload: unknown) => {
    const data = payload as GuildQuestsResetPayload
    // Refresh the quest state with new quests
    const store = useGameStore.getState()
    if (store.guildQuests) {
      if (data.period === 'daily') {
        store.setGuildQuests({
          ...store.guildQuests,
          daily: data.new_quests,
          reset_times: data.reset_times
        })
      } else {
        store.setGuildQuests({
          ...store.guildQuests,
          weekly: data.new_quests,
          reset_times: data.reset_times
        })
      }
    }
    // Add reset message to guild chat
    useGameStore.getState().addChatMessage({
      id: `quest-reset-${data.period}-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `${data.period.charAt(0).toUpperCase() + data.period.slice(1)} quests have been reset! Check the Quests tab for new challenges.`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildQuestError = (payload: unknown) => {
    const data = payload as GuildQuestErrorPayload
    console.error('Guild quest error:', data.error)
  }

  // ============================================
  // Guild Quest Methods
  // ============================================

  getGuildQuests() {
    this.send('get_guild_quests', {})
  }

  getQuestDetails(questId: string) {
    this.send('get_quest_details', { quest_id: questId })
  }

  rerollQuest(questId: string) {
    this.send('reroll_quest', { quest_id: questId })
  }

  getQuestHistory(options: { page?: number; limit?: number } = {}) {
    this.send('get_quest_history', {
      page: options.page ?? 1,
      limit: options.limit ?? 20
    })
  }

  // ============================================
  // Guild Shop/Statistics Handlers
  // ============================================

  private handleGuildActiveBuffs = (payload: unknown) => {
    const data = payload as GuildActiveBuffsPayload
    useGameStore.getState().setGuildActiveBuffs(data.buffs)
  }

  private handleGuildBuffPurchased = (payload: unknown) => {
    const data = payload as GuildBuffPurchasedPayload
    if (!data.buff) {
      console.error('Guild buff purchased payload missing buff data:', data)
      return
    }
    useGameStore.getState().updateGuildBuff(data.buff)
    // Add system message to guild chat
    const buffName = data.buff.buff_type.replace(/_/g, ' ')
    useGameStore.getState().addChatMessage({
      id: `buff-purchased-${data.buff.id}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `${data.purchased_by_username} activated ${buffName} buff!`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildBuffExpired = (payload: unknown) => {
    const data = payload as GuildBuffExpiredPayload
    useGameStore.getState().clearExpiredBuff(data.buff_type)
    // Add system message to guild chat
    const buffName = data.buff_type.replace(/_/g, ' ')
    useGameStore.getState().addChatMessage({
      id: `buff-expired-${data.buff_type}-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      channel: 'guild',
      content: `The ${buffName} buff has expired.`,
      createdAt: new Date(),
      isSystem: true
    })
  }

  private handleGuildStatistics = (payload: unknown) => {
    const data = payload as GuildStatisticsPayload
    useGameStore.getState().setGuildStatistics(data.statistics)
  }

  private handleGuildLeaderboard = (payload: unknown) => {
    const data = payload as GuildLeaderboardPayload
    useGameStore.getState().setGuildLeaderboard({
      metric: data.metric,
      entries: data.entries,
      myGuildRank: data.my_guild_rank
    })
  }

  private handleGuildShopError = (payload: unknown) => {
    const data = payload as GuildShopErrorPayload
    console.error('Guild shop error:', data.error)
  }

  // ============================================
  // Guild Shop/Statistics Methods
  // ============================================

  sendPurchaseGuildBuff(buffType: string, durationHours: number, useGuildPoints: boolean = false) {
    this.send('purchase_guild_buff', { buff_type: buffType, duration_hours: durationHours, use_guild_points: useGuildPoints })
  }

  sendGetActiveBuffs() {
    this.send('get_active_buffs', {})
  }

  sendGetGuildStatistics() {
    this.send('get_guild_statistics', {})
  }

  sendGetGuildLeaderboard(metric: string, limit: number = 50) {
    this.send('get_guild_leaderboard', { metric, limit })
  }

  // ============================================
  // PROGRESSIVE BATTLE METHODS
  // ============================================

  // Request next battle turn from server
  requestTurn() {
    this.send('request_turn', {})
  }

  // Attempt to catch the wild Pokemon
  attemptCatch(ballType: 'pokeball' | 'great_ball') {
    this.send('attempt_catch', { ball_type: ballType })
  }

  // ============================================
  // PROGRESSIVE BATTLE HANDLERS
  // ============================================

  private handleEncounterStart = (payload: unknown) => {
    const data = payload as {
      wild_pokemon: WildPokemon
      lead_pokemon: {
        id: string
        name: string
        level: number
        current_hp: number
        max_hp: number
        species_id: number
        is_shiny: boolean
      }
      player_first: boolean
      resume?: boolean
      current_turn?: number
      player_hp?: number
      wild_hp?: number
      status?: string
    }

    const store = useGameStore.getState()

    // If resuming, use server's HP values
    const playerHP = data.resume ? (data.player_hp ?? data.lead_pokemon.current_hp) : data.lead_pokemon.current_hp
    const wildHP = data.resume ? (data.wild_hp ?? data.wild_pokemon.max_hp) : data.wild_pokemon.max_hp

    // Determine initial status
    const status = data.resume && data.status === 'catching' ? 'catching' : 'intro'

    store.setActiveBattle({
      wildPokemon: data.wild_pokemon,
      leadPokemon: data.lead_pokemon,
      playerFirst: data.player_first,
      status,
      currentTurn: null,
      playerHP,
      wildHP,
      playerMaxHP: data.lead_pokemon.max_hp,
      wildMaxHP: data.wild_pokemon.max_hp,
      canCatch: false,
      catchResult: null,
      catchComplete: null,
      battleSummary: null
    })

    if (data.resume) {
      console.log(`[Battle] Resuming battle at turn ${data.current_turn}, status: ${data.status}`)

      // If battle was in catching state, auto-trigger catch sequence
      if (data.status === 'catching') {
        // Determine ball type and attempt catch
        const inventory = store.inventory
        const ballType = (inventory.great_ball || 0) > 0 ? 'great_ball' : 'pokeball'
        gameSocket.attemptCatch(ballType)
      } else {
        // Request next turn to resume battle
        gameSocket.requestTurn()
      }
    }
  }

  private handleBattleTurn = (payload: unknown) => {
    const data = payload as {
      turn: BattleTurn
      battleStatus: 'ongoing' | 'player_win' | 'player_faint'
      playerHP: number
      wildHP: number
      canCatch: boolean
    }

    const store = useGameStore.getState()
    store.setBattleTurn({
      turn: data.turn,
      battleStatus: data.battleStatus,
      playerHP: data.playerHP,
      wildHP: data.wildHP,
      canCatch: data.canCatch
    })
  }

  private handleCatchResult = (payload: unknown) => {
    const data = payload as {
      shakeCount: number
      success: boolean
      isNewPokedexEntry: boolean
      catchStrength: number
      ball_type: string
      pokeballs: number
      great_balls: number
    }

    const store = useGameStore.getState()
    store.setCatchResult(data)

    // Update inventory
    store.setInventory({
      ...store.inventory,
      pokeball: data.pokeballs,
      great_ball: data.great_balls
    })
    store.setPokeballs(data.pokeballs)
  }

  private handleCatchComplete = (payload: unknown) => {
    const data = payload as {
      caught_pokemon: Pokemon
      xp_earned: number
      is_new_pokedex_entry: boolean
    }

    const store = useGameStore.getState()
    store.setCatchComplete(data)

    // Add caught Pokemon to box
    store.addToBox(data.caught_pokemon)

    // Apply XP to lead Pokemon
    if (data.xp_earned > 0) {
      store.applyXPGains({ [store.party[0]?.id || '']: data.xp_earned })
    }
  }

  private handleBattleSummary = (payload: unknown) => {
    const data = payload as {
      outcome: 'timeout' | 'win' | 'lose'
      message: string
    }

    const store = useGameStore.getState()
    store.setBattleSummary(data)
  }
}

// Singleton instance
export const gameSocket = new GameSocket()

// Expose for debugging in browser console (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { __gameSocket: GameSocket }).__gameSocket = gameSocket
}
