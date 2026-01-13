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
      id: 'heal',
      label: 'Heal',
      icon: '💊',
      action: 'heal',
      description: "Restore your Pokemon's HP",
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
      description: "Battle Brock!",
    },
  ],
  'Viridian City': [
    {
      id: 'heal',
      label: 'Heal',
      icon: '💊',
      action: 'heal',
      description: "Restore your Pokemon's HP",
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
      id: 'heal',
      label: 'Heal',
      icon: '💊',
      action: 'heal',
      description: "Restore your Pokemon's HP",
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
      id: 'heal',
      label: 'Heal',
      icon: '💊',
      action: 'heal',
      description: "Restore your Pokemon's HP",
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
      id: 'heal',
      label: 'Heal',
      icon: '💊',
      action: 'heal',
      description: "Restore your Pokemon's HP",
    },
  ]
}
