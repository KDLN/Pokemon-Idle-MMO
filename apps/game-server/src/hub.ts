import { WebSocket, WebSocketServer } from 'ws'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { IncomingMessage } from 'http'
import type { PlayerSession, WSMessage, PokemonSpecies, Zone, Pokemon, ChatChannel } from './types.js'
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
  getActiveTradeIds
} from './db.js'
import { processTick, simulateGymBattle } from './game.js'

interface Client {
  ws: WebSocket
  userId: string
  session: PlayerSession | null
}

const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']
const MAX_CHAT_LENGTH = 280

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
  private speciesMap: Map<number, PokemonSpecies> = new Map()
  private tickInterval: NodeJS.Timeout | null = null
  private tradeReadyStates: Map<string, TradeReadyState> = new Map()

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req))

    console.log(`WebSocket server running on port ${port}`)
  }

  start() {
    // Start tick loop (1 second)
    this.tickInterval = setInterval(() => this.processTicks(), 1000)

    // Update presence every 60 seconds
    setInterval(() => this.updatePresence(), 60000)
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
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
      await this.sendGameState(client)
      await this.sendChatHistory(client)
      await this.sendFriendsData(client)
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

    const [party, zone, pokeballs, great_balls, encounterTable] = await Promise.all([
      getPlayerParty(player.id),
      getZone(player.current_zone_id),
      getPlayerPokeballs(player.id),
      getPlayerGreatBalls(player.id),
      getEncounterTable(player.current_zone_id)
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
      encounterCooldown: 0
    }
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

    // Always remove client from map, even if cleanup failed
    this.clients.delete(client.ws)
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

  private broadcast(type: string, payload: unknown) {
    for (const [, client] of this.clients) {
      this.send(client, type, payload)
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

        // Save the ball that was consumed
        if (catchResult.ball_type === 'great_ball') {
          await updatePlayerGreatBalls(client.session.player.id, client.session.great_balls)
        } else {
          await updatePlayerPokeballs(client.session.player.id, client.session.pokeballs)
        }

        // Handle successful catch
        if (catchResult.success) {
          const pokemon = await saveCaughtPokemon(
            client.session.player.id,
            wild.species,
            wild.level,
            wild.is_shiny
          )
          if (pokemon) {
            result.encounter.catch_result.pokemon_id = pokemon.id
            // Add the caught pokemon to the result so the client can add it to their box
            result.encounter.catch_result.caught_pokemon = {
              ...pokemon,
              species: wild.species
            }
            await updatePokedex(client.session.player.id, wild.species_id, true)
          }
        } else {
          // Failed catch - still mark as seen
          await updatePokedex(client.session.player.id, wild.species_id, false)
        }
      } else if (result.encounter) {
        // Lost battle - mark as seen in pokedex
        await updatePokedex(client.session.player.id, result.encounter.wild_pokemon.species_id, false)
      }

      // Save level ups (stats changed)
      if (result.level_ups && result.level_ups.length > 0) {
        for (const pokemon of client.session.party) {
          if (pokemon) {
            await updatePokemonStats(pokemon)
          }
        }
      } else if (result.xp_gained) {
        // Save XP gains to database (even if no level up)
        for (const pokemon of client.session.party) {
          if (pokemon && result.xp_gained[pokemon.id]) {
            await savePokemonXP(pokemon.id, pokemon.xp)
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

    const [connectedZones, box, inventory] = await Promise.all([
      getConnectedZones(client.session.zone.id),
      getPlayerBox(client.session.player.id),
      getPlayerInventory(client.session.player.id)
    ])

    this.send(client, 'game_state', {
      player: client.session.player,
      party: client.session.party,
      zone: client.session.zone,
      connected_zones: connectedZones,
      pokeballs: client.session.pokeballs,
      pokedollars: client.session.pokedollars,
      box,
      inventory
    })
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

  // Get client by player ID
  private getClientByPlayerId(playerId: string): Client | null {
    for (const [, otherClient] of this.clients) {
      if (otherClient.session?.player.id === playerId) {
        return otherClient
      }
    }
    return null
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
      this.sendError(client, result.error || 'Failed to send trade request')
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

  private async handleGetTrades(client: Client) {
    if (!client.session) return

    const [incoming, outgoing] = await Promise.all([
      getIncomingTradeRequests(client.session.player.id),
      getOutgoingTradeRequests(client.session.player.id)
    ])

    this.send(client, 'trades_data', { incoming, outgoing })
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

    // Complete the trade (transfers Pokemon)
    const result = await completeTrade(tradeId)

    if (!result.success) {
      this.sendError(client, result.error || 'Failed to complete trade')
      return
    }

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
      // CRITICAL: Delete ready state FIRST to prevent race condition
      // where both players click ready simultaneously and both trigger completion
      this.tradeReadyStates.delete(tradeId)

      // Complete the trade
      const result = await completeTrade(tradeId)

      if (result.success) {
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
    }
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
}
