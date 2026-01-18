// Leaderboard system types

export interface LeaderboardEntry {
  rank: number
  player_id: string
  username: string
  value: number
  // For level leaderboard - show which Pokemon
  pokemon_name?: string
  pokemon_species_id?: number
}

export type LeaderboardType = 'pokedex' | 'catches' | 'level'
export type LeaderboardTimeframe = 'alltime' | 'weekly'

export interface PlayerRank {
  rank: number
  value: number
}
