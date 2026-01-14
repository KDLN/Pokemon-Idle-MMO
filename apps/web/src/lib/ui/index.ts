// Shared UI utilities, constants, and types for consistent design

// ============================================
// DESIGN TOKENS
// ============================================

export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
} as const

export const ANIMATION_DELAYS = {
  stagger: 0.05,   // seconds between staggered items
  fast: 150,       // ms
  normal: 300,     // ms
  slow: 500,       // ms
} as const

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
  toast: 60,
} as const

// ============================================
// TYPE COLORS (matches CSS variables)
// ============================================

export const TYPE_COLORS: Record<string, { bg: string; dark: string }> = {
  normal: { bg: '#A8A878', dark: '#6D6D4E' },
  fire: { bg: '#F08030', dark: '#9C531F' },
  water: { bg: '#6890F0', dark: '#445E9C' },
  electric: { bg: '#F8D030', dark: '#A1871F' },
  grass: { bg: '#78C850', dark: '#4E8234' },
  ice: { bg: '#98D8D8', dark: '#638D8D' },
  fighting: { bg: '#C03028', dark: '#7D1F1A' },
  poison: { bg: '#A040A0', dark: '#682A68' },
  ground: { bg: '#E0C068', dark: '#927D44' },
  flying: { bg: '#A890F0', dark: '#6D5E9C' },
  psychic: { bg: '#F85888', dark: '#A13959' },
  bug: { bg: '#A8B820', dark: '#6D7815' },
  rock: { bg: '#B8A038', dark: '#786824' },
  ghost: { bg: '#705898', dark: '#493963' },
  dragon: { bg: '#7038F8', dark: '#4924A1' },
  dark: { bg: '#705848', dark: '#49392F' },
  steel: { bg: '#B8B8D0', dark: '#787887' },
  fairy: { bg: '#EE99AC', dark: '#9B6470' },
}

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()]?.bg ?? TYPE_COLORS.normal.bg
}

export function getTypeBorderClass(type: string): string {
  return `type-border-${type.toLowerCase()}`
}

export function getTypeGlowClass(type: string): string {
  return `type-glow-${type.toLowerCase()}`
}

// ============================================
// POKEMON SPECIES DATA
// ============================================

export interface SpeciesData {
  name: string
  type: string
  type2?: string
  color: string
}

