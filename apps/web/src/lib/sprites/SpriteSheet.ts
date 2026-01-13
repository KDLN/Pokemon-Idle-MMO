export interface SpriteAnimation {
  name: string
  frames: number[]
  frameRate: number
  loop: boolean
}

export interface SpriteConfig {
  imageSrc: string
  frameWidth: number
  frameHeight: number
  columns: number
  animations: Record<string, SpriteAnimation>
}

export class SpriteSheet {
  private image: HTMLImageElement | null = null
  private loaded = false
  private loadPromise: Promise<void> | null = null

  constructor(private config: SpriteConfig) {}

  async load(): Promise<void> {
    if (this.loaded) return
    if (this.loadPromise) return this.loadPromise

    this.loadPromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.image = img
        this.loaded = true
        resolve()
      }
      img.onerror = () => reject(new Error(`Failed to load sprite: ${this.config.imageSrc}`))
      img.src = this.config.imageSrc
    })

    return this.loadPromise
  }

  isLoaded(): boolean {
    return this.loaded
  }

  getFrame(frameIndex: number): { x: number; y: number; width: number; height: number } {
    const col = frameIndex % this.config.columns
    const row = Math.floor(frameIndex / this.config.columns)
    return {
      x: col * this.config.frameWidth,
      y: row * this.config.frameHeight,
      width: this.config.frameWidth,
      height: this.config.frameHeight,
    }
  }

  getAnimation(name: string): SpriteAnimation | undefined {
    return this.config.animations[name]
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    destX: number,
    destY: number,
    scale = 1
  ): void {
    if (!this.image || !this.loaded) return

    const frame = this.getFrame(frameIndex)
    ctx.imageSmoothingEnabled = false

    ctx.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destX,
      destY,
      frame.width * scale,
      frame.height * scale
    )
  }

  getImage(): HTMLImageElement | null {
    return this.image
  }
}

// Pre-configured sprite sheets for common use cases
export const TRAINER_SPRITE_CONFIG: SpriteConfig = {
  imageSrc: '/sprites/trainer-walk.png',
  frameWidth: 32,
  frameHeight: 48,
  columns: 4,
  animations: {
    walkDown: { name: 'walkDown', frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    walkLeft: { name: 'walkLeft', frames: [4, 5, 6, 7], frameRate: 8, loop: true },
    walkRight: { name: 'walkRight', frames: [8, 9, 10, 11], frameRate: 8, loop: true },
    walkUp: { name: 'walkUp', frames: [12, 13, 14, 15], frameRate: 8, loop: true },
    idleDown: { name: 'idleDown', frames: [0], frameRate: 1, loop: false },
    idleLeft: { name: 'idleLeft', frames: [4], frameRate: 1, loop: false },
    idleRight: { name: 'idleRight', frames: [8], frameRate: 1, loop: false },
    idleUp: { name: 'idleUp', frames: [12], frameRate: 1, loop: false },
  },
}

export function createPokemonSpriteConfig(speciesId: number): SpriteConfig {
  // Pokemon Showdown has animated sprites we can use
  // For walking, we'll use the front/back sprites with CSS animation as fallback
  return {
    imageSrc: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`,
    frameWidth: 96,
    frameHeight: 96,
    columns: 1,
    animations: {
      idle: { name: 'idle', frames: [0], frameRate: 1, loop: false },
    },
  }
}
