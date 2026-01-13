/**
 * Sprite Catalog
 *
 * Defines all available cosmetic items for the layered sprite system.
 * Each item specifies its sprite sheet path and metadata.
 */

import type { SpriteLayerType, SpriteSheetMeta } from './layeredSprite'

// Rarity levels for cosmetics
export type CosmeticRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'event'

// Cosmetic item definition
export interface CosmeticItem {
  id: string
  name: string
  category: SpriteLayerType
  spriteSheet: string
  supportsRecolor: boolean
  defaultColor?: string
  rarity: CosmeticRarity
  eventId?: string
  unlockCondition?: string
  description?: string
}

// Body types
export const BODY_CATALOG: CosmeticItem[] = [
  {
    id: 'default',
    name: 'Default',
    category: 'body',
    spriteSheet: '/sprites/character/body/default.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'slim',
    name: 'Slim',
    category: 'body',
    spriteSheet: '/sprites/character/body/slim.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'athletic',
    name: 'Athletic',
    category: 'body',
    spriteSheet: '/sprites/character/body/athletic.png',
    supportsRecolor: true,
    rarity: 'common',
  },
]

// Eye styles
export const EYES_CATALOG: CosmeticItem[] = [
  {
    id: 'default',
    name: 'Default',
    category: 'eyes',
    spriteSheet: '/sprites/character/eyes/default.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'round',
    name: 'Round',
    category: 'eyes',
    spriteSheet: '/sprites/character/eyes/round.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    category: 'eyes',
    spriteSheet: '/sprites/character/eyes/sharp.png',
    supportsRecolor: true,
    rarity: 'common',
  },
]

// Hair styles (each has front and back sprite sheets)
export const HAIR_CATALOG: CosmeticItem[] = [
  {
    id: 'short',
    name: 'Short',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/short',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'spiky',
    name: 'Spiky',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/spiky',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'medium',
    name: 'Medium',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/medium',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'long',
    name: 'Long',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/long',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'ponytail',
    name: 'Ponytail',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/ponytail',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'afro',
    name: 'Afro',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/afro',
    supportsRecolor: true,
    rarity: 'uncommon',
  },
  {
    id: 'buzz',
    name: 'Buzz Cut',
    category: 'hair_front',
    spriteSheet: '/sprites/character/hair/buzz',
    supportsRecolor: true,
    rarity: 'common',
  },
]

// Outfit tops
export const OUTFIT_TOP_CATALOG: CosmeticItem[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    category: 'outfit_top',
    spriteSheet: '/sprites/character/outfit/top/tshirt.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'jacket',
    name: 'Jacket',
    category: 'outfit_top',
    spriteSheet: '/sprites/character/outfit/top/jacket.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    category: 'outfit_top',
    spriteSheet: '/sprites/character/outfit/top/hoodie.png',
    supportsRecolor: true,
    rarity: 'uncommon',
  },
  {
    id: 'vest',
    name: 'Vest',
    category: 'outfit_top',
    spriteSheet: '/sprites/character/outfit/top/vest.png',
    supportsRecolor: true,
    rarity: 'uncommon',
  },
]

// Outfit bottoms
export const OUTFIT_BOTTOM_CATALOG: CosmeticItem[] = [
  {
    id: 'jeans',
    name: 'Jeans',
    category: 'outfit_bottom',
    spriteSheet: '/sprites/character/outfit/bottom/jeans.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'shorts',
    name: 'Shorts',
    category: 'outfit_bottom',
    spriteSheet: '/sprites/character/outfit/bottom/shorts.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'skirt',
    name: 'Skirt',
    category: 'outfit_bottom',
    spriteSheet: '/sprites/character/outfit/bottom/skirt.png',
    supportsRecolor: true,
    rarity: 'common',
  },
]

// Hats
export const HAT_CATALOG: CosmeticItem[] = [
  {
    id: 'cap',
    name: 'Cap',
    category: 'hat',
    spriteSheet: '/sprites/character/hat/cap.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'beanie',
    name: 'Beanie',
    category: 'hat',
    spriteSheet: '/sprites/character/hat/beanie.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'headband',
    name: 'Headband',
    category: 'hat',
    spriteSheet: '/sprites/character/hat/headband.png',
    supportsRecolor: true,
    rarity: 'common',
  },
  {
    id: 'bandana',
    name: 'Bandana',
    category: 'hat',
    spriteSheet: '/sprites/character/hat/bandana.png',
    supportsRecolor: true,
    rarity: 'uncommon',
  },
]

// Accessories
export const ACCESSORY_CATALOG: CosmeticItem[] = [
  {
    id: 'glasses',
    name: 'Glasses',
    category: 'accessory',
    spriteSheet: '/sprites/character/accessory/glasses.png',
    supportsRecolor: false,
    rarity: 'common',
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    category: 'accessory',
    spriteSheet: '/sprites/character/accessory/sunglasses.png',
    supportsRecolor: false,
    rarity: 'uncommon',
  },
  {
    id: 'earrings',
    name: 'Earrings',
    category: 'accessory',
    spriteSheet: '/sprites/character/accessory/earrings.png',
    supportsRecolor: false,
    rarity: 'uncommon',
  },
  {
    id: 'scarf',
    name: 'Scarf',
    category: 'accessory',
    spriteSheet: '/sprites/character/accessory/scarf.png',
    supportsRecolor: true,
    rarity: 'uncommon',
  },
]

