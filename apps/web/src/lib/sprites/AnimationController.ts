import type { SpriteAnimation } from './SpriteSheet'

export class AnimationController {
  private currentAnimation: SpriteAnimation | null = null
  private currentFrameIndex = 0
  private frameTime = 0
  private isPlaying = false

  play(animation: SpriteAnimation): void {
    if (this.currentAnimation?.name === animation.name && this.isPlaying) {
      return
    }
    this.currentAnimation = animation
    this.currentFrameIndex = 0
    this.frameTime = 0
    this.isPlaying = true
  }

  stop(): void {
    this.isPlaying = false
    this.currentFrameIndex = 0
    this.frameTime = 0
  }

  pause(): void {
    this.isPlaying = false
  }

  resume(): void {
    this.isPlaying = true
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || !this.currentAnimation) return

    const frameDuration = 1000 / this.currentAnimation.frameRate
    this.frameTime += deltaTime

    if (this.frameTime >= frameDuration) {
      this.frameTime -= frameDuration
      this.currentFrameIndex++

      if (this.currentFrameIndex >= this.currentAnimation.frames.length) {
        if (this.currentAnimation.loop) {
          this.currentFrameIndex = 0
        } else {
          this.currentFrameIndex = this.currentAnimation.frames.length - 1
          this.isPlaying = false
        }
      }
    }
  }

  getCurrentFrame(): number {
    if (!this.currentAnimation) return 0
    return this.currentAnimation.frames[this.currentFrameIndex] ?? 0
  }

  isAnimationPlaying(): boolean {
    return this.isPlaying
  }

  getCurrentAnimationName(): string | null {
    return this.currentAnimation?.name ?? null
  }
}

// Hook for React components to use animation
export function useAnimationLoop(callback: (deltaTime: number) => void): (() => void) | undefined {
  if (typeof window === 'undefined') return undefined

  let lastTime = performance.now()
  let animationId: number

  const loop = (currentTime: number) => {
    const deltaTime = currentTime - lastTime
    lastTime = currentTime
    callback(deltaTime)
    animationId = requestAnimationFrame(loop)
  }

  animationId = requestAnimationFrame(loop)

  // Cleanup function
  return () => {
    cancelAnimationFrame(animationId)
  }
}
