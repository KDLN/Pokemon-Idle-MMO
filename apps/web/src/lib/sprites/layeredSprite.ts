/**
 * Layered Sprite System
 *
 * Composites multiple PNG sprite sheet layers on a canvas to create
 * customizable animated characters. Each layer (body, hair, clothes, etc.)
 * is a separate sprite sheet that gets tinted/colored and stacked.
 *
 * Sprite Sheet Format:
 * - Each sheet is a horizontal strip of frames
 * - Standard size: 32x48 pixels per frame (Pokemon-style)
 * - 4 directions: down, left, right, up (rows)
 * - 4 frames per direction for walking animation
 * - Total: 16 frames per sheet (4 directions x 4 frames)
 */

// Layer types that can be composited
export type SpriteLayerType =
  | 'shadow'
  | 'body'
  | 'eyes'
  | 'hair_back'    // Hair behind body (ponytails, long hair)
  | 'outfit_bottom' // Pants, skirts
  | 'outfit_top'    // Shirts, jackets
  | 'hair_front'    // Hair in front (bangs, front pieces)
  | 'hat'
  | 'accessory'     // Glasses, earrings
  | 'held_item'     // Items in hand
  | 'effect'        // Auras, particles (event items)
  | 'pet'           // Following companion (event items)

// Direction the sprite is facing
export type SpriteDirection = 'down' | 'left' | 'right' | 'up'

// Animation states
export type AnimationState = 'idle' | 'walk' | 'run' | 'special'

// A single layer definition
export interface SpriteLayer {
  type: SpriteLayerType
  spriteSheet: string        // Path to sprite sheet PNG
  tintColor?: string         // Optional color tint (for recoloring)
  tintMode?: 'multiply' | 'overlay' | 'replace' // How to apply tint
  offsetX?: number           // Pixel offset from base
  offsetY?: number
  zIndex: number             // Stacking order
  visible?: boolean
  opacity?: number
  // For animated effects
  animationSpeed?: number    // Override default animation speed
  loopMode?: 'loop' | 'once' | 'pingpong'
}

// Complete sprite configuration
export interface LayeredSpriteConfig {
  layers: SpriteLayer[]
  frameWidth: number         // Width of a single frame (default 32)
  frameHeight: number        // Height of a single frame (default 48)
  framesPerDirection: number // Frames in walk cycle (default 4)
  directions: SpriteDirection[] // Available directions
  scale: number              // Render scale
}

// Sprite sheet metadata
export interface SpriteSheetMeta {
  id: string
  name: string
  category: SpriteLayerType
  path: string
  supportsRecolor: boolean   // Can this be tinted?
  defaultTint?: string       // Default color if recolorable
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'event'
  eventId?: string           // If this is event-exclusive
  unlockCondition?: string   // How to unlock
}

// Player's equipped cosmetics
export interface EquippedCosmetics {
  body: string               // Body type ID
  skinTone: string           // Skin color hex
  eyes: string               // Eye style ID
  eyeColor: string           // Eye color hex
  hairStyle: string          // Hair style ID (includes back + front)
  hairColor: string          // Hair color hex
  outfitTop: string          // Top ID
  outfitTopColor: string     // Top color hex
  outfitBottom: string       // Bottom ID
  outfitBottomColor: string  // Bottom color hex
  hat?: string               // Optional hat ID
  hatColor?: string          // Hat color hex
  accessory?: string         // Optional accessory ID
  heldItem?: string          // Optional held item ID
  effect?: string            // Optional aura/effect ID
  pet?: string               // Optional following pet ID
}

// Default frame timing
export const FRAME_DURATION = 150 // ms per frame
export const IDLE_FRAME = 0
export const WALK_FRAMES = [0, 1, 2, 3]

// Direction to row mapping in sprite sheet
export const DIRECTION_ROW: Record<SpriteDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
}

// Standard sprite dimensions
export const SPRITE_WIDTH = 32
export const SPRITE_HEIGHT = 48

// Layer z-index ordering (higher = on top)
export const LAYER_Z_INDEX: Record<SpriteLayerType, number> = {
  shadow: 0,
  pet: 1,
  hair_back: 10,
  body: 20,
  eyes: 25,
  outfit_bottom: 30,
  outfit_top: 40,
  hair_front: 50,
  hat: 60,
  accessory: 70,
  held_item: 80,
  effect: 100,
}