export const SPECIES_DATA: Record<number, SpeciesData> = {
  1: { name: 'Bulbasaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  2: { name: 'Ivysaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  3: { name: 'Venusaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  4: { name: 'Charmander', type: 'FIRE', color: '#F08030' },
  5: { name: 'Charmeleon', type: 'FIRE', color: '#F08030' },
  6: { name: 'Charizard', type: 'FIRE', type2: 'FLYING', color: '#F08030' },
  7: { name: 'Squirtle', type: 'WATER', color: '#6890F0' },
  8: { name: 'Wartortle', type: 'WATER', color: '#6890F0' },
  9: { name: 'Blastoise', type: 'WATER', color: '#6890F0' },
  10: { name: 'Caterpie', type: 'BUG', color: '#A8B820' },
  11: { name: 'Metapod', type: 'BUG', color: '#A8B820' },
  12: { name: 'Butterfree', type: 'BUG', type2: 'FLYING', color: '#A8B820' },
  13: { name: 'Weedle', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  14: { name: 'Kakuna', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  15: { name: 'Beedrill', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  16: { name: 'Pidgey', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  17: { name: 'Pidgeotto', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  18: { name: 'Pidgeot', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  19: { name: 'Rattata', type: 'NORMAL', color: '#A8A878' },
  20: { name: 'Raticate', type: 'NORMAL', color: '#A8A878' },
  21: { name: 'Spearow', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  22: { name: 'Fearow', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  23: { name: 'Ekans', type: 'POISON', color: '#A040A0' },
  24: { name: 'Arbok', type: 'POISON', color: '#A040A0' },
  25: { name: 'Pikachu', type: 'ELECTRIC', color: '#F8D030' },
  26: { name: 'Raichu', type: 'ELECTRIC', color: '#F8D030' },
  27: { name: 'Sandshrew', type: 'GROUND', color: '#E0C068' },
  28: { name: 'Sandslash', type: 'GROUND', color: '#E0C068' },
  29: { name: 'Nidoran♀', type: 'POISON', color: '#A040A0' },
  30: { name: 'Nidorina', type: 'POISON', color: '#A040A0' },
  31: { name: 'Nidoqueen', type: 'POISON', type2: 'GROUND', color: '#A040A0' },
  32: { name: 'Nidoran♂', type: 'POISON', color: '#A040A0' },
  33: { name: 'Nidorino', type: 'POISON', color: '#A040A0' },
  34: { name: 'Nidoking', type: 'POISON', type2: 'GROUND', color: '#A040A0' },
  35: { name: 'Clefairy', type: 'FAIRY', color: '#EE99AC' },
  36: { name: 'Clefable', type: 'FAIRY', color: '#EE99AC' },
  37: { name: 'Vulpix', type: 'FIRE', color: '#F08030' },
  38: { name: 'Ninetales', type: 'FIRE', color: '#F08030' },
  39: { name: 'Jigglypuff', type: 'NORMAL', type2: 'FAIRY', color: '#EE99AC' },
  40: { name: 'Wigglytuff', type: 'NORMAL', type2: 'FAIRY', color: '#EE99AC' },
  41: { name: 'Zubat', type: 'POISON', type2: 'FLYING', color: '#A040A0' },
  42: { name: 'Golbat', type: 'POISON', type2: 'FLYING', color: '#A040A0' },
}

export function getSpeciesData(speciesId: number): SpeciesData {
  return SPECIES_DATA[speciesId] ?? { name: `Pokemon #${speciesId}`, type: 'NORMAL', color: '#A8A878' }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ============================================
// ANIMATION HELPERS
// ============================================

export function getStaggerDelay(index: number, baseDelay = ANIMATION_DELAYS.stagger): string {
  return `${index * baseDelay}s`
}

export function getStaggerDelayStyle(index: number): React.CSSProperties {
  return { animationDelay: getStaggerDelay(index) }
}

// ============================================
// CLASS NAME HELPERS
// ============================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// HELD ITEMS
// ============================================

export interface HeldItem {
  name: string
  icon: string
  description: string
}

export const HELD_ITEMS: Record<string, HeldItem> = {
  leftovers: { name: 'Leftovers', icon: '🍖', description: 'Restores HP over time' },
  everstone: { name: 'Everstone', icon: '🪨', description: 'Prevents evolution' },
  oran_berry: { name: 'Oran Berry', icon: '🫐', description: 'Restores HP when low' },
  sitrus_berry: { name: 'Sitrus Berry', icon: '🍇', description: 'Restores 25% HP when low' },
  focus_sash: { name: 'Focus Sash', icon: '🎗️', description: 'Survives one KO hit' },
  lucky_egg: { name: 'Lucky Egg', icon: '🥚', description: 'Boosts EXP gain' },
  exp_share: { name: 'Exp. Share', icon: '📡', description: 'Shares EXP with party' },
  amulet_coin: { name: 'Amulet Coin', icon: '🪙', description: 'Doubles money earned' },
}

export function getHeldItem(itemId: string | null | undefined): HeldItem | null {
  if (!itemId) return null
  return HELD_ITEMS[itemId] ?? null
}

// ============================================
// SHOP/INVENTORY ITEMS
// ============================================

export interface ItemData {
  name: string
  description: string
  effect: string
  category: 'ball' | 'potion' | 'battle' | 'misc'
}

export const ITEM_DATA: Record<string, ItemData> = {
  pokeball: {
    name: 'Poke Ball',
    description: 'A device for catching wild Pokemon. A Pokemon trainer must have these.',
    effect: 'Standard catch rate (1x)',
    category: 'ball',
  },
  great_ball: {
    name: 'Great Ball',
    description: 'A good, high-performance Ball with a higher catch rate than a standard Poke Ball.',
    effect: 'Improved catch rate (1.5x)',
    category: 'ball',
  },
  ultra_ball: {
    name: 'Ultra Ball',
    description: 'An ultra-high-performance Ball that provides a higher catch rate than a Great Ball.',
    effect: 'High catch rate (2x)',
    category: 'ball',
  },
  master_ball: {
    name: 'Master Ball',
    description: 'The best Ball with the ultimate level of performance. It will catch any wild Pokemon without fail.',
    effect: 'Guaranteed catch (100%)',
    category: 'ball',
  },
  potion: {
    name: 'Potion',
    description: 'A spray-type medicine for treating wounds. It restores the HP of one Pokemon by 20 points.',
    effect: 'Restores 20 HP',
    category: 'potion',
  },
  super_potion: {
    name: 'Super Potion',
    description: 'A spray-type medicine for treating wounds. It restores the HP of one Pokemon by 50 points.',
    effect: 'Restores 50 HP',
    category: 'potion',
  },
  hyper_potion: {
    name: 'Hyper Potion',
    description: 'A spray-type medicine for treating wounds. It restores the HP of one Pokemon by 200 points.',
    effect: 'Restores 200 HP',
    category: 'potion',
  },
  max_potion: {
    name: 'Max Potion',
    description: 'A spray-type medicine for treating wounds. It fully restores the HP of a single Pokemon.',
    effect: 'Fully restores HP',
    category: 'potion',
  },
  revive: {
    name: 'Revive',
    description: 'A medicine that revives a fainted Pokemon. It restores half the Pokemon\'s maximum HP.',
    effect: 'Revives with 50% HP',
    category: 'potion',
  },
  max_revive: {
    name: 'Max Revive',
    description: 'A medicine that revives a fainted Pokemon. It fully restores the Pokemon\'s HP.',
    effect: 'Revives with full HP',
    category: 'potion',
  },
}

export function getItemData(itemId: string): ItemData | null {
  return ITEM_DATA[itemId] ?? null
}
