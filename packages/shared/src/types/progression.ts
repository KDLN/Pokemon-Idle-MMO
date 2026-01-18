// Progression and evolution types

export interface LevelUpEvent {
  pokemon_id: string
  pokemon_name: string
  new_level: number
  new_stats: {
    max_hp: number
    attack: number
    defense: number
    sp_attack: number
    sp_defense: number
    speed: number
  }
}

// Pending evolution that player can confirm or cancel
export interface PendingEvolution {
  pokemon_id: string
  pokemon_name: string
  current_species_id: number
  evolution_species_id: number
  evolution_species_name: string
  trigger_level: number
}

// Evolution event sent when a Pokemon evolves
export interface EvolutionEvent {
  pokemon_id: string
  pokemon_name: string // Name before evolution
  new_species_id: number
  new_species_name: string
  new_level: number
  new_stats: {
    max_hp: number
    attack: number
    defense: number
    sp_attack: number
    sp_defense: number
    speed: number
  }
}
