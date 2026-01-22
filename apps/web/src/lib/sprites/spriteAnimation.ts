/**
 * Sprite Animation System
 *
 * Types and utilities for working with sprite sheet animations.
 * Designed to work with react-responsive-spritesheet library.
 */

// Standard sprite sheet formats
export interface SpriteSheetConfig {
  // Image source URL
  image: string
  // Individual frame dimensions
  frameWidth: number
  frameHeight: number
  // Total number of frames in the sheet
  totalFrames: number
  // Frames per second
  fps: number
  // Whether to loop the animation
  loop?: boolean
  // Animation direction
  direction?: 'forward' | 'rewind'
  // Whether to autoplay
  autoplay?: boolean
  // For multi-row sheets: frames per row
  framesPerRow?: number
  // Scale factor for rendering
  scale?: number
}

// Direction the sprite is facing
export type SpriteDirection = 'down' | 'left' | 'right' | 'up'

// Animation states for characters
export type CharacterAnimationState = 'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'special'

// Map directions to row indices in standard 4-direction sprite sheets
export const DIRECTION_ROW: Record<SpriteDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
}

// Standard Pokemon-style trainer sprite dimensions (32x48)
export const TRAINER_SPRITE = {
  frameWidth: 32,
  frameHeight: 48,
  framesPerDirection: 4,
  directions: ['down', 'left', 'right', 'up'] as SpriteDirection[],
  walkFps: 8,
  idleFps: 2,
}

// Eris Esra Character Template format (16x32) - compact RPG style
export const TRAINER_SPRITE_16x32 = {
  frameWidth: 16,
  frameHeight: 32,
  framesPerDirection: 4,
  directions: ['down', 'left', 'right', 'up'] as SpriteDirection[],
  walkFps: 8,
  runFps: 12,
  idleFps: 4,
  // Sprite sheet paths
  sheets: {
    walk: '/sprites/trainers/base_walk.png',
    idle: '/sprites/trainers/base_idle.png',
    run: '/sprites/trainers/base_run.png',
    all: '/sprites/trainers/base_all.png',
  },
}

// Pokemon sprite dimensions (varied by generation style)
export const POKEMON_SPRITE = {
  // Gen 4/5 style (most common)
  standard: {
    frameWidth: 64,
    frameHeight: 64,
    framesPerDirection: 4,
  },
  // Smaller overworld sprites
  overworld: {
    frameWidth: 32,
    frameHeight: 32,
    framesPerDirection: 4,
  },
  // Battle sprites (front/back)
  battle: {
    frameWidth: 96,
    frameHeight: 96,
    framesPerDirection: 1,
  },
}

/**
 * Get sprite sheet configuration for a trainer walking animation
 */
export function getTrainerWalkConfig(
  spriteSheetUrl: string,
  _direction: SpriteDirection = 'down',
  scale: number = 2
): SpriteSheetConfig {
  const { frameWidth, frameHeight, framesPerDirection, walkFps } = TRAINER_SPRITE

  return {
    image: spriteSheetUrl,
    frameWidth,
    frameHeight,
    totalFrames: framesPerDirection,
    fps: walkFps,
    loop: true,
    autoplay: true,
    direction: 'forward',
    framesPerRow: framesPerDirection,
    scale,
  }
}

/**
 * Get sprite sheet configuration for a trainer idle animation
 */
export function getTrainerIdleConfig(
  spriteSheetUrl: string,
  _direction: SpriteDirection = 'down',
  scale: number = 2
): SpriteSheetConfig {
  const { frameWidth, frameHeight, idleFps } = TRAINER_SPRITE

  return {
    image: spriteSheetUrl,
    frameWidth,
    frameHeight,
    totalFrames: 2, // Typically 2 frames for idle bob
    fps: idleFps,
    loop: true,
    autoplay: true,
    direction: 'forward',
    scale,
  }
}

/**
 * Calculate the Y offset for a specific direction in a multi-row sprite sheet
 */
export function getDirectionOffset(
  direction: SpriteDirection,
  frameHeight: number
): number {
  return DIRECTION_ROW[direction] * frameHeight
}

/**
 * Character sprite sheet definition
 * Used for layered character customization with actual sprite sheets
 */
