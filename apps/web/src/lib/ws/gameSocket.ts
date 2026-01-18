import { useGameStore } from '@/stores/gameStore'
import type { TickResult, GameState, Zone, Pokemon, ShopItem, PendingEvolution, EvolutionEvent, LeaderboardEntry, LeaderboardType, LeaderboardTimeframe, PlayerRank } from '@/types/game'
import type { GymLeader, GymBattleResult } from '@/components/game/GymBattlePanel'
import type { ChatMessageData, ChatChannel, WhisperMessageData, BlockedPlayerData } from '@/types/chat'
import type { Friend, FriendRequest, OutgoingFriendRequest } from '@/types/friends'
import type { IncomingTradeRequest, OutgoingTradeRequest, TradeOffer, TradeStatus, TradeHistoryEntry } from '@/types/trade'
import type {
  Guild,
  GuildMember,
  GuildRole,
  GuildPreview,
  GuildDataPayload,
  GuildListPayload,
  GuildMemberJoinedPayload,
  GuildMemberLeftPayload,
  GuildMemberKickedPayload,
  GuildRoleChangedPayload,
  GuildDisbandedPayload,
  GuildErrorPayload,
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

const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']

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
      store.setPendingEncounterRewards({
        xpGained: result.xp_gained || null,
        levelUps: result.level_ups || null,
        pendingEvolutions: result.pending_evolutions || null,
      })
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

  private handleGuildCreated = (payload: unknown) => {
    // After guild creation, request fresh guild data
    this.getGuild()
  }

  private handleGuildJoined = (payload: unknown) => {
    // After joining guild, request fresh guild data
    this.getGuild()
  }

  private handleGuildError = (payload: unknown) => {
    const data = payload as GuildErrorPayload
    useGameStore.getState().setGuildError(data.error)
  }
}

// Singleton instance
export const gameSocket = new GameSocket()

// Expose for debugging in browser console (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { __gameSocket: GameSocket }).__gameSocket = gameSocket
}
