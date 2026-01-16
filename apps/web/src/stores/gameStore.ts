import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Pokemon, Zone, EncounterEvent, LevelUpEvent, ShopItem } from '@/types/game'
import type { ChatMessageData, ChatChannel } from '@/types/chat'
import type { Friend, FriendRequest, OutgoingFriendRequest } from '@/types/friends'
import type { IncomingTradeRequest, OutgoingTradeRequest, ActiveTradeSession, TradeOffer, TradeHistoryEntry } from '@/types/trade'
import type { LogEntry } from '@/components/game/interactions/WorldLog'
import type { WorldEvent } from '@/components/game/social/WorldEventsTicker'
import type { GymLeader } from '@/components/game/GymBattlePanel'
import type { TimeOfDay } from '@/lib/time/timeOfDay'
import type { TrainerCustomization } from '@/lib/sprites/trainerCustomization'
import { DEFAULT_TRAINER_CUSTOMIZATION } from '@/lib/sprites/trainerCustomization'
import type { EventCosmetics } from '@/components/game/world/SpriteTrainer'

// Museum exhibit interface
interface MuseumExhibit {
  id: string
  name: string
  description: string
  icon: string
}

// Museum state interface
interface MuseumState {
  isOpen: boolean
  hasMembership: boolean
  cost?: number
  playerMoney?: number
  exhibits?: MuseumExhibit[]
  error?: string
}

// Season progress interface
interface SeasonProgress {
  current: number
  goal: number
  tier: number
  maxTier: number
  seasonName: string
  daysRemaining: number
}

// Chat state interface
interface ChatState {
  activeChannel: ChatChannel
  messages: Record<ChatChannel, ChatMessageData[]>
  unreadCounts: Record<ChatChannel, number>
}

const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system']

// World view state interface
interface WorldViewState {
  timeOfDay: TimeOfDay
  trainerPosition: { x: number; y: number }
  walkDirection: 'left' | 'right'
  isWalking: boolean
}

interface GameStore {
  // Player data
  player: Player | null
  setPlayer: (player: Player | null) => void

  // Current zone
  currentZone: Zone | null
  connectedZones: Zone[]
  setZone: (zone: Zone, connectedZones: Zone[]) => void

  // Party (up to 6 Pokemon)
  party: (Pokemon | null)[]
  setParty: (party: Pokemon[]) => void
  updatePokemonInParty: (pokemonId: string, updates: Partial<Pokemon>) => void

  // Box (stored Pokemon)
  box: Pokemon[]
  setBox: (box: Pokemon[]) => void
  addToBox: (pokemon: Pokemon) => void

  // Resources
  pokeballs: number
  setPokeballs: (count: number) => void
  pokedollars: number
  setPokedollars: (count: number) => void

  // Battle Points (new currency)
  battlePoints: number
  setBattlePoints: (count: number) => void

  // Badges
  badges: string[]
  setBadges: (badges: string[]) => void
  addBadge: (badgeId: string) => void

  // Season progress
  seasonProgress: SeasonProgress
  setSeasonProgress: (progress: Partial<SeasonProgress>) => void

  // Inventory
  inventory: Record<string, number>
  setInventory: (inventory: Record<string, number>) => void

  // Shop
  shopItems: ShopItem[]
  setShopItems: (items: ShopItem[]) => void
  isShopOpen: boolean
  setShopOpen: (open: boolean) => void

  // Gym
  isGymOpen: boolean
  setGymOpen: (open: boolean) => void
  currentGymLeader: GymLeader | null
  setCurrentGymLeader: (leader: GymLeader | null) => void

  // Current encounter (for display)
  currentEncounter: EncounterEvent | null
  setCurrentEncounter: (encounter: EncounterEvent | null) => void
  clearEncounter: () => void

  // Pending level ups for notifications
  pendingLevelUps: LevelUpEvent[]
  addLevelUps: (levelUps: LevelUpEvent[]) => void
  clearPendingLevelUps: () => void

  // XP gains for animation
  applyXPGains: (xpGained: Record<string, number>) => void

  // Chat state
  chat: ChatState
  setActiveChannel: (channel: ChatChannel) => void
  addChatMessage: (message: ChatMessageData) => void
  markChannelRead: (channel: ChatChannel) => void
  setChatMessages: (messages: Record<ChatChannel, ChatMessageData[]>) => void

  // World log
  worldLog: LogEntry[]
  addLogEntry: (entry: LogEntry) => void
  clearWorldLog: () => void