export interface CharacterSpriteSheet {
  id: string
  name: string
  // Base sprite sheet URL
  baseUrl: string
  // Whether this supports color tinting
  supportsTint: boolean
  // Default tint color if applicable
  defaultTint?: string
  // Layer type for stacking order
  layer: 'body' | 'hair' | 'outfit_top' | 'outfit_bottom' | 'hat' | 'accessory' | 'effect'
  // Z-index for rendering order
  zIndex: number
}

/**
 * Layer z-index ordering (higher = on top)
 */
export const LAYER_Z_INDEX = {
  shadow: 0,
  hair_back: 10,
  body: 20,
  outfit_bottom: 30,
  outfit_top: 40,
  hair_front: 50,
  hat: 60,
  accessory: 70,
  held_item: 80,
  effect: 100,
} as const

/**
 * Trainer sprite sheet paths
 * These should point to actual PNG sprite sheets when available
 */
export const TRAINER_SPRITE_PATHS = {
  // Placeholder paths - replace with actual sprite sheets
  base: {
    male: '/sprites/trainers/male_base.png',
    female: '/sprites/trainers/female_base.png',
  },
  hair: {
    spiky: '/sprites/trainers/hair/spiky.png',
    short: '/sprites/trainers/hair/short.png',
    medium: '/sprites/trainers/hair/medium.png',
    long: '/sprites/trainers/hair/long.png',
    ponytail: '/sprites/trainers/hair/ponytail.png',
    afro: '/sprites/trainers/hair/afro.png',
    buzz: '/sprites/trainers/hair/buzz.png',
  },
  outfit: {
    top: {
      default: '/sprites/trainers/outfit/top_default.png',
      jacket: '/sprites/trainers/outfit/top_jacket.png',
    },
    bottom: {
      default: '/sprites/trainers/outfit/bottom_default.png',
      shorts: '/sprites/trainers/outfit/bottom_shorts.png',
    },
  },
  hat: {
    cap: '/sprites/trainers/hat/cap.png',
    beanie: '/sprites/trainers/hat/beanie.png',
    headband: '/sprites/trainers/hat/headband.png',
    bandana: '/sprites/trainers/hat/bandana.png',
  },
  accessory: {
    glasses: '/sprites/trainers/accessory/glasses.png',
    sunglasses: '/sprites/trainers/accessory/sunglasses.png',
    scarf: '/sprites/trainers/accessory/scarf.png',
  },
} as const

/**
 * Pokemon sprite sheet paths
 */
export const POKEMON_SPRITE_PATHS = {
  // Format: species ID -> sprite sheet URL
  getOverworld: (speciesId: number) =>
    `/sprites/pokemon/overworld/${speciesId.toString().padStart(3, '0')}.png`,
  getBattle: (speciesId: number, variant: 'front' | 'back' = 'front') =>
    `/sprites/pokemon/battle/${variant}/${speciesId.toString().padStart(3, '0')}.png`,
  getIcon: (speciesId: number) =>
    `/sprites/pokemon/icons/${speciesId.toString().padStart(3, '0')}.png`,
} as const

/**
 * Apply color tint to a canvas
 * Used for recoloring sprite sheet layers (hair, clothes, etc.)
 */
export function applyTintToCanvas(
  ctx: CanvasRenderingContext2D,
  tintColor: string,
  mode: 'multiply' | 'overlay' | 'source-in' = 'multiply'
): void {
  ctx.globalCompositeOperation = mode
  ctx.fillStyle = tintColor
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * Load an image and return a promise
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Preload multiple sprite sheets
 */
export async function preloadSpriteSheets(urls: string[]): Promise<void> {
  await Promise.all(urls.map(loadImage))
}

/**
 * Extract a single frame from a sprite sheet
 */
export function extractFrame(
  image: HTMLImageElement,
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  framesPerRow: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = frameWidth
  canvas.height = frameHeight
  const ctx = canvas.getContext('2d')!

  const col = frameIndex % framesPerRow
  const row = Math.floor(frameIndex / framesPerRow)

  ctx.drawImage(
    image,
    col * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,
    0,
    0,
    frameWidth,
    frameHeight
  )

  return canvas
}
