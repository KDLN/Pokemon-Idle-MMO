export interface TownAction {
  id: string
  label: string
  icon: string
  action: string
  description?: string
  locked?: boolean
  lockReason?: string
}

export const TOWN_ACTIONS: Record<string, TownAction[]> = {
  'Pallet Town': [
    {
      id: 'pokecenter',
      label: 'PokeCenter',
      icon: '🏥',
      action: 'pokecenter',
      description: 'Heal your Pokemon for free',
    },
    {
      id: 'lab',
      label: 'Oak Lab',
      icon: '🔬',
      action: 'lab',
      description: 'Visit Professor Oak',
    },
    {
      id: 'gym',
      label: 'Gym',
      icon: '🥊',
      action: 'gym',
      description: 'Battle Brock!',
    },
  ],
  'Viridian City': [
    {
      id: 'pokecenter',
      label: 'PokeCenter',
      icon: '🏥',
      action: 'pokecenter',
      description: 'Heal your Pokemon for free',
    },
    {
      id: 'shop',
      label: 'PokeMart',
      icon: '🏪',
      action: 'shop',
      description: 'Buy items and Pokeballs',
    },
    {
      id: 'gym',
      label: 'Gym',
      icon: '🏟️',
      action: 'gym',
      description: 'Challenge the Gym Leader',
      locked: true,
      lockReason: 'Requires 7 badges',
    },
  ],
  'Pewter City': [
    {
      id: 'pokecenter',
      label: 'PokeCenter',
      icon: '🏥',
      action: 'pokecenter',
      description: 'Heal your Pokemon for free',
    },
    {
      id: 'shop',
      label: 'PokeMart',
      icon: '🏪',
      action: 'shop',
      description: 'Buy items and Pokeballs',
    },
    {
      id: 'gym',
      label: 'Gym',
      icon: '🏟️',
      action: 'gym',
      description: 'Challenge Brock',
    },
    {
      id: 'museum',
      label: 'Museum',
      icon: '🏛️',
      action: 'museum',
      description: 'Visit the Science Museum',
    },
  ],
  'Cerulean City': [
    {
      id: 'pokecenter',
      label: 'PokeCenter',
      icon: '🏥',
      action: 'pokecenter',
      description: 'Heal your Pokemon for free',
    },
    {
      id: 'shop',
      label: 'PokeMart',
      icon: '🏪',
      action: 'shop',
      description: 'Buy items and Pokeballs',
    },
    {
      id: 'gym',
      label: 'Gym',
      icon: '🏟️',
      action: 'gym',
      description: 'Challenge Misty',
    },
    {
      id: 'bike',
      label: 'Bike Shop',
      icon: '🚲',
      action: 'bike_shop',
      description: 'Get a bicycle',
    },
  ],
}

export function getTownActions(zoneName: string): TownAction[] {
  return TOWN_ACTIONS[zoneName] || [
    {
      id: 'pokecenter',
      label: 'PokeCenter',
      icon: '🏥',
      action: 'pokecenter',
      description: 'Heal your Pokemon for free',
    },
  ]
}
