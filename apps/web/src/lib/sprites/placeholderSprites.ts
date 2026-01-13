/**
 * Placeholder Sprite Generator
 *
 * Generates simple placeholder sprite sheets using Canvas API.
 * Useful for development and testing when actual sprite assets aren't available.
 */

import { TRAINER_SPRITE, POKEMON_SPRITE, DIRECTION_ROW, type SpriteDirection } from './spriteAnimation'

// Color palette for placeholders
const PLACEHOLDER_COLORS = {
  skin: '#F5D5B8',
  skinShadow: '#D4A574',
  hair: '#1a1a1a',
  top: '#3B4CCA',
  topShadow: '#2A3A99',
  bottom: '#2C3E50',
  bottomShadow: '#1A252F',
  eye: '#1a1a2e',
}

/**
 * Generate a placeholder trainer sprite sheet
 * Creates a 4-row (directions) x 4-column (frames) sprite sheet
 */
export function generatePlaceholderTrainerSheet(
  options: {
    skinColor?: string
    hairColor?: string
    topColor?: string
    bottomColor?: string
  } = {}
): string {
  if (typeof document === 'undefined') return ''

  const { frameWidth, frameHeight, framesPerDirection } = TRAINER_SPRITE
  const directions: SpriteDirection[] = ['down', 'left', 'right', 'up']

  const canvas = document.createElement('canvas')
  canvas.width = frameWidth * framesPerDirection
  canvas.height = frameHeight * directions.length
  const ctx = canvas.getContext('2d')!

  const colors = {
    skin: options.skinColor || PLACEHOLDER_COLORS.skin,
    hair: options.hairColor || PLACEHOLDER_COLORS.hair,
    top: options.topColor || PLACEHOLDER_COLORS.top,
    bottom: options.bottomColor || PLACEHOLDER_COLORS.bottom,
  }

  // Draw each frame
  directions.forEach((direction, row) => {
    for (let frame = 0; frame < framesPerDirection; frame++) {
      const x = frame * frameWidth
      const y = row * frameHeight

      drawPlaceholderTrainerFrame(ctx, x, y, frameWidth, frameHeight, direction, frame, colors)
    }
  })

  return canvas.toDataURL('image/png')
}

/**
 * Draw a single trainer frame at the specified position
 */
function drawPlaceholderTrainerFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  direction: SpriteDirection,
  frame: number,
  colors: { skin: string; hair: string; top: string; bottom: string }
): void {
  // Calculate walk animation offsets
  const walkOffset = frame % 2 === 1 ? -1 : 0
  const legOffset = Math.sin((frame / 4) * Math.PI * 2) * 2

  // Center the sprite
  const cx = x + width / 2
  const cy = y + height / 2

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, y + height - 4, 10, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs (simplified rectangles)
  ctx.fillStyle = colors.bottom
  const legWidth = 5
  const legHeight = 12

  // Left leg
  ctx.save()
  ctx.translate(cx - 4, y + height - legHeight - 4)
  ctx.rotate((legOffset * Math.PI) / 180)
  ctx.fillRect(-legWidth / 2, 0, legWidth, legHeight)
  ctx.restore()

  // Right leg
  ctx.save()
  ctx.translate(cx + 4, y + height - legHeight - 4)
  ctx.rotate((-legOffset * Math.PI) / 180)
  ctx.fillRect(-legWidth / 2, 0, legWidth, legHeight)
  ctx.restore()

  // Body
  ctx.fillStyle = colors.top
  ctx.fillRect(cx - 8, y + 16, 16, 16)

  // Arms
  ctx.fillStyle = colors.top
  ctx.fillRect(cx - 12, y + 18 + walkOffset, 4, 10)
  ctx.fillRect(cx + 8, y + 18 + walkOffset, 4, 10)

  // Hands
  ctx.fillStyle = colors.skin
  ctx.beginPath()
  ctx.arc(cx - 10, y + 28 + walkOffset, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 10, y + 28 + walkOffset, 2, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = colors.skin
  ctx.beginPath()
  ctx.arc(cx, y + 10, 8, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = colors.hair
  ctx.beginPath()
  ctx.arc(cx, y + 6, 8, Math.PI, 0)
  ctx.fill()

  // Eyes (based on direction)
  ctx.fillStyle = PLACEHOLDER_COLORS.eye
  if (direction === 'down' || direction === 'left' || direction === 'right') {
    if (direction === 'left') {
      ctx.fillRect(cx - 5, y + 9, 2, 2)
    } else if (direction === 'right') {
      ctx.fillRect(cx + 3, y + 9, 2, 2)
    } else {
      ctx.fillRect(cx - 4, y + 9, 2, 2)
      ctx.fillRect(cx + 2, y + 9, 2, 2)
    }
  }
}

/**
 * Generate a placeholder Pokemon sprite sheet
 */
export function generatePlaceholderPokemonSheet(
  speciesId: number,
  variant: 'overworld' | 'battle' = 'overworld'
): string {
  if (typeof document === 'undefined') return ''

  const config = variant === 'overworld' ? POKEMON_SPRITE.overworld : POKEMON_SPRITE.battle
  const { frameWidth, frameHeight, framesPerDirection } = config
  const directions: SpriteDirection[] = ['down', 'left', 'right', 'up']

  const canvas = document.createElement('canvas')
  canvas.width = frameWidth * framesPerDirection
  canvas.height = frameHeight * directions.length
  const ctx = canvas.getContext('2d')!

  // Generate a color based on species ID
  const hue = (speciesId * 37) % 360
  const color = `hsl(${hue}, 60%, 50%)`
  const shadowColor = `hsl(${hue}, 60%, 35%)`

  // Draw each frame
  directions.forEach((direction, row) => {
    for (let frame = 0; frame < framesPerDirection; frame++) {
      const x = frame * frameWidth
      const y = row * frameHeight

      drawPlaceholderPokemonFrame(ctx, x, y, frameWidth, frameHeight, frame, color, shadowColor)
    }
  })

  return canvas.toDataURL('image/png')
}

/**
 * Draw a simple Pokemon placeholder (blob with eyes)
 */
function drawPlaceholderPokemonFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frame: number,
  color: string,
  shadowColor: string
): void {
  const cx = x + width / 2
  const cy = y + height / 2

  // Bounce animation
  const bounce = Math.sin((frame / 4) * Math.PI * 2) * 2

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.beginPath()
  ctx.ellipse(cx, y + height - 4, width / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body (blob)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(cx, cy - bounce, width / 2.5, height / 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Shadow on body
  ctx.fillStyle = shadowColor
  ctx.beginPath()
  ctx.ellipse(cx, cy - bounce + 4, width / 3, height / 5, 0, 0, Math.PI)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(cx - 5, cy - 4 - bounce, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 5, cy - 4 - bounce, 2, 0, Math.PI * 2)
  ctx.fill()

  // Eye shine
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(cx - 5, cy - 5 - bounce, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 5, cy - 5 - bounce, 1, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Cache for generated placeholder sprites
 */
const placeholderCache = new Map<string, string>()

/**
 * Get or generate a placeholder trainer sprite
 */
export function getPlaceholderTrainer(
  skinColor?: string,
  hairColor?: string,
  topColor?: string,
  bottomColor?: string
): string {
  const key = `trainer-${skinColor}-${hairColor}-${topColor}-${bottomColor}`

  if (!placeholderCache.has(key)) {
    placeholderCache.set(
      key,
      generatePlaceholderTrainerSheet({ skinColor, hairColor, topColor, bottomColor })
    )
  }

  return placeholderCache.get(key)!
}

/**
 * Get or generate a placeholder Pokemon sprite
 */
export function getPlaceholderPokemon(speciesId: number, variant: 'overworld' | 'battle' = 'overworld'): string {
  const key = `pokemon-${speciesId}-${variant}`

  if (!placeholderCache.has(key)) {
    placeholderCache.set(key, generatePlaceholderPokemonSheet(speciesId, variant))
  }

  return placeholderCache.get(key)!
}

/**
 * Clear the placeholder cache
 */
export function clearPlaceholderCache(): void {
  placeholderCache.clear()
}
