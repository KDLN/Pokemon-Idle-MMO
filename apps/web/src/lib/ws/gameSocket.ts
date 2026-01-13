import { useGameStore } from '@/stores/gameStore'
import type { TickResult, GameState, Zone, Pokemon, ShopItem } from '@/types/game'
import type { GymLeader, GymBattleResult } from '@/components/game/GymBattlePanel'

type MessageHandler = (payload: unknown) => void

class GameSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private token: string | null = null
  private handlers: Map<string, MessageHandler> = new Map()

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
    this.handlers.set('error', this.handleError)
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
      this.reconnectAttempts = 0
      useGameStore.getState().setConnected(true)
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: unknown }
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

  send(type: string, payload: unknown = {}) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    this.ws.send(JSON.stringify({ type, payload }))
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

  // Message handlers - using arrow functions to avoid binding issues
  private handleTick = (payload: unknown) => {
    const result = payload as TickResult
    const store = useGameStore.getState()

    // Update pokeball count
    store.setPokeballs(result.pokeballs)

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
    }

    // Apply XP gains
    if (result.xp_gained) {
      store.applyXPGains(result.xp_gained)
    }

    // Handle level ups
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
  }

  private handleGameState = (payload: unknown) => {
    const state = payload as GameState
    const store = useGameStore.getState()

    store.setPlayer(state.player)
    store.setParty(state.party)
    store.setZone(state.zone, state.connected_zones)
    store.setPokeballs(state.pokeballs)
    store.setPokedollars(state.pokedollars)
    store.setBox(state.box || [])
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
    const { message } = payload as { message: string }
    console.error('Server error:', message)
    // Could show toast notification here
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

    // Call the gym battle handler if it exists (for UI updates)
    const handler = (window as unknown as { __gymBattleHandler?: (result: GymBattleResult) => void }).__gymBattleHandler
    if (handler) {
      handler(result)
    }
  }
}

// Singleton instance
export const gameSocket = new GameSocket()
