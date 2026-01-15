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
  removeFriend
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

export class GameHub {
  private wss: WebSocketServer
  private clients: Map<WebSocket, Client> = new Map()
  private speciesMap: Map<number, PokemonSpecies> = new Map()
  private tickInterval: NodeJS.Timeout | null = null

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
        default:
          console.log('Unknown message type:', msg.type)
      }
    } catch (err) {
      console.error('Failed to handle message:', err)
    }
  }

  private handleDisconnect(client: Client) {
    console.log(`Client disconnected: ${client.userId}`)
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

  private async handleMoveZone(client: Client, payload: { zone_id: number }) {
    if (!client.session) return

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

    this.send(client, 'zone_update', {
      zone: newZone,
      connected_zones: newConnectedZones
    })
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

    const { friend_id } = payload
    if (!friend_id) {
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

    const { friend_id } = payload
    if (!friend_id) {
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

    const { friend_id } = payload
    if (!friend_id) {
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
}