// Event items - Special effects and cosmetics from events
export const EVENT_EFFECTS_CATALOG: CosmeticItem[] = [
  {
    id: 'aura_fire',
    name: 'Blazing Aura',
    category: 'effect',
    spriteSheet: '/sprites/character/effects/aura_fire.png',
    supportsRecolor: false,
    rarity: 'event',
    eventId: 'summer_blaze_2024',
    description: 'A fiery aura surrounds you',
  },
  {
    id: 'aura_ice',
    name: 'Frost Aura',
    category: 'effect',
    spriteSheet: '/sprites/character/effects/aura_ice.png',
    supportsRecolor: false,
    rarity: 'event',
    eventId: 'winter_frost_2024',
    description: 'An icy mist swirls around you',
  },
  {
    id: 'sparkles',
    name: 'Sparkle Effect',
    category: 'effect',
    spriteSheet: '/sprites/character/effects/sparkles.png',
    supportsRecolor: false,
    rarity: 'legendary',
    description: 'Magical sparkles follow your every step',
  },
  {
    id: 'shadow_trail',
    name: 'Shadow Trail',
    category: 'effect',
    spriteSheet: '/sprites/character/effects/shadow_trail.png',
    supportsRecolor: false,
    rarity: 'epic',
    description: 'Dark shadows trail behind you',
  },
  {
    id: 'lightning',
    name: 'Static Discharge',
    category: 'effect',
    spriteSheet: '/sprites/character/effects/lightning.png',
    supportsRecolor: false,
    rarity: 'event',
    eventId: 'storm_surge_2024',
    description: 'Crackling electricity surrounds you',
  },
]

// Following pets (event exclusives)
export const PET_CATALOG: CosmeticItem[] = [
  {
    id: 'pichu',
    name: 'Pichu Companion',
    category: 'pet',
    spriteSheet: '/sprites/character/pets/pichu.png',
    supportsRecolor: false,
    rarity: 'event',
    eventId: 'anniversary_2024',
    description: 'A tiny Pichu follows you around',
  },
  {
    id: 'eevee',
    name: 'Eevee Companion',
    category: 'pet',
    spriteSheet: '/sprites/character/pets/eevee.png',
    supportsRecolor: false,
    rarity: 'legendary',
    description: 'A friendly Eevee tags along',
  },
  {
    id: 'ditto',
    name: 'Ditto Blob',
    category: 'pet',
    spriteSheet: '/sprites/character/pets/ditto.png',
    supportsRecolor: false,
    rarity: 'epic',
    description: 'A gooey Ditto bounces beside you',
  },
]

// Held items (visible items the character holds)
export const HELD_ITEM_CATALOG: CosmeticItem[] = [
  {
    id: 'pokeball',
    name: 'Pokeball',
    category: 'held_item',
    spriteSheet: '/sprites/character/items/pokeball.png',
    supportsRecolor: false,
    rarity: 'common',
  },
  {
    id: 'greatball',
    name: 'Great Ball',
    category: 'held_item',
    spriteSheet: '/sprites/character/items/greatball.png',
    supportsRecolor: false,
    rarity: 'uncommon',
  },
  {
    id: 'masterball',
    name: 'Master Ball',
    category: 'held_item',
    spriteSheet: '/sprites/character/items/masterball.png',
    supportsRecolor: false,
    rarity: 'legendary',
    description: 'The ultimate Pokeball',
  },
  {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    category: 'held_item',
    spriteSheet: '/sprites/character/items/fishing_rod.png',
    supportsRecolor: false,
    rarity: 'uncommon',
  },
]

// Rarity color mapping for UI display
export const RARITY_COLORS: Record<CosmeticRarity, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
  event: { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400' },
}

// Get all items of a specific category
export function getCatalogByCategory(category: SpriteLayerType): CosmeticItem[] {
  switch (category) {
    case 'body':
      return BODY_CATALOG
    case 'eyes':
      return EYES_CATALOG
    case 'hair_front':
    case 'hair_back':
      return HAIR_CATALOG
    case 'outfit_top':
      return OUTFIT_TOP_CATALOG
    case 'outfit_bottom':
      return OUTFIT_BOTTOM_CATALOG
    case 'hat':
      return HAT_CATALOG
    case 'accessory':
      return ACCESSORY_CATALOG
    case 'effect':
      return EVENT_EFFECTS_CATALOG
    case 'pet':
      return PET_CATALOG
    case 'held_item':
      return HELD_ITEM_CATALOG
    default:
      return []
  }
}

// Get item by ID from any catalog
export function getCosmeticById(id: string, category?: SpriteLayerType): CosmeticItem | undefined {
  const catalogs = category
    ? [getCatalogByCategory(category)]
    : [
        BODY_CATALOG,
        EYES_CATALOG,
        HAIR_CATALOG,
        OUTFIT_TOP_CATALOG,
        OUTFIT_BOTTOM_CATALOG,
        HAT_CATALOG,
        ACCESSORY_CATALOG,
        EVENT_EFFECTS_CATALOG,
        PET_CATALOG,
        HELD_ITEM_CATALOG,
      ]

  for (const catalog of catalogs) {
    const item = catalog.find((i) => i.id === id)
    if (item) return item
  }
  return undefined
}

// Get all event items
export function getEventItems(): CosmeticItem[] {
  return [
    ...EVENT_EFFECTS_CATALOG.filter((i) => i.rarity === 'event'),
    ...PET_CATALOG.filter((i) => i.rarity === 'event'),
  ]
}

// Get items by rarity
export function getItemsByRarity(rarity: CosmeticRarity): CosmeticItem[] {
  return [
    ...BODY_CATALOG,
    ...EYES_CATALOG,
    ...HAIR_CATALOG,
    ...OUTFIT_TOP_CATALOG,
    ...OUTFIT_BOTTOM_CATALOG,
    ...HAT_CATALOG,
    ...ACCESSORY_CATALOG,
    ...EVENT_EFFECTS_CATALOG,
    ...PET_CATALOG,
    ...HELD_ITEM_CATALOG,
  ].filter((item) => item.rarity === rarity)
}
