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
  // #001-009: Starter lines
  1: { name: 'Bulbasaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  2: { name: 'Ivysaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  3: { name: 'Venusaur', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  4: { name: 'Charmander', type: 'FIRE', color: '#F08030' },
  5: { name: 'Charmeleon', type: 'FIRE', color: '#F08030' },
  6: { name: 'Charizard', type: 'FIRE', type2: 'FLYING', color: '#F08030' },
  7: { name: 'Squirtle', type: 'WATER', color: '#6890F0' },
  8: { name: 'Wartortle', type: 'WATER', color: '#6890F0' },
  9: { name: 'Blastoise', type: 'WATER', color: '#6890F0' },
  // #010-018: Bug and Bird lines
  10: { name: 'Caterpie', type: 'BUG', color: '#A8B820' },
  11: { name: 'Metapod', type: 'BUG', color: '#A8B820' },
  12: { name: 'Butterfree', type: 'BUG', type2: 'FLYING', color: '#A8B820' },
  13: { name: 'Weedle', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  14: { name: 'Kakuna', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  15: { name: 'Beedrill', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  16: { name: 'Pidgey', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  17: { name: 'Pidgeotto', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  18: { name: 'Pidgeot', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  // #019-024: Common Pokemon
  19: { name: 'Rattata', type: 'NORMAL', color: '#A8A878' },
  20: { name: 'Raticate', type: 'NORMAL', color: '#A8A878' },
  21: { name: 'Spearow', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  22: { name: 'Fearow', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  23: { name: 'Ekans', type: 'POISON', color: '#A040A0' },
  24: { name: 'Arbok', type: 'POISON', color: '#A040A0' },
  // #025-034: Pikachu and Nidoran lines
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
  // #035-045: Fairy and Grass types
  35: { name: 'Clefairy', type: 'FAIRY', color: '#EE99AC' },
  36: { name: 'Clefable', type: 'FAIRY', color: '#EE99AC' },
  37: { name: 'Vulpix', type: 'FIRE', color: '#F08030' },
  38: { name: 'Ninetales', type: 'FIRE', color: '#F08030' },
  39: { name: 'Jigglypuff', type: 'NORMAL', type2: 'FAIRY', color: '#EE99AC' },
  40: { name: 'Wigglytuff', type: 'NORMAL', type2: 'FAIRY', color: '#EE99AC' },
  41: { name: 'Zubat', type: 'POISON', type2: 'FLYING', color: '#A040A0' },
  42: { name: 'Golbat', type: 'POISON', type2: 'FLYING', color: '#A040A0' },
  43: { name: 'Oddish', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  44: { name: 'Gloom', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  45: { name: 'Vileplume', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  // #046-057: Bug, Psychic, Fighting
  46: { name: 'Paras', type: 'BUG', type2: 'GRASS', color: '#A8B820' },
  47: { name: 'Parasect', type: 'BUG', type2: 'GRASS', color: '#A8B820' },
  48: { name: 'Venonat', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  49: { name: 'Venomoth', type: 'BUG', type2: 'POISON', color: '#A8B820' },
  50: { name: 'Diglett', type: 'GROUND', color: '#E0C068' },
  51: { name: 'Dugtrio', type: 'GROUND', color: '#E0C068' },
  52: { name: 'Meowth', type: 'NORMAL', color: '#A8A878' },
  53: { name: 'Persian', type: 'NORMAL', color: '#A8A878' },
  54: { name: 'Psyduck', type: 'WATER', color: '#6890F0' },
  55: { name: 'Golduck', type: 'WATER', color: '#6890F0' },
  56: { name: 'Mankey', type: 'FIGHTING', color: '#C03028' },
  57: { name: 'Primeape', type: 'FIGHTING', color: '#C03028' },
  // #058-068: Fire, Water, Fighting
  58: { name: 'Growlithe', type: 'FIRE', color: '#F08030' },
  59: { name: 'Arcanine', type: 'FIRE', color: '#F08030' },
  60: { name: 'Poliwag', type: 'WATER', color: '#6890F0' },
  61: { name: 'Poliwhirl', type: 'WATER', color: '#6890F0' },
  62: { name: 'Poliwrath', type: 'WATER', type2: 'FIGHTING', color: '#6890F0' },
  63: { name: 'Abra', type: 'PSYCHIC', color: '#F85888' },
  64: { name: 'Kadabra', type: 'PSYCHIC', color: '#F85888' },
  65: { name: 'Alakazam', type: 'PSYCHIC', color: '#F85888' },
  66: { name: 'Machop', type: 'FIGHTING', color: '#C03028' },
  67: { name: 'Machoke', type: 'FIGHTING', color: '#C03028' },
  68: { name: 'Machamp', type: 'FIGHTING', color: '#C03028' },
  // #069-078: Grass, Water, Rock, Fire
  69: { name: 'Bellsprout', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  70: { name: 'Weepinbell', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  71: { name: 'Victreebel', type: 'GRASS', type2: 'POISON', color: '#78C850' },
  72: { name: 'Tentacool', type: 'WATER', type2: 'POISON', color: '#6890F0' },
  73: { name: 'Tentacruel', type: 'WATER', type2: 'POISON', color: '#6890F0' },
  74: { name: 'Geodude', type: 'ROCK', type2: 'GROUND', color: '#B8A038' },
  75: { name: 'Graveler', type: 'ROCK', type2: 'GROUND', color: '#B8A038' },
  76: { name: 'Golem', type: 'ROCK', type2: 'GROUND', color: '#B8A038' },
  77: { name: 'Ponyta', type: 'FIRE', color: '#F08030' },
  78: { name: 'Rapidash', type: 'FIRE', color: '#F08030' },
  // #079-089: Psychic, Electric, Ghost
  79: { name: 'Slowpoke', type: 'WATER', type2: 'PSYCHIC', color: '#F85888' },
  80: { name: 'Slowbro', type: 'WATER', type2: 'PSYCHIC', color: '#F85888' },
  81: { name: 'Magnemite', type: 'ELECTRIC', type2: 'STEEL', color: '#F8D030' },
  82: { name: 'Magneton', type: 'ELECTRIC', type2: 'STEEL', color: '#F8D030' },
  83: { name: 'Farfetch\'d', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  84: { name: 'Doduo', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  85: { name: 'Dodrio', type: 'NORMAL', type2: 'FLYING', color: '#A8A878' },
  86: { name: 'Seel', type: 'WATER', color: '#6890F0' },
  87: { name: 'Dewgong', type: 'WATER', type2: 'ICE', color: '#6890F0' },
  88: { name: 'Grimer', type: 'POISON', color: '#A040A0' },
  89: { name: 'Muk', type: 'POISON', color: '#A040A0' },
  // #090-099: Water, Ghost, Psychic
  90: { name: 'Shellder', type: 'WATER', color: '#6890F0' },
  91: { name: 'Cloyster', type: 'WATER', type2: 'ICE', color: '#6890F0' },
  92: { name: 'Gastly', type: 'GHOST', type2: 'POISON', color: '#705898' },
  93: { name: 'Haunter', type: 'GHOST', type2: 'POISON', color: '#705898' },
  94: { name: 'Gengar', type: 'GHOST', type2: 'POISON', color: '#705898' },
  95: { name: 'Onix', type: 'ROCK', type2: 'GROUND', color: '#B8A038' },
  96: { name: 'Drowzee', type: 'PSYCHIC', color: '#F85888' },
  97: { name: 'Hypno', type: 'PSYCHIC', color: '#F85888' },
  98: { name: 'Krabby', type: 'WATER', color: '#6890F0' },
  99: { name: 'Kingler', type: 'WATER', color: '#6890F0' },
  // #100-112: Electric, Grass, Ground, Rock
  100: { name: 'Voltorb', type: 'ELECTRIC', color: '#F8D030' },
  101: { name: 'Electrode', type: 'ELECTRIC', color: '#F8D030' },
  102: { name: 'Exeggcute', type: 'GRASS', type2: 'PSYCHIC', color: '#78C850' },
  103: { name: 'Exeggutor', type: 'GRASS', type2: 'PSYCHIC', color: '#78C850' },
  104: { name: 'Cubone', type: 'GROUND', color: '#E0C068' },
  105: { name: 'Marowak', type: 'GROUND', color: '#E0C068' },
  106: { name: 'Hitmonlee', type: 'FIGHTING', color: '#C03028' },
  107: { name: 'Hitmonchan', type: 'FIGHTING', color: '#C03028' },
  108: { name: 'Lickitung', type: 'NORMAL', color: '#A8A878' },
  109: { name: 'Koffing', type: 'POISON', color: '#A040A0' },
  110: { name: 'Weezing', type: 'POISON', color: '#A040A0' },
  111: { name: 'Rhyhorn', type: 'GROUND', type2: 'ROCK', color: '#E0C068' },
  112: { name: 'Rhydon', type: 'GROUND', type2: 'ROCK', color: '#E0C068' },
  // #113-123: Normal, Water, Grass, Bug
  113: { name: 'Chansey', type: 'NORMAL', color: '#A8A878' },
  114: { name: 'Tangela', type: 'GRASS', color: '#78C850' },
  115: { name: 'Kangaskhan', type: 'NORMAL', color: '#A8A878' },
  116: { name: 'Horsea', type: 'WATER', color: '#6890F0' },
  117: { name: 'Seadra', type: 'WATER', color: '#6890F0' },
  118: { name: 'Goldeen', type: 'WATER', color: '#6890F0' },
  119: { name: 'Seaking', type: 'WATER', color: '#6890F0' },
  120: { name: 'Staryu', type: 'WATER', color: '#6890F0' },
  121: { name: 'Starmie', type: 'WATER', type2: 'PSYCHIC', color: '#6890F0' },
  122: { name: 'Mr. Mime', type: 'PSYCHIC', type2: 'FAIRY', color: '#F85888' },
  123: { name: 'Scyther', type: 'BUG', type2: 'FLYING', color: '#A8B820' },
  // #124-134: Ice, Electric, Fire, Normal
  124: { name: 'Jynx', type: 'ICE', type2: 'PSYCHIC', color: '#98D8D8' },
  125: { name: 'Electabuzz', type: 'ELECTRIC', color: '#F8D030' },
  126: { name: 'Magmar', type: 'FIRE', color: '#F08030' },
  127: { name: 'Pinsir', type: 'BUG', color: '#A8B820' },
  128: { name: 'Tauros', type: 'NORMAL', color: '#A8A878' },
  129: { name: 'Magikarp', type: 'WATER', color: '#6890F0' },
  130: { name: 'Gyarados', type: 'WATER', type2: 'FLYING', color: '#6890F0' },
  131: { name: 'Lapras', type: 'WATER', type2: 'ICE', color: '#6890F0' },
  132: { name: 'Ditto', type: 'NORMAL', color: '#A8A878' },
  133: { name: 'Eevee', type: 'NORMAL', color: '#A8A878' },
  134: { name: 'Vaporeon', type: 'WATER', color: '#6890F0' },
  // #135-143: Eevee evolutions and others
  135: { name: 'Jolteon', type: 'ELECTRIC', color: '#F8D030' },
  136: { name: 'Flareon', type: 'FIRE', color: '#F08030' },
  137: { name: 'Porygon', type: 'NORMAL', color: '#A8A878' },
  138: { name: 'Omanyte', type: 'ROCK', type2: 'WATER', color: '#B8A038' },
  139: { name: 'Omastar', type: 'ROCK', type2: 'WATER', color: '#B8A038' },
  140: { name: 'Kabuto', type: 'ROCK', type2: 'WATER', color: '#B8A038' },
  141: { name: 'Kabutops', type: 'ROCK', type2: 'WATER', color: '#B8A038' },
  142: { name: 'Aerodactyl', type: 'ROCK', type2: 'FLYING', color: '#B8A038' },
  143: { name: 'Snorlax', type: 'NORMAL', color: '#A8A878' },
  // #144-151: Legendaries
  144: { name: 'Articuno', type: 'ICE', type2: 'FLYING', color: '#98D8D8' },
  145: { name: 'Zapdos', type: 'ELECTRIC', type2: 'FLYING', color: '#F8D030' },
  146: { name: 'Moltres', type: 'FIRE', type2: 'FLYING', color: '#F08030' },
  147: { name: 'Dratini', type: 'DRAGON', color: '#7038F8' },
  148: { name: 'Dragonair', type: 'DRAGON', color: '#7038F8' },
  149: { name: 'Dragonite', type: 'DRAGON', type2: 'FLYING', color: '#7038F8' },
  150: { name: 'Mewtwo', type: 'PSYCHIC', color: '#F85888' },
  151: { name: 'Mew', type: 'PSYCHIC', color: '#F85888' },
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

export { cn } from './cn'

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
