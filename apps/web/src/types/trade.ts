// Trade system types for frontend
// Re-exports shared types + frontend-only types

// Re-export shared trade types
export type {
  TradeStatus,
  Trade,
  TradeOfferPokemon,
  TradeOffer,
  TradeHistoryPokemon,
} from '@pokemon-idle/shared'

// Frontend-specific request types (renamed for clarity)
import type { TradeStatus, TradeOffer, TradeHistoryPokemon } from '@pokemon-idle/shared'

// Incoming trade request (I'm the receiver)
export interface IncomingTradeRequest {
  trade_id: string
  from_player_id: string
  from_username: string
  status: TradeStatus
  created_at: string
}

// Outgoing trade request (I'm the sender)
export interface OutgoingTradeRequest {
  trade_id: string
  to_player_id: string
  to_username: string
  status: TradeStatus
  created_at: string
}

// Active trade session state (for the modal)
export interface ActiveTradeSession {
  trade_id: string
  partner_id: string
  partner_username: string
  is_sender: boolean
  status: TradeStatus
  my_offers: TradeOffer[]
  their_offers: TradeOffer[]
  my_ready: boolean
  their_ready: boolean
  warning?: string
}

// Trade data from server
export interface TradesData {
  incoming: IncomingTradeRequest[]
  outgoing: OutgoingTradeRequest[]
}

// Trade history entry (transformed to be relative to requesting player)
export interface TradeHistoryEntry {
  id: string
  trade_id: string
  partner_id: string | null
  partner_username: string
  my_pokemon: TradeHistoryPokemon[]  // What I gave away
  their_pokemon: TradeHistoryPokemon[]  // What I received
  completed_at: string
}
