// Trainer Customization System
// Defines all customization options for player characters

export interface TrainerCustomization {
  // Base appearance
  gender: 'male' | 'female' | 'neutral'
  skinTone: SkinTone

  // Hair
  hairStyle: HairStyle
  hairColor: HairColor

  // Outfit
  topColor: OutfitColor
  bottomColor: OutfitColor
  hatColor: OutfitColor
  hatStyle: HatStyle

  // Accessories
  accessory?: AccessoryType
}

// Skin tone options with actual color values
export type SkinTone = 'light' | 'fair' | 'medium' | 'tan' | 'brown' | 'dark'

export const SKIN_TONES: Record<SkinTone, { base: string; shadow: string; name: string }> = {
  light: { base: '#FFE4C4', shadow: '#E8C9A0', name: 'Light' },
  fair: { base: '#F5D5B8', shadow: '#D4B896', name: 'Fair' },
  medium: { base: '#D4A574', shadow: '#B8895C', name: 'Medium' },
  tan: { base: '#C68E5B', shadow: '#A67548', name: 'Tan' },
  brown: { base: '#8B6242', shadow: '#6B4832', name: 'Brown' },
  dark: { base: '#5C4033', shadow: '#3D2A22', name: 'Dark' },
}

// Hair styles
export type HairStyle = 'short' | 'spiky' | 'medium' | 'long' | 'ponytail' | 'afro' | 'buzz'

export const HAIR_STYLES: Record<HairStyle, { name: string; frames?: number }> = {
  short: { name: 'Short' },
  spiky: { name: 'Spiky' },
  medium: { name: 'Medium' },
  long: { name: 'Long' },
  ponytail: { name: 'Ponytail' },
  afro: { name: 'Afro' },
  buzz: { name: 'Buzz Cut' },
}

// Hair colors
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'blue' | 'pink' | 'purple' | 'green' | 'white' | 'orange'

export const HAIR_COLORS: Record<HairColor, { base: string; shadow: string; name: string }> = {
  black: { base: '#1a1a1a', shadow: '#0a0a0a', name: 'Black' },
  brown: { base: '#6B4423', shadow: '#4A2F18', name: 'Brown' },
  blonde: { base: '#F4D03F', shadow: '#D4B82F', name: 'Blonde' },
  red: { base: '#C0392B', shadow: '#962D22', name: 'Red' },
  blue: { base: '#3498DB', shadow: '#2573A7', name: 'Blue' },
  pink: { base: '#E91E8C', shadow: '#B8186F', name: 'Pink' },
  purple: { base: '#9B59B6', shadow: '#7A4791', name: 'Purple' },
  green: { base: '#27AE60', shadow: '#1E8449', name: 'Green' },
  white: { base: '#ECF0F1', shadow: '#BDC3C7', name: 'White' },
  orange: { base: '#E67E22', shadow: '#BA651A', name: 'Orange' },
}

// Hat styles
export type HatStyle = 'cap' | 'beanie' | 'none' | 'headband' | 'bandana'

export const HAT_STYLES: Record<HatStyle, { name: string }> = {
  cap: { name: 'Cap' },
  beanie: { name: 'Beanie' },
  none: { name: 'None' },
  headband: { name: 'Headband' },
  bandana: { name: 'Bandana' },
}

// Outfit colors
export type OutfitColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'black' | 'white' | 'orange' | 'pink' | 'teal'

export const OUTFIT_COLORS: Record<OutfitColor, { base: string; shadow: string; accent: string; name: string }> = {
  red: { base: '#EE1515', shadow: '#CC0000', accent: '#FF4444', name: 'Red' },
  blue: { base: '#3B4CCA', shadow: '#2A3B9A', accent: '#5B6EEA', name: 'Blue' },
  green: { base: '#27AE60', shadow: '#1E8449', accent: '#2ECC71', name: 'Green' },
  yellow: { base: '#F1C40F', shadow: '#D4A909', accent: '#FFD93D', name: 'Yellow' },
  purple: { base: '#9B59B6', shadow: '#7A4791', accent: '#BB6BD9', name: 'Purple' },
  black: { base: '#2C3E50', shadow: '#1A252F', accent: '#34495E', name: 'Black' },
  white: { base: '#ECF0F1', shadow: '#BDC3C7', accent: '#FFFFFF', name: 'White' },
  orange: { base: '#E67E22', shadow: '#BA651A', accent: '#F39C12', name: 'Orange' },
  pink: { base: '#E91E8C', shadow: '#B8186F', accent: '#FF6EB4', name: 'Pink' },
  teal: { base: '#1ABC9C', shadow: '#16A085', accent: '#2EE6C0', name: 'Teal' },
}

// Accessories
export type AccessoryType = 'glasses' | 'sunglasses' | 'earrings' | 'scarf' | 'none'

export const ACCESSORIES: Record<AccessoryType, { name: string }> = {
  glasses: { name: 'Glasses' },
  sunglasses: { name: 'Sunglasses' },
  earrings: { name: 'Earrings' },
  scarf: { name: 'Scarf' },
  none: { name: 'None' },
}

// Default trainer customization
export const DEFAULT_TRAINER_CUSTOMIZATION: TrainerCustomization = {
  gender: 'male',
  skinTone: 'fair',
  hairStyle: 'spiky',
  hairColor: 'black',
  topColor: 'blue',
  bottomColor: 'blue',
  hatColor: 'red',
  hatStyle: 'cap',
  accessory: 'none',
}

// Generate random customization
export function generateRandomCustomization(): TrainerCustomization {
  const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  return {
    gender: randomChoice(['male', 'female', 'neutral']),
    skinTone: randomChoice(Object.keys(SKIN_TONES) as SkinTone[]),
    hairStyle: randomChoice(Object.keys(HAIR_STYLES) as HairStyle[]),
    hairColor: randomChoice(Object.keys(HAIR_COLORS) as HairColor[]),
    topColor: randomChoice(Object.keys(OUTFIT_COLORS) as OutfitColor[]),
    bottomColor: randomChoice(Object.keys(OUTFIT_COLORS) as OutfitColor[]),
    hatColor: randomChoice(Object.keys(OUTFIT_COLORS) as OutfitColor[]),
    hatStyle: randomChoice(Object.keys(HAT_STYLES) as HatStyle[]),
    accessory: randomChoice(Object.keys(ACCESSORIES) as AccessoryType[]),
  }
}
