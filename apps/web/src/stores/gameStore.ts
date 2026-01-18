import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Pokemon, Zone, EncounterEvent, LevelUpEvent, PendingEvolution, ShopItem, LeaderboardEntry, LeaderboardType, LeaderboardTimeframe, PlayerRank } from '@/types/game'
import type { ChatMessageData, ChatChannel, WhisperMessageData, BlockedPlayerData } from '@/types/chat'
import type { Friend, FriendRequest, OutgoingFriendRequest } from '@/types/friends'
import type { IncomingTradeRequest, OutgoingTradeRequest, ActiveTradeSession, TradeOffer, TradeHistoryEntry } from '@/types/trade'
import type { LogEntry } from '@/components/game/interactions/WorldLog'
import type { WorldEvent } from '@/components/game/social/WorldEventsTicker'
import type { GymLeader, GymBattleResult } from '@/components/game/GymBattlePanel'
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

const CHAT_CHANNELS: ChatChannel[] = ['global', 'trade', 'guild', 'system', 'whisper']

// World view state interface
interface WorldViewState {
  timeOfDay: TimeOfDay
  trainerPosition: { x: number; y: number }
  walkDirection: 'left' | 'right'
  isWalking: boolean
}

// Pending encounter rewards - applied after battle animation completes
interface PendingEncounterRewards {
  xpGained: Record<string, number> | null
  levelUps: LevelUpEvent[] | null
  pendingEvolutions: PendingEvolution[] | null
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

  // Gym battle result (for communication between gameSocket and GymBattlePanel)
  pendingGymBattleResult: GymBattleResult | null
  setPendingGymBattleResult: (result: GymBattleResult | null) => void

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

  // Pending encounter rewards - applied after battle animation completes
  // This prevents XP/level-up UI from updating before the battle animation finishes
  pendingEncounterRewards: PendingEncounterRewards | null
  setPendingEncounterRewards: (rewards: PendingEncounterRewards | null) => void

  // Pending level ups for notifications
  pendingLevelUps: LevelUpEvent[]
  addLevelUps: (levelUps: LevelUpEvent[]) => void
  clearPendingLevelUps: () => void

  // Pending evolutions for modal
  pendingEvolutions: PendingEvolution[]
  activeEvolution: PendingEvolution | null
  addPendingEvolutions: (evolutions: PendingEvolution[]) => void
  setActiveEvolution: (evolution: PendingEvolution | null) => void
  removeEvolution: (pokemonId: string) => void
  processNextEvolution: () => void
  // Combined action to remove and advance queue atomically (avoids race conditions)
  completeEvolutionAndAdvance: (pokemonId: string) => void

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

  // Whisper state (Issue #45)
  whispers: WhisperMessageData[]
  activeWhisperPartner: string | null
  whisperUnreadCount: number
  addWhisper: (whisper: WhisperMessageData) => void
  setWhispers: (whispers: WhisperMessageData[]) => void
  setActiveWhisperPartner: (username: string | null) => void
  clearWhisperUnread: () => void

  // Block/mute state (Issue #47)
  blockedPlayers: BlockedPlayerData[]
  mutedPlayers: string[]  // Array for proper serialization (session-only, not persisted)
  setBlockedPlayers: (players: BlockedPlayerData[]) => void
  addBlockedPlayer: (player: BlockedPlayerData) => void
  removeBlockedPlayer: (playerId: string) => void
  mutePlayer: (playerId: string) => void
  unmutePlayer: (playerId: string) => void
  isPlayerMuted: (playerId: string) => boolean
  isPlayerBlocked: (playerId: string) => boolean