  // World events
  worldEvents: WorldEvent[]
  setWorldEvents: (events: WorldEvent[]) => void
  addWorldEvent: (event: WorldEvent) => void
  removeWorldEvent: (eventId: string) => void

  // World view state
  worldView: WorldViewState
  setWorldView: (updates: Partial<WorldViewState>) => void

  // Trainer customization (persisted)
  trainerCustomization: TrainerCustomization
  setTrainerCustomization: (customization: TrainerCustomization) => void

  // Event cosmetics (special effects, pets, held items)
  eventCosmetics: EventCosmetics
  setEventCosmetics: (cosmetics: Partial<EventCosmetics>) => void

  // Connection state
  isConnected: boolean
  setConnected: (connected: boolean) => void

  // Loading state
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // Friends state
  friends: Friend[]
  incomingFriendRequests: FriendRequest[]
  outgoingFriendRequests: OutgoingFriendRequest[]
  setFriends: (friends: Friend[]) => void
  setIncomingFriendRequests: (requests: FriendRequest[]) => void
  setOutgoingFriendRequests: (requests: OutgoingFriendRequest[]) => void
  setAllFriendsData: (data: { friends: Friend[]; incoming: FriendRequest[]; outgoing: OutgoingFriendRequest[] }) => void
  updateFriendZone: (friendPlayerId: string, zoneId: number, zoneName: string) => void

  // Nearby players state
  nearbyPlayers: { id: string; username: string }[]
  setNearbyPlayers: (players: { id: string; username: string }[]) => void

  // Trade state
  incomingTradeRequests: IncomingTradeRequest[]
  outgoingTradeRequests: OutgoingTradeRequest[]
  activeTrade: ActiveTradeSession | null
  isTradeModalOpen: boolean
  tradeHistory: TradeHistoryEntry[]
  tradeHistoryLoading: boolean
  setIncomingTradeRequests: (requests: IncomingTradeRequest[]) => void
  setOutgoingTradeRequests: (requests: OutgoingTradeRequest[]) => void
  setAllTradesData: (data: { incoming: IncomingTradeRequest[]; outgoing: OutgoingTradeRequest[] }) => void
  setActiveTrade: (trade: ActiveTradeSession | null) => void
  setTradeModalOpen: (open: boolean) => void
  updateTradeOffers: (tradeId: string, offers: TradeOffer[], warning?: string) => void
  setTradeWarning: (tradeId: string, warning: string) => void
  setTradeReady: (myReady: boolean, theirReady: boolean) => void
  setTradeHistory: (history: TradeHistoryEntry[]) => void
  setTradeHistoryLoading: (loading: boolean) => void

  // Museum state
  museum: MuseumState
  openMuseum: (data: { has_membership: boolean; cost?: number; player_money?: number; exhibits?: MuseumExhibit[] }) => void
  closeMuseum: () => void
  setMuseumError: (error: string) => void

  // Reset store
  reset: () => void
}

const initialChatState: ChatState = {
  activeChannel: 'global',
  messages: {
    global: [],
    trade: [],
    guild: [],
    system: [],
  },
  unreadCounts: {
    global: 0,
    trade: 0,
    guild: 0,
    system: 0,
  },
}

const initialSeasonProgress: SeasonProgress = {
  current: 0,
  goal: 1000,
  tier: 1,
  maxTier: 50,
  seasonName: 'Season 1',
  daysRemaining: 30,
}

const initialWorldView: WorldViewState = {
  timeOfDay: 'day',
  trainerPosition: { x: 50, y: 50 },
  walkDirection: 'right',
  isWalking: false,
}

const initialMuseumState: MuseumState = {
  isOpen: false,
  hasMembership: false,
}