/**
 * Generates layers for a complete character based on equipped cosmetics
 */
export function generateCharacterLayers(
  equipped: EquippedCosmetics,
  basePath: string = '/sprites/character'
): SpriteLayer[] {
  const layers: SpriteLayer[] = []

  // Shadow layer (always present)
  layers.push({
    type: 'shadow',
    spriteSheet: `${basePath}/shadow.png`,
    zIndex: LAYER_Z_INDEX.shadow,
    opacity: 0.3,
  })

  // Hair back (for styles with back portions)
  if (equipped.hairStyle) {
    layers.push({
      type: 'hair_back',
      spriteSheet: `${basePath}/hair/${equipped.hairStyle}_back.png`,
      tintColor: equipped.hairColor,
      tintMode: 'multiply',
      zIndex: LAYER_Z_INDEX.hair_back,
    })
  }

  // Body
  layers.push({
    type: 'body',
    spriteSheet: `${basePath}/body/${equipped.body}.png`,
    tintColor: equipped.skinTone,
    tintMode: 'multiply',
    zIndex: LAYER_Z_INDEX.body,
  })

  // Eyes
  layers.push({
    type: 'eyes',
    spriteSheet: `${basePath}/eyes/${equipped.eyes}.png`,
    tintColor: equipped.eyeColor,
    tintMode: 'multiply',
    zIndex: LAYER_Z_INDEX.eyes,
  })

  // Outfit bottom
  layers.push({
    type: 'outfit_bottom',
    spriteSheet: `${basePath}/outfit/bottom/${equipped.outfitBottom}.png`,
    tintColor: equipped.outfitBottomColor,
    tintMode: 'multiply',
    zIndex: LAYER_Z_INDEX.outfit_bottom,
  })

  // Outfit top
  layers.push({
    type: 'outfit_top',
    spriteSheet: `${basePath}/outfit/top/${equipped.outfitTop}.png`,
    tintColor: equipped.outfitTopColor,
    tintMode: 'multiply',
    zIndex: LAYER_Z_INDEX.outfit_top,
  })

  // Hair front
  if (equipped.hairStyle) {
    layers.push({
      type: 'hair_front',
      spriteSheet: `${basePath}/hair/${equipped.hairStyle}_front.png`,
      tintColor: equipped.hairColor,
      tintMode: 'multiply',
      zIndex: LAYER_Z_INDEX.hair_front,
    })
  }

  // Optional hat
  if (equipped.hat) {
    layers.push({
      type: 'hat',
      spriteSheet: `${basePath}/hat/${equipped.hat}.png`,
      tintColor: equipped.hatColor,
      tintMode: 'multiply',
      zIndex: LAYER_Z_INDEX.hat,
    })
  }

  // Optional accessory
  if (equipped.accessory) {
    layers.push({
      type: 'accessory',
      spriteSheet: `${basePath}/accessory/${equipped.accessory}.png`,
      zIndex: LAYER_Z_INDEX.accessory,
    })
  }

  // Optional held item
  if (equipped.heldItem) {
    layers.push({
      type: 'held_item',
      spriteSheet: `${basePath}/items/${equipped.heldItem}.png`,
      zIndex: LAYER_Z_INDEX.held_item,
    })
  }

  // Optional effect (event items like auras)
  if (equipped.effect) {
    layers.push({
      type: 'effect',
      spriteSheet: `${basePath}/effects/${equipped.effect}.png`,
      zIndex: LAYER_Z_INDEX.effect,
      animationSpeed: 100, // Effects often animate faster
    })
  }

  // Optional pet
  if (equipped.pet) {
    layers.push({
      type: 'pet',
      spriteSheet: `${basePath}/pets/${equipped.pet}.png`,
      zIndex: LAYER_Z_INDEX.pet,
      offsetX: -20, // Pet follows behind
      offsetY: 10,
    })
  }

  // Sort by z-index
  return layers.sort((a, b) => a.zIndex - b.zIndex)
}

/**
 * Apply color tint to an image using canvas
 */
