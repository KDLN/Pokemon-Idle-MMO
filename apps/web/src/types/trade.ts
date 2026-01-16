// Trade system types for frontend

export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

// Partial Pokemon data for trade offer display (matches backend TradeOfferPokemon)
export interface TradeOfferPokemon {
  id: string
  species_id: number
  nickname: string | null
  level: number
  is_shiny: boolean
  species?: { name: string }
}

export interface TradeOffer {
  offer_id: string
  trade_id: string
  pokemon_id: string
  offered_by: string
  created_at: string
  pokemon?: TradeOfferPokemon
}

export interface Trade {
  trade_id: string
  sender_id: string
  receiver_id: string
  status: TradeStatus
  created_at: string
  updated_at: string
  sender_username?: string
  receiver_username?: string
}

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

// Trade history types
export interface TradeHistoryPokemon {
  pokemon_id: string
  species_id: number
  species_name: string
  nickname: string | null
  level: number
  is_shiny: boolean
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