const initialState = {
  player: null,
  currentZone: null,
  connectedZones: [],
  party: [null, null, null, null, null, null] as (Pokemon | null)[],
  box: [],
  pokeballs: 0,
  pokedollars: 0,
  battlePoints: 0,
  badges: [] as string[],
  seasonProgress: initialSeasonProgress,
  inventory: {},
  shopItems: [],
  isShopOpen: false,
  isGymOpen: false,
  currentGymLeader: null,
  currentEncounter: null,
  pendingLevelUps: [],
  chat: initialChatState,
  worldLog: [] as LogEntry[],
  worldEvents: [] as WorldEvent[],
  worldView: initialWorldView,
  trainerCustomization: DEFAULT_TRAINER_CUSTOMIZATION,
  eventCosmetics: {} as EventCosmetics,
  isConnected: false,
  isLoading: true,
  // Friends state
  friends: [] as Friend[],
  incomingFriendRequests: [] as FriendRequest[],
  outgoingFriendRequests: [] as OutgoingFriendRequest[],
  // Nearby players state
  nearbyPlayers: [] as { id: string; username: string }[],
  // Trade state
  incomingTradeRequests: [] as IncomingTradeRequest[],
  outgoingTradeRequests: [] as OutgoingTradeRequest[],
  activeTrade: null as ActiveTradeSession | null,
  isTradeModalOpen: false,
  tradeHistory: [] as TradeHistoryEntry[],
  tradeHistoryLoading: false,
  // Museum state
  museum: initialMuseumState,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPlayer: (player) => set({ player }),

  setZone: (zone, connectedZones) => set({ currentZone: zone, connectedZones }),

  setParty: (partyPokemon) => {
    // Convert array to 6-slot array
    const party: (Pokemon | null)[] = [null, null, null, null, null, null]
    for (const pokemon of partyPokemon) {
      // Skip null entries
      if (!pokemon) continue
      if (pokemon.party_slot && pokemon.party_slot >= 1 && pokemon.party_slot <= 6) {
        party[pokemon.party_slot - 1] = pokemon
      }
    }
    set({ party })
  },

  updatePokemonInParty: (pokemonId, updates) => {
    const party = get().party.map((p) =>
      p && p.id === pokemonId ? { ...p, ...updates } : p
    )
    set({ party })
  },

  setBox: (box) => set({ box }),

  addToBox: (pokemon) => set((state) => ({ box: [pokemon, ...state.box] })),

  setPokeballs: (count) => set({ pokeballs: count }),

  setPokedollars: (count) => set({ pokedollars: count }),

  setBattlePoints: (count) => set({ battlePoints: count }),

  setBadges: (badges) => set({ badges }),

  addBadge: (badgeId) =>
    set((state) => ({
      badges: state.badges.includes(badgeId)
        ? state.badges
        : [...state.badges, badgeId],
    })),

  setSeasonProgress: (progress) =>
    set((state) => ({
      seasonProgress: { ...state.seasonProgress, ...progress },
    })),

  setInventory: (inventory) => set({ inventory }),

  setShopItems: (items) => set({ shopItems: items }),

  setShopOpen: (open) => set({ isShopOpen: open }),

  setGymOpen: (open) => set({ isGymOpen: open }),

  setCurrentGymLeader: (leader) => set({ currentGymLeader: leader }),

  setCurrentEncounter: (encounter) => set({ currentEncounter: encounter }),

  clearEncounter: () => set({ currentEncounter: null }),

  addLevelUps: (levelUps) =>
    set((state) => ({ pendingLevelUps: [...state.pendingLevelUps, ...levelUps] })),

  clearPendingLevelUps: () => set({ pendingLevelUps: [] }),

  applyXPGains: (xpGained) => {
    const party = get().party.map((p) => {
      if (p && xpGained[p.id]) {
        return { ...p, xp: p.xp + xpGained[p.id] }
      }
      return p
    })
    set({ party })
  },

  // Chat methods
  setActiveChannel: (channel) =>
    set((state) => ({
      chat: {
        ...state.chat,
        activeChannel: channel,
        unreadCounts: {
          ...state.chat.unreadCounts,
          [channel]: 0,
        },
      },
    })),

  addChatMessage: (message) =>
    set((state) => {
      const channel = message.channel
      const isActiveChannel = state.chat.activeChannel === channel

      return {
        chat: {
          ...state.chat,
          messages: {
            ...state.chat.messages,
            [channel]: [...state.chat.messages[channel], message].slice(-100), // Keep last 100
          },
          unreadCounts: {
            ...state.chat.unreadCounts,
            [channel]: isActiveChannel
              ? 0
              : state.chat.unreadCounts[channel] + 1,
          },
        },
      }
    }),

  markChannelRead: (channel) =>
    set((state) => ({
      chat: {
        ...state.chat,
        unreadCounts: {
          ...state.chat.unreadCounts,
          [channel]: 0,
        },
      },
    })),

  setChatMessages: (messages) =>
    set((state) => {
      const unreadCounts = CHAT_CHANNELS.reduce((acc, channel) => {
        acc[channel] = state.chat.activeChannel === channel ? 0 : state.chat.unreadCounts[channel] ?? 0
        return acc
      }, {} as Record<ChatChannel, number>)

      return {
        chat: {
          ...state.chat,
          messages,
          unreadCounts,
        },
      }
    }),

  // World log methods
  addLogEntry: (entry) =>
    set((state) => ({
      worldLog: [...state.worldLog, entry].slice(-100), // Keep last 100
    })),

  clearWorldLog: () => set({ worldLog: [] }),

  // World events methods
  setWorldEvents: (events) => set({ worldEvents: events }),

  addWorldEvent: (event) =>
    set((state) => ({
      worldEvents: [...state.worldEvents, event],
    })),

  removeWorldEvent: (eventId) =>
    set((state) => ({
      worldEvents: state.worldEvents.filter((e) => e.id !== eventId),
    })),

  // World view methods
  setWorldView: (updates) =>
    set((state) => ({
      worldView: { ...state.worldView, ...updates },
    })),

  // Trainer customization
  setTrainerCustomization: (customization) => set({ trainerCustomization: customization }),

  // Event cosmetics
  setEventCosmetics: (cosmetics) =>
    set((state) => ({
      eventCosmetics: { ...state.eventCosmetics, ...cosmetics },
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Friends methods
  setFriends: (friends) => set({ friends }),

  setIncomingFriendRequests: (requests) => set({ incomingFriendRequests: requests }),

  setOutgoingFriendRequests: (requests) => set({ outgoingFriendRequests: requests }),

  setAllFriendsData: (data) => set({
    friends: data.friends,
    incomingFriendRequests: data.incoming,
    outgoingFriendRequests: data.outgoing,
  }),

  updateFriendZone: (friendPlayerId, zoneId, zoneName) =>
    set((state) => ({
      friends: state.friends.map((friend) => {
        // Check if this friend matches the player who moved
        const isFriend = friend.friend_player_id === friendPlayerId || friend.player_id === friendPlayerId
        if (isFriend) {
          return { ...friend, zone_id: zoneId, zone_name: zoneName }
        }
        return friend
      }),
    })),

  // Nearby players methods
  setNearbyPlayers: (players) => set({ nearbyPlayers: players }),

  // Trade methods
  setIncomingTradeRequests: (requests) => set({ incomingTradeRequests: requests }),

  setOutgoingTradeRequests: (requests) => set({ outgoingTradeRequests: requests }),

  setAllTradesData: (data) => set({
    incomingTradeRequests: data.incoming,
    outgoingTradeRequests: data.outgoing,
  }),

  setActiveTrade: (trade) => set({ activeTrade: trade }),

  setTradeModalOpen: (open) => set({ isTradeModalOpen: open }),

  updateTradeOffers: (tradeId, offers, warning) =>
    set((state) => {
      if (!state.activeTrade || state.activeTrade.trade_id !== tradeId) return state

      const playerId = state.player?.id
      const myOffers = offers.filter((o) => o.offered_by === playerId)
      const theirOffers = offers.filter((o) => o.offered_by !== playerId)

      return {
        activeTrade: {
          ...state.activeTrade,
          my_offers: myOffers,
          their_offers: theirOffers,
          warning,
          // Reset ready states when offers change
          my_ready: false,
          their_ready: false,
        },
      }
    }),

  setTradeWarning: (tradeId, warning) =>
    set((state) => {
      if (!state.activeTrade || state.activeTrade.trade_id !== tradeId) return state

      return {
        activeTrade: {
          ...state.activeTrade,
          warning,
        },
      }
    }),

  setTradeReady: (myReady, theirReady) =>
    set((state) => {
      if (!state.activeTrade) return state
      return {
        activeTrade: {
          ...state.activeTrade,
          my_ready: myReady,
          their_ready: theirReady,
        },
      }
    }),

  setTradeHistory: (history) => set({ tradeHistory: history, tradeHistoryLoading: false }),
  setTradeHistoryLoading: (loading) => set({ tradeHistoryLoading: loading }),

  // Museum methods
  openMuseum: (data) => set({
    museum: {
      isOpen: true,
      hasMembership: data.has_membership,
      cost: data.cost,
      playerMoney: data.player_money,
      exhibits: data.exhibits,
    },
  }),

  closeMuseum: () => set({
    museum: initialMuseumState,
  }),

  setMuseumError: (error) => set((state) => ({
    museum: {
      ...state.museum,
      error,
    },
  })),

  reset: () => set(initialState),
}))
