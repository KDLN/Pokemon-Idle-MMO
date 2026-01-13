export interface GymBadge {
  id: string
  name: string
  gym: string
  leader: string
  color: string
  shape: 'circle' | 'hexagon' | 'octagon' | 'diamond' | 'heart' | 'star' | 'drop' | 'leaf'
}

export const GYM_BADGES: GymBadge[] = [
  {
    id: 'boulder',
    name: 'Boulder Badge',
    gym: 'Pewter City',
    leader: 'Brock',
    color: '#A8A878',
    shape: 'octagon',
  },
  {
    id: 'cascade',
    name: 'Cascade Badge',
    gym: 'Cerulean City',
    leader: 'Misty',
    color: '#6890F0',
    shape: 'drop',
  },
  {
    id: 'thunder',
    name: 'Thunder Badge',
    gym: 'Vermilion City',
    leader: 'Lt. Surge',
    color: '#F8D030',
    shape: 'circle',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Badge',
    gym: 'Celadon City',
    leader: 'Erika',
    color: '#78C850',
    shape: 'leaf',
  },
  {
    id: 'soul',
    name: 'Soul Badge',
    gym: 'Fuchsia City',
    leader: 'Koga',
    color: '#A040A0',
    shape: 'heart',
  },
  {
    id: 'marsh',
    name: 'Marsh Badge',
    gym: 'Saffron City',
    leader: 'Sabrina',
    color: '#F85888',
    shape: 'circle',
  },
  {
    id: 'volcano',
    name: 'Volcano Badge',
    gym: 'Cinnabar Island',
    leader: 'Blaine',
    color: '#F08030',
    shape: 'hexagon',
  },
  {
    id: 'earth',
    name: 'Earth Badge',
    gym: 'Viridian City',
    leader: 'Giovanni',
    color: '#E0C068',
    shape: 'diamond',
  },
]

export function getBadgeById(id: string): GymBadge | undefined {
  return GYM_BADGES.find((badge) => badge.id === id)
}

export function isBadgeEarned(earnedBadges: string[], badgeId: string): boolean {
  return earnedBadges.includes(badgeId)
}
