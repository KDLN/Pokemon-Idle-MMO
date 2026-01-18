// Trade system types

export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

export interface Trade {
  trade_id: string
  sender_id: string
  receiver_id: string
  status: TradeStatus
  created_at: string
  updated_at: string
  // Joined data for display
  sender_username?: string
  receiver_username?: string
}

// Partial Pokemon data for trade offer display (only fields needed for UI)
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
  // Joined data for display (partial Pokemon data sufficient for trade UI)
  pokemon?: TradeOfferPokemon
}

export interface TradeRequest {
  trade_id: string
  from_player_id: string
  from_username: string
  status: TradeStatus
  created_at: string
}

export interface OutgoingTradeRequest {
  trade_id: string
  to_player_id: string
  to_username: string
  status: TradeStatus
  created_at: string
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

export interface TradeHistoryEntry {
  id: string
  trade_id: string
  player1_id: string | null
  player1_username: string
  player2_id: string | null
  player2_username: string
  player1_pokemon: TradeHistoryPokemon[]
  player2_pokemon: TradeHistoryPokemon[]
  completed_at: string
}