export function applyTint(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  tintColor?: string,
  tintMode: 'multiply' | 'overlay' | 'replace' = 'multiply'
): void {
  if (!tintColor) {
    // No tint, just draw normally
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
    return
  }

  // Create temporary canvas for tinting
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = dw
  tempCanvas.height = dh
  const tempCtx = tempCanvas.getContext('2d')!

  // Draw the sprite frame
  tempCtx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)

  // Apply tint based on mode
  tempCtx.globalCompositeOperation = tintMode === 'replace' ? 'source-in' : tintMode
  tempCtx.fillStyle = tintColor
  tempCtx.fillRect(0, 0, dw, dh)

  // Reset and draw to main canvas
  tempCtx.globalCompositeOperation = 'destination-in'
  tempCtx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)

  ctx.drawImage(tempCanvas, dx, dy)
}

/**
 * Get the frame coordinates in a sprite sheet
 */
export function getFrameCoords(
  direction: SpriteDirection,
  frame: number,
  frameWidth: number = SPRITE_WIDTH,
  frameHeight: number = SPRITE_HEIGHT,
  framesPerRow: number = 4
): { sx: number; sy: number; sw: number; sh: number } {
  const row = DIRECTION_ROW[direction]
  const col = frame % framesPerRow

  return {
    sx: col * frameWidth,
    sy: row * frameHeight,
    sw: frameWidth,
    sh: frameHeight,
  }
}

// Image cache for loaded sprite sheets
const imageCache = new Map<string, HTMLImageElement>()
const loadingPromises = new Map<string, Promise<HTMLImageElement>>()

/**
 * Load a sprite sheet image with caching
 */
export async function loadSpriteSheet(path: string): Promise<HTMLImageElement> {
  // Return cached image
  if (imageCache.has(path)) {
    return imageCache.get(path)!
  }

  // Return existing loading promise
  if (loadingPromises.has(path)) {
    return loadingPromises.get(path)!
  }

  // Start loading
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(path, img)
      loadingPromises.delete(path)
      resolve(img)
    }
    img.onerror = () => {
      loadingPromises.delete(path)
      reject(new Error(`Failed to load sprite sheet: ${path}`))
    }
    img.src = path
  })

  loadingPromises.set(path, promise)
  return promise
}

/**
 * Preload multiple sprite sheets
 */
export async function preloadSpriteSheets(paths: string[]): Promise<void> {
  await Promise.all(paths.map(loadSpriteSheet))
}

/**
 * Clear the sprite cache (useful for memory management)
 */
export function clearSpriteCache(): void {
  imageCache.clear()
}

/**
 * Convert TrainerCustomization to EquippedCosmetics
 * Maps the simple customization format to the full layer system
 */
import type {
  TrainerCustomization,
  SkinTone,
  HairColor,
  OutfitColor,
} from './trainerCustomization'
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from './trainerCustomization'

export function customizationToCosmetics(
  customization: TrainerCustomization
): EquippedCosmetics {
  // Get actual hex colors from the customization keys
  const skinHex = SKIN_TONES[customization.skinTone as SkinTone]?.base || '#F5D5B8'
  const hairHex = HAIR_COLORS[customization.hairColor as HairColor]?.base || '#1a1a1a'
  const topHex = OUTFIT_COLORS[customization.topColor as OutfitColor]?.base || '#3B4CCA'
  const bottomHex = OUTFIT_COLORS[customization.bottomColor as OutfitColor]?.base || '#2C3E50'
  const hatHex = OUTFIT_COLORS[customization.hatColor as OutfitColor]?.base || '#EE1515'

  return {
    body: 'default',
    skinTone: skinHex,
    eyes: 'default',
    eyeColor: '#2C3E50', // Default dark eye color
    hairStyle: customization.hairStyle,
    hairColor: hairHex,
    outfitTop: 'tshirt',
    outfitTopColor: topHex,
    outfitBottom: 'jeans',
    outfitBottomColor: bottomHex,
    hat: customization.hatStyle !== 'none' ? customization.hatStyle : undefined,
    hatColor: customization.hatStyle !== 'none' ? hatHex : undefined,
    accessory: customization.accessory !== 'none' ? customization.accessory : undefined,
  }
}