  // Leaderboard state (Issues #51-54)
  leaderboardEntries: LeaderboardEntry[]
  leaderboardType: LeaderboardType
  leaderboardTimeframe: LeaderboardTimeframe
  leaderboardPlayerRank: PlayerRank | null
  leaderboardLoading: boolean
  isLeaderboardOpen: boolean
  setLeaderboardData: (data: {
    entries: LeaderboardEntry[]
    type: LeaderboardType
    timeframe: LeaderboardTimeframe
    playerRank: PlayerRank | null
  }) => void
  setLeaderboardLoading: (loading: boolean) => void
  setLeaderboardOpen: (open: boolean) => void
  setLeaderboardType: (type: LeaderboardType) => void
  setLeaderboardTimeframe: (timeframe: LeaderboardTimeframe) => void

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
    whisper: [],
  },
  unreadCounts: {
    global: 0,
    trade: 0,
    guild: 0,
    system: 0,
    whisper: 0,
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
  pendingGymBattleResult: null as GymBattleResult | null,
  seasonProgress: initialSeasonProgress,
  inventory: {},
  shopItems: [],
  isShopOpen: false,
  isGymOpen: false,
  currentGymLeader: null,
  currentEncounter: null,
  pendingEncounterRewards: null as PendingEncounterRewards | null,
  pendingLevelUps: [],
  pendingEvolutions: [] as PendingEvolution[],
  activeEvolution: null as PendingEvolution | null,
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
  // Whisper state (Issue #45)
  whispers: [] as WhisperMessageData[],
  activeWhisperPartner: null as string | null,
  whisperUnreadCount: 0,
  // Block/mute state (Issue #47)
  blockedPlayers: [] as BlockedPlayerData[],
  mutedPlayers: [] as string[],
  // Leaderboard state (Issues #51-54)
  leaderboardEntries: [] as LeaderboardEntry[],
  leaderboardType: 'pokedex' as LeaderboardType,
  leaderboardTimeframe: 'alltime' as LeaderboardTimeframe,
  leaderboardPlayerRank: null as PlayerRank | null,
  leaderboardLoading: false,
  isLeaderboardOpen: false,
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

  setPendingGymBattleResult: (result) => set({ pendingGymBattleResult: result }),

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

  setPendingEncounterRewards: (rewards) => set({ pendingEncounterRewards: rewards }),

  clearEncounter: () => set((state) => {
    // When clearing the encounter, apply any pending rewards
    // This ensures XP/level-ups only update AFTER the battle animation completes
    const rewards = state.pendingEncounterRewards

    if (!rewards) {
      return { currentEncounter: null }
    }

    // Apply XP gains to party
    let newParty = state.party
    if (rewards.xpGained) {
      newParty = newParty.map((p) => {
        if (p && rewards.xpGained && rewards.xpGained[p.id]) {
          return { ...p, xp: p.xp + rewards.xpGained[p.id] }
        }
        return p
      })
    }

    // Apply level-up stat changes to party
    if (rewards.levelUps) {
      for (const levelUp of rewards.levelUps) {
        newParty = newParty.map((p) => {
          if (p && p.id === levelUp.pokemon_id) {
            return {
              ...p,
              level: levelUp.new_level,
              max_hp: levelUp.new_stats.max_hp,
              current_hp: levelUp.new_stats.max_hp, // Full heal on level up
              stat_attack: levelUp.new_stats.attack,
              stat_defense: levelUp.new_stats.defense,
              stat_sp_attack: levelUp.new_stats.sp_attack,
              stat_sp_defense: levelUp.new_stats.sp_defense,
              stat_speed: levelUp.new_stats.speed,
            }
          }
          return p
        })
      }
    }

    // Queue pending evolutions
    let newPendingEvolutions = state.pendingEvolutions
    let newActiveEvolution = state.activeEvolution
    if (rewards.pendingEvolutions && rewards.pendingEvolutions.length > 0) {
      // Deduplicate by pokemon_id to prevent race condition duplicates
      // Check against existing pending, active, AND incoming rewards (in case of duplicates within batch)
      const existingIds = new Set([
        ...state.pendingEvolutions.map(e => e.pokemon_id),
        state.activeEvolution?.pokemon_id
      ].filter(Boolean))

      // Also deduplicate within the incoming batch itself
      const seenInBatch = new Set<string>()
      const uniqueNewEvolutions = rewards.pendingEvolutions.filter(e => {
        if (existingIds.has(e.pokemon_id) || seenInBatch.has(e.pokemon_id)) {
          return false
        }
        seenInBatch.add(e.pokemon_id)
        return true
      })

      if (uniqueNewEvolutions.length > 0) {
        newPendingEvolutions = [...state.pendingEvolutions, ...uniqueNewEvolutions]
        // If no active evolution, automatically start the first one
        if (!state.activeEvolution && newPendingEvolutions.length > 0) {
          newActiveEvolution = newPendingEvolutions[0]
          newPendingEvolutions = newPendingEvolutions.slice(1)
        }
      }
    }

    // Add level-ups to pending level-ups for notifications
    const newPendingLevelUps = rewards.levelUps
      ? [...state.pendingLevelUps, ...rewards.levelUps]
      : state.pendingLevelUps

    return {
      currentEncounter: null,
      pendingEncounterRewards: null,
      party: newParty,
      pendingLevelUps: newPendingLevelUps,
      pendingEvolutions: newPendingEvolutions,
      activeEvolution: newActiveEvolution,
    }
  }),

  addLevelUps: (levelUps) =>
    set((state) => ({ pendingLevelUps: [...state.pendingLevelUps, ...levelUps] })),

  clearPendingLevelUps: () => set({ pendingLevelUps: [] }),

  // Evolution methods
  addPendingEvolutions: (evolutions) =>
    set((state) => {
      // Deduplicate by pokemon_id to prevent race condition duplicates
      const existingIds = new Set([
        ...state.pendingEvolutions.map(e => e.pokemon_id),
        state.activeEvolution?.pokemon_id
      ].filter(Boolean))

      const uniqueNewEvolutions = evolutions.filter(e => !existingIds.has(e.pokemon_id))
      if (uniqueNewEvolutions.length === 0) {
        return {} // No new evolutions to add
      }

      const newPending = [...state.pendingEvolutions, ...uniqueNewEvolutions]
      // If no active evolution, automatically start the first one
      if (!state.activeEvolution && newPending.length > 0) {
        return {
          pendingEvolutions: newPending.slice(1),
          activeEvolution: newPending[0],
        }
      }
      return { pendingEvolutions: newPending }
    }),

  setActiveEvolution: (evolution) => set({ activeEvolution: evolution }),

  removeEvolution: (pokemonId) =>
    set((state) => ({
      pendingEvolutions: state.pendingEvolutions.filter((e) => e.pokemon_id !== pokemonId),
      activeEvolution:
        state.activeEvolution?.pokemon_id === pokemonId ? null : state.activeEvolution,
    })),

  processNextEvolution: () =>
    set((state) => {
      if (state.pendingEvolutions.length > 0) {
        const [next, ...rest] = state.pendingEvolutions
        return { activeEvolution: next, pendingEvolutions: rest }
      }
      return { activeEvolution: null }
    }),

  // Combined action to atomically remove evolution and advance queue
  // This avoids race conditions when calling removeEvolution + processNextEvolution separately
  completeEvolutionAndAdvance: (pokemonId) =>
    set((state) => {
      // Filter out the completed evolution from pending (in case it was re-added)
      const filteredPending = state.pendingEvolutions.filter((e) => e.pokemon_id !== pokemonId)

      // If this was the active evolution, advance to next
      if (state.activeEvolution?.pokemon_id === pokemonId) {
        if (filteredPending.length > 0) {
          const [next, ...rest] = filteredPending
          return { activeEvolution: next, pendingEvolutions: rest }
        }
        return { activeEvolution: null, pendingEvolutions: [] }
      }

      // If it wasn't active, just update the pending list
      return { pendingEvolutions: filteredPending }
    }),

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

  // Whisper methods (Issue #45)
  addWhisper: (whisper) =>
    set((state) => {
      const isActivePartner =
        state.activeWhisperPartner === whisper.fromUsername ||
        state.activeWhisperPartner === whisper.toUsername

      return {
        whispers: [...state.whispers, whisper].slice(-100), // Keep last 100
        whisperUnreadCount: isActivePartner
          ? state.whisperUnreadCount
          : state.whisperUnreadCount + 1,
      }
    }),

  setWhispers: (whispers) => set({ whispers }),

  setActiveWhisperPartner: (username) =>
    set((state) => ({
      activeWhisperPartner: username,
      // Clear unread when viewing whispers
      whisperUnreadCount: username ? 0 : state.whisperUnreadCount,
    })),

  clearWhisperUnread: () => set({ whisperUnreadCount: 0 }),

  // Block/mute methods (Issue #47)
  setBlockedPlayers: (players) => set({ blockedPlayers: players }),

  addBlockedPlayer: (player) =>
    set((state) => ({
      blockedPlayers: [...state.blockedPlayers, player],
    })),

  removeBlockedPlayer: (playerId) =>
    set((state) => ({
      blockedPlayers: state.blockedPlayers.filter((p) => p.blockedId !== playerId),
    })),

  mutePlayer: (playerId) =>
    set((state) => ({
      mutedPlayers: state.mutedPlayers.includes(playerId)
        ? state.mutedPlayers
        : [...state.mutedPlayers, playerId]
    })),

  unmutePlayer: (playerId) =>
    set((state) => ({
      mutedPlayers: state.mutedPlayers.filter(id => id !== playerId)
    })),

  isPlayerMuted: (playerId) => get().mutedPlayers.includes(playerId),

  isPlayerBlocked: (playerId) =>
    get().blockedPlayers.some((p) => p.blockedId === playerId),

  // Leaderboard methods (Issues #51-54)
  setLeaderboardData: (data) => set({
    leaderboardEntries: data.entries,
    leaderboardType: data.type,
    leaderboardTimeframe: data.timeframe,
    leaderboardPlayerRank: data.playerRank,
    leaderboardLoading: false,
  }),

  setLeaderboardLoading: (loading) => set({ leaderboardLoading: loading }),

  setLeaderboardOpen: (open) => set({ isLeaderboardOpen: open }),

  setLeaderboardType: (type) => set({ leaderboardType: type }),

  setLeaderboardTimeframe: (timeframe) => set({ leaderboardTimeframe: timeframe }),

  reset: () => set(initialState),
}))
